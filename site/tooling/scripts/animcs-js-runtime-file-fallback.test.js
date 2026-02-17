const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtime = require(path.resolve('site/assets/js/animcs-js-runtime.js'));

test('resolveEntryForSource prefers manifest entry', () => {
    const manifest = {
        entries: {
            'anims/demo-basic.cs': {
                js: 'demo-basic.custom.js',
                entry: 'demo-basic-custom'
            }
        }
    };

    assert.deepEqual(
        runtime.resolveEntryForSource(manifest, 'anims/demo-basic.cs'),
        {
            js: 'demo-basic.custom.js',
            entry: 'demo-basic-custom'
        }
    );
});

test('resolveEntryForSource falls back to basename mapping when manifest is unavailable', () => {
    assert.deepEqual(
        runtime.resolveEntryForSource(null, 'anims/demo-basic.cs'),
        {
            js: 'demo-basic.js',
            entry: 'demo-basic'
        }
    );
});

test('resolveEntryForSource rejects invalid source path', () => {
    assert.equal(runtime.resolveEntryForSource({}, 'foo/bar.txt'), null);
});
