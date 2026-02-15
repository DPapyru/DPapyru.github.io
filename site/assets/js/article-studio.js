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

    const dom = {
        markdown: document.getElementById('studio-markdown'),
        previewFrame: document.getElementById('studio-preview-frame'),
        openViewerPreview: document.getElementById('studio-open-viewer-preview'),
        openExplorer: document.getElementById('studio-open-explorer'),
        openPublish: document.getElementById('studio-open-publish'),
        leftPanelModal: document.getElementById('studio-left-panel-modal'),
        leftPanelClose: document.getElementById('studio-left-panel-close'),
        rightPanelModal: document.getElementById('studio-right-panel-modal'),
        rightPanelClose: document.getElementById('studio-right-panel-close'),
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
        currentPath: document.getElementById('studio-current-path'),
        activeTab: document.getElementById('studio-active-tab'),
        targetPath: document.getElementById('studio-target-path'),
        filename: document.getElementById('studio-filename'),
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
        preflightPending: false,
        previewImageNoticeEnabled: true,
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
    let lastPreviewImageNotice = '';
    let lastPreviewImageNoticeAt = 0;
    let metaSyncLock = false;
    let knownMarkdownEntries = [];

    function nowStamp() {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function setStatus(text) {
        if (!dom.status) return;
        dom.status.textContent = `[${nowStamp()}] ${text}`;
    }

    function normalizePath(input) {
        let value = String(input || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
        value = value.replace(/^site\/content\//i, '').replace(/^content\//i, '');
        value = value.replace(/\/{2,}/g, '/');
        return value;
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
        closeCsharpEditorModal();

        renderUploadedImages();
        renderUploadedMedia();
        refreshCsharpSymbolOptions();
        renderUploadedCsharpFiles();
        scheduleSave();

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

    function isCsharpEditorModalOpen() {
        return !!(dom.csharpEditorModal && dom.csharpEditorModal.classList.contains('active'));
    }

    function isFlowchartModalOpen() {
        return !!(dom.flowchartModal && dom.flowchartModal.classList.contains('active'));
    }

    function isSidePanelModalOpen(panel) {
        const key = panel === 'right' ? 'right' : 'left';
        const modal = key === 'right' ? dom.rightPanelModal : dom.leftPanelModal;
        return !!(modal && modal.classList.contains('active'));
    }

    function setSidePanelModalOpen(panel, open, options) {
        const key = panel === 'right' ? 'right' : 'left';
        const modal = key === 'right' ? dom.rightPanelModal : dom.leftPanelModal;
        const trigger = key === 'right' ? dom.openPublish : dom.openExplorer;
        const otherKey = key === 'right' ? 'left' : 'right';
        const shouldOpen = !!open;
        if (!modal) return;

        if (shouldOpen && isSidePanelModalOpen(otherKey)) {
            setSidePanelModalOpen(otherKey, false, { silent: true });
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

        const focusTarget = modal.querySelector('input, textarea, select, button');
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }
    }

    function syncModalBodyLock() {
        const shouldLock = isCsharpEditorModalOpen()
            || isFlowchartModalOpen()
            || isSidePanelModalOpen('left')
            || isSidePanelModalOpen('right');
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

    function closeCsharpEditorModal(options) {
        const keepDraft = !!(options && options.keepDraft);

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
                refreshCsharpSymbolOptions();
                renderUploadedCsharpFiles();
                scheduleSave();
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
        scheduleSave();

        if (insertedCount > 0) {
            setStatus(`已插入 ${insertedCount} 个 C# 文件`);
        }
    }

    async function loadMyOpenPrs() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        const authToken = String(state.authToken || '').trim();

        if (!apiUrl) {
            setStatus('请先填写 Worker API 地址');
            return;
        }

        if (!authToken) {
            setStatus('请先完成 GitHub 登录，再刷新未关闭 PR 列表');
            return;
        }

        const listUrl = myOpenPrsUrlFromApiUrl(apiUrl);
        if (!listUrl) {
            setStatus('Worker 地址无效，无法读取未关闭 PR 列表');
            return;
        }

        try {
            if (dom.refreshMyPrs) dom.refreshMyPrs.disabled = true;
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
        } catch (err) {
            setStatus(`读取未关闭 PR 失败：${err && err.message ? err.message : String(err)}`);
        } finally {
            if (dom.refreshMyPrs) dom.refreshMyPrs.disabled = false;
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

        if (dom.activeTab) {
            dom.activeTab.textContent = filename;
        }

        if (dom.currentPath) {
            dom.currentPath.textContent = `目标: ${state.targetPath}`;
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
            refreshHierarchySelectors(state.targetPath);

            updateChapterSelectOptions();
        } catch (err) {
            setStatus(`读取文章列表失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    async function loadMarkdownFromPath(path, sourceLabel) {
        let targetPath = '';
        try {
            targetPath = ensureSafeMarkdownPath(path);
        } catch (err) {
            setStatus(`载入失败：${err && err.message ? err.message : String(err)}`);
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

            state.markdown = String(text || '').replace(/\r\n/g, '\n');

            if (dom.markdown) {
                dom.markdown.value = state.markdown;
            }

            const changed = setTargetPath(targetPath, true);
            if (!changed) {
                throw new Error('目标路径校验失败');
            }
            renderPreview();
            updateStats();
            syncMetadataFromMarkdownEditor(state.markdown);
            persistState();

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

    async function submitPullRequest() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        const sharedKey = String(dom.prSharedKey ? dom.prSharedKey.value : '').trim();
        const titleInput = String(dom.prTitle ? dom.prTitle.value : '').trim();
        const linkedPrNumber = String(state.linkedPrNumber || '').trim();
        const authToken = String(state.authToken || '').trim();

        if (!apiUrl) {
            setStatus('请先填写 Worker API 地址');
            if (dom.prWorkerUrl) dom.prWorkerUrl.focus();
            return;
        }

        if (!authToken && !sharedKey) {
            setStatus('请先点击“GitHub 登录”，或填写兼容密钥');
            if (dom.authLogin) dom.authLogin.focus();
            return;
        }

        const hardPreflight = await runPreflightCheck({
            mode: 'hard',
            apiUrl: apiUrl,
            sharedKey: sharedKey,
            authToken: authToken,
            throwOnError: false
        });
        if (!hardPreflight.ok) {
            setStatus(`提交前复检失败，已阻止提交：${hardPreflight.error || '请稍后重试'}`);
            renderUploadedCsharpFiles();
            return;
        }

        const effectiveMarkdown = String(state.markdown || '');

        if (!effectiveMarkdown.trim()) {
            setStatus('当前 Markdown 内容为空，无法提交 PR');
            return;
        }

        state.workerApiUrl = apiUrl;
        state.prTitle = titleInput;
        if (dom.prWorkerUrl) dom.prWorkerUrl.value = apiUrl;
        scheduleSave();

        const payload = {
            targetPath: state.targetPath,
            markdown: String(state.markdown || ''),
            prTitle: titleInput || defaultPrTitle()
        };
        let imageExtraFiles = buildImageExtraFiles();
        let mediaExtraFiles = buildMediaExtraFiles();
        let csharpExtraFiles = buildCSharpExtraFiles();
        let extraFiles = imageExtraFiles.concat(mediaExtraFiles, csharpExtraFiles);

        if (!linkedPrNumber && extraFiles.length > 0) {
            const shouldClear = window.confirm(
                '当前将创建新 PR，但检测到已上传附件。\n' +
                '为避免重复提交同路径文件，是否先一键清空附件并继续提交？\n\n' +
                '确定：清空附件后继续创建新 PR（仅提交 Markdown）\n' +
                '取消：终止提交，改为继续到同一 PR 或手动清理附件'
            );

            if (!shouldClear) {
                setStatus('请选择“PR 链”继续到已有 PR，或先清空附件再创建新 PR');
                return;
            }

            clearUploadedAssets({ silent: true, reason: '新 PR 提交前自动清理' });
            imageExtraFiles = [];
            mediaExtraFiles = [];
            csharpExtraFiles = [];
            extraFiles = [];
            setStatus('已在新 PR 提交前清空附件，将继续提交 Markdown');
        }

        if (extraFiles.length > 0) {
            payload.extraFiles = extraFiles;
        }
        if (linkedPrNumber) {
            payload.existingPrNumber = linkedPrNumber;
        }
        const headers = {
            'content-type': 'application/json'
        };

        if (authToken) {
            headers.authorization = `Bearer ${authToken}`;
        } else {
            headers['x-studio-key'] = sharedKey;
        }

        setPrSubmitBusy(true);
        setStatus(linkedPrNumber
            ? `正在提交到 Worker 并追加到 PR #${linkedPrNumber}...`
            : '正在提交到 Worker 并创建 PR，请稍候...');

        try {
            const response = await fetch(apiUrl, {
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

            if (response.status === 401 && authToken) {
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
                const prNumberText = String(responseData.prNumber);
                state.linkedPrNumber = prNumberText;
                updatePrChainSelectOptions();
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

    function setFullscreenMode(enabled, silent) {
        state.isFullscreen = !!enabled;
        document.body.classList.toggle('article-studio-page--fullscreen', state.isFullscreen);

        if (dom.toggleFullscreen) {
            dom.toggleFullscreen.textContent = state.isFullscreen ? '退出专注模式 (Esc)' : '专注模式';
        }

        if (dom.titlebar) {
            dom.titlebar.textContent = state.isFullscreen
                ? 'article-studio · focus mode'
                : 'article-studio · modern writer mode';
        }

        if (state.isFullscreen && dom.markdown) {
            dom.markdown.focus();
        }

        if (!silent) {
            setStatus(state.isFullscreen ? '已进入专注模式（按 Esc 退出）' : '已退出专注模式');
        }
    }

    function updateStats() {
        if (!dom.stats) return;
        const text = String(state.markdown || '');
        const lines = text ? text.split(/\r?\n/).length : 0;
        const chars = text.length;
        dom.stats.textContent = `${lines} 行 · ${chars} 字`;
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
                previewImageNoticeEnabled: !!state.previewImageNoticeEnabled
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
        updateStats();
        renderPreview();
        scheduleSave();

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
        state.flowchartDrawer.open = !!open;
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

    function createQuizId(prefix) {
        const safePrefix = String(prefix || 'quiz').trim() || 'quiz';
        return `${safePrefix}-${Date.now().toString(36).slice(-6)}`;
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
            insertBlockSnippet(`{{cs:你的文件.cs#cs:t:命名空间.类型名|${selectedTitle}}}\n`, '你的文件.cs#cs:t:命名空间.类型名');
            return;
        }

        if (key === 'anim') {
            insertBlockSnippet('{{anim:anims/你的动画文件.cs}}\n', 'anims/你的动画文件.cs');
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
            previewImageNoticeEnabled: !!state.previewImageNoticeEnabled
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
        return [
            '---',
            `title: ${m.title || '教程标题'}`,
            `author: ${m.author || '你的名字'}`,
            `topic: ${m.topic || 'article-contribution'}`,
            `description: ${m.description || '一句话说明本文内容'}`,
            `order: ${m.order || '100'}`,
            `difficulty: ${m.difficulty || 'beginner'}`,
            `time: ${m.time || '25分钟'}`,
            (m.prev_chapter ? `prev_chapter: ${m.prev_chapter}` : '').trim(),
            (m.next_chapter ? `next_chapter: ${m.next_chapter}` : '').trim(),
            '---',
            '',
            '# 本章目标',
            '',
            '- 目标 1',
            '- 目标 2',
            '',
            '# 最小示例',
            '',
            '```csharp',
            '// 在本地 Clone 仓库后补全可运行 C# 示例',
            '```',
            '',
            '# 小结',
            '',
            '这里写本章总结。',
            ''
        ].filter(function (line) {
            return String(line || '').length > 0;
        }).join('\n');
    }

    function resetAll() {

        if (!window.confirm('确认清空当前 Markdown 草稿吗？')) return;
        state.markdown = '';
        if (dom.markdown) dom.markdown.value = '';
        renderPreview();
        updateStats();
        persistState();
        setStatus('已清空 Markdown 草稿');
    }

    function init() {
        loadState();
        loadAuthSession();
        const consumedOauthHash = consumeOauthResultFromHash();

        if (!setTargetPath(state.targetPath, true)) {
            setTargetPath('怎么贡献/新文章.md', true);
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

        if (dom.markdown) {
            dom.markdown.value = state.markdown;
            dom.markdown.addEventListener('input', function () {
                state.markdown = String(dom.markdown.value || '');
                updateStats();
                renderPreview();
                syncMetadataFromMarkdownEditor(state.markdown);
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

        if (dom.openExplorer) {
            dom.openExplorer.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('left');
                setSidePanelModalOpen('left', nextOpen);
                setStatus(nextOpen ? 'Explorer 面板已打开' : 'Explorer 面板已关闭');
            });
        }

        if (dom.openPublish) {
            dom.openPublish.addEventListener('click', function () {
                const nextOpen = !isSidePanelModalOpen('right');
                setSidePanelModalOpen('right', nextOpen);
                setStatus(nextOpen ? 'Publish 面板已打开' : 'Publish 面板已关闭');
            });
        }

        if (dom.leftPanelClose) {
            dom.leftPanelClose.addEventListener('click', function () {
                setSidePanelModalOpen('left', false);
                setStatus('Explorer 面板已关闭');
            });
        }

        if (dom.rightPanelClose) {
            dom.rightPanelClose.addEventListener('click', function () {
                setSidePanelModalOpen('right', false);
                setStatus('Publish 面板已关闭');
            });
        }

        if (dom.leftPanelModal) {
            dom.leftPanelModal.addEventListener('click', function (event) {
                if (event.target !== dom.leftPanelModal) return;
                setSidePanelModalOpen('left', false);
                setStatus('Explorer 面板已关闭');
            });
        }

        if (dom.rightPanelModal) {
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
                const changed = setTargetPath(value, true);
                if (!changed) return;
                scheduleSave();
                setStatus('已通过层级导航选择文章');
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

                loadMarkdownFromPath(dom.existingSelect.value, '目录选择');
            });
        }

        if (dom.loadPath) {
            dom.loadPath.addEventListener('click', function () {
                if (!dom.targetPath || !dom.targetPath.value.trim()) {
                    setStatus('请先填写目标路径');
                    return;
                }

                loadMarkdownFromPath(dom.targetPath.value, '路径输入');
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

        if (dom.syntaxButtons && dom.syntaxButtons.length > 0) {
            dom.syntaxButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    const action = button.getAttribute('data-studio-insert') || '';
                    applyInsertAction(action);
                });
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

        if (dom.toggleFullscreen) {
            dom.toggleFullscreen.addEventListener('click', function () {
                setFullscreenMode(!state.isFullscreen, false);
            });
        }

        document.addEventListener('keydown', function (event) {
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

        window.addEventListener('message', function (event) {
            if (event.origin !== window.location.origin) return;
            const data = event && event.data ? event.data : null;
            if (!data || data.type !== 'article-studio-preview-image-mapped') return;

            const payload = data.payload || {};
            showPreviewImageMappedNotice(payload.assetPath || '');
        });

        setFullscreenMode(false, true);
        setPrSubmitBusy(false);
        updateStats();
        renderPreview();
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
