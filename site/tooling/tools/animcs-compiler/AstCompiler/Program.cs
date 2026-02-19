using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace AstCompiler;

public static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public static int Main(string[] args)
    {
        try
        {
            var options = ParseArgs(args);
            if (!options.TryGetValue("input", out var inputPath) || string.IsNullOrWhiteSpace(inputPath) ||
                !options.TryGetValue("output", out var outputPath) || string.IsNullOrWhiteSpace(outputPath))
            {
                Console.Error.WriteLine("Usage: AstCompiler --input <path> --output <path>");
                return 2;
            }

            var payload = File.ReadAllText(inputPath, Encoding.UTF8);
            var requests = JsonSerializer.Deserialize<List<CompileRequestItem>>(payload, JsonOptions) ?? new List<CompileRequestItem>();

            var transpiler = new AnimScriptTranspiler();
            var responses = new List<CompileResponseItem>(requests.Count);

            foreach (var request in requests)
            {
                var sourcePath = string.IsNullOrWhiteSpace(request.SourcePath) ? "<unknown>" : request.SourcePath;
                var sourceText = request.SourceText ?? string.Empty;

                try
                {
                    var result = transpiler.Transpile(sourcePath, sourceText);
                    responses.Add(new CompileResponseItem
                    {
                        SourcePath = sourcePath,
                        Js = result.Js,
                        Diagnostics = result.Diagnostics
                    });
                }
                catch (Exception ex)
                {
                    responses.Add(new CompileResponseItem
                    {
                        SourcePath = sourcePath,
                        Js = string.Empty,
                        Diagnostics = new List<string> { ex.Message }
                    });
                }
            }

            var json = JsonSerializer.Serialize(responses, JsonOptions);
            File.WriteAllText(outputPath, json + Environment.NewLine, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }

    private static Dictionary<string, string> ParseArgs(string[] args)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < args.Length; i += 1)
        {
            var key = args[i];
            if (!key.StartsWith("--", StringComparison.Ordinal) || i + 1 >= args.Length)
            {
                continue;
            }

            var name = key.Substring(2);
            result[name] = args[i + 1];
            i += 1;
        }

        return result;
    }
}

internal sealed class CompileRequestItem
{
    public string? SourcePath { get; set; }
    public string? SourceText { get; set; }
}

internal sealed class CompileResponseItem
{
    public string SourcePath { get; set; } = string.Empty;
    public string Js { get; set; } = string.Empty;
    public List<string> Diagnostics { get; set; } = new();
}

internal sealed class TranspileResult
{
    public string Js { get; set; } = string.Empty;
    public List<string> Diagnostics { get; set; } = new();
}

