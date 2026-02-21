import { mountWorkspaceTemplate } from '../shared/template-runtime.js';
import { collectShaderWorkspaceSnapshot } from './collect.js';

const TEMPLATE_PATH = '/tml-ide/subapps/shader/index.html';

const IGNORE_SCRIPT_PATTERN = /(?:\/shared\/assets\/js\/site-core\.js|\/site\/assets\/js\/accent-theme\.js|\/tml-ide\/subapps\/bridge\/shader-bridge\.js)$/i;

const STATE_KEY = 'shader-contribute.state.v2';
const PLAYGROUND_STATE_KEY = 'shader-playground.v1';
const CONTRIBUTION_DRAFT_KEY = 'shader-playground.contribute-draft.v1';

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
            const staged = lastSnapshot || (root ? collectShaderWorkspaceSnapshot() : null);
            return {
                staged,
                contributeState: readJsonStorage(STATE_KEY),
                playgroundState: readJsonStorage(PLAYGROUND_STATE_KEY),
                contributionDraft: readJsonStorage(CONTRIBUTION_DRAFT_KEY)
            };
        },
        restoreSnapshot(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') return;
            const staged = resolveStagedSnapshot(snapshot);
            if (staged && typeof staged === 'object') {
                lastSnapshot = staged;
            }
            const contributeState = snapshot.contributeState && typeof snapshot.contributeState === 'object'
                ? snapshot.contributeState
                : null;
            const playgroundState = snapshot.playgroundState && typeof snapshot.playgroundState === 'object'
                ? snapshot.playgroundState
                : null;
            const contributionDraft = snapshot.contributionDraft && typeof snapshot.contributionDraft === 'object'
                ? snapshot.contributionDraft
                : null;

            if (contributeState) {
                writeJsonStorage(STATE_KEY, contributeState);
            } else if (staged) {
                writeJsonStorage(STATE_KEY, staged);
            }
            if (playgroundState) {
                writeJsonStorage(PLAYGROUND_STATE_KEY, playgroundState);
            }
            if (contributionDraft) {
                writeJsonStorage(CONTRIBUTION_DRAFT_KEY, contributionDraft);
            }
        },
        collectStaged() {
            if (!root) {
                return lastSnapshot;
            }
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
