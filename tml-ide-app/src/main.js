import './style.css';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
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
    btnMarkdownTogglePreview: document.getElementById('btn-markdown-toggle-preview'),
    btnMarkdownOpenViewer: document.getElementById('btn-markdown-open-viewer'),
    btnShaderCompile: document.getElementById('btn-shader-compile'),
    btnShaderPreviewPopup: document.getElementById('btn-shader-preview-popup'),
    btnShaderExport: document.getElementById('btn-shader-export'),
    fileList: document.getElementById('file-list'),
    activeFileName: document.getElementById('active-file-name'),
    panelEditor: document.getElementById('panel-editor'),
    editor: document.getElementById('editor'),
    markdownPreviewPane: document.getElementById('markdown-preview-pane'),
    markdownPreviewFrame: document.getElementById('markdown-preview-frame'),
    imagePreviewPane: document.getElementById('image-preview-pane'),
    imagePreviewImage: document.getElementById('image-preview-image'),
    videoPreviewPane: document.getElementById('video-preview-pane'),
    videoPreviewElement: document.getElementById('video-preview-element'),
    shaderPreviewModal: document.getElementById('shader-preview-modal'),
    shaderPreviewModalBackdrop: document.getElementById('shader-preview-modal-backdrop'),
    btnShaderPreviewClose: document.getElementById('btn-shader-preview-close'),
    shaderPreviewCanvas: document.getElementById('shader-preview-canvas'),
    shaderPreviewStatus: document.getElementById('shader-preview-status'),
    shaderPresetImage: document.getElementById('shader-preset-image'),
    shaderRenderMode: document.getElementById('shader-render-mode'),
    shaderAddressMode: document.getElementById('shader-address-mode'),
    shaderBgMode: document.getElementById('shader-bg-mode'),
    shaderUploadInputs: [
        document.getElementById('shader-upload-0'),
        document.getElementById('shader-upload-1'),
        document.getElementById('shader-upload-2'),
        document.getElementById('shader-upload-3')
    ],
    shaderUploadClearButtons: [
        document.getElementById('shader-upload-clear-0'),
        document.getElementById('shader-upload-clear-1'),
        document.getElementById('shader-upload-clear-2'),
        document.getElementById('shader-upload-clear-3')
    ],
    shaderUploadNames: [
        document.getElementById('shader-upload-name-0'),
        document.getElementById('shader-upload-name-1'),
        document.getElementById('shader-upload-name-2'),
        document.getElementById('shader-upload-name-3')
    ],
    editorStatus: document.getElementById('editor-status'),
    statusLanguage: document.getElementById('status-language'),
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
    btnShaderInsertTemplate: document.getElementById('btn-shader-insert-template'),
    btnPanelShaderCompile: document.getElementById('btn-panel-shader-compile'),
    shaderCompileLog: document.getElementById('shader-compile-log'),
    shaderErrorList: document.getElementById('shader-error-list'),
    markdownToolboxGroup: document.getElementById('markdown-toolbox-group'),
    shaderCompileGroup: document.getElementById('shader-compile-group'),
    btnMdOpenGuide: document.getElementById('btn-md-open-guide'),
    btnMdDraftCheck: document.getElementById('btn-md-draft-check'),
    btnMdInsertTemplate: document.getElementById('btn-md-insert-template'),
    btnMdInsertImage: document.getElementById('btn-md-insert-image'),
    btnMdFormat: document.getElementById('btn-md-format'),
    btnMdCopy: document.getElementById('btn-md-copy'),
    btnMdExportDraft: document.getElementById('btn-md-export-draft'),
    inputMdImportDraft: document.getElementById('input-md-import-draft'),
    btnMdReset: document.getElementById('btn-md-reset'),
    btnMdFocusMode: document.getElementById('btn-md-focus-mode'),
    markdownDraftCheckLog: document.getElementById('markdown-draft-check-log'),
    markdownInsertButtons: Array.from(document.querySelectorAll('[data-md-insert]')),
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
    unifiedShaderSlug: document.getElementById('unified-shader-slug'),
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
    shaderCompile: {
        logs: [],
        errors: []
    },
    shaderPreview: {
        presetImage: 'checker',
        renderMode: 'alpha',
        addressMode: 'clamp',
        bgMode: 'transparent',
        shaderUploads: [null, null, null, null],
        rafId: 0
    },
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
        markdownPreviewMode: 'edit',
        markdownFocusMode: false,
        shaderPreviewModalOpen: false,
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
const MARKDOWN_PASTE_MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MARKDOWN_PASTE_MAX_IMAGE_COUNT = 8;
const IMAGE_FILE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif']);
const VIDEO_FILE_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv']);
const MARKDOWN_PASTE_EXTENSION_BY_MIME = Object.freeze({
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/avif': '.avif'
});
const VIEWER_PREVIEW_STORAGE_KEY = 'articleStudioViewerPreview.v1';
const VIEWER_PREVIEW_MESSAGE_TYPE = 'article-studio-preview-update';
let viewerPagePathCache = '';
const FILE_NAME_ALLOWED_EXT_RE = /\.(?:cs|animcs|md|fx|png|jpe?g|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|avi|mkv)$/i;
const SHADER_PREVIEW_BG_MODES = new Set(['transparent', 'black', 'white']);
const SHADER_PREVIEW_RENDER_MODES = new Set(['alpha', 'additive', 'multiply', 'screen']);
const SHADER_PREVIEW_ADDRESS_MODES = new Set(['clamp', 'wrap']);
const SHADER_PREVIEW_PRESETS = new Set(['checker', 'noise', 'gradient', 'rings']);
const SHADER_UPLOAD_SLOT_COUNT = 4;
const SHADER_UPLOAD_MAX_SIZE = 4 * 1024 * 1024;
const SHADER_KEYWORDS = Object.freeze([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'discard', 'struct', 'static', 'const', 'in', 'out', 'inout', 'uniform',
    'technique', 'pass', 'compile', 'register', 'cbuffer'
]);
const SHADER_TYPES = Object.freeze([
    'void', 'bool', 'int', 'uint', 'float', 'half', 'fixed',
    'bool2', 'bool3', 'bool4',
    'int2', 'int3', 'int4',
    'uint2', 'uint3', 'uint4',
    'float2', 'float3', 'float4',
    'half2', 'half3', 'half4',
    'fixed2', 'fixed3', 'fixed4',
    'float2x2', 'float3x3', 'float4x4',
    'half2x2', 'half3x3', 'half4x4',
    'fixed2x2', 'fixed3x3', 'fixed4x4',
    'sampler2D', 'Texture2D', 'sampler_state'
]);
const SHADER_FUNCTIONS = Object.freeze([
    'MainPS', 'mainImage',
    'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'clamp', 'clip', 'cos', 'cross',
    'ddx', 'ddy', 'degrees', 'distance', 'dot', 'exp', 'exp2', 'faceforward', 'floor',
    'fmod', 'frac', 'fwidth', 'isnan', 'isinf', 'length', 'lerp', 'log', 'log10', 'log2',
    'mad', 'max', 'min', 'mul', 'normalize', 'pow', 'radians', 'reflect',
    'refract', 'rcp', 'round', 'rsqrt', 'saturate', 'sign', 'sin', 'smoothstep', 'sqrt',
    'step', 'tan', 'tex2D', 'tex2Dproj', 'tex2Dbias', 'tex2Dlod', 'tex2Dgrad',
    'texture', 'textureProj', 'textureLod', 'textureGrad', 'transpose', 'determinant', 'inverse'
]);
const SHADER_BUILTINS = Object.freeze([
    'iTime', 'iTimeDelta', 'iFrame', 'iResolution', 'iMouse', 'iDate',
    'iChannel0', 'iChannel1', 'iChannel2', 'iChannel3',
    'uImage0', 'uImage1', 'uImage2', 'uImage3',
    'uv', 'fragCoord', 'fragColor', 'vertexColor',
    'TEXCOORD0', 'COLOR0', 'SV_TARGET', 'SV_POSITION'
]);
const SHADER_COMPLETION_WORDS = Object.freeze(Array.from(new Set([
    ...SHADER_KEYWORDS,
    ...SHADER_TYPES,
    ...SHADER_FUNCTIONS,
    ...SHADER_BUILTINS
])).sort((a, b) => a.localeCompare(b)));
const SHADER_COMPLETION_RESERVED = new Set(SHADER_COMPLETION_WORDS.map((word) => String(word).toLowerCase()));
const shaderPreviewPresetCache = new Map();
const shaderUploadImageCache = new Map();

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
            { token: 'variable.predefined', foreground: '66C3CC' },
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

function fileExt(pathValue) {
    const safe = String(pathValue || '').trim().toLowerCase();
    const idx = safe.lastIndexOf('.');
    if (idx < 0) return '';
    return safe.slice(idx);
}

function splitRepoPathSegments(pathValue) {
    const safe = normalizeRepoPath(pathValue);
    return safe ? safe.split('/').filter(Boolean) : [];
}

function dirnameRepoPath(pathValue) {
    const segments = splitRepoPathSegments(pathValue);
    if (!segments.length) return '';
    segments.pop();
    return segments.join('/');
}

function joinRepoPathParts(...parts) {
    return normalizeRepoPath(parts.map((part) => String(part || '').trim()).filter(Boolean).join('/'));
}

function relativeRepoPathFromFile(fromFilePath, targetPath) {
    const fromSegments = splitRepoPathSegments(fromFilePath);
    if (fromSegments.length) fromSegments.pop();
    const targetSegments = splitRepoPathSegments(targetPath);
    if (!targetSegments.length) return '';

    let shared = 0;
    const sharedMax = Math.min(fromSegments.length, targetSegments.length);
    while (shared < sharedMax) {
        if (fromSegments[shared].toLowerCase() !== targetSegments[shared].toLowerCase()) {
            break;
        }
        shared += 1;
    }

    const relativeParts = [];
    for (let i = shared; i < fromSegments.length; i += 1) {
        relativeParts.push('..');
    }
    relativeParts.push(...targetSegments.slice(shared));
    const relative = relativeParts.join('/');
    if (!relative) return './';
    if (relative.startsWith('.') || relative.startsWith('/')) return relative;
    return `./${relative}`;
}

function normalizeImageExtension(value) {
    const ext = String(value || '').trim().toLowerCase();
    if (!ext) return '.png';
    const safe = ext.startsWith('.') ? ext : `.${ext}`;
    return IMAGE_FILE_EXTENSIONS.has(safe) ? safe : '.png';
}

function ensureUniqueWorkspacePath(pathValue) {
    const safePath = normalizeRepoPath(pathValue);
    if (!safePath) return '';
    const ext = fileExt(safePath);
    const stem = ext ? safePath.slice(0, -ext.length) : safePath;
    let nextPath = safePath;
    let index = 1;
    while (state.workspace.files.some((entry) => normalizeRepoPath(entry.path).toLowerCase() === nextPath.toLowerCase())) {
        index += 1;
        nextPath = `${stem}-${index}${ext}`;
    }
    return nextPath;
}

function detectFileMode(pathValue) {
    const ext = fileExt(pathValue);
    if (ext === '.md' || ext === '.markdown') return 'markdown';
    if (ext === '.fx') return 'shaderfx';
    if (ext === '.animcs') return 'csharp';
    if (VIDEO_FILE_EXTENSIONS.has(ext)) return 'video';
    if (IMAGE_FILE_EXTENSIONS.has(ext)) return 'image';
    return 'csharp';
}

function languageForFile(pathValue) {
    if (isAnimationCsharpFilePath(pathValue)) return 'csharp';
    const mode = detectFileMode(pathValue);
    if (mode === 'markdown') return 'markdown';
    if (mode === 'shaderfx') return 'shaderfx';
    if (mode === 'video') return 'plaintext';
    if (mode === 'image') return 'plaintext';
    return 'csharp';
}

function normalizeShaderPreviewPreset(value) {
    const safe = String(value || '').trim().toLowerCase();
    return SHADER_PREVIEW_PRESETS.has(safe) ? safe : 'checker';
}

function normalizeShaderPreviewRenderMode(value) {
    const safe = String(value || '').trim().toLowerCase();
    return SHADER_PREVIEW_RENDER_MODES.has(safe) ? safe : 'alpha';
}

function normalizeShaderPreviewAddressMode(value) {
    const safe = String(value || '').trim().toLowerCase();
    return SHADER_PREVIEW_ADDRESS_MODES.has(safe) ? safe : 'clamp';
}

function normalizeShaderPreviewBgMode(value) {
    const safe = String(value || '').trim().toLowerCase();
    return SHADER_PREVIEW_BG_MODES.has(safe) ? safe : 'transparent';
}

function shaderPreviewPresetLabel(value) {
    const safe = normalizeShaderPreviewPreset(value);
    if (safe === 'noise') return '噪声';
    if (safe === 'gradient') return '渐变';
    if (safe === 'rings') return '同心环';
    return '棋盘格';
}

function shaderPreviewRenderModeLabel(value) {
    const safe = normalizeShaderPreviewRenderMode(value);
    if (safe === 'additive') return 'Additive';
    if (safe === 'multiply') return 'Multiply';
    if (safe === 'screen') return 'Screen';
    return 'AlphaBlend';
}

function normalizeShaderUploadSlotIndex(value) {
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= SHADER_UPLOAD_SLOT_COUNT) {
        return -1;
    }
    return index;
}

function getShaderUploadSlot(index) {
    const safeIndex = normalizeShaderUploadSlotIndex(index);
    if (safeIndex < 0) return null;
    if (!state.shaderPreview || !Array.isArray(state.shaderPreview.shaderUploads)) return null;
    return state.shaderPreview.shaderUploads[safeIndex] || null;
}

function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            resolve(String(reader.result || ''));
        });
        reader.addEventListener('error', () => {
            reject(new Error('图片读取失败'));
        });
        reader.readAsDataURL(file);
    });
}

function shaderUploadSlotLabel(index) {
    const safeIndex = normalizeShaderUploadSlotIndex(index);
    if (safeIndex < 0) return 'uImage?';
    return `uImage${safeIndex}`;
}

function updateShaderUploadUi() {
    if (!Array.isArray(state.shaderPreview.shaderUploads)) {
        state.shaderPreview.shaderUploads = [null, null, null, null];
    }
    for (let i = 0; i < SHADER_UPLOAD_SLOT_COUNT; i += 1) {
        const entry = getShaderUploadSlot(i);
        const nameNode = Array.isArray(dom.shaderUploadNames) ? dom.shaderUploadNames[i] : null;
        const clearBtn = Array.isArray(dom.shaderUploadClearButtons) ? dom.shaderUploadClearButtons[i] : null;
        if (nameNode) {
            nameNode.textContent = entry && entry.name ? entry.name : '未上传';
            nameNode.title = entry && entry.name ? entry.name : '';
        }
        if (clearBtn) {
            clearBtn.disabled = !(entry && entry.dataUrl);
        }
    }
}

