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
import { buildFragmentSource as buildShaderFragmentSource } from './lib/shader-hlsl-adapter.js';
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
    shaderPreviewViewport: document.getElementById('shader-preview-viewport'),
    shaderPreviewAspectResizer: document.getElementById('shader-preview-aspect-resizer'),
    shaderPreviewStatus: document.getElementById('shader-preview-status'),
    shaderPreviewZoomOut: document.getElementById('shader-preview-zoom-out'),
    shaderPreviewZoomReset: document.getElementById('shader-preview-zoom-reset'),
    shaderPreviewZoomIn: document.getElementById('shader-preview-zoom-in'),
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
    repoExplorer: {
        loaded: false,
        loading: false,
        loadError: '',
        generatedAt: '',
        files: [],
        expandedDirs: new Set()
    },
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
        rafId: 0,
        autoCompileTimer: 0,
        runtime: null,
        viewScale: 1,
        viewOffsetX: 0,
        viewOffsetY: 0,
        dragPointerId: -1,
        dragStartX: 0,
        dragStartY: 0,
        dragOriginX: 0,
        dragOriginY: 0,
        aspectResizePointerId: -1,
        aspectResizeStartX: 0,
        aspectResizeStartWidth: 0,
        viewportWidth: 0
    },
    animPreview: {
        compiledAnims: {},
        animCompileErrors: {},
        bridgeEndpoint: '',
        bridgeConnected: false,
        compileStatus: '未激活',
        previewMarkdownPath: '',
        referencedAnimPaths: [],
        referencedAnimSet: new Set(),
        compileTimerByPath: {},
        latestRequestIdByPath: {},
        compileRequestSeq: 0,
        previewSyncTimer: 0
    },
    route: {
        workspace: 'csharp',
        panel: '',
        tutorialPath: ''
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
const ANALYZE_COMPLETION_PROFILE_TMOD = 'tmod';
const ANALYZE_COMPLETION_PROFILE_ANIMATION = 'animation';
const ANIMATION_TYPE_LABELS = Object.freeze([
    'AnimContext',
    'AnimInput',
    'ICanvas2D',
    'Vec2',
    'Vec3',
    'Mat4',
    'Color',
    'MathF',
    'AnimGeom',
    'IAnimScript'
]);
const ANIMATION_LIFECYCLE_LABELS = Object.freeze([
    'OnInit',
    'OnUpdate',
    'OnRender',
    'OnDispose'
]);
const ANIMATION_STATIC_OWNER_TO_TYPE = Object.freeze({
    ctx: 'AnimContext',
    context: 'AnimContext',
    input: 'AnimInput',
    g: 'ICanvas2D',
    canvas: 'ICanvas2D',
    Vec2: 'Vec2',
    Vec3: 'Vec3',
    Mat4: 'Mat4',
    Color: 'Color',
    MathF: 'MathF',
    AnimGeom: 'AnimGeom'
});
const ANIMATION_MEMBER_LABELS_BY_TYPE = Object.freeze({
    AnimContext: Object.freeze(['Width', 'Height', 'Time', 'Input']),
    AnimInput: Object.freeze(['X', 'Y', 'DeltaX', 'DeltaY', 'IsDown', 'WasPressed', 'WasReleased', 'IsInside', 'Mode', 'ModeLocked', 'WheelDelta']),
    ICanvas2D: Object.freeze(['Clear', 'Line', 'Circle', 'FillCircle', 'Text']),
    Vec2: Object.freeze(['X', 'Y', 'Add', 'Sub', 'MulScalar', 'DivScalar']),
    Vec3: Object.freeze(['X', 'Y', 'Z', 'Add', 'Sub', 'MulScalar', 'DivScalar', 'Length', 'Normalize']),
    Mat4: Object.freeze([
        'M00', 'M01', 'M02', 'M03',
        'M10', 'M11', 'M12', 'M13',
        'M20', 'M21', 'M22', 'M23',
        'M30', 'M31', 'M32', 'M33',
        'Identity', 'Translation', 'Scale', 'RotationX', 'RotationY', 'RotationZ', 'PerspectiveFovRh', 'Mul', 'MulVec2', 'MulVec3'
    ]),
    Color: Object.freeze(['R', 'G', 'B', 'A']),
    MathF: Object.freeze(['Sin', 'Cos', 'Tan', 'Min', 'Max', 'Sqrt', 'Abs', 'Round']),
    AnimGeom: Object.freeze(['ToScreen', 'DrawAxes', 'DrawArrow'])
});
const ANIMATION_METHOD_LABELS = new Set([
    'Clear', 'Line', 'Circle', 'FillCircle', 'Text',
    'Add', 'Sub', 'MulScalar', 'DivScalar', 'Length', 'Normalize',
    'Identity', 'Translation', 'Scale', 'RotationX', 'RotationY', 'RotationZ', 'PerspectiveFovRh', 'Mul', 'MulVec2', 'MulVec3',
    'Sin', 'Cos', 'Tan', 'Min', 'Max', 'Sqrt', 'Abs', 'Round',
    'ToScreen', 'DrawAxes', 'DrawArrow',
    'OnInit', 'OnUpdate', 'OnRender', 'OnDispose'
]);
const ANIMATION_TYPE_LABEL_SET = new Set(ANIMATION_TYPE_LABELS);
const ANIMATION_MEMBER_LABEL_SET = new Set(Object.values(ANIMATION_MEMBER_LABELS_BY_TYPE).flat());
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
const IDE_EDITABLE_INDEX_PATH = '/site/assets/ide-editable-index.v1.json';
const PREVIEW_SYNC_DEBOUNCE_MS = 120;
const ANIMCS_BRIDGE_STORAGE_KEY = 'articleStudioAnimBridgeEndpoint.v1';
const ANIMCS_DEFAULT_BRIDGE_ENDPOINT = 'http://127.0.0.1:5078';
const ANIMCS_BRIDGE_CANDIDATE_ENDPOINTS = [ANIMCS_DEFAULT_BRIDGE_ENDPOINT, 'http://127.0.0.1:5178'];
const ANIMCS_COMPILE_DEBOUNCE_MS = 400;
const ANIMCS_COMPILE_TIMEOUT_MS = 8000;
let viewerPagePathCache = '';
const FILE_NAME_ALLOWED_EXT_RE = /\.(?:cs|animcs|md|fx|png|jpe?g|gif|webp|svg|bmp|avif|mp4|webm|mov|m4v|avi|mkv)$/i;
const SHADER_PREVIEW_BG_MODES = new Set(['transparent', 'black', 'white']);
const SHADER_PREVIEW_RENDER_MODES = new Set(['alpha', 'additive', 'multiply', 'screen']);
const SHADER_PREVIEW_ADDRESS_MODES = new Set(['clamp', 'wrap']);
const SHADER_PREVIEW_PRESETS = new Set(['checker', 'noise', 'gradient', 'rings']);
const SHADER_UPLOAD_SLOT_COUNT = 4;
const SHADER_UPLOAD_MAX_SIZE = 4 * 1024 * 1024;
const SHADER_LIVE_COMPILE_DELAY = 260;
const SHADER_MAX_TIME_DELTA = 0.2;
const SHADER_PREVIEW_MIN_SCALE = 0.2;
const SHADER_PREVIEW_MAX_SCALE = 8;
const SHADER_PREVIEW_ZOOM_STEP = 0.2;
const SHADER_PREVIEW_MIN_VIEWPORT_WIDTH = 220;
const SHADER_PREVIEW_ASPECT_RESIZE_STEP = 20;
const SHADER_VERTEX_SOURCE = [
    '#version 300 es',
    'precision highp float;',
    'layout(location = 0) in vec2 aPos;',
    'layout(location = 1) in vec2 aUv;',
    'out vec2 vUv;',
    'void main() {',
    '    vUv = aUv;',
    '    gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
].join('\n');
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

function stableRepoPathCompare(left, right) {
    const a = String(left || '');
    const b = String(right || '');
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

function normalizeContentRelativePath(pathValue) {
    return normalizeRepoPath(pathValue).replace(/^site\/content\//i, '');
}

function toSiteContentRepoPath(pathValue) {
    const relative = normalizeContentRelativePath(pathValue);
    if (!relative) return '';
    return `site/content/${relative}`;
}

function toSiteContentFetchUrl(pathValue) {
    const relative = normalizeContentRelativePath(pathValue);
    if (!relative) return '';
    const encoded = splitRepoPathSegments(relative).map((segment) => encodeURIComponent(segment)).join('/');
    return encoded ? `/site/content/${encoded}` : '';
}

function isIdeEditableRelativePath(pathValue) {
    const relative = normalizeContentRelativePath(pathValue);
    if (!relative) return false;
    if (/(^|\/)\.\.(\/|$)/.test(relative)) return false;

    const lower = relative.toLowerCase();
    if (lower.endsWith('.md')) return true;
    if (lower.endsWith('.fx')) return true;
    if (/^anims\/[^/]+\.cs$/i.test(relative)) return true;
    if (/(?:^|\/)code\/[^/]+\.cs$/i.test(relative)) return true;
    if (/(?:^|\/)imgs\/[^/]+$/i.test(relative)) return true;
    if (/(?:^|\/)media\/[^/]+$/i.test(relative)) return true;
    return false;
}

function normalizeEditableWorkspacePathInput(pathValue) {
    const safe = normalizeContentRelativePath(pathValue);
    if (!safe) return '';
    if (!isIdeEditableRelativePath(safe)) return '';
    return safe;
}

function isSameContentRelativePath(left, right) {
    const a = normalizeContentRelativePath(left).toLowerCase();
    const b = normalizeContentRelativePath(right).toLowerCase();
    if (!a || !b) return false;
    return a === b;
}

function findWorkspaceFileByContentPath(pathValue) {
    const target = normalizeContentRelativePath(pathValue).toLowerCase();
    if (!target) return null;
    return state.workspace.files.find((file) => normalizeContentRelativePath(file.path).toLowerCase() === target) || null;
}

function resolveRelativeRepoPath(baseDir, relativePath) {
    const baseSegments = splitRepoPathSegments(baseDir);
    const raw = String(relativePath || '').trim();
    if (!raw) return '';
    if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(raw)) return '';

    const normalizedRelative = normalizeRepoPath(raw);
    if (!normalizedRelative) return '';

    const relativeSegments = splitRepoPathSegments(normalizedRelative);
    const resolved = raw.startsWith('/')
        ? []
        : baseSegments.slice();

    relativeSegments.forEach((segment) => {
        if (segment === '.') return;
        if (segment === '..') {
            if (resolved.length > 0) {
                resolved.pop();
            }
            return;
        }
        resolved.push(segment);
    });

    return resolved.join('/');
}

function resolveContentPathFromMarkdown(markdownPath, rawPath) {
    const source = String(rawPath || '').split('#')[0].split('?')[0].trim();
    if (!source) return '';
    if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(source)) return '';

    if (/^anims\//i.test(source)) {
        return normalizeContentRelativePath(source);
    }

    const markdownDir = dirnameRepoPath(normalizeContentRelativePath(markdownPath));
    return normalizeContentRelativePath(resolveRelativeRepoPath(markdownDir, source));
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

function normalizeAnimSourcePath(pathValue) {
    return normalizeContentRelativePath(pathValue).replace(/^\.\//, '');
}

function isAnimSourcePath(pathValue) {
    const normalized = normalizeAnimSourcePath(pathValue);
    if (!normalized) return false;
    if (!/^anims\//i.test(normalized)) return false;
    if (!/\.cs$/i.test(normalized)) return false;
    if (/(^|\/)\.\.(\/|$)/.test(normalized)) return false;
    return true;
}

function normalizeAnimBridgeEndpoint(input) {
    let value = String(input || '').trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) {
        value = `http://${value}`;
    }
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return '';
        }
        return parsed.toString().replace(/\/+$/, '');
    } catch (_error) {
        return '';
    }
}

function readStoredAnimBridgeEndpoint() {
    try {
        return normalizeAnimBridgeEndpoint(localStorage.getItem(ANIMCS_BRIDGE_STORAGE_KEY) || '');
    } catch (_error) {
        return '';
    }
}

function persistAnimBridgeEndpoint(endpoint) {
    try {
        localStorage.setItem(ANIMCS_BRIDGE_STORAGE_KEY, String(endpoint || ''));
    } catch (_error) {
        // Ignore storage errors.
    }
}

function normalizeAnimCompileDiagnostics(input) {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function setAnimCompileStatus(text) {
    const message = String(text || '').trim() || '未激活';
    state.animPreview.compileStatus = message;
    setStatus(`Anim预览: ${message}`);
}

function clearAnimCompileTimerForPath(animPath) {
    const normalized = normalizeAnimSourcePath(animPath);
    if (!normalized) return;
    const timer = state.animPreview.compileTimerByPath[normalized];
    if (!timer) return;
    clearTimeout(timer);
    delete state.animPreview.compileTimerByPath[normalized];
}

function setCompiledAnimOutput(animPath, moduleJs, profile) {
    const normalized = normalizeAnimSourcePath(animPath);
    if (!isAnimSourcePath(normalized)) return;
    state.animPreview.compiledAnims[normalized] = {
        moduleJs: String(moduleJs || ''),
        profile: profile && typeof profile === 'object' ? profile : null,
        updatedAt: new Date().toISOString()
    };
    delete state.animPreview.animCompileErrors[normalized];
}

function setCompiledAnimError(animPath, diagnostics) {
    const normalized = normalizeAnimSourcePath(animPath);
    if (!isAnimSourcePath(normalized)) return;
    delete state.animPreview.compiledAnims[normalized];
    state.animPreview.animCompileErrors[normalized] = {
        diagnostics: normalizeAnimCompileDiagnostics(diagnostics).slice(0, 20),
        updatedAt: new Date().toISOString()
    };
}

function removeCompiledAnimState(animPath) {
    const normalized = normalizeAnimSourcePath(animPath);
    if (!normalized) return;
    delete state.animPreview.compiledAnims[normalized];
    delete state.animPreview.animCompileErrors[normalized];
}

function buildCompiledAnimsPayload() {
    const payload = {};
    Object.keys(state.animPreview.compiledAnims || {}).forEach((rawPath) => {
        const normalized = normalizeAnimSourcePath(rawPath);
        if (!isAnimSourcePath(normalized)) return;

        const entry = state.animPreview.compiledAnims[rawPath];
        if (!entry || typeof entry !== 'object') return;
        const moduleJs = String(entry.moduleJs || '');
        if (!moduleJs) return;

        payload[normalized] = {
            moduleJs,
            profile: entry.profile && typeof entry.profile === 'object' ? entry.profile : null,
            updatedAt: String(entry.updatedAt || new Date().toISOString())
        };
    });
    return payload;
}

function buildAnimCompileErrorsPayload() {
    const payload = {};
    Object.keys(state.animPreview.animCompileErrors || {}).forEach((rawPath) => {
        const normalized = normalizeAnimSourcePath(rawPath);
        if (!isAnimSourcePath(normalized)) return;

        const entry = state.animPreview.animCompileErrors[rawPath];
        if (!entry || typeof entry !== 'object') return;
        const diagnostics = normalizeAnimCompileDiagnostics(entry.diagnostics);
        if (diagnostics.length <= 0) return;

        payload[normalized] = {
            diagnostics,
            updatedAt: String(entry.updatedAt || new Date().toISOString())
        };
    });
    return payload;
}

function parseAnimSourcePathFromCsDirective(rawValue) {
    const text = String(rawValue || '').trim();
    if (!text) return '';
    const pathPart = text.split('|')[0].trim();
    if (!pathPart) return '';
    return pathPart;
}

function collectReferencedAnimPaths(markdownPath, markdownContent) {
    const source = String(markdownContent || '');
    if (!source.trim()) return [];

    const result = new Set();
    const appendPath = (rawPath) => {
        const resolved = resolveContentPathFromMarkdown(markdownPath, rawPath);
        const normalized = normalizeAnimSourcePath(resolved);
        if (!isAnimSourcePath(normalized)) return;
        result.add(normalized);
    };

    const animDirectiveRe = /\{\{anim:([^}\n]+)\}\}/g;
    let animMatch = null;
    while ((animMatch = animDirectiveRe.exec(source)) !== null) {
        appendPath(animMatch[1]);
    }

    const csDirectiveRe = /\{\{cs:([^}\n]+)\}\}/g;
    let csMatch = null;
    while ((csMatch = csDirectiveRe.exec(source)) !== null) {
        appendPath(parseAnimSourcePathFromCsDirective(csMatch[1]));
    }

    const animcsFenceRe = /```animcs\s*([\s\S]*?)```/g;
    let fenceMatch = null;
    while ((fenceMatch = animcsFenceRe.exec(source)) !== null) {
        const blockText = String(fenceMatch[1] || '');
        const firstLine = blockText
            .split(/\r?\n/)
            .map((line) => String(line || '').trim())
            .find(Boolean) || '';
        appendPath(firstLine);
    }

    return Array.from(result).sort(stableRepoPathCompare);
}

