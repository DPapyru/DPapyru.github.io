function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function clampToViewport(root, x, y) {
    const safeX = Math.max(0, toNumber(x, 0));
    const safeY = Math.max(0, toNumber(y, 0));
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const rect = root.getBoundingClientRect();
    const nextX = Math.max(4, Math.min(width - rect.width - 4, safeX));
    const nextY = Math.max(4, Math.min(height - rect.height - 4, safeY));
    return { x: nextX, y: nextY };
}

function normalizeItem(item) {
    const safe = item && typeof item === 'object' ? item : {};
    return {
        id: String(safe.id || ''),
        label: String(safe.label || ''),
        shortcut: String(safe.shortcut || ''),
        group: String(safe.group || ''),
        run: typeof safe.run === 'function' ? safe.run : () => {}
    };
}

export function createContextMenuController(options) {
    const opts = options || {};
    const root = opts.root || null;
    const list = opts.list || null;
    const titleNode = opts.titleNode || null;
    const selectItems = typeof opts.selectItems === 'function' ? opts.selectItems : () => [];

    const state = {
        open: false,
        region: '',
        x: 0,
        y: 0,
        title: '',
        context: null,
        items: [],
        selectedIndex: 0
    };

    function close() {
        state.open = false;
        state.region = '';
        state.context = null;
        state.items = [];
        state.selectedIndex = 0;
        if (root) {
            root.hidden = true;
            root.setAttribute('aria-hidden', 'true');
            root.style.left = '';
            root.style.top = '';
        }
        if (list) {
            list.innerHTML = '';
        }
    }

    function updateSelection(nextIndex) {
        if (!list) return;
        const nodes = Array.from(list.querySelectorAll('.ide-context-menu-item'));
        if (!nodes.length) {
            state.selectedIndex = 0;
            return;
        }
        let safe = Number(nextIndex);
        if (!Number.isFinite(safe)) safe = 0;
        if (safe < 0) safe = nodes.length - 1;
        if (safe >= nodes.length) safe = 0;
        state.selectedIndex = safe;
        nodes.forEach((node, index) => {
            const active = index === safe;
            node.classList.toggle('ide-context-menu-item-active', active);
            node.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function execute(index) {
        const safe = Number(index);
        if (!Number.isFinite(safe) || safe < 0 || safe >= state.items.length) return;
        const item = state.items[safe];
        close();
        try {
            item.run(state.context || {});
        } catch (_) {
            // Execution errors are surfaced by command handlers through existing event log/status.
        }
    }

    function render() {
        if (!root || !list) return;
        list.innerHTML = '';
        let lastGroup = '';
        state.items.forEach((item, index) => {
            if (index > 0 && item.group !== lastGroup) {
                const sep = document.createElement('li');
                sep.className = 'ide-context-menu-separator';
                sep.setAttribute('role', 'separator');
                list.appendChild(sep);
            }
            lastGroup = item.group;

            const li = document.createElement('li');
            li.className = 'ide-context-menu-row';
            li.setAttribute('role', 'none');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ide-context-menu-item';
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('aria-selected', 'false');
            btn.dataset.itemIndex = String(index);

            const label = document.createElement('span');
            label.className = 'ide-context-menu-item-label';
            label.textContent = item.label;
            btn.appendChild(label);

            if (item.shortcut) {
                const shortcut = document.createElement('span');
                shortcut.className = 'ide-context-menu-item-shortcut';
                shortcut.textContent = item.shortcut;
                btn.appendChild(shortcut);
            }

            btn.addEventListener('mouseenter', () => updateSelection(index));
            btn.addEventListener('click', () => execute(index));

            li.appendChild(btn);
            list.appendChild(li);
        });
        updateSelection(state.selectedIndex);
    }

    function open(payload) {
        if (!root || !list) return;
        const safePayload = payload || {};
        const region = String(safePayload.region || '').trim();
        const context = safePayload.context || {};
        const title = String(safePayload.title || '');
        const selected = selectItems(region, context)
            .map((item) => normalizeItem(item))
            .filter((item) => !!item.id && !!item.label);
        if (!selected.length) {
            close();
            return;
        }

        state.open = true;
        state.region = region;
        state.x = toNumber(safePayload.x, 0);
        state.y = toNumber(safePayload.y, 0);
        state.title = title;
        state.context = context;
        state.items = selected;
        state.selectedIndex = 0;

        if (titleNode) {
            titleNode.textContent = title || '功能';
            titleNode.hidden = !title;
        }
        render();

        root.hidden = false;
        root.setAttribute('aria-hidden', 'false');
        root.style.left = '0px';
        root.style.top = '0px';
        const position = clampToViewport(root, state.x, state.y);
        state.x = position.x;
        state.y = position.y;
        root.style.left = `${state.x}px`;
        root.style.top = `${state.y}px`;
    }

    function onGlobalPointerDown(event) {
        if (!state.open || !root) return;
        if (root.contains(event.target)) return;
        close();
    }

    function onGlobalScroll() {
        if (state.open) close();
    }

    function handleKeydown(event) {
        if (!state.open) return false;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return true;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            updateSelection(state.selectedIndex + 1);
            return true;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            updateSelection(state.selectedIndex - 1);
            return true;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            execute(state.selectedIndex);
            return true;
        }
        return false;
    }

    function bindRegion(target, region, resolver) {
        if (!target) return;
        const resolveContext = typeof resolver === 'function' ? resolver : () => ({});
        target.addEventListener('contextmenu', (event) => {
            const insideInteractiveInput = event.target && event.target.closest
                ? event.target.closest('input, textarea, [contenteditable="true"]')
                : null;
            if (insideInteractiveInput) return;
            event.preventDefault();
            const context = resolveContext(event) || {};
            open({
                region,
                context,
                title: String(context.menuTitle || ''),
                x: event.clientX,
                y: event.clientY
            });
        });
    }

    document.addEventListener('pointerdown', onGlobalPointerDown);
    document.addEventListener('scroll', onGlobalScroll, true);
    window.addEventListener('resize', onGlobalScroll);

    return {
        open,
        close,
        bindRegion,
        handleKeydown,
        getState() {
            return {
                open: state.open,
                region: state.region,
                x: state.x,
                y: state.y,
                selectedIndex: state.selectedIndex,
                itemIds: state.items.map((item) => item.id),
                title: state.title
            };
        },
        destroy() {
            close();
            document.removeEventListener('pointerdown', onGlobalPointerDown);
            document.removeEventListener('scroll', onGlobalScroll, true);
            window.removeEventListener('resize', onGlobalScroll);
        }
    };
}
