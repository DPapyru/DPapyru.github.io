using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;
using System.Xml.Linq;
using System.Globalization;

namespace TmlIdeIndexer;

static class Program
{
    static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
    const int WarningLimit = 60;
    static int warningCount;
    static bool warningLimitNotified;

    static int Main(string[] args)
    {
        try
        {
            var options = ParseArgs(args);
            if (options == null)
            {
                PrintUsage();
                return 2;
            }

            if (!string.IsNullOrWhiteSpace(options.AppendPath))
            {
                return RunAppendMode(options);
            }

            return RunIndexMode(options);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }

    static int RunIndexMode(CliOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.DllPath) ||
            string.IsNullOrWhiteSpace(options.OutPath))
        {
            Console.Error.WriteLine("Index mode requires --dll --out");
            return 2;
        }

        var sourcePairs = new List<(string Dll, string? Xml)>();
        var dllPath = Path.GetFullPath(options.DllPath);

        if (!File.Exists(dllPath))
        {
            Console.Error.WriteLine($"DLL not found: {dllPath}");
            return 2;
        }

        var xmlPath = ResolveXmlPath(options.XmlPath, dllPath, out var xmlOk);
        if (!xmlOk) return 2;
        sourcePairs.Add((Dll: dllPath, Xml: xmlPath));

        if (!string.IsNullOrWhiteSpace(options.TerrariaXmlPath) &&
            string.IsNullOrWhiteSpace(options.TerrariaDllPath))
        {
            Console.Error.WriteLine("--terraria-xml requires --terraria-dll");
            return 2;
        }

        if (!string.IsNullOrWhiteSpace(options.TerrariaDllPath))
        {
            var terrariaDllPath = Path.GetFullPath(options.TerrariaDllPath);
            if (!File.Exists(terrariaDllPath))
            {
                Console.Error.WriteLine($"DLL not found: {terrariaDllPath}");
                return 2;
            }

            var terrariaXmlPath = ResolveXmlPath(options.TerrariaXmlPath, terrariaDllPath, out var terrariaXmlOk);
            if (!terrariaXmlOk) return 2;
            sourcePairs.Add((Dll: terrariaDllPath, Xml: terrariaXmlPath));
        }

