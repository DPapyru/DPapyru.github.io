// TS animation runtime for docs/viewer.html and docs/anim-renderer.html
// Loads ESM modules compiled from docs/anims/**/*.ts into assets/anims/**/*.js
(function () {
    'use strict';

    const EMBED_SELECTOR = '.animts-embed[data-animts-src]';
    const DEFAULT_STAGE_HEIGHT = 240;
    const MAX_ERROR_CHARS = 300;

    function normalizePath(inputPath) {
        const parts = String(inputPath || '').replace(/\\/g, '/').split('/');
        const stack = [];

        parts.forEach((part) => {
            if (!part || part === '.') return;
            if (part === '..') {
                if (stack.length) stack.pop();
                return;
            }
            stack.push(part);
        });

        return stack.join('/');
    }

    function isProbablyUrl(value) {
        const str = String(value || '').trim();
        return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(str) || str.startsWith('//');
    }

    function parseAnimTsPath(rawValue) {
        const original = String(rawValue || '').trim();
        if (!original) return { ok: false, error: '缺少 TS 文件路径' };
        if (isProbablyUrl(original)) return { ok: false, error: '不允许 URL（只允许仓库内相对路径）' };

        let cleaned = original;
        try {
            cleaned = decodeURIComponent(original);
        } catch (_) {
            cleaned = original;
        }

        cleaned = cleaned.replace(/^\.?\//, '').replace(/^docs\//, '');
        const normalized = normalizePath(cleaned);

        if (!normalized.startsWith('anims/')) return { ok: false, error: '仅允许 anims/ 目录下的 TS 文件' };
        if (!/\.ts$/i.test(normalized)) return { ok: false, error: '仅支持 .ts 文件' };
        if (normalized.includes('..')) return { ok: false, error: '路径不合法' };

        return { ok: true, value: normalized };
    }

    function animTsToJsHref(tsPath) {
        // docs/viewer.html and docs/anim-renderer.html are under /docs/
        // compiled outputs are under /assets/anims/
        const rel = String(tsPath).replace(/^anims\//, '');
        return `../assets/anims/${rel.replace(/\.ts$/i, '.js')}`;
    }

    function safeText(input) {
        const str = String(input || '');
        if (str.length <= MAX_ERROR_CHARS) return str;
        return str.slice(0, MAX_ERROR_CHARS) + '…';
    }

    function ensureEmbedShell(embed) {
        if (embed.__ANIMTS_SHELL_READY) return;
        embed.__ANIMTS_SHELL_READY = true;

        embed.classList.add('animts-embed');
        if (!embed.style.minHeight) embed.style.minHeight = `${DEFAULT_STAGE_HEIGHT}px`;

        const header = document.createElement('div');
        header.className = 'animts-header';

        const title = document.createElement('div');
        title.className = 'animts-title';
        title.textContent = 'TS 动画';

        const controls = document.createElement('div');
        controls.className = 'animts-controls';

        const btnRestart = document.createElement('button');
        btnRestart.type = 'button';
        btnRestart.className = 'btn btn-small btn-outline animts-btn-restart';
        btnRestart.textContent = '重播';

        const btnPause = document.createElement('button');
        btnPause.type = 'button';
        btnPause.className = 'btn btn-small btn-outline animts-btn-pause';
        btnPause.textContent = '暂停';
        btnPause.setAttribute('aria-pressed', 'false');

        controls.appendChild(btnPause);
        controls.appendChild(btnRestart);

        header.appendChild(title);
        header.appendChild(controls);

        const stage = document.createElement('div');
        stage.className = 'animts-stage';

        const error = document.createElement('pre');
        error.className = 'animts-error';
        error.style.display = 'none';

        embed.replaceChildren(header, stage, error);
        embed.__ANIMTS_STAGE = stage;
        embed.__ANIMTS_ERROR = error;
        embed.__ANIMTS_BTN_PAUSE = btnPause;
        embed.__ANIMTS_BTN_RESTART = btnRestart;
    }

    function setError(embed, message) {
        ensureEmbedShell(embed);
        const error = embed.__ANIMTS_ERROR;
        error.textContent = safeText(message);
        error.style.display = 'block';
        embed.classList.add('animts-embed--error');
    }

    function clearError(embed) {
        if (!embed.__ANIMTS_ERROR) return;
        embed.__ANIMTS_ERROR.textContent = '';
        embed.__ANIMTS_ERROR.style.display = 'none';
        embed.classList.remove('animts-embed--error');
    }

    function createRunState(embed) {
        const controller = new AbortController();
        const state = {
            controller,
            signal: controller.signal,
            animations: new Set(),
            cleanup: [],
            paused: false
        };
        embed.__ANIMTS_STATE = state;
        return state;
    }

    function disposeRun(embed) {
        const state = embed.__ANIMTS_STATE;
        if (!state) return;
        embed.__ANIMTS_STATE = null;

        try { state.controller.abort(); } catch (_) { }

        state.animations.forEach((anim) => {
            try { anim.cancel(); } catch (_) { }
        });
        state.animations.clear();

        state.cleanup.forEach((fn) => {
            try { fn(); } catch (_) { }
        });
        state.cleanup.length = 0;

        if (embed.__ANIMTS_STAGE) embed.__ANIMTS_STAGE.replaceChildren();
    }

    function setPaused(embed, paused) {
        const state = embed.__ANIMTS_STATE;
        if (!state) return;
        state.paused = !!paused;

        state.animations.forEach((anim) => {
            try {
                if (paused) anim.pause();
                else anim.play();
            } catch (_) { }
        });

        if (embed.__ANIMTS_BTN_PAUSE) {
            embed.__ANIMTS_BTN_PAUSE.textContent = paused ? '继续' : '暂停';
            embed.__ANIMTS_BTN_PAUSE.setAttribute('aria-pressed', paused ? 'true' : 'false');
        }
    }

    function createContext(embed, stage, state) {
        let danmakuLane = 0;
        // Expose signal for shared UI libs (e.g. portal panels cleanup).
        try { stage.__ANIMTS_SIGNAL = state.signal; } catch (_) { }

        function uiEl(tag, className, text) {
            const el = document.createElement(tag);
            if (className) el.className = String(className);
            if (text !== undefined) el.textContent = String(text);
            return el;
        }

        function uiCanvas2D(options) {
            const opts = options && typeof options === 'object' ? options : {};
            const canvas = document.createElement('canvas');
            canvas.className = opts.className ? String(opts.className) : '';
            stage.appendChild(canvas);

            const g = canvas.getContext('2d');
            if (!g) throw new Error('无法获取 CanvasRenderingContext2D');

            const result = { canvas, g, dpr: 1, width: 0, height: 0, resize: null };

            function resize() {
                const dpr = Math.max(1, window.devicePixelRatio || 1);
                const rect = stage.getBoundingClientRect();
                const width = Math.max(1, Math.floor(rect.width));
                const height = Math.max(1, Math.floor(rect.height));
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                result.dpr = dpr;
                result.width = width;
                result.height = height;
            }

            const ro = new ResizeObserver(resize);
            ro.observe(stage);
            state.cleanup.push(() => ro.disconnect());

            resize();
            result.resize = resize;
            return result;
        }

        function uiCreateAiAnalysisScene(options) {
            const opts = options && typeof options === 'object' ? options : {};
            const classPrefix = opts.classPrefix ? String(opts.classPrefix) : 'animts-ai';
            const stageClass = `${classPrefix}-stage`;
            const canvasClass = `${classPrefix}-canvas`;
            const hudClass = `${classPrefix}-hud`;
            const lockClass = `${classPrefix}-state-item--locked`;
            const portalMode = opts.panelPortal === 'page';

            stage.classList.add(stageClass);
            if (opts.heightPx) stage.style.height = `${Math.max(120, Number(opts.heightPx) || 0)}px`;

            const canvas2d = uiCanvas2D({ className: canvasClass });
            const hud = uiEl('div', hudClass);
            stage.appendChild(hud);

            const topbar = uiEl('div', `${classPrefix}-topbar`);
            const badges = uiEl('div', `${classPrefix}-badges`);
            const badgeA = uiEl('div', `${classPrefix}-badge`, '');
            const badgeB = uiEl('div', `${classPrefix}-badge`, '');
            const badgeC = uiEl('div', `${classPrefix}-badge`, '');
            badges.appendChild(badgeA);
            badges.appendChild(badgeB);
            badges.appendChild(badgeC);
            const hint = uiEl('div', `${classPrefix}-badge`, opts.hint || '');
            topbar.appendChild(badges);
            topbar.appendChild(hint);

            const panel = uiEl('div', `${classPrefix}-panel`);
            const panelHeader = uiEl('div', `${classPrefix}-panel-header`);
            const panelTitle = uiEl('div', `${classPrefix}-panel-title`, opts.title || 'AI 状态机');
            panelHeader.appendChild(panelTitle);
            const stateList = uiEl('ul', `${classPrefix}-state-list`);
            panel.appendChild(panelHeader);
            panel.appendChild(stateList);

            const footer = uiEl('div', `${classPrefix}-footer`);
            const footerLeft = uiEl('div', '', opts.footerLabel || '时间轴');
            const footerRight = uiEl('div', '', '');
            const progress = uiEl('div', `${classPrefix}-progress`);
            const progressFill = uiEl('div', '', '');
            progress.appendChild(progressFill);
            footer.appendChild(footerLeft);
            footer.appendChild(progress);
            footer.appendChild(footerRight);

            const spacer = uiEl('div', `${classPrefix}-spacer`);
            hud.appendChild(topbar);
            hud.appendChild(spacer);
            hud.appendChild(panel);
            hud.appendChild(footer);

            // Draggable panel (optional portal to page)
            (function enableDraggablePanel() {
                const doc = stage.ownerDocument || document;
                const root = portalMode ? (doc.body || document.body) : stage;
                const panelCleanup = [];

                function clampToPage(left, top, width, height) {
                    const rootEl = doc.documentElement;
                    const pageW = Math.max(rootEl.scrollWidth || 0, rootEl.clientWidth || 0, window.innerWidth || 0);
                    const pageH = Math.max(rootEl.scrollHeight || 0, rootEl.clientHeight || 0, window.innerHeight || 0);
                    const maxX = Math.max(0, pageW - (width || 0) - 8);
                    const maxY = Math.max(0, pageH - (height || 0) - 8);
                    return {
                        left: Math.max(8, Math.min(maxX, left)),
                        top: Math.max(8, Math.min(maxY, top))
                    };
                }

                function eventPageX(event) {
                    if (typeof event.pageX === 'number') return event.pageX;
                    return (event.clientX || 0) + (window.scrollX || 0);
                }

                function eventPageY(event) {
                    if (typeof event.pageY === 'number') return event.pageY;
                    return (event.clientY || 0) + (window.scrollY || 0);
                }

                function ensureAbsolutePosition() {
                    // Convert from flow layout to absolute, keeping current visual position.
                    const panelRect = panel.getBoundingClientRect();
                    if (portalMode) {
                        panel.classList.add('animts-ui-panel--portal');
                        panel.style.position = 'absolute';
                        panel.style.left = `${panelRect.left + (window.scrollX || 0)}px`;
                        panel.style.top = `${panelRect.top + (window.scrollY || 0)}px`;
                    } else {
                        const stageRect = stage.getBoundingClientRect();
                        panel.style.position = 'absolute';
                        panel.style.left = `${panelRect.left - stageRect.left}px`;
                        panel.style.top = `${panelRect.top - stageRect.top}px`;
                    }
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                }

                function initPortal() {
                    if (!portalMode) return;
                    try { root.appendChild(panel); } catch (_) { }
                    // Initial placement near stage's right side
                    requestAnimationFrame(() => {
                        const stageRect = stage.getBoundingClientRect();
                        const panelRect = panel.getBoundingClientRect();
                        const scrollX = window.scrollX || 0;
                        const scrollY = window.scrollY || 0;
                        const stageRight = stageRect.right + scrollX;
                        const stageTop = stageRect.top + scrollY;

                        let left = stageRight - panelRect.width - 12;
                        let top = stageTop + 72;

                        const canPlaceOutside = (stageRect.right + 12 + panelRect.width) <= ((window.innerWidth || 0) - 12);
                        if (canPlaceOutside) left = stageRight + 12;

                        const clamped = clampToPage(left, top, panelRect.width || 0, panelRect.height || 0);
                        panel.style.position = 'absolute';
                        panel.style.left = `${clamped.left}px`;
                        panel.style.top = `${clamped.top}px`;
                        panel.style.right = 'auto';
                        panel.style.bottom = 'auto';
                    });
                }

                function init() {
                    if (portalMode) {
                        initPortal();
                    }
                    // Ensure we can drag without being constrained by flex layout.
                    requestAnimationFrame(() => ensureAbsolutePosition());
                }

                let dragging = false;
                let offsetX = 0;
                let offsetY = 0;

                function onDown(event) {
                    if (event.button !== 0) return;
                    dragging = true;
                    const rect = panel.getBoundingClientRect();
                    if (portalMode) {
                        offsetX = eventPageX(event) - (rect.left + (window.scrollX || 0));
                        offsetY = eventPageY(event) - (rect.top + (window.scrollY || 0));
                    } else {
                        offsetX = event.clientX - rect.left;
                        offsetY = event.clientY - rect.top;
                    }
                    try { panelTitle.setPointerCapture(event.pointerId); } catch (_) { }
                    event.preventDefault();
                }

                function onMove(event) {
                    if (!dragging) return;
                    const rect = panel.getBoundingClientRect();
                    const width = rect.width || 0;
                    const height = rect.height || 0;
                    if (portalMode) {
                        const x = eventPageX(event) - offsetX;
                        const y = eventPageY(event) - offsetY;
                        const clamped = clampToPage(x, y, width, height);
                        panel.style.left = `${clamped.left}px`;
                        panel.style.top = `${clamped.top}px`;
                        return;
                    }

                    const bounds = stage.getBoundingClientRect();
                    const x = event.clientX - bounds.left - offsetX;
                    const y = event.clientY - bounds.top - offsetY;
                    const maxX = Math.max(0, bounds.width - width - 8);
                    const maxY = Math.max(0, bounds.height - height - 8);
                    const clampedX = Math.max(8, Math.min(maxX, x));
                    const clampedY = Math.max(8, Math.min(maxY, y));

                    panel.style.left = `${clampedX}px`;
                    panel.style.top = `${clampedY}px`;
                }

                function onUp(event) {
                    if (!dragging) return;
                    dragging = false;
                    try { panelTitle.releasePointerCapture(event.pointerId); } catch (_) { }
                }

                panelTitle.addEventListener('pointerdown', onDown);
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
                panelCleanup.push(() => panelTitle.removeEventListener('pointerdown', onDown));
                panelCleanup.push(() => window.removeEventListener('pointermove', onMove));
                panelCleanup.push(() => window.removeEventListener('pointerup', onUp));

                init();

                // Auto cleanup on dispose (abort)
                if (state && state.signal && typeof state.signal.addEventListener === 'function') {
                    state.signal.addEventListener('abort', () => {
                        panelCleanup.forEach((fn) => {
                            try { fn(); } catch (_) { }
                        });
                        try { panel.remove(); } catch (_) { }
                    }, { once: true });
                } else {
                    state.cleanup.push(() => {
                        panelCleanup.forEach((fn) => {
                            try { fn(); } catch (_) { }
                        });
                        try { panel.remove(); } catch (_) { }
                    });
                }
            })();

            let stateItems = new Map();
            const stateClickHandlers = [];
            let lockedKey = null;
            let activeKey = null;

            function rebuildStates(list) {
                stateList.replaceChildren();
                stateItems = new Map();
                const states = Array.isArray(list) ? list : [];
                states.forEach((s) => {
                    const key = s && s.key ? String(s.key) : '';
                    if (!key) return;
                    const li = uiEl('li', `${classPrefix}-state-item`);
                    const left = uiEl('span', '', s.label || key);
                    const right = uiEl('span', '', s.note || '');
                    li.appendChild(left);
                    li.appendChild(right);
                    stateList.appendChild(li);
                    stateItems.set(key, li);
                });

                // Re-bind click handlers (new nodes)
                stateItems.forEach((li, key) => {
                    if (opts.lockOnClick !== false) {
                        li.addEventListener('click', () => toggleLockedState(key));
                    }
                    stateClickHandlers.forEach((handler) => {
                        li.addEventListener('click', () => handler(String(key)));
                    });
                });

                // Re-apply UI states
                if (activeKey) setActiveState(activeKey);
                if (lockedKey && !stateItems.has(lockedKey)) lockedKey = null;
                setLockedState(lockedKey);
            }

            rebuildStates(opts.states);

            function setBadges(a, b, c) {
                if (a !== undefined) badgeA.textContent = String(a);
                if (b !== undefined) badgeB.textContent = String(b);
                if (c !== undefined) badgeC.textContent = String(c);
            }

            function setActiveState(key) {
                activeKey = key ? String(key) : null;
                stateItems.forEach((li, k) => {
                    li.classList.toggle(`${classPrefix}-state-item--active`, k === String(key));
                });
            }

            function setLockedState(keyOrNull) {
                lockedKey = keyOrNull ? String(keyOrNull) : null;
                stateItems.forEach((li, k) => {
                    li.classList.toggle(lockClass, lockedKey !== null && k === lockedKey);
                });
            }

            function getLockedState() {
                return lockedKey;
            }

            function toggleLockedState(key) {
                const k = key ? String(key) : '';
                if (!k) return lockedKey;
                setLockedState(lockedKey === k ? null : k);
                return lockedKey;
            }

            function setProgress01(t) {
                const pct = Math.max(0, Math.min(1, Number(t) || 0));
                progressFill.style.width = `${Math.floor(pct * 100)}%`;
            }

            function setFooterRight(text) {
                footerRight.textContent = text ? String(text) : '';
            }

            function onStateClick(handler) {
                if (typeof handler !== 'function') return;
                stateClickHandlers.push(handler);
                // Bind to current nodes
                stateItems.forEach((li, key) => {
                    li.addEventListener('click', () => handler(String(key)));
                });
            }

            return {
                host: embed,
                root: stage,
                canvas: canvas2d,
                hud,
                badges: { a: badgeA, b: badgeB, c: badgeC, set: setBadges },
                panel: { el: panel, header: panelHeader, title: panelTitle },
                states: {
                    list: stateList,
                    setList: rebuildStates,
                    setActive: setActiveState,
                    onClick: onStateClick,
                    lock: { get: getLockedState, set: setLockedState, toggle: toggleLockedState }
                },
                footer: { el: footer, left: footerLeft, right: footerRight, setRight: setFooterRight, progressFill, setProgress01 }
            };
        }

        function uiRunLoop(options) {
            const opts = options && typeof options === 'object' ? options : {};
            const maxDeltaSec = Number.isFinite(Number(opts.maxDeltaSec)) ? Number(opts.maxDeltaSec) : 0.04;
            const onUpdate = typeof opts.update === 'function' ? opts.update : null;
            const onDraw = typeof opts.draw === 'function' ? opts.draw : null;

            let raf = 0;
            let last = performance.now();

            function frame(now) {
                if (state.signal.aborted) return;
                const paused = !!state.paused;
                const dt = paused ? 0 : Math.max(0, Math.min(maxDeltaSec, (now - last) / 1000));
                last = now;
                if (dt > 0 && onUpdate) onUpdate(dt, now);
                if (onDraw) onDraw(paused, now);
                raf = requestAnimationFrame(frame);
            }

            raf = requestAnimationFrame(frame);
            state.cleanup.push(() => cancelAnimationFrame(raf));
        }

        function wait(ms) {
            return new Promise((resolve) => {
                if (state.signal.aborted) return resolve();
                const id = window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
                state.cleanup.push(() => window.clearTimeout(id));
            });
        }

        function ensureStageMetrics() {
            const rect = stage.getBoundingClientRect();
            return { width: rect.width || 0, height: rect.height || 0 };
        }

        function trackAnimation(anim) {
            state.animations.add(anim);
            anim.finished
                .catch(() => { })
                .finally(() => state.animations.delete(anim));
            if (state.paused) {
                try { anim.pause(); } catch (_) { }
            }
            return anim;
        }

        function danmakuSend(text, options) {
            const message = String(text || '').trim();
            if (!message) return;

            const opts = options && typeof options === 'object' ? options : {};
            const durationMs = Math.max(800, Number(opts.durationMs) || 6000);
            const lane = Number.isFinite(Number(opts.lane)) ? Number(opts.lane) : (danmakuLane++ % 8);
            const fontSizePx = Math.max(12, Number(opts.fontSizePx) || 18);
            const color = opts.color ? String(opts.color) : 'var(--text-color)';

            const item = document.createElement('div');
            item.className = 'animts-danmaku-item';
            item.textContent = message;
            item.style.fontSize = `${fontSizePx}px`;
            item.style.color = color;

            const top = lane * (fontSizePx + 10) + 12;
            item.style.top = `${top}px`;
            stage.appendChild(item);

            const metrics = ensureStageMetrics();
            const itemWidth = item.getBoundingClientRect().width || 0;
            const fromX = metrics.width + 16;
            const toX = -(itemWidth + 16);

            const anim = item.animate(
                [
                    { transform: `translateX(${fromX}px)` },
                    { transform: `translateX(${toX}px)` }
                ],
                { duration: durationMs, easing: 'linear', fill: 'forwards' }
            );

            trackAnimation(anim);
            anim.finished
                .catch(() => { })
                .finally(() => {
                    try { item.remove(); } catch (_) { }
                });
        }

        function npcSay(options) {
            const opts = options && typeof options === 'object' ? options : {};
            const text = String(opts.text || '').trim();
            if (!text) return;

            const name = opts.name ? String(opts.name) : 'NPC';
            const durationMs = Math.max(1200, Number(opts.durationMs) || 3000);

            const bubble = document.createElement('div');
            bubble.className = 'animts-npc-bubble';

            const header = document.createElement('div');
            header.className = 'animts-npc-name';
            header.textContent = name;

            const body = document.createElement('div');
            body.className = 'animts-npc-text';
            body.textContent = text;

            bubble.appendChild(header);
            bubble.appendChild(body);
            stage.appendChild(bubble);

            const appear = bubble.animate(
                [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }],
                { duration: 220, easing: 'ease-out', fill: 'forwards' }
            );
            trackAnimation(appear);

            const timeoutId = window.setTimeout(() => {
                const disappear = bubble.animate(
                    [{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 0, transform: 'translateY(6px)' }],
                    { duration: 220, easing: 'ease-in', fill: 'forwards' }
                );
                trackAnimation(disappear);
                disappear.finished
                    .catch(() => { })
                    .finally(() => {
                        try { bubble.remove(); } catch (_) { }
                    });
            }, durationMs);

            state.cleanup.push(() => window.clearTimeout(timeoutId));
        }

        return {
            host: embed,
            stage,
            signal: state.signal,
            wait,
            runtime: {
                isPaused: () => !!state.paused
            },
            ui: {
                el: uiEl,
                canvas2d: uiCanvas2D,
                createAiAnalysisScene: uiCreateAiAnalysisScene,
                runLoop: uiRunLoop
            },
            danmaku: { send: danmakuSend },
            npc: { say: npcSay },
            onDispose: (fn) => {
                if (typeof fn === 'function') state.cleanup.push(fn);
            }
        };
    }

    function startUpdateRenderModule(ctx, state, module, label) {
        const updateAI = module && module.updateAI;
        const render = module && module.render;
        if (typeof updateAI !== 'function' || typeof render !== 'function') return false;

        if (!ctx.ui || typeof ctx.ui.createAiAnalysisScene !== 'function' || typeof ctx.ui.runLoop !== 'function') {
            throw new Error('运行时缺少 ui API（createAiAnalysisScene/runLoop）');
        }

        const appState = state.appState || {};
        state.appState = appState;

        const player = appState.player || { pos: { x: 0, y: 0 } };
        appState.player = player;

        const scene = ctx.ui.createAiAnalysisScene({
            classPrefix: 'animts-ai',
            heightPx: 420,
            title: (module && module.title) ? String(module.title) : 'AI 分析（updateAI + render）',
            hint: '拖拽玩家；点击状态锁定；暂停冻结',
            states: [],
            panelPortal: 'page'
        });

        const canvas = scene.canvas.canvas;

        function worldCenter() {
            return { x: scene.canvas.width * 0.5, y: scene.canvas.height * 0.56 };
        }

        function toWorld(screen) {
            const c = worldCenter();
            return { x: screen.x - c.x, y: screen.y - c.y };
        }

        // Drag interaction: move player
        (function attachDrag() {
            let dragging = false;
            function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
            function setPlayerFromEvent(event) {
                const rect = canvas.getBoundingClientRect();
                const p = toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                const limitX = Math.max(60, scene.canvas.width * 0.5 - 20);
                const limitY = Math.max(60, scene.canvas.height * 0.5 - 20);
                player.pos.x = clamp(p.x, -limitX, limitX);
                player.pos.y = clamp(p.y, -limitY, limitY);
            }
            function onDown(event) {
                dragging = true;
                try { canvas.setPointerCapture(event.pointerId); } catch (_) { }
                setPlayerFromEvent(event);
            }
            function onMove(event) {
                if (!dragging) return;
                setPlayerFromEvent(event);
            }
            function onUp(event) {
                dragging = false;
                try { canvas.releasePointerCapture(event.pointerId); } catch (_) { }
            }
            function onDblClick() {
                player.pos.x = 0;
                player.pos.y = 0;
            }
            canvas.addEventListener('pointerdown', onDown);
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            canvas.addEventListener('dblclick', onDblClick);
            ctx.onDispose(() => {
                canvas.removeEventListener('pointerdown', onDown);
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                canvas.removeEventListener('dblclick', onDblClick);
            });
        })();

        ctx.ui.runLoop({
            update: function (dt) {
                const input = {
                    label: label || '',
                    player: player,
                    lockedState: scene.states.lock.get(),
                    ui: scene,
                    signal: ctx.signal
                };
                appState.time = (appState.time || 0) + dt;
                updateAI(appState, input, dt);

                if (Array.isArray(appState.uiStates) && typeof scene.states.setList === 'function') {
                    scene.states.setList(appState.uiStates);
                }
                if (appState.mode) {
                    scene.states.setActive(String(appState.mode));
                }
                if (typeof appState.badges === 'function') {
                    appState.badges(scene);
                }
            },
            draw: function (paused) {
                const input = {
                    label: label || '',
                    player: player,
                    lockedState: scene.states.lock.get(),
                    ui: scene,
                    signal: ctx.signal,
                    paused: !!paused
                };
                const gfx = {
                    g: scene.canvas.g,
                    canvas: scene.canvas.canvas,
                    width: scene.canvas.width,
                    height: scene.canvas.height,
                    dpr: scene.canvas.dpr,
                    ui: scene,
                    center: worldCenter
                };
                render(appState, input, gfx);
            }
        });

        return true;
    }

    function startAnimModule(embed, ctx, state, module, label) {
        const entry = module && (module.default || module.run);
        if (typeof entry === 'function') {
            Promise.resolve()
                .then(() => entry(ctx))
                .catch((e) => {
                    if (state.signal && state.signal.aborted) return;
                    setError(embed, `动画运行失败：${e && e.message ? e.message : String(e)}`);
                });
            return true;
        }

        if (module && typeof module.updateAI === 'function' && typeof module.render === 'function') {
            try {
                const ok = startUpdateRenderModule(ctx, state, module, label);
                if (!ok) setError(embed, 'updateAI/render 模式启动失败');
                return ok;
            } catch (e) {
                setError(embed, `动画启动失败：${e && e.message ? e.message : String(e)}`);
                return false;
            }
        }

        setError(embed, '动画模块没有导出 default/run 或 updateAI/render');
        return false;
    }

    async function mountEmbed(embed) {
        if (!embed) return;
        if (embed.__ANIMTS_MOUNTING) {
            embed.__ANIMTS_PENDING_RESTART = true;
            return;
        }
        embed.__ANIMTS_MOUNTING = true;

        try {
            ensureEmbedShell(embed);
            clearError(embed);
            disposeRun(embed);

            const parsed = parseAnimTsPath(embed.getAttribute('data-animts-src'));
            if (!parsed.ok) {
                setError(embed, `动画路径无效：${parsed.error}`);
                return;
            }

            const tsPath = parsed.value;
            const jsHref = animTsToJsHref(tsPath);
            const jsUrl = new URL(jsHref, document.baseURI).toString();

            const state = createRunState(embed);
            const stage = embed.__ANIMTS_STAGE;
            const ctx = createContext(embed, stage, state);
            setPaused(embed, false);

            embed.__ANIMTS_BTN_RESTART.onclick = () => mountEmbed(embed);
            embed.__ANIMTS_BTN_PAUSE.onclick = () => setPaused(embed, !state.paused);

            const module = await import(jsUrl);
            const started = startAnimModule(embed, ctx, state, module, tsPath);
            if (!started) return;

            embed.classList.add('animts-embed--running');
        } catch (e) {
            setError(embed, `动画加载/运行失败：${e && e.message ? e.message : String(e)}`);
        } finally {
            embed.__ANIMTS_MOUNTING = false;
            if (embed.__ANIMTS_PENDING_RESTART) {
                embed.__ANIMTS_PENDING_RESTART = false;
                mountEmbed(embed);
            }
        }
    }

    async function mountEmbedFromModuleUrl(embed, moduleUrl, label) {
        if (!embed) return;
        if (embed.__ANIMTS_MOUNTING) {
            embed.__ANIMTS_PENDING_RESTART = true;
            return;
        }
        embed.__ANIMTS_MOUNTING = true;

        try {
            ensureEmbedShell(embed);
            clearError(embed);
            disposeRun(embed);

            if (!moduleUrl) {
                setError(embed, '缺少模块 URL');
                return;
            }

            const state = createRunState(embed);
            const stage = embed.__ANIMTS_STAGE;
            const ctx = createContext(embed, stage, state);
            setPaused(embed, false);

            embed.__ANIMTS_BTN_RESTART.onclick = () => mountEmbedFromModuleUrl(embed, moduleUrl, label);
            embed.__ANIMTS_BTN_PAUSE.onclick = () => setPaused(embed, !state.paused);

            if (label) {
                const title = embed.querySelector('.animts-title');
                if (title) title.textContent = String(label);
            }

            const module = await import(moduleUrl);
            const started = startAnimModule(embed, ctx, state, module, label || '');
            if (!started) return;

            embed.classList.add('animts-embed--running');
        } catch (e) {
            setError(embed, `动画加载/运行失败：${e && e.message ? e.message : String(e)}`);
        } finally {
            embed.__ANIMTS_MOUNTING = false;
            if (embed.__ANIMTS_PENDING_RESTART) {
                embed.__ANIMTS_PENDING_RESTART = false;
                mountEmbedFromModuleUrl(embed, moduleUrl, label);
            }
        }
    }

    function mountEmbeds(root) {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll(EMBED_SELECTOR).forEach((embed) => {
            if (embed.__ANIMTS_AUTO_MOUNTED) return;
            embed.__ANIMTS_AUTO_MOUNTED = true;
            mountEmbed(embed);
        });
    }

    window.AnimTSRuntime = {
        mountEmbed,
        mountEmbedFromModuleUrl,
        mountEmbeds,
        parseAnimTsPath,
        animTsToJsHref,
        normalizePath
    };

    document.addEventListener('viewer:content-ready', function (event) {
        const container = event && event.detail && event.detail.container ? event.detail.container : document;
        mountEmbeds(container);
    });

    document.addEventListener('DOMContentLoaded', function () {
        mountEmbeds(document);
    });
})();
