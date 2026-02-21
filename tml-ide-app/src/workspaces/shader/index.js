import { mountWorkspaceTemplate } from '../shared/template-runtime.js';
import { collectShaderWorkspaceSnapshot } from './collect.js';

const TEMPLATE_PATH = '/tml-ide/subapps/shader/index.html';

const IGNORE_SCRIPT_PATTERN = /(?:\/shared\/assets\/js\/site-core\.js|\/site\/assets\/js\/accent-theme\.js|\/tml-ide\/subapps\/bridge\/shader-bridge\.js)$/i;

const STATE_KEY = 'shader-contribute.state.v2';

export function createShaderWorkspacePlugin() {
    let root = null;
    let lastSnapshot = null;

    async function ensureMounted(ctx) {
        if (root) return root;
        root = await mountWorkspaceTemplate({
            workspace: 'shader',
            templatePath: TEMPLATE_PATH,
            host: ctx.dom.pluginHost,
            stripSelectors: ['header.site-header'],
            ignoreScriptPattern: IGNORE_SCRIPT_PATTERN
        });
        return root;
    }

    return {
        id: 'shader',
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
            return lastSnapshot || collectShaderWorkspaceSnapshot();
        },
        restoreSnapshot(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') return;
            try {
                localStorage.setItem(STATE_KEY, JSON.stringify(snapshot));
            } catch (_err) {
                // Ignore persistence failure.
            }
            lastSnapshot = snapshot;
        },
        collectStaged() {
            lastSnapshot = collectShaderWorkspaceSnapshot();
            return lastSnapshot;
        },
        getCommands() {
            return [];
        },
        handleCommand(commandId) {
            if (String(commandId || '') === 'workspace.open-submit-panel') {
                const panel = document.getElementById('shaderpg-contribute-panel');
                if (panel) {
                    panel.hidden = false;
                    panel.removeAttribute('hidden');
                    return true;
                }
            }
            return false;
        },
        getStatusItems() {
            return [];
        }
    };
}

