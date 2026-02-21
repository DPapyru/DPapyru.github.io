const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article studio preview payload includes realtime anim compile fields', () => {
    const sourcePath = path.resolve('tml-ide/subapps/assets/js/article-studio.js');
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /compiledAnims/);
    assert.match(source, /animCompileErrors/);
    assert.match(source, /animBridge/);
});

test('article studio uses expected debounce and timeout for anim bridge compile', () => {
    const sourcePath = path.resolve('tml-ide/subapps/assets/js/article-studio.js');
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /ANIMCS_COMPILE_DEBOUNCE_MS\s*=\s*400/);
    assert.match(source, /ANIMCS_COMPILE_TIMEOUT_MS\s*=\s*8000/);
});
