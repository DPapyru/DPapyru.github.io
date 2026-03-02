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
    const globalScope = typeof globalThis !== 'undefined'
        ? globalThis
        : (typeof window !== 'undefined' ? window : null);
    const LEGACY_EOC_MODE_OPTIONS = [
        { value: 0, text: '自动' },
        { value: 1, text: '一阶-徘徊' },
        { value: 2, text: '一阶-冲刺' },
        { value: 3, text: '二阶-变形' },
        { value: 4, text: '二阶-徘徊' },
        { value: 5, text: '二阶-冲刺' }
    ];

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

    function parseModeOptionsDsl(input) {
        const raw = String(input || '').trim();
        if (!raw) return [];
        const result = [];
        raw.split('|').forEach((segment) => {
            const part = String(segment || '').trim();
            if (!part) return;
            const sep = part.indexOf(':');
            if (sep <= 0) return;
            const valueText = part.slice(0, sep).trim();
            const label = part.slice(sep + 1).trim();
            if (!label) return;
            const value = Number(valueText);
            if (!Number.isFinite(value)) return;
            result.push({
                value,
                text: label
            });
        });
        return result;
    }

    function normalizeModeOptions(modeOptions) {
        if (!Array.isArray(modeOptions)) return [];
        const normalized = [];
        modeOptions.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            const value = Number(item.value);
            const text = String(item.text || '').trim();
            if (!Number.isFinite(value) || !text) return;
            normalized.push({ value, text });
        });
        return normalized;
    }

    function normalizeAnimProfile(input) {
        if (!input || typeof input !== 'object') return null;
        const profile = {};

        if (typeof input.controls === 'string') {
            const controls = input.controls.trim();
            if (controls) profile.controls = controls;
        }

        if (input.heightScale != null) {
            const heightScale = Number(input.heightScale);
            if (Number.isFinite(heightScale) && heightScale > 0) {
                profile.heightScale = heightScale;
            }
        }

        let modeOptions = [];
        if (Array.isArray(input.modeOptions)) {
            modeOptions = normalizeModeOptions(input.modeOptions);
        } else if (typeof input.modeOptions === 'string') {
            modeOptions = parseModeOptionsDsl(input.modeOptions);
        }
        if (modeOptions.length) {
            profile.modeOptions = modeOptions;
        }

        return Object.keys(profile).length ? profile : null;
    }

    function parseEmbedProfileData(embed) {
        if (!embed || typeof embed.getAttribute !== 'function') return null;
        const profile = {};

        const controls = String(embed.getAttribute('data-animcs-controls') || '').trim();
        if (controls) profile.controls = controls;

        const heightScale = String(embed.getAttribute('data-animcs-height-scale') || '').trim();
        if (heightScale) profile.heightScale = heightScale;

        const modeOptions = String(embed.getAttribute('data-animcs-mode-options') || '').trim();
        if (modeOptions) profile.modeOptions = modeOptions;

        return Object.keys(profile).length ? profile : null;
    }

    function resolveEmbedProfile(baseProfile, embedProfileData) {
        const base = normalizeAnimProfile(baseProfile) || {};
        const override = normalizeAnimProfile(embedProfileData) || {};
        const merged = {};

        if (base.controls) merged.controls = base.controls;
        if (typeof base.heightScale === 'number') merged.heightScale = base.heightScale;
        if (Array.isArray(base.modeOptions) && base.modeOptions.length) merged.modeOptions = base.modeOptions;

        if (override.controls) merged.controls = override.controls;
        if (typeof override.heightScale === 'number') merged.heightScale = override.heightScale;
        if (Array.isArray(override.modeOptions) && override.modeOptions.length) merged.modeOptions = override.modeOptions;

        return Object.keys(merged).length ? merged : null;
    }

    function normalizeDiagnostics(input) {
        if (!Array.isArray(input)) return [];
        return input.map((entry) => String(entry || '').trim()).filter(Boolean);
    }

    function resolveGlobalEntryResolver() {
        if (typeof globalThis !== 'undefined' && typeof globalThis.__ANIMCS_RESOLVE_ENTRY === 'function') {
            return globalThis.__ANIMCS_RESOLVE_ENTRY;
        }
        if (typeof window !== 'undefined' && typeof window.__ANIMCS_RESOLVE_ENTRY === 'function') {
            return window.__ANIMCS_RESOLVE_ENTRY;
        }
        return null;
    }

    async function resolveCustomEntry(embed, normalized, rawSource) {
        const resolver = embed && typeof embed.__ANIMCS_RESOLVE_ENTRY === 'function'
            ? embed.__ANIMCS_RESOLVE_ENTRY
            : resolveGlobalEntryResolver();
        if (typeof resolver !== 'function') return null;

        return resolver({
            normalized,
            rawSource,
            assetsRoot: getAssetsRoot(),
            embed
        });
    }

    function applyEmbedDefaults(embed, normalized, profile) {
        if (!embed) return;

        const resolvedProfile = normalizeAnimProfile(profile);
        embed.__ANIMCS_PROFILE = resolvedProfile;
        if (resolvedProfile && !embed.getAttribute('data-animcs-controls') && resolvedProfile.controls) {
            embed.setAttribute('data-animcs-controls', resolvedProfile.controls);
        }
        if (resolvedProfile && !embed.getAttribute('data-animcs-height-scale') && typeof resolvedProfile.heightScale === 'number') {
            embed.setAttribute('data-animcs-height-scale', String(resolvedProfile.heightScale));
        }

        if (resolvedProfile && Array.isArray(resolvedProfile.modeOptions) && resolvedProfile.modeOptions.length) {
            embed.__ANIMCS_MODE_OPTIONS = resolvedProfile.modeOptions;
        } else {
            embed.__ANIMCS_MODE_OPTIONS = null;
        }

        if (!normalized) return;
        if (normalized === 'anims/demo-eoc-ai.cs') {
            if (!embed.getAttribute('data-animcs-height-scale')) {
                embed.setAttribute('data-animcs-height-scale', '2.3');
            }
            if (!embed.getAttribute('data-animcs-controls')) {
                embed.setAttribute('data-animcs-controls', 'mode-select');
            }
            if (!embed.__ANIMCS_MODE_OPTIONS || !embed.__ANIMCS_MODE_OPTIONS.length) {
                embed.__ANIMCS_MODE_OPTIONS = LEGACY_EOC_MODE_OPTIONS;
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

    function resolveControlOptions(embed, controlType) {
        if (embed && Array.isArray(embed.__ANIMCS_MODE_OPTIONS) && embed.__ANIMCS_MODE_OPTIONS.length) {
            return embed.__ANIMCS_MODE_OPTIONS;
        }
        if (controlType === 'eoc') return LEGACY_EOC_MODE_OPTIONS;
        return [];
    }

    function ensureControls(embed) {
        if (!embed) return null;
        const controlType = String(embed.getAttribute('data-animcs-controls') || '').trim();
        const header = embed.querySelector('.animts-controls');
        if (!header) return null;
        const existingState = embed.__ANIMCS_CONTROL_STATE || null;

        if (!controlType) {
            if (existingState && existingState.wrapper && existingState.wrapper.parentNode) {
                existingState.wrapper.parentNode.removeChild(existingState.wrapper);
            }
            embed.__ANIMCS_CONTROL_STATE = null;
            return null;
        }

        const options = resolveControlOptions(embed, controlType);
        if (!options.length) {
            if (existingState && existingState.wrapper && existingState.wrapper.parentNode) {
                existingState.wrapper.parentNode.removeChild(existingState.wrapper);
            }
            embed.__ANIMCS_CONTROL_STATE = null;
            return null;
        }

        const signature = `${controlType}|${JSON.stringify(options)}`;
        if (existingState && existingState.signature === signature) {
            return existingState;
        }
        if (existingState && existingState.wrapper && existingState.wrapper.parentNode) {
            existingState.wrapper.parentNode.removeChild(existingState.wrapper);
        }

        const label = document.createElement('span');
        label.className = 'animts-control-label';
        label.textContent = controlType === 'eoc' ? 'AI' : '模式';

        const select = document.createElement('select');
        select.className = 'animts-select';
        options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = String(opt.value);
            option.textContent = opt.text;
            select.appendChild(option);
        });

        const state = { mode: 0, locked: false, signature };
        select.addEventListener('change', () => {
            const value = Number(select.value);
            state.mode = Number.isFinite(value) ? value : 0;
            state.locked = state.mode !== 0;
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'animts-control-group';
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        state.wrapper = wrapper;
        header.insertBefore(wrapper, header.firstChild);
        {
            const value = Number(select.value);
            state.mode = Number.isFinite(value) ? value : 0;
            state.locked = state.mode !== 0;
        }

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

    function Vector2(x, y) {
        this.X = Number(x || 0);
        this.Y = Number(y || 0);
    }

    Vector2.Add = function (a, b) {
        return new Vector2(((a && a.X) || 0) + ((b && b.X) || 0), ((a && a.Y) || 0) + ((b && b.Y) || 0));
    };
    Vector2.Sub = function (a, b) {
        return new Vector2(((a && a.X) || 0) - ((b && b.X) || 0), ((a && a.Y) || 0) - ((b && b.Y) || 0));
    };
    Vector2.MulScalar = function (v, scalar) {
        const s = Number(scalar || 0);
        return new Vector2(((v && v.X) || 0) * s, ((v && v.Y) || 0) * s);
    };
    Vector2.DivScalar = function (v, scalar) {
        const s = Number(scalar || 0);
        if (Math.abs(s) <= 1e-6) return new Vector2(0, 0);
        return new Vector2(((v && v.X) || 0) / s, ((v && v.Y) || 0) / s);
    };

    function Vector3(x, y, z) {
        this.X = Number(x || 0);
        this.Y = Number(y || 0);
        this.Z = Number(z || 0);
    }

    Vector3.Add = function (a, b) {
        return new Vector3(
            ((a && a.X) || 0) + ((b && b.X) || 0),
            ((a && a.Y) || 0) + ((b && b.Y) || 0),
            ((a && a.Z) || 0) + ((b && b.Z) || 0)
        );
    };
    Vector3.Sub = function (a, b) {
        return new Vector3(
            ((a && a.X) || 0) - ((b && b.X) || 0),
            ((a && a.Y) || 0) - ((b && b.Y) || 0),
            ((a && a.Z) || 0) - ((b && b.Z) || 0)
        );
    };
    Vector3.MulScalar = function (v, scalar) {
        const s = Number(scalar || 0);
        return new Vector3(((v && v.X) || 0) * s, ((v && v.Y) || 0) * s, ((v && v.Z) || 0) * s);
    };
    Vector3.DivScalar = function (v, scalar) {
        const s = Number(scalar || 0);
        if (Math.abs(s) <= 1e-6) return new Vector3(0, 0, 0);
        return new Vector3(((v && v.X) || 0) / s, ((v && v.Y) || 0) / s, ((v && v.Z) || 0) / s);
    };
    Vector3.Length = function (v) {
        const x = (v && v.X) || 0;
        const y = (v && v.Y) || 0;
        const z = (v && v.Z) || 0;
        return Math.sqrt(x * x + y * y + z * z);
    };
    Vector3.Normalize = function (v) {
        const len = Vector3.Length(v);
        if (len <= 1e-6) return new Vector3(0, 0, 0);
        return Vector3.DivScalar(v, len);
    };
    Vector3.prototype.Length = function () {
        return Vector3.Length(this);
    };
    Vector3.prototype.Normalize = function () {
        return Vector3.Normalize(this);
    };

    function Matrix(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    ) {
        this.M00 = Number(m00 == null ? 1 : m00);
        this.M01 = Number(m01 || 0);
        this.M02 = Number(m02 || 0);
        this.M03 = Number(m03 || 0);
        this.M10 = Number(m10 || 0);
        this.M11 = Number(m11 == null ? 1 : m11);
        this.M12 = Number(m12 || 0);
        this.M13 = Number(m13 || 0);
        this.M20 = Number(m20 || 0);
        this.M21 = Number(m21 || 0);
        this.M22 = Number(m22 == null ? 1 : m22);
        this.M23 = Number(m23 || 0);
        this.M30 = Number(m30 || 0);
        this.M31 = Number(m31 || 0);
        this.M32 = Number(m32 || 0);
        this.M33 = Number(m33 == null ? 1 : m33);
    }

    function createIdentityMatrix() {
        return new Matrix(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }
    Object.defineProperty(Matrix, 'Identity', {
        get: function () {
            return createIdentityMatrix();
        }
    });
    Matrix.CreateTranslation = function (x, y, z) {
        return new Matrix(
            1, 0, 0, Number(x || 0),
            0, 1, 0, Number(y || 0),
            0, 0, 1, Number(z || 0),
            0, 0, 0, 1
        );
    };
    Matrix.CreateScale = function (x, y, z) {
        return new Matrix(
            Number(x || 0), 0, 0, 0,
            0, Number(y || 0), 0, 0,
            0, 0, Number(z || 0), 0,
            0, 0, 0, 1
        );
    };
    Matrix.CreateRotationX = function (radians) {
        const c = Math.cos(Number(radians || 0));
        const s = Math.sin(Number(radians || 0));
        return new Matrix(
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        );
    };
    Matrix.CreateRotationY = function (radians) {
        const c = Math.cos(Number(radians || 0));
        const s = Math.sin(Number(radians || 0));
        return new Matrix(
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        );
    };
    Matrix.CreateRotationZ = function (radians) {
        const c = Math.cos(Number(radians || 0));
        const s = Math.sin(Number(radians || 0));
        return new Matrix(
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    };
    Matrix.CreatePerspectiveFieldOfView = function (fov, aspect, near, far) {
        const f = 1 / Math.tan(Number(fov || 0) * 0.5);
        const a = Number(aspect || 1);
        const n = Number(near || 0.1);
        const fr = Number(far || 1000);
        return new Matrix(
            f / a, 0, 0, 0,
            0, f, 0, 0,
            0, 0, fr / (n - fr), (fr * n) / (n - fr),
            0, 0, -1, 0
        );
    };
    Matrix.Multiply = function (a, b) {
        return new Matrix(
            a.M00 * b.M00 + a.M01 * b.M10 + a.M02 * b.M20 + a.M03 * b.M30,
            a.M00 * b.M01 + a.M01 * b.M11 + a.M02 * b.M21 + a.M03 * b.M31,
            a.M00 * b.M02 + a.M01 * b.M12 + a.M02 * b.M22 + a.M03 * b.M32,
            a.M00 * b.M03 + a.M01 * b.M13 + a.M02 * b.M23 + a.M03 * b.M33,

            a.M10 * b.M00 + a.M11 * b.M10 + a.M12 * b.M20 + a.M13 * b.M30,
            a.M10 * b.M01 + a.M11 * b.M11 + a.M12 * b.M21 + a.M13 * b.M31,
            a.M10 * b.M02 + a.M11 * b.M12 + a.M12 * b.M22 + a.M13 * b.M32,
            a.M10 * b.M03 + a.M11 * b.M13 + a.M12 * b.M23 + a.M13 * b.M33,

            a.M20 * b.M00 + a.M21 * b.M10 + a.M22 * b.M20 + a.M23 * b.M30,
            a.M20 * b.M01 + a.M21 * b.M11 + a.M22 * b.M21 + a.M23 * b.M31,
            a.M20 * b.M02 + a.M21 * b.M12 + a.M22 * b.M22 + a.M23 * b.M32,
            a.M20 * b.M03 + a.M21 * b.M13 + a.M22 * b.M23 + a.M23 * b.M33,

            a.M30 * b.M00 + a.M31 * b.M10 + a.M32 * b.M20 + a.M33 * b.M30,
            a.M30 * b.M01 + a.M31 * b.M11 + a.M32 * b.M21 + a.M33 * b.M31,
            a.M30 * b.M02 + a.M31 * b.M12 + a.M32 * b.M22 + a.M33 * b.M32,
            a.M30 * b.M03 + a.M31 * b.M13 + a.M32 * b.M23 + a.M33 * b.M33
        );
    };
    Matrix.TransformVector2 = function (m, v) {
        const x = m.M00 * v.X + m.M01 * v.Y + m.M03;
        const y = m.M10 * v.X + m.M11 * v.Y + m.M13;
        const w = m.M30 * v.X + m.M31 * v.Y + m.M33;
        if (Math.abs(w) > 1e-6 && Math.abs(w - 1) > 1e-6) {
            return new Vector2(x / w, y / w);
        }
        return new Vector2(x, y);
    };
    Matrix.TransformVector3 = function (m, v) {
        const x = m.M00 * v.X + m.M01 * v.Y + m.M02 * v.Z + m.M03;
        const y = m.M10 * v.X + m.M11 * v.Y + m.M12 * v.Z + m.M13;
        const z = m.M20 * v.X + m.M21 * v.Y + m.M22 * v.Z + m.M23;
        const w = m.M30 * v.X + m.M31 * v.Y + m.M32 * v.Z + m.M33;
        if (Math.abs(w) > 1e-6 && Math.abs(w - 1) > 1e-6) {
            return new Vector3(x / w, y / w, z / w);
        }
        return new Vector3(x, y, z);
    };
    Matrix.Translation = Matrix.CreateTranslation;
    Matrix.Scale = Matrix.CreateScale;
    Matrix.RotationX = Matrix.CreateRotationX;
    Matrix.RotationY = Matrix.CreateRotationY;
    Matrix.RotationZ = Matrix.CreateRotationZ;
    Matrix.PerspectiveFovRh = Matrix.CreatePerspectiveFieldOfView;
    Matrix.Mul = Matrix.Multiply;
    Matrix.MulVec2 = Matrix.TransformVector2;
    Matrix.MulVec3 = Matrix.TransformVector3;

    function Color(r, g, b, a) {
        this.R = Math.round(Number(r || 0));
        this.G = Math.round(Number(g || 0));
        this.B = Math.round(Number(b || 0));
        this.A = a == null ? 255 : Math.round(Number(a));
    }

    function VertexPositionColorTexture(position, color, textureCoordinate) {
        const pos = position || {};
        const col = color || {};
        const uv = textureCoordinate || {};
        this.Position = new Vector3(
            Number(pos.X || 0),
            Number(pos.Y || 0),
            Number(pos.Z || 0)
        );
        this.Color = new Color(
            Number(col.R == null ? 255 : col.R),
            Number(col.G == null ? 255 : col.G),
            Number(col.B == null ? 255 : col.B),
            Number(col.A == null ? 255 : col.A)
        );
        this.TextureCoordinate = new Vector2(
            Number(uv.X == null ? uv.U : uv.X) || 0,
            Number(uv.Y == null ? uv.V : uv.Y) || 0
        );
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
            ModeLocked: false,
            WheelDelta: 0
        };
    }

    function resetInputEdges(input) {
        if (!input) return;
        input.WasPressed = false;
        input.WasReleased = false;
        input.DeltaX = 0;
        input.DeltaY = 0;
        input.WheelDelta = 0;
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
        const onWheel = (event) => {
            if (!event) return;
            const delta = typeof event.deltaY === 'number' ? event.deltaY : 0;
            input.WheelDelta += -delta * 0.01;
            if (event.preventDefault) event.preventDefault();
        };

        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointerenter', onEnter);
        canvas.addEventListener('pointerleave', onLeave);
        canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            canvas.removeEventListener('pointerdown', onDown);
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('pointerenter', onEnter);
            canvas.removeEventListener('pointerleave', onLeave);
            canvas.removeEventListener('wheel', onWheel);
        };
    }

    const MathF = {
        Sin: Math.sin,
        Cos: Math.cos,
        Tan: Math.tan,
        Min: Math.min,
        Max: Math.max,
        Sqrt: Math.sqrt,
        Abs: Math.abs,
        Round: Math.round
    };

    const PrimitiveType = Object.freeze({
        TriangleList: 0
    });

    const BlendState = Object.freeze({
        AlphaBlend: 0,
        Additive: 1,
        Opaque: 2
    });

    const DEFAULT_MESH_VERTEX_SOURCE = [
        '#version 300 es',
        'precision highp float;',
        'layout(location = 0) in vec3 aPosition;',
        'layout(location = 1) in vec4 aColor;',
        'layout(location = 2) in vec2 aTexCoord;',
        'out vec4 vColor;',
        'out vec2 vUv;',
        'uniform vec2 uResolution;',
        'void main() {',
        '    vec2 safeResolution = max(uResolution, vec2(1.0));',
        '    vec2 clipPos = vec2(',
        '        (aPosition.x / safeResolution.x) * 2.0 - 1.0,',
        '        1.0 - (aPosition.y / safeResolution.y) * 2.0',
        '    );',
        '    gl_Position = vec4(clipPos, aPosition.z, 1.0);',
        '    vColor = aColor;',
        '    vUv = vec2(aTexCoord.x, 1.0 - aTexCoord.y);',
        '}',
        ''
    ].join('\n');

    const DEFAULT_MESH_FRAGMENT_SOURCE = [
        '#version 300 es',
        'precision highp float;',
        'in vec4 vColor;',
        'in vec2 vUv;',
        'out vec4 fragColor;',
        'uniform sampler2D iChannel0;',
        'void main() {',
        '    vec4 base = texture(iChannel0, vec2(vUv.x, 1.0 - vUv.y));',
        '    fragColor = base * vColor;',
        '}',
        ''
    ].join('\n');

    function colorToRgba(color) {
        if (!color) return 'rgba(0,0,0,1)';
        const a = typeof color.A === 'number' ? color.A : 255;
        return `rgba(${color.R || 0}, ${color.G || 0}, ${color.B || 0}, ${a / 255})`;
    }

    function clamp01(value) {
        return Math.max(0, Math.min(1, Number(value || 0)));
    }

    function normalizeBlendState(mode) {
        const raw = Number(mode);
        if (raw === BlendState.Additive) return BlendState.Additive;
        if (raw === BlendState.Opaque) return BlendState.Opaque;
        return BlendState.AlphaBlend;
    }

    function normalizeContentPath(input, expectedExtRe) {
        let value = String(input || '').trim().replace(/\\/g, '/');
        if (!value) return '';
        value = value.replace(/^https?:\/\/[^/]+/i, '');
        value = value.replace(/^\/+/, '');
        value = value.replace(/^site\/content\//i, '');
        value = value.replace(/^content\//i, '');
        value = value.replace(/\/{2,}/g, '/');
        if (!/^anims\//i.test(value)) return '';
        if (/(^|\/)\.\.(\/|$)/.test(value)) return '';
        if (expectedExtRe && !expectedExtRe.test(value)) return '';
        return value;
    }

    function toContentFetchUrl(path) {
        return `/site/content/${String(path || '').replace(/^\/+/, '')}`;
    }

    function resolveShaderAdapter() {
        if (globalScope && globalScope.ShaderHlslAdapter) {
            return globalScope.ShaderHlslAdapter;
        }
        if (typeof module !== 'undefined' && module.exports) {
            try {
                return require('../../../tml-ide/subapps/assets/js/shader-hlsl-adapter.js');
            } catch (_error) {
                return null;
            }
        }
        return null;
    }

    function resolveTextureSlotIndex(slot) {
        const n = Math.floor(Number(slot));
        if (!Number.isFinite(n) || n < 0 || n > 3) return -1;
        return n;
    }

    function createMeshState() {
        const textureSlots = [];
        for (let i = 0; i < 4; i += 1) {
            textureSlots.push({
                path: '',
                image: null,
                promise: null,
                error: ''
            });
        }

        return {
            adapter: resolveShaderAdapter(),
            effectPath: '',
            effectSource: '',
            effectPromise: null,
            effectError: '',
            blendState: BlendState.AlphaBlend,
            floatUniforms: Object.create(null),
            vec2Uniforms: Object.create(null),
            colorUniforms: Object.create(null),
            textureSlots: textureSlots,
            glState: null,
            frame: 0
        };
    }

    function ensureGlState(meshState, canvas) {
        if (!meshState || !canvas) return null;
        if (meshState.glState && meshState.glState.failed) return null;
        if (meshState.glState && meshState.glState.gl) {
            const state = meshState.glState;
            const w = Math.max(1, Number(canvas.width || 1));
            const h = Math.max(1, Number(canvas.height || 1));
            if (state.glCanvas.width !== w) state.glCanvas.width = w;
            if (state.glCanvas.height !== h) state.glCanvas.height = h;
            return state;
        }
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
            meshState.glState = { failed: true };
            return null;
        }

        const glCanvas = document.createElement('canvas');
        glCanvas.width = Math.max(1, Number(canvas.width || 1));
        glCanvas.height = Math.max(1, Number(canvas.height || 1));
        const gl = glCanvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        if (!gl) {
            meshState.glState = { failed: true };
            return null;
        }

        const vao = gl.createVertexArray();
        const vbo = gl.createBuffer();
        const ibo = gl.createBuffer();
        if (!vao || !vbo || !ibo) {
            meshState.glState = { failed: true };
            return null;
        }

        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 28);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        const whiteTexture = gl.createTexture();
        if (!whiteTexture) {
            meshState.glState = { failed: true };
            return null;
        }
        gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.bindTexture(gl.TEXTURE_2D, null);

        meshState.glState = {
            glCanvas,
            gl,
            vao,
            vbo,
            ibo,
            whiteTexture,
            textureCache: new Map(),
            programCache: new Map()
        };
        return meshState.glState;
    }

    function compileProgram(gl, vertexSource, fragmentSource) {
        const compileShader = (type, source) => {
            const shader = gl.createShader(type);
            if (!shader) return { ok: false, error: 'createShader failed' };
            gl.shaderSource(shader, String(source || ''));
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const log = gl.getShaderInfoLog(shader) || 'shader compile failed';
                gl.deleteShader(shader);
                return { ok: false, error: log };
            }
            return { ok: true, shader };
        };

        const vs = compileShader(gl.VERTEX_SHADER, vertexSource);
        if (!vs.ok) return { ok: false, error: `VS: ${vs.error}` };
        const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        if (!fs.ok) {
            gl.deleteShader(vs.shader);
            return { ok: false, error: `PS: ${fs.error}` };
        }

        const program = gl.createProgram();
        if (!program) {
            gl.deleteShader(vs.shader);
            gl.deleteShader(fs.shader);
            return { ok: false, error: 'createProgram failed' };
        }

        gl.attachShader(program, vs.shader);
        gl.attachShader(program, fs.shader);
        gl.linkProgram(program);
        gl.deleteShader(vs.shader);
        gl.deleteShader(fs.shader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(program) || 'program link failed';
            gl.deleteProgram(program);
            return { ok: false, error: log };
        }

        return { ok: true, program };
    }

    function loadTextureImage(slot, path) {
        if (!slot || !path) return;
        if (slot.path === path && (slot.image || slot.promise)) return;
        slot.path = path;
        slot.image = null;
        slot.error = '';
        slot.promise = null;
        if (typeof Image === 'undefined') {
            slot.error = 'Image API unavailable';
            return;
        }

        slot.promise = new Promise((resolve) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                slot.image = image;
                slot.error = '';
                slot.promise = null;
                resolve(image);
            };
            image.onerror = () => {
                slot.image = null;
                slot.error = 'texture load failed';
                slot.promise = null;
                resolve(null);
            };
            image.src = toContentFetchUrl(path);
        });
    }

    function requestEffectSource(meshState) {
        if (!meshState || !meshState.effectPath) return;
        if (meshState.effectPromise) return;
        if (meshState.effectSource) return;
        if (typeof fetch !== 'function') {
            meshState.effectError = 'fetch API unavailable';
            return;
        }

        const targetPath = meshState.effectPath;
        meshState.effectPromise = fetch(toContentFetchUrl(targetPath), { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .then((text) => {
                if (meshState.effectPath !== targetPath) return;
                meshState.effectSource = String(text || '');
                meshState.effectError = '';
            })
            .catch((error) => {
                if (meshState.effectPath !== targetPath) return;
                meshState.effectError = String(error && error.message || error);
                meshState.effectSource = '';
            })
            .finally(() => {
                if (meshState.effectPath === targetPath) {
                    meshState.effectPromise = null;
                }
            });
    }

    function createCanvasApi(canvas, ctx, renderState) {
        const runtimeState = renderState && typeof renderState === 'object' ? renderState : { time: 0, delta: 0, frame: 0 };
        const meshState = createMeshState();

        function resolveProgram(glState) {
            const gl = glState.gl;
            if (!meshState.effectPath) {
                const key = '__default__';
                if (glState.programCache.has(key)) return glState.programCache.get(key);
                const compiled = compileProgram(gl, DEFAULT_MESH_VERTEX_SOURCE, DEFAULT_MESH_FRAGMENT_SOURCE);
                if (!compiled.ok) {
                    meshState.effectError = compiled.error;
                    return null;
                }
                const record = {
                    program: compiled.program,
                    uniformCache: Object.create(null)
                };
                glState.programCache.set(key, record);
                return record;
            }

            if (!meshState.effectSource && !meshState.effectError) {
                requestEffectSource(meshState);
                return null;
            }
            if (!meshState.effectSource) {
                return null;
            }
            const key = `${meshState.effectPath}:${meshState.effectSource.length}`;
            if (glState.programCache.has(key)) return glState.programCache.get(key);

            const adapter = meshState.adapter;
            if (!adapter || typeof adapter.buildProgramSource !== 'function') {
                meshState.effectError = 'shader adapter unavailable';
                return null;
            }
            const built = adapter.buildProgramSource(meshState.effectSource, {
                vertexEntry: 'MainVS'
            });
            if (!built || built.ok !== true) {
                meshState.effectError = String(built && built.error ? built.error : 'buildProgramSource failed');
                return null;
            }
            const compiled = compileProgram(gl, built.vertexSource || '', built.fragmentSource || '');
            if (!compiled.ok) {
                meshState.effectError = compiled.error;
                return null;
            }
            const record = {
                program: compiled.program,
                uniformCache: Object.create(null)
            };
            glState.programCache.set(key, record);
            meshState.effectError = '';
            return record;
        }

        function applyBlendFor2d(mode) {
            if (!ctx) return;
            const safe = normalizeBlendState(mode);
            if (safe === BlendState.Additive) {
                ctx.globalCompositeOperation = 'lighter';
                return;
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        function drawMeshFallback(vertices, vertexOffset, numVertices, indices, indexOffset, primitiveCount) {
            if (!ctx) return false;
            if (!Array.isArray(vertices) || !Array.isArray(indices)) return false;
            if (primitiveCount <= 0) return false;
            const startVertex = Math.max(0, Math.floor(Number(vertexOffset) || 0));
            const countVertex = Math.max(0, Math.floor(Number(numVertices) || 0));
            const startIndex = Math.max(0, Math.floor(Number(indexOffset) || 0));
            const need = primitiveCount * 3;
            if (countVertex <= 0 || need <= 0) return false;
            if ((startVertex + countVertex) > vertices.length) return false;
            if ((startIndex + need) > indices.length) return false;

            ctx.save();
            applyBlendFor2d(meshState.blendState);
            for (let tri = 0; tri < primitiveCount; tri += 1) {
                const i0 = Number(indices[startIndex + tri * 3]) - startVertex;
                const i1 = Number(indices[startIndex + tri * 3 + 1]) - startVertex;
                const i2 = Number(indices[startIndex + tri * 3 + 2]) - startVertex;
                if (i0 < 0 || i1 < 0 || i2 < 0 || i0 >= countVertex || i1 >= countVertex || i2 >= countVertex) continue;
                const v0 = vertices[startVertex + i0];
                const v1 = vertices[startVertex + i1];
                const v2 = vertices[startVertex + i2];
                if (!v0 || !v1 || !v2) continue;
                const c0 = v0.Color || {};
                const c1 = v1.Color || {};
                const c2 = v2.Color || {};
                const r = Math.round((((c0.R || 0) + (c1.R || 0) + (c2.R || 0)) / 3));
                const g = Math.round((((c0.G || 0) + (c1.G || 0) + (c2.G || 0)) / 3));
                const b = Math.round((((c0.B || 0) + (c1.B || 0) + (c2.B || 0)) / 3));
                const a = (((c0.A == null ? 255 : c0.A) + (c1.A == null ? 255 : c1.A) + (c2.A == null ? 255 : c2.A)) / 3) / 255;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${clamp01(a)})`;
                ctx.beginPath();
                ctx.moveTo(Number(v0.Position && v0.Position.X || 0), Number(v0.Position && v0.Position.Y || 0));
                ctx.lineTo(Number(v1.Position && v1.Position.X || 0), Number(v1.Position && v1.Position.Y || 0));
                ctx.lineTo(Number(v2.Position && v2.Position.X || 0), Number(v2.Position && v2.Position.Y || 0));
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            return true;
        }

        function drawMeshWebGl(vertices, vertexOffset, numVertices, indices, indexOffset, primitiveCount) {
            const glState = ensureGlState(meshState, canvas);
            if (!glState) return false;
            const gl = glState.gl;
            const programRecord = resolveProgram(glState);
            if (!programRecord || !programRecord.program) return false;
            if (!Array.isArray(vertices) || !Array.isArray(indices)) return false;
            const startVertex = Math.max(0, Math.floor(Number(vertexOffset) || 0));
            const countVertex = Math.max(0, Math.floor(Number(numVertices) || 0));
            const startIndex = Math.max(0, Math.floor(Number(indexOffset) || 0));
            const need = primitiveCount * 3;
            if (primitiveCount <= 0 || countVertex <= 0) return false;
            if ((startVertex + countVertex) > vertices.length) return false;
            if ((startIndex + need) > indices.length) return false;

            const packed = new Float32Array(countVertex * 9);
            for (let i = 0; i < countVertex; i += 1) {
                const vertex = vertices[startVertex + i] || {};
                const pos = vertex.Position || {};
                const col = vertex.Color || {};
                const uv = vertex.TextureCoordinate || {};
                const base = i * 9;
                packed[base] = Number(pos.X || 0);
                packed[base + 1] = Number(pos.Y || 0);
                packed[base + 2] = Number(pos.Z || 0);
                packed[base + 3] = clamp01((col.R == null ? 255 : col.R) / 255);
                packed[base + 4] = clamp01((col.G == null ? 255 : col.G) / 255);
                packed[base + 5] = clamp01((col.B == null ? 255 : col.B) / 255);
                packed[base + 6] = clamp01((col.A == null ? 255 : col.A) / 255);
                packed[base + 7] = Number(uv.X == null ? uv.U : uv.X) || 0;
                packed[base + 8] = Number(uv.Y == null ? uv.V : uv.Y) || 0;
            }

            const maxIndex = countVertex - 1;
            const logical = [];
            for (let i = 0; i < need; i += 1) {
                const value = Math.floor(Number(indices[startIndex + i]) - startVertex);
                if (!Number.isFinite(value) || value < 0 || value > maxIndex) {
                    return false;
                }
                logical.push(value);
            }
            const useUint32 = logical.some((item) => item > 65535);
            const indexArray = useUint32 ? new Uint32Array(logical) : new Uint16Array(logical);

            gl.viewport(0, 0, glState.glCanvas.width, glState.glCanvas.height);
            if (meshState.blendState === BlendState.Opaque) {
                gl.disable(gl.BLEND);
            } else {
                gl.enable(gl.BLEND);
                if (meshState.blendState === BlendState.Additive) {
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.SRC_ALPHA, gl.ONE);
                } else {
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                }
            }
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(programRecord.program);
            gl.bindVertexArray(glState.vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, glState.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, packed, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glState.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.DYNAMIC_DRAW);

            const uniformCache = programRecord.uniformCache;
            const getUniform = (name) => {
                if (Object.prototype.hasOwnProperty.call(uniformCache, name)) return uniformCache[name];
                uniformCache[name] = gl.getUniformLocation(programRecord.program, name);
                return uniformCache[name];
            };

            const setUniform1f = (name, value) => {
                const loc = getUniform(name);
                if (loc != null) gl.uniform1f(loc, Number(value || 0));
            };
            const setUniform2f = (name, x, y) => {
                const loc = getUniform(name);
                if (loc != null) gl.uniform2f(loc, Number(x || 0), Number(y || 0));
            };
            const setUniform4f = (name, x, y, z, w) => {
                const loc = getUniform(name);
                if (loc != null) gl.uniform4f(loc, Number(x || 0), Number(y || 0), Number(z || 0), Number(w || 0));
            };

            const width = Number(canvas && canvas.width || 1);
            const height = Number(canvas && canvas.height || 1);
            setUniform2f('uResolution', width, height);
            setUniform1f('uTime', runtimeState.time || 0);
            setUniform1f('iTime', runtimeState.time || 0);
            setUniform1f('iTimeDelta', runtimeState.delta || 0);
            const frameValue = Math.max(0, Math.floor(runtimeState.frame || meshState.frame || 0));
            const frameLoc = getUniform('iFrame');
            if (frameLoc != null) gl.uniform1i(frameLoc, frameValue);
            const iResolutionLoc = getUniform('iResolution');
            if (iResolutionLoc != null) gl.uniform3f(iResolutionLoc, width, height, 1);
            setUniform4f('iMouse', 0, 0, 0, 0);
            const now = new Date();
            setUniform4f('iDate', now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());

            const channelTimeLoc = getUniform('iChannelTime');
            if (channelTimeLoc != null) {
                const t = Number(runtimeState.time || 0);
                gl.uniform1fv(channelTimeLoc, new Float32Array([t, t, t, t]));
            }

            const channelResolutionLoc = getUniform('iChannelResolution');
            const channelResolution = new Float32Array(12);
            for (let i = 0; i < 4; i += 1) {
                channelResolution[i * 3] = 1;
                channelResolution[i * 3 + 1] = 1;
                channelResolution[i * 3 + 2] = 1;
            }

            for (let slot = 0; slot < 4; slot += 1) {
                const slotState = meshState.textureSlots[slot];
                let texture = glState.whiteTexture;
                if (slotState && slotState.image) {
                    const key = slotState.path;
                    let cached = glState.textureCache.get(key);
                    if (!cached) {
                        const tex = gl.createTexture();
                        if (tex) {
                            gl.bindTexture(gl.TEXTURE_2D, tex);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, slotState.image);
                            gl.bindTexture(gl.TEXTURE_2D, null);
                            cached = {
                                texture: tex,
                                width: Number(slotState.image.width || 1),
                                height: Number(slotState.image.height || 1)
                            };
                            glState.textureCache.set(key, cached);
                        }
                    }
                    if (cached && cached.texture) {
                        texture = cached.texture;
                        channelResolution[slot * 3] = cached.width;
                        channelResolution[slot * 3 + 1] = cached.height;
                    }
                }

                gl.activeTexture(gl.TEXTURE0 + slot);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                const loc = getUniform(`iChannel${slot}`);
                if (loc != null) gl.uniform1i(loc, slot);
            }

            if (channelResolutionLoc != null) {
                gl.uniform3fv(channelResolutionLoc, channelResolution);
            }

            Object.keys(meshState.floatUniforms).forEach((name) => {
                setUniform1f(name, meshState.floatUniforms[name]);
            });
            Object.keys(meshState.vec2Uniforms).forEach((name) => {
                const value = meshState.vec2Uniforms[name] || { X: 0, Y: 0 };
                setUniform2f(name, value.X, value.Y);
            });
            Object.keys(meshState.colorUniforms).forEach((name) => {
                const value = meshState.colorUniforms[name] || { R: 255, G: 255, B: 255, A: 255 };
                setUniform4f(
                    name,
                    clamp01((value.R == null ? 255 : value.R) / 255),
                    clamp01((value.G == null ? 255 : value.G) / 255),
                    clamp01((value.B == null ? 255 : value.B) / 255),
                    clamp01((value.A == null ? 255 : value.A) / 255)
                );
            });

            gl.drawElements(gl.TRIANGLES, logical.length, useUint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
            gl.useProgram(null);

            if (ctx) {
                ctx.save();
                applyBlendFor2d(meshState.blendState);
                ctx.drawImage(glState.glCanvas, 0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
            meshState.frame += 1;
            return true;
        }

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
            },
            Text: function (text, position, color, size) {
                if (!ctx || !position) return;
                const textValue = String(text == null ? '' : text);
                const fontSize = Number(size == null ? 12 : size);
                ctx.save();
                ctx.fillStyle = colorToRgba(color);
                ctx.font = `${Math.max(1, fontSize)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
                ctx.textBaseline = 'top';
                ctx.fillText(textValue, Number(position.X || 0), Number(position.Y || 0));
                ctx.restore();
            },
            UseEffect: function (shaderPath) {
                const normalized = normalizeContentPath(shaderPath, /\.fx$/i);
                meshState.effectPath = normalized;
                meshState.effectSource = '';
                meshState.effectError = '';
                meshState.effectPromise = null;
                if (normalized) {
                    requestEffectSource(meshState);
                }
            },
            ClearEffect: function () {
                meshState.effectPath = '';
                meshState.effectSource = '';
                meshState.effectError = '';
                meshState.effectPromise = null;
            },
            SetBlendState: function (mode) {
                meshState.blendState = normalizeBlendState(mode);
            },
            SetBlendMode: function (mode) {
                meshState.blendState = normalizeBlendState(mode);
            },
            SetTexture: function (slot, texturePath) {
                const index = resolveTextureSlotIndex(slot);
                if (index < 0) return;
                const normalized = normalizeContentPath(texturePath, /\.(?:png|jpe?g|gif|webp|bmp|avif|svg)$/i);
                const slotState = meshState.textureSlots[index];
                if (!normalized) {
                    slotState.path = '';
                    slotState.image = null;
                    slotState.promise = null;
                    slotState.error = '';
                    return;
                }
                loadTextureImage(slotState, normalized);
            },
            SetFloat: function (name, value) {
                const key = String(name || '').trim();
                if (!key) return;
                meshState.floatUniforms[key] = Number(value || 0);
            },
            SetVector2: function (name, value) {
                const key = String(name || '').trim();
                if (!key) return;
                const safe = value || {};
                meshState.vec2Uniforms[key] = {
                    X: Number(safe.X || 0),
                    Y: Number(safe.Y || 0)
                };
            },
            SetVec2: function (name, value) {
                const key = String(name || '').trim();
                if (!key) return;
                const safe = value || {};
                meshState.vec2Uniforms[key] = {
                    X: Number(safe.X || 0),
                    Y: Number(safe.Y || 0)
                };
            },
            SetColor: function (name, value) {
                const key = String(name || '').trim();
                if (!key) return;
                const safe = value || {};
                meshState.colorUniforms[key] = {
                    R: Number(safe.R == null ? 255 : safe.R),
                    G: Number(safe.G == null ? 255 : safe.G),
                    B: Number(safe.B == null ? 255 : safe.B),
                    A: Number(safe.A == null ? 255 : safe.A)
                };
            },
            DrawUserIndexedPrimitives: function (primitiveType, vertices, vertexOffset, numVertices, indices, indexOffset, primitiveCount) {
                if (Number(primitiveType) !== PrimitiveType.TriangleList) return;
                if (!drawMeshWebGl(vertices, vertexOffset, numVertices, indices, indexOffset, primitiveCount)) {
                    drawMeshFallback(vertices, vertexOffset, numVertices, indices, indexOffset, primitiveCount);
                }
            }
        };
        return api;
    }

    function createAnimGeomApi(Vector2Ctor, ColorCtor, MathApi) {
        const defaults = {
            axisColor: new ColorCtor(90, 100, 120, 200),
            gridColor: new ColorCtor(40, 50, 70, 120)
        };

        function toScreen(v, center, scale) {
            return new Vector2Ctor(center.X + v.X * scale, center.Y - v.Y * scale);
        }

        function drawAxes(g, center, scale, axisColor, gridColor) {
            if (!g || !center || !scale) return;
            const useAxis = axisColor || defaults.axisColor;
            const useGrid = gridColor || defaults.gridColor;
            const axisLength = scale * 1.2;

            g.Line(new Vector2Ctor(center.X - axisLength, center.Y), new Vector2Ctor(center.X + axisLength, center.Y), useAxis, 1.5);
            g.Line(new Vector2Ctor(center.X, center.Y - axisLength), new Vector2Ctor(center.X, center.Y + axisLength), useAxis, 1.5);

            for (let i = 1; i <= 4; i += 1) {
                const offset = i * scale * 0.25;
                g.Line(new Vector2Ctor(center.X - axisLength, center.Y - offset), new Vector2Ctor(center.X + axisLength, center.Y - offset), useGrid, 1);
                g.Line(new Vector2Ctor(center.X - axisLength, center.Y + offset), new Vector2Ctor(center.X + axisLength, center.Y + offset), useGrid, 1);
                g.Line(new Vector2Ctor(center.X - offset, center.Y - axisLength), new Vector2Ctor(center.X - offset, center.Y + axisLength), useGrid, 1);
                g.Line(new Vector2Ctor(center.X + offset, center.Y - axisLength), new Vector2Ctor(center.X + offset, center.Y + axisLength), useGrid, 1);
            }
        }

        function drawArrow(g, from, to, color, width, headSize) {
            if (!g || !from || !to) return;
            const lineWidth = width == null ? 1 : width;
            const arrowHead = headSize == null ? 8 : headSize;
            g.Line(from, to, color, lineWidth);

            const dir = new Vector2Ctor(to.X - from.X, to.Y - from.Y);
            const len = MathApi.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
            if (len <= 0.001) return;

            const ux = dir.X / len;
            const uy = dir.Y / len;
            const left = new Vector2Ctor(-uy, ux);
            const basePoint = new Vector2Ctor(to.X - ux * arrowHead, to.Y - uy * arrowHead);
            const leftPoint = new Vector2Ctor(basePoint.X + left.X * arrowHead * 0.55, basePoint.Y + left.Y * arrowHead * 0.55);
            const rightPoint = new Vector2Ctor(basePoint.X - left.X * arrowHead * 0.55, basePoint.Y - left.Y * arrowHead * 0.55);

            g.Line(to, leftPoint, color, lineWidth);
            g.Line(to, rightPoint, color, lineWidth);
        }

        return {
            ToScreen: toScreen,
            DrawAxes: drawAxes,
            DrawArrow: drawArrow
        };
    }

    function createPlayer(mod, options) {
        const opts = options || {};
        const canvas = opts.canvas || (opts.embed ? document.createElement('canvas') : null);
        const ctx = opts.ctx || (canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null);
        const width = canvas ? canvas.width : (opts.width || 1);
        const height = canvas ? canvas.height : (opts.height || 1);
        const context = new AnimContext(width, height);
        const runtimeRenderState = { time: 0, delta: 0, frame: 0 };
        const runtimeApi = {
            Vector2,
            Vector3,
            Matrix,
            Vec2: Vector2,
            Vec3: Vector3,
            Mat4: Matrix,
            Color,
            PrimitiveType,
            BlendState,
            BlendMode: BlendState,
            VertexPositionColorTexture,
            MathF,
            AnimGeom: createAnimGeomApi(Vector2, Color, MathF)
        };
        const canvasApi = createCanvasApi(canvas, ctx, runtimeRenderState);
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
            runtimeRenderState.time = time;
            runtimeRenderState.delta = dt;
            runtimeRenderState.frame += 1;
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
        const embedProfileData = parseEmbedProfileData(embed);
        applyEmbedDefaults(embed, normalized, resolveEmbedProfile(null, embedProfileData));
        ensureEmbedShell(embed, normalized || rawSource || 'C# 动画');
        ensureControls(embed);
        clearError(embed);
        disposeEmbed(embed);

        try {
            const custom = await resolveCustomEntry(embed, normalized, rawSource);
            const customDiagnostics = normalizeDiagnostics(custom && custom.diagnostics);
            const blockFallback = !!(custom && custom.blockFallback);
            if (customDiagnostics.length) {
                throw new Error(`compile diagnostics: ${customDiagnostics.join(' | ')}`);
            }

            let entry = custom && custom.entry ? custom.entry : null;
            let moduleUrl = custom && typeof custom.moduleUrl === 'string' ? String(custom.moduleUrl).trim() : '';

            if (!moduleUrl) {
                if (blockFallback) {
                    throw new Error(`compile diagnostics: ${normalized || rawSource}`);
                }

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

            const customProfile = custom && custom.profile ? custom.profile : null;
            const entryProfile = entry && typeof entry === 'object' && entry.profile ? entry.profile : customProfile;
            applyEmbedDefaults(embed, normalized, resolveEmbedProfile(entryProfile, embedProfileData));
            applyStageHeight(embed);
            ensureControls(embed);

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
        Vector2,
        Vector3,
        Matrix,
        Vec2: Vector2,
        Vec3: Vector3,
        Mat4: Matrix,
        Color,
        PrimitiveType,
        BlendState,
        BlendMode: BlendState,
        VertexPositionColorTexture,
        MathF,
        normalizeAnimPath,
        parseModeOptionsDsl,
        normalizeAnimProfile,
        resolveEmbedProfile,
        resolveEntryForSource,
        resolveAnimModulePath,
        createPlayer,
        runModule,
        mountEmbed,
        mountEmbeds,
        initEmbeds
    };
}));
