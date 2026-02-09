const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
    return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

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

test('article studio html includes image upload controls', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-image-upload"/);
    assert.match(html, /id="studio-toggle-preview-image-notice"/);
    assert.match(html, /插入图片/);
});

test('article studio html includes pr chain controls', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-pr-chain-select"/);
    assert.match(html, /id="studio-refresh-my-prs"/);
});

test('article studio js supports image upload and linked pr submit', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /studio-image-upload/);
    assert.match(js, /studio-toggle-preview-image-notice/);
    assert.match(js, /插入引用/);
    assert.match(js, /existingPrNumber/);
    assert.match(js, /my-open-prs/);
    assert.match(js, /article-studio-preview-image-mapped/);
});

test('oauth pr worker supports listing my open prs and appending commits', () => {
    const worker = read('site/tooling/cloudflare/pr-gateway-worker-oauth.js');

    assert.match(worker, /\/api\/my-open-prs/);
    assert.match(worker, /existingPrNumber/);
    assert.match(worker, /reusedExistingPr/);
});

test('shared-key pr worker supports appending commits to an existing pr', () => {
    const worker = read('site/tooling/cloudflare/pr-gateway-worker.js');

    assert.match(worker, /existingPrNumber/);
    assert.match(worker, /reusedExistingPr/);
});

test('viewer studio preview image resolver decodes encoded image paths', () => {
    const viewer = read('site/pages/viewer.html');
    const fn = getFunctionBody(viewer, 'resolveStudioPreviewImageDataUrl');

    assert.ok(fn, 'resolveStudioPreviewImageDataUrl function should exist');
    assert.match(fn, /decodeURIComponent\(/);
    assert.match(viewer, /article-studio-preview-image-mapped/);
});
