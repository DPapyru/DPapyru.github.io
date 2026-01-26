const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('SectionSemanticLoader.decodeGzipJsonSync decodes docs/search/section-semantic.ai.v1.json.gz', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const SectionSemanticLoader = require('../assets/js/section-semantic-loader.js');

    const buf = fs.readFileSync('docs/search/section-semantic.ai.v1.json.gz');
    const payload = SectionSemanticLoader.decodeGzipJsonSync(buf);

    assert.equal(payload.schema, 'section-semantic.ai.v1');
    assert.ok(Array.isArray(payload.sections));
    assert.ok(payload.sections.length > 100);

    const withAvoid = payload.sections.find(s => Array.isArray(s.avoid) && s.avoid.length > 0);
    assert.ok(withAvoid, 'expected at least one section with avoid terms');

    const map = SectionSemanticLoader.createSectionMap(payload);
    assert.ok(map instanceof Map);
    assert.ok(map.has(withAvoid.id));
    assert.deepEqual(map.get(withAvoid.id).avoid, withAvoid.avoid);
});

test('SectionSemanticLoader.applyAvoidPenalty downweights when query hits avoid terms', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const SectionSemanticLoader = require('../assets/js/section-semantic-loader.js');

    const base = 10;
    const avoid = ['文档', '目录'];

    const none = SectionSemanticLoader.applyAvoidPenalty(base, '怎么创建物品', avoid);
    assert.equal(none, base);

    const one = SectionSemanticLoader.applyAvoidPenalty(base, '怎么查看文档', avoid);
    assert.ok(one < base);

    const two = SectionSemanticLoader.applyAvoidPenalty(base, '怎么查看文档目录', avoid);
    assert.ok(two < one);
});