function updateAnimPreviewReferenceContext(markdownPath, markdownContent) {
    const safeMarkdownPath = normalizeMarkdownRepoPath(markdownPath);
    const referencedPaths = collectReferencedAnimPaths(safeMarkdownPath, markdownContent);
    state.animPreview.previewMarkdownPath = safeMarkdownPath;
    state.animPreview.referencedAnimPaths = referencedPaths;
    state.animPreview.referencedAnimSet = new Set(referencedPaths);
    if (referencedPaths.length <= 0) {
        setAnimCompileStatus('未激活（当前文章未引用 anims/*.cs）');
    }
}

function buildMarkdownViewerPreviewPayload(markdownPath, markdownContent) {
    const safeMarkdownPath = normalizeMarkdownRepoPath(markdownPath) || normalizeMarkdownRepoPath(state.animPreview.previewMarkdownPath);
    const targetPath = toViewerFileParam(safeMarkdownPath || markdownPath);
    const uploadedImages = [];
    const uploadedMedia = [];
    const uploadedCsharpFiles = [];
    const imagePathSet = new Set();
    const mediaPathSet = new Set();
    const csharpPathSet = new Set();

    updateAnimPreviewReferenceContext(safeMarkdownPath || markdownPath, markdownContent);

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
        compiledAnims: buildCompiledAnimsPayload(),
        animCompileErrors: buildAnimCompileErrorsPayload(),
        animBridge: {
            endpoint: normalizeAnimBridgeEndpoint(state.animPreview.bridgeEndpoint) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT,
            connected: !!state.animPreview.bridgeConnected,
            status: String(state.animPreview.compileStatus || '未激活')
        },
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

function resolveAnimBridgeCandidates(preferredEndpoint) {
    const candidates = [];
    const seen = new Set();
    const appendCandidate = (value) => {
        const endpoint = normalizeAnimBridgeEndpoint(value);
        if (!endpoint || seen.has(endpoint)) return;
        seen.add(endpoint);
        candidates.push(endpoint);
    };

    appendCandidate(preferredEndpoint);
    appendCandidate(state.animPreview.bridgeEndpoint);
    ANIMCS_BRIDGE_CANDIDATE_ENDPOINTS.forEach((value) => appendCandidate(value));
    return candidates;
}

async function checkAnimBridgeHealth(endpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort();
    }, 1500);

    try {
        const response = await fetch(`${endpoint}/health`, {
            cache: 'no-store',
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const payload = await response.json().catch(() => ({}));
        if (!payload || payload.ok !== true) {
            throw new Error('健康检查失败');
        }
        return payload;
    } finally {
        clearTimeout(timer);
    }
}

async function connectAnimBridge(options) {
    const opts = options || {};
    const candidates = resolveAnimBridgeCandidates(opts.preferredEndpoint);
    if (!candidates.length) {
        state.animPreview.bridgeConnected = false;
        return '';
    }

    let lastError = null;
    for (let i = 0; i < candidates.length; i += 1) {
        const endpoint = candidates[i];
        try {
            await checkAnimBridgeHealth(endpoint);
            state.animPreview.bridgeEndpoint = endpoint;
            state.animPreview.bridgeConnected = true;
            persistAnimBridgeEndpoint(endpoint);
            return endpoint;
        } catch (error) {
            lastError = error;
        }
    }

    state.animPreview.bridgeConnected = false;
    if (!opts.silent && lastError) {
        addEvent('warn', `AnimBridge 不可用：${lastError.message || String(lastError)}`);
    }
    return '';
}

function resolvePreviewMarkdownRepoPath(pathValue) {
    const direct = normalizeMarkdownRepoPath(pathValue);
    if (direct) return direct;
    const active = getActiveFile();
    if (active && detectFileMode(active.path) === 'markdown') {
        return normalizeMarkdownRepoPath(active.path);
    }
    return '';
}

function readWorkspaceMarkdownContentByRepoPath(repoPath) {
    const safeRepoPath = normalizeMarkdownRepoPath(repoPath);
    if (!safeRepoPath) return '';
    const file = state.workspace.files.find((entry) => normalizeMarkdownRepoPath(entry.path) === safeRepoPath);
    if (!file) return '';
    const model = state.modelByFileId.get(file.id);
    if (model && typeof model.getValue === 'function') {
        return model.getValue();
    }
    return String(file.content || '');
}

function clearPreviewSyncTimer() {
    if (!state.animPreview.previewSyncTimer) return;
    clearTimeout(state.animPreview.previewSyncTimer);
    state.animPreview.previewSyncTimer = 0;
}

async function syncMarkdownViewerPreviewByRepoPath(repoPath, options) {
    const opts = options || {};
    const safeRepoPath = resolvePreviewMarkdownRepoPath(repoPath);
    if (!safeRepoPath) return false;
    const markdownContent = readWorkspaceMarkdownContentByRepoPath(safeRepoPath);
    const payload = buildMarkdownViewerPreviewPayload(safeRepoPath, markdownContent);
    persistMarkdownViewerPreviewPayload(payload);
    if (opts.postToFrame !== false) {
        postMarkdownViewerPreviewPayload(payload);
    }
    if (opts.refreshAnimRefs) {
        scheduleCompileForReferencedAnims({
            immediate: false,
            reason: '文章引用更新'
        });
    }
    return true;
}

function scheduleMarkdownPreviewSync(options) {
    const opts = options || {};
    const markdownPath = resolvePreviewMarkdownRepoPath(opts.markdownPath || state.animPreview.previewMarkdownPath);
    if (!markdownPath) return;
    clearPreviewSyncTimer();
    state.animPreview.previewSyncTimer = setTimeout(() => {
        state.animPreview.previewSyncTimer = 0;
        syncMarkdownViewerPreviewByRepoPath(markdownPath, {
            postToFrame: true,
            refreshAnimRefs: !!opts.refreshAnimRefs
        }).catch(() => {});
    }, PREVIEW_SYNC_DEBOUNCE_MS);
}

async function compileAnimSourceNow(animPath, sourceText, options) {
    const opts = options || {};
    const normalized = normalizeAnimSourcePath(animPath);
    if (!isAnimSourcePath(normalized)) return;
    const requestId = String(++state.animPreview.compileRequestSeq);
    state.animPreview.latestRequestIdByPath[normalized] = requestId;
    setAnimCompileStatus(`编译中 ${normalized}`);

    const endpoint = await connectAnimBridge({ preferredEndpoint: opts.preferredEndpoint, silent: true });
    if (!endpoint) {
        setCompiledAnimError(normalized, ['未检测到本地 AnimBridge，请先启动 dotnet 桥接服务']);
        setAnimCompileStatus(`桥接不可用 ${normalized}`);
        scheduleMarkdownPreviewSync({ refreshAnimRefs: false });
        return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, ANIMCS_COMPILE_TIMEOUT_MS);

    try {
        const response = await fetch(`${endpoint}/api/animcs/compile`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sourcePath: normalized,
                sourceText: String(sourceText || ''),
                requestId
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json().catch(() => null);
        if (state.animPreview.latestRequestIdByPath[normalized] !== requestId) {
            return;
        }

        const diagnostics = normalizeAnimCompileDiagnostics(payload && payload.diagnostics);
        const moduleJs = String(payload && payload.moduleJs || '');
        if (!payload || payload.ok !== true || !moduleJs) {
            setCompiledAnimError(normalized, diagnostics.length ? diagnostics : ['编译失败：未生成 JS 模块']);
            setAnimCompileStatus(`编译失败 ${normalized}`);
            scheduleMarkdownPreviewSync({ refreshAnimRefs: false });
            return;
        }

        setCompiledAnimOutput(normalized, moduleJs, payload.profile && typeof payload.profile === 'object' ? payload.profile : null);
        state.animPreview.bridgeConnected = true;
        setAnimCompileStatus(`编译成功 ${normalized}`);
        scheduleMarkdownPreviewSync({ refreshAnimRefs: false });
    } catch (error) {
        if (state.animPreview.latestRequestIdByPath[normalized] !== requestId) {
            return;
        }
        const reason = error && error.name === 'AbortError'
            ? `编译超时（>${ANIMCS_COMPILE_TIMEOUT_MS}ms）`
            : (error && error.message ? error.message : String(error));
        setCompiledAnimError(normalized, [reason]);
        setAnimCompileStatus(`编译失败 ${normalized}`);
        state.animPreview.bridgeConnected = false;
        scheduleMarkdownPreviewSync({ refreshAnimRefs: false });
    } finally {
        clearTimeout(timeout);
    }
}

function scheduleAnimCompileForPath(animPath, sourceText, options) {
    const opts = options || {};
    const normalized = normalizeAnimSourcePath(animPath);
    if (!isAnimSourcePath(normalized)) return;
    clearAnimCompileTimerForPath(normalized);

    const run = () => {
        delete state.animPreview.compileTimerByPath[normalized];
        compileAnimSourceNow(normalized, sourceText, opts).catch(() => {});
    };

    if (opts.immediate) {
        run();
        return;
    }
    state.animPreview.compileTimerByPath[normalized] = setTimeout(run, ANIMCS_COMPILE_DEBOUNCE_MS);
}

function scheduleCompileForReferencedAnims(options) {
    const opts = options || {};
    const referenced = Array.isArray(state.animPreview.referencedAnimPaths)
        ? state.animPreview.referencedAnimPaths
        : [];
    if (!referenced.length) {
        setAnimCompileStatus('未激活（当前文章未引用 anims/*.cs）');
        return;
    }

    let compileCount = 0;
    referenced.forEach((animPath) => {
        const file = findWorkspaceFileByContentPath(animPath);
        if (!file) return;
        const model = state.modelByFileId.get(file.id);
        const sourceText = model && typeof model.getValue === 'function'
            ? model.getValue()
            : String(file.content || '');
        scheduleAnimCompileForPath(animPath, sourceText, {
            immediate: !!opts.immediate
        });
        compileCount += 1;
    });

    if (compileCount <= 0) {
        setAnimCompileStatus('未激活（引用的 anims/*.cs 尚未在工作区打开）');
    }
}

function onWorkspaceCsharpContentChanged(file) {
    const animPath = normalizeAnimSourcePath(file && file.path ? file.path : '');
    if (!isAnimSourcePath(animPath)) return;
    if (!state.animPreview.referencedAnimSet.has(animPath)) return;
    scheduleAnimCompileForPath(animPath, String(file && file.content || ''), { immediate: false });
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
    const previewTechniqueIndex = text.search(/\btechnique(?:10|11)?\b/i);
    const previewSource = previewTechniqueIndex >= 0
        ? text.slice(0, previewTechniqueIndex)
        : text;
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
    let fragmentSource = '';
    if (!errors.length) {
        const fragmentResult = buildShaderFragmentSource('', previewSource);
        if (!fragmentResult || fragmentResult.ok !== true) {
            errors.push({
                line: 1,
                column: 1,
                message: String(fragmentResult && fragmentResult.error ? fragmentResult.error : 'HLSL 入口解析失败')
            });
        } else {
            fragmentSource = String(fragmentResult.source || '');
        }
    }
    return {
        ok: errors.length === 0,
        errors,
        fragmentSource,
        log: errors.length === 0
            ? '编译成功：HLSL 解析通过。'
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

function parseTutorialMarkdownPathFromUrl(url) {
    const safeUrl = url instanceof URL ? url : new URL(globalThis.location.href);
    const raw = String(
        safeUrl.searchParams.get('file')
        || safeUrl.searchParams.get('tutorial')
        || ''
    ).trim();
    if (!raw) return '';

    const normalized = normalizeMarkdownRepoPath(raw);
    if (!normalized) return '';
    if (/(?:^|\/)\.\.(?:\/|$)/.test(normalized)) return '';
    return normalized;
}

function parseRouteFromUrl() {
    const url = new URL(globalThis.location.href);
    const panel = normalizePanelName(url.searchParams.get('panel'));
    return {
        workspace: 'csharp',
        panel,
        tutorialPath: parseTutorialMarkdownPathFromUrl(url)
    };
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
    const isAnimRootCsharpFile = /^site\/content\/anims\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(path);
    const isArticleCsharpFile = /^site\/content\/.+\/code\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(path);
    return isShaderGalleryFile || isArticleImageFile || isArticleMediaFile || isAnimRootCsharpFile || isArticleCsharpFile;
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

function toDirectCsharpRepoPath(csharpFilePath) {
    const relativePath = normalizeContentRelativePath(csharpFilePath);
    if (!relativePath || !/\.cs$/i.test(relativePath)) return '';
    const repoPath = `site/content/${relativePath}`;
    if (/^site\/content\/anims\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(repoPath)) {
        return repoPath;
    }
    if (/^site\/content\/.+\/code\/[a-z0-9\u4e00-\u9fa5_-]+\.cs$/i.test(repoPath)) {
        return repoPath;
    }
    return '';
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
                const path = toDirectCsharpRepoPath(item.path) || toCodePathForArticle(articlePath, item.path);
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
    const fetchUrl = toSiteContentFetchUrl(path);
    if (!fetchUrl) {
        throw new Error(`锚点 Markdown 路径非法：${pathValue}`);
    }
    const response = await fetch(fetchUrl, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`加载锚点 Markdown 失败（HTTP ${response.status}）：${path}`);
    }
    return await response.text();
}

function findWorkspaceFileByPath(pathValue) {
    return findWorkspaceFileByContentPath(pathValue);
}

function createWorkspaceMarkdownFile(pathValue) {
    const safePath = normalizeContentRelativePath(pathValue);
    if (!safePath) return null;
    const nextFile = {
        id: createFileId(),
        path: safePath,
        content: ''
    };
    state.workspace.files.push(nextFile);
    ensureModelForFile(nextFile);
    return nextFile;
}

async function ensureTutorialMarkdownRouteLoaded() {
    const tutorialRepoPath = normalizeMarkdownRepoPath(state.route && state.route.tutorialPath || '');
    if (!tutorialRepoPath) return false;

    const workspacePath = toViewerFileParam(tutorialRepoPath);
    if (!workspacePath) return false;

    try {
        let targetFile = findWorkspaceFileByPath(workspacePath);
        let markdownContent = targetFile ? String(targetFile.content || '') : '';
        const hasWorkspaceContent = !!markdownContent.trim();

        if (!hasWorkspaceContent) {
            markdownContent = await loadMarkdownContentFromPath(tutorialRepoPath);
        }

        if (!targetFile) {
            targetFile = createWorkspaceMarkdownFile(workspacePath);
        }
        if (!targetFile) return false;

        const nextText = String(markdownContent || '').replace(/\r\n/g, '\n');
        targetFile.path = workspacePath;
        targetFile.content = nextText;

        const model = ensureModelForFile(targetFile);
        if (model && model.getValue() !== nextText) {
            model.setValue(nextText);
        }

        updateFileListUi();
        switchActiveFile(targetFile.id);
        scheduleUnifiedStateSave();

        if (hasWorkspaceContent) {
            addEvent('info', `已定位教程文件：${workspacePath}`);
        } else {
            addEvent('info', `已载入教程全文：${workspacePath}`);
        }
        setStatus(`教程编辑模式：${workspacePath}`);
        return true;
    } catch (error) {
        addEvent('error', `教程载入失败：${error.message}`);
        return false;
    }
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
    if (!shouldOpen) {
        stopShaderPreviewDragging();
        stopShaderPreviewAspectResizing();
        applyShaderPreviewViewTransform();
    }
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

    installShaderPreviewViewportInteractions();
    installShaderPreviewAspectResizerInteractions();
    applyShaderPreviewViewportWidth({ redraw: false, status: false });
    syncShaderPreviewControls();
    ensureShaderPreviewLoop();
    drawShaderPreviewCanvas();
    updateShaderPreviewStatus();
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
        return isSameContentRelativePath(file.path, safePath);
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

function updateShaderPreviewStatus() {
    if (!dom.shaderPreviewStatus) return;
    const mode = shaderPreviewRenderModeLabel(state.shaderPreview.renderMode);
    const preset = shaderPreviewPresetLabel(state.shaderPreview.presetImage);
    const address = normalizeShaderPreviewAddressMode(state.shaderPreview.addressMode);
    const bg = normalizeShaderPreviewBgMode(state.shaderPreview.bgMode);
    const aspect = readShaderPreviewAspectText();
    const zoom = Math.round(clampShaderPreviewZoom(state.shaderPreview.viewScale) * 100);
    const uploads = [];
    for (let i = 0; i < SHADER_UPLOAD_SLOT_COUNT; i += 1) {
        if (getShaderUploadSlot(i)) {
            uploads.push(`uImage${i}`);
        }
    }
    const uploadText = uploads.length ? uploads.join(', ') : '无';
    const compileErrors = Array.isArray(state.shaderCompile.errors) ? state.shaderCompile.errors.length : 0;
    const compileText = compileErrors > 0 ? `错误 ${compileErrors}` : '通过';
    dom.shaderPreviewStatus.textContent = `预设: ${preset} · 渲染: ${mode} · 采样: ${address} · 背景: ${bg} · 比例: ${aspect} · 缩放: ${zoom}% · 上传: ${uploadText} · 实时编译: ${compileText}`;
}

function clampShaderPreviewZoom(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(SHADER_PREVIEW_MIN_SCALE, Math.min(SHADER_PREVIEW_MAX_SCALE, numeric));
}

function readShaderPreviewAspectText() {
    const viewport = dom.shaderPreviewViewport;
    if (!viewport) return 'auto';
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return 'auto';
    const ratio = rect.width / rect.height;
    return `${rect.width.toFixed(0)}:${rect.height.toFixed(0)} (${ratio.toFixed(2)})`;
}

function shaderPreviewViewportBounds() {
    const viewport = dom.shaderPreviewViewport;
    if (!viewport) {
        return null;
    }
    const shell = viewport.parentElement;
    if (!shell) {
        return null;
    }
    const shellRect = shell.getBoundingClientRect();
    if (!shellRect.width) {
        return null;
    }
    const handleWidth = dom.shaderPreviewAspectResizer
        ? Number(dom.shaderPreviewAspectResizer.getBoundingClientRect().width || 0)
        : 0;
    const maxWidth = Math.max(
        SHADER_PREVIEW_MIN_VIEWPORT_WIDTH,
        Math.floor(shellRect.width - handleWidth - 1)
    );
    const minWidth = Math.max(120, Math.min(SHADER_PREVIEW_MIN_VIEWPORT_WIDTH, maxWidth));
    return {
        minWidth,
        maxWidth
    };
}

function clampShaderPreviewViewportWidth(value) {
    const bounds = shaderPreviewViewportBounds();
    if (!bounds) return 0;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.max(bounds.minWidth, Math.min(bounds.maxWidth, Math.round(numeric)));
}

function applyShaderPreviewViewportWidth(options) {
    const opts = options || {};
    if (!dom.shaderPreviewViewport) return;
    const safeWidth = clampShaderPreviewViewportWidth(state.shaderPreview.viewportWidth);
    state.shaderPreview.viewportWidth = safeWidth;
    if (safeWidth > 0) {
        dom.shaderPreviewViewport.style.flex = '0 0 auto';
        dom.shaderPreviewViewport.style.width = `${safeWidth}px`;
    } else {
        dom.shaderPreviewViewport.style.flex = '';
        dom.shaderPreviewViewport.style.width = '';
    }
    if (opts.redraw !== false) {
        drawShaderPreviewCanvas();
    }
    if (opts.status !== false) {
        updateShaderPreviewStatus();
    }
}

function setShaderPreviewViewportWidth(value, options) {
    state.shaderPreview.viewportWidth = value;
    applyShaderPreviewViewportWidth(options);
}

function resetShaderPreviewViewportWidth(options) {
    setShaderPreviewViewportWidth(0, options);
}

function stopShaderPreviewDragging() {
    if (!dom.shaderPreviewViewport) {
        state.shaderPreview.dragPointerId = -1;
        return;
    }
    const pointerId = Number.isInteger(state.shaderPreview.dragPointerId) ? state.shaderPreview.dragPointerId : -1;
    if (pointerId >= 0 && typeof dom.shaderPreviewViewport.hasPointerCapture === 'function') {
        if (dom.shaderPreviewViewport.hasPointerCapture(pointerId)) {
            try {
                dom.shaderPreviewViewport.releasePointerCapture(pointerId);
            } catch (_) {
                // ignore capture release errors when pointer lifecycle already ended.
            }
        }
    }
    state.shaderPreview.dragPointerId = -1;
}

function stopShaderPreviewAspectResizing() {
    const handle = dom.shaderPreviewAspectResizer;
    if (!handle) {
        state.shaderPreview.aspectResizePointerId = -1;
        return;
    }
    const pointerId = Number.isInteger(state.shaderPreview.aspectResizePointerId)
        ? state.shaderPreview.aspectResizePointerId
        : -1;
    if (pointerId >= 0 && typeof handle.hasPointerCapture === 'function') {
        if (handle.hasPointerCapture(pointerId)) {
            try {
                handle.releasePointerCapture(pointerId);
            } catch (_) {
                // ignore capture release errors
            }
        }
    }
    state.shaderPreview.aspectResizePointerId = -1;
    handle.classList.remove('is-dragging');
}

function applyShaderPreviewViewTransform() {
    if (!dom.shaderPreviewCanvas) return;
    const scale = clampShaderPreviewZoom(state.shaderPreview.viewScale);
    const offsetX = Number.isFinite(state.shaderPreview.viewOffsetX) ? state.shaderPreview.viewOffsetX : 0;
    const offsetY = Number.isFinite(state.shaderPreview.viewOffsetY) ? state.shaderPreview.viewOffsetY : 0;
    state.shaderPreview.viewScale = scale;
    state.shaderPreview.viewOffsetX = offsetX;
    state.shaderPreview.viewOffsetY = offsetY;
    dom.shaderPreviewCanvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    if (dom.shaderPreviewViewport) {
        dom.shaderPreviewViewport.classList.toggle('is-dragging', state.shaderPreview.dragPointerId >= 0);
    }
    if (dom.shaderPreviewZoomReset) {
        dom.shaderPreviewZoomReset.textContent = `${Math.round(scale * 100)}%`;
    }
}

function setShaderPreviewZoom(value, anchorClientX, anchorClientY) {
    const prevScale = clampShaderPreviewZoom(state.shaderPreview.viewScale);
    const nextScale = clampShaderPreviewZoom(value);
    const viewport = dom.shaderPreviewViewport;
    if (!viewport) {
        state.shaderPreview.viewScale = nextScale;
        applyShaderPreviewViewTransform();
        return;
    }

    const rect = viewport.getBoundingClientRect();
    const anchorX = Number.isFinite(anchorClientX) ? anchorClientX - rect.left : rect.width * 0.5;
    const anchorY = Number.isFinite(anchorClientY) ? anchorClientY - rect.top : rect.height * 0.5;
    const prevOffsetX = Number.isFinite(state.shaderPreview.viewOffsetX) ? state.shaderPreview.viewOffsetX : 0;
    const prevOffsetY = Number.isFinite(state.shaderPreview.viewOffsetY) ? state.shaderPreview.viewOffsetY : 0;
    const worldX = (anchorX - prevOffsetX) / prevScale;
    const worldY = (anchorY - prevOffsetY) / prevScale;
    state.shaderPreview.viewScale = nextScale;
    state.shaderPreview.viewOffsetX = anchorX - worldX * nextScale;
    state.shaderPreview.viewOffsetY = anchorY - worldY * nextScale;
    applyShaderPreviewViewTransform();
    updateShaderPreviewStatus();
}

function resetShaderPreviewView() {
    state.shaderPreview.viewScale = 1;
    state.shaderPreview.viewOffsetX = 0;
    state.shaderPreview.viewOffsetY = 0;
    applyShaderPreviewViewTransform();
    updateShaderPreviewStatus();
}

function installShaderPreviewViewportInteractions() {
    if (!dom.shaderPreviewViewport || dom.shaderPreviewViewport.dataset.interactionsBound === '1') return;
    dom.shaderPreviewViewport.dataset.interactionsBound = '1';

    dom.shaderPreviewViewport.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        state.shaderPreview.dragPointerId = Number(event.pointerId);
        state.shaderPreview.dragStartX = Number(event.clientX);
        state.shaderPreview.dragStartY = Number(event.clientY);
        state.shaderPreview.dragOriginX = Number(state.shaderPreview.viewOffsetX || 0);
        state.shaderPreview.dragOriginY = Number(state.shaderPreview.viewOffsetY || 0);
        if (typeof dom.shaderPreviewViewport.setPointerCapture === 'function') {
            try {
                dom.shaderPreviewViewport.setPointerCapture(event.pointerId);
            } catch (_) {
                // ignore capture failures; dragging still works through move events.
            }
        }
        event.preventDefault();
        applyShaderPreviewViewTransform();
    });

    dom.shaderPreviewViewport.addEventListener('pointermove', (event) => {
        if (Number(state.shaderPreview.dragPointerId) !== Number(event.pointerId)) return;
        const deltaX = Number(event.clientX) - Number(state.shaderPreview.dragStartX || 0);
        const deltaY = Number(event.clientY) - Number(state.shaderPreview.dragStartY || 0);
        state.shaderPreview.viewOffsetX = Number(state.shaderPreview.dragOriginX || 0) + deltaX;
        state.shaderPreview.viewOffsetY = Number(state.shaderPreview.dragOriginY || 0) + deltaY;
        applyShaderPreviewViewTransform();
    });

    const endDrag = () => {
        stopShaderPreviewDragging();
        applyShaderPreviewViewTransform();
    };
    dom.shaderPreviewViewport.addEventListener('pointerup', endDrag);
    dom.shaderPreviewViewport.addEventListener('pointercancel', endDrag);
    dom.shaderPreviewViewport.addEventListener('lostpointercapture', endDrag);

    dom.shaderPreviewViewport.addEventListener('wheel', (event) => {
        event.preventDefault();
        const factor = Math.exp((-Number(event.deltaY || 0) * SHADER_PREVIEW_ZOOM_STEP) / 100);
        setShaderPreviewZoom(Number(state.shaderPreview.viewScale || 1) * factor, event.clientX, event.clientY);
    }, { passive: false });

    dom.shaderPreviewViewport.addEventListener('dblclick', () => {
        resetShaderPreviewView();
    });
}

function installShaderPreviewAspectResizerInteractions() {
    if (!dom.shaderPreviewAspectResizer || dom.shaderPreviewAspectResizer.dataset.interactionsBound === '1') return;
    dom.shaderPreviewAspectResizer.dataset.interactionsBound = '1';

    const handle = dom.shaderPreviewAspectResizer;
    handle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || !dom.shaderPreviewViewport) return;
        const rect = dom.shaderPreviewViewport.getBoundingClientRect();
        state.shaderPreview.aspectResizePointerId = Number(event.pointerId);
        state.shaderPreview.aspectResizeStartX = Number(event.clientX);
        state.shaderPreview.aspectResizeStartWidth = Number(rect.width || 0);
        if (typeof handle.setPointerCapture === 'function') {
            try {
                handle.setPointerCapture(event.pointerId);
            } catch (_) {
                // ignore capture failures
            }
        }
        handle.classList.add('is-dragging');
        event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
        if (Number(state.shaderPreview.aspectResizePointerId) !== Number(event.pointerId)) return;
        const deltaX = Number(event.clientX) - Number(state.shaderPreview.aspectResizeStartX || 0);
        setShaderPreviewViewportWidth(Number(state.shaderPreview.aspectResizeStartWidth || 0) + deltaX);
    });

    const stop = () => {
        stopShaderPreviewAspectResizing();
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
    handle.addEventListener('lostpointercapture', stop);
    handle.addEventListener('dblclick', () => {
        resetShaderPreviewViewportWidth();
    });
    handle.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            const current = Number(dom.shaderPreviewViewport && dom.shaderPreviewViewport.getBoundingClientRect().width || 0);
            setShaderPreviewViewportWidth(current - SHADER_PREVIEW_ASPECT_RESIZE_STEP);
            event.preventDefault();
            return;
        }
        if (event.key === 'ArrowRight') {
            const current = Number(dom.shaderPreviewViewport && dom.shaderPreviewViewport.getBoundingClientRect().width || 0);
            setShaderPreviewViewportWidth(current + SHADER_PREVIEW_ASPECT_RESIZE_STEP);
            event.preventDefault();
            return;
        }
        if (event.key === 'Home' || event.key === 'Enter' || event.key === ' ') {
            resetShaderPreviewViewportWidth();
            event.preventDefault();
        }
    });
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
    applyShaderPreviewViewTransform();
}

