const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildDocTree,
    flattenVisibleDocs,
    findDocNeighbors
} = require('../services/doc-tree/doc-tree-service.js');

const DOCS = [
    { path: 'Modder入门/DPapyru-给新人的前言.md', title: '前言', order: 1 },
    { path: 'Modder入门/制作第一把武器.md', title: '制作第一把武器', order: 2 },
    { path: '怎么贡献/教学文章写作指南.md', title: '教学文章写作指南', order: 1 }
];

test('buildDocTree groups docs by folder segments', () => {
    const tree = buildDocTree(DOCS);
    assert.ok(tree.children.Modder入门);
    assert.ok(tree.children['怎么贡献']);
    assert.equal(tree.children.Modder入门.docs.length, 2);
});

test('flattenVisibleDocs supports current-folder filtering', () => {
    const tree = buildDocTree(DOCS);
    const docs = flattenVisibleDocs(tree, { folderPath: 'Modder入门' });
    assert.deepEqual(
        docs.map((item) => item.path),
        ['Modder入门/DPapyru-给新人的前言.md', 'Modder入门/制作第一把武器.md']
    );
});

test('findDocNeighbors returns previous and next doc inside visible docs', () => {
    const tree = buildDocTree(DOCS);
    const neighbors = findDocNeighbors(tree, 'Modder入门/制作第一把武器.md', { folderPath: 'Modder入门' });
    assert.equal(neighbors.previous.path, 'Modder入门/DPapyru-给新人的前言.md');
    assert.equal(neighbors.next, null);
});
