import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyCsharpIdentifier, createEnhancedCsharpLanguage } from '../src/lib/csharp-highlighting.js';

test('classifyCsharpIdentifier detects constant/type/identifier naming', () => {
    assert.equal(classifyCsharpIdentifier('MAX_VALUE'), 'constant');
    assert.equal(classifyCsharpIdentifier('DemoMod'), 'type.identifier');
    assert.equal(classifyCsharpIdentifier('@Player'), 'type.identifier');
    assert.equal(classifyCsharpIdentifier('playerName'), 'identifier');
});

test('createEnhancedCsharpLanguage injects richer identifier rules', () => {
    const base = {
        keywords: ['if', 'using'],
        namespaceFollows: ['namespace', 'using'],
        tokenizer: {
            root: [
                [/\@?[a-zA-Z_]\w*/, { cases: { '@default': { token: 'identifier', next: '@qualified' } } }],
                [/;/, 'delimiter']
            ],
            qualified: [
                [/[a-zA-Z_][\w]*/, { cases: { '@default': 'identifier' } }],
                [/\./, 'delimiter'],
                ['', '', '@pop']
            ]
        }
    };

    const enhanced = createEnhancedCsharpLanguage(base);

    assert.notEqual(enhanced, base);
    assert.equal(enhanced.tokenizer.root[0][0].source, '\\@?[a-zA-Z_]\\w*(?=\\s*\\()');
    assert.equal(enhanced.tokenizer.qualified[0][0].source, '\\@?[a-zA-Z_]\\w*(?=\\s*\\()');
    assert.ok(enhanced.constantIdentifiers.test('MAX_VALUE'));
    assert.ok(enhanced.typeIdentifiers.test('DemoMod'));
    assert.equal(enhanced.tokenizer.root[1][0].test('DemoMod'), false);
    assert.equal(enhanced.tokenizer.root[2][0].test('DemoMod'), true);
});
