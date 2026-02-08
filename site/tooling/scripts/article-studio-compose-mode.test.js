const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html removes compose controls', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /Compose（多文件合并）/);
    assert.doesNotMatch(html, /id="studio-compose-enabled"/);
    assert.doesNotMatch(html, /id="studio-compose-file-list"/);
    assert.doesNotMatch(html, /id="studio-compose-add-file"/);
    assert.doesNotMatch(html, /id="studio-compose-remove-file"/);
    assert.doesNotMatch(html, /id="studio-compose-move-up"/);
    assert.doesNotMatch(html, /id="studio-compose-move-down"/);
    assert.doesNotMatch(html, /id="studio-compose-apply-merged"/);
});

test('article-studio js removes compose merge model', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(js, /composeModeEnabled/);
    assert.doesNotMatch(js, /composeFiles/);
    assert.doesNotMatch(js, /composeActiveId/);
    assert.doesNotMatch(js, /function\s+buildComposedMarkdown\s*\(/);
    assert.doesNotMatch(js, /function\s+getComposeActiveFile\s*\(/);
    assert.doesNotMatch(js, /function\s+syncComposeControlsState\s*\(/);
});

test('article-studio preview and PR payload use plain markdown', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /markdown:\s*String\(state\.markdown\s*\|\|\s*''\)/);
    assert.match(js, /markdown:\s*String\(state\.markdown\s*\|\|\s*''\)/);
    assert.doesNotMatch(js, /getEffectiveMarkdownForOutput\(/);
});
