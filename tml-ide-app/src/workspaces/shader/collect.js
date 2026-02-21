const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';

function normalizePath(path) {
    return String(path || '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');
}

function toRepoPath(path) {
    return normalizePath(path);
}

function getValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return String(el.value || '').trim();
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

export function collectShaderWorkspaceSnapshot() {
    const template = getValue('shader-contribute-template');
    const workerApiUrl = getValue('shader-contribute-pr-worker-url');
    const prTitle = getValue('shader-contribute-pr-title');

    const { authToken, githubUser } = readAuthSession();

    const files = [];
    let targetPath = '';
    let markdown = '';
    const warnings = [];

    try {
        if (
            window.ShaderContribute &&
            typeof window.ShaderContribute.parseContributionTemplate === 'function' &&
            typeof window.ShaderContribute.buildContributionPayload === 'function'
        ) {
            const parsed = window.ShaderContribute.parseContributionTemplate(template);
            const payload = window.ShaderContribute.buildContributionPayload(parsed, { prTitle });

            targetPath = toRepoPath(payload && payload.targetPath || '');
            markdown = String(payload && payload.markdown || '');

            if (targetPath && markdown) {
                files.push({
                    path: toRepoPath(`site/content/${targetPath}`),
                    content: markdown,
                    encoding: 'utf8',
                    source: 'shader-readme',
                    isMainMarkdown: true
                });
            }

            (Array.isArray(payload && payload.extraFiles) ? payload.extraFiles : []).forEach((item) => {
                if (!item || typeof item !== 'object') return;
                files.push({
                    path: toRepoPath(item.path || ''),
                    content: String(item.content || ''),
                    encoding: String(item.encoding || 'utf8').toLowerCase() === 'base64' ? 'base64' : 'utf8',
                    source: 'shader-extra'
                });
            });
        } else {
            warnings.push('ShaderContribute API 未就绪');
        }
    } catch (error) {
        warnings.push(String(error && error.message ? error.message : error || 'Shader 模板解析失败'));
    }

    return {
        workspace: 'shader',
        targetPath: toRepoPath(`site/content/${targetPath}`),
        markdown,
        files,
        workerApiUrl,
        prTitle,
        authToken,
        githubUser,
        warnings,
        updatedAt: new Date().toISOString()
    };
}

