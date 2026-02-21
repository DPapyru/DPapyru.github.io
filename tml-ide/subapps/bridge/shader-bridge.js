(function () {
    'use strict';

    var SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    var SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';

    function normalizePath(path) {
        return String(path || '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');
    }

    function toRepoPath(path) {
        return normalizePath(path);
    }

    function getValue(id) {
        var el = document.getElementById(id);
        if (!el) return '';
        return String(el.value || '').trim();
    }

    function collect() {
        var template = getValue('shader-contribute-template');
        var workerApiUrl = getValue('shader-contribute-pr-worker-url');
        var prTitle = getValue('shader-contribute-pr-title');

        var authToken = '';
        var githubUser = '';
        try {
            authToken = String(sessionStorage.getItem(SESSION_AUTH_TOKEN_KEY) || '');
            githubUser = String(sessionStorage.getItem(SESSION_AUTH_USER_KEY) || '');
        } catch (_) {
            authToken = '';
            githubUser = '';
        }

        var payload = null;
        var files = [];
        var targetPath = '';
        var markdown = '';
        var warnings = [];

        try {
            if (window.ShaderContribute && typeof window.ShaderContribute.parseContributionTemplate === 'function' && typeof window.ShaderContribute.buildContributionPayload === 'function') {
                var parsed = window.ShaderContribute.parseContributionTemplate(template);
                payload = window.ShaderContribute.buildContributionPayload(parsed, {
                    prTitle: prTitle
                });

                targetPath = toRepoPath(payload && payload.targetPath || '');
                markdown = String(payload && payload.markdown || '');

                if (targetPath && markdown) {
                    files.push({
                        path: toRepoPath('site/content/' + targetPath),
                        content: markdown,
                        encoding: 'utf8',
                        source: 'shader-readme',
                        isMainMarkdown: true
                    });
                }

                (Array.isArray(payload && payload.extraFiles) ? payload.extraFiles : []).forEach(function (item) {
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
        } catch (err) {
            warnings.push(String(err && err.message ? err.message : err || 'Shader 模板解析失败'));
        }

        return {
            workspace: 'shader',
            targetPath: toRepoPath('site/content/' + targetPath),
            markdown: markdown,
            files: files,
            workerApiUrl: workerApiUrl,
            prTitle: prTitle,
            authToken: authToken,
            githubUser: githubUser,
            warnings: warnings,
            updatedAt: new Date().toISOString()
        };
    }

    function postToParent(type, payload) {
        if (!window.parent || window.parent === window) return;
        window.parent.postMessage({
            type: type,
            source: 'tml-ide-subapp',
            workspace: 'shader',
            payload: payload || {}
        }, window.location.origin);
    }

    function emitSnapshot() {
        postToParent('tml-ide-subapp:staged', collect());
    }

    function installAutoEmit() {
        var debounced = 0;
        function schedule() {
            if (debounced) {
                window.clearTimeout(debounced);
            }
            debounced = window.setTimeout(function () {
                debounced = 0;
                emitSnapshot();
            }, 180);
        }

        document.addEventListener('input', schedule, true);
        document.addEventListener('change', schedule, true);
        var submitBtn = document.getElementById('shader-contribute-submit-pr');
        if (submitBtn) {
            submitBtn.addEventListener('click', schedule);
        }
    }

    window.addEventListener('message', function (event) {
        if (!event || event.origin !== window.location.origin) return;
        var data = event.data || {};
        if (!data || typeof data !== 'object') return;

        if (data.type === 'tml-ide-host:collect') {
            emitSnapshot();
            return;
        }

        if (data.type === 'tml-ide-host:ping') {
            postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'shader' });
            return;
        }

        if (data.type === 'tml-ide-host:open-submit-panel') {
            var panel = document.getElementById('shaderpg-contribute-panel');
            if (panel) {
                panel.hidden = false;
                panel.removeAttribute('hidden');
            }
            emitSnapshot();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            installAutoEmit();
            postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'shader' });
            emitSnapshot();
        });
    } else {
        installAutoEmit();
        postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'shader' });
        emitSnapshot();
    }
})();
