const assert = require('node:assert/strict');
const test = require('node:test');

function loadPathsModule() {
    let mod;
    assert.doesNotThrow(() => {
        mod = require('../assets/js/animts/paths.js');
    }, 'animts paths module should exist');
    return mod;
}

test('animts/paths: normalizeAnimTsSourcePath strips leading ./ and /', () => {
    const { normalizeAnimTsSourcePath } = loadPathsModule();
    assert.equal(normalizeAnimTsSourcePath('./anims/demo.ts'), 'anims/demo.ts');
    assert.equal(normalizeAnimTsSourcePath('/anims/demo.ts'), 'anims/demo.ts');
    assert.equal(normalizeAnimTsSourcePath('anims/demo.ts'), 'anims/demo.ts');
});

test('animts/paths: isAllowedAnimTsSourcePath rejects traversal and non-ts', () => {
    const { isAllowedAnimTsSourcePath } = loadPathsModule();
    assert.equal(isAllowedAnimTsSourcePath('anims/../secret.ts'), false);
    assert.equal(isAllowedAnimTsSourcePath('../anims/demo.ts'), false);
    assert.equal(isAllowedAnimTsSourcePath('http://example.com/a.ts'), false);
    assert.equal(isAllowedAnimTsSourcePath('anims/demo.js'), false);
    assert.equal(isAllowedAnimTsSourcePath('anims/demo.ts'), true);
});

test('animts/paths: mapSourceTsToBuiltJsUrl maps to assets/anims output', () => {
    const { mapSourceTsToBuiltJsUrl } = loadPathsModule();
    assert.equal(
        mapSourceTsToBuiltJsUrl('anims/demo.ts', { page: 'docs' }),
        '../assets/anims/demo.js'
    );
    assert.equal(
        mapSourceTsToBuiltJsUrl('anims/demo/danmaku-demo.ts', { page: 'docs' }),
        '../assets/anims/demo/danmaku-demo.js'
    );
});

