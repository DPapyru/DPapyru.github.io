import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('markdown plugin strips legacy site header and ignores bridge script', () => {
    const source = fs.readFileSync(path.join(root, 'src/workspaces/markdown/index.js'), 'utf8');
    assert.match(source, /stripSelectors:\s*\['header\.site-header'\]/);
    assert.match(source, /markdown-bridge/);
    assert.match(source, /workspace\.open-submit-panel/);
    assert.match(source, /articleStudioMarkdown\.v9/);
    assert.match(source, /articleStudioViewerPreview\.v1/);
});

test('shader plugin strips legacy site header and ignores bridge script', () => {
    const source = fs.readFileSync(path.join(root, 'src/workspaces/shader/index.js'), 'utf8');
    assert.match(source, /stripSelectors:\s*\['header\.site-header'\]/);
    assert.match(source, /shader-bridge/);
    assert.match(source, /workspace\.open-submit-panel/);
    assert.match(source, /shader-contribute\.state\.v2/);
    assert.match(source, /shader-playground\.v1/);
});

test('main shell dispatches submit-panel command through workspace plugins', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
    assert.match(source, /dispatchWorkspaceCommand\('markdown',\s*'workspace\.open-submit-panel'\)/);
    assert.match(source, /dispatchWorkspaceCommand\('shader',\s*'workspace\.open-submit-panel'\)/);
    assert.match(source, /requestWorkspaceCollect\('markdown'\)/);
    assert.match(source, /requestWorkspaceCollect\('shader'\)/);
    assert.doesNotMatch(source, /postMessageToSubapp/);
});
