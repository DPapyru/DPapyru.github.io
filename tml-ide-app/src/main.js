import './style.css';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution';
import { conf as csharpConf, language as csharpLanguage } from 'monaco-editor/esm/vs/basic-languages/csharp/csharp';

import { DIAGNOSTIC_SEVERITY, MESSAGE_TYPES } from './contracts/messages.js';
import { createEnhancedCsharpLanguage } from './lib/csharp-highlighting.js';
import { buildPatchIndexFromXml } from './lib/language-core.js';
import { createEmptyApiIndex, mergeApiIndex, normalizeApiIndex } from './lib/index-schema.js';
import { createPluginRegistry } from './core/plugin-registry.js';
import { createShellEventBus } from './core/shell-event-bus.js';
import { createStorageService } from './core/storage-service.js';
import { createUnifiedSubmitService } from './core/unified-submit-service.js';
import { createCsharpWorkspacePlugin } from './workspaces/csharp/index.js';
import { createMarkdownWorkspacePlugin } from './workspaces/markdown/index.js';
import { createShaderWorkspacePlugin } from './workspaces/shader/index.js';
import {
    createDefaultWorkspace,
    exportWorkspaceJson,
    importWorkspaceJson,
    loadWorkspace,
    saveWorkspace,
    loadUnifiedWorkspaceState,
    saveUnifiedWorkspaceState
} from './lib/workspace-store.js';

self.MonacoEnvironment = {
    getWorker() {
        return new editorWorker();
    }
};

const dom = {
    appRoot: document.getElementById('app'),
    workspaceCsharpRoot: document.getElementById('workspace-csharp-root'),
    workspaceSubappRoot: document.getElementById('workspace-subapp-root'),
    workspaceButtons: Array.from(document.querySelectorAll('.workspace-btn[data-workspace]')),
    btnOpenUnifiedSubmit: document.getElementById('btn-open-unified-submit'),
    btnRouteSubmitPanel: document.getElementById('btn-route-submit-panel'),
    fileList: document.getElementById('file-list'),
    activeFileName: document.getElementById('active-file-name'),
    editor: document.getElementById('editor'),
    editorStatus: document.getElementById('editor-status'),
    indexInfo: document.getElementById('index-info'),
    workspaceVersion: document.getElementById('workspace-version'),
    eventLog: document.getElementById('event-log'),
    btnAddFile: document.getElementById('btn-add-file'),
    btnRenameFile: document.getElementById('btn-rename-file'),
    btnDeleteFile: document.getElementById('btn-delete-file'),
    btnRunDiagnostics: document.getElementById('btn-run-diagnostics'),
    btnSaveWorkspace: document.getElementById('btn-save-workspace'),
    btnExportWorkspace: document.getElementById('btn-export-workspace'),
    inputImportWorkspace: document.getElementById('input-import-workspace'),
    toggleRoslyn: document.getElementById('toggle-roslyn'),
    problemsSummary: document.getElementById('problems-summary'),
    problemsList: document.getElementById('problems-list'),
    inputExtraDll: document.getElementById('input-extra-dll'),
    inputExtraXml: document.getElementById('input-extra-xml'),
    btnImportAssembly: document.getElementById('btn-import-assembly'),
    inputIndexerDllPath: document.getElementById('input-indexer-dll-path'),
    inputIndexerXmlPath: document.getElementById('input-indexer-xml-path'),
    inputIndexerTerrariaDllPath: document.getElementById('input-indexer-terraria-dll-path'),
    inputIndexerTerrariaXmlPath: document.getElementById('input-indexer-terraria-xml-path'),
    inputIndexerOutPath: document.getElementById('input-indexer-out-path'),
    indexCommandPreview: document.getElementById('index-command-preview'),
    btnCopyIndexCommand: document.getElementById('btn-copy-index-command'),
    inputAppendDllPath: document.getElementById('input-append-dll-path'),
    inputAppendXmlPath: document.getElementById('input-append-xml-path'),
    inputAppendOutPath: document.getElementById('input-append-out-path'),
    appendCommandPreview: document.getElementById('append-command-preview'),
    btnCopyAppendCommand: document.getElementById('btn-copy-append-command'),
    inputImportIndex: document.getElementById('input-import-index'),
    btnImportIndex: document.getElementById('btn-import-index'),
    activityButtons: Array.from(document.querySelectorAll('.activity-btn[data-activity]')),
    panelTabButtons: Array.from(document.querySelectorAll('.panel-tab[data-panel-tab]')),
    panelViews: Array.from(document.querySelectorAll('.panel-view[data-panel-view]')),
    bottomPanel: document.getElementById('bottom-panel'),
    btnToggleBottomPanel: document.getElementById('btn-toggle-bottom-panel'),
    commandPalette: document.getElementById('command-palette'),
    commandPaletteBackdrop: document.getElementById('command-palette-backdrop'),
    commandPaletteInput: document.getElementById('command-palette-input'),
    commandPaletteResults: document.getElementById('command-palette-results'),
    pluginHost: document.getElementById('workspace-plugin-host'),
    subappTitle: document.getElementById('subapp-title'),
    btnSubappReload: document.getElementById('btn-subapp-reload'),
    btnSubappOpenSubmit: document.getElementById('btn-subapp-open-submit'),
    unifiedSubmitPanel: document.getElementById('unified-submit-panel'),
    btnUnifiedSubmitClose: document.getElementById('btn-unified-submit-close'),
    unifiedWorkerUrl: document.getElementById('unified-worker-url'),
    btnUnifiedAuthLogin: document.getElementById('btn-unified-auth-login'),
    btnUnifiedAuthLogout: document.getElementById('btn-unified-auth-logout'),
    unifiedAuthStatus: document.getElementById('unified-auth-status'),
    unifiedPrTitle: document.getElementById('unified-pr-title'),
    unifiedExistingPrNumber: document.getElementById('unified-existing-pr-number'),
    unifiedAnchorSelect: document.getElementById('unified-anchor-select'),
    unifiedSummary: document.getElementById('unified-summary'),
    btnUnifiedCollect: document.getElementById('btn-unified-collect'),
    btnUnifiedSubmit: document.getElementById('btn-unified-submit'),
    btnUnifiedResume: document.getElementById('btn-unified-resume'),
    unifiedSendableList: document.getElementById('unified-sendable-list'),
    unifiedBlockedList: document.getElementById('unified-blocked-list'),
    unifiedBatchProgress: document.getElementById('unified-batch-progress'),
    unifiedSubmitStatus: document.getElementById('unified-submit-status')
};

const state = {
    index: createEmptyApiIndex(),
    workspace: createDefaultWorkspace(),
    unifiedWorkspaceState: null,
    editor: null,
    modelByFileId: new Map(),
    analyzeCache: new Map(),
    diagnosticsTimer: 0,
    saveTimer: 0,
    roslynEnabled: false,
    roslynWorker: null,
    initialized: false,
    problems: [],
    route: {
        workspace: 'csharp',
        panel: ''
    },
    subapps: {
        snapshotByWorkspace: {
            markdown: null,
            shader: null
        }
    },
    plugins: {
        registry: createPluginRegistry(),
        activeWorkspace: '',
        mountedWorkspace: '',
        shellEventBus: createShellEventBus(),
        storageService: createStorageService(),
        submitService: createUnifiedSubmitService({
            normalizeRepoPath
        })
    },
    unified: {
        persistTimer: 0,
        collectVersion: 0,
        collection: null,
        sendableEntries: [],
        blockedEntries: [],
        markdownEntries: [],
        resumeState: null,
        submitting: false,
        submitLogs: []
    },
    ui: {
        sidebarVisible: true,
        panelVisible: true,
        activeActivity: 'explorer',
        activePanelTab: 'problems',
        paletteOpen: false,
        paletteMode: 'commands',
        paletteItems: [],
        paletteSelectedIndex: 0
    }
};

const VSCODE_SHORTCUTS = Object.freeze({
    COMMAND_PALETTE: 'Ctrl+Shift+P',
    QUICK_OPEN: 'Ctrl+P',
    TOGGLE_SIDEBAR: 'Ctrl+B',
    TOGGLE_PANEL: 'Ctrl+J',
    SAVE_WORKSPACE: 'Ctrl+S',
    FOCUS_EXPLORER: 'Ctrl+Shift+E'
});
const COMPLETION_MAX_ITEMS = 5000;
const UNIFIED_STATE_SAVE_DELAY = 240;
const WORKSPACE_VALUES = Object.freeze(['csharp', 'markdown', 'shader']);
const WORKSPACE_LAST_KEY = 'tml-ide:last-workspace';
const OAUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
const OAUTH_USER_KEY = 'articleStudioOAuthUser.v1';
const DEFAULT_WORKER_API_URL = 'https://greenhome-pr.3577415213.workers.dev/api/create-pr';
const MARKDOWN_FALLBACK_ANCHORS = Object.freeze([
    'site/content/怎么贡献/新文章.md',
    'site/content/怎么贡献/贡献者规范.md',
    'site/content/基础概念/教程结构说明.md'
]);

// Keep Monaco colors aligned with site viewer's Rider dark Prism theme.
const RIDER_CODE_COLORS = Object.freeze({
    bg: '#191A1C',
    bgInline: '#303030',
    border: '#404040',
    fg: '#BDBDBD',
    selection: '#08335E',
    comment: '#85C46C',
    keyword: '#6178FF',
    string: '#FF9D70',
    number: '#ED94C0',
    punctuation: '#A7B0BE',
    operator: '#B6C2FF',
    function: '#39CC9B',
    class: '#FFED19',
    namespace: '#C191FF',
    parameter: '#F2C77D',
    preprocessor: '#FF7CCB',
    constant: '#66C3CC',
    variable: '#95FFE2',
    field: '#B370FF',
    escape: '#D688D4',
    link: '#6C95EB',
    lineNumber: '#808080'
});

const VSCODE_UI_COLORS = Object.freeze({
    editorBg: '#1e1e1e',
    text: '#d4d4d4',
    lineNumber: '#858585',
    lineNumberActive: '#c6c6c6',
    selection: '#264f78',
    selectionInactive: '#3a3d4166',
    selectionHighlight: '#add6ff26',
    widgetBg: '#252526',
    widgetBorder: '#454545',
    listSelectedBg: '#094771',
    listSelectedFg: '#ffffff',
    listFocusBg: '#04395e',
    listFocusFg: '#ffffff',
    listHighlight: '#4fc1ff',
    suggestHighlight: '#18a3ff'
});

function registerRiderDarkMonacoTheme() {
    monaco.editor.defineTheme('tml-rider-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: '', foreground: 'BDBDBD' },
            { token: 'comment', foreground: '85C46C', fontStyle: 'italic' },
            { token: 'keyword', foreground: '6178FF' },
            { token: 'string', foreground: 'FF9D70' },
            { token: 'string.escape', foreground: 'D688D4' },
            { token: 'number', foreground: 'ED94C0' },
            { token: 'operator', foreground: 'B6C2FF' },
            { token: 'delimiter', foreground: 'A7B0BE' },
            { token: 'delimiter.bracket', foreground: 'A7B0BE' },
            { token: 'delimiter.parenthesis', foreground: 'A7B0BE' },
            { token: 'delimiter.array', foreground: 'A7B0BE' },
            { token: 'identifier', foreground: '95FFE2' },
            { token: 'variable', foreground: '95FFE2' },
            { token: 'variable.parameter', foreground: 'F2C77D' },
            { token: 'parameter', foreground: 'F2C77D' },
            { token: 'property', foreground: 'B370FF' },
            { token: 'function', foreground: '39CC9B' },
            { token: 'function.call', foreground: '39CC9B' },
            { token: 'entity.name.function', foreground: '39CC9B' },
            { token: 'type', foreground: 'FFED19' },
            { token: 'type.identifier', foreground: 'FFED19' },
            { token: 'class', foreground: 'FFED19' },
            { token: 'class.identifier', foreground: 'FFED19' },
            { token: 'interface', foreground: 'FFED19' },
            { token: 'enum', foreground: 'FFED19' },
            { token: 'namespace', foreground: 'C191FF' },
            { token: 'constant', foreground: '66C3CC' },
            { token: 'constant.language', foreground: '66C3CC' },
            { token: 'keyword.directive', foreground: 'FF7CCB' },
            { token: 'preprocessor', foreground: 'FF7CCB' },
            { token: 'regexp', foreground: 'D688D4' },
            { token: 'link', foreground: '6C95EB' }
        ],
        colors: {
            'editor.background': VSCODE_UI_COLORS.editorBg,
            'editor.foreground': VSCODE_UI_COLORS.text,
            'editorLineNumber.foreground': VSCODE_UI_COLORS.lineNumber,
            'editorLineNumber.activeForeground': VSCODE_UI_COLORS.lineNumberActive,
            'editorCursor.foreground': RIDER_CODE_COLORS.variable,
            'editor.selectionBackground': VSCODE_UI_COLORS.selection,
            'editor.inactiveSelectionBackground': VSCODE_UI_COLORS.selectionInactive,
            'editor.selectionHighlightBackground': VSCODE_UI_COLORS.selectionHighlight,
            'editor.wordHighlightBackground': '#575757b8',
            'editor.wordHighlightStrongBackground': '#004972b8',
            'editorBracketMatch.background': '#515c6a80',
            'editorBracketMatch.border': RIDER_CODE_COLORS.operator,
            'editorWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'editorSuggestWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorSuggestWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'editorSuggestWidget.foreground': VSCODE_UI_COLORS.text,
            'editorSuggestWidget.highlightForeground': VSCODE_UI_COLORS.suggestHighlight,
            'editorSuggestWidget.focusHighlightForeground': VSCODE_UI_COLORS.suggestHighlight,
            'editorSuggestWidget.selectedBackground': VSCODE_UI_COLORS.listSelectedBg,
            'editorSuggestWidget.selectedForeground': VSCODE_UI_COLORS.listSelectedFg,
            'editorSuggestWidget.selectedIconForeground': RIDER_CODE_COLORS.function,
            'editorSuggestWidgetStatus.foreground': VSCODE_UI_COLORS.lineNumber,
            'editorHoverWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorHoverWidget.foreground': VSCODE_UI_COLORS.text,
            'editorHoverWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'list.activeSelectionBackground': VSCODE_UI_COLORS.listSelectedBg,
            'list.activeSelectionForeground': VSCODE_UI_COLORS.listSelectedFg,
            'list.inactiveSelectionBackground': '#37373d',
            'list.inactiveSelectionForeground': VSCODE_UI_COLORS.text,
            'list.focusBackground': VSCODE_UI_COLORS.listFocusBg,
            'list.focusForeground': VSCODE_UI_COLORS.listFocusFg,
            'list.highlightForeground': VSCODE_UI_COLORS.listHighlight
        }
    });
}

