import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('index.html exposes workbench contracts for activity, panel tabs and command palette', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

    assert.match(html, /aria-label="Activity Bar"/);
    assert.match(html, /data-activity="explorer"/);
    assert.match(html, /data-panel-tab="problems"/);
    assert.match(html, /data-panel-tab="compile"/);
    assert.match(html, /data-panel-tab="errors"/);
    assert.match(html, /data-panel-view="problems"/);
    assert.match(html, /id="command-palette"/);
    assert.match(html, /id="command-palette-input"/);
    assert.match(html, /id="command-palette-results"/);
    assert.match(html, /id="markdown-preview-pane"/);
    assert.match(html, /id="shader-pip"/);
    assert.match(html, /id="unified-submit-panel"/);
    assert.doesNotMatch(html, /id="workspace-plugin-host"/);
});

test('main.js restores vscode-like shortcut labels and debug wrappers', () => {
    const js = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(js, /Ctrl\+Shift\+P/);
    assert.match(js, /Ctrl\+P/);
    assert.match(js, /Ctrl\+B/);
    assert.match(js, /Ctrl\+J/);
    assert.match(js, /Ctrl\+S/);
    assert.match(js, /requestCompletionsAtCursor/);
    assert.match(js, /requestHoverAtCursor/);
    assert.match(js, /problemsSummary/);
    assert.match(js, /problemsList/);
    assert.match(js, /revealLineInCenter/);
    assert.match(js, /renderProblems/);
    assert.match(js, /createPluginRegistry/);
    assert.match(js, /runSplitUnifiedSubmit/);
    assert.doesNotMatch(js, /postMessageToSubapp/);
});
