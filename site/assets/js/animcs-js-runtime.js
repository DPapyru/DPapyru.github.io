// C# animation runtime (compiled to JS) - no WASM required.
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.AnimCsJsRuntime = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const EMBED_SELECTOR = '.animcs-embed[data-animcs-src]';
    const DEFAULT_STAGE_HEIGHT = 240;
    const manifestCache = new Map();

    function normalizeAssetsRoot(input) {
        const raw = String(input || '').trim().replace(/\\/g, '/');
        if (!raw) return '';
        return raw.endsWith('/') ? raw.slice(0, -1) : raw;
    }

    function inferAssetsRootFromScriptSrc(src) {
        const raw = String(src || '').trim().replace(/\\/g, '/');
        if (!raw) return '';
        const siteAssets = raw.replace(/\/site\/assets\/js\/animcs-js-runtime\.js(?:\?.*)?$/i, '/site/assets');
        if (siteAssets !== raw) return siteAssets;
        const assets = raw.replace(/\/assets\/js\/animcs-js-runtime\.js(?:\?.*)?$/i, '/assets');
        if (assets !== raw) return assets;
        return '';
    }

    function findRuntimeScriptSrc() {
        if (typeof document === 'undefined') return '';
        const current = document.currentScript;
        if (current && current.src) return current.src;
        const scripts = document.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i -= 1) {
            const src = scripts[i].src || '';
            if (src.includes('animcs-js-runtime.js')) return src;
        }
        return '';
    }

    function detectAssetsRoot() {
        if (typeof window !== 'undefined' && window.SITE && window.SITE.assetsRoot) {
            const explicit = normalizeAssetsRoot(window.SITE.assetsRoot);
            if (explicit) return explicit;
        }
        const inferred = normalizeAssetsRoot(inferAssetsRootFromScriptSrc(findRuntimeScriptSrc()));
        if (inferred) return inferred;
        return '/site/assets';
    }

    function getAssetsRoot() {
        return detectAssetsRoot();
    }

    function normalizeAnimPath(input) {
        const rel = String(input || '').replace(/\\/g, '/');
        const match = rel.match(/(?:^|\/)(?:site\/content\/|content\/)?(anims\/[^\s]+\.cs)$/i);
        return match ? match[1] : '';
    }

    function createFallbackEntry(normalized) {
        const rel = String(normalized || '').trim();
        if (!rel) return null;
        const match = rel.match(/^anims\/(.+)\.cs$/i);
        if (!match || !match[1]) return null;
        const stem = match[1];
        return {
            js: `${stem}.js`,
            entry: stem
        };
    }

    function resolveEntryForSource(manifest, normalized) {
        const rel = String(normalized || '').trim();
        if (!rel) return null;

        const entries = manifest && manifest.entries ? manifest.entries : null;
        if (entries && typeof entries === 'object') {
            if (entries[rel]) return entries[rel];
            const lower = rel.toLowerCase();
            const matchedKey = Object.keys(entries).find((key) => String(key || '').toLowerCase() === lower);
            if (matchedKey) return entries[matchedKey];
        }

        return createFallbackEntry(rel);
    }

    async function resolveCustomEntry(embed, normalized, rawSource) {
        if (!embed || typeof embed.__ANIMCS_RESOLVE_ENTRY !== 'function') return null;
        return embed.__ANIMCS_RESOLVE_ENTRY({
            normalized,
            rawSource,
            assetsRoot: getAssetsRoot()
        });
    }

    function applyEmbedDefaults(embed, normalized) {
        if (!embed || !normalized) return;
        if (normalized === 'anims/demo-eoc-ai.cs') {
            if (!embed.getAttribute('data-animcs-height-scale')) {
                embed.setAttribute('data-animcs-height-scale', '2.3');
            }
            if (!embed.getAttribute('data-animcs-controls')) {
                embed.setAttribute('data-animcs-controls', 'eoc');
            }
        }
    }

    function resolveManifestUrl() {
        return `${getAssetsRoot()}/anims/manifest.json`;
    }

    function resolveAnimModulePath(entry) {
        if (!entry) return '';
        const base = `${getAssetsRoot()}/anims/`;
        if (entry.js) return `${base}${entry.js}`;
        if (entry.entry) return `${base}${entry.entry}.js`;
        return '';
    }

    async function loadManifest() {
        const key = getAssetsRoot();
        if (manifestCache.has(key)) return manifestCache.get(key);
        const promise = (async () => {
            const response = await fetch(resolveManifestUrl());
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
            applyStageHeight(embed);
            ensureControls(embed);
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
        applyStageHeight(embed);
        ensureControls(embed);
    }

    function applyStageHeight(embed) {
        if (!embed || !embed.__ANIMCS_STAGE) return;
        const stage = embed.__ANIMCS_STAGE;
        const rawHeight = embed.getAttribute('data-animcs-height');
        const rawScale = embed.getAttribute('data-animcs-height-scale');
        let height = 0;
        if (rawHeight) {
            const parsed = Number(rawHeight);
            if (Number.isFinite(parsed) && parsed > 0) height = parsed;
        }
        if (!height && rawScale) {
            const parsed = Number(rawScale);
            if (Number.isFinite(parsed) && parsed > 0) height = DEFAULT_STAGE_HEIGHT * parsed;
        }
        if (height) {
            stage.style.height = `${Math.round(height)}px`;
        }
    }

    function ensureControls(embed) {
        if (!embed || embed.__ANIMCS_CONTROL_STATE) return embed && embed.__ANIMCS_CONTROL_STATE;
        const controlType = embed.getAttribute('data-animcs-controls');
        if (controlType !== 'eoc') return null;
        const header = embed.querySelector('.animts-controls');
        if (!header) return null;

        const label = document.createElement('span');
        label.className = 'animts-control-label';
        label.textContent = 'AI';

        const select = document.createElement('select');
        select.className = 'animts-select';
        const options = [
            { value: '0', text: '自动' },
            { value: '1', text: '一阶-徘徊' },
            { value: '2', text: '一阶-冲刺' },
            { value: '3', text: '二阶-变形' },
            { value: '4', text: '二阶-徘徊' },
            { value: '5', text: '二阶-冲刺' }
        ];
        options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        const state = { mode: 0, locked: false };
        select.addEventListener('change', () => {
            const value = Number(select.value);
            state.mode = Number.isFinite(value) ? value : 0;
            state.locked = state.mode !== 0;
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'animts-control-group';
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        header.insertBefore(wrapper, header.firstChild);

        embed.__ANIMCS_CONTROL_STATE = state;
        return state;
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

    function resolveFactory(mod) {
        if (!mod) return null;
        if (typeof mod.create === 'function') return mod.create;
        if (mod.default && typeof mod.default.create === 'function') return mod.default.create;
        if (typeof mod.default === 'function') return mod.default;
        return null;
    }

    function Vec2(x, y) {
        this.X = Number(x || 0);
        this.Y = Number(y || 0);
    }

    function Color(r, g, b, a) {
        this.R = Math.round(Number(r || 0));
        this.G = Math.round(Number(g || 0));
        this.B = Math.round(Number(b || 0));
        this.A = a == null ? 255 : Math.round(Number(a));
    }

    function AnimContext(width, height) {
        this.Width = width;
        this.Height = height;
        this.Time = 0;
        this.Input = createInputState();
    }

    function createInputState() {
        return {
            X: 0,
            Y: 0,
            DeltaX: 0,
            DeltaY: 0,
            IsDown: false,
            WasPressed: false,
            WasReleased: false,
            IsInside: false,
            Mode: 0,
            ModeLocked: false
        };
    }

    function resetInputEdges(input) {
        if (!input) return;
        input.WasPressed = false;
        input.WasReleased = false;
        input.DeltaX = 0;
        input.DeltaY = 0;
    }

    function applyControlState(input, controlState) {
        if (!input || !controlState) return;
        input.Mode = typeof controlState.mode === 'number' ? controlState.mode : 0;
        input.ModeLocked = Boolean(controlState.locked);
    }

    function updatePointer(input, state, x, y) {
        if (!input) return;
        input.DeltaX = x - input.X;
        input.DeltaY = y - input.Y;
        input.X = x;
        input.Y = y;
        if (typeof state === 'boolean') {
            input.IsDown = state;
        }
    }

    function getPointerPosition(canvas, event) {
        const clientX = event && typeof event.clientX === 'number' ? event.clientX : 0;
        const clientY = event && typeof event.clientY === 'number' ? event.clientY : 0;
        if (canvas && typeof canvas.getBoundingClientRect === 'function') {
            const rect = canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }
        return {
            x: event && typeof event.offsetX === 'number' ? event.offsetX : clientX,
            y: event && typeof event.offsetY === 'number' ? event.offsetY : clientY
        };
    }

    function attachPointerEvents(canvas, input) {
        if (!canvas || !canvas.addEventListener) return null;
        const handlerState = { lastPointerId: null };

        const onDown = (event) => {
            if (!event || event.isPrimary === false) return;
            const pos = getPointerPosition(canvas, event);
            updatePointer(input, true, pos.x, pos.y);
            input.WasPressed = true;
            input.IsInside = true;
            handlerState.lastPointerId = event.pointerId;
            if (event.preventDefault) event.preventDefault();
        };
        const onMove = (event) => {
            if (!event || (handlerState.lastPointerId != null && event.pointerId !== handlerState.lastPointerId)) return;
            const pos = getPointerPosition(canvas, event);
            updatePointer(input, input.IsDown, pos.x, pos.y);
            input.IsInside = true;
        };
        const onUp = (event) => {
            if (!event || (handlerState.lastPointerId != null && event.pointerId !== handlerState.lastPointerId)) return;
            const pos = getPointerPosition(canvas, event);
            updatePointer(input, false, pos.x, pos.y);
            input.WasReleased = true;
            input.IsInside = true;
            handlerState.lastPointerId = null;
        };
        const onEnter = (event) => {
            if (!event) return;
            const pos = getPointerPosition(canvas, event);
            updatePointer(input, input.IsDown, pos.x, pos.y);
            input.IsInside = true;
        };
        const onLeave = (event) => {
            if (!event) return;
            const pos = getPointerPosition(canvas, event);
            updatePointer(input, input.IsDown, pos.x, pos.y);
            input.IsInside = false;
        };

        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointerenter', onEnter);
        canvas.addEventListener('pointerleave', onLeave);

        return () => {
            canvas.removeEventListener('pointerdown', onDown);
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('pointerenter', onEnter);
            canvas.removeEventListener('pointerleave', onLeave);
        };
    }

    const MathF = {
        Sin: Math.sin,
        Cos: Math.cos,
        Min: Math.min,
        Max: Math.max,
        Sqrt: Math.sqrt,
        Abs: Math.abs
    };

    function colorToRgba(color) {
        if (!color) return 'rgba(0,0,0,1)';
        const a = typeof color.A === 'number' ? color.A : 255;
        return `rgba(${color.R || 0}, ${color.G || 0}, ${color.B || 0}, ${a / 255})`;
    }

    function createCanvasApi(canvas, ctx) {
        const api = {
            Clear: function (color) {
                if (!ctx || !canvas) return;
                ctx.save();
                ctx.fillStyle = colorToRgba(color);
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            },
            Line: function (from, to, color, width) {
                if (!ctx) return;
                ctx.save();
                ctx.strokeStyle = colorToRgba(color);
                ctx.lineWidth = width || 1;
                ctx.beginPath();
                ctx.moveTo(from.X, from.Y);
                ctx.lineTo(to.X, to.Y);
                ctx.stroke();
                ctx.restore();
            },
            Circle: function (center, radius, color, width) {
                if (!ctx) return;
                ctx.save();
                ctx.strokeStyle = colorToRgba(color);
                ctx.lineWidth = width || 1;
                ctx.beginPath();
                ctx.arc(center.X, center.Y, Math.max(0, radius), 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            },
            FillCircle: function (center, radius, color) {
                if (!ctx) return;
                ctx.save();
                ctx.fillStyle = colorToRgba(color);
                ctx.beginPath();
                ctx.arc(center.X, center.Y, Math.max(0, radius), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        return api;
    }

    function createPlayer(mod, options) {
        const opts = options || {};
        const canvas = opts.canvas || (opts.embed ? document.createElement('canvas') : null);
        const ctx = opts.ctx || (canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null);
        const width = canvas ? canvas.width : (opts.width || 1);
        const height = canvas ? canvas.height : (opts.height || 1);
        const context = new AnimContext(width, height);
        const runtimeApi = { Vec2, Color, MathF };
        const canvasApi = createCanvasApi(canvas, ctx);
        const controlState = opts.controlState || null;
        let detachPointer = null;
        if (canvas && context.Input) {
            detachPointer = attachPointerEvents(canvas, context.Input);
        }

        const factory = resolveFactory(mod);
        if (!factory) {
            throw new Error('anim module missing create()');
        }

        const instance = factory(runtimeApi);
        const onInit = instance && (instance.OnInit || instance.onInit);
        const onUpdate = instance && (instance.OnUpdate || instance.onUpdate);
        const onRender = instance && (instance.OnRender || instance.onRender);
        const onDispose = instance && (instance.OnDispose || instance.onDispose);

        let running = false;
        let rafId = null;
        let lastTime = 0;

        function tick(ts) {
            if (!running) return;
            const time = (ts || 0) * 0.001;
            const dt = lastTime ? (time - lastTime) : 0;
            lastTime = time;
            context.Time = time;
            if (canvas && ctx && opts.stage) {
                const size = updateCanvasSize(canvas, opts.stage);
                context.Width = size.width;
                context.Height = size.height;
            }
            applyControlState(context.Input, controlState);
            if (onUpdate) onUpdate.call(instance, dt);
            if (onRender) onRender.call(instance, canvasApi);
            resetInputEdges(context.Input);
            if (typeof requestAnimationFrame === 'function') {
                rafId = requestAnimationFrame(tick);
            }
        }

        function start() {
            if (running) return;
            running = true;
            if (onInit) onInit.call(instance, context);
            if (typeof requestAnimationFrame === 'function') {
                rafId = requestAnimationFrame(tick);
            } else {
                tick(0);
            }
        }

        function stop() {
            running = false;
            if (rafId && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(rafId);
            }
            if (onDispose) onDispose.call(instance);
            if (detachPointer) detachPointer();
        }

        return {
            instance,
            context,
            canvas,
            ctx,
            start,
            stop
        };
    }

    async function runModule(mod, options) {
        const player = createPlayer(mod, options || {});
        if (!options || options.autoStart !== false) {
            player.start();
        }
        return player;
    }

    function disposeEmbed(embed) {
        const state = embed.__ANIMCS_STATE;
        embed.__ANIMCS_STATE = null;
        if (state && state.player) {
            state.player.stop();
        }
        if (embed.__ANIMCS_STAGE) {
            embed.__ANIMCS_STAGE.replaceChildren();
        }
    }

    async function mountEmbed(embed, srcOverride) {
        if (!embed) return;
        const rawSource = String(srcOverride || embed.getAttribute('data-animcs-src') || '').trim();
        if (!rawSource) {
            clearError(embed);
            disposeEmbed(embed);
            embed.__ANIMCS_LAST_SRC = '';
            return;
        }
        if (embed.__ANIMCS_MOUNTING) {
            embed.__ANIMCS_PENDING_RESTART = true;
            return;
        }
        embed.__ANIMCS_MOUNTING = true;
        embed.__ANIMCS_LAST_SRC = rawSource;
        const normalized = normalizeAnimPath(rawSource);
        applyEmbedDefaults(embed, normalized);
        ensureEmbedShell(embed, normalized || rawSource || 'C# 动画');
        clearError(embed);
        disposeEmbed(embed);

        try {
            const custom = await resolveCustomEntry(embed, normalized, rawSource);
            let entry = custom && custom.entry ? custom.entry : null;
            let moduleUrl = custom && typeof custom.moduleUrl === 'string' ? String(custom.moduleUrl).trim() : '';

            if (!moduleUrl) {
                let manifest = null;
                let manifestError = null;
                try {
                    manifest = await loadManifest();
                } catch (e) {
                    manifestError = e;
                }

                if (!entry) {
                    entry = resolveEntryForSource(manifest, normalized);
                }

                if (!entry) {
                    if (manifestError) {
                        throw manifestError;
                    }
                    throw new Error(`未找到动画条目：${normalized || rawSource}`);
                }

                moduleUrl = resolveAnimModulePath(entry);
            }

            if (!moduleUrl) {
                throw new Error(`动画缺少 JS 产物：${normalized}`);
            }
            const stage = embed.__ANIMCS_STAGE;
            if (!stage) {
                throw new Error('动画容器缺失');
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'animts-ai-canvas';
            stage.replaceChildren(canvas);
            const size = updateCanvasSize(canvas, stage);

            const mod = await import(moduleUrl);
            const controlState = embed.__ANIMCS_CONTROL_STATE || null;
            const player = await runModule(mod, {
                canvas,
                stage,
                width: size.width,
                height: size.height,
                controlState,
                autoStart: true
            });

            const state = { canvas, stage, player };
            embed.__ANIMCS_STATE = state;

            if (embed.__ANIMCS_BTN_RESTART) {
                embed.__ANIMCS_BTN_RESTART.onclick = function () {
                    mountEmbed(embed, normalized);
                };
            }
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
            const rawSource = String(embed.getAttribute('data-animcs-src') || '').trim();
            if (!rawSource) {
                clearError(embed);
                disposeEmbed(embed);
                embed.__ANIMCS_AUTO_MOUNTED = false;
                embed.__ANIMCS_LAST_SRC = '';
                return;
            }

            if (embed.__ANIMCS_AUTO_MOUNTED && embed.__ANIMCS_LAST_SRC === rawSource) return;

            embed.__ANIMCS_AUTO_MOUNTED = true;
            embed.__ANIMCS_LAST_SRC = rawSource;
            mountEmbed(embed, rawSource);
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
        resolveEntryForSource,
        resolveAnimModulePath,
        createPlayer,
        runModule,
        mountEmbed,
        mountEmbeds,
        initEmbeds
    };
}));