function nowStamp() {
    return new Date().toLocaleString('zh-CN', { hour12: false });
}

function setStatus(text) {
    if (!dom.editorStatus) return;
    dom.editorStatus.textContent = `[${nowStamp()}] ${String(text || '')}`;
}

function addEvent(level, message) {
    if (!dom.eventLog) return;
    const item = document.createElement('li');
    item.className = 'event-log-item';
    item.setAttribute('data-level', level || 'info');
    item.textContent = `[${nowStamp()}] ${String(message || '')}`;
    dom.eventLog.prepend(item);
    while (dom.eventLog.childElementCount > 60) {
        dom.eventLog.removeChild(dom.eventLog.lastChild);
    }
}

function normalizeRepoPath(pathValue) {
    return String(pathValue || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/{2,}/g, '/');
}

function normalizeWorkerApiUrl(value) {
    let safe = String(value || '').trim();
    if (!safe) return '';
    safe = safe.replace(/\/+$/, '');
    safe = safe.replace(/\/(?:api\/(?:create-pr|preflight-check|my-open-prs)|auth\/(?:me|github\/login|github\/callback))$/i, '');
    if (!/\/api\/create-pr(?:\?|$)/i.test(safe)) {
        safe = `${safe}/api/create-pr`;
    }
    return safe;
}

function workerBaseUrlFromApiUrl(apiUrl) {
    return String(apiUrl || '').trim().replace(/\/api\/create-pr(?:\?.*)?$/i, '');
}

function normalizeWorkspaceName(workspace) {
    const safe = String(workspace || '').trim().toLowerCase();
    if (WORKSPACE_VALUES.includes(safe)) return safe;
    return 'csharp';
}

function normalizePanelName(panel) {
    return String(panel || '').trim().toLowerCase() === 'submit' ? 'submit' : '';
}

function normalizeAuthSession() {
    let token = '';
    let user = '';
    try {
        token = String(sessionStorage.getItem(OAUTH_TOKEN_KEY) || '').trim();
        user = String(sessionStorage.getItem(OAUTH_USER_KEY) || '').trim();
    } catch (_err) {
        token = '';
        user = '';
    }
    return { token, user };
}

function saveAuthSession(token, user) {
    try {
        sessionStorage.setItem(OAUTH_TOKEN_KEY, String(token || '').trim());
        sessionStorage.setItem(OAUTH_USER_KEY, String(user || '').trim());
    } catch (_err) {
        // Ignore.
    }
}

function clearAuthSession() {
    try {
        sessionStorage.removeItem(OAUTH_TOKEN_KEY);
        sessionStorage.removeItem(OAUTH_USER_KEY);
    } catch (_err) {
        // Ignore.
    }
}

function consumeOAuthHashSession() {
    const rawHash = String(globalThis.location && globalThis.location.hash || '');
    if (!rawHash.startsWith('#')) return;

    const params = new URLSearchParams(rawHash.slice(1));
    const token = String(params.get('oauth_token') || '').trim();
    const user = String(params.get('github_user') || '').trim();
    if (!token) return;

    saveAuthSession(token, user);

    const url = new URL(globalThis.location.href);
    url.hash = '';
    globalThis.history.replaceState({}, '', url.toString());
}

function readLastWorkspacePreference() {
    try {
        const value = String(localStorage.getItem(WORKSPACE_LAST_KEY) || '').trim();
        return normalizeWorkspaceName(value);
    } catch (_err) {
        return 'csharp';
    }
}

function writeLastWorkspacePreference(workspace) {
    try {
        localStorage.setItem(WORKSPACE_LAST_KEY, normalizeWorkspaceName(workspace));
    } catch (_err) {
        // Ignore.
    }
}

function parseRouteFromUrl() {
    const url = new URL(globalThis.location.href);
    const queryWorkspace = normalizeWorkspaceName(url.searchParams.get('workspace'));
    const panel = normalizePanelName(url.searchParams.get('panel'));

    const hasWorkspaceParam = url.searchParams.has('workspace');
    const storedWorkspace = normalizeWorkspaceName(
        state.unifiedWorkspaceState && state.unifiedWorkspaceState.lastWorkspace
            ? state.unifiedWorkspaceState.lastWorkspace
            : readLastWorkspacePreference()
    );
    const workspace = hasWorkspaceParam ? queryWorkspace : storedWorkspace;
    return { workspace, panel };
}

function syncRouteToUrl(options) {
    const opts = options || {};
    const currentUrl = new URL(globalThis.location.href);
    const nextUrl = new URL(globalThis.location.href);
    nextUrl.searchParams.set('workspace', normalizeWorkspaceName(state.route.workspace));
    if (normalizePanelName(state.route.panel)) {
        nextUrl.searchParams.set('panel', normalizePanelName(state.route.panel));
    } else {
        nextUrl.searchParams.delete('panel');
    }
    if (nextUrl.toString() === currentUrl.toString()) {
        return;
    }
    const method = opts.replace ? 'replaceState' : 'pushState';
    globalThis.history[method]({}, '', nextUrl.toString());
}

