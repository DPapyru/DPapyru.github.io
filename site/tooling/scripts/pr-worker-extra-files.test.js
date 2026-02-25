const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
    return fs.readFileSync(path.resolve(filePath), 'utf8');
}

test('workers use shared files[] parser module', () => {
    const oauthText = read('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const sharedText = read('site/tooling/cloudflare/pr-gateway-worker.js');

    assert.match(oauthText, /resolveRequestFiles/);
    assert.match(sharedText, /resolveRequestFiles/);
    assert.match(oauthText, /from "\.\/pr-file-ops\.js"/);
    assert.match(sharedText, /from "\.\/pr-file-ops\.js"/);
});

test('workers expose preflight-check and duplicate path validation', () => {
    const oauthText = read('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const sharedText = read('site/tooling/cloudflare/pr-gateway-worker.js');

    assert.match(oauthText, /\/api\/preflight-check/);
    assert.match(sharedText, /\/api\/preflight-check/);
    assert.match(oauthText, /preflightDuplicatePathErrors/);
    assert.match(sharedText, /preflightDuplicatePathErrors/);
});

test('workers handle delete no-op and return applied/skipped summaries', () => {
    const oauthText = read('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const sharedText = read('site/tooling/cloudflare/pr-gateway-worker.js');

    assert.match(oauthText, /if\s*\(file\.op\s*===\s*"delete"\)/);
    assert.match(sharedText, /if\s*\(file\.op\s*===\s*"delete"\)/);
    assert.match(oauthText, /skippedDeletes\.push/);
    assert.match(sharedText, /skippedDeletes\.push/);
    assert.match(oauthText, /appliedFiles/);
    assert.match(sharedText, /appliedFiles/);
});

test('shared file ops allow .fx only in shader-gallery and keep legacy conversion', () => {
    const fileOps = read('site/tooling/cloudflare/pr-file-ops.js');

    assert.match(fileOps, /isShaderFxFile/);
    assert.match(fileOps, /site\/content\/shader-gallery\/\*\*\/\*\.fx/);
    assert.match(fileOps, /targetPath/);
    assert.match(fileOps, /extraFiles/);
    assert.match(fileOps, /resolveRequestFiles/);
});

test('tml-ide unified submit sends files[] payload from scm changes', () => {
    const source = read('tml-ide-app/src/main.js');

    assert.match(source, /function\s+runUnifiedSubmitBatches\s*\(/);
    assert.match(source, /payload\s*=\s*\{\s*prTitle,\s*files:/);
    assert.match(source, /listScmChanges\(\)/);
});
