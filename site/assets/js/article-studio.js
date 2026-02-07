(function () {
    'use strict';

    const STORAGE_KEY = 'articleStudioMarkdown.v7';
    const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';
    const VIEWER_PREVIEW_STORAGE_KEY = 'articleStudioViewerPreview.v1';
    const STORAGE_DEBOUNCE_MS = 300;
    const PREVIEW_SYNC_DEBOUNCE_MS = 120;
    const DEFAULT_PR_WORKER_API_URL = 'https://greenhome-pr.3577415213.workers.dev/api/create-pr';
    const LEVEL_AUTO = 'auto';
    const ROUTE_TEMPLATE_BY_C = 'by-c';
    const ROUTE_TEMPLATE_BY_T = 'by-t';
    const ROUTE_TEMPLATE_BY_G = 'by-g';
    const COMPOSE_STORAGE_VERSION = 1;

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
        simulateCLevel: document.getElementById('studio-simulate-c-level'),
        simulateTLevel: document.getElementById('studio-simulate-t-level'),
        existingSelect: document.getElementById('studio-existing-select'),
        loadExisting: document.getElementById('studio-load-existing'),
        loadPath: document.getElementById('studio-load-path'),
        copyMarkdown: document.getElementById('studio-copy-markdown'),
        exportJson: document.getElementById('studio-export'),
        reset: document.getElementById('studio-reset'),
        insertTemplate: document.getElementById('studio-insert-template'),
        toggleFullscreen: document.getElementById('studio-toggle-fullscreen'),
        submitPr: document.getElementById('studio-submit-pr'),
        prWorkerUrl: document.getElementById('studio-pr-worker-url'),
        prSharedKey: document.getElementById('studio-pr-shared-key'),
        prTitle: document.getElementById('studio-pr-title'),
        prIncludeRoute: document.getElementById('studio-pr-include-route'),
        routePath: document.getElementById('studio-route-path'),
        routePathExisting: document.getElementById('studio-route-path-existing'),
        routePathOptions: document.getElementById('studio-route-path-options'),
        routeTemplate: document.getElementById('studio-route-template'),
        routeJson: document.getElementById('studio-route-json'),
        routeGenerate: document.getElementById('studio-route-generate'),
        composeEnabled: document.getElementById('studio-compose-enabled'),
        composeFileList: document.getElementById('studio-compose-file-list'),
        composeAddFile: document.getElementById('studio-compose-add-file'),
        composeRemoveFile: document.getElementById('studio-compose-remove-file'),
        composeMoveUp: document.getElementById('studio-compose-move-up'),
        composeMoveDown: document.getElementById('studio-compose-move-down'),
        composeApplyMerged: document.getElementById('studio-compose-apply-merged'),
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
        includeRoute: false,
        routePath: '',
        routeTemplate: ROUTE_TEMPLATE_BY_C,
        routeJson: '',
        composeModeEnabled: false,
        composeFiles: [],
        composeActiveId: '',
        lastPrUrl: '',
        authToken: '',
        githubUser: '',
        isFullscreen: false,
        simulatedCLevel: LEVEL_AUTO,
        simulatedTLevel: LEVEL_AUTO
    };

    let saveTimer = 0;
    let previewSyncTimer = 0;

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

    function normalizeLevelSelection(value) {
        const text = String(value || '').trim().toLowerCase();
        if (text === '0' || text === '1' || text === '2') return text;
        return LEVEL_AUTO;
    }

    function normalizeWorkerApiUrl(input) {
        let value = String(input || '').trim();
        if (!value) return '';

        if (!/^https?:\/\//i.test(value)) {
            value = `https://${value}`;
        }

        value = value.replace(/\/+$/, '');

        if (!/\/api\/create-pr(?:\?|$)/.test(value)) {
            value = `${value}/api/create-pr`;
        }

        return value;
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
        const workerOrigin = workerOriginFromApiUrl(apiUrl);
        if (!workerOrigin) return '';

        try {
            const meUrl = new URL('/auth/me', workerOrigin);
            return meUrl.toString();
        } catch (_) {
            return '';
        }
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

    function createComposeId() {
        return `compose-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    function normalizeComposeFileEntry(raw, fallbackName) {
        const entry = raw && typeof raw === 'object' ? raw : {};
        const id = String(entry.id || '').trim() || createComposeId();
        const nameBase = String(entry.name || fallbackName || '').trim();
        const safeName = nameBase || `片段-${id.slice(-4)}`;
        const markdown = String(entry.markdown || '').replace(/\r\n/g, '\n');
        return {
            id: id,
            name: safeName,
            markdown: markdown
        };
    }

    function ensureComposeModelInitialized() {
        if (!Array.isArray(state.composeFiles)) {
            state.composeFiles = [];
        }

        state.composeFiles = state.composeFiles
            .map(function (item, index) {
                return normalizeComposeFileEntry(item, `片段-${index + 1}`);
            })
            .filter(function (item) {
                return !!String(item.id || '').trim();
            });

        if (state.composeFiles.length === 0) {
            state.composeFiles = [normalizeComposeFileEntry({ name: '主稿', markdown: state.markdown }, '主稿')];
        }

        const hasActive = state.composeFiles.some(function (item) {
            return item.id === state.composeActiveId;
        });
        if (!hasActive) {
            state.composeActiveId = state.composeFiles[0].id;
        }
    }

    function getComposeActiveFile() {
        ensureComposeModelInitialized();
        return state.composeFiles.find(function (item) {
            return item.id === state.composeActiveId;
        }) || state.composeFiles[0];
    }

    function buildComposedMarkdown() {
        ensureComposeModelInitialized();
        return state.composeFiles
            .map(function (item) {
                return String(item.markdown || '').trim();
            })
            .filter(Boolean)
            .join('\n\n');
    }

    function getEffectiveMarkdownForOutput() {
        if (!state.composeModeEnabled) {
            return String(state.markdown || '');
        }
        return buildComposedMarkdown();
    }

    function syncComposeListUi() {
        if (!dom.composeFileList) return;
        ensureComposeModelInitialized();

        dom.composeFileList.innerHTML = '';
        state.composeFiles.forEach(function (item, index) {
            const option = document.createElement('option');
            option.value = item.id;
            const lines = String(item.markdown || '').split(/\r?\n/).length;
            option.textContent = `${index + 1}. ${item.name} (${lines} 行)`;
            dom.composeFileList.appendChild(option);
        });
        dom.composeFileList.value = state.composeActiveId;
    }

    function syncComposeControlsState() {
        const enabled = !!state.composeModeEnabled;
        if (dom.composeEnabled) dom.composeEnabled.checked = enabled;

        const controls = [
            dom.composeFileList,
            dom.composeAddFile,
            dom.composeRemoveFile,
            dom.composeMoveUp,
            dom.composeMoveDown,
            dom.composeApplyMerged
        ];

        controls.forEach(function (control) {
            if (!control) return;
            control.disabled = !enabled;
        });

        syncComposeListUi();
    }

    function setComposeActiveById(fileId, syncEditor) {
        const id = String(fileId || '').trim();
        if (!id) return;
        ensureComposeModelInitialized();
        const found = state.composeFiles.find(function (item) {
            return item.id === id;
        });
        if (!found) return;

        state.composeActiveId = found.id;
        syncComposeListUi();

        if (syncEditor && dom.markdown) {
            state.markdown = String(found.markdown || '');
            dom.markdown.value = state.markdown;
            updateStats();
            renderPreview();
        }
    }

    function updateComposeActiveFromEditor() {
        if (!state.composeModeEnabled) return;
        const active = getComposeActiveFile();
        if (!active) return;
        active.markdown = String(state.markdown || '');
        syncComposeListUi();
    }

    function trimMdExtension(input) {
        return String(input || '').trim().replace(/\.md$/i, '');
    }

    function defaultRoutePathFromTarget() {
        const normalized = ensureMarkdownPath(state.targetPath);
        return `${trimMdExtension(normalized)}.route.json`;
    }

    function mapRouteTemplateToDimension(templateId) {
        const id = String(templateId || '').trim().toLowerCase();
        if (id === ROUTE_TEMPLATE_BY_T) return 'T';
        if (id === ROUTE_TEMPLATE_BY_G) return 'G';
        return 'C';
    }

    function normalizeRouteTemplate(input) {
        const text = String(input || '').trim().toLowerCase();
        if (text === ROUTE_TEMPLATE_BY_T) return ROUTE_TEMPLATE_BY_T;
        if (text === ROUTE_TEMPLATE_BY_G) return ROUTE_TEMPLATE_BY_G;
        return ROUTE_TEMPLATE_BY_C;
    }

    function normalizeRouteRelativePath(input) {
        let value = String(input || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
        value = value.replace(/^site\/content\/routes\//i, '');
        value = value.replace(/\/{2,}/g, '/');
        if (!value) {
            value = defaultRoutePathFromTarget();
        }
        if (!/\.route\.json$/i.test(value)) {
            value = `${trimMdExtension(value)}.route.json`;
        }
        return value;
    }

    function buildDefaultRouteObject() {
        const template = normalizeRouteTemplate(state.routeTemplate);
        const dimension = mapRouteTemplateToDimension(template);

        return {
            version: 2,
            article: ensureMarkdownPath(state.targetPath),
            entry: 'entry',
            nodes: [
                {
                    id: 'entry',
                    type: 'decision',
                    dimension: dimension,
                    fallback: 'standard',
                    map: {
                        '0': 'remedial',
                        '1': 'standard',
                        '2': dimension === 'G' ? 'deep' : 'fast'
                    }
                },
                {
                    id: 'remedial',
                    type: 'path',
                    path: 'remedial'
                },
                {
                    id: 'standard',
                    type: 'path',
                    path: 'standard'
                },
                {
                    id: dimension === 'G' ? 'deep' : 'fast',
                    type: 'path',
                    path: dimension === 'G' ? 'deep' : 'fast'
                }
            ]
        };
    }

    function buildDefaultRouteDocument() {
        return JSON.stringify(buildDefaultRouteObject(), null, 2) + '\n';
    }

    function ensureRouteDraftInitialized() {
        if (!state.routePath) {
            state.routePath = normalizeRouteRelativePath('');
        }
        if (!String(state.routeJson || '').trim()) {
            state.routeJson = buildDefaultRouteDocument();
        }
    }

    function extractRoutePathChoicesFromManifest(manifest) {
        const result = [];
        const seen = new Set();
        const routes = manifest && manifest.routes && typeof manifest.routes === 'object'
            ? manifest.routes
            : {};

        Object.keys(routes).forEach(function (articlePath) {
            const routeItem = routes[articlePath] || {};
            const sourcePath = String(routeItem.source || '').trim();
            if (!sourcePath) return;

            const normalized = normalizeRouteRelativePath(sourcePath);
            if (!normalized || seen.has(normalized)) return;

            seen.add(normalized);
            result.push(normalized);
        });

        result.sort(function (a, b) {
            return a.localeCompare(b, 'zh-CN');
        });

        return result;
    }

    function syncRoutePathChoiceSelection() {
        if (!dom.routePathExisting) return;

        const current = normalizeRouteRelativePath(state.routePath);
        const options = Array.from(dom.routePathExisting.options || []).map(function (option) {
            return String(option.value || '').trim();
        });

        if (options.includes(current)) {
            dom.routePathExisting.value = current;
            return;
        }

        dom.routePathExisting.value = '';
    }

    function renderRoutePathChoices(paths) {
        const normalizedPaths = Array.isArray(paths)
            ? paths
                .map(function (item) {
                    return normalizeRouteRelativePath(item);
                })
                .filter(Boolean)
            : [];

        const uniquePaths = [];
        const seen = new Set();

        normalizedPaths.forEach(function (item) {
            if (seen.has(item)) return;
            seen.add(item);
            uniquePaths.push(item);
        });

        if (state.routePath && !seen.has(state.routePath)) {
            uniquePaths.unshift(state.routePath);
        }

        if (dom.routePathExisting) {
            dom.routePathExisting.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '从已有 route 选择（也可手动新建）';
            dom.routePathExisting.appendChild(defaultOption);

            uniquePaths.forEach(function (item) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                dom.routePathExisting.appendChild(option);
            });
        }

        if (dom.routePathOptions) {
            dom.routePathOptions.innerHTML = '';
            uniquePaths.forEach(function (item) {
                const option = document.createElement('option');
                option.value = item;
                dom.routePathOptions.appendChild(option);
            });
        }

        syncRoutePathChoiceSelection();
    }

    async function loadRoutePathChoices() {
        if (!dom.routePathExisting && !dom.routePathOptions) return;

        try {
            const response = await fetch('/site/assets/route-manifest.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const manifest = await response.json();
            const choices = extractRoutePathChoicesFromManifest(manifest);
            renderRoutePathChoices(choices);
        } catch (_) {
            renderRoutePathChoices([]);
        }
    }

    function syncRouteControlsFromState() {
        if (dom.prIncludeRoute) dom.prIncludeRoute.checked = !!state.includeRoute;
        if (dom.routePath) dom.routePath.value = state.routePath;
        if (dom.routeTemplate) dom.routeTemplate.value = state.routeTemplate;
        if (dom.routeJson) dom.routeJson.value = state.routeJson;
        syncRoutePathChoiceSelection();
    }

    function parseRouteJsonInput(input) {
        const text = String(input || '').trim();
        if (!text) throw new Error('路由 JSON 为空');

        let parsed = null;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            throw new Error(`路由 JSON 解析失败：${String(e && e.message ? e.message : e)}`);
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('路由 JSON 顶层必须是对象');
        }

        if (parsed.version !== 2) {
            throw new Error('路由 JSON version 必须为 2');
        }

        if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
            throw new Error('路由 JSON nodes 必须是非空数组');
        }

        return parsed;
    }

    function buildRouteExtraFileOrThrow() {
        const relativeRoutePath = normalizeRouteRelativePath(state.routePath);
        const fullRoutePath = `site/content/routes/${relativeRoutePath}`;
        const parsed = parseRouteJsonInput(state.routeJson);
        parsed.article = ensureMarkdownPath(state.targetPath);

        return {
            path: fullRoutePath,
            content: JSON.stringify(parsed, null, 2) + '\n'
        };
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

        if (previousPath !== state.targetPath) {
            schedulePreviewSync(true);
        }

        if (!silent) {
            setStatus(`目标路径已更新：${state.targetPath}`);
        }

        if (state.composeModeEnabled) {
            ensureComposeModelInitialized();
            const active = getComposeActiveFile();
            if (active && !String(active.name || '').trim()) {
                active.name = getFilenameFromPath(state.targetPath) || '主稿';
                syncComposeListUi();
            }
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

            if (state.composeModeEnabled) {
                ensureComposeModelInitialized();
                state.composeFiles = [normalizeComposeFileEntry({
                    name: getFilenameFromPath(targetPath) || '主稿',
                    markdown: state.markdown
                }, '主稿')];
                state.composeActiveId = state.composeFiles[0].id;
                syncComposeControlsState();
            }

            if (dom.markdown) {
                dom.markdown.value = state.markdown;
            }

            setTargetPath(targetPath, true);
            renderPreview();
            updateStats();
            persistState();

            if (dom.existingSelect) {
                dom.existingSelect.value = targetPath;
            }

            setStatus(`已载入${sourceLabel ? `（${sourceLabel}）` : ''}：${targetPath}`);
        } catch (err) {
            setStatus(`载入失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    async function submitPullRequest() {
        const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
        const sharedKey = String(dom.prSharedKey ? dom.prSharedKey.value : '').trim();
        const titleInput = String(dom.prTitle ? dom.prTitle.value : '').trim();
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

        const effectiveMarkdown = String(getEffectiveMarkdownForOutput() || '');

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
            markdown: getEffectiveMarkdownForOutput(),
            prTitle: titleInput || defaultPrTitle()
        };

        if (state.includeRoute) {
            let routeExtra = null;
            try {
                routeExtra = buildRouteExtraFileOrThrow();
            } catch (err) {
                setStatus(`分流路由无效：${err && err.message ? err.message : String(err)}`);
                if (dom.routeJson) dom.routeJson.focus();
                return;
            }
            payload.extraFiles = [routeExtra];
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
        setStatus('正在提交到 Worker 并创建 PR，请稍候...');

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
            persistState();

            setStatus(`PR 创建成功${responseData.prNumber ? ` #${responseData.prNumber}` : ''}`);

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
        const text = String(state.composeModeEnabled ? getEffectiveMarkdownForOutput() : state.markdown || '');
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
            state.includeRoute = !!parsed.includeRoute;
            state.routePath = normalizeRouteRelativePath(parsed.routePath || defaultRoutePathFromTarget());
            state.routeTemplate = normalizeRouteTemplate(parsed.routeTemplate || ROUTE_TEMPLATE_BY_C);
            state.routeJson = String(parsed.routeJson || '');
            state.composeModeEnabled = !!parsed.composeModeEnabled;
            state.composeFiles = Array.isArray(parsed.composeFiles) ? parsed.composeFiles : [];
            state.composeActiveId = String(parsed.composeActiveId || '');
            state.lastPrUrl = String(parsed.lastPrUrl || '');
            state.simulatedCLevel = normalizeLevelSelection(parsed.simulatedCLevel);
            state.simulatedTLevel = normalizeLevelSelection(parsed.simulatedTLevel);

            ensureRouteDraftInitialized();
            ensureComposeModelInitialized();
        } catch (err) {
            setStatus(`读取本地草稿失败：${err && err.message ? err.message : String(err)}`);
        }
    }

    function syncSimulationControlsFromState() {
        if (dom.simulateCLevel) dom.simulateCLevel.value = state.simulatedCLevel;
        if (dom.simulateTLevel) dom.simulateTLevel.value = state.simulatedTLevel;
    }

    function persistState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: 6,
                updatedAt: new Date().toISOString(),
                targetPath: state.targetPath,
                markdown: state.markdown,
                workerApiUrl: state.workerApiUrl,
                prTitle: state.prTitle,
                includeRoute: !!state.includeRoute,
                routePath: state.routePath,
                routeTemplate: state.routeTemplate,
                routeJson: state.routeJson,
                composeModeEnabled: !!state.composeModeEnabled,
                composeFiles: state.composeFiles,
                composeActiveId: state.composeActiveId,
                lastPrUrl: state.lastPrUrl,
                simulatedCLevel: state.simulatedCLevel,
                simulatedTLevel: state.simulatedTLevel
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
        return `/site/pages/viewer.html?studio_preview=1&studio_embed=1&file=${encodeURIComponent(target)}`;
    }

    function buildViewerPreviewPayload() {
        const shouldSimulateC = state.simulatedCLevel !== LEVEL_AUTO;
        const shouldSimulateT = state.simulatedTLevel !== LEVEL_AUTO;
        let simulatedProfile = null;

        if (shouldSimulateC || shouldSimulateT) {
            simulatedProfile = {
                c: shouldSimulateC ? Number.parseInt(state.simulatedCLevel, 10) : null,
                t: shouldSimulateT ? Number.parseInt(state.simulatedTLevel, 10) : null
            };
        }

        return {
            targetPath: ensureMarkdownPath(state.targetPath),
            markdown: String(getEffectiveMarkdownForOutput() || ''),
            simulatedProfile: simulatedProfile,
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
        updateComposeActiveFromEditor();
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
            insertBlockSnippet(`{{ref:目标文档.md|${selectedTitle}}}\n`, '目标文档.md');
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

        if (key === 'if') {
            const advancedPart = readCurrentSelectionText() || '这里写进阶读者内容。';
            insertBlockSnippet([
                '{if C >= 1}',
                advancedPart,
                '{else}',
                '这里写入门读者内容。',
                '{end}',
                ''
            ].join('\n'), '这里写入门读者内容。');
            return;
        }

        if (key === 'route-path-block') {
            insertBlockSnippet([
                '{if R_REMEDIAL == 1}',
                '这里写补救路径内容。',
                '{else if R_STANDARD == 1}',
                '这里写标准路径内容。',
                '{else if R_FAST == 1}',
                '这里写速通路径内容。',
                '{else if R_DEEP == 1}',
                '这里写深挖路径内容。',
                '{else}',
                '这里写兜底内容。',
                '{end}',
                ''
            ].join('\n'), '这里写标准路径内容。');
            return;
        }

        if (key === 'routing-assertions') {
            insertBlockSnippet([
                '## 分流断言',
                '- C0/T0：应看到补课内容。',
                '- C1/T1：应看到标准主线。',
                '- C2/T2：应看到进阶补充。',
                ''
            ].join('\n'), 'C1/T1：应看到标准主线。');
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
            version: 7,
            exportedAt: new Date().toISOString(),
            targetPath: state.targetPath,
            markdown: state.markdown,
            markdownMerged: getEffectiveMarkdownForOutput(),
            workerApiUrl: state.workerApiUrl,
            prTitle: state.prTitle,
            includeRoute: !!state.includeRoute,
            routePath: state.routePath,
            routeTemplate: state.routeTemplate,
            routeJson: state.routeJson,
            composeModeEnabled: !!state.composeModeEnabled,
            composeFiles: state.composeFiles,
            composeActiveId: state.composeActiveId,
            lastPrUrl: state.lastPrUrl
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
        return [
            '---',
            'title: 教程标题',
            'author: 你的名字',
            'topic: article-contribution',
            'description: 一句话说明本文内容',
            'routing_manual: true',
            '---',
            '',
            '## 分流断言',
            '- C0/T0：应看到补课内容。',
            '- C1/T1：应看到标准主线。',
            '- C2/T2：应看到进阶补充。',
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
        ].join('\n');
    }

    function resetAll() {
        if (!window.confirm('确认清空当前 Markdown 草稿吗？')) return;
        state.markdown = '';
        state.composeFiles = [normalizeComposeFileEntry({ name: '主稿', markdown: '' }, '主稿')];
        state.composeActiveId = state.composeFiles[0].id;
        if (dom.markdown) dom.markdown.value = '';
        syncComposeControlsState();
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
        ensureRouteDraftInitialized();
        ensureComposeModelInitialized();
        syncRouteControlsFromState();
        syncComposeControlsState();

        if (dom.markdown) {
            if (state.composeModeEnabled) {
                const active = getComposeActiveFile();
                state.markdown = String(active && active.markdown ? active.markdown : '');
            }
            dom.markdown.value = state.markdown;
            dom.markdown.addEventListener('input', function () {
                state.markdown = String(dom.markdown.value || '');
                updateComposeActiveFromEditor();
                updateStats();
                renderPreview();
                scheduleSave();
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

        updatePrLink(state.lastPrUrl);
        updateAuthUi();

        if (dom.targetPath) {
            dom.targetPath.addEventListener('change', function () {
                setTargetPath(dom.targetPath.value, true);
                state.routePath = normalizeRouteRelativePath(state.routePath || defaultRoutePathFromTarget());
                ensureRouteDraftInitialized();
                syncRouteControlsFromState();
                if (state.composeModeEnabled) {
                    const active = getComposeActiveFile();
                    if (active && !active.name) {
                        active.name = getFilenameFromPath(state.targetPath) || '主稿';
                    }
                    syncComposeControlsState();
                }
                scheduleSave();
                setStatus('目标路径已更新');
            });

            dom.targetPath.addEventListener('blur', function () {
                setTargetPath(dom.targetPath.value, true);
            });
        }

        if (dom.simulateCLevel) {
            dom.simulateCLevel.addEventListener('change', function () {
                state.simulatedCLevel = normalizeLevelSelection(dom.simulateCLevel.value);
                syncSimulationControlsFromState();
                renderPreview();
                scheduleSave();
                setStatus('模拟阅读档位已更新（C）');
            });
        }

        if (dom.simulateTLevel) {
            dom.simulateTLevel.addEventListener('change', function () {
                state.simulatedTLevel = normalizeLevelSelection(dom.simulateTLevel.value);
                syncSimulationControlsFromState();
                renderPreview();
                scheduleSave();
                setStatus('模拟阅读档位已更新（T）');
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

        if (dom.composeEnabled) {
            dom.composeEnabled.addEventListener('change', function () {
                state.composeModeEnabled = !!dom.composeEnabled.checked;
                ensureComposeModelInitialized();

                if (state.composeModeEnabled) {
                    const hasContent = state.composeFiles.some(function (item) {
                        return String(item.markdown || '').trim();
                    });
                    if (!hasContent && String(state.markdown || '').trim()) {
                        const active = getComposeActiveFile();
                        active.markdown = state.markdown;
                    }
                    const active = getComposeActiveFile();
                    state.markdown = String(active && active.markdown ? active.markdown : '');
                    if (dom.markdown) dom.markdown.value = state.markdown;
                    setStatus('已启用多文件编排模式');
                } else {
                    state.markdown = buildComposedMarkdown();
                    if (dom.markdown) dom.markdown.value = state.markdown;
                    setStatus('已关闭多文件编排模式，编辑器显示合并结果');
                }

                syncComposeControlsState();
                updateStats();
                renderPreview();
                scheduleSave();
            });
        }

        if (dom.composeFileList) {
            dom.composeFileList.addEventListener('change', function () {
                setComposeActiveById(dom.composeFileList.value, true);
                scheduleSave();
            });
        }

        if (dom.composeAddFile) {
            dom.composeAddFile.addEventListener('click', function () {
                ensureComposeModelInitialized();
                const nameInput = window.prompt('新片段名称（例如：补救路径内容）', `片段-${state.composeFiles.length + 1}`);
                if (nameInput == null) return;

                const newItem = normalizeComposeFileEntry({
                    name: String(nameInput || '').trim(),
                    markdown: ''
                }, `片段-${state.composeFiles.length + 1}`);

                state.composeFiles.push(newItem);
                state.composeActiveId = newItem.id;
                syncComposeControlsState();
                setComposeActiveById(newItem.id, true);
                scheduleSave();
                setStatus(`已新增片段：${newItem.name}`);
            });
        }

        if (dom.composeRemoveFile) {
            dom.composeRemoveFile.addEventListener('click', function () {
                ensureComposeModelInitialized();
                if (state.composeFiles.length <= 1) {
                    setStatus('至少保留一个片段');
                    return;
                }

                const idx = state.composeFiles.findIndex(function (item) {
                    return item.id === state.composeActiveId;
                });
                if (idx < 0) return;

                const removed = state.composeFiles[idx];
                state.composeFiles.splice(idx, 1);
                const nextIndex = Math.max(0, idx - 1);
                state.composeActiveId = state.composeFiles[nextIndex].id;
                setComposeActiveById(state.composeActiveId, true);
                syncComposeControlsState();
                updateStats();
                renderPreview();
                scheduleSave();
                setStatus(`已删除片段：${removed.name}`);
            });
        }

        function moveComposeActive(delta) {
            ensureComposeModelInitialized();
            const idx = state.composeFiles.findIndex(function (item) {
                return item.id === state.composeActiveId;
            });
            if (idx < 0) return;
            const targetIdx = idx + delta;
            if (targetIdx < 0 || targetIdx >= state.composeFiles.length) return;

            const current = state.composeFiles[idx];
            state.composeFiles.splice(idx, 1);
            state.composeFiles.splice(targetIdx, 0, current);
            state.composeActiveId = current.id;
            syncComposeControlsState();
            scheduleSave();
        }

        if (dom.composeMoveUp) {
            dom.composeMoveUp.addEventListener('click', function () {
                moveComposeActive(-1);
            });
        }

        if (dom.composeMoveDown) {
            dom.composeMoveDown.addEventListener('click', function () {
                moveComposeActive(1);
            });
        }

        if (dom.composeApplyMerged) {
            dom.composeApplyMerged.addEventListener('click', function () {
                state.markdown = buildComposedMarkdown();
                if (dom.markdown) dom.markdown.value = state.markdown;
                updateStats();
                renderPreview();
                scheduleSave();
                setStatus('已将编排片段合并写回主稿编辑器');
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

        if (dom.prIncludeRoute) {
            dom.prIncludeRoute.addEventListener('change', function () {
                state.includeRoute = !!dom.prIncludeRoute.checked;
                ensureRouteDraftInitialized();
                syncRouteControlsFromState();
                scheduleSave();
                setStatus(state.includeRoute ? '已启用：提交 PR 时附带分流路由' : '已关闭：提交 PR 时附带分流路由');
            });
        }

        if (dom.routePathExisting) {
            dom.routePathExisting.addEventListener('change', function () {
                const selected = String(dom.routePathExisting.value || '').trim();
                if (!selected) return;

                state.routePath = normalizeRouteRelativePath(selected);
                syncRouteControlsFromState();
                scheduleSave();
                setStatus(`已选择已有路由路径：${state.routePath}`);
            });
        }

        if (dom.routePath) {
            dom.routePath.addEventListener('change', function () {
                state.routePath = normalizeRouteRelativePath(dom.routePath.value);
                syncRouteControlsFromState();
                scheduleSave();
            });

            dom.routePath.addEventListener('blur', function () {
                state.routePath = normalizeRouteRelativePath(dom.routePath.value);
                syncRouteControlsFromState();
            });
        }

        if (dom.routeTemplate) {
            dom.routeTemplate.addEventListener('change', function () {
                state.routeTemplate = normalizeRouteTemplate(dom.routeTemplate.value);
                state.routeJson = buildDefaultRouteDocument();
                syncRouteControlsFromState();
                scheduleSave();
                setStatus('分流路由模板已更新');
            });
        }

        if (dom.routeJson) {
            dom.routeJson.addEventListener('input', function () {
                state.routeJson = String(dom.routeJson.value || '');
                scheduleSave();
            });
        }

        if (dom.routeGenerate) {
            dom.routeGenerate.addEventListener('click', function () {
                state.routeJson = buildDefaultRouteDocument();
                syncRouteControlsFromState();
                scheduleSave();
                setStatus('已按模板重建分流路由 JSON');
            });
        }

        if (dom.copyMarkdown) {
            dom.copyMarkdown.addEventListener('click', async function () {
                const ok = await copyText(getEffectiveMarkdownForOutput() || '');
                setStatus(ok ? '已复制 Markdown' : '复制失败，请手动复制');
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
                updateComposeActiveFromEditor();
                updateStats();
                renderPreview();
                persistState();
                setStatus('已插入 Markdown 教程模板');
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
            }
        });

        setFullscreenMode(false, true);
        setPrSubmitBusy(false);
        syncSimulationControlsFromState();
        updateStats();
        renderPreview();
        loadExistingList();
        loadRoutePathChoices();

        if (state.authToken) {
            verifyAuthSession();
        }

        if (!consumedOauthHash) {
            setStatus('就绪：支持 viewer 同级预览、特殊语法快捷插入，并可 GitHub 登录后直接提交 PR。快捷键：Ctrl+Shift+Enter 切换全屏。');
        }
    }

    init();
})();
