function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function issueKey(issue) {
    const safe = issue && typeof issue === 'object' ? issue : {};
    return [
        String(safe.fileId || ''),
        String(safe.source || ''),
        String(safe.code || ''),
        String(safe.severity || ''),
        String(safe.startLineNumber || 1),
        String(safe.startColumn || 1),
        String(safe.message || '')
    ].join('|');
}

function clampToViewport(root, x, y) {
    const safeX = Math.max(0, toNumber(x, 0));
    const safeY = Math.max(0, toNumber(y, 0));
    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const rect = root.getBoundingClientRect();
    const nextX = Math.max(6, Math.min(width - rect.width - 6, safeX));
    const nextY = Math.max(6, Math.min(height - rect.height - 6, safeY));
    return { x: nextX, y: nextY };
}

function normalizeSuggestion(item) {
    const safe = item && typeof item === 'object' ? item : {};
    return {
        id: String(safe.id || ''),
        title: String(safe.title || ''),
        description: String(safe.description || ''),
        copyText: String(safe.copyText || '')
    };
}

export function createFixPopupController(options) {
    const opts = options || {};
    const root = opts.root || null;
    const issueNode = opts.issueNode || null;
    const list = opts.suggestionsNode || null;
    const actionsNode = opts.actionsNode || null;
    const buildSuggestions = typeof opts.buildSuggestions === 'function' ? opts.buildSuggestions : () => [];
    const getSuggestionContext = typeof opts.getSuggestionContext === 'function' ? opts.getSuggestionContext : () => ({});
    const resolveIssueAtCursor = typeof opts.resolveIssueAtCursor === 'function' ? opts.resolveIssueAtCursor : () => null;
    const onJumpIssue = typeof opts.onJumpIssue === 'function' ? opts.onJumpIssue : () => {};
    const onShowProblems = typeof opts.onShowProblems === 'function' ? opts.onShowProblems : () => {};
    const onCopyText = typeof opts.onCopyText === 'function' ? opts.onCopyText : async () => false;
    const autoDelay = Math.max(120, toNumber(opts.autoDelay, 300));

    const state = {
        open: false,
        x: 0,
        y: 0,
        issue: null,
        suggestions: [],
        selectedIndex: 0,
        autoTimer: 0,
        lastAutoIssueKey: '',
        lastOpenReason: ''
    };

    function cancelAuto() {
        if (state.autoTimer) {
            clearTimeout(state.autoTimer);
            state.autoTimer = 0;
        }
    }

    function close() {
        cancelAuto();
        state.open = false;
        state.issue = null;
        state.suggestions = [];
        state.selectedIndex = 0;
        state.lastOpenReason = '';
        if (root) {
            root.hidden = true;
            root.setAttribute('aria-hidden', 'true');
            root.style.left = '';
            root.style.top = '';
        }
        if (list) {
            list.innerHTML = '';
        }
        if (actionsNode) {
            actionsNode.innerHTML = '';
        }
    }

    function updateSelection(nextIndex) {
        if (!list) return;
        const nodes = Array.from(list.querySelectorAll('.ide-fix-suggestion'));
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
            node.classList.toggle('ide-fix-suggestion-active', active);
            node.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    async function copySuggestion(index) {
        const safe = Number(index);
        if (!Number.isFinite(safe) || safe < 0 || safe >= state.suggestions.length) return false;
        const suggestion = state.suggestions[safe];
        if (!suggestion.copyText) return false;
        return await onCopyText(suggestion.copyText, suggestion, state.issue);
    }

    function render() {
        if (!root || !issueNode || !list || !actionsNode) return;
        list.innerHTML = '';
        actionsNode.innerHTML = '';
        const issue = state.issue || {};
        issueNode.textContent = `[${issue.code || 'ISSUE'}] Ln ${issue.startLineNumber || 1}, Col ${issue.startColumn || 1} · ${issue.message || ''}`;

        state.suggestions.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'ide-fix-suggestion';
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');

            const title = document.createElement('div');
            title.className = 'ide-fix-suggestion-title';
            title.textContent = item.title || `建议 ${index + 1}`;
            li.appendChild(title);

            if (item.description) {
                const description = document.createElement('div');
                description.className = 'ide-fix-suggestion-description';
                description.textContent = item.description;
                li.appendChild(description);
            }

            const actionRow = document.createElement('div');
            actionRow.className = 'ide-fix-suggestion-actions';
            const btnCopy = document.createElement('button');
            btnCopy.type = 'button';
            btnCopy.textContent = '复制建议';
            btnCopy.addEventListener('click', async () => {
                updateSelection(index);
                await copySuggestion(index);
            });
            actionRow.appendChild(btnCopy);
            li.appendChild(actionRow);

            li.addEventListener('mouseenter', () => updateSelection(index));
            li.addEventListener('click', () => updateSelection(index));
            list.appendChild(li);
        });

        const btnJump = document.createElement('button');
        btnJump.type = 'button';
        btnJump.className = 'ide-fix-popup-action';
        btnJump.textContent = '定位问题';
        btnJump.addEventListener('click', () => {
            if (!state.issue) return;
            onJumpIssue(state.issue);
        });
        actionsNode.appendChild(btnJump);

        const btnCopyMain = document.createElement('button');
        btnCopyMain.type = 'button';
        btnCopyMain.className = 'ide-fix-popup-action';
        btnCopyMain.textContent = '复制首条建议';
        btnCopyMain.addEventListener('click', async () => {
            await copySuggestion(0);
        });
        actionsNode.appendChild(btnCopyMain);

        const btnShowProblems = document.createElement('button');
        btnShowProblems.type = 'button';
        btnShowProblems.className = 'ide-fix-popup-action';
        btnShowProblems.textContent = '打开 Problems';
        btnShowProblems.addEventListener('click', () => {
            if (!state.issue) return;
            onShowProblems(state.issue);
        });
        actionsNode.appendChild(btnShowProblems);

        updateSelection(state.selectedIndex);
    }

    function open(payload) {
        if (!root || !issueNode || !list || !actionsNode) return false;
        const safePayload = payload || {};
        const issue = safePayload.issue && typeof safePayload.issue === 'object' ? safePayload.issue : null;
        if (!issue) {
            close();
            return false;
        }

        const reason = String(safePayload.reason || 'manual');
        const suggestions = buildSuggestions(issue, getSuggestionContext(issue))
            .map((item) => normalizeSuggestion(item))
            .filter((item) => !!item.title);
        if (!suggestions.length) {
            close();
            return false;
        }

        state.open = true;
        state.issue = issue;
        state.suggestions = suggestions;
        state.selectedIndex = 0;
        state.lastOpenReason = reason;

        root.hidden = false;
        root.setAttribute('aria-hidden', 'false');
        root.style.left = '0px';
        root.style.top = '0px';
        render();

        const pos = clampToViewport(root, safePayload.x, safePayload.y);
        state.x = pos.x;
        state.y = pos.y;
        root.style.left = `${state.x}px`;
        root.style.top = `${state.y}px`;
        return true;
    }

    function openAtCursor(options) {
        const payload = options || {};
        const resolved = resolveIssueAtCursor(payload) || null;
        if (!resolved || !resolved.issue) {
            if (payload.closeWhenMissing !== false) {
                close();
            }
            return false;
        }
        return open({
            issue: resolved.issue,
            x: resolved.x,
            y: resolved.y,
            reason: payload.reason || 'manual'
        });
    }

    function scheduleAuto() {
        cancelAuto();
        state.autoTimer = setTimeout(() => {
            state.autoTimer = 0;
            const resolved = resolveIssueAtCursor({
                allowInfo: false,
                preferCurrent: true,
                closeWhenMissing: false
            }) || null;
            if (!resolved || !resolved.issue) {
                if (state.lastOpenReason === 'auto') {
                    close();
                }
                return;
            }
            const key = issueKey(resolved.issue);
            if (key && key === state.lastAutoIssueKey && state.open && state.lastOpenReason === 'auto') {
                return;
            }
            state.lastAutoIssueKey = key;
            open({
                issue: resolved.issue,
                x: resolved.x,
                y: resolved.y,
                reason: 'auto'
            });
        }, autoDelay);
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
            copySuggestion(state.selectedIndex);
            return true;
        }
        return false;
    }

    function onGlobalPointerDown(event) {
        if (!state.open || !root) return;
        if (root.contains(event.target)) return;
        close();
    }

    function onViewportChanged() {
        if (state.open) close();
    }

    document.addEventListener('pointerdown', onGlobalPointerDown);
    document.addEventListener('scroll', onViewportChanged, true);
    window.addEventListener('resize', onViewportChanged);

    return {
        open,
        close,
        openAtCursor,
        scheduleAuto,
        cancelAuto,
        handleKeydown,
        getState() {
            return {
                open: state.open,
                issueKey: state.issue ? issueKey(state.issue) : '',
                issueCode: state.issue ? String(state.issue.code || '') : '',
                suggestions: state.suggestions.length,
                x: state.x,
                y: state.y,
                reason: state.lastOpenReason
            };
        },
        destroy() {
            close();
            document.removeEventListener('pointerdown', onGlobalPointerDown);
            document.removeEventListener('scroll', onViewportChanged, true);
            window.removeEventListener('resize', onViewportChanged);
        }
    };
}
