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

    assert.match(text, /site\/content\/routes\/\*\.route\.json/);
    assert.match(text, /extraFiles\s*数量不能超过\s*5/);
    assert.match(text, /content\s*过大/);
});

test('shared-key worker defines extraFiles sanitizer helpers', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /function\s+sanitizeExtraFilePath\s*\(/);
    assert.match(text, /function\s+normalizeExtraFiles\s*\(/);
    assert.match(text, /extraFiles\s*=\s*normalizeExtraFiles\(/);
});

test('shared-key worker writes extra files to github contents api', () => {
    const file = path.resolve('site/tooling/cloudflare/pr-gateway-worker.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /for\s*\(const\s+file\s+of\s+extraFiles\)/);
    assert.match(text, /encodePathForUrl\(file\.path\)/);
    assert.match(text, /extraFiles:\s*extraFiles\.map/);
});
