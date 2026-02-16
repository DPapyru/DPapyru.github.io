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
    assert.match(html, /id="studio-markdown-guide-modal"[^>]*studio-side-panel-modal/);
    assert.match(html, /id="studio-draft-check-modal"[^>]*studio-side-panel-modal/);
    assert.match(html, /id="studio-pr-asset-decision-modal"/);
    assert.match(html, /id="studio-pr-asset-decision-close"/);
    assert.match(html, /id="studio-pr-asset-decision-choice-stage"/);
    assert.match(html, /id="studio-pr-asset-decision-continue-stage"/);
    assert.match(html, /id="studio-pr-asset-decision-clear-stage"/);
});

test('article studio html keeps only requested actions in more snippets', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /data-studio-insert="ref"/);
    assert.match(html, /data-studio-insert="quiz-tf"/);
    assert.match(html, /data-studio-insert="quiz-choice"/);
    assert.match(html, /data-studio-insert="quiz-multi"/);
    assert.match(html, /data-studio-insert="color-inline"/);
    assert.match(html, /data-studio-insert="color-change-inline"/);
    assert.match(html, /data-studio-insert="animcs-block"/);
    assert.match(html, /data-studio-insert="anim"/);
    assert.match(html, />选择题<\/button>/);

    assert.doesNotMatch(html, /data-studio-insert="source-cs"/);
    assert.doesNotMatch(html, /data-studio-insert="min-gate"/);
    assert.doesNotMatch(html, /data-studio-insert="cs-method"/);
    assert.doesNotMatch(html, /data-studio-insert="cs-property"/);
    assert.doesNotMatch(html, /data-studio-insert="cs-field"/);
    assert.doesNotMatch(html, /data-studio-insert="cs-constant"/);
    assert.doesNotMatch(html, /data-studio-insert="cs-enum"/);
    assert.doesNotMatch(html, /data-studio-insert="quiz-single"/);
    assert.doesNotMatch(html, /data-studio-insert="mermaid-flowchart"/);
    assert.doesNotMatch(html, /class="studio-advanced-panel studio-extension-panel"/);
});

test('article studio markdown guide content covers full project markdown scope', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /标准 Markdown/);
    assert.match(html, /Front Matter（项目字段全集）/);
    assert.match(html, /source_cs/);
    assert.match(html, /min_c/);
    assert.match(html, /min_t/);
    assert.match(html, /\{\{cs:/);
    assert.match(html, /\{\{anim:/);
    assert.match(html, /```animcs/);
    assert.match(html, /```mermaid/);
    assert.match(html, /```quiz/);
    assert.match(html, /\{color:/);
    assert.match(html, /\{colorChange:/);
});

test('article studio js wires guide and draft panel through shared side-panel modal logic', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /openMarkdownGuide:\s*document\.getElementById\('studio-open-markdown-guide'\)/);
    assert.match(js, /runDraftCheck:\s*document\.getElementById\('studio-run-draft-check'\)/);
    assert.match(js, /markdownGuideModal:\s*document\.getElementById\('studio-markdown-guide-modal'\)/);
    assert.match(js, /markdownGuideClose:\s*document\.getElementById\('studio-markdown-guide-close'\)/);
    assert.match(js, /draftCheckModal:\s*document\.getElementById\('studio-draft-check-modal'\)/);
    assert.match(js, /draftCheckClose:\s*document\.getElementById\('studio-draft-check-close'\)/);
    assert.match(js, /draftCheckSummary:\s*document\.getElementById\('studio-draft-check-summary'\)/);
    assert.match(js, /draftCheckList:\s*document\.getElementById\('studio-draft-check-list'\)/);
    assert.match(js, /prAssetDecisionModal:\s*document\.getElementById\('studio-pr-asset-decision-modal'\)/);
    assert.match(js, /prAssetDecisionClose:\s*document\.getElementById\('studio-pr-asset-decision-close'\)/);
    assert.match(js, /prAssetContinueSelect:\s*document\.getElementById\('studio-pr-asset-continue-select'\)/);

    assert.match(js, /const\s+SIDE_PANEL_KEYS\s*=\s*\['left',\s*'right',\s*'guide',\s*'draft',\s*'asset'\]/);
    assert.match(js, /function\s+getSidePanelModalRef\s*\(/);
    assert.match(js, /setSidePanelModalOpen\('guide'/);
    assert.match(js, /setSidePanelModalOpen\('draft'/);
    assert.match(js, /setSidePanelModalOpen\('asset'/);
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
    assert.match(runDraftCheckFn, /setSidePanelModalOpen\('draft',\s*true\)/);
    assert.doesNotMatch(runDraftCheckFn, /setPrSubmitBusy\(/);
    assert.doesNotMatch(runDraftCheckFn, /submitPr\.disabled/);
});

test('article studio js draft check validates animcs block paths', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /const\s+animcsRegex\s*=\s*\/```animcs/);
    assert.match(js, /animcs-path-missing/);
    assert.match(js, /animcs-path-prefix-invalid/);
    assert.match(js, /animcs-path-ext-invalid/);
});

test('article studio js applyInsertAction includes complete project syntax actions', () => {
    const js = read('site/assets/js/article-studio.js');
    const fn = getFunctionBody(js, 'applyInsertAction');

    assert.ok(fn, 'applyInsertAction should exist');
    assert.match(fn, /key\s*===\s*'source-cs'/);
    assert.match(fn, /key\s*===\s*'min-gate'/);
    assert.match(fn, /key\s*===\s*'mermaid-flowchart'/);
    assert.match(fn, /key\s*===\s*'animcs-block'/);
    assert.match(fn, /key\s*===\s*'cs-method'/);
    assert.match(fn, /key\s*===\s*'cs-property'/);
    assert.match(fn, /key\s*===\s*'cs-field'/);
    assert.match(fn, /key\s*===\s*'cs-constant'/);
    assert.match(fn, /key\s*===\s*'cs-enum'/);
    assert.match(fn, /key\s*===\s*'color-inline'/);
    assert.match(fn, /key\s*===\s*'color-change-inline'/);
    assert.match(fn, /key\s*===\s*'quiz-choice'/);
});

test('article studio css includes guide and draft check modal styles', () => {
    const css = read('site/assets/css/article-studio.css');

    assert.match(css, /#studio-markdown-guide-modal\s+\.studio-side-panel-modal-content\s*\{/);
    assert.match(css, /\.studio-markdown-guide-content\s*\{/);
    assert.match(css, /#studio-draft-check-modal\s+\.studio-side-panel-modal-content\s*\{/);
    assert.match(css, /\.studio-draft-check-content\s*\{/);
    assert.match(css, /\.studio-draft-check-list\s*\{/);
    assert.match(css, /\.studio-draft-check-item--error\s*\{/);
    assert.match(css, /\.studio-draft-check-item--warn\s*\{/);
    assert.match(css, /#studio-pr-asset-decision-modal\s+\.studio-side-panel-modal-content\s*\{/);
    assert.match(css, /\.studio-pr-asset-decision-content\s*\{/);
    assert.match(css, /\.studio-pr-asset-decision-actions\s*\{/);
    assert.doesNotMatch(css, /\.studio-extension-panel\s*\{/);
});
