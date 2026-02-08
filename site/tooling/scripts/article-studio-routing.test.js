const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html no longer exposes routing assertions quick action', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /data-studio-insert="routing-assertions"/);
});

test('article-studio js no longer handles routing assertions insertion', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(js, /key\s*===\s*'routing-assertions'/);
    assert.doesNotMatch(js, /C0\/T0：应看到补课内容。/);
    assert.doesNotMatch(js, /C1\/T1：应看到标准主线。/);
    assert.doesNotMatch(js, /C2\/T2：应看到进阶补充。/);
});

test('article-studio html removes legacy route controls from PR area', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /id="studio-pr-include-route"/);
    assert.doesNotMatch(html, /id="studio-route-path"/);
    assert.doesNotMatch(html, /id="studio-route-path-existing"/);
    assert.doesNotMatch(html, /id="studio-route-path-options"/);
    assert.doesNotMatch(html, /id="studio-route-template"/);
    assert.doesNotMatch(html, /id="studio-route-json"/);
});

test('article-studio js no longer attaches route payload when submitting PR', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(js, /includeRoute/i);
    assert.doesNotMatch(js, /\.route\.json/);
    assert.doesNotMatch(js, /buildDefaultRouteDocument/);
});

test('article-studio keeps inline quiz snippets and removes routing snippets', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(html, /data-studio-insert="route-path-block"/);
    assert.doesNotMatch(js, /key\s*===\s*'route-path-block'/);
    assert.doesNotMatch(html, /data-studio-insert="if"/);
    assert.doesNotMatch(js, /key\s*===\s*'if'/);
    assert.doesNotMatch(js, /R_REMEDIAL/);
    assert.doesNotMatch(js, /R_STANDARD/);
    assert.doesNotMatch(js, /R_FAST/);
    assert.doesNotMatch(js, /R_DEEP/);
    assert.match(html, /data-studio-insert="quiz-tf"/);
    assert.match(html, /data-studio-insert="quiz-single"/);
    assert.match(html, /data-studio-insert="quiz-multi"/);
    assert.match(js, /key\s*===\s*'quiz-tf'/);
    assert.match(js, /key\s*===\s*'quiz-single'/);
    assert.match(js, /key\s*===\s*'quiz-multi'/);
});

test('article-studio js no longer loads route path choices', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(js, /routePathExisting/);
    assert.doesNotMatch(js, /routePathOptions/);
    assert.doesNotMatch(js, /route-manifest\.json/);
    assert.doesNotMatch(js, /loadRoutePathChoices/);
});