internal sealed class AnimScriptTranspiler
{
    private static readonly CSharpParseOptions ParseOptions = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Latest);

    private static readonly Lazy<IReadOnlyList<MetadataReference>> MetadataReferences = new(() =>
    {
        var tpa = AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") as string;
        if (string.IsNullOrWhiteSpace(tpa))
        {
            return Array.Empty<MetadataReference>();
        }

        var refs = new List<MetadataReference>();
        foreach (var path in tpa.Split(Path.PathSeparator))
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                continue;
            }

            refs.Add(MetadataReference.CreateFromFile(path));
        }

        return refs;
    });

    public TranspileResult Transpile(string sourcePath, string source)
    {
        var sourceTree = CSharpSyntaxTree.ParseText(source, ParseOptions, sourcePath);
        var stubTree = CSharpSyntaxTree.ParseText(RuntimeStubs, ParseOptions, "__anim_runtime_stubs__.cs");

        var compilation = CSharpCompilation.Create(
            assemblyName: "AnimScript.Transpile",
            syntaxTrees: new[] { stubTree, sourceTree },
            references: MetadataReferences.Value,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)
        );

        var diagnostics = compilation
            .GetDiagnostics()
            .Where(d => d.Severity == DiagnosticSeverity.Error && d.Location.SourceTree == sourceTree)
            .Select(d => d.ToString())
            .ToList();

        if (diagnostics.Count > 0)
        {
            return new TranspileResult
            {
                Js = string.Empty,
                Diagnostics = diagnostics
            };
        }

        var semanticModel = compilation.GetSemanticModel(sourceTree, ignoreAccessibility: true);
        var root = sourceTree.GetRoot();
        var emitter = new JsEmitter(root, semanticModel);
        return new TranspileResult
        {
            Js = emitter.Emit(),
            Diagnostics = diagnostics
        };
    }

    private const string RuntimeStubs = """
global using System;

namespace AnimRuntime
{
    public sealed class AnimEntryAttribute : Attribute
    {
        public AnimEntryAttribute(string name) { }
    }

    public sealed class AnimProfileAttribute : Attribute
    {
        public string? Controls { get; set; }
        public float HeightScale { get; set; }
        public string? ModeOptions { get; set; }
    }

    public sealed class AnimContext
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public float Time { get; set; }
        public InputState Input { get; } = new InputState();
    }

    public sealed class InputState
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float DeltaX { get; set; }
        public float DeltaY { get; set; }
        public bool IsDown { get; set; }
        public bool WasPressed { get; set; }
        public bool WasReleased { get; set; }
        public bool IsInside { get; set; }
        public int Mode { get; set; }
        public bool ModeLocked { get; set; }
        public float WheelDelta { get; set; }
    }

    public interface IAnimScript
    {
        void OnInit(AnimContext ctx);
        void OnUpdate(float dt);
        void OnRender(ICanvas2D g);
        void OnDispose();
    }

    public interface ICanvas2D
    {
        void Clear(AnimRuntime.Math.Color color);
        void Line(AnimRuntime.Math.Vec2 from, AnimRuntime.Math.Vec2 to, AnimRuntime.Math.Color color, float width = 1f);
        void Circle(AnimRuntime.Math.Vec2 center, float radius, AnimRuntime.Math.Color color, float width = 1f);
        void FillCircle(AnimRuntime.Math.Vec2 center, float radius, AnimRuntime.Math.Color color);
        void Text(string text, AnimRuntime.Math.Vec2 position, AnimRuntime.Math.Color color, float size = 12f);
    }

    public static class AnimGeom
    {
        public static AnimRuntime.Math.Vec2 ToScreen(AnimRuntime.Math.Vec2 v, AnimRuntime.Math.Vec2 center, float scale) => default;
        public static void DrawAxes(ICanvas2D g, AnimRuntime.Math.Vec2 center, float scale, AnimRuntime.Math.Color? axisColor = null, AnimRuntime.Math.Color? gridColor = null) { }
        public static void DrawArrow(ICanvas2D g, AnimRuntime.Math.Vec2 from, AnimRuntime.Math.Vec2 to, AnimRuntime.Math.Color color, float width = 1f, float headSize = 8f) { }
    }
}

namespace AnimRuntime.Math
{
    public struct Color
    {
        public int R;
        public int G;
        public int B;
        public int A;

        public Color(int r, int g, int b, int a = 255)
        {
            R = r;
            G = g;
            B = b;
            A = a;
        }
    }

    public struct Vec2
    {
        public float X;
        public float Y;

        public Vec2(float x, float y)
        {
            X = x;
            Y = y;
        }

        public static Vec2 operator +(Vec2 a, Vec2 b) => default;
        public static Vec2 operator -(Vec2 a, Vec2 b) => default;
        public static Vec2 operator *(Vec2 a, float b) => default;
        public static Vec2 operator *(float a, Vec2 b) => default;
        public static Vec2 operator /(Vec2 a, float b) => default;
    }

    public struct Vec3
    {
        public float X;
        public float Y;
        public float Z;

        public Vec3(float x, float y, float z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        public static Vec3 operator +(Vec3 a, Vec3 b) => default;
        public static Vec3 operator -(Vec3 a, Vec3 b) => default;
        public static Vec3 operator *(Vec3 a, float b) => default;
        public static Vec3 operator *(float a, Vec3 b) => default;
        public static Vec3 operator /(Vec3 a, float b) => default;
    }

    public struct Mat4
    {
        public float M00 { get; set; }
        public float M01 { get; set; }
        public float M02 { get; set; }
        public float M03 { get; set; }
        public float M10 { get; set; }
        public float M11 { get; set; }
        public float M12 { get; set; }
        public float M13 { get; set; }
        public float M20 { get; set; }
        public float M21 { get; set; }
        public float M22 { get; set; }
        public float M23 { get; set; }
        public float M30 { get; set; }
        public float M31 { get; set; }
        public float M32 { get; set; }
        public float M33 { get; set; }

        public static Mat4 Identity() => default;
        public static Mat4 Translation(float x, float y, float z) => default;
        public static Mat4 Scale(float x, float y, float z) => default;
        public static Mat4 RotationX(float radians) => default;
        public static Mat4 RotationY(float radians) => default;
        public static Mat4 RotationZ(float radians) => default;
        public static Mat4 PerspectiveFovRh(float fov, float aspect, float near, float far) => default;
        public static Mat4 operator *(Mat4 a, Mat4 b) => default;
        public static Vec2 operator *(Mat4 m, Vec2 v) => default;
        public static Vec3 operator *(Mat4 m, Vec3 v) => default;
    }
}
""";
}

