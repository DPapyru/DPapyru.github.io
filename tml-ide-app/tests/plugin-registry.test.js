import test from 'node:test';
import assert from 'node:assert/strict';

import { createPluginRegistry } from '../src/core/plugin-registry.js';

function makePlugin(id) {
    return {
        id,
        mount() {},
        unmount() {},
        getSnapshot() { return null; },
        restoreSnapshot() {},
        collectStaged() { return []; },
        getCommands() { return []; },
        handleCommand() { return false; },
        getStatusItems() { return []; }
    };
}

test('plugin registry stores and returns plugins by id', () => {
    const registry = createPluginRegistry();
    const markdown = makePlugin('markdown');
    const shader = makePlugin('shader');

    registry.register(markdown);
    registry.register(shader);

    assert.equal(registry.get('markdown'), markdown);
    assert.equal(registry.get('shader'), shader);
    assert.equal(registry.get('csharp'), null);
    assert.deepEqual(registry.list().map((item) => item.id), ['markdown', 'shader']);
});

test('plugin registry rejects duplicate and invalid plugin shapes', () => {
    const registry = createPluginRegistry();
    registry.register(makePlugin('markdown'));

    assert.throws(() => registry.register(makePlugin('markdown')), /duplicate plugin id/i);
    assert.throws(() => registry.register({}), /plugin id is required/i);
    assert.throws(() => registry.register({ id: 'x' }), /plugin\.mount must be a function/i);
});

