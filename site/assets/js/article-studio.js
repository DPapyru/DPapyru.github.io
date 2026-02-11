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
    const MAX_CSHARP_FILE_SIZE = 200 * 1024;
    const MAX_CSHARP_COUNT = 5;

    const dom = {
        markdown: document.getElementById('studio-markdown'),
        previewFrame: document.getElementById('studio-preview-frame'),
        openViewerPreview: document.getElementById('studio-open-viewer-preview'),
        status: document.getElementById('studio-status'),
        stats: document.getElementById('studio-stats'),
        currentPath: document.getElementById('studio-current-path'),
        activeTab: document.getElementById('studio-active-tab'),
        targetPath: document.getElementById('studio-target-path'),
        filename: document.getElementById('studio-filename'),
        existingSelect: document.getElementById('studio-existing-select'),
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
        csharpUpload: document.getElementById('studio-csharp-upload'),
        csharpList: document.getElementById('studio-csharp-list'),
        csharpSymbolSelect: document.getElementById('studio-csharp-symbol-select'),
        csharpInsertSymbol: document.getElementById('studio-csharp-insert-symbol'),
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
        uploadedCsharpFiles: [],
        csharpSymbolEntries: [],
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
        isFullscreen: false
    };

    let saveTimer = 0;
    let previewSyncTimer = 0;
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

        const payload = {
            mode: mode,
            targetPath: ensureMarkdownPath(state.targetPath),
            markdown: String(state.markdown || ''),
            extraFiles: [
                ...buildImageExtraFiles(),
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

    function stripImageExt(name) {
        return String(name || '').replace(/\.[a-z0-9]+$/i, '');
    }

    function slugifyImageName(name) {
        const base = stripImageExt(name).trim().toLowerCase();
        const safe = base.replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
        return safe || `image-${Date.now().toString(36)}`;
    }

    function imageAssetPathFromTarget(targetPath, imageName) {
        const markdownPath = ensureMarkdownPath(targetPath || state.targetPath);
        const dir = getDirectoryFromPath(markdownPath);
        const safeImage = slugifyImageName(imageName);
        const uniqueSuffix = Math.random().toString(36).slice(2, 7);
        if (dir) {
            return `${dir}/imgs/${safeImage}-${uniqueSuffix}.png`;
        }

        return `imgs/${safeImage}-${uniqueSuffix}.png`;
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
        const alt = stripImageExt(item.name || 'image') || 'image';
        return `![${alt}](/site/content/${encodePathForUrl(item.assetPath || '')})`;
    }

    function imageInsertionText(item) {
        const md = imageMarkdownText(item);
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
                state.uploadedCsharpFiles = state.uploadedCsharpFiles.filter(function (it) {
                    return it.id !== item.id;
                });
                refreshCsharpSymbolOptions();
                renderUploadedCsharpFiles();
                scheduleSave();
                setStatus(`已移除 C# 文件：${item.name}`);
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

    async function insertAssetsFromUpload(fileList) {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const imageFiles = [];
        const csharpFiles = [];
        let skipped = 0;

        files.forEach(function (file) {
            if (!file) return;

            const name = String(file.name || '');
            const type = String(file.type || '').toLowerCase();
            const isImage = type.startsWith('image/') || /\.(?:png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(name);
            const isCsharp = /\.cs$/i.test(name) || type.indexOf('csharp') >= 0;

            if (isImage) {
                imageFiles.push(file);
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
        if (csharpFiles.length > 0) {
            await insertCsharpFilesFromUpload(csharpFiles);
        }

        if (imageFiles.length === 0 && csharpFiles.length === 0) {
            setStatus('未发现可上传的图片或 C# 文件');
            return;
        }

        if (skipped > 0) {
            setStatus(`已处理图片 ${imageFiles.length} 个、C# ${csharpFiles.length} 个，跳过 ${skipped} 个不支持文件`);
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
            if (!file || !String(file.type || '').startsWith('image/')) {
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

            const assetPath = imageAssetPathFromTarget(state.targetPath, file.name);
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

        if (dom.prTitle && !String(dom.prTitle.value || '').trim()) {
            dom.prTitle.placeholder = defaultPrTitle();
        }
    }

    function setTargetPath(nextPath, silent) {
        const previousPath = state.targetPath;
        state.targetPath = ensureMarkdownPath(nextPath);
        updateFileIdentity();
        updateChapterSelectOptions();

        if (previousPath !== state.targetPath) {
            schedulePreviewSync(true);
        }

        if (!silent) {
            setStatus(`目标路径已更新：${state.targetPath}`);
        }
    }

    function applyFilename() {
        if (!dom.filename) return;

        const filename = normalizeFilename(dom.filename.value);
        const directory = getDirectoryFromPath(state.targetPath);
        const nextPath = directory ? `${directory}/${filename}` : filename;
        setTargetPath(nextPath, true);
        scheduleSave();
        setStatus(`文件名已更新：${filename}`);
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
            const topics = category.topics || {};

            Object.keys(topics).forEach(function (topicKey) {
                const topic = topics[topicKey] || {};
                const files = Array.isArray(topic.files) ? topic.files : [];

                files.forEach(function (file) {
                    if (!file || typeof file !== 'object') return;
                    const path = ensureMarkdownPath(file.path || file.filename || '');
                    if (!/\.md$/i.test(path)) return;
                    if (seen.has(path)) return;

                    seen.add(path);
                    result.push({
                        path: path,
                        title: String(file.title || file.filename || path)
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

            dom.existingSelect.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '从站点目录选择文章...';
            dom.existingSelect.appendChild(defaultOption);

            entries.forEach(function (entry) {
                const option = document.createElement('option');
                option.value = entry.path;
                option.textContent = `${entry.path} · ${entry.title}`;
                dom.existingSelect.appendChild(option);
            });

            if (entries.some(function (entry) { return entry.path === state.targetPath; })) {
                dom.existingSelect.value = state.targetPath;
            }

            updateChapterSelectOptions();
        } catch (err) {
            setStatus(`读取文章列表失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    async function loadMarkdownFromPath(path, sourceLabel) {
        const targetPath = ensureMarkdownPath(path);

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

            setTargetPath(targetPath, true);
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
            uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [],
            metadata: applyMetadataDefaults(state.metadata)
        };

        const importedMarkdown = String(parsed.markdown || '');
        const importedImages = Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages : [];
        const importedCsharp = Array.isArray(parsed.uploadedCsharpFiles) ? parsed.uploadedCsharpFiles : [];
        const importedMetadata = applyMetadataDefaults(parsed.metadata || {});

        if (mode === 'merge') {
            state.markdown = [current.markdown.trim(), importedMarkdown.trim()].filter(Boolean).join('\n\n');
            state.uploadedImages = current.uploadedImages.concat(importedImages);
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
            state.uploadedCsharpFiles = importedCsharp;
            state.metadata = importedMetadata;
            state.targetPath = ensureMarkdownPath(parsed.targetPath || state.targetPath);
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
        const summary = `目标: ${parsed.targetPath || '(未指定)'}\n长度: ${String(parsed.markdown || '').length} 字\n图片: ${Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages.length : 0}\nC#: ${Array.isArray(parsed.uploadedCsharpFiles) ? parsed.uploadedCsharpFiles.length : 0}`;

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
        const imageExtraFiles = buildImageExtraFiles();
        const csharpExtraFiles = buildCSharpExtraFiles();
        const extraFiles = imageExtraFiles.concat(csharpExtraFiles);
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
            state.targetPath = ensureMarkdownPath(parsed.targetPath || state.targetPath);
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
                uploadedCsharpFiles: Array.isArray(state.uploadedCsharpFiles) ? state.uploadedCsharpFiles : [],
                metadata: applyMetadataDefaults(state.metadata),
                previewImageNoticeEnabled: !!state.previewImageNoticeEnabled
            }));
            setStatus('Markdown 草稿已自动保存');
        } catch (err) {
            setStatus(`保存失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    function scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            saveTimer = 0;
            persistState();
        }, STORAGE_DEBOUNCE_MS);
    }

    function buildViewerPreviewUrl(path) {
        const target = ensureMarkdownPath(path || state.targetPath);
        return `/site/pages/viewer.html?studio_preview=1&file=${encodeURIComponent(target)}`;
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

    function buildViewerPreviewPayload() {
        return {
            targetPath: ensureMarkdownPath(state.targetPath),
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

        const desiredUrl = buildViewerPreviewUrl(payload.targetPath);
        let shouldReload = !!forceReload;
        const currentSrc = String(dom.previewFrame.getAttribute('src') || '').trim();

        if (!currentSrc) {
            shouldReload = true;
        } else {
            try {
                const currentUrl = new URL(dom.previewFrame.src, window.location.href);
                const desired = new URL(desiredUrl, window.location.href);
                if (currentUrl.searchParams.get('file') !== desired.searchParams.get('file')) {
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

        setTargetPath(state.targetPath, true);
        renderUploadedImages();
        renderUploadedCsharpFiles();
        refreshCsharpSymbolOptions();
        updatePrChainSelectOptions();
        updatePreviewImageNoticeToggleUi();
        renderMetadataFormFromState();
        renderColorListsFromState();

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
                const imageFiles = collectPastedImageFiles(clipboardData);
                if (imageFiles.length === 0) return;

                event.preventDefault();

                try {
                    await insertImagesFromFiles(imageFiles);
                } catch (err) {
                    setStatus(`粘贴图片失败：${err && err.message ? err.message : String(err)}`);
                }
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
                setTargetPath(dom.targetPath.value, true);
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
                const url = buildViewerPreviewUrl(payload.targetPath);
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        }

        if (dom.toggleFullscreen) {
            dom.toggleFullscreen.addEventListener('click', function () {
                setFullscreenMode(!state.isFullscreen, false);
            });
        }

        document.addEventListener('keydown', function (event) {
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
