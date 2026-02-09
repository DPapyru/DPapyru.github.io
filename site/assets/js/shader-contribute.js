(function (root, factory) {
    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.ShaderContribute = api;
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                api.init();
            });
        } else {
            api.init();
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DEFAULT_PR_WORKER_API_URLS = [
        'https://greenhome-pr.3577415213.workers.dev/api/create-pr',
        'https://greenhome-pr-3577415213.workers.dev/api/create-pr'
    ];
    const DEFAULT_PR_WORKER_API_URL = DEFAULT_PR_WORKER_API_URLS[0];
    const STATE_KEY = 'shader-contribute.state.v2';
    const CONTRIBUTION_DRAFT_KEY = 'shader-playground.contribute-draft.v1';
    const PLAYGROUND_STATE_KEY = 'shader-playground.v1';
    const SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    const SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';

    function $(id) {
        if (typeof document === 'undefined') return null;
        return document.getElementById(id);
    }

    function safeJsonParse(text) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function nowStamp() {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }

    function getDateStamp() {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function clampNumber(value, min, max, fallback) {
        const num = Number(value);
        if (!isFinite(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    }

    function normalizeSlug(input) {
        let value = String(input || '').trim().toLowerCase();
        value = value.replace(/[^a-z0-9-]+/g, '-');
        value = value.replace(/-{2,}/g, '-');
        value = value.replace(/^-+/, '');
        value = value.replace(/-+$/, '');

        if (!value) return '';

        if (!/^[a-z0-9]/.test(value)) {
            value = `s-${value}`;
        }

        value = value.slice(0, 63);
        value = value.replace(/-+$/, '');
        return value;
    }

    function slugFromText(input, fallback) {
        const raw = normalizeSlug(input);
        if (raw) return raw;
        return normalizeSlug(fallback || 'my-shader') || 'my-shader';
    }

    function ensureIsoDate(input) {
        const text = String(input || '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            return text;
        }
        return getDateStamp();
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

    function isLikelyWorkerNetworkError(err) {
        const message = String(err && err.message ? err.message : err || '').toLowerCase();
        return message.includes('failed to fetch')
            || message.includes('networkerror')
            || message.includes('network request failed')
            || message.includes('err_connection_closed')
            || message.includes('load failed')
            || message.includes('timeout');
    }

    function buildWorkerApiCandidates(input) {
        const primary = normalizeWorkerApiUrl(input);
        if (!primary) return [];

        const candidates = [];
        const seen = new Set();

        function pushCandidate(url) {
            const normalized = normalizeWorkerApiUrl(url);
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            candidates.push(normalized);
        }

        pushCandidate(primary);

        try {
            const parsed = new URL(primary);
            const host = parsed.host.toLowerCase();
            const knownWorkerHosts = new Set([
                'greenhome-pr.3577415213.workers.dev',
                'greenhome-pr-3577415213.workers.dev'
            ]);

            if (knownWorkerHosts.has(host)) {
                const altHostMap = {
                    'greenhome-pr.3577415213.workers.dev': 'greenhome-pr-3577415213.workers.dev',
                    'greenhome-pr-3577415213.workers.dev': 'greenhome-pr.3577415213.workers.dev'
                };
                const altHost = altHostMap[host];
                if (altHost) {
                    const altUrl = new URL(primary);
                    altUrl.host = altHost;
                    pushCandidate(altUrl.toString());
                }

                DEFAULT_PR_WORKER_API_URLS.forEach(pushCandidate);
            }
        } catch (_) {
            // ignore invalid URL and keep primary candidate
        }

        return candidates;
    }

    async function postCreatePrWithFallback(apiUrl, fetchOptions, onFallbackTry) {
        const candidates = buildWorkerApiCandidates(apiUrl);
        if (!candidates.length) {
            throw new Error('Worker API 地址为空');
        }

        let lastError = null;

        for (let index = 0; index < candidates.length; index += 1) {
            const candidate = candidates[index];

            if (index > 0 && typeof onFallbackTry === 'function') {
                onFallbackTry(candidate, index + 1, candidates.length);
            }

            try {
                const response = await fetch(candidate, fetchOptions);
                return {
                    response: response,
                    apiUrl: candidate,
                    usedFallback: index > 0
                };
            } catch (err) {
                lastError = err;
                const hasMoreCandidate = index + 1 < candidates.length;
                if (!hasMoreCandidate || !isLikelyWorkerNetworkError(err)) {
                    throw err;
                }
            }
        }

        throw lastError || new Error('Failed to fetch');
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
        if (!workerOrigin || typeof window === 'undefined') return '';

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
            return new URL('/auth/me', workerOrigin).toString();
        } catch (_) {
            return '';
        }
    }

    function normalizeTags(tags) {
        if (!Array.isArray(tags)) return [];
        const result = [];
        const seen = new Set();

        tags.forEach(function (tag) {
            const text = String(tag || '').trim();
            if (!text) return;
            if (seen.has(text)) return;
            seen.add(text);
            result.push(text);
        });

        return result.slice(0, 12);
    }

    function normalizeEntry(entry, fallbackSlug) {
        const source = entry && typeof entry === 'object' ? entry : {};

        const title = String(source.title || '').trim() || 'My Shader';
        const slug = slugFromText(source.slug || title, fallbackSlug || 'my-shader');
        const author = String(source.author || '').trim() || '你的名字';
        const description = String(source.description || '').trim() || '请补充这个 Shader 的用途与效果。';
        const cover = String(source.cover || '').trim() || 'cover.webp';
        const updatedAt = ensureIsoDate(source.updated_at || source.last_updated);

        return {
            slug: slug,
            title: title,
            author: author,
            description: description,
            shader: 'shader.json',
            cover: cover,
            tags: normalizeTags(source.tags),
            updated_at: updatedAt
        };
    }

    function normalizeChannel(channel) {
        const source = channel && typeof channel === 'object' ? channel : {};
        const kind = String(source.kind || 'none');

        if (kind === 'builtin') {
            const id = String(source.id || '').trim();
            if (id === 'builtin:checker' || id === 'builtin:noise') {
                return { kind: 'builtin', id: id };
            }
            return { kind: 'none' };
        }

        if (kind === 'buffer') {
            const passId = String(source.passId || '').trim();
            if (!passId) return { kind: 'none' };
            return {
                kind: 'buffer',
                passId: passId,
                frame: String(source.frame || '').trim() === 'current' ? 'current' : 'prev'
            };
        }

        return { kind: 'none' };
    }

    function normalizePass(pass, index) {
        const source = pass && typeof pass === 'object' ? pass : {};
        const out = {
            name: String(source.name || '').trim() || `Pass ${index + 1}`,
            type: String(source.type || '').trim() === 'buffer' ? 'buffer' : 'image',
            scale: clampNumber(source.scale, 0.1, 4, 1),
            code: String(source.code || ''),
            channels: [{ kind: 'none' }, { kind: 'none' }, { kind: 'none' }, { kind: 'none' }]
        };

        if (source.id !== undefined && source.id !== null) {
            const passId = String(source.id || '').trim();
            if (passId) out.id = passId;
        }

        const channels = Array.isArray(source.channels) ? source.channels : [];
        for (let i = 0; i < 4; i += 1) {
            out.channels[i] = normalizeChannel(channels[i]);
        }

        return out;
    }

    function normalizeShaderPayload(shader) {
        if (!shader || typeof shader !== 'object' || Array.isArray(shader)) {
            throw new Error('shader.json 必须是对象');
        }

        const rawPasses = Array.isArray(shader.passes) ? shader.passes : [];
        if (!rawPasses.length) {
            throw new Error('shader.json 中 passes 不能为空');
        }

        return {
            common: typeof shader.common === 'string' ? shader.common : '',
            passes: rawPasses.map(function (pass, index) {
                return normalizePass(pass, index);
            })
        };
    }

    function escapeRegExp(input) {
        return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function extractFencedBlockByHeading(markdown, heading) {
        const source = String(markdown || '').replace(/\r\n?/g, '\n');
        const headingPattern = new RegExp(`(^|\\n)##\\s*${escapeRegExp(heading)}\\s*(\\n|$)`, 'i');
        const headingMatch = headingPattern.exec(source);
        if (!headingMatch) return '';

        const startIndex = headingMatch.index + headingMatch[0].length;
        const remain = source.slice(startIndex);
        const blockMatch = remain.match(/```[^\n]*\n([\s\S]*?)\n```/);
        if (!blockMatch) return '';
        return String(blockMatch[1] || '').trim();
    }

    function buildReadme(entry) {
        const safeEntry = normalizeEntry(entry || {}, 'my-shader');
        return [
            `# ${safeEntry.title}`,
            '',
            safeEntry.description,
            '',
            '## 作者',
            '',
            `- ${safeEntry.author}`,
            '',
            '## 使用说明',
            '',
            '- 在 Shader Playground 中载入该 shader.json。',
            '- 先确认预览效果，再结合项目需求调整参数。',
            ''
        ].join('\n');
    }

    function toEntryFilePayload(entry) {
        const safe = normalizeEntry(entry || {}, 'my-shader');
        return {
            slug: safe.slug,
            title: safe.title,
            author: safe.author,
            description: safe.description,
            shader: 'shader.json',
            cover: safe.cover,
            tags: safe.tags,
            updated_at: safe.updated_at
        };
    }

    function parseContributionTemplate(templateText) {
        const source = String(templateText || '');
        if (!source.trim()) {
            throw new Error('模板内容为空');
        }

        const entryBlock = extractFencedBlockByHeading(source, 'entry.json');
        const shaderBlock = extractFencedBlockByHeading(source, 'shader.json');
        const readmeBlock = extractFencedBlockByHeading(source, 'README.md');

        if (!entryBlock) {
            throw new Error('未找到 entry.json 代码块');
        }
        if (!shaderBlock) {
            throw new Error('未找到 shader.json 代码块');
        }

        let entryRaw = null;
        try {
            entryRaw = JSON.parse(entryBlock);
        } catch (err) {
            throw new Error(`entry.json JSON 解析失败：${err && err.message ? err.message : String(err)}`);
        }

        let shaderRaw = null;
        try {
            shaderRaw = JSON.parse(shaderBlock);
        } catch (err) {
            throw new Error(`shader.json JSON 解析失败：${err && err.message ? err.message : String(err)}`);
        }

        const fallbackSlug = slugFromText(entryRaw && entryRaw.title ? entryRaw.title : '', 'my-shader');
        const entry = normalizeEntry(entryRaw, fallbackSlug);
        const shader = normalizeShaderPayload(shaderRaw);
        const readme = readmeBlock ? `${String(readmeBlock).replace(/\s+$/, '')}\n` : `${buildReadme(entry)}\n`;

        return {
            entry: entry,
            shader: shader,
            readme: readme
        };
    }

    function buildContributionTemplate(parsed) {
        const normalizedEntry = normalizeEntry(parsed && parsed.entry ? parsed.entry : {}, 'my-shader');
        const normalizedShader = normalizeShaderPayload(parsed && parsed.shader ? parsed.shader : createDefaultShaderPayload());
        const readme = String(parsed && parsed.readme ? parsed.readme : '').trim()
            ? `${String(parsed.readme).replace(/\s+$/, '')}\n`
            : `${buildReadme(normalizedEntry)}\n`;

        const lines = [];
        lines.push('# Shader 投稿模板');
        lines.push('');
        lines.push('建议目录：`site/content/shader-gallery/<slug>/`');
        lines.push('');
        lines.push('## entry.json');
        lines.push('```json');
        lines.push(JSON.stringify(toEntryFilePayload(normalizedEntry), null, 2));
        lines.push('```');
        lines.push('');
        lines.push('## shader.json');
        lines.push('```json');
        lines.push(JSON.stringify(normalizedShader, null, 2));
        lines.push('```');
        lines.push('');
        lines.push('## README.md');
        lines.push('```markdown');
        lines.push(readme.replace(/\s+$/, ''));
        lines.push('```');
        lines.push('');
        lines.push('提交前建议在仓库本地运行：');
        lines.push('```bash');
        lines.push('npm run gallery:normalize');
        lines.push('npm run gallery:check');
        lines.push('```');
        return lines.join('\n');
    }

    function createDefaultShaderPayload() {
        return {
            common: '',
            passes: [
                {
                    name: 'Pass 1',
                    type: 'image',
                    scale: 1,
                    code: '',
                    channels: [
                        { kind: 'none' },
                        { kind: 'none' },
                        { kind: 'none' },
                        { kind: 'none' }
                    ]
                }
            ]
        };
    }

    function buildDefaultTemplate() {
        const sampleEntry = {
            slug: 'my-shader',
            title: 'My Shader',
            author: '你的名字',
            description: '简要描述这个 Shader 的用途与效果。',
            shader: 'shader.json',
            cover: 'cover.webp',
            tags: ['demo'],
            updated_at: getDateStamp()
        };

        return buildContributionTemplate({
            entry: sampleEntry,
            shader: createDefaultShaderPayload(),
            readme: buildReadme(sampleEntry)
        });
    }

    function toReadmeFilePath(slug) {
        const safeSlug = slugFromText(slug, 'my-shader');
        return `shader-gallery/${safeSlug}/README.md`;
    }

    function toEntryFilePath(slug) {
        const safeSlug = slugFromText(slug, 'my-shader');
        return `site/content/shader-gallery/${safeSlug}/entry.json`;
    }

    function toShaderFilePath(slug) {
        const safeSlug = slugFromText(slug, 'my-shader');
        return `site/content/shader-gallery/${safeSlug}/shader.json`;
    }

    function buildContributionPayload(parsed, options) {
        const safe = parsed && typeof parsed === 'object' ? parsed : {};
        const entry = normalizeEntry(safe.entry || {}, 'my-shader');
        const shader = normalizeShaderPayload(safe.shader || createDefaultShaderPayload());
        const readme = String(safe.readme || '').trim() ? `${String(safe.readme).replace(/\s+$/, '')}\n` : `${buildReadme(entry)}\n`;
        const opts = options && typeof options === 'object' ? options : {};
        const providedTitle = String(opts.prTitle || '').trim();

        const prTitle = providedTitle || `shader: 投稿 ${entry.title} (${entry.slug})`;

        return {
            targetPath: toReadmeFilePath(entry.slug),
            markdown: readme,
            prTitle: prTitle,
            prBody: [
                'Created by Shader Contribute page.',
                '',
                `- Slug: \`${entry.slug}\``,
                `- Entry: \`${toEntryFilePath(entry.slug)}\``,
                `- Shader: \`${toShaderFilePath(entry.slug)}\``,
                `- README: \`site/content/${toReadmeFilePath(entry.slug)}\``
            ].join('\n'),
            extraFiles: [
                {
                    path: toEntryFilePath(entry.slug),
                    content: `${JSON.stringify(toEntryFilePayload(entry), null, 2)}\n`
                },
                {
                    path: toShaderFilePath(entry.slug),
                    content: `${JSON.stringify(shader, null, 2)}\n`
                }
            ]
        };
    }

    function extractSlugFromTemplateText(templateText) {
        const raw = String(templateText || '');
        const m = raw.match(/"slug"\s*:\s*"([^"]+)"/i);
        if (!m) return 'my-shader';
        return slugFromText(m[1], 'my-shader');
    }

    function copyTextWithFallback(text) {
        const raw = String(text || '');
        if (!raw) return Promise.resolve(false);

        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            return navigator.clipboard.writeText(raw).then(function () {
                return true;
            }).catch(function () {
                return copyByExecCommand(raw);
            });
        }

        return Promise.resolve(copyByExecCommand(raw));
    }

    function copyByExecCommand(text) {
        if (typeof document === 'undefined') return false;
        const ta = document.createElement('textarea');
        ta.value = String(text || '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (_) {
            ok = false;
        }
        ta.remove();
        return ok;
    }

    function downloadText(filename, text) {
        if (typeof document === 'undefined' || typeof URL === 'undefined') return;
        const blob = new Blob([String(text || '')], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function buildTemplateFromPlaygroundState(playgroundState) {
        const source = playgroundState && typeof playgroundState === 'object' ? playgroundState : null;
        if (!source || !Array.isArray(source.passes) || source.passes.length === 0) {
            return null;
        }

        const selectedId = String(source.editorTarget || source.selected || '').trim();
        let selectedPass = source.passes.find(function (pass) {
            return pass && String(pass.id || '') === selectedId;
        });

        if (!selectedPass) {
            selectedPass = source.passes[0] || null;
        }

        const passName = selectedPass && selectedPass.name ? String(selectedPass.name).trim() : 'My Shader';
        const title = passName || 'My Shader';
        const slug = slugFromText(title, 'my-shader');
        const entry = {
            slug: slug,
            title: title,
            author: '你的名字',
            description: `由 Shader Playground 生成，建议基于 ${title} 再做说明。`,
            shader: 'shader.json',
            cover: 'cover.webp',
            tags: ['playground'],
            updated_at: getDateStamp()
        };

        const shader = {
            common: typeof source.common === 'string' ? source.common : '',
            passes: source.passes.map(function (pass, index) {
                return normalizePass(pass, index);
            })
        };

        const readme = [
            `# ${entry.title}`,
            '',
            entry.description,
            '',
            '## 来源',
            '',
            '- 由 `shader-playground.html` 草稿生成。',
            '- 提交前建议在 Playground 重新检查通道输入与输出。',
            ''
        ].join('\n');

        return {
            template: buildContributionTemplate({
                entry: entry,
                shader: shader,
                readme: readme
            }),
            passName: passName || '未命名 Pass',
            source: 'playground'
        };
    }

    function loadDraftTemplate() {
        if (typeof localStorage === 'undefined') return null;

        try {
            const raw = localStorage.getItem(CONTRIBUTION_DRAFT_KEY);
            if (raw) {
                const parsed = safeJsonParse(raw);
                if (parsed && typeof parsed.template === 'string' && parsed.template.trim()) {
                    return {
                        template: parsed.template,
                        passName: String(parsed.passName || '').trim() || '未命名 Pass',
                        source: String(parsed.source || 'draft')
                    };
                }

                if (parsed && parsed.entry && parsed.shader) {
                    const built = {
                        template: buildContributionTemplate({
                            entry: parsed.entry,
                            shader: parsed.shader,
                            readme: parsed.readme || ''
                        }),
                        passName: String(parsed.passName || parsed.entry.title || '').trim() || '未命名 Pass',
                        source: String(parsed.source || 'draft')
                    };
                    return built;
                }
            }
        } catch (_) {
            // ignore broken draft payload
        }

        try {
            const playgroundRaw = localStorage.getItem(PLAYGROUND_STATE_KEY);
            const playgroundState = playgroundRaw ? safeJsonParse(playgroundRaw) : null;
            if (!playgroundState) return null;
            return buildTemplateFromPlaygroundState(playgroundState);
        } catch (_) {
            return null;
        }
    }

    function loadPersistedState() {
        if (typeof localStorage === 'undefined') return null;
        try {
            const raw = localStorage.getItem(STATE_KEY);
            if (!raw) return null;
            const parsed = safeJsonParse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function init() {
        if (typeof document === 'undefined') return;
        const body = document.body;
        if (!body) return;
        if (body.getAttribute('data-shader-contribute-init') === 'true') return;
        body.setAttribute('data-shader-contribute-init', 'true');

        const dom = {
            template: $('shader-contribute-template'),
            copy: $('shader-contribute-copy'),
            download: $('shader-contribute-download'),
            reset: $('shader-contribute-reset'),
            fillDraft: $('shader-contribute-fill-draft'),
            validate: $('shader-contribute-validate'),
            status: $('shader-contribute-status'),
            summary: $('shader-contribute-template-summary'),
            targetEntry: $('shader-contribute-target-entry'),
            targetShader: $('shader-contribute-target-shader'),
            targetReadme: $('shader-contribute-target-readme'),
            submitPr: $('shader-contribute-submit-pr'),
            prWorkerUrl: $('shader-contribute-pr-worker-url'),
            prSharedKey: $('shader-contribute-pr-shared-key'),
            prTitle: $('shader-contribute-pr-title'),
            authLogin: $('shader-contribute-auth-login'),
            authLogout: $('shader-contribute-auth-logout'),
            authStatus: $('shader-contribute-auth-status'),
            lastPrLink: $('shader-contribute-last-pr-link')
        };

        if (!dom.template || !dom.status) return;

        const state = {
            workerApiUrl: DEFAULT_PR_WORKER_API_URL,
            prTitle: '',
            lastPrUrl: '',
            authToken: '',
            githubUser: ''
        };

        let parsePreviewTimer = 0;

        function setStatus(text, isError) {
            dom.status.textContent = `[${nowStamp()}] ${String(text || '')}`;
            if (isError) {
                dom.status.setAttribute('data-error', 'true');
            } else {
                dom.status.removeAttribute('data-error');
            }
        }

        function persistState() {
            if (typeof localStorage === 'undefined') return;
            try {
                localStorage.setItem(STATE_KEY, JSON.stringify({
                    version: 2,
                    updatedAt: new Date().toISOString(),
                    template: String(dom.template.value || ''),
                    workerApiUrl: state.workerApiUrl,
                    prTitle: state.prTitle,
                    lastPrUrl: state.lastPrUrl
                }));
            } catch (_) {
                // ignore local storage failures
            }
        }

        function schedulePersistState() {
            if (parsePreviewTimer) clearTimeout(parsePreviewTimer);
            parsePreviewTimer = setTimeout(function () {
                parsePreviewTimer = 0;
                persistState();
                refreshTemplateTargets(true);
            }, 180);
        }

        function renderTargetPaths(slug) {
            const safeSlug = slugFromText(slug, 'my-shader');
            const entryPath = toEntryFilePath(safeSlug);
            const shaderPath = toShaderFilePath(safeSlug);
            const readmePath = `site/content/${toReadmeFilePath(safeSlug)}`;

            if (dom.targetEntry) dom.targetEntry.textContent = entryPath;
            if (dom.targetShader) dom.targetShader.textContent = shaderPath;
            if (dom.targetReadme) dom.targetReadme.textContent = readmePath;
        }

        function updateSummary(text, isError) {
            if (!dom.summary) return;
            dom.summary.textContent = String(text || '');
            if (isError) {
                dom.summary.setAttribute('data-error', 'true');
            } else {
                dom.summary.removeAttribute('data-error');
            }
        }

        function refreshTemplateTargets(silent) {
            const templateText = String(dom.template.value || '');
            try {
                const parsed = parseContributionTemplate(templateText);
                renderTargetPaths(parsed.entry.slug);
                updateSummary(`slug: ${parsed.entry.slug} · 标题: ${parsed.entry.title} · passes: ${parsed.shader.passes.length}`, false);
                if (!silent) {
                    setStatus(`模板校验通过，目标目录：site/content/shader-gallery/${parsed.entry.slug}/`);
                }
                return parsed;
            } catch (err) {
                const slug = extractSlugFromTemplateText(templateText);
                renderTargetPaths(slug);
                updateSummary(`模板暂未通过校验：${err && err.message ? err.message : String(err)}`, true);
                if (!silent) {
                    setStatus(`模板校验失败：${err && err.message ? err.message : String(err)}`, true);
                }
                return null;
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
                setStatus(`GitHub 登录失败：${oauthError || '未知错误'}`, true);
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
                setStatus('Worker 地址无效，无法验证 GitHub 登录状态', true);
                return;
            }

            try {
                const response = await fetch(meUrl, {
                    method: 'GET',
                    headers: {
                        authorization: `Bearer ${state.authToken}`
                    }
                });

                const responseText = await response.text();
                const responseData = responseText ? safeJsonParse(responseText) : null;

                if (!response.ok || !responseData || responseData.ok !== true || !responseData.user) {
                    clearAuthSession();
                    updateAuthUi();
                    setStatus('GitHub 登录已失效，请重新登录', true);
                    return;
                }

                state.githubUser = String(responseData.user || '').trim();
                persistAuthSession();
                updateAuthUi();
            } catch (err) {
                setStatus(`验证登录状态失败：${err && err.message ? err.message : String(err)}`, true);
            }
        }

        async function startGithubLogin() {
            const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
            if (!apiUrl) {
                setStatus('请先填写 Worker API 地址', true);
                if (dom.prWorkerUrl) dom.prWorkerUrl.focus();
                return;
            }

            const loginUrl = authLoginUrlFromApiUrl(apiUrl);
            if (!loginUrl) {
                setStatus('无法生成 GitHub 登录地址，请检查 Worker API', true);
                return;
            }

            state.workerApiUrl = apiUrl;
            if (dom.prWorkerUrl) dom.prWorkerUrl.value = apiUrl;
            persistState();

            setStatus('正在跳转 GitHub 授权页面...');
            window.location.href = loginUrl;
        }

        function logoutGithub() {
            if (!state.authToken) return;
            clearAuthSession();
            updateAuthUi();
            setStatus('已退出 GitHub 登录状态');
        }

        async function submitPullRequest() {
            const apiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl ? dom.prWorkerUrl.value : state.workerApiUrl);
            const sharedKey = String(dom.prSharedKey ? dom.prSharedKey.value : '').trim();
            const titleInput = String(dom.prTitle ? dom.prTitle.value : '').trim();
            const authToken = String(state.authToken || '').trim();
            const templateText = String(dom.template.value || '');

            if (!apiUrl) {
                setStatus('请先填写 Worker API 地址', true);
                if (dom.prWorkerUrl) dom.prWorkerUrl.focus();
                return;
            }

            if (!authToken && !sharedKey) {
                setStatus('请先点击“GitHub 登录”，或填写兼容密钥', true);
                if (dom.authLogin) dom.authLogin.focus();
                return;
            }

            let parsed = null;
            try {
                parsed = parseContributionTemplate(templateText);
            } catch (err) {
                setStatus(`模板无效，无法提交：${err && err.message ? err.message : String(err)}`, true);
                return;
            }

            const payload = buildContributionPayload(parsed, {
                prTitle: titleInput
            });

            state.workerApiUrl = apiUrl;
            state.prTitle = titleInput;
            if (dom.prWorkerUrl) dom.prWorkerUrl.value = apiUrl;
            persistState();

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
                const requestResult = await postCreatePrWithFallback(
                    apiUrl,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(payload)
                    },
                    function (fallbackApiUrl, attempt, total) {
                        setStatus(`主 Worker 暂不可达，正在尝试备用地址（${attempt}/${total}）...`);
                        if (dom.prWorkerUrl) dom.prWorkerUrl.value = fallbackApiUrl;
                    }
                );

                const response = requestResult.response;
                const usedApiUrl = requestResult.apiUrl;
                const responseText = await response.text();
                const responseData = responseText ? safeJsonParse(responseText) : null;

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

                state.workerApiUrl = usedApiUrl;
                if (dom.prWorkerUrl) dom.prWorkerUrl.value = usedApiUrl;

                const prUrl = String(responseData.prUrl || '').trim();
                updatePrLink(prUrl);
                persistState();

                if (requestResult.usedFallback) {
                    setStatus(`已使用备用 Worker 创建 PR 成功${responseData.prNumber ? ` #${responseData.prNumber}` : ''}`);
                } else {
                    setStatus(`PR 创建成功${responseData.prNumber ? ` #${responseData.prNumber}` : ''}`);
                }

                if (prUrl) {
                    window.open(prUrl, '_blank', 'noopener,noreferrer');
                }
            } catch (err) {
                if (isLikelyWorkerNetworkError(err)) {
                    setStatus('提交 PR 失败：无法连接 Worker 服务（可能被网络策略拦截）。请在“Worker API 地址”中填写可访问域名后重试。', true);
                } else {
                    setStatus(`提交 PR 失败：${err && err.message ? err.message : String(err)}`, true);
                }
            } finally {
                setPrSubmitBusy(false);
            }
        }

        function applyTemplate(template, statusText) {
            if (!template || !String(template).trim()) return;
            dom.template.value = String(template);
            refreshTemplateTargets(true);
            persistState();
            if (statusText) {
                setStatus(statusText);
            }
        }

        function fillFromDraft() {
            const draft = loadDraftTemplate();
            if (!draft || !draft.template) {
                setStatus('未检测到可用的 Playground 草稿', true);
                return;
            }

            applyTemplate(draft.template, `已填充 Playground 草稿：${draft.passName || '未命名 Pass'}`);
        }

        const persisted = loadPersistedState();
        if (persisted) {
            state.workerApiUrl = normalizeWorkerApiUrl(persisted.workerApiUrl || state.workerApiUrl);
            state.prTitle = String(persisted.prTitle || '');
            state.lastPrUrl = String(persisted.lastPrUrl || '');
        }

        loadAuthSession();
        const consumedOauthHash = consumeOauthResultFromHash();

        if (dom.prWorkerUrl) {
            dom.prWorkerUrl.value = state.workerApiUrl;
            dom.prWorkerUrl.addEventListener('change', function () {
                state.workerApiUrl = normalizeWorkerApiUrl(dom.prWorkerUrl.value);
                dom.prWorkerUrl.value = state.workerApiUrl;
                persistState();
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
            dom.prTitle.addEventListener('input', function () {
                state.prTitle = String(dom.prTitle.value || '');
                persistState();
            });
        }

        if (dom.template) {
            if (persisted && typeof persisted.template === 'string' && persisted.template.trim()) {
                dom.template.value = persisted.template;
                refreshTemplateTargets(true);
                setStatus('已载入上次未完成的投稿草稿');
            } else {
                const draft = loadDraftTemplate();
                if (draft && draft.template) {
                    dom.template.value = draft.template;
                    refreshTemplateTargets(true);
                    setStatus(`已载入 Playground 草稿：${draft.passName || '未命名 Pass'}`);
                } else {
                    dom.template.value = buildDefaultTemplate();
                    refreshTemplateTargets(true);
                    setStatus('未检测到草稿，已载入默认投稿模板');
                }
            }

            dom.template.addEventListener('input', schedulePersistState);
        }

        updatePrLink(state.lastPrUrl);
        updateAuthUi();

        if (dom.copy) {
            dom.copy.addEventListener('click', function () {
                copyTextWithFallback(dom.template.value).then(function (ok) {
                    if (ok) {
                        setStatus('投稿模板已复制');
                        return;
                    }
                    setStatus('复制失败，请手动复制模板内容', true);
                });
            });
        }

        if (dom.download) {
            dom.download.addEventListener('click', function () {
                const slug = extractSlugFromTemplateText(dom.template.value);
                downloadText(`shader-contribution-${slug || 'template'}-${getDateStamp()}.md`, dom.template.value);
                setStatus('模板已下载');
            });
        }

        if (dom.reset) {
            dom.reset.addEventListener('click', function () {
                if (!window.confirm('确认恢复默认模板吗？这会覆盖当前模板内容。')) return;
                applyTemplate(buildDefaultTemplate(), '已恢复默认模板');
            });
        }

        if (dom.fillDraft) {
            dom.fillDraft.addEventListener('click', fillFromDraft);
        }

        if (dom.validate) {
            dom.validate.addEventListener('click', function () {
                refreshTemplateTargets(false);
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

        setPrSubmitBusy(false);
        if (state.authToken) {
            verifyAuthSession();
        }

        if (!consumedOauthHash && !dom.status.textContent) {
            setStatus('就绪：支持从 Shader Playground 填充草稿并自动提交 PR');
        }
    }

    return {
        init: init,
        normalizeWorkerApiUrl: normalizeWorkerApiUrl,
        buildWorkerApiCandidates: buildWorkerApiCandidates,
        isLikelyWorkerNetworkError: isLikelyWorkerNetworkError,
        normalizeSlug: normalizeSlug,
        parseContributionTemplate: parseContributionTemplate,
        buildContributionPayload: buildContributionPayload,
        buildContributionTemplate: buildContributionTemplate,
        buildDefaultTemplate: buildDefaultTemplate,
        buildTemplateFromPlaygroundState: buildTemplateFromPlaygroundState
    };
});

