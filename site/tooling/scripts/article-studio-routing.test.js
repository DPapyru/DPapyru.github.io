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

test('article-studio html includes route v2 controls in PR area', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /id="studio-pr-include-route"/);
    assert.match(html, /id="studio-route-path"/);
    assert.match(html, /id="studio-route-path-existing"/);
    assert.match(html, /id="studio-route-path-options"/);
    assert.match(html, /id="studio-route-template"/);
    assert.match(html, /id="studio-route-json"/);
});

test('article-studio js attaches route payload when submitting PR', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /includeRoute/i);
    assert.match(js, /extraFiles/);
    assert.match(js, /\.route\.json/);
    assert.match(js, /buildDefaultRouteDocument/);
});

test('article-studio supports route-path content block insertion', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(html, /data-studio-insert="route-path-block"/);
    assert.match(js, /key\s*===\s*'route-path-block'/);
    assert.match(js, /R_REMEDIAL/);
    assert.match(js, /R_STANDARD/);
    assert.match(js, /R_FAST/);
    assert.match(js, /R_DEEP/);
});

test('article-studio supports choosing existing route path or creating new path', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /routePathExisting/);
    assert.match(js, /routePathOptions/);
    assert.match(js, /route-manifest\.json/);
    assert.match(js, /loadRoutePathChoices/);
});
