const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer category navigation always renders learn tree from ALL_DOCS', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const source = fs.readFileSync(viewerPath, 'utf8');
    assert.match(source, /renderLearnFolderTreeNavigation\(categorySidebar,\s*\{\s*docs:\s*ALL_DOCS,\s*defaultCollapseDepth:\s*1\s*\}\)/);
    assert.doesNotMatch(source, /__FORCE_LEARN_TREE_NAV/);
    assert.doesNotMatch(source, /const\s+commonFiles\s*=\s*\[/);
    assert.doesNotMatch(source, /尝试扫描常见文档文件/);
});
