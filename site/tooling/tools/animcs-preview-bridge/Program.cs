using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using AstCompiler;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://127.0.0.1:{ResolvePort()}");
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("animcs-preview-local", policy =>
    {
        policy.AllowAnyOrigin();
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors("animcs-preview-local");

app.MapGet("/health", () =>
{
    return Results.Ok(new HealthResponse
    {
        Ok = true,
        Version = "animcs-preview-bridge/1.0.0"
    });
});

app.MapPost("/api/animcs/compile", (CompileRequest request) =>
{
    var stopwatch = Stopwatch.StartNew();
    var sourcePath = NormalizeSourcePath(request.SourcePath);
    if (!IsAllowedSourcePath(sourcePath))
    {
        return Results.Ok(new CompileResponse
        {
            Ok = false,
            Diagnostics = new List<string>
            {
                "sourcePath 必须是 anims/*.cs 且不允许路径穿越。"
            },
            ElapsedMs = stopwatch.ElapsedMilliseconds
        });
    }

    try
    {
        var compile = CompileWithAstCompiler(sourcePath, request.SourceText ?? string.Empty);
        stopwatch.Stop();

        if (compile.Diagnostics.Count > 0 || string.IsNullOrWhiteSpace(compile.Js))
        {
            return Results.Ok(new CompileResponse
            {
                Ok = false,
                Diagnostics = compile.Diagnostics.Count > 0
                    ? compile.Diagnostics
                    : new List<string> { "编译失败：未生成 moduleJs。" },
                ElapsedMs = stopwatch.ElapsedMilliseconds
            });
        }

        return Results.Ok(new CompileResponse
        {
            Ok = true,
            ModuleJs = compile.Js,
            Profile = ParseAnimProfile(request.SourceText ?? string.Empty),
            ElapsedMs = stopwatch.ElapsedMilliseconds
        });
    }
    catch (Exception ex)
    {
        stopwatch.Stop();
        return Results.Ok(new CompileResponse
        {
            Ok = false,
            Diagnostics = new List<string> { ex.Message },
            ElapsedMs = stopwatch.ElapsedMilliseconds
        });
    }
});

app.Run();

static int ResolvePort()
{
    var raw = Environment.GetEnvironmentVariable("ANIMCS_PREVIEW_BRIDGE_PORT");
    if (int.TryParse(raw, out var port) && port > 0 && port <= 65535)
    {
        return port;
    }

    return 5078;
}

static string NormalizeSourcePath(string? input)
{
    var raw = (input ?? string.Empty).Trim().Replace('\\', '/');
    if (raw.StartsWith("./", StringComparison.Ordinal))
    {
        raw = raw[2..];
    }
    if (raw.StartsWith("/site/content/", StringComparison.OrdinalIgnoreCase))
    {
        raw = raw["/site/content/".Length..];
    }
    if (raw.StartsWith("site/content/", StringComparison.OrdinalIgnoreCase))
    {
        raw = raw["site/content/".Length..];
    }
    if (raw.StartsWith("content/", StringComparison.OrdinalIgnoreCase))
    {
        raw = raw["content/".Length..];
    }
    return raw;
}

static bool IsAllowedSourcePath(string sourcePath)
{
    if (string.IsNullOrWhiteSpace(sourcePath))
    {
        return false;
    }
    if (sourcePath.Contains('\0', StringComparison.Ordinal))
    {
        return false;
    }
    if (sourcePath.Contains("..", StringComparison.Ordinal))
    {
        return false;
    }
    return Regex.IsMatch(sourcePath, @"^anims\/[A-Za-z0-9._\/-]+\.cs$", RegexOptions.CultureInvariant);
}

static AstCompileResult CompileWithAstCompiler(string sourcePath, string sourceText)
{
    var serializerOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };
    var tempDir = Path.Combine(Path.GetTempPath(), $"animcs-preview-bridge-{Guid.NewGuid():N}");
    Directory.CreateDirectory(tempDir);
    var inputPath = Path.Combine(tempDir, "input.json");
    var outputPath = Path.Combine(tempDir, "output.json");

    try
    {
        var payload = JsonSerializer.Serialize(
            new[] { new AstCompileRequestItem { SourcePath = sourcePath, SourceText = sourceText } },
            serializerOptions
        );
        File.WriteAllText(inputPath, payload);

        var code = AstCompiler.Program.Main(new[] { "--input", inputPath, "--output", outputPath });
        if (code != 0)
        {
            return new AstCompileResult
            {
                Diagnostics = new List<string> { $"AstCompiler 退出码: {code}" }
            };
        }

        if (!File.Exists(outputPath))
        {
            return new AstCompileResult
            {
                Diagnostics = new List<string> { "AstCompiler 未输出结果文件。" }
            };
        }

        var outputText = File.ReadAllText(outputPath);
        var output = JsonSerializer.Deserialize<List<AstCompileResponseItem>>(outputText, serializerOptions)
            ?? new List<AstCompileResponseItem>();
        var item = output.FirstOrDefault();
        if (item is null)
        {
            return new AstCompileResult
            {
                Diagnostics = new List<string> { "AstCompiler 返回空结果。" }
            };
        }

        return new AstCompileResult
        {
            Js = item.Js ?? string.Empty,
            Diagnostics = (item.Diagnostics ?? new List<string>())
                .Where(entry => !string.IsNullOrWhiteSpace(entry))
                .ToList()
        };
    }
    finally
    {
        try
        {
            Directory.Delete(tempDir, recursive: true);
        }
        catch
        {
            // ignore cleanup failures
        }
    }
}

static AnimProfilePayload? ParseAnimProfile(string source)
{
    var text = source ?? string.Empty;
    var attr = Regex.Match(text, @"\[\s*AnimProfile\s*\(([\s\S]*?)\)\s*\]", RegexOptions.CultureInvariant);
    if (!attr.Success || attr.Groups.Count < 2)
    {
        return null;
    }

    var body = attr.Groups[1].Value;
    var profile = new AnimProfilePayload();

    var controls = Regex.Match(body, @"\bControls\s*=\s*""([^""]*)""", RegexOptions.CultureInvariant);
    if (controls.Success)
    {
        var value = controls.Groups[1].Value.Trim();
        if (!string.IsNullOrWhiteSpace(value))
        {
            profile.Controls = value;
        }
    }

    var height = Regex.Match(body, @"\bHeightScale\s*=\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*[fFdD]?", RegexOptions.CultureInvariant);
    if (height.Success && double.TryParse(height.Groups[1].Value, out var heightScale) && heightScale > 0)
    {
        profile.HeightScale = heightScale;
    }

    var modeOptions = Regex.Match(body, @"\bModeOptions\s*=\s*""([^""]*)""", RegexOptions.CultureInvariant);
    if (modeOptions.Success)
    {
        var parsed = ParseModeOptions(modeOptions.Groups[1].Value);
        if (parsed.Count > 0)
        {
            profile.ModeOptions = parsed;
        }
    }

    if (string.IsNullOrWhiteSpace(profile.Controls) &&
        profile.HeightScale is null &&
        (profile.ModeOptions is null || profile.ModeOptions.Count == 0))
    {
        return null;
    }

    return profile;
}

static List<ModeOptionItem> ParseModeOptions(string input)
{
    var result = new List<ModeOptionItem>();
    var parts = (input ?? string.Empty).Split('|', StringSplitOptions.RemoveEmptyEntries);
    foreach (var part in parts)
    {
        var segment = part.Trim();
        if (segment.Length == 0)
        {
            continue;
        }

        var separator = segment.IndexOf(':');
        if (separator <= 0)
        {
            continue;
        }

        var valueText = segment[..separator].Trim();
        var text = segment[(separator + 1)..].Trim();
        if (text.Length == 0)
        {
            continue;
        }

        if (!int.TryParse(valueText, out var value))
        {
            continue;
        }

        result.Add(new ModeOptionItem
        {
            Value = value,
            Text = text
        });
    }

    return result;
}

sealed class CompileRequest
{
    public string SourcePath { get; set; } = string.Empty;
    public string SourceText { get; set; } = string.Empty;
    public string? RequestId { get; set; }
}

sealed class CompileResponse
{
    public bool Ok { get; set; }
    public string? ModuleJs { get; set; }
    public AnimProfilePayload? Profile { get; set; }
    public List<string>? Diagnostics { get; set; }
    public long ElapsedMs { get; set; }
}

sealed class HealthResponse
{
    public bool Ok { get; set; }
    public string Version { get; set; } = string.Empty;
}

sealed class AnimProfilePayload
{
    public string? Controls { get; set; }
    public double? HeightScale { get; set; }
    public List<ModeOptionItem>? ModeOptions { get; set; }
}

sealed class ModeOptionItem
{
    public int Value { get; set; }
    public string Text { get; set; } = string.Empty;
}

sealed class AstCompileRequestItem
{
    public string SourcePath { get; set; } = string.Empty;
    public string SourceText { get; set; } = string.Empty;
}

sealed class AstCompileResponseItem
{
    public string SourcePath { get; set; } = string.Empty;
    public string? Js { get; set; }
    public List<string>? Diagnostics { get; set; }
}

sealed class AstCompileResult
{
    public string Js { get; set; } = string.Empty;
    public List<string> Diagnostics { get; set; } = new();
}
