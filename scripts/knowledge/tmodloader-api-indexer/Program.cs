using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;

static class Program
{
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

            var dllPath = Path.GetFullPath(options.DllPath);
            if (!File.Exists(dllPath))
            {
                Console.Error.WriteLine($"DLL not found: {dllPath}");
                return 2;
            }

            var outPath = Path.GetFullPath(options.OutPath);
            Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);

            var index = BuildIndex(dllPath);

            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            var json = JsonSerializer.Serialize(index, jsonOptions);
            File.WriteAllText(outPath, json);

            Console.WriteLine($"Wrote: {outPath}");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }

    sealed record CliOptions(string DllPath, string OutPath);

    static CliOptions? ParseArgs(string[] args)
    {
        string? dll = null;
        string? outPath = null;

        for (var i = 0; i < args.Length; i++)
        {
            var a = args[i];
            if (a == "--dll" && i + 1 < args.Length)
            {
                dll = args[++i];
                continue;
            }
            if (a == "--out" && i + 1 < args.Length)
            {
                outPath = args[++i];
                continue;
            }
        }

        if (string.IsNullOrWhiteSpace(dll) || string.IsNullOrWhiteSpace(outPath)) return null;
        return new CliOptions(dll!, outPath!);
    }

    static void PrintUsage()
    {
        Console.WriteLine("Usage:");
        Console.WriteLine("  dotnet run --project scripts/knowledge/tmodloader-api-indexer -- --dll <path-to-tModLoader.dll> --out <output-json>");
    }

    sealed class ApiIndex
    {
        public int SchemaVersion { get; init; } = 1;
        public string GeneratedAt { get; init; } = DateTimeOffset.UtcNow.ToString("O");
        public SourceInfo Source { get; init; } = new();
        public Dictionary<string, TypeIndex> Types { get; init; } = new(StringComparer.Ordinal);
    }

    sealed class SourceInfo
    {
        public string DllPath { get; init; } = "";
        public string? AssemblyName { get; set; }
    }

    sealed class TypeIndex
    {
        public Dictionary<string, List<MemberEntry>> Methods { get; init; } = new(StringComparer.Ordinal);
        public Dictionary<string, List<MemberEntry>> Fields { get; init; } = new(StringComparer.Ordinal);
        public Dictionary<string, List<MemberEntry>> Properties { get; init; } = new(StringComparer.Ordinal);
    }

    sealed class MemberEntry
    {
        public string Signature { get; init; } = "";
        public int ParamCount { get; init; }
        public int MinArgs { get; init; }
        public bool IsStatic { get; init; }
    }

    static ApiIndex BuildIndex(string dllPath)
    {
        var index = new ApiIndex
        {
            Source = new SourceInfo
            {
                DllPath = dllPath
            }
        };

        var dllDir = Path.GetDirectoryName(dllPath)!;
        var loadContext = new DllDirectoryLoadContext(dllDir);
        var asm = loadContext.LoadFromAssemblyPath(dllPath);
        index.Source.AssemblyName = asm.GetName().Name;

        var coreTypes = new[]
        {
            "Terraria.Main",
            "Terraria.Player",
            "Terraria.NPC"
        };

        var tmlHookTypes = new[]
        {
            "Terraria.ModLoader.Mod",
            "Terraria.ModLoader.ModItem",
            "Terraria.ModLoader.ModNPC",
            "Terraria.ModLoader.ModPlayer",
            "Terraria.ModLoader.ModProjectile",
            "Terraria.ModLoader.GlobalItem",
            "Terraria.ModLoader.GlobalNPC",
            "Terraria.ModLoader.ModSystem",
            "Terraria.ModLoader.ModBuff"
        };

        foreach (var typeName in coreTypes)
        {
            var type = asm.GetType(typeName, throwOnError: false, ignoreCase: false);
            if (type == null) continue;
            index.Types[typeName] = IndexCoreType(type);
        }

        foreach (var typeName in tmlHookTypes)
        {
            var type = asm.GetType(typeName, throwOnError: false, ignoreCase: false);
            if (type == null) continue;
            index.Types[typeName] = IndexTmlHookType(type);
        }

        loadContext.Unload();
        return index;
    }

    sealed class DllDirectoryLoadContext : AssemblyLoadContext
    {
        readonly string baseDir;
        Dictionary<string, string>? dllByFileName;

        public DllDirectoryLoadContext(string baseDir) : base(isCollectible: true)
        {
            this.baseDir = baseDir;
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

            void AddDir(string dir, SearchOption option)
            {
                if (!Directory.Exists(dir)) return;
                foreach (var file in Directory.EnumerateFiles(dir, "*.dll", option))
                {
                    var name = Path.GetFileName(file);
                    if (string.IsNullOrWhiteSpace(name)) continue;
                    if (!map.ContainsKey(name))
                    {
                        map[name] = file;
                    }
                }
            }

            AddDir(baseDir, SearchOption.TopDirectoryOnly);
            AddDir(Path.Combine(baseDir, "Libraries"), SearchOption.AllDirectories);

            dllByFileName = map;
        }
    }

    static TypeIndex IndexCoreType(Type type)
    {
        var index = new TypeIndex();

        const BindingFlags flags =
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

        foreach (var method in type.GetMethods(flags))
        {
            if (method.IsSpecialName) continue;
            AddMember(index.Methods, method.Name, BuildMethodEntry(method));
        }

        foreach (var field in type.GetFields(flags))
        {
            AddMember(index.Fields, field.Name, new MemberEntry
            {
                Signature = $"{FormatType(field.FieldType)} {field.Name}",
                ParamCount = 0,
                MinArgs = 0,
                IsStatic = field.IsStatic
            });
        }

        foreach (var prop in type.GetProperties(flags))
        {
            AddMember(index.Properties, prop.Name, new MemberEntry
            {
                Signature = $"{FormatType(prop.PropertyType)} {prop.Name} {{ {(prop.CanRead ? "get; " : "")}{(prop.CanWrite ? "set; " : "")}}}",
                ParamCount = 0,
                MinArgs = 0,
                IsStatic = (prop.GetGetMethod() ?? prop.GetSetMethod())?.IsStatic ?? false
            });
        }

        SortMembers(index);
        return index;
    }

    static TypeIndex IndexTmlHookType(Type type)
    {
        var index = new TypeIndex();

        const BindingFlags flags =
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly;

        foreach (var method in type.GetMethods(flags))
        {
            if (method.IsSpecialName) continue;
            if (!IsOverridableHook(method)) continue;
            AddMember(index.Methods, method.Name, BuildMethodEntry(method));
        }

        SortMembers(index);
        return index;
    }

    static bool IsOverridableHook(MethodInfo method)
    {
        if (method.IsStatic) return false;
        if (!(method.IsVirtual || method.IsAbstract)) return false;

        var isAccessible =
            method.IsPublic ||
            method.IsFamily ||
            method.IsFamilyOrAssembly;

        if (!isAccessible) return false;
        if (method.IsFinal) return false;
        return true;
    }

    static MemberEntry BuildMethodEntry(MethodInfo method)
    {
        var ps = method.GetParameters();
        var paramParts = new List<string>();
        var minArgs = 0;
        foreach (var p in ps)
        {
            var part = $"{FormatType(p.ParameterType)} {p.Name}";
            if (p.IsOptional && p.HasDefaultValue)
            {
                part += " = " + FormatDefaultValue(p.DefaultValue);
            }
            else
            {
                minArgs++;
            }
            if (p.GetCustomAttributesData().Any(a => a.AttributeType.FullName == "System.ParamArrayAttribute"))
            {
                part = "params " + part;
            }
            paramParts.Add(part);
        }

        var generic = method.IsGenericMethodDefinition
            ? "<" + string.Join(", ", method.GetGenericArguments().Select(a => a.Name)) + ">"
            : "";

        var signature = $"{FormatType(method.ReturnType)} {method.Name}{generic}({string.Join(", ", paramParts)})";

        return new MemberEntry
        {
            Signature = signature,
            ParamCount = ps.Length,
            MinArgs = minArgs,
            IsStatic = method.IsStatic
        };
    }

    static string FormatDefaultValue(object? value)
    {
        if (value == null) return "null";
        if (value is string s) return "\"" + s.Replace("\"", "\\\"") + "\"";
        if (value is char c) return "'" + (c == '\'' ? "\\'" : c) + "'";
        if (value is bool b) return b ? "true" : "false";
        if (value is float f) return f.ToString(System.Globalization.CultureInfo.InvariantCulture) + "f";
        if (value is double d) return d.ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (value is decimal m) return m.ToString(System.Globalization.CultureInfo.InvariantCulture) + "m";
        return Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture) ?? "null";
    }

    static string FormatType(Type type)
    {
        if (type.IsByRef) type = type.GetElementType()!;
        if (type.IsArray) return FormatType(type.GetElementType()!) + "[]";

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
            var name = type.Name.Split('`')[0];
            var args = type.GetGenericArguments().Select(FormatType);
            return $"{name}<{string.Join(", ", args)}>";
        }

        return type.Name;
    }

    static void AddMember(Dictionary<string, List<MemberEntry>> map, string name, MemberEntry entry)
    {
        if (!map.TryGetValue(name, out var list))
        {
            list = new List<MemberEntry>();
            map[name] = list;
        }
        list.Add(entry);
    }

    static void SortMembers(TypeIndex index)
    {
        foreach (var kv in index.Methods)
        {
            kv.Value.Sort((a, b) =>
            {
                var c = a.ParamCount.CompareTo(b.ParamCount);
                if (c != 0) return c;
                return string.CompareOrdinal(a.Signature, b.Signature);
            });
        }
    }
}
