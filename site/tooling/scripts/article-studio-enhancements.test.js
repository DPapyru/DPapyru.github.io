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

test('article studio html includes metadata and csharp controls', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-import"/);
    assert.match(html, /id="studio-format-markdown"/);
    assert.match(html, /id="studio-meta-difficulty"/);
    assert.match(html, /id="studio-meta-time"/);
    assert.match(html, /id="studio-meta-prev-chapter"/);
    assert.match(html, /id="studio-meta-next-chapter"/);
    assert.match(html, /id="studio-color-add"/);
    assert.match(html, /id="studio-csharp-upload"/);
    assert.match(html, /id="studio-csharp-list"/);
    assert.match(html, /id="studio-csharp-symbol-select"/);
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

test('article studio js supports draft import, editor formatting and tab indent', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /function\s+importDraftJson\s*\(/);
    assert.match(js, /function\s+formatMarkdownForStudio\s*\(/);
    assert.match(js, /event\.key\s*===\s*'Tab'/);
    assert.match(js, /event\.shiftKey/);
    assert.match(js, /studio-format-markdown/);
});

test('article studio js performs worker preflight checks before submit and csharp upload', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /\/api\/preflight-check/);
    assert.match(js, /function\s+runPreflightCheck\s*\(/);
    assert.match(js, /await\s+runPreflightCheck\(/);
    assert.match(js, /preflightPending/);
    assert.match(js, /uploadedCsharpFiles/);
    assert.match(js, /studio-csharp-upload/);
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

test('article studio html includes unified asset upload control', () => {
    const html = read('site/pages/article-studio.html');

    assert.match(html, /id="studio-asset-upload"/);
    assert.match(html, /上传附件/);
});

test('article studio js supports unified mixed asset upload', () => {
    const js = read('site/assets/js/article-studio.js');

    assert.match(js, /studio-asset-upload/);
    assert.match(js, /function\s+insertAssetsFromUpload\s*\(/);
    assert.match(js, /insertAssetsFromUpload\(dom\.assetUpload\.files\)/);
});

test('viewer studio preview bridge supports uploaded csharp files', () => {
    const viewer = read('site/pages/viewer.html');
    const readFn = getFunctionBody(viewer, 'readStudioPreviewPayloadFromStorage');
    const bridgeFn = getFunctionBody(viewer, 'installStudioPreviewFetchBridge');

    assert.ok(readFn, 'readStudioPreviewPayloadFromStorage should exist');
    assert.ok(bridgeFn, 'installStudioPreviewFetchBridge should exist');
    assert.match(readFn, /uploadedCsharpFiles/);
    assert.match(bridgeFn, /payload\.uploadedCsharpFiles/);
    assert.match(bridgeFn, /text\/x-csharp/);
});

test('viewer csharp selector parser supports unicode identifiers for chinese paths and namespaces', () => {
    const viewer = read('site/pages/viewer.html');
    const readFn = getFunctionBody(viewer, 'readIdentifierAt');

    assert.ok(readFn, 'readIdentifierAt should exist');
    assert.match(readFn, /\\p\{L\}/);
    assert.match(readFn, /\\p\{N\}/);
    assert.ok(viewer.includes(String.raw`const nsRe = /\bnamespace\s+([$_\p{L}\p{N}.]+)\s*([;{])/gu;`));
});

test('article studio csharp upload reads utf8 text directly', () => {
    const js = read('site/assets/js/article-studio.js');
    const readFn = getFunctionBody(js, 'readFileAsUtf8Text');
    const uploadFn = getFunctionBody(js, 'insertCsharpFilesFromUpload');

    assert.ok(readFn, 'readFileAsUtf8Text should exist');
    assert.ok(uploadFn, 'insertCsharpFilesFromUpload should exist');
    assert.match(readFn, /readAsText\(file,\s*'UTF-8'\)/);
    assert.match(uploadFn, /await\s+readFileAsUtf8Text\(file\)/);
    assert.doesNotMatch(uploadFn, /dataUrlToPlainText/);
});

test('article studio csharp symbol extraction supports unicode namespaces', () => {
    const js = read('site/assets/js/article-studio.js');
    const fn = getFunctionBody(js, 'extractCSharpSymbols');

    assert.ok(fn, 'extractCSharpSymbols should exist');
    assert.match(fn, /\\p\{L\}/);
    assert.match(fn, /\\p\{N\}/);
    assert.ok(fn.includes(String.raw`/^namespace\s+([$_\p{L}\p{N}.]+)/u`));
});

test('tutorial csharp transclusion path exists with exact casing', () => {
    const markdownPath = 'site/content/Modder入门/制作第一把武器.md';
    const markdown = read(markdownPath);
    const match = markdown.match(/\{\{cs:([^\n}]+#cs:m:[^\n}]+)\}\}/);

    assert.ok(match, 'should include method-level C# transclusion');

    const rawTarget = String(match[1] || '').trim();
    const basePath = rawTarget.split('#')[0].trim();
    const relative = basePath.replace(/^\.\//, '');
    const resolved = path.resolve('site/content/Modder入门', relative);
    const fileName = path.basename(relative);
    const dirPath = path.dirname(resolved);
    const dirEntries = fs.readdirSync(dirPath);

    assert.ok(fs.existsSync(resolved), `referenced C# file should exist: ${resolved}`);
    assert.ok(dirEntries.includes(fileName), `referenced C# file casing should match exactly: ${fileName}`);
});
