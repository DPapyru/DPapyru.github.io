function getPathsApi() {
    if (window.AnimTSPaths) return window.AnimTSPaths;
    throw new Error('AnimTSPaths not loaded (missing assets/js/animts/paths.js)');
}

function isDocsPage() {
    return window.location.pathname.includes('/docs/');
}

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal && signal.aborted) {
            reject(signal.reason || new Error('aborted'));
            return;
        }
        const handle = setTimeout(resolve, Math.max(0, ms | 0));
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(handle);
                reject(signal.reason || new Error('aborted'));
            }, { once: true });
        }
    });
}

function createDanmakuApi(host, signal) {
    const layer = document.createElement('div');
    layer.className = 'animts-danmaku-layer';
    host.appendChild(layer);

    function send(text, options) {
        options = options || {};

        const message = document.createElement('div');
        message.className = 'animts-danmaku';
        message.textContent = String(text || '');
        if (options.color) message.style.color = String(options.color);
        if (options.fontSize) message.style.fontSize = String(options.fontSize);

        const trackCount = Number.isFinite(options.trackCount) ? Math.max(1, options.trackCount | 0) : 8;
        const track = Number.isFinite(options.track) ? (options.track | 0) : 0;
        const trackIndex = ((track % trackCount) + trackCount) % trackCount;
        message.style.top = (8 + trackIndex * 26) + 'px';

        layer.appendChild(message);

        const durationMs = Number.isFinite(options.durationMs) ? Math.max(100, options.durationMs | 0) : 6500;
        const containerWidth = host.clientWidth || 600;
        const elementWidth = message.offsetWidth || 200;

        let animation;
        if (typeof message.animate === 'function') {
            animation = message.animate([
                { transform: `translateX(${containerWidth}px)` },
                { transform: `translateX(${-elementWidth - 20}px)` }
            ], { duration: durationMs, easing: 'linear', fill: 'forwards' });
        } else {
            message.style.transform = `translateX(${containerWidth}px)`;
            message.style.transition = `transform ${durationMs}ms linear`;
            requestAnimationFrame(() => {
                message.style.transform = `translateX(${-elementWidth - 20}px)`;
            });
        }

        const cleanup = () => {
            if (animation && typeof animation.cancel === 'function') animation.cancel();
            message.remove();
        };

        if (signal) signal.addEventListener('abort', cleanup, { once: true });
        if (animation && typeof animation.finished === 'object') {
            animation.finished.then(cleanup).catch(cleanup);
        } else {
            setTimeout(cleanup, durationMs + 50);
        }

        return { stop: cleanup };
    }

    return { send };
}

function createNpcApi(host, signal) {
    const layer = document.createElement('div');
    layer.className = 'animts-npc-layer';
    host.appendChild(layer);

    function say(name, text, options) {
        options = options || {};

        const bubble = document.createElement('div');
        bubble.className = 'animts-npc-bubble';

        const title = document.createElement('div');
        title.className = 'animts-npc-name';
        title.textContent = String(name || 'NPC');

        const body = document.createElement('div');
        body.className = 'animts-npc-text';
        body.textContent = String(text || '');

        bubble.appendChild(title);
        bubble.appendChild(body);
        layer.appendChild(bubble);

        const visibleMs = Number.isFinite(options.visibleMs) ? Math.max(300, options.visibleMs | 0) : 2200;
        const done = sleep(visibleMs, signal).then(() => {
            bubble.remove();
        });

        return done;
    }

    return { say };
}

function createRunContext(stage, controller) {
    const signal = controller.signal;
    return {
        host: stage,
        signal,
        sleep: (ms) => sleep(ms, signal),
        danmaku: createDanmakuApi(stage, signal),
        npc: createNpcApi(stage, signal)
    };
}