function updateWorkspaceButtons() {
    dom.workspaceButtons.forEach((button) => {
        const target = normalizeWorkspaceName(button.dataset.workspace);
        const active = target === normalizeWorkspaceName(state.route.workspace);
        button.classList.toggle('workspace-btn-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function applyWorkspaceLayout() {
    const workspace = normalizeWorkspaceName(state.route.workspace);
    const isCsharp = workspace === 'csharp';
    if (dom.workspaceCsharpRoot) {
        dom.workspaceCsharpRoot.hidden = !isCsharp;
    }
    if (dom.workspaceSubappRoot) {
        dom.workspaceSubappRoot.hidden = isCsharp;
    }
    if (isCsharp && state.editor) {
        requestAnimationFrame(() => {
            if (state.editor) state.editor.layout();
        });
    }
}

function updateSubappTitle(workspace) {
    if (!dom.subappTitle) return;
    if (workspace === 'markdown') {
        dom.subappTitle.textContent = 'Markdown IDE';
        return;
    }
    if (workspace === 'shader') {
        dom.subappTitle.textContent = 'Shader IDE';
        return;
    }
    dom.subappTitle.textContent = 'Unified IDE';
}

function routePanelIsOpen() {
    return normalizePanelName(state.route.panel) === 'submit';
}

function applyUnifiedSubmitPanelVisibility() {
    if (!dom.unifiedSubmitPanel) return;
    const open = routePanelIsOpen();
    dom.unifiedSubmitPanel.classList.toggle('unified-submit-panel-open', open);
    dom.unifiedSubmitPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function setUnifiedSubmitStatus(text, level) {
    if (!dom.unifiedSubmitStatus) return;
    dom.unifiedSubmitStatus.textContent = String(text || '');
    dom.unifiedSubmitStatus.dataset.level = String(level || 'info');
}

function pushUnifiedSubmitLog(line) {
    const text = String(line || '').trim();
    if (!text) return;
    state.unified.submitLogs.push(`[${nowStamp()}] ${text}`);
    while (state.unified.submitLogs.length > 60) {
        state.unified.submitLogs.shift();
    }
    if (dom.unifiedBatchProgress) {
        dom.unifiedBatchProgress.textContent = state.unified.submitLogs.join('\n');
    }
}

function rememberUnifiedStateSnapshot() {
    if (!state.unifiedWorkspaceState) return;

    state.unifiedWorkspaceState.lastWorkspace = normalizeWorkspaceName(state.route.workspace);
    state.unifiedWorkspaceState.snapshots = {
        csharp: {
            updatedAt: new Date().toISOString(),
            files: state.workspace.files.map((file) => ({
                id: String(file.id || ''),
                path: String(file.path || ''),
                content: String(file.content || '')
            }))
        },
        markdown: state.subapps.snapshotByWorkspace.markdown,
        shader: state.subapps.snapshotByWorkspace.shader
    };

    const workerApiUrl = normalizeWorkerApiUrl(dom.unifiedWorkerUrl ? dom.unifiedWorkerUrl.value : DEFAULT_WORKER_API_URL) || DEFAULT_WORKER_API_URL;
    const prTitle = String(dom.unifiedPrTitle ? dom.unifiedPrTitle.value : '').trim();
    const existingPrNumber = String(dom.unifiedExistingPrNumber ? dom.unifiedExistingPrNumber.value : '').trim();
    const anchorPath = String(dom.unifiedAnchorSelect ? dom.unifiedAnchorSelect.value : '').trim();

    state.unifiedWorkspaceState.submit = {
        workerApiUrl,
        prTitle,
        existingPrNumber,
        anchorPath,
        resume: state.unified.resumeState,
        lastCollection: state.unified.collection
    };
}

function scheduleUnifiedStateSave() {
    if (!state.unifiedWorkspaceState) return;
    rememberUnifiedStateSnapshot();

    if (state.unified.persistTimer) {
        clearTimeout(state.unified.persistTimer);
    }
    state.unified.persistTimer = setTimeout(async () => {
        state.unified.persistTimer = 0;
        try {
            await saveUnifiedWorkspaceState(state.unifiedWorkspaceState);
        } catch (error) {
            addEvent('error', `保存 workspace.v2 失败：${error.message}`);
        }
    }, UNIFIED_STATE_SAVE_DELAY);
}

function getWorkspacePlugin(workspace) {
    return state.plugins.registry.get(normalizeWorkspaceName(workspace));
}

async function mountWorkspacePlugin(workspace, options) {
    const safeWorkspace = normalizeWorkspaceName(workspace);
    const opts = options || {};
    const plugin = getWorkspacePlugin(safeWorkspace);
    if (!plugin) return;

    if (opts.forceReload && safeWorkspace !== 'csharp') {
        plugin.unmount({
            dom,
            state
        });
    }

    if (state.plugins.mountedWorkspace && state.plugins.mountedWorkspace !== safeWorkspace) {
        const previous = getWorkspacePlugin(state.plugins.mountedWorkspace);
        if (previous) {
            previous.unmount({
                dom,
                state
            });
        }
    }

    await plugin.mount({
        dom,
        state,
        shellEventBus: state.plugins.shellEventBus,
        storageService: state.plugins.storageService,
        submitService: state.plugins.submitService,
        route: state.route,
        logger(level, message) {
            addEvent(level, message);
        },
        setStatus(text) {
            setStatus(text);
        }
    });

    state.plugins.activeWorkspace = safeWorkspace;
    state.plugins.mountedWorkspace = safeWorkspace;
    updateSubappTitle(safeWorkspace);
}

function requestWorkspaceCollect(workspace) {
    const safeWorkspace = normalizeWorkspaceName(workspace);
    if (safeWorkspace !== 'markdown' && safeWorkspace !== 'shader') {
        return Promise.resolve(null);
    }
    const plugin = getWorkspacePlugin(safeWorkspace);
    if (!plugin || typeof plugin.collectStaged !== 'function') {
        return Promise.resolve(state.subapps.snapshotByWorkspace[safeWorkspace]);
    }
    const snapshot = plugin.collectStaged({
        dom,
        state,
        route: state.route
    });
    state.subapps.snapshotByWorkspace[safeWorkspace] = snapshot && typeof snapshot === 'object' ? snapshot : null;
    scheduleUnifiedStateSave();
    return Promise.resolve(state.subapps.snapshotByWorkspace[safeWorkspace]);
}

function dispatchWorkspaceCommand(workspace, commandId) {
    const plugin = getWorkspacePlugin(workspace);
    if (!plugin || typeof plugin.handleCommand !== 'function') return false;
    return !!plugin.handleCommand(commandId, {
        dom,
        state,
        route: state.route
    });
}

async function setActiveWorkspace(workspace, options) {
    const opts = options || {};
    const safeWorkspace = normalizeWorkspaceName(workspace);
    state.route.workspace = safeWorkspace;
    updateWorkspaceButtons();
    applyWorkspaceLayout();

    if (safeWorkspace === 'markdown' || safeWorkspace === 'shader') {
        await mountWorkspacePlugin(safeWorkspace, { forceReload: !!opts.forceReload });
    } else {
        await mountWorkspacePlugin('csharp', { forceReload: false });
    }

    if (routePanelIsOpen() && safeWorkspace === 'shader') {
        dispatchWorkspaceCommand('shader', 'workspace.open-submit-panel');
    }

    if (opts.persist !== false) {
        writeLastWorkspacePreference(safeWorkspace);
        scheduleUnifiedStateSave();
    }

    if (opts.syncUrl !== false) {
        syncRouteToUrl({ replace: !!opts.replaceUrl });
    }

    if (opts.collect !== false && (safeWorkspace === 'markdown' || safeWorkspace === 'shader')) {
        await requestWorkspaceCollect(safeWorkspace);
    }
}

function setSubmitPanelRouteState(open, options) {
    const opts = options || {};
    state.route.panel = open ? 'submit' : '';
    applyUnifiedSubmitPanelVisibility();
    if (opts.syncUrl !== false) {
        syncRouteToUrl({ replace: !!opts.replaceUrl });
    }
    scheduleUnifiedStateSave();
}

function openUnifiedSubmitPanel(options) {
    const opts = options || {};
    if (normalizeWorkspaceName(state.route.workspace) === 'csharp') {
        setActiveWorkspace('markdown', { syncUrl: false, persist: true, collect: true }).catch(() => {});
    }
    setSubmitPanelRouteState(true, { syncUrl: opts.syncUrl !== false, replaceUrl: !!opts.replaceUrl });
    if (state.route.workspace === 'shader') {
        dispatchWorkspaceCommand('shader', 'workspace.open-submit-panel');
    }
}

function closeUnifiedSubmitPanel(options) {
    const opts = options || {};
    setSubmitPanelRouteState(false, { syncUrl: opts.syncUrl !== false, replaceUrl: !!opts.replaceUrl });
}

function sanitizeCsharpCodeFileName(filePath) {
    const fileName = String(filePath || '').split('/').pop() || 'Program.cs';
    const noExt = fileName.replace(/\.cs$/i, '');
    const safeBase = noExt.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
    return `${safeBase}.cs`;
}

function collectCsharpWorkspaceEntries() {
    return state.workspace.files.map((file) => ({
        workspace: 'csharp',
        path: `site/content/tml-ide-workspace/code/${sanitizeCsharpCodeFileName(file.path)}`,
        content: String(file.content || ''),
        encoding: 'utf8',
        source: 'csharp-workspace',
        isMainMarkdown: false
    }));
}

function collectSubappEntries(snapshot, workspace) {
    if (!snapshot || typeof snapshot !== 'object') return [];
    const output = [];
    const files = Array.isArray(snapshot.files) ? snapshot.files : [];

    files.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        output.push({
            workspace,
            path: normalizeRepoPath(item.path),
            content: String(item.content || ''),
            encoding: String(item.encoding || 'utf8').toLowerCase() === 'base64' ? 'base64' : 'utf8',
            source: String(item.source || workspace),
            isMainMarkdown: !!item.isMainMarkdown,
            op: String(item.op || '')
        });
    });

    const targetPath = normalizeRepoPath(snapshot.targetPath);
    const markdown = String(snapshot.markdown || '');
    if (targetPath && markdown) {
        const exists = output.some((item) => item.path === targetPath);
        if (!exists) {
            output.push({
                workspace,
                path: targetPath,
                content: markdown,
                encoding: 'utf8',
                source: `${workspace}-main`,
                isMainMarkdown: true,
                op: ''
            });
        }
    }

    return output;
}

function isAllowedExtraFilePath(pathValue) {
    const path = normalizeRepoPath(pathValue);
    const isShaderGalleryFile = /^site\/content\/shader-gallery\/[a-z0-9](?:[a-z0-9-]{0,62})\/(?:entry|shader)\.json$/i.test(path);
    const isArticleImageFile = /^site\/content\/.+\/imgs\/[a-z0-9\u4e00-\u9fa5_-]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(path);
    const isArticleMediaFile = /^site\/content\/.+\/media\/[a-z0-9\u4e00-\u9fa5_-]+\.(?:mp4|webm)$/i.test(path);
    const isArticleCsharpFile = /^site\/content\/.+\/code\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(path);
    return isShaderGalleryFile || isArticleImageFile || isArticleMediaFile || isArticleCsharpFile;
}

function isMarkdownContentPath(pathValue) {
    return /^site\/content\/.+\.md$/i.test(normalizeRepoPath(pathValue));
}

function buildUnifiedCollection(rawEntries) {
    const dedup = new Map();
    (Array.isArray(rawEntries) ? rawEntries : []).forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const path = normalizeRepoPath(item.path);
        if (!path) return;
        dedup.set(path, {
            workspace: String(item.workspace || ''),
            path,
            content: String(item.content || ''),
            encoding: String(item.encoding || 'utf8').toLowerCase() === 'base64' ? 'base64' : 'utf8',
            source: String(item.source || ''),
            isMainMarkdown: !!item.isMainMarkdown,
            op: String(item.op || '')
        });
    });

    const markdownEntries = [];
    const extraEntries = [];
    const blockedEntries = [];

    dedup.forEach((entry) => {
        if (entry.path.includes('..')) {
            blockedEntries.push({ ...entry, reason: '路径非法（包含 ..）' });
            return;
        }

        if (entry.op === 'delete') {
            blockedEntries.push({ ...entry, reason: '统一提交暂不支持删除文件' });
            return;
        }

        if (!entry.content.trim()) {
            blockedEntries.push({ ...entry, reason: '内容为空' });
            return;
        }

        if (/^site\/assets\//i.test(entry.path)) {
            blockedEntries.push({ ...entry, reason: 'site/assets/** 需手工 PR' });
            return;
        }

        if (isMarkdownContentPath(entry.path)) {
            markdownEntries.push(entry);
            return;
        }

        if (isAllowedExtraFilePath(entry.path)) {
            extraEntries.push(entry);
            return;
        }

        blockedEntries.push({ ...entry, reason: '后端不接受该路径类型' });
    });

    return {
        collectedAt: new Date().toISOString(),
        rawCount: dedup.size,
        markdownEntries,
        extraEntries,
        blockedEntries
    };
}

function renderUnifiedFileList(container, entries, emptyText) {
    if (!container) return;
    container.innerHTML = '';
    const list = Array.isArray(entries) ? entries : [];
    if (!list.length) {
        const li = document.createElement('li');
        li.className = 'unified-file-item unified-file-item-empty';
        li.textContent = emptyText;
        container.appendChild(li);
        return;
    }

    list.forEach((entry) => {
        const li = document.createElement('li');
        li.className = 'unified-file-item';
        const reason = entry.reason ? ` · ${entry.reason}` : '';
        li.textContent = `${entry.path} (${entry.source || entry.workspace || 'unknown'})${reason}`;
        container.appendChild(li);
    });
}

function buildAnchorCandidates(collection) {
    const set = new Set();
    const output = [];

    const appendPath = (pathValue) => {
        const path = normalizeRepoPath(pathValue);
        if (!path || !isMarkdownContentPath(path) || set.has(path)) return;
        set.add(path);
        output.push(path);
    };

    (collection && Array.isArray(collection.markdownEntries) ? collection.markdownEntries : []).forEach((item) => {
        appendPath(item.path);
    });

    const markdownSnapshot = state.subapps.snapshotByWorkspace.markdown;
    const shaderSnapshot = state.subapps.snapshotByWorkspace.shader;
    if (markdownSnapshot && markdownSnapshot.targetPath) appendPath(markdownSnapshot.targetPath);
    if (shaderSnapshot && shaderSnapshot.targetPath) appendPath(shaderSnapshot.targetPath);
    MARKDOWN_FALLBACK_ANCHORS.forEach(appendPath);

    return output;
}

function updateAnchorSelectOptions(collection) {
    if (!dom.unifiedAnchorSelect) return;

    const selected = String(dom.unifiedAnchorSelect.value || '').trim();
    const options = buildAnchorCandidates(collection);

    dom.unifiedAnchorSelect.innerHTML = '';
    const autoOption = document.createElement('option');
    autoOption.value = '';
    autoOption.textContent = '自动选择（若可用）';
    dom.unifiedAnchorSelect.appendChild(autoOption);

    options.forEach((pathValue) => {
        const option = document.createElement('option');
        option.value = pathValue;
        option.textContent = pathValue;
        dom.unifiedAnchorSelect.appendChild(option);
    });

    if (selected && options.includes(selected)) {
        dom.unifiedAnchorSelect.value = selected;
    } else if (!selected && state.unifiedWorkspaceState && state.unifiedWorkspaceState.submit && state.unifiedWorkspaceState.submit.anchorPath && options.includes(state.unifiedWorkspaceState.submit.anchorPath)) {
        dom.unifiedAnchorSelect.value = state.unifiedWorkspaceState.submit.anchorPath;
    } else {
        dom.unifiedAnchorSelect.value = '';
    }
}

function updateUnifiedSummary(collection) {
    if (!dom.unifiedSummary) return;
    const markdownCount = collection && Array.isArray(collection.markdownEntries) ? collection.markdownEntries.length : 0;
    const extraCount = collection && Array.isArray(collection.extraEntries) ? collection.extraEntries.length : 0;
    const blockedCount = collection && Array.isArray(collection.blockedEntries) ? collection.blockedEntries.length : 0;
    dom.unifiedSummary.textContent = `Markdown: ${markdownCount} · Extra: ${extraCount} · 需手工 PR: ${blockedCount}`;
}

function persistUnifiedCollection(collection) {
    state.unified.collection = collection;
    state.unified.sendableEntries = (collection && Array.isArray(collection.extraEntries) ? collection.extraEntries : []).concat(
        collection && Array.isArray(collection.markdownEntries) ? collection.markdownEntries : []
    );
    state.unified.blockedEntries = collection && Array.isArray(collection.blockedEntries) ? collection.blockedEntries : [];
    state.unified.markdownEntries = collection && Array.isArray(collection.markdownEntries) ? collection.markdownEntries : [];
    renderUnifiedFileList(dom.unifiedSendableList, state.unified.sendableEntries, '暂无可提交文件。');
    renderUnifiedFileList(dom.unifiedBlockedList, state.unified.blockedEntries, '暂无需手工 PR 文件。');
    updateUnifiedSummary(collection);
    updateAnchorSelectOptions(collection);
    scheduleUnifiedStateSave();
}

async function collectUnifiedChanges(options) {
    const opts = options || {};
    const silent = !!opts.silent;
    const activeWorkspace = normalizeWorkspaceName(state.route.workspace);
    if (opts.requestSubapp !== false && (activeWorkspace === 'markdown' || activeWorkspace === 'shader')) {
        await requestWorkspaceCollect(activeWorkspace);
    }

    const entries = []
        .concat(collectCsharpWorkspaceEntries())
        .concat(collectSubappEntries(state.subapps.snapshotByWorkspace.markdown, 'markdown'))
        .concat(collectSubappEntries(state.subapps.snapshotByWorkspace.shader, 'shader'));

    const collection = buildUnifiedCollection(entries);
    persistUnifiedCollection(collection);
    if (!silent) {
        setUnifiedSubmitStatus('已收集 staged 改动', 'success');
        pushUnifiedSubmitLog(`收集完成：Markdown ${collection.markdownEntries.length}，Extra ${collection.extraEntries.length}，需手工 ${collection.blockedEntries.length}`);
    }
    return collection;
}