function parseShaderCompileLogErrors(logText) {
    const text = String(logText || '').trim();
    if (!text) return [];
    const errors = [];
    text.split(/\r?\n/).forEach((lineText) => {
        const line = String(lineText || '').trim();
        if (!line) return;
        const match = line.match(/(?:ERROR:\s*\d+:|)(\d+):\s*(.*)$/i) || line.match(/0:(\d+):\s*(.*)$/);
        if (match) {
            errors.push({
                line: Math.max(1, Number(match[1] || 1)),
                column: 1,
                message: String(match[2] || line).trim()
            });
            return;
        }
        errors.push({
            line: 1,
            column: 1,
            message: line
        });
    });
    return errors;
}

function createShaderPreviewTexture(gl, source) {
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (source) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } else {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
}

function createShaderPreviewProgram(gl, vertexSource, fragmentSource) {
    const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        if (!shader) {
            return { ok: false, error: '无法创建 Shader 对象。' };
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const infoLog = gl.getShaderInfoLog(shader) || 'Shader 编译失败';
            gl.deleteShader(shader);
            return { ok: false, error: String(infoLog) };
        }
        return { ok: true, shader };
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexSource);
    if (!vs.ok) return { ok: false, error: vs.error };
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!fs.ok) {
        gl.deleteShader(vs.shader);
        return { ok: false, error: fs.error };
    }

    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vs.shader);
        gl.deleteShader(fs.shader);
        return { ok: false, error: '无法创建 Program 对象。' };
    }
    gl.attachShader(program, vs.shader);
    gl.attachShader(program, fs.shader);
    gl.linkProgram(program);
    gl.deleteShader(vs.shader);
    gl.deleteShader(fs.shader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const infoLog = gl.getProgramInfoLog(program) || 'Program 链接失败';
        gl.deleteProgram(program);
        return { ok: false, error: String(infoLog) };
    }

    return {
        ok: true,
        program,
        uniforms: {
            iResolution: gl.getUniformLocation(program, 'iResolution'),
            iTime: gl.getUniformLocation(program, 'iTime'),
            iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
            iFrame: gl.getUniformLocation(program, 'iFrame'),
            iMouse: gl.getUniformLocation(program, 'iMouse'),
            iDate: gl.getUniformLocation(program, 'iDate'),
            iChannelTime: gl.getUniformLocation(program, 'iChannelTime'),
            iChannelResolution: gl.getUniformLocation(program, 'iChannelResolution'),
            iChannel0: gl.getUniformLocation(program, 'iChannel0'),
            iChannel1: gl.getUniformLocation(program, 'iChannel1'),
            iChannel2: gl.getUniformLocation(program, 'iChannel2'),
            iChannel3: gl.getUniformLocation(program, 'iChannel3')
        }
    };
}