function buildEmbedUi(embed, sourcePath) {
    embed.classList.add('animts-embed-ready');
    embed.innerHTML = '';

    const frame = document.createElement('div');
    frame.className = 'animts-frame';

    const toolbar = document.createElement('div');
    toolbar.className = 'animts-toolbar';

    const label = document.createElement('div');
    label.className = 'animts-label';
    label.textContent = sourcePath;

    const controls = document.createElement('div');
    controls.className = 'animts-controls';

    const btnRestart = document.createElement('button');
    btnRestart.type = 'button';
    btnRestart.className = 'btn btn-small btn-outline animts-btn-restart';
    btnRestart.textContent = '重播';

    const btnStop = document.createElement('button');
    btnStop.type = 'button';
    btnStop.className = 'btn btn-small btn-outline animts-btn-stop';
    btnStop.textContent = '停止';

    controls.appendChild(btnRestart);
    controls.appendChild(btnStop);

    toolbar.appendChild(label);
    toolbar.appendChild(controls);

    const stage = document.createElement('div');
    stage.className = 'animts-stage';
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Animation stage');

    const error = document.createElement('div');
    error.className = 'animts-error';
    error.style.display = 'none';

    frame.appendChild(toolbar);
    frame.appendChild(stage);
    frame.appendChild(error);
    embed.appendChild(frame);

    return { stage, error, btnRestart, btnStop };
}

function showError(errorEl, message) {
    errorEl.textContent = String(message || '未知错误');
    errorEl.style.display = 'block';
}

function hideError(errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
}

const mounts = new Map();

async function runEmbed(embed, options) {
    options = options || {};
    const paths = getPathsApi();

    const rawSource = embed.getAttribute('data-animts-src') || '';
    const sourcePath = paths.normalizeAnimTsSourcePath(rawSource);
    const builtUrl = paths.mapSourceTsToBuiltJsUrl(sourcePath, { page: isDocsPage() ? 'docs' : 'root' });

    const ui = buildEmbedUi(embed, sourcePath);

    if (!builtUrl) {
        showError(ui.error, '无效的动画路径（仅允许 anims/**/*.ts）');
        return;
    }

    const controller = new AbortController();
    const unmount = () => {
        controller.abort();
        embed.innerHTML = '';
        mounts.delete(embed);
    };

    mounts.set(embed, { unmount, controller });
    hideError(ui.error);

    const start = async () => {
        hideError(ui.error);
        ui.stage.innerHTML = '';

        const ctx = createRunContext(ui.stage, controller);
        try {
            const cacheBust = options.cacheBust ? `?t=${Date.now()}` : '';
            const mod = await import(builtUrl + cacheBust);
            const runner = (mod && (mod.default || mod.run)) || null;
            if (typeof runner !== 'function') {
                throw new Error('动画模块未导出默认 run(ctx) 函数');
            }
            await runner(ctx);
        } catch (e) {
            if (controller.signal.aborted) return;
            console.error('AnimTS run failed:', e);
            showError(ui.error, e && e.message ? e.message : String(e));
        }
    };

    ui.btnRestart.addEventListener('click', () => {
        if (controller.signal.aborted) return;
        start();
    });
    ui.btnStop.addEventListener('click', () => {
        unmount();
    });

    await start();
}

function mountAll(container, options) {
    const root = container || document;
    const embeds = Array.from(root.querySelectorAll('.animts-embed[data-animts-src]'));
    embeds.forEach(embed => {
        if (mounts.has(embed)) return;
        runEmbed(embed, options).catch(e => {
            console.error('AnimTS mount failed:', e);
        });
    });
}

function stopAll() {
    Array.from(mounts.values()).forEach(entry => {
        try {
            entry.unmount();
        } catch (_) { }
    });
    mounts.clear();
}

window.AnimTS = {
    mountAll,
    stopAll,
    _mounts: mounts
};

document.addEventListener('viewer:content-ready', (event) => {
    stopAll();
    const container = event && event.detail && event.detail.container ? event.detail.container : document;
    mountAll(container);
});

