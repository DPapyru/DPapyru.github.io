const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createMarkdownExtensionRegistry,
    defaultTransforms
} = require('../services/markdown/markdown-extension-registry.js');

test('registry applies transforms in registration order', () => {
    const registry = createMarkdownExtensionRegistry();
    registry.registerTransform('a', (text) => text + 'A');
    registry.registerTransform('b', (text) => text + 'B');
    assert.equal(registry.applyTransforms('X'), 'XAB');
});

test('registry includes default admonition transform', () => {
    const registry = createMarkdownExtensionRegistry(defaultTransforms());
    const output = registry.applyTransforms(':::note\nhello\n:::');
    assert.match(output, /<div class="admonition admonition-note">/);
    assert.match(output, /<p>hello<\/p>/);
});