        var index = BuildApiIndex(sourcePairs);
        var outPath = Path.GetFullPath(options.OutPath);
        Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);
        File.WriteAllText(outPath, JsonSerializer.Serialize(index, JsonOptions));
        Console.WriteLine($"Wrote api-index.v2: {outPath}");

        return 0;
    }

    static int RunAppendMode(CliOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.DllPath) ||
            string.IsNullOrWhiteSpace(options.AppendPath))
        {
            Console.Error.WriteLine("Append mode requires --dll --append");
            return 2;
        }

        var dllPath = Path.GetFullPath(options.DllPath);
        var appendPath = Path.GetFullPath(options.AppendPath);

        if (!File.Exists(dllPath))
        {
            Console.Error.WriteLine($"DLL not found: {dllPath}");
            return 2;
        }

        var xmlPath = ResolveXmlPath(options.XmlPath, dllPath, out var xmlOk);
        if (!xmlOk) return 2;

        var session = File.Exists(appendPath)
            ? JsonSerializer.Deserialize<SessionPackV1>(File.ReadAllText(appendPath), JsonOptions) ?? new SessionPackV1()
            : new SessionPackV1();

        var entry = BuildAssemblySessionEntry(dllPath, xmlPath);
        var existing = session.Assemblies.FindIndex(x => string.Equals(x.AssemblyName, entry.AssemblyName, StringComparison.OrdinalIgnoreCase));
        if (existing >= 0)
        {
            session.Assemblies[existing] = entry;
        }
        else
        {
            session.Assemblies.Add(entry);
        }

        session.GeneratedAt = DateTimeOffset.UtcNow.ToString("O");

        Directory.CreateDirectory(Path.GetDirectoryName(appendPath)!);
        File.WriteAllText(appendPath, JsonSerializer.Serialize(session, JsonOptions));
        Console.WriteLine($"Wrote session-pack.v1: {appendPath}");

        return 0;
    }

    static string? ResolveXmlPath(string? inputXmlPath, string dllPath, out bool ok)
    {
        ok = true;
        if (!string.IsNullOrWhiteSpace(inputXmlPath))
        {
            var explicitXml = Path.GetFullPath(inputXmlPath);
            if (!File.Exists(explicitXml))
            {
                Console.Error.WriteLine($"XML not found: {explicitXml}");
                ok = false;
                return null;
            }

            return explicitXml;
        }

        var autoXml = Path.ChangeExtension(dllPath, ".xml");
        if (File.Exists(autoXml))
        {
            Console.WriteLine($"Auto-resolved XML: {autoXml}");
            return autoXml;
        }

        Console.WriteLine($"XML not found for {dllPath}, continuing without XML docs.");
        return null;
    }

    static void LogWarning(string message)
    {
        warningCount += 1;
        if (warningCount <= WarningLimit)
        {
            Console.WriteLine("Warning: " + message);
            return;
        }

        if (!warningLimitNotified)
        {
            warningLimitNotified = true;
            Console.WriteLine($"Warning: more than {WarningLimit} warnings, remaining warnings are suppressed.");
        }
    }

    static IEnumerable<string> GetExtraProbeDirectories(string dllPath, string? xmlPath)
    {
        var dirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(xmlPath))
        {
            var xmlDir = Path.GetDirectoryName(xmlPath);
            if (!string.IsNullOrWhiteSpace(xmlDir) && Directory.Exists(xmlDir))
            {
                dirs.Add(xmlDir);
            }
        }

        // If xml resides near a full game install, pick sibling folders with dependencies.
        if (!string.IsNullOrWhiteSpace(xmlPath))
        {
            var xmlDir = Path.GetDirectoryName(xmlPath);
            if (!string.IsNullOrWhiteSpace(xmlDir))
            {
                var candidateLib = Path.Combine(xmlDir, "Libraries");
                if (Directory.Exists(candidateLib))
                {
                    dirs.Add(candidateLib);
                }
            }
        }

        var dllDir = Path.GetDirectoryName(dllPath);
        if (!string.IsNullOrWhiteSpace(dllDir))
        {
            dirs.Remove(dllDir);
        }

        return dirs;
    }

    static ApiIndexV2 BuildApiIndex(IEnumerable<(string Dll, string? Xml)> sources)
    {
        var index = new ApiIndexV2();

        foreach (var source in sources)
        {
            var docs = XmlDocumentationIndex.Load(source.Xml);

            var loadContext = new DllDirectoryLoadContext(
                Path.GetDirectoryName(source.Dll)!,
                GetExtraProbeDirectories(source.Dll, source.Xml)
            );
            var asm = loadContext.LoadFromAssemblyPath(source.Dll);

            index.Sources.Add(new SourceInfo
            {
                AssemblyName = asm.GetName().Name ?? Path.GetFileNameWithoutExtension(source.Dll),
                DllPath = source.Dll,
                XmlPath = source.Xml ?? ""
            });

            foreach (var type in GetLoadableTypes(asm).Where(IsVisibleType).OrderBy(t => t.FullName ?? t.Name, StringComparer.Ordinal))
            {
                try
                {
                    var fullName = NormalizeTypeFullName(type);
                    if (!index.Types.TryGetValue(fullName, out var typeEntry))
                    {
                        typeEntry = new TypeEntry
                        {
                            FullName = fullName,
                            Namespace = type.Namespace ?? "",
                            Name = type.Name.Split('`')[0],
                            Summary = docs.GetSummary($"T:{fullName}"),
                            BaseType = type.BaseType != null ? NormalizeTypeFullName(type.BaseType) : "",
                            Interfaces = type.GetInterfaces()
                                .Select(NormalizeTypeFullName)
                                .Distinct(StringComparer.Ordinal)
                                .OrderBy(x => x, StringComparer.Ordinal)
                                .ToList()
                        };
                        index.Types[fullName] = typeEntry;
                    }

                    IndexMembers(type, typeEntry, docs);
                }
                catch (Exception ex)
                {
                    LogWarning($"skip type {DescribeTypeSafe(type)}: {ex.Message}");
                }
            }

            loadContext.Unload();
        }

        RebuildLookup(index);
        return index;
    }

    static AssemblySessionEntry BuildAssemblySessionEntry(string dllPath, string? xmlPath)
    {
        var docs = XmlDocumentationIndex.Load(xmlPath);

        var loadContext = new DllDirectoryLoadContext(
            Path.GetDirectoryName(dllPath)!,
            GetExtraProbeDirectories(dllPath, xmlPath)
        );
        var asm = loadContext.LoadFromAssemblyPath(dllPath);

        var entry = new AssemblySessionEntry
        {
            AssemblyName = asm.GetName().Name ?? Path.GetFileNameWithoutExtension(dllPath),
            DllPath = dllPath,
            XmlPath = xmlPath ?? ""
        };

        foreach (var type in GetLoadableTypes(asm).Where(IsVisibleType).OrderBy(t => t.FullName ?? t.Name, StringComparer.Ordinal))
        {
            try
            {
                var fullName = NormalizeTypeFullName(type);
                var typeEntry = new TypeEntry
                {
                    FullName = fullName,
                    Namespace = type.Namespace ?? "",
                    Name = type.Name.Split('`')[0],
                    Summary = docs.GetSummary($"T:{fullName}"),
                    BaseType = type.BaseType != null ? NormalizeTypeFullName(type.BaseType) : "",
                    Interfaces = type.GetInterfaces()
                        .Select(NormalizeTypeFullName)
                        .Distinct(StringComparer.Ordinal)
                        .OrderBy(x => x, StringComparer.Ordinal)
                        .ToList()
                };
                IndexMembers(type, typeEntry, docs);
                entry.Types[fullName] = typeEntry;
            }
            catch (Exception ex)
            {
                LogWarning($"skip type {DescribeTypeSafe(type)}: {ex.Message}");
            }
        }

        loadContext.Unload();

        return entry;
    }

    static IEnumerable<Type> GetLoadableTypes(Assembly asm)
    {
        try
        {
            return asm.GetTypes();
        }
        catch (ReflectionTypeLoadException ex)
        {
            var loadedTypes = ex.Types.Where(t => t != null).Cast<Type>().ToArray();
            LogWarning($"partial type load for {asm.GetName().Name}, loaded {loadedTypes.Length} types.");

            foreach (var loaderError in ex.LoaderExceptions.Take(8))
            {
                if (loaderError == null) continue;
                LogWarning(loaderError.Message);
            }

            return loadedTypes;
        }
    }

    static string DescribeTypeSafe(Type type)
    {
        try
        {
            return type.FullName ?? type.Name;
        }
        catch
        {
            return type.Name;
        }
    }

    static void IndexMembers(Type type, TypeEntry typeEntry, XmlDocumentationIndex docs)
    {
        const BindingFlags flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;
        var typeLabel = DescribeTypeSafe(type);
        MethodInfo[] methods;
        try
        {
            methods = type.GetMethods(flags);
        }
        catch (Exception ex)
        {
            LogWarning($"skip methods for {typeLabel}: {ex.Message}");
            methods = Array.Empty<MethodInfo>();
        }

        foreach (var method in methods)
        {
            if (method.IsSpecialName) continue;

            try
            {
                var parameters = method.GetParameters();
                var methodId = BuildMethodXmlId(type, method);
                var doc = docs.GetMethodDoc(methodId);

                typeEntry.Members.Methods.Add(new MethodEntry
                {
                    Kind = "method",
                    Name = method.Name,
                    Signature = BuildMethodSignature(method),
                    ReturnType = FormatType(method.ReturnType),
                    IsStatic = method.IsStatic,
                    Params = parameters.Select(p => new ParameterEntry
                    {
                        Name = p.Name ?? "arg",
                        Type = FormatType(p.ParameterType),
                        Optional = p.IsOptional,
                        DefaultValue = p.IsOptional && p.HasDefaultValue ? FormatDefaultValue(p.DefaultValue) : null
                    }).ToList(),
                    MinArgs = parameters.Count(p => !(p.IsOptional && p.HasDefaultValue)),
                    MaxArgs = parameters.Length,
                    Summary = doc.Summary,
                    ReturnsDoc = doc.Returns,
                    ParamDocs = doc.ParamDocs
                });
            }
            catch (Exception ex)
            {
                LogWarning($"skip method {typeLabel}.{method.Name}: {ex.Message}");
            }
        }

        PropertyInfo[] properties;
        try
        {
            properties = type.GetProperties(flags);
        }
        catch (Exception ex)
        {
            LogWarning($"skip properties for {typeLabel}: {ex.Message}");
            properties = Array.Empty<PropertyInfo>();
        }

        foreach (var property in properties)
        {
            try
            {
                var propId = $"P:{NormalizeTypeFullName(type)}.{property.Name}";
                var doc = docs.GetMemberDoc(propId);

                typeEntry.Members.Properties.Add(new PropertyEntry
                {
                    Kind = "property",
                    Name = property.Name,
                    Signature = BuildPropertySignature(property),
                    Type = FormatType(property.PropertyType),
                    IsStatic = (property.GetMethod ?? property.SetMethod)?.IsStatic ?? false,
                    Summary = doc.Summary
                });
            }
            catch (Exception ex)
            {
                LogWarning($"skip property {typeLabel}.{property.Name}: {ex.Message}");
            }
        }

        FieldInfo[] fields;
        try
        {
            fields = type.GetFields(flags);
        }
        catch (Exception ex)
        {
            LogWarning($"skip fields for {typeLabel}: {ex.Message}");
            fields = Array.Empty<FieldInfo>();
        }

        foreach (var field in fields)
        {
            if (field.IsSpecialName) continue;

            try
            {
                var fieldId = $"F:{NormalizeTypeFullName(type)}.{field.Name}";
                var doc = docs.GetMemberDoc(fieldId);

                typeEntry.Members.Fields.Add(new FieldEntry
                {
                    Kind = "field",
                    Name = field.Name,
                    Signature = $"{FormatType(field.FieldType)} {field.Name}",
                    Type = FormatType(field.FieldType),
                    IsStatic = field.IsStatic,
                    Summary = doc.Summary
                });
            }
            catch (Exception ex)
            {
                LogWarning($"skip field {typeLabel}.{field.Name}: {ex.Message}");
            }
        }

        typeEntry.Members.Methods = typeEntry.Members.Methods
            .OrderBy(m => m.Name, StringComparer.Ordinal)
            .ThenBy(m => m.MinArgs)
            .ThenBy(m => m.Signature, StringComparer.Ordinal)
            .ToList();

        typeEntry.Members.Properties = typeEntry.Members.Properties
            .OrderBy(p => p.Name, StringComparer.Ordinal)
            .ToList();

        typeEntry.Members.Fields = typeEntry.Members.Fields
            .OrderBy(f => f.Name, StringComparer.Ordinal)
            .ToList();
    }

    static bool IsVisibleType(Type type)
    {
        if (type.IsPublic || type.IsNestedPublic) return true;
        return false;
    }

    static string BuildMethodSignature(MethodInfo method)
    {
        var generic = method.IsGenericMethodDefinition
            ? "<" + string.Join(", ", method.GetGenericArguments().Select(a => a.Name)) + ">"
            : "";

        var paramsText = string.Join(", ", method.GetParameters().Select(p =>
        {
            var text = $"{FormatType(p.ParameterType)} {p.Name}";
            if (p.IsOptional && p.HasDefaultValue)
            {
                text += " = " + FormatDefaultValue(p.DefaultValue);
            }
            return text;
        }));

        return $"{FormatType(method.ReturnType)} {method.Name}{generic}({paramsText})";
    }

    static string BuildPropertySignature(PropertyInfo property)
    {
        var accessor = "{";
        if (property.GetMethod != null) accessor += " get;";
        if (property.SetMethod != null) accessor += " set;";
        accessor += " }";
        return $"{FormatType(property.PropertyType)} {property.Name} {accessor}";
    }

    static string BuildMethodXmlId(Type declaringType, MethodInfo method)
    {
        var prefix = $"M:{NormalizeTypeFullName(declaringType)}.{method.Name}";
        var parameters = method.GetParameters();
        if (parameters.Length == 0)
        {
            return prefix;
        }

        var parameterList = string.Join(",", parameters.Select(p => FormatTypeForXmlDoc(p.ParameterType)));
        return $"{prefix}({parameterList})";
    }

    static string FormatTypeForXmlDoc(Type type)
    {
        if (type.IsByRef)
        {
            return FormatTypeForXmlDoc(type.GetElementType()!) + "@";
        }

        if (type.IsArray)
        {
            return FormatTypeForXmlDoc(type.GetElementType()!) + "[]";
        }

        if (type.IsGenericParameter)
        {
            if (type.DeclaringMethod != null) return "``" + type.GenericParameterPosition;
            return "`" + type.GenericParameterPosition;
        }

        if (type.IsGenericType)
        {
            var genericDef = type.GetGenericTypeDefinition();
            var defName = (genericDef.FullName ?? genericDef.Name).Replace('+', '.');
            var tick = defName.IndexOf('`');
            if (tick >= 0) defName = defName[..tick];

            var args = type.GetGenericArguments().Select(FormatTypeForXmlDoc);
            return $"{defName}{{{string.Join(",", args)}}}";
        }

        return (type.FullName ?? type.Name).Replace('+', '.');
    }

    static string NormalizeTypeFullName(Type type)
    {
        var full = (type.FullName ?? type.Name).Replace('+', '.');
        var tick = full.IndexOf('`');
        if (tick >= 0) full = full[..tick];
        return full;
    }

    static string FormatType(Type type)
    {
        if (type.IsByRef) type = type.GetElementType()!;

        if (type.IsArray)
        {
            return FormatType(type.GetElementType()!) + "[]";
        }

        if (type == typeof(void)) return "void";
        if (type == typeof(bool)) return "bool";
        if (type == typeof(byte)) return "byte";
        if (type == typeof(sbyte)) return "sbyte";
        if (type == typeof(short)) return "short";
        if (type == typeof(ushort)) return "ushort";
        if (type == typeof(int)) return "int";
        if (type == typeof(uint)) return "uint";
        if (type == typeof(long)) return "long";
        if (type == typeof(ulong)) return "ulong";
        if (type == typeof(float)) return "float";
        if (type == typeof(double)) return "double";
        if (type == typeof(decimal)) return "decimal";
        if (type == typeof(string)) return "string";
        if (type == typeof(object)) return "object";

        if (type.IsGenericType)
        {
            var name = type.Name;
            var tick = name.IndexOf('`');
            if (tick >= 0) name = name[..tick];
            var args = type.GetGenericArguments().Select(FormatType);
            return $"{name}<{string.Join(", ", args)}>";
        }

        return type.Name;
    }

    static object? FormatDefaultValue(object? value)
    {
        return value switch
        {
            null => null,
            string s => s,
            char c => c.ToString(),
            float f => float.IsFinite(f) ? f : f.ToString(CultureInfo.InvariantCulture),
            double d => double.IsFinite(d) ? d : d.ToString(CultureInfo.InvariantCulture),
            decimal m => m,
            bool b => b,
            _ => value
        };
    }

    static void RebuildLookup(ApiIndexV2 index)
    {
        var map = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        var namespaceSet = new HashSet<string>(StringComparer.Ordinal);

        foreach (var pair in index.Types)
        {
            var fullName = pair.Key;
            var type = pair.Value;

            if (!map.TryGetValue(type.Name, out var list))
            {
                list = new List<string>();
                map[type.Name] = list;
            }
            list.Add(fullName);

            if (!string.IsNullOrWhiteSpace(type.Namespace))
            {
                namespaceSet.Add(type.Namespace);
            }
        }

        foreach (var list in map.Values)
        {
            list.Sort(StringComparer.Ordinal);
        }

        index.Lookup = new LookupInfo
        {
            ByShortName = map,
            Namespaces = namespaceSet.OrderBy(x => x, StringComparer.Ordinal).ToList()
        };
    }

    static CliOptions? ParseArgs(string[] args)
    {
        var options = new CliOptions();

        for (var i = 0; i < args.Length; i++)
        {
            var arg = args[i];
            if (arg == "--dll" && i + 1 < args.Length)
            {
                options.DllPath = args[++i];
                continue;
            }
            if (arg == "--xml" && i + 1 < args.Length)
            {
                options.XmlPath = args[++i];
                continue;
            }
            if (arg == "--terraria-dll" && i + 1 < args.Length)
            {
                options.TerrariaDllPath = args[++i];
                continue;
            }
            if (arg == "--terraria-xml" && i + 1 < args.Length)
            {
                options.TerrariaXmlPath = args[++i];
                continue;
            }
            if (arg == "--out" && i + 1 < args.Length)
            {
                options.OutPath = args[++i];
                continue;
            }
            if (arg == "--append" && i + 1 < args.Length)
            {
                options.AppendPath = args[++i];
                continue;
            }
        }

        if (string.IsNullOrWhiteSpace(options.DllPath) && string.IsNullOrWhiteSpace(options.OutPath) && string.IsNullOrWhiteSpace(options.AppendPath))
        {
            return null;
        }

        return options;
    }

    static void PrintUsage()
    {
        Console.WriteLine("Usage:");
        Console.WriteLine("  dotnet run --project tml-ide-app/tooling/indexer -- --dll <tModLoader.dll> [--xml <tModLoader.xml>] [--terraria-dll <Terraria.dll> [--terraria-xml <Terraria.xml>]] --out <api-index.v2.json>");
        Console.WriteLine("  dotnet run --project tml-ide-app/tooling/indexer -- --dll <extra-mod.dll> [--xml <extra-mod.xml>] --append <session-pack.v1.json>");
    }

    sealed class CliOptions
    {
        public string? DllPath { get; set; }
        public string? XmlPath { get; set; }
        public string? TerrariaDllPath { get; set; }
        public string? TerrariaXmlPath { get; set; }
        public string? OutPath { get; set; }
        public string? AppendPath { get; set; }
    }

    sealed class DllDirectoryLoadContext : AssemblyLoadContext
    {
        readonly List<string> probeDirs;
        Dictionary<string, string>? dllByFileName;

        public DllDirectoryLoadContext(string baseDir, IEnumerable<string>? extraProbeDirs = null) : base(isCollectible: true)
        {
            probeDirs = new List<string> { baseDir };
            if (extraProbeDirs != null)
            {
                foreach (var dir in extraProbeDirs)
                {
                    if (string.IsNullOrWhiteSpace(dir)) continue;
                    if (!probeDirs.Contains(dir, StringComparer.OrdinalIgnoreCase))
                    {
                        probeDirs.Add(dir);
                    }
                }
            }
        }

        protected override Assembly? Load(AssemblyName assemblyName)
        {
            if (assemblyName.Name == null) return null;
            EnsureIndex();
            var fileName = assemblyName.Name + ".dll";
            if (dllByFileName != null && dllByFileName.TryGetValue(fileName, out var resolvedPath))
            {
                return LoadFromAssemblyPath(resolvedPath);
            }
            return null;
        }

        void EnsureIndex()
        {
            if (dllByFileName != null) return;

            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            void AddDirectory(string directory, SearchOption option)
            {
                if (!Directory.Exists(directory)) return;

                foreach (var file in Directory.EnumerateFiles(directory, "*.dll", option))
                {
                    var name = Path.GetFileName(file);
                    if (string.IsNullOrWhiteSpace(name)) continue;
                    if (!map.ContainsKey(name)) map[name] = file;
                }
            }

            foreach (var dir in probeDirs)
            {
                AddDirectory(dir, SearchOption.TopDirectoryOnly);
                AddDirectory(Path.Combine(dir, "Libraries"), SearchOption.AllDirectories);
            }

            dllByFileName = map;
        }
    }

    sealed class XmlDocumentationIndex
    {
        readonly Dictionary<string, XmlMemberDoc> members = new(StringComparer.Ordinal);

        public static XmlDocumentationIndex Load(string? xmlPath)
        {
            var index = new XmlDocumentationIndex();
            if (string.IsNullOrWhiteSpace(xmlPath) || !File.Exists(xmlPath))
            {
                return index;
            }
            var document = XDocument.Load(xmlPath);

            var memberNodes = document.Root?
                .Element("members")?
                .Elements("member") ?? Enumerable.Empty<XElement>();

            foreach (var node in memberNodes)
            {
                var key = node.Attribute("name")?.Value;
                if (string.IsNullOrWhiteSpace(key)) continue;

                var doc = new XmlMemberDoc
                {
                    Summary = NormalizeDoc(node.Element("summary")?.Value),
                    Returns = NormalizeDoc(node.Element("returns")?.Value)
                };

                foreach (var paramNode in node.Elements("param"))
                {
                    var paramName = paramNode.Attribute("name")?.Value;
                    if (string.IsNullOrWhiteSpace(paramName)) continue;
                    var value = NormalizeDoc(paramNode.Value);
                    if (string.IsNullOrWhiteSpace(value)) continue;
                    doc.ParamDocs[paramName] = value;
                }

                index.members[key] = doc;
            }

            return index;
        }

        public string GetSummary(string memberId)
        {
            return members.TryGetValue(memberId, out var doc) ? doc.Summary : "";
        }

        public XmlMemberDoc GetMethodDoc(string memberId)
        {
            if (members.TryGetValue(memberId, out var exact)) return exact;

            var open = memberId.IndexOf('(');
            if (open > 0)
            {
                var fallback = memberId[..open];
                if (members.TryGetValue(fallback, out var byName)) return byName;
            }

            return new XmlMemberDoc();
        }

        public XmlMemberDoc GetMemberDoc(string memberId)
        {
            return members.TryGetValue(memberId, out var doc) ? doc : new XmlMemberDoc();
        }

        static string NormalizeDoc(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "";
            return string.Join(" ", text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        }
    }

    sealed class XmlMemberDoc
    {
        public string Summary { get; set; } = "";
        public string Returns { get; set; } = "";
        public Dictionary<string, string> ParamDocs { get; set; } = new(StringComparer.Ordinal);
    }
}

