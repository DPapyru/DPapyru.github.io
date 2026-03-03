const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('bm25 contrib intent heuristics only penalize current 如何贡献 category/path', () => {
    const source = fs.readFileSync(path.resolve('site/assets/js/bm25-lookup.js'), 'utf8');

    assert.match(source, /categoryMultiplier\['如何贡献'\]/);
    assert.doesNotMatch(source, /categoryMultiplier\['怎么贡献'\]/);

    const hasCurrentPathPenalty = source.includes('/如何贡献/i')
        || source.includes('/(?:如何)贡献/i');

    assert.equal(hasCurrentPathPenalty, true);
    assert.doesNotMatch(source, /const contribPathPattern = \/[\s\S]*怎么\|如何[\s\S]*贡献\/i/);
});
