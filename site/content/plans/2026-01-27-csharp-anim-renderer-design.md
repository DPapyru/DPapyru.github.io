# CSharp Animation Renderer (Browser WASM) Design

> 2026-01-28 更新：当前方案已改为“构建期 C# -> JS 编译”，浏览器不再加载 WASM 运行时。详见 `docs/plans/2026-01-28-csharp-to-js-anim-compiler.md`。

**Goal:** Replace the current TypeScript-based anims pipeline with C# scripts that run in the browser via .NET WASM, while remaining fully static for GitHub Pages. Keep the `animts` markdown block but change the first line to `anims/*.cs`.

**Non-goals:** No runtime C# compilation in the browser, no TS compatibility layer, no 3D/WebGL work, no multithreaded WASM.

## Architecture Overview

- **Source scripts:** `site/content/anims/*.cs`
- **Runtime library:** `tools/animcs/AnimRuntime` (shared API + JS interop stubs)
- **Host app:** `tools/animcs/AnimHost` (minimal browser-wasm entrypoint)
- **Build outputs:**
  - Runtime: `site/assets/anims/runtime/` (`dotnet.js`, `dotnet.wasm`, ICU data, `AnimRuntime.dll`, `AnimHost.dll`)
  - Per-script assemblies: `site/assets/anims/*.dll`
  - Manifest: `site/assets/anims/manifest.json`
- **Loaders/UI:** `site/assets/js/animcs-runtime.js`, `site/pages/viewer.html`, `site/pages/anim-renderer.html`

## Build Pipeline

1. **Publish runtime**
   - `dotnet publish tools/animcs/AnimHost -c Release -r browser-wasm`
   - Copy runtime artifacts into `site/assets/anims/runtime/`.
2. **Compile each anim script**
   - For each `site/content/anims/*.cs`, run `dotnet`/`csc` to produce `site/assets/anims/<name>.dll`.
   - Reference `AnimRuntime.dll` and .NET reference packs from the local SDK.
3. **Generate manifest**
   - Map `anims/*.cs` to `{ assembly, typeName, hash, mtime }`.
   - Store in `site/assets/anims/manifest.json`.

## Runtime Flow

- `site/assets/js/animcs-runtime.js` loads `dotnet.js` and initializes the runtime.
- When a markdown block references `anims/foo.cs`:
  - Resolve entry in manifest.
  - Fetch and load the DLL via `dotnet.runtime.loadAssembly`.
  - Instantiate the entry type and run the update/render loop.
- JS schedules `requestAnimationFrame` and calls into C# for `Update(dt)` and `Render()`.
- JS exposes minimal Canvas2D ops and input events via `JSImport`/`JSExport` bridging.

## C# API (new design)

```csharp
public interface IAnimScript
{
    void OnInit(AnimContext ctx);
    void OnUpdate(float dt);
    void OnRender(ICanvas2D g);
    void OnDispose();
}

[AnimEntry("demo-eoc-ai")]
public sealed class Demo : IAnimScript { /* ... */ }
```

- `AnimContext`: time, input, canvas size, assets, random.
- `ICanvas2D`: draw primitives, text, images, transforms, save/restore.
- `Vec2`, `Color`, `Rect` structs for math.

## Viewer Integration

- Keep `animts` fenced block, but validate `.cs` paths.
- `site/pages/anim-renderer.html` uses the same runtime loader and supports selecting `site/content/anims/*.cs`.
- Errors show in-place when manifest lookup fails or runtime load fails.

## Migration Notes

- 已迁移为 C# 脚本（`site/content/anims/*.cs`）。
- Replace `scripts/build-anims.js` with a C# build step or add a new script and wire `npm run build`.
- Update contributor docs to reflect C# scripts.

## Risks

- WASM runtime size; mitigate with caching and lazy loading.
- Dynamic assembly load APIs differ by .NET version.
- Build complexity across OS/SDK paths.

## Testing

- Manual: `npm run build`, open `site/pages/anim-renderer.html`, run a sample anim.
- Optional: smoke test via static server (GitHub Pages or `python -m http.server`).
