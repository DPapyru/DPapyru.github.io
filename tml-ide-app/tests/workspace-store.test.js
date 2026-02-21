import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createDefaultWorkspace,
    exportWorkspaceJson,
    importWorkspaceJson,
    loadUnifiedWorkspaceState,
    saveUnifiedWorkspaceState
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

function installStorage(seed) {
    const map = new Map(Object.entries(seed || {}));
    return {
        getItem(key) {
            return map.has(key) ? map.get(key) : null;
        },
        setItem(key, value) {
            map.set(String(key), String(value));
        },
        removeItem(key) {
            map.delete(String(key));
        },
        dump() {
            return Object.fromEntries(map.entries());
        }
    };
}

test('loadUnifiedWorkspaceState migrates workspace.v2 and legacy markdown/shader keys to workspace.v3 schema', async () => {
    const backup = {
        localStorage: globalThis.localStorage,
        indexedDB: globalThis.indexedDB
    };

    globalThis.indexedDB = undefined;
    globalThis.localStorage = installStorage({
        'tml-ide-workspace.v2': JSON.stringify({
            schemaVersion: 2,
            lastWorkspace: 'shader',
            snapshots: {
                csharp: {
                    updatedAt: '2026-02-21T00:00:00.000Z',
                    files: [{ id: 'file-a', path: 'Program.cs', content: 'class Program {}' }]
                },
                markdown: {
                    workspace: 'markdown',
                    targetPath: 'site/content/怎么贡献/a.md',
                    markdown: '# title',
                    files: []
                },
                shader: {
                    workspace: 'shader',
                    targetPath: 'site/content/shader-gallery/demo/README.md',
                    markdown: '# shader',
                    files: []
                }
            },
            submit: {
                workerApiUrl: 'https://example.com/api/create-pr',
                prTitle: 'test',
                existingPrNumber: '',
                anchorPath: '',
                resume: null,
                lastCollection: null
            }
        }),
        'articleStudioMarkdown.v9': JSON.stringify({ draft: 'markdown-legacy' }),
        'articleStudioViewerPreview.v1': JSON.stringify({ mode: 'viewer' }),
        'shader-playground.v1': JSON.stringify({ passes: [{ id: 'pass-1' }] }),
        'shader-contribute.state.v2': JSON.stringify({ prTitle: 'shader legacy' }),
        'shader-playground.contribute-draft.v1': JSON.stringify({ slug: 'demo' })
    });

    const unified = await loadUnifiedWorkspaceState();

    assert.equal(unified.schemaVersion, 3);
    assert.equal(unified.lastWorkspace, 'shader');
    assert.equal(unified.snapshots.csharp.files.length, 1);
    assert.equal(unified.snapshots.markdown.staged.targetPath, 'site/content/怎么贡献/a.md');
    assert.deepEqual(unified.snapshots.markdown.legacyState, { draft: 'markdown-legacy' });
    assert.deepEqual(unified.snapshots.markdown.viewerPreview, { mode: 'viewer' });
    assert.equal(unified.snapshots.shader.staged.targetPath, 'site/content/shader-gallery/demo/README.md');
    assert.deepEqual(unified.snapshots.shader.playgroundState, { passes: [{ id: 'pass-1' }] });
    assert.deepEqual(unified.snapshots.shader.contributeState, { prTitle: 'shader legacy' });
    assert.deepEqual(unified.snapshots.shader.contributionDraft, { slug: 'demo' });

    globalThis.localStorage = backup.localStorage;
    globalThis.indexedDB = backup.indexedDB;
});

test('saveUnifiedWorkspaceState persists normalized workspace.v3 payload to fallback storage', async () => {
    const backup = {
        localStorage: globalThis.localStorage,
        indexedDB: globalThis.indexedDB
    };

    globalThis.indexedDB = undefined;
    const storage = installStorage();
    globalThis.localStorage = storage;

    await saveUnifiedWorkspaceState({
        schemaVersion: 2,
        lastWorkspace: 'markdown',
        snapshots: {
            markdown: {
                workspace: 'markdown',
                targetPath: 'site/content/怎么贡献/save.md',
                markdown: '# save',
                files: []
            }
        },
        submit: {
            workerApiUrl: 'https://example.com/api/create-pr'
        }
    });

    const payload = JSON.parse(storage.dump()['tml-ide-workspace.v3']);
    assert.equal(payload.schemaVersion, 3);
    assert.equal(payload.lastWorkspace, 'markdown');
    assert.equal(payload.snapshots.markdown.staged.targetPath, 'site/content/怎么贡献/save.md');
    assert.equal(payload.submit.workerApiUrl, 'https://example.com/api/create-pr');

    globalThis.localStorage = backup.localStorage;
    globalThis.indexedDB = backup.indexedDB;
});
