const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const embedLinks = require('../../../shared/services/markdown/markdown-embed-links.js');

function walkMarkdownFiles(rootDir) {
    const results = [];
    const stack = [rootDir];
    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        entries.forEach((entry) => {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                return;
            }
            if (entry.isFile() && fullPath.endsWith('.md')) {
                results.push(fullPath);
            }
        });
    }
    return results;
}

test('content markdown no longer uses legacy transclusion syntax', () => {
    const markdownFiles = walkMarkdownFiles(path.resolve('site/content'));
    const offenders = [];

    markdownFiles.forEach((filePath) => {
        const source = fs.readFileSync(filePath, 'utf8');
        if (/\{\{(?:ref|cs|anim):/.test(source)) {
            offenders.push(path.relative(process.cwd(), filePath));
        }
    });

    assert.deepEqual(offenders, []);
});

test('standalone protocol embed parser supports cs/anims/fx and rejects inline markdown links', () => {
    assert.deepEqual(
        embedLinks.parseStandaloneEmbedLink('[类型示例](cs:./code/Demo.cs#cs:t:Foo.Bar)'),
        {
            kind: 'cs',
            label: '类型示例',
            href: 'cs:./code/Demo.cs#cs:t:Foo.Bar',
            target: './code/Demo.cs#cs:t:Foo.Bar'
        }
    );

    assert.deepEqual(
        embedLinks.parseStandaloneEmbedLink('[方法示例](cs:./code/Demo.cs#cs:m:Foo.Bar.Baz(int,string))'),
        {
            kind: 'cs',
            label: '方法示例',
            href: 'cs:./code/Demo.cs#cs:m:Foo.Bar.Baz(int,string)',
            target: './code/Demo.cs#cs:m:Foo.Bar.Baz(int,string)'
        }
    );

    assert.deepEqual(
        embedLinks.parseStandaloneEmbedLink('[动画](anims:anims/demo-basic.cs)'),
        {
            kind: 'anims',
            label: '动画',
            href: 'anims:anims/demo-basic.cs',
            target: 'anims/demo-basic.cs'
        }
    );

    assert.deepEqual(
        embedLinks.parseStandaloneEmbedLink('[Shader](fx:./shader/demo.fx)'),
        {
            kind: 'fx',
            label: 'Shader',
            href: 'fx:./shader/demo.fx',
            target: './shader/demo.fx'
        }
    );

    assert.equal(embedLinks.parseStandaloneEmbedLink('行内 [说明](cs:./code/Demo.cs)'), null);
});

test('viewer uses new standalone embed parser and callout transform hook', () => {
    const viewerHtml = fs.readFileSync(path.resolve('site/pages/viewer.html'), 'utf8');

    assert.match(viewerHtml, /parseStandaloneEmbedLink/);
    assert.match(viewerHtml, /kind !== 'cs' && kind !== 'anims' && kind !== 'fx'/);
    assert.match(viewerHtml, /applyMarkdownCalloutBlocks\(markdownContent\)/);
    assert.match(viewerHtml, /installFxEmbedInteractions\(markdownContent\)/);
});

test('tml-ide markdown insertion snippets use protocol embeds', () => {
    const source = fs.readFileSync(path.resolve('tml-ide-app/src/main.js'), 'utf8');

    assert.match(source, /readMarkdownSelectionText\('动画说明'\)/);
    assert.match(source, /readMarkdownSelectionText\('代码说明'\)/);
    assert.match(source, /readMarkdownSelectionText\('Shader 说明'\)/);
    assert.match(source, /anims:anims\/你的动画文件\.cs/);
    assert.match(source, /cs:\.\/code\/demo\.cs#cs:t:命名空间\.类型名/);
    assert.match(source, /fx:\.\/shaders\/demo\.fx/);
    assert.match(source, /if \(key === 'math-inline'\)/);
    assert.match(source, /if \(key === 'math-block'\)/);
    assert.doesNotMatch(source, /insertMarkdownBlockSnippet\(`\{\{anim:/);
    assert.doesNotMatch(source, /insertMarkdownBlockSnippet\(`\{\{cs:/);
});

test('legacy article studio insertion snippets also use protocol embeds', () => {
    const source = fs.readFileSync(path.resolve('tml-ide/subapps/assets/js/article-studio.js'), 'utf8');

    assert.match(source, /\(cs:\$\{pathPart\}#cs:/);
    assert.match(source, /\[待补充说明\]\(anims:anims\/你的动画文件\.cs\)/);
    assert.match(source, /if \(key === 'math-inline'\)/);
    assert.match(source, /if \(key === 'math-block'\)/);
    assert.doesNotMatch(source, /insertBlockSnippet\(`\{\{anim:/);
    assert.doesNotMatch(source, /insertBlockSnippet\(`\{\{cs:/);
});
