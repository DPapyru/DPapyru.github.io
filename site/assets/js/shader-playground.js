// Shader playground for site/pages/shader-playground.html
// Style: semicolons, 4-space indent, IIFE.

(function () {
    'use strict';

    const STORAGE_KEY = 'shader-playground.v1';
    const ITIME_OFFSET_STORAGE_KEY = 'shader-playground.iTimeOffset';
    const PLAYGROUND_IMPORT_KEY = 'shader-playground.import.v1';
    const CONTRIBUTION_DRAFT_KEY = 'shader-playground.contribute-draft.v1';
    const GIF_EXPORT_DEFAULT_SECONDS = 3;
    const GIF_EXPORT_MAX_SECONDS = 10;
    const GIF_EXPORT_FPS = 12;
    const COMMON_TAB_ID = '__common__';
    const DEFAULT_BASE_WIDTH = 960;
    const DEFAULT_ASPECT_MODE = '16:9';
    const ASPECT_PRESETS = {
        '16:9': { w: 16, h: 9 },
        '4:3': { w: 4, h: 3 },
        '1:1': { w: 1, h: 1 },
        '21:9': { w: 21, h: 9 },
        'custom': null
    };
    const hlslAdapter = (typeof window !== 'undefined' && window.ShaderHlslAdapter) ? window.ShaderHlslAdapter : null;
    const editorAssist = (typeof window !== 'undefined' && window.ShaderEditorAssist) ? window.ShaderEditorAssist : null;
    const commandParamsAdapter = (typeof window !== 'undefined' && window.ShaderCommandParams) ? window.ShaderCommandParams : null;

    function $(id) {
        return document.getElementById(id);
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function normalizeGlobalScale(value) {
        const num = Number(value);
        if (!isFinite(num)) return 1;
        return clamp(num, 0.25, 4);
    }

    function normalizeBaseWidth(value) {
        const num = Number(value);
        if (!isFinite(num)) return DEFAULT_BASE_WIDTH;
        return Math.round(clamp(num, 320, 7680));
    }

    function normalizeAspectMode(mode) {
        const key = String(mode || '').toLowerCase();
        if (Object.prototype.hasOwnProperty.call(ASPECT_PRESETS, key)) return key;
        return DEFAULT_ASPECT_MODE;
    }

    function normalizeRatioComponent(value, fallback) {
        const num = Number(value);
        if (!isFinite(num)) return fallback;
        return clamp(num, 0.1, 100);
    }

    function getAspectComponents(state) {
        const mode = normalizeAspectMode(state && state.aspectMode);
        if (mode !== 'custom') {
            const preset = ASPECT_PRESETS[mode] || ASPECT_PRESETS[DEFAULT_ASPECT_MODE];
            return { mode: mode, w: preset.w, h: preset.h };
        }

        const customW = normalizeRatioComponent(state && state.customAspectW, 16);
        const customH = normalizeRatioComponent(state && state.customAspectH, 9);
        return { mode: mode, w: customW, h: customH };
    }

    function computeRenderResolution(state) {
        const aspect = getAspectComponents(state || {});
        const baseWidth = normalizeBaseWidth(state && state.baseWidth);
        const baseHeight = Math.max(1, Math.round(baseWidth * aspect.h / aspect.w));
        const scale = normalizeGlobalScale(state && state.globalScale);
        const renderWidth = Math.max(1, Math.round(baseWidth * scale));
        const renderHeight = Math.max(1, Math.round(baseHeight * scale));
        return {
            baseWidth: baseWidth,
            baseHeight: baseHeight,
            renderWidth: renderWidth,
            renderHeight: renderHeight,
            aspectW: aspect.w,
            aspectH: aspect.h,
            aspectMode: aspect.mode,
            scale: scale
        };
    }

    function applyCanvasAspectRatio(canvas, state) {
        if (!canvas) return;
        const info = computeRenderResolution(state);
        canvas.style.aspectRatio = info.baseWidth + ' / ' + info.baseHeight;
    }

    function nowMs() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }

    function createId(prefix) {
        return String(prefix || 'id') + '-' + Math.random().toString(16).slice(2);
    }

    function sanitizeName(name) {
        const raw = String(name || '').trim();
        if (!raw) return 'Pass';
        return raw.replace(/[\r\n\t]/g, ' ').slice(0, 32);
    }

    function setText(el, text) {
        if (!el) return;
        el.textContent = String(text || '');
    }

    function isIdentifierChar(ch) {
        return /[A-Za-z0-9_]/.test(String(ch || ''));
    }

    function insertTextAtCursor(textarea, text) {
        const el = textarea;
        const start = Number(el.selectionStart || 0);
        const end = Number(el.selectionEnd || 0);
        const raw = String(el.value || '');
        el.value = raw.slice(0, start) + text + raw.slice(end);
        const next = start + String(text).length;
        el.selectionStart = next;
        el.selectionEnd = next;
    }

    function createEl(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    function safeJsonParse(text) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function indentSelection(textarea, useShift) {
        const el = textarea;
        const assist = editorAssist && typeof editorAssist.indentTextBlock === 'function'
            ? editorAssist
            : null;
        const raw = String(el.value || '');
        const start = Number(el.selectionStart || 0);
        const end = Number(el.selectionEnd || 0);
        if (!assist) return;

        const res = assist.indentTextBlock(raw, start, end, !!useShift);
        el.value = res.text;
        el.selectionStart = res.start;
        el.selectionEnd = res.end;
    }

    function saveState(state) {
        try {
            const payload = {
                v: 1,
                common: state.common,
                passes: state.passes.map((p) => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    scale: p.scale,
                    code: p.code,
                    channels: p.channels
                })),
                selected: state.selected,
                editorTarget: state.editorTarget,
                globalScale: state.globalScale,
                baseWidth: state.baseWidth,
                aspectMode: state.aspectMode,
                customAspectW: state.customAspectW,
                customAspectH: state.customAspectH,
                addressMode: state.addressMode
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (_) { }
    }

    function loadState() {
        const raw = (function () {
            try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
        })();
        if (!raw) return null;
        const parsed = safeJsonParse(raw);
        if (!parsed || parsed.v !== 1) return null;
        return parsed;
    }

    function createDefaultState() {
        const pass1 = {
            id: createId('pass'),
            name: 'Pass 1',
            type: 'image',
            scale: 1,
            code: DEFAULT_SIMPLE_PASS,
            channels: [
                { kind: 'none' },
                { kind: 'none' },
                { kind: 'none' },
                { kind: 'none' }
            ]
        };

        return {
            common: DEFAULT_COMMON,
            passes: [pass1],
            selected: pass1.id,
            editorTarget: pass1.id,
            globalScale: 1,
            baseWidth: DEFAULT_BASE_WIDTH,
            aspectMode: DEFAULT_ASPECT_MODE,
            customAspectW: 16,
            customAspectH: 9,
            addressMode: "clamp",
            isRunning: true
        };
    }

    // --- Toy-HLSL -> GLSL ES 3.00
    function buildFragmentSource(common, passCode) {
        if (!hlslAdapter || typeof hlslAdapter.buildFragmentSource !== 'function') {
            return {
                ok: false,
                error: 'HLSL 适配器未加载，请刷新页面重试。'
            };
        }
        return hlslAdapter.buildFragmentSource(common, passCode);
    }

    function buildVertexSource() {
        return [
            '#version 300 es',
            'precision highp float;',
            '',
            'layout(location = 0) in vec2 aPos;',
            'layout(location = 1) in vec2 aUv;',
            'out vec2 vUv;',
            'void main() {',
            '    vUv = aUv;',
            '    gl_Position = vec4(aPos, 0.0, 1.0);',
            '}'
        ].join('\n');
    }

    function createProgram(gl, vsSource, fsSource) {
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(vs) || 'Vertex shader compile failed';
            gl.deleteShader(vs);
            return { ok: false, error: log };
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(fs) || 'Fragment shader compile failed';
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            return { ok: false, error: log };
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(prog) || 'Program link failed';
            gl.deleteProgram(prog);
            return { ok: false, error: log };
        }

        return { ok: true, program: prog };
    }

    function normalizeTextureAddressMode(mode) {
        return String(mode || '').toLowerCase() === 'wrap' ? 'wrap' : 'clamp';
    }

    function setBoundTextureAddressMode(gl, mode) {
        const resolved = normalizeTextureAddressMode(mode);
        const wrap = resolved === 'wrap' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    }

    function createTextureFromImage(gl, img, flipY) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    }

    function updateTextureFromImage(gl, tex, img, flipY) {
        if (!gl || !tex || !img) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function isGifFile(file) {
        if (!file) return false;
        const type = String(file.type || '').toLowerCase();
        if (type === 'image/gif') return true;
        const name = String(file.name || '').toLowerCase();
        return name.endsWith('.gif');
    }

    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function () {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error('图片加载失败'));
            };
            img.src = url;
        });
    }

    async function decodeGifFramesWithImageDecoder(file) {
        if (!isGifFile(file)) return null;
        if (typeof ImageDecoder === 'undefined') return null;

        const contentType = String(file.type || '').toLowerCase() || 'image/gif';
        const bytes = await file.arrayBuffer();
        const decoder = new ImageDecoder({ data: bytes, type: contentType });
        const track = decoder.tracks && decoder.tracks.selectedTrack ? decoder.tracks.selectedTrack : null;
        const frameCount = track && Number(track.frameCount) > 0 ? Number(track.frameCount) : 1;

        const frames = [];
        let totalMs = 0;
        let width = 0;
        let height = 0;

        for (let i = 0; i < frameCount; i += 1) {
            const result = await decoder.decode({ frameIndex: i });
            const videoFrame = result && result.image ? result.image : null;
            if (!videoFrame) continue;

            const frameWidth = Number(videoFrame.displayWidth || videoFrame.codedWidth || 0) || 0;
            const frameHeight = Number(videoFrame.displayHeight || videoFrame.codedHeight || 0) || 0;
            if (!width || frameWidth > width) width = frameWidth;
            if (!height || frameHeight > height) height = frameHeight;

            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = Math.max(1, frameWidth || width || 1);
            frameCanvas.height = Math.max(1, frameHeight || height || 1);
            const frameCtx = frameCanvas.getContext('2d');
            if (frameCtx) {
                frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
                frameCtx.drawImage(videoFrame, 0, 0, frameCanvas.width, frameCanvas.height);
            }

            const rawDurationUs = Number(videoFrame.duration || 0);
            const durationMs = clamp(Math.round(rawDurationUs > 0 ? rawDurationUs / 1000 : 100), 16, 10000);
            totalMs += durationMs;

            frames.push({
                canvas: frameCanvas,
                delayMs: durationMs,
                endMs: totalMs
            });

            try { videoFrame.close(); } catch (_) { }
        }

        if (typeof decoder.close === 'function') {
            try { decoder.close(); } catch (_) { }
        }

        if (!frames.length) return null;
        return {
            width: Math.max(1, width || frames[0].canvas.width),
            height: Math.max(1, height || frames[0].canvas.height),
            totalMs: Math.max(1, totalMs),
            frames: frames
        };
    }

    async function decodeGifFramesWithGifuct(file) {
        if (!isGifFile(file)) return null;
        const api = getGifDecoderApi();
        if (!api || typeof api.parseGIF !== 'function' || typeof api.decompressFrames !== 'function') return null;

        const bytes = new Uint8Array(await file.arrayBuffer());
        const parsed = api.parseGIF(bytes.buffer);
        const frames = api.decompressFrames(parsed, true) || [];
        if (!Array.isArray(frames) || frames.length === 0) return null;

        let maxW = 1;
        let maxH = 1;
        frames.forEach((frame) => {
            const dims = frame && frame.dims ? frame.dims : null;
            const right = dims ? Number(dims.left || 0) + Number(dims.width || 0) : 0;
            const bottom = dims ? Number(dims.top || 0) + Number(dims.height || 0) : 0;
            if (right > maxW) maxW = right;
            if (bottom > maxH) maxH = bottom;
        });

        const composed = document.createElement('canvas');
        composed.width = Math.max(1, maxW);
        composed.height = Math.max(1, maxH);
        const ctx = composed.getContext('2d');
        if (!ctx) return null;

        const outFrames = [];
        let totalMs = 0;

        for (let i = 0; i < frames.length; i += 1) {
            const frame = frames[i] || {};
            const dims = frame.dims || { left: 0, top: 0, width: composed.width, height: composed.height };
            const disposal = Number(frame.disposalType || 0);

            let restoreData = null;
            if (disposal === 3) {
                try {
                    restoreData = ctx.getImageData(dims.left, dims.top, dims.width, dims.height);
                } catch (_) {
                    restoreData = null;
                }
            }

            if (frame.patch && dims.width > 0 && dims.height > 0) {
                const patchData = new ImageData(frame.patch, dims.width, dims.height);
                ctx.putImageData(patchData, dims.left, dims.top);
            }

            const snapshot = document.createElement('canvas');
            snapshot.width = composed.width;
            snapshot.height = composed.height;
            const sctx = snapshot.getContext('2d');
            if (!sctx) continue;
            sctx.clearRect(0, 0, snapshot.width, snapshot.height);
            sctx.drawImage(composed, 0, 0);

            const delayMs = clamp(Math.round(Number(frame.delay || 100)), 16, 10000);
            totalMs += delayMs;

            outFrames.push({
                canvas: snapshot,
                delayMs: delayMs,
                endMs: totalMs
            });

            if (disposal === 2) {
                ctx.clearRect(dims.left, dims.top, dims.width, dims.height);
            } else if (disposal === 3 && restoreData) {
                ctx.putImageData(restoreData, dims.left, dims.top);
            }
        }

        if (!outFrames.length) return null;
        return {
            width: composed.width,
            height: composed.height,
            totalMs: Math.max(1, totalMs),
            frames: outFrames
        };
    }

    function selectGifFrameIndexByTime(gifData, timeSec) {
        if (!gifData || !Array.isArray(gifData.frames) || gifData.frames.length === 0) return 0;
        const totalMs = Math.max(1, Number(gifData.totalMs || 0));
        const tMs = ((Number(timeSec || 0) * 1000) % totalMs + totalMs) % totalMs;

        for (let i = 0; i < gifData.frames.length; i += 1) {
            if (tMs < Number(gifData.frames[i].endMs || 0)) return i;
        }
        return gifData.frames.length - 1;
    }

    function normalizeImportedPassState(payload, baseState) {
        const source = payload && payload.payload ? payload.payload : payload;
        if (!source || !Array.isArray(source.passes) || source.passes.length === 0) return null;

        const next = createDefaultState();
        const idMap = new Map();
        next.common = typeof source.common === 'string' ? source.common : '';
        next.passes = source.passes.map((raw, idx) => {
            const id = createId('pass');
            const oldId = String((raw && raw.id) || idx);
            idMap.set(oldId, id);
            return {
                id: id,
                name: sanitizeName((raw && raw.name) || ('Pass ' + (idx + 1))),
                type: (raw && raw.type === 'buffer') ? 'buffer' : 'image',
                scale: clamp(Number(raw && raw.scale ? raw.scale : 1), 0.1, 1),
                code: String((raw && raw.code) || ''),
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            };
        });

        next.passes.forEach((pass, idx) => {
            const raw = source.passes[idx] || {};
            const rawChannels = Array.isArray(raw.channels) ? raw.channels : [];
            for (let i = 0; i < 4; i += 1) {
                const ch = rawChannels[i] || { kind: 'none' };
                const kind = String(ch.kind || 'none');
                if (kind === 'builtin' && (ch.id === 'builtin:checker' || ch.id === 'builtin:noise')) {
                    pass.channels[i] = { kind: 'builtin', id: ch.id };
                    continue;
                }
                if (kind === 'buffer') {
                    const mappedPassId = idMap.get(String(ch.passId || ''));
                    if (mappedPassId) {
                        pass.channels[i] = {
                            kind: 'buffer',
                            passId: mappedPassId,
                            frame: ch.frame === 'current' ? 'current' : 'prev'
                        };
                    }
                    continue;
                }
                pass.channels[i] = { kind: 'none' };
            }
        });

        if (baseState) {
            next.globalScale = normalizeGlobalScale(baseState.globalScale);
            next.baseWidth = normalizeBaseWidth(baseState.baseWidth);
            next.aspectMode = normalizeAspectMode(baseState.aspectMode);
            next.customAspectW = normalizeRatioComponent(baseState.customAspectW, 16);
            next.customAspectH = normalizeRatioComponent(baseState.customAspectH, 9);
            next.addressMode = normalizeTextureAddressMode(baseState.addressMode);
        }

        next.selected = next.passes[0].id;
        next.editorTarget = next.selected;
        return next;
    }

    function consumeGalleryImportPayload() {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search || '');
        if (params.get('import') !== 'gallery') return null;

        let payload = null;
        try {
            const raw = localStorage.getItem(PLAYGROUND_IMPORT_KEY);
            payload = raw ? safeJsonParse(raw) : null;
        } catch (_) {
            payload = null;
        }

        try {
            localStorage.removeItem(PLAYGROUND_IMPORT_KEY);
        } catch (_) { }

        return payload;
    }

    function makeContributionTemplate(state, passName) {
        const safePass = sanitizeName(passName || 'My Shader');
        const slugSeed = safePass.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const slug = slugSeed || 'my-shader';
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const updatedAt = yyyy + '-' + mm + '-' + dd;

        const shaderPayload = {
            common: String(state && state.common ? state.common : ''),
            passes: Array.isArray(state && state.passes)
                ? state.passes.map((p) => ({
                    name: sanitizeName(p.name || 'Pass'),
                    type: (p.type === 'buffer') ? 'buffer' : 'image',
                    scale: clamp(Number(p.scale || 1), 0.1, 1),
                    code: String(p.code || ''),
                    channels: Array.isArray(p.channels) ? p.channels.map((ch) => {
                        const kind = ch && ch.kind ? ch.kind : 'none';
                        if (kind === 'builtin' && (ch.id === 'builtin:checker' || ch.id === 'builtin:noise')) {
                            return { kind: 'builtin', id: ch.id };
                        }
                        if (kind === 'buffer') {
                            return {
                                kind: 'buffer',
                                passId: String(ch.passId || ''),
                                frame: ch.frame === 'current' ? 'current' : 'prev'
                            };
                        }
                        return { kind: 'none' };
                    }) : [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
                }))
                : []
        };

        const entryPayload = {
            slug: slug,
            title: safePass,
            author: '你的名字',
            description: '简要描述这个 Shader 的用途与效果。',
            shader: 'shader.json',
            cover: 'cover.webp',
            tags: ['demo'],
            updated_at: updatedAt
        };

        const lines = [];
        lines.push('# Shader 投稿模板');
        lines.push('');
        lines.push('建议目录：`site/content/shader-gallery/' + slug + '/`');
        lines.push('');
        lines.push('## entry.json');
        lines.push('```json');
        lines.push(JSON.stringify(entryPayload, null, 2));
        lines.push('```');
        lines.push('');
        lines.push('## shader.json');
        lines.push('```json');
        lines.push(JSON.stringify(shaderPayload, null, 2));
        lines.push('```');
        lines.push('');
        lines.push('提交前运行：');
        lines.push('```bash');
        lines.push('npm run gallery:normalize');
        lines.push('npm run gallery:check');
        lines.push('```');
        return lines.join('\n');
    }

    async function copyTextWithFallback(text) {
        const raw = String(text || '');
        if (!raw) return false;
        try {
            await navigator.clipboard.writeText(raw);
            return true;
        } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = raw;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
            document.body.removeChild(ta);
            return ok;
        }
    }

    function getGifDecoderApi() {
        if (typeof window === 'undefined') return null;

        const existing = window.GifuctJs;
        if (existing && typeof existing.parseGIF === 'function' && typeof existing.decompressFrames === 'function') {
            return existing;
        }

        const parseGIF = typeof window.parseGIF === 'function' ? window.parseGIF : null;
        const decompressFrames = typeof window.decompressFrames === 'function' ? window.decompressFrames : null;
        if (parseGIF && decompressFrames) {
            return { parseGIF, decompressFrames };
        }
        return null;
    }

    function getGifEncoderApi() {
        if (typeof window === 'undefined') return null;
        if (window.GIF && typeof window.GIF === 'function') return window.GIF;
        return null;
    }

    function createEmptyTexture(gl, w, h) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    }

    function createFramebuffer(gl, tex) {
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return fbo;
    }

    function createBuiltinTextureCanvas(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        if (name === 'builtin:checker') {
            for (let y = 0; y < 16; y += 1) {
                for (let x = 0; x < 16; x += 1) {
                    const v = ((x + y) % 2) ? 36 : 220;
                    ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
                    ctx.fillRect(x * 16, y * 16, 16, 16);
                }
            }
            return canvas;
        }

        if (name === 'builtin:noise') {
            const img = ctx.createImageData(256, 256);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = (Math.random() * 255) | 0;
                img.data[i] = v;
                img.data[i + 1] = v;
                img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
            return canvas;
        }

        return null;
    }

    function createBuiltinTextureEntry(gl, id, label) {
        const canvas = createBuiltinTextureCanvas(id);
        if (!canvas) return null;
        const tex = createTextureFromImage(gl, canvas, false);
        return {
            id: id,
            label: label,
            width: canvas.width,
            height: canvas.height,
            texture: tex
        };
    }

    function createRuntime(gl, canvas) {
        const posUv = new Float32Array([
            -1, -1, 0, 0,
            3, -1, 2, 0,
            -1, 3, 0, 2
        ]);

        const vao = gl.createVertexArray();
        const vbo = gl.createBuffer();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, posUv, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const runtime = {
            gl: gl,
            canvas: canvas,
            vao: vao,
            vbo: vbo,
            vsSource: buildVertexSource(),
            startMs: nowMs(),
            lastMs: nowMs(),
            elapsedSec: 0,
            frame: 0,
            mouse: { x: 0, y: 0, down: false, downX: 0, downY: 0 },
            builtins: new Map(),
            uploads: new Map(),
            compiled: new Map(),
            buffers: new Map(),
            errors: []
        };

        const checker = createBuiltinTextureEntry(gl, 'builtin:checker', 'builtin: checker');
        const noise = createBuiltinTextureEntry(gl, 'builtin:noise', 'builtin: noise');
        if (checker) runtime.builtins.set(checker.id, checker);
        if (noise) runtime.builtins.set(noise.id, noise);

        return runtime;
    }

    function ensureBuffer(runtime, passId, w, h) {
        const gl = runtime.gl;
        const key = String(passId);
        const existing = runtime.buffers.get(key);
        if (existing && existing.w === w && existing.h === h) return existing;

        if (existing) {
            try {
                gl.deleteFramebuffer(existing.fboRead);
                gl.deleteFramebuffer(existing.fboWrite);
                gl.deleteTexture(existing.texRead);
                gl.deleteTexture(existing.texWrite);
            } catch (_) { }
        }

        const texRead = createEmptyTexture(gl, w, h);
        const texWrite = createEmptyTexture(gl, w, h);
        const fboRead = createFramebuffer(gl, texRead);
        const fboWrite = createFramebuffer(gl, texWrite);
        const buf = { w: w, h: h, texRead: texRead, texWrite: texWrite, fboRead: fboRead, fboWrite: fboWrite };
        runtime.buffers.set(key, buf);
        return buf;
    }

    function swapBuffers(runtime) {
        runtime.buffers.forEach((buf) => {
            const tr = buf.texRead;
            buf.texRead = buf.texWrite;
            buf.texWrite = tr;
            const fr = buf.fboRead;
            buf.fboRead = buf.fboWrite;
            buf.fboWrite = fr;
        });
    }

    function getChannelTexture(runtime, pass, channel, phase, passIndexMap) {
        const kind = channel && channel.kind ? channel.kind : 'none';
        if (kind === 'none') return null;

        if (kind === 'builtin') {
            return runtime.builtins.get(channel.id) || null;
        }

        if (kind === 'upload') {
            return runtime.uploads.get(channel.id) || null;
        }

        if (kind === 'buffer') {
            const targetPassId = channel.passId;
            if (!targetPassId) return null;
            const idx = passIndexMap.get(String(targetPassId));
            if (typeof idx !== 'number') return null;
            const selfIdx = passIndexMap.get(String(pass.id));
            const isSelf = String(targetPassId) === String(pass.id);
            if (!isSelf && typeof selfIdx === 'number' && idx > selfIdx) {
                return null;
            }
            const buf = runtime.buffers.get(String(targetPassId));
            if (!buf) return null;
            if (channel.frame === 'current') {
                return { id: 'buffer:' + targetPassId + ':current', label: 'buffer current', width: buf.w, height: buf.h, texture: buf.texRead };
            }
            return { id: 'buffer:' + targetPassId + ':prev', label: 'buffer prev', width: buf.w, height: buf.h, texture: buf.texRead };
        }

        return null;
    }

    function updateAnimatedUploads(runtime, timeSec) {
        const gl = runtime.gl;
        runtime.uploads.forEach((entry) => {
            if (!entry || !entry.isAnimatedGif || !entry.gifData || !Array.isArray(entry.gifData.frames) || entry.gifData.frames.length === 0) {
                return;
            }
            const frameIndex = selectGifFrameIndexByTime(entry.gifData, timeSec);
            if (frameIndex === entry.currentFrame) return;
            const frame = entry.gifData.frames[frameIndex];
            if (!frame || !frame.canvas) return;
            updateTextureFromImage(gl, entry.texture, frame.canvas, true);
            entry.currentFrame = frameIndex;
        });
    }

    function compilePass(runtime, common, pass) {
        const gl = runtime.gl;
        const built = buildFragmentSource(common, pass.code);
        if (!built.ok) return { ok: false, error: built.error };
        const res = createProgram(gl, runtime.vsSource, built.source);
        if (!res.ok) return res;

        const program = res.program;
        const u = {
            iResolution: gl.getUniformLocation(program, 'iResolution'),
            iTime: gl.getUniformLocation(program, 'iTime'),
            iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
            iFrame: gl.getUniformLocation(program, 'iFrame'),
            iMouse: gl.getUniformLocation(program, 'iMouse'),
            iDate: gl.getUniformLocation(program, 'iDate'),
            iChannelTime: gl.getUniformLocation(program, 'iChannelTime'),
            iChannelResolution: gl.getUniformLocation(program, 'iChannelResolution'),
            iChannel0: gl.getUniformLocation(program, 'iChannel0'),
            iChannel1: gl.getUniformLocation(program, 'iChannel1'),
            iChannel2: gl.getUniformLocation(program, 'iChannel2'),
            iChannel3: gl.getUniformLocation(program, 'iChannel3')
        };

        return { ok: true, program: program, uniforms: u };
    }

    function renderFrame(runtime, state) {
        const gl = runtime.gl;
        const canvas = runtime.canvas;
        const passIndexMap = new Map();
        state.passes.forEach((p, idx) => {
            passIndexMap.set(String(p.id), idx);
        });

        const tMs = nowMs();
        const rawDelta = clamp((tMs - runtime.lastMs) / 1000, 0, 0.2);
        if (state.isRunning) {
            runtime.elapsedSec = Number(runtime.elapsedSec || 0) + rawDelta;
        }
        const time = Number(runtime.elapsedSec || 0) + Number(runtime.iTimeOffset || 0);
        const dt = state.isRunning ? rawDelta : 0;
        const addressMode = normalizeTextureAddressMode(state.addressMode);
        runtime.lastMs = tMs;

        updateAnimatedUploads(runtime, time);

        const resolution = computeRenderResolution(state);
        const canvasW = resolution.renderWidth;
        const canvasH = resolution.renderHeight;
        if (canvas.width !== canvasW) canvas.width = canvasW;
        if (canvas.height !== canvasH) canvas.height = canvasH;

        const resVec3 = [canvasW, canvasH, 1];
        const mouse = runtime.mouse;
        const mx = mouse.x;
        const my = mouse.y;
        const m0 = mouse.down ? mx : -Math.abs(mx);
        const m1 = mouse.down ? my : -Math.abs(my);
        const m2 = mouse.downX;
        const m3 = mouse.downY;
        const date = new Date();
        const iDate = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()];

        // Ensure buffers are allocated for buffer passes.
        state.passes.forEach((p) => {
            if (p.type !== 'buffer') return;
            const scale = clamp(Number(p.scale || 1), 0.1, 1);
            const w = Math.max(1, Math.floor(canvasW * scale));
            const h = Math.max(1, Math.floor(canvasH * scale));
            ensureBuffer(runtime, p.id, w, h);
        });

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(runtime.vao);

        for (const pass of state.passes) {
            const compiled = runtime.compiled.get(String(pass.id));
            if (!compiled || !compiled.program) continue;

            const isBuffer = pass.type === 'buffer';
            let viewportW = canvasW;
            let viewportH = canvasH;
            if (isBuffer) {
                const buf = runtime.buffers.get(String(pass.id));
                if (!buf) continue;
                viewportW = buf.w;
                viewportH = buf.h;
                gl.bindFramebuffer(gl.FRAMEBUFFER, buf.fboWrite);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            gl.viewport(0, 0, viewportW, viewportH);
            gl.useProgram(compiled.program);

            if (compiled.uniforms.iResolution) gl.uniform3fv(compiled.uniforms.iResolution, resVec3);
            if (compiled.uniforms.iTime) gl.uniform1f(compiled.uniforms.iTime, time);
            if (compiled.uniforms.iTimeDelta) gl.uniform1f(compiled.uniforms.iTimeDelta, dt);
            if (compiled.uniforms.iFrame) gl.uniform1i(compiled.uniforms.iFrame, runtime.frame);
            if (compiled.uniforms.iMouse) gl.uniform4fv(compiled.uniforms.iMouse, [m0, m1, m2, m3]);
            if (compiled.uniforms.iDate) gl.uniform4fv(compiled.uniforms.iDate, iDate);

            const chTimes = [0, 0, 0, 0];
            const chRes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < 4; i += 1) {
                const ch = pass.channels && pass.channels[i] ? pass.channels[i] : { kind: 'none' };
                const entry = getChannelTexture(runtime, pass, ch, 'render', passIndexMap);
                if (entry && entry.texture) {
                    gl.activeTexture(gl.TEXTURE0 + i);
                    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
                    setBoundTextureAddressMode(gl, addressMode);
                    chRes[i * 3] = entry.width;
                    chRes[i * 3 + 1] = entry.height;
                    chRes[i * 3 + 2] = 1;
                } else {
                    gl.activeTexture(gl.TEXTURE0 + i);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
                chTimes[i] = time;
            }

            if (compiled.uniforms.iChannelTime) gl.uniform1fv(compiled.uniforms.iChannelTime, chTimes);
            if (compiled.uniforms.iChannelResolution) gl.uniform3fv(compiled.uniforms.iChannelResolution, chRes);
            if (compiled.uniforms.iChannel0) gl.uniform1i(compiled.uniforms.iChannel0, 0);
            if (compiled.uniforms.iChannel1) gl.uniform1i(compiled.uniforms.iChannel1, 1);
            if (compiled.uniforms.iChannel2) gl.uniform1i(compiled.uniforms.iChannel2, 2);
            if (compiled.uniforms.iChannel3) gl.uniform1i(compiled.uniforms.iChannel3, 3);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        runtime.frame += 1;
        swapBuffers(runtime);
    }

    // --- Export .fx (single technique, multiple passes for tModLoader)
    function sanitizeFxIdent(name) {
        const raw = String(name || '').trim();
        if (!raw) return 'Pass';
        const s = raw.replace(/[^A-Za-z0-9_]+/g, '_');
        return (/^[A-Za-z_]/.test(s)) ? s : ('P_' + s);
    }

    function renameMainImage(code, suffix) {
        const re = /\bmainImage\b/g;
        return String(code || '').replace(re, 'mainImage_' + suffix);
    }

    function escapeRegExpLocal(s) {
        if (hlslAdapter && typeof hlslAdapter.escapeRegExp === 'function') {
            return hlslAdapter.escapeRegExp(s);
        }
        return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function detectPassEntry(code) {
        if (!hlslAdapter || typeof hlslAdapter.detectEntryFunction !== 'function') return null;
        return hlslAdapter.detectEntryFunction(code);
    }

    function buildFxPassEntryMetadata(code, passSuffix) {
        const entry = detectPassEntry(code);
        if (!entry) {
            return {
                entry: null,
                renamedName: '',
                codeRenamed: String(code || '')
            };
        }

        const entryName = String(entry.name || 'mainImage');
        const renamedName = entryName === 'mainImage'
            ? ('mainImage_' + passSuffix)
            : (entryName + '_' + passSuffix);
        const re = new RegExp('\\b' + escapeRegExpLocal(entryName) + '\\b', 'g');

        return {
            entry: entry,
            renamedName: renamedName,
            codeRenamed: String(code || '').replace(re, renamedName)
        };
    }

    function buildFxPassReturnLine(entryMeta) {
        if (!entryMeta || !entryMeta.entry) {
            return {
                ok: false,
                line: '    return float4(1, 0, 1, 1);'
            };
        }

        const entry = entryMeta.entry;
        const renamedName = String(entryMeta.renamedName || 'mainImage');
        const coordMode = (hlslAdapter && typeof hlslAdapter.coordModeForEntry === 'function')
            ? hlslAdapter.coordModeForEntry(entry)
            : 'fragCoord';
        const coordArg = coordMode === 'uv' ? 'uv' : 'fragCoord';

        if (entry.kind === 'out') {
            return {
                ok: true,
                line: [
                    '    float4 result = float4(0, 0, 0, 0);',
                    '    ' + renamedName + '(result, ' + coordArg + ');',
                    '    return result * vertexColor;'
                ].join('\n')
            };
        }

        return {
            ok: true,
            line: '    return ' + renamedName + '(' + coordArg + ') * vertexColor;'
        };
    }

    function buildFx(state) {
        const common = String(state.common || '');
        const lines = [];
        lines.push('// Generated by HLSL Shader Playground');
        lines.push('// For tModLoader - Single technique with multiple passes');
        lines.push('');
        lines.push('// ============================================');
        lines.push('// tModLoader 常用变量（根据需要取消注释）');
        lines.push('// ============================================');
        lines.push('// sampler2D uImage0;           // 主纹理（精灵/NPC/弹幕等）');
        lines.push('// sampler2D uImage1;           // 额外纹理');
        lines.push('// sampler2D uImage2;           // 额外纹理');
        lines.push('// float3 uColor;               // 颜色参数');
        lines.push('// float3 uSecondaryColor;      // 次要颜色');
        lines.push('// float uOpacity;              // 不透明度');
        lines.push('// float uSaturation;           // 饱和度');
        lines.push('// float uRotation;             // 旋转角度');
        lines.push('// float uTime;                 // 时间（秒）');
        lines.push('// float uDirection;            // 方向（-1 或 1）');
        lines.push('// float2 uTargetPosition;      // 目标位置');
        lines.push('// float2 uWorldPosition;       // 世界位置');
        lines.push('// float2 uImageSize0;          // 纹理尺寸');
        lines.push('// float2 uImageSize1;');
        lines.push('// float4 uSourceRect;          // 源矩形（用于精灵表）');
        lines.push('// float4 uLegacyArmorSourceRect;');
        lines.push('// float2 uOffset;              // 偏移');
        lines.push('// float uProgress;             // 进度（0-1）');
        lines.push('// float2x2 uRotationMat;       // 旋转矩阵');
        lines.push('');
        lines.push('// ============================================');
        lines.push('// Playground 预览变量（可删除或替换）');
        lines.push('// ============================================');
        lines.push('float iTime;');
        lines.push('float iTimeDelta;');
        lines.push('int iFrame;');
        lines.push('float3 iResolution;');
        lines.push('float4 iMouse;');
        lines.push('float4 iDate;');
        lines.push('sampler2D iChannel0;');
        lines.push('sampler2D iChannel1;');
        lines.push('sampler2D iChannel2;');
        lines.push('sampler2D iChannel3;');
        lines.push('');

        // Common code
        if (common.trim()) {
            lines.push('// ============================================');
            lines.push('// Common（公共代码）');
            lines.push('// ============================================');
            lines.push(common.trimEnd());
            lines.push('');
        }

        // Vertex shader
        lines.push('// ============================================');
        lines.push('// Vertex Shader');
        lines.push('// ============================================');
        lines.push('struct VSInput {');
        lines.push('    float4 Position : POSITION0;');
        lines.push('    float2 TexCoord : TEXCOORD0;');
        lines.push('    float4 Color    : COLOR0;');
        lines.push('};');
        lines.push('');
        lines.push('struct VSOutput {');
        lines.push('    float4 Position : SV_POSITION;');
        lines.push('    float2 TexCoord : TEXCOORD0;');
        lines.push('    float4 Color    : COLOR0;');
        lines.push('};');
        lines.push('');
        lines.push('VSOutput MainVS(VSInput input) {');
        lines.push('    VSOutput output;');
        lines.push('    output.Position = input.Position;');
        lines.push('    output.TexCoord = input.TexCoord;');
        lines.push('    output.Color = input.Color;');
        lines.push('    return output;');
        lines.push('}');
        lines.push('');

        // Pixel shaders
        lines.push('// ============================================');
        lines.push('// Pixel Shaders');
        lines.push('// ============================================');

        const passes = [];
        for (const pass of state.passes) {
            const ident = sanitizeFxIdent(pass.name);
            const passSuffix = sanitizeFxIdent(pass.id);
            const codeRaw = String(pass.code || '');
            const entryMeta = buildFxPassEntryMetadata(codeRaw, passSuffix);
            const codeRenamed = entryMeta.codeRenamed;
            const fxReturn = buildFxPassReturnLine(entryMeta);

            lines.push('');
            lines.push('// --- ' + pass.name + ' ---');
            lines.push(codeRenamed.trimEnd());
            lines.push('');
            lines.push('float4 PS_' + ident + '(VSOutput input) : SV_TARGET {');
            lines.push('    float2 uv = input.TexCoord;');
            lines.push('    float2 fragCoord = uv * iResolution.xy;');
            lines.push('    float4 vertexColor = input.Color;');
            if (!fxReturn.ok) {
                lines.push('    // mainImage not found');
                lines.push('    return float4(1, 0, 1, 1);');
            } else {
                lines.push(fxReturn.line);
            }
            lines.push('}');

            passes.push({ name: ident, ps: 'PS_' + ident });
        }

        // Single technique with multiple passes
        lines.push('');
        lines.push('// ============================================');
        lines.push('// Technique（单个 technique，多个 pass）');
        lines.push('// ============================================');
        lines.push('technique Technique1 {');

        for (let i = 0; i < passes.length; i++) {
            const p = passes[i];
            lines.push('    pass ' + p.name + ' {');
            lines.push('        VertexShader = compile vs_3_0 MainVS();');
            lines.push('        PixelShader  = compile ps_3_0 ' + p.ps + '();');
            lines.push('    }');
        }

        lines.push('}');
        lines.push('');

        // Also generate separate techniques for convenience
        if (passes.length > 1) {
            lines.push('// ============================================');
            lines.push('// 单独的 Techniques（方便单独使用某个 pass）');
            lines.push('// ============================================');
            for (const p of passes) {
                lines.push('technique T_' + p.name + ' {');
                lines.push('    pass P0 {');
                lines.push('        VertexShader = compile vs_3_0 MainVS();');
                lines.push('        PixelShader  = compile ps_3_0 ' + p.ps + '();');
                lines.push('    }');
                lines.push('}');
                lines.push('');
            }
        }

        return lines.join('\n').replace(/\n{3,}/g, '\n\n');
    }

    // --- UI / App
    const DEFAULT_COMMON = [
        '// 公共函数区（所有 Pass 自动注入）',
        '// 这里适合写通用函数、常量、噪声工具等。',
        '',
        'float Hash21(float2 p)',
        '{',
        '    p = frac(p * float2(123.34, 456.21));',
        '    p += dot(p, p + 45.32);',
        '    return frac(p.x * p.y);',
        '}',
        ''
    ].join('\n');

    // tModLoader 风格默认代码
    const DEFAULT_SIMPLE_PASS = [
        '// tModLoader 风格像素着色器示例',
        '// 支持 mainImage(...) 与 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
        '// 可用纹理: iChannel0-3（也兼容 uImage0-3）',
        '',
        'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
        '{',
        '    float2 uv = texCoord;',
        '    float2 p = uv * 2.0 - 1.0;',
        '    float vignette = saturate(1.0 - dot(p, p) * 0.45);',
        '    float wave = 0.5 + 0.5 * sin(iTime + uv.x * 6.0);',
        '    float3 col = float3(uv.x, uv.y, wave) * vignette;',
        '    return float4(col, 1.0);',
        '}',
        ''
    ].join('\n');

    function init() {
        const canvas = $('shaderpg-canvas');
        const passTabs = $('shaderpg-pass-tabs');
        const addPassBtn = $('shaderpg-add-pass');
        const moveLeftBtn = $('shaderpg-pass-move-left');
        const moveRightBtn = $('shaderpg-pass-move-right');
        const renameBtn = $('shaderpg-pass-rename');
        const deleteBtn = $('shaderpg-pass-delete');
        const compileBtn = $('shaderpg-compile');
        const resetBtn = $('shaderpg-reset');
        const editorTa = $('shaderpg-editor');
        const errorEl = $('shaderpg-error');
        const statusEl = $('shaderpg-status');
        const runBtn = $('shaderpg-toggle-run');
        const resetPlaybackBtn = $('shaderpg-reset-playback');
        const aspectSelect = $('shaderpg-aspect');
        const customAspectGroup = $('shaderpg-custom-aspect-group');
        const customAspectWInput = $('shaderpg-custom-aspect-w');
        const customAspectHInput = $('shaderpg-custom-aspect-h');
        const baseWidthInput = $('shaderpg-base-width');
        const scaleSelect = $('shaderpg-scale');
        const addressModeSelect = $('shaderpg-address-mode');
        const iTimeInput = $('shaderpg-itime');
        const iTimeMinusBtn = $('shaderpg-itime-minus');
        const iTimePlusBtn = $('shaderpg-itime-plus');
        const iTimeResetBtn = $('shaderpg-itime-reset');
        const commandVarsEl = $('shaderpg-command-vars');
        const statsEl = $('shaderpg-stats');
        const channelsEl = $('shaderpg-channels');
        const uploadInput = $('shaderpg-upload');
        const texturesEl = $('shaderpg-textures');
        const exportGifBtn = $('shaderpg-export-gif');
        const exportPngBtn = $('shaderpg-export-png');
        const exportBtn = $('shaderpg-export-fx');
        const copyBtn = $('shaderpg-copy-fx');
        const contributeBtn = $('shaderpg-contribute');
        const fxTa = $('shaderpg-fx');

        // 新增 UI 元素
        const passMenuBtn = $('shaderpg-pass-menu');
        const passDropdown = $('shaderpg-pass-dropdown');
        const layoutToggleBtn = $('shaderpg-layout-toggle');
        const helpToggleBtn = $('shaderpg-help-toggle');
        const helpDrawer = $('shaderpg-help-drawer');
        const helpCloseBtn = $('shaderpg-help-close');
        const drawerOverlay = $('shaderpg-drawer-overlay');
        const mainEl = $('shaderpg-main');
        const editorSurface = $('shaderpg-editor-surface');
        const editorHighlightCode = $('shaderpg-editor-highlight-code');
        const editorHighlightWrap = $('shaderpg-editor-highlight');
        const editorAutocomplete = $('shaderpg-autocomplete');
        const commandUiState = {
            key: '',
            values: {}
        };

        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = $('main-nav') || document.querySelector('.main-nav');

        function setMobileMenuState(isOpen) {
            if (!mobileMenuToggle || !mainNav) return;
            mainNav.classList.toggle('active', !!isOpen);
            mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            const bars = mobileMenuToggle.querySelectorAll('.bar');
            bars.forEach((bar, idx) => {
                if (!isOpen) {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                    return;
                }
                if (idx === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                if (idx === 1) bar.style.opacity = '0';
                if (idx === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
            });
        }

        if (mobileMenuToggle && mainNav) {
            if (!mobileMenuToggle.hasAttribute('aria-expanded')) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
            if (mainNav.id) {
                mobileMenuToggle.setAttribute('aria-controls', mainNav.id);
            }

            mobileMenuToggle.addEventListener('click', function (e) {
                e.preventDefault();
                const willOpen = !mainNav.classList.contains('active');
                setMobileMenuState(willOpen);
            });

            document.addEventListener('click', function (e) {
                if (mobileMenuToggle.contains(e.target) || mainNav.contains(e.target)) return;
                if (!mainNav.classList.contains('active')) return;
                setMobileMenuState(false);
            });

            document.addEventListener('keydown', function (e) {
                if (String(e.key || '') !== 'Escape') return;
                if (!mainNav.classList.contains('active')) return;
                setMobileMenuState(false);
            });
        }

        if (!canvas) return;
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: false });
        if (!gl) {
            setText(errorEl, '无法创建 WebGL2 上下文。请使用支持 WebGL2 的桌面浏览器。');
            return;
        }

        const runtime = createRuntime(gl, canvas);

        function setITimeOffset(value, persist) {
            const next = clamp(Number(value || 0), -120, 120);
            runtime.iTimeOffset = next;
            if (iTimeInput) iTimeInput.value = next.toFixed(3);
            if (persist) {
                try {
                    localStorage.setItem(ITIME_OFFSET_STORAGE_KEY, String(next));
                } catch (_) { }
            }
        }

        function currentITimeValue() {
            return Number(runtime.elapsedSec || 0) + Number(runtime.iTimeOffset || 0);
        }

        function refreshITimeDisplay() {
            if (!iTimeInput) return;
            if (document.activeElement === iTimeInput) return;
            iTimeInput.value = currentITimeValue().toFixed(3);
        }

        let savedITimeOffset = 0;
        try {
            savedITimeOffset = Number(localStorage.getItem(ITIME_OFFSET_STORAGE_KEY) || 0);
        } catch (_) {
            savedITimeOffset = 0;
        }
        setITimeOffset(savedITimeOffset, false);

        // WebGL 上下文丢失/恢复处理
        let contextLost = false;

        canvas.addEventListener('webglcontextlost', function (e) {
            e.preventDefault();
            contextLost = true;
            state.isRunning = false;
            runBtn.textContent = '继续';
            runBtn.disabled = true;
            setText(errorEl, 'WebGL 上下文丢失。正在尝试恢复...');
            setText(statusEl, 'Context Lost');
        }, false);

        canvas.addEventListener('webglcontextrestored', function (e) {
            setText(errorEl, '');
            setText(statusEl, '正在重建资源...');

            try {
                recreateRuntimeResources();
                compileAll('上下文恢复');

                contextLost = false;
                runBtn.disabled = false;
                state.isRunning = true;
                runBtn.textContent = '暂停';
                setText(statusEl, '上下文已恢复');
            } catch (err) {
                setText(errorEl, '恢复失败: ' + (err.message || err));
            }
        }, false);

        function recreateRuntimeResources() {
            // 清除旧引用
            runtime.buffers.clear();
            runtime.compiled.clear();
            cleanupUploadEntries();
            runtime.builtins.clear();

            // 重建 VAO/VBO
            const posUv = new Float32Array([-1, -1, 0, 0, 3, -1, 2, 0, -1, 3, 0, 2]);
            runtime.vao = gl.createVertexArray();
            runtime.vbo = gl.createBuffer();
            gl.bindVertexArray(runtime.vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, runtime.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, posUv, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            // 重建内置纹理
            const checker = createBuiltinTextureEntry(gl, 'builtin:checker', 'builtin: checker');
            const noise = createBuiltinTextureEntry(gl, 'builtin:noise', 'builtin: noise');
            if (checker) runtime.builtins.set(checker.id, checker);
            if (noise) runtime.builtins.set(noise.id, noise);

            // 注意：用户上传的纹理会丢失，需要重新上传
            renderTextures();
        }

        function cleanupUploadEntries() {
            runtime.uploads.forEach((entry) => {
                if (entry && entry.texture) {
                    try { gl.deleteTexture(entry.texture); } catch (_) { }
                }
            });
            runtime.uploads.clear();
        }

        let state = (function () {
            const saved = loadState();
            if (!saved) return createDefaultState();
            const base = createDefaultState();
            base.common = typeof saved.common === 'string' ? saved.common : DEFAULT_COMMON;
            if (Array.isArray(saved.passes) && saved.passes.length) {
                base.passes = saved.passes.map((p) => {
                    return {
                        id: p.id || createId('pass'),
                        name: sanitizeName(p.name || 'Pass'),
                        type: (p.type === 'buffer' || p.type === 'image') ? p.type : 'image',
                        scale: Number(p.scale || 1),
                        code: String(p.code || ''),
                        channels: Array.isArray(p.channels) ? p.channels : [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
                    };
                });
            }
            base.selected = saved.selected || base.passes[0].id;
            base.editorTarget = saved.editorTarget || base.selected;
            base.globalScale = normalizeGlobalScale(saved.globalScale);
            base.baseWidth = normalizeBaseWidth(saved.baseWidth || DEFAULT_BASE_WIDTH);
            base.aspectMode = normalizeAspectMode(saved.aspectMode || DEFAULT_ASPECT_MODE);
            base.customAspectW = normalizeRatioComponent(saved.customAspectW, 16);
            base.customAspectH = normalizeRatioComponent(saved.customAspectH, 9);
            base.addressMode = normalizeTextureAddressMode(saved.addressMode);
            return base;
        })();

        const importedPayload = consumeGalleryImportPayload();
        if (importedPayload) {
            const importedState = normalizeImportedPassState(importedPayload, state);
            if (importedState) {
                state = importedState;
            }
        }

        // Editor shows either Common or selected pass.
        editorTa.value = '';
        state.globalScale = normalizeGlobalScale(state.globalScale);
        state.baseWidth = normalizeBaseWidth(state.baseWidth);
        state.aspectMode = normalizeAspectMode(state.aspectMode);
        state.customAspectW = normalizeRatioComponent(state.customAspectW, 16);
        state.customAspectH = normalizeRatioComponent(state.customAspectH, 9);

        if (scaleSelect) scaleSelect.value = String(state.globalScale || 1);
        if (baseWidthInput) baseWidthInput.value = String(state.baseWidth);
        if (aspectSelect) aspectSelect.value = state.aspectMode;
        if (customAspectWInput) customAspectWInput.value = String(state.customAspectW);
        if (customAspectHInput) customAspectHInput.value = String(state.customAspectH);
        applyCanvasAspectRatio(canvas, state);

        function syncResolutionControlsFromState() {
            if (aspectSelect) aspectSelect.value = normalizeAspectMode(state.aspectMode);
            if (customAspectWInput) customAspectWInput.value = String(normalizeRatioComponent(state.customAspectW, 16));
            if (customAspectHInput) customAspectHInput.value = String(normalizeRatioComponent(state.customAspectH, 9));
            if (baseWidthInput) baseWidthInput.value = String(normalizeBaseWidth(state.baseWidth));
            if (scaleSelect) scaleSelect.value = String(normalizeGlobalScale(state.globalScale));
        }

        function refreshCustomAspectUi() {
            if (!customAspectGroup) return;
            const isCustom = normalizeAspectMode(state.aspectMode) === 'custom';
            customAspectGroup.hidden = !isCustom;
        }

        function updateResolutionStateAndPersist() {
            state.globalScale = normalizeGlobalScale(state.globalScale);
            state.baseWidth = normalizeBaseWidth(state.baseWidth);
            state.aspectMode = normalizeAspectMode(state.aspectMode);
            state.customAspectW = normalizeRatioComponent(state.customAspectW, 16);
            state.customAspectH = normalizeRatioComponent(state.customAspectH, 9);
            syncResolutionControlsFromState();
            refreshCustomAspectUi();
            applyCanvasAspectRatio(canvas, state);
            saveState(state);
            if (!state.isRunning && !contextLost) {
                try {
                    renderFrame(runtime, state);
                } catch (_) { }
            }
        }

        syncResolutionControlsFromState();
        refreshCustomAspectUi();
        if (addressModeSelect) addressModeSelect.value = normalizeTextureAddressMode(state.addressMode);

        const completionState = {
            items: [],
            selected: 0,
            start: 0,
            end: 0,
            visible: false
        };

        function getCaretVisualPosition(textarea, cursorPos) {
            const el = textarea;
            const raw = String(el.value || '');
            const pos = clamp(Number(cursorPos || 0), 0, raw.length);
            const cs = window.getComputedStyle(el);

            const mirror = createEl('div');
            const marker = createEl('span');
            const props = [
                'boxSizing', 'width', 'height',
                'overflowX', 'overflowY',
                'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
                'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
                'lineHeight', 'fontFamily', 'letterSpacing', 'textTransform',
                'textIndent', 'textDecoration', 'wordSpacing', 'tabSize'
            ];

            props.forEach((name) => {
                mirror.style[name] = cs[name];
            });

            mirror.style.position = 'absolute';
            mirror.style.visibility = 'hidden';
            mirror.style.left = '-99999px';
            mirror.style.top = '0';
            mirror.style.pointerEvents = 'none';
            mirror.style.whiteSpace = 'pre';
            mirror.style.wordBreak = 'normal';
            mirror.style.overflow = 'hidden';

            mirror.textContent = raw.slice(0, pos);
            marker.textContent = '\u200b';
            mirror.appendChild(marker);
            document.body.appendChild(mirror);

            const left = marker.offsetLeft - el.scrollLeft;
            const top = marker.offsetTop - el.scrollTop;
            const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 12) * 1.55;

            document.body.removeChild(mirror);
            return { left: left, top: top, lineHeight: lineHeight };
        }

        function positionAutocompleteAtCursor() {
            if (!editorAutocomplete || !editorSurface || !completionState.visible) return;

            const caret = getCaretVisualPosition(editorTa, editorTa.selectionStart || 0);
            const taRect = editorTa.getBoundingClientRect();
            const surfaceRect = editorSurface.getBoundingClientRect();

            let left = (taRect.left - surfaceRect.left) + caret.left + 6;
            let top = (taRect.top - surfaceRect.top) + caret.top + caret.lineHeight + 6;

            const panelWidth = editorAutocomplete.offsetWidth || 260;
            const panelHeight = editorAutocomplete.offsetHeight || 180;
            const surfaceWidth = editorSurface.clientWidth || 0;
            const surfaceHeight = editorSurface.clientHeight || 0;
            const edgePadding = 8;

            const maxLeft = Math.max(edgePadding, surfaceWidth - panelWidth - edgePadding);
            left = clamp(left, edgePadding, maxLeft);

            const maxTop = Math.max(edgePadding, surfaceHeight - panelHeight - edgePadding);
            if (top > maxTop) {
                top = (taRect.top - surfaceRect.top) + caret.top - panelHeight - 6;
            }
            top = clamp(top, edgePadding, maxTop);

            editorAutocomplete.style.left = Math.round(left) + 'px';
            editorAutocomplete.style.top = Math.round(top) + 'px';
        }

        function syncEditorScroll() {
            if (editorHighlightWrap) {
                editorHighlightWrap.scrollTop = editorTa.scrollTop;
                editorHighlightWrap.scrollLeft = editorTa.scrollLeft;
            }
            if (!completionState.visible) return;
            positionAutocompleteAtCursor();
        }

        function refreshEditorHighlight() {
            if (!editorHighlightCode) return;
            if (!editorAssist || typeof editorAssist.highlightHlslToHtml !== 'function') {
                editorHighlightCode.textContent = String(editorTa.value || '');
                return;
            }
            editorHighlightCode.innerHTML = editorAssist.highlightHlslToHtml(editorTa.value || '');
            syncEditorScroll();
        }

        function syncEditorSizing() {
            if (!completionState.visible) return;
            positionAutocompleteAtCursor();
        }

        function hideAutocomplete() {
            completionState.items = [];
            completionState.selected = 0;
            completionState.start = 0;
            completionState.end = 0;
            completionState.visible = false;
            if (editorAutocomplete) {
                editorAutocomplete.classList.remove('show');
                editorAutocomplete.replaceChildren();
                editorAutocomplete.style.left = '';
                editorAutocomplete.style.top = '';
            }
        }

        function applyCompletionAtSelected() {
            if (!editorAssist || completionState.items.length === 0) return false;
            const current = completionState.items[completionState.selected];
            if (!current) return false;

            const res = editorAssist.applyCompletion(editorTa.value, editorTa.selectionStart, current);
            editorTa.value = res.text;
            editorTa.selectionStart = res.cursor;
            editorTa.selectionEnd = res.cursor;
            refreshEditorHighlight();
            hideAutocomplete();
            return true;
        }

        function renderAutocomplete() {
            if (!editorAutocomplete || !completionState.visible || completionState.items.length === 0) {
                hideAutocomplete();
                return;
            }

            editorAutocomplete.replaceChildren();
            completionState.items.forEach((word, idx) => {
                const btn = createEl('button', 'shaderpg-autocomplete-item');
                btn.type = 'button';
                btn.textContent = word;
                btn.setAttribute('data-selected', idx === completionState.selected ? 'true' : 'false');
                btn.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    completionState.selected = idx;
                    applyCompletionAtSelected();
                    commitEditorToState();
                    saveState(state);
                    const pass = getSelectedPass();
                    if (getEditorTarget() === COMMON_TAB_ID) {
                        scheduleCompile('Common', null);
                    } else if (pass) {
                        scheduleCompile(pass.name, pass.id);
                    }
                });
                editorAutocomplete.appendChild(btn);
            });
            editorAutocomplete.classList.add('show');
            positionAutocompleteAtCursor();
        }

        function showAutocompleteForCurrentCursor() {
            if (!editorAssist || !editorAutocomplete) return;
            const range = editorAssist.getCompletionRange(editorTa.value, editorTa.selectionStart);
            if (!range || !range.prefix) {
                hideAutocomplete();
                return;
            }
            const items = editorAssist.collectCompletionItems(range.prefix, editorTa.value, editorTa.selectionStart);
            if (!items.length) {
                hideAutocomplete();
                return;
            }

            completionState.items = items;
            completionState.selected = 0;
            completionState.start = range.start;
            completionState.end = range.end;
            completionState.visible = true;
            renderAutocomplete();
        }

        function afterEditorChanged() {
            refreshEditorHighlight();
            syncEditorSizing();
            showAutocompleteForCurrentCursor();
        }

        function setError(text) {
            setText(errorEl, text);
        }

        function setStatus(text) {
            setText(statusEl, text);
        }

        function getCurrentEditorSourceText() {
            const target = getEditorTarget();
            if (target === COMMON_TAB_ID) return String(state.common || '');
            const pass = getSelectedPass();
            return pass ? String(pass.code || '') : '';
        }

        function setCurrentEditorSourceText(nextText) {
            const target = getEditorTarget();
            const next = String(nextText || '');
            if (target === COMMON_TAB_ID) {
                state.common = next;
            } else {
                const pass = getSelectedPass();
                if (pass) pass.code = next;
            }
            editorTa.value = next;
        }

        function applyEditorSourceMutation(nextSourceText, persist) {
            setCurrentEditorSourceText(nextSourceText);
            afterEditorChanged();
            hideAutocomplete();
            if (persist) saveState(state);

            const target = getEditorTarget();
            if (target === COMMON_TAB_ID) {
                scheduleCompile('Common', null);
                return;
            }
            const pass = getSelectedPass();
            if (pass) scheduleCompile(pass.name, pass.id);
        }

        function renderCommandControls() {
            if (!commandVarsEl) return;
            commandVarsEl.replaceChildren();

            if (!commandParamsAdapter || typeof commandParamsAdapter.parseCommandVariables !== 'function') {
                return;
            }

            const source = getCurrentEditorSourceText();
            const vars = commandParamsAdapter.parseCommandVariables(source);
            const nextKey = vars.map((v) => String(v.name)).join('|');
            if (commandUiState.key !== nextKey) {
                commandUiState.key = nextKey;
                commandUiState.values = {};
            }

            if (vars.length === 0) {
                const empty = createEl('div', 'shaderpg-command-empty');
                empty.textContent = '当前无 Command 变量。示例：float speed = 1.0; // Command(min=0,max=4,step=0.1)';
                commandVarsEl.appendChild(empty);
                return;
            }

            for (const v of vars) {
                const item = createEl('div', 'shaderpg-command-item');

                const label = createEl('label', 'shaderpg-command-name');
                const inputId = 'shaderpg-command-' + v.name;
                label.setAttribute('for', inputId);
                label.textContent = v.name;

                const input = createEl('input', 'shaderpg-number');
                input.type = 'number';
                input.id = inputId;
                input.step = String(v.step);
                input.min = String(v.min);
                input.max = String(v.max);

                const hasSaved = Object.prototype.hasOwnProperty.call(commandUiState.values, v.name);
                const current = hasSaved ? commandUiState.values[v.name] : v.value;
                const clamped = commandParamsAdapter.clampCommandValue(v.type, current, v.min, v.max);
                commandUiState.values[v.name] = clamped;
                input.value = commandParamsAdapter.formatCommandNumber(v.type, clamped);

                function updateCommandVariableValue(persist) {
                    const raw = Number(input.value);
                    const nextValue = commandParamsAdapter.clampCommandValue(v.type, raw, v.min, v.max);
                    commandUiState.values[v.name] = nextValue;
                    input.value = commandParamsAdapter.formatCommandNumber(v.type, nextValue);

                    const sourceBefore = getCurrentEditorSourceText();
                    const nextSource = commandParamsAdapter.applyCommandValues(sourceBefore, {
                        [v.name]: nextValue
                    });

                    if (nextSource === sourceBefore) return;
                    applyEditorSourceMutation(nextSource, persist);
                }

                input.addEventListener('change', function () {
                    updateCommandVariableValue(true);
                });

                input.addEventListener('blur', function () {
                    updateCommandVariableValue(true);
                });

                item.appendChild(label);
                item.appendChild(input);
                commandVarsEl.appendChild(item);
            }
        }

        function getSelectedPass() {
            return state.passes.find((p) => String(p.id) === String(state.selected)) || state.passes[0] || null;
        }

        function getEditorTarget() {
            const t = String(state.editorTarget || '');
            if (t === COMMON_TAB_ID) return COMMON_TAB_ID;
            if (state.passes.some((p) => String(p.id) === t)) return t;
            return state.selected;
        }

        function getPassIndexById(id) {
            return state.passes.findIndex((p) => String(p.id) === String(id));
        }

        function ensureSelected() {
            if (state.passes.some((p) => String(p.id) === String(state.selected))) return;
            state.selected = state.passes.length ? state.passes[0].id : '';
        }

        function renderPassTabs() {
            ensureSelected();
            passTabs.replaceChildren();

            const commonTab = createEl('button', 'shaderpg-pass-tab');
            commonTab.type = 'button';
            commonTab.setAttribute('role', 'tab');
            commonTab.setAttribute('aria-selected', getEditorTarget() === COMMON_TAB_ID ? 'true' : 'false');
            commonTab.setAttribute('data-pass-id', COMMON_TAB_ID);

            const commonName = createEl('span');
            commonName.textContent = 'Common';
            const commonChip = createEl('span', 'shaderpg-pass-chip');
            commonChip.textContent = 'Global';
            commonTab.appendChild(commonName);
            commonTab.appendChild(commonChip);
            commonTab.addEventListener('click', function () {
                state.editorTarget = COMMON_TAB_ID;
                syncEditor();
                renderPassTabs();
                saveState(state);
            });
            passTabs.appendChild(commonTab);

            state.passes.forEach((p, idx) => {
                const tab = createEl('button', 'shaderpg-pass-tab');
                tab.type = 'button';
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', getEditorTarget() === String(p.id) ? 'true' : 'false');
                tab.setAttribute('data-pass-id', String(p.id));

                const name = createEl('span');
                name.textContent = p.name;
                const chip = createEl('span', 'shaderpg-pass-chip');
                chip.textContent = p.type === 'buffer' ? 'Buffer' : 'Image';
                tab.appendChild(name);
                tab.appendChild(chip);

                tab.addEventListener('click', function () {
                    state.selected = p.id;
                    state.editorTarget = p.id;
                    syncEditor();
                    renderAll();
                    saveState(state);
                });

                tab.addEventListener('dblclick', function () {
                    const next = prompt('Pass 名称：', p.name);
                    if (next === null) return;
                    p.name = sanitizeName(next);
                    renderAll();
                    saveState(state);
                });

                passTabs.appendChild(tab);
            });

            updatePassActionButtons();
        }

        function updatePassActionButtons() {
            const idx = getPassIndexById(state.selected);
            const len = state.passes.length;
            if (moveLeftBtn) moveLeftBtn.disabled = idx <= 0;
            if (moveRightBtn) moveRightBtn.disabled = idx < 0 || idx >= len - 1;
            if (deleteBtn) deleteBtn.disabled = len <= 1;
        }

        function renderChannels() {
            const pass = getSelectedPass();
            channelsEl.replaceChildren();
            if (!pass) return;
            for (let i = 0; i < 4; i += 1) {
                const row = createEl('div', 'shaderpg-channel-row');
                const label = document.createElement('label');
                label.className = 'shaderpg-channel-label';
                label.textContent = 'iChannel' + i;
                const select = document.createElement('select');
                select.className = 'btn btn-small btn-outline';
                select.id = 'shaderpg-channel-' + i;
                select.name = 'shaderpg-channel-' + i;
                label.setAttribute('for', select.id);

                if (pass.type === 'image') {
                    const imageOnly = document.createElement('option');
                    imageOnly.value = '__image_pass_note__';
                    imageOnly.textContent = 'Image Pass：建议只连接上游 Buffer';
                    imageOnly.disabled = true;
                    select.appendChild(imageOnly);
                }

                const opts = [];
                opts.push({ value: 'none', label: 'None' });
                opts.push({ value: 'builtin:checker', label: 'builtin: checker' });
                opts.push({ value: 'builtin:noise', label: 'builtin: noise' });
                // Uploads
                runtime.uploads.forEach((t) => {
                    opts.push({ value: 'upload:' + t.id, label: 'upload: ' + t.label });
                });
                // Buffers
                const selectedIndex = state.passes.findIndex((p) => String(p.id) === String(pass.id));
                state.passes.forEach((p, idx) => {
                    if (p.type !== 'buffer') return;
                    if (idx > selectedIndex && String(p.id) !== String(pass.id)) return;
                    opts.push({ value: 'buffer:' + p.id + ':prev', label: 'buffer: ' + p.name + ' (prev)' });
                    opts.push({ value: 'buffer:' + p.id + ':current', label: 'buffer: ' + p.name + ' (current)' });
                });

                opts.forEach((o) => {
                    const opt = document.createElement('option');
                    opt.value = o.value;
                    opt.textContent = o.label;
                    select.appendChild(opt);
                });

                const current = pass.channels && pass.channels[i] ? pass.channels[i] : { kind: 'none' };
                select.value = encodeChannelValue(current);
                select.addEventListener('change', function () {
                    pass.channels[i] = decodeChannelValue(select.value);
                    saveState(state);
                });

                row.appendChild(label);
                row.appendChild(select);
                channelsEl.appendChild(row);
            }
        }

        function encodeChannelValue(ch) {
            if (!ch || !ch.kind || ch.kind === 'none') return 'none';
            if (ch.kind === 'builtin') return String(ch.id);
            if (ch.kind === 'upload') return 'upload:' + String(ch.id);
            if (ch.kind === 'buffer') return 'buffer:' + String(ch.passId) + ':' + String(ch.frame || 'prev');
            return 'none';
        }

        function decodeChannelValue(v) {
            const s = String(v || 'none');
            if (s === 'none') return { kind: 'none' };
            if (s === 'builtin:checker' || s === 'builtin:noise') return { kind: 'builtin', id: s };
            if (s.startsWith('upload:')) return { kind: 'upload', id: s.slice('upload:'.length) };
            if (s.startsWith('buffer:')) {
                const parts = s.split(':');
                return { kind: 'buffer', passId: parts[1] || '', frame: parts[2] || 'prev' };
            }
            return { kind: 'none' };
        }

        function renderTextures() {
            texturesEl.replaceChildren();
            if (runtime.uploads.size === 0) {
                const empty = createEl('div');
                empty.textContent = '未上传图片。可用右上角“选择文件”。';
                texturesEl.appendChild(empty);
                return;
            }
            runtime.uploads.forEach((t) => {
                const item = createEl('div', 'shaderpg-texture-item');
                const metaWrap = createEl('div');
                const name = createEl('div', 'shaderpg-texture-name');
                name.textContent = t.label + ' (' + t.width + 'x' + t.height + ')';
                const meta = createEl('div', 'shaderpg-texture-meta');
                if (t.isAnimatedGif && t.gifData && Array.isArray(t.gifData.frames)) {
                    meta.textContent = 'GIF 动态纹理 | ' + t.gifData.frames.length + ' 帧';
                } else {
                    meta.textContent = '静态纹理';
                }
                metaWrap.appendChild(name);
                metaWrap.appendChild(meta);
                const del = createEl('button', 'btn btn-small btn-outline');
                del.type = 'button';
                del.textContent = '移除';
                del.addEventListener('click', function () {
                    if (t.texture) {
                        try { gl.deleteTexture(t.texture); } catch (_) { }
                    }
                    runtime.uploads.delete(t.id);
                    // Remove references
                    state.passes.forEach((p) => {
                        (p.channels || []).forEach((ch) => {
                            if (ch && ch.kind === 'upload' && String(ch.id) === String(t.id)) {
                                ch.kind = 'none';
                                delete ch.id;
                            }
                        });
                    });
                    renderChannels();
                    renderTextures();
                    saveState(state);
                });
                item.appendChild(metaWrap);
                item.appendChild(del);
                texturesEl.appendChild(item);
            });
        }

        function syncEditor() {
            const target = getEditorTarget();
            if (target === COMMON_TAB_ID) {
                editorTa.value = String(state.common || '');
                afterEditorChanged();
                renderCommandControls();
                hideAutocomplete();
                return;
            }
            const pass = state.passes.find((p) => String(p.id) === String(state.editorTarget)) || getSelectedPass();
            editorTa.value = pass ? pass.code : '';
            afterEditorChanged();
            renderCommandControls();
            hideAutocomplete();
        }

        function compileAll(reason) {
            setError('');
            const passIndexMap = new Map();
            state.passes.forEach((p, idx) => {
                passIndexMap.set(String(p.id), idx);
            });

            const compileStart = nowMs();
            for (const pass of state.passes) {
                const res = compilePass(runtime, state.common, pass);
                if (!res.ok) {
                    setError('[' + pass.name + ']\n' + res.error);
                    continue;
                }
                // Replace old program
                const old = runtime.compiled.get(String(pass.id));
                if (old && old.program) {
                    try { gl.deleteProgram(old.program); } catch (_) { }
                }
                runtime.compiled.set(String(pass.id), { program: res.program, uniforms: res.uniforms });
            }

            const ms = Math.max(0, Math.round(nowMs() - compileStart));
            setStatus('Compiled in ' + ms + ' ms' + (reason ? ' (' + reason + ')' : ''));
            updateTabErrorBadges();
        }

        function compileSinglePass(passId) {
            const pass = state.passes.find((p) => String(p.id) === String(passId));
            if (!pass) return { ok: false, error: 'Pass not found' };

            const res = compilePass(runtime, state.common, pass);
            if (!res.ok) {
                return { ok: false, error: '[' + pass.name + ']\n' + res.error, passName: pass.name };
            }

            // 替换旧程序
            const old = runtime.compiled.get(String(pass.id));
            if (old && old.program) {
                try { gl.deleteProgram(old.program); } catch (_) { }
            }
            runtime.compiled.set(String(pass.id), { program: res.program, uniforms: res.uniforms });

            return { ok: true, passName: pass.name };
        }

        function commitEditorToState() {
            const target = getEditorTarget();
            if (target === COMMON_TAB_ID) {
                state.common = editorTa.value;
                return;
            }
            const pass = getSelectedPass();
            if (pass) {
                pass.code = editorTa.value;
            }
        }

        function updateTabErrorBadges() {
            const errText = String(errorEl.textContent || '').trim();
            const m = errText.match(/^\[([^\]]+)\]/);
            const errPassName = m ? m[1] : '';
            const tabs = passTabs.querySelectorAll('button.shaderpg-pass-tab');
            tabs.forEach((tab) => {
                const pid = tab.getAttribute('data-pass-id');
                const pass = state.passes.find((p) => String(p.id) === String(pid));
                const hasError = errPassName && pass && pass.name === errPassName;
                tab.setAttribute('data-error', hasError ? 'true' : 'false');
            });
        }

        function renderAll() {
            renderPassTabs();
            renderChannels();
            renderTextures();
        }

        addPassBtn.addEventListener('click', function () {
            const nextNum = state.passes.length + 1;
            const defaultName = 'Pass ' + nextNum;
            const name = prompt('Pass 名称：', defaultName);
            if (name === null) return;

            const makeBuffer = confirm('将此 Pass 作为 Buffer Pass 创建？\n选择“取消”会创建为 Image Pass。');

            const pass = {
                id: createId('pass'),
                name: sanitizeName(name),
                type: makeBuffer ? 'buffer' : 'image',
                scale: 1,
                code: [
                    '// ' + sanitizeName(name),
                    makeBuffer
                        ? 'float4 mainImage(float2 fragCoord)'
                        : 'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
                    '{',
                    makeBuffer
                        ? '    float2 uv = fragCoord / iResolution.xy;'
                        : '    float2 uv = texCoord;',
                    '    return float4(uv, 0.0, 1.0);',
                    '}',
                    ''
                ].join('\n'),
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            };
            state.passes.push(pass);
            state.selected = pass.id;
            state.editorTarget = pass.id;
            syncEditor();
            renderAll();
            saveState(state);
        });

        if (moveLeftBtn) {
            moveLeftBtn.addEventListener('click', function () {
                const idx = getPassIndexById(state.selected);
                if (idx <= 0) return;
                const tmp = state.passes[idx - 1];
                state.passes[idx - 1] = state.passes[idx];
                state.passes[idx] = tmp;
                renderAll();
                saveState(state);
            });
        }

        if (moveRightBtn) {
            moveRightBtn.addEventListener('click', function () {
                const idx = getPassIndexById(state.selected);
                if (idx < 0 || idx >= state.passes.length - 1) return;
                const tmp = state.passes[idx + 1];
                state.passes[idx + 1] = state.passes[idx];
                state.passes[idx] = tmp;
                renderAll();
                saveState(state);
            });
        }

        if (renameBtn) {
            renameBtn.addEventListener('click', function () {
                const pass = getSelectedPass();
                if (!pass) return;
                const next = prompt('Pass 名称：', pass.name);
                if (next === null) return;
                pass.name = sanitizeName(next);
                renderAll();
                saveState(state);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                const pass = getSelectedPass();
                if (!pass) return;
                if (state.passes.length <= 1) return;
                if (!confirm('删除 pass: ' + pass.name + ' ?')) return;

                // 清理 buffer 资源
                if (pass.type === 'buffer') {
                    const buf = runtime.buffers.get(String(pass.id));
                    if (buf) {
                        try {
                            gl.deleteFramebuffer(buf.fboRead);
                            gl.deleteFramebuffer(buf.fboWrite);
                            gl.deleteTexture(buf.texRead);
                            gl.deleteTexture(buf.texWrite);
                        } catch (e) {
                            console.warn('Failed to clean up buffer:', e);
                        }
                        runtime.buffers.delete(String(pass.id));
                    }
                }

                // 清理编译的程序
                const compiled = runtime.compiled.get(String(pass.id));
                if (compiled && compiled.program) {
                    try {
                        gl.deleteProgram(compiled.program);
                    } catch (e) {
                        console.warn('Failed to clean up program:', e);
                    }
                    runtime.compiled.delete(String(pass.id));
                }

                state.passes = state.passes.filter((x) => String(x.id) !== String(pass.id));
                state.passes.forEach((pp) => {
                    (pp.channels || []).forEach((ch) => {
                        if (ch && ch.kind === 'buffer' && String(ch.passId) === String(pass.id)) {
                            ch.kind = 'none';
                            delete ch.passId;
                            delete ch.frame;
                        }
                    });
                });

                ensureSelected();
                syncEditor();
                renderAll();
                saveState(state);
            });
        }

        compileBtn.addEventListener('click', function () {
            commitEditorToState();
            saveState(state);
            compileAll('手动');
        });

        resetBtn.addEventListener('click', function () {
            if (!confirm('重置为示例内容？（会覆盖当前代码与 pass 列表）')) return;
            state = createDefaultState();
            syncResolutionControlsFromState();
            refreshCustomAspectUi();
            applyCanvasAspectRatio(canvas, state);
            if (addressModeSelect) addressModeSelect.value = normalizeTextureAddressMode(state.addressMode);
            syncEditor();
            renderAll();
            saveState(state);
            compileAll('重置示例');
        });

        editorTa.addEventListener('input', function () {
            commitEditorToState();
            saveState(state);
            afterEditorChanged();
            renderCommandControls();

            const target = getEditorTarget();
            if (target === COMMON_TAB_ID) {
                scheduleCompile('Common', null);
                return;
            }

            const pass = getSelectedPass();
            if (!pass) return;
            scheduleCompile(pass.name, pass.id);
        });

        editorTa.addEventListener('scroll', syncEditorScroll);
        window.addEventListener('resize', syncEditorSizing);
        editorTa.addEventListener('click', showAutocompleteForCurrentCursor);
        editorTa.addEventListener('keyup', function (e) {
            const key = String(e.key || '');
            if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter' || key === 'Escape' || key === 'Tab') {
                return;
            }
            showAutocompleteForCurrentCursor();
        });

        editorTa.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' && (e.shiftKey || !completionState.visible || completionState.items.length === 0)) {
                e.preventDefault();
                indentSelection(editorTa, e.shiftKey);
                commitEditorToState();
                saveState(state);
                afterEditorChanged();
                renderCommandControls();

                const target = getEditorTarget();
                if (target === COMMON_TAB_ID) {
                    scheduleCompile('Common', null);
                } else {
                    const pass = getSelectedPass();
                    if (pass) scheduleCompile(pass.name, pass.id);
                }
                return;
            }

            if (!completionState.visible || completionState.items.length === 0) {
                if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
                    e.preventDefault();
                    showAutocompleteForCurrentCursor();
                }
                return;
            }

            const key = String(e.key || '');
            if (key === 'ArrowDown') {
                e.preventDefault();
                completionState.selected = (completionState.selected + 1) % completionState.items.length;
                renderAutocomplete();
                return;
            }
            if (key === 'ArrowUp') {
                e.preventDefault();
                completionState.selected = (completionState.selected - 1 + completionState.items.length) % completionState.items.length;
                renderAutocomplete();
                return;
            }
            if (key === 'Enter' || key === 'Tab') {
                e.preventDefault();
                if (applyCompletionAtSelected()) {
                    commitEditorToState();
                    saveState(state);
                    const target = getEditorTarget();
                    if (target === COMMON_TAB_ID) {
                        scheduleCompile('Common', null);
                    } else {
                        const pass = getSelectedPass();
                        if (pass) scheduleCompile(pass.name, pass.id);
                    }
                }
                return;
            }
            if (key === 'Escape') {
                e.preventDefault();
                hideAutocomplete();
                return;
            }
            if (!isIdentifierChar(key) && key !== 'Backspace' && key !== 'Delete') {
                hideAutocomplete();
            }
        });

        if (scaleSelect) {
            scaleSelect.addEventListener('change', function () {
                state.globalScale = normalizeGlobalScale(scaleSelect.value);
                updateResolutionStateAndPersist();
            });
        }

        if (aspectSelect) {
            aspectSelect.addEventListener('change', function () {
                state.aspectMode = normalizeAspectMode(aspectSelect.value);
                updateResolutionStateAndPersist();
            });
        }

        if (baseWidthInput) {
            baseWidthInput.addEventListener('change', function () {
                state.baseWidth = normalizeBaseWidth(baseWidthInput.value);
                updateResolutionStateAndPersist();
            });
            baseWidthInput.addEventListener('blur', function () {
                state.baseWidth = normalizeBaseWidth(baseWidthInput.value);
                updateResolutionStateAndPersist();
            });
        }

        if (customAspectWInput) {
            customAspectWInput.addEventListener('change', function () {
                state.customAspectW = normalizeRatioComponent(customAspectWInput.value, 16);
                updateResolutionStateAndPersist();
            });
            customAspectWInput.addEventListener('blur', function () {
                state.customAspectW = normalizeRatioComponent(customAspectWInput.value, 16);
                updateResolutionStateAndPersist();
            });
        }

        if (customAspectHInput) {
            customAspectHInput.addEventListener('change', function () {
                state.customAspectH = normalizeRatioComponent(customAspectHInput.value, 9);
                updateResolutionStateAndPersist();
            });
            customAspectHInput.addEventListener('blur', function () {
                state.customAspectH = normalizeRatioComponent(customAspectHInput.value, 9);
                updateResolutionStateAndPersist();
            });
        }

        if (addressModeSelect) {
            addressModeSelect.addEventListener('change', function () {
                state.addressMode = normalizeTextureAddressMode(addressModeSelect.value);
                addressModeSelect.value = state.addressMode;
                saveState(state);
                if (!state.isRunning && !contextLost) {
                    try {
                        renderFrame(runtime, state);
                    } catch (_) { }
                }
            });
        }

        function rerenderWithCurrentITime() {
            if (state.isRunning || contextLost) return;
            try {
                renderFrame(runtime, state);
            } catch (_) { }
            refreshITimeDisplay();
        }

        function resetPlaybackClock() {
            const current = nowMs();
            runtime.startMs = current;
            runtime.lastMs = current;
            runtime.elapsedSec = 0;
            setITimeOffset(0, true);
            runtime.frame = 0;
            if (!contextLost) {
                try {
                    renderFrame(runtime, state);
                } catch (_) { }
            }
            setStatus('播放时间已重置');
        }

        function applyITimeFromInput(persist) {
            if (!iTimeInput) return;
            const raw = Number(iTimeInput.value);
            if (!isFinite(raw)) return;
            setITimeOffset(raw - Number(runtime.elapsedSec || 0), persist);
            rerenderWithCurrentITime();
            refreshITimeDisplay();
        }

        if (iTimeInput) {
            iTimeInput.addEventListener('change', function () {
                applyITimeFromInput(true);
            });
            iTimeInput.addEventListener('blur', function () {
                applyITimeFromInput(true);
            });
        }

        if (iTimeMinusBtn) {
            iTimeMinusBtn.addEventListener('click', function () {
                setITimeOffset(Number(runtime.iTimeOffset || 0) - 1, true);
                rerenderWithCurrentITime();
                refreshITimeDisplay();
            });
        }

        if (iTimePlusBtn) {
            iTimePlusBtn.addEventListener('click', function () {
                setITimeOffset(Number(runtime.iTimeOffset || 0) + 1, true);
                rerenderWithCurrentITime();
                refreshITimeDisplay();
            });
        }

        if (iTimeResetBtn) {
            iTimeResetBtn.addEventListener('click', function () {
                setITimeOffset(-Number(runtime.elapsedSec || 0), true);
                rerenderWithCurrentITime();
                refreshITimeDisplay();
            });
        }

        if (resetPlaybackBtn) {
            resetPlaybackBtn.addEventListener('click', function () {
                resetPlaybackClock();
            });
        }

        async function addStaticUploadTexture(file) {
            const img = await loadImageFromFile(file);
            const tex = createTextureFromImage(gl, img, true);
            const id = createId('upload');
            runtime.uploads.set(id, {
                id: id,
                label: file.name,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                texture: tex,
                isAnimatedGif: false,
                currentFrame: 0,
                gifData: null
            });
            return id;
        }

        async function addGifUploadTexture(file) {
            let gifData = null;
            try {
                gifData = await decodeGifFramesWithImageDecoder(file);
            } catch (_) {
                gifData = null;
            }
            if (!gifData) {
                try {
                    gifData = await decodeGifFramesWithGifuct(file);
                } catch (_) {
                    gifData = null;
                }
            }
            if (!gifData || !gifData.frames || gifData.frames.length === 0) {
                return addStaticUploadTexture(file);
            }

            const firstFrame = gifData.frames[0];
            const tex = createTextureFromImage(gl, firstFrame.canvas, true);
            const id = createId('upload');
            runtime.uploads.set(id, {
                id: id,
                label: file.name,
                width: gifData.width,
                height: gifData.height,
                texture: tex,
                isAnimatedGif: true,
                currentFrame: 0,
                gifData: gifData
            });
            return id;
        }

        async function addUploadTextureFromFile(file) {
            if (isGifFile(file)) {
                return addGifUploadTexture(file);
            }
            return addStaticUploadTexture(file);
        }

        function exportCanvasAsPng() {
            commitEditorToState();
            if (!contextLost) {
                try {
                    renderFrame(runtime, state);
                } catch (_) { }
            }

            let dataUrl = '';
            try {
                dataUrl = canvas.toDataURL('image/png');
            } catch (_) {
                setStatus('导出 PNG 失败');
                return;
            }
            if (!dataUrl) {
                setStatus('导出 PNG 失败');
                return;
            }

            const res = computeRenderResolution(state);
            const targetPass = getSelectedPass();
            const passName = sanitizeName(targetPass ? targetPass.name : 'shader').replace(/\s+/g, '-');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = [
                passName,
                res.renderWidth + 'x' + res.renderHeight,
                timestamp
            ].join('_') + '.png';

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatus('PNG 已导出: ' + filename);
        }

        function drawFrameAtITime(absTimeSec) {
            const oldRunning = !!state.isRunning;
            const oldElapsed = Number(runtime.elapsedSec || 0);
            const oldOffset = Number(runtime.iTimeOffset || 0);
            state.isRunning = false;
            runtime.elapsedSec = 0;
            runtime.iTimeOffset = absTimeSec;
            try {
                renderFrame(runtime, state);
            } finally {
                runtime.elapsedSec = oldElapsed;
                runtime.iTimeOffset = oldOffset;
                state.isRunning = oldRunning;
            }
        }

        async function exportCanvasAsGif() {
            const GifEncoder = getGifEncoderApi();
            if (!GifEncoder) {
                setStatus('导出 GIF 失败: 编码器未加载');
                return;
            }

            const rawDuration = prompt('导出 GIF 时长（秒，1-10）', String(GIF_EXPORT_DEFAULT_SECONDS));
            if (rawDuration === null) return;

            const durationNum = Number(rawDuration);
            const durationSec = isFinite(durationNum)
                ? clamp(durationNum, 1, GIF_EXPORT_MAX_SECONDS)
                : GIF_EXPORT_DEFAULT_SECONDS;
            const frameCount = Math.max(2, Math.round(durationSec * GIF_EXPORT_FPS));
            const delayMs = Math.max(16, Math.round(1000 / GIF_EXPORT_FPS));
            const timeoutMs = Math.max(6000, Math.round(durationSec * 1000 * 8));

            commitEditorToState();
            const targetPass = getSelectedPass();
            const passName = sanitizeName(targetPass ? targetPass.name : 'shader').replace(/\s+/g, '-');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            const oldRunning = !!state.isRunning;
            const oldLastMs = Number(runtime.lastMs || nowMs());
            const oldElapsed = Number(runtime.elapsedSec || 0);
            const oldOffset = Number(runtime.iTimeOffset || 0);
            const oldBtnText = exportGifBtn ? String(exportGifBtn.textContent || '导出 GIF') : '导出 GIF';

            try {
                state.isRunning = false;
                if (exportGifBtn) {
                    exportGifBtn.disabled = true;
                    exportGifBtn.textContent = '导出中...';
                }

                drawFrameAtITime(0);
                const res = computeRenderResolution(state);
                const filename = [passName, res.renderWidth + 'x' + res.renderHeight, timestamp].join('_') + '.gif';

                const encoder = new GifEncoder({
                    workers: 2,
                    quality: 10,
                    width: canvas.width,
                    height: canvas.height,
                    workerScript: '/site/assets/js/vendor/gif.worker.js'
                });

                let lastProgress = -1;
                const blobPromise = new Promise((resolve, reject) => {
                    encoder.on('finished', function (blob) {
                        resolve(blob);
                    });
                    encoder.on('error', function (error) {
                        reject(error || new Error('GIF 编码失败'));
                    });
                    encoder.on('abort', function () {
                        reject(new Error('GIF 导出已中断'));
                    });
                    encoder.on('progress', function (value) {
                        const p = clamp(Math.round(Number(value || 0) * 100), 0, 100);
                        if (p === lastProgress) return;
                        lastProgress = p;
                        if (p % 10 === 0 || p >= 99) {
                            setStatus('正在导出 GIF... ' + p + '%');
                        }
                    });
                });

                for (let i = 0; i < frameCount; i += 1) {
                    const t = (i / frameCount) * durationSec;
                    drawFrameAtITime(t);
                    encoder.addFrame(canvas, { copy: true, delay: delayMs });
                }

                setStatus('正在导出 GIF...');
                encoder.render();

                const blob = await Promise.race([
                    blobPromise,
                    new Promise((_, reject) => {
                        setTimeout(function () {
                            reject(new Error('GIF 导出超时，请降低分辨率或缩短时长'));
                        }, timeoutMs);
                    })
                ]);

                if (!blob || (typeof blob.size === 'number' && blob.size <= 0)) {
                    throw new Error('导出的 GIF 为空');
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setStatus('GIF 已导出: ' + filename);
            } catch (error) {
                console.warn('GIF export failed:', error);
                setStatus('导出 GIF 失败: ' + String(error && error.message ? error.message : error));
            } finally {
                runtime.elapsedSec = oldElapsed;
                runtime.iTimeOffset = oldOffset;
                runtime.lastMs = oldRunning ? nowMs() : oldLastMs;
                state.isRunning = oldRunning;
                if (exportGifBtn) {
                    exportGifBtn.disabled = false;
                    exportGifBtn.textContent = oldBtnText;
                }
                if (!contextLost) {
                    try {
                        renderFrame(runtime, state);
                    } catch (_) { }
                }
            }
        }

        runBtn.addEventListener('click', function () {
            state.isRunning = !state.isRunning;
            if (state.isRunning) {
                runtime.lastMs = nowMs();
            }
            runBtn.textContent = state.isRunning ? '暂停' : '继续';
            runBtn.setAttribute('aria-pressed', state.isRunning ? 'true' : 'false');
            if (!state.isRunning && !contextLost) {
                try {
                    renderFrame(runtime, state);
                } catch (_) { }
            }
            saveState(state);
        });

        uploadInput.addEventListener('change', async function () {
            const files = Array.from(uploadInput.files || []);
            if (!files.length) return;
            for (const file of files) {
                try {
                    await addUploadTextureFromFile(file);
                } catch (error) {
                    setStatus('上传失败: ' + String(file && file.name ? file.name : 'unknown'));
                    console.warn('Upload texture failed:', error);
                }
            }
            try { uploadInput.value = ''; } catch (_) { }
            renderChannels();
            renderTextures();
            if (!state.isRunning && !contextLost) {
                try {
                    renderFrame(runtime, state);
                } catch (_) { }
            }
        });

        if (exportGifBtn) {
            exportGifBtn.addEventListener('click', async function () {
                await exportCanvasAsGif();
            });
        }

        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', function () {
                exportCanvasAsPng();
            });
        }

        if (contributeBtn) {
            contributeBtn.addEventListener('click', function () {
                commitEditorToState();
                const pass = getSelectedPass();
                const passName = pass ? pass.name : 'My Shader';
                const template = makeContributionTemplate(state, passName);
                const payload = {
                    v: 1,
                    passName: sanitizeName(passName),
                    createdAt: Date.now(),
                    template: template
                };
                try {
                    localStorage.setItem(CONTRIBUTION_DRAFT_KEY, JSON.stringify(payload));
                } catch (_) { }
                window.location.href = 'shader-contribute.html';
            });
        }

        exportBtn.addEventListener('click', function () {
            commitEditorToState();
            const fx = buildFx(state);
            fxTa.value = fx;
            copyBtn.disabled = !fx;
        });

        window.addEventListener('keydown', function (e) {
            if (e.target === editorTa && completionState.visible && completionState.items.length > 0) {
                return;
            }
            const key = String(e.key || '');
            const isEnter = key === 'Enter';
            const isSave = key.toLowerCase() === 's';
            const isCompileCombo = (e.ctrlKey || e.metaKey) && isEnter;
            const isExportCombo = (e.ctrlKey || e.metaKey) && isSave;
            const isPngCombo = (e.ctrlKey || e.metaKey) && e.shiftKey && key.toLowerCase() === 's';
            if (isCompileCombo) {
                e.preventDefault();
                commitEditorToState();
                saveState(state);
                compileAll('快捷键');
                return;
            }
            if (isPngCombo) {
                e.preventDefault();
                exportCanvasAsPng();
                return;
            }
            if (isExportCombo) {
                e.preventDefault();
                commitEditorToState();
                const fx = buildFx(state);
                fxTa.value = fx;
                copyBtn.disabled = !fx;
            }
        });

        copyBtn.addEventListener('click', async function () {
            const text = String(fxTa.value || '');
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                setStatus('已复制到剪贴板');
            } catch (_) {
                fxTa.focus();
                fxTa.select();
                try { document.execCommand('copy'); } catch (_) { }
                setStatus('已复制（fallback）');
            }
        });

        // Pass 下拉菜单
        if (passMenuBtn && passDropdown) {
            passMenuBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                passDropdown.classList.toggle('show');
            });

            document.addEventListener('click', function (e) {
                if (!passDropdown.contains(e.target) && e.target !== passMenuBtn) {
                    passDropdown.classList.remove('show');
                }
            });
        }

        // 布局切换
        if (layoutToggleBtn && mainEl) {
            layoutToggleBtn.addEventListener('click', function () {
                const current = mainEl.getAttribute('data-layout') || 'horizontal';
                const next = current === 'horizontal' ? 'vertical' : 'horizontal';
                mainEl.setAttribute('data-layout', next);
                layoutToggleBtn.textContent = next === 'horizontal' ? '⇄' : '⇅';
                try {
                    localStorage.setItem('shader-playground.layout', next);
                } catch (_) { }
            });

            // 恢复保存的布局
            try {
                const savedLayout = localStorage.getItem('shader-playground.layout');
                if (savedLayout === 'vertical') {
                    mainEl.setAttribute('data-layout', 'vertical');
                    layoutToggleBtn.textContent = '⇅';
                }
            } catch (_) { }
        }

        // 教程大窗口
        function openHelpDrawer() {
            if (helpDrawer) helpDrawer.classList.add('open');
            if (drawerOverlay) drawerOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeHelpDrawer() {
            if (helpDrawer) helpDrawer.classList.remove('open');
            if (drawerOverlay) drawerOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }

        if (helpToggleBtn) {
            helpToggleBtn.addEventListener('click', openHelpDrawer);
        }

        if (helpCloseBtn) {
            helpCloseBtn.addEventListener('click', closeHelpDrawer);
        }

        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', closeHelpDrawer);
        }

        // ESC 关闭教程窗口
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && helpDrawer && helpDrawer.classList.contains('open')) {
                closeHelpDrawer();
            }
        });

        // Mouse handling (pixel coords)
        function updateMouseFromEvent(e) {
            const rect = canvas.getBoundingClientRect();
            const x = clamp((e.clientX - rect.left) * (canvas.width / rect.width), 0, canvas.width);
            const y = clamp((rect.bottom - e.clientY) * (canvas.height / rect.height), 0, canvas.height);
            runtime.mouse.x = x;
            runtime.mouse.y = y;
        }

        canvas.addEventListener('pointermove', function (e) {
            updateMouseFromEvent(e);
        });
        canvas.addEventListener('pointerdown', function (e) {
            canvas.setPointerCapture(e.pointerId);
            updateMouseFromEvent(e);
            runtime.mouse.down = true;
            runtime.mouse.downX = runtime.mouse.x;
            runtime.mouse.downY = runtime.mouse.y;
        });
        canvas.addEventListener('pointerup', function (e) {
            updateMouseFromEvent(e);
            runtime.mouse.down = false;
        });

        // Debounced compile
        let compileTimer = 0;
        let pendingCompilePassId = null;

        function scheduleCompile(reason, passId) {
            if (compileTimer) window.clearTimeout(compileTimer);
            pendingCompilePassId = passId;  // null = 编译全部
            compileTimer = window.setTimeout(function () {
                compileTimer = 0;
                const pid = pendingCompilePassId;
                pendingCompilePassId = null;

                if (pid === null) {
                    compileAll('自动：' + reason);
                } else {
                    setError('');
                    const compileStart = nowMs();
                    const res = compileSinglePass(pid);
                    if (!res.ok) setError(res.error);
                    const ms = Math.max(0, Math.round(nowMs() - compileStart));
                    setStatus('Compiled in ' + ms + ' ms (自动：' + reason + ')');
                    updateTabErrorBadges();
                }
            }, 250);
        }

        function updateStats(fps, w, h) {
            if (!statsEl) return;
            const f = (typeof fps === 'number' && isFinite(fps)) ? fps.toFixed(1) : '--';
            statsEl.textContent = 'fps: ' + f + ' | ' + w + 'x' + h;
        }

        // Initial UI
        syncEditor();
        renderCommandControls();
        afterEditorChanged();
        hideAutocomplete();
        renderAll();
        applyCanvasAspectRatio(canvas, state);
        updateResolutionStateAndPersist();
        compileAll('初始化');
        if (importedPayload) {
            const importTitle = importedPayload && importedPayload.title ? String(importedPayload.title) : '';
            if (importTitle) {
                setStatus('已从 Gallery 导入: ' + importTitle);
            } else {
                setStatus('已从 Gallery 导入 Shader');
            }
        }
        refreshITimeDisplay();

        function rafLoop() {
            try {
                if (state.isRunning && !contextLost) {
                    renderFrame(runtime, state);
                }
            } catch (e) {
                setError(String(e && e.message ? e.message : e));
            }
            refreshITimeDisplay();
            updateStats(estimateFps(), canvas.width, canvas.height);
            requestAnimationFrame(rafLoop);
        }

        let fpsSamples = [];
        function estimateFps() {
            const t = nowMs();
            fpsSamples.push(t);
            while (fpsSamples.length && t - fpsSamples[0] > 1000) fpsSamples.shift();
            if (fpsSamples.length < 2) return NaN;
            const span = fpsSamples[fpsSamples.length - 1] - fpsSamples[0];
            if (span <= 0) return NaN;
            return (fpsSamples.length - 1) * 1000 / span;
        }
        requestAnimationFrame(rafLoop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
