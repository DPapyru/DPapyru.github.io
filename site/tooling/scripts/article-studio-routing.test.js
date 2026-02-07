const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html exposes routing assertions quick action', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /data-studio-insert="routing-assertions"/);
    assert.match(html, /分流断言/);
});

test('article-studio js handles routing assertions insertion', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /key\s*===\s*'routing-assertions'/);
    assert.match(js, /C0\/T0：应看到补课内容。/);
    assert.match(js, /C1\/T1：应看到标准主线。/);
    assert.match(js, /C2\/T2：应看到进阶补充。/);
});
