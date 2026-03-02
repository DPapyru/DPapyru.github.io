const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('bm25 contrib intent heuristics include renamed category key and path pattern', () => {
    const source = fs.readFileSync(path.resolve('site/assets/js/bm25-lookup.js'), 'utf8');

    assert.match(source, /categoryMultiplier\['如何贡献'\]/);
    assert.match(source, /categoryMultiplier\['怎么贡献'\]/);

    const hasDualPathPenalty = source.includes('/(?:怎么|如何)贡献/i')
        || source.includes('/怎么贡献|如何贡献/i')
        || source.includes('/(?:如何|怎么)贡献/i');

    assert.equal(hasDualPathPenalty, true);
});