sealed class ApiIndexV2
{
    public int SchemaVersion { get; init; } = 2;
    public string GeneratedAt { get; set; } = DateTimeOffset.UtcNow.ToString("O");
    public List<SourceInfo> Sources { get; set; } = new();
    public Dictionary<string, TypeEntry> Types { get; set; } = new(StringComparer.Ordinal);
    public LookupInfo Lookup { get; set; } = new();
}

sealed class SessionPackV1
{
    public int SchemaVersion { get; init; } = 1;
    public string GeneratedAt { get; set; } = DateTimeOffset.UtcNow.ToString("O");
    public List<AssemblySessionEntry> Assemblies { get; set; } = new();
}

sealed class AssemblySessionEntry
{
    public string AssemblyName { get; set; } = "";
    public string DllPath { get; set; } = "";
    public string XmlPath { get; set; } = "";
    public Dictionary<string, TypeEntry> Types { get; set; } = new(StringComparer.Ordinal);
}

sealed class SourceInfo
{
    public string AssemblyName { get; set; } = "";
    public string DllPath { get; set; } = "";
    public string XmlPath { get; set; } = "";
}

sealed class LookupInfo
{
    public Dictionary<string, List<string>> ByShortName { get; set; } = new(StringComparer.Ordinal);
    public List<string> Namespaces { get; set; } = new();
}

