const test = require('node:test');
const assert = require('node:assert/strict');

const frontMatterUtils = require('../../../shared/services/markdown/front-matter-utils.js');

test('front-matter utils parse and apply defaults', () => {
    const markdown = [
        '---',
        'title: Hello',
        'topic: article-contribution',
        'difficulty: intermediate',
        'colors:',
        '  accent: "#ff00aa"',
        '---',
        '',
        '# Hello'
    ].join('\n');

    const parsed = frontMatterUtils.parseFrontMatter(markdown);
    assert.equal(parsed.hasFrontMatter, true);
    assert.equal(parsed.metadata.title, 'Hello');
    assert.equal(parsed.metadata.topic, 'article-contribution');
    assert.equal(parsed.metadata.difficulty, 'intermediate');
    assert.equal(parsed.metadata.colors.accent, '#ff00aa');
});

test('front-matter utils ensure/merge keeps markdown body', () => {
    const source = '# Title\n\nBody\n';
    const ensured = frontMatterUtils.ensureFrontMatter(source, { title: 'New Doc' });
    assert.match(ensured, /^---\n/);
    assert.match(ensured, /title: New Doc/);
    assert.match(ensured, /# Title/);

    const merged = frontMatterUtils.mergeFrontMatter(ensured, {
        title: 'Updated',
        difficulty: 'advanced'
    });
    assert.match(merged, /title: Updated/);
    assert.match(merged, /difficulty: advanced/);
    assert.match(merged, /Body/);
});