function ensureShaderUploadImage(dataUrl) {
    const safeDataUrl = String(dataUrl || '').trim();
    if (!safeDataUrl.startsWith('data:image/')) return null;
    if (shaderUploadImageCache.has(safeDataUrl)) {
        return shaderUploadImageCache.get(safeDataUrl);
    }
    const img = new Image();
    img.decoding = 'async';
    img.src = safeDataUrl;
    shaderUploadImageCache.set(safeDataUrl, img);
    return img;
}

function getShaderUploadImage(index) {
    const entry = getShaderUploadSlot(index);
    if (!entry || !entry.dataUrl) return null;
    const img = ensureShaderUploadImage(entry.dataUrl);
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return null;
    return img;
}

async function handleShaderUploadChange(slotIndex, event) {
    const safeSlot = normalizeShaderUploadSlotIndex(slotIndex);
    if (safeSlot < 0) return;
    const input = event && event.target ? event.target : null;
    const file = input && input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
        addEvent('error', `${shaderUploadSlotLabel(safeSlot)} 仅支持图片文件`);
        if (input) input.value = '';
        return;
    }
    if (Number(file.size || 0) > SHADER_UPLOAD_MAX_SIZE) {
        addEvent('error', `${shaderUploadSlotLabel(safeSlot)} 图片过大（>${Math.round(SHADER_UPLOAD_MAX_SIZE / (1024 * 1024))}MB）`);
        if (input) input.value = '';
        return;
    }
    const dataUrl = await readImageFileAsDataUrl(file);
    state.shaderPreview.shaderUploads[safeSlot] = {
        name: String(file.name || `upload-${safeSlot}.png`),
        dataUrl
    };
    if (input) input.value = '';
    updateShaderUploadUi();
    drawShaderPreviewCanvas();
    addEvent('info', `${shaderUploadSlotLabel(safeSlot)} 已上传：${file.name}`);
}

function clearShaderUploadSlot(slotIndex, options) {
    const safeSlot = normalizeShaderUploadSlotIndex(slotIndex);
    if (safeSlot < 0) return;
    const opts = options || {};
    const current = getShaderUploadSlot(safeSlot);
    if (!current) return;
    state.shaderPreview.shaderUploads[safeSlot] = null;
    updateShaderUploadUi();
    drawShaderPreviewCanvas();
    if (!opts.silent) {
        addEvent('info', `${shaderUploadSlotLabel(safeSlot)} 已清空`);
    }
}

function normalizeMarkdownRepoPath(pathValue) {
    let safe = normalizeRepoPath(pathValue);
    if (!safe) return '';
    safe = safe.replace(/^site\/content\//i, '');
    if (!/\.md$/i.test(safe)) return '';
    return `site/content/${safe}`;
}

function toViewerFileParam(pathValue) {
    return normalizeRepoPath(pathValue).replace(/^site\/content\//i, '');
}

function normalizeUrlPath(pathValue) {
    let safe = String(pathValue || '').trim();
    if (!safe) return '/';
    if (!safe.startsWith('/')) safe = `/${safe}`;
    safe = safe.replace(/\/{2,}/g, '/');
    if (safe.length > 1 && safe.endsWith('/')) {
        safe = safe.replace(/\/+$/, '');
    }
    return safe || '/';
}

function buildViewerPagePathCandidates() {
    const candidates = [];
    const appendCandidate = (pathValue) => {
        const safePath = normalizeUrlPath(pathValue);
        if (candidates.includes(safePath)) return;
        candidates.push(safePath);
    };
    const baseUrl = String(import.meta.env && import.meta.env.BASE_URL || '/');
    const basePrefix = normalizeUrlPath(baseUrl);
    const pathname = normalizeUrlPath(globalThis.location && globalThis.location.pathname || '/');
    const firstPathSegment = pathname.split('/').filter(Boolean)[0] || '';
    appendCandidate(`${basePrefix}/site/pages/viewer.html`);
    if (firstPathSegment && firstPathSegment.toLowerCase() !== 'site') {
        appendCandidate(`/${firstPathSegment}/site/pages/viewer.html`);
    }
    appendCandidate('/site/pages/viewer.html');
    return candidates;
}

async function resolveViewerPagePath() {
    if (viewerPagePathCache) return viewerPagePathCache;
    const candidates = buildViewerPagePathCandidates();
    for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        const probeUrl = `${candidate}?__tml_ide_probe=1&ts=${Date.now()}`;
        try {
            const response = await fetch(probeUrl, { method: 'GET', cache: 'no-store' });
            if (!(response && response.ok)) {
                continue;
            }
            const bodyText = await response.text();
            if (/public base url of/i.test(bodyText)) {
                continue;
            }
            if (/<title>\s*tml ide playground/i.test(bodyText)) {
                continue;
            }
            viewerPagePathCache = candidate;
            return candidate;
        } catch (_error) {
            // Ignore probe failures and continue fallback probing.
        }
    }
    viewerPagePathCache = candidates[0] || '/site/pages/viewer.html';
    return viewerPagePathCache;
}

async function buildViewerPageUrl(pathValue, options) {
    const opts = options || {};
    const viewerPath = await resolveViewerPagePath();
    const params = new URLSearchParams();
    if (opts.studioPreview) {
        params.set('studio_preview', '1');
    }
    if (opts.studioEmbed) {
        params.set('studio_embed', '1');
    }
    params.set('file', toViewerFileParam(pathValue));
    return `${viewerPath}?${params.toString()}`;
}

function buildMarkdownViewerPreviewPayload(markdownPath, markdownContent) {
    const targetPath = toViewerFileParam(markdownPath);
    const uploadedImages = [];
    const uploadedMedia = [];
    const uploadedCsharpFiles = [];
    const imagePathSet = new Set();
    const mediaPathSet = new Set();
    const csharpPathSet = new Set();

    const pathVariants = (pathValue) => {
        const safe = String(pathValue || '').trim();
        if (!safe) return [];
        const variants = [safe];
        if (!safe.startsWith('./') && !safe.startsWith('../') && !safe.startsWith('/')) {
            variants.push(`./${safe}`);
        }
        return variants;
    };

    const appendUploadedImage = (assetPath, dataUrl, name) => {
        pathVariants(assetPath).forEach((variantPath) => {
            if (!variantPath || imagePathSet.has(variantPath)) return;
            imagePathSet.add(variantPath);
            uploadedImages.push({
                assetPath: variantPath,
                dataUrl,
                name
            });
        });
    };

    const appendUploadedCsharpFile = (assetPath, content, name) => {
        pathVariants(assetPath).forEach((variantPath) => {
            if (!variantPath || csharpPathSet.has(variantPath)) return;
            csharpPathSet.add(variantPath);
            uploadedCsharpFiles.push({
                assetPath: variantPath,
                content,
                name
            });
        });
    };

    const appendUploadedMedia = (assetPath, dataUrl, name, type) => {
        pathVariants(assetPath).forEach((variantPath) => {
            if (!variantPath || mediaPathSet.has(variantPath)) return;
            mediaPathSet.add(variantPath);
            uploadedMedia.push({
                assetPath: variantPath,
                dataUrl,
                name,
                type
            });
        });
    };

    state.workspace.files.forEach((file) => {
        if (!file || !file.path) return;
        const mode = detectFileMode(file.path);
        const assetPath = toViewerFileParam(file.path);
        if (!assetPath) return;
        if (mode === 'image') {
            const dataUrl = String(file.content || '').trim();
            if (!dataUrl.startsWith('data:image/')) return;
            appendUploadedImage(assetPath, dataUrl, String(file.path).split('/').pop() || '');
            return;
        }
        if (mode === 'video') {
            const dataUrl = String(file.content || '').trim();
            if (!dataUrl.startsWith('data:video/')) return;
            appendUploadedMedia(assetPath, dataUrl, String(file.path).split('/').pop() || '', 'video');
            return;
        }
        if (mode === 'csharp') {
            appendUploadedCsharpFile(assetPath, String(file.content || ''), String(file.path).split('/').pop() || '');
        }
    });

    return {
        targetPath,
        markdown: String(markdownContent || ''),
        uploadedImages,
        uploadedMedia,
        uploadedCsharpFiles,
        updatedAt: new Date().toISOString()
    };
}

function persistMarkdownViewerPreviewPayload(payload) {
    try {
        localStorage.setItem(VIEWER_PREVIEW_STORAGE_KEY, JSON.stringify(payload || {}));
    } catch (_error) {
        // Ignore storage failures for preview sync.
    }
}

function postMarkdownViewerPreviewPayload(payload) {
    if (!dom.markdownPreviewFrame || !dom.markdownPreviewFrame.contentWindow) return;
    try {
        dom.markdownPreviewFrame.contentWindow.postMessage({
            type: VIEWER_PREVIEW_MESSAGE_TYPE,
            payload
        }, globalThis.location.origin);
    } catch (_error) {
        // Ignore cross-window message failures for preview sync.
    }
}

function sanitizeShaderSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 63);
}

function compileFxSource(code) {
    const text = String(code || '');
    const errors = [];
    if (!text.trim()) {
        errors.push({
            line: 1,
            column: 1,
            message: '文件内容为空'
        });
    }
    let depth = 0;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        for (let j = 0; j < line.length; j += 1) {
            const ch = line[j];
            if (ch === '{') depth += 1;
            if (ch === '}') {
                depth -= 1;
                if (depth < 0) {
                    errors.push({
                        line: i + 1,
                        column: j + 1,
                        message: '多余的右花括号 }'
                    });
                    depth = 0;
                }
            }
        }
        if (/^\s*#include\s+/i.test(line)) {
            errors.push({
                line: i + 1,
                column: 1,
                message: '当前在线编译不支持 #include'
            });
        }
    }
    if (depth > 0) {
        errors.push({ line: lines.length || 1, column: 1, message: '缺少右花括号 }' });
    }
    return {
        ok: errors.length === 0,
        errors,
        log: errors.length === 0
            ? '编译成功：语法检查通过。'
            : `编译失败：${errors.length} 条错误。`
    };
}

function shaderDefaultTemplate() {
    return [
        '// tModLoader 风格 .fx 默认模板（完整 HLSL）',
        '// 可用纹理: iChannel0-3（兼容 uImage0-3）',
        '// 后缀请使用 .fx',
        '',
        'sampler2D uImage0 : register(s0);',
        '',
        'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
        '{',
        '    float2 uv = texCoord;',
        '    float4 baseColor = tex2D(uImage0, uv);',
        '    return baseColor;',
        '}',
        '',
        'technique MainTechnique',
        '{',
        '    pass P0',
        '    {',
        '        PixelShader = compile ps_2_0 MainPS();',
        '    }',
        '}',
        ''
    ].join('\n');
}

function stripShaderCommentsAndStrings(text) {
    let raw = String(text || '');
    raw = raw.replace(/\/\*[\s\S]*?\*\//g, ' ');
    raw = raw.replace(/\/\/[^\n]*/g, ' ');
    raw = raw.replace(/"(?:\\.|[^"\\])*"/g, ' ');
    raw = raw.replace(/'(?:\\.|[^'\\])*'/g, ' ');
    return raw;
}

function collectShaderDynamicIdentifiers(sourceText) {
    const cleaned = stripShaderCommentsAndStrings(sourceText);
    const matches = cleaned.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
    const seen = new Set();
    const dynamic = [];
    matches.forEach((word) => {
        const safe = String(word || '');
        const key = safe.toLowerCase();
        if (!safe) return;
        if (SHADER_COMPLETION_RESERVED.has(key)) return;
        if (/^[xyzwrgba]{1,4}$/i.test(safe)) return;
        if (seen.has(key)) return;
        seen.add(key);
        dynamic.push(safe);
    });
    return dynamic;
}

