const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function getFunctionBody(source, name) {
    const re = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
    const match = re.exec(source);
    if (!match) return '';

    let index = match.index + match[0].length;
    let depth = 1;
    while (index < source.length) {
        const ch = source[index];
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
        if (depth === 0) {
            return source.slice(match.index, index + 1);
        }
        index += 1;
    }

    return '';
}

test('oauth worker defines extraFiles sanitizer helpers', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /function\s+sanitizeExtraFilePath\s*\(/);
    assert.match(text, /function\s+normalizeExtraFiles\s*\(/);
    assert.match(text, /extraFiles\s*=\s*normalizeExtraFiles\(/);
});

test('oauth worker restricts extraFiles path and count', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.doesNotMatch(text, /site\/content\/routes\/\*\.route\.json/);
    assert.match(text, /site\/content\/shader-gallery\/<slug>\/\(entry\|shader\)\.json/);
    assert.match(text, /site\/content\/\*\*\/imgs\/\*\.\{png,jpg,jpeg,gif,webp,svg,bmp,avif\}/);
    assert.match(text, /site\/content\/\*\*\/media\/\*\.\{mp4,webm\}/);
    assert.match(text, /site\/content\/anims\/\*\.cs/);
    assert.match(text, /site\/content\/\*\*\/code\/\*\.cs/);
    assert.match(text, /extraFiles\s*数量不能超过\s*8/);
    assert.match(text, /content\s*过大/);
    assert.match(text, /base64\s*content\s*过大/);
    assert.match(text, /10MB/);
});

test('shared-key worker defines extraFiles sanitizer helpers', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /function\s+sanitizeExtraFilePath\s*\(/);
    assert.match(text, /function\s+normalizeExtraFiles\s*\(/);
    assert.match(text, /extraFiles\s*=\s*normalizeExtraFiles\(/);
});

test('shared-key worker supports shader gallery extra files', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.doesNotMatch(text, /site\/content\/routes\/\*\.route\.json/);
    assert.match(text, /site\/content\/shader-gallery\/<slug>\/\(entry\|shader\)\.json/);
    assert.match(text, /site\/content\/\*\*\/imgs\/\*\.\{png,jpg,jpeg,gif,webp,svg,bmp,avif\}/);
    assert.match(text, /site\/content\/\*\*\/media\/\*\.\{mp4,webm\}/);
    assert.match(text, /site\/content\/anims\/\*\.cs/);
    assert.match(text, /site\/content\/\*\*\/code\/\*\.cs/);
    assert.match(text, /extraFiles\s*数量不能超过\s*8/);
    assert.match(text, /content\s*过大/);
    assert.match(text, /base64\s*content\s*过大/);
    assert.match(text, /10MB/);
});

test('workers accept base64 encoded extra files', () => {
    const oauthFile = path.resolve('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const sharedFile = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const oauthText = fs.readFileSync(oauthFile, 'utf8');
    const sharedText = fs.readFileSync(sharedFile, 'utf8');

    assert.match(oauthText, /encoding\s*===\s*"base64"/);
    assert.match(sharedText, /encoding\s*===\s*"base64"/);
    assert.match(oauthText, /extraBase64\s*=\s*file\.encoding\s*===\s*"base64"\s*\?\s*file\.content/);
    assert.match(sharedText, /extraBase64\s*=\s*file\.encoding\s*===\s*"base64"\s*\?\s*file\.content/);
});

test('workers define preflight-check endpoint with auth', () => {
    const oauthFile = path.resolve('site/tooling/cloudflare/pr-gateway-worker-oauth.js');
    const sharedFile = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const oauthText = fs.readFileSync(oauthFile, 'utf8');
    const sharedText = fs.readFileSync(sharedFile, 'utf8');

    assert.match(oauthText, /\/api\/preflight-check/);
    assert.match(sharedText, /\/api\/preflight-check/);
    assert.match(oauthText, /resolveAuthUserFromBearer/);
    assert.match(oauthText, /x-studio-key/);
    assert.match(sharedText, /x-studio-key/);
});

test('shared-key worker writes extra files to github contents api', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /for\s*\(const\s+file\s+of\s+extraFiles\)/);
    assert.match(text, /encodePathForUrl\(file\.path\)/);
    assert.match(text, /extraFiles:\s*extraFiles\.map/);
});

test('tml-ide unified submit keeps anims/code csharp paths when already valid', () => {
    const file = path.resolve('tml-ide-app/src/main.js');
    const source = fs.readFileSync(file, 'utf8');

    assert.match(source, /site\\\/content\\\/anims\\\//);
    assert.match(source, /function\s+toDirectCsharpRepoPath\s*\(/);
    assert.match(source, /toDirectCsharpRepoPath\(item\.path\)\s*\|\|\s*toCodePathForArticle\(articlePath,\s*item\.path\)/);
});
