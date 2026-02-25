const test = require('node:test');
const assert = require('node:assert/strict');

const {
    extractHeadingOutlineFromMarkdown,
    extractHeadingOutlineFromElements
} = require('../services/outline/heading-outline-service.js');

test('extractHeadingOutlineFromMarkdown parses heading level and anchor ids', () => {
    const outline = extractHeadingOutlineFromMarkdown([
        '# 标题',
        '正文',
        '## 第二节',
        '### 小节'
    ].join('\n'));

    assert.deepEqual(
        outline.map((item) => ({ level: item.level, text: item.text, id: item.id })),
        [
            { level: 1, text: '标题', id: 'section-1-biao-ti' },
            { level: 2, text: '第二节', id: 'section-2-di-er-jie' },
            { level: 3, text: '小节', id: 'section-3-xiao-jie' }
        ]
    );
});

test('extractHeadingOutlineFromElements normalizes duplicate/missing ids', () => {
    const fakeHeadings = [
        { tagName: 'H1', textContent: 'Overview', id: '' },
        { tagName: 'H2', textContent: 'Overview', id: 'overview' },
        { tagName: 'H2', textContent: 'Details', id: 'overview' }
    ];

    const outline = extractHeadingOutlineFromElements(fakeHeadings);
    assert.equal(outline[0].id, 'section-1-overview');
    assert.equal(outline[1].id, 'overview');
    assert.equal(outline[2].id, 'overview-2');
});