async function loadMarkdownContentFromPath(pathValue) {
    const path = normalizeRepoPath(pathValue);
    if (!isMarkdownContentPath(path)) {
        throw new Error(`锚点 Markdown 非法：${pathValue}`);
    }
    const relative = path.replace(/^site\//i, '');
    const response = await fetch(`/${relative}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`加载锚点 Markdown 失败（HTTP ${response.status}）：${path}`);
    }
    return await response.text();
}

async function resolveAnchorMarkdownForBatch(collection, preferredPath) {
    const preferred = normalizeRepoPath(preferredPath);
    if (preferred && isMarkdownContentPath(preferred)) {
        const fromCollection = (collection.markdownEntries || []).find((item) => item.path === preferred);
        if (fromCollection) {
            return { path: preferred, markdown: fromCollection.content };
        }
        const fetched = await loadMarkdownContentFromPath(preferred);
        return { path: preferred, markdown: fetched };
    }

    const firstMarkdown = collection && Array.isArray(collection.markdownEntries) ? collection.markdownEntries[0] : null;
    if (firstMarkdown) {
        return { path: firstMarkdown.path, markdown: firstMarkdown.content };
    }

    const options = buildAnchorCandidates(collection);
    for (const candidate of options) {
        try {
            const fetched = await loadMarkdownContentFromPath(candidate);
            return { path: candidate, markdown: fetched };
        } catch (_err) {
            // Try next candidate.
        }
    }

    throw new Error('当前批次没有 Markdown 改动，请选择可用的锚点 Markdown');
}

function relativeTargetPath(pathValue) {
    return normalizeRepoPath(pathValue).replace(/^site\/content\//i, '');
}

async function buildUnifiedSubmitBatches(collection) {
    const safeCollection = collection || state.unified.collection || { markdownEntries: [], extraEntries: [], blockedEntries: [] };
    const markdownEntries = Array.isArray(safeCollection.markdownEntries) ? safeCollection.markdownEntries.slice() : [];
    const extraEntries = Array.isArray(safeCollection.extraEntries) ? safeCollection.extraEntries.slice() : [];

    if (!markdownEntries.length && !extraEntries.length) {
        throw new Error('没有可提交的文件');
    }

    const batches = markdownEntries.map((entry) => ({
        targetPath: entry.path,
        markdown: entry.content,
        extraFiles: []
    }));

    if (batches.length > 0) {
        let cursor = 0;
        extraEntries.forEach((entry) => {
            while (cursor < batches.length && batches[cursor].extraFiles.length >= 8) {
                cursor += 1;
            }
            if (cursor >= batches.length) {
                batches.push({
                    targetPath: batches[0].targetPath,
                    markdown: batches[0].markdown,
                    extraFiles: []
                });
                cursor = batches.length - 1;
            }
            batches[cursor].extraFiles.push(entry);
        });
    } else {
        for (let i = 0; i < extraEntries.length; i += 8) {
            batches.push({
                targetPath: '',
                markdown: '',
                extraFiles: extraEntries.slice(i, i + 8)
            });
        }
    }

    const selectedAnchorPath = String(dom.unifiedAnchorSelect ? dom.unifiedAnchorSelect.value : '').trim();
    if (!markdownEntries.length && !selectedAnchorPath) {
        throw new Error('当前无 Markdown 改动，请先选择锚点 Markdown');
    }
    const needsAnchor = batches.some((batch) => !batch.targetPath || !batch.markdown.trim());
    let anchorInfo = null;
    if (needsAnchor) {
        anchorInfo = await resolveAnchorMarkdownForBatch(safeCollection, selectedAnchorPath);
    }

    const normalizedBatches = batches.map((batch) => {
        const targetPath = batch.targetPath && batch.markdown.trim()
            ? batch.targetPath
            : (anchorInfo ? anchorInfo.path : '');
        const markdown = batch.targetPath && batch.markdown.trim()
            ? batch.markdown
            : (anchorInfo ? anchorInfo.markdown : '');
        if (!targetPath || !markdown.trim()) {
            throw new Error('构建提交批次失败：缺少目标 Markdown');
        }

        return {
            targetPath: relativeTargetPath(targetPath),
            markdown,
            extraFiles: batch.extraFiles.map((item) => ({
                path: item.path,
                content: item.content,
                encoding: item.encoding
            }))
        };
    });

    return {
        batches: normalizedBatches,
        anchorPath: anchorInfo ? anchorInfo.path : ''
    };
}

function normalizeCreatePrResponse(responseText) {
    let data = null;
    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch (_err) {
        data = null;
    }
    return data;
}

async function submitBatchRequest(workerApiUrl, authToken, payload) {
    const headers = {
        'content-type': 'application/json'
    };
    if (authToken) {
        headers.authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(workerApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    const responseData = normalizeCreatePrResponse(responseText);
    if (response.status === 401 && authToken) {
        clearAuthSession();
        updateUnifiedAuthUi();
        throw new Error('GitHub 登录已过期，请重新登录');
    }
    if (!response.ok || !responseData || responseData.ok !== true) {
        throw new Error(responseData && responseData.error ? String(responseData.error) : `HTTP ${response.status}`);
    }
    if (responseData.submitter) {
        saveAuthSession(authToken, String(responseData.submitter || '').trim());
        updateUnifiedAuthUi();
    }
    return responseData;
}

function setUnifiedSubmitting(submitting) {
    state.unified.submitting = !!submitting;
    if (dom.btnUnifiedSubmit) dom.btnUnifiedSubmit.disabled = submitting;
    if (dom.btnUnifiedResume) dom.btnUnifiedResume.disabled = submitting;
    if (dom.btnUnifiedCollect) dom.btnUnifiedCollect.disabled = submitting;
}

async function runUnifiedSubmitBatches(batches, options) {
    const opts = options || {};
    const auth = normalizeAuthSession();
    if (!auth.token) {
        throw new Error('请先 GitHub 登录');
    }

    const workerApiUrl = normalizeWorkerApiUrl(dom.unifiedWorkerUrl ? dom.unifiedWorkerUrl.value : '');
    if (!workerApiUrl) {
        throw new Error('请填写 Worker API 地址');
    }
    if (dom.unifiedWorkerUrl) {
        dom.unifiedWorkerUrl.value = workerApiUrl;
    }

    const prTitle = String(dom.unifiedPrTitle ? dom.unifiedPrTitle.value : '').trim();
    let existingPrNumber = String(opts.existingPrNumber || (dom.unifiedExistingPrNumber ? dom.unifiedExistingPrNumber.value : '') || '').trim();
    const startIndex = Math.max(0, Number(opts.startIndex || 0));

    setUnifiedSubmitting(true);
    setUnifiedSubmitStatus('统一提交进行中...', 'info');

    let nextIndex = startIndex;
    try {
        for (let i = startIndex; i < batches.length; i += 1) {
            nextIndex = i;
            const batch = batches[i];
            const payload = {
                targetPath: String(batch.targetPath || ''),
                markdown: String(batch.markdown || '')
            };
            if (prTitle) {
                payload.prTitle = prTitle;
            }
            if (existingPrNumber) {
                payload.existingPrNumber = existingPrNumber;
            }
            if (Array.isArray(batch.extraFiles) && batch.extraFiles.length > 0) {
                payload.extraFiles = batch.extraFiles.slice(0, 8).map((entry) => ({
                    path: entry.path,
                    content: entry.content,
                    encoding: entry.encoding === 'base64' ? 'base64' : 'utf8'
                }));
            }

            pushUnifiedSubmitLog(`提交批次 ${i + 1}/${batches.length} -> ${payload.targetPath}（extra=${Array.isArray(payload.extraFiles) ? payload.extraFiles.length : 0}）`);
            const responseData = await submitBatchRequest(workerApiUrl, auth.token, payload);
            if (responseData.prNumber) {
                existingPrNumber = String(responseData.prNumber);
                if (dom.unifiedExistingPrNumber) {
                    dom.unifiedExistingPrNumber.value = existingPrNumber;
                }
            }
            pushUnifiedSubmitLog(`批次 ${i + 1} 成功：PR #${existingPrNumber || '?'}${responseData.reusedExistingPr === true ? '（续传）' : ''}`);
            nextIndex = i + 1;
        }

        state.unified.resumeState = null;
        setUnifiedSubmitStatus('提交成功', 'success');
        pushUnifiedSubmitLog('全部批次提交完成。');
    } catch (error) {
        state.unified.resumeState = {
            batches,
            nextIndex,
            existingPrNumber: String(dom.unifiedExistingPrNumber ? dom.unifiedExistingPrNumber.value : '').trim(),
            failedAt: new Date().toISOString(),
            message: String(error && error.message || error)
        };
        setUnifiedSubmitStatus(`提交失败：${error.message}`, 'error');
        pushUnifiedSubmitLog(`提交中止：${error.message}`);
        throw error;
    } finally {
        setUnifiedSubmitting(false);
        scheduleUnifiedStateSave();
    }
}

function updateUnifiedAuthUi() {
    const auth = normalizeAuthSession();
    if (dom.unifiedAuthStatus) {
        dom.unifiedAuthStatus.textContent = auth.token
            ? `已登录：${auth.user || 'GitHub 用户'}`
            : '未登录';
    }
    if (dom.btnUnifiedAuthLogin) dom.btnUnifiedAuthLogin.disabled = !!auth.token;
    if (dom.btnUnifiedAuthLogout) dom.btnUnifiedAuthLogout.disabled = !auth.token;
}

function buildGithubLoginUrl(workerApiUrl) {
    const base = workerBaseUrlFromApiUrl(workerApiUrl);
    if (!base) return '';
    const target = new URL(`${base}/auth/github/login`);
    target.searchParams.set('return_to', globalThis.location.href);
    return target.toString();
}

function initializeUnifiedState(loadedState) {
    const initial = loadedState && typeof loadedState === 'object'
        ? loadedState
        : {
            lastWorkspace: 'csharp',
            snapshots: { csharp: { updatedAt: '', files: [] }, markdown: null, shader: null },
            submit: { workerApiUrl: '', prTitle: '', existingPrNumber: '', anchorPath: '', resume: null, lastCollection: null }
        };
    state.unifiedWorkspaceState = initial;
    state.subapps.snapshotByWorkspace.markdown = initial.snapshots && initial.snapshots.markdown ? initial.snapshots.markdown : null;
    state.subapps.snapshotByWorkspace.shader = initial.snapshots && initial.snapshots.shader ? initial.snapshots.shader : null;
    state.unified.resumeState = initial.submit && initial.submit.resume ? initial.submit.resume : null;

    if (dom.unifiedWorkerUrl) {
        dom.unifiedWorkerUrl.value = normalizeWorkerApiUrl(initial.submit && initial.submit.workerApiUrl || DEFAULT_WORKER_API_URL) || DEFAULT_WORKER_API_URL;
    }
    if (dom.unifiedPrTitle) {
        dom.unifiedPrTitle.value = String(initial.submit && initial.submit.prTitle || '');
    }
    if (dom.unifiedExistingPrNumber) {
        dom.unifiedExistingPrNumber.value = String(initial.submit && initial.submit.existingPrNumber || '');
    }
    if (dom.unifiedBatchProgress && state.unified.submitLogs.length === 0) {
        dom.unifiedBatchProgress.textContent = '尚未提交。';
    }
}

function applyWorkbenchVisibility() {
    if (!dom.appRoot) return;
    dom.appRoot.classList.toggle('is-sidebar-hidden', !state.ui.sidebarVisible);
    dom.appRoot.classList.toggle('is-panel-hidden', !state.ui.panelVisible);

    if (dom.btnToggleBottomPanel) {
        const icon = dom.btnToggleBottomPanel.querySelector('.panel-collapse-icon');
        if (icon) {
            icon.textContent = state.ui.panelVisible ? '▾' : '▴';
        }
        dom.btnToggleBottomPanel.setAttribute('aria-label', state.ui.panelVisible ? '隐藏底部面板' : '显示底部面板');
    }
}

function showSidebar(nextVisible) {
    state.ui.sidebarVisible = !!nextVisible;
    applyWorkbenchVisibility();
    setStatus(state.ui.sidebarVisible ? 'Primary Side Bar 已显示' : 'Primary Side Bar 已隐藏');
}

function toggleSidebar() {
    showSidebar(!state.ui.sidebarVisible);
}

function showBottomPanel(nextVisible) {
    state.ui.panelVisible = !!nextVisible;
    applyWorkbenchVisibility();
    setStatus(state.ui.panelVisible ? 'Panel 已显示' : 'Panel 已隐藏');
}

function toggleBottomPanel() {
    showBottomPanel(!state.ui.panelVisible);
}

