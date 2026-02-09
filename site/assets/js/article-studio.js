(function () {
    'use strict';

    const STORAGE_KEY = 'articleStudioMarkdown.v8';
    const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';
    const VIEWER_PREVIEW_STORAGE_KEY = 'articleStudioViewerPreview.v1';
    const STORAGE_DEBOUNCE_MS = 300;
    const PREVIEW_SYNC_DEBOUNCE_MS = 120;
    const DEFAULT_PR_WORKER_API_URL = 'https://greenhome-pr.3577415213.workers.dev/api/create-pr';
    const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
    const MAX_IMAGE_COUNT = 12;

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
        reset: document.getElementById('studio-reset'),
        insertTemplate: document.getElementById('studio-insert-template'),
        insertImage: document.getElementById('studio-insert-image'),
        imageUpload: document.getElementById('studio-image-upload'),
        imageList: document.getElementById('studio-image-list'),
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
        previewImageNoticeEnabled: true,
        authToken: '',
        githubUser: '',
        isFullscreen: false
    };

    let saveTimer = 0;
    let previewSyncTimer = 0;
    let lastPreviewImageNotice = '';
    let lastPreviewImageNoticeAt = 0;

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
        if (imageExtraFiles.length > 0) {
            payload.extraFiles = imageExtraFiles;
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
                version: 8,
                updatedAt: new Date().toISOString(),
                targetPath: state.targetPath,
                markdown: state.markdown,
                workerApiUrl: state.workerApiUrl,
                prTitle: state.prTitle,
                lastPrUrl: state.lastPrUrl,
                linkedPrNumber: String(state.linkedPrNumber || ''),
                myOpenPrs: Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [],
                uploadedImages: Array.isArray(state.uploadedImages) ? state.uploadedImages : [],
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
        return `/site/pages/viewer.html?studio_preview=1&studio_embed=1&file=${encodeURIComponent(target)}`;
    }

    function buildViewerPreviewPayload() {
        return {
            targetPath: ensureMarkdownPath(state.targetPath),
            markdown: String(state.markdown || ''),
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
            version: 8,
            exportedAt: new Date().toISOString(),
            targetPath: state.targetPath,
            markdown: state.markdown,
            workerApiUrl: state.workerApiUrl,
            prTitle: state.prTitle,
            lastPrUrl: state.lastPrUrl,
            linkedPrNumber: String(state.linkedPrNumber || ''),
            myOpenPrs: Array.isArray(state.myOpenPrs) ? state.myOpenPrs : [],
            uploadedImages: Array.isArray(state.uploadedImages) ? state.uploadedImages : [],
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
        return [
            '---',
            'title: 教程标题',
            'author: 你的名字',
            'topic: article-contribution',
            'description: 一句话说明本文内容',
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
        ].join('\n');
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
        updatePrChainSelectOptions();
        updatePreviewImageNoticeToggleUi();

        if (dom.markdown) {
            dom.markdown.value = state.markdown;
            dom.markdown.addEventListener('input', function () {
                state.markdown = String(dom.markdown.value || '');
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

        if (dom.insertImage) {
            dom.insertImage.addEventListener('click', function () {
                if (!dom.imageUpload) {
                    setStatus('当前页面未找到图片上传控件');
                    return;
                }
                dom.imageUpload.click();
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