function disposeShaderPreviewRuntime(options) {
    const opts = options || {};
    const runtime = state.shaderPreview.runtime;
    if (!runtime) return;
    const gl = runtime.gl;
    if (gl) {
        if (runtime.program) gl.deleteProgram(runtime.program);
        if (runtime.vao) gl.deleteVertexArray(runtime.vao);
        if (runtime.vbo) gl.deleteBuffer(runtime.vbo);
        if (Array.isArray(runtime.channelTextures)) {
            runtime.channelTextures.forEach((entry) => {
                if (entry && entry.texture) gl.deleteTexture(entry.texture);
            });
        }
    }
    state.shaderPreview.runtime = null;
    if (!opts.keepStatus) {
        addEvent('warn', 'Shader 预览运行时已重置。');
    }
}

function ensureShaderPreviewRuntime() {
    if (!dom.shaderPreviewCanvas) return null;
    if (state.shaderPreview.runtime && state.shaderPreview.runtime.gl) {
        return state.shaderPreview.runtime;
    }
    const canvas = dom.shaderPreviewCanvas;
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false
    });
    if (!gl) {
        return null;
    }

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) {
        return null;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const vertices = new Float32Array([
        -1, -1, 0, 0,
        3, -1, 2, 0,
        -1, 3, 0, 2
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    state.shaderPreview.runtime = {
        gl,
        vao,
        vbo,
        program: null,
        uniforms: null,
        channelTextures: [null, null, null, null],
        lastWidth: 0,
        lastHeight: 0,
        lastMs: 0,
        elapsedSec: 0,
        frame: 0
    };
    return state.shaderPreview.runtime;
}

function setShaderPreviewCanvasStyle(bgMode) {
    if (!dom.shaderPreviewCanvas) return;
    const safeBgMode = normalizeShaderPreviewBgMode(bgMode);
    if (safeBgMode === 'transparent') {
        dom.shaderPreviewCanvas.style.background = [
            'linear-gradient(45deg, #1f1f21 25%, transparent 25%) 0 0 / 16px 16px',
            'linear-gradient(-45deg, #1f1f21 25%, transparent 25%) 0 0 / 16px 16px',
            'linear-gradient(45deg, transparent 75%, #1f1f21 75%) 0 0 / 16px 16px',
            'linear-gradient(-45deg, transparent 75%, #1f1f21 75%) 0 0 / 16px 16px',
            '#2a2d31'
        ].join(',');
        return;
    }
    if (safeBgMode === 'white') {
        dom.shaderPreviewCanvas.style.background = '#ffffff';
        return;
    }
    dom.shaderPreviewCanvas.style.background = '#000000';
}

function applyShaderPreviewBlendMode(gl, mode) {
    const safeMode = normalizeShaderPreviewRenderMode(mode);
    gl.enable(gl.BLEND);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    if (safeMode === 'additive') {
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        return;
    }
    if (safeMode === 'multiply') {
        gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        return;
    }
    if (safeMode === 'screen') {
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        return;
    }
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}

function setBoundShaderTextureAddressMode(gl, mode) {
    const safeMode = normalizeShaderPreviewAddressMode(mode);
    const wrapValue = safeMode === 'wrap' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapValue);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapValue);
}

