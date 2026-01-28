// C# animation runtime (browser-wasm placeholder)
// UMD wrapper: usable in browser (window.AnimCsRuntime) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.AnimCsRuntime = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const EMBED_SELECTOR = '.animcs-embed[data-animcs-src]';
    const DEFAULT_STAGE_HEIGHT = 240;
    const runtimeCache = new Map();
    const manifestCache = new Map();
    const canvasRegistry = new Map();
    let nextCanvasId = 1;

    function normalizeAnimPath(input) {
        const rel = String(input || '').replace(/\\/g, '/');
        const match = rel.match(/(?:^|\/)(?:site\/content\/|content\/)?(anims\/[^\s]+\.cs)$/i);
        return match ? match[1] : '';
    }

    function resolveAnimAssemblyPath(fileName, runtimeRoot) {
        if (!fileName) return '';
        const root = normalizeRuntimeRoot(runtimeRoot);
        if (root) return `${root}../${fileName}`;
        return `/site/assets/anims/${fileName}`;
    }

    function normalizeRuntimeRoot(input) {
        const raw = String(input || '').trim().replace(/\\/g, '/');
        if (!raw) return '';
        return raw.endsWith('/') ? raw : `${raw}/`;
    }

    function resolveRuntimeUrls(runtimeRoot) {
        const root = normalizeRuntimeRoot(runtimeRoot);
        if (!root) return { dotnetJs: '', bootJson: '' };
        return {
            dotnetJs: `${root}dotnet.js`,
            bootJson: `${root}dotnet.boot.json`
        };
    }

    function resolveManifestUrl(runtimeRoot) {
        const root = normalizeRuntimeRoot(runtimeRoot);
        if (!root) return '';
        return `${root}../manifest.json`;
    }

    function inferRuntimeRootFromScriptSrc(src) {
        const raw = String(src || '').trim();
        if (!raw) return '';
        return raw.replace(/\/site\/assets\/js\/animcs-runtime\.js(?:\?.*)?$/i, '/site/assets/anims/runtime/');
    }

    function findRuntimeScriptSrc() {
        if (typeof document === 'undefined') return '';
        const current = document.currentScript;
        if (current && current.src) return current.src;
        const scripts = document.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i -= 1) {
            const src = scripts[i].src || '';
            if (src.includes('animcs-runtime.js')) return src;
        }
        return '';
    }

    function detectRuntimeRoot() {
        const inferred = inferRuntimeRootFromScriptSrc(findRuntimeScriptSrc());
        if (inferred) return inferred;
        return '/site/assets/anims/runtime/';
    }

    function registerCanvas(canvas) {
        const id = nextCanvasId++;
        const ctx = canvas.getContext('2d');
        canvasRegistry.set(id, { canvas, ctx });
        return id;
    }

    function unregisterCanvas(id) {
        canvasRegistry.delete(id);
    }

    function clearCanvas(canvasId, r, g, b, a) {
        const entry = canvasRegistry.get(canvasId);
        if (!entry || !entry.ctx) return;
        const ctx = entry.ctx;
        ctx.save();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
        ctx.restore();
    }

    function drawLine(canvasId, x1, y1, x2, y2, r, g, b, a, width) {
        const entry = canvasRegistry.get(canvasId);
        if (!entry || !entry.ctx) return;
        const ctx = entry.ctx;
        const strokeWidth = Math.max(0.5, Number(width) || 1);
        ctx.save();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function strokeCircle(canvasId, cx, cy, radius, r, g, b, a, width) {
        const entry = canvasRegistry.get(canvasId);
        if (!entry || !entry.ctx) return;
        const ctx = entry.ctx;
        const strokeWidth = Math.max(0.5, Number(width) || 1);
        ctx.save();
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function fillCircle(canvasId, cx, cy, radius, r, g, b, a) {
        const entry = canvasRegistry.get(canvasId);
        if (!entry || !entry.ctx) return;
        const ctx = entry.ctx;
        ctx.save();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    async function defaultLoadDotnetModule(urls) {
        if (!urls || !urls.dotnetJs) {
            throw new Error('dotnetJs required');
        }
        const mod = await import(urls.dotnetJs);
        const creator = mod.createDotnetRuntime
            || mod.default
            || (mod.dotnet && typeof mod.dotnet.create === 'function' && mod.dotnet.create.bind(mod.dotnet));
        if (!creator) {
            throw new Error('dotnet.js create function missing');
        }
        return creator({ configSrc: urls.bootJson });
    }

    async function createRuntime(opts) {
        if (!opts || !opts.runtimeRoot) {
            throw new Error('runtimeRoot required');
        }
        const runtimeRoot = normalizeRuntimeRoot(opts.runtimeRoot);
        const urls = resolveRuntimeUrls(runtimeRoot);
        const loader = opts.loadDotnetModule || defaultLoadDotnetModule;
        const dotnetRuntime = await loader(urls);
        return { runtimeRoot, urls, dotnetRuntime };
    }

    function findAnimHostExports(root) {
        if (!root || typeof root !== 'object') return null;
        if (typeof root.LoadAndCreate === 'function' &&
            typeof root.Update === 'function' &&
            typeof root.Render === 'function') {
            return root;
        }
        const keys = Object.keys(root);
        for (let i = 0; i < keys.length; i += 1) {
            const found = findAnimHostExports(root[keys[i]]);
            if (found) return found;
        }
        return null;
    }

    async function getRuntime(runtimeRoot) {
        const key = normalizeRuntimeRoot(runtimeRoot);
        if (runtimeCache.has(key)) return runtimeCache.get(key);
        const promise = (async () => {
            const runtime = await createRuntime({ runtimeRoot: key });
            const dotnetRuntime = runtime.dotnetRuntime;
            if (!dotnetRuntime || typeof dotnetRuntime.setModuleImports !== 'function') {
                throw new Error('dotnet runtime missing setModuleImports');
            }
            if (typeof dotnetRuntime.getAssemblyExports !== 'function') {
                throw new Error('dotnet runtime missing getAssemblyExports');
            }
            dotnetRuntime.setModuleImports('animcs', {
                clear: clearCanvas,
                line: drawLine,
                circle: strokeCircle,
                fillCircle: fillCircle
            });
            const rawExports = await dotnetRuntime.getAssemblyExports('AnimHost.dll');
            const exports = findAnimHostExports(rawExports);
            if (!exports) {
                throw new Error('AnimHostExports not found');
            }
            return Object.assign(runtime, { exports });
        })();
        runtimeCache.set(key, promise);
        return promise;
    }

    async function loadManifest(runtimeRoot) {
        const key = normalizeRuntimeRoot(runtimeRoot);
        if (manifestCache.has(key)) return manifestCache.get(key);
        const promise = (async () => {
            const url = resolveManifestUrl(key);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`manifest load failed (${response.status})`);
            }
            return response.json();
        })();
        manifestCache.set(key, promise);
        return promise;
    }

    function ensureEmbedShell(embed, label) {
        if (embed.__ANIMCS_SHELL_READY) {
            const title = embed.querySelector('.animts-title');
            if (title && label) title.textContent = label;
            return;
        }
        embed.__ANIMCS_SHELL_READY = true;
        embed.classList.add('animts-embed');
        if (!embed.style.minHeight) embed.style.minHeight = `${DEFAULT_STAGE_HEIGHT}px`;

        const header = document.createElement('div');
        header.className = 'animts-header';

        const title = document.createElement('div');
        title.className = 'animts-title';
        title.textContent = label || 'C# 动画';

        const controls = document.createElement('div');
        controls.className = 'animts-controls';

        const btnRestart = document.createElement('button');
        btnRestart.className = 'btn btn-small btn-outline animts-btn-restart';
        btnRestart.type = 'button';
        btnRestart.textContent = '重载';

        controls.appendChild(btnRestart);
        header.appendChild(title);
        header.appendChild(controls);

        const stage = document.createElement('div');
        stage.className = 'animts-stage';

        const error = document.createElement('pre');
        error.className = 'animts-error';
        error.style.display = 'none';

        embed.replaceChildren(header, stage, error);
        embed.__ANIMCS_STAGE = stage;
        embed.__ANIMCS_ERROR = error;
        embed.__ANIMCS_BTN_RESTART = btnRestart;
    }

    function setError(embed, message) {
        const error = embed.__ANIMCS_ERROR;
        if (!error) return;
        error.textContent = String(message || '');
        error.style.display = 'block';
        embed.classList.add('animts-embed--error');
    }

    function clearError(embed) {
        const error = embed.__ANIMCS_ERROR;
        if (!error) return;
        error.textContent = '';
        error.style.display = 'none';
        embed.classList.remove('animts-embed--error');
    }

    function updateCanvasSize(canvas, stage) {
        const width = Math.max(1, Math.floor(stage.clientWidth || 1));
        const height = Math.max(1, Math.floor(stage.clientHeight || DEFAULT_STAGE_HEIGHT));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        return { width, height };
    }

    function disposeEmbed(embed) {
        const state = embed.__ANIMCS_STATE;
        embed.__ANIMCS_STATE = null;
        if (state && state.raf) {
            cancelAnimationFrame(state.raf);
        }
        if (state && state.runtime && state.runtime.exports && typeof state.runtime.exports.Dispose === 'function') {
            try {
                state.runtime.exports.Dispose(state.handle);
            } catch (_) {
                // ignore cleanup errors
            }
        }
        if (state && state.canvasId) {
            unregisterCanvas(state.canvasId);
        }
        if (embed.__ANIMCS_STAGE) {
            embed.__ANIMCS_STAGE.replaceChildren();
        }
    }

    async function mountEmbed(embed, srcOverride) {
        if (!embed) return;
        if (embed.__ANIMCS_MOUNTING) {
            embed.__ANIMCS_PENDING_RESTART = true;
            return;
        }
        embed.__ANIMCS_MOUNTING = true;

        const rawSource = srcOverride || embed.getAttribute('data-animcs-src') || '';
        const normalized = normalizeAnimPath(rawSource);
        ensureEmbedShell(embed, normalized || rawSource || 'C# 动画');
        clearError(embed);
        disposeEmbed(embed);

        try {
            if (!normalized) {
                throw new Error('animts 代码块第一行必须是 anims/*.cs 路径');
            }

            const runtimeRoot = normalizeRuntimeRoot(
                embed.getAttribute('data-animcs-runtime-root') || detectRuntimeRoot()
            );
            if (!runtimeRoot) {
                throw new Error('运行时路径缺失');
            }

            const runtime = await getRuntime(runtimeRoot);
            const manifest = await loadManifest(runtimeRoot);
            const entry = manifest && manifest.entries ? manifest.entries[normalized] : null;
            if (!entry || !entry.assembly) {
                throw new Error('动画未构建或清单缺失');
            }

            const assemblyUrl = resolveAnimAssemblyPath(entry.assembly, runtimeRoot);
            const response = await fetch(assemblyUrl);
            if (!response.ok) {
                throw new Error(`动画 DLL 加载失败 (${response.status})`);
            }

            const bytes = new Uint8Array(await response.arrayBuffer());
            const stage = embed.__ANIMCS_STAGE;
            if (!stage) {
                throw new Error('动画容器未准备好');
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'animts-ai-canvas';
            stage.replaceChildren(canvas);

            const canvasId = registerCanvas(canvas);
            const size = updateCanvasSize(canvas, stage);
            const handle = runtime.exports.LoadAndCreate(
                entry.assembly,
                bytes,
                entry.entry || '',
                size.width,
                size.height,
                canvasId
            );

            const state = {
                handle,
                runtime,
                canvasId,
                stage,
                canvas,
                lastTime: performance.now(),
                raf: 0
            };
            embed.__ANIMCS_STATE = state;

            if (embed.__ANIMCS_BTN_RESTART) {
                embed.__ANIMCS_BTN_RESTART.onclick = () => mountEmbed(embed, normalized);
            }

            const tick = (now) => {
                if (embed.__ANIMCS_STATE !== state) return;
                const dt = Math.min(0.1, Math.max(0, (now - state.lastTime) / 1000));
                state.lastTime = now;
                const current = updateCanvasSize(canvas, stage);
                runtime.exports.Update(handle, dt, current.width, current.height);
                runtime.exports.Render(handle);
                state.raf = requestAnimationFrame(tick);
            };
            state.raf = requestAnimationFrame(tick);
        } catch (e) {
            disposeEmbed(embed);
            setError(embed, `动画加载/运行失败：${e && e.message ? e.message : String(e)}`);
        } finally {
            embed.__ANIMCS_MOUNTING = false;
            if (embed.__ANIMCS_PENDING_RESTART) {
                embed.__ANIMCS_PENDING_RESTART = false;
                mountEmbed(embed, rawSource);
            }
        }
    }

    function mountEmbeds(root) {
        if (typeof document === 'undefined') return;
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll(EMBED_SELECTOR).forEach((embed) => {
            if (embed.__ANIMCS_AUTO_MOUNTED) return;
            embed.__ANIMCS_AUTO_MOUNTED = true;
            mountEmbed(embed);
        });
    }

    function initEmbeds() {
        mountEmbeds(document);
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('viewer:content-ready', function (event) {
            const container = event && event.detail && event.detail.container ? event.detail.container : document;
            mountEmbeds(container);
        });
        document.addEventListener('DOMContentLoaded', function () {
            initEmbeds();
        });
    }

    return {
        normalizeAnimPath,
        resolveAnimAssemblyPath,
        normalizeRuntimeRoot,
        resolveRuntimeUrls,
        resolveManifestUrl,
        inferRuntimeRootFromScriptSrc,
        createRuntime,
        mountEmbed,
        mountEmbeds,
        initEmbeds
    };
}));
