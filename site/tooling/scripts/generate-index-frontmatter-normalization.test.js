const test = require('node:test');
const assert = require('node:assert/strict');

const {
    extractDescriptionFromMarkdownBody,
    normalizeDocRecord
} = require('../generate-index.js');

test('extractDescriptionFromMarkdownBody picks first meaningful paragraph', () => {
    const markdownBody = [
        '# 标题',
        '',
        '```js',
        'console.log("demo");',
        '```',
        '',
        '这是第一段说明，用于测试自动描述提取。',
        '',
        '- 列表项 A',
        '- 列表项 B'
    ].join('\n');

    const description = extractDescriptionFromMarkdownBody(markdownBody, '兜底描述');
    assert.equal(description, '这是第一段说明，用于测试自动描述提取。');
});

test('normalizeDocRecord derives folder slug tags description and reading time', () => {
    const record = normalizeDocRecord({
        relativePath: '教程/入门/第一章.md',
        mappedPath: '教程/入门/第一章.md',
        metadata: {
            title: '第一章',
            author: '作者A',
            order: 2,
            tags: '基础, 入门',
            prefix: [
                '[前置说明](如何贡献/新文章.md)',
                '[前置说明](如何贡献/新文章.md)',
                '[无效项](如何贡献/新文章.txt)'
            ]
        },
        markdownBody: '这是第一章简介。\n\n## 小节\n更多内容。',
        category: '资源参考',
        topic: 'mod-basics'
    });

    assert.equal(record.folder, '教程/入门');
    assert.equal(record.slug, '教程/入门/第一章');
    assert.deepEqual(record.tags, ['基础', '入门']);
    assert.deepEqual(record.prefix, ['[前置说明](如何贡献/新文章.md)']);
    assert.equal(record.description, '这是第一章简介。');
    assert.equal(record.is_hidden, false);
    assert.match(record.reading_time, /^\d+ min$/);
});

test('normalizeDocRecord keeps explicit metadata and hide flag', () => {
    const record = normalizeDocRecord({
        relativePath: '教程/进阶/第二章.md',
        mappedPath: '教程/进阶/第二章.md',
        metadata: {
            title: '第二章',
            author: '作者B',
            order: 8,
            description: '显式描述',
            date: '2026-02-03',
            last_updated: '2026-02-08',
            tags: ['进阶', '性能'],
            reading_time: '12 min',
            hide: true
        },
        markdownBody: '正文不会覆盖显式描述',
        category: '资源参考',
        topic: 'advanced'
    });

    assert.equal(record.description, '显式描述');
    assert.equal(record.date, '2026-02-03');
    assert.equal(record.last_updated, '2026-02-08');
    assert.equal(record.reading_time, '12 min');
    assert.deepEqual(record.tags, ['进阶', '性能']);
    assert.equal(record.is_hidden, true);
});