function ensureShaderChannelTexture(runtime, slotIndex, source, sourceKey) {
    const safeIndex = normalizeShaderUploadSlotIndex(slotIndex);
    if (safeIndex < 0) return { texture: null, width: 0, height: 0 };
    const gl = runtime.gl;
    const finalKey = String(sourceKey || 'empty');
    const prev = runtime.channelTextures[safeIndex];
    if (prev && prev.key === finalKey && prev.texture) {
        return prev;
    }

    if (prev && prev.texture) {
        gl.deleteTexture(prev.texture);
    }
    const texture = createShaderPreviewTexture(gl, source);
    const width = source ? Number(source.width || source.naturalWidth || 0) : 1;
    const height = source ? Number(source.height || source.naturalHeight || 0) : 1;
    const next = {
        key: finalKey,
        texture,
        width: Math.max(1, width || 1),
        height: Math.max(1, height || 1)
    };
    runtime.channelTextures[safeIndex] = next;
    return next;
}

function resolveShaderTextureSourceForSlot(slotIndex) {
    const safeIndex = normalizeShaderUploadSlotIndex(slotIndex);
    if (safeIndex < 0) return { source: null, key: 'empty' };
    const upload = getShaderUploadSlot(safeIndex);
    if (upload && upload.dataUrl) {
        const image = getShaderUploadImage(safeIndex);
        if (image) {
            return { source: image, key: `upload:${upload.dataUrl}` };
        }
    }
    if (safeIndex === 0) {
        const presetCanvas = shaderPreviewImageCanvas(state.shaderPreview.presetImage);
        if (presetCanvas) {
            return { source: presetCanvas, key: `preset:${normalizeShaderPreviewPreset(state.shaderPreview.presetImage)}` };
        }
    }
    return { source: null, key: `empty:${safeIndex}` };
}

