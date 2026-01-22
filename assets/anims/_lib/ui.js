export function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
function safeLocalStorageGet(key) {
    try {
        return window.localStorage ? window.localStorage.getItem(key) : null;
    }
    catch (_) {
        return null;
    }
}
function safeLocalStorageSet(key, value) {
    try {
        if (!window.localStorage)
            return;
        window.localStorage.setItem(key, value);
    }
    catch (_) { }
}
export function createPanel(stage, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const portalMode = opts.portal === 'page';
    const root = portalMode ? (stage.ownerDocument && stage.ownerDocument.body ? stage.ownerDocument.body : document.body) : stage;
    const persist = !!opts.persist && portalMode;
    const panel = el('div', `animts-ui-panel${opts.className ? ' ' + String(opts.className) : ''}`);
    if (portalMode)
        panel.classList.add('animts-ui-panel--portal');
    const position = opts.position ? String(opts.position) : 'top-left';
    const dockClass = position === 'top-right'
        ? 'animts-ui-panel--top-right'
        : position === 'bottom-left'
            ? 'animts-ui-panel--bottom-left'
            : position === 'bottom-right'
                ? 'animts-ui-panel--bottom-right'
                : 'animts-ui-panel--top-left';
    panel.classList.add(dockClass);
    const header = el('div', 'animts-ui-panel-header');
    const title = el('div', 'animts-ui-panel-title', opts.title || '面板');
    const actions = el('div', 'animts-ui-panel-actions');
    const btnPin = el('button', 'btn btn-small btn-outline', '固定');
    const btnCollapse = el('button', 'btn btn-small btn-outline', '折叠');
    btnPin.type = 'button';
    btnCollapse.type = 'button';
    actions.appendChild(btnPin);
    actions.appendChild(btnCollapse);
    header.appendChild(title);
    header.appendChild(actions);
    const body = el('div', 'animts-ui-panel-body');
    panel.appendChild(header);
    panel.appendChild(body);
    root.appendChild(panel);
    let pinned = !!opts.pinned;
    let collapsed = !!opts.collapsed;
    let docked = true;
    function getPersistKey() {
        const id = opts.id ? String(opts.id) : (opts.title ? String(opts.title) : 'panel');
        let scope = '';
        try {
            const embed = stage.closest && stage.closest('.animts-embed[data-animts-src]') ? stage.closest('.animts-embed[data-animts-src]') : null;
            if (embed) {
                scope = embed.getAttribute('data-animts-src') || '';
            }
        }
        catch (_) { }
        const key = `animts:panel:${encodeURIComponent(scope)}:${encodeURIComponent(id)}`;
        return key;
    }
    function clampToPage(left, top, width, height) {
        const rootEl = document.documentElement;
        const pageW = Math.max(rootEl.scrollWidth || 0, rootEl.clientWidth || 0, window.innerWidth || 0);
        const pageH = Math.max(rootEl.scrollHeight || 0, rootEl.clientHeight || 0, window.innerHeight || 0);
        const maxX = Math.max(0, pageW - width - 8);
        const maxY = Math.max(0, pageH - height - 8);
        return {
            left: Math.max(8, Math.min(maxX, left)),
            top: Math.max(8, Math.min(maxY, top))
        };
    }
    function removeDockClasses() {
        panel.classList.remove('animts-ui-panel--top-left');
        panel.classList.remove('animts-ui-panel--top-right');
        panel.classList.remove('animts-ui-panel--bottom-left');
        panel.classList.remove('animts-ui-panel--bottom-right');
    }
    function ensureFreePosition() {
        // Keep current visual position when switching to "free" mode.
        const panelRect = panel.getBoundingClientRect();
        if (portalMode) {
            const left = panelRect.left + (window.scrollX || 0);
            const top = panelRect.top + (window.scrollY || 0);
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }
        else {
            const stageRect = stage.getBoundingClientRect();
            const left = panelRect.left - stageRect.left;
            const top = panelRect.top - stageRect.top;
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }
    function ensureUndocked() {
        if (!docked)
            return;
        docked = false;
        removeDockClasses();
        panel.classList.add('animts-ui-panel--free');
        ensureFreePosition();
    }
    function persistState() {
        if (!persist)
            return;
        if (docked)
            return;
        const rect = panel.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;
        const payload = {
            v: 1,
            left: rect.left + scrollX,
            top: rect.top + scrollY,
            pinned: !!pinned,
            collapsed: !!collapsed
        };
        safeLocalStorageSet(getPersistKey(), JSON.stringify(payload));
    }
    function restoreState() {
        if (!persist)
            return;
        const raw = safeLocalStorageGet(getPersistKey());
        if (!raw)
            return;
        try {
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object')
                return;
            // Restore pinned/collapsed first so UI reflects state.
            if (typeof data.pinned === 'boolean')
                pinned = data.pinned;
            if (typeof data.collapsed === 'boolean')
                collapsed = data.collapsed;
            // Restore position in page coords (portal panels are in document flow).
            const left = Number(data.left);
            const top = Number(data.top);
            if (Number.isFinite(left) && Number.isFinite(top)) {
                docked = false;
                removeDockClasses();
                panel.classList.add('animts-ui-panel--free');
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
                // Need a layout pass for width/height
                const rect = panel.getBoundingClientRect();
                const clamped = clampToPage(left, top, rect.width || 0, rect.height || 0);
                panel.style.left = `${clamped.left}px`;
                panel.style.top = `${clamped.top}px`;
            }
        }
        catch (_) { }
    }
    function dockPortalNearStage() {
        if (!portalMode)
            return;
        if (!docked)
            return;
        const stageRect = stage.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;
        const stageLeft = stageRect.left + scrollX;
        const stageTop = stageRect.top + scrollY;
        const stageRight = stageRect.right + scrollX;
        const stageBottom = stageRect.bottom + scrollY;
        // Ensure we have dimensions
        const rect = panel.getBoundingClientRect();
        const w = rect.width || 0;
        const h = rect.height || 0;
        let left = stageLeft + 12;
        let top = stageTop + 12;
        if (position === 'top-right') {
            left = stageRight - w - 12;
            top = stageTop + 12;
            // Prefer placing outside the stage if there is room (avoid covering drawings).
            const canPlaceOutside = (stageRect.right + 12 + w) <= ((window.innerWidth || 0) - 12);
            if (canPlaceOutside)
                left = stageRight + 12;
        }
        else if (position === 'bottom-left') {
            left = stageLeft + 12;
            top = stageBottom - h - 12;
        }
        else if (position === 'bottom-right') {
            left = stageRight - w - 12;
            top = stageBottom - h - 12;
            const canPlaceOutside = (stageRect.right + 12 + w) <= ((window.innerWidth || 0) - 12);
            if (canPlaceOutside)
                left = stageRight + 12;
        }
        const clamped = clampToPage(left, top, w, h);
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = `${clamped.left}px`;
        panel.style.top = `${clamped.top}px`;
    }
    function apply() {
        panel.classList.toggle('animts-ui-panel--pinned', pinned);
        panel.classList.toggle('animts-ui-panel--collapsed', collapsed);
        btnPin.textContent = pinned ? '已固定' : '固定';
        btnPin.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        btnCollapse.textContent = collapsed ? '展开' : '折叠';
        btnCollapse.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
        persistState();
    }
    function isPinned() { return pinned; }
    function setPinned(next) { pinned = !!next; apply(); }
    function togglePinned() { pinned = !pinned; apply(); return pinned; }
    function isCollapsed() { return collapsed; }
    function setCollapsed(next) { collapsed = !!next; apply(); }
    function toggleCollapsed() { collapsed = !collapsed; apply(); return collapsed; }
    // Dragging is available in "free" mode (not pinned)
    (function enableDragging() {
        let dragging = false;
        let moved = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;
        function eventPageX(event) {
            const x = event.pageX;
            if (typeof x === 'number')
                return x;
            return event.clientX + (window.scrollX || 0);
        }
        function eventPageY(event) {
            const y = event.pageY;
            if (typeof y === 'number')
                return y;
            return event.clientY + (window.scrollY || 0);
        }
        function onDown(event) {
            if (pinned)
                return;
            if (event.button !== 0)
                return;
            dragging = true;
            moved = false;
            startX = portalMode ? eventPageX(event) : event.clientX;
            startY = portalMode ? eventPageY(event) : event.clientY;
            const panelRect = panel.getBoundingClientRect();
            if (portalMode) {
                const left = panelRect.left + (window.scrollX || 0);
                const top = panelRect.top + (window.scrollY || 0);
                offsetX = eventPageX(event) - left;
                offsetY = eventPageY(event) - top;
            }
            else {
                offsetX = event.clientX - panelRect.left;
                offsetY = event.clientY - panelRect.top;
            }
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            try {
                title.setPointerCapture(event.pointerId);
            }
            catch (_) { }
            event.preventDefault();
        }
        function onMove(event) {
            if (!dragging)
                return;
            if (pinned)
                return;
            const panelRect = panel.getBoundingClientRect();
            const width = panelRect.width || 0;
            const height = panelRect.height || 0;
            if (!moved) {
                const dx = (portalMode ? eventPageX(event) : event.clientX) - startX;
                const dy = (portalMode ? eventPageY(event) : event.clientY) - startY;
                if ((dx * dx + dy * dy) < 9)
                    return;
                moved = true;
                ensureUndocked();
            }
            if (portalMode) {
                const pageX = eventPageX(event);
                const pageY = eventPageY(event);
                const x = pageX - offsetX;
                const y = pageY - offsetY;
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
            if (!dragging)
                return;
            dragging = false;
            try {
                title.releasePointerCapture(event.pointerId);
            }
            catch (_) { }
            if (moved)
                persistState();
        }
        title.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    })();
    // Cleanup for portal panels: runtime provides AbortSignal on stage.
    (function attachAutoCleanup() {
        if (!portalMode)
            return;
        const signal = stage.__ANIMTS_SIGNAL;
        if (!signal || typeof signal.addEventListener !== 'function')
            return;
        const abortHandler = () => {
            try {
                panel.remove();
            }
            catch (_) { }
        };
        signal.addEventListener('abort', abortHandler, { once: true });
    })();
    restoreState();
    // For portal panels, dock relative to the current embed position (not page origin).
    if (portalMode) {
        requestAnimationFrame(() => dockPortalNearStage());
    }
    apply();
    function addRow() {
        const row = el('div', 'animts-ui-row');
        body.appendChild(row);
        return row;
    }
    function addButton(label, onClick) {
        const row = addRow();
        const btn = el('button', 'btn btn-small btn-outline', label);
        btn.type = 'button';
        btn.addEventListener('click', () => onClick());
        row.appendChild(btn);
        return btn;
    }
    function addToggle(label, initial, onChange) {
        let value = !!initial;
        const row = addRow();
        const btn = el('button', 'btn btn-small btn-outline', '');
        btn.type = 'button';
        function sync() {
            btn.textContent = `${label}: ${value ? 'ON' : 'OFF'}`;
            btn.setAttribute('aria-pressed', value ? 'true' : 'false');
        }
        btn.addEventListener('click', () => {
            value = !value;
            sync();
            onChange(value);
        });
        sync();
        row.appendChild(btn);
        return btn;
    }
    function addSlider(label, sliderOptions, onChange) {
        const row = addRow();
        const left = el('div', 'animts-ui-row-label', label);
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(sliderOptions.min);
        input.max = String(sliderOptions.max);
        input.step = String(Number(sliderOptions.step) || 0.01);
        input.value = String(sliderOptions.initial);
        input.className = 'animts-ui-slider';
        const valueLabel = el('div', 'animts-ui-row-value', String(sliderOptions.initial));
        function emit() {
            const v = Number(input.value);
            valueLabel.textContent = Number.isFinite(v) ? String(v) : '';
            onChange(v);
        }
        input.addEventListener('input', emit);
        row.appendChild(left);
        row.appendChild(input);
        row.appendChild(valueLabel);
        emit();
        return input;
    }
    btnPin.addEventListener('click', () => togglePinned());
    btnCollapse.addEventListener('click', () => toggleCollapsed());
    return {
        el: panel,
        header,
        title,
        body,
        isPinned,
        setPinned,
        togglePinned,
        isCollapsed,
        setCollapsed,
        toggleCollapsed,
        addRow,
        addButton,
        addToggle,
        addSlider
    };
}
//# sourceMappingURL=ui.js.map