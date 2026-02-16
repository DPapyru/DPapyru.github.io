const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
    return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

function getFunctionBody(source, name) {
    const re = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
    const match = re.exec(source);
    if (!match) return '';

    let index = match.index + match[0].length;
    let depth = 1;
    while (index < source.length) {
        const ch = source[index];
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
        if (depth === 0) {
            return source.slice(match.index, index + 1);
        }
        index += 1;
    }
    return '';
}

test('article studio html includes markdown guide and draft check controls', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-open-markdown-guide"/);
    assert.match(html, /id="studio-run-draft-check"/);
    assert.match(html, /id="studio-markdown-guide-modal"/);
    assert.match(html, /id="studio-markdown-guide-close"/);
    assert.match(html, /id="studio-draft-check-modal"/);
    assert.match(html, /id="studio-draft-check-close"/);
    assert.match(html, /id="studio-draft-check-summary"/);
    assert.match(html, /id="studio-draft-check-list"/);
});

test('article studio html includes project extension insert actions', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /data-studio-insert="source-cs"/);
    assert.match(html, /data-studio-insert="mermaid-flowchart"/);
    assert.match(html, /data-studio-insert="color-inline"/);
    assert.match(html, /data-studio-insert="color-change-inline"/);
});

test('article studio js wires guide modal and draft check modal', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /openMarkdownGuide:\s*document\.getElementById\('studio-open-markdown-guide'\)/);
    assert.match(js, /runDraftCheck:\s*document\.getElementById\('studio-run-draft-check'\)/);
    assert.match(js, /markdownGuideModal:\s*document\.getElementById\('studio-markdown-guide-modal'\)/);
    assert.match(js, /markdownGuideClose:\s*document\.getElementById\('studio-markdown-guide-close'\)/);
    assert.match(js, /draftCheckModal:\s*document\.getElementById\('studio-draft-check-modal'\)/);
    assert.match(js, /draftCheckClose:\s*document\.getElementById\('studio-draft-check-close'\)/);
    assert.match(js, /draftCheckSummary:\s*document\.getElementById\('studio-draft-check-summary'\)/);
    assert.match(js, /draftCheckList:\s*document\.getElementById\('studio-draft-check-list'\)/);

    assert.match(js, /function\s+isGuideModalOpen\s*\(/);
    assert.match(js, /function\s+setGuideModalOpen\s*\(/);
    assert.match(js, /function\s+isDraftCheckModalOpen\s*\(/);
    assert.match(js, /function\s+setDraftCheckModalOpen\s*\(/);
});

test('article studio js supports draft check and keeps it warning-only', () => {
    const js = read('site/assets/js/article-studio.js');
    const runDraftCheckFn = getFunctionBody(js, 'runDraftCheck');

    assert.match(js, /function\s+collectDraftCheckIssues\s*\(/);
    assert.match(js, /function\s+renderDraftCheckResults\s*\(/);
    assert.match(js, /level:\s*'error'\s*\|\s*'warn'/);
    assert.ok(runDraftCheckFn, 'runDraftCheck should exist');
    assert.match(runDraftCheckFn, /collectDraftCheckIssues\(/);
    assert.match(runDraftCheckFn, /renderDraftCheckResults\(/);
    assert.match(runDraftCheckFn, /setDraftCheckModalOpen\(true\)/);
    assert.doesNotMatch(runDraftCheckFn, /setPrSubmitBusy\(/);
    assert.doesNotMatch(runDraftCheckFn, /submitPr\.disabled/);
});

test('article studio js applyInsertAction includes extension quick actions', () => {
    const js = read('site/assets/js/article-studio.js');
    const fn = getFunctionBody(js, 'applyInsertAction');

    assert.ok(fn, 'applyInsertAction should exist');
    assert.match(fn, /key\s*===\s*'source-cs'/);
    assert.match(fn, /key\s*===\s*'mermaid-flowchart'/);
    assert.match(fn, /key\s*===\s*'color-inline'/);
    assert.match(fn, /key\s*===\s*'color-change-inline'/);
});

test('article studio css includes guide and draft check modal styles', () => {
    const css = read('site/assets/css/article-studio.css');

    assert.match(css, /\.studio-markdown-guide-modal-content\s*\{/);
    assert.match(css, /\.studio-markdown-guide-content\s*\{/);
    assert.match(css, /\.studio-draft-check-modal-content\s*\{/);
    assert.match(css, /\.studio-draft-check-list\s*\{/);
    assert.match(css, /\.studio-draft-check-item--error\s*\{/);
    assert.match(css, /\.studio-draft-check-item--warn\s*\{/);
    assert.match(css, /\.studio-extension-panel\s*\{/);
});
