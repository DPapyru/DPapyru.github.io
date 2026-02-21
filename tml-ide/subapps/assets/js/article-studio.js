(function () {
    'use strict';

    const STORAGE_KEY = 'articleStudioMarkdown.v9';
    const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';
    const VIEWER_PREVIEW_STORAGE_KEY = 'articleStudioViewerPreview.v1';
    const STORAGE_DEBOUNCE_MS = 300;
    const PREVIEW_SYNC_DEBOUNCE_MS = 120;
    const DEFAULT_PR_WORKER_API_URL = 'https://greenhome-pr.3577415213.workers.dev/api/create-pr';
    const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
    const MAX_IMAGE_COUNT = 12;
    const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024;
    const MAX_MEDIA_COUNT = 8;
    const MAX_CSHARP_FILE_SIZE = 200 * 1024;
    const MAX_CSHARP_COUNT = 5;
    const FLOWCHART_REALTIME_DEBOUNCE_MS = 500;
    const ANIMCS_BRIDGE_STORAGE_KEY = 'articleStudioAnimBridgeEndpoint.v1';
    const ANIMCS_DEFAULT_BRIDGE_ENDPOINT = 'http://127.0.0.1:5078';
    const ANIMCS_BRIDGE_CANDIDATE_ENDPOINTS = [ANIMCS_DEFAULT_BRIDGE_ENDPOINT, 'http://127.0.0.1:5178'];
    const ANIMCS_COMPILE_DEBOUNCE_MS = 400;
    const ANIMCS_COMPILE_TIMEOUT_MS = 8000;

    const dom = {
        markdown: document.getElementById('studio-markdown'),
        previewFrame: document.getElementById('studio-preview-frame'),
        openViewerPreview: document.getElementById('studio-open-viewer-preview'),
        openExplorer: document.getElementById('studio-open-explorer'),
        openPublish: document.getElementById('studio-open-publish'),
        openMarkdownGuide: document.getElementById('studio-open-markdown-guide'),
        runDraftCheck: document.getElementById('studio-run-draft-check'),
        leftPanelModal: document.getElementById('studio-left-panel-modal'),
        leftPanelClose: document.getElementById('studio-left-panel-close'),
        rightPanelModal: document.getElementById('studio-right-panel-modal'),
        rightPanelClose: document.getElementById('studio-right-panel-close'),
        markdownGuideModal: document.getElementById('studio-markdown-guide-modal'),
        markdownGuideClose: document.getElementById('studio-markdown-guide-close'),
        draftCheckModal: document.getElementById('studio-draft-check-modal'),
        draftCheckClose: document.getElementById('studio-draft-check-close'),
        draftCheckSummary: document.getElementById('studio-draft-check-summary'),
        draftCheckList: document.getElementById('studio-draft-check-list'),
        prManifestSummary: document.getElementById('studio-pr-manifest-summary'),
        prManifestArticleList: document.getElementById('studio-pr-manifest-article-list'),
        prManifestTextureList: document.getElementById('studio-pr-manifest-texture-list'),
        prManifestCsharpList: document.getElementById('studio-pr-manifest-csharp-list'),
        prAssetDecisionModal: document.getElementById('studio-pr-asset-decision-modal'),
        prAssetDecisionClose: document.getElementById('studio-pr-asset-decision-close'),
        prAssetDecisionSummary: document.getElementById('studio-pr-asset-decision-summary'),
        prAssetDecisionChoiceStage: document.getElementById('studio-pr-asset-decision-choice-stage'),
        prAssetDecisionContinueStage: document.getElementById('studio-pr-asset-decision-continue-stage'),
        prAssetActionClearNew: document.getElementById('studio-pr-asset-action-clear-new'),
        prAssetActionContinuePr: document.getElementById('studio-pr-asset-action-continue-pr'),
        prAssetActionCancel: document.getElementById('studio-pr-asset-action-cancel'),
        prAssetContinueSelect: document.getElementById('studio-pr-asset-continue-select'),
        prAssetContinueRefresh: document.getElementById('studio-pr-asset-continue-refresh'),
        prAssetContinueSubmit: document.getElementById('studio-pr-asset-continue-submit'),
        prAssetContinueBack: document.getElementById('studio-pr-asset-continue-back'),
        prAssetContinueHint: document.getElementById('studio-pr-asset-continue-hint'),
        flowchartToggle: document.getElementById('studio-flowchart-toggle'),
        flowchartModal: document.getElementById('studio-flowchart-modal'),
        flowchartModalClose: document.getElementById('studio-flowchart-modal-close'),
        flowchartModeVisual: document.getElementById('studio-flowchart-mode-visual'),
        flowchartModeSource: document.getElementById('studio-flowchart-mode-source'),
        flowchartBindingStatus: document.getElementById('studio-flowchart-binding-status'),
        flowchartRebind: document.getElementById('studio-flowchart-rebind'),
        flowchartBindNew: document.getElementById('studio-flowchart-bind-new'),
        flowchartRealtimeToggle: document.getElementById('studio-flowchart-realtime-toggle'),
        flowchartVisualPanel: document.getElementById('studio-flowchart-visual-panel'),
        flowchartSourcePanel: document.getElementById('studio-flowchart-source-panel'),
        flowchartDirection: document.getElementById('studio-flowchart-direction'),
        flowchartNodeList: document.getElementById('studio-flowchart-node-list'),
        flowchartEdgeList: document.getElementById('studio-flowchart-edge-list'),
        flowchartAddNode: document.getElementById('studio-flowchart-add-node'),
        flowchartAddEdge: document.getElementById('studio-flowchart-add-edge'),
        flowchartGeneratedSource: document.getElementById('studio-flowchart-generated-source'),
        flowchartCopySource: document.getElementById('studio-flowchart-copy-source'),
        flowchartApply: document.getElementById('studio-flowchart-apply'),
        flowchartSourceEditor: document.getElementById('studio-flowchart-source-editor'),
        flowchartSourceApply: document.getElementById('studio-flowchart-source-apply'),
        flowchartTryVisual: document.getElementById('studio-flowchart-try-visual'),
        flowchartSourceReset: document.getElementById('studio-flowchart-source-reset'),
        status: document.getElementById('studio-status'),
        stats: document.getElementById('studio-stats'),
        animBridgeStatus: document.getElementById('studio-anim-bridge-status'),
        animCompileStatus: document.getElementById('studio-anim-compile-status'),
        currentPath: document.getElementById('studio-current-path'),
        breadcrumbPath: document.getElementById('studio-breadcrumb-path'),
        editorPath: document.getElementById('studio-editor-path'),
        activeTab: document.getElementById('studio-active-tab'),
        tabsStrip: document.getElementById('studio-tabs-strip'),
        toggleDirectPreview: document.getElementById('studio-toggle-direct-preview'),
        targetPath: document.getElementById('studio-target-path'),
        filename: document.getElementById('studio-filename'),
        explorerFilter: document.getElementById('studio-explorer-filter'),
        explorerRefresh: document.getElementById('studio-explorer-refresh'),
        explorerTree: document.getElementById('studio-explorer-tree'),
        stageList: document.getElementById('studio-stage-list'),
        stageClear: document.getElementById('studio-stage-clear'),
        explorerContextTrigger: document.getElementById('studio-explorer-context-trigger'),
        explorerContextMenu: document.getElementById('studio-explorer-context-menu'),
        existingSelect: document.getElementById('studio-existing-select'),
        categorySelect: document.getElementById('studio-category-select'),
        topicSelect: document.getElementById('studio-topic-select'),
        fileSelect: document.getElementById('studio-file-select'),
        pathBreadcrumb: document.getElementById('studio-path-breadcrumb'),
        directoryParent: document.getElementById('studio-directory-parent'),
        newDirectoryName: document.getElementById('studio-new-directory-name'),
        createDirectory: document.getElementById('studio-create-directory'),
        loadExisting: document.getElementById('studio-load-existing'),
        loadPath: document.getElementById('studio-load-path'),
        copyMarkdown: document.getElementById('studio-copy-markdown'),
        exportJson: document.getElementById('studio-export'),
        importJson: document.getElementById('studio-import'),
        importFile: document.getElementById('studio-import-file'),
        reset: document.getElementById('studio-reset'),
        insertTemplate: document.getElementById('studio-insert-template'),
        formatMarkdown: document.getElementById('studio-format-markdown'),
        insertImage: document.getElementById('studio-insert-image'),
        assetUpload: document.getElementById('studio-asset-upload'),
        imageUpload: document.getElementById('studio-image-upload'),
        imageList: document.getElementById('studio-image-list'),
        mediaUpload: document.getElementById('studio-media-upload'),
        mediaList: document.getElementById('studio-media-list'),
        csharpUpload: document.getElementById('studio-csharp-upload'),
        csharpList: document.getElementById('studio-csharp-list'),
        csharpSymbolSelect: document.getElementById('studio-csharp-symbol-select'),
        csharpInsertSymbol: document.getElementById('studio-csharp-insert-symbol'),
        csharpEditorModal: document.getElementById('studio-csharp-editor-modal'),
        csharpEditorTitle: document.getElementById('studio-csharp-editor-title'),
        csharpEditorClose: document.getElementById('studio-csharp-editor-close'),
        csharpEditorText: document.getElementById('studio-csharp-editor-text'),
        csharpEditorPreviewCode: document.getElementById('studio-csharp-editor-preview-code'),
        csharpEditorSave: document.getElementById('studio-csharp-editor-save'),
        csharpEditorCancel: document.getElementById('studio-csharp-editor-cancel'),
        csharpBridgeEndpoint: document.getElementById('studio-csharp-bridge-endpoint'),
        csharpBridgeSave: document.getElementById('studio-csharp-bridge-save'),
        csharpBridgeReset: document.getElementById('studio-csharp-bridge-reset'),
        csharpCompileHint: document.getElementById('studio-csharp-compile-hint'),
        metaTitle: document.getElementById('studio-meta-title'),
        metaAuthor: document.getElementById('studio-meta-author'),
        metaTopic: document.getElementById('studio-meta-topic'),
        metaDescription: document.getElementById('studio-meta-description'),
        metaOrder: document.getElementById('studio-meta-order'),
        metaDifficulty: document.getElementById('studio-meta-difficulty'),
        metaTime: document.getElementById('studio-meta-time'),
        metaPrevChapter: document.getElementById('studio-meta-prev-chapter'),
        metaNextChapter: document.getElementById('studio-meta-next-chapter'),
        metaMinC: document.getElementById('studio-meta-min-c'),
        metaMinT: document.getElementById('studio-meta-min-t'),
        colorName: document.getElementById('studio-color-name'),
        colorValue: document.getElementById('studio-color-value'),
        colorAdd: document.getElementById('studio-color-add'),
        colorList: document.getElementById('studio-color-list'),
        colorChangeName: document.getElementById('studio-color-change-name'),
        colorChangeValues: document.getElementById('studio-color-change-values'),
        colorChangeAdd: document.getElementById('studio-color-change-add'),
        colorChangeList: document.getElementById('studio-color-change-list'),
        toggleFullscreen: document.getElementById('studio-toggle-fullscreen'),
        submitPr: document.getElementById('studio-submit-pr'),
        prWorkerUrl: document.getElementById('studio-pr-worker-url'),
        prSharedKey: document.getElementById('studio-pr-shared-key'),
        prTitle: document.getElementById('studio-pr-title'),
        prChainSelect: document.getElementById('studio-pr-chain-select'),
        refreshMyPrs: document.getElementById('studio-refresh-my-prs'),
        clearAssets: document.getElementById('studio-clear-assets'),
        togglePreviewImageNotice: document.getElementById('studio-toggle-preview-image-notice'),
        authLogin: document.getElementById('studio-auth-login'),
        authLogout: document.getElementById('studio-auth-logout'),
        authStatus: document.getElementById('studio-auth-status'),
        lastPrLink: document.getElementById('studio-last-pr-link'),
        workspace: document.querySelector('.studio-lazy-workspace'),
        workspaceResizers: Array.from(document.querySelectorAll('[data-studio-resize]')),
        rightTabButtons: Array.from(document.querySelectorAll('[data-right-tab]')),
        rightTabPanels: Array.from(document.querySelectorAll('[data-right-tab-panel]')),
        commandProxyButtons: Array.from(document.querySelectorAll('[data-proxy-target]')),
        activityButtons: Array.from(document.querySelectorAll('[data-studio-rail]')),
        syntaxButtons: Array.from(document.querySelectorAll('[data-studio-insert]')),
        titlebar: document.querySelector('.studio-titlebar')
    };

    const state = {
        markdown: '',
        targetPath: '怎么贡献/新文章.md',
        workerApiUrl: DEFAULT_PR_WORKER_API_URL,
        prTitle: '',
        lastPrUrl: '',
        linkedPrNumber: '',
        myOpenPrs: [],
        uploadedImages: [],
        uploadedMedia: [],
        uploadedCsharpFiles: [],
        csharpSymbolEntries: [],
        csharpEditorTargetId: '',
        csharpEditorDraft: '',
        compiledAnims: {},
        animCompileErrors: {},
        animBridgeEndpoint: ANIMCS_DEFAULT_BRIDGE_ENDPOINT,
        animBridgeConnected: false,
        animCompileStatus: '未激活',
        preflightPending: false,
        previewImageNoticeEnabled: true,
        isDirectPreview: false,
        openTabs: [],
        draftFiles: {},
        fileBaselines: {},
        explorerFilter: '',
        explorerFolders: {},
        rightPanelTab: 'command',
        layout: {
            leftWidth: 300,
            rightWidth: 368
        },
        explorerContext: {
            open: false,
            path: '',
            kind: 'markdown',
            resourceId: '',
            treeKey: '',
            x: 0,
            y: 0
        },
        metadata: {
            title: '',
            author: '',
            topic: 'article-contribution',
            description: '',
            order: '',
            difficulty: 'beginner',
            time: '',
            prev_chapter: '',
            next_chapter: '',
            min_c: '',
            min_t: '',
            colors: {},
            colorChange: {}
        },
        authToken: '',
        githubUser: '',
        isFullscreen: false,
        prAssetDecisionStage: 'choice',
        prAssetDecisionResolver: null,
        flowchartDrawer: {
            open: false,
            mode: 'visual',
            realtimeEnabled: true,
            parseStatus: 'idle',
            boundBlock: null,
            model: null,
            generatedSource: '',
            sourceDraft: '',
            nextNodeSeq: 1
        }
    };

    let saveTimer = 0;
    let previewSyncTimer = 0;
    let flowchartRealtimeTimer = 0;
    let animCompileTimer = 0;
    let animCompileRequestSeq = 0;
    let lastPreviewImageNotice = '';
    let lastPreviewImageNoticeAt = 0;
    let metaSyncLock = false;
    let knownMarkdownEntries = [];
    let indexedExplorerResources = [];
    let explorerResourceIndexStamp = '';
    let explorerResourceIndexRunId = 0;
    const BUILTIN_COLOR_NAMES = new Set([
        'primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info', 'link',
        'red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'pink'
    ]);
    const RIGHT_PANEL_TABS = ['command', 'style', 'publish'];
    const WORKSPACE_LAYOUT_LIMITS = {
        leftMin: 220,
        leftMax: 520,
        rightMin: 260,
        rightMax: 560
    };
    const NERD_TREE_GLYPHS = {
        caretClosed: '\uf0da',
        caretOpen: '\uf0d7',
        folderClosed: '\uf07b',
        folderOpen: '\uf07c',
        file: '\uf15b',
        image: '\uf1c5',
        video: '\uf1c8',
        code: '\uf1c9'
    };
    /**
     * @typedef {{
     *   level: 'error' | 'warn',
     *   code: string,
     *   title: string,
     *   detail: string
     * }} DraftCheckIssue
     */

    function nowStamp() {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function setStatus(text) {
        if (!dom.status) return;
        dom.status.textContent = `[${nowStamp()}] ${text}`;
    }

    function clampNumber(value, min, max, fallback) {
        const minValue = Number.isFinite(min) ? min : 0;
        const maxValue = Number.isFinite(max) ? max : minValue;
        const raw = Number(value);
        if (!Number.isFinite(raw)) {
            return Number.isFinite(fallback) ? fallback : minValue;
        }
        return Math.min(maxValue, Math.max(minValue, Math.round(raw)));
    }

    function normalizeRightPanelTab(value) {
        const key = String(value || '').trim().toLowerCase();
        return RIGHT_PANEL_TABS.includes(key) ? key : 'command';
    }

    function normalizeExplorerEntryKind(value) {
        const kind = String(value || '').trim().toLowerCase();
        if (kind === 'image' || kind === 'media' || kind === 'csharp') return kind;
        return 'markdown';
    }

    function isExplorerResourceKind(kind) {
        return normalizeExplorerEntryKind(kind) !== 'markdown';
    }

    function explorerGlyphForKind(kind) {
        const normalized = normalizeExplorerEntryKind(kind);
        if (normalized === 'image') return NERD_TREE_GLYPHS.image;
        if (normalized === 'media') return NERD_TREE_GLYPHS.video;
        if (normalized === 'csharp') return NERD_TREE_GLYPHS.code;
        return NERD_TREE_GLYPHS.file;
    }

    function decodeExplorerPath(pathValue) {
        const normalized = normalizePath(pathValue || '');
        if (!normalized) return '';
        return normalized.split('/').filter(Boolean).map(function (segment) {
            try {
                return decodeURIComponent(segment);
            } catch (_) {
                return segment;
            }
        }).join('/');
    }

    function normalizeExplorerAssetPathForIndex(rawPath, baseMarkdownPath) {
        const text = String(rawPath || '').trim();
        if (!text) return '';
        if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(text)) return '';

        const stripped = text.split('#')[0].split('?')[0].trim();
        if (!stripped) return '';

        if (stripped.startsWith('/')) {
            return decodeExplorerPath(stripped);
        }

        const baseDir = getDirectoryFromPath(ensureMarkdownPath(baseMarkdownPath || state.targetPath));
        const resolved = (stripped.startsWith('./') || stripped.startsWith('../'))
            ? resolveRelativeMarkdownPath(baseDir, stripped)
            : resolveRelativeMarkdownPath(baseDir, `./${stripped}`);
        return decodeExplorerPath(resolved);
    }

    function inferExplorerAssetKindForIndex(pathValue) {
        const path = normalizePath(pathValue || '').toLowerCase();
        if (!path) return '';
        if (/\.cs$/i.test(path)) return 'csharp';
        if (/\.(?:png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path)) return 'image';
        if (/\.(?:mp4|webm)$/i.test(path)) return 'media';
        return '';
    }

    function collectExplorerAssetRefsFromMarkdown(markdownText, baseMarkdownPath) {
        const source = String(markdownText || '');
        if (!source.trim()) return [];

        const refs = [];
        const seen = new Set();
        const pushRef = function (kind, path) {
            const normalizedKind = normalizeExplorerEntryKind(kind);
            const normalizedPath = normalizePath(path || '');
            if (!normalizedPath || !isExplorerResourceKind(normalizedKind)) return;
            const key = `${normalizedKind}:${normalizedPath}`;
            if (seen.has(key)) return;
            seen.add(key);
            refs.push({
                kind: normalizedKind,
                path: normalizedPath
            });
        };

        const linkRegex = /(!?)\[[^\]]*]\(([^)]+)\)/g;
        let match = null;
        while ((match = linkRegex.exec(source)) !== null) {
            const hrefRaw = String(match[2] || '').trim();
            if (!hrefRaw) continue;
            const href = hrefRaw.split(/\s+/)[0];
            const resolvedPath = normalizeExplorerAssetPathForIndex(href, baseMarkdownPath);
            if (!resolvedPath || /\.md$/i.test(resolvedPath)) continue;
            const kind = inferExplorerAssetKindForIndex(resolvedPath);
            if (!kind) continue;
            pushRef(kind, resolvedPath);
        }

        const csRegex = /\{\{cs:([^}\n]+)\}\}/g;
        let csMatch = null;
        while ((csMatch = csRegex.exec(source)) !== null) {
            const parsed = parseCsDirective(csMatch[1]);
            if (!parsed || !parsed.pathPart) continue;
            const resolvedPath = normalizeExplorerAssetPathForIndex(parsed.pathPart, baseMarkdownPath);
            if (!resolvedPath || !/\.cs$/i.test(resolvedPath)) continue;
            pushRef('csharp', resolvedPath);
        }

        const animRegex = /\{\{anim:([^}\n]+)\}\}/g;
        let animMatch = null;
        while ((animMatch = animRegex.exec(source)) !== null) {
            const rawPath = String(animMatch[1] || '').trim();
            if (!rawPath) continue;
            const resolvedPath = normalizePath(rawPath).replace(/^\.\//, '');
            if (!isAnimSourcePath(resolvedPath)) continue;
            pushRef('csharp', resolvedPath);
        }

        const animcsRegex = /```animcs\s*([\s\S]*?)```/g;
        let animcsMatch = null;
        while ((animcsMatch = animcsRegex.exec(source)) !== null) {
            const body = String(animcsMatch[1] || '');
            const firstLine = body.split(/\r?\n/).map(function (line) {
                return String(line || '').trim();
            }).find(Boolean) || '';
            const resolvedPath = normalizePath(firstLine).replace(/^\.\//, '');
            if (!isAnimSourcePath(resolvedPath)) continue;
            pushRef('csharp', resolvedPath);
        }

        return refs;
    }

    function buildRelativeResourcePathFromTarget(assetPath) {
        const targetMarkdownPath = ensureMarkdownPath(state.targetPath || '');
        const fromDir = getDirectoryFromPath(targetMarkdownPath);
        const fromSegments = String(fromDir || '').split('/').filter(Boolean);
        const toSegments = normalizePath(assetPath || '').split('/').filter(Boolean);
        if (toSegments.length <= 0) return './';

        let shared = 0;
        while (shared < fromSegments.length
            && shared < toSegments.length
            && fromSegments[shared] === toSegments[shared]) {
            shared += 1;
        }

        const upCount = Math.max(0, fromSegments.length - shared);
        const upSegments = new Array(upCount).fill('..');
        const downSegments = toSegments.slice(shared);
        const relative = upSegments.concat(downSegments).join('/');
        if (!relative) return './';
        if (relative.startsWith('../')) return relative;
        return `./${relative}`;
    }

    function panelSupportsRightTab(panel, tab) {
        if (!panel || !panel.getAttribute) return false;
        const raw = String(panel.getAttribute('data-right-tab-panel') || '').trim();
        if (!raw) return false;
        return raw.split(/\s+/).includes(tab);
    }

    function setRightPanelTab(tabValue, options) {
        const tab = normalizeRightPanelTab(tabValue);
        state.rightPanelTab = tab;

        if (dom.rightTabButtons && dom.rightTabButtons.length > 0) {
            dom.rightTabButtons.forEach(function (button) {
                const currentTab = normalizeRightPanelTab(button.getAttribute('data-right-tab'));
                const isActive = currentTab === tab;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                button.setAttribute('tabindex', isActive ? '0' : '-1');
            });
        }

        if (dom.rightTabPanels && dom.rightTabPanels.length > 0) {
            dom.rightTabPanels.forEach(function (panel) {
                const visible = panelSupportsRightTab(panel, tab);
                panel.hidden = !visible;
            });
        }

        if (!(options && options.skipSave)) {
            scheduleSave();
        }
    }

    function applyWorkspaceLayout() {
        if (!dom.workspace) return;

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1600;
        const leftMax = Math.min(WORKSPACE_LAYOUT_LIMITS.leftMax, Math.floor(viewportWidth * 0.45));
        const rightMax = Math.min(WORKSPACE_LAYOUT_LIMITS.rightMax, Math.floor(viewportWidth * 0.48));

        state.layout.leftWidth = clampNumber(
            state.layout.leftWidth,
            WORKSPACE_LAYOUT_LIMITS.leftMin,
            Math.max(WORKSPACE_LAYOUT_LIMITS.leftMin, leftMax),
            300
        );
        state.layout.rightWidth = clampNumber(
            state.layout.rightWidth,
            WORKSPACE_LAYOUT_LIMITS.rightMin,
            Math.max(WORKSPACE_LAYOUT_LIMITS.rightMin, rightMax),
            368
        );

        dom.workspace.style.setProperty('--studio-left-width', `${state.layout.leftWidth}px`);
        dom.workspace.style.setProperty('--studio-right-width', `${state.layout.rightWidth}px`);
    }

    function bindWorkspaceResizers() {
        if (!dom.workspaceResizers || dom.workspaceResizers.length <= 0 || !dom.workspace) return;

        dom.workspaceResizers.forEach(function (handle) {
            handle.addEventListener('pointerdown', function (event) {
                const side = String(handle.getAttribute('data-studio-resize') || '').trim().toLowerCase();
                if (side !== 'left' && side !== 'right') return;

                event.preventDefault();
                const startX = Number(event.clientX || 0);
                const startLeft = Number(state.layout.leftWidth || 300);
                const startRight = Number(state.layout.rightWidth || 368);

                document.body.classList.add('studio-resizing');

                const onMove = function (moveEvent) {
                    const currentX = Number(moveEvent.clientX || 0);
                    const delta = currentX - startX;

                    if (side === 'left') {
                        state.layout.leftWidth = startLeft + delta;
                    } else {
                        state.layout.rightWidth = startRight - delta;
                    }

                    applyWorkspaceLayout();
                };

                const stop = function () {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', stop);
                    document.removeEventListener('pointercancel', stop);
                    document.body.classList.remove('studio-resizing');
                    scheduleSave();
                };

                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', stop);
                document.addEventListener('pointercancel', stop);
            });
        });
    }

    function normalizePath(input) {
        let value = String(input || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
        value = value.replace(/^site\/content\//i, '').replace(/^content\//i, '');
        value = value.replace(/\/{2,}/g, '/');
        return value;
    }

    function normalizeAnimSourcePath(input) {
        return normalizePath(input || '').replace(/^\.\//, '');
    }

    function isAnimSourcePath(input) {
        const normalized = normalizeAnimSourcePath(input);
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
        } catch (_) {
            return '';
        }
    }

    function readStoredAnimBridgeEndpoint() {
        try {
            return normalizeAnimBridgeEndpoint(localStorage.getItem(ANIMCS_BRIDGE_STORAGE_KEY) || '');
        } catch (_) {
            return '';
        }
    }

    function persistAnimBridgeEndpoint(endpoint) {
        try {
            localStorage.setItem(ANIMCS_BRIDGE_STORAGE_KEY, String(endpoint || ''));
        } catch (_) {
            // ignore storage errors
        }
    }

    function renderAnimBridgeStatusline() {
        const endpoint = normalizeAnimBridgeEndpoint(state.animBridgeEndpoint) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT;
        const connected = !!state.animBridgeConnected;
        if (dom.animBridgeStatus) {
            dom.animBridgeStatus.textContent = connected
                ? `AnimBridge: 已连接 ${endpoint}`
                : `AnimBridge: 未连接 ${endpoint}`;
        }
        if (dom.animCompileStatus) {
            dom.animCompileStatus.textContent = `Anim预览: ${String(state.animCompileStatus || '未激活')}`;
        }
        if (dom.csharpBridgeEndpoint && document.activeElement !== dom.csharpBridgeEndpoint) {
            dom.csharpBridgeEndpoint.value = endpoint;
        }
        if (dom.csharpCompileHint) {
            dom.csharpCompileHint.textContent = connected
                ? `桥接可用：${endpoint}`
                : '仅对 anims/*.cs 启用实时编译预览。';
        }
    }

    function setAnimCompileStatus(text) {
        state.animCompileStatus = String(text || '').trim() || '未激活';
        renderAnimBridgeStatusline();
    }

    function ensureMarkdownPath(input) {
        let value = normalizePath(input);

        if (!value) {
            return '怎么贡献/新文章.md';
        }

        if (value.endsWith('/')) {
            value += '新文章.md';
        }

        if (!/\.md$/i.test(value)) {
            value += '.md';
        }

        return value;
    }

    function ensureSafeMarkdownPath(input) {
        const value = ensureMarkdownPath(input);
        const segments = value.split('/').filter(Boolean);

        if (segments.length === 0) {
            throw new Error('目标路径不能为空');
        }

        if (segments.some(function (segment) {
            return segment === '.' || segment === '..';
        })) {
            throw new Error('目标路径不能包含 . 或 ..');
        }

        if (value.includes('\0')) {
            throw new Error('目标路径包含非法字符');
        }

        return value;
    }

    function ensureSafeDirectoryPath(input) {
        const normalized = normalizePath(input).replace(/\/+$/g, '');
        if (!normalized) return '';

        const segments = normalized.split('/').filter(Boolean);
        if (segments.some(function (segment) {
            return segment === '.' || segment === '..' || /[\0]/.test(segment);
        })) {
            throw new Error('父目录包含非法路径段');
        }

        return segments.join('/');
    }

    function ensureSafeDirectoryName(input) {
        const value = String(input || '').trim();
        if (!value) {
            throw new Error('请先填写目录名');
        }
        if (value === '.' || value === '..') {
            throw new Error('目录名不能是 . 或 ..');
        }
        if (/[\\/]/.test(value)) {
            throw new Error('目录名不能包含斜杠，请仅输入单级目录名');
        }
        if (/[\0]/.test(value)) {
            throw new Error('目录名包含非法字符');
        }
        return value;
    }

    function normalizeWorkerApiUrl(input) {
        let value = String(input || '').trim();
        if (!value) return '';

        if (!/^https?:\/\//i.test(value)) {
            value = `https://${value}`;
        }

        value = value.replace(/\/+$/, '');

        value = value.replace(/\/api\/(?:create-pr|preflight-check|my-open-prs|auth\/me|auth\/github\/login)$/i, '');

        if (!/\/api\/create-pr(?:\?|$)/.test(value)) {
            value = `${value}/api/create-pr`;
        }

        return value;
    }

    function workerApiEndpointFromApiUrl(apiUrl, pathname) {
        const workerOrigin = workerOriginFromApiUrl(apiUrl);
        if (!workerOrigin) return '';

        try {
            return new URL(pathname, workerOrigin).toString();
        } catch (_) {
            return '';
        }
    }

    function workerOriginFromApiUrl(apiUrl) {
        const normalized = normalizeWorkerApiUrl(apiUrl);
        if (!normalized) return '';

        try {
            const parsed = new URL(normalized);
            return parsed.origin;
        } catch (_) {
            return '';
        }
    }

    function authLoginUrlFromApiUrl(apiUrl) {
        const workerOrigin = workerOriginFromApiUrl(apiUrl);
        if (!workerOrigin) return '';

        try {
            const loginUrl = new URL('/auth/github/login', workerOrigin);
            const returnTo = `${window.location.origin}${window.location.pathname}`;
            loginUrl.searchParams.set('return_to', returnTo);
            return loginUrl.toString();
        } catch (_) {
            return '';
        }
    }

    function authMeUrlFromApiUrl(apiUrl) {
        return workerApiEndpointFromApiUrl(apiUrl, '/auth/me');
    }

    function myOpenPrsUrlFromApiUrl(apiUrl) {
        return workerApiEndpointFromApiUrl(apiUrl, '/api/my-open-prs');
    }

    function getFilenameFromPath(path) {
        const normalized = normalizePath(path);
        const index = normalized.lastIndexOf('/');
        return index >= 0 ? normalized.slice(index + 1) : normalized;
    }

    function getDirectoryFromPath(path) {
        const normalized = normalizePath(path);
        const index = normalized.lastIndexOf('/');
        return index >= 0 ? normalized.slice(0, index) : '';
    }

    function showPreviewImageMappedNotice(assetPath) {
        if (!state.previewImageNoticeEnabled) return;
        const normalized = normalizePath(assetPath || '');
        if (!normalized) return;

        const now = Date.now();
        if (normalized === lastPreviewImageNotice && now - lastPreviewImageNoticeAt < 1500) {
            return;
        }

        lastPreviewImageNotice = normalized;
        lastPreviewImageNoticeAt = now;
        setStatus(`预览已使用本地草稿图片：${normalized}`);
    }

    function updatePreviewImageNoticeToggleUi() {
        if (!dom.togglePreviewImageNotice) return;
        dom.togglePreviewImageNotice.textContent = state.previewImageNoticeEnabled ? '已开启' : '已关闭';
        dom.togglePreviewImageNotice.classList.toggle('studio-preview-notice-toggle--off', !state.previewImageNoticeEnabled);
    }

    function normalizeFilename(input) {
        let value = String(input || '').trim();
        value = value.replace(/[\\/]/g, '');

        if (!value) {
            value = '新文章.md';
        }

        if (!/\.md$/i.test(value)) {
            value += '.md';
        }

        return value;
    }

    function defaultPrTitle() {
        return `docs: 更新 ${state.targetPath}`;
    }

    function formatBytes(size) {
        const n = Number(size || 0);
        if (!Number.isFinite(n) || n <= 0) return '0 B';
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    }

    function hashText(text) {
        const source = String(text || '');
        let hash = 0;
        for (let i = 0; i < source.length; i++) {
            hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
        }
        return String(Math.abs(hash));
    }

    function ensureObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeMetaNumberInput(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        const parsed = Number.parseInt(text, 10);
        return Number.isFinite(parsed) ? String(parsed) : '';
    }

    function cloneMetadata(metadata) {
        const safe = applyMetadataDefaults(metadata || {});
        const colors = {};
        const colorChange = {};

        Object.keys(ensureObject(safe.colors)).forEach(function (key) {
            const value = String(ensureObject(safe.colors)[key] || '').trim();
            if (!key || !value) return;
            colors[key] = value;
        });

        Object.keys(ensureObject(safe.colorChange)).forEach(function (key) {
            const list = Array.isArray(ensureObject(safe.colorChange)[key]) ? ensureObject(safe.colorChange)[key] : [];
            colorChange[key] = list.map(function (item) {
                return String(item || '').trim();
            }).filter(Boolean);
        });

        return applyMetadataDefaults({
            ...safe,
            colors: colors,
            colorChange: colorChange
        });
    }

    function metadataSignature(metadata) {
        return JSON.stringify(cloneMetadata(metadata));
    }

    function normalizeDraftStatus(status) {
        const key = String(status || '').trim().toLowerCase();
        if (key === 'added' || key === 'modified' || key === 'deleted') return key;
        return 'modified';
    }

    function getDraftStatusCode(status) {
        const key = normalizeDraftStatus(status);
        if (key === 'added') return 'ADD';
        if (key === 'deleted') return 'DEL';
        return 'MOD';
    }

    function getDraftRecord(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return null;
        const draftMap = ensureObject(state.draftFiles);
        const record = draftMap[safePath];
        if (!record || typeof record !== 'object') return null;
        return {
            path: safePath,
            status: normalizeDraftStatus(record.status),
            markdown: String(record.markdown || ''),
            metadata: cloneMetadata(record.metadata || {}),
            updatedAt: String(record.updatedAt || '')
        };
    }

    function setDraftRecord(pathValue, record) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;
        const draftMap = ensureObject(state.draftFiles);
        if (!record) {
            delete draftMap[safePath];
            state.draftFiles = draftMap;
            return;
        }

        draftMap[safePath] = {
            path: safePath,
            status: normalizeDraftStatus(record.status),
            markdown: String(record.markdown || ''),
            metadata: cloneMetadata(record.metadata || {}),
            updatedAt: String(record.updatedAt || new Date().toISOString())
        };
        state.draftFiles = draftMap;
    }

    function setFileBaseline(pathValue, baseline) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;
        const baselineMap = ensureObject(state.fileBaselines);
        baselineMap[safePath] = {
            path: safePath,
            exists: !!(baseline && baseline.exists),
            markdown: String(baseline && baseline.markdown || ''),
            metadata: cloneMetadata(baseline && baseline.metadata || {}),
            updatedAt: new Date().toISOString()
        };
        state.fileBaselines = baselineMap;
    }

    function getFileBaseline(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return null;
        const baselineMap = ensureObject(state.fileBaselines);
        const record = baselineMap[safePath];
        if (!record || typeof record !== 'object') return null;
        return {
            path: safePath,
            exists: !!record.exists,
            markdown: String(record.markdown || ''),
            metadata: cloneMetadata(record.metadata || {}),
            updatedAt: String(record.updatedAt || '')
        };
    }

    function syncDraftForPath(pathValue, markdownText, metadataValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return '';

        const markdown = String(markdownText || '');
        const metadata = cloneMetadata(metadataValue || {});
        const baseline = getFileBaseline(safePath);

        if (baseline && baseline.exists) {
            const pristine = markdown === String(baseline.markdown || '')
                && metadataSignature(metadata) === metadataSignature(baseline.metadata);
            if (pristine) {
                setDraftRecord(safePath, null);
                return '';
            }
            setDraftRecord(safePath, {
                status: 'modified',
                markdown: markdown,
                metadata: metadata,
                updatedAt: new Date().toISOString()
            });
            return 'modified';
        }

        setDraftRecord(safePath, {
            status: 'added',
            markdown: markdown,
            metadata: metadata,
            updatedAt: new Date().toISOString()
        });
        return 'added';
    }

    function syncActiveDraftFromEditor(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const safePath = normalizePath(state.targetPath || '');
        if (!safePath) return '';

        const existing = getDraftRecord(safePath);
        if (existing && existing.status === 'deleted' && !opts.overrideDeleted) {
            return 'deleted';
        }
        return syncDraftForPath(safePath, state.markdown, state.metadata);
    }

    function ensureOpenTab(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;
        const list = Array.isArray(state.openTabs) ? state.openTabs : [];
        if (list.includes(safePath)) {
            state.openTabs = list;
            return;
        }
        list.push(safePath);
        state.openTabs = list;
    }

    function pruneOpenTabs() {
        const safeCurrentPath = normalizePath(state.targetPath || '');
        const list = Array.isArray(state.openTabs) ? state.openTabs : [];
        const dedup = Array.from(new Set(list.map(function (item) {
            return normalizePath(item || '');
        }).filter(Boolean)));
        if (safeCurrentPath && !dedup.includes(safeCurrentPath)) {
            dedup.push(safeCurrentPath);
        }
        state.openTabs = dedup;
    }

    function closeTabByPath(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;

        const list = Array.isArray(state.openTabs) ? state.openTabs.slice() : [];
        const index = list.indexOf(safePath);
        if (index < 0) return;

        if (list.length <= 1) {
            setStatus('至少保留一个标签页');
            return;
        }

        list.splice(index, 1);
        state.openTabs = list;

        const currentPath = normalizePath(state.targetPath || '');
        if (currentPath === safePath) {
            const fallback = list[Math.min(index, list.length - 1)] || list[0] || '';
            if (fallback) {
                openPathFromExplorer(fallback, '标签页');
            }
            return;
        }

        renderExplorerPanels();
        scheduleSave();
        setStatus(`已关闭标签页：${getFilenameFromPath(safePath) || safePath}`);
    }

    function renderTabs() {
        if (!dom.tabsStrip) return;
        pruneOpenTabs();

        const current = normalizePath(state.targetPath || '');
        dom.tabsStrip.innerHTML = '';

        state.openTabs.forEach(function (pathValue) {
            const path = normalizePath(pathValue || '');
            if (!path) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'studio-tab';
            button.dataset.tabPath = path;
            button.textContent = '';

            const label = document.createElement('span');
            label.className = 'studio-tab-label';
            label.textContent = getFilenameFromPath(path) || path;
            button.appendChild(label);

            const close = document.createElement('span');
            close.className = 'studio-tab-close';
            close.dataset.tabClosePath = path;
            close.setAttribute('aria-hidden', 'true');
            close.textContent = 'x';
            button.appendChild(close);

            const draft = getDraftRecord(path);
            if (draft) {
                button.classList.add('studio-tab--dirty');
                button.title = `${getDraftStatusCode(draft.status)} · ${path}`;
            } else {
                button.title = path;
            }

            if (path === current) {
                button.classList.add('studio-tab--active');
                button.setAttribute('aria-current', 'page');
                button.id = 'studio-active-tab';
                dom.activeTab = button;
            }

            dom.tabsStrip.appendChild(button);
        });
    }

    function markdownDirectoryFromTargetPath(pathValue) {
        const markdownPath = ensureMarkdownPath(pathValue || state.targetPath);
        return getDirectoryFromPath(markdownPath);
    }

    function csharpAssetPathFromTarget(targetPath, sourceName) {
        const dir = markdownDirectoryFromTargetPath(targetPath);
        const base = String(sourceName || 'source').trim().toLowerCase().replace(/\.cs$/i, '');
        const safe = base.replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '') || `source-${Date.now().toString(36)}`;
        if (dir) return `${dir}/code/${safe}.cs`;
        return `code/${safe}.cs`;
    }

    function parseColorListInput(raw) {
        const text = String(raw || '').trim();
        if (!text) return [];
        return text.split(',').map(function (item) {
            return String(item || '').trim();
        }).filter(Boolean);
    }

    function metaFieldMap() {
        return {
            title: dom.metaTitle,
            author: dom.metaAuthor,
            topic: dom.metaTopic,
            description: dom.metaDescription,
            order: dom.metaOrder,
            difficulty: dom.metaDifficulty,
            time: dom.metaTime,
            prev_chapter: dom.metaPrevChapter,
            next_chapter: dom.metaNextChapter,
            min_c: dom.metaMinC,
            min_t: dom.metaMinT
        };
    }

    function parseFrontMatterFromMarkdown(markdownText) {
        const text = String(markdownText || '');
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
        const match = text.match(frontMatterRegex);
        if (!match) {
            return {
                metadata: {},
                body: text,
                hasFrontMatter: false
            };
        }

        const yamlText = String(match[1] || '');
        const body = text.slice(match[0].length);
        const meta = {};

        yamlText.split(/\r?\n/).forEach(function (line) {
            const raw = String(line || '');
            if (!raw.trim()) return;
            if (/^\s/.test(raw)) return;

            const idx = raw.indexOf(':');
            if (idx <= 0) return;
            const key = raw.slice(0, idx).trim();
            const value = raw.slice(idx + 1).trim();
            if (!key) return;
            meta[key] = value;
        });

        return {
            metadata: meta,
            body: body,
            hasFrontMatter: true
        };
    }

    function applyMetadataDefaults(metadata) {
        const base = ensureObject(metadata);
        const next = {
            title: String(base.title || '').trim(),
            author: String(base.author || '').trim(),
            topic: String(base.topic || 'article-contribution').trim() || 'article-contribution',
            description: String(base.description || '').trim(),
            order: normalizeMetaNumberInput(base.order),
            difficulty: String(base.difficulty || 'beginner').trim() || 'beginner',
            time: String(base.time || '').trim(),
            prev_chapter: String(base.prev_chapter || '').trim(),
            next_chapter: String(base.next_chapter || '').trim(),
            min_c: normalizeMetaNumberInput(base.min_c),
            min_t: normalizeMetaNumberInput(base.min_t),
            colors: ensureObject(base.colors),
            colorChange: ensureObject(base.colorChange)
        };

        if (!['beginner', 'intermediate', 'advanced'].includes(next.difficulty)) {
            next.difficulty = 'beginner';
        }

        return next;
    }

    function pickMetadataFromParsedFrontMatter(parsedFront) {
        const metadata = ensureObject(parsedFront && parsedFront.metadata);
        const fromState = {
            title: metadata.title,
            author: metadata.author,
            topic: metadata.topic,
            description: metadata.description,
            order: metadata.order,
            difficulty: metadata.difficulty,
            time: metadata.time,
            prev_chapter: metadata.prev_chapter,
            next_chapter: metadata.next_chapter,
            min_c: metadata.min_c,
            min_t: metadata.min_t
        };

        return applyMetadataDefaults({
            ...state.metadata,
            ...fromState
        });
    }

    function buildFrontMatterLinesFromState() {
        const m = applyMetadataDefaults(state.metadata);
        const lines = [
            '---',
            `title: ${m.title || '教程标题'}`,
            `author: ${m.author || '你的名字'}`,
            `topic: ${m.topic || 'article-contribution'}`,
            `description: ${m.description || '一句话说明本文内容'}`,
            `order: ${m.order || '100'}`,
            `difficulty: ${m.difficulty || 'beginner'}`,
            `time: ${m.time || '25分钟'}`
        ];

        if (m.prev_chapter) lines.push(`prev_chapter: ${m.prev_chapter}`);
        if (m.next_chapter) lines.push(`next_chapter: ${m.next_chapter}`);
        if (m.min_c) lines.push(`min_c: ${m.min_c}`);
        if (m.min_t) lines.push(`min_t: ${m.min_t}`);

        const colorEntries = Object.entries(ensureObject(m.colors));
        if (colorEntries.length > 0) {
            lines.push('colors:');
            colorEntries.forEach(function (entry) {
                const key = String(entry[0] || '').trim();
                const value = String(entry[1] || '').trim();
                if (!key || !value) return;
                lines.push(`  ${key}: "${value}"`);
            });
        }

        const colorChangeEntries = Object.entries(ensureObject(m.colorChange));
        if (colorChangeEntries.length > 0) {
            lines.push('colorChange:');
            colorChangeEntries.forEach(function (entry) {
                const key = String(entry[0] || '').trim();
                const values = Array.isArray(entry[1]) ? entry[1] : [];
                if (!key || values.length === 0) return;
                lines.push(`  ${key}:`);
                values.forEach(function (colorText) {
                    const color = String(colorText || '').trim();
                    if (!color) return;
                    lines.push(`    - "${color}"`);
                });
            });
        }

        lines.push('---', '');
        return lines;
    }

    function mergeFrontMatterIntoMarkdown(markdownText) {
        const parsed = parseFrontMatterFromMarkdown(markdownText);
        const body = String(parsed.body || markdownText || '').replace(/^\s+/, '');
        const lines = buildFrontMatterLinesFromState();
        return `${lines.join('\n')}${body}`;
    }

    function setMetadataState(nextMeta, options) {
        const silent = !!(options && options.silent);
        state.metadata = applyMetadataDefaults(nextMeta);
        if (!silent) {
            renderMetadataFormFromState();
            renderColorListsFromState();
        }
    }

    function renderMetadataFormFromState() {
        const mapping = metaFieldMap();
        const m = applyMetadataDefaults(state.metadata);
        Object.keys(mapping).forEach(function (key) {
            const input = mapping[key];
            if (!input) return;
            const nextValue = String(m[key] || '');
            if (String(input.value || '') !== nextValue) {
                input.value = nextValue;
            }
        });
    }

    function createMetaListRow(label, value, onRemove) {
        const row = document.createElement('div');
        row.className = 'studio-meta-item';
        const content = document.createElement('span');
        content.innerHTML = `<strong>${label}</strong>: ${value}`;

        const remove = document.createElement('button');
        remove.className = 'btn btn-small btn-outline';
        remove.type = 'button';
        remove.textContent = '移除';
        remove.addEventListener('click', onRemove);

        row.appendChild(content);
        row.appendChild(remove);
        return row;
    }

    function renderColorListsFromState() {
        if (dom.colorList) {
            dom.colorList.innerHTML = '';
            const entries = Object.entries(ensureObject(state.metadata.colors));
            if (entries.length === 0) {
                const empty = document.createElement('span');
                empty.className = 'studio-help';
                empty.textContent = '暂无自定义颜色';
                dom.colorList.appendChild(empty);
            } else {
                entries.forEach(function (entry) {
                    const row = createMetaListRow(entry[0], String(entry[1] || ''), function () {
                        delete state.metadata.colors[entry[0]];
                        renderColorListsFromState();
                        applyMetadataToMarkdownAndRefresh('已移除颜色配置');
                    });
                    dom.colorList.appendChild(row);
                });
            }
        }

        if (dom.colorChangeList) {
            dom.colorChangeList.innerHTML = '';
            const entries = Object.entries(ensureObject(state.metadata.colorChange));
            if (entries.length === 0) {
                const empty = document.createElement('span');
                empty.className = 'studio-help';
                empty.textContent = '暂无颜色动画';
                dom.colorChangeList.appendChild(empty);
            } else {
                entries.forEach(function (entry) {
                    const values = Array.isArray(entry[1]) ? entry[1] : [];
                    const row = createMetaListRow(entry[0], values.join(', '), function () {
                        delete state.metadata.colorChange[entry[0]];
                        renderColorListsFromState();
                        applyMetadataToMarkdownAndRefresh('已移除颜色动画配置');
                    });
                    dom.colorChangeList.appendChild(row);
                });
            }
        }
    }

    function applyMetadataToMarkdownAndRefresh(statusText) {
        if (metaSyncLock) return;
        metaSyncLock = true;
        const next = mergeFrontMatterIntoMarkdown(state.markdown);
        updateEditorContent(next);
        metaSyncLock = false;
        if (statusText) setStatus(statusText);
    }

    function syncMetadataFromMarkdownEditor(markdownText) {
        if (metaSyncLock) return;
        const parsed = parseFrontMatterFromMarkdown(markdownText);
        const nextMeta = pickMetadataFromParsedFrontMatter(parsed);
        setMetadataState(nextMeta);
        updateChapterSelectOptions();
    }

    function updateMetadataFromForm() {
        const mapping = metaFieldMap();
        const nextMeta = {
            ...state.metadata,
            colors: ensureObject(state.metadata.colors),
            colorChange: ensureObject(state.metadata.colorChange)
        };

        Object.keys(mapping).forEach(function (key) {
            const input = mapping[key];
            if (!input) return;
            nextMeta[key] = String(input.value || '').trim();
        });

        nextMeta.order = normalizeMetaNumberInput(nextMeta.order);
        nextMeta.min_c = normalizeMetaNumberInput(nextMeta.min_c);
        nextMeta.min_t = normalizeMetaNumberInput(nextMeta.min_t);
        setMetadataState(nextMeta, { silent: true });
        applyMetadataToMarkdownAndRefresh('已同步 Metadata 到 Markdown');
    }

    function updateChapterSelectOptions() {
        const updateSingle = function (selectEl, selectedValue) {
            if (!selectEl) return;
            const current = String(selectedValue || '').trim();
            const baseDir = markdownDirectoryFromTargetPath(state.targetPath);
            const candidates = knownMarkdownEntries.filter(function (entry) {
                if (!entry || !entry.path) return false;
                return getDirectoryFromPath(entry.path) === baseDir;
            });

            selectEl.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '(无)';
            selectEl.appendChild(empty);

            candidates.forEach(function (entry) {
                const option = document.createElement('option');
                option.value = entry.path;
                option.textContent = `${entry.path} · ${entry.title || entry.path}`;
                selectEl.appendChild(option);
            });

            if (current) {
                const existing = Array.from(selectEl.options).find(function (opt) {
                    return opt.value === current;
                });

                if (!existing) {
                    const custom = document.createElement('option');
                    custom.value = current;
                    custom.textContent = `${current} · (当前值)`;
                    selectEl.appendChild(custom);
                }
                selectEl.value = current;
            }
        };

        updateSingle(dom.metaPrevChapter, state.metadata.prev_chapter);
        updateSingle(dom.metaNextChapter, state.metadata.next_chapter);
    }

    function dataUrlToPlainText(dataUrl) {
        const text = String(dataUrl || '');
        const comma = text.indexOf(',');
        if (comma < 0) return '';

        try {
            return atob(text.slice(comma + 1));
        } catch (_) {
            return '';
        }
    }

    function readFileAsUtf8Text(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
                const text = String(reader.result || '').replace(/^\uFEFF/, '');
                resolve(text);
            };
            reader.onerror = function () {
                reject(new Error('读取文本失败'));
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    function extractCSharpSymbols(sourceText) {
        const text = String(sourceText || '');
        const result = [];
        const namespaces = [];
        const lines = text.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
            const line = String(lines[i] || '').trim();
            const namespaceMatch = line.match(/^namespace\s+([$_\p{L}\p{N}.]+)/u);
            if (namespaceMatch) {
                namespaces.push(namespaceMatch[1]);
                continue;
            }

            const typeMatch = line.match(/^(?:public|internal|protected|private|static|sealed|partial|abstract|record|class|struct|interface|enum|\s)+\s*(class|struct|interface|enum|record)\s+([$_\p{L}][$_\p{L}\p{N}]*)/u);
            if (typeMatch) {
                const fullType = namespaces.length > 0 ? `${namespaces[namespaces.length - 1]}.${typeMatch[2]}` : typeMatch[2];
                result.push({
                    label: `类型: ${fullType}`,
                    selectorKind: 't',
                    selector: fullType
                });
                continue;
            }

            const methodMatch = line.match(/^(?:public|internal|protected|private|static|virtual|override|async|sealed|partial|extern|new|unsafe|\s)+\s*[A-Za-z0-9_<>,\[\]\\.?]+\s+([$_\p{L}][$_\p{L}\p{N}]*)\s*\(([^)]*)\)/u);
            if (methodMatch && result.length > 0) {
                const latestType = result.slice().reverse().find(function (entry) {
                    return entry.selectorKind === 't';
                });
                if (latestType) {
                    const fullSelector = `${latestType.selector}.${methodMatch[1]}(${String(methodMatch[2] || '').trim()})`;
                    result.push({
                        label: `方法: ${fullSelector}`,
                        selectorKind: 'm',
                        selector: fullSelector
                    });
                }
            }
        }

        return result;
    }

    function buildCSharpExtraFiles() {
        const list = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [];
        return list.map(function (item) {
            return {
                path: `site/content/${item.assetPath}`,
                content: String(item.content || ''),
                encoding: 'utf8'
            };
        }).filter(function (item) {
            return !!item.content;
        });
    }

    function buildStagedMarkdownExtraFiles(activeTargetPath, activeMarkdown) {
        const activePath = normalizePath(activeTargetPath || state.targetPath || '');
        const activeContent = String(activeMarkdown || state.markdown || '');
        const files = [];

        Object.keys(ensureObject(state.draftFiles)).forEach(function (pathKey) {
            const record = getDraftRecord(pathKey);
            if (!record || !record.path) return;

            const fullPath = `site/content/${record.path}`;
            if (record.status === 'deleted') {
                files.push({
                    path: fullPath,
                    delete: true
                });
                return;
            }

            if (record.path === activePath && String(record.markdown || '') === activeContent) {
                return;
            }

            files.push({
                path: fullPath,
                content: String(record.markdown || ''),
                encoding: 'utf8'
            });
        });

        return files;
    }

    function classifyPrFileType(filePath) {
        const pathText = String(filePath || '').trim().toLowerCase();
        if (!pathText) return 'texture';
        if (/\.md$/i.test(pathText)) return 'article';
        if (/\.cs$/i.test(pathText)) return 'csharp';
        return 'texture';
    }

    function buildPrFileManifest(activeTargetPath, activeMarkdown, extraFiles) {
        const manifest = {
            article: [],
            texture: [],
            csharp: [],
            total: 0
        };

        const articleMap = new Map();
        const textureSet = new Set();
        const csharpSet = new Set();

        const pushArticle = function (pathValue, status) {
            const path = String(pathValue || '').trim();
            if (!path) return;
            const nextStatus = String(status || 'staged').trim().toLowerCase();
            const prev = articleMap.get(path);
            const rank = function (value) {
                if (value === 'deleted') return 3;
                if (value === 'staged') return 2;
                return 1;
            };
            if (!prev || rank(nextStatus) >= rank(prev.status)) {
                articleMap.set(path, { path: path, status: nextStatus });
            }
        };

        const pushTexture = function (pathValue) {
            const path = String(pathValue || '').trim();
            if (!path || textureSet.has(path)) return;
            textureSet.add(path);
            manifest.texture.push({ path: path, status: 'upload' });
        };

        const pushCsharp = function (pathValue) {
            const path = String(pathValue || '').trim();
            if (!path || csharpSet.has(path)) return;
            csharpSet.add(path);
            manifest.csharp.push({ path: path, status: 'upload' });
        };

        const safeActiveTarget = normalizePath(activeTargetPath || state.targetPath || '');
        const activeContent = String(activeMarkdown || state.markdown || '');
        if (safeActiveTarget && activeContent.trim()) {
            pushArticle(`site/content/${safeActiveTarget}`, 'active');
        }

        const list = Array.isArray(extraFiles) ? extraFiles : [];
        list.forEach(function (file) {
            const path = String(file && file.path || '').trim();
            if (!path) return;
            const kind = classifyPrFileType(path);
            if (kind === 'article') {
                pushArticle(path, file && file.delete === true ? 'deleted' : 'staged');
                return;
            }
            if (kind === 'csharp') {
                pushCsharp(path);
                return;
            }
            pushTexture(path);
        });

        manifest.article = Array.from(articleMap.values()).sort(function (a, b) {
            return String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
        });
        manifest.texture.sort(function (a, b) {
            return String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
        });
        manifest.csharp.sort(function (a, b) {
            return String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
        });
        manifest.total = manifest.article.length + manifest.texture.length + manifest.csharp.length;
        return manifest;
    }

    function prManifestSummaryText(manifest) {
        const info = manifest && typeof manifest === 'object' ? manifest : { article: [], texture: [], csharp: [] };
        const articleCount = Array.isArray(info.article) ? info.article.length : 0;
        const textureCount = Array.isArray(info.texture) ? info.texture.length : 0;
        const csharpCount = Array.isArray(info.csharp) ? info.csharp.length : 0;
        return `文章 ${articleCount} · 贴图 ${textureCount} · C# ${csharpCount}`;
    }

    function renderPrManifestList(container, items, emptyLabel) {
        if (!container) return;
        container.innerHTML = '';

        const list = Array.isArray(items) ? items : [];
        if (list.length <= 0) {
            const empty = document.createElement('li');
            empty.className = 'studio-pr-manifest-item studio-pr-manifest-item--empty';
            empty.textContent = String(emptyLabel || '暂无文件');
            container.appendChild(empty);
            return;
        }

        list.forEach(function (item) {
            const row = document.createElement('li');
            row.className = 'studio-pr-manifest-item';

            const badge = document.createElement('span');
            badge.className = 'studio-pr-manifest-badge';
            const status = String(item && item.status || 'staged').toLowerCase();
            if (status === 'deleted') {
                badge.textContent = 'DEL';
            } else if (status === 'active') {
                badge.textContent = 'CUR';
            } else if (status === 'upload') {
                badge.textContent = 'BIN';
            } else {
                badge.textContent = 'MOD';
            }

            const path = document.createElement('span');
            path.className = 'studio-pr-manifest-path';
            path.textContent = String(item && item.path || '');

            row.appendChild(badge);
            row.appendChild(path);
            container.appendChild(row);
        });
    }

    function renderPrSubmitManifest(contextOverride) {
        const context = contextOverride && typeof contextOverride === 'object'
            ? contextOverride
            : buildPrSubmitContext();
        const manifest = context.manifest || buildPrFileManifest(
            context.payload ? context.payload.targetPath : state.targetPath,
            context.payload ? context.payload.markdown : state.markdown,
            context.extraFiles
        );

        const summaryText = prManifestSummaryText(manifest);
        if (dom.prManifestSummary) {
            dom.prManifestSummary.textContent = summaryText;
        }
        if (dom.prAssetDecisionSummary) {
            dom.prAssetDecisionSummary.textContent = summaryText;
        }

        renderPrManifestList(dom.prManifestArticleList, manifest.article, '暂无文章改动');
        renderPrManifestList(dom.prManifestTextureList, manifest.texture, '暂无贴图/媒体改动');
        renderPrManifestList(dom.prManifestCsharpList, manifest.csharp, '暂无 C# 改动');

        return manifest;
    }

    function hasUploadedAssets() {
        const imageCount = Array.isArray(state.uploadedImages) ? state.uploadedImages.length : 0;
        const mediaCount = Array.isArray(state.uploadedMedia) ? state.uploadedMedia.length : 0;
        const csharpCount = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles.length : 0;
        return imageCount + mediaCount + csharpCount > 0;
    }

    function clearUploadedAssets(options) {
        const silent = !!(options && options.silent);
        const reason = String(options && options.reason || '').trim();

        state.uploadedImages = [];
        state.uploadedMedia = [];
        state.uploadedCsharpFiles = [];
        state.csharpSymbolEntries = [];
        state.compiledAnims = {};
        state.animCompileErrors = {};
        setAnimCompileStatus('未激活');
        closeCsharpEditorModal();

        renderUploadedImages();
        renderUploadedMedia();
        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        renderExplorerPanels();
        scheduleSave();
        syncViewerPreview(false);

        if (!silent) {
            setStatus(reason ? `已清空已上传附件（${reason}）` : '已清空已上传附件');
        }
    }

    function formatMarkdownForStudio(markdownText) {
        const source = String(markdownText || '');
        const lines = source.replace(/\r\n/g, '\n').split('\n');
        const out = [];
        let inFence = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].replace(/[ \t]+$/g, '');

            if (/^\s*(```|~~~)/.test(line)) {
                inFence = !inFence;
                out.push(line);
                continue;
            }

            if (!inFence) {
                line = line.replace(/^(#{1,6})([^\s#])/, '$1 $2');
                line = line.replace(/^(\s*)-\s{2,}/, '$1- ');
            }

            out.push(line);
        }

        const compacted = [];
        let blankCount = 0;
        out.forEach(function (line) {
            if (!line.trim()) {
                blankCount += 1;
                if (blankCount <= 1) {
                    compacted.push('');
                }
                return;
            }
            blankCount = 0;
            compacted.push(line);
        });

        return compacted.join('\n').trimEnd() + '\n';
    }

    function handleTabIndent(event) {
        if (!dom.markdown) return;
        if (event.key === 'Tab') {
            event.preventDefault();

            const value = String(dom.markdown.value || '');
            const start = dom.markdown.selectionStart || 0;
            const end = dom.markdown.selectionEnd || 0;

            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineEndSearch = value.indexOf('\n', end);
            const lineEnd = lineEndSearch >= 0 ? lineEndSearch : value.length;
            const block = value.slice(lineStart, lineEnd);
            const lines = block.split('\n');

            const indentUnit = '    ';
            let updatedLines = [];
            if (event.shiftKey) {
                updatedLines = lines.map(function (line) {
                    if (line.startsWith(indentUnit)) return line.slice(indentUnit.length);
                    if (line.startsWith('\t')) return line.slice(1);
                    if (line.startsWith('  ')) return line.slice(2);
                    if (line.startsWith(' ')) return line.slice(1);
                    return line;
                });
            } else {
                updatedLines = lines.map(function (line) {
                    return `${indentUnit}${line}`;
                });
            }

            const replaced = updatedLines.join('\n');
            const next = value.slice(0, lineStart) + replaced + value.slice(lineEnd);

            let nextStart = start;
            let nextEnd = end;
            if (event.shiftKey) {
                const removedFromFirst = lines[0].length - updatedLines[0].length;
                nextStart = Math.max(lineStart, start - removedFromFirst);
                const removedTotal = block.length - replaced.length;
                nextEnd = Math.max(nextStart, end - removedTotal);
            } else {
                nextStart = start + indentUnit.length;
                nextEnd = end + (indentUnit.length * lines.length);
            }

            updateEditorContent(next, nextStart, nextEnd);
            return;
        }
    }

    function preflightUrlFromApiUrl(apiUrl) {
        return workerApiEndpointFromApiUrl(apiUrl, '/api/preflight-check');
    }

    function preflightHeaders(sharedKey, authToken) {
        const headers = {
            'content-type': 'application/json'
        };
        if (authToken) {
            headers.authorization = `Bearer ${authToken}`;
        } else {
            headers['x-studio-key'] = sharedKey;
        }
        return headers;
    }

    async function runPreflightCheck(options) {
        const mode = String(options && options.mode || 'soft');
        const throwOnError = !!(options && options.throwOnError);
        const apiUrl = normalizeWorkerApiUrl(options && options.apiUrl || state.workerApiUrl);
        const sharedKey = String(options && options.sharedKey || (dom.prSharedKey ? dom.prSharedKey.value : '')).trim();
        const authToken = String(options && options.authToken || state.authToken).trim();

        if (!apiUrl) {
            const error = '缺少 Worker API 地址，无法执行冲突检查';
            if (throwOnError) throw new Error(error);
            return { ok: false, pending: true, error: error };
        }

        if (!authToken && !sharedKey) {
            const error = '缺少鉴权信息，无法执行冲突检查';
            if (throwOnError) throw new Error(error);
            return { ok: false, pending: true, error: error };
        }

        let safeTargetPath = '';
        try {
            safeTargetPath = ensureSafeMarkdownPath(state.targetPath);
        } catch (err) {
            const error = err && err.message ? err.message : String(err);
            if (throwOnError) throw new Error(error);
            return { ok: false, pending: mode === 'soft', error: error };
        }

        const payload = {
            mode: mode,
            targetPath: safeTargetPath,
            markdown: String(state.markdown || ''),
            extraFiles: [
                ...buildImageExtraFiles(),
                ...buildMediaExtraFiles(),
                ...buildCSharpExtraFiles()
            ]
        };

        const url = preflightUrlFromApiUrl(apiUrl);
        if (!url) {
            const error = '无法生成 preflight-check 地址';
            if (throwOnError) throw new Error(error);
            return { ok: false, pending: true, error: error };
        }

        state.preflightPending = true;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: preflightHeaders(sharedKey, authToken),
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let data = null;
            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch (_) {
                data = null;
            }

            if (!response.ok || !data || data.ok !== true) {
                const errorText = data && data.error ? String(data.error) : `HTTP ${response.status}`;
                if (throwOnError) {
                    throw new Error(errorText);
                }
                return {
                    ok: false,
                    pending: mode === 'soft',
                    error: errorText,
                    errors: Array.isArray(data && data.errors) ? data.errors : []
                };
            }

            return {
                ok: true,
                pending: false,
                warnings: Array.isArray(data.warnings) ? data.warnings : [],
                errors: Array.isArray(data.errors) ? data.errors : []
            };
        } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            if (throwOnError) throw new Error(msg);
            return {
                ok: false,
                pending: mode === 'soft',
                error: msg
            };
        } finally {
            state.preflightPending = false;
        }
    }

    function stripFileExt(name) {
        return String(name || '').replace(/\.[a-z0-9]+$/i, '');
    }

    function slugifyAssetName(name) {
        const base = stripFileExt(name).trim().toLowerCase();
        const safe = base.replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
        return safe || `image-${Date.now().toString(36)}`;
    }

    function extensionFromFilename(name, fallback) {
        const text = String(name || '').trim().toLowerCase();
        const match = text.match(/\.([a-z0-9]+)$/);
        if (match && match[1]) return match[1];
        return String(fallback || '').trim().toLowerCase() || 'bin';
    }

    function imageExtensionFromFile(file) {
        const type = String(file && file.type || '').toLowerCase();
        const fallbackByType = type.startsWith('image/') ? type.slice('image/'.length) : 'png';
        const ext = extensionFromFilename(file && file.name || '', fallbackByType);
        if (/^(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(ext)) return ext.toLowerCase();
        return 'png';
    }

    function mediaExtensionFromFile(file) {
        const type = String(file && file.type || '').toLowerCase();
        const fallbackByType = type === 'video/webm' ? 'webm' : 'mp4';
        const ext = extensionFromFilename(file && file.name || '', fallbackByType);
        if (/^(mp4|webm)$/i.test(ext)) return ext.toLowerCase();
        return fallbackByType;
    }

    function isSupportedVideoFile(file) {
        if (!file) return false;
        const type = String(file.type || '').toLowerCase();
        const name = String(file.name || '');
        return type === 'video/mp4'
            || type === 'video/webm'
            || /\.(?:mp4|webm)$/i.test(name);
    }

    function imageAssetPathFromTarget(targetPath, imageFile) {
        const markdownPath = ensureMarkdownPath(targetPath || state.targetPath);
        const dir = getDirectoryFromPath(markdownPath);
        const safeImage = slugifyAssetName(imageFile && imageFile.name || imageFile);
        const extension = imageExtensionFromFile(imageFile);
        const ext = extension;
        const uniqueSuffix = Math.random().toString(36).slice(2, 7);
        if (dir) {
            return `${dir}/imgs/${safeImage}-${uniqueSuffix}.${ext}`;
        }

        return `imgs/${safeImage}-${uniqueSuffix}.${ext}`;
    }

    function mediaAssetPathFromTarget(targetPath, mediaFile) {
        const markdownPath = ensureMarkdownPath(targetPath || state.targetPath);
        const dir = getDirectoryFromPath(markdownPath);
        const safeName = slugifyAssetName(mediaFile && mediaFile.name || mediaFile);
        const ext = mediaExtensionFromFile(mediaFile);
        const uniqueSuffix = Math.random().toString(36).slice(2, 7);
        if (dir) {
            return `${dir}/media/${safeName}-${uniqueSuffix}.${ext}`;
        }
        return `media/${safeName}-${uniqueSuffix}.${ext}`;
    }

    function fileToDataUrl(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
                resolve(String(reader.result || ''));
            };
            reader.onerror = function () {
                reject(new Error('读取图片失败'));
            };
            reader.readAsDataURL(file);
        });
    }

    function dataUrlToBase64(dataUrl) {
        const text = String(dataUrl || '');
        const comma = text.indexOf(',');
        if (comma < 0) return '';
        return text.slice(comma + 1);
    }

    function imageMarkdownText(item) {
        if (!item) return '';
        const alt = stripFileExt(item.name || 'image') || 'image';
        return `![${alt}](/site/content/${encodePathForUrl(item.assetPath || '')})`;
    }

    function imageInsertionText(item) {
        const md = imageMarkdownText(item);
        if (!md) return '';
        return `\n${md}\n`;
    }

    function mediaMarkdownText(item) {
        if (!item) return '';
        const label = stripFileExt(item.name || 'video') || 'video';
        return `![${label}](/site/content/${encodePathForUrl(item.assetPath || '')})`;
    }

    function mediaInsertionText(item) {
        const md = mediaMarkdownText(item);
        if (!md) return '';
        return `\n${md}\n`;
    }

    function buildImageExtraFiles() {
        const list = Array.isArray(state.uploadedImages) ? state.uploadedImages : [];
        return list.map(function (item) {
            return {
                path: `site/content/${item.assetPath}`,
                content: String(item.base64 || ''),
                encoding: 'base64'
            };
        }).filter(function (item) {
            return !!item.content;
        });
    }

    function buildMediaExtraFiles() {
        const list = Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [];
        return list.map(function (item) {
            return {
                path: `site/content/${item.assetPath}`,
                content: String(item.base64 || ''),
                encoding: 'base64'
            };
        }).filter(function (item) {
            return !!item.content;
        });
    }

    function getUploadedCsharpFileById(fileId) {
        const id = String(fileId || '').trim();
        if (!id) return null;

        const list = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [];
        return list.find(function (item) {
            return String(item && item.id || '') === id;
        }) || null;
    }

    function getUploadedImageById(fileId) {
        const id = String(fileId || '').trim();
        if (!id) return null;
        const list = Array.isArray(state.uploadedImages) ? state.uploadedImages : [];
        return list.find(function (item) {
            return String(item && item.id || '') === id;
        }) || null;
    }

    function getUploadedMediaById(fileId) {
        const id = String(fileId || '').trim();
        if (!id) return null;
        const list = Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [];
        return list.find(function (item) {
            return String(item && item.id || '') === id;
        }) || null;
    }

    function isCsharpEditorModalOpen() {
        return !!(dom.csharpEditorModal && dom.csharpEditorModal.classList.contains('active'));
    }

    function isFlowchartModalOpen() {
        return !!(dom.flowchartModal && dom.flowchartModal.classList.contains('active'));
    }

    const SIDE_PANEL_KEYS = ['left', 'right', 'guide', 'draft', 'asset'];

    function getSidePanelModalRef(panel) {
        const key = String(panel || '').trim().toLowerCase();
        if (key === 'asset') {
            return { key: 'asset', modal: dom.prAssetDecisionModal, trigger: null };
        }
        if (key === 'right') {
            return { key: 'right', modal: dom.rightPanelModal, trigger: dom.openPublish };
        }
        if (key === 'guide') {
            return { key: 'guide', modal: dom.markdownGuideModal, trigger: dom.openMarkdownGuide };
        }
        if (key === 'draft') {
            return { key: 'draft', modal: dom.draftCheckModal, trigger: dom.runDraftCheck };
        }
        return { key: 'left', modal: dom.leftPanelModal, trigger: dom.openExplorer };
    }

    function isSidePanelModalOpen(panel) {
        const ref = getSidePanelModalRef(panel);
        return !!(ref.modal && ref.modal.classList.contains('active'));
    }

    function focusElementWithoutScroll(target) {
        if (!target || typeof target.focus !== 'function') return;

        try {
            target.focus({ preventScroll: true });
            return;
        } catch (_) {
            // Fallback for browsers that do not support focus options.
        }

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        target.focus();
        if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
            window.scrollTo(scrollX, scrollY);
        }
    }

    function setSidePanelModalOpen(panel, open, options) {
        const ref = getSidePanelModalRef(panel);
        const key = ref.key;
        const modal = ref.modal;
        const trigger = ref.trigger;
        const shouldOpen = !!open;
        if (!modal) return;

        if (shouldOpen) {
            SIDE_PANEL_KEYS.forEach(function (otherKey) {
                if (otherKey === key) return;
                if (!isSidePanelModalOpen(otherKey)) return;
                setSidePanelModalOpen(otherKey, false, { skipFocus: true, silent: true });
            });
        } else if (key === 'asset' && state.prAssetDecisionResolver) {
            const resolver = state.prAssetDecisionResolver;
            state.prAssetDecisionResolver = null;
            resolver({ action: 'cancel' });
        }

        modal.classList.toggle('active', shouldOpen);
        modal.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        if (trigger) {
            trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        }
        syncModalBodyLock();

        if (!shouldOpen || (options && options.skipFocus)) {
            return;
        }

        const focusTarget = modal.querySelector('input, textarea, select, button, [href]');
        focusElementWithoutScroll(focusTarget);
    }

    function setPrAssetContinueHint(text, isWarn) {
        if (!dom.prAssetContinueHint) return;
        dom.prAssetContinueHint.textContent = String(text || '').trim();
        dom.prAssetContinueHint.classList.toggle('studio-pr-asset-continue-hint--warn', !!isWarn);
    }

    function refreshPrAssetContinueSelectOptions(preferredValue) {
        if (!dom.prAssetContinueSelect) return 0;

        const previous = String(preferredValue || dom.prAssetContinueSelect.value || '').trim();
        const list = Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [];
        dom.prAssetContinueSelect.innerHTML = '';

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '请选择一个未关闭 PR...';
        dom.prAssetContinueSelect.appendChild(emptyOption);

        list.forEach(function (pr) {
            if (!pr || !pr.number) return;
            const option = document.createElement('option');
            option.value = String(pr.number);
            option.textContent = `#${pr.number} · ${String(pr.title || '').trim() || '(无标题)'}`;
            dom.prAssetContinueSelect.appendChild(option);
        });

        if (previous && list.some(function (pr) { return String(pr.number) === previous; })) {
            dom.prAssetContinueSelect.value = previous;
        } else {
            dom.prAssetContinueSelect.value = '';
        }

        if (dom.prAssetContinueSubmit) {
            dom.prAssetContinueSubmit.disabled = !String(dom.prAssetContinueSelect.value || '').trim();
        }

        if (!state.authToken) {
            setPrAssetContinueHint('请先完成 GitHub 登录，再刷新未关闭 PR 列表。', true);
        } else if (list.length === 0) {
            setPrAssetContinueHint('当前没有可继续的未关闭 PR，请先刷新列表。', true);
        } else {
            setPrAssetContinueHint('请选择一个未关闭 PR，再继续提交。', false);
        }

        return list.length;
    }

    function setPrAssetDecisionStage(stage) {
        const normalized = String(stage || 'choice').trim().toLowerCase();
        state.prAssetDecisionStage = ['choice', 'continue'].includes(normalized) ? normalized : 'choice';

        if (dom.prAssetDecisionChoiceStage) {
            dom.prAssetDecisionChoiceStage.hidden = state.prAssetDecisionStage !== 'choice';
        }
        if (dom.prAssetDecisionContinueStage) {
            dom.prAssetDecisionContinueStage.hidden = state.prAssetDecisionStage !== 'continue';
        }

        if (state.prAssetDecisionStage === 'continue') {
            refreshPrAssetContinueSelectOptions(String(state.linkedPrNumber || '').trim());
        }
    }

    function closePrAssetDecisionModal(result) {
        const resolver = state.prAssetDecisionResolver;
        state.prAssetDecisionResolver = null;
        setPrAssetDecisionStage('choice');
        setSidePanelModalOpen('asset', false, { skipFocus: true, silent: true });
        if (typeof resolver === 'function') {
            resolver(result || { action: 'cancel' });
        }
    }

    function openPrAssetDecisionModal(context) {
        if (state.prAssetDecisionResolver) {
            const pendingResolver = state.prAssetDecisionResolver;
            state.prAssetDecisionResolver = null;
            pendingResolver({ action: 'cancel' });
        }

        setPrAssetDecisionStage('choice');
        renderPrSubmitManifest(context);
        setSidePanelModalOpen('asset', true);
        return new Promise(function (resolve) {
            state.prAssetDecisionResolver = resolve;
        });
    }

    function applyLinkedPrSelection(prNumber) {
        const value = String(prNumber || '').trim();
        state.linkedPrNumber = value;

        if (dom.prChainSelect) {
            if (value) {
                const exists = Array.from(dom.prChainSelect.options).some(function (option) {
                    return String(option.value || '').trim() === value;
                });
                if (!exists) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = `#${value} · (本次选择)`;
                    dom.prChainSelect.appendChild(option);
                }
                dom.prChainSelect.value = value;
            } else {
                dom.prChainSelect.value = '';
            }
        }

        scheduleSave();
    }

    function syncModalBodyLock() {
        const shouldLock = isCsharpEditorModalOpen()
            || isFlowchartModalOpen()
            || SIDE_PANEL_KEYS.some(function (panelKey) { return isSidePanelModalOpen(panelKey); });
        document.body.classList.toggle('article-studio-modal-open', shouldLock);
    }

    function renderCsharpEditorPreviewHighlight() {
        if (!dom.csharpEditorPreviewCode) return;

        dom.csharpEditorPreviewCode.textContent = String(state.csharpEditorDraft || '');
        if (window.Prism && typeof window.Prism.highlightElement === 'function') {
            try {
                window.Prism.highlightElement(dom.csharpEditorPreviewCode);
            } catch (_) {
                // ignore highlight errors to keep editor usable
            }
        }
    }

    function resolveAnimBridgeCandidates(preferredEndpoint) {
        const candidates = [];
        const seen = new Set();
        const pushCandidate = function (value) {
            const normalized = normalizeAnimBridgeEndpoint(value);
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            candidates.push(normalized);
        };

        pushCandidate(preferredEndpoint);
        pushCandidate(state.animBridgeEndpoint);
        ANIMCS_BRIDGE_CANDIDATE_ENDPOINTS.forEach(pushCandidate);
        return candidates;
    }

    async function checkAnimBridgeHealth(endpoint) {
        const controller = new AbortController();
        const timer = setTimeout(function () {
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
            const payload = await response.json().catch(function () { return {}; });
            if (!payload || payload.ok !== true) {
                throw new Error('健康检查失败');
            }
            return {
                ok: true,
                version: String(payload.version || '')
            };
        } finally {
            clearTimeout(timer);
        }
    }

    async function connectAnimBridge(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const candidates = resolveAnimBridgeCandidates(opts.preferredEndpoint);
        if (candidates.length === 0) {
            state.animBridgeConnected = false;
            renderAnimBridgeStatusline();
            return '';
        }

        let lastError = null;
        for (const endpoint of candidates) {
            try {
                await checkAnimBridgeHealth(endpoint);
                state.animBridgeEndpoint = endpoint;
                state.animBridgeConnected = true;
                persistAnimBridgeEndpoint(endpoint);
                renderAnimBridgeStatusline();
                return endpoint;
            } catch (err) {
                lastError = err;
            }
        }

        state.animBridgeConnected = false;
        renderAnimBridgeStatusline();
        if (!opts.silent && lastError) {
            setStatus(`AnimBridge 不可用：${lastError && lastError.message ? lastError.message : String(lastError)}`);
        }
        return '';
    }

    function normalizeAnimCompileDiagnostics(input) {
        if (!Array.isArray(input)) return [];
        return input.map(function (item) {
            return String(item || '').trim();
        }).filter(Boolean);
    }

    function setCompiledAnimOutput(animPath, moduleJs, profile) {
        const normalized = normalizeAnimSourcePath(animPath);
        if (!isAnimSourcePath(normalized)) return;
        state.compiledAnims[normalized] = {
            moduleJs: String(moduleJs || ''),
            profile: profile && typeof profile === 'object' ? profile : null,
            updatedAt: new Date().toISOString()
        };
        delete state.animCompileErrors[normalized];
    }

    function setCompiledAnimError(animPath, diagnostics) {
        const normalized = normalizeAnimSourcePath(animPath);
        if (!isAnimSourcePath(normalized)) return;
        const safeDiagnostics = normalizeAnimCompileDiagnostics(diagnostics);
        delete state.compiledAnims[normalized];
        state.animCompileErrors[normalized] = {
            diagnostics: safeDiagnostics.length ? safeDiagnostics : ['编译失败'],
            updatedAt: new Date().toISOString()
        };
    }

    function removeCompiledAnimState(animPath) {
        const normalized = normalizeAnimSourcePath(animPath);
        if (!normalized) return;
        delete state.compiledAnims[normalized];
        delete state.animCompileErrors[normalized];
    }

    function getActiveCsharpEditorItem() {
        return getUploadedCsharpFileById(state.csharpEditorTargetId);
    }

    function getActiveCsharpEditorAnimPath() {
        const item = getActiveCsharpEditorItem();
        if (!item) return '';
        const normalized = normalizeAnimSourcePath(item.assetPath || '');
        return isAnimSourcePath(normalized) ? normalized : '';
    }

    async function compileAnimDraftNow(animPath, sourceText) {
        const requestId = String(++animCompileRequestSeq);
        const normalized = normalizeAnimSourcePath(animPath);
        if (!isAnimSourcePath(normalized)) {
            return;
        }

        setAnimCompileStatus(`编译中 ${normalized}`);
        const endpoint = await connectAnimBridge({ silent: true });
        if (!endpoint) {
            setCompiledAnimError(normalized, ['未检测到本地 AnimBridge，请先启动 dotnet 桥接服务']);
            setAnimCompileStatus(`桥接不可用 ${normalized}`);
            syncViewerPreview(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(function () {
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
                    requestId: requestId
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json().catch(function () { return null; });
            if (requestId !== String(animCompileRequestSeq)) {
                return;
            }

            const diagnostics = normalizeAnimCompileDiagnostics(payload && payload.diagnostics);
            const moduleJs = String(payload && payload.moduleJs || '');
            if (!payload || payload.ok !== true || !moduleJs) {
                setCompiledAnimError(normalized, diagnostics.length ? diagnostics : ['编译失败：未生成 JS 模块']);
                setAnimCompileStatus(`编译失败 ${normalized}`);
                syncViewerPreview(false);
                return;
            }

            setCompiledAnimOutput(normalized, moduleJs, payload.profile && typeof payload.profile === 'object' ? payload.profile : null);
            state.animBridgeConnected = true;
            setAnimCompileStatus(`编译成功 ${normalized}`);
            syncViewerPreview(false);
        } catch (err) {
            if (requestId !== String(animCompileRequestSeq)) {
                return;
            }
            const reason = err && err.name === 'AbortError'
                ? `编译超时（>${ANIMCS_COMPILE_TIMEOUT_MS}ms）`
                : (err && err.message ? err.message : String(err));
            setCompiledAnimError(normalized, [reason]);
            setAnimCompileStatus(`编译失败 ${normalized}`);
            state.animBridgeConnected = false;
            renderAnimBridgeStatusline();
            syncViewerPreview(false);
        } finally {
            clearTimeout(timeout);
        }
    }

    function scheduleAnimDraftCompile(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const animPath = getActiveCsharpEditorAnimPath();
        if (!animPath) {
            setAnimCompileStatus('未激活（当前文件不在 anims/*.cs）');
            return;
        }

        const sourceText = String(state.csharpEditorDraft || '');
        if (animCompileTimer) {
            clearTimeout(animCompileTimer);
        }

        const runCompile = function () {
            animCompileTimer = 0;
            compileAnimDraftNow(animPath, sourceText);
        };
        if (opts.immediate) {
            runCompile();
            return;
        }
        animCompileTimer = setTimeout(runCompile, ANIMCS_COMPILE_DEBOUNCE_MS);
    }

    function closeCsharpEditorModal(options) {
        const keepDraft = !!(options && options.keepDraft);
        if (animCompileTimer) {
            clearTimeout(animCompileTimer);
            animCompileTimer = 0;
        }

        if (dom.csharpEditorModal) {
            dom.csharpEditorModal.classList.remove('active');
            dom.csharpEditorModal.setAttribute('aria-hidden', 'true');
        }
        syncModalBodyLock();

        if (keepDraft) {
            return;
        }

        state.csharpEditorTargetId = '';
        state.csharpEditorDraft = '';
        if (dom.csharpEditorText) {
            dom.csharpEditorText.value = '';
        }
        if (dom.csharpEditorPreviewCode) {
            dom.csharpEditorPreviewCode.textContent = '';
        }
    }

    function openCsharpEditorModal(fileId) {
        const item = getUploadedCsharpFileById(fileId);
        if (!item) {
            setStatus('未找到要编辑的 C# 文件');
            return;
        }

        state.csharpEditorTargetId = item.id;
        state.csharpEditorDraft = String(item.content || '').replace(/\r\n/g, '\n');

        if (dom.csharpEditorTitle) {
            dom.csharpEditorTitle.textContent = `编辑 C# 文件 · ${item.name || 'source.cs'}`;
        }
        if (dom.csharpEditorText) {
            dom.csharpEditorText.value = state.csharpEditorDraft;
        }

        renderCsharpEditorPreviewHighlight();

        if (dom.csharpEditorModal) {
            dom.csharpEditorModal.classList.add('active');
            dom.csharpEditorModal.setAttribute('aria-hidden', 'false');
        }
        syncModalBodyLock();

        if (dom.csharpEditorText) {
            dom.csharpEditorText.focus();
            const length = dom.csharpEditorText.value.length;
            dom.csharpEditorText.setSelectionRange(length, length);
        }
        renderAnimBridgeStatusline();
        scheduleAnimDraftCompile({ immediate: true });
    }

    async function saveCsharpEditorModalChanges() {
        const item = getUploadedCsharpFileById(state.csharpEditorTargetId);
        if (!item) {
            closeCsharpEditorModal();
            setStatus('当前 C# 文件不存在，已关闭编辑弹窗');
            return;
        }

        const nextContent = String(dom.csharpEditorText ? dom.csharpEditorText.value : state.csharpEditorDraft || '').replace(/\r\n/g, '\n');
        if (String(item.content || '') === nextContent) {
            closeCsharpEditorModal();
            setStatus(`未检测到变更：${item.name}`);
            return;
        }

        item.content = nextContent;
        item.size = Number(nextContent.length || 0);
        item.symbols = extractCSharpSymbols(nextContent);
        item.checkState = 'ok';
        item.checkMessage = '已通过检查';
        item.preflightPending = false;

        const softResult = await runPreflightCheck({ mode: 'soft' });
        if (!softResult.ok) {
            if (softResult.pending) {
                item.checkState = 'warn';
                item.checkMessage = `待复检：${softResult.error || '检查失败'}`;
            } else {
                item.checkState = 'error';
                item.checkMessage = `冲突检查失败：${softResult.error || '请稍后重试'}`;
            }
        }

        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        renderPreview();
        scheduleSave();
        const savedAnimPath = normalizeAnimSourcePath(item.assetPath || '');
        if (isAnimSourcePath(savedAnimPath)) {
            compileAnimDraftNow(savedAnimPath, nextContent).catch(function (err) {
                setCompiledAnimError(savedAnimPath, [err && err.message ? err.message : String(err)]);
                setAnimCompileStatus(`编译失败 ${savedAnimPath}`);
                syncViewerPreview(false);
            });
        } else {
            setAnimCompileStatus('未激活（当前文件不在 anims/*.cs）');
        }
        closeCsharpEditorModal();
        setStatus(`已保存 C# 编辑：${item.name}`);
    }

    function renderUploadedCsharpFiles() {
        if (!dom.csharpList) return;

        dom.csharpList.innerHTML = '';
        const list = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [];
        if (list.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'studio-help';
            empty.textContent = '当前没有已上传 C# 文件';
            dom.csharpList.appendChild(empty);
            return;
        }

        list.forEach(function (item) {
            const row = document.createElement('div');
            row.className = 'studio-image-item';

            const head = document.createElement('div');
            head.className = 'studio-image-item-head';

            const name = document.createElement('span');
            name.className = 'studio-image-item-name';
            name.textContent = item.name || 'source.cs';
            head.appendChild(name);

            const remove = document.createElement('button');
            remove.className = 'btn btn-small btn-outline';
            remove.type = 'button';
            remove.textContent = '移除';
            remove.addEventListener('click', function () {
                if (state.csharpEditorTargetId === item.id) {
                    closeCsharpEditorModal();
                }
                state.uploadedCsharpFiles = state.uploadedCsharpFiles.filter(function (it) {
                    return it.id !== item.id;
                });
                removeCompiledAnimState(item.assetPath || '');
                refreshCsharpSymbolOptions();
                renderUploadedCsharpFiles();
                renderExplorerPanels();
                scheduleSave();
                syncViewerPreview(false);
                setStatus(`已移除 C# 文件：${item.name}`);
            });

            const edit = document.createElement('button');
            edit.className = 'btn btn-small btn-outline';
            edit.type = 'button';
            edit.textContent = '编辑';
            edit.addEventListener('click', function () {
                openCsharpEditorModal(item.id);
            });

            const insertRef = document.createElement('button');
            insertRef.className = 'btn btn-small btn-outline';
            insertRef.type = 'button';
            insertRef.textContent = '插入引用';
            insertRef.addEventListener('click', function () {
                const relPath = `./${String(item.assetPath || '').split('/').slice(-2).join('/')}`;
                insertBlockSnippet(`{{cs:${relPath}}}\n`, relPath);
                setStatus(`已插入 C# 引用：${item.name}`);
            });

            const actions = document.createElement('div');
            actions.className = 'studio-image-item-actions';
            actions.appendChild(edit);
            actions.appendChild(insertRef);
            actions.appendChild(remove);
            head.appendChild(actions);

            const meta = document.createElement('span');
            meta.className = 'studio-image-item-meta';
            meta.textContent = `${formatBytes(item.size)} · /site/content/${item.assetPath || ''}`;

            const status = document.createElement('span');
            status.className = 'studio-image-item-status';
            if (item.checkState === 'error') {
                status.classList.add('studio-image-item-status--error');
                status.textContent = item.checkMessage || '冲突检查失败';
            } else if (item.checkState === 'warn') {
                status.classList.add('studio-image-item-status--warn');
                status.textContent = item.checkMessage || '待复检';
            } else {
                status.textContent = item.checkMessage || '已通过检查';
            }

            row.appendChild(head);
            row.appendChild(meta);
            row.appendChild(status);
            dom.csharpList.appendChild(row);
        });
    }

    function updatePrChainSelectOptions() {
        if (!dom.prChainSelect) return;

        const previousValue = String(state.linkedPrNumber || '').trim();
        dom.prChainSelect.innerHTML = '';

        const createNewOption = document.createElement('option');
        createNewOption.value = '';
        createNewOption.textContent = '创建新 PR（默认）';
        dom.prChainSelect.appendChild(createNewOption);

        const list = Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [];
        list.forEach(function (pr) {
            if (!pr || !pr.number) return;
            const option = document.createElement('option');
            option.value = String(pr.number);
            option.textContent = `#${pr.number} · ${String(pr.title || '').trim() || '(无标题)'}`;
            dom.prChainSelect.appendChild(option);
        });

        if (previousValue && list.some(function (pr) { return String(pr.number) === previousValue; })) {
            dom.prChainSelect.value = previousValue;
            state.linkedPrNumber = previousValue;
        } else {
            dom.prChainSelect.value = '';
            if (previousValue && list.length > 0) {
                setStatus('之前绑定的 PR 已关闭或不可见，已切换为“创建新 PR”');
            }
            state.linkedPrNumber = '';
        }

        refreshPrAssetContinueSelectOptions(String(state.linkedPrNumber || '').trim());
    }

    function renderUploadedImages() {
        if (!dom.imageList) return;

        dom.imageList.innerHTML = '';
        const list = Array.isArray(state.uploadedImages) ? state.uploadedImages : [];
        if (list.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'studio-help';
            empty.textContent = '当前没有已上传图片';
            dom.imageList.appendChild(empty);
            return;
        }

        list.forEach(function (item) {
            const row = document.createElement('div');
            row.className = 'studio-image-item';

            const head = document.createElement('div');
            head.className = 'studio-image-item-head';

            const name = document.createElement('span');
            name.className = 'studio-image-item-name';
            name.textContent = item.name || 'image.png';
            head.appendChild(name);

            const remove = document.createElement('button');
            remove.className = 'btn btn-small btn-outline';
            remove.type = 'button';
            remove.textContent = '移除';
            remove.addEventListener('click', function () {
                state.uploadedImages = state.uploadedImages.filter(function (it) {
                    return it.id !== item.id;
                });
                renderUploadedImages();
                renderExplorerPanels();
                scheduleSave();
                setStatus(`已移除图片：${item.name}`);
            });

            const insertRef = document.createElement('button');
            insertRef.className = 'btn btn-small btn-outline';
            insertRef.type = 'button';
            insertRef.textContent = '插入引用';
            insertRef.addEventListener('click', function () {
                insertBlockSnippet(imageInsertionText(item));
                setStatus(`已插入图片引用：${item.name}`);
            });

            const actions = document.createElement('div');
            actions.className = 'studio-image-item-actions';
            actions.appendChild(insertRef);
            actions.appendChild(remove);
            head.appendChild(actions);

            const meta = document.createElement('span');
            meta.className = 'studio-image-item-meta';
            meta.textContent = `${formatBytes(item.size)} · /site/content/${item.assetPath || ''}`;

            const preview = document.createElement('img');
            preview.className = 'studio-image-item-preview';
            preview.src = item.dataUrl || '';
            preview.alt = item.name || 'uploaded image';

            row.appendChild(head);
            row.appendChild(meta);
            row.appendChild(preview);
            dom.imageList.appendChild(row);
        });
    }

    function renderUploadedMedia() {
        if (!dom.mediaList) return;

        dom.mediaList.innerHTML = '';
        const list = Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [];
        if (list.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'studio-help';
            empty.textContent = '当前没有已上传视频';
            dom.mediaList.appendChild(empty);
            return;
        }

        list.forEach(function (item) {
            const row = document.createElement('div');
            row.className = 'studio-image-item';

            const head = document.createElement('div');
            head.className = 'studio-image-item-head';

            const name = document.createElement('span');
            name.className = 'studio-image-item-name';
            name.textContent = item.name || 'video.mp4';
            head.appendChild(name);

            const remove = document.createElement('button');
            remove.className = 'btn btn-small btn-outline';
            remove.type = 'button';
            remove.textContent = '移除';
            remove.addEventListener('click', function () {
                state.uploadedMedia = state.uploadedMedia.filter(function (it) {
                    return it.id !== item.id;
                });
                renderUploadedMedia();
                renderExplorerPanels();
                scheduleSave();
                setStatus(`已移除视频：${item.name}`);
            });

            const insertRef = document.createElement('button');
            insertRef.className = 'btn btn-small btn-outline';
            insertRef.type = 'button';
            insertRef.textContent = '插入引用';
            insertRef.addEventListener('click', function () {
                insertBlockSnippet(mediaInsertionText(item));
                setStatus(`已插入视频引用：${item.name}`);
            });

            const actions = document.createElement('div');
            actions.className = 'studio-image-item-actions';
            actions.appendChild(insertRef);
            actions.appendChild(remove);
            head.appendChild(actions);

            const meta = document.createElement('span');
            meta.className = 'studio-image-item-meta';
            meta.textContent = `${formatBytes(item.size)} · /site/content/${item.assetPath || ''}`;

            const preview = document.createElement('video');
            preview.className = 'studio-image-item-preview';
            preview.src = item.dataUrl || '';
            preview.controls = true;
            preview.preload = 'metadata';
            preview.muted = true;

            row.appendChild(head);
            row.appendChild(meta);
            row.appendChild(preview);
            dom.mediaList.appendChild(row);
        });
    }

    async function insertAssetsFromUpload(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const imageFiles = [];
        const mediaFiles = [];
        const csharpFiles = [];
        let skipped = 0;

        files.forEach(function (file) {
            if (!file) return;

            const name = String(file.name || '');
            const type = String(file.type || '').toLowerCase();
            const isImage = type.startsWith('image/') || /\.(?:png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(name);
            const isMedia = isSupportedVideoFile(file);
            const isCsharp = /\.cs$/i.test(name) || type.indexOf('csharp') >= 0;

            if (isImage) {
                imageFiles.push(file);
                return;
            }
            if (isMedia) {
                mediaFiles.push(file);
                return;
            }
            if (isCsharp) {
                csharpFiles.push(file);
                return;
            }

            skipped += 1;
        });

        if (imageFiles.length > 0) {
            await insertImagesFromFiles(imageFiles);
        }
        if (mediaFiles.length > 0) {
            await insertMediaFromFiles(mediaFiles);
        }
        if (csharpFiles.length > 0) {
            await insertCsharpFilesFromUpload(csharpFiles);
        }

        if (imageFiles.length === 0 && mediaFiles.length === 0 && csharpFiles.length === 0) {
            setStatus('未发现可上传的图片、视频或 C# 文件');
            return;
        }

        if (skipped > 0) {
            setStatus(`已处理图片 ${imageFiles.length} 个、视频 ${mediaFiles.length} 个、C# ${csharpFiles.length} 个，跳过 ${skipped} 个不支持文件`);
        }
    }

    async function insertImagesFromFiles(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        if (state.uploadedImages.length >= MAX_IMAGE_COUNT) {
            setStatus(`最多保留 ${MAX_IMAGE_COUNT} 张图片，请先移除旧图片`);
            return;
        }

        const accepted = [];
        for (const file of files) {
            const name = String(file && file.name || '');
            const type = String(file && file.type || '').toLowerCase();
            const isImage = type.startsWith('image/') || /\.(?:png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(name);
            if (!file || !isImage) {
                setStatus(`已跳过非图片文件：${file && file.name ? file.name : '未知文件'}`);
                continue;
            }
            if (file.size > MAX_IMAGE_FILE_SIZE) {
                setStatus(`图片过大（>${formatBytes(MAX_IMAGE_FILE_SIZE)}）：${file.name}`);
                continue;
            }
            if (state.uploadedImages.length + accepted.length >= MAX_IMAGE_COUNT) {
                setStatus(`最多保留 ${MAX_IMAGE_COUNT} 张图片，其余已跳过`);
                break;
            }

            const dataUrl = await fileToDataUrl(file);
            const base64 = dataUrlToBase64(dataUrl);
            if (!base64) {
                setStatus(`图片编码失败，已跳过：${file.name}`);
                continue;
            }

            const assetPath = imageAssetPathFromTarget(state.targetPath, file);
            const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            const item = {
                id: id,
                name: String(file.name || `image-${id}.png`),
                type: String(file.type || 'image/png'),
                size: Number(file.size || 0),
                assetPath: assetPath,
                dataUrl: dataUrl,
                base64: base64,
                insertedAt: new Date().toISOString()
            };
            accepted.push(item);
        }

        if (accepted.length === 0) {
            return;
        }

        accepted.forEach(function (item) {
            state.uploadedImages.push(item);
            insertBlockSnippet(imageInsertionText(item));
        });

        renderUploadedImages();
        renderExplorerPanels();
        scheduleSave();
        setStatus(`已插入 ${accepted.length} 张图片并写入 Markdown`);
    }

    async function insertMediaFromFiles(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        if (state.uploadedMedia.length >= MAX_MEDIA_COUNT) {
            setStatus(`最多保留 ${MAX_MEDIA_COUNT} 个视频，请先移除旧视频`);
            return;
        }

        const accepted = [];
        for (const file of files) {
            if (!isSupportedVideoFile(file)) {
                setStatus(`已跳过非视频文件：${file && file.name ? file.name : '未知文件'}`);
                continue;
            }
            if (Number(file.size || 0) > MAX_MEDIA_FILE_SIZE) {
                setStatus(`视频过大（>${formatBytes(MAX_MEDIA_FILE_SIZE)}）：${file.name}`);
                continue;
            }
            if (state.uploadedMedia.length + accepted.length >= MAX_MEDIA_COUNT) {
                setStatus(`最多保留 ${MAX_MEDIA_COUNT} 个视频，其余已跳过`);
                break;
            }

            const dataUrl = await fileToDataUrl(file);
            const base64 = dataUrlToBase64(dataUrl);
            if (!base64) {
                setStatus(`视频编码失败，已跳过：${file.name}`);
                continue;
            }

            const assetPath = mediaAssetPathFromTarget(state.targetPath, file);
            const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            const item = {
                id: id,
                name: String(file.name || `video-${id}.mp4`),
                type: String(file.type || 'video/mp4'),
                size: Number(file.size || 0),
                assetPath: assetPath,
                dataUrl: dataUrl,
                base64: base64,
                insertedAt: new Date().toISOString()
            };
            accepted.push(item);
        }

        if (accepted.length === 0) {
            return;
        }

        accepted.forEach(function (item) {
            state.uploadedMedia.push(item);
            insertBlockSnippet(mediaInsertionText(item));
        });

        renderUploadedMedia();
        renderExplorerPanels();
        scheduleSave();
        setStatus(`已插入 ${accepted.length} 个视频并写入 Markdown`);
    }

    function csharpFileConflictInLocal(assetPath) {
        const normalized = normalizePath(assetPath || '');
        if (!normalized) return true;

        return state.uploadedCsharpFiles.some(function (item) {
            return normalizePath(item && item.assetPath || '') === normalized;
        });
    }

    function refreshCsharpSymbolOptions() {
        if (!dom.csharpSymbolSelect) return;

        const previous = String(dom.csharpSymbolSelect.value || '').trim();
        dom.csharpSymbolSelect.innerHTML = '';
        const initial = document.createElement('option');
        initial.value = '';
        initial.textContent = '先上传 C# 文件并选择符号...';
        dom.csharpSymbolSelect.appendChild(initial);

        const entries = [];
        state.uploadedCsharpFiles.forEach(function (fileItem) {
            const symbols = Array.isArray(fileItem.symbols) ? fileItem.symbols : [];
            const relPath = `./${String(fileItem.assetPath || '').split('/').slice(-2).join('/')}`;
            if (symbols.length === 0) {
                entries.push({
                    value: `${relPath}|` ,
                    label: `${fileItem.name} · 整文件`,
                    path: relPath,
                    selectorKind: '',
                    selector: ''
                });
                return;
            }

            symbols.forEach(function (symbol) {
                entries.push({
                    value: `${relPath}|${symbol.selectorKind}:${symbol.selector}`,
                    label: `${fileItem.name} · ${symbol.label}`,
                    path: relPath,
                    selectorKind: symbol.selectorKind,
                    selector: symbol.selector
                });
            });
        });

        state.csharpSymbolEntries = entries;
        entries.forEach(function (entry) {
            const option = document.createElement('option');
            option.value = entry.value;
            option.textContent = entry.label;
            dom.csharpSymbolSelect.appendChild(option);
        });

        if (previous && entries.some(function (entry) { return entry.value === previous; })) {
            dom.csharpSymbolSelect.value = previous;
        }
    }

    async function insertCsharpFilesFromUpload(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        if (state.uploadedCsharpFiles.length >= MAX_CSHARP_COUNT) {
            setStatus(`最多保留 ${MAX_CSHARP_COUNT} 个 C# 文件，请先移除旧文件`);
            return;
        }

        let insertedCount = 0;
        for (const file of files) {
            if (!file) continue;
            const fileName = String(file.name || 'source.cs');
            if (!/\.cs$/i.test(fileName)) {
                setStatus(`已跳过非 C# 文件：${fileName}`);
                continue;
            }
            if (Number(file.size || 0) > MAX_CSHARP_FILE_SIZE) {
                setStatus(`C# 文件过大（>${formatBytes(MAX_CSHARP_FILE_SIZE)}）：${fileName}`);
                continue;
            }
            if (state.uploadedCsharpFiles.length + insertedCount >= MAX_CSHARP_COUNT) {
                setStatus(`最多保留 ${MAX_CSHARP_COUNT} 个 C# 文件，其余已跳过`);
                break;
            }

            const assetPath = csharpAssetPathFromTarget(state.targetPath, fileName);
            if (csharpFileConflictInLocal(assetPath)) {
                setStatus(`C# 文件冲突：${assetPath} 已存在，请重命名后重试`);
                continue;
            }

            const content = await readFileAsUtf8Text(file);
            if (!content) {
                setStatus(`读取 C# 文件失败：${fileName}`);
                continue;
            }

            const localItem = {
                id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                name: fileName,
                size: Number(file.size || 0),
                assetPath: assetPath,
                content: content,
                symbols: extractCSharpSymbols(content),
                checkState: 'ok',
                checkMessage: '已通过检查',
                preflightPending: false
            };

            state.uploadedCsharpFiles.push(localItem);
            insertedCount += 1;

            const softResult = await runPreflightCheck({ mode: 'soft' });
            if (!softResult.ok) {
                if (softResult.pending) {
                    localItem.checkState = 'warn';
                    localItem.checkMessage = `待复检：${softResult.error || '检查失败'}`;
                } else {
                    state.uploadedCsharpFiles = state.uploadedCsharpFiles.filter(function (it) {
                        return it.id !== localItem.id;
                    });
                    insertedCount -= 1;
                    setStatus(`C# 文件冲突：${assetPath}，请重命名后重试`);
                    continue;
                }
            }

            const relPath = `./${String(localItem.assetPath || '').split('/').slice(-2).join('/')}`;
            insertBlockSnippet(`{{cs:${relPath}}}\n`, relPath);
        }

        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        renderExplorerPanels();
        scheduleSave();

        if (insertedCount > 0) {
            setStatus(`已插入 ${insertedCount} 个 C# 文件`);
        }
    }

    function setMyOpenPrsLoading(isLoading) {
        const loading = !!isLoading;
        if (dom.refreshMyPrs) dom.refreshMyPrs.disabled = loading;
        if (dom.prAssetContinueRefresh) dom.prAssetContinueRefresh.disabled = loading;
    }

    async function loadMyOpenPrs() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        const authToken = String(state.authToken || '').trim();

        if (!apiUrl) {
            setStatus('请先填写 Worker API 地址');
            return false;
        }

        if (!authToken) {
            setStatus('请先完成 GitHub 登录，再刷新未关闭 PR 列表');
            refreshPrAssetContinueSelectOptions(String(state.linkedPrNumber || '').trim());
            return false;
        }

        const listUrl = myOpenPrsUrlFromApiUrl(apiUrl);
        if (!listUrl) {
            setStatus('Worker 地址无效，无法读取未关闭 PR 列表');
            return false;
        }

        try {
            setMyOpenPrsLoading(true);
            setStatus('正在读取你的未关闭 PR 列表...');

            const response = await fetch(listUrl, {
                method: 'GET',
                headers: {
                    authorization: `Bearer ${authToken}`
                }
            });

            const responseText = await response.text();
            let responseData = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (_) {
                responseData = null;
            }

            if (response.status === 401) {
                clearAuthSession();
                updateAuthUi();
                throw new Error('GitHub 登录已过期，请重新登录');
            }

            if (!response.ok || !responseData || responseData.ok !== true) {
                const errMessage = responseData && responseData.error
                    ? String(responseData.error)
                    : `HTTP ${response.status}`;
                throw new Error(errMessage);
            }

            state.myOpenPrs = Array.isArray(responseData.pullRequests) ? responseData.pullRequests : [];
            updatePrChainSelectOptions();
            scheduleSave();
            setStatus(`已加载 ${state.myOpenPrs.length} 个未关闭 PR`);
            return true;
        } catch (err) {
            setStatus(`读取未关闭 PR 失败：${err && err.message ? err.message : String(err)}`);
            refreshPrAssetContinueSelectOptions(String(state.linkedPrNumber || '').trim());
            return false;
        } finally {
            setMyOpenPrsLoading(false);
        }
    }

    function updatePrLink(prUrl) {
        const url = String(prUrl || '').trim();
        state.lastPrUrl = url;

        if (!dom.lastPrLink) return;

        if (!url) {
            dom.lastPrLink.hidden = true;
            dom.lastPrLink.removeAttribute('href');
            return;
        }

        dom.lastPrLink.href = url;
        dom.lastPrLink.hidden = false;
    }

    function setPrSubmitBusy(isBusy) {
        if (!dom.submitPr) return;
        dom.submitPr.disabled = !!isBusy;
        dom.submitPr.textContent = isBusy ? '提交中...' : '提交 PR';
    }

    function loadAuthSession() {
        try {
            const token = sessionStorage.getItem(SESSION_AUTH_TOKEN_KEY) || '';
            const user = sessionStorage.getItem(SESSION_AUTH_USER_KEY) || '';
            state.authToken = String(token || '').trim();
            state.githubUser = String(user || '').trim();
        } catch (_) {
            state.authToken = '';
            state.githubUser = '';
        }
    }

    function persistAuthSession() {
        try {
            if (state.authToken) {
                sessionStorage.setItem(SESSION_AUTH_TOKEN_KEY, state.authToken);
            } else {
                sessionStorage.removeItem(SESSION_AUTH_TOKEN_KEY);
            }

            if (state.githubUser) {
                sessionStorage.setItem(SESSION_AUTH_USER_KEY, state.githubUser);
            } else {
                sessionStorage.removeItem(SESSION_AUTH_USER_KEY);
            }
        } catch (_) {
            // ignore session storage failures
        }
    }

    function clearAuthSession() {
        state.authToken = '';
        state.githubUser = '';
        persistAuthSession();
    }

    function updateAuthUi() {
        const isLoggedIn = !!state.authToken;
        const userText = state.githubUser ? `@${state.githubUser}` : '已登录';

        if (dom.authStatus) {
            dom.authStatus.textContent = isLoggedIn ? userText : '未登录';
            dom.authStatus.style.color = isLoggedIn ? 'var(--text-color)' : 'var(--text-secondary)';
        }

        if (dom.authLogin) {
            dom.authLogin.textContent = isLoggedIn ? '切换 GitHub 账号' : 'GitHub 登录';
        }

        if (dom.authLogout) {
            dom.authLogout.disabled = !isLoggedIn;
        }
    }

    function consumeOauthResultFromHash() {
        const hash = String(window.location.hash || '').replace(/^#/, '');
        if (!hash) return false;

        const hasOauthToken = /(^|&)oauth_token=/.test(hash);
        const hasOauthError = /(^|&)oauth_error=/.test(hash);
        if (!hasOauthToken && !hasOauthError) return false;

        const params = new URLSearchParams(hash);
        const oauthToken = String(params.get('oauth_token') || '').trim();
        const githubUser = String(params.get('github_user') || '').trim();
        const oauthError = String(params.get('oauth_error') || '').trim();

        if (oauthToken) {
            state.authToken = oauthToken;
            state.githubUser = githubUser;
            persistAuthSession();
            updateAuthUi();
            setStatus(`GitHub 登录成功${githubUser ? `：@${githubUser}` : ''}`);
        } else {
            clearAuthSession();
            updateAuthUi();
            setStatus(`GitHub 登录失败：${oauthError || '未知错误'}`);
        }

        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, '', cleanUrl);
        return true;
    }

    async function verifyAuthSession() {
        if (!state.authToken) {
            updateAuthUi();
            return;
        }

        const meUrl = authMeUrlFromApiUrl(state.workerApiUrl);
        if (!meUrl) {
            clearAuthSession();
            updateAuthUi();
            setStatus('Worker 地址无效，无法验证 GitHub 登录状态');
            return;
        }

        try {
            const response = await fetch(meUrl, {
                method: 'GET',
                headers: {
                    'authorization': `Bearer ${state.authToken}`
                }
            });

            const responseText = await response.text();
            let responseData = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (_) {
                responseData = null;
            }

            if (!response.ok || !responseData || responseData.ok !== true || !responseData.user) {
                clearAuthSession();
                updateAuthUi();
                setStatus('GitHub 登录已失效，请重新登录');
                return;
            }

            state.githubUser = String(responseData.user || '').trim();
            persistAuthSession();
            updateAuthUi();
        } catch (err) {
            setStatus(`验证登录状态失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    async function startGithubLogin() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        if (!apiUrl) {
            setStatus('请先填写 Worker API 地址');
            if (dom.prWorkerUrl) dom.prWorkerUrl.focus();
            return;
        }

        const loginUrl = authLoginUrlFromApiUrl(apiUrl);
        if (!loginUrl) {
            setStatus('无法生成 GitHub 登录地址，请检查 Worker API');
            return;
        }

        state.workerApiUrl = apiUrl;
        if (dom.prWorkerUrl) dom.prWorkerUrl.value = apiUrl;
        scheduleSave();

        setStatus('正在跳转 GitHub 授权页面...');
        window.location.href = loginUrl;
    }

    function logoutGithub() {
        if (!state.authToken) return;
        clearAuthSession();
        state.myOpenPrs = [];
        state.linkedPrNumber = '';
        updatePrChainSelectOptions();
        scheduleSave();
        updateAuthUi();
        setStatus('已退出 GitHub 登录状态');
    }

    function updateFileIdentity() {
        const filename = getFilenameFromPath(state.targetPath) || '新文章.md';
        ensureOpenTab(state.targetPath);
        renderTabs();

        if (dom.activeTab) {
            dom.activeTab.textContent = filename;
        }

        if (dom.currentPath) {
            dom.currentPath.textContent = `目标: ${state.targetPath}`;
        }

        if (dom.breadcrumbPath) {
            dom.breadcrumbPath.textContent = state.targetPath;
        }

        if (dom.editorPath) {
            dom.editorPath.textContent = state.targetPath;
        }

        if (dom.targetPath && dom.targetPath.value !== state.targetPath) {
            dom.targetPath.value = state.targetPath;
        }

        if (dom.filename && document.activeElement !== dom.filename) {
            dom.filename.value = filename;
        }

        if (dom.directoryParent && document.activeElement !== dom.directoryParent) {
            dom.directoryParent.value = getDirectoryFromPath(state.targetPath);
        }

        if (dom.prTitle && !String(dom.prTitle.value || '').trim()) {
            dom.prTitle.placeholder = defaultPrTitle();
        }

        updatePathBreadcrumb(state.targetPath);
        renderExplorerPanels();
    }

    function findKnownEntryByPath(path) {
        const normalized = normalizePath(path);
        if (!normalized) return null;
        return knownMarkdownEntries.find(function (entry) {
            return normalizePath(entry && entry.path || '') === normalized;
        }) || null;
    }

    function updatePathBreadcrumb(pathValue) {
        if (!dom.pathBreadcrumb) return;

        const normalized = normalizePath(pathValue || '');
        if (!normalized) {
            dom.pathBreadcrumb.textContent = '路径导航：未选择';
            return;
        }

        const found = findKnownEntryByPath(normalized);
        if (found) {
            dom.pathBreadcrumb.textContent = `路径导航：${found.categoryTitle} > ${found.topicTitle} > ${found.title}`;
            return;
        }

        const segments = normalized.split('/').filter(Boolean);
        if (segments.length <= 1) {
            dom.pathBreadcrumb.textContent = `路径导航：${normalized}（未收录）`;
            return;
        }

        const fileLabel = segments[segments.length - 1];
        const dirLabel = segments.slice(0, -1).join(' / ');
        dom.pathBreadcrumb.textContent = `路径导航：${dirLabel} > ${fileLabel}（未收录）`;
    }

    function setSelectOptions(selectEl, options, defaultLabel) {
        if (!selectEl) return;
        selectEl.innerHTML = '';

        const first = document.createElement('option');
        first.value = '';
        first.textContent = defaultLabel;
        selectEl.appendChild(first);

        (options || []).forEach(function (option) {
            const next = document.createElement('option');
            next.value = String(option.value || '');
            next.textContent = String(option.label || option.value || '');
            selectEl.appendChild(next);
        });
    }

    function collectCategoryOptions(entries) {
        const map = new Map();
        (entries || []).forEach(function (entry) {
            if (!entry || !entry.categoryKey) return;
            if (map.has(entry.categoryKey)) return;
            map.set(entry.categoryKey, {
                value: entry.categoryKey,
                label: entry.categoryTitle || entry.categoryKey
            });
        });
        return Array.from(map.values()).sort(function (a, b) {
            return String(a.label || '').localeCompare(String(b.label || ''), 'zh-CN');
        });
    }

    function collectTopicOptions(entries, categoryKey) {
        const map = new Map();
        (entries || []).forEach(function (entry) {
            if (!entry || !entry.topicKey) return;
            if (categoryKey && entry.categoryKey !== categoryKey) return;
            if (map.has(entry.topicKey)) return;
            map.set(entry.topicKey, {
                value: entry.topicKey,
                label: entry.topicTitle || entry.topicKey
            });
        });
        return Array.from(map.values()).sort(function (a, b) {
            return String(a.label || '').localeCompare(String(b.label || ''), 'zh-CN');
        });
    }

    function filterEntriesByHierarchy(categoryKey, topicKey) {
        return knownMarkdownEntries.filter(function (entry) {
            if (!entry || !entry.path) return false;
            if (categoryKey && entry.categoryKey !== categoryKey) return false;
            if (topicKey && entry.topicKey !== topicKey) return false;
            return true;
        });
    }

    function renderExistingSelectOptions(entries) {
        if (!dom.existingSelect) return;

        const list = Array.isArray(entries) ? entries : knownMarkdownEntries;
        dom.existingSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '从站点目录选择文章...';
        dom.existingSelect.appendChild(defaultOption);

        const grouped = new Map();
        list.forEach(function (entry) {
            const key = `${entry.categoryTitle || '未分类'} / ${entry.topicTitle || '未分组'}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(entry);
        });

        Array.from(grouped.keys()).sort(function (a, b) {
            return String(a).localeCompare(String(b), 'zh-CN');
        }).forEach(function (groupLabel) {
            const group = document.createElement('optgroup');
            group.label = groupLabel;

            grouped.get(groupLabel).forEach(function (entry) {
                const option = document.createElement('option');
                option.value = entry.path;
                option.textContent = `${entry.path} · ${entry.title}`;
                group.appendChild(option);
            });

            dom.existingSelect.appendChild(group);
        });

        if (list.some(function (entry) { return entry.path === state.targetPath; })) {
            dom.existingSelect.value = state.targetPath;
        }
    }

    function refreshHierarchySelectors(preferredPath) {
        const target = normalizePath(preferredPath || '');
        const targetEntry = target ? findKnownEntryByPath(target) : null;

        let selectedCategory = dom.categorySelect ? String(dom.categorySelect.value || '').trim() : '';
        if (targetEntry) {
            selectedCategory = targetEntry.categoryKey;
        }

        const categoryOptions = collectCategoryOptions(knownMarkdownEntries);
        if (dom.categorySelect) {
            setSelectOptions(dom.categorySelect, categoryOptions, '全部分类');
            if (selectedCategory && categoryOptions.some(function (item) { return item.value === selectedCategory; })) {
                dom.categorySelect.value = selectedCategory;
            }
        }

        let selectedTopic = dom.topicSelect ? String(dom.topicSelect.value || '').trim() : '';
        if (targetEntry && (!selectedCategory || targetEntry.categoryKey === selectedCategory)) {
            selectedTopic = targetEntry.topicKey;
        }

        const topicOptions = collectTopicOptions(knownMarkdownEntries, selectedCategory);
        if (dom.topicSelect) {
            setSelectOptions(dom.topicSelect, topicOptions, '全部主题');
            if (selectedTopic && topicOptions.some(function (item) { return item.value === selectedTopic; })) {
                dom.topicSelect.value = selectedTopic;
            } else {
                selectedTopic = '';
            }
        }

        const filteredEntries = filterEntriesByHierarchy(selectedCategory, selectedTopic);

        if (dom.fileSelect) {
            dom.fileSelect.innerHTML = '';
            const first = document.createElement('option');
            first.value = '';
            first.textContent = '从层级导航选择文章...';
            dom.fileSelect.appendChild(first);

            filteredEntries.forEach(function (entry) {
                const option = document.createElement('option');
                option.value = entry.path;
                option.textContent = `${entry.title} · ${entry.path}`;
                dom.fileSelect.appendChild(option);
            });

            const selectedFilePath = targetEntry
                ? targetEntry.path
                : (dom.fileSelect.value || '');
            if (selectedFilePath && filteredEntries.some(function (entry) { return entry.path === selectedFilePath; })) {
                dom.fileSelect.value = selectedFilePath;
            }
        }

        renderExistingSelectOptions(filteredEntries);
        updatePathBreadcrumb(state.targetPath);
    }

    function listExplorerEntries() {
        const entryMap = new Map();
        const kindOrder = {
            markdown: 0,
            csharp: 1,
            image: 2,
            media: 3,
            asset: 4
        };
        const kindLabel = {
            markdown: '文章',
            csharp: 'C#',
            image: '图片',
            media: '视频',
            asset: '资源'
        };
        const resourcePathKindSet = new Set();

        const normalizeExplorerAssetPath = function (rawPath, baseMarkdownPath) {
            const text = String(rawPath || '').trim();
            if (!text) return '';
            if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(text)) return '';

            const stripped = text.split('#')[0].split('?')[0].trim();
            if (!stripped) return '';

            if (stripped.startsWith('/')) {
                return decodeExplorerPath(stripped);
            }

            const baseDir = getDirectoryFromPath(ensureMarkdownPath(baseMarkdownPath || state.targetPath));
            const resolved = (stripped.startsWith('./') || stripped.startsWith('../'))
                ? resolveRelativeMarkdownPath(baseDir, stripped)
                : resolveRelativeMarkdownPath(baseDir, `./${stripped}`);
            return decodeExplorerPath(resolved);
        };

        const inferExplorerAssetKind = function (pathValue) {
            const path = normalizePath(pathValue || '').toLowerCase();
            if (!path) return 'asset';
            if (/\.cs$/i.test(path)) return 'csharp';
            if (/\.(?:png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path)) return 'image';
            if (/\.(?:mp4|webm)$/i.test(path)) return 'media';
            return 'asset';
        };

        const appendMarkdownAssetReferences = function (markdownText, baseMarkdownPath) {
            const source = String(markdownText || '');
            if (!source.trim()) return;

            const imageLinkRegex = /!\[[^\]]*]\(([^)]+)\)/g;
            let match = null;
            while ((match = imageLinkRegex.exec(source)) !== null) {
                const hrefRaw = String(match[1] || '').trim();
                if (!hrefRaw) continue;
                const href = hrefRaw.split(/\s+/)[0];
                const resolvedPath = normalizeExplorerAssetPath(href, baseMarkdownPath);
                if (!resolvedPath || /\.md$/i.test(resolvedPath)) continue;
                const kind = inferExplorerAssetKind(resolvedPath);
                const key = `${kind}:${resolvedPath}`;
                if (resourcePathKindSet.has(key)) continue;
                resourcePathKindSet.add(key);
                upsertEntry({
                    key: `ref:${kind}:${resolvedPath}`,
                    path: resolvedPath,
                    title: getFilenameFromPath(resolvedPath) || resolvedPath,
                    kind: kind,
                    resourceId: ''
                });
            }

            const csRegex = /\{\{cs:([^}\n]+)\}\}/g;
            let csMatch = null;
            while ((csMatch = csRegex.exec(source)) !== null) {
                const parsed = parseCsDirective(csMatch[1]);
                if (!parsed || !parsed.pathPart) continue;
                const resolvedPath = normalizeExplorerAssetPath(parsed.pathPart, baseMarkdownPath);
                if (!resolvedPath || !/\.cs$/i.test(resolvedPath)) continue;
                const key = `csharp:${resolvedPath}`;
                if (resourcePathKindSet.has(key)) continue;
                resourcePathKindSet.add(key);
                upsertEntry({
                    key: `ref:csharp:${resolvedPath}`,
                    path: resolvedPath,
                    title: getFilenameFromPath(resolvedPath) || resolvedPath,
                    kind: 'csharp',
                    resourceId: ''
                });
            }

            const animRegex = /\{\{anim:([^}\n]+)\}\}/g;
            let animMatch = null;
            while ((animMatch = animRegex.exec(source)) !== null) {
                const rawPath = String(animMatch[1] || '').trim();
                const resolvedPath = normalizePath(rawPath).replace(/^\.\//, '');
                if (!isAnimSourcePath(resolvedPath)) continue;
                const key = `csharp:${resolvedPath}`;
                if (resourcePathKindSet.has(key)) continue;
                resourcePathKindSet.add(key);
                upsertEntry({
                    key: `ref:csharp:${resolvedPath}`,
                    path: resolvedPath,
                    title: getFilenameFromPath(resolvedPath) || resolvedPath,
                    kind: 'csharp',
                    resourceId: ''
                });
            }

            const animcsRegex = /```animcs\s*([\s\S]*?)```/g;
            let animcsMatch = null;
            while ((animcsMatch = animcsRegex.exec(source)) !== null) {
                const body = String(animcsMatch[1] || '');
                const firstLine = body.split(/\r?\n/).map(function (line) {
                    return String(line || '').trim();
                }).find(Boolean) || '';
                const resolvedPath = normalizePath(firstLine).replace(/^\.\//, '');
                if (!isAnimSourcePath(resolvedPath)) continue;
                const key = `csharp:${resolvedPath}`;
                if (resourcePathKindSet.has(key)) continue;
                resourcePathKindSet.add(key);
                upsertEntry({
                    key: `ref:csharp:${resolvedPath}`,
                    path: resolvedPath,
                    title: getFilenameFromPath(resolvedPath) || resolvedPath,
                    kind: 'csharp',
                    resourceId: ''
                });
            }
        };

        const upsertEntry = function (item) {
            if (!item || !item.path) return;
            const normalizedPath = normalizePath(item.path);
            if (!normalizedPath) return;
            const kind = String(item.kind || 'markdown').trim().toLowerCase();
            const id = String(item.resourceId || '').trim();
            const key = String(item.key || `${kind}:${normalizedPath}${id ? `:${id}` : ''}`);
            entryMap.set(key, {
                key: key,
                path: normalizedPath,
                title: String(item.title || getFilenameFromPath(normalizedPath) || normalizedPath),
                directory: getDirectoryFromPath(normalizedPath),
                kind: kind,
                kindLabel: kindLabel[kind] || kindLabel.asset,
                resourceId: id,
                fromConfig: !!item.fromConfig
            });
            if (kind !== 'markdown') {
                resourcePathKindSet.add(`${kind}:${normalizedPath}`);
            }
        };

        (knownMarkdownEntries || []).forEach(function (entry) {
            if (!entry || !entry.path) return;
            upsertEntry({
                key: `markdown:${normalizePath(entry.path)}`,
                path: entry.path,
                title: String(entry.title || getFilenameFromPath(entry.path) || entry.path),
                kind: 'markdown',
                fromConfig: true
            });
        });

        Object.keys(ensureObject(state.draftFiles)).forEach(function (pathKey) {
            const path = normalizePath(pathKey);
            if (!path) return;
            const key = `markdown:${path}`;
            if (!entryMap.has(key)) {
                upsertEntry({
                    key: key,
                    path: path,
                    title: getFilenameFromPath(path) || path,
                    kind: 'markdown',
                    fromConfig: false
                });
            }
        });

        (Array.isArray(state.uploadedImages) ? state.uploadedImages : []).forEach(function (item) {
            const path = normalizePath(item && item.assetPath || '');
            if (!path) return;
            upsertEntry({
                key: `image:${path}:${String(item && item.id || '')}`,
                path: path,
                title: String(item && item.name || getFilenameFromPath(path) || path),
                kind: 'image',
                resourceId: String(item && item.id || '')
            });
        });

        (Array.isArray(state.uploadedMedia) ? state.uploadedMedia : []).forEach(function (item) {
            const path = normalizePath(item && item.assetPath || '');
            if (!path) return;
            upsertEntry({
                key: `media:${path}:${String(item && item.id || '')}`,
                path: path,
                title: String(item && item.name || getFilenameFromPath(path) || path),
                kind: 'media',
                resourceId: String(item && item.id || '')
            });
        });

        (Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : []).forEach(function (item) {
            const path = normalizePath(item && item.assetPath || '');
            if (!path) return;
            upsertEntry({
                key: `csharp:${path}:${String(item && item.id || '')}`,
                path: path,
                title: String(item && item.name || getFilenameFromPath(path) || path),
                kind: 'csharp',
                resourceId: String(item && item.id || '')
            });
        });

        (Array.isArray(indexedExplorerResources) ? indexedExplorerResources : []).forEach(function (item) {
            const path = normalizePath(item && item.path || '');
            const kind = normalizeExplorerEntryKind(item && item.kind || 'markdown');
            if (!path || !isExplorerResourceKind(kind)) return;
            const dedupeKey = `${kind}:${path}`;
            if (resourcePathKindSet.has(dedupeKey)) return;
            upsertEntry({
                key: String(item && item.key || `indexed:${dedupeKey}`),
                path: path,
                title: String(item && item.title || getFilenameFromPath(path) || path),
                kind: kind,
                resourceId: ''
            });
        });

        appendMarkdownAssetReferences(state.markdown, state.targetPath);
        Object.keys(ensureObject(state.draftFiles)).forEach(function (pathKey) {
            const record = getDraftRecord(pathKey);
            if (!record || !record.markdown) return;
            appendMarkdownAssetReferences(record.markdown, record.path || pathKey);
        });

        const filterText = String(state.explorerFilter || '').trim().toLowerCase();
        return Array.from(entryMap.values()).filter(function (item) {
            if (!filterText) return true;
            return item.path.toLowerCase().includes(filterText)
                || String(item.title || '').toLowerCase().includes(filterText)
                || String(item.kindLabel || '').toLowerCase().includes(filterText)
                || String(item.kind || '').toLowerCase().includes(filterText);
        }).sort(function (a, b) {
            const pathCompare = String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
            if (pathCompare !== 0) return pathCompare;

            const orderA = Number(kindOrder[a.kind] || 99);
            const orderB = Number(kindOrder[b.kind] || 99);
            if (orderA !== orderB) return orderA - orderB;

            return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
        });
    }

    function ensureExplorerFolderMap() {
        if (!state.explorerFolders || typeof state.explorerFolders !== 'object') {
            state.explorerFolders = {};
        }
        return state.explorerFolders;
    }

    function isExplorerFolderOpen(pathValue, activePath, filterEnabled) {
        const folderPath = normalizePath(pathValue || '');
        if (!folderPath) return true;

        const folders = ensureExplorerFolderMap();
        if (Object.prototype.hasOwnProperty.call(folders, folderPath)) {
            return !!folders[folderPath];
        }

        if (filterEnabled) {
            return true;
        }

        if (activePath && (activePath === folderPath || activePath.startsWith(`${folderPath}/`))) {
            return true;
        }

        return folderPath.split('/').filter(Boolean).length <= 1;
    }

    function toggleExplorerFolder(pathValue) {
        const folderPath = normalizePath(pathValue || '');
        if (!folderPath) return;

        const activePath = normalizePath(state.targetPath || '');
        const filterEnabled = !!String(state.explorerFilter || '').trim();
        const folders = ensureExplorerFolderMap();
        folders[folderPath] = !isExplorerFolderOpen(folderPath, activePath, filterEnabled);
        renderExplorerTree();
        scheduleSave();
    }

    function buildExplorerFolderTree(entries) {
        const root = {
            path: '',
            name: '',
            folders: new Map(),
            files: []
        };

        (Array.isArray(entries) ? entries : []).forEach(function (entry) {
            const filePath = normalizePath(entry && entry.path || '');
            if (!filePath) return;

            const segments = filePath.split('/').filter(Boolean);
            if (segments.length <= 0) return;

            let node = root;
            for (let i = 0; i < segments.length - 1; i += 1) {
                const segment = segments[i];
                const folderPath = segments.slice(0, i + 1).join('/');
                if (!node.folders.has(segment)) {
                    node.folders.set(segment, {
                        path: folderPath,
                        name: segment,
                        folders: new Map(),
                        files: []
                    });
                }
                node = node.folders.get(segment);
            }

            node.files.push({
                ...entry,
                path: filePath,
                title: String(entry.title || getFilenameFromPath(filePath) || filePath)
            });
        });

        const sortNode = function (node) {
            node.files.sort(function (a, b) {
                return String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
            });

            const sortedFolders = Array.from(node.folders.entries()).sort(function (a, b) {
                return String(a[0] || '').localeCompare(String(b[0] || ''), 'zh-CN');
            });

            node.folders = new Map(sortedFolders);
            node.folders.forEach(function (child) {
                sortNode(child);
            });
        };

        sortNode(root);
        return root;
    }

    function renderStageList() {
        if (!dom.stageList) return;
        const activePath = normalizePath(state.targetPath || '');
        const items = Object.keys(ensureObject(state.draftFiles)).map(function (pathKey) {
            const record = getDraftRecord(pathKey);
            return record;
        }).filter(Boolean).sort(function (a, b) {
            return String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
        });

        dom.stageList.innerHTML = '';
        if (items.length <= 0) {
            const empty = document.createElement('span');
            empty.className = 'studio-help';
            empty.textContent = '暂无暂存改动';
            dom.stageList.appendChild(empty);
            return;
        }

        items.forEach(function (record) {
            const row = document.createElement('div');
            row.className = 'studio-stage-item';
            row.dataset.path = record.path;
            if (normalizePath(record.path) === activePath) {
                row.classList.add('is-active');
            }

            const main = document.createElement('span');
            main.className = 'studio-tree-main';

            const badge = document.createElement('span');
            badge.className = `studio-change-badge studio-change-badge--${record.status}`;
            badge.textContent = getDraftStatusCode(record.status);

            const name = document.createElement('span');
            name.className = 'studio-tree-name';
            name.textContent = getFilenameFromPath(record.path) || record.path;

            main.appendChild(badge);
            main.appendChild(name);

            const path = document.createElement('span');
            path.className = 'studio-tree-path';
            path.textContent = record.path;

            row.appendChild(main);
            row.appendChild(path);
            dom.stageList.appendChild(row);
        });
    }

    function renderExplorerTree() {
        if (!dom.explorerTree) return;
        const entries = listExplorerEntries();
        const activePath = normalizePath(state.targetPath || '');
        const filterEnabled = !!String(state.explorerFilter || '').trim();

        dom.explorerTree.innerHTML = '';
        if (entries.length <= 0) {
            const empty = document.createElement('span');
            empty.className = 'studio-help';
            empty.textContent = '没有可显示的文件或资源';
            dom.explorerTree.appendChild(empty);
            return;
        }

        const tree = buildExplorerFolderTree(entries);

        const createFileRow = function (entry, depth) {
            const kind = normalizeExplorerEntryKind(entry.kind);
            const rowKey = String(entry.key || `${kind}:${entry.path}`);

            const row = document.createElement('div');
            row.className = 'studio-tree-item studio-tree-item--file';
            row.dataset.treeKey = rowKey;
            row.dataset.treePath = entry.path;
            row.dataset.treeKind = kind;
            row.dataset.treeId = String(entry.resourceId || '');
            row.style.setProperty('--studio-tree-depth', String(Math.max(0, depth)));
            if (kind === 'markdown' && entry.path === activePath) {
                row.classList.add('is-active');
            }

            const left = document.createElement('button');
            left.type = 'button';
            left.className = 'btn btn-small btn-outline studio-tree-open studio-tree-open--file';
            left.dataset.treeKey = rowKey;
            left.dataset.treePath = entry.path;
            left.dataset.treeKind = kind;
            left.dataset.treeId = String(entry.resourceId || '');

            const icon = document.createElement('span');
            icon.className = 'studio-tree-icon studio-tree-icon--file';
            icon.textContent = explorerGlyphForKind(kind);

            const labels = document.createElement('span');
            labels.className = 'studio-tree-label-stack';

            const name = document.createElement('span');
            name.className = 'studio-tree-name';
            const displayName = String(getFilenameFromPath(entry.path) || entry.title || entry.path);
            name.textContent = displayName;

            const path = document.createElement('span');
            path.className = 'studio-tree-path';
            const basePath = getDirectoryFromPath(entry.path) || '(root)';
            path.textContent = kind === 'markdown'
                ? basePath
                : `${basePath} · ${String(entry.kindLabel || kind).toUpperCase()}`;

            labels.appendChild(name);
            labels.appendChild(path);
            left.appendChild(icon);
            left.appendChild(labels);
            left.title = kind === 'markdown'
                ? entry.path
                : `${entry.path} (${String(entry.kindLabel || kind).toUpperCase()})`;

            const actions = document.createElement('div');
            actions.className = 'studio-tree-actions';

            const draft = kind === 'markdown' ? getDraftRecord(entry.path) : null;
            if (draft && kind === 'markdown') {
                const badge = document.createElement('span');
                badge.className = `studio-change-badge studio-change-badge--${draft.status}`;
                badge.textContent = getDraftStatusCode(draft.status);
                actions.appendChild(badge);
            }

            const menuButton = document.createElement('button');
            menuButton.type = 'button';
            menuButton.className = 'btn btn-small btn-outline';
            menuButton.dataset.treeKey = rowKey;
            menuButton.dataset.treeMenuPath = entry.path;
            menuButton.dataset.treeMenuKind = kind;
            menuButton.dataset.treeMenuId = String(entry.resourceId || '');
            menuButton.setAttribute('aria-label', `打开 ${entry.path} 的操作菜单`);
            menuButton.textContent = '⋯';
            actions.appendChild(menuButton);

            row.appendChild(left);
            row.appendChild(actions);
            return row;
        };

        const renderFolder = function (folderNode, depth) {
            const folderPath = normalizePath(folderNode.path || '');
            const folderOpen = isExplorerFolderOpen(folderPath, activePath, filterEnabled);
            const containsActive = !!(activePath && folderPath && activePath.startsWith(`${folderPath}/`));

            const wrapper = document.createElement('div');
            wrapper.className = 'studio-tree-folder';
            wrapper.dataset.treeFolderPath = folderPath;

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'studio-tree-folder-toggle';
            toggle.dataset.treeFolder = folderPath;
            toggle.style.setProperty('--studio-tree-depth', String(Math.max(0, depth)));
            toggle.setAttribute('aria-expanded', folderOpen ? 'true' : 'false');
            toggle.classList.toggle('is-contains-active', containsActive);

            const caret = document.createElement('span');
            caret.className = 'studio-tree-icon studio-tree-icon--caret';
            caret.textContent = folderOpen ? NERD_TREE_GLYPHS.caretOpen : NERD_TREE_GLYPHS.caretClosed;

            const icon = document.createElement('span');
            icon.className = 'studio-tree-icon studio-tree-icon--folder';
            icon.textContent = folderOpen ? NERD_TREE_GLYPHS.folderOpen : NERD_TREE_GLYPHS.folderClosed;

            const name = document.createElement('span');
            name.className = 'studio-tree-folder-name';
            name.textContent = folderNode.name;

            const count = document.createElement('span');
            count.className = 'studio-tree-folder-meta';
            count.textContent = String(folderNode.folders.size + folderNode.files.length);

            toggle.appendChild(caret);
            toggle.appendChild(icon);
            toggle.appendChild(name);
            toggle.appendChild(count);

            const children = document.createElement('div');
            children.className = 'studio-tree-folder-children';
            children.hidden = !folderOpen;

            folderNode.folders.forEach(function (childFolder) {
                children.appendChild(renderFolder(childFolder, depth + 1));
            });
            folderNode.files.forEach(function (fileEntry) {
                children.appendChild(createFileRow(fileEntry, depth + 1));
            });

            wrapper.appendChild(toggle);
            wrapper.appendChild(children);
            return wrapper;
        };

        tree.folders.forEach(function (folderNode) {
            dom.explorerTree.appendChild(renderFolder(folderNode, 0));
        });
        tree.files.forEach(function (fileEntry) {
            dom.explorerTree.appendChild(createFileRow(fileEntry, 0));
        });
    }

    function renderExplorerPanels() {
        renderTabs();
        renderExplorerTree();
        renderStageList();
        renderPrSubmitManifest();
    }

    function syncExplorerContextMenuActions(kindValue, options) {
        if (!dom.explorerContextMenu) return;
        const opts = options && typeof options === 'object' ? options : {};

        const kind = normalizeExplorerEntryKind(kindValue);
        const isMarkdown = kind === 'markdown';
        const isCsharp = kind === 'csharp';
        const hasResourceId = !!String(opts.resourceId || '').trim();
        const actionVisible = {
            'open-file': isMarkdown,
            'new-file': isMarkdown,
            'toggle-delete': isMarkdown,
            'discard-file': isMarkdown,
            'insert-resource': !isMarkdown,
            'preview-resource': !isMarkdown,
            'edit-csharp': isCsharp && hasResourceId,
            'remove-resource': !isMarkdown && hasResourceId
        };

        const items = Array.from(dom.explorerContextMenu.querySelectorAll('[data-context-action]'));
        items.forEach(function (button) {
            const action = String(button.getAttribute('data-context-action') || '').trim().toLowerCase();
            button.hidden = !actionVisible[action];
        });
    }

    function hideExplorerContextMenu() {
        if (!dom.explorerContextMenu) return;
        dom.explorerContextMenu.hidden = true;
        if (dom.explorerContextTrigger) {
            dom.explorerContextTrigger.setAttribute('aria-expanded', 'false');
        }
        state.explorerContext.open = false;
        state.explorerContext.path = '';
        state.explorerContext.kind = 'markdown';
        state.explorerContext.resourceId = '';
        state.explorerContext.treeKey = '';
    }

    function openExplorerContextMenu(pathValue, x, y, options) {
        if (!dom.explorerContextMenu) return;
        const opts = options && typeof options === 'object' ? options : {};
        const path = normalizePath(pathValue || state.targetPath || '');
        if (!path) return;
        const kind = normalizeExplorerEntryKind(opts.kind || 'markdown');
        const resourceId = String(opts.resourceId || '').trim();
        const treeKey = String(opts.treeKey || `${kind}:${path}${resourceId ? `:${resourceId}` : ''}`);

        state.explorerContext.open = true;
        state.explorerContext.path = path;
        state.explorerContext.kind = kind;
        state.explorerContext.resourceId = resourceId;
        state.explorerContext.treeKey = treeKey;
        state.explorerContext.x = Number(x || 0);
        state.explorerContext.y = Number(y || 0);

        syncExplorerContextMenuActions(kind, { resourceId: resourceId });
        dom.explorerContextMenu.hidden = false;
        dom.explorerContextMenu.style.left = `${Math.max(8, Math.floor(state.explorerContext.x))}px`;
        dom.explorerContextMenu.style.top = `${Math.max(8, Math.floor(state.explorerContext.y))}px`;
        if (dom.explorerContextTrigger) {
            dom.explorerContextTrigger.setAttribute('aria-expanded', 'true');
        }
    }

    function applyEditorStateForPath(pathValue, markdownText, metadataValue, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const changed = setTargetPath(pathValue, true);
        if (!changed) return false;

        state.markdown = String(markdownText || '').replace(/\r\n/g, '\n');
        if (dom.markdown) {
            dom.markdown.value = state.markdown;
        }

        setMetadataState(cloneMetadata(metadataValue || {}), { silent: true });
        renderMetadataFormFromState();
        renderColorListsFromState();
        updateChapterSelectOptions();
        updateStats();
        renderPreview();
        ensureOpenTab(state.targetPath);
        renderExplorerPanels();

        if (!opts.skipSave) {
            scheduleSave();
        }
        if (!opts.silentStatus) {
            setStatus(`已切换文件：${state.targetPath}`);
        }
        return true;
    }

    function buildNewDraftPath(baseDirectory) {
        const dir = normalizePath(baseDirectory || '').replace(/\/+$/g, '');
        const used = new Set();

        (knownMarkdownEntries || []).forEach(function (entry) {
            if (!entry || !entry.path) return;
            used.add(normalizePath(entry.path));
        });
        Object.keys(ensureObject(state.draftFiles)).forEach(function (pathKey) {
            used.add(normalizePath(pathKey));
        });

        let index = 1;
        while (index < 10000) {
            const filename = index === 1 ? '新文章.md' : `新文章-${index}.md`;
            const candidate = normalizePath(dir ? `${dir}/${filename}` : filename);
            if (candidate && !used.has(candidate)) {
                return candidate;
            }
            index += 1;
        }

        return normalizePath(`${dir || '怎么贡献'}/新文章-${Date.now().toString(36)}.md`);
    }

    function createDraftFile(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return false;

        const metadata = cloneMetadata(state.metadata);
        const markdown = mergeFrontMatterIntoMarkdown('');
        setFileBaseline(safePath, {
            exists: false,
            markdown: '',
            metadata: metadata
        });
        setDraftRecord(safePath, {
            status: 'added',
            markdown: markdown,
            metadata: metadata,
            updatedAt: new Date().toISOString()
        });
        ensureOpenTab(safePath);
        applyEditorStateForPath(safePath, markdown, metadata, { skipSave: false, silentStatus: true });
        setStatus(`已新建暂存文件：${safePath}`);
        return true;
    }

    function toggleDraftDeletion(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;

        const draft = getDraftRecord(safePath);
        const baseline = getFileBaseline(safePath);

        if (draft && draft.status === 'deleted') {
            if (baseline && baseline.exists) {
                syncDraftForPath(safePath, draft.markdown, draft.metadata);
                setStatus(`已取消删除标记：${safePath}`);
            } else {
                setDraftRecord(safePath, null);
                setStatus(`已移除新建文件：${safePath}`);
            }
            renderExplorerPanels();
            scheduleSave();
            return;
        }

        if (baseline && baseline.exists) {
            const markdown = draft
                ? draft.markdown
                : (normalizePath(state.targetPath) === safePath ? String(state.markdown || '') : String(baseline.markdown || ''));
            const metadata = draft
                ? draft.metadata
                : (normalizePath(state.targetPath) === safePath ? cloneMetadata(state.metadata) : cloneMetadata(baseline.metadata));
            setDraftRecord(safePath, {
                status: 'deleted',
                markdown: markdown,
                metadata: metadata,
                updatedAt: new Date().toISOString()
            });
            setStatus(`已标记删除：${safePath}`);
        } else {
            setDraftRecord(safePath, null);
            setStatus(`已移除新建文件：${safePath}`);
        }

        renderExplorerPanels();
        scheduleSave();
    }

    function discardDraftForPath(pathValue) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;

        const hadDraft = !!getDraftRecord(safePath);
        setDraftRecord(safePath, null);

        if (normalizePath(state.targetPath) === safePath) {
            const baseline = getFileBaseline(safePath);
            if (baseline && baseline.exists) {
                applyEditorStateForPath(safePath, baseline.markdown, baseline.metadata, {
                    skipSave: true,
                    silentStatus: true
                });
            } else {
                state.markdown = '';
                if (dom.markdown) dom.markdown.value = '';
                setMetadataState(cloneMetadata(state.metadata), { silent: true });
                updateStats();
                renderPreview();
            }
        }

        renderExplorerPanels();
        scheduleSave();
        setStatus(hadDraft ? `已丢弃本地改动：${safePath}` : `当前文件无本地改动：${safePath}`);
    }

    function openPathFromExplorer(pathValue, sourceLabel) {
        const safePath = normalizePath(pathValue || '');
        if (!safePath) return;

        const currentPath = normalizePath(state.targetPath || '');
        if (currentPath === safePath) {
            renderExplorerPanels();
            return;
        }

        if (currentPath && currentPath !== safePath) {
            syncActiveDraftFromEditor();
        }

        const draft = getDraftRecord(safePath);
        if (draft && draft.status === 'deleted') {
            setStatus(`文件已标记删除，先取消删除再打开：${safePath}`);
            return;
        }

        if (draft) {
            applyEditorStateForPath(safePath, draft.markdown, draft.metadata, {
                skipSave: false,
                silentStatus: true
            });
            setStatus(`已打开暂存文件${sourceLabel ? `（${sourceLabel}）` : ''}：${safePath}`);
            return;
        }

        loadMarkdownFromPath(safePath, sourceLabel || 'Explorer', { skipActiveSync: true });
    }

    function resolveExplorerResourceContext(contextValue) {
        const ctx = contextValue && typeof contextValue === 'object' ? contextValue : {};
        const kind = normalizeExplorerEntryKind(ctx.kind || 'markdown');
        const path = normalizePath(ctx.path || '');
        const resourceId = String(ctx.resourceId || '').trim();

        if (!path || !isExplorerResourceKind(kind)) {
            return null;
        }

        let item = null;
        if (kind === 'image') {
            item = getUploadedImageById(resourceId)
                || (Array.isArray(state.uploadedImages) ? state.uploadedImages.find(function (entry) {
                    return normalizePath(entry && entry.assetPath || '') === path;
                }) : null);
        } else if (kind === 'media') {
            item = getUploadedMediaById(resourceId)
                || (Array.isArray(state.uploadedMedia) ? state.uploadedMedia.find(function (entry) {
                    return normalizePath(entry && entry.assetPath || '') === path;
                }) : null);
        } else if (kind === 'csharp') {
            item = getUploadedCsharpFileById(resourceId)
                || (Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles.find(function (entry) {
                    return normalizePath(entry && entry.assetPath || '') === path;
                }) : null);
        }

        if (!item) {
            item = {
                id: '',
                name: getFilenameFromPath(path) || path,
                assetPath: path,
                dataUrl: '',
                content: ''
            };
        }
        return {
            kind: kind,
            path: path,
            item: item
        };
    }

    function insertExplorerResourceReference(contextValue) {
        const resolved = resolveExplorerResourceContext(contextValue);
        if (!resolved) {
            setStatus('未找到可插入的资源引用');
            return;
        }

        if (resolved.kind === 'image') {
            insertBlockSnippet(imageInsertionText(resolved.item));
            setStatus(`已插入图片引用：${resolved.item.name}`);
            return;
        }

        if (resolved.kind === 'media') {
            insertBlockSnippet(mediaInsertionText(resolved.item));
            setStatus(`已插入视频引用：${resolved.item.name}`);
            return;
        }

        if (resolved.kind === 'csharp') {
            const relPath = buildRelativeResourcePathFromTarget(resolved.item.assetPath || resolved.path || '');
            insertBlockSnippet(`{{cs:${relPath}}}\n`, relPath);
            setStatus(`已插入 C# 引用：${resolved.item.name}`);
        }
    }

    async function ensureLocalCsharpResource(pathValue, displayName) {
        const normalized = normalizePath(pathValue || '');
        if (!normalized || !/\.cs$/i.test(normalized)) return null;

        const existing = (Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : []).find(function (entry) {
            return normalizePath(entry && entry.assetPath || '') === normalized;
        });
        if (existing) return existing;

        const response = await fetch(`/site/content/${encodePathForUrl(normalized)}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const content = String(await response.text() || '').replace(/\r\n/g, '\n');
        const fileName = String(displayName || getFilenameFromPath(normalized) || 'source.cs');
        const localItem = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            name: fileName,
            size: Number(content.length || 0),
            assetPath: normalized,
            content: content,
            symbols: extractCSharpSymbols(content),
            checkState: 'warn',
            checkMessage: '站点源码已加载为本地副本',
            preflightPending: false
        };
        state.uploadedCsharpFiles.push(localItem);
        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        renderExplorerPanels();
        scheduleSave();
        return localItem;
    }

    async function previewExplorerResource(contextValue) {
        const resolved = resolveExplorerResourceContext(contextValue);
        if (!resolved) {
            setStatus('未找到可预览资源');
            return;
        }

        if (resolved.kind === 'csharp') {
            const localId = String(resolved.item.id || '').trim();
            let localItem = localId ? getUploadedCsharpFileById(localId) : null;
            if (!localItem) {
                try {
                    localItem = await ensureLocalCsharpResource(resolved.path, resolved.item.name);
                } catch (err) {
                    const sourceUrl = `/site/content/${encodePathForUrl(resolved.path)}`;
                    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                    setStatus(`加载 C# 本地副本失败，已打开源码：${err && err.message ? err.message : String(err)}`);
                    return;
                }
            }
            if (!localItem) {
                setStatus(`无法打开 C# 编辑：${resolved.item.name}`);
                return;
            }
            openCsharpEditorModal(localItem.id);
            setStatus(`已打开 C# 编辑：${localItem.name}`);
            return;
        }

        const fallbackUrl = `/site/content/${encodePathForUrl(resolved.path)}`;
        const previewUrl = String(resolved.item.dataUrl || fallbackUrl);
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
        setStatus(`已打开资源预览：${resolved.item.name}`);
    }

    function previewExplorerResourceSafely(contextValue) {
        previewExplorerResource(contextValue).catch(function (err) {
            setStatus(`资源预览失败：${err && err.message ? err.message : String(err)}`);
        });
    }

    function removeExplorerResource(contextValue) {
        const resolved = resolveExplorerResourceContext(contextValue);
        if (!resolved) {
            setStatus('未找到可移除资源');
            return;
        }

        const resourceId = String(resolved.item.id || '').trim();
        if (!resourceId) {
            setStatus('该资源来自站点内容索引，无法在本地草稿中直接移除');
            return;
        }

        const name = String(resolved.item.name || getFilenameFromPath(resolved.path) || resolved.path);
        if (!window.confirm(`确认从当前草稿资源中移除：${name} ?`)) {
            return;
        }

        if (resolved.kind === 'image') {
            state.uploadedImages = (Array.isArray(state.uploadedImages) ? state.uploadedImages : []).filter(function (it) {
                return String(it && it.id || '') !== String(resolved.item.id || '');
            });
            renderUploadedImages();
        } else if (resolved.kind === 'media') {
            state.uploadedMedia = (Array.isArray(state.uploadedMedia) ? state.uploadedMedia : []).filter(function (it) {
                return String(it && it.id || '') !== String(resolved.item.id || '');
            });
            renderUploadedMedia();
        } else if (resolved.kind === 'csharp') {
            if (state.csharpEditorTargetId === resolved.item.id) {
                closeCsharpEditorModal();
            }
            removeCompiledAnimState(resolved.item.assetPath || resolved.path || '');
            state.uploadedCsharpFiles = (Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : []).filter(function (it) {
                return String(it && it.id || '') !== String(resolved.item.id || '');
            });
            refreshCsharpSymbolOptions();
            renderUploadedCsharpFiles();
        }

        renderExplorerPanels();
        scheduleSave();
        syncViewerPreview(false);
        setStatus(`已移除资源：${name}`);
    }

    function handleExplorerContextAction(action, contextValue) {
        const context = contextValue && typeof contextValue === 'object'
            ? contextValue
            : { path: contextValue || state.targetPath || '', kind: 'markdown', resourceId: '' };
        const safePath = normalizePath(context.path || state.targetPath || '');
        const kind = normalizeExplorerEntryKind(context.kind || 'markdown');
        const key = String(action || '').trim().toLowerCase();
        if (!key) return;

        if (isExplorerResourceKind(kind)) {
            if (key === 'insert-resource') {
                insertExplorerResourceReference(context);
                return;
            }
            if (key === 'preview-resource') {
                previewExplorerResourceSafely(context);
                return;
            }
            if (key === 'edit-csharp') {
                previewExplorerResourceSafely({ ...context, kind: 'csharp' });
                return;
            }
            if (key === 'remove-resource') {
                removeExplorerResource(context);
            }
            return;
        }

        if (key === 'open-file') {
            openPathFromExplorer(safePath, '文件树');
            return;
        }

        if (key === 'new-file') {
            const baseDir = getDirectoryFromPath(safePath || state.targetPath || '');
            const newPath = buildNewDraftPath(baseDir || '怎么贡献');
            createDraftFile(newPath);
            return;
        }

        if (key === 'toggle-delete') {
            toggleDraftDeletion(safePath);
            return;
        }

        if (key === 'discard-file') {
            discardDraftForPath(safePath);
        }
    }

    function setTargetPath(nextPath, silent) {
        const previousPath = state.targetPath;
        let normalizedTargetPath = '';
        try {
            normalizedTargetPath = ensureSafeMarkdownPath(nextPath);
        } catch (err) {
            updateFileIdentity();
            if (!silent) {
                setStatus(`目标路径无效：${err && err.message ? err.message : String(err)}`);
            }
            return false;
        }
        state.targetPath = normalizedTargetPath;
        updateFileIdentity();
        updateChapterSelectOptions();
        refreshHierarchySelectors(state.targetPath);

        if (previousPath !== state.targetPath) {
            schedulePreviewSync(true);
        }

        if (!silent) {
            setStatus(`目标路径已更新：${state.targetPath}`);
        }

        return true;
    }

    function applyFilename() {
        if (!dom.filename) return;

        const filename = normalizeFilename(dom.filename.value);
        const directory = getDirectoryFromPath(state.targetPath);
        const nextPath = directory ? `${directory}/${filename}` : filename;
        const changed = setTargetPath(nextPath, true);
        if (!changed) return;
        syncActiveDraftFromEditor({ overrideDeleted: true });
        renderExplorerPanels();
        scheduleSave();
        setStatus(`文件名已更新：${filename}`);
    }

    function createDirectoryAndSwitch() {
        try {
            const parent = ensureSafeDirectoryPath(dom.directoryParent ? dom.directoryParent.value : getDirectoryFromPath(state.targetPath));
            const directoryName = ensureSafeDirectoryName(dom.newDirectoryName ? dom.newDirectoryName.value : '');
            const nextDirectory = parent ? `${parent}/${directoryName}` : directoryName;
            const filename = normalizeFilename(dom.filename ? dom.filename.value : getFilenameFromPath(state.targetPath));
            const nextPath = `${nextDirectory}/${filename}`;
            const changed = setTargetPath(nextPath, true);
            if (!changed) return;
            syncActiveDraftFromEditor({ overrideDeleted: true });
            renderExplorerPanels();

            if (dom.directoryParent) {
                dom.directoryParent.value = nextDirectory;
            }
            if (dom.newDirectoryName) {
                dom.newDirectoryName.value = '';
            }
            scheduleSave();
            setStatus(`已创建目录并切换：${nextDirectory}`);
        } catch (err) {
            setStatus(`创建目录失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    function encodePathForUrl(path) {
        return String(path || '')
            .split('/')
            .filter(Boolean)
            .map(function (segment) {
                return encodeURIComponent(segment);
            })
            .join('/');
    }

    function flattenConfigEntries(config) {
        const result = [];
        const seen = new Set();

        if (!config || typeof config !== 'object') {
            return result;
        }

        const categories = config.categories || {};

        Object.keys(categories).forEach(function (categoryKey) {
            const category = categories[categoryKey] || {};
            const categoryTitle = String(category.title || categoryKey);
            const topics = category.topics || {};

            Object.keys(topics).forEach(function (topicKey) {
                const topic = topics[topicKey] || {};
                const topicTitle = String(topic.title || topicKey);
                const files = Array.isArray(topic.files) ? topic.files : [];

                files.forEach(function (file) {
                    if (!file || typeof file !== 'object') return;
                    let path = '';
                    try {
                        path = ensureSafeMarkdownPath(file.path || file.filename || '');
                    } catch (_) {
                        return;
                    }
                    if (!/\.md$/i.test(path)) return;
                    if (seen.has(path)) return;

                    seen.add(path);
                    result.push({
                        path: path,
                        title: String(file.title || file.filename || path),
                        filename: getFilenameFromPath(path),
                        directory: getDirectoryFromPath(path),
                        categoryKey: String(categoryKey || ''),
                        categoryTitle: categoryTitle,
                        topicKey: String(topicKey || ''),
                        topicTitle: topicTitle
                    });
                });
            });
        });

        result.sort(function (a, b) {
            return a.path.localeCompare(b.path, 'zh-CN');
        });

        return result;
    }

    function computeExplorerResourceIndexStamp(entries) {
        return (Array.isArray(entries) ? entries : []).map(function (entry) {
            return normalizePath(entry && entry.path || '');
        }).filter(Boolean).sort(function (a, b) {
            return a.localeCompare(b, 'zh-CN');
        }).join('|');
    }

    async function rebuildExplorerIndexedResources(entries) {
        const list = (Array.isArray(entries) ? entries : []).filter(function (entry) {
            return !!normalizePath(entry && entry.path || '');
        });
        const runId = ++explorerResourceIndexRunId;

        if (list.length <= 0) {
            indexedExplorerResources = [];
            renderExplorerPanels();
            return;
        }

        const resultMap = new Map();
        const queue = list.slice();
        const workerCount = Math.max(1, Math.min(8, queue.length));

        const takeNext = function () {
            if (queue.length <= 0) return null;
            return queue.shift();
        };

        const worker = async function () {
            while (runId === explorerResourceIndexRunId) {
                const next = takeNext();
                if (!next) return;
                const sourcePath = normalizePath(next.path);
                if (!sourcePath) continue;
                try {
                    const response = await fetch(`/site/content/${encodePathForUrl(sourcePath)}`, { cache: 'no-store' });
                    if (!response.ok) continue;
                    const text = await response.text();
                    if (/^\s*<!doctype html/i.test(text)) continue;
                    const refs = collectExplorerAssetRefsFromMarkdown(text, sourcePath);
                    refs.forEach(function (ref) {
                        const kind = normalizeExplorerEntryKind(ref.kind);
                        const path = normalizePath(ref.path);
                        if (!path || !isExplorerResourceKind(kind)) return;
                        const key = `${kind}:${path}`;
                        if (resultMap.has(key)) return;
                        resultMap.set(key, {
                            key: `indexed:${key}`,
                            path: path,
                            title: getFilenameFromPath(path) || path,
                            kind: kind,
                            resourceId: ''
                        });
                    });
                } catch (_) {
                    // Ignore fetch/index failures for single files; keep explorer available.
                }
            }
        };

        const workers = [];
        for (let i = 0; i < workerCount; i += 1) {
            workers.push(worker());
        }
        await Promise.all(workers);

        if (runId !== explorerResourceIndexRunId) {
            return;
        }

        indexedExplorerResources = Array.from(resultMap.values()).sort(function (a, b) {
            const pathCompare = String(a.path || '').localeCompare(String(b.path || ''), 'zh-CN');
            if (pathCompare !== 0) return pathCompare;
            return String(a.kind || '').localeCompare(String(b.kind || ''), 'zh-CN');
        });
        renderExplorerPanels();
    }

    async function loadExistingList() {
        if (!dom.existingSelect) return;

        try {
            const response = await fetch('/site/content/config.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const config = await response.json();
            const entries = flattenConfigEntries(config);
            knownMarkdownEntries = entries;
            const stamp = computeExplorerResourceIndexStamp(entries);
            if (stamp !== explorerResourceIndexStamp) {
                explorerResourceIndexStamp = stamp;
                indexedExplorerResources = [];
            }
            refreshHierarchySelectors(state.targetPath);

            updateChapterSelectOptions();
            renderExplorerPanels();

            if (stamp && (indexedExplorerResources.length <= 0 || stamp === explorerResourceIndexStamp)) {
                rebuildExplorerIndexedResources(entries).catch(function () {
                    // Keep UI responsive if index background scan fails unexpectedly.
                });
            }
        } catch (err) {
            setStatus(`读取文章列表失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    async function loadMarkdownFromPath(path, sourceLabel, options) {
        const opts = options && typeof options === 'object' ? options : {};
        let targetPath = '';
        try {
            targetPath = ensureSafeMarkdownPath(path);
        } catch (err) {
            setStatus(`载入失败：${err && err.message ? err.message : String(err)}`);
            return;
        }

        const activePath = normalizePath(state.targetPath || '');
        if (!opts.skipActiveSync && activePath && activePath !== normalizePath(targetPath)) {
            syncActiveDraftFromEditor();
        }

        const localDraft = getDraftRecord(targetPath);
        if (localDraft && localDraft.status === 'deleted' && !opts.forceRemote) {
            setStatus(`该文件已标记删除：${targetPath}`);
            return;
        }

        if (localDraft && !opts.forceRemote) {
            applyEditorStateForPath(targetPath, localDraft.markdown, localDraft.metadata, {
                skipSave: false,
                silentStatus: true
            });
            if (dom.existingSelect) {
                dom.existingSelect.value = targetPath;
            }
            setStatus(`已打开本地暂存${sourceLabel ? `（${sourceLabel}）` : ''}：${targetPath}`);
            return;
        }

        try {
            setStatus(`正在载入：${targetPath}`);
            const response = await fetch(`/site/content/${encodePathForUrl(targetPath)}`, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();

            if (/^\s*<!doctype html/i.test(text)) {
                throw new Error('返回的是 HTML 页面，可能该 Markdown 路径不存在');
            }

            const markdown = String(text || '').replace(/\r\n/g, '\n');
            const parsedFront = parseFrontMatterFromMarkdown(markdown);
            const metadata = pickMetadataFromParsedFrontMatter(parsedFront);

            setFileBaseline(targetPath, {
                exists: true,
                markdown: markdown,
                metadata: metadata
            });

            applyEditorStateForPath(targetPath, markdown, metadata, {
                skipSave: false,
                silentStatus: true
            });

            if (dom.existingSelect) {
                dom.existingSelect.value = targetPath;
            }

            setStatus(`已载入${sourceLabel ? `（${sourceLabel}）` : ''}：${targetPath}`);
        } catch (err) {
            setStatus(`载入失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    function parseImportedDraftPayload(rawText) {
        let parsed = null;
        try {
            parsed = JSON.parse(String(rawText || ''));
        } catch (_) {
            throw new Error('草稿 JSON 格式错误，无法解析');
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('草稿 JSON 结构无效');
        }

        return parsed;
    }

    function applyImportedDraft(parsed, mergeMode) {
        const mode = String(mergeMode || 'replace');
        const current = {
            markdown: String(state.markdown || ''),
            uploadedImages: Array.isArray(state.uploadedImages) ? state.uploadedImages : [],
            uploadedMedia: Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [],
            uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [],
            metadata: applyMetadataDefaults(state.metadata)
        };

        const importedMarkdown = String(parsed.markdown || '');
        const importedImages = Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages : [];
        const importedMedia = Array.isArray(parsed.uploadedMedia) ? parsed.uploadedMedia : [];
        const importedCsharp = Array.isArray(parsed.uploadedCsharpFiles) ? parsed.uploadedCsharpFiles : [];
        const importedMetadata = applyMetadataDefaults(parsed.metadata || {});

        if (mode === 'merge') {
            state.markdown = [current.markdown.trim(), importedMarkdown.trim()].filter(Boolean).join('\n\n');
            state.uploadedImages = current.uploadedImages.concat(importedImages);
            state.uploadedMedia = current.uploadedMedia.concat(importedMedia);
            state.uploadedCsharpFiles = current.uploadedCsharpFiles.concat(importedCsharp);
            state.metadata = applyMetadataDefaults({
                ...current.metadata,
                ...importedMetadata,
                colors: {
                    ...ensureObject(current.metadata.colors),
                    ...ensureObject(importedMetadata.colors)
                },
                colorChange: {
                    ...ensureObject(current.metadata.colorChange),
                    ...ensureObject(importedMetadata.colorChange)
                }
            });
        } else {
            state.markdown = importedMarkdown;
            state.uploadedImages = importedImages;
            state.uploadedMedia = importedMedia;
            state.uploadedCsharpFiles = importedCsharp;
            state.metadata = importedMetadata;
            try {
                state.targetPath = ensureSafeMarkdownPath(parsed.targetPath || state.targetPath);
            } catch (_) {
                state.targetPath = '怎么贡献/新文章.md';
            }
            state.workerApiUrl = normalizeWorkerApiUrl(parsed.workerApiUrl || state.workerApiUrl);
            state.prTitle = String(parsed.prTitle || state.prTitle || '');
            state.explorerFilter = String(parsed.explorerFilter || '');
            const importedFolders = {};
            Object.keys(ensureObject(parsed.explorerFolders)).forEach(function (folderPath) {
                const normalized = normalizePath(folderPath);
                if (!normalized) return;
                importedFolders[normalized] = !!ensureObject(parsed.explorerFolders)[folderPath];
            });
            state.explorerFolders = importedFolders;
            state.rightPanelTab = normalizeRightPanelTab(parsed.rightPanelTab || state.rightPanelTab);
            state.layout = {
                leftWidth: Number(ensureObject(parsed.layout).leftWidth || state.layout.leftWidth || 300),
                rightWidth: Number(ensureObject(parsed.layout).rightWidth || state.layout.rightWidth || 368)
            };
            state.openTabs = Array.isArray(parsed.openTabs) ? parsed.openTabs.map(function (item) {
                return normalizePath(item || '');
            }).filter(Boolean) : [];
            state.draftFiles = ensureObject(parsed.draftFiles);
            state.fileBaselines = ensureObject(parsed.fileBaselines);
            state.isDirectPreview = !!parsed.isDirectPreview;
        }

        if (dom.markdown) {
            dom.markdown.value = state.markdown;
        }
        if (dom.prWorkerUrl) {
            dom.prWorkerUrl.value = state.workerApiUrl;
        }
        if (dom.prTitle) {
            dom.prTitle.value = state.prTitle;
        }

        updateFileIdentity();
        renderUploadedImages();
        renderUploadedMedia();
        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        renderMetadataFormFromState();
        renderColorListsFromState();
        updateChapterSelectOptions();
        updateStats();
        renderPreview();
        setDirectPreviewMode(!!state.isDirectPreview, true);
        setRightPanelTab(state.rightPanelTab, { skipSave: true });
        applyWorkspaceLayout();
        renderExplorerPanels();
        scheduleSave();
    }

    async function importDraftJson(file) {
        if (!file) {
            throw new Error('请选择要导入的 JSON 文件');
        }

        const text = await file.text();
        const parsed = parseImportedDraftPayload(text);
        const summary = `目标: ${parsed.targetPath || '(未指定)'}\n长度: ${String(parsed.markdown || '').length} 字\n图片: ${Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages.length : 0}\n视频: ${Array.isArray(parsed.uploadedMedia) ? parsed.uploadedMedia.length : 0}\nC#: ${Array.isArray(parsed.uploadedCsharpFiles) ? parsed.uploadedCsharpFiles.length : 0}`;

        const merge = window.confirm(`导入草稿摘要：\n${summary}\n\n点击“确定”执行覆盖导入，点击“取消”进入合并/取消选择。`);
        if (merge) {
            applyImportedDraft(parsed, 'replace');
            setStatus('草稿 JSON 导入完成（覆盖模式）');
            return;
        }

        const shouldMerge = window.confirm('是否使用合并导入？\n确定=合并，取消=放弃导入。');
        if (!shouldMerge) {
            setStatus('已取消导入草稿 JSON');
            return;
        }

        applyImportedDraft(parsed, 'merge');
        setStatus('草稿 JSON 导入完成（合并模式）');
    }

    function buildPrSubmitContext() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        const sharedKey = String(dom.prSharedKey ? dom.prSharedKey.value : '').trim();
        const titleInput = String(dom.prTitle ? dom.prTitle.value : '').trim();
        const linkedPrNumber = String(state.linkedPrNumber || '').trim();
        const authToken = String(state.authToken || '').trim();
        const targetPath = normalizePath(state.targetPath || '怎么贡献/新文章.md') || '怎么贡献/新文章.md';
        const markdown = String(state.markdown || '');
        const stagedMarkdownFiles = buildStagedMarkdownExtraFiles(targetPath, markdown);
        const extraFiles = stagedMarkdownFiles.concat(buildImageExtraFiles(), buildMediaExtraFiles(), buildCSharpExtraFiles());
        const manifest = buildPrFileManifest(targetPath, markdown, extraFiles);

        return {
            apiUrl: apiUrl,
            sharedKey: sharedKey,
            titleInput: titleInput,
            linkedPrNumber: linkedPrNumber,
            authToken: authToken,
            payload: {
                targetPath: targetPath,
                markdown: markdown,
                prTitle: titleInput || defaultPrTitle()
            },
            extraFiles: extraFiles,
            manifest: manifest
        };
    }

    function buildPrSubmitHeaders(sharedKey, authToken) {
        const headers = {
            'content-type': 'application/json'
        };

        if (authToken) {
            headers.authorization = `Bearer ${authToken}`;
        } else {
            headers['x-studio-key'] = sharedKey;
        }

        return headers;
    }

    function buildPrSubmitPayload(context) {
        const payload = {
            targetPath: String(context && context.payload && context.payload.targetPath || ''),
            markdown: String(context && context.payload && context.payload.markdown || ''),
            prTitle: String(context && context.payload && context.payload.prTitle || '')
        };

        const files = Array.isArray(context && context.extraFiles) ? context.extraFiles : [];
        if (files.length > 0) {
            payload.extraFiles = files;
        }

        const linkedPrNumber = String(context && context.linkedPrNumber || '').trim();
        if (linkedPrNumber) {
            payload.existingPrNumber = linkedPrNumber;
        }

        return payload;
    }

    function persistSubmitDraftSettings(context) {
        state.workerApiUrl = String(context && context.apiUrl || '');
        state.prTitle = String(context && context.titleInput || '');
        if (dom.prWorkerUrl) dom.prWorkerUrl.value = state.workerApiUrl;
        scheduleSave();
    }

    async function executePrSubmitRequest(context) {
        const linkedPrNumber = String(context && context.linkedPrNumber || '').trim();
        const payload = buildPrSubmitPayload(context);
        const headers = buildPrSubmitHeaders(context && context.sharedKey, context && context.authToken);

        setPrSubmitBusy(true);
        setStatus(linkedPrNumber
            ? `正在提交到 Worker 并追加到 PR #${linkedPrNumber}...`
            : '正在提交到 Worker 并创建 PR，请稍候...');

        try {
            const response = await fetch(String(context && context.apiUrl || ''), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let responseData = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (_) {
                responseData = null;
            }

            if (response.status === 401 && context && context.authToken) {
                clearAuthSession();
                updateAuthUi();
                throw new Error('GitHub 登录已过期，请重新登录');
            }

            if (!response.ok || !responseData || responseData.ok !== true) {
                const errMessage = responseData && responseData.error
                    ? String(responseData.error)
                    : `HTTP ${response.status}`;
                throw new Error(errMessage);
            }

            if (responseData.submitter) {
                state.githubUser = String(responseData.submitter || '').trim();
                persistAuthSession();
                updateAuthUi();
            }

            const prUrl = String(responseData.prUrl || '').trim();
            updatePrLink(prUrl);
            if (responseData.prNumber) {
                applyLinkedPrSelection(String(responseData.prNumber || ''));
            }
            persistState();

            if (responseData.reusedExistingPr === true) {
                setStatus(`已成功追加到 PR #${responseData.prNumber}`);
            } else {
                setStatus(`PR 创建成功${responseData.prNumber ? ` #${responseData.prNumber}` : ''}`);
            }

            if (prUrl) {
                window.open(prUrl, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            setStatus(`提交 PR 失败：${err && err.message ? err.message : String(err)}`);
        } finally {
            setPrSubmitBusy(false);
        }
    }

    async function handlePrAssetDecisionBeforeSubmit(context) {
        const decision = await openPrAssetDecisionModal(context);
        const action = String(decision && decision.action || 'cancel');
        if (action === 'cancel') {
            setStatus('已取消提交，本地改动已保留');
            return false;
        }

        if (action === 'new-pr') {
            context.linkedPrNumber = '';
            applyLinkedPrSelection('');
            setStatus('将创建新 PR，并提交文章/贴图/C# 全部改动');
            return true;
        }

        if (action === 'continue') {
            const selectedPr = String(decision && decision.prNumber || '').trim();
            if (!selectedPr) {
                setStatus('未选择可继续的 PR，已取消提交');
                return false;
            }
            context.linkedPrNumber = selectedPr;
            applyLinkedPrSelection(selectedPr);
            setStatus(`将继续提交到 PR #${selectedPr}（包含文章/贴图/C#）`);
            return true;
        }

        setStatus('未识别的提交策略，已取消本次提交');
        return false;
    }

    async function submitPullRequest() {
        const context = buildPrSubmitContext();

        if (!context.apiUrl) {
            setStatus('请先填写 Worker API 地址');
            if (dom.prWorkerUrl) dom.prWorkerUrl.focus();
            return;
        }

        if (!context.authToken && !context.sharedKey) {
            setStatus('请先点击“GitHub 登录”，或填写兼容密钥');
            if (dom.authLogin) dom.authLogin.focus();
            return;
        }

        const hardPreflight = await runPreflightCheck({
            mode: 'hard',
            apiUrl: context.apiUrl,
            sharedKey: context.sharedKey,
            authToken: context.authToken,
            throwOnError: false
        });
        if (!hardPreflight.ok) {
            setStatus(`提交前复检失败，已阻止提交：${hardPreflight.error || '请稍后重试'}`);
            renderUploadedCsharpFiles();
            return;
        }

        if (context.manifest.total <= 0) {
            setStatus('当前没有可提交的文章/贴图/C# 改动');
            return;
        }

        persistSubmitDraftSettings(context);
        renderPrSubmitManifest(context);

        if (!context.linkedPrNumber && context.extraFiles.length > 0) {
            const proceed = await handlePrAssetDecisionBeforeSubmit(context);
            if (!proceed) return;
        }

        await executePrSubmitRequest(context);
    }

    function setFullscreenMode(enabled, silent) {
        state.isFullscreen = !!enabled;
        document.body.classList.toggle('article-studio-page--fullscreen', state.isFullscreen);

        if (!state.isFullscreen && state.flowchartDrawer.open) {
            setFlowchartModalOpen(false);
        }

        if (dom.toggleFullscreen) {
            dom.toggleFullscreen.textContent = state.isFullscreen ? '退出专注模式 (Esc)' : '专注模式';
        }

        if (dom.titlebar) {
            dom.titlebar.textContent = state.isFullscreen
                ? 'article-studio · focus mode'
                : 'article-studio · vscode inspired mode';
        }

        if (state.isFullscreen && dom.markdown) {
            dom.markdown.focus();
        }

        if (!silent) {
            setStatus(state.isFullscreen ? '已进入专注模式（按 Esc 退出）' : '已退出专注模式');
        }
    }

    function setDirectPreviewMode(enabled, silent) {
        state.isDirectPreview = !!enabled;
        document.body.classList.toggle('article-studio-page--direct-preview', state.isDirectPreview);

        if (dom.toggleDirectPreview) {
            dom.toggleDirectPreview.textContent = state.isDirectPreview ? '退出直接预览 (Esc)' : '直接预览';
        }

        if (state.isDirectPreview) {
            schedulePreviewSync(true);
        }

        if (!silent) {
            setStatus(state.isDirectPreview ? '已进入直接预览模式（Esc 退出）' : '已退出直接预览模式');
        }
    }

    function updateStats() {
        if (!dom.stats) return;
        const text = String(state.markdown || '');
        const lines = text ? text.split(/\r?\n/).length : 0;
        const chars = text.length;
        dom.stats.textContent = `${lines} 行 · ${chars} 字`;
        renderPrSubmitManifest();
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;

            state.markdown = String(parsed.markdown || '');
            try {
                state.targetPath = ensureSafeMarkdownPath(parsed.targetPath || state.targetPath);
            } catch (_) {
                state.targetPath = '怎么贡献/新文章.md';
            }
            state.workerApiUrl = normalizeWorkerApiUrl(parsed.workerApiUrl || state.workerApiUrl);
            state.prTitle = String(parsed.prTitle || '');
            state.lastPrUrl = String(parsed.lastPrUrl || '');
            state.linkedPrNumber = String(parsed.linkedPrNumber || '').trim();
            state.myOpenPrs = Array.isArray(parsed.myOpenPrs) ? parsed.myOpenPrs : [];
            state.uploadedImages = Array.isArray(parsed.uploadedImages)
                ? parsed.uploadedImages.map(function (item) {
                    return {
                        id: String(item && item.id || ''),
                        name: String(item && item.name || ''),
                        type: String(item && item.type || 'image/png'),
                        size: Number(item && item.size || 0),
                        assetPath: normalizePath(item && item.assetPath || ''),
                        dataUrl: String(item && item.dataUrl || ''),
                        base64: String(item && item.base64 || ''),
                        insertedAt: String(item && item.insertedAt || '')
                    };
                }).filter(function (item) {
                    return item.id && item.assetPath && item.base64 && item.dataUrl;
                })
                : [];
            state.uploadedMedia = Array.isArray(parsed.uploadedMedia)
                ? parsed.uploadedMedia.map(function (item) {
                    return {
                        id: String(item && item.id || ''),
                        name: String(item && item.name || ''),
                        type: String(item && item.type || 'video/mp4'),
                        size: Number(item && item.size || 0),
                        assetPath: normalizePath(item && item.assetPath || ''),
                        dataUrl: String(item && item.dataUrl || ''),
                        base64: String(item && item.base64 || ''),
                        insertedAt: String(item && item.insertedAt || '')
                    };
                }).filter(function (item) {
                    return item.id && item.assetPath && item.base64 && item.dataUrl;
                })
                : [];
            state.uploadedCsharpFiles = Array.isArray(parsed.uploadedCsharpFiles)
                ? parsed.uploadedCsharpFiles.map(function (item) {
                    const normalizedAssetPath = normalizePath(item && item.assetPath || '');
                    const content = String(item && item.content || '');
                    return {
                        id: String(item && item.id || hashText(`${normalizedAssetPath}-${Date.now()}`)),
                        name: String(item && item.name || 'source.cs'),
                        size: Number(item && item.size || content.length),
                        assetPath: normalizedAssetPath,
                        content: content,
                        symbols: Array.isArray(item && item.symbols) ? item.symbols : extractCSharpSymbols(content),
                        checkState: String(item && item.checkState || 'ok'),
                        checkMessage: String(item && item.checkMessage || '已通过检查'),
                        preflightPending: !!(item && item.preflightPending)
                    };
                }).filter(function (item) {
                    return item.id && item.assetPath && item.content;
                })
                : [];

            state.metadata = applyMetadataDefaults(parsed.metadata || state.metadata);
            if (typeof parsed.previewImageNoticeEnabled === 'boolean') {
                state.previewImageNoticeEnabled = parsed.previewImageNoticeEnabled;
            }
            if (typeof parsed.isDirectPreview === 'boolean') {
                state.isDirectPreview = parsed.isDirectPreview;
            }
            state.animBridgeEndpoint = normalizeAnimBridgeEndpoint(parsed.animBridgeEndpoint || readStoredAnimBridgeEndpoint() || ANIMCS_DEFAULT_BRIDGE_ENDPOINT) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT;
            state.animBridgeConnected = false;
            state.compiledAnims = {};
            state.animCompileErrors = {};
            state.animCompileStatus = '未激活';
            state.explorerFilter = String(parsed.explorerFilter || '');
            const restoredFolders = {};
            Object.keys(ensureObject(parsed.explorerFolders)).forEach(function (folderPath) {
                const normalized = normalizePath(folderPath);
                if (!normalized) return;
                restoredFolders[normalized] = !!ensureObject(parsed.explorerFolders)[folderPath];
            });
            state.explorerFolders = restoredFolders;
            state.rightPanelTab = normalizeRightPanelTab(parsed.rightPanelTab || state.rightPanelTab);
            state.layout = {
                leftWidth: Number(ensureObject(parsed.layout).leftWidth || state.layout.leftWidth || 300),
                rightWidth: Number(ensureObject(parsed.layout).rightWidth || state.layout.rightWidth || 368)
            };
            state.openTabs = Array.isArray(parsed.openTabs)
                ? parsed.openTabs.map(function (item) {
                    return normalizePath(item || '');
                }).filter(Boolean)
                : [];

            const restoredDraftMap = {};
            Object.keys(ensureObject(parsed.draftFiles)).forEach(function (pathKey) {
                const path = normalizePath(pathKey);
                if (!path) return;
                const rawEntry = ensureObject(parsed.draftFiles)[pathKey];
                restoredDraftMap[path] = {
                    path: path,
                    status: normalizeDraftStatus(rawEntry.status),
                    markdown: String(rawEntry.markdown || ''),
                    metadata: cloneMetadata(rawEntry.metadata || {}),
                    updatedAt: String(rawEntry.updatedAt || '')
                };
            });
            state.draftFiles = restoredDraftMap;

            const restoredBaselines = {};
            Object.keys(ensureObject(parsed.fileBaselines)).forEach(function (pathKey) {
                const path = normalizePath(pathKey);
                if (!path) return;
                const rawBaseline = ensureObject(parsed.fileBaselines)[pathKey];
                restoredBaselines[path] = {
                    path: path,
                    exists: !!rawBaseline.exists,
                    markdown: String(rawBaseline.markdown || ''),
                    metadata: cloneMetadata(rawBaseline.metadata || {}),
                    updatedAt: String(rawBaseline.updatedAt || '')
                };
            });
            state.fileBaselines = restoredBaselines;
        } catch (err) {
            setStatus(`读取本地草稿失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    function persistState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: 9,
                updatedAt: new Date().toISOString(),
                targetPath: state.targetPath,
                markdown: state.markdown,
                workerApiUrl: state.workerApiUrl,
                prTitle: state.prTitle,
                lastPrUrl: state.lastPrUrl,
                linkedPrNumber: String(state.linkedPrNumber || ''),
                myOpenPrs: Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [],
                uploadedImages: Array.isArray(state.uploadedImages) ? state.uploadedImages : [],
                uploadedMedia: Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [],
                uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [],
                metadata: applyMetadataDefaults(state.metadata),
                previewImageNoticeEnabled: !!state.previewImageNoticeEnabled,
                isDirectPreview: !!state.isDirectPreview,
                animBridgeEndpoint: normalizeAnimBridgeEndpoint(state.animBridgeEndpoint) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT,
                explorerFilter: String(state.explorerFilter || ''),
                explorerFolders: ensureObject(state.explorerFolders),
                rightPanelTab: normalizeRightPanelTab(state.rightPanelTab),
                layout: {
                    leftWidth: Number(state.layout && state.layout.leftWidth || 300),
                    rightWidth: Number(state.layout && state.layout.rightWidth || 368)
                },
                openTabs: Array.isArray(state.openTabs) ? state.openTabs : [],
                draftFiles: ensureObject(state.draftFiles),
                fileBaselines: ensureObject(state.fileBaselines)
            }));
            setStatus('Markdown 草稿已自动保存');
        } catch (err) {
            const message = err && err.message ? err.message : String(err);
            const isQuota = err && (err.name === 'QuotaExceededError' || /quota|配额|storage/i.test(message));
            if (isQuota) {
                setStatus('自动保存失败：草稿已超出浏览器存储上限，请先导出 JSON 或清理附件');
                return;
            }
            setStatus(`保存失败：${message}`);
        }
    }

    function scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            saveTimer = 0;
            persistState();
        }, STORAGE_DEBOUNCE_MS);
    }

    function buildViewerPreviewUrl(path, embedMode) {
        const target = ensureSafeMarkdownPath(path || state.targetPath);
        const embedQuery = embedMode ? '&studio_embed=1' : '';
        return `/site/pages/viewer.html?studio_preview=1${embedQuery}&file=${encodeURIComponent(target)}`;
    }
    function collectPastedImageFiles(clipboardData) {
        if (!clipboardData) return [];

        const files = [];
        const items = Array.from(clipboardData.items || []);
        items.forEach(function (item) {
            if (!item || item.kind !== 'file') return;
            if (!String(item.type || '').startsWith('image/')) return;
            const file = item.getAsFile();
            if (!file) return;
            files.push(file);
        });

        if (files.length > 0) {
            return files;
        }

        return Array.from(clipboardData.files || []).filter(function (file) {
            return file && String(file.type || '').startsWith('image/');
        });
    }

    function collectPastedMediaFiles(clipboardData) {
        if (!clipboardData) return [];

        const files = [];
        const items = Array.from(clipboardData.items || []);
        items.forEach(function (item) {
            if (!item || item.kind !== 'file') return;
            const file = item.getAsFile();
            if (!isSupportedVideoFile(file)) return;
            files.push(file);
        });

        if (files.length > 0) {
            return files;
        }

        return Array.from(clipboardData.files || []).filter(function (file) {
            return isSupportedVideoFile(file);
        });
    }

    function escapeMarkdownInline(text) {
        return String(text || '')
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\|/g, '\\|');
    }

    function normalizeInlineWhitespace(text) {
        return String(text || '').replace(/\s+/g, ' ').trim();
    }

    function markdownInlineFromNodes(nodes) {
        return Array.from(nodes || []).map(function (node) {
            if (!node) return '';
            if (node.nodeType === Node.TEXT_NODE) {
                return escapeMarkdownInline(normalizeInlineWhitespace(node.nodeValue || ''));
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const tag = String(node.tagName || '').toLowerCase();
            if (tag === 'br') return '\n';
            if (tag === 'img' || tag === 'video') return '';

            if (tag === 'code' && String(node.parentElement && node.parentElement.tagName || '').toLowerCase() !== 'pre') {
                const raw = normalizeInlineWhitespace(node.textContent || '');
                if (!raw) return '';
                return `\`${raw}\``;
            }
            if (tag === 'strong' || tag === 'b') {
                const innerStrong = markdownInlineFromNodes(node.childNodes);
                return innerStrong ? `**${innerStrong}**` : '';
            }
            if (tag === 'em' || tag === 'i') {
                const innerEm = markdownInlineFromNodes(node.childNodes);
                return innerEm ? `*${innerEm}*` : '';
            }
            if (tag === 'a') {
                const href = String(node.getAttribute('href') || '').trim();
                const text = normalizeInlineWhitespace(markdownInlineFromNodes(node.childNodes) || node.textContent || href);
                if (!href) return text;
                return `[${text || href}](${href})`;
            }

            return markdownInlineFromNodes(node.childNodes);
        }).filter(Boolean).join('').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
    }

    function normalizePastedHtmlToMarkdown(rawHtml) {
        const html = String(rawHtml || '').trim();
        if (!html) return '';

        let doc = null;
        try {
            doc = new DOMParser().parseFromString(html, 'text/html');
        } catch (_) {
            doc = null;
        }
        if (!doc || !doc.body) return '';

        const blockFromNode = function (node) {
            if (!node) return '';
            if (node.nodeType === Node.TEXT_NODE) {
                return escapeMarkdownInline(normalizeInlineWhitespace(node.nodeValue || ''));
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const tag = String(node.tagName || '').toLowerCase();
            if (tag === 'img' || tag === 'video') return '';
            if (tag === 'br') return '\n';
            if (tag === 'hr') return '---\n\n';
            if (/^h[1-6]$/.test(tag)) {
                const level = Number.parseInt(tag.slice(1), 10) || 1;
                const headingText = normalizeInlineWhitespace(markdownInlineFromNodes(node.childNodes));
                return headingText ? `${'#'.repeat(level)} ${headingText}\n\n` : '';
            }
            if (tag === 'pre') {
                const codeEl = node.querySelector('code');
                const codeText = String(codeEl ? codeEl.textContent : node.textContent || '').replace(/\r\n/g, '\n').trimEnd();
                if (!codeText) return '';
                let language = '';
                if (codeEl && codeEl.className) {
                    const match = String(codeEl.className).match(/language-([a-z0-9_+-]+)/i);
                    if (match && match[1]) {
                        language = String(match[1]).toLowerCase();
                    }
                }
                return `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
            }
            if (tag === 'blockquote') {
                const content = normalizeInlineWhitespace(markdownInlineFromNodes(node.childNodes));
                if (!content) return '';
                return content.split('\n').map(function (line) {
                    return line ? `> ${line}` : '>';
                }).join('\n') + '\n\n';
            }
            if (tag === 'ul' || tag === 'ol') {
                const ordered = tag === 'ol';
                const listItems = Array.from(node.children || []).filter(function (child) {
                    return String(child.tagName || '').toLowerCase() === 'li';
                });
                if (listItems.length === 0) return '';
                return listItems.map(function (item, index) {
                    const prefix = ordered ? `${index + 1}. ` : '- ';
                    const text = normalizeInlineWhitespace(markdownInlineFromNodes(item.childNodes));
                    return `${prefix}${text || '内容'}`;
                }).join('\n') + '\n\n';
            }
            if (tag === 'table') {
                const rows = Array.from(node.querySelectorAll('tr')).map(function (tr) {
                    return Array.from(tr.querySelectorAll('th,td')).map(function (cell) {
                        return escapeMarkdownInline(normalizeInlineWhitespace(cell.textContent || ''));
                    });
                }).filter(function (row) {
                    return row.length > 0;
                });
                if (rows.length === 0) return '';
                const width = Math.max.apply(null, rows.map(function (row) { return row.length; }));
                const normalizedRows = rows.map(function (row) {
                    const next = row.slice();
                    while (next.length < width) next.push('');
                    return next;
                });
                const header = normalizedRows[0];
                const divider = new Array(width).fill('---');
                const bodyRows = normalizedRows.slice(1);
                const lines = [];
                lines.push(`| ${header.join(' | ')} |`);
                lines.push(`| ${divider.join(' | ')} |`);
                bodyRows.forEach(function (row) {
                    lines.push(`| ${row.join(' | ')} |`);
                });
                return `${lines.join('\n')}\n\n`;
            }
            if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article' || tag === 'li') {
                const paragraph = normalizeInlineWhitespace(markdownInlineFromNodes(node.childNodes));
                return paragraph ? `${paragraph}\n\n` : '';
            }

            const childBlocks = Array.from(node.childNodes || []).map(blockFromNode).join('');
            if (childBlocks.trim()) return childBlocks;
            const inline = normalizeInlineWhitespace(markdownInlineFromNodes(node.childNodes));
            return inline ? `${inline}\n\n` : '';
        };

        const markdown = Array.from(doc.body.childNodes || []).map(blockFromNode).join('');
        return String(markdown || '')
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function insertTextAtSelection(insertedText) {
        if (!dom.markdown) return;
        const value = String(dom.markdown.value || '');
        const start = Number(dom.markdown.selectionStart || 0);
        const end = Number(dom.markdown.selectionEnd || 0);
        const text = String(insertedText || '');
        const next = value.slice(0, start) + text + value.slice(end);
        const caret = start + text.length;
        updateEditorContent(next, caret, caret);
    }

    function buildCompiledAnimsPayload() {
        const payload = {};
        Object.keys(ensureObject(state.compiledAnims)).forEach(function (rawPath) {
            const normalized = normalizeAnimSourcePath(rawPath);
            if (!isAnimSourcePath(normalized)) return;

            const entry = ensureObject(state.compiledAnims[rawPath]);
            const moduleJs = String(entry.moduleJs || '');
            if (!moduleJs) return;

            payload[normalized] = {
                moduleJs: moduleJs,
                profile: entry.profile && typeof entry.profile === 'object' ? entry.profile : null,
                updatedAt: String(entry.updatedAt || new Date().toISOString())
            };
        });
        return payload;
    }

    function buildAnimCompileErrorsPayload() {
        const payload = {};
        Object.keys(ensureObject(state.animCompileErrors)).forEach(function (rawPath) {
            const normalized = normalizeAnimSourcePath(rawPath);
            if (!isAnimSourcePath(normalized)) return;

            const entry = ensureObject(state.animCompileErrors[rawPath]);
            const diagnostics = normalizeAnimCompileDiagnostics(entry.diagnostics);
            if (diagnostics.length <= 0) return;

            payload[normalized] = {
                diagnostics: diagnostics,
                updatedAt: String(entry.updatedAt || new Date().toISOString())
            };
        });
        return payload;
    }

    function buildViewerPreviewPayload() {
        let safeTargetPath = '怎么贡献/新文章.md';
        try {
            safeTargetPath = ensureSafeMarkdownPath(state.targetPath);
        } catch (_) {
            safeTargetPath = '怎么贡献/新文章.md';
        }
        return {
            targetPath: safeTargetPath,
            markdown: String(state.markdown || ''),
            metadata: applyMetadataDefaults(state.metadata),
            uploadedImages: Array.isArray(state.uploadedImages)
                ? state.uploadedImages.map(function (item) {
                    return {
                        assetPath: normalizePath(item && item.assetPath || ''),
                        dataUrl: String(item && item.dataUrl || ''),
                        name: String(item && item.name || '')
                    };
                }).filter(function (item) {
                    return item.assetPath && item.dataUrl;
                })
                : [],
            uploadedMedia: Array.isArray(state.uploadedMedia)
                ? state.uploadedMedia.map(function (item) {
                    return {
                        assetPath: normalizePath(item && item.assetPath || ''),
                        dataUrl: String(item && item.dataUrl || ''),
                        name: String(item && item.name || '')
                    };
                }).filter(function (item) {
                    return item.assetPath && item.dataUrl;
                })
                : [],
            uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles)
                ? state.uploadedCsharpFiles.map(function (item) {
                    return {
                        assetPath: normalizePath(item && item.assetPath || ''),
                        content: String(item && item.content || ''),
                        name: String(item && item.name || '')
                    };
                }).filter(function (item) {
                    return item.assetPath && item.content;
                })
                : [],
            compiledAnims: buildCompiledAnimsPayload(),
            animCompileErrors: buildAnimCompileErrorsPayload(),
            animBridge: {
                endpoint: normalizeAnimBridgeEndpoint(state.animBridgeEndpoint) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT,
                connected: !!state.animBridgeConnected
            },
            updatedAt: new Date().toISOString()
        };
    }

    function persistViewerPreviewPayload(payload) {
        try {
            localStorage.setItem(VIEWER_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
        } catch (_) {
            // ignore preview storage failures
        }
    }

    function postViewerPreviewMessage(payload) {
        if (!dom.previewFrame || !dom.previewFrame.contentWindow) return;

        try {
            dom.previewFrame.contentWindow.postMessage({
                type: 'article-studio-preview-update',
                payload: payload
            }, window.location.origin);
        } catch (_) {
            // ignore postMessage errors
        }
    }

    function syncViewerPreview(forceReload) {
        const payload = buildViewerPreviewPayload();
        persistViewerPreviewPayload(payload);

        if (!dom.previewFrame) return;

        const desiredUrl = buildViewerPreviewUrl(payload.targetPath, true);
        let shouldReload = !!forceReload;
        const currentSrc = String(dom.previewFrame.getAttribute('src') || '').trim();

        if (!currentSrc) {
            shouldReload = true;
        } else {
            try {
                const currentUrl = new URL(dom.previewFrame.src, window.location.href);
                const desired = new URL(desiredUrl, window.location.href);
                if (
                    currentUrl.searchParams.get('file') !== desired.searchParams.get('file')
                    || currentUrl.searchParams.get('studio_embed') !== desired.searchParams.get('studio_embed')
                ) {
                    shouldReload = true;
                }
            } catch (_) {
                shouldReload = true;
            }
        }

        if (shouldReload) {
            dom.previewFrame.src = desiredUrl;
        }

        postViewerPreviewMessage(payload);
    }

    function schedulePreviewSync(forceReload) {
        if (previewSyncTimer) clearTimeout(previewSyncTimer);
        previewSyncTimer = setTimeout(function () {
            previewSyncTimer = 0;
            syncViewerPreview(forceReload);
        }, PREVIEW_SYNC_DEBOUNCE_MS);
    }

    function renderPreview() {
        schedulePreviewSync(false);
    }

    function focusEditor() {
        if (!dom.markdown) return false;
        dom.markdown.focus();
        return true;
    }

    function updateEditorContent(nextText, selectionStart, selectionEnd) {
        if (!dom.markdown) return;

        state.markdown = String(nextText || '');
        dom.markdown.value = state.markdown;
        syncActiveDraftFromEditor();
        updateStats();
        renderPreview();
        scheduleSave();
        renderExplorerPanels();

        focusEditor();
        if (Number.isFinite(selectionStart) && Number.isFinite(selectionEnd)) {
            dom.markdown.setSelectionRange(selectionStart, selectionEnd);
        }
    }

    function wrapSelection(prefix, suffix, placeholder) {
        if (!dom.markdown) return;

        const value = String(dom.markdown.value || '');
        const start = dom.markdown.selectionStart || 0;
        const end = dom.markdown.selectionEnd || 0;
        const selected = value.slice(start, end);
        const content = selected || String(placeholder || '内容');
        const inserted = `${prefix}${content}${suffix}`;
        const next = value.slice(0, start) + inserted + value.slice(end);

        const caretStart = start + prefix.length;
        const caretEnd = caretStart + content.length;
        updateEditorContent(next, caretStart, caretEnd);
    }

    function insertBlockSnippet(snippet, selectText) {
        if (!dom.markdown) return;

        const value = String(dom.markdown.value || '');
        const start = dom.markdown.selectionStart || 0;
        const end = dom.markdown.selectionEnd || 0;
        const before = value.slice(0, start);
        const after = value.slice(end);
        const prefix = before && !before.endsWith('\n') ? '\n' : '';
        const suffix = after && !after.startsWith('\n') ? '\n' : '';
        const body = String(snippet || '');
        const inserted = `${prefix}${body}${suffix}`;
        const next = before + inserted + after;

        let caretStart = before.length + prefix.length;
        let caretEnd = caretStart;

        if (selectText) {
            const idx = body.indexOf(selectText);
            if (idx >= 0) {
                caretStart += idx;
                caretEnd = caretStart + selectText.length;
            }
        }

        updateEditorContent(next, caretStart, caretEnd);
    }

    function defaultFlowchartNodeLabel(type) {
        const key = String(type || '').trim();
        if (key === 'start') return '开始';
        if (key === 'decision') return '是否继续';
        if (key === 'end') return '结束';
        return '步骤';
    }

    function normalizeFlowchartNodeType(type) {
        const key = String(type || '').trim();
        if (key === 'start' || key === 'process' || key === 'decision' || key === 'end') return key;
        return 'process';
    }

    function createDefaultFlowchartModel() {
        return {
            direction: 'TD',
            nodes: [
                { id: 'start_1', type: 'start', label: '开始' },
                { id: 'process_1', type: 'process', label: '执行步骤' },
                { id: 'decision_1', type: 'decision', label: '条件判断' },
                { id: 'end_1', type: 'end', label: '结束' }
            ],
            edges: [
                { from: 'start_1', to: 'process_1', label: '' },
                { from: 'process_1', to: 'decision_1', label: '' },
                { from: 'decision_1', to: 'end_1', label: 'Yes' },
                { from: 'decision_1', to: 'process_1', label: 'No' }
            ]
        };
    }

    function cloneFlowchartModel(model) {
        const base = model && typeof model === 'object' ? model : createDefaultFlowchartModel();
        return {
            direction: String(base.direction || 'TD').toUpperCase() === 'LR' ? 'LR' : 'TD',
            nodes: Array.isArray(base.nodes)
                ? base.nodes.map(function (node) {
                    return {
                        id: String(node && node.id || ''),
                        type: normalizeFlowchartNodeType(node && node.type),
                        label: String(node && node.label || '')
                    };
                }).filter(function (node) {
                    return !!node.id;
                })
                : [],
            edges: Array.isArray(base.edges)
                ? base.edges.map(function (edge) {
                    return {
                        from: String(edge && edge.from || ''),
                        to: String(edge && edge.to || ''),
                        label: String(edge && edge.label || '')
                    };
                }).filter(function (edge) {
                    return edge.from && edge.to;
                })
                : []
        };
    }

    function ensureFlowchartStateInitialized() {
        if (!state.flowchartDrawer.model || !Array.isArray(state.flowchartDrawer.model.nodes)) {
            state.flowchartDrawer.model = createDefaultFlowchartModel();
        }
        if (!state.flowchartDrawer.generatedSource) {
            state.flowchartDrawer.generatedSource = buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
        }
        if (!state.flowchartDrawer.sourceDraft) {
            state.flowchartDrawer.sourceDraft = state.flowchartDrawer.generatedSource;
        }
        if (!Number.isFinite(state.flowchartDrawer.nextNodeSeq) || state.flowchartDrawer.nextNodeSeq < 1) {
            state.flowchartDrawer.nextNodeSeq = 1;
        }
    }

    function flowchartNodeTypeLabel(type) {
        const key = normalizeFlowchartNodeType(type);
        if (key === 'start') return '开始';
        if (key === 'decision') return '判断';
        if (key === 'end') return '结束';
        return '处理';
    }

    function nextFlowchartNodeId(type) {
        ensureFlowchartStateInitialized();
        const safeType = normalizeFlowchartNodeType(type);
        let seq = state.flowchartDrawer.nextNodeSeq;
        const existing = new Set(state.flowchartDrawer.model.nodes.map(function (node) {
            return String(node.id || '');
        }));
        while (existing.has(`${safeType}_${seq}`)) {
            seq += 1;
        }
        state.flowchartDrawer.nextNodeSeq = seq + 1;
        return `${safeType}_${seq}`;
    }

    function buildMermaidNodeLine(node) {
        const safeId = String(node && node.id || '').trim();
        const type = normalizeFlowchartNodeType(node && node.type);
        const label = String(node && node.label || defaultFlowchartNodeLabel(type)).trim();
        if (!safeId) return '';

        if (type === 'decision') return `${safeId}{${label}}`;
        if (type === 'start' || type === 'end') return `${safeId}([${label}])`;
        return `${safeId}[${label}]`;
    }

    function buildMermaidFlowchartFromModel(model) {
        const normalized = cloneFlowchartModel(model);
        const direction = normalized.direction === 'LR' ? 'LR' : 'TD';
        const lines = [`flowchart ${direction}`];

        normalized.nodes.forEach(function (node) {
            const line = buildMermaidNodeLine(node);
            if (line) lines.push(`    ${line}`);
        });

        normalized.edges.forEach(function (edge) {
            const from = String(edge.from || '').trim();
            const to = String(edge.to || '').trim();
            const label = String(edge.label || '').trim();
            if (!from || !to) return;
            if (label) {
                lines.push(`    ${from} -->|${label}| ${to}`);
            } else {
                lines.push(`    ${from} --> ${to}`);
            }
        });

        return `${lines.join('\n')}\n`;
    }

    function parseFlowchartNodeType(id, shape) {
        const nodeId = String(id || '').toLowerCase();
        if (nodeId.startsWith('start_')) return 'start';
        if (nodeId.startsWith('end_')) return 'end';
        if (shape === 'decision') return 'decision';
        if (shape === 'round') return 'start';
        return 'process';
    }

    function parseMermaidFlowchartToModel(source) {
        const text = String(source || '').replace(/\r\n/g, '\n').trim();
        if (!text) {
            return { ok: false, reason: 'invalid', message: '流程图源码为空' };
        }

        if (/\b(subgraph|classDef|class|style|linkStyle|click)\b/.test(text)) {
            return { ok: false, reason: 'unsupported', message: '包含超出 v1 的 Mermaid 语法' };
        }

        const lines = text.split('\n').map(function (line) {
            return String(line || '').trim();
        }).filter(Boolean);
        if (lines.length === 0) {
            return { ok: false, reason: 'invalid', message: '流程图源码为空' };
        }

        const headerMatch = lines[0].match(/^(flowchart|graph)\s+([A-Za-z]{2})\b/i);
        if (!headerMatch) {
            return { ok: false, reason: 'unsupported', message: '仅支持 flowchart/graph 语法' };
        }

        const direction = String(headerMatch[2] || 'TD').toUpperCase();
        if (direction !== 'TD' && direction !== 'LR') {
            return { ok: false, reason: 'unsupported', message: 'v1 仅支持 TD 或 LR 方向' };
        }

        const nodesById = new Map();
        const edges = [];

        function upsertNode(id, type, label) {
            const nodeId = String(id || '').trim();
            if (!nodeId) return;
            const existing = nodesById.get(nodeId);
            if (existing) {
                if (type) existing.type = normalizeFlowchartNodeType(type);
                if (String(label || '').trim()) existing.label = String(label || '').trim();
                return;
            }
            nodesById.set(nodeId, {
                id: nodeId,
                type: normalizeFlowchartNodeType(type || 'process'),
                label: String(label || defaultFlowchartNodeLabel(type || 'process')).trim()
            });
        }

        for (let i = 1; i < lines.length; i += 1) {
            const line = lines[i];
            if (!line || line.startsWith('%%')) continue;

            const edgeMatch = line.match(/^([A-Za-z][\w-]*)\s*-->\s*(?:\|([^|]+)\|\s*)?([A-Za-z][\w-]*)$/);
            if (edgeMatch) {
                const from = String(edgeMatch[1] || '').trim();
                const to = String(edgeMatch[3] || '').trim();
                const label = String(edgeMatch[2] || '').trim();
                if (!from || !to) continue;
                edges.push({ from: from, to: to, label: label });
                if (!nodesById.has(from)) upsertNode(from, parseFlowchartNodeType(from, 'rect'), from.replace(/_/g, ' '));
                if (!nodesById.has(to)) upsertNode(to, parseFlowchartNodeType(to, 'rect'), to.replace(/_/g, ' '));
                continue;
            }

            const roundMatch = line.match(/^([A-Za-z][\w-]*)\(\[(.+)\]\)$/);
            if (roundMatch) {
                const id = String(roundMatch[1] || '').trim();
                const label = String(roundMatch[2] || '').trim();
                upsertNode(id, parseFlowchartNodeType(id, 'round'), label);
                continue;
            }

            const rectMatch = line.match(/^([A-Za-z][\w-]*)\[(.+)\]$/);
            if (rectMatch) {
                const id = String(rectMatch[1] || '').trim();
                const label = String(rectMatch[2] || '').trim();
                upsertNode(id, parseFlowchartNodeType(id, 'rect'), label);
                continue;
            }

            const decisionMatch = line.match(/^([A-Za-z][\w-]*)\{(.+)\}$/);
            if (decisionMatch) {
                const id = String(decisionMatch[1] || '').trim();
                const label = String(decisionMatch[2] || '').trim();
                upsertNode(id, 'decision', label);
                continue;
            }

            return { ok: false, reason: 'unsupported', message: '存在不可解析的 Mermaid 行' };
        }

        const nodes = Array.from(nodesById.values());
        if (nodes.length === 0) {
            return { ok: false, reason: 'invalid', message: '未解析到可视化节点' };
        }

        let nextNodeSeq = 1;
        nodes.forEach(function (node) {
            const match = String(node.id || '').match(/_(\d+)$/);
            if (!match) return;
            const num = Number(match[1]);
            if (Number.isFinite(num) && num >= nextNodeSeq) {
                nextNodeSeq = num + 1;
            }
        });

        return {
            ok: true,
            reason: 'ok',
            model: {
                direction: direction,
                nodes: nodes,
                edges: edges
            },
            nextNodeSeq: nextNodeSeq
        };
    }

    function buildMermaidFenceBlock(source) {
        const body = String(source || '').replace(/\r\n/g, '\n').trim();
        return `\`\`\`mermaid\n${body}\n\`\`\``;
    }

    function findMermaidBlockAroundSelection(markdown, selectionStart, selectionEnd) {
        const text = String(markdown || '');
        const start = Number.isFinite(selectionStart) ? selectionStart : 0;
        const end = Number.isFinite(selectionEnd) ? selectionEnd : start;
        const blockRegex = /```([^\n`]*)\n([\s\S]*?)\n```/g;
        let match = null;
        while ((match = blockRegex.exec(text)) !== null) {
            const language = String(match[1] || '').trim().toLowerCase();
            if (language !== 'mermaid') continue;
            const blockStart = match.index;
            const blockEnd = blockStart + match[0].length;
            if (start > blockEnd || end < blockStart) continue;

            return {
                start: blockStart,
                end: blockEnd,
                source: String(match[2] || ''),
                signature: String(match[0] || '')
            };
        }
        return null;
    }

    function setFlowchartBoundBlock(block) {
        if (!block || !Number.isFinite(block.start) || !Number.isFinite(block.end)) {
            state.flowchartDrawer.boundBlock = null;
            return;
        }

        state.flowchartDrawer.boundBlock = {
            start: block.start,
            end: block.end,
            signature: String(block.signature || '')
        };
    }

    function updateFlowchartBindingStatusText() {
        if (!dom.flowchartBindingStatus) return;
        const bound = state.flowchartDrawer.boundBlock;
        if (!bound) {
            dom.flowchartBindingStatus.textContent = '当前绑定：未命中，待新建';
            return;
        }

        const statusHint = state.flowchartDrawer.parseStatus === 'unsupported'
            ? '（仅源码模式）'
            : '';
        dom.flowchartBindingStatus.textContent = `当前绑定：Mermaid 块 @${bound.start}-${bound.end}${statusHint}`;
    }

    function updateFlowchartRealtimeToggleUi() {
        if (!dom.flowchartRealtimeToggle) return;
        dom.flowchartRealtimeToggle.textContent = state.flowchartDrawer.realtimeEnabled ? '实时写入：已开启' : '实时写入：已暂停';
        dom.flowchartRealtimeToggle.classList.toggle('studio-flowchart-mode-btn--active', !!state.flowchartDrawer.realtimeEnabled);
    }

    function updateFlowchartModeUi() {
        if (dom.flowchartModeVisual) {
            dom.flowchartModeVisual.classList.toggle('studio-flowchart-mode-btn--active', state.flowchartDrawer.mode === 'visual');
        }
        if (dom.flowchartModeSource) {
            dom.flowchartModeSource.classList.toggle('studio-flowchart-mode-btn--active', state.flowchartDrawer.mode === 'source');
        }
        if (dom.flowchartVisualPanel) {
            dom.flowchartVisualPanel.hidden = false;
            dom.flowchartVisualPanel.classList.toggle('studio-flowchart-panel--active', state.flowchartDrawer.mode === 'visual');
        }
        if (dom.flowchartSourcePanel) {
            dom.flowchartSourcePanel.hidden = false;
            dom.flowchartSourcePanel.classList.toggle('studio-flowchart-panel--active', state.flowchartDrawer.mode === 'source');
        }
    }

    function setFlowchartMode(mode) {
        state.flowchartDrawer.mode = mode === 'source' ? 'source' : 'visual';
        updateFlowchartModeUi();
    }

    function setFlowchartModalOpen(open) {
        if (!dom.flowchartModal) return;
        const nextOpen = !!open;
        if (nextOpen && !state.isFullscreen) {
            setStatus('请先进入专注模式再打开流程图工作台');
            return;
        }

        state.flowchartDrawer.open = nextOpen;
        if (state.flowchartDrawer.open) {
            setSidePanelModalOpen('left', false, { silent: true });
            setSidePanelModalOpen('right', false, { silent: true });
        }
        dom.flowchartModal.classList.toggle('active', state.flowchartDrawer.open);
        dom.flowchartModal.setAttribute('aria-hidden', state.flowchartDrawer.open ? 'false' : 'true');
        if (dom.flowchartToggle) {
            dom.flowchartToggle.setAttribute('aria-expanded', state.flowchartDrawer.open ? 'true' : 'false');
        }
        syncModalBodyLock();

        if (!state.flowchartDrawer.open) return;
        bindFlowchartAtCursor({ createIfMissing: true });
        renderFlowchartDrawer();
    }

    function renderFlowchartNodeList() {
        if (!dom.flowchartNodeList) return;
        dom.flowchartNodeList.innerHTML = '';

        const model = state.flowchartDrawer.model;
        const nodes = model && Array.isArray(model.nodes) ? model.nodes : [];
        if (nodes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'studio-flowchart-empty';
            empty.textContent = '暂无节点，请先新增节点。';
            dom.flowchartNodeList.appendChild(empty);
            return;
        }

        nodes.forEach(function (node, index) {
            const row = document.createElement('div');
            row.className = 'studio-flowchart-row';

            const typeSelect = document.createElement('select');
            typeSelect.className = 'studio-select';
            ['start', 'process', 'decision', 'end'].forEach(function (type) {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = flowchartNodeTypeLabel(type);
                if (normalizeFlowchartNodeType(node.type) === type) {
                    option.selected = true;
                }
                typeSelect.appendChild(option);
            });

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.className = 'studio-input';
            labelInput.value = String(node.label || '');
            labelInput.placeholder = defaultFlowchartNodeLabel(node.type);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-small btn-outline';
            removeBtn.textContent = '删除';

            typeSelect.addEventListener('change', function () {
                const nextType = normalizeFlowchartNodeType(typeSelect.value);
                node.type = nextType;
                if (!String(node.label || '').trim()) {
                    node.label = defaultFlowchartNodeLabel(nextType);
                    labelInput.value = node.label;
                }
                syncFlowchartGeneratedSource(true);
            });

            labelInput.addEventListener('input', function () {
                node.label = String(labelInput.value || '');
                syncFlowchartGeneratedSource(true);
            });

            removeBtn.addEventListener('click', function () {
                if (nodes.length <= 1) {
                    setStatus('至少保留一个流程图节点');
                    return;
                }
                const removedId = String(node.id || '');
                model.nodes.splice(index, 1);
                model.edges = model.edges.filter(function (edge) {
                    return edge.from !== removedId && edge.to !== removedId;
                });
                renderFlowchartDrawer();
                syncFlowchartGeneratedSource(true);
            });

            row.appendChild(typeSelect);
            row.appendChild(labelInput);
            row.appendChild(removeBtn);
            dom.flowchartNodeList.appendChild(row);
        });
    }

    function appendFlowchartNodeOptions(select, selectedId) {
        if (!select) return;
        select.innerHTML = '';
        const nodes = state.flowchartDrawer.model && Array.isArray(state.flowchartDrawer.model.nodes)
            ? state.flowchartDrawer.model.nodes
            : [];

        nodes.forEach(function (node) {
            const option = document.createElement('option');
            option.value = String(node.id || '');
            option.textContent = String(node.label || node.id || '');
            if (String(node.id || '') === String(selectedId || '')) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    function renderFlowchartEdgeList() {
        if (!dom.flowchartEdgeList) return;
        dom.flowchartEdgeList.innerHTML = '';

        const model = state.flowchartDrawer.model;
        const edges = model && Array.isArray(model.edges) ? model.edges : [];
        if (edges.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'studio-flowchart-empty';
            empty.textContent = '暂无连线，可添加一条起点到终点的箭头。';
            dom.flowchartEdgeList.appendChild(empty);
            return;
        }

        edges.forEach(function (edge, index) {
            const row = document.createElement('div');
            row.className = 'studio-flowchart-row studio-flowchart-row--edge';

            const fromSelect = document.createElement('select');
            fromSelect.className = 'studio-select';
            appendFlowchartNodeOptions(fromSelect, edge.from);

            const toSelect = document.createElement('select');
            toSelect.className = 'studio-select';
            appendFlowchartNodeOptions(toSelect, edge.to);

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.className = 'studio-input';
            labelInput.value = String(edge.label || '');
            labelInput.placeholder = 'Yes / No / 留空';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-small btn-outline';
            removeBtn.textContent = '删除';

            fromSelect.addEventListener('change', function () {
                edge.from = String(fromSelect.value || '').trim();
                syncFlowchartGeneratedSource(true);
            });

            toSelect.addEventListener('change', function () {
                edge.to = String(toSelect.value || '').trim();
                syncFlowchartGeneratedSource(true);
            });

            labelInput.addEventListener('input', function () {
                edge.label = String(labelInput.value || '');
                syncFlowchartGeneratedSource(true);
            });

            removeBtn.addEventListener('click', function () {
                model.edges.splice(index, 1);
                renderFlowchartDrawer();
                syncFlowchartGeneratedSource(true);
            });

            row.appendChild(fromSelect);
            row.appendChild(toSelect);
            row.appendChild(labelInput);
            row.appendChild(removeBtn);
            dom.flowchartEdgeList.appendChild(row);
        });
    }

    function renderFlowchartDrawer() {
        ensureFlowchartStateInitialized();
        updateFlowchartModeUi();
        updateFlowchartBindingStatusText();
        updateFlowchartRealtimeToggleUi();

        if (dom.flowchartDirection) {
            dom.flowchartDirection.value = state.flowchartDrawer.model.direction === 'LR' ? 'LR' : 'TD';
        }
        if (dom.flowchartGeneratedSource) {
            dom.flowchartGeneratedSource.value = state.flowchartDrawer.generatedSource;
        }
        if (dom.flowchartSourceEditor) {
            dom.flowchartSourceEditor.value = state.flowchartDrawer.sourceDraft;
        }

        renderFlowchartNodeList();
        renderFlowchartEdgeList();
    }

    function syncFlowchartGeneratedSource(triggerRealtimeApply) {
        ensureFlowchartStateInitialized();
        state.flowchartDrawer.generatedSource = buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
        state.flowchartDrawer.parseStatus = 'ok';
        if (dom.flowchartGeneratedSource) {
            dom.flowchartGeneratedSource.value = state.flowchartDrawer.generatedSource;
        }
        if (state.flowchartDrawer.mode === 'visual') {
            state.flowchartDrawer.sourceDraft = state.flowchartDrawer.generatedSource;
            if (dom.flowchartSourceEditor) {
                dom.flowchartSourceEditor.value = state.flowchartDrawer.sourceDraft;
            }
        }
        updateFlowchartBindingStatusText();

        if (triggerRealtimeApply && state.flowchartDrawer.realtimeEnabled) {
            scheduleFlowchartRealtimeApply();
        }
    }

    function replaceBoundMermaidBlock(source, focusEditorAfter) {
        if (!dom.markdown || !state.flowchartDrawer.boundBlock) return false;
        const currentText = String(dom.markdown.value || '');
        const bound = state.flowchartDrawer.boundBlock;
        const signature = String(bound.signature || '');
        let start = Number(bound.start);
        let end = Number(bound.end);

        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) return false;

        if (!signature || currentText.slice(start, end) !== signature) {
            if (!signature) return false;
            const located = currentText.indexOf(signature);
            if (located < 0) return false;
            start = located;
            end = located + signature.length;
        }

        const replacement = buildMermaidFenceBlock(source);
        const nextText = currentText.slice(0, start) + replacement + currentText.slice(end);
        const delta = replacement.length - (end - start);
        const previousSelectionStart = Number(dom.markdown.selectionStart || 0);
        const previousSelectionEnd = Number(dom.markdown.selectionEnd || 0);

        function shiftPosition(pos) {
            if (!Number.isFinite(pos)) return 0;
            if (pos <= start) return pos;
            if (pos >= end) return pos + delta;
            return start + replacement.length;
        }

        const nextSelectionStart = shiftPosition(previousSelectionStart);
        const nextSelectionEnd = shiftPosition(previousSelectionEnd);

        state.markdown = nextText;
        dom.markdown.value = nextText;
        dom.markdown.setSelectionRange(nextSelectionStart, nextSelectionEnd);
        updateStats();
        renderPreview();
        scheduleSave();

        if (focusEditorAfter) {
            focusEditor();
        }

        setFlowchartBoundBlock({
            start: start,
            end: start + replacement.length,
            signature: replacement
        });
        updateFlowchartBindingStatusText();
        return true;
    }

    function insertMermaidBlockAtCursor(source) {
        if (!dom.markdown) return false;
        const value = String(dom.markdown.value || '');
        const selectionStart = Number(dom.markdown.selectionStart || 0);
        const selectionEnd = Number(dom.markdown.selectionEnd || 0);
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const blockText = buildMermaidFenceBlock(source);
        const prefix = before && !before.endsWith('\n') ? '\n' : '';
        const suffix = after && !after.startsWith('\n') ? '\n' : '';
        const nextText = before + prefix + blockText + suffix + after;
        const blockStart = before.length + prefix.length;
        const blockEnd = blockStart + blockText.length;

        state.markdown = nextText;
        dom.markdown.value = nextText;
        dom.markdown.setSelectionRange(blockEnd, blockEnd);
        updateStats();
        renderPreview();
        scheduleSave();

        setFlowchartBoundBlock({
            start: blockStart,
            end: blockEnd,
            signature: blockText
        });
        return true;
    }

    function bindFlowchartAtCursor(options) {
        ensureFlowchartStateInitialized();
        if (!dom.markdown) return false;

        const opts = options && typeof options === 'object' ? options : {};
        const createIfMissing = opts.createIfMissing !== false;
        const selectionStart = Number(dom.markdown.selectionStart || 0);
        const selectionEnd = Number(dom.markdown.selectionEnd || selectionStart);
        let block = findMermaidBlockAroundSelection(dom.markdown.value, selectionStart, selectionEnd);

        if (!block && createIfMissing) {
            const generated = state.flowchartDrawer.generatedSource || buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
            insertMermaidBlockAtCursor(generated);
            block = findMermaidBlockAroundSelection(dom.markdown.value, Number(dom.markdown.selectionStart || 0), Number(dom.markdown.selectionEnd || 0));
        }

        if (!block) {
            setFlowchartBoundBlock(null);
            updateFlowchartBindingStatusText();
            return false;
        }

        setFlowchartBoundBlock(block);
        state.flowchartDrawer.sourceDraft = String(block.source || '').replace(/\r\n/g, '\n');
        if (dom.flowchartSourceEditor) {
            dom.flowchartSourceEditor.value = state.flowchartDrawer.sourceDraft;
        }

        const parsed = parseMermaidFlowchartToModel(block.source);
        if (parsed.ok) {
            state.flowchartDrawer.model = cloneFlowchartModel(parsed.model);
            state.flowchartDrawer.nextNodeSeq = Math.max(Number(parsed.nextNodeSeq || 1), Number(state.flowchartDrawer.nextNodeSeq || 1));
            state.flowchartDrawer.generatedSource = buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
            state.flowchartDrawer.parseStatus = 'ok';
            if (state.flowchartDrawer.mode !== 'source') {
                setFlowchartMode('visual');
            }
        } else {
            state.flowchartDrawer.parseStatus = parsed.reason || 'unsupported';
            state.flowchartDrawer.generatedSource = String(block.source || '');
            setFlowchartMode('source');
            setStatus(`流程图进入源码模式：${parsed.message || '存在不可视化语法'}`);
        }

        renderFlowchartDrawer();
        return true;
    }

    function scheduleFlowchartRealtimeApply() {
        if (flowchartRealtimeTimer) clearTimeout(flowchartRealtimeTimer);
        flowchartRealtimeTimer = setTimeout(function () {
            flowchartRealtimeTimer = 0;
            const source = state.flowchartDrawer.generatedSource || buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
            const ok = replaceBoundMermaidBlock(source, false);
            if (!ok) {
                setStatus('流程图实时写入失败：绑定失效，请重新绑定');
            }
        }, FLOWCHART_REALTIME_DEBOUNCE_MS);
    }

    function applyFlowchartSourceToMarkdown(source, statusText) {
        const cleaned = String(source || '').replace(/\r\n/g, '\n').trim();
        if (!cleaned) {
            setStatus('流程图源码为空，无法应用');
            return false;
        }

        if (!state.flowchartDrawer.boundBlock) {
            bindFlowchartAtCursor({ createIfMissing: true });
        }

        const applied = replaceBoundMermaidBlock(cleaned, false);
        if (!applied) {
            setStatus('流程图应用失败：绑定失效，请重新绑定');
            return false;
        }

        state.flowchartDrawer.sourceDraft = cleaned;
        const parsed = parseMermaidFlowchartToModel(cleaned);
        if (parsed.ok) {
            state.flowchartDrawer.model = cloneFlowchartModel(parsed.model);
            state.flowchartDrawer.nextNodeSeq = Math.max(Number(parsed.nextNodeSeq || 1), Number(state.flowchartDrawer.nextNodeSeq || 1));
            state.flowchartDrawer.generatedSource = buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
            state.flowchartDrawer.parseStatus = 'ok';
        } else {
            state.flowchartDrawer.generatedSource = cleaned;
            state.flowchartDrawer.parseStatus = parsed.reason || 'unsupported';
        }

        renderFlowchartDrawer();
        if (statusText) setStatus(statusText);
        return true;
    }

    function addFlowchartNode() {
        ensureFlowchartStateInitialized();
        const model = state.flowchartDrawer.model;
        const id = nextFlowchartNodeId('process');
        model.nodes.push({
            id: id,
            type: 'process',
            label: `步骤 ${model.nodes.length + 1}`
        });
        renderFlowchartDrawer();
        syncFlowchartGeneratedSource(true);
    }

    function addFlowchartEdge() {
        ensureFlowchartStateInitialized();
        const model = state.flowchartDrawer.model;
        if (!Array.isArray(model.nodes) || model.nodes.length < 2) {
            setStatus('至少需要两个节点才能创建连线');
            return;
        }
        const from = String(model.nodes[0].id || '');
        const to = String(model.nodes[1].id || '');
        model.edges.push({ from: from, to: to, label: '' });
        renderFlowchartDrawer();
        syncFlowchartGeneratedSource(true);
    }

    function readCurrentSelectionText() {
        if (!dom.markdown) return '';
        const value = String(dom.markdown.value || '');
        const start = dom.markdown.selectionStart || 0;
        const end = dom.markdown.selectionEnd || 0;
        return String(value.slice(start, end) || '').trim();
    }

    function toSingleLineText(value, fallback) {
        const cleaned = String(value || '').replace(/\r?\n+/g, ' ').trim();
        if (cleaned) return cleaned;
        return String(fallback || '').trim();
    }

    function pushDraftIssue(issues, level, code, title, detail) {
        issues.push({
            level: level === 'error' ? 'error' : 'warn',
            code: String(code || '').trim() || 'unknown',
            title: String(title || '').trim() || '未命名问题',
            detail: String(detail || '').trim() || '请检查对应内容'
        });
    }

    function resolveRelativeMarkdownPath(baseDir, rawPath) {
        const baseSegments = String(baseDir || '').split('/').filter(Boolean);
        const rawSegments = String(rawPath || '').split('/').filter(function (segment) {
            return segment !== '';
        });

        rawSegments.forEach(function (segment) {
            if (segment === '.') return;
            if (segment === '..') {
                if (baseSegments.length > 0) {
                    baseSegments.pop();
                }
                return;
            }
            baseSegments.push(segment);
        });

        return baseSegments.join('/');
    }

    function normalizeMarkdownLinkPath(rawHref) {
        const href = String(rawHref || '').trim();
        if (!href) return '';
        if (/^(?:https?:|mailto:|tel:|javascript:|#)/i.test(href)) return '';

        const stripped = href.split('#')[0].split('?')[0].trim();
        if (!stripped || !/\.md$/i.test(stripped)) return '';

        let normalized = '';
        if (stripped.startsWith('/')) {
            normalized = normalizePath(stripped);
        } else if (stripped.startsWith('./') || stripped.startsWith('../')) {
            normalized = resolveRelativeMarkdownPath(getDirectoryFromPath(state.targetPath), stripped);
        } else {
            normalized = resolveRelativeMarkdownPath(getDirectoryFromPath(state.targetPath), `./${stripped}`);
        }

        if (!normalized || /\.{1,2}(?:\/|$)/.test(normalized) || /\0/.test(normalized)) {
            return '';
        }

        return normalized;
    }

    function parseCsDirective(rawDirective) {
        const text = String(rawDirective || '').trim();
        if (!text) return null;

        const core = text.split('|')[0].trim();
        const hashIndex = core.indexOf('#');
        const pathPart = hashIndex >= 0 ? core.slice(0, hashIndex).trim() : core;
        const selectorPart = hashIndex >= 0 ? core.slice(hashIndex + 1).trim() : '';
        return {
            pathPart: pathPart,
            selectorPart: selectorPart
        };
    }

    function extractDocLinks(markdownText) {
        const links = [];
        const regex = /(!?)\[[^\]]*]\(([^)]+)\)/g;
        const source = String(markdownText || '');
        let match = null;
        while ((match = regex.exec(source)) !== null) {
            if (match[1] === '!') continue;
            const targetRaw = String(match[2] || '').trim();
            if (!targetRaw) continue;
            const target = targetRaw.split(/\s+/)[0];
            if (!target || !/\.md$/i.test(target)) continue;
            links.push(target);
        }
        return links;
    }

    function extractColorReferences(markdownText, tokenName) {
        const refs = [];
        const name = tokenName === 'colorChange' ? 'colorChange' : 'color';
        const regex = new RegExp(`\\{${name}:([^}\\n]+)\\}\\{`, 'g');
        const source = String(markdownText || '');
        let match = null;
        while ((match = regex.exec(source)) !== null) {
            const value = String(match[1] || '').trim();
            if (value) refs.push(value);
        }
        return refs;
    }

    function collectDraftCheckIssues() {
        const issues = [];
        const markdown = String(state.markdown || '');
        const parsed = parseFrontMatterFromMarkdown(markdown);
        const metadata = parsed && parsed.metadata ? parsed.metadata : {};
        const requiredMetaKeys = ['title', 'description', 'topic', 'difficulty', 'time'];

        if (!parsed.hasFrontMatter) {
            pushDraftIssue(
                issues,
                'error',
                'front-matter-missing',
                '缺少 Front Matter',
                '文档顶部应包含 `---` 开始与结束的元数据区块。'
            );
        }

        requiredMetaKeys.forEach(function (key) {
            const value = String(metadata[key] || '').trim();
            if (value) return;
            pushDraftIssue(
                issues,
                'error',
                `meta-${key}-missing`,
                `缺少必填字段：${key}`,
                `请在 front matter 中补齐 \`${key}\`。`
            );
        });

        const difficulty = String(metadata.difficulty || '').trim();
        if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            pushDraftIssue(
                issues,
                'error',
                'meta-difficulty-invalid',
                'difficulty 不在允许范围',
                'difficulty 仅允许 beginner / intermediate / advanced。'
            );
        }

        const body = String(parsed.body || markdown || '');
        if (!/(^|\n)#{1,2}\s+\S+/m.test(body)) {
            pushDraftIssue(
                issues,
                'warn',
                'heading-structure-missing',
                '缺少基础标题结构',
                '建议至少包含一个 H1/H2 标题，便于目录与阅读。'
            );
        }

        const knownEntriesReady = Array.isArray(knownMarkdownEntries) && knownMarkdownEntries.length > 0;
        if (!knownEntriesReady) {
            pushDraftIssue(
                issues,
                'warn',
                'known-entry-empty',
                '文档索引未加载',
                '暂时无法校验 Markdown 链接是否真实存在。'
            );
        }

        const knownPathSet = new Set((knownMarkdownEntries || []).map(function (entry) {
            return normalizePath(entry && entry.path || '');
        }).filter(Boolean));
        const docLinks = extractDocLinks(markdown);
        docLinks.forEach(function (href) {
            const resolved = normalizeMarkdownLinkPath(href);
            if (!resolved) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'doc-link-invalid',
                    `链接格式可疑：${href}`,
                    '建议使用相对路径并以 .md 结尾。'
                );
                return;
            }

            if (knownEntriesReady && !knownPathSet.has(resolved)) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'doc-link-missing',
                    `链接目标未命中：${href}`,
                    `按当前 config 索引未找到：${resolved}`
                );
            }
        });

        const csRegex = /\{\{cs:([^}\n]+)\}\}/g;
        let csMatch = null;
        while ((csMatch = csRegex.exec(markdown)) !== null) {
            const parsedCs = parseCsDirective(csMatch[1]);
            if (!parsedCs || !parsedCs.pathPart) {
                pushDraftIssue(
                    issues,
                    'error',
                    'cs-path-missing',
                    'C# 引用缺少路径',
                    '语法示例：{{cs:./code/Demo.cs}}'
                );
                continue;
            }

            if (!/\.cs$/i.test(parsedCs.pathPart)) {
                pushDraftIssue(
                    issues,
                    'error',
                    'cs-path-ext-invalid',
                    `C# 引用扩展名错误：${parsedCs.pathPart}`,
                    'C# 引用路径必须以 .cs 结尾。'
                );
            }

            if (parsedCs.selectorPart && !/^cs:(?:t|m|p|f|c|e):.+$/.test(parsedCs.selectorPart)) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'cs-selector-invalid',
                    `C# 选择器格式可疑：${parsedCs.selectorPart}`,
                    '建议使用 #cs:t: / #cs:m: / #cs:p: / #cs:f: / #cs:c: / #cs:e:。'
                );
            }

            const localCsharp = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [];
            if (localCsharp.length > 0) {
                const normalizedPath = normalizePath(parsedCs.pathPart).replace(/^\.\//, '');
                const pathName = normalizedPath.split('/').filter(Boolean).pop() || '';
                const hitLocal = localCsharp.some(function (item) {
                    const assetPath = normalizePath(item && item.assetPath || '');
                    const fileName = String(item && item.name || '').trim();
                    return assetPath.endsWith(normalizedPath) || fileName === pathName;
                });
                if (!hitLocal) {
                    pushDraftIssue(
                        issues,
                        'warn',
                        'cs-local-unmatched',
                        `当前附件未命中 C# 引用：${parsedCs.pathPart}`,
                        '若本次提交包含该文件，请确认路径与文件名大小写一致。'
                    );
                }
            }
        }

        const animRegex = /\{\{anim:([^}\n]+)\}\}/g;
        let animMatch = null;
        while ((animMatch = animRegex.exec(markdown)) !== null) {
            const animPathRaw = String(animMatch[1] || '').trim();
            const animPath = normalizePath(animPathRaw).replace(/^\.\//, '');
            if (!/^anims\//i.test(animPath)) {
                pushDraftIssue(
                    issues,
                    'error',
                    'anim-path-prefix-invalid',
                    `动画路径必须以 anims/ 开头：${animPathRaw}`,
                    '示例：{{anim:anims/demo-basic.cs}}'
                );
            }
            if (!/\.cs$/i.test(animPath)) {
                pushDraftIssue(
                    issues,
                    'error',
                    'anim-path-ext-invalid',
                    `动画路径扩展名错误：${animPathRaw}`,
                    '动画引用路径必须以 .cs 结尾。'
                );
            }
        }

        const animcsRegex = /```animcs\s*([\s\S]*?)```/g;
        let animcsMatch = null;
        while ((animcsMatch = animcsRegex.exec(markdown)) !== null) {
            const rawBody = String(animcsMatch[1] || '');
            const firstLine = rawBody.split(/\r?\n/).map(function (line) {
                return String(line || '').trim();
            }).find(Boolean) || '';

            if (!firstLine) {
                pushDraftIssue(
                    issues,
                    'error',
                    'animcs-path-missing',
                    'animcs 代码块缺少动画路径',
                    'animcs 代码块第一行必须填写 anims/*.cs 路径。'
                );
                continue;
            }

            const animcsPath = normalizePath(firstLine).replace(/^\.\//, '');
            if (!/^anims\//i.test(animcsPath)) {
                pushDraftIssue(
                    issues,
                    'error',
                    'animcs-path-prefix-invalid',
                    `animcs 路径必须以 anims/ 开头：${firstLine}`,
                    '示例：```animcs\\nanims/demo-basic.cs\\n```'
                );
            }
            if (!/\.cs$/i.test(animcsPath)) {
                pushDraftIssue(
                    issues,
                    'error',
                    'animcs-path-ext-invalid',
                    `animcs 路径扩展名错误：${firstLine}`,
                    'animcs 路径必须以 .cs 结尾。'
                );
            }
        }

        const metadataColors = new Set(Object.keys(ensureObject(state.metadata.colors)));
        const metadataColorChanges = new Set(Object.keys(ensureObject(state.metadata.colorChange)));

        extractColorReferences(markdown, 'color').forEach(function (name) {
            if (BUILTIN_COLOR_NAMES.has(name) || metadataColors.has(name)) return;
            pushDraftIssue(
                issues,
                'warn',
                'color-name-undefined',
                `未定义的颜色名：${name}`,
                '请在 front matter 的 colors 中定义，或改用内置颜色名。'
            );
        });

        extractColorReferences(markdown, 'colorChange').forEach(function (name) {
            if (metadataColorChanges.has(name)) return;
            pushDraftIssue(
                issues,
                'warn',
                'color-change-undefined',
                `未定义的颜色动画：${name}`,
                '请在 front matter 的 colorChange 中定义对应动画。'
            );
        });

        const quizRegex = /```quiz\s*([\s\S]*?)```/g;
        let quizMatch = null;
        while ((quizMatch = quizRegex.exec(markdown)) !== null) {
            const quizBody = String(quizMatch[1] || '');
            const typeMatch = quizBody.match(/^\s*type\s*:\s*([a-zA-Z_-]+)\s*$/m);
            const idMatch = quizBody.match(/^\s*id\s*:\s*(.+)\s*$/m);
            const questionMatch = quizBody.match(/^\s*question\s*:\s*(.+)\s*$/m) || /^\s*question\s*:\s*\|/m.exec(quizBody);
            const quizType = typeMatch ? String(typeMatch[1] || '').trim().toLowerCase() : '';

            if (!quizType) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'quiz-type-missing',
                    'Quiz 缺少 type 字段',
                    '建议使用 tf / single / multiple / choice。'
                );
            } else if (!['tf', 'single', 'multiple', 'choice'].includes(quizType)) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'quiz-type-invalid',
                    `Quiz type 可疑：${quizType}`,
                    'type 建议使用 tf / single / multiple / choice。'
                );
            }

            if (!idMatch || !String(idMatch[1] || '').trim()) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'quiz-id-missing',
                    'Quiz 缺少 id 字段',
                    '建议为每道题提供稳定 id，方便后续维护。'
                );
            }

            if (!questionMatch) {
                pushDraftIssue(
                    issues,
                    'warn',
                    'quiz-question-missing',
                    'Quiz 缺少 question 字段',
                    '请补充题干文本。'
                );
            }

            if (quizType === 'tf') {
                const answerMatch = quizBody.match(/^\s*answer\s*:\s*(.+)\s*$/m);
                const answerText = answerMatch ? String(answerMatch[1] || '').trim().toLowerCase() : '';
                if (!answerText || !['true', 'false'].includes(answerText)) {
                    pushDraftIssue(
                        issues,
                        'warn',
                        'quiz-tf-answer-invalid',
                        '判断题 answer 需为布尔值',
                        '判断题请使用 answer: true 或 answer: false。'
                    );
                }
            }
        }

        return issues;
    }

    function renderDraftCheckResults(issues) {
        if (!dom.draftCheckSummary || !dom.draftCheckList) return;

        const list = Array.isArray(issues) ? issues : [];
        const errorCount = list.filter(function (item) { return item.level === 'error'; }).length;
        const warnCount = list.filter(function (item) { return item.level === 'warn'; }).length;

        dom.draftCheckSummary.textContent = `检查完成：${errorCount} 个错误，${warnCount} 个警告。`;
        dom.draftCheckList.innerHTML = '';

        if (list.length === 0) {
            const okItem = document.createElement('li');
            okItem.className = 'studio-draft-check-item studio-draft-check-item--ok';
            okItem.textContent = '未发现问题，可以继续预览与提交。';
            dom.draftCheckList.appendChild(okItem);
            return;
        }

        list.forEach(function (issue) {
            const item = document.createElement('li');
            item.className = `studio-draft-check-item studio-draft-check-item--${issue.level === 'error' ? 'error' : 'warn'}`;

            const head = document.createElement('strong');
            head.textContent = `[${issue.code}] ${issue.title}`;
            const detail = document.createElement('span');
            detail.textContent = issue.detail;

            item.appendChild(head);
            item.appendChild(detail);
            dom.draftCheckList.appendChild(item);
        });
    }

    function runDraftCheck() {
        const issues = collectDraftCheckIssues();
        renderDraftCheckResults(issues);
        setSidePanelModalOpen('draft', true);

        const errorCount = issues.filter(function (item) { return item.level === 'error'; }).length;
        const warnCount = issues.filter(function (item) { return item.level === 'warn'; }).length;
        setStatus(`草稿自检完成：${errorCount} 个错误，${warnCount} 个警告`);
    }

    function createQuizId(prefix) {
        const safePrefix = String(prefix || 'quiz').trim() || 'quiz';
        return `${safePrefix}-${Date.now().toString(36).slice(-6)}`;
    }

    function firstUploadedCsharpRelativePath() {
        const list = Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [];
        if (list.length <= 0) return '';
        const normalized = normalizePath(list[0] && list[0].assetPath || '');
        if (!normalized) return '';
        return `./${normalized.split('/').slice(-2).join('/')}`;
    }

    function preferredColorName() {
        const names = Object.keys(ensureObject(state.metadata.colors));
        return names.length > 0 ? names[0] : 'primary';
    }

    function preferredColorChangeName() {
        const names = Object.keys(ensureObject(state.metadata.colorChange));
        return names.length > 0 ? names[0] : 'rainbow';
    }

    function insertCsharpSelectorSnippet(kind, selectorTemplate, titleFallback) {
        const selectedTitle = toSingleLineText(readCurrentSelectionText(), titleFallback);
        const pathPart = firstUploadedCsharpRelativePath() || './code/你的文件.cs';
        const snippet = `{{cs:${pathPart}#cs:${kind}:${selectorTemplate}|${selectedTitle}}}\n`;
        insertBlockSnippet(snippet, `#cs:${kind}:${selectorTemplate}`);
    }

    function applyInsertAction(action) {
        const key = String(action || '').trim();
        if (!key) return;

        if (key === 'bold') {
            wrapSelection('**', '**', '加粗文本');
            return;
        }

        if (key === 'h1') {
            insertBlockSnippet('# 章节标题\n', '章节标题');
            return;
        }

        if (key === 'h2') {
            insertBlockSnippet('## 小节标题\n', '小节标题');
            return;
        }

        if (key === 'list') {
            insertBlockSnippet('- 项目 1\n- 项目 2\n', '项目 1');
            return;
        }

        if (key === 'quote') {
            insertBlockSnippet('> 这里是引用内容\n', '这里是引用内容');
            return;
        }

        if (key === 'ref') {
            const selectedTitle = toSingleLineText(readCurrentSelectionText(), '引用标题');
            insertBlockSnippet(`[${selectedTitle}](目标文档.md)\n`, '目标文档.md');
            return;
        }

        if (key === 'cs') {
            const selectedTitle = toSingleLineText(readCurrentSelectionText(), '代码片段标题');
            const pathPart = firstUploadedCsharpRelativePath() || './code/你的文件.cs';
            insertBlockSnippet(`{{cs:${pathPart}#cs:t:命名空间.类型名|${selectedTitle}}}\n`, '#cs:t:命名空间.类型名');
            return;
        }

        if (key === 'cs-method') {
            insertCsharpSelectorSnippet('m', '命名空间.类型名.方法名(int,string)', '方法片段标题');
            return;
        }

        if (key === 'cs-property') {
            insertCsharpSelectorSnippet('p', '命名空间.类型名.属性名', '属性片段标题');
            return;
        }

        if (key === 'cs-field') {
            insertCsharpSelectorSnippet('f', '命名空间.类型名.字段名', '字段片段标题');
            return;
        }

        if (key === 'cs-constant') {
            insertCsharpSelectorSnippet('c', '命名空间.类型名.常量名', '常量片段标题');
            return;
        }

        if (key === 'cs-enum') {
            insertCsharpSelectorSnippet('e', '命名空间.枚举类型.成员名', '枚举成员标题');
            return;
        }

        if (key === 'anim') {
            insertBlockSnippet('{{anim:anims/你的动画文件.cs}}\n', 'anims/你的动画文件.cs');
            return;
        }

        if (key === 'animcs-block') {
            insertBlockSnippet([
                '```animcs',
                'anims/demo-basic.cs',
                '```',
                ''
            ].join('\n'), 'anims/demo-basic.cs');
            return;
        }

        if (key === 'source-cs') {
            const sourcePath = firstUploadedCsharpRelativePath() || './code/你的文件.cs';
            insertBlockSnippet([
                'source_cs:',
                `  - ${sourcePath}`,
                ''
            ].join('\n'), sourcePath);
            return;
        }

        if (key === 'min-gate') {
            insertBlockSnippet([
                'min_c: 1',
                'min_t: 1',
                ''
            ].join('\n'), '1');
            return;
        }

        if (key === 'mermaid-flowchart') {
            setFlowchartModalOpen(true);
            return;
        }

        if (key === 'color-inline') {
            const colorName = preferredColorName();
            insertBlockSnippet(`{color:${colorName}}{这里是强调文本}\n`, colorName);
            return;
        }

        if (key === 'color-change-inline') {
            const colorName = preferredColorChangeName();
            insertBlockSnippet(`{colorChange:${colorName}}{这里是颜色动画文本}\n`, colorName);
            return;
        }

        if (key === 'quiz-tf') {
            const quizId = createQuizId('quiz-tf');
            const question = toSingleLineText(readCurrentSelectionText(), '这里填写判断题题干。');
            insertBlockSnippet([
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

        if (key === 'quiz-single') {
            const quizId = createQuizId('quiz-single');
            const question = toSingleLineText(readCurrentSelectionText(), '这里填写单选题题干。');
            insertBlockSnippet([
                '```quiz',
                'type: single',
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
                'answer: A',
                'explain: |',
                '  这里填写解析。',
                '```',
                ''
            ].join('\n'), '选项 A');
            return;
        }

        if (key === 'quiz-choice') {
            const quizId = createQuizId('quiz-choice');
            const question = toSingleLineText(readCurrentSelectionText(), '这里填写选择题题干。');
            insertBlockSnippet([
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
            const quizId = createQuizId('quiz-multi');
            const question = toSingleLineText(readCurrentSelectionText(), '这里填写多选题题干。');
            insertBlockSnippet([
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
    }

    async function copyText(value) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (_) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            let ok = false;
            try {
                ok = document.execCommand('copy');
            } catch (_) {
                ok = false;
            }
            textarea.remove();
            return ok;
        }
    }

    function exportDraftJson() {
        const payload = {
            version: 9,
            exportedAt: new Date().toISOString(),
            targetPath: state.targetPath,
            markdown: state.markdown,
            workerApiUrl: state.workerApiUrl,
            prTitle: state.prTitle,
            lastPrUrl: state.lastPrUrl,
            linkedPrNumber: String(state.linkedPrNumber || ''),
            myOpenPrs: Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [],
            uploadedImages: Array.isArray(state.uploadedImages) ? state.uploadedImages : [],
            uploadedMedia: Array.isArray(state.uploadedMedia) ? state.uploadedMedia : [],
            uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [],
            metadata: applyMetadataDefaults(state.metadata),
            previewImageNoticeEnabled: !!state.previewImageNoticeEnabled,
            isDirectPreview: !!state.isDirectPreview,
            explorerFilter: String(state.explorerFilter || ''),
            explorerFolders: ensureObject(state.explorerFolders),
            rightPanelTab: normalizeRightPanelTab(state.rightPanelTab),
            layout: {
                leftWidth: Number(state.layout && state.layout.leftWidth || 300),
                rightWidth: Number(state.layout && state.layout.rightWidth || 368)
            },
            openTabs: Array.isArray(state.openTabs) ? state.openTabs : [],
            draftFiles: ensureObject(state.draftFiles),
            fileBaselines: ensureObject(state.fileBaselines)
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `markdown-draft-${Date.now()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setStatus('草稿 JSON 已导出');
    }

    function defaultTemplate() {
        const m = applyMetadataDefaults(state.metadata);
        const sourcePath = firstUploadedCsharpRelativePath() || './code/你的文件.cs';
        const quizTfId = createQuizId('quiz-tf');
        const quizChoiceId = createQuizId('quiz-choice');
        return [
            '---',
            `title: ${m.title || '教程标题'}`,
            `author: ${m.author || '你的名字'}`,
            `topic: ${m.topic || 'article-contribution'}`,
            `description: ${m.description || '一句话说明本文内容'}`,
            `order: ${m.order || '100'}`,
            `difficulty: ${m.difficulty || 'beginner'}`,
            `time: ${m.time || '25分钟'}`,
            (m.prev_chapter ? `prev_chapter: ${m.prev_chapter}` : null),
            (m.next_chapter ? `next_chapter: ${m.next_chapter}` : null),
            'min_c: 1',
            'min_t: 1',
            'source_cs:',
            `  - ${sourcePath}`,
            'colors:',
            '  Mad: "#ff4d4f"',
            'colorChange:',
            '  rainbow:',
            '    - "#ff0000"',
            '    - "#00ff00"',
            '    - "#0000ff"',
            '---',
            '',
            '# 教程标题',
            '',
            '一句话说明本文读完后能做什么。',
            '',
            '## 标准 Markdown 示例',
            '',
            '### 基础排版',
            '',
            '- 无序列表项 A',
            '- 无序列表项 B',
            '1. 有序步骤 1',
            '2. 有序步骤 2',
            '> 这里是引用块。',
            '',
            '| 列1 | 列2 |',
            '| --- | --- |',
            '| A   | B   |',
            '',
            '### 链接与媒体',
            '',
            '[阅读上一篇](./上一篇.md)',
            '',
            '![图片示例](./images/demo.png)',
            '![视频示例](./media/demo.mp4)',
            '',
            '## C# 引用语法',
            '',
            '```csharp',
            '// 在本地 Clone 仓库后补全可运行 C# 示例',
            '```',
            '',
            `{{cs:${sourcePath}}}`,
            `{{cs:${sourcePath}#cs:t:命名空间.类型名|核心类型示例}}`,
            `{{cs:${sourcePath}#cs:m:命名空间.类型名.方法名(int,string)|核心方法示例}}`,
            `{{cs:${sourcePath}#cs:p:命名空间.类型名.属性名|属性示例}}`,
            `{{cs:${sourcePath}#cs:f:命名空间.类型名.字段名|字段示例}}`,
            `{{cs:${sourcePath}#cs:c:命名空间.类型名.常量名|常量示例}}`,
            `{{cs:${sourcePath}#cs:e:命名空间.枚举类型.成员名|枚举成员示例}}`,
            '',
            '## 动画与流程图',
            '',
            '{{anim:anims/demo-basic.cs}}',
            '',
            '```animcs',
            'anims/demo-basic.cs',
            '```',
            '',
            '```mermaid',
            'flowchart TD',
            '    Start[开始] --> Edit[编写]',
            '    Edit --> Verify[预览检查]',
            '    Verify --> Submit[提交 PR]',
            '```',
            '',
            '## Quiz 自测题',
            '',
            '```quiz',
            'type: tf',
            `id: ${quizTfId}`,
            'question: |',
            '  这里填写判断题题干。',
            'answer: true',
            'explain: |',
            '  这里填写解析。',
            '```',
            '',
            '```quiz',
            'type: choice',
            `id: ${quizChoiceId}`,
            'question: |',
            '  这里填写选择题题干。',
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
            '',
            '## 颜色文本',
            '',
            '{color:Mad}{这是单色强调文本}',
            '',
            '{colorChange:rainbow}{这是颜色动画文本}',
            '',
            '{color:primary}{这是内置主题色示例}',
            '',
            '## 小结',
            '',
            '总结本章关键结论，并说明下一步阅读建议。',
            ''
        ].filter(function (line) {
            return line !== null && typeof line !== 'undefined';
        }).join('\n');
    }

    function resetAll() {

        if (!window.confirm('确认清空当前 Markdown 草稿吗？')) return;
        state.markdown = '';
        if (dom.markdown) dom.markdown.value = '';
        syncActiveDraftFromEditor({ overrideDeleted: true });
        renderExplorerPanels();
        renderPreview();
        updateStats();
        persistState();
        setStatus('已清空 Markdown 草稿');
    }

    function init() {
        loadState();
        loadAuthSession();
        state.animBridgeEndpoint = normalizeAnimBridgeEndpoint(state.animBridgeEndpoint || readStoredAnimBridgeEndpoint() || ANIMCS_DEFAULT_BRIDGE_ENDPOINT) || ANIMCS_DEFAULT_BRIDGE_ENDPOINT;
        persistAnimBridgeEndpoint(state.animBridgeEndpoint);
        renderAnimBridgeStatusline();
        connectAnimBridge({ silent: true }).catch(function () {
            state.animBridgeConnected = false;
            renderAnimBridgeStatusline();
        });
        const consumedOauthHash = consumeOauthResultFromHash();
        const leftDocked = !!(dom.leftPanelModal && dom.leftPanelModal.classList.contains('studio-side-panel-modal--dock'));
        const rightDocked = !!(dom.rightPanelModal && dom.rightPanelModal.classList.contains('studio-side-panel-modal--dock'));
        state.rightPanelTab = normalizeRightPanelTab(state.rightPanelTab);
        if (!state.layout || typeof state.layout !== 'object') {
            state.layout = {
                leftWidth: 300,
                rightWidth: 368
            };
        }
        if (!state.explorerFolders || typeof state.explorerFolders !== 'object') {
            state.explorerFolders = {};
        }

        if (!setTargetPath(state.targetPath, true)) {
            setTargetPath('怎么贡献/新文章.md', true);
        }
        if (!getFileBaseline(state.targetPath)) {
            const knownCurrent = !!findKnownEntryByPath(state.targetPath);
            setFileBaseline(state.targetPath, {
                exists: knownCurrent,
                markdown: knownCurrent ? String(state.markdown || '') : '',
                metadata: cloneMetadata(state.metadata)
            });
        }
        renderUploadedImages();
        renderUploadedMedia();
        renderUploadedCsharpFiles();
        refreshCsharpSymbolOptions();
        updatePrChainSelectOptions();
        updatePreviewImageNoticeToggleUi();
        renderMetadataFormFromState();
        renderColorListsFromState();
        ensureFlowchartStateInitialized();
        syncFlowchartGeneratedSource(false);
        renderFlowchartDrawer();
        bindWorkspaceResizers();
        window.addEventListener('resize', applyWorkspaceLayout);
        if (dom.explorerFilter) {
            dom.explorerFilter.value = state.explorerFilter;
        }
        ensureOpenTab(state.targetPath);
        renderExplorerPanels();
        setDirectPreviewMode(!!state.isDirectPreview, true);

        if (dom.markdown) {
            dom.markdown.value = state.markdown;
            dom.markdown.addEventListener('input', function () {
                state.markdown = String(dom.markdown.value || '');
                updateStats();
                renderPreview();
                syncMetadataFromMarkdownEditor(state.markdown);
                syncActiveDraftFromEditor();
                renderExplorerPanels();
                scheduleSave();
            });

            dom.markdown.addEventListener('keydown', function (event) {
                handleTabIndent(event);
            });

            dom.markdown.addEventListener('paste', async function (event) {
                const clipboardData = event && event.clipboardData ? event.clipboardData : null;
                if (!clipboardData) return;

                const htmlText = String(clipboardData.getData('text/html') || '').trim();
                if (htmlText) {
                    event.preventDefault();

                    try {
                        const markdownText = normalizePastedHtmlToMarkdown(htmlText);
                        if (!markdownText) {
                            setStatus('粘贴内容中未识别到可转换的文本结构');
                            return;
                        }

                        const snippet = `${markdownText}\n`;
                        insertTextAtSelection(snippet);
                        const formatted = formatMarkdownForStudio(state.markdown);
                        updateEditorContent(formatted);
                        setStatus('已将 HTML 粘贴内容转换为 Markdown');
                    } catch (err) {
                        setStatus(`HTML 粘贴转换失败：${err && err.message ? err.message : String(err)}`);
                    }
                    return;
                }

                const imageFiles = collectPastedImageFiles(clipboardData);
                if (imageFiles.length > 0) {
                    event.preventDefault();

                    try {
                        await insertImagesFromFiles(imageFiles);
                    } catch (err) {
                        setStatus(`粘贴图片失败：${err && err.message ? err.message : String(err)}`);
                    }
                    return;
                }

                const mediaFiles = collectPastedMediaFiles(clipboardData);
                if (mediaFiles.length === 0) return;

                event.preventDefault();

                try {
                    await insertMediaFromFiles(mediaFiles);
                } catch (err) {
                    setStatus(`粘贴视频失败：${err && err.message ? err.message : String(err)}`);
                }
            });
        }

        if (dom.openExplorer && !leftDocked) {
            dom.openExplorer.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('left');
                setSidePanelModalOpen('left', nextOpen);
                setStatus(nextOpen ? 'Explorer 面板已打开' : 'Explorer 面板已关闭');
            });
        }

        if (dom.openPublish && !rightDocked) {
            dom.openPublish.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('right');
                setSidePanelModalOpen('right', nextOpen);
                setStatus(nextOpen ? 'Publish 面板已打开' : 'Publish 面板已关闭');
            });
        }

        if (dom.openMarkdownGuide) {
            dom.openMarkdownGuide.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('guide');
                setSidePanelModalOpen('guide', nextOpen);
                setStatus(nextOpen ? '项目 Markdown 教程已打开' : '项目 Markdown 教程已关闭');
            });
        }

        if (dom.markdownGuideClose) {
            dom.markdownGuideClose.addEventListener('click', function () {
                setSidePanelModalOpen('guide', false);
                setStatus('项目 Markdown 教程已关闭');
            });
        }

        if (dom.markdownGuideModal) {
            dom.markdownGuideModal.addEventListener('click', function (event) {
                if (event.target !== dom.markdownGuideModal) return;
                setSidePanelModalOpen('guide', false);
                setStatus('项目 Markdown 教程已关闭');
            });
        }

        if (dom.runDraftCheck) {
            dom.runDraftCheck.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('draft');
                if (!nextOpen) {
                    setSidePanelModalOpen('draft', false);
                    setStatus('已关闭草稿自检结果');
                    return;
                }
                runDraftCheck();
            });
        }

        if (dom.draftCheckClose) {
            dom.draftCheckClose.addEventListener('click', function () {
                setSidePanelModalOpen('draft', false);
                setStatus('已关闭草稿自检结果');
            });
        }

        if (dom.draftCheckModal) {
            dom.draftCheckModal.addEventListener('click', function (event) {
                if (event.target !== dom.draftCheckModal) return;
                setSidePanelModalOpen('draft', false);
                setStatus('已关闭草稿自检结果');
            });
        }

        if (dom.prAssetActionClearNew) {
            dom.prAssetActionClearNew.addEventListener('click', function () {
                closePrAssetDecisionModal({ action: 'new-pr' });
            });
        }

        if (dom.prAssetActionContinuePr) {
            dom.prAssetActionContinuePr.addEventListener('click', function () {
                setPrAssetDecisionStage('continue');
                setStatus('请选择要继续提交的 PR');
            });
        }

        if (dom.prAssetActionCancel) {
            dom.prAssetActionCancel.addEventListener('click', function () {
                closePrAssetDecisionModal({ action: 'cancel' });
                setStatus('已取消提交，本地改动已保留');
            });
        }

        if (dom.prAssetContinueSelect) {
            dom.prAssetContinueSelect.addEventListener('change', function () {
                const selected = String(dom.prAssetContinueSelect.value || '').trim();
                if (dom.prAssetContinueSubmit) {
                    dom.prAssetContinueSubmit.disabled = !selected;
                }
                if (selected) {
                    setPrAssetContinueHint(`已选择 PR #${selected}，可继续提交。`, false);
                } else {
                    setPrAssetContinueHint('请先选择一个未关闭 PR，再继续提交。', true);
                }
            });
        }

        if (dom.prAssetContinueRefresh) {
            dom.prAssetContinueRefresh.addEventListener('click', async function () {
                const loaded = await loadMyOpenPrs();
                refreshPrAssetContinueSelectOptions(String(state.linkedPrNumber || '').trim());
                if (loaded) {
                    setStatus('请选择要继续提交的 PR');
                }
            });
        }

        if (dom.prAssetContinueBack) {
            dom.prAssetContinueBack.addEventListener('click', function () {
                setPrAssetDecisionStage('choice');
                setStatus('已返回提交流程选择');
            });
        }

        if (dom.prAssetContinueSubmit) {
            dom.prAssetContinueSubmit.addEventListener('click', function () {
                const selected = String(dom.prAssetContinueSelect ? dom.prAssetContinueSelect.value : '').trim();
                if (!selected) {
                    setPrAssetContinueHint('请先选择一个未关闭 PR，再继续提交。', true);
                    setStatus('请先选择一个未关闭 PR');
                    return;
                }
                closePrAssetDecisionModal({ action: 'continue', prNumber: selected });
            });
        }

        if (dom.prAssetDecisionClose) {
            dom.prAssetDecisionClose.addEventListener('click', function () {
                closePrAssetDecisionModal({ action: 'cancel' });
                setStatus('已取消提交，本地改动已保留');
            });
        }

        if (dom.prAssetDecisionModal) {
            dom.prAssetDecisionModal.addEventListener('click', function (event) {
                if (event.target !== dom.prAssetDecisionModal) return;
                closePrAssetDecisionModal({ action: 'cancel' });
                setStatus('已取消提交，本地改动已保留');
            });
        }

        if (dom.leftPanelClose && !leftDocked) {
            dom.leftPanelClose.addEventListener('click', function () {
                setSidePanelModalOpen('left', false);
                setStatus('Explorer 面板已关闭');
            });
        }

        if (dom.rightPanelClose && !rightDocked) {
            dom.rightPanelClose.addEventListener('click', function () {
                setSidePanelModalOpen('right', false);
                setStatus('Publish 面板已关闭');
            });
        }

        if (dom.leftPanelModal && !leftDocked) {
            dom.leftPanelModal.addEventListener('click', function (event) {
                if (event.target !== dom.leftPanelModal) return;
                setSidePanelModalOpen('left', false);
                setStatus('Explorer 面板已关闭');
            });
        }

        if (dom.rightPanelModal && !rightDocked) {
            dom.rightPanelModal.addEventListener('click', function (event) {
                if (event.target !== dom.rightPanelModal) return;
                setSidePanelModalOpen('right', false);
                setStatus('Publish 面板已关闭');
            });
        }

        if (dom.flowchartToggle) {
            dom.flowchartToggle.addEventListener('click', function () {
                setFlowchartModalOpen(!state.flowchartDrawer.open);
                if (state.flowchartDrawer.open) {
                    setStatus('流程图工作台弹窗已打开');
                }
            });
        }

        if (dom.flowchartModalClose) {
            dom.flowchartModalClose.addEventListener('click', function () {
                setFlowchartModalOpen(false);
                setStatus('流程图工作台弹窗已关闭');
            });
        }

        if (dom.flowchartModal) {
            dom.flowchartModal.addEventListener('click', function (event) {
                if (event.target !== dom.flowchartModal) return;
                setFlowchartModalOpen(false);
                setStatus('流程图工作台弹窗已关闭');
            });
        }

        if (dom.flowchartModeVisual) {
            dom.flowchartModeVisual.addEventListener('click', function () {
                setFlowchartMode('visual');
                renderFlowchartDrawer();
            });
        }

        if (dom.flowchartModeSource) {
            dom.flowchartModeSource.addEventListener('click', function () {
                setFlowchartMode('source');
                renderFlowchartDrawer();
            });
        }

        if (dom.flowchartRebind) {
            dom.flowchartRebind.addEventListener('click', function () {
                const ok = bindFlowchartAtCursor({ createIfMissing: false });
                if (ok) {
                    setStatus('已按光标位置重新绑定流程图');
                } else {
                    setStatus('当前光标未命中 Mermaid 代码块');
                }
            });
        }

        if (dom.flowchartBindNew) {
            dom.flowchartBindNew.addEventListener('click', function () {
                const ok = bindFlowchartAtCursor({ createIfMissing: true });
                if (ok) {
                    setStatus('已新建并绑定 Mermaid 代码块');
                } else {
                    setStatus('新建流程图失败');
                }
            });
        }

        if (dom.flowchartRealtimeToggle) {
            dom.flowchartRealtimeToggle.addEventListener('click', function () {
                state.flowchartDrawer.realtimeEnabled = !state.flowchartDrawer.realtimeEnabled;
                updateFlowchartRealtimeToggleUi();
                if (state.flowchartDrawer.realtimeEnabled) {
                    scheduleFlowchartRealtimeApply();
                } else if (flowchartRealtimeTimer) {
                    clearTimeout(flowchartRealtimeTimer);
                    flowchartRealtimeTimer = 0;
                }
                setStatus(state.flowchartDrawer.realtimeEnabled ? '已开启流程图实时写入' : '已暂停流程图实时写入');
            });
        }

        if (dom.flowchartDirection) {
            dom.flowchartDirection.addEventListener('change', function () {
                ensureFlowchartStateInitialized();
                state.flowchartDrawer.model.direction = dom.flowchartDirection.value === 'LR' ? 'LR' : 'TD';
                syncFlowchartGeneratedSource(true);
            });
        }

        if (dom.flowchartAddNode) {
            dom.flowchartAddNode.addEventListener('click', addFlowchartNode);
        }

        if (dom.flowchartAddEdge) {
            dom.flowchartAddEdge.addEventListener('click', addFlowchartEdge);
        }

        if (dom.flowchartCopySource) {
            dom.flowchartCopySource.addEventListener('click', async function () {
                const text = state.flowchartDrawer.generatedSource || '';
                const ok = await copyText(text);
                setStatus(ok ? '已复制流程图源码' : '流程图源码复制失败');
            });
        }

        if (dom.flowchartApply) {
            dom.flowchartApply.addEventListener('click', function () {
                const source = state.flowchartDrawer.generatedSource || buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
                applyFlowchartSourceToMarkdown(source, '已应用流程图到当前块');
            });
        }

        if (dom.flowchartSourceEditor) {
            dom.flowchartSourceEditor.addEventListener('input', function () {
                state.flowchartDrawer.sourceDraft = String(dom.flowchartSourceEditor.value || '');
            });
        }

        if (dom.flowchartSourceApply) {
            dom.flowchartSourceApply.addEventListener('click', function () {
                applyFlowchartSourceToMarkdown(state.flowchartDrawer.sourceDraft, '已应用源码模式流程图');
            });
        }

        if (dom.flowchartTryVisual) {
            dom.flowchartTryVisual.addEventListener('click', function () {
                const parsed = parseMermaidFlowchartToModel(state.flowchartDrawer.sourceDraft);
                if (!parsed.ok) {
                    setStatus(`当前源码超出可视化支持范围：${parsed.message || '请继续使用源码模式'}`);
                    setFlowchartMode('source');
                    renderFlowchartDrawer();
                    return;
                }

                state.flowchartDrawer.model = cloneFlowchartModel(parsed.model);
                state.flowchartDrawer.nextNodeSeq = Math.max(Number(parsed.nextNodeSeq || 1), Number(state.flowchartDrawer.nextNodeSeq || 1));
                state.flowchartDrawer.generatedSource = buildMermaidFlowchartFromModel(state.flowchartDrawer.model);
                state.flowchartDrawer.parseStatus = 'ok';
                setFlowchartMode('visual');
                renderFlowchartDrawer();
                setStatus('已切换回可视化流程图模式');
            });
        }

        if (dom.flowchartSourceReset) {
            dom.flowchartSourceReset.addEventListener('click', function () {
                state.flowchartDrawer.sourceDraft = state.flowchartDrawer.generatedSource || '';
                renderFlowchartDrawer();
                setStatus('已放弃源码模式的临时修改');
            });
        }

        if (dom.prWorkerUrl) {
            dom.prWorkerUrl.value = state.workerApiUrl;

            dom.prWorkerUrl.addEventListener('change', function () {
                state.workerApiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl.value);
                dom.prWorkerUrl.value = state.workerApiUrl;
                scheduleSave();
                setStatus('Worker API 地址已更新');
                if (state.authToken) {
                    verifyAuthSession();
                }
            });

            dom.prWorkerUrl.addEventListener('blur', function () {
                state.workerApiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl.value);
                dom.prWorkerUrl.value = state.workerApiUrl;
            });
        }

        if (dom.prTitle) {
            dom.prTitle.value = state.prTitle;
            dom.prTitle.placeholder = defaultPrTitle();

            dom.prTitle.addEventListener('input', function () {
                state.prTitle = String(dom.prTitle.value || '');
                scheduleSave();
            });
        }

        if (dom.prChainSelect) {
            dom.prChainSelect.value = String(state.linkedPrNumber || '');
            dom.prChainSelect.addEventListener('change', function () {
                state.linkedPrNumber = String(dom.prChainSelect.value || '').trim();
                scheduleSave();
                if (state.linkedPrNumber) {
                    setStatus(`将继续提交到 PR #${state.linkedPrNumber}`);
                } else {
                    setStatus('已切换为创建新 PR');
                }
            });
        }

        if (dom.refreshMyPrs) {
            dom.refreshMyPrs.addEventListener('click', loadMyOpenPrs);
        }

        if (dom.togglePreviewImageNotice) {
            dom.togglePreviewImageNotice.addEventListener('click', function () {
                state.previewImageNoticeEnabled = !state.previewImageNoticeEnabled;
                updatePreviewImageNoticeToggleUi();
                scheduleSave();
                setStatus(state.previewImageNoticeEnabled ? '已开启预览图片提示' : '已关闭预览图片提示');
            });
        }

        if (dom.assetUpload) {
            dom.assetUpload.addEventListener('change', async function () {
                try {
                    await insertAssetsFromUpload(dom.assetUpload.files);
                } catch (err) {
                    setStatus(`上传附件失败：${err && err.message ? err.message : String(err)}`);
                } finally {
                    dom.assetUpload.value = '';
                }
            });
        }

        if (dom.imageUpload) {
            dom.imageUpload.addEventListener('change', async function () {
                try {
                    await insertImagesFromFiles(dom.imageUpload.files);
                } catch (err) {
                    setStatus(`插入图片失败：${err && err.message ? err.message : String(err)}`);
                } finally {
                    dom.imageUpload.value = '';
                }
            });
        }

        if (dom.mediaUpload) {
            dom.mediaUpload.addEventListener('change', async function () {
                try {
                    await insertMediaFromFiles(dom.mediaUpload.files);
                } catch (err) {
                    setStatus(`插入视频失败：${err && err.message ? err.message : String(err)}`);
                } finally {
                    dom.mediaUpload.value = '';
                }
            });
        }

        if (dom.csharpUpload) {
            dom.csharpUpload.addEventListener('change', async function () {
                try {
                    await insertCsharpFilesFromUpload(dom.csharpUpload.files);
                } catch (err) {
                    setStatus(`插入 C# 文件失败：${err && err.message ? err.message : String(err)}`);
                } finally {
                    dom.csharpUpload.value = '';
                }
            });
        }

        if (dom.csharpInsertSymbol) {
            dom.csharpInsertSymbol.addEventListener('click', function () {
                if (!dom.csharpSymbolSelect) return;
                const selected = String(dom.csharpSymbolSelect.value || '').trim();
                if (!selected) {
                    setStatus('请先选择一个 C# 符号');
                    return;
                }

                const found = state.csharpSymbolEntries.find(function (entry) {
                    return entry.value === selected;
                });
                if (!found) {
                    setStatus('未找到对应 C# 符号');
                    return;
                }

                const selectorPart = found.selectorKind && found.selector
                    ? `#cs:${found.selectorKind}:${found.selector}`
                    : '';
                const snippet = `{{cs:${found.path}${selectorPart}}}\n`;
                insertBlockSnippet(snippet, found.path);
                setStatus('已插入 C# 符号引用');
            });
        }

        if (dom.csharpEditorText) {
            dom.csharpEditorText.addEventListener('input', function () {
                state.csharpEditorDraft = String(dom.csharpEditorText.value || '').replace(/\r\n/g, '\n');
                renderCsharpEditorPreviewHighlight();
                scheduleAnimDraftCompile({ immediate: false });
            });
        }

        if (dom.csharpBridgeSave) {
            dom.csharpBridgeSave.addEventListener('click', async function () {
                const endpoint = normalizeAnimBridgeEndpoint(dom.csharpBridgeEndpoint ? dom.csharpBridgeEndpoint.value : state.animBridgeEndpoint);
                if (!endpoint) {
                    setStatus('AnimBridge 地址无效，请输入 http://127.0.0.1:5078 形式地址');
                    renderAnimBridgeStatusline();
                    return;
                }

                state.animBridgeEndpoint = endpoint;
                persistAnimBridgeEndpoint(endpoint);
                const connectedEndpoint = await connectAnimBridge({ preferredEndpoint: endpoint, silent: true });
                if (connectedEndpoint) {
                    setStatus(`AnimBridge 已连接：${connectedEndpoint}`);
                    scheduleAnimDraftCompile({ immediate: true });
                } else {
                    setStatus(`AnimBridge 连接失败：${endpoint}`);
                }
            });
        }

        if (dom.csharpBridgeReset) {
            dom.csharpBridgeReset.addEventListener('click', async function () {
                state.animBridgeEndpoint = ANIMCS_DEFAULT_BRIDGE_ENDPOINT;
                persistAnimBridgeEndpoint(state.animBridgeEndpoint);
                renderAnimBridgeStatusline();
                const connectedEndpoint = await connectAnimBridge({ preferredEndpoint: ANIMCS_DEFAULT_BRIDGE_ENDPOINT, silent: true });
                if (connectedEndpoint) {
                    setStatus(`AnimBridge 已恢复默认并连接：${connectedEndpoint}`);
                    scheduleAnimDraftCompile({ immediate: true });
                } else {
                    setStatus('AnimBridge 默认地址不可用，请确认桥接服务已启动');
                }
            });
        }

        if (dom.csharpBridgeEndpoint) {
            dom.csharpBridgeEndpoint.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (dom.csharpBridgeSave) {
                    dom.csharpBridgeSave.click();
                }
            });
        }

        if (dom.csharpEditorSave) {
            dom.csharpEditorSave.addEventListener('click', async function () {
                try {
                    await saveCsharpEditorModalChanges();
                } catch (err) {
                    setStatus(`保存 C# 编辑失败：${err && err.message ? err.message : String(err)}`);
                }
            });
        }

        if (dom.csharpEditorCancel) {
            dom.csharpEditorCancel.addEventListener('click', function () {
                closeCsharpEditorModal();
                setStatus('已取消 C# 编辑');
            });
        }

        if (dom.csharpEditorClose) {
            dom.csharpEditorClose.addEventListener('click', function () {
                closeCsharpEditorModal();
                setStatus('已取消 C# 编辑');
            });
        }

        if (dom.csharpEditorModal) {
            dom.csharpEditorModal.addEventListener('click', function (event) {
                if (event.target !== dom.csharpEditorModal) return;
                closeCsharpEditorModal();
                setStatus('已取消 C# 编辑');
            });
        }

        if (dom.insertImage) {
            dom.insertImage.addEventListener('click', function () {
                const uploadInput = dom.assetUpload || dom.imageUpload;
                if (!uploadInput) {
                    setStatus('当前页面未找到上传控件');
                    return;
                }
                uploadInput.click();
            });
        }

        updatePrLink(state.lastPrUrl);
        updateAuthUi();

        if (dom.targetPath) {
            dom.targetPath.addEventListener('change', function () {
                const changed = setTargetPath(dom.targetPath.value, true);
                if (!changed) return;
                syncActiveDraftFromEditor({ overrideDeleted: true });
                renderExplorerPanels();
                scheduleSave();
                setStatus('目标路径已更新');
            });

            dom.targetPath.addEventListener('blur', function () {
                setTargetPath(dom.targetPath.value, true);
            });
        }

        if (dom.filename) {
            dom.filename.addEventListener('change', applyFilename);
            dom.filename.addEventListener('blur', applyFilename);
            dom.filename.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    applyFilename();
                }
            });
        }

        if (dom.existingSelect) {
            dom.existingSelect.addEventListener('change', function () {
                if (!dom.existingSelect.value) return;
                setTargetPath(dom.existingSelect.value, true);
                setStatus('已选择已有文章路径，可点击“载入文章”读取内容');
            });
        }

        if (dom.categorySelect) {
            dom.categorySelect.addEventListener('change', function () {
                refreshHierarchySelectors('');
                setStatus('已切换分类筛选');
            });
        }

        if (dom.topicSelect) {
            dom.topicSelect.addEventListener('change', function () {
                refreshHierarchySelectors('');
                setStatus('已切换 Topic 筛选');
            });
        }

        if (dom.fileSelect) {
            dom.fileSelect.addEventListener('change', function () {
                const value = String(dom.fileSelect.value || '').trim();
                if (!value) return;
                openPathFromExplorer(value, '层级导航');
            });
        }

        if (dom.createDirectory) {
            dom.createDirectory.addEventListener('click', function () {
                createDirectoryAndSwitch();
            });
        }

        if (dom.newDirectoryName) {
            dom.newDirectoryName.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                createDirectoryAndSwitch();
            });
        }

        if (dom.loadExisting) {
            dom.loadExisting.addEventListener('click', function () {
                if (!dom.existingSelect || !dom.existingSelect.value) {
                    setStatus('请先在“已有文章”中选择一个 Markdown 文件');
                    return;
                }

                openPathFromExplorer(dom.existingSelect.value, '目录选择');
            });
        }

        if (dom.loadPath) {
            dom.loadPath.addEventListener('click', function () {
                if (!dom.targetPath || !dom.targetPath.value.trim()) {
                    setStatus('请先填写目标路径');
                    return;
                }

                openPathFromExplorer(dom.targetPath.value, '路径输入');
            });
        }

        if (dom.authLogin) {
            dom.authLogin.addEventListener('click', startGithubLogin);
        }

        if (dom.authLogout) {
            dom.authLogout.addEventListener('click', logoutGithub);
        }

        if (dom.submitPr) {
            dom.submitPr.addEventListener('click', submitPullRequest);
        }
        if (dom.copyMarkdown) {
            dom.copyMarkdown.addEventListener('click', async function () {
                const ok = await copyText(String(state.markdown || ''));
                setStatus(ok ? '已复制 Markdown' : '复制失败，请手动复制');
            });
        }

        if (dom.importJson) {
            dom.importJson.addEventListener('click', function () {
                if (!dom.importFile) {
                    setStatus('未找到导入控件');
                    return;
                }
                dom.importFile.click();
            });
        }

        if (dom.importFile) {
            dom.importFile.addEventListener('change', async function () {
                const file = dom.importFile.files && dom.importFile.files[0] ? dom.importFile.files[0] : null;
                try {
                    await importDraftJson(file);
                } catch (err) {
                    setStatus(`导入草稿失败：${err && err.message ? err.message : String(err)}`);
                } finally {
                    dom.importFile.value = '';
                }
            });
        }

        if (dom.formatMarkdown) {
            dom.formatMarkdown.addEventListener('click', function () {
                const formatted = formatMarkdownForStudio(state.markdown);
                updateEditorContent(formatted);
                setStatus('已完成 Markdown 快速格式化');
            });
        }

        if (dom.exportJson) {
            dom.exportJson.addEventListener('click', exportDraftJson);
        }

        if (dom.reset) {
            dom.reset.addEventListener('click', resetAll);
        }

        if (dom.clearAssets) {
            dom.clearAssets.addEventListener('click', function () {
                if (!hasUploadedAssets()) {
                    setStatus('当前没有可清空的已上传附件');
                    return;
                }
                if (!window.confirm('确认清空所有已上传图片与 C# 文件吗？')) {
                    return;
                }
                clearUploadedAssets({ reason: '手动清理' });
            });
        }

        if (dom.insertTemplate) {
            dom.insertTemplate.addEventListener('click', function () {
                if (state.markdown && !window.confirm('当前已有内容，确认覆盖为模板吗？')) {
                    return;
                }

                state.markdown = defaultTemplate();
                if (dom.markdown) dom.markdown.value = state.markdown;
                syncMetadataFromMarkdownEditor(state.markdown);
                syncActiveDraftFromEditor({ overrideDeleted: true });
                renderExplorerPanels();
                updateStats();
                renderPreview();
                persistState();
                setStatus('已插入 Markdown 教程模板');
            });
        }

        const metaInputs = [
            dom.metaTitle,
            dom.metaAuthor,
            dom.metaTopic,
            dom.metaDescription,
            dom.metaOrder,
            dom.metaDifficulty,
            dom.metaTime,
            dom.metaPrevChapter,
            dom.metaNextChapter,
            dom.metaMinC,
            dom.metaMinT
        ].filter(Boolean);
        metaInputs.forEach(function (input) {
            input.addEventListener('change', function () {
                updateMetadataFromForm();
            });
        });

        if (dom.colorAdd) {
            dom.colorAdd.addEventListener('click', function () {
                const key = String(dom.colorName ? dom.colorName.value : '').trim();
                const value = String(dom.colorValue ? dom.colorValue.value : '').trim();
                if (!key || !value) {
                    setStatus('请先填写颜色名称和值');
                    return;
                }

                state.metadata.colors = ensureObject(state.metadata.colors);
                state.metadata.colors[key] = value;
                if (dom.colorName) dom.colorName.value = '';
                if (dom.colorValue) dom.colorValue.value = '';
                renderColorListsFromState();
                applyMetadataToMarkdownAndRefresh(`已添加颜色：${key}`);
            });
        }

        if (dom.colorChangeAdd) {
            dom.colorChangeAdd.addEventListener('click', function () {
                const key = String(dom.colorChangeName ? dom.colorChangeName.value : '').trim();
                const list = parseColorListInput(dom.colorChangeValues ? dom.colorChangeValues.value : '');
                if (!key || list.length === 0) {
                    setStatus('请填写颜色动画名称与颜色序列');
                    return;
                }

                state.metadata.colorChange = ensureObject(state.metadata.colorChange);
                state.metadata.colorChange[key] = list;
                if (dom.colorChangeName) dom.colorChangeName.value = '';
                if (dom.colorChangeValues) dom.colorChangeValues.value = '';
                renderColorListsFromState();
                applyMetadataToMarkdownAndRefresh(`已添加颜色动画：${key}`);
            });
        }

        if (dom.activityButtons && dom.activityButtons.length > 0) {
            dom.activityButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const rail = String(button.getAttribute('data-studio-rail') || '').trim().toLowerCase();
                    dom.activityButtons.forEach(function (other) {
                        other.classList.toggle('is-active', other === button);
                    });

                    if (rail === 'explorer' || rail === 'search') {
                        if (dom.explorerFilter) {
                            focusElementWithoutScroll(dom.explorerFilter);
                            if (rail === 'search' && typeof dom.explorerFilter.select === 'function') {
                                dom.explorerFilter.select();
                            }
                        }
                        return;
                    }

                    if (rail === 'preview') {
                        setDirectPreviewMode(!state.isDirectPreview, false);
                        return;
                    }

                    if (rail === 'publish') {
                        setRightPanelTab('publish');
                        if (dom.rightPanelModal) {
                            dom.rightPanelModal.scrollTop = 0;
                        }
                        if (dom.submitPr) {
                            focusElementWithoutScroll(dom.submitPr);
                        }
                        return;
                    }

                    if (rail === 'settings' && dom.openMarkdownGuide) {
                        dom.openMarkdownGuide.click();
                    }
                });
            });
        }

        if (dom.rightTabButtons && dom.rightTabButtons.length > 0) {
            dom.rightTabButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const tab = normalizeRightPanelTab(button.getAttribute('data-right-tab'));
                    setRightPanelTab(tab);
                });
            });
        }

        if (dom.commandProxyButtons && dom.commandProxyButtons.length > 0) {
            dom.commandProxyButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const targetId = String(button.getAttribute('data-proxy-target') || '').trim();
                    if (!targetId) return;
                    const target = document.getElementById(targetId);
                    if (!target) {
                        setStatus(`未找到命令目标：${targetId}`);
                        return;
                    }
                    target.click();
                });
            });
        }

        if (dom.explorerFilter) {
            dom.explorerFilter.addEventListener('input', function () {
                state.explorerFilter = String(dom.explorerFilter.value || '');
                renderExplorerTree();
                scheduleSave();
            });
        }

        if (dom.explorerRefresh) {
            dom.explorerRefresh.addEventListener('click', function () {
                loadExistingList();
                setStatus('已刷新文章导航');
            });
        }

        if (dom.explorerTree) {
            dom.explorerTree.addEventListener('click', function (event) {
                const folderTrigger = event.target && event.target.closest ? event.target.closest('[data-tree-folder]') : null;
                if (folderTrigger) {
                    const folderPath = normalizePath(folderTrigger.getAttribute('data-tree-folder') || '');
                    if (folderPath) {
                        toggleExplorerFolder(folderPath);
                    }
                    return;
                }

                const menuTrigger = event.target && event.target.closest ? event.target.closest('[data-tree-menu-path]') : null;
                if (menuTrigger) {
                    const menuPath = normalizePath(menuTrigger.getAttribute('data-tree-menu-path') || '');
                    const menuKind = normalizeExplorerEntryKind(menuTrigger.getAttribute('data-tree-menu-kind') || 'markdown');
                    const menuId = String(menuTrigger.getAttribute('data-tree-menu-id') || '').trim();
                    const menuKey = String(menuTrigger.getAttribute('data-tree-key') || '').trim();
                    const rect = menuTrigger.getBoundingClientRect();
                    openExplorerContextMenu(menuPath, rect.left, rect.bottom + 4, {
                        kind: menuKind,
                        resourceId: menuId,
                        treeKey: menuKey
                    });
                    return;
                }

                const openTrigger = event.target && event.target.closest ? event.target.closest('[data-tree-path]') : null;
                if (!openTrigger) return;
                const openPath = normalizePath(openTrigger.getAttribute('data-tree-path') || '');
                const openKind = normalizeExplorerEntryKind(openTrigger.getAttribute('data-tree-kind') || 'markdown');
                const openId = String(openTrigger.getAttribute('data-tree-id') || '').trim();
                if (!openPath) return;
                hideExplorerContextMenu();
                if (openKind === 'markdown') {
                    openPathFromExplorer(openPath, '文件树');
                    return;
                }
                setStatus(`已选中资源：${openPath}（右键可插入/预览/移除）`);
                if (openKind === 'csharp' && openId) {
                    openCsharpEditorModal(openId);
                }
            });

            dom.explorerTree.addEventListener('contextmenu', function (event) {
                const row = event.target && event.target.closest ? event.target.closest('[data-tree-path]') : null;
                if (!row) return;
                event.preventDefault();
                const path = normalizePath(row.getAttribute('data-tree-path') || '');
                const kind = normalizeExplorerEntryKind(row.getAttribute('data-tree-kind') || 'markdown');
                const resourceId = String(row.getAttribute('data-tree-id') || '').trim();
                const treeKey = String(row.getAttribute('data-tree-key') || '').trim();
                if (!path) return;
                openExplorerContextMenu(path, event.clientX, event.clientY, {
                    kind: kind,
                    resourceId: resourceId,
                    treeKey: treeKey
                });
            });
        }

        if (dom.stageList) {
            dom.stageList.addEventListener('click', function (event) {
                const row = event.target && event.target.closest ? event.target.closest('[data-path]') : null;
                if (!row) return;
                const path = normalizePath(row.getAttribute('data-path') || '');
                if (!path) return;
                openPathFromExplorer(path, '暂存区');
            });
        }

        if (dom.stageClear) {
            dom.stageClear.addEventListener('click', function () {
                const keys = Object.keys(ensureObject(state.draftFiles));
                if (keys.length <= 0) {
                    setStatus('当前暂无暂存改动');
                    return;
                }
                if (!window.confirm('确认清空全部暂存改动吗？')) return;
                state.draftFiles = {};
                renderExplorerPanels();
                scheduleSave();
                setStatus('已清空全部暂存改动');
            });
        }

        if (dom.explorerContextTrigger) {
            dom.explorerContextTrigger.addEventListener('click', function (event) {
                event.preventDefault();
                if (!state.explorerContext.open) {
                    const rect = dom.explorerContextTrigger.getBoundingClientRect();
                    openExplorerContextMenu(state.targetPath, rect.left, rect.bottom + 4, {
                        kind: 'markdown',
                        resourceId: '',
                        treeKey: `markdown:${normalizePath(state.targetPath || '')}`
                    });
                    return;
                }
                hideExplorerContextMenu();
            });
        }

        if (dom.explorerContextMenu) {
            dom.explorerContextMenu.addEventListener('click', function (event) {
                const actionButton = event.target && event.target.closest ? event.target.closest('[data-context-action]') : null;
                if (!actionButton) return;
                const action = String(actionButton.getAttribute('data-context-action') || '').trim();
                const context = {
                    path: normalizePath(state.explorerContext.path || state.targetPath || ''),
                    kind: normalizeExplorerEntryKind(state.explorerContext.kind || 'markdown'),
                    resourceId: String(state.explorerContext.resourceId || '').trim(),
                    treeKey: String(state.explorerContext.treeKey || '').trim()
                };
                hideExplorerContextMenu();
                handleExplorerContextAction(action, context);
            });
        }

        if (dom.syntaxButtons && dom.syntaxButtons.length > 0) {
            dom.syntaxButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const action = button.getAttribute('data-studio-insert') || '';
                    applyInsertAction(action);
                });
            });
        }

        if (dom.tabsStrip) {
            dom.tabsStrip.addEventListener('click', function (event) {
                const closeTrigger = event.target && event.target.closest ? event.target.closest('[data-tab-close-path]') : null;
                if (closeTrigger) {
                    event.preventDefault();
                    event.stopPropagation();
                    const closePath = normalizePath(closeTrigger.getAttribute('data-tab-close-path') || '');
                    if (!closePath) return;
                    closeTabByPath(closePath);
                    return;
                }

                const button = event.target && event.target.closest ? event.target.closest('[data-tab-path]') : null;
                if (!button) return;
                const path = normalizePath(button.getAttribute('data-tab-path') || '');
                if (!path) return;
                openPathFromExplorer(path, '标签页');
            });

            dom.tabsStrip.addEventListener('auxclick', function (event) {
                if (event.button !== 1) return;
                const button = event.target && event.target.closest ? event.target.closest('[data-tab-path]') : null;
                if (!button) return;
                event.preventDefault();
                const path = normalizePath(button.getAttribute('data-tab-path') || '');
                if (!path) return;
                closeTabByPath(path);
            });
        }

        if (dom.openViewerPreview) {
            dom.openViewerPreview.addEventListener('click', function () {
                const payload = buildViewerPreviewPayload();
                persistViewerPreviewPayload(payload);
                const url = buildViewerPreviewUrl(payload.targetPath, false);
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        }

        if (dom.toggleDirectPreview) {
            dom.toggleDirectPreview.addEventListener('click', function () {
                setDirectPreviewMode(!state.isDirectPreview, false);
            });
        }

        if (dom.toggleFullscreen) {
            dom.toggleFullscreen.addEventListener('click', function () {
                setFullscreenMode(!state.isFullscreen, false);
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && state.explorerContext.open) {
                event.preventDefault();
                hideExplorerContextMenu();
                return;
            }

            if (event.key === 'Escape' && isSidePanelModalOpen('asset')) {
                event.preventDefault();
                closePrAssetDecisionModal({ action: 'cancel' });
                setStatus('已取消提交，本地改动已保留');
                return;
            }

            if (event.key === 'Escape' && isSidePanelModalOpen('draft')) {
                event.preventDefault();
                setSidePanelModalOpen('draft', false);
                setStatus('已关闭草稿自检结果');
                return;
            }

            if (event.key === 'Escape' && isSidePanelModalOpen('guide')) {
                event.preventDefault();
                setSidePanelModalOpen('guide', false);
                setStatus('项目 Markdown 教程已关闭');
                return;
            }

            if (event.key === 'Escape' && isCsharpEditorModalOpen()) {
                event.preventDefault();
                closeCsharpEditorModal();
                setStatus('已取消 C# 编辑');
                return;
            }

            if (event.key === 'Escape' && state.flowchartDrawer.open) {
                event.preventDefault();
                setFlowchartModalOpen(false);
                setStatus('流程图工作台弹窗已关闭');
                return;
            }

            if (event.key === 'Escape' && isSidePanelModalOpen('left')) {
                event.preventDefault();
                setSidePanelModalOpen('left', false);
                setStatus('Explorer 面板已关闭');
                return;
            }

            if (event.key === 'Escape' && isSidePanelModalOpen('right')) {
                event.preventDefault();
                setSidePanelModalOpen('right', false);
                setStatus('Publish 面板已关闭');
                return;
            }

            if (event.key === 'Escape' && state.isFullscreen) {
                event.preventDefault();
                setFullscreenMode(false, false);
                return;
            }

            if (event.key === 'Escape' && state.isDirectPreview) {
                event.preventDefault();
                setDirectPreviewMode(false, false);
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                setFullscreenMode(!state.isFullscreen, false);
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'F' || event.key === 'f')) {
                event.preventDefault();
                const formatted = formatMarkdownForStudio(state.markdown);
                updateEditorContent(formatted);
                setStatus('已完成 Markdown 快速格式化');
            }
        });

        document.addEventListener('click', function (event) {
            if (!state.explorerContext.open || !dom.explorerContextMenu) return;
            if (dom.explorerContextMenu.contains(event.target)) return;
            if (dom.explorerContextTrigger && dom.explorerContextTrigger.contains(event.target)) return;
            hideExplorerContextMenu();
        });

        window.addEventListener('message', function (event) {
            if (event.origin !== window.location.origin) return;
            const data = event && event.data ? event.data : null;
            if (!data || data.type !== 'article-studio-preview-image-mapped') return;

            const payload = data.payload || {};
            showPreviewImageMappedNotice(payload.assetPath || '');
        });

        setFullscreenMode(false, true);
        setDirectPreviewMode(!!state.isDirectPreview, true);
        setRightPanelTab(state.rightPanelTab, { skipSave: true });
        applyWorkspaceLayout();
        setPrSubmitBusy(false);
        updateStats();
        renderPreview();
        renderExplorerPanels();
        loadExistingList();
        if (state.authToken) {
            verifyAuthSession();
            if ((state.myOpenPrs || []).length === 0) {
                loadMyOpenPrs();
            }
        }

        if (!consumedOauthHash) {
            setStatus('就绪：支持 viewer 同级预览、特殊语法快捷插入，并可 GitHub 登录后直接提交 PR。快捷键：Ctrl+Shift+Enter 切换全屏。');
        }
    }

    init();
})();