function drawShaderPreviewCanvas() {
    if (!dom.shaderPreviewCanvas) return;
    const runtime = ensureShaderPreviewRuntime();
    if (!runtime || !runtime.gl) {
        updateShaderPreviewStatus();
        return;
    }

    const canvas = dom.shaderPreviewCanvas;
    const gl = runtime.gl;
    const viewportNode = dom.shaderPreviewViewport || canvas;
    const rect = viewportNode.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.max(1, Number(globalThis.devicePixelRatio || 1));
    const targetWidth = Math.max(1, Math.round(rect.width * dpr));
    const targetHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        runtime.lastWidth = targetWidth;
        runtime.lastHeight = targetHeight;
    }

    const nowMs = Number(globalThis.performance && performance.now ? performance.now() : Date.now());
    const lastMs = Number(runtime.lastMs || nowMs);
    const deltaSec = Math.max(0, Math.min(SHADER_MAX_TIME_DELTA, (nowMs - lastMs) / 1000));
    runtime.lastMs = nowMs;
    runtime.elapsedSec = Number(runtime.elapsedSec || 0) + deltaSec;

    const safeBgMode = normalizeShaderPreviewBgMode(state.shaderPreview.bgMode);
    const safeAddressMode = normalizeShaderPreviewAddressMode(state.shaderPreview.addressMode);
    setShaderPreviewCanvasStyle(safeBgMode);

    gl.viewport(0, 0, canvas.width, canvas.height);
    if (safeBgMode === 'white') {
        gl.clearColor(1, 1, 1, 1);
    } else if (safeBgMode === 'black') {
        gl.clearColor(0, 0, 0, 1);
    } else {
        gl.clearColor(0, 0, 0, 0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!runtime.program || !runtime.uniforms) {
        updateShaderPreviewStatus();
        return;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    applyShaderPreviewBlendMode(gl, state.shaderPreview.renderMode);

    gl.bindVertexArray(runtime.vao);
    gl.useProgram(runtime.program);

    const resolution = [canvas.width, canvas.height, 1];
    const date = new Date();
    const iDate = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()];
    if (runtime.uniforms.iResolution) gl.uniform3fv(runtime.uniforms.iResolution, resolution);
    if (runtime.uniforms.iTime) gl.uniform1f(runtime.uniforms.iTime, runtime.elapsedSec);
    if (runtime.uniforms.iTimeDelta) gl.uniform1f(runtime.uniforms.iTimeDelta, deltaSec);
    if (runtime.uniforms.iFrame) gl.uniform1i(runtime.uniforms.iFrame, runtime.frame);
    if (runtime.uniforms.iMouse) gl.uniform4fv(runtime.uniforms.iMouse, [0, 0, 0, 0]);
    if (runtime.uniforms.iDate) gl.uniform4fv(runtime.uniforms.iDate, iDate);

    const channelTimes = [runtime.elapsedSec, runtime.elapsedSec, runtime.elapsedSec, runtime.elapsedSec];
    const channelResolutions = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
    for (let i = 0; i < SHADER_UPLOAD_SLOT_COUNT; i += 1) {
        const sourceInfo = resolveShaderTextureSourceForSlot(i);
        const channel = ensureShaderChannelTexture(runtime, i, sourceInfo.source, sourceInfo.key);
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, channel.texture);
        setBoundShaderTextureAddressMode(gl, safeAddressMode);
        channelResolutions[i * 3] = channel.width;
        channelResolutions[i * 3 + 1] = channel.height;
        channelResolutions[i * 3 + 2] = 1;
    }

    if (runtime.uniforms.iChannelTime) gl.uniform1fv(runtime.uniforms.iChannelTime, channelTimes);
    if (runtime.uniforms.iChannelResolution) gl.uniform3fv(runtime.uniforms.iChannelResolution, channelResolutions);
    if (runtime.uniforms.iChannel0) gl.uniform1i(runtime.uniforms.iChannel0, 0);
    if (runtime.uniforms.iChannel1) gl.uniform1i(runtime.uniforms.iChannel1, 1);
    if (runtime.uniforms.iChannel2) gl.uniform1i(runtime.uniforms.iChannel2, 2);
    if (runtime.uniforms.iChannel3) gl.uniform1i(runtime.uniforms.iChannel3, 3);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.useProgram(null);
    runtime.frame += 1;
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
        clearShaderRealtimeCompileTimer();
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
    state.animPreview.previewMarkdownPath = repoPath;
    const model = ensureModelForFile(active);
    const markdownContent = model ? model.getValue() : String(active.content || '');
    const previewPayload = buildMarkdownViewerPreviewPayload(repoPath, markdownContent);
    persistMarkdownViewerPreviewPayload(previewPayload);
    scheduleCompileForReferencedAnims({
        immediate: false,
        reason: '打开预览'
    });
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

    const reason = String(opts.reason || (opts.silent ? '自动' : '手动'));
    const sourceText = state.editor && state.editor.getModel()
        ? state.editor.getModel().getValue()
        : String(active.content || '');
    const result = compileFxSource(sourceText);
    let errors = Array.isArray(result.errors) ? result.errors.slice() : [];

    if (!errors.length) {
        const runtime = ensureShaderPreviewRuntime();
        if (!runtime || !runtime.gl) {
            errors.push({
                line: 1,
                column: 1,
                message: '当前环境不支持 WebGL2，无法实时渲染。'
            });
        } else {
            const programResult = createShaderPreviewProgram(runtime.gl, SHADER_VERTEX_SOURCE, result.fragmentSource);
            if (!programResult.ok) {
                const compileErrors = parseShaderCompileLogErrors(programResult.error);
                errors = compileErrors.length
                    ? compileErrors
                    : [{ line: 1, column: 1, message: String(programResult.error || 'Shader 编译失败') }];
            } else {
                if (runtime.program) {
                    runtime.gl.deleteProgram(runtime.program);
                }
                runtime.program = programResult.program;
                runtime.uniforms = programResult.uniforms;
                runtime.lastMs = 0;
                runtime.elapsedSec = 0;
                runtime.frame = 0;
            }
        }
    }

    const logMessage = errors.length
        ? `${reason}编译失败：${errors.length} 条错误。`
        : `${reason}编译成功：HLSL 已应用到实时渲染。`;
    state.shaderCompile.logs.push(logMessage);
    state.shaderCompile.errors = errors;
    while (state.shaderCompile.logs.length > 120) {
        state.shaderCompile.logs.shift();
    }
    renderShaderCompilePanel({
        log: `[${nowStamp()}] ${logMessage}\n${state.shaderCompile.logs.join('\n')}`,
        errors
    });
    drawShaderPreviewCanvas();
    if (!opts.silent) {
        setActivePanelTab(errors.length ? 'errors' : 'compile');
        showBottomPanel(true);
    }
}

function clearShaderRealtimeCompileTimer() {
    if (!state.shaderPreview.autoCompileTimer) return;
    clearTimeout(state.shaderPreview.autoCompileTimer);
    state.shaderPreview.autoCompileTimer = 0;
}

