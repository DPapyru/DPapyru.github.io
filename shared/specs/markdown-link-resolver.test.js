const test = require('node:test');
const assert = require('node:assert/strict');

const { createMarkdownPathResolver } = require('../capabilities/markdown/core/index.js');

test('resolver resolves relative href by current markdown path', () => {
    const resolver = createMarkdownPathResolver();

    const siblingImage = resolver.resolveRelativeHref('../imgs/sample.png', 'Guide/Intro/setup.md');
    const anchorOnly = resolver.resolveRelativeHref('#usage', 'Guide/Intro/setup.md');

    assert.equal(siblingImage, 'Guide/imgs/sample.png');
    assert.equal(anchorOnly, '#usage');
});

test('resolver resolves markdown payload path for IDE preview', () => {
    const resolver = createMarkdownPathResolver();

    assert.equal(
        resolver.resolveContentPathFromMarkdown('site/content/Guide/Intro/setup.md', '../code/demo.cs'),
        'Guide/code/demo.cs'
    );
    assert.equal(
        resolver.resolveContentPathFromMarkdown('Guide/Intro/setup.md', 'anims/Player.cs'),
        'anims/Player.cs'
    );
    assert.equal(
        resolver.resolveContentPathFromMarkdown('Guide/Intro/setup.md', 'https://example.com/x.md'),
        ''
    );
});

test('resolver resolves document path from lookup map', () => {
    const lookup = new Map();
    lookup.set('Guide/Intro/next.md', 'Guide/Intro/next.md');
    lookup.set('Guide/base.md', 'Guide/base.md');

    const resolver = createMarkdownPathResolver({ docLookupMap: lookup });

    assert.equal(resolver.resolveDocLinkPath('./next', 'Guide/Intro/setup.md'), 'Guide/Intro/next.md');
    assert.equal(resolver.resolveDocLinkPath('../base', 'Guide/Intro/setup.md'), 'Guide/base.md');
    assert.equal(resolver.resolveDocLinkPath('/absolute/path', 'Guide/Intro/setup.md'), null);
});
