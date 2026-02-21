import { mountWorkspaceTemplate } from '../shared/template-runtime.js';
import { collectMarkdownWorkspaceSnapshot } from './collect.js';

const TEMPLATE_PATH = '/tml-ide/subapps/markdown/index.html';

const IGNORE_SCRIPT_PATTERN = /(?:\/shared\/assets\/js\/site-core\.js|\/site\/assets\/js\/navigation\.js|\/site\/assets\/js\/accent-theme\.js|\/tml-ide\/subapps\/bridge\/markdown-bridge\.js)$/i;

const STORAGE_KEY = 'articleStudioMarkdown.v9';
const VIEWER_PREVIEW_STORAGE_KEY = 'articleStudioViewerPreview.v1';

function readJsonStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_err) {
        return null;
    }
}

function writeJsonStorage(key, value) {
    try {
        if (!value || typeof value !== 'object') return;
        localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
        // Ignore persistence failure.
    }
}

function resolveStagedSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    if (snapshot.staged && typeof snapshot.staged === 'object') {
        return snapshot.staged;
    }
    return snapshot;
}

export function createMarkdownWorkspacePlugin() {
    let root = null;
    let lastSnapshot = null;

    async function ensureMounted(ctx) {
        if (root) return root;
        root = await mountWorkspaceTemplate({
            workspace: 'markdown',
            templatePath: TEMPLATE_PATH,
            host: ctx.dom.pluginHost,
            stripSelectors: ['header.site-header'],
            ignoreScriptPattern: IGNORE_SCRIPT_PATTERN
        });
        return root;
    }

    return {
        id: 'markdown',
        async mount(ctx) {
            const dom = ctx && ctx.dom ? ctx.dom : {};
            if (dom.workspaceSubappRoot) {
                dom.workspaceSubappRoot.hidden = false;
            }
            if (dom.workspaceCsharpRoot) {
                dom.workspaceCsharpRoot.hidden = true;
            }
            const node = await ensureMounted(ctx);
            node.hidden = false;
        },
        unmount() {
            if (root) {
                root.hidden = true;
            }
        },
        getSnapshot() {
            const staged = lastSnapshot || (root ? collectMarkdownWorkspaceSnapshot() : null);
            return {
                staged,
                legacyState: readJsonStorage(STORAGE_KEY),
                viewerPreview: readJsonStorage(VIEWER_PREVIEW_STORAGE_KEY)
            };
        },
        restoreSnapshot(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') return;
            const staged = resolveStagedSnapshot(snapshot);
            if (staged && typeof staged === 'object') {
                lastSnapshot = staged;
            }
            const legacyState = snapshot.legacyState && typeof snapshot.legacyState === 'object'
                ? snapshot.legacyState
                : null;
            const viewerPreview = snapshot.viewerPreview && typeof snapshot.viewerPreview === 'object'
                ? snapshot.viewerPreview
                : null;

            if (legacyState) {
                writeJsonStorage(STORAGE_KEY, legacyState);
            } else if (staged) {
                writeJsonStorage(STORAGE_KEY, staged);
            }
            if (viewerPreview) {
                writeJsonStorage(VIEWER_PREVIEW_STORAGE_KEY, viewerPreview);
            }
        },
        collectStaged() {
            if (!root) {
                return lastSnapshot;
            }
            lastSnapshot = collectMarkdownWorkspaceSnapshot();
            return lastSnapshot;
        },
        getCommands() {
            return [];
        },
        handleCommand(commandId) {
            if (String(commandId || '') === 'workspace.open-submit-panel') {
                const trigger = document.getElementById('studio-open-publish');
                if (trigger && typeof trigger.click === 'function') {
                    trigger.click();
                }
                const panel = document.getElementById('studio-right-panel-modal');
                if (panel) {
                    panel.setAttribute('aria-hidden', 'false');
                    panel.removeAttribute('hidden');
                }
                return true;
            }
            return false;
        },
        getStatusItems() {
            return [];
        }
    };
}
