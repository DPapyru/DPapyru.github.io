const test = require('node:test');
const assert = require('node:assert/strict');

const { buildViewerModel } = require('../compositions/viewer/viewer-shell.js');

const DOCS = [
    { path: 'Modder入门/DPapyru-给新人的前言.md', title: '前言', order: 1 },
    { path: 'Modder入门/制作第一把武器.md', title: '制作第一把武器', order: 2 },
    { path: '如何贡献/教学文章写作指南.md', title: '教学文章写作指南', order: 1 }
];

test('buildViewerModel resolves current file and defaults visible docs to all', () => {
    const model = buildViewerModel({
        rawFile: 'DPapyru-ForNewModder.md',
        allDocs: DOCS,
        pathMappings: {
            'DPapyru-ForNewModder.md': 'Modder入门/DPapyru-给新人的前言.md'
        },
        headingElements: [
            { tagName: 'H1', textContent: '概览', id: '' },
            { tagName: 'H2', textContent: '步骤', id: '' }
        ]
    });

    assert.equal(model.current.path, 'Modder入门/DPapyru-给新人的前言.md');
    assert.equal(model.neighbors.previous.path, '如何贡献/教学文章写作指南.md');
    assert.equal(model.neighbors.next.path, 'Modder入门/制作第一把武器.md');
    assert.equal(model.outline.length, 2);
    assert.equal(model.visibleDocs.length, 3);
});

test('buildViewerModel supports explicit folder scope for current-folder neighbors', () => {
    const model = buildViewerModel({
        rawFile: 'DPapyru-ForNewModder.md',
        allDocs: DOCS,
        scope: 'folder',
        pathMappings: {
            'DPapyru-ForNewModder.md': 'Modder入门/DPapyru-给新人的前言.md'
        },
        headingElements: []
    });

    assert.equal(model.visibleDocs.length, 2);
    assert.equal(model.neighbors.previous, null);
    assert.equal(model.neighbors.next.path, 'Modder入门/制作第一把武器.md');
});