internal sealed class JsEmitter
{
    private readonly SyntaxNode _root;
    private readonly SemanticModel _semanticModel;
    private readonly StringBuilder _builder = new();
    private int _indentLevel;
    private INamedTypeSymbol? _classSymbol;
    private string _className = string.Empty;

    public JsEmitter(SyntaxNode root, SemanticModel semanticModel)
    {
        _root = root;
        _semanticModel = semanticModel;
    }

    public string Emit()
    {
        var classDeclaration = _root.DescendantNodes().OfType<ClassDeclarationSyntax>().FirstOrDefault();
        if (classDeclaration is null)
        {
            throw new InvalidOperationException("class declaration not found");
        }

        _className = classDeclaration.Identifier.ValueText;
        _classSymbol = _semanticModel.GetDeclaredSymbol(classDeclaration);

        WriteLine("export function create(runtime) {");
        _indentLevel += 1;
        WriteLine("const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;");
        WriteLine($"class {_className} {{");
        _indentLevel += 1;

        EmitConstructor(classDeclaration);

        foreach (var method in classDeclaration.Members.OfType<MethodDeclarationSyntax>())
        {
            EmitMethod(method);
        }

        _indentLevel -= 1;
        WriteLine("}");
        WriteLine($"return new {_className}();");
        _indentLevel -= 1;
        WriteLine("}");
        WriteLine(string.Empty);

        return _builder.ToString();
    }

    private void EmitConstructor(ClassDeclarationSyntax classDeclaration)
    {
        WriteLine("constructor() {");
        _indentLevel += 1;

        foreach (var field in classDeclaration.Members.OfType<FieldDeclarationSyntax>())
        {
            foreach (var variable in field.Declaration.Variables)
            {
                var fieldName = variable.Identifier.ValueText;
                var value = variable.Initializer is null
                    ? GetDefaultValue(field.Declaration.Type)
                    : EmitExpression(variable.Initializer.Value);
                WriteLine($"this.{fieldName} = {value};");
            }
        }

        _indentLevel -= 1;
        WriteLine("}");
    }

