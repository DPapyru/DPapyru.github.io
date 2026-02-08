const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function walkMarkdownFiles(rootDir) {
    const results = [];
    const stack = [rootDir];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }

            if (entry.isFile() && fullPath.endsWith('.md')) {
                results.push(fullPath);
            }
        }
    }

    return results;
}

test('content markdown does not use ref transclusion syntax', () => {
    const contentRoot = path.resolve('site/content');
    const markdownFiles = walkMarkdownFiles(contentRoot);
    const offenders = [];

    markdownFiles.forEach((filePath) => {
        const source = fs.readFileSync(filePath, 'utf8');
        if (/\{\{ref:/.test(source)) {
            offenders.push(path.relative(process.cwd(), filePath));
        }
    });

    assert.deepEqual(offenders, []);
});

test('article-studio ref insert action uses markdown links', () => {
    const studioJs = fs.readFileSync(path.resolve('site/assets/js/article-studio.js'), 'utf8');

    assert.match(studioJs, /insertBlockSnippet\(`\[\$\{selectedTitle\}\]\(目标文档\.md\)\\n`,\s*'目标文档\.md'\);/);
    assert.doesNotMatch(studioJs, /\{\{ref:目标文档\.md\|/);
});

test('viewer transclusion parser no longer handles ref kind', () => {
    const viewerHtml = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.doesNotMatch(viewerHtml, /kind !== 'ref' && kind !== 'cs'/);
});
