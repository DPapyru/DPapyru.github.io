import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createDefaultWorkspace,
    exportWorkspaceJson,
    importWorkspaceJson
} from '../src/lib/workspace-store.js';

test('workspace export/import keeps schemaVersion and files', () => {
    const workspace = createDefaultWorkspace();
    const json = exportWorkspaceJson(workspace);
    const parsed = importWorkspaceJson(json);

    assert.equal(parsed.schemaVersion, 1);
    assert.ok(Array.isArray(parsed.files));
    assert.ok(parsed.files.length >= 1);
    assert.ok(parsed.files[0].path.endsWith('.cs'));
});

test('workspace import normalizes malformed payload', () => {
    const parsed = importWorkspaceJson(JSON.stringify({ files: [{ path: 'A.cs' }] }));
    assert.equal(parsed.schemaVersion, 1);
    assert.equal(parsed.files.length, 1);
    assert.equal(parsed.activeFileId, parsed.files[0].id);
});