function registerShaderFxLanguageSupport() {
    monaco.languages.register({ id: 'shaderfx' });

    monaco.languages.setLanguageConfiguration('shaderfx', {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' }
        ]
    });

    monaco.languages.setMonarchTokensProvider('shaderfx', {
        defaultToken: '',
        tokenPostfix: '.shaderfx',
        keywords: SHADER_KEYWORDS,
        types: SHADER_TYPES,
        functions: SHADER_FUNCTIONS,
        builtins: SHADER_BUILTINS,
        tokenizer: {
            root: [
                [/[a-zA-Z_][\w]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@types': 'type',
                        '@functions': 'function',
                        '@builtins': 'variable.predefined',
                        '@default': 'identifier'
                    }
                }],
                [/#\s*[A-Za-z_][A-Za-z0-9_]*/, 'keyword.directive'],
                [/\d*\.\d+([eE][\-+]?\d+)?[fFuU]?/, 'number.float'],
                [/\d+([eE][\-+]?\d+)?[fFuU]?/, 'number'],
                [/[{}()\[\]]/, '@brackets'],
                [/[;,.]/, 'delimiter'],
                [/--|[-+*/=<>!~?:&|^%]+/, 'operator'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
                [/"/, 'string', '@string'],
                [/'[^\\']'/, 'string'],
                [/'/, 'string.invalid']
            ],
            comment: [
                [/[^/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[/*]/, 'comment']
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape'],
                [/"/, 'string', '@pop']
            ]
        }
    });

    monaco.languages.registerCompletionItemProvider('shaderfx', {
        triggerCharacters: ['.', '_'],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const prefix = String(word && word.word || '');
            if (!prefix) {
                return { suggestions: [] };
            }

            const query = prefix.toLowerCase();
            const dictionary = Array.from(new Set([
                ...SHADER_COMPLETION_WORDS,
                ...collectShaderDynamicIdentifiers(model.getValue())
            ]));
            const items = dictionary
                .filter((entry) => String(entry || '').toLowerCase().startsWith(query))
                .sort((a, b) => String(a).localeCompare(String(b)))
                .slice(0, 40);

            const range = new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
            );

            return {
                suggestions: items.map((label) => ({
                    label,
                    kind: SHADER_TYPES.includes(label)
                        ? monaco.languages.CompletionItemKind.Class
                        : (SHADER_FUNCTIONS.includes(label)
                            ? monaco.languages.CompletionItemKind.Function
                            : (SHADER_BUILTINS.includes(label)
                                ? monaco.languages.CompletionItemKind.Variable
                                : monaco.languages.CompletionItemKind.Keyword)),
                    insertText: label,
                    range
                }))
            };
        }
    });
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
    const panel = normalizePanelName(url.searchParams.get('panel'));
    return { workspace: 'csharp', panel };
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
    if (dom.workspaceCsharpRoot) {
        dom.workspaceCsharpRoot.hidden = false;
    }
    if (dom.workspaceSubappRoot) {
        dom.workspaceSubappRoot.hidden = true;
    }
    if (state.editor) {
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

function snapshotHasStagedPayload(snapshot) {
    return !!(snapshot && typeof snapshot === 'object' && (
        Array.isArray(snapshot.files) ||
        typeof snapshot.targetPath === 'string' ||
        typeof snapshot.markdown === 'string' ||
        typeof snapshot.workspace === 'string'
    ));
}

function extractStagedSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    if (snapshot.staged && typeof snapshot.staged === 'object') {
        return snapshot.staged;
    }
    if (snapshotHasStagedPayload(snapshot)) {
        return snapshot;
    }
    return null;
}

function resolvePluginSnapshotForSave(workspace) {
    const plugin = getWorkspacePlugin(workspace);
    let pluginSnapshot = null;

    if (plugin && typeof plugin.getSnapshot === 'function') {
        pluginSnapshot = plugin.getSnapshot({
            dom,
            state,
            route: state.route
        });
    }

    const staged = extractStagedSnapshot(pluginSnapshot) || state.subapps.snapshotByWorkspace[workspace] || null;
    if (workspace === 'markdown') {
        if (pluginSnapshot && typeof pluginSnapshot === 'object' && !snapshotHasStagedPayload(pluginSnapshot)) {
            return {
                staged,
                legacyState: pluginSnapshot.legacyState && typeof pluginSnapshot.legacyState === 'object' ? pluginSnapshot.legacyState : null,
                viewerPreview: pluginSnapshot.viewerPreview && typeof pluginSnapshot.viewerPreview === 'object' ? pluginSnapshot.viewerPreview : null
            };
        }
        return { staged, legacyState: null, viewerPreview: null };
    }
    if (workspace === 'shader') {
        if (pluginSnapshot && typeof pluginSnapshot === 'object' && !snapshotHasStagedPayload(pluginSnapshot)) {
            return {
                staged,
                contributeState: pluginSnapshot.contributeState && typeof pluginSnapshot.contributeState === 'object' ? pluginSnapshot.contributeState : null,
                playgroundState: pluginSnapshot.playgroundState && typeof pluginSnapshot.playgroundState === 'object' ? pluginSnapshot.playgroundState : null,
                contributionDraft: pluginSnapshot.contributionDraft && typeof pluginSnapshot.contributionDraft === 'object' ? pluginSnapshot.contributionDraft : null
            };
        }
        return { staged, contributeState: null, playgroundState: null, contributionDraft: null };
    }
    return null;
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
        markdown: resolvePluginSnapshotForSave('markdown'),
        shader: resolvePluginSnapshotForSave('shader')
    };

    const workerApiUrl = normalizeWorkerApiUrl(dom.unifiedWorkerUrl ? dom.unifiedWorkerUrl.value : DEFAULT_WORKER_API_URL) || DEFAULT_WORKER_API_URL;
    const prTitle = String(dom.unifiedPrTitle ? dom.unifiedPrTitle.value : '').trim();
    const existingPrNumber = String(dom.unifiedExistingPrNumber ? dom.unifiedExistingPrNumber.value : '').trim();
    const anchorPath = String(dom.unifiedAnchorSelect ? dom.unifiedAnchorSelect.value : '').trim();
    const shaderSlug = sanitizeShaderSlug(dom.unifiedShaderSlug ? dom.unifiedShaderSlug.value : '');

    state.unifiedWorkspaceState.submit = {
        workerApiUrl,
        prTitle,
        existingPrNumber,
        anchorPath,
        shaderSlug,
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
            addEvent('error', `保存 workspace.v3 失败：${error.message}`);
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
    try {
        const snapshot = plugin.collectStaged({
            dom,
            state,
            route: state.route
        });
        const staged = extractStagedSnapshot(snapshot);
        if (staged) {
            state.subapps.snapshotByWorkspace[safeWorkspace] = staged;
        }
        scheduleUnifiedStateSave();
        return Promise.resolve(state.subapps.snapshotByWorkspace[safeWorkspace]);
    } catch (error) {
        addEvent('warn', `${safeWorkspace} staged 收集失败，沿用上次快照：${error.message}`);
        return Promise.resolve(state.subapps.snapshotByWorkspace[safeWorkspace]);
    }
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
    const safeWorkspace = 'csharp';
    state.route.workspace = safeWorkspace;
    updateWorkspaceButtons();
    applyWorkspaceLayout();

    await mountWorkspacePlugin('csharp', { forceReload: false });

    if (opts.persist !== false) {
        writeLastWorkspacePreference(safeWorkspace);
        scheduleUnifiedStateSave();
    }

    if (opts.syncUrl !== false) {
        syncRouteToUrl({ replace: !!opts.replaceUrl });
    }

    if (opts.collect !== false) {
        await requestWorkspaceCollect('markdown');
        await requestWorkspaceCollect('shader');
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
    setSubmitPanelRouteState(true, { syncUrl: opts.syncUrl !== false, replaceUrl: !!opts.replaceUrl });
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

function listWorkspaceEntries() {
    return state.workspace.files.map((file) => ({
        fileId: String(file.id || ''),
        path: String(file.path || ''),
        content: String(file.content || ''),
        mode: detectFileMode(file.path)
    }));
}

function resolveActiveMarkdownPath(collection) {
    const active = getActiveFile();
    const activeRepoPath = active ? normalizeMarkdownRepoPath(active.path) : '';
    if (activeRepoPath && collection.docs.markdownEntries.some((item) => item.path === activeRepoPath)) {
        return activeRepoPath;
    }
    return collection.docs.markdownEntries[0] ? collection.docs.markdownEntries[0].path : '';
}

function toCodePathForArticle(articleMarkdownPath, csharpFilePath) {
    const markdownPath = normalizeMarkdownRepoPath(articleMarkdownPath);
    if (!markdownPath) return '';
    const dir = markdownPath.replace(/^site\/content\//i, '').replace(/\/[^/]+$/, '');
    const codeName = sanitizeCsharpCodeFileName(csharpFilePath);
    return `site/content/${dir}/code/${codeName}`;
}

function buildUnifiedCollectionFromWorkspace() {
    const docs = {
        markdownEntries: [],
        extraEntries: [],
        blockedEntries: []
    };
    const shader = {
        fxEntries: [],
        blockedEntries: []
    };
    const blockedEntries = [];

    const entries = listWorkspaceEntries();
    entries.forEach((entry) => {
        if (!entry.path) return;
        if (!entry.content.trim()) {
            blockedEntries.push({ ...entry, reason: '内容为空' });
            return;
        }
        if (entry.mode === 'markdown') {
            const repoPath = normalizeMarkdownRepoPath(entry.path);
            if (!repoPath) {
                blockedEntries.push({ ...entry, reason: 'Markdown 路径非法' });
                return;
            }
            docs.markdownEntries.push({
                workspace: 'markdown',
                path: repoPath,
                content: entry.content,
                encoding: 'utf8',
                source: 'workspace-markdown',
                isMainMarkdown: true
            });
            return;
        }
        if (entry.mode === 'shaderfx') {
            shader.fxEntries.push({
                workspace: 'shader',
                path: normalizeRepoPath(entry.path),
                content: entry.content,
                source: 'workspace-shaderfx'
            });
            return;
        }
    });

    const csharpFiles = entries.filter((item) => item.mode === 'csharp');
    if (csharpFiles.length > 0) {
        let articlePath = resolveActiveMarkdownPath({ docs });
        const anchorPath = normalizeRepoPath(String(dom.unifiedAnchorSelect ? dom.unifiedAnchorSelect.value : '').trim());
        if (!articlePath && isMarkdownContentPath(anchorPath)) {
            articlePath = anchorPath;
        }
        if (!articlePath) {
            csharpFiles.forEach((item) => {
                blockedEntries.push({ ...item, reason: '仅 C# 提交时必须选择目标 Markdown 锚点' });
            });
        } else {
            csharpFiles.forEach((item) => {
                const path = toCodePathForArticle(articlePath, item.path);
                if (!isAllowedExtraFilePath(path)) {
                    blockedEntries.push({ ...item, reason: 'C# 目标路径非法' });
                    return;
                }
                docs.extraEntries.push({
                    workspace: 'csharp',
                    path,
                    content: item.content,
                    encoding: 'utf8',
                    source: 'workspace-csharp'
                });
            });
        }
    }

    blockedEntries.forEach((item) => {
        if (item.mode === 'shaderfx') shader.blockedEntries.push(item);
        else docs.blockedEntries.push(item);
    });

    return {
        collectedAt: new Date().toISOString(),
        docs,
        shader,
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

    const markdownEntries = collection && collection.docs && Array.isArray(collection.docs.markdownEntries)
        ? collection.docs.markdownEntries
        : [];
    markdownEntries.forEach((item) => {
        appendPath(item.path);
    });
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
    const markdownCount = collection && collection.docs ? collection.docs.markdownEntries.length : 0;
    const csharpCount = collection && collection.docs ? collection.docs.extraEntries.length : 0;
    const shaderFxCount = collection && collection.shader ? collection.shader.fxEntries.length : 0;
    const blockedCount = collection && Array.isArray(collection.blockedEntries) ? collection.blockedEntries.length : 0;
    dom.unifiedSummary.textContent = `文档: md ${markdownCount} + cs ${csharpCount} · Shader(.fx): ${shaderFxCount} · 阻塞: ${blockedCount}`;
}

function persistUnifiedCollection(collection) {
    state.unified.collection = collection;
    const docsEntries = collection && collection.docs
        ? collection.docs.extraEntries.concat(collection.docs.markdownEntries)
        : [];
    const shaderEntries = collection && collection.shader ? collection.shader.fxEntries : [];
    state.unified.sendableEntries = docsEntries.concat(shaderEntries);
    state.unified.blockedEntries = collection && Array.isArray(collection.blockedEntries) ? collection.blockedEntries : [];
    state.unified.markdownEntries = collection && collection.docs ? collection.docs.markdownEntries : [];
    renderUnifiedFileList(dom.unifiedSendableList, state.unified.sendableEntries, '暂无可提交文件。');
    renderUnifiedFileList(dom.unifiedBlockedList, state.unified.blockedEntries, '暂无需手工 PR 文件。');
    updateUnifiedSummary(collection);
    updateAnchorSelectOptions(collection);
    scheduleUnifiedStateSave();
}

async function collectUnifiedChanges(options) {
    const opts = options || {};
    const silent = !!opts.silent;
    const collection = buildUnifiedCollectionFromWorkspace();
    persistUnifiedCollection(collection);
    if (!silent) {
        setUnifiedSubmitStatus('已收集 staged 改动', 'success');
        pushUnifiedSubmitLog(`收集完成：文档 ${collection.docs.markdownEntries.length + collection.docs.extraEntries.length}，Shader ${collection.shader.fxEntries.length}，阻塞 ${collection.blockedEntries.length}`);
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
        const fromCollection = (collection.docs.markdownEntries || []).find((item) => item.path === preferred);
        if (fromCollection) {
            return { path: preferred, markdown: fromCollection.content };
        }
        const fetched = await loadMarkdownContentFromPath(preferred);
        return { path: preferred, markdown: fetched };
    }

    const firstMarkdown = collection && collection.docs && Array.isArray(collection.docs.markdownEntries) ? collection.docs.markdownEntries[0] : null;
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
    const safeCollection = collection || state.unified.collection || { docs: { markdownEntries: [], extraEntries: [] } };
    const markdownEntries = Array.isArray(safeCollection.docs.markdownEntries) ? safeCollection.docs.markdownEntries.slice() : [];
    const extraEntries = Array.isArray(safeCollection.docs.extraEntries) ? safeCollection.docs.extraEntries.slice() : [];

    if (!markdownEntries.length && !extraEntries.length) {
        return { batches: [], anchorPath: '' };
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
    const needsAnchor = batches.some((batch) => !batch.targetPath || !batch.markdown.trim());
    let anchorInfo = null;
    if (needsAnchor) {
        if (!selectedAnchorPath) {
            throw new Error('仅 C# 提交时必须先选择目标 Markdown 锚点');
        }
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

function buildShaderSubmitBatch(collection) {
    const fxEntries = collection && collection.shader && Array.isArray(collection.shader.fxEntries)
        ? collection.shader.fxEntries
        : [];
    if (!fxEntries.length) return null;

    const slug = sanitizeShaderSlug(dom.unifiedShaderSlug ? dom.unifiedShaderSlug.value : '');
    if (!slug) {
        throw new Error('请填写 Shader 投稿 Slug');
    }

    const active = getActiveFile();
    const activePath = active && detectFileMode(active.path) === 'shaderfx' ? normalizeRepoPath(active.path) : '';
    const primary = fxEntries.find((item) => normalizeRepoPath(item.path) === activePath) || fxEntries[0];
    const secondary = fxEntries.filter((item) => item !== primary);
    const dateStr = new Date().toISOString().slice(0, 10);
    const title = slug.replace(/-/g, ' ');

    const readmeLines = [
        `# ${title || slug}`,
        '',
        '由统一 IDE 自动生成的 Shader 投稿草稿。',
        '',
        '## 主 Shader',
        '',
        '```fx',
        String(primary.content || ''),
        '```'
    ];
    if (secondary.length > 0) {
        readmeLines.push('', '## 其他 .fx 文件');
        secondary.forEach((item) => {
            readmeLines.push('', `### ${String(item.path || '').split('/').pop() || 'shader.fx'}`, '', '```fx', String(item.content || ''), '```');
        });
    }

    const entryJson = {
        slug,
        title: title || slug,
        author: normalizeAuthSession().user || 'unknown',
        description: '由统一 IDE 自动生成，请补充描述。',
        shader: 'shader.json',
        cover: 'cover.webp',
        tags: ['playground'],
        updated_at: dateStr
    };

    const shaderJson = {
        common: '',
        passes: [
            {
                name: 'Pass 1',
                type: 'image',
                scale: 1,
                code: String(primary.content || ''),
                channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
            }
        ]
    };

    return {
        batches: [
            {
                targetPath: `shader-gallery/${slug}/README.md`,
                markdown: readmeLines.join('\n'),
                extraFiles: [
                    {
                        path: `site/content/shader-gallery/${slug}/entry.json`,
                        content: JSON.stringify(entryJson, null, 2),
                        encoding: 'utf8'
                    },
                    {
                        path: `site/content/shader-gallery/${slug}/shader.json`,
                        content: JSON.stringify(shaderJson, null, 2),
                        encoding: 'utf8'
                    }
                ]
            }
        ]
    };
}

async function buildSplitSubmitPlan(collection) {
    const docsPlan = await buildUnifiedSubmitBatches(collection);
    const shaderPlan = buildShaderSubmitBatch(collection);
    return {
        docsBatches: docsPlan && Array.isArray(docsPlan.batches) ? docsPlan.batches : [],
        shaderBatches: shaderPlan && Array.isArray(shaderPlan.batches) ? shaderPlan.batches : []
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

function channelPrefix(channel) {
    return channel === 'shader' ? 'Shader' : '文档';
}

async function runSubmitChannel(channel, batches, options) {
    const opts = options || {};
    if (!Array.isArray(batches) || batches.length === 0) {
        return { channel, skipped: true, prNumber: '' };
    }
    const workerApiUrl = opts.workerApiUrl;
    const authToken = opts.authToken;
    let existingPrNumber = String(opts.existingPrNumber || '').trim();
    const baseTitle = String(dom.unifiedPrTitle ? dom.unifiedPrTitle.value : '').trim();
    const prTitle = `${channelPrefix(channel)}: ${baseTitle || '统一IDE提交'}`;
    const startIndex = Math.max(0, Number(opts.startIndex || 0));
    let nextIndex = startIndex;
    try {
        for (let i = startIndex; i < batches.length; i += 1) {
            nextIndex = i;
            const batch = batches[i];
            const payload = {
                targetPath: String(batch.targetPath || ''),
                markdown: String(batch.markdown || ''),
                prTitle
            };
            if (existingPrNumber) payload.existingPrNumber = existingPrNumber;
            if (Array.isArray(batch.extraFiles) && batch.extraFiles.length > 0) {
                payload.extraFiles = batch.extraFiles.slice(0, 8).map((item) => ({
                    path: item.path,
                    content: item.content,
                    encoding: item.encoding === 'base64' ? 'base64' : 'utf8'
                }));
            }

            pushUnifiedSubmitLog(`[${channelPrefix(channel)}] 批次 ${i + 1}/${batches.length} -> ${payload.targetPath}`);
            const responseData = await submitBatchRequest(workerApiUrl, authToken, payload);
            if (responseData.prNumber) {
                existingPrNumber = String(responseData.prNumber);
            }
            pushUnifiedSubmitLog(`[${channelPrefix(channel)}] 批次 ${i + 1} 成功：PR #${existingPrNumber || '?'}`);
            nextIndex = i + 1;
        }
        return {
            channel,
            skipped: false,
            prNumber: existingPrNumber,
            resume: null,
            nextIndex
        };
    } catch (error) {
        const wrapped = new Error(String(error && error.message ? error.message : error));
        wrapped.meta = {
            nextIndex,
            existingPrNumber
        };
        throw wrapped;
    }
}

async function runSplitUnifiedSubmit(plan, options) {
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

    const docsResume = opts.resume && opts.resume.docs ? opts.resume.docs : null;
    const shaderResume = opts.resume && opts.resume.shader ? opts.resume.shader : null;
    setUnifiedSubmitting(true);
    setUnifiedSubmitStatus('双通道提交进行中...', 'info');
    try {
        const docsTask = runSubmitChannel('docs', plan.docsBatches || [], {
            workerApiUrl,
            authToken: auth.token,
            existingPrNumber: docsResume ? docsResume.existingPrNumber : '',
            startIndex: docsResume ? docsResume.nextIndex : 0
        });
        const shaderTask = runSubmitChannel('shader', plan.shaderBatches || [], {
            workerApiUrl,
            authToken: auth.token,
            existingPrNumber: shaderResume ? shaderResume.existingPrNumber : '',
            startIndex: shaderResume ? shaderResume.nextIndex : 0
        });

        const [docsResult, shaderResult] = await Promise.allSettled([docsTask, shaderTask]);
        const nextResume = { docs: null, shader: null };
        const errors = [];

        if (docsResult.status === 'fulfilled') {
            if (!docsResult.value.skipped) {
                pushUnifiedSubmitLog(`[文档] 完成：PR #${docsResult.value.prNumber || '?'}`);
            }
        } else {
            const reason = docsResult.reason;
            const resume = {
                batches: plan.docsBatches || [],
                nextIndex: Number(reason && reason.meta ? reason.meta.nextIndex : 0),
                existingPrNumber: String(reason && reason.meta ? reason.meta.existingPrNumber : ''),
                failedAt: new Date().toISOString(),
                message: String(reason && reason.message ? reason.message : reason)
            };
            nextResume.docs = resume;
            errors.push(`文档通道失败：${resume.message}`);
        }

        if (shaderResult.status === 'fulfilled') {
            if (!shaderResult.value.skipped) {
                pushUnifiedSubmitLog(`[Shader] 完成：PR #${shaderResult.value.prNumber || '?'}`);
            }
        } else {
            const reason = shaderResult.reason;
            const resume = {
                batches: plan.shaderBatches || [],
                nextIndex: Number(reason && reason.meta ? reason.meta.nextIndex : 0),
                existingPrNumber: String(reason && reason.meta ? reason.meta.existingPrNumber : ''),
                failedAt: new Date().toISOString(),
                message: String(reason && reason.message ? reason.message : reason)
            };
            nextResume.shader = resume;
            errors.push(`Shader 通道失败：${resume.message}`);
        }

        state.unified.resumeState = nextResume.docs || nextResume.shader ? nextResume : { docs: null, shader: null };
        if (errors.length > 0) {
            setUnifiedSubmitStatus(errors.join('；'), 'error');
            throw new Error(errors.join('；'));
        }
        setUnifiedSubmitStatus('双通道提交成功', 'success');
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

function restoreWorkspaceSnapshotsFromUnifiedState() {
    const snapshots = state.unifiedWorkspaceState && state.unifiedWorkspaceState.snapshots
        ? state.unifiedWorkspaceState.snapshots
        : {};

    ['markdown', 'shader'].forEach((workspace) => {
        const plugin = getWorkspacePlugin(workspace);
        if (!plugin || typeof plugin.restoreSnapshot !== 'function') return;
        const snapshot = snapshots && typeof snapshots === 'object' ? snapshots[workspace] : null;
        if (!snapshot || typeof snapshot !== 'object') return;
        plugin.restoreSnapshot(snapshot, { dom, state, route: state.route });
    });
}

function csharpWorkspaceFromUnifiedState() {
    const snapshots = state.unifiedWorkspaceState && state.unifiedWorkspaceState.snapshots;
    const csharp = snapshots && snapshots.csharp && typeof snapshots.csharp === 'object'
        ? snapshots.csharp
        : null;
    if (!csharp || !Array.isArray(csharp.files) || csharp.files.length <= 0) {
        return null;
    }
    return {
        schemaVersion: 1,
        activeFileId: String(csharp.files[0].id || ''),
        files: csharp.files.map((item, index) => ({
            id: String(item && item.id || `file-${index + 1}`),
            path: String(item && item.path || `File${index + 1}.cs`),
            content: String(item && item.content || '')
        }))
    };
}

function initializeUnifiedState(loadedState) {
    const initial = loadedState && typeof loadedState === 'object'
        ? loadedState
        : {
            lastWorkspace: 'csharp',
            snapshots: {
                csharp: { updatedAt: '', files: [] },
                markdown: { staged: null, legacyState: null, viewerPreview: null },
                shader: { staged: null, contributeState: null, playgroundState: null, contributionDraft: null }
            },
            submit: { workerApiUrl: '', prTitle: '', existingPrNumber: '', anchorPath: '', shaderSlug: '', resume: null, lastCollection: null }
        };
    state.unifiedWorkspaceState = initial;
    const markdownSnapshot = initial.snapshots && initial.snapshots.markdown ? initial.snapshots.markdown : null;
    const shaderSnapshot = initial.snapshots && initial.snapshots.shader ? initial.snapshots.shader : null;
    state.subapps.snapshotByWorkspace.markdown = extractStagedSnapshot(markdownSnapshot);
    state.subapps.snapshotByWorkspace.shader = extractStagedSnapshot(shaderSnapshot);
    const resume = initial.submit && initial.submit.resume ? initial.submit.resume : null;
    if (resume && (resume.docs || resume.shader)) {
        state.unified.resumeState = resume;
    } else {
        state.unified.resumeState = { docs: null, shader: null };
    }

    if (dom.unifiedWorkerUrl) {
        dom.unifiedWorkerUrl.value = normalizeWorkerApiUrl(initial.submit && initial.submit.workerApiUrl || DEFAULT_WORKER_API_URL) || DEFAULT_WORKER_API_URL;
    }
    if (dom.unifiedPrTitle) {
        dom.unifiedPrTitle.value = String(initial.submit && initial.submit.prTitle || '');
    }
    if (dom.unifiedExistingPrNumber) {
        dom.unifiedExistingPrNumber.value = String(initial.submit && initial.submit.existingPrNumber || '');
    }
    if (dom.unifiedShaderSlug) {
        dom.unifiedShaderSlug.value = sanitizeShaderSlug(initial.submit && initial.submit.shaderSlug || '');
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
    const rawTab = String(panelTab || 'problems');
    const availableTabs = dom.panelTabButtons.map((button) => String(button.dataset.panelTab || ''));
    const safeTab = availableTabs.includes(rawTab) ? rawTab : 'problems';
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
            detail: '新建 .cs/.md/.fx 文件',
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
            id: 'shader.compile.panel',
            label: 'Tools: Open Shader Compile Panel',
            detail: '切换到 编译 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('compile');
            }
        },
        {
            id: 'shader.error.panel',
            label: 'Tools: Open Shader Error Panel',
            detail: '切换到 报错 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('errors');
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
        setActivePanelTab('compile');
        addEvent('info', 'Extensions 视图映射到编译面板');
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

function activeFileMode() {
    const active = getActiveFile();
    return detectFileMode(active && active.path ? active.path : '');
}

function imagePreviewSrcFromActiveFile() {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'image') {
        return '';
    }
    const content = String(active.content || '').trim();
    if (!content) return '';
    if (content.startsWith('data:image/')) {
        return content;
    }
    return '';
}

function videoPreviewSrcFromActiveFile() {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'video') {
        return '';
    }
    const content = String(active.content || '').trim();
    if (!content) return '';
    if (content.startsWith('data:video/')) {
        return content;
    }
    return '';
}

function updateStatusLanguage() {
    if (!dom.statusLanguage) return;
    const mode = activeFileMode();
    const active = getActiveFile();
    if (mode === 'markdown') {
        dom.statusLanguage.textContent = 'Markdown';
        return;
    }
    if (mode === 'shaderfx') {
        dom.statusLanguage.textContent = 'Shader(.fx)';
        return;
    }
    if (mode === 'image') {
        dom.statusLanguage.textContent = 'Image';
        return;
    }
    if (mode === 'video') {
        dom.statusLanguage.textContent = 'Video';
        return;
    }
    if (active && isAnimationCsharpFilePath(active.path)) {
        dom.statusLanguage.textContent = 'C# (动画)';
        return;
    }
    dom.statusLanguage.textContent = 'C#';
}

function updateHeaderModeActions() {
    const mode = activeFileMode();
    const isMarkdown = mode === 'markdown';
    const isShader = mode === 'shaderfx';
    if (dom.btnMarkdownTogglePreview) dom.btnMarkdownTogglePreview.hidden = !isMarkdown;
    if (dom.btnMarkdownOpenViewer) dom.btnMarkdownOpenViewer.hidden = !isMarkdown;
    if (dom.btnShaderCompile) dom.btnShaderCompile.hidden = !isShader;
    if (dom.btnShaderPreviewPopup) {
        dom.btnShaderPreviewPopup.hidden = !isShader;
        dom.btnShaderPreviewPopup.textContent = state.ui.shaderPreviewModalOpen ? '关闭预览' : '渲染预览';
    }
    if (dom.btnShaderExport) dom.btnShaderExport.hidden = !isShader;
}

function setShaderPreviewModalOpen(open, options) {
    const opts = options || {};
    const allowOpen = activeFileMode() === 'shaderfx';
    const shouldOpen = !!open && allowOpen;
    state.ui.shaderPreviewModalOpen = shouldOpen;
    if (dom.shaderPreviewModal) {
        dom.shaderPreviewModal.hidden = !shouldOpen;
    }
    if (dom.appRoot) {
        dom.appRoot.classList.toggle('shader-preview-modal-open', shouldOpen);
    }
    if (dom.btnShaderPreviewPopup && allowOpen) {
        dom.btnShaderPreviewPopup.textContent = shouldOpen ? '关闭预览' : '渲染预览';
    }
    if (!shouldOpen) {
        if (opts.focusEditor !== false && state.editor) {
            state.editor.focus();
        }
        return;
    }

    syncShaderPreviewControls();
    ensureShaderPreviewLoop();
    drawShaderPreviewCanvas();
    if (opts.focus !== false && dom.shaderPresetImage) {
        dom.shaderPresetImage.focus();
    }
}

function setMarkdownPreviewMode(mode) {
    const next = mode === 'preview' ? 'preview' : 'edit';
    state.ui.markdownPreviewMode = next;
    const showingPreview = next === 'preview' && activeFileMode() === 'markdown';
    if (dom.editor) dom.editor.hidden = showingPreview;
    if (dom.markdownPreviewPane) dom.markdownPreviewPane.hidden = !showingPreview;
    if (dom.btnMarkdownTogglePreview) {
        dom.btnMarkdownTogglePreview.textContent = next === 'preview' ? '返回编辑' : '预览';
    }
    if (state.editor) {
        requestAnimationFrame(() => {
            if (state.editor) state.editor.layout();
        });
    }
}

function getActiveMarkdownContext() {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'markdown') {
        return null;
    }
    const model = ensureModelForFile(active);
    if (!model) return null;
    if (state.editor && state.editor.getModel() !== model) {
        state.editor.setModel(model);
    }
    return { active, model };
}

function getMarkdownContextForAction(actionLabel) {
    const ctx = getActiveMarkdownContext();
    if (ctx) return ctx;
    addEvent('error', `${String(actionLabel || '该操作')}仅支持 Markdown 文件`);
    return null;
}

function normalizeMarkdownDraftPath(pathValue) {
    const safe = normalizeRepoPath(pathValue).replace(/^site\/content\//i, '');
    if (!safe || !/\.md$/i.test(safe)) {
        return '';
    }
    return safe;
}

function ensureMarkdownDraftTargetFile(targetPath) {
    const safePath = normalizeMarkdownDraftPath(targetPath);
    if (!safePath) return null;

    const existed = state.workspace.files.find((file) => {
        return normalizeRepoPath(file.path).toLowerCase() === safePath.toLowerCase();
    });
    if (existed) {
        return existed;
    }

    const nextFile = {
        id: createFileId(),
        path: safePath,
        content: ''
    };
    state.workspace.files.push(nextFile);
    ensureModelForFile(nextFile);
    updateFileListUi();
    addEvent('info', `已创建草稿目标文件：${safePath}`);
    return nextFile;
}

function buildMarkdownDraftExportName(pathValue) {
    const safePath = normalizeMarkdownDraftPath(pathValue) || 'markdown-draft.md';
    const base = safePath.split('/').pop() || 'markdown-draft.md';
    const stem = base.replace(/\.md$/i, '') || 'markdown-draft';
    return `${stem}.draft.json`;
}

function markdownSelectionRange(model) {
    if (!state.editor) return null;
    const selection = state.editor.getSelection();
    if (selection) return selection;
    const position = state.editor.getPosition() || model.getPositionAt(model.getValueLength());
    return new monaco.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
}

function readMarkdownSelectionText(fallback) {
    const ctx = getActiveMarkdownContext();
    if (!ctx || !state.editor) return String(fallback || '');
    const model = state.editor.getModel();
    if (!model) return String(fallback || '');
    const selection = markdownSelectionRange(model);
    if (!selection) return String(fallback || '');
    const selected = String(model.getValueInRange(selection) || '').replace(/\s+/g, ' ').trim();
    return selected || String(fallback || '');
}

function wrapMarkdownSelection(prefix, suffix, placeholder) {
    const ctx = getActiveMarkdownContext();
    if (!ctx || !state.editor) return false;
    const model = state.editor.getModel();
    if (!model) return false;
    const selection = markdownSelectionRange(model);
    if (!selection) return false;

    const selected = String(model.getValueInRange(selection) || '');
    const content = selected || String(placeholder || '内容');
    const inserted = `${String(prefix || '')}${content}${String(suffix || '')}`;
    const startOffset = model.getOffsetAt({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn
    });
    state.editor.executeEdits('markdown-tool-wrap', [{
        range: selection,
        text: inserted,
        forceMoveMarkers: true
    }]);
    const caretStart = model.getPositionAt(startOffset + String(prefix || '').length);
    const caretEnd = model.getPositionAt(startOffset + String(prefix || '').length + content.length);
    state.editor.setSelection(new monaco.Selection(
        caretStart.lineNumber,
        caretStart.column,
        caretEnd.lineNumber,
        caretEnd.column
    ));
    state.editor.focus();
    return true;
}

function insertMarkdownBlockSnippet(snippet, selectText) {
    const ctx = getActiveMarkdownContext();
    if (!ctx || !state.editor) return false;
    const model = state.editor.getModel();
    if (!model) return false;
    const selection = markdownSelectionRange(model);
    if (!selection) return false;

    const startOffset = model.getOffsetAt({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn
    });
    const endOffset = model.getOffsetAt({
        lineNumber: selection.endLineNumber,
        column: selection.endColumn
    });
    const value = model.getValue();
    const before = value.slice(0, startOffset);
    const after = value.slice(endOffset);
    const body = String(snippet || '');
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    const suffix = after && !after.startsWith('\n') ? '\n' : '';
    const inserted = `${prefix}${body}${suffix}`;

    state.editor.executeEdits('markdown-tool-block', [{
        range: selection,
        text: inserted,
        forceMoveMarkers: true
    }]);

    let caretStartOffset = startOffset + prefix.length;
    let caretEndOffset = caretStartOffset;
    const marker = String(selectText || '');
    if (marker) {
        const markerIndex = body.indexOf(marker);
        if (markerIndex >= 0) {
            caretStartOffset = startOffset + prefix.length + markerIndex;
            caretEndOffset = caretStartOffset + marker.length;
        }
    }
    const caretStart = model.getPositionAt(caretStartOffset);
    const caretEnd = model.getPositionAt(caretEndOffset);
    state.editor.setSelection(new monaco.Selection(
        caretStart.lineNumber,
        caretStart.column,
        caretEnd.lineNumber,
        caretEnd.column
    ));
    state.editor.focus();
    return true;
}

function insertMarkdownAtCursor(text) {
    const ctx = getActiveMarkdownContext();
    if (!ctx || !state.editor) return false;
    const model = state.editor.getModel();
    if (!model) return false;
    const position = state.editor.getPosition() || model.getPositionAt(model.getValueLength());
    const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
    state.editor.executeEdits('markdown-tool', [{ range, text: String(text || ''), forceMoveMarkers: true }]);
    state.editor.focus();
    return true;
}

function createMarkdownQuizId(prefix) {
    const safePrefix = String(prefix || 'quiz').trim() || 'quiz';
    return `${safePrefix}-${Date.now().toString(36).slice(-6)}`;
}

function applyMarkdownInsertAction(action) {
    const key = String(action || '').trim();
    if (!key) return;

    if (activeFileMode() !== 'markdown') {
        addEvent('error', '格式插入仅支持 Markdown 文件');
        return;
    }

    if (key === 'bold') {
        wrapMarkdownSelection('**', '**', '加粗文本');
        return;
    }
    if (key === 'h2') {
        insertMarkdownBlockSnippet('## 小节标题\n', '小节标题');
        return;
    }
    if (key === 'list') {
        insertMarkdownBlockSnippet('- 项目 1\n- 项目 2\n', '项目 1');
        return;
    }
    if (key === 'quote') {
        insertMarkdownBlockSnippet('> 这里是引用内容\n', '这里是引用内容');
        return;
    }
    if (key === 'ref') {
        const selectedTitle = readMarkdownSelectionText('引用标题');
        insertMarkdownBlockSnippet(`[${selectedTitle}](目标文档.md)\n`, '目标文档.md');
        return;
    }
    if (key === 'anim') {
        insertMarkdownBlockSnippet('{{anim:anims/你的动画文件.cs}}\n', 'anims/你的动画文件.cs');
        return;
    }
    if (key === 'animcs-block') {
        insertMarkdownBlockSnippet([
            '```animcs',
            'anims/demo-basic.cs',
            '```',
            ''
        ].join('\n'), 'anims/demo-basic.cs');
        return;
    }
    if (key === 'color-inline') {
        insertMarkdownBlockSnippet('{color:primary}{这里是强调文本}\n', 'primary');
        return;
    }
    if (key === 'color-change-inline') {
        insertMarkdownBlockSnippet('{colorChange:rainbow}{这里是颜色动画文本}\n', 'rainbow');
        return;
    }
    if (key === 'quiz-tf') {
        const quizId = createMarkdownQuizId('quiz-tf');
        const question = readMarkdownSelectionText('这里填写判断题题干。');
        insertMarkdownBlockSnippet([
            '```quiz',
            'type: tf',
            `id: ${quizId}`,
            'question: |',
            `  ${question}`,
            'answer: true',
            'explain: |',
            '  这里填写解析。',
            '```',
            ''
        ].join('\n'), `  ${question}`);
        return;
    }
    if (key === 'quiz-choice') {
        const quizId = createMarkdownQuizId('quiz-choice');
        const question = readMarkdownSelectionText('这里填写选择题题干。');
        insertMarkdownBlockSnippet([
            '```quiz',
            'type: choice',
            `id: ${quizId}`,
            'question: |',
            `  ${question}`,
            'options:',
            '  - id: A',
            '    text: 选项 A',
            '  - id: B',
            '    text: 选项 B',
            '  - id: C',
            '    text: 选项 C',
            'answer: B',
            'explain: |',
            '  这里填写解析。',
            '```',
            ''
        ].join('\n'), '选项 B');
        return;
    }
    if (key === 'quiz-multi') {
        const quizId = createMarkdownQuizId('quiz-multi');
        const question = readMarkdownSelectionText('这里填写多选题题干。');
        insertMarkdownBlockSnippet([
            '```quiz',
            'type: multiple',
            `id: ${quizId}`,
            'question: |',
            `  ${question}`,
            'options:',
            '  - id: A',
            '    text: 选项 A',
            '  - id: B',
            '    text: 选项 B',
            '  - id: C',
            '    text: 选项 C',
            '  - id: D',
            '    text: 选项 D',
            'answer:',
            '  - A',
            '  - C',
            'explain: |',
            '  这里填写解析。',
            '```',
            ''
        ].join('\n'), '选项 A');
        return;
    }

    addEvent('error', `未识别的格式插入命令：${key}`);
}

function collectClipboardImageFiles(clipboardData) {
    if (!clipboardData) return [];
    const files = [];
    const items = Array.from(clipboardData.items || []);
    items.forEach((item) => {
        if (!item || item.kind !== 'file') return;
        if (!String(item.type || '').toLowerCase().startsWith('image/')) return;
        const file = item.getAsFile();
        if (file) files.push(file);
    });
    if (files.length > 0) {
        return files;
    }
    return Array.from(clipboardData.files || []).filter((file) => {
        return file && String(file.type || '').toLowerCase().startsWith('image/');
    });
}

function pastedImageFileName(file, index) {
    const sourceName = String(file && file.name || '');
    const stem = sourceName.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9\u4e00-\u9fa5_-]+/gi, '-');
    const fallback = `pasted-image-${index + 1}`;
    const safe = String(stem || fallback).replace(/^-+|-+$/g, '');
    return safe || fallback;
}

function detectImageExtensionFromPasteFile(file) {
    const type = String(file && file.type || '').toLowerCase();
    if (type && MARKDOWN_PASTE_EXTENSION_BY_MIME[type]) {
        return MARKDOWN_PASTE_EXTENSION_BY_MIME[type];
    }
    return normalizeImageExtension(fileExt(String(file && file.name || '')));
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(String(reader.result || ''));
        };
        reader.onerror = () => {
            reject(new Error('读取图片失败'));
        };
        reader.readAsDataURL(file);
    });
}

function createWorkspaceImageFileFromPaste(file, options) {
    const opts = options || {};
    const markdownFile = opts.markdownFile || getActiveFile();
    if (!markdownFile || detectFileMode(markdownFile.path) !== 'markdown') {
        return null;
    }
    const imageDataUrl = String(opts.dataUrl || '');
    if (!imageDataUrl.startsWith('data:image/')) {
        return null;
    }

    const index = Math.max(0, Number(opts.index || 0));
    const alt = pastedImageFileName(file, index);
    const ext = detectImageExtensionFromPasteFile(file);
    const markdownDir = dirnameRepoPath(markdownFile.path);
    const imageDir = joinRepoPathParts(markdownDir, 'images');
    const desiredPath = joinRepoPathParts(imageDir, `${alt}${ext}`);
    const filePath = ensureUniqueWorkspacePath(desiredPath);
    if (!filePath) return null;

    return {
        file: {
            id: createFileId(),
            path: filePath,
            content: imageDataUrl
        },
        markdownPath: relativeRepoPathFromFile(markdownFile.path, filePath) || `./${String(filePath).split('/').pop() || 'image'}`,
        alt
    };
}

async function insertPastedMarkdownImages(fileList) {
    const ctx = getActiveMarkdownContext();
    if (!ctx) return 0;

    const files = Array.from(fileList || []);
    if (!files.length) return 0;

    const limited = files.slice(0, MARKDOWN_PASTE_MAX_IMAGE_COUNT);
    if (files.length > MARKDOWN_PASTE_MAX_IMAGE_COUNT) {
        addEvent('warn', `最多一次粘贴 ${MARKDOWN_PASTE_MAX_IMAGE_COUNT} 张图片，已自动截断`);
    }

    const snippets = [];
    const createdFileIds = [];
    for (let i = 0; i < limited.length; i += 1) {
        const file = limited[i];
        if (!file) continue;
        if (Number(file.size || 0) > MARKDOWN_PASTE_MAX_IMAGE_SIZE) {
            addEvent('warn', `已跳过过大图片：${file.name || `image-${i + 1}`}`);
            continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
            addEvent('warn', `图片编码失败，已跳过：${file.name || `image-${i + 1}`}`);
            continue;
        }
        const record = createWorkspaceImageFileFromPaste(file, {
            index: i,
            dataUrl,
            markdownFile: ctx.active
        });
        if (!record || !record.file || !record.markdownPath) {
            addEvent('warn', `图片写入工作区失败，已跳过：${file.name || `image-${i + 1}`}`);
            continue;
        }
        state.workspace.files.push(record.file);
        ensureModelForFile(record.file);
        createdFileIds.push(record.file.id);
        snippets.push(`![${record.alt}](${record.markdownPath})`);
    }

    if (!snippets.length) return 0;
    updateFileListUi();
    scheduleWorkspaceSave();

    const inserted = insertMarkdownBlockSnippet(`\n${snippets.join('\n\n')}\n`);
    if (!inserted) {
        if (createdFileIds.length) {
            state.workspace.files = state.workspace.files.filter((file) => !createdFileIds.includes(file.id));
            createdFileIds.forEach((fileId) => removeModelForFile(fileId));
            updateFileListUi();
            scheduleWorkspaceSave();
        }
        return 0;
    }
    addEvent('info', `已粘贴图片 ${snippets.length} 张`);
    return snippets.length;
}

function isMarkdownEditorFocused() {
    if (activeFileMode() !== 'markdown') return false;
    const active = globalThis.document ? document.activeElement : null;
    if (dom.editor && active && dom.editor.contains(active)) {
        return true;
    }
    return !!(state.editor && typeof state.editor.hasTextFocus === 'function' && state.editor.hasTextFocus());
}

function getActiveShaderContext() {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'shaderfx') {
        return null;
    }
    const model = ensureModelForFile(active);
    if (!model) return null;
    if (state.editor && state.editor.getModel() !== model) {
        state.editor.setModel(model);
    }
    return { active, model };
}

function insertShaderDefaultTemplateForActiveFile(options) {
    const opts = options || {};
    const ctx = getActiveShaderContext();
    if (!ctx) {
        addEvent('error', '插入默认模板仅支持 .fx 文件');
        return false;
    }

    const current = String(ctx.model.getValue() || '').trim();
    if (current && !opts.force && !globalThis.confirm('当前 .fx 文件已有内容，确认覆盖为默认模板吗？')) {
        return false;
    }

    ctx.model.setValue(shaderDefaultTemplate());
    if (state.editor) {
        state.editor.setPosition({ lineNumber: 1, column: 1 });
        state.editor.focus();
    }
    addEvent('info', '已插入 Shader 默认模板');
    return true;
}

function markdownTemplateBlock() {
    return [
        '---',
        'title: 新文章',
        'author: ',
        'topic: article-contribution',
        'description: ',
        '---',
        '',
        '# 标题',
        '',
        '## 概述',
        '',
        '## 正文',
        '',
        '## 小结',
        ''
    ].join('\n');
}

function formatMarkdownText(input) {
    const normalized = String(input || '').replace(/\r\n/g, '\n');
    const lines = normalized.split('\n').map((line) => line.replace(/[ \t]+$/g, ''));
    const compact = [];
    let blankCount = 0;
    lines.forEach((line) => {
        if (!line.trim()) {
            blankCount += 1;
            if (blankCount <= 2) compact.push('');
            return;
        }
        blankCount = 0;
        compact.push(line);
    });
    return `${compact.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

function parseMarkdownDraftPayload(rawText) {
    const parsed = JSON.parse(String(rawText || '{}'));
    const markdown = typeof parsed.markdown === 'string'
        ? parsed.markdown
        : (parsed && parsed.state && typeof parsed.state.markdown === 'string' ? parsed.state.markdown : '');
    const targetPath = typeof parsed.targetPath === 'string'
        ? parsed.targetPath
        : (parsed && parsed.state && typeof parsed.state.targetPath === 'string' ? parsed.state.targetPath : '');
    return {
        markdown: String(markdown || ''),
        targetPath: String(targetPath || '')
    };
}

function runMarkdownDraftCheck(markdownText) {
    const text = String(markdownText || '').replace(/\r\n/g, '\n');
    const errors = [];
    const warnings = [];

    const hasFrontMatter = text.startsWith('---\n');
    if (!hasFrontMatter) {
        errors.push('缺少 YAML front matter（应以 --- 开始）。');
    } else {
        const end = text.indexOf('\n---\n', 4);
        if (end < 0) {
            errors.push('front matter 未正确闭合（缺少结尾 ---）。');
        } else {
            const frontMatter = text.slice(4, end);
            if (!/^\s*title\s*:\s*.+$/m.test(frontMatter)) {
                errors.push('front matter 缺少必填字段 title。');
            }
        }
    }

    if (!/^#\s+\S+/m.test(text)) {
        warnings.push('建议至少包含一个一级标题（# 标题）。');
    }
    if (/[ \t]+$/m.test(text)) {
        warnings.push('检测到行尾空白字符，建议格式化。');
    }
    if (/\b(?:TODO|TBD)\b|待补充|占位/i.test(text)) {
        warnings.push('检测到占位词（TODO/TBD/待补充），发布前请清理。');
    }
    const imageRefs = Array.from(text.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)).map((item) => String(item[1] || '').trim());
    imageRefs.forEach((ref) => {
        if (!ref) return;
        if (/^https?:\/\//i.test(ref)) return;
        if (/\s/.test(ref)) {
            warnings.push(`图片路径包含空格：${ref}`);
        }
    });

    const lines = [];
    lines.push(`[${nowStamp()}] 发布前自检结果`);
    if (!errors.length && !warnings.length) {
        lines.push('通过：未发现阻塞问题。');
    } else {
        errors.forEach((msg, index) => {
            lines.push(`错误 ${index + 1}: ${msg}`);
        });
        warnings.forEach((msg, index) => {
            lines.push(`警告 ${index + 1}: ${msg}`);
        });
    }
    return {
        errors,
        warnings,
        log: lines.join('\n')
    };
}

function renderMarkdownDraftCheckLog(text) {
    if (!dom.markdownDraftCheckLog) return;
    dom.markdownDraftCheckLog.textContent = String(text || '等待自检...');
}

function toggleMarkdownFocusMode() {
    state.ui.markdownFocusMode = !state.ui.markdownFocusMode;
    if (state.ui.markdownFocusMode) {
        showSidebar(false);
        addEvent('info', '已进入 Markdown 专注模式');
    } else {
        showSidebar(true);
        addEvent('info', '已退出 Markdown 专注模式');
    }
    if (dom.btnMdFocusMode) {
        dom.btnMdFocusMode.textContent = state.ui.markdownFocusMode ? '退出专注模式' : '专注模式';
    }
}

async function saveWorkspaceImmediate() {
    await saveWorkspace(workspaceSnapshotForSave());
    scheduleUnifiedStateSave();
}

function renderShaderCompilePanel(result) {
    if (dom.shaderCompileLog) {
        dom.shaderCompileLog.textContent = String(result && result.log || '等待编译...');
    }
    if (!dom.shaderErrorList) return;
    dom.shaderErrorList.innerHTML = '';
    const errors = Array.isArray(result && result.errors) ? result.errors : [];
    if (!errors.length) {
        const li = document.createElement('li');
        li.className = 'problems-empty';
        li.textContent = '暂无编译错误。';
        dom.shaderErrorList.appendChild(li);
        return;
    }
    errors.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'problem-item';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'problem-jump';
        btn.textContent = `Ln ${item.line}, Col ${item.column} · ${item.message}`;
        btn.addEventListener('click', () => {
            if (!state.editor) return;
            state.editor.setPosition({ lineNumber: Number(item.line || 1), column: Number(item.column || 1) });
            state.editor.revealLineInCenter(Number(item.line || 1));
            state.editor.focus();
        });
        li.appendChild(btn);
        dom.shaderErrorList.appendChild(li);
    });
}

function shaderPreviewImageCanvas(preset) {
    const safePreset = normalizeShaderPreviewPreset(preset);
    if (shaderPreviewPresetCache.has(safePreset)) {
        return shaderPreviewPresetCache.get(safePreset);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (safePreset === 'noise') {
        const imageData = ctx.createImageData(256, 256);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const v = (Math.random() * 255) | 0;
            imageData.data[i] = v;
            imageData.data[i + 1] = v;
            imageData.data[i + 2] = v;
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    } else if (safePreset === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0, '#1f93ff');
        grad.addColorStop(0.5, '#7f4dff');
        grad.addColorStop(1, '#ffd65a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
    } else if (safePreset === 'rings') {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 10; i += 1) {
            const ratio = i / 10;
            ctx.strokeStyle = `hsla(${Math.round(ratio * 300)}, 85%, 65%, 0.9)`;
            ctx.lineWidth = 2 + (i % 2);
            ctx.beginPath();
            ctx.arc(128, 128, 14 + i * 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        for (let y = 0; y < 16; y += 1) {
            for (let x = 0; x < 16; x += 1) {
                const v = (x + y) % 2 ? 36 : 220;
                ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
                ctx.fillRect(x * 16, y * 16, 16, 16);
            }
        }
    }

    shaderPreviewPresetCache.set(safePreset, canvas);
    return canvas;
}

function drawShaderPreviewCheckerboard(ctx, width, height, size) {
    const cell = Math.max(4, Number(size || 16));
    for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
            const dark = ((x / cell + y / cell) % 2) > 0.5;
            ctx.fillStyle = dark ? '#272a2d' : '#4d5157';
            ctx.fillRect(x, y, cell, cell);
        }
    }
}

function updateShaderPreviewStatus() {
    if (!dom.shaderPreviewStatus) return;
    const mode = shaderPreviewRenderModeLabel(state.shaderPreview.renderMode);
    const preset = shaderPreviewPresetLabel(state.shaderPreview.presetImage);
    const address = normalizeShaderPreviewAddressMode(state.shaderPreview.addressMode);
    const bg = normalizeShaderPreviewBgMode(state.shaderPreview.bgMode);
    const uploads = [];
    for (let i = 0; i < SHADER_UPLOAD_SLOT_COUNT; i += 1) {
        if (getShaderUploadSlot(i)) {
            uploads.push(`uImage${i}`);
        }
    }
    const uploadText = uploads.length ? uploads.join(', ') : '无';
    dom.shaderPreviewStatus.textContent = `预设: ${preset} · 渲染: ${mode} · 采样: ${address} · 背景: ${bg} · 上传: ${uploadText}`;
}

function syncShaderPreviewControls() {
    if (dom.shaderPresetImage) {
        dom.shaderPresetImage.value = normalizeShaderPreviewPreset(state.shaderPreview.presetImage);
    }
    if (dom.shaderRenderMode) {
        dom.shaderRenderMode.value = normalizeShaderPreviewRenderMode(state.shaderPreview.renderMode);
    }
    if (dom.shaderAddressMode) {
        dom.shaderAddressMode.value = normalizeShaderPreviewAddressMode(state.shaderPreview.addressMode);
    }
    if (dom.shaderBgMode) {
        dom.shaderBgMode.value = normalizeShaderPreviewBgMode(state.shaderPreview.bgMode);
    }
    updateShaderUploadUi();
}

function drawShaderPreviewTextureLayer(ctx, texture, width, height, addressMode, offsetX, offsetY, alpha, composite) {
    if (!ctx || !texture) return;
    const safeAddressMode = normalizeShaderPreviewAddressMode(addressMode);
    const safeAlpha = Number.isFinite(alpha) ? alpha : 1;
    const safeComposite = composite || 'source-over';
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, safeAlpha));
    ctx.globalCompositeOperation = safeComposite;
    if (safeAddressMode === 'wrap') {
        const pattern = ctx.createPattern(texture, 'repeat');
        if (pattern) {
            ctx.translate(Math.round(offsetX || 0), Math.round(offsetY || 0));
            ctx.fillStyle = pattern;
            ctx.fillRect(
                -Math.abs(Math.round(offsetX || 0)),
                -Math.abs(Math.round(offsetY || 0)),
                width + Math.abs(Math.round(offsetX || 0)) * 2,
                height + Math.abs(Math.round(offsetY || 0)) * 2
            );
        }
    } else {
        ctx.drawImage(texture, 0, 0, width, height);
    }
    ctx.restore();
}

function drawShaderPreviewCanvas() {
    if (!dom.shaderPreviewCanvas) return;
    const canvas = dom.shaderPreviewCanvas;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.max(1, Number(globalThis.devicePixelRatio || 1));
    const targetWidth = Math.max(1, Math.round(rect.width * dpr));
    const targetHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const timeSec = performance.now() / 1000;
    const bgMode = normalizeShaderPreviewBgMode(state.shaderPreview.bgMode);
    const addressMode = normalizeShaderPreviewAddressMode(state.shaderPreview.addressMode);
    const renderMode = normalizeShaderPreviewRenderMode(state.shaderPreview.renderMode);
    const presetCanvas = shaderPreviewImageCanvas(state.shaderPreview.presetImage);
    const baseTexture = getShaderUploadImage(0) || presetCanvas;
    const overlayTexture = getShaderUploadImage(1);

    ctx.clearRect(0, 0, width, height);
    if (bgMode === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
    } else {
        drawShaderPreviewCheckerboard(ctx, width, height, Math.max(8, Math.round(16 * dpr)));
    }

    if (baseTexture) {
        drawShaderPreviewTextureLayer(
            ctx,
            baseTexture,
            width,
            height,
            addressMode,
            -Math.round(timeSec * 42),
            -Math.round(timeSec * 24),
            1,
            'source-over'
        );
    }

    if (overlayTexture) {
        let composite = 'source-over';
        let alpha = 0.45;
        if (renderMode === 'additive') {
            composite = 'lighter';
            alpha = 0.8;
        } else if (renderMode === 'multiply') {
            composite = 'multiply';
            alpha = 0.86;
        } else if (renderMode === 'screen') {
            composite = 'screen';
            alpha = 0.74;
        }
        drawShaderPreviewTextureLayer(
            ctx,
            overlayTexture,
            width,
            height,
            addressMode,
            -Math.round(timeSec * 18),
            -Math.round(timeSec * 12),
            alpha,
            composite
        );
    }

    const active = getActiveFile();
    const compileErrors = Array.isArray(state.shaderCompile.errors) ? state.shaderCompile.errors.length : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(14, 16, 20, 0.74)';
    ctx.fillRect(12 * dpr, height - 40 * dpr, Math.min(width - 24 * dpr, 420 * dpr), 28 * dpr);
    ctx.fillStyle = compileErrors > 0 ? '#ff9d82' : '#99e29f';
    ctx.font = `${11 * dpr}px "Segoe UI", sans-serif`;
    ctx.textBaseline = 'middle';
    const fileName = active ? String(active.path || '').split('/').pop() : 'shader.fx';
    const statusText = compileErrors > 0
        ? `${fileName} · 编译错误 ${compileErrors}`
        : `${fileName} · 编译通过`;
    ctx.fillText(statusText, 18 * dpr, height - 26 * dpr);
    ctx.restore();

    updateShaderPreviewStatus();
}

function stopShaderPreviewLoop() {
    if (!state.shaderPreview.rafId) return;
    cancelAnimationFrame(state.shaderPreview.rafId);
    state.shaderPreview.rafId = 0;
}

function ensureShaderPreviewLoop() {
    if (state.shaderPreview.rafId) return;
    const tick = () => {
        state.shaderPreview.rafId = requestAnimationFrame(tick);
        if (activeFileMode() !== 'shaderfx' || !state.ui.shaderPreviewModalOpen) {
            stopShaderPreviewLoop();
            return;
        }
        drawShaderPreviewCanvas();
    };
    tick();
}

function applyEditorModeUi() {
    const mode = activeFileMode();
    const isMarkdown = mode === 'markdown';
    const isShader = mode === 'shaderfx';
    const isImage = mode === 'image';
    const isVideo = mode === 'video';
    const isResourcePreview = isImage || isVideo;
    updateStatusLanguage();
    updateHeaderModeActions();
    if (dom.markdownToolboxGroup) {
        dom.markdownToolboxGroup.hidden = !isMarkdown;
    }
    if (dom.shaderCompileGroup) {
        dom.shaderCompileGroup.hidden = !isShader;
    }
    if (dom.btnMdFocusMode) {
        dom.btnMdFocusMode.textContent = state.ui.markdownFocusMode ? '退出专注模式' : '专注模式';
    }
    if (!isMarkdown) {
        setMarkdownPreviewMode('edit');
        if (state.ui.markdownFocusMode) {
            state.ui.markdownFocusMode = false;
            showSidebar(true);
        }
    } else {
        setMarkdownPreviewMode(state.ui.markdownPreviewMode);
        if (state.ui.markdownPreviewMode === 'preview') {
            openMarkdownViewerPreview(false).catch(() => {});
        }
    }
    if (dom.imagePreviewPane) {
        dom.imagePreviewPane.hidden = !isImage;
        dom.imagePreviewPane.style.display = isImage ? 'flex' : 'none';
    }
    if (dom.videoPreviewPane) {
        dom.videoPreviewPane.hidden = !isVideo;
        dom.videoPreviewPane.style.display = isVideo ? 'flex' : 'none';
    }
    if (dom.imagePreviewImage) {
        if (isImage) {
            dom.imagePreviewImage.src = imagePreviewSrcFromActiveFile();
            const active = getActiveFile();
            dom.imagePreviewImage.alt = active ? `${active.path} 预览` : '图片预览';
        } else {
            dom.imagePreviewImage.removeAttribute('src');
            dom.imagePreviewImage.alt = '图片预览';
        }
    }
    if (dom.videoPreviewElement) {
        if (isVideo) {
            dom.videoPreviewElement.src = videoPreviewSrcFromActiveFile();
        } else {
            dom.videoPreviewElement.pause();
            dom.videoPreviewElement.removeAttribute('src');
            try {
                dom.videoPreviewElement.load();
            } catch (_error) {
                // Ignore media reset failures.
            }
        }
    }
    if (dom.editor) {
        dom.editor.hidden = isResourcePreview;
    }
    if (isShader) {
        syncShaderPreviewControls();
        if (state.ui.shaderPreviewModalOpen) {
            ensureShaderPreviewLoop();
            drawShaderPreviewCanvas();
        } else {
            stopShaderPreviewLoop();
        }
        runShaderCompileForActiveFile({ silent: true });
    } else {
        setShaderPreviewModalOpen(false, { focusEditor: false, focus: false });
        stopShaderPreviewLoop();
    }
}

async function openMarkdownViewerPreview(newTab) {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'markdown') return;
    const repoPath = normalizeMarkdownRepoPath(active.path);
    if (!repoPath) {
        addEvent('error', 'Markdown 文件路径必须是相对 content 目录的 .md 路径');
        return;
    }
    const model = ensureModelForFile(active);
    const markdownContent = model ? model.getValue() : String(active.content || '');
    const previewPayload = buildMarkdownViewerPreviewPayload(repoPath, markdownContent);
    persistMarkdownViewerPreviewPayload(previewPayload);
    await saveWorkspaceImmediate();
    const url = await buildViewerPageUrl(repoPath, {
        studioPreview: true,
        studioEmbed: !newTab
    });
    if (newTab) {
        globalThis.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    if (dom.markdownPreviewFrame) {
        const current = String(dom.markdownPreviewFrame.getAttribute('src') || '').trim();
        if (current !== url) {
            dom.markdownPreviewFrame.src = url;
        }
        postMarkdownViewerPreviewPayload(previewPayload);
    }
}

function runShaderCompileForActiveFile(options) {
    const opts = options || {};
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'shaderfx') {
        return;
    }
    const result = compileFxSource(active.content || '');
    state.shaderCompile.logs.push(result.log);
    state.shaderCompile.errors = result.errors;
    while (state.shaderCompile.logs.length > 120) {
        state.shaderCompile.logs.shift();
    }
    renderShaderCompilePanel({
        log: `[${nowStamp()}] ${result.log}\n${state.shaderCompile.logs.join('\n')}`,
        errors: result.errors
    });
    drawShaderPreviewCanvas();
    if (!opts.silent) {
        setActivePanelTab(result.ok ? 'compile' : 'errors');
        showBottomPanel(true);
    }
}

function exportShaderFile() {
    const active = getActiveFile();
    if (!active || detectFileMode(active.path) !== 'shaderfx') return;
    const fileName = String(active.path || 'shader.fx').split('/').pop() || 'shader.fx';
    downloadTextFile(fileName, String(active.content || ''), 'text/plain;charset=utf-8');
    addEvent('info', `已导出 ${fileName}`);
}

function isAnimationCsharpFilePath(pathValue) {
    const safe = normalizeRepoPath(pathValue).toLowerCase();
    if (!safe) return false;
    if (/\.animcs$/i.test(safe)) return true;
    if (/\.anim\.cs$/i.test(safe)) return true;
    if (/\/(?:anims?|animations?)\//i.test(safe)) return true;
    return false;
}

function groupWorkspaceFilesByCategory(files) {
    const groups = [
        { key: 'markdown', title: 'Markdown 文章', items: [] },
        { key: 'csharp', title: 'C# 文件', items: [] },
        { key: 'shader', title: 'Shader 文件', items: [] },
        { key: 'assets', title: '资源文件', items: [] }
    ];
    const categoryMap = new Map(groups.map((group) => [group.key, group]));

    (Array.isArray(files) ? files : []).forEach((file) => {
        if (!file || !file.path) return;
        const mode = detectFileMode(file.path);
        if (mode === 'markdown') {
            categoryMap.get('markdown').items.push(file);
            return;
        }
        if (mode === 'shaderfx') {
            categoryMap.get('shader').items.push(file);
            return;
        }
        if (mode === 'image' || mode === 'video') {
            categoryMap.get('assets').items.push(file);
            return;
        }
        categoryMap.get('csharp').items.push(file);
    });

    return groups.filter((group) => group.items.length > 0);
}

function formatFileListLabel(file) {
    const mode = detectFileMode(file.path);
    const pathText = String(file.path || '');
    if (mode === 'video') return `${pathText} [视频]`;
    if (mode === 'image') return `${pathText} [图片]`;
    if (mode === 'csharp' && isAnimationCsharpFilePath(pathText)) return `${pathText} [动画]`;
    return pathText;
}

function updateFileListUi() {
    if (!dom.fileList) return;
    dom.fileList.innerHTML = '';

    const groupedFiles = groupWorkspaceFilesByCategory(state.workspace.files);
    groupedFiles.forEach((group) => {
        const headLi = document.createElement('li');
        headLi.className = 'file-group-title';
        headLi.textContent = group.title;
        dom.fileList.appendChild(headLi);

        group.items.forEach((file) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'file-item';
            btn.textContent = formatFileListLabel(file);
            btn.title = String(file.path || '');
            btn.setAttribute('aria-current', file.id === state.workspace.activeFileId ? 'true' : 'false');
            btn.addEventListener('click', function () {
                switchActiveFile(file.id);
            });
            li.appendChild(btn);
            dom.fileList.appendChild(li);
        });
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
        const existing = state.modelByFileId.get(file.id);
        const lang = languageForFile(file.path);
        if (existing && existing.getLanguageId && existing.getLanguageId() !== lang) {
            monaco.editor.setModelLanguage(existing, lang);
        }
        return existing;
    }

    const model = monaco.editor.createModel(
        String(file.content || ''),
        languageForFile(file.path),
        monaco.Uri.parse(`inmemory://model/${file.id}/${file.path}`)
    );
    model.onDidChangeContent(function () {
        file.content = model.getValue();
        scheduleWorkspaceSave();
        if (detectFileMode(file.path) === 'csharp') {
            scheduleDiagnostics();
        }
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
    applyEditorModeUi();
    if (detectFileMode(target.path) === 'csharp') {
        runDiagnostics();
    } else {
        monaco.editor.setModelMarkers(model, 'tml-ide', []);
        renderProblems([]);
    }
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
    if (activeFileMode() !== 'csharp') {
        return;
    }
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

function readInputValue(inputNode) {
    return inputNode ? String(inputNode.value || '') : '';
}

function buildIndexCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', readInputValue(dom.inputIndexerDllPath), 'tModLoader.dll'));
    const xmlArg = buildOptionalArg('--xml', readInputValue(dom.inputIndexerXmlPath));
    if (xmlArg) parts.push(xmlArg);
    const terrariaDllArg = buildOptionalArg('--terraria-dll', readInputValue(dom.inputIndexerTerrariaDllPath));
    if (terrariaDllArg) parts.push(terrariaDllArg);
    const terrariaXmlArg = buildOptionalArg('--terraria-xml', readInputValue(dom.inputIndexerTerrariaXmlPath));
    if (terrariaXmlArg) parts.push(terrariaXmlArg);
    parts.push(buildRequiredArg('--out', readInputValue(dom.inputIndexerOutPath), 'api-index.v2.json'));
    return parts.join(' ');
}

function buildAppendCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', readInputValue(dom.inputAppendDllPath), 'extra-mod.dll'));
    const xmlArg = buildOptionalArg('--xml', readInputValue(dom.inputAppendXmlPath));
    if (xmlArg) parts.push(xmlArg);
    parts.push(buildRequiredArg('--append', readInputValue(dom.inputAppendOutPath), 'session-pack.v1.json'));
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
            openUnifiedSubmitPanel({ syncUrl: true });
        });
    }

    if (dom.btnRouteSubmitPanel) {
        dom.btnRouteSubmitPanel.addEventListener('click', () => {
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

    if (dom.unifiedShaderSlug) {
        dom.unifiedShaderSlug.addEventListener('input', () => {
            dom.unifiedShaderSlug.value = sanitizeShaderSlug(dom.unifiedShaderSlug.value);
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
                await collectUnifiedChanges({ requestSubapp: false });
            } catch (error) {
                setUnifiedSubmitStatus(`收集失败：${error.message}`, 'error');
            }
        });
    }

    if (dom.btnUnifiedSubmit) {
        dom.btnUnifiedSubmit.addEventListener('click', async () => {
            try {
                const collection = await collectUnifiedChanges({ requestSubapp: false });
                const plan = await buildSplitSubmitPlan(collection);
                const docsCount = Array.isArray(plan.docsBatches) ? plan.docsBatches.length : 0;
                const shaderCount = Array.isArray(plan.shaderBatches) ? plan.shaderBatches.length : 0;
                if (docsCount <= 0 && shaderCount <= 0) {
                    setUnifiedSubmitStatus('没有可提交文件', 'info');
                    return;
                }
                pushUnifiedSubmitLog(`批次规划完成：文档 ${docsCount}，Shader ${shaderCount}`);
                await runSplitUnifiedSubmit(plan, {});
            } catch (error) {
                setUnifiedSubmitStatus(`提交失败：${error.message}`, 'error');
            }
        });
    }

    if (dom.btnUnifiedResume) {
        dom.btnUnifiedResume.addEventListener('click', async () => {
            const resume = state.unified.resumeState || { docs: null, shader: null };
            const docsResume = resume.docs && Array.isArray(resume.docs.batches) && resume.docs.batches.length
                ? resume.docs
                : null;
            const shaderResume = resume.shader && Array.isArray(resume.shader.batches) && resume.shader.batches.length
                ? resume.shader
                : null;
            if (!docsResume && !shaderResume) {
                setUnifiedSubmitStatus('没有可重试的失败通道', 'info');
                return;
            }
            try {
                pushUnifiedSubmitLog('开始重试失败通道');
                const plan = {
                    docsBatches: docsResume ? docsResume.batches : [],
                    shaderBatches: shaderResume ? shaderResume.batches : []
                };
                await runSplitUnifiedSubmit(plan, {
                    resume: {
                        docs: docsResume,
                        shader: shaderResume
                    }
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
        if (state.ui.shaderPreviewModalOpen && event.key === 'Escape') {
            event.preventDefault();
            setShaderPreviewModalOpen(false, { focusEditor: false, focus: false });
            return;
        }
        handleGlobalShortcuts(event);
    });

    if (dom.btnMarkdownTogglePreview) {
        dom.btnMarkdownTogglePreview.addEventListener('click', async () => {
            if (activeFileMode() !== 'markdown') return;
            const nextMode = state.ui.markdownPreviewMode === 'preview' ? 'edit' : 'preview';
            setMarkdownPreviewMode(nextMode);
            if (nextMode === 'preview') {
                try {
                    await openMarkdownViewerPreview(false);
                } catch (error) {
                    addEvent('error', `预览失败：${error.message}`);
                }
            }
        });
    }

    if (dom.btnMarkdownOpenViewer) {
        dom.btnMarkdownOpenViewer.addEventListener('click', async () => {
            try {
                await openMarkdownViewerPreview(true);
            } catch (error) {
                addEvent('error', `新标签预览失败：${error.message}`);
            }
        });
    }

    if (dom.btnShaderPreviewPopup) {
        dom.btnShaderPreviewPopup.addEventListener('click', () => {
            if (activeFileMode() !== 'shaderfx') return;
            setShaderPreviewModalOpen(!state.ui.shaderPreviewModalOpen, { focus: true, focusEditor: false });
        });
    }

    if (dom.shaderPreviewModalBackdrop) {
        dom.shaderPreviewModalBackdrop.addEventListener('click', () => {
            setShaderPreviewModalOpen(false, { focusEditor: false, focus: false });
        });
    }

    if (dom.btnShaderPreviewClose) {
        dom.btnShaderPreviewClose.addEventListener('click', () => {
            setShaderPreviewModalOpen(false, { focusEditor: false, focus: false });
        });
    }

    if (dom.btnMdOpenGuide) {
        dom.btnMdOpenGuide.addEventListener('click', async () => {
            if (!getMarkdownContextForAction('打开教程')) return;
            const guidePath = MARKDOWN_FALLBACK_ANCHORS[1] || MARKDOWN_FALLBACK_ANCHORS[0] || '';
            if (!guidePath) {
                addEvent('error', '未配置 Markdown 教程入口');
                return;
            }
            try {
                const url = await buildViewerPageUrl(guidePath);
                globalThis.open(url, '_blank', 'noopener,noreferrer');
                addEvent('info', `已打开 Markdown 教程：${toViewerFileParam(guidePath)}`);
            } catch (error) {
                addEvent('error', `打开 Markdown 教程失败：${error.message}`);
            }
        });
    }

    if (dom.btnMdDraftCheck) {
        dom.btnMdDraftCheck.addEventListener('click', () => {
            const ctx = getMarkdownContextForAction('发布前自检');
            if (!ctx) return;
            const result = runMarkdownDraftCheck(ctx.model.getValue());
            renderMarkdownDraftCheckLog(result.log);
            showBottomPanel(true);
            setActivePanelTab('compile');
            addEvent('info', `自检完成：错误 ${result.errors.length}，警告 ${result.warnings.length}`);
        });
    }

    if (dom.btnMdInsertTemplate) {
        dom.btnMdInsertTemplate.addEventListener('click', () => {
            const ctx = getMarkdownContextForAction('插入模板');
            if (!ctx) return;
            if (ctx.model.getValue().trim() && !globalThis.confirm('当前已有内容，确认覆盖为模板吗？')) {
                return;
            }
            ctx.model.setValue(markdownTemplateBlock());
            setMarkdownPreviewMode('edit');
            if (state.editor) {
                state.editor.setPosition({ lineNumber: 1, column: 1 });
                state.editor.focus();
            }
            addEvent('info', '已插入 Markdown 模板');
        });
    }

    if (dom.btnMdInsertImage) {
        dom.btnMdInsertImage.addEventListener('click', () => {
            if (!getMarkdownContextForAction('插入图片引用')) return;
            const imagePathRaw = globalThis.prompt('请输入图片路径（相对站点内容目录）', './images/example.png');
            if (imagePathRaw === null) return;
            const imagePath = String(imagePathRaw || '').trim();
            if (!imagePath) {
                addEvent('error', '图片路径不能为空');
                return;
            }
            const altRaw = globalThis.prompt('请输入图片说明（alt）', '图片说明');
            if (altRaw === null) return;
            const alt = String(altRaw || '').trim() || '图片说明';
            const ok = insertMarkdownAtCursor(`![${alt}](${imagePath})\n`);
            if (!ok) {
                addEvent('error', '插入图片引用失败');
                return;
            }
            addEvent('info', '已插入图片引用');
        });
    }

    if (dom.btnMdFormat) {
        dom.btnMdFormat.addEventListener('click', () => {
            const ctx = getMarkdownContextForAction('快速格式化');
            if (!ctx) return;
            const source = ctx.model.getValue();
            const formatted = formatMarkdownText(source);
            if (formatted === source) {
                addEvent('info', 'Markdown 已是格式化状态');
                return;
            }
            ctx.model.setValue(formatted);
            addEvent('info', '已完成 Markdown 快速格式化');
        });
    }

    if (dom.btnMdCopy) {
        dom.btnMdCopy.addEventListener('click', async () => {
            const ctx = getMarkdownContextForAction('复制 Markdown');
            if (!ctx) return;
            try {
                const ok = await copyToClipboard(ctx.model.getValue());
                if (!ok) {
                    throw new Error('浏览器拒绝复制');
                }
                addEvent('info', '已复制 Markdown');
            } catch (error) {
                addEvent('error', `复制失败：${error.message}`);
            }
        });
    }

    if (dom.btnMdExportDraft) {
        dom.btnMdExportDraft.addEventListener('click', () => {
            const ctx = getMarkdownContextForAction('导出草稿');
            if (!ctx) return;
            const fileName = buildMarkdownDraftExportName(ctx.active.path);
            const payload = {
                markdown: ctx.model.getValue(),
                targetPath: normalizeMarkdownDraftPath(ctx.active.path),
                exportedAt: new Date().toISOString(),
                source: 'tml-ide-app/unified-markdown'
            };
            downloadTextFile(fileName, `${JSON.stringify(payload, null, 2)}\n`, 'application/json;charset=utf-8');
            addEvent('info', `已导出草稿 JSON：${fileName}`);
        });
    }

    if (dom.inputMdImportDraft) {
        dom.inputMdImportDraft.addEventListener('change', async () => {
            const file = dom.inputMdImportDraft.files && dom.inputMdImportDraft.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const payload = parseMarkdownDraftPayload(text);
                if (!payload.markdown && !payload.targetPath) {
                    throw new Error('草稿文件缺少 markdown/targetPath 字段');
                }

                let targetFile = ensureMarkdownDraftTargetFile(payload.targetPath);
                if (!targetFile) {
                    const ctx = getActiveMarkdownContext();
                    targetFile = ctx ? ctx.active : null;
                }
                if (!targetFile || detectFileMode(targetFile.path) !== 'markdown') {
                    targetFile = ensureMarkdownDraftTargetFile(`导入草稿-${Date.now().toString(36)}.md`);
                }
                if (!targetFile) {
                    throw new Error('无法确定导入目标 Markdown 文件');
                }

                switchActiveFile(targetFile.id);
                const model = ensureModelForFile(targetFile);
                model.setValue(String(payload.markdown || ''));
                setMarkdownPreviewMode('edit');
                renderMarkdownDraftCheckLog('等待自检...');
                if (state.editor) state.editor.focus();

                const importedPath = normalizeMarkdownDraftPath(payload.targetPath);
                addEvent('info', importedPath
                    ? `已导入草稿：${file.name} -> ${importedPath}`
                    : `已导入草稿：${file.name}`);
            } catch (error) {
                addEvent('error', `导入草稿失败：${error.message}`);
            } finally {
                dom.inputMdImportDraft.value = '';
            }
        });
    }

    if (dom.btnMdReset) {
        dom.btnMdReset.addEventListener('click', () => {
            const ctx = getMarkdownContextForAction('清空草稿');
            if (!ctx) return;
            if (!ctx.model.getValue().trim()) {
                addEvent('info', '当前草稿已为空');
                return;
            }
            if (!globalThis.confirm('确认清空当前 Markdown 草稿吗？')) {
                return;
            }
            ctx.model.setValue('');
            setMarkdownPreviewMode('edit');
            renderMarkdownDraftCheckLog('等待自检...');
            addEvent('info', '已清空当前 Markdown 草稿');
        });
    }

    if (dom.btnMdFocusMode) {
        dom.btnMdFocusMode.addEventListener('click', () => {
            if (!getMarkdownContextForAction('专注模式')) return;
            toggleMarkdownFocusMode();
        });
    }

    if (dom.markdownInsertButtons && dom.markdownInsertButtons.length > 0) {
        dom.markdownInsertButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const action = String(button.getAttribute('data-md-insert') || '').trim();
                applyMarkdownInsertAction(action);
            });
        });
    }

    window.addEventListener('paste', async (event) => {
        if (!isMarkdownEditorFocused()) return;
        const clipboardData = event && event.clipboardData ? event.clipboardData : null;
        if (!clipboardData) return;
        const imageFiles = collectClipboardImageFiles(clipboardData);
        if (!imageFiles.length) return;

        event.preventDefault();
        try {
            const insertedCount = await insertPastedMarkdownImages(imageFiles);
            if (!insertedCount) {
                addEvent('warn', '粘贴图片失败：未写入任何图片');
            }
        } catch (error) {
            addEvent('error', `粘贴图片失败：${error.message}`);
        }
    });

    if (dom.btnShaderInsertTemplate) {
        dom.btnShaderInsertTemplate.addEventListener('click', () => {
            insertShaderDefaultTemplateForActiveFile();
        });
    }

    if (dom.btnShaderCompile) {
        dom.btnShaderCompile.addEventListener('click', () => {
            runShaderCompileForActiveFile();
        });
    }

    if (dom.btnPanelShaderCompile) {
        dom.btnPanelShaderCompile.addEventListener('click', () => {
            runShaderCompileForActiveFile();
        });
    }

    if (dom.btnShaderExport) {
        dom.btnShaderExport.addEventListener('click', () => {
            exportShaderFile();
        });
    }

    if (dom.shaderPresetImage) {
        dom.shaderPresetImage.addEventListener('change', () => {
            state.shaderPreview.presetImage = normalizeShaderPreviewPreset(dom.shaderPresetImage.value);
            drawShaderPreviewCanvas();
            addEvent('info', `Shader 预设图片已切换：${shaderPreviewPresetLabel(state.shaderPreview.presetImage)}`);
        });
    }

    if (dom.shaderRenderMode) {
        dom.shaderRenderMode.addEventListener('change', () => {
            state.shaderPreview.renderMode = normalizeShaderPreviewRenderMode(dom.shaderRenderMode.value);
            drawShaderPreviewCanvas();
            addEvent('info', `Shader 渲染模式已切换：${shaderPreviewRenderModeLabel(state.shaderPreview.renderMode)}`);
        });
    }

    if (dom.shaderAddressMode) {
        dom.shaderAddressMode.addEventListener('change', () => {
            state.shaderPreview.addressMode = normalizeShaderPreviewAddressMode(dom.shaderAddressMode.value);
            drawShaderPreviewCanvas();
            addEvent('info', `Shader 采样模式已切换：${state.shaderPreview.addressMode}`);
        });
    }

    if (dom.shaderBgMode) {
        dom.shaderBgMode.addEventListener('change', () => {
            state.shaderPreview.bgMode = normalizeShaderPreviewBgMode(dom.shaderBgMode.value);
            drawShaderPreviewCanvas();
            addEvent('info', `Shader 背景模式已切换：${state.shaderPreview.bgMode}`);
        });
    }

    if (Array.isArray(dom.shaderUploadInputs)) {
        dom.shaderUploadInputs.forEach((input, index) => {
            if (!input) return;
            input.addEventListener('change', async (event) => {
                try {
                    await handleShaderUploadChange(index, event);
                } catch (error) {
                    addEvent('error', `上传 ${shaderUploadSlotLabel(index)} 失败：${error.message}`);
                }
            });
        });
    }

    if (Array.isArray(dom.shaderUploadClearButtons)) {
        dom.shaderUploadClearButtons.forEach((button, index) => {
            if (!button) return;
            button.addEventListener('click', () => {
                clearShaderUploadSlot(index);
            });
        });
    }

    window.addEventListener('resize', () => {
        if (activeFileMode() === 'shaderfx' && state.ui.shaderPreviewModalOpen) {
            drawShaderPreviewCanvas();
        }
    });

    dom.btnAddFile.addEventListener('click', function () {
        const input = globalThis.prompt('请输入新文件名（.cs/.animcs/.md/.fx/.png/.jpg/.webp/.mp4）', '新文章.md');
        if (!input) return;

        const fileName = input.trim();
        if (!FILE_NAME_ALLOWED_EXT_RE.test(fileName)) {
            addEvent('error', '文件名必须以 .cs/.animcs/.md/.fx 或常见图片/视频后缀结尾');
            return;
        }

        const exists = state.workspace.files.some((file) => file.path.toLowerCase() === fileName.toLowerCase());
        if (exists) {
            addEvent('error', `文件已存在：${fileName}`);
            return;
        }

        const initialContent = detectFileMode(fileName) === 'shaderfx' ? shaderDefaultTemplate() : '';
        const file = {
            id: createFileId(),
            path: fileName,
            content: initialContent
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

        const input = globalThis.prompt('请输入新的文件名（.cs/.animcs/.md/.fx/.png/.jpg/.webp/.mp4）', active.path);
        if (!input) return;

        const next = input.trim();
        if (!FILE_NAME_ALLOWED_EXT_RE.test(next)) {
            addEvent('error', '文件名必须以 .cs/.animcs/.md/.fx 或常见图片/视频后缀结尾');
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
        ensureModelForFile(active);
        updateFileListUi();
        applyEditorModeUi();
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

    if (dom.btnImportAssembly) {
        dom.btnImportAssembly.addEventListener('click', async function () {
            const dllFile = dom.inputExtraDll && dom.inputExtraDll.files && dom.inputExtraDll.files[0];
            const xmlFile = dom.inputExtraXml && dom.inputExtraXml.files && dom.inputExtraXml.files[0];
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
    }

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

    if (dom.btnCopyIndexCommand) {
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
    }

    if (dom.btnCopyAppendCommand) {
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
    }

    if (dom.btnImportIndex) {
        dom.btnImportIndex.addEventListener('click', async function () {
            const file = dom.inputImportIndex && dom.inputImportIndex.files && dom.inputImportIndex.files[0];
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
                if (dom.inputImportIndex) dom.inputImportIndex.value = '';
            }
        });
    }
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

    dom.workspaceVersion.textContent = 'workspace.v3';
    const enhancedCsharpLanguage = createEnhancedCsharpLanguage(csharpLanguage);
    monaco.languages.setLanguageConfiguration('csharp', csharpConf);
    monaco.languages.setMonarchTokensProvider('csharp', enhancedCsharpLanguage);
    registerShaderFxLanguageSupport();
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
    restoreWorkspaceSnapshotsFromUnifiedState();

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
                docsMarkdown: collection.docs.markdownEntries.length,
                docsCode: collection.docs.extraEntries.length,
                shaderFx: collection.shader.fxEntries.length,
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
            const staged = extractStagedSnapshot(snapshot);
            if (!staged) return false;
            state.subapps.snapshotByWorkspace[safeWorkspace] = staged;
            scheduleUnifiedStateSave();
            return true;
        },
        getUnifiedSnapshot() {
            const collection = state.unified.collection || {
                docs: { markdownEntries: [], extraEntries: [] },
                shader: { fxEntries: [] },
                blockedEntries: []
            };
            return {
                docsMarkdown: collection.docs.markdownEntries.length,
                docsCode: collection.docs.extraEntries.length,
                shaderFx: collection.shader.fxEntries.length,
                blocked: collection.blockedEntries.length,
                resume: state.unified.resumeState
            };
        },
        async submitUnified(options) {
            const opts = options || {};
            const collection = await collectUnifiedChanges({
                requestSubapp: opts.requestSubapp !== false,
                silent: true
            });
            const plan = await buildSplitSubmitPlan(collection);
            await runSplitUnifiedSubmit(plan, {});
            return this.getUnifiedSnapshot();
        },
        async resumeUnified() {
            const resume = state.unified.resumeState || { docs: null, shader: null };
            const docsResume = resume.docs && Array.isArray(resume.docs.batches) && resume.docs.batches.length
                ? resume.docs
                : null;
            const shaderResume = resume.shader && Array.isArray(resume.shader.batches) && resume.shader.batches.length
                ? resume.shader
                : null;
            if (!docsResume && !shaderResume) {
                throw new Error('没有可重试通道');
            }
            await runSplitUnifiedSubmit({
                docsBatches: docsResume ? docsResume.batches : [],
                shaderBatches: shaderResume ? shaderResume.batches : []
            }, {
                resume: {
                    docs: docsResume,
                    shader: shaderResume
                }
            });
            return this.getUnifiedSnapshot();
        }
    };

    installEditorProviders();
    bindUiEvents();
    syncShaderPreviewControls();
    updateShaderPreviewStatus();
    renderShaderCompilePanel({ log: '等待编译...', errors: [] });
    if (dom.indexCommandPreview || dom.appendCommandPreview) {
        refreshIndexerCommandPreview();
    }

    await loadInitialIndex();

    const workspace = csharpWorkspaceFromUnifiedState() || await loadWorkspace();
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
