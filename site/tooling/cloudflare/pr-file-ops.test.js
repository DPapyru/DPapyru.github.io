const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
    const absPath = path.resolve(__dirname, './pr-file-ops.js');
    return await import(pathToFileURL(absPath).href);
}

test('resolveRequestFiles supports files[] with upsert/delete', async () => {
    const mod = await loadModule();
    const result = mod.resolveRequestFiles({
        files: [
            {
                path: 'site/content/docs/a.md',
                op: 'upsert',
                content: '# a',
                encoding: 'utf8'
            },
            {
                path: 'site/content/docs/b.md',
                op: 'delete'
            }
        ]
    });

    assert.equal(result.mode, 'files');
    assert.equal(result.files.length, 2);
    assert.equal(result.files[0].op, 'upsert');
    assert.equal(result.files[1].op, 'delete');
    assert.equal(result.files[1].path, 'site/content/docs/b.md');
});

test('resolveRequestFiles converts legacy targetPath/markdown/extraFiles', async () => {
    const mod = await loadModule();
    const result = mod.resolveRequestFiles({
        targetPath: 'docs/legacy.md',
        markdown: '# legacy',
        extraFiles: [
            {
                path: 'site/content/shader-gallery/demo/pass-1.fx',
                content: 'float4 MainPS() : SV_TARGET { return 1; }',
                encoding: 'utf8'
            }
        ]
    });

    assert.equal(result.mode, 'legacy');
    assert.equal(result.files.length, 2);
    assert.equal(result.files[0].path, 'site/content/docs/legacy.md');
    assert.equal(result.files[0].op, 'upsert');
    assert.equal(result.files[1].path, 'site/content/shader-gallery/demo/pass-1.fx');
});

test('resolveRequestFiles allows fx outside shader-gallery when suffix is allowed', async () => {
    const mod = await loadModule();

    const result = mod.resolveRequestFiles({
        files: [
            {
                path: 'site/content/articles/bad.fx',
                op: 'upsert',
                content: 'x',
                encoding: 'utf8'
            }
        ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].path, 'site/content/articles/bad.fx');
    assert.equal(result.files[0].op, 'upsert');
});

test('resolveRequestFiles rejects file path with disallowed suffix', async () => {
    const mod = await loadModule();

    assert.throws(() => {
        mod.resolveRequestFiles({
            files: [
                {
                    path: 'site/content/docs/malware.exe',
                    op: 'upsert',
                    content: 'x',
                    encoding: 'utf8'
                }
            ]
        });
    }, /不在白名单|allowlist/i);
});

test('resolveRequestFiles allows delete without content and keeps delete op', async () => {
    const mod = await loadModule();
    const result = mod.resolveRequestFiles({
        files: [
            {
                path: 'site/content/docs/deleted.md',
                op: 'delete'
            }
        ]
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].op, 'delete');
    assert.equal(Object.prototype.hasOwnProperty.call(result.files[0], 'content'), false);
});
