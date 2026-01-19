const assert = require('node:assert/strict');
const test = require('node:test');

const KnowledgeCore = require('../assets/js/knowledge-core.js');

test('tokenizeQuery lowercases and splits words', () => {
    assert.deepEqual(KnowledgeCore.tokenizeQuery('Player.AddBuff'), ['player', 'addbuff']);
});

test('parseInlineMemberAccessCall rejects no-prefix call', () => {
    const parsed = KnowledgeCore.parseInlineMemberAccessCall('AddBuff(1)');
    assert.equal(parsed, null);
});

test('parseInlineMemberAccessCall accepts member access + call and counts args', () => {
    const parsed = KnowledgeCore.parseInlineMemberAccessCall('player.AddBuff(BuffID.Regeneration, 60 * 2)');
    assert.ok(parsed);
    assert.equal(parsed.receiver, 'player');
    assert.equal(parsed.memberName, 'AddBuff');
    assert.equal(parsed.argc, 2);
});

test('sanitizeExternalUrl only allows http/https', () => {
    assert.equal(KnowledgeCore.sanitizeExternalUrl('https://example.com/a'), 'https://example.com/a');
    assert.equal(KnowledgeCore.sanitizeExternalUrl('http://example.com/a'), 'http://example.com/a');
    assert.equal(KnowledgeCore.sanitizeExternalUrl('javascript:alert(1)'), null);
});

test('recommendFromCollections returns top 3 ranked items', () => {
    const collections = {
        schemaVersion: 1,
        collections: {
            demo: {
                label: 'Demo',
                items: [
                    { path: 'docs/a.md', keywords: ['addbuff'], weight: 1 },
                    { path: 'docs/b.md', keywords: ['npc'], weight: 1 },
                    { path: 'docs/c.md', keywords: ['player'], weight: 1 },
                    { path: 'docs/d.md', keywords: ['main'], weight: 1 }
                ]
            }
        }
    };

    const results = KnowledgeCore.recommendFromCollections(collections, 'AddBuff', { topN: 3 });
    assert.equal(results.length, 1);
    assert.equal(results[0].path, 'docs/a.md');
});