function setActivePanelTab(panelTab) {
    const safeTab = String(panelTab || 'problems');
    state.ui.activePanelTab = safeTab;

    dom.panelTabButtons.forEach((button) => {
        const isActive = button.dataset.panelTab === safeTab;
        button.classList.toggle('panel-tab-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    dom.panelViews.forEach((view) => {
        const isActive = view.dataset.panelView === safeTab;
        view.classList.toggle('panel-view-active', isActive);
        view.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
}

function setActiveActivity(activity) {
    const safeActivity = String(activity || 'explorer');
    state.ui.activeActivity = safeActivity;
    dom.activityButtons.forEach((button) => {
        const isActive = button.dataset.activity === safeActivity;
        button.classList.toggle('activity-btn-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function focusExplorer() {
    showSidebar(true);
    setActiveActivity('explorer');
    if (!dom.fileList) return;
    const current = dom.fileList.querySelector('.file-item[aria-current="true"]') || dom.fileList.querySelector('.file-item');
    if (current) {
        current.focus();
    }
}

function saveWorkspaceNow() {
    return saveWorkspace(workspaceSnapshotForSave())
        .then(() => {
            addEvent('info', '工作区已保存');
            setStatus('工作区已保存');
            scheduleUnifiedStateSave();
        })
        .catch((error) => {
            addEvent('error', `保存工作区失败：${error.message}`);
            setStatus(`保存失败：${error.message}`);
        });
}

function buildCommandPaletteItems(query) {
    const q = String(query || '').trim().toLowerCase();
    const items = [
        {
            id: 'view.toggle-sidebar',
            label: 'View: Toggle Primary Side Bar',
            detail: '显示/隐藏左侧资源管理器',
            shortcut: VSCODE_SHORTCUTS.TOGGLE_SIDEBAR,
            run() {
                toggleSidebar();
            }
        },
        {
            id: 'view.toggle-panel',
            label: 'View: Toggle Panel',
            detail: '显示/隐藏右侧工具面板',
            shortcut: VSCODE_SHORTCUTS.TOGGLE_PANEL,
            run() {
                toggleBottomPanel();
            }
        },
        {
            id: 'view.focus-explorer',
            label: 'View: Focus Explorer',
            detail: '聚焦文件树',
            shortcut: VSCODE_SHORTCUTS.FOCUS_EXPLORER,
            run() {
                focusExplorer();
            }
        },
        {
            id: 'view.output',
            label: 'View: Show Output',
            detail: '切换到输出日志面板',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('output');
            }
        },
        {
            id: 'file.save',
            label: 'File: Save Workspace',
            detail: '保存当前虚拟工作区',
            shortcut: VSCODE_SHORTCUTS.SAVE_WORKSPACE,
            run() {
                saveWorkspaceNow();
            }
        },
        {
            id: 'file.export',
            label: 'File: Export Workspace',
            detail: '导出 workspace.v1.json',
            shortcut: '',
            run() {
                dom.btnExportWorkspace.click();
            }
        },
        {
            id: 'file.import',
            label: 'File: Import Workspace',
            detail: '导入 workspace.v1.json',
            shortcut: '',
            run() {
                dom.inputImportWorkspace.click();
            }
        },
        {
            id: 'file.new',
            label: 'File: New File',
            detail: '新建 .cs 文件',
            shortcut: '',
            run() {
                dom.btnAddFile.click();
            }
        },
        {
            id: 'file.rename',
            label: 'File: Rename File',
            detail: '重命名当前文件',
            shortcut: 'F2',
            run() {
                dom.btnRenameFile.click();
            }
        },
        {
            id: 'file.delete',
            label: 'File: Delete File',
            detail: '删除当前文件',
            shortcut: 'Del',
            run() {
                dom.btnDeleteFile.click();
            }
        },
        {
            id: 'run.diagnostics',
            label: 'Run: Run Diagnostics',
            detail: '执行规则诊断/增强诊断',
            shortcut: '',
            run() {
                dom.btnRunDiagnostics.click();
            }
        },
        {
            id: 'indexer.panel',
            label: 'Tools: Open Indexer Panel',
            detail: '切换到 Indexer 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('indexer');
            }
        },
        {
            id: 'assembly.panel',
            label: 'Tools: Open Assembly Panel',
            detail: '切换到 Assembly 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('assembly');
            }
        }
    ];

    if (!q) return items;
    return items.filter((item) => {
        const label = String(item.label || '').toLowerCase();
        const detail = String(item.detail || '').toLowerCase();
        const shortcut = String(item.shortcut || '').toLowerCase();
        return label.includes(q) || detail.includes(q) || shortcut.includes(q);
    });
}

function buildQuickOpenItems(query) {
    const q = String(query || '').trim().toLowerCase();
    return state.workspace.files
        .filter((file) => !q || String(file.path || '').toLowerCase().includes(q))
        .map((file) => ({
            id: `open:${file.id}`,
            label: file.path,
            detail: 'Open Editor',
            shortcut: '',
            run() {
                switchActiveFile(file.id);
            }
        }));
}

function updateCommandPaletteSelection(nextIndex) {
    if (!dom.commandPaletteResults) return;
    const max = state.ui.paletteItems.length;
    if (!max) {
        state.ui.paletteSelectedIndex = 0;
        return;
    }
    let safe = Number(nextIndex);
    if (!Number.isFinite(safe)) safe = 0;
    if (safe < 0) safe = max - 1;
    if (safe >= max) safe = 0;
    state.ui.paletteSelectedIndex = safe;

    const items = Array.from(dom.commandPaletteResults.querySelectorAll('.command-palette-item'));
    items.forEach((node, index) => {
        const isActive = index === safe;
        node.classList.toggle('command-palette-item-active', isActive);
        node.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
            node.scrollIntoView({ block: 'nearest' });
        }
    });
}

function renderCommandPaletteResults() {
    if (!dom.commandPaletteResults) return;
    dom.commandPaletteResults.innerHTML = '';
    if (!state.ui.paletteItems.length) {
        const empty = document.createElement('li');
        empty.className = 'command-palette-empty';
        empty.textContent = '没有匹配结果';
        dom.commandPaletteResults.appendChild(empty);
        return;
    }

    state.ui.paletteItems.forEach((item, index) => {
        const node = document.createElement('li');
        node.className = 'command-palette-item';
        node.setAttribute('role', 'option');

        const titleRow = document.createElement('div');
        titleRow.className = 'command-palette-item-title';

        const labelNode = document.createElement('span');
        labelNode.textContent = String(item.label || '');
        titleRow.appendChild(labelNode);

        if (item.shortcut) {
            const shortcutNode = document.createElement('span');
            shortcutNode.className = 'command-palette-item-shortcut';
            shortcutNode.textContent = String(item.shortcut);
            titleRow.appendChild(shortcutNode);
        }

        node.appendChild(titleRow);

        if (item.detail) {
            const detailNode = document.createElement('div');
            detailNode.className = 'command-palette-item-detail';
            detailNode.textContent = String(item.detail);
            node.appendChild(detailNode);
        }

        node.addEventListener('mouseenter', () => {
            updateCommandPaletteSelection(index);
        });
        node.addEventListener('click', () => {
            executeCommandPaletteSelection(index);
        });

        dom.commandPaletteResults.appendChild(node);
    });

    updateCommandPaletteSelection(state.ui.paletteSelectedIndex);
}

function refreshCommandPaletteItems() {
    if (!dom.commandPaletteInput) return;
    const query = dom.commandPaletteInput.value;
    if (state.ui.paletteMode === 'quick-open') {
        state.ui.paletteItems = buildQuickOpenItems(query);
    } else {
        state.ui.paletteItems = buildCommandPaletteItems(query);
    }
    if (state.ui.paletteSelectedIndex >= state.ui.paletteItems.length) {
        state.ui.paletteSelectedIndex = 0;
    }
    renderCommandPaletteResults();
}

function closeCommandPalette() {
    if (!dom.commandPalette || !state.ui.paletteOpen) return;
    state.ui.paletteOpen = false;
    dom.commandPalette.hidden = true;
    state.ui.paletteItems = [];
    state.ui.paletteSelectedIndex = 0;
    if (state.editor) {
        state.editor.focus();
    }
}

function openCommandPalette(mode, presetText) {
    if (!dom.commandPalette || !dom.commandPaletteInput) return;
    state.ui.paletteOpen = true;
    state.ui.paletteMode = mode === 'quick-open' ? 'quick-open' : 'commands';
    state.ui.paletteSelectedIndex = 0;
    dom.commandPalette.hidden = false;
    dom.commandPaletteInput.value = String(presetText || '');
    dom.commandPaletteInput.placeholder = state.ui.paletteMode === 'quick-open'
        ? `Quick Open (${VSCODE_SHORTCUTS.QUICK_OPEN})`
        : `输入命令（${VSCODE_SHORTCUTS.COMMAND_PALETTE}）`;
    refreshCommandPaletteItems();
    requestAnimationFrame(() => {
        dom.commandPaletteInput.focus();
        dom.commandPaletteInput.select();
    });
}

function executeCommandPaletteSelection(index) {
    if (!state.ui.paletteItems.length) return;
    const safeIndex = Math.max(0, Math.min(Number(index || 0), state.ui.paletteItems.length - 1));
    const item = state.ui.paletteItems[safeIndex];
    closeCommandPalette();
    if (item && typeof item.run === 'function') {
        item.run();
    }
}

function onActivityClicked(activity) {
    const safeActivity = String(activity || '');
    if (!safeActivity) return;

    if (safeActivity === 'explorer') {
        if (state.ui.activeActivity === 'explorer') {
            toggleSidebar();
        } else {
            setActiveActivity('explorer');
            showSidebar(true);
        }
        return;
    }

    setActiveActivity(safeActivity);
    showSidebar(true);

    if (safeActivity === 'search') {
        openCommandPalette('quick-open', '');
        return;
    }

    if (safeActivity === 'run') {
        showBottomPanel(true);
        setActivePanelTab('problems');
        runDiagnostics();
        return;
    }

    if (safeActivity === 'extensions') {
        showBottomPanel(true);
        setActivePanelTab('assembly');
        addEvent('info', 'Extensions 视图映射到 Assembly 面板');
        return;
    }

    if (safeActivity === 'settings') {
        openCommandPalette('commands', 'View:');
        return;
    }

    if (safeActivity === 'scm') {
        addEvent('info', 'Source Control 视图在独立版中仅保留入口布局');
    }
}

function isCtrlOrMeta(event) {
    return !!(event && (event.ctrlKey || event.metaKey));
}

function handleGlobalShortcuts(event) {
    if (!isCtrlOrMeta(event) || event.altKey) return;

    const key = String(event.key || '').toLowerCase();
    const code = String(event.code || '');

    if (key === 's' && !event.shiftKey) {
        event.preventDefault();
        saveWorkspaceNow();
        return;
    }

    if (key === 'b' && !event.shiftKey) {
        event.preventDefault();
        toggleSidebar();
        return;
    }

    if ((key === 'j' && !event.shiftKey) || code === 'Backquote') {
        event.preventDefault();
        toggleBottomPanel();
        return;
    }

    if (key === 'p' && event.shiftKey) {
        event.preventDefault();
        openCommandPalette('commands', '');
        return;
    }

    if (key === 'p' && !event.shiftKey) {
        event.preventDefault();
        openCommandPalette('quick-open', '');
        return;
    }

    if (key === 'e' && event.shiftKey) {
        event.preventDefault();
        focusExplorer();
    }
}

function createWorkerRpc(worker, workerName) {
    let seq = 1;
    const pending = new Map();

    worker.onmessage = function (event) {
        const message = event && event.data ? event.data : {};
        const id = message.id;
        if (!pending.has(id)) return;

        const deferred = pending.get(id);
        pending.delete(id);

        if (message.type === MESSAGE_TYPES.ERROR) {
            deferred.reject(new Error((message.payload && message.payload.message) || `${workerName} error`));
            return;
        }

        deferred.resolve(message.payload || {});
    };

    return {
        call(type, payload) {
            return new Promise((resolve, reject) => {
                const id = seq++;
                pending.set(id, { resolve, reject });
                worker.postMessage({ id, type, payload: payload || {} });
            });
        }
    };
}

const languageWorker = new Worker(new URL('./workers/language.worker.js', import.meta.url), { type: 'module' });
const languageRpc = createWorkerRpc(languageWorker, 'language-worker');
let roslynRpc = null;

async function ensureRoslynWorker() {
    if (roslynRpc) return roslynRpc;
    const worker = new Worker(new URL('./workers/roslyn.worker.js', import.meta.url), { type: 'module' });
    state.roslynWorker = worker;
    roslynRpc = createWorkerRpc(worker, 'roslyn-worker');
    await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    addEvent('info', '增强诊断 Worker 已加载');
    return roslynRpc;
}

function getActiveFile() {
    const activeId = String(state.workspace.activeFileId || '');
    return state.workspace.files.find((file) => file.id === activeId) || null;
}

function updateFileListUi() {
    if (!dom.fileList) return;
    dom.fileList.innerHTML = '';

    state.workspace.files.forEach((file) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'file-item';
        btn.textContent = file.path;
        btn.setAttribute('aria-current', file.id === state.workspace.activeFileId ? 'true' : 'false');
        btn.addEventListener('click', function () {
            switchActiveFile(file.id);
        });
        li.appendChild(btn);
        dom.fileList.appendChild(li);
    });

    const active = getActiveFile();
    if (dom.activeFileName) {
        dom.activeFileName.textContent = active ? active.path : '(无文件)';
    }
}

function workspaceSnapshotForSave() {
    return {
        schemaVersion: 1,
        activeFileId: state.workspace.activeFileId,
        files: state.workspace.files.map((file) => ({
            id: file.id,
            path: file.path,
            content: String(file.content || '')
        }))
    };
}

function scheduleWorkspaceSave() {
    if (state.saveTimer) {
        clearTimeout(state.saveTimer);
    }

    state.saveTimer = setTimeout(async function () {
        state.saveTimer = 0;
        try {
            await saveWorkspace(workspaceSnapshotForSave());
            scheduleUnifiedStateSave();
        } catch (error) {
            addEvent('error', `保存工作区失败：${error.message}`);
        }
    }, 280);
}

function ensureModelForFile(file) {
    if (state.modelByFileId.has(file.id)) {
        return state.modelByFileId.get(file.id);
    }

    const model = monaco.editor.createModel(String(file.content || ''), 'csharp', monaco.Uri.parse(`inmemory://model/${file.id}/${file.path}`));
    model.onDidChangeContent(function () {
        file.content = model.getValue();
        scheduleWorkspaceSave();
        scheduleDiagnostics();
    });

    state.modelByFileId.set(file.id, model);
    return model;
}

function switchActiveFile(fileId) {
    const target = state.workspace.files.find((file) => file.id === fileId);
    if (!target || !state.editor) return;

    state.workspace.activeFileId = target.id;
    const model = ensureModelForFile(target);
    state.editor.setModel(model);
    updateFileListUi();
    scheduleWorkspaceSave();
    runDiagnostics();
}

function removeModelForFile(fileId) {
    if (!state.modelByFileId.has(fileId)) return;
    const model = state.modelByFileId.get(fileId);
    state.modelByFileId.delete(fileId);
    model.dispose();
}

function createFileId() {
    return `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toMonacoSeverity(level) {
    if (level === DIAGNOSTIC_SEVERITY.ERROR) return monaco.MarkerSeverity.Error;
    if (level === DIAGNOSTIC_SEVERITY.WARNING) return monaco.MarkerSeverity.Warning;
    return monaco.MarkerSeverity.Info;
}

function convertCompletionKind(kind) {
    if (kind === 'method') return monaco.languages.CompletionItemKind.Method;
    if (kind === 'property') return monaco.languages.CompletionItemKind.Property;
    if (kind === 'field') return monaco.languages.CompletionItemKind.Field;
    if (kind === 'class') return monaco.languages.CompletionItemKind.Class;
    if (kind === 'keyword') return monaco.languages.CompletionItemKind.Keyword;
    return monaco.languages.CompletionItemKind.Text;
}

function diagnosticsToMarkers(diags) {
    return (Array.isArray(diags) ? diags : []).map((diag) => ({
        severity: toMonacoSeverity(diag.severity),
        message: `[${diag.code}] ${diag.message}`,
        startLineNumber: Number(diag.startLineNumber || 1),
        startColumn: Number(diag.startColumn || 1),
        endLineNumber: Number(diag.endLineNumber || 1),
        endColumn: Number(diag.endColumn || 1)
    }));
}

function diagnosticSeverityRank(level) {
    if (level === DIAGNOSTIC_SEVERITY.ERROR) return 0;
    if (level === DIAGNOSTIC_SEVERITY.WARNING) return 1;
    return 2;
}

function normalizeProblems(diags) {
    return (Array.isArray(diags) ? diags : [])
        .filter((item) => item && (item.severity === DIAGNOSTIC_SEVERITY.ERROR || item.severity === DIAGNOSTIC_SEVERITY.WARNING))
        .map((item) => ({
            code: String(item.code || 'RULE_UNKNOWN'),
            severity: item.severity === DIAGNOSTIC_SEVERITY.ERROR ? DIAGNOSTIC_SEVERITY.ERROR : DIAGNOSTIC_SEVERITY.WARNING,
            message: String(item.message || ''),
            startLineNumber: Number(item.startLineNumber || 1),
            startColumn: Number(item.startColumn || 1),
            endLineNumber: Number(item.endLineNumber || item.startLineNumber || 1),
            endColumn: Number(item.endColumn || item.startColumn || 1)
        }))
        .sort((a, b) => {
            const bySeverity = diagnosticSeverityRank(a.severity) - diagnosticSeverityRank(b.severity);
            if (bySeverity !== 0) return bySeverity;
            const byLine = a.startLineNumber - b.startLineNumber;
            if (byLine !== 0) return byLine;
            const byColumn = a.startColumn - b.startColumn;
            if (byColumn !== 0) return byColumn;
            return a.code.localeCompare(b.code);
        });
}

function jumpToProblem(problem) {
    if (!problem || !state.editor || !state.editor.getModel()) return;
    const line = Math.max(1, Number(problem.startLineNumber || 1));
    const column = Math.max(1, Number(problem.startColumn || 1));
    state.editor.setPosition({ lineNumber: line, column });
    state.editor.revealLineInCenter(line);
    state.editor.focus();
}

function renderProblems(diags) {
    const normalized = normalizeProblems(diags);
    state.problems = normalized;

    const errorCount = normalized.filter((item) => item.severity === DIAGNOSTIC_SEVERITY.ERROR).length;
    const warningCount = normalized.filter((item) => item.severity === DIAGNOSTIC_SEVERITY.WARNING).length;

    if (dom.problemsSummary) {
        dom.problemsSummary.textContent = `Errors: ${errorCount} · Warnings: ${warningCount}`;
    }

    if (!dom.problemsList) {
        return normalized.length;
    }

    dom.problemsList.innerHTML = '';
    if (!normalized.length) {
        const empty = document.createElement('li');
        empty.className = 'problems-empty';
        empty.textContent = '暂无 error/warning。';
        dom.problemsList.appendChild(empty);
        return 0;
    }

    normalized.forEach((problem) => {
        const item = document.createElement('li');
        item.className = 'problem-item';
        item.setAttribute('data-severity', problem.severity);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'problem-jump';
        btn.title = '定位到问题位置';
        btn.addEventListener('click', () => {
            jumpToProblem(problem);
        });

        const severity = document.createElement('span');
        severity.className = 'problem-severity';
        severity.textContent = problem.severity === DIAGNOSTIC_SEVERITY.ERROR ? 'error' : 'warning';

        const code = document.createElement('span');
        code.className = 'problem-code';
        code.textContent = problem.code;

        const loc = document.createElement('span');
        loc.className = 'problem-location';
        loc.textContent = `Ln ${problem.startLineNumber}, Col ${problem.startColumn}`;

        const message = document.createElement('span');
        message.className = 'problem-message';
        message.textContent = problem.message;

        btn.appendChild(severity);
        btn.appendChild(code);
        btn.appendChild(loc);
        btn.appendChild(message);
        item.appendChild(btn);
        dom.problemsList.appendChild(item);
    });

    return normalized.length;
}

function buildAnalyzeCacheKey(model, offset, maxItems, features) {
    const featureMask = [
        features && features.completion ? 'c1' : 'c0',
        features && features.hover ? 'h1' : 'h0',
        features && features.diagnostics ? 'd1' : 'd0'
    ].join('');
    return [
        model && model.uri ? String(model.uri) : 'model',
        model && model.getVersionId ? String(model.getVersionId()) : '0',
        String(Math.max(0, Number(offset) || 0)),
        String(Math.max(10, Math.min(COMPLETION_MAX_ITEMS, Number(maxItems || 80)))),
        featureMask
    ].join('|');
}

async function requestAnalyzeFromModel(model, offset, options) {
    if (!model) {
        return {
            completionItems: [],
            hover: null,
            diagnosticsRule: [],
            meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
        };
    }

    const maxItems = Math.max(10, Math.min(COMPLETION_MAX_ITEMS, Number(options && options.maxItems || 80)));
    const features = {
        completion: !!(options && options.completion),
        hover: !!(options && options.hover),
        diagnostics: !!(options && options.diagnostics)
    };
    const cacheKey = buildAnalyzeCacheKey(model, offset, maxItems, features);
    if (state.analyzeCache.has(cacheKey)) {
        return await state.analyzeCache.get(cacheKey);
    }

    const request = {
        text: model.getValue(),
        offset: Math.max(0, Number(offset) || 0),
        maxItems,
        features
    };

    const promise = languageRpc.call(MESSAGE_TYPES.ANALYZE_V2_REQUEST, request).finally(() => {
        if (state.analyzeCache.size > 24) {
            const oldestKey = state.analyzeCache.keys().next().value;
            if (oldestKey) state.analyzeCache.delete(oldestKey);
        }
    });

    state.analyzeCache.set(cacheKey, promise);
    return await promise;
}

async function runDiagnostics() {
    const model = state.editor ? state.editor.getModel() : null;
    if (!model) return;

    const position = state.editor && state.editor.getPosition ? state.editor.getPosition() : null;
    const offset = position ? model.getOffsetAt(position) : 0;
    const source = { text: model.getValue() };

    try {
        const analyzePayload = await requestAnalyzeFromModel(model, offset, {
            completion: false,
            hover: false,
            diagnostics: true
        });
        let allDiags = Array.isArray(analyzePayload.diagnosticsRule) ? analyzePayload.diagnosticsRule : [];

        if (state.roslynEnabled) {
            const rpc = await ensureRoslynWorker();
            const roslynPayload = await rpc.call(MESSAGE_TYPES.DIAGNOSTICS_ROSLYN_REQUEST, source);
            const roslynDiags = Array.isArray(roslynPayload.diagnostics) ? roslynPayload.diagnostics : [];
            allDiags = allDiags.concat(roslynDiags);
        }

        monaco.editor.setModelMarkers(model, 'tml-ide', diagnosticsToMarkers(allDiags));
        const problemCount = renderProblems(allDiags);
        if (problemCount > 0) {
            showBottomPanel(true);
            setActivePanelTab('problems');
        }
        setStatus(`诊断完成：${allDiags.length} 条`);
    } catch (error) {
        addEvent('error', `运行诊断失败：${error.message}`);
    }
}

function scheduleDiagnostics() {
    if (state.diagnosticsTimer) {
        clearTimeout(state.diagnosticsTimer);
    }

    state.diagnosticsTimer = setTimeout(function () {
        state.diagnosticsTimer = 0;
        runDiagnostics();
    }, 420);
}

function updateIndexInfo(stats) {
    if (!dom.indexInfo) return;
    if (!stats) {
        dom.indexInfo.textContent = 'api-index.v2';
        return;
    }
    dom.indexInfo.textContent = `api-index.v2 · T:${stats.types} M:${stats.methods}`;
}

function downloadTextFile(fileName, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function registerWorkspacePlugins() {
    if (!state.plugins.registry.has('csharp')) {
        state.plugins.registry.register(createCsharpWorkspacePlugin());
    }
    if (!state.plugins.registry.has('markdown')) {
        state.plugins.registry.register(createMarkdownWorkspacePlugin());
    }
    if (!state.plugins.registry.has('shader')) {
        state.plugins.registry.register(createShaderWorkspacePlugin());
    }
}

function quoteArg(value) {
    const safe = String(value || '').trim();
    if (!safe) return '""';
    return `"${safe.replace(/"/g, '\\"')}"`;
}

