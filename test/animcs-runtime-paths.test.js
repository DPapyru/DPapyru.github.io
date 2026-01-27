const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeAnimPath,
    createRuntime,
    resolveAnimAssemblyPath,
    normalizeRuntimeRoot,
    resolveRuntimeUrls,
    inferRuntimeRootFromScriptSrc,
    resolveManifestUrl
} = require('../assets/js/animcs-runtime.js');

test('normalizeAnimPath maps anims/*.cs to manifest key', () => {
    assert.equal(normalizeAnimPath('anims/demo.cs'), 'anims/demo.cs');
    assert.equal(normalizeAnimPath('docs/anims/demo.cs'), 'anims/demo.cs');
    assert.equal(normalizeAnimPath('anims/demo.ts'), '');
});

test('createRuntime throws when runtime not configured', async () => {
    await assert.rejects(() => createRuntime({ runtimeRoot: '' }));
});

test('createRuntime uses loadDotnetModule hook', async () => {
    const calls = [];
    const runtime = await createRuntime({
        runtimeRoot: 'assets/anims/runtime',
        loadDotnetModule: async (urls) => {
            calls.push(urls);
            return { mock: true };
        }
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].dotnetJs, 'assets/anims/runtime/dotnet.js');
    assert.equal(runtime.runtimeRoot, 'assets/anims/runtime/');
});

test('resolveAnimAssemblyPath maps assembly names to assets/anims', () => {
    assert.equal(
        resolveAnimAssemblyPath('demo-basic.dll'),
        '../assets/anims/demo-basic.dll'
    );
    assert.equal(
        resolveAnimAssemblyPath('demo-basic.dll', '../assets/anims/runtime/'),
        '../assets/anims/runtime/../demo-basic.dll'
    );
});

test('normalizeRuntimeRoot ensures trailing slash', () => {
    assert.equal(normalizeRuntimeRoot('assets/anims/runtime'), 'assets/anims/runtime/');
    assert.equal(normalizeRuntimeRoot('assets/anims/runtime/'), 'assets/anims/runtime/');
});

test('resolveRuntimeUrls builds dotnet runtime paths', () => {
    assert.deepEqual(resolveRuntimeUrls('assets/anims/runtime'), {
        dotnetJs: 'assets/anims/runtime/dotnet.js',
        bootJson: 'assets/anims/runtime/dotnet.boot.json'
    });
});

test('inferRuntimeRootFromScriptSrc maps script src to runtime root', () => {
    assert.equal(
        inferRuntimeRootFromScriptSrc('https://example.com/assets/js/animcs-runtime.js'),
        'https://example.com/assets/anims/runtime/'
    );
    assert.equal(
        inferRuntimeRootFromScriptSrc('../assets/js/animcs-runtime.js'),
        '../assets/anims/runtime/'
    );
});

test('resolveManifestUrl maps runtime root to manifest path', () => {
    assert.equal(
        resolveManifestUrl('../assets/anims/runtime/'),
        '../assets/anims/runtime/../manifest.json'
    );
});
