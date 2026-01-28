using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using AnimRuntime;

namespace AnimHost;

public static partial class AnimHostExports
{
    private sealed class AnimInstance
    {
        public AnimInstance(IAnimScript script, AnimContext context, Canvas2DProxy canvas)
        {
            Script = script;
            Context = context;
            Canvas = canvas;
        }

        public IAnimScript Script { get; }
        public AnimContext Context { get; }
        public Canvas2DProxy Canvas { get; }
    }

    private static readonly Dictionary<int, AnimInstance> Instances = new();
    private static readonly Dictionary<string, Assembly> Assemblies = new(StringComparer.OrdinalIgnoreCase);
    private static int _nextHandle = 1;

    [JSExport]
    public static int LoadAndCreate(string assemblyName, byte[] assemblyBytes, string entryName, int width, int height, int canvasId)
    {
        if (string.IsNullOrWhiteSpace(assemblyName))
        {
            assemblyName = Guid.NewGuid().ToString("N");
        }

        if (assemblyBytes is null || assemblyBytes.Length == 0)
        {
            throw new ArgumentException("assemblyBytes required", nameof(assemblyBytes));
        }

        if (!Assemblies.TryGetValue(assemblyName, out var assembly))
        {
            assembly = Assembly.Load(assemblyBytes);
            Assemblies[assemblyName] = assembly;
        }

        var scriptType = ResolveEntryType(assembly, entryName);
        if (scriptType is null)
        {
            throw new InvalidOperationException($"Anim entry '{entryName}' not found.");
        }

        var script = (IAnimScript)Activator.CreateInstance(scriptType)!;
        var ctx = new AnimContext();
        ctx.Update(0f, width, height);

        var canvas = new Canvas2DProxy(canvasId);
        script.OnInit(ctx);

        var handle = _nextHandle++;
        Instances[handle] = new AnimInstance(script, ctx, canvas);
        return handle;
    }

    [JSExport]
    public static void Update(int handle, float dt, int width, int height)
    {
        if (!Instances.TryGetValue(handle, out var instance))
        {
            return;
        }

        instance.Context.Update(dt, width, height);
        instance.Script.OnUpdate(dt);
    }

    [JSExport]
    public static void Render(int handle)
    {
        if (!Instances.TryGetValue(handle, out var instance))
        {
            return;
        }

        instance.Script.OnRender(instance.Canvas);
    }

    [JSExport]
    public static void Dispose(int handle)
    {
        if (!Instances.TryGetValue(handle, out var instance))
        {
            return;
        }

        try
        {
            instance.Script.OnDispose();
        }
        finally
        {
            Instances.Remove(handle);
        }
    }

    private static Type? ResolveEntryType(Assembly assembly, string entryName)
    {
        var targetName = entryName?.Trim();
        var candidates = assembly
            .GetTypes()
            .Where(t => typeof(IAnimScript).IsAssignableFrom(t) && !t.IsAbstract)
            .ToArray();

        if (!string.IsNullOrWhiteSpace(targetName))
        {
            foreach (var type in candidates)
            {
                var attr = type.GetCustomAttribute<AnimEntryAttribute>();
                if (attr is not null && string.Equals(attr.Name, targetName, StringComparison.OrdinalIgnoreCase))
                {
                    return type;
                }
            }

            foreach (var type in candidates)
            {
                if (string.Equals(type.Name, targetName, StringComparison.OrdinalIgnoreCase))
                {
                    return type;
                }
            }
        }

        return candidates.FirstOrDefault();
    }
}

internal sealed class Canvas2DProxy : ICanvas2D
{
    private readonly int _canvasId;

    public Canvas2DProxy(int canvasId)
    {
        _canvasId = canvasId;
    }

    public void Clear(AnimRuntime.Math.Color color)
    {
        CanvasInterop.Clear(_canvasId, color.R, color.G, color.B, color.A);
    }
}

internal static partial class CanvasInterop
{
    [JSImport("clear", "animcs")]
    internal static partial void Clear(int canvasId, byte r, byte g, byte b, byte a);
}
