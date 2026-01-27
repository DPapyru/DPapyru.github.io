const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildManifest } = require('../scripts/build-animcs.js');

test('buildManifest emits dll mapping', () => {
    const manifest = buildManifest([
        { source: 'docs/anims/demo.cs', entry: 'demo' }
    ]);
    assert.equal(manifest.entries['anims/demo.cs'].assembly, 'demo.dll');
});

test('resolveOutputPath maps anims/demo.cs -> assets/anims/demo.dll', () => {
    const { resolveOutputPath } = require('../scripts/build-animcs.js');
    assert.equal(resolveOutputPath('docs/anims/demo.cs'), 'assets/anims/demo.dll');
});

test('resolveRuntimeOutputDir targets assets/anims/runtime', () => {
    const { resolveRuntimeOutputDir } = require('../scripts/build-animcs.js');
    assert.equal(resolveRuntimeOutputDir('.'), 'assets/anims/runtime');
});
