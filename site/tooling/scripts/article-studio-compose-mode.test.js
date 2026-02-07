const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html includes compose mode controls', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /id="studio-compose-enabled"/);
    assert.match(html, /id="studio-compose-file-list"/);
    assert.match(html, /id="studio-compose-add-file"/);
    assert.match(html, /id="studio-compose-remove-file"/);
    assert.match(html, /id="studio-compose-move-up"/);
    assert.match(html, /id="studio-compose-move-down"/);
    assert.match(html, /id="studio-compose-apply-merged"/);
});

test('article-studio js implements compose merge model', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /composeModeEnabled/);
    assert.match(js, /composeFiles/);
    assert.match(js, /composeActiveId/);
    assert.match(js, /function\s+buildComposedMarkdown\s*\(/);
    assert.match(js, /function\s+getEffectiveMarkdownForOutput\s*\(/);
});

test('article-studio uses merged markdown for preview and PR payload', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /markdown:\s*getEffectiveMarkdownForOutput\(\)/);
    assert.match(js, /state\.markdown\s*=\s*buildComposedMarkdown\(\)/);
});

