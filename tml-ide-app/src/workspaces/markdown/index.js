import { mountWorkspaceTemplate } from '../shared/template-runtime.js';
import { collectMarkdownWorkspaceSnapshot } from './collect.js';

const TEMPLATE_PATH = '/tml-ide/subapps/markdown/index.html';

const IGNORE_SCRIPT_PATTERN = /(?:\/shared\/assets\/js\/site-core\.js|\/site\/assets\/js\/navigation\.js|\/site\/assets\/js\/accent-theme\.js|\/tml-ide\/subapps\/bridge\/markdown-bridge\.js)$/i;

const STORAGE_KEY = 'articleStudioMarkdown.v9';

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
            return lastSnapshot || collectMarkdownWorkspaceSnapshot();
        },
        restoreSnapshot(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') return;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            } catch (_err) {
                // Ignore persistence failure.
            }
            lastSnapshot = snapshot;
        },
        collectStaged() {
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
