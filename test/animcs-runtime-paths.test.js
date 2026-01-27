const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAnimPath, createRuntime } = require('../assets/js/animcs-runtime.js');

test('normalizeAnimPath maps anims/*.cs to manifest key', () => {
    assert.equal(normalizeAnimPath('anims/demo.cs'), 'anims/demo.cs');
    assert.equal(normalizeAnimPath('docs/anims/demo.cs'), 'anims/demo.cs');
});

test('createRuntime throws when runtime not configured', async () => {
    await assert.rejects(() => createRuntime({ runtimeRoot: '' }));
});
