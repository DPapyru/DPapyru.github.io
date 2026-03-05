const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(relPath) {
    return fs.readFileSync(path.resolve(relPath), 'utf8');
}

test('tml-ide animts local preview compile keeps profile metadata in success payload', () => {
    const source = readSource('tml-ide-app/src/main.js');

    assert.match(source, /function\s+parseAnimProfileForPreview\s*\(/);
    assert.match(source, /const\s+profile\s*=\s*parseAnimProfileForPreview\(source\)/);
    assert.match(source, /return\s*\{\s*[\s\S]*?ok:\s*true[\s\S]*?profile\s*\}/);
});

test('anim renderer selected-file preview registers local module before mount', () => {
    const source = readSource('site/pages/anim-renderer.html');

    assert.match(source, /singleFileModuleBySource/);
    assert.match(source, /function\s+prepareSingleFilePreview\s*\(/);
    assert.match(source, /singleFileModuleBySource\.get\(normalizedKey\)/);
    assert.match(source, /await\s+prepareSingleFilePreview\(currentFile\)/);
});