sealed class TypeEntry
{
    public string FullName { get; set; } = "";
    public string Namespace { get; set; } = "";
    public string Name { get; set; } = "";
    public string Summary { get; set; } = "";
    public string BaseType { get; set; } = "";
    public List<string> Interfaces { get; set; } = new();
    public MemberCollection Members { get; set; } = new();
}

sealed class MemberCollection
{
    public List<MethodEntry> Methods { get; set; } = new();
    public List<PropertyEntry> Properties { get; set; } = new();
    public List<FieldEntry> Fields { get; set; } = new();
}

sealed class MethodEntry
{
    public string Kind { get; set; } = "method";
    public string Name { get; set; } = "";
    public string Signature { get; set; } = "";
    public string ReturnType { get; set; } = "";
    public bool IsStatic { get; set; }
    public List<ParameterEntry> Params { get; set; } = new();
    public int MinArgs { get; set; }
    public int MaxArgs { get; set; }
    public string Summary { get; set; } = "";
    public string ReturnsDoc { get; set; } = "";
    public Dictionary<string, string> ParamDocs { get; set; } = new(StringComparer.Ordinal);
}

sealed class ParameterEntry
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public bool Optional { get; set; }
    public object? DefaultValue { get; set; }
}

sealed class PropertyEntry
{
    public string Kind { get; set; } = "property";
    public string Name { get; set; } = "";
    public string Signature { get; set; } = "";
    public string Type { get; set; } = "";
    public bool IsStatic { get; set; }
    public string Summary { get; set; } = "";
}

sealed class FieldEntry
{
    public string Kind { get; set; } = "field";
    public string Name { get; set; } = "";
    public string Signature { get; set; } = "";
    public string Type { get; set; } = "";
    public bool IsStatic { get; set; }
    public string Summary { get; set; } = "";
}
