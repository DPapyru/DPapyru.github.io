const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
    return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

test('article studio html includes flowchart modal controls in editor column', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-flowchart-toggle"/);
    assert.match(html, /aria-controls="studio-flowchart-modal"/);
    assert.match(html, /id="studio-flowchart-modal"/);
    assert.match(html, /Flowchart Studio \(v1\)/);
    assert.match(html, /id="studio-flowchart-mode-visual"/);
    assert.match(html, /id="studio-flowchart-mode-source"/);
    assert.match(html, /id="studio-flowchart-modal-close"/);
    assert.match(html, /id="studio-flowchart-realtime-toggle"/);
    assert.match(html, /id="studio-flowchart-node-list"/);
    assert.match(html, /id="studio-flowchart-edge-list"/);
});

test('article studio js wires flowchart modal binding and realtime apply', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /studio-flowchart-toggle/);
    assert.match(js, /studio-flowchart-modal/);
    assert.match(js, /function\s+setFlowchartModalOpen\s*\(/);
    assert.match(js, /FLOWCHART_REALTIME_DEBOUNCE_MS/);
    assert.match(js, /function\s+findMermaidBlockAroundSelection\s*\(/);
    assert.match(js, /function\s+buildMermaidFlowchartFromModel\s*\(/);
    assert.match(js, /function\s+parseMermaidFlowchartToModel\s*\(/);
    assert.match(js, /function\s+scheduleFlowchartRealtimeApply\s*\(/);
    assert.match(js, /实时写入：已开启/);
});

test('article studio css defines flowchart modal layout and responsive rows', () => {
    const css = read('site/assets/css/article-studio.css');

    assert.match(css, /\.studio-flowchart-modal-content\s*\{/);
    assert.match(css, /\.studio-flowchart-modal-body\s*\{/);
    assert.match(css, /\.studio-flowchart-toolbar\s*\{/);
    assert.match(css, /\.studio-flowchart-list\s*\{/);
    assert.match(css, /\.studio-flowchart-row\s*\{/);
    assert.match(css, /\.studio-flowchart-source\s*\{/);
});
