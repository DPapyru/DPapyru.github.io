(function () {
    'use strict';

    var STORAGE_KEY = 'articleStudioMarkdown.v9';
    var SESSION_AUTH_TOKEN_KEY = 'articleStudioOAuthToken.v1';
    var SESSION_AUTH_USER_KEY = 'articleStudioOAuthUser.v1';

    function safeJsonParse(text) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function normalizePath(path) {
        return String(path || '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');
    }

    function toRepoContentPath(path) {
        var p = normalizePath(path);
        if (!p) return '';
        if (/^site\/content\//i.test(p)) return p;
        return 'site/content/' + p;
    }

    function getDomValue(id) {
        var el = document.getElementById(id);
        if (!el) return '';
        return String(el.value || '').trim();
    }

    function readPersisted() {
        var raw = '';
        try {
            raw = localStorage.getItem(STORAGE_KEY) || '';
        } catch (_) {
            raw = '';
        }
        return safeJsonParse(raw) || {};
    }

    function buildDraftFiles(parsed, activeTargetPath, activeMarkdown) {
        var files = [];
        var map = parsed && parsed.draftFiles && typeof parsed.draftFiles === 'object' ? parsed.draftFiles : {};
        var activePath = normalizePath(activeTargetPath);
        Object.keys(map).forEach(function (key) {
            var record = map[key] || {};
            var path = normalizePath(record.path || key);
            if (!path) return;
            var full = toRepoContentPath(path);
            if (!full) return;
            if (String(record.status || '') === 'deleted') {
                files.push({ path: full, op: 'delete', source: 'markdown-draft' });
                return;
            }
            var content = String(record.markdown || '');
            if (path === activePath && content === String(activeMarkdown || '')) {
                return;
            }
            files.push({ path: full, content: content, encoding: 'utf8', source: 'markdown-draft' });
        });
        return files;
    }

    function buildUploadedFiles(parsed, key, source) {
        var arr = parsed && Array.isArray(parsed[key]) ? parsed[key] : [];
        return arr.map(function (item) {
            var assetPath = toRepoContentPath(item && item.assetPath);
            if (!assetPath) return null;
            if (source === 'image' || source === 'media') {
                return {
                    path: assetPath,
                    content: String(item && item.base64 || ''),
                    encoding: 'base64',
                    source: source
                };
            }
            return {
                path: assetPath,
                content: String(item && item.content || ''),
                encoding: 'utf8',
                source: source
            };
        }).filter(function (item) {
            return item && String(item.content || '').length > 0;
        });
    }

    function collect() {
        var parsed = readPersisted();

        var domTargetPath = getDomValue('studio-target-path');
        var domMarkdown = getDomValue('studio-markdown');

        var targetPath = normalizePath(domTargetPath || parsed.targetPath || '');
        var markdown = String(domMarkdown || parsed.markdown || '');

        var files = [];

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

        var workerApiUrl = getDomValue('studio-pr-worker-url') || String(parsed.workerApiUrl || '');
        var prTitle = getDomValue('studio-pr-title') || String(parsed.prTitle || '');

        var authToken = '';
        var githubUser = '';
        try {
            authToken = String(sessionStorage.getItem(SESSION_AUTH_TOKEN_KEY) || '');
            githubUser = String(sessionStorage.getItem(SESSION_AUTH_USER_KEY) || '');
        } catch (_) {
            authToken = '';
            githubUser = '';
        }

        return {
            workspace: 'markdown',
            targetPath: toRepoContentPath(targetPath),
            markdown: markdown,
            files: files,
            workerApiUrl: workerApiUrl,
            prTitle: prTitle,
            authToken: authToken,
            githubUser: githubUser,
            updatedAt: new Date().toISOString()
        };
    }

    function postToParent(type, payload) {
        if (!window.parent || window.parent === window) return;
        window.parent.postMessage({
            type: type,
            source: 'tml-ide-subapp',
            workspace: 'markdown',
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
        window.addEventListener('storage', function (event) {
            if (!event) return;
            if (String(event.key || '') !== STORAGE_KEY) return;
            schedule();
        });
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
            postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'markdown' });
            return;
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            installAutoEmit();
            postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'markdown' });
            emitSnapshot();
        });
    } else {
        installAutoEmit();
        postToParent('tml-ide-subapp:ready', { ready: true, workspace: 'markdown' });
        emitSnapshot();
    }
})();