function buildRequiredArg(flag, value, placeholder) {
    const safe = String(value || '').trim();
    return safe ? `${flag} ${quoteArg(safe)}` : `${flag} <${placeholder}>`;
}

function buildOptionalArg(flag, value) {
    const safe = String(value || '').trim();
    return safe ? `${flag} ${quoteArg(safe)}` : '';
}

function buildIndexCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', dom.inputIndexerDllPath.value, 'tModLoader.dll'));
    const xmlArg = buildOptionalArg('--xml', dom.inputIndexerXmlPath.value);
    if (xmlArg) parts.push(xmlArg);
    const terrariaDllArg = buildOptionalArg('--terraria-dll', dom.inputIndexerTerrariaDllPath.value);
    if (terrariaDllArg) parts.push(terrariaDllArg);
    const terrariaXmlArg = buildOptionalArg('--terraria-xml', dom.inputIndexerTerrariaXmlPath.value);
    if (terrariaXmlArg) parts.push(terrariaXmlArg);
    parts.push(buildRequiredArg('--out', dom.inputIndexerOutPath.value, 'api-index.v2.json'));
    return parts.join(' ');
}

function buildAppendCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', dom.inputAppendDllPath.value, 'extra-mod.dll'));
    const xmlArg = buildOptionalArg('--xml', dom.inputAppendXmlPath.value);
    if (xmlArg) parts.push(xmlArg);
    parts.push(buildRequiredArg('--append', dom.inputAppendOutPath.value, 'session-pack.v1.json'));
    return parts.join(' ');
}

