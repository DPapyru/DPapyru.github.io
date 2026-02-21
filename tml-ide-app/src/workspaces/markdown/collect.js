const STORAGE_KEY = 'articleStudioMarkdown.v9';
const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (_err) {
        return null;
    }
}

function normalizePath(path) {
    return String(path || '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');
}

function toRepoContentPath(path) {
    const safePath = normalizePath(path);
    if (!safePath) return '';
    if (/^site\/content\//i.test(safePath)) return safePath;
    return `site/content/${safePath}`;
}

function getDomValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return String(el.value || '').trim();
}

function readPersisted() {
    let raw = '';
    try {
        raw = localStorage.getItem(STORAGE_KEY) || '';
    } catch (_err) {
        raw = '';
    }
    return safeJsonParse(raw) || {};
}

function buildDraftFiles(parsed, activeTargetPath, activeMarkdown) {
    const files = [];
    const map = parsed && parsed.draftFiles && typeof parsed.draftFiles === 'object' ? parsed.draftFiles : {};
    const activePath = normalizePath(activeTargetPath);
    Object.keys(map).forEach((key) => {
        const record = map[key] || {};
        const path = normalizePath(record.path || key);
        if (!path) return;
        const fullPath = toRepoContentPath(path);
        if (!fullPath) return;
        if (String(record.status || '') === 'deleted') {
            files.push({ path: fullPath, op: 'delete', source: 'markdown-draft' });
            return;
        }
        const content = String(record.markdown || '');
        if (path === activePath && content === String(activeMarkdown || '')) {
            return;
        }
        files.push({ path: fullPath, content, encoding: 'utf8', source: 'markdown-draft' });
    });
    return files;
}

function buildUploadedFiles(parsed, key, source) {
    const arr = parsed && Array.isArray(parsed[key]) ? parsed[key] : [];
    return arr.map((item) => {
        const assetPath = toRepoContentPath(item && item.assetPath);
        if (!assetPath) return null;
        if (source === 'image' || source === 'media') {
            return {
                path: assetPath,
                content: String(item && item.base64 || ''),
                encoding: 'base64',
                source
            };
        }
        return {
            path: assetPath,
            content: String(item && item.content || ''),
            encoding: 'utf8',
            source
        };
    }).filter((item) => item && String(item.content || '').length > 0);
}

function readAuthSession() {
    let authToken = '';
    let githubUser = '';
    try {
        authToken = String(sessionStorage.getItem(SESSION_AUTH_TOKEN_KEY) || '');
        githubUser = String(sessionStorage.getItem(SESSION_AUTH_USER_KEY) || '');
    } catch (_err) {
        authToken = '';
        githubUser = '';
    }
    return { authToken, githubUser };
}

export function collectMarkdownWorkspaceSnapshot() {
    const parsed = readPersisted();

    const domTargetPath = getDomValue('studio-target-path');
    const domMarkdown = getDomValue('studio-markdown');

    const targetPath = normalizePath(domTargetPath || parsed.targetPath || '');
    const markdown = String(domMarkdown || parsed.markdown || '');

    let files = [];
    if (targetPath) {
        files.push({
            path: toRepoContentPath(targetPath),
            content: markdown,
            encoding: 'utf8',
            source: 'markdown-main',
            isMainMarkdown: true
        });
    }

    files = files
        .concat(buildDraftFiles(parsed, targetPath, markdown))
        .concat(buildUploadedFiles(parsed, 'uploadedImages', 'image'))
        .concat(buildUploadedFiles(parsed, 'uploadedMedia', 'media'))
        .concat(buildUploadedFiles(parsed, 'uploadedCsharpFiles', 'csharp'));

    const workerApiUrl = getDomValue('studio-pr-worker-url') || String(parsed.workerApiUrl || '');
    const prTitle = getDomValue('studio-pr-title') || String(parsed.prTitle || '');
    const { authToken, githubUser } = readAuthSession();

    return {
        workspace: 'markdown',
        targetPath: toRepoContentPath(targetPath),
        markdown,
        files,
        workerApiUrl,
        prTitle,
        authToken,
        githubUser,
        updatedAt: new Date().toISOString()
    };
}

