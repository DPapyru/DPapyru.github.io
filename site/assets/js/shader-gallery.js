(function () {
    'use strict';

    const GALLERY_INDEX_URL = '/site/assets/shader-gallery/index.json';
    const PLAYGROUND_IMPORT_KEY = 'shader-playground.import.v1';
    const GITHUB_REPO_BASE = 'https://github.com/DPapyru/DPapyru.github.io/blob/main';

    function $(id) {
        return document.getElementById(id);
    }

    function createEl(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function parseDateMs(text) {
        const raw = normalizeText(text);
        if (!raw) return 0;
        const t = Date.parse(raw);
        return isFinite(t) ? t : 0;
    }

    function openInPlayground(item) {
        const payload = {
            source: 'gallery',
            slug: item.slug,
            title: item.title,
            payload: item.payload
        };
        try {
            localStorage.setItem(PLAYGROUND_IMPORT_KEY, JSON.stringify(payload));
        } catch (_) { }
        const url = '/tml-ide/?workspace=shader&import=gallery&slug=' + encodeURIComponent(item.slug || '');
        window.location.href = url;
    }

    function getSourceUrl(item) {
        const source = item && item.source ? item.source : null;
        if (!source || !source.entry) return GITHUB_REPO_BASE;
        return GITHUB_REPO_BASE + String(source.entry || '');
    }

    function buildVertexSource() {
        return [
            '#version 300 es',
            'precision highp float;',
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
            const err = gl.getShaderInfoLog(vs) || 'vertex compile error';
            gl.deleteShader(vs);
            return { ok: false, error: err };
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            const err = gl.getShaderInfoLog(fs) || 'fragment compile error';
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            return { ok: false, error: err };
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program) || 'link error';
            gl.deleteProgram(program);
            return { ok: false, error: err };
        }

        return { ok: true, program };
    }

    function createFullscreenGeometry(gl) {
        const vao = gl.createVertexArray();
        const vbo = gl.createBuffer();
        const vertices = new Float32Array([
            -1, -1, 0, 0,
            3, -1, 2, 0,
            -1, 3, 0, 2
        ]);

        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return { vao, vbo };
    }

    function selectPreviewPass(payload) {
        const passes = payload && Array.isArray(payload.passes) ? payload.passes : [];
        if (!passes.length) return null;
        const imagePass = passes.find((p) => String(p.type || 'image') === 'image');
        return imagePass || passes[0];
    }

    function createPreviewRuntime(canvas, item, onStatus) {
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            premultipliedAlpha: false
        });
        if (!gl) {
            onStatus('浏览器不支持 WebGL2');
            return null;
        }

        const adapter = window.ShaderHlslAdapter;
        if (!adapter || typeof adapter.buildFragmentSource !== 'function') {
            onStatus('Shader 适配器未加载');
            return null;
        }

        const pass = selectPreviewPass(item.payload || {});
        if (!pass || !pass.code) {
            onStatus('此条目没有可预览的 pass');
            return null;
        }

        const built = adapter.buildFragmentSource(String(item.payload.common || ''), String(pass.code || ''));
        if (!built || !built.ok) {
            onStatus('编译失败: ' + String((built && built.error) || 'unknown'));
            return null;
        }

        const compiled = createProgram(gl, buildVertexSource(), built.source);
        if (!compiled.ok) {
            onStatus('编译失败: ' + compiled.error);
            return null;
        }

        const geo = createFullscreenGeometry(gl);
        const uniforms = {
            iResolution: gl.getUniformLocation(compiled.program, 'iResolution'),
            iTime: gl.getUniformLocation(compiled.program, 'iTime'),
            iTimeDelta: gl.getUniformLocation(compiled.program, 'iTimeDelta'),
            iFrame: gl.getUniformLocation(compiled.program, 'iFrame'),
            iMouse: gl.getUniformLocation(compiled.program, 'iMouse'),
            iDate: gl.getUniformLocation(compiled.program, 'iDate'),
            iChannelTime: gl.getUniformLocation(compiled.program, 'iChannelTime'),
            iChannelResolution: gl.getUniformLocation(compiled.program, 'iChannelResolution'),
            iChannel0: gl.getUniformLocation(compiled.program, 'iChannel0'),
            iChannel1: gl.getUniformLocation(compiled.program, 'iChannel1'),
            iChannel2: gl.getUniformLocation(compiled.program, 'iChannel2'),
            iChannel3: gl.getUniformLocation(compiled.program, 'iChannel3')
        };

        const runtime = {
            gl,
            program: compiled.program,
            vao: geo.vao,
            vbo: geo.vbo,
            uniforms,
            frame: 0,
            startMs: performance.now(),
            lastMs: performance.now(),
            rafId: 0,
            stopped: false
        };

        function draw(nowMs) {
            if (runtime.stopped) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
            const width = Math.max(1, Math.floor(rect.width * dpr));
            const height = Math.max(1, Math.floor(rect.height * dpr));
            if (canvas.width !== width) canvas.width = width;
            if (canvas.height !== height) canvas.height = height;

            const deltaSec = clamp((nowMs - runtime.lastMs) / 1000, 0, 0.2);
            const elapsedSec = Math.max(0, (nowMs - runtime.startMs) / 1000);
            runtime.lastMs = nowMs;

            gl.viewport(0, 0, width, height);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.useProgram(runtime.program);
            gl.bindVertexArray(runtime.vao);

            if (uniforms.iResolution) gl.uniform3fv(uniforms.iResolution, [width, height, 1]);
            if (uniforms.iTime) gl.uniform1f(uniforms.iTime, elapsedSec);
            if (uniforms.iTimeDelta) gl.uniform1f(uniforms.iTimeDelta, deltaSec);
            if (uniforms.iFrame) gl.uniform1i(uniforms.iFrame, runtime.frame);
            if (uniforms.iMouse) gl.uniform4fv(uniforms.iMouse, [0, 0, 0, 0]);
            if (uniforms.iDate) {
                const date = new Date();
                gl.uniform4fv(uniforms.iDate, [
                    date.getFullYear(),
                    date.getMonth() + 1,
                    date.getDate(),
                    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
                ]);
            }
            if (uniforms.iChannelTime) gl.uniform1fv(uniforms.iChannelTime, [0, 0, 0, 0]);
            if (uniforms.iChannelResolution) gl.uniform3fv(uniforms.iChannelResolution, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            if (uniforms.iChannel0) gl.uniform1i(uniforms.iChannel0, 0);
            if (uniforms.iChannel1) gl.uniform1i(uniforms.iChannel1, 1);
            if (uniforms.iChannel2) gl.uniform1i(uniforms.iChannel2, 2);
            if (uniforms.iChannel3) gl.uniform1i(uniforms.iChannel3, 3);

            for (let i = 0; i < 4; i += 1) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindVertexArray(null);
            gl.useProgram(null);

            runtime.frame += 1;
            runtime.rafId = requestAnimationFrame(draw);
        }

        runtime.rafId = requestAnimationFrame(draw);

        runtime.stop = function () {
            if (runtime.stopped) return;
            runtime.stopped = true;
            if (runtime.rafId) {
                cancelAnimationFrame(runtime.rafId);
                runtime.rafId = 0;
            }
            try { gl.deleteBuffer(runtime.vbo); } catch (_) { }
            try { gl.deleteVertexArray(runtime.vao); } catch (_) { }
            try { gl.deleteProgram(runtime.program); } catch (_) { }
        };

        onStatus('实时预览中');
        return runtime;
    }

    function initMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = $('main-nav') || document.querySelector('.main-nav');
        if (!mobileMenuToggle || !mainNav) return;

        function setMenu(isOpen) {
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

        mobileMenuToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const willOpen = !mainNav.classList.contains('active');
            setMenu(willOpen);
        });

        document.addEventListener('click', function (e) {
            if (mobileMenuToggle.contains(e.target) || mainNav.contains(e.target)) return;
            if (!mainNav.classList.contains('active')) return;
            setMenu(false);
        });
    }

    function init() {
        const gridEl = $('shader-gallery-grid');
        const emptyEl = $('shader-gallery-empty');
        const statsEl = $('shader-gallery-stats');
        const searchEl = $('shader-gallery-search');
        const tagEl = $('shader-gallery-tag');
        const sortEl = $('shader-gallery-sort');

        if (!gridEl || !searchEl || !tagEl || !sortEl || !statsEl) return;

        initMobileMenu();

        const state = {
            items: [],
            filtered: [],
            search: '',
            tag: '',
            sort: 'updated_desc',
            activePreview: null,
            activePreviewCard: null
        };

        function clearActivePreview() {
            if (state.activePreview && typeof state.activePreview.stop === 'function') {
                state.activePreview.stop();
            }
            state.activePreview = null;
            state.activePreviewCard = null;
        }

        function setStats() {
            const total = state.items.length;
            const showing = state.filtered.length;
            statsEl.textContent = '共 ' + total + ' 个，当前 ' + showing + ' 个';
        }

        function collectTags(items) {
            const set = new Set();
            items.forEach((item) => {
                const tags = Array.isArray(item.tags) ? item.tags : [];
                tags.forEach((tag) => {
                    const text = normalizeText(tag);
                    if (text) set.add(text);
                });
            });
            return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'));
        }

        function repopulateTagOptions() {
            const current = state.tag;
            const tags = collectTags(state.items);
            tagEl.replaceChildren();

            const all = document.createElement('option');
            all.value = '';
            all.textContent = '全部标签';
            tagEl.appendChild(all);

            tags.forEach((tag) => {
                const opt = document.createElement('option');
                opt.value = tag;
                opt.textContent = tag;
                tagEl.appendChild(opt);
            });

            tagEl.value = tags.includes(current) ? current : '';
            state.tag = tagEl.value;
        }

        function applyFilters() {
            const q = normalizeText(state.search).toLowerCase();
            const tag = normalizeText(state.tag);

            let rows = state.items.slice();
            if (q) {
                rows = rows.filter((item) => {
                    const hay = [
                        item.title,
                        item.author,
                        item.description,
                        Array.isArray(item.tags) ? item.tags.join(' ') : ''
                    ].join(' ').toLowerCase();
                    return hay.includes(q);
                });
            }

            if (tag) {
                rows = rows.filter((item) => {
                    const tags = Array.isArray(item.tags) ? item.tags : [];
                    return tags.some((x) => normalizeText(x) === tag);
                });
            }

            if (state.sort === 'title_asc') {
                rows.sort((a, b) => normalizeText(a.title).localeCompare(normalizeText(b.title), 'zh-CN'));
            } else if (state.sort === 'author_asc') {
                rows.sort((a, b) => normalizeText(a.author).localeCompare(normalizeText(b.author), 'zh-CN'));
            } else {
                rows.sort((a, b) => parseDateMs(b.updated_at) - parseDateMs(a.updated_at));
            }

            state.filtered = rows;
        }

        function renderCards() {
            clearActivePreview();
            gridEl.replaceChildren();

            if (!state.filtered.length) {
                if (emptyEl) emptyEl.hidden = false;
                setStats();
                return;
            }
            if (emptyEl) emptyEl.hidden = true;

            state.filtered.forEach((item) => {
                const card = createEl('article', 'shader-gallery-card');

                const preview = createEl('div', 'shader-gallery-preview');
                if (item.cover) {
                    const img = createEl('img', 'shader-gallery-cover');
                    img.src = item.cover;
                    img.alt = normalizeText(item.title) || 'Shader cover';
                    img.loading = 'lazy';
                    preview.appendChild(img);
                } else {
                    const canvas = createEl('canvas', 'shader-gallery-preview-canvas');
                    canvas.width = 640;
                    canvas.height = 360;
                    preview.appendChild(canvas);

                    const placeholder = createEl('div', 'shader-gallery-preview-placeholder');
                    placeholder.textContent = '无封面，可实时预览';
                    preview.appendChild(placeholder);

                    const previewBtn = createEl('button', 'shader-gallery-preview-action');
                    previewBtn.type = 'button';
                    previewBtn.textContent = '实时预览';
                    previewBtn.addEventListener('click', function () {
                        if (state.activePreviewCard === card) {
                            clearActivePreview();
                            placeholder.textContent = '无封面，可实时预览';
                            previewBtn.textContent = '实时预览';
                            return;
                        }

                        clearActivePreview();
                        state.activePreviewCard = card;
                        const runtime = createPreviewRuntime(canvas, item, function (text) {
                            placeholder.textContent = text;
                        });
                        state.activePreview = runtime;
                        previewBtn.textContent = runtime ? '停止预览' : '实时预览';
                    });
                    preview.appendChild(previewBtn);
                }

                const body = createEl('div', 'shader-gallery-body');
                const title = createEl('h3', 'shader-gallery-title');
                title.textContent = normalizeText(item.title) || item.slug || 'Untitled Shader';
                body.appendChild(title);

                const meta = createEl('div', 'shader-gallery-meta');
                const author = normalizeText(item.author) || 'Unknown';
                const updated = normalizeText(item.updated_at) || '未知时间';
                meta.textContent = '作者: ' + author + ' | 更新: ' + updated;
                body.appendChild(meta);

                const desc = createEl('p', 'shader-gallery-description');
                desc.textContent = normalizeText(item.description) || '暂无简介。';
                body.appendChild(desc);

                const tags = createEl('div', 'shader-gallery-tags');
                const list = Array.isArray(item.tags) ? item.tags : [];
                if (list.length === 0) {
                    const tag = createEl('span', 'shader-gallery-tag');
                    tag.textContent = 'untagged';
                    tags.appendChild(tag);
                } else {
                    list.forEach((rawTag) => {
                        const text = normalizeText(rawTag);
                        if (!text) return;
                        const tag = createEl('span', 'shader-gallery-tag');
                        tag.textContent = text;
                        tags.appendChild(tag);
                    });
                }
                body.appendChild(tags);

                const actions = createEl('div', 'shader-gallery-actions');
                const openBtn = createEl('button', 'shader-gallery-btn shader-gallery-btn--primary');
                openBtn.type = 'button';
                openBtn.textContent = '在 Playground 打开';
                openBtn.addEventListener('click', function () {
                    openInPlayground(item);
                });
                actions.appendChild(openBtn);

                const sourceBtn = createEl('a', 'shader-gallery-btn');
                sourceBtn.textContent = '查看源文件';
                sourceBtn.href = getSourceUrl(item);
                sourceBtn.target = '_blank';
                sourceBtn.rel = 'noopener noreferrer';
                actions.appendChild(sourceBtn);

                body.appendChild(actions);

                card.appendChild(preview);
                card.appendChild(body);
                gridEl.appendChild(card);
            });

            setStats();
        }

        function refresh() {
            applyFilters();
            renderCards();
        }

        searchEl.addEventListener('input', function () {
            state.search = searchEl.value || '';
            refresh();
        });

        tagEl.addEventListener('change', function () {
            state.tag = tagEl.value || '';
            refresh();
        });

        sortEl.addEventListener('change', function () {
            state.sort = sortEl.value || 'updated_desc';
            refresh();
        });

        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                clearActivePreview();
            }
        });

        fetch(GALLERY_INDEX_URL, { cache: 'no-store' }).then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then((data) => {
            const items = Array.isArray(data && data.items) ? data.items : [];
            state.items = items;
            repopulateTagOptions();
            refresh();
        }).catch((error) => {
            clearActivePreview();
            gridEl.replaceChildren();
            if (emptyEl) {
                emptyEl.hidden = false;
                emptyEl.textContent = '加载 Gallery 失败: ' + String(error && error.message ? error.message : error);
            }
            statsEl.textContent = '加载失败';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