    private void EmitMethod(MethodDeclarationSyntax method)
    {
        var isStatic = method.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword));
        var keyword = isStatic ? "static " : string.Empty;
        var parameters = string.Join(", ", method.ParameterList.Parameters.Select(p => p.Identifier.ValueText));
        WriteLine($"{keyword}{method.Identifier.ValueText}({parameters}) {{");
        _indentLevel += 1;

        if (method.Body is not null)
        {
            foreach (var statement in method.Body.Statements)
            {
                EmitStatement(statement);
            }
        }
        else if (method.ExpressionBody is not null)
        {
            var expression = EmitExpression(method.ExpressionBody.Expression);
            if (method.ReturnType is PredefinedTypeSyntax predefined && predefined.Keyword.IsKind(SyntaxKind.VoidKeyword))
            {
                WriteLine($"{expression};");
            }
            else
            {
                WriteLine($"return {expression};");
            }
        }

        _indentLevel -= 1;
        WriteLine("}");
    }

    private void EmitStatement(StatementSyntax statement)
    {
        switch (statement)
        {
            case BlockSyntax block:
                EmitEmbeddedStatement(block);
                return;
            case LocalDeclarationStatementSyntax localDeclaration:
                EmitLocalDeclaration(localDeclaration.Declaration);
                return;
            case ExpressionStatementSyntax expressionStatement:
                WriteLine($"{EmitExpression(expressionStatement.Expression)};");
                return;
            case IfStatementSyntax ifStatement:
                EmitIf(ifStatement);
                return;
            case ForStatementSyntax forStatement:
                EmitFor(forStatement);
                return;
            case ReturnStatementSyntax returnStatement:
                if (returnStatement.Expression is null)
                {
                    WriteLine("return;");
                }
                else
                {
                    WriteLine($"return {EmitExpression(returnStatement.Expression)};");
                }

                return;
            case BreakStatementSyntax:
                WriteLine("break;");
                return;
            case ContinueStatementSyntax:
                WriteLine("continue;");
                return;
            case EmptyStatementSyntax:
                WriteLine(";");
                return;
            default:
                throw new InvalidOperationException($"unsupported statement: {statement.Kind()}");
        }
    }

    private void EmitLocalDeclaration(VariableDeclarationSyntax declaration)
    {
        foreach (var variable in declaration.Variables)
        {
            var value = variable.Initializer is null
                ? GetDefaultValue(declaration.Type)
                : EmitExpression(variable.Initializer.Value);
            WriteLine($"let {variable.Identifier.ValueText} = {value};");
        }
    }

    private void EmitIf(IfStatementSyntax ifStatement)
    {
        WriteLine($"if ({EmitExpression(ifStatement.Condition)})");
        EmitEmbeddedStatement(ifStatement.Statement);

        if (ifStatement.Else is null)
        {
            return;
        }

        WriteLine("else");
        EmitEmbeddedStatement(ifStatement.Else.Statement);
    }

    private void EmitFor(ForStatementSyntax forStatement)
    {
        var initializer = EmitForInitializer(forStatement);
        var condition = forStatement.Condition is null ? string.Empty : EmitExpression(forStatement.Condition);
        var incrementors = string.Join(", ", forStatement.Incrementors.Select(EmitExpression));

        WriteLine($"for ({initializer}; {condition}; {incrementors})");
        EmitEmbeddedStatement(forStatement.Statement);
    }

    private string EmitForInitializer(ForStatementSyntax forStatement)
    {
        if (forStatement.Declaration is not null)
        {
            var parts = new List<string>();
            foreach (var variable in forStatement.Declaration.Variables)
            {
                var value = variable.Initializer is null
                    ? GetDefaultValue(forStatement.Declaration.Type)
                    : EmitExpression(variable.Initializer.Value);
                parts.Add($"{variable.Identifier.ValueText} = {value}");
            }

            return $"let {string.Join(", ", parts)}";
        }

        if (forStatement.Initializers.Count == 0)
        {
            return string.Empty;
        }

        return string.Join(", ", forStatement.Initializers.Select(EmitExpression));
    }

    private void EmitEmbeddedStatement(StatementSyntax statement)
    {
        if (statement is BlockSyntax block)
        {
            WriteLine("{");
            _indentLevel += 1;
            foreach (var child in block.Statements)
            {
                EmitStatement(child);
            }

            _indentLevel -= 1;
            WriteLine("}");
            return;
        }

        WriteLine("{");
        _indentLevel += 1;
        EmitStatement(statement);
        _indentLevel -= 1;
        WriteLine("}");
    }

    private string EmitExpression(ExpressionSyntax expression)
    {
        switch (expression)
        {
            case LiteralExpressionSyntax literal:
                return EmitLiteral(literal);
            case IdentifierNameSyntax identifier:
                return EmitIdentifier(identifier);
            case ThisExpressionSyntax:
                return "this";
            case ParenthesizedExpressionSyntax parenthesized:
                return $"({EmitExpression(parenthesized.Expression)})";
            case PrefixUnaryExpressionSyntax prefixUnary:
                return $"{prefixUnary.OperatorToken.Text}{EmitExpression(prefixUnary.Operand)}";
            case PostfixUnaryExpressionSyntax postfixUnary:
                return $"{EmitExpression(postfixUnary.Operand)}{postfixUnary.OperatorToken.Text}";
            case AssignmentExpressionSyntax assignment:
                return $"{EmitExpression(assignment.Left)} {assignment.OperatorToken.Text} {EmitExpression(assignment.Right)}";
            case BinaryExpressionSyntax binary:
                return EmitBinary(binary);
            case InvocationExpressionSyntax invocation:
                return EmitInvocation(invocation);
            case MemberAccessExpressionSyntax memberAccess:
                return EmitMemberAccess(memberAccess);
            case ObjectCreationExpressionSyntax objectCreation:
                return EmitObjectCreation(objectCreation);
            case ElementAccessExpressionSyntax elementAccess:
                return EmitElementAccess(elementAccess);
            case ConditionalExpressionSyntax conditional:
                return $"{EmitExpression(conditional.Condition)} ? {EmitExpression(conditional.WhenTrue)} : {EmitExpression(conditional.WhenFalse)}";
            case CastExpressionSyntax cast:
                return EmitExpression(cast.Expression);
            case IsPatternExpressionSyntax isPattern:
                return EmitIsPattern(isPattern);
            case ArrayCreationExpressionSyntax arrayCreation:
                return EmitArrayCreation(arrayCreation);
            case ImplicitArrayCreationExpressionSyntax implicitArrayCreation:
                return EmitImplicitArrayCreation(implicitArrayCreation);
            case InitializerExpressionSyntax initializerExpression:
                return EmitInitializer(initializerExpression);
            default:
                throw new InvalidOperationException($"unsupported expression: {expression.Kind()}");
        }
    }

    private string EmitLiteral(LiteralExpressionSyntax literal)
    {
        if (literal.IsKind(SyntaxKind.NullLiteralExpression))
        {
            return "null";
        }

        if (literal.IsKind(SyntaxKind.TrueLiteralExpression))
        {
            return "true";
        }

        if (literal.IsKind(SyntaxKind.FalseLiteralExpression))
        {
            return "false";
        }

        var value = literal.Token.Value;
        if (value is string text)
        {
            return JsonSerializer.Serialize(text);
        }

        if (value is char c)
        {
            return JsonSerializer.Serialize(c.ToString());
        }

        if (value is IFormattable formattable)
        {
            return formattable.ToString(null, CultureInfo.InvariantCulture);
        }

        return literal.Token.Text;
    }

    private string EmitIdentifier(IdentifierNameSyntax identifier)
    {
        var symbol = _semanticModel.GetSymbolInfo(identifier).Symbol;
        if (symbol is IFieldSymbol fieldSymbol && IsCurrentClass(fieldSymbol.ContainingType))
        {
            return fieldSymbol.IsStatic ? $"{_className}.{fieldSymbol.Name}" : $"this.{fieldSymbol.Name}";
        }

        if (symbol is IMethodSymbol methodSymbol && IsCurrentClass(methodSymbol.ContainingType))
        {
            return methodSymbol.IsStatic ? $"{_className}.{methodSymbol.Name}" : $"this.{methodSymbol.Name}";
        }

        return identifier.Identifier.ValueText;
    }

    private string EmitInvocation(InvocationExpressionSyntax invocation)
    {
        if (invocation.Expression is MemberAccessExpressionSyntax memberAccess &&
            memberAccess.Name.Identifier.ValueText == "ToString" &&
            invocation.ArgumentList.Arguments.Count == 0)
        {
            return $"{EmitExpression(memberAccess.Expression)}.toString()";
        }

        var target = EmitExpression(invocation.Expression);
        var args = string.Join(", ", invocation.ArgumentList.Arguments.Select(arg => EmitExpression(arg.Expression)));
        return $"{target}({args})";
    }

    private string EmitMemberAccess(MemberAccessExpressionSyntax memberAccess)
    {
        if (memberAccess.Name.Identifier.ValueText == "Length")
        {
            var targetType = _semanticModel.GetTypeInfo(memberAccess.Expression).Type;
            if (targetType is IArrayTypeSymbol)
            {
                return $"{EmitExpression(memberAccess.Expression)}.length";
            }
        }

        return $"{EmitExpression(memberAccess.Expression)}.{memberAccess.Name.Identifier.ValueText}";
    }

    private string EmitObjectCreation(ObjectCreationExpressionSyntax objectCreation)
    {
        var typeName = ResolveTypeName(objectCreation.Type);
        var args = objectCreation.ArgumentList is null
            ? string.Empty
            : string.Join(", ", objectCreation.ArgumentList.Arguments.Select(arg => EmitExpression(arg.Expression)));
        return $"new {typeName}({args})";
    }

    private string EmitElementAccess(ElementAccessExpressionSyntax elementAccess)
    {
        var target = EmitExpression(elementAccess.Expression);
        var index = string.Join(", ", elementAccess.ArgumentList.Arguments.Select(arg => EmitExpression(arg.Expression)));
        return $"{target}[{index}]";
    }

    private string EmitIsPattern(IsPatternExpressionSyntax isPattern)
    {
        var left = EmitExpression(isPattern.Expression);
        if (isPattern.Pattern is ConstantPatternSyntax constantPattern &&
            constantPattern.Expression.IsKind(SyntaxKind.NullLiteralExpression))
        {
            return $"{left} == null";
        }

        if (isPattern.Pattern is UnaryPatternSyntax unaryPattern &&
            unaryPattern.Pattern is ConstantPatternSyntax nestedConstant &&
            nestedConstant.Expression.IsKind(SyntaxKind.NullLiteralExpression))
        {
            return $"{left} != null";
        }

        throw new InvalidOperationException($"unsupported pattern expression: {isPattern.Pattern.Kind()}");
    }

    private string EmitArrayCreation(ArrayCreationExpressionSyntax arrayCreation)
    {
        if (arrayCreation.Initializer is not null)
        {
            return EmitInitializer(arrayCreation.Initializer);
        }

        var rank = arrayCreation.Type.RankSpecifiers.FirstOrDefault();
        if (rank is null || rank.Sizes.Count == 0)
        {
            throw new InvalidOperationException("unsupported array creation");
        }

        return $"new Array({EmitExpression(rank.Sizes[0])})";
    }

    private string EmitImplicitArrayCreation(ImplicitArrayCreationExpressionSyntax implicitArrayCreation)
    {
        return EmitInitializer(implicitArrayCreation.Initializer);
    }

    private string EmitInitializer(InitializerExpressionSyntax initializer)
    {
        var entries = string.Join(", ", initializer.Expressions.Select(EmitExpression));
        return $"[{entries}]";
    }

    private string EmitBinary(BinaryExpressionSyntax binary)
    {
        var left = EmitExpression(binary.Left);
        var right = EmitExpression(binary.Right);

        var opSymbol = _semanticModel.GetSymbolInfo(binary).Symbol as IMethodSymbol;
        if (opSymbol is not null && opSymbol.MethodKind == MethodKind.UserDefinedOperator)
        {
            var mapped = TryEmitUserDefinedOperator(opSymbol, binary.Left, binary.Right, left, right);
            if (!string.IsNullOrWhiteSpace(mapped))
            {
                return mapped;
            }
        }

        return $"{left} {binary.OperatorToken.Text} {right}";
    }

    private string? TryEmitUserDefinedOperator(
        IMethodSymbol opSymbol,
        ExpressionSyntax leftNode,
        ExpressionSyntax rightNode,
        string left,
        string right)
    {
        var leftType = _semanticModel.GetTypeInfo(leftNode).Type;
        var rightType = _semanticModel.GetTypeInfo(rightNode).Type;
        var containingType = opSymbol.ContainingType.ToDisplayString();

        if (containingType == "AnimRuntime.Math.Vec2")
        {
            return opSymbol.Name switch
            {
                "op_Addition" => $"Vec2.Add({left}, {right})",
                "op_Subtraction" => $"Vec2.Sub({left}, {right})",
                "op_Multiply" when IsType(leftType, "AnimRuntime.Math.Vec2") && IsNumeric(rightType) => $"Vec2.MulScalar({left}, {right})",
                "op_Multiply" when IsNumeric(leftType) && IsType(rightType, "AnimRuntime.Math.Vec2") => $"Vec2.MulScalar({right}, {left})",
                "op_Division" => $"Vec2.DivScalar({left}, {right})",
                _ => null
            };
        }

        if (containingType == "AnimRuntime.Math.Vec3")
        {
            return opSymbol.Name switch
            {
                "op_Addition" => $"Vec3.Add({left}, {right})",
                "op_Subtraction" => $"Vec3.Sub({left}, {right})",
                "op_Multiply" when IsType(leftType, "AnimRuntime.Math.Vec3") && IsNumeric(rightType) => $"Vec3.MulScalar({left}, {right})",
                "op_Multiply" when IsNumeric(leftType) && IsType(rightType, "AnimRuntime.Math.Vec3") => $"Vec3.MulScalar({right}, {left})",
                "op_Division" => $"Vec3.DivScalar({left}, {right})",
                _ => null
            };
        }

        if (containingType == "AnimRuntime.Math.Mat4" && opSymbol.Name == "op_Multiply")
        {
            if (IsType(leftType, "AnimRuntime.Math.Mat4") && IsType(rightType, "AnimRuntime.Math.Mat4"))
            {
                return $"Mat4.Mul({left}, {right})";
            }

            if (IsType(leftType, "AnimRuntime.Math.Mat4") && IsType(rightType, "AnimRuntime.Math.Vec2"))
            {
                return $"Mat4.MulVec2({left}, {right})";
            }

            if (IsType(leftType, "AnimRuntime.Math.Mat4") && IsType(rightType, "AnimRuntime.Math.Vec3"))
            {
                return $"Mat4.MulVec3({left}, {right})";
            }
        }

        return null;
    }

    private string ResolveTypeName(TypeSyntax typeSyntax)
    {
        var symbol = _semanticModel.GetTypeInfo(typeSyntax).Type;
        if (symbol is not null)
        {
            return symbol.Name;
        }

        return typeSyntax.ToString();
    }

    private string GetDefaultValue(TypeSyntax typeSyntax)
    {
        var symbol = _semanticModel.GetTypeInfo(typeSyntax).Type;
        if (symbol is IArrayTypeSymbol)
        {
            return "null";
        }

        var typeName = symbol?.ToDisplayString();
        return typeName switch
        {
            "System.Boolean" => "false",
            "System.Int32" => "0",
            "System.Single" => "0",
            "System.Double" => "0",
            "System.Decimal" => "0",
            "AnimRuntime.Math.Vec2" => "new Vec2(0, 0)",
            "AnimRuntime.Math.Vec3" => "new Vec3(0, 0, 0)",
            "AnimRuntime.Math.Mat4" => "Mat4.Identity()",
            "AnimRuntime.Math.Color" => "new Color(0, 0, 0, 255)",
            _ => "null"
        };
    }

    private bool IsCurrentClass(INamedTypeSymbol? symbol)
    {
        if (_classSymbol is null || symbol is null)
        {
            return false;
        }

        return SymbolEqualityComparer.Default.Equals(symbol, _classSymbol);
    }

    private static bool IsType(ITypeSymbol? symbol, string expected)
    {
        return string.Equals(symbol?.ToDisplayString(), expected, StringComparison.Ordinal);
    }

    private static bool IsNumeric(ITypeSymbol? symbol)
    {
        if (symbol is null)
        {
            return false;
        }

        return symbol.SpecialType switch
        {
            SpecialType.System_Byte => true,
            SpecialType.System_SByte => true,
            SpecialType.System_Int16 => true,
            SpecialType.System_UInt16 => true,
            SpecialType.System_Int32 => true,
            SpecialType.System_UInt32 => true,
            SpecialType.System_Int64 => true,
            SpecialType.System_UInt64 => true,
            SpecialType.System_Single => true,
            SpecialType.System_Double => true,
            SpecialType.System_Decimal => true,
            _ => false
        };
    }

    private void WriteLine(string text)
    {
        if (text.Length > 0)
        {
            _builder.Append(' ', _indentLevel * 4);
            _builder.AppendLine(text);
            return;
        }

        _builder.AppendLine();
    }
}
