const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// Polyfill atob for the UMD modules used in Node tests.
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

test('BM25 intent routing: mod name without cross-mod keywords should prefer beginner weapon path', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const Bm25LookupEngine = require('../assets/js/bm25-lookup.js');

    const payload = JSON.parse(fs.readFileSync('assets/semantic/bm25-index.v1.json', 'utf8'));
    const engine = new Bm25LookupEngine(payload);

    const query = '我要做灾厄武器';
    const results = engine.search(query, { limit: 8, docLimit: 12, maxPerDoc: 2 });

    assert.ok(results.length > 0);

    // Expected behavior: default to beginner docs, not jump to "3-高阶" unless query explicitly asks for source/IL/etc.
    assert.match(results[0].path, /螺线翻译tml教程\/1-基础\//);

    const topPaths = results.slice(0, 5).map(r => r.path).join('\n');
    assert.match(topPaths, /1-Basic-Item|5-Basic-Projectile|4-Basic-Ammo/);
});

test('BM25 intent routing: explicit cross-mod keywords should surface cross-mod docs', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const Bm25LookupEngine = require('../assets/js/bm25-lookup.js');

    const payload = JSON.parse(fs.readFileSync('assets/semantic/bm25-index.v1.json', 'utf8'));
    const engine = new Bm25LookupEngine(payload);

    const query = '灾厄 联动 兼容';
    const results = engine.search(query, { limit: 12, docLimit: 12, maxPerDoc: 2 });
    assert.ok(results.length > 0);

    const topPaths = results.slice(0, 8).map(r => r.path).join('\n');
    assert.match(topPaths.toLowerCase(), /expert-cross-mod-content|patching-other-mods|detouring-and-il-editing|weak references|weakreferences|cross-mod/);
});