function refreshIndexerCommandPreview() {
    if (dom.indexCommandPreview) {
        dom.indexCommandPreview.textContent = buildIndexCommandText();
    }
    if (dom.appendCommandPreview) {
        dom.appendCommandPreview.textContent = buildAppendCommandText();
    }
}

async function copyToClipboard(text) {
    const safe = String(text || '');
    if (!safe) return false;

    if (globalThis.navigator && navigator.clipboard && globalThis.isSecureContext) {
        await navigator.clipboard.writeText(safe);
        return true;
    }

    const area = document.createElement('textarea');
    area.value = safe;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.left = '-2000px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return !!ok;
}

async function applyIndex(nextIndex, sourceLabel) {
    state.index = normalizeApiIndex(nextIndex);
    const result = await languageRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    updateIndexInfo(result.stats || null);
    if (roslynRpc) {
        await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    }
    const safeLabel = String(sourceLabel || '索引');
    const typeCount = result && result.stats ? result.stats.types : Object.keys(state.index.types).length;
    addEvent('info', `${safeLabel} 已生效：${typeCount} types`);
    runDiagnostics();
}

async function loadInitialIndex() {
    const url = `${import.meta.env.BASE_URL}data/api-index.v2.json`;
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        await applyIndex(json, '基础索引');
    } catch (error) {
        state.index = createEmptyApiIndex();
        await languageRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
        addEvent('error', `基础索引加载失败，将使用空索引：${error.message}`);
        updateIndexInfo(null);
    }
}

function applyWorkspace(nextWorkspace) {
    const currentIds = new Set(state.workspace.files.map((file) => file.id));
    const nextIds = new Set(nextWorkspace.files.map((file) => file.id));

    currentIds.forEach((id) => {
        if (!nextIds.has(id)) {
            removeModelForFile(id);
        }
    });

    state.workspace = nextWorkspace;
    state.workspace.files.forEach((file) => {
        ensureModelForFile(file);
    });

    updateFileListUi();
    switchActiveFile(state.workspace.activeFileId);
    scheduleWorkspaceSave();
    scheduleUnifiedStateSave();
}

function installEditorProviders() {
    monaco.languages.registerCompletionItemProvider('csharp', {
        triggerCharacters: ['.'],
        async provideCompletionItems(model, position) {
            const offset = model.getOffsetAt(position);
            const payload = await requestAnalyzeFromModel(model, offset, {
                completion: true,
                hover: false,
                diagnostics: false,
                maxItems: COMPLETION_MAX_ITEMS
            });

            const items = Array.isArray(payload.completionItems) ? payload.completionItems : [];
            return {
                suggestions: items.map((item) => ({
                    label: item.label,
                    kind: convertCompletionKind(item.kind),
                    insertText: item.insertText || item.label,
                    insertTextRules: item.insertTextMode === 'snippet'
                        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        : undefined,
                    detail: item.detail || '',
                    documentation: item.documentation || '',
                    sortText: item.sortText || item.label,
                    range: undefined
                }))
            };
        }
    });

    monaco.languages.registerHoverProvider('csharp', {
        async provideHover(model, position) {
            const offset = model.getOffsetAt(position);
            const payload = await requestAnalyzeFromModel(model, offset, {
                completion: false,
                hover: true,
                diagnostics: false
            });
            const hover = payload && payload.hover ? payload.hover : null;
            if (!hover) return null;

            const start = model.getPositionAt(hover.startOffset);
            const end = model.getPositionAt(hover.endOffset);

            return {
                range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                contents: [{ value: hover.markdown || '' }]
            };
        }
    });
}

function bindUiEvents() {
    window.addEventListener('popstate', () => {
        const route = parseRouteFromUrl();
        state.route.workspace = normalizeWorkspaceName(route.workspace);
        state.route.panel = normalizePanelName(route.panel);
        setActiveWorkspace(state.route.workspace, { syncUrl: false, persist: true, collect: true, replaceUrl: true }).catch(() => {});
        if (routePanelIsOpen()) {
            openUnifiedSubmitPanel({ syncUrl: false, replaceUrl: true });
        } else {
            closeUnifiedSubmitPanel({ syncUrl: false, replaceUrl: true });
        }
    });

    dom.workspaceButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nextWorkspace = normalizeWorkspaceName(button.dataset.workspace);
            if (nextWorkspace === 'csharp') {
                closeUnifiedSubmitPanel({ syncUrl: false, replaceUrl: true });
            }
            setActiveWorkspace(nextWorkspace, { syncUrl: true, persist: true, collect: true }).catch(() => {});
        });
    });

    if (dom.btnOpenUnifiedSubmit) {
        dom.btnOpenUnifiedSubmit.addEventListener('click', () => {
            if (normalizeWorkspaceName(state.route.workspace) === 'csharp') {
                setActiveWorkspace('markdown', { syncUrl: false, persist: true, collect: true }).catch(() => {});
            }
            openUnifiedSubmitPanel({ syncUrl: true });
        });
    }

    if (dom.btnRouteSubmitPanel) {
        dom.btnRouteSubmitPanel.addEventListener('click', () => {
            setActiveWorkspace('shader', { syncUrl: false, persist: true, collect: true }).catch(() => {});
            openUnifiedSubmitPanel({ syncUrl: true });
            dispatchWorkspaceCommand('shader', 'workspace.open-submit-panel');
        });
    }

    if (dom.btnSubappReload) {
        dom.btnSubappReload.addEventListener('click', () => {
            const workspace = normalizeWorkspaceName(state.route.workspace);
            if (workspace === 'markdown' || workspace === 'shader') {
                setActiveWorkspace(workspace, { syncUrl: false, persist: true, collect: true, forceReload: true }).catch(() => {});
            }
        });
    }

    if (dom.btnSubappOpenSubmit) {
        dom.btnSubappOpenSubmit.addEventListener('click', () => {
            openUnifiedSubmitPanel({ syncUrl: true });
        });
    }

    if (dom.btnUnifiedSubmitClose) {
        dom.btnUnifiedSubmitClose.addEventListener('click', () => {
            closeUnifiedSubmitPanel({ syncUrl: true });
        });
    }

    if (dom.unifiedWorkerUrl) {
        dom.unifiedWorkerUrl.addEventListener('change', () => {
            dom.unifiedWorkerUrl.value = normalizeWorkerApiUrl(dom.unifiedWorkerUrl.value) || DEFAULT_WORKER_API_URL;
            scheduleUnifiedStateSave();
        });
    }

    if (dom.unifiedPrTitle) {
        dom.unifiedPrTitle.addEventListener('input', () => {
            scheduleUnifiedStateSave();
        });
    }

    if (dom.unifiedExistingPrNumber) {
        dom.unifiedExistingPrNumber.addEventListener('input', () => {
            scheduleUnifiedStateSave();
        });
    }

    if (dom.unifiedAnchorSelect) {
        dom.unifiedAnchorSelect.addEventListener('change', () => {
            scheduleUnifiedStateSave();
        });
    }

    if (dom.btnUnifiedAuthLogin) {
        dom.btnUnifiedAuthLogin.addEventListener('click', () => {
            const workerApiUrl = normalizeWorkerApiUrl(dom.unifiedWorkerUrl ? dom.unifiedWorkerUrl.value : '');
            if (!workerApiUrl) {
                setUnifiedSubmitStatus('请先填写 Worker API 地址', 'error');
                return;
            }
            const loginUrl = buildGithubLoginUrl(workerApiUrl);
            if (!loginUrl) {
                setUnifiedSubmitStatus('无法构建 OAuth 登录地址', 'error');
                return;
            }
            globalThis.location.href = loginUrl;
        });
    }

    if (dom.btnUnifiedAuthLogout) {
        dom.btnUnifiedAuthLogout.addEventListener('click', () => {
            clearAuthSession();
            updateUnifiedAuthUi();
            setUnifiedSubmitStatus('已退出登录', 'info');
        });
    }

    if (dom.btnUnifiedCollect) {
        dom.btnUnifiedCollect.addEventListener('click', async () => {
            try {
                await collectUnifiedChanges({ requestSubapp: true });
            } catch (error) {
                setUnifiedSubmitStatus(`收集失败：${error.message}`, 'error');
            }
        });
    }

    if (dom.btnUnifiedSubmit) {
        dom.btnUnifiedSubmit.addEventListener('click', async () => {
            try {
                const collection = await collectUnifiedChanges({ requestSubapp: true });
                const batchPlan = await buildUnifiedSubmitBatches(collection);
                pushUnifiedSubmitLog(`批次规划完成：${batchPlan.batches.length} 批`);
                await runUnifiedSubmitBatches(batchPlan.batches, {
                    startIndex: 0,
                    existingPrNumber: String(dom.unifiedExistingPrNumber ? dom.unifiedExistingPrNumber.value : '').trim()
                });
            } catch (error) {
                setUnifiedSubmitStatus(`提交失败：${error.message}`, 'error');
            }
        });
    }

    if (dom.btnUnifiedResume) {
        dom.btnUnifiedResume.addEventListener('click', async () => {
            const resume = state.unified.resumeState;
            if (!resume || !Array.isArray(resume.batches) || !resume.batches.length) {
                setUnifiedSubmitStatus('没有可续传的失败批次', 'info');
                return;
            }
            try {
                pushUnifiedSubmitLog(`从批次 ${Number(resume.nextIndex || 0) + 1} 开始续传`);
                await runUnifiedSubmitBatches(resume.batches, {
                    startIndex: Number(resume.nextIndex || 0),
                    existingPrNumber: String(resume.existingPrNumber || '')
                });
            } catch (error) {
                setUnifiedSubmitStatus(`续传失败：${error.message}`, 'error');
            }
        });
    }

    dom.activityButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onActivityClicked(button.dataset.activity);
        });
    });

    dom.panelTabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            showBottomPanel(true);
            setActivePanelTab(button.dataset.panelTab);
        });
    });

    if (dom.btnToggleBottomPanel) {
        dom.btnToggleBottomPanel.addEventListener('click', () => {
            toggleBottomPanel();
        });
    }

    if (dom.commandPaletteBackdrop) {
        dom.commandPaletteBackdrop.addEventListener('click', () => {
            closeCommandPalette();
        });
    }

    if (dom.commandPaletteInput) {
        dom.commandPaletteInput.addEventListener('input', () => {
            state.ui.paletteSelectedIndex = 0;
            refreshCommandPaletteItems();
        });

        dom.commandPaletteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeCommandPalette();
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                updateCommandPaletteSelection(state.ui.paletteSelectedIndex + 1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                updateCommandPaletteSelection(state.ui.paletteSelectedIndex - 1);
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                executeCommandPaletteSelection(state.ui.paletteSelectedIndex);
            }
        });
    }

    window.addEventListener('keydown', (event) => {
        if (state.ui.paletteOpen && event.key === 'Escape') {
            closeCommandPalette();
            return;
        }
        handleGlobalShortcuts(event);
    });

    dom.btnAddFile.addEventListener('click', function () {
        const input = globalThis.prompt('请输入新文件名（.cs）', 'NewFile.cs');
        if (!input) return;

        const fileName = input.trim();
        if (!fileName.toLowerCase().endsWith('.cs')) {
            addEvent('error', '文件名必须以 .cs 结尾');
            return;
        }

        const exists = state.workspace.files.some((file) => file.path.toLowerCase() === fileName.toLowerCase());
        if (exists) {
            addEvent('error', `文件已存在：${fileName}`);
            return;
        }

        const file = {
            id: createFileId(),
            path: fileName,
            content: ''
        };

        state.workspace.files.push(file);
        ensureModelForFile(file);
        switchActiveFile(file.id);
        updateFileListUi();
        scheduleWorkspaceSave();
        addEvent('info', `已新增文件：${fileName}`);
    });

    dom.btnRenameFile.addEventListener('click', function () {
        const active = getActiveFile();
        if (!active) return;

        const input = globalThis.prompt('请输入新的文件名（.cs）', active.path);
        if (!input) return;

        const next = input.trim();
        if (!next.toLowerCase().endsWith('.cs')) {
            addEvent('error', '文件名必须以 .cs 结尾');
            return;
        }

        const exists = state.workspace.files.some((file) => {
            return file.id !== active.id && file.path.toLowerCase() === next.toLowerCase();
        });
        if (exists) {
            addEvent('error', `文件名冲突：${next}`);
            return;
        }

        active.path = next;
        updateFileListUi();
        scheduleWorkspaceSave();
        addEvent('info', `已重命名为：${next}`);
    });

    dom.btnDeleteFile.addEventListener('click', function () {
        const active = getActiveFile();
        if (!active) return;
        if (state.workspace.files.length <= 1) {
            addEvent('error', '至少保留一个文件');
            return;
        }

        const ok = globalThis.confirm(`确认删除 ${active.path} ?`);
        if (!ok) return;

        state.workspace.files = state.workspace.files.filter((file) => file.id !== active.id);
        removeModelForFile(active.id);
        state.workspace.activeFileId = state.workspace.files[0].id;
        updateFileListUi();
        switchActiveFile(state.workspace.activeFileId);
        scheduleWorkspaceSave();
        addEvent('info', `已删除文件：${active.path}`);
    });

    dom.btnRunDiagnostics.addEventListener('click', runDiagnostics);

    dom.btnSaveWorkspace.addEventListener('click', function () {
        saveWorkspaceNow();
    });

    dom.btnExportWorkspace.addEventListener('click', function () {
        const text = exportWorkspaceJson(workspaceSnapshotForSave());
        downloadTextFile('workspace.v1.json', text, 'application/json;charset=utf-8');
        addEvent('info', '已导出 workspace.v1.json');
    });

    dom.inputImportWorkspace.addEventListener('change', async function () {
        const file = dom.inputImportWorkspace.files && dom.inputImportWorkspace.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const workspace = importWorkspaceJson(text);
            applyWorkspace(workspace);
            addEvent('info', `已导入工作区：${file.name}`);
        } catch (error) {
            addEvent('error', `导入失败：${error.message}`);
        } finally {
            dom.inputImportWorkspace.value = '';
        }
    });

    dom.toggleRoslyn.addEventListener('change', async function () {
        state.roslynEnabled = !!dom.toggleRoslyn.checked;
        if (state.roslynEnabled) {
            await ensureRoslynWorker();
        }
        runDiagnostics();
    });

    dom.btnImportAssembly.addEventListener('click', async function () {
        const dllFile = dom.inputExtraDll.files && dom.inputExtraDll.files[0];
        const xmlFile = dom.inputExtraXml.files && dom.inputExtraXml.files[0];
        if (!dllFile || !xmlFile) {
            addEvent('error', '请同时选择 DLL 与 XML 文件');
            return;
        }

        try {
            const xmlText = await xmlFile.text();
            const result = await languageRpc.call(MESSAGE_TYPES.ASSEMBLY_IMPORT_REQUEST, {
                dllName: dllFile.name,
                xmlText
            });

            const patch = buildPatchIndexFromXml(xmlText, dllFile.name);
            state.index = mergeApiIndex(state.index, patch);
            updateIndexInfo(result.stats || null);

            if (roslynRpc) {
                await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
            }

            addEvent(
                'info',
                `导入完成：${result.summary.assemblyName}，新增 ${result.summary.importedTypes} types，总计 ${result.summary.totalTypes}`
            );

            runDiagnostics();
        } catch (error) {
            addEvent('error', `程序集导入失败：${error.message}`);
        }
    });

    const indexerInputs = [
        dom.inputIndexerDllPath,
        dom.inputIndexerXmlPath,
        dom.inputIndexerTerrariaDllPath,
        dom.inputIndexerTerrariaXmlPath,
        dom.inputIndexerOutPath,
        dom.inputAppendDllPath,
        dom.inputAppendXmlPath,
        dom.inputAppendOutPath
    ];

    indexerInputs.forEach((input) => {
        if (!input) return;
        input.addEventListener('input', refreshIndexerCommandPreview);
    });

    dom.btnCopyIndexCommand.addEventListener('click', async function () {
        try {
            const ok = await copyToClipboard(buildIndexCommandText());
            if (!ok) {
                throw new Error('浏览器拒绝复制');
            }
            addEvent('info', '已复制基础索引命令');
        } catch (error) {
            addEvent('error', `复制失败：${error.message}`);
        }
    });

    dom.btnCopyAppendCommand.addEventListener('click', async function () {
        try {
            const ok = await copyToClipboard(buildAppendCommandText());
            if (!ok) {
                throw new Error('浏览器拒绝复制');
            }
            addEvent('info', '已复制追加命令');
        } catch (error) {
            addEvent('error', `复制失败：${error.message}`);
        }
    });

    dom.btnImportIndex.addEventListener('click', async function () {
        const file = dom.inputImportIndex.files && dom.inputImportIndex.files[0];
        if (!file) {
            addEvent('error', '请先选择 api-index.v2.json 文件');
            return;
        }

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            await applyIndex(json, `导入索引 ${file.name}`);
        } catch (error) {
            addEvent('error', `导入索引失败：${error.message}`);
        } finally {
            dom.inputImportIndex.value = '';
        }
    });
}

