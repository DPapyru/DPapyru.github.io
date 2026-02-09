(function () {
    'use strict';

    const CONTRIBUTION_DRAFT_KEY = 'shader-playground.contribute-draft.v1';

    function $(id) {
        return document.getElementById(id);
    }

    function safeJsonParse(text) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function getDateStamp() {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
    }

    function buildDefaultTemplate() {
        const updatedAt = getDateStamp();
        const lines = [];
        lines.push('# Shader 投稿模板');
        lines.push('');
        lines.push('建议目录：`site/content/shader-gallery/my-shader/`');
        lines.push('');
        lines.push('## entry.json');
        lines.push('```json');
        lines.push('{');
        lines.push('  "slug": "my-shader",');
        lines.push('  "title": "My Shader",');
        lines.push('  "author": "你的名字",');
        lines.push('  "description": "简要描述这个 Shader 的用途与效果。",');
        lines.push('  "shader": "shader.json",');
        lines.push('  "cover": "cover.webp",');
        lines.push('  "tags": ["demo"],');
        lines.push('  "updated_at": "' + updatedAt + '"');
        lines.push('}');
        lines.push('```');
        lines.push('');
        lines.push('## shader.json');
        lines.push('```json');
        lines.push('{');
        lines.push('  "common": "",');
        lines.push('  "passes": [');
        lines.push('    {');
        lines.push('      "name": "Pass 1",');
        lines.push('      "type": "image",');
        lines.push('      "scale": 1,');
        lines.push('      "code": "",');
        lines.push('      "channels": [');
        lines.push('        { "kind": "none" },');
        lines.push('        { "kind": "none" },');
        lines.push('        { "kind": "none" },');
        lines.push('        { "kind": "none" }');
        lines.push('      ]');
        lines.push('    }');
        lines.push('  ]');
        lines.push('}');
        lines.push('```');
        lines.push('');
        lines.push('提交前运行：');
        lines.push('```bash');
        lines.push('npm run gallery:normalize');
        lines.push('npm run gallery:check');
        lines.push('```');
        return lines.join('\n');
    }

    function loadDraftTemplate() {
        try {
            const raw = localStorage.getItem(CONTRIBUTION_DRAFT_KEY);
            if (!raw) return null;
            const payload = safeJsonParse(raw);
            if (!payload || typeof payload.template !== 'string') return null;
            return {
                template: payload.template,
                passName: typeof payload.passName === 'string' ? payload.passName : ''
            };
        } catch (_) {
            return null;
        }
    }

    function setStatus(text, isError) {
        const status = $('shader-contribute-status');
        if (!status) return;
        status.textContent = String(text || '');
        if (isError) {
            status.setAttribute('data-error', 'true');
        } else {
            status.removeAttribute('data-error');
        }
    }

    async function copyTextWithFallback(text) {
        const raw = String(text || '');
        if (!raw) return false;
        try {
            await navigator.clipboard.writeText(raw);
            return true;
        } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = raw;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
            document.body.removeChild(ta);
            return ok;
        }
    }

    function downloadText(filename, text) {
        const blob = new Blob([String(text || '')], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function init() {
        const templateEl = $('shader-contribute-template');
        const copyBtn = $('shader-contribute-copy');
        const downloadBtn = $('shader-contribute-download');
        const resetBtn = $('shader-contribute-reset');
        if (!templateEl || !copyBtn || !downloadBtn || !resetBtn) return;

        const draft = loadDraftTemplate();
        if (draft && draft.template.trim()) {
            templateEl.value = draft.template;
            setStatus('已载入 Playground 草稿：' + (draft.passName || '未命名 Pass'));
        } else {
            templateEl.value = buildDefaultTemplate();
            setStatus('未检测到 Playground 草稿，已载入默认模板。');
        }

        copyBtn.addEventListener('click', async function () {
            const ok = await copyTextWithFallback(templateEl.value);
            if (ok) {
                setStatus('投稿模板已复制。');
                return;
            }
            setStatus('复制失败，请手动复制模板内容。', true);
        });

        downloadBtn.addEventListener('click', function () {
            const stamp = getDateStamp();
            downloadText('shader-contribution-template-' + stamp + '.md', templateEl.value);
            setStatus('模板已下载。');
        });

        resetBtn.addEventListener('click', function () {
            templateEl.value = buildDefaultTemplate();
            setStatus('已恢复默认模板。');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