function scheduleShaderRealtimeCompile(reason) {
    if (activeFileMode() !== 'shaderfx') return;
    clearShaderRealtimeCompileTimer();
    const triggerReason = String(reason || '编辑');
    state.shaderPreview.autoCompileTimer = setTimeout(() => {
        state.shaderPreview.autoCompileTimer = 0;
        runShaderCompileForActiveFile({
            silent: true,
            reason: `自动(${triggerReason})`
        });
    }, SHADER_LIVE_COMPILE_DELAY);
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

function normalizeAnalyzeCompletionProfile(profile) {
    return String(profile || '').toLowerCase() === ANALYZE_COMPLETION_PROFILE_ANIMATION
        ? ANALYZE_COMPLETION_PROFILE_ANIMATION
        : ANALYZE_COMPLETION_PROFILE_TMOD;
}

function completionProfileForPath(pathValue) {
    return isAnimationCsharpFilePath(pathValue)
        ? ANALYZE_COMPLETION_PROFILE_ANIMATION
        : ANALYZE_COMPLETION_PROFILE_TMOD;
}

function workspaceFileByModel(model) {
    if (!model) return null;
    for (let i = 0; i < state.workspace.files.length; i += 1) {
        const file = state.workspace.files[i];
        const knownModel = state.modelByFileId.get(file.id);
        if (knownModel === model) {
            return file;
        }
    }
    return null;
}

function completionProfileForModel(model) {
    const file = workspaceFileByModel(model);
    return completionProfileForPath(file && file.path ? file.path : '');
}

function animationLocalTypeHints(text, offset) {
    const scopeText = String(text || '').slice(0, Math.max(0, Number(offset) || 0));
    const map = new Map();
    let match = null;

    const explicitRe = /\b(AnimContext|AnimInput|ICanvas2D|Vec2|Vec3|Mat4|Color)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
    while ((match = explicitRe.exec(scopeText)) !== null) {
        map.set(String(match[2] || ''), String(match[1] || ''));
    }

    const varNewRe = /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*new\s+(Vec2|Vec3|Mat4|Color)\b/g;
    while ((match = varNewRe.exec(scopeText)) !== null) {
        map.set(String(match[1] || ''), String(match[2] || ''));
    }

    const varInputRe = /\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*ctx\.Input\b/g;
    while ((match = varInputRe.exec(scopeText)) !== null) {
        map.set(String(match[1] || ''), 'AnimInput');
    }

    return map;
}

function animationOwnerTypeAtOffset(text, offset) {
    const scopeText = String(text || '').slice(0, Math.max(0, Number(offset) || 0));
    const memberMatch = scopeText.match(/([A-Za-z_][A-Za-z0-9_\.]*)\.[A-Za-z0-9_]*$/);
    if (!memberMatch) return '';

    const ownerExpr = String(memberMatch[1] || '');
    if (!ownerExpr) return '';
    if (/^(?:ctx|context)\.Input$/i.test(ownerExpr)) {
        return 'AnimInput';
    }
    const owner = ownerExpr.split('.').filter(Boolean).pop() || '';
    if (!owner) return '';
    if (Object.prototype.hasOwnProperty.call(ANIMATION_STATIC_OWNER_TO_TYPE, owner)) {
        return ANIMATION_STATIC_OWNER_TO_TYPE[owner];
    }
    const localHints = animationLocalTypeHints(scopeText, scopeText.length);
    return String(localHints.get(owner) || '');
}

function keywordPrefixAtOffset(text, offset) {
    const scopeText = String(text || '').slice(0, Math.max(0, Number(offset) || 0));
    const match = scopeText.match(/[A-Za-z_][A-Za-z0-9_]*$/);
    return match ? String(match[0] || '').toLowerCase() : '';
}

function buildAnimationCompletionItem(label, kind, detail) {
    return {
        label,
        insertText: label,
        insertTextMode: 'plain',
        source: 'anim-domain',
        kind,
        detail,
        documentation: '',
        sortText: `0_anim_${label}`
    };
}

function buildAnimationDomainCompletionItems(text, offset, maxItems) {
    const prefix = keywordPrefixAtOffset(text, offset);
    const ownerType = animationOwnerTypeAtOffset(text, offset);
    const sourceLabels = ownerType
        ? (ANIMATION_MEMBER_LABELS_BY_TYPE[ownerType] || [])
        : ANIMATION_TYPE_LABELS.concat(ANIMATION_LIFECYCLE_LABELS);

    const seen = new Set();
    const items = [];
    sourceLabels.forEach((label) => {
        const safeLabel = String(label || '');
        if (!safeLabel) return;
        if (prefix && !safeLabel.toLowerCase().startsWith(prefix)) return;
        const dedupeKey = safeLabel.toLowerCase();
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        const kind = ANIMATION_METHOD_LABELS.has(safeLabel)
            ? 'method'
            : (ANIMATION_TYPE_LABEL_SET.has(safeLabel) ? 'class' : 'property');
        const detail = ownerType ? `${ownerType} (anim)` : 'Animation API';
        items.push(buildAnimationCompletionItem(safeLabel, kind, detail));
    });
    return items.slice(0, Math.max(10, Number(maxItems) || 80));
}

function filterAnalyzeItemsForAnimation(items) {
    return (Array.isArray(items) ? items : []).filter((item) => {
        if (!item) return false;
        const source = String(item.source || '').toLowerCase();
        const label = String(item.label || '');
        if (!label) return false;
        if (source === 'keyword') return true;
        if (source === 'type') return ANIMATION_TYPE_LABEL_SET.has(label);
        if (source === 'member') return ANIMATION_MEMBER_LABEL_SET.has(label);
        return false;
    });
}

function mergeCompletionItems(primaryItems, secondaryItems, maxItems) {
    const seen = new Set();
    const merged = [];
    const push = function (item) {
        const label = String(item && item.label || '').toLowerCase();
        if (!label || seen.has(label)) return;
        seen.add(label);
        merged.push(item);
    };

    (Array.isArray(primaryItems) ? primaryItems : []).forEach(push);
    (Array.isArray(secondaryItems) ? secondaryItems : []).forEach(push);
    return merged.slice(0, Math.max(10, Number(maxItems) || 80));
}

function collectRepoExplorerEntries() {
    const map = new Map();
    const pushEntry = (pathValue, kindValue) => {
        const normalizedPath = normalizeEditableWorkspacePathInput(pathValue);
        if (!normalizedPath) return;
        const key = normalizedPath.toLowerCase();
        if (map.has(key)) return;
        map.set(key, {
            path: normalizedPath,
            kind: String(kindValue || '')
        });
    };

    state.repoExplorer.files.forEach((entry) => {
        if (!entry || !entry.path) return;
        pushEntry(entry.path, entry.kind);
    });

    state.workspace.files.forEach((file) => {
        if (!file || !file.path) return;
        const mode = detectFileMode(file.path);
        let kind = 'csharp';
        if (mode === 'markdown') kind = 'markdown';
        else if (mode === 'shaderfx') kind = 'shaderfx';
        else if (mode === 'image') kind = 'image';
        else if (mode === 'video') kind = 'media';
        pushEntry(file.path, kind);
    });

    return Array.from(map.values()).sort((left, right) => stableRepoPathCompare(left.path, right.path));
}

function buildRepoExplorerTree(entries) {
    const root = {
        dirs: new Map(),
        files: new Map()
    };

    const appendEntry = (entry) => {
        const normalizedPath = normalizeEditableWorkspacePathInput(entry && entry.path);
        if (!normalizedPath) return;
        const segments = splitRepoPathSegments(normalizedPath);
        if (!segments.length) return;

        let cursor = root;
        for (let i = 0; i < segments.length; i += 1) {
            const segment = segments[i];
            const segmentPath = segments.slice(0, i + 1).join('/');
            const key = segment.toLowerCase();
            const isLast = i === segments.length - 1;

            if (isLast) {
                if (!cursor.files.has(key)) {
                    cursor.files.set(key, {
                        type: 'file',
                        name: segment,
                        path: segmentPath,
                        kind: String(entry.kind || '')
                    });
                }
                continue;
            }

            if (!cursor.dirs.has(key)) {
                cursor.dirs.set(key, {
                    type: 'dir',
                    name: segment,
                    path: segmentPath,
                    dirs: new Map(),
                    files: new Map()
                });
            }
            cursor = cursor.dirs.get(key);
        }
    };

    (Array.isArray(entries) ? entries : []).forEach((entry) => appendEntry(entry));

    const toChildren = (folder) => {
        const dirs = Array.from(folder.dirs.values())
            .sort((left, right) => stableRepoPathCompare(left.name.toLowerCase(), right.name.toLowerCase()))
            .map((dir) => ({
                type: 'dir',
                name: dir.name,
                path: dir.path,
                children: toChildren(dir)
            }));
        const files = Array.from(folder.files.values())
            .sort((left, right) => stableRepoPathCompare(left.name.toLowerCase(), right.name.toLowerCase()))
            .map((file) => ({
                type: 'file',
                name: file.name,
                path: file.path,
                kind: file.kind
            }));
        return dirs.concat(files);
    };

    return toChildren(root);
}

function appendRepoExplorerHintItem(text, className) {
    if (!dom.fileList) return;
    const li = document.createElement('li');
    li.className = className || 'repo-tree-hint';
    li.textContent = String(text || '');
    dom.fileList.appendChild(li);
}

function renderRepoExplorerTree() {
    if (!dom.fileList) return;
    dom.fileList.innerHTML = '';

    if (state.repoExplorer.loading) {
        appendRepoExplorerHintItem('正在加载可编辑目录索引...', 'repo-tree-hint');
    }
    if (state.repoExplorer.loadError) {
        appendRepoExplorerHintItem(state.repoExplorer.loadError, 'repo-tree-hint repo-tree-hint-error');
    }

    const entries = collectRepoExplorerEntries();
    if (!entries.length) {
        appendRepoExplorerHintItem('没有可编辑文件。');
        return;
    }

    const active = getActiveFile();
    const tree = buildRepoExplorerTree(entries);
    const renderNodes = (nodes, depth) => {
        nodes.forEach((node) => {
            if (!node || !node.path) return;

            const li = document.createElement('li');
            li.className = 'repo-tree-node';

            if (node.type === 'dir') {
                const expanded = state.repoExplorer.expandedDirs.has(node.path);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'repo-tree-toggle';
                btn.style.setProperty('--tree-depth', String(depth));
                btn.textContent = `${expanded ? '▾' : '▸'} ${node.name}`;
                btn.title = node.path;
                btn.addEventListener('click', () => {
                    if (expanded) {
                        state.repoExplorer.expandedDirs.delete(node.path);
                    } else {
                        state.repoExplorer.expandedDirs.add(node.path);
                    }
                    updateFileListUi();
                });
                li.appendChild(btn);
                dom.fileList.appendChild(li);

                if (expanded) {
                    renderNodes(node.children || [], depth + 1);
                }
                return;
            }

            const loaded = !!findWorkspaceFileByContentPath(node.path);
            const isActive = !!(active && isSameContentRelativePath(active.path, node.path));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = loaded
                ? 'file-item repo-tree-file'
                : 'file-item repo-tree-file repo-tree-file-unloaded';
            btn.style.setProperty('--tree-depth', String(depth));
            btn.textContent = node.name;
            btn.title = loaded
                ? node.path
                : `${node.path}（点击加载）`;
            btn.setAttribute('aria-current', isActive ? 'true' : 'false');
            btn.addEventListener('click', () => {
                openRepoExplorerFile(node.path).catch((error) => {
                    addEvent('error', `打开文件失败：${error.message}`);
                });
            });
            li.appendChild(btn);
            dom.fileList.appendChild(li);
        });
    };

    renderNodes(tree, 0);
}

async function readBlobAsDataUrl(blob) {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('读取资源文件失败'));
        reader.readAsDataURL(blob);
    });
}