async function bootstrap() {
    consumeOAuthHashSession();
    const unifiedState = await loadUnifiedWorkspaceState();
    initializeUnifiedState(unifiedState);
    updateUnifiedAuthUi();

    const route = parseRouteFromUrl();
    state.route.workspace = normalizeWorkspaceName(route.workspace);
    state.route.panel = normalizePanelName(route.panel);
    updateWorkspaceButtons();
    applyUnifiedSubmitPanelVisibility();

    dom.workspaceVersion.textContent = 'workspace.v2';
    const enhancedCsharpLanguage = createEnhancedCsharpLanguage(csharpLanguage);
    monaco.languages.setLanguageConfiguration('csharp', csharpConf);
    monaco.languages.setMonarchTokensProvider('csharp', enhancedCsharpLanguage);
    registerRiderDarkMonacoTheme();
    setActiveActivity(state.ui.activeActivity);
    setActivePanelTab(state.ui.activePanelTab);
    applyWorkbenchVisibility();

    if (dom.commandPalette) {
        dom.commandPalette.hidden = true;
    }
    if (dom.commandPaletteInput) {
        dom.commandPaletteInput.placeholder = `输入命令（${VSCODE_SHORTCUTS.COMMAND_PALETTE}）`;
    }

    registerWorkspacePlugins();

    state.initialized = false;
    setStatus('初始化中...');
    renderProblems([]);

    state.editor = monaco.editor.create(dom.editor, {
        language: 'csharp',
        theme: 'tml-rider-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        tabSize: 4,
        insertSpaces: true,
        fontSize: 14,
        smoothScrolling: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        readOnly: true
    });

    globalThis.__tmlIdeDebug = {
        isReady() {
            return !!state.initialized;
        },
        triggerSuggest() {
            if (!state.initialized || !state.editor) return Promise.resolve();
            const action = state.editor.getAction('editor.action.triggerSuggest');
            if (action) {
                return action.run();
            }
            state.editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
            return Promise.resolve();
        },
        setEditorText(text) {
            if (!state.initialized || !state.editor || !state.editor.getModel()) return false;
            state.editor.getModel().setValue(String(text || ''));
            return true;
        },
        setCursorAfterText(needle) {
            if (!state.initialized || !state.editor || !state.editor.getModel()) return false;
            const model = state.editor.getModel();
            const text = model.getValue();
            const safeNeedle = String(needle || '');
            if (!safeNeedle) return false;
            const index = text.indexOf(safeNeedle);
            if (index < 0) return false;
            const position = model.getPositionAt(index + safeNeedle.length);
            state.editor.setPosition(position);
            state.editor.focus();
            return true;
        },
        getEditorText() {
            if (!state.editor || !state.editor.getModel()) return '';
            return state.editor.getModel().getValue();
        },
        async requestAnalyzeAtCursor(options) {
            if (!state.initialized || !state.editor) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const model = state.editor.getModel();
            if (!model) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const position = state.editor.getPosition();
            if (!position) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const offset = model.getOffsetAt(position);
            return await requestAnalyzeFromModel(model, offset, {
                completion: !options || options.completion !== false,
                hover: !!(options && options.hover),
                diagnostics: !!(options && options.diagnostics),
                maxItems: Number(options && options.maxItems || COMPLETION_MAX_ITEMS)
            });
        },
        async requestCompletionsAtCursor(maxItems) {
            const result = await this.requestAnalyzeAtCursor({
                completion: true,
                hover: false,
                diagnostics: false,
                maxItems: Number(maxItems || COMPLETION_MAX_ITEMS)
            });
            return Array.isArray(result && result.completionItems) ? result.completionItems : [];
        },
        async requestHoverAtCursor() {
            const result = await this.requestAnalyzeAtCursor({
                completion: false,
                hover: true,
                diagnostics: false
            });
            return result && result.hover ? result.hover : null;
        },
        getRoute() {
            return {
                workspace: normalizeWorkspaceName(state.route.workspace),
                panel: normalizePanelName(state.route.panel)
            };
        },
        async switchWorkspace(workspace, panel) {
            const nextWorkspace = normalizeWorkspaceName(workspace);
            await setActiveWorkspace(nextWorkspace, {
                syncUrl: true,
                replaceUrl: false,
                persist: true,
                collect: true
            });
            if (normalizePanelName(panel) === 'submit') {
                openUnifiedSubmitPanel({ syncUrl: true, replaceUrl: false });
            } else {
                closeUnifiedSubmitPanel({ syncUrl: true, replaceUrl: false });
            }
            return this.getRoute();
        },
        async collectUnified(options) {
            const opts = options || {};
            const collection = await collectUnifiedChanges({
                requestSubapp: opts.requestSubapp !== false,
                silent: true
            });
            return {
                markdown: collection.markdownEntries.length,
                extra: collection.extraEntries.length,
                blocked: collection.blockedEntries.length
            };
        },
        setCsharpWorkspaceFiles(files) {
            if (!Array.isArray(files)) return false;
            const normalized = files
                .map((item, index) => ({
                    id: String(item && item.id || `file-test-${index + 1}`),
                    path: String(item && item.path || `Test${index + 1}.cs`),
                    content: String(item && item.content || '')
                }))
                .filter((item) => item.path && item.path.toLowerCase().endsWith('.cs'));

            if (!normalized.length) return false;
            applyWorkspace({
                schemaVersion: 1,
                activeFileId: normalized[0].id,
                files: normalized
            });
            runDiagnostics();
            return true;
        },
        setSubappSnapshot(workspace, snapshot) {
            const safeWorkspace = normalizeWorkspaceName(workspace);
            if (safeWorkspace !== 'markdown' && safeWorkspace !== 'shader') return false;
            if (!snapshot || typeof snapshot !== 'object') return false;
            state.subapps.snapshotByWorkspace[safeWorkspace] = snapshot;
            scheduleUnifiedStateSave();
            return true;
        },
        getUnifiedSnapshot() {
            const collection = state.unified.collection || { markdownEntries: [], extraEntries: [], blockedEntries: [] };
            return {
                markdown: collection.markdownEntries.length,
                extra: collection.extraEntries.length,
                blocked: collection.blockedEntries.length,
                resume: state.unified.resumeState ? {
                    nextIndex: Number(state.unified.resumeState.nextIndex || 0),
                    existingPrNumber: String(state.unified.resumeState.existingPrNumber || '')
                } : null
            };
        },
        async submitUnified(options) {
            const opts = options || {};
            const collection = await collectUnifiedChanges({
                requestSubapp: opts.requestSubapp !== false,
                silent: true
            });
            const plan = await buildUnifiedSubmitBatches(collection);
            await runUnifiedSubmitBatches(plan.batches, {
                startIndex: Number(opts.startIndex || 0),
                existingPrNumber: String(opts.existingPrNumber || '')
            });
            return this.getUnifiedSnapshot();
        },
        async resumeUnified() {
            const resume = state.unified.resumeState;
            if (!resume || !Array.isArray(resume.batches) || !resume.batches.length) {
                throw new Error('没有可续传批次');
            }
            await runUnifiedSubmitBatches(resume.batches, {
                startIndex: Number(resume.nextIndex || 0),
                existingPrNumber: String(resume.existingPrNumber || '')
            });
            return this.getUnifiedSnapshot();
        }
    };

    installEditorProviders();
    bindUiEvents();
    refreshIndexerCommandPreview();

    await loadInitialIndex();

    const workspace = await loadWorkspace();
    applyWorkspace(workspace);
    state.initialized = true;
    state.editor.updateOptions({ readOnly: false });

    await setActiveWorkspace(state.route.workspace, {
        syncUrl: true,
        replaceUrl: true,
        persist: true,
        collect: true
    });
    if (routePanelIsOpen()) {
        openUnifiedSubmitPanel({ syncUrl: true, replaceUrl: true });
    } else {
        closeUnifiedSubmitPanel({ syncUrl: true, replaceUrl: true });
    }

    if (state.unifiedWorkspaceState && state.unifiedWorkspaceState.submit && state.unifiedWorkspaceState.submit.lastCollection) {
        persistUnifiedCollection(state.unifiedWorkspaceState.submit.lastCollection);
    } else {
        await collectUnifiedChanges({ requestSubapp: false, silent: true });
    }

    addEvent('info', 'tML IDE 初始化完成');
    setStatus('就绪');
    runDiagnostics();
}

bootstrap().catch((error) => {
    state.initialized = false;
    addEvent('error', `初始化失败：${error.message}`);
    setStatus(`初始化失败：${error.message}`);
});