async function loadWorkspaceFileContentFromSite(pathValue) {
    const relativePath = normalizeEditableWorkspacePathInput(pathValue);
    if (!relativePath) {
        throw new Error('文件路径不在可编辑白名单');
    }
    const url = toSiteContentFetchUrl(relativePath);
    if (!url) {
        throw new Error('文件路径非法');
    }

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const mode = detectFileMode(relativePath);
    if (mode === 'image' || mode === 'video') {
        const blob = await response.blob();
        return await readBlobAsDataUrl(blob);
    }

    return String(await response.text()).replace(/\r\n/g, '\n');
}

async function openRepoExplorerFile(pathValue, options) {
    const opts = options || {};
    const relativePath = normalizeEditableWorkspacePathInput(pathValue);
    if (!relativePath) {
        throw new Error('路径不在可编辑白名单内');
    }

    let file = findWorkspaceFileByContentPath(relativePath);
    const createdNow = !file;
    if (!file) {
        file = {
            id: createFileId(),
            path: relativePath,
            content: ''
        };
        state.workspace.files.push(file);
    }

    if (createdNow || opts.reload === true) {
        try {
            const content = await loadWorkspaceFileContentFromSite(relativePath);
            file.content = content;
        } catch (error) {
            if (createdNow) {
                state.workspace.files = state.workspace.files.filter((entry) => entry.id !== file.id);
                removeModelForFile(file.id);
            }
            throw error;
        }
    }

    const model = ensureModelForFile(file);
    if (model && model.getValue() !== String(file.content || '')) {
        model.setValue(String(file.content || ''));
    }
    switchActiveFile(file.id);
    updateFileListUi();
    scheduleWorkspaceSave();
    scheduleUnifiedStateSave();
    return file;
}

async function loadIdeEditableIndex(options) {
    const opts = options || {};
    if (state.repoExplorer.loaded && !opts.force) {
        return state.repoExplorer.files;
    }

    state.repoExplorer.loading = true;
    state.repoExplorer.loadError = '';
    updateFileListUi();

    try {
        const requestUrl = `${IDE_EDITABLE_INDEX_PATH}?ts=${Date.now()}`;
        const response = await fetch(requestUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`加载 ide-editable-index 失败（HTTP ${response.status}）`);
        }
        const payload = await response.json();
        const entries = [];
        const seen = new Set();
        (Array.isArray(payload && payload.files) ? payload.files : []).forEach((entry) => {
            const normalizedPath = normalizeEditableWorkspacePathInput(entry && entry.path || '');
            if (!normalizedPath) return;
            const dedupeKey = normalizedPath.toLowerCase();
            if (seen.has(dedupeKey)) return;
            seen.add(dedupeKey);
            entries.push({
                path: normalizedPath,
                kind: String(entry && entry.kind || '')
            });
        });

        entries.sort((left, right) => stableRepoPathCompare(left.path, right.path));
        state.repoExplorer.files = entries;
        state.repoExplorer.generatedAt = String(payload && payload.generatedAt || '');
        state.repoExplorer.loaded = true;
        state.repoExplorer.loading = false;
        state.repoExplorer.loadError = '';

        if (state.repoExplorer.expandedDirs.size <= 0) {
            entries.forEach((entry) => {
                const first = splitRepoPathSegments(entry.path)[0];
                if (first) state.repoExplorer.expandedDirs.add(first);
            });
        }

        updateFileListUi();
        return entries;
    } catch (error) {
        state.repoExplorer.loading = false;
        state.repoExplorer.loaded = false;
        state.repoExplorer.loadError = `索引加载失败：${error.message}`;
        updateFileListUi();
        if (!opts.silent) {
            addEvent('error', state.repoExplorer.loadError);
        }
        return [];
    }
}

function updateFileListUi() {
    renderRepoExplorerTree();

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
            onWorkspaceCsharpContentChanged(file);
            return;
        }
        if (detectFileMode(file.path) === 'markdown') {
            const markdownRepoPath = normalizeMarkdownRepoPath(file.path);
            const previewRepoPath = normalizeMarkdownRepoPath(state.animPreview.previewMarkdownPath);
            if (previewRepoPath && markdownRepoPath === previewRepoPath) {
                scheduleMarkdownPreviewSync({
                    markdownPath: previewRepoPath,
                    refreshAnimRefs: true
                });
            }
            return;
        }
        if (detectFileMode(file.path) === 'shaderfx') {
            scheduleShaderRealtimeCompile('编辑');
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

function buildAnalyzeCacheKey(model, offset, maxItems, features, completionProfile) {
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
        featureMask,
        normalizeAnalyzeCompletionProfile(completionProfile)
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
    const completionProfile = normalizeAnalyzeCompletionProfile(
        (options && options.completionProfile)
        || (features.completion ? completionProfileForModel(model) : ANALYZE_COMPLETION_PROFILE_TMOD)
    );
    const cacheKey = buildAnalyzeCacheKey(model, offset, maxItems, features, completionProfile);
    if (state.analyzeCache.has(cacheKey)) {
        return await state.analyzeCache.get(cacheKey);
    }

    const request = {
        text: model.getValue(),
        offset: Math.max(0, Number(offset) || 0),
        maxItems,
        features,
        completionProfile
    };

    const promise = languageRpc.call(MESSAGE_TYPES.ANALYZE_V2_REQUEST, request).then((payload) => {
        if (!features.completion || completionProfile !== ANALYZE_COMPLETION_PROFILE_ANIMATION) {
            return payload;
        }
        const safePayload = payload && typeof payload === 'object' ? payload : {};
        const fromAnalyze = filterAnalyzeItemsForAnimation(safePayload.completionItems);
        const fromAnimDomain = buildAnimationDomainCompletionItems(request.text, request.offset, maxItems);
        return {
            ...safePayload,
            completionItems: mergeCompletionItems(fromAnimDomain, fromAnalyze, maxItems)
        };
    }).finally(() => {
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
        const previousTutorialPath = normalizeRepoPath(state.route.tutorialPath);
        const route = parseRouteFromUrl();
        state.route.workspace = normalizeWorkspaceName(route.workspace);
        state.route.panel = normalizePanelName(route.panel);
        state.route.tutorialPath = normalizeMarkdownRepoPath(route.tutorialPath);
        setActiveWorkspace(state.route.workspace, { syncUrl: false, persist: true, collect: true, replaceUrl: true })
            .then(async () => {
                if (normalizeRepoPath(state.route.tutorialPath) !== previousTutorialPath) {
                    await ensureTutorialMarkdownRouteLoaded();
                }
            })
            .catch(() => {});
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

    installShaderPreviewViewportInteractions();

    if (dom.shaderPreviewZoomOut) {
        dom.shaderPreviewZoomOut.addEventListener('click', () => {
            setShaderPreviewZoom(Number(state.shaderPreview.viewScale || 1) * (1 - SHADER_PREVIEW_ZOOM_STEP));
        });
    }

    if (dom.shaderPreviewZoomReset) {
        dom.shaderPreviewZoomReset.addEventListener('click', () => {
            resetShaderPreviewView();
        });
    }

    if (dom.shaderPreviewZoomIn) {
        dom.shaderPreviewZoomIn.addEventListener('click', () => {
            setShaderPreviewZoom(Number(state.shaderPreview.viewScale || 1) * (1 + SHADER_PREVIEW_ZOOM_STEP));
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
            applyShaderPreviewViewportWidth({ redraw: false, status: false });
            drawShaderPreviewCanvas();
            updateShaderPreviewStatus();
        }
    });

    dom.btnAddFile.addEventListener('click', function () {
        const input = globalThis.prompt('请输入新文件名（site/content 下白名单路径）', '怎么贡献/新文章.md');
        if (!input) return;

        const fileName = normalizeEditableWorkspacePathInput(input);
        if (!fileName) {
            addEvent('error', '路径必须位于 site/content 白名单（.md / anims/*.cs / **/code/*.cs / .fx / **/imgs/* / **/media/*）');
            return;
        }

        const exists = state.workspace.files.some((file) => isSameContentRelativePath(file.path, fileName));
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

        const input = globalThis.prompt('请输入新的文件名（site/content 下白名单路径）', normalizeContentRelativePath(active.path));
        if (!input) return;

        const next = normalizeEditableWorkspacePathInput(input);
        if (!next) {
            addEvent('error', '路径必须位于 site/content 白名单（.md / anims/*.cs / **/code/*.cs / .fx / **/imgs/* / **/media/*）');
            return;
        }

        const exists = state.workspace.files.some((file) => {
            return file.id !== active.id && isSameContentRelativePath(file.path, next);
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
    state.animPreview.bridgeEndpoint = normalizeAnimBridgeEndpoint(
        readStoredAnimBridgeEndpoint() || ANIMCS_DEFAULT_BRIDGE_ENDPOINT
    ) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT;
    persistAnimBridgeEndpoint(state.animPreview.bridgeEndpoint);
    state.animPreview.bridgeConnected = false;
    setAnimCompileStatus('未激活');

    const route = parseRouteFromUrl();
    state.route.workspace = normalizeWorkspaceName(route.workspace);
    state.route.panel = normalizePanelName(route.panel);
    state.route.tutorialPath = normalizeMarkdownRepoPath(route.tutorialPath);
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
                panel: normalizePanelName(state.route.panel),
                tutorialPath: normalizeMarkdownRepoPath(state.route.tutorialPath)
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
    await loadIdeEditableIndex({ silent: true });

    const workspace = csharpWorkspaceFromUnifiedState() || await loadWorkspace();
    applyWorkspace(workspace);
    await ensureTutorialMarkdownRouteLoaded();
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
