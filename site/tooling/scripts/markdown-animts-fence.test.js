const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('markdown syntax validation doc uses animts fenced embed block', () => {
    const filePath = path.resolve('site/content/如何贡献/Markdown新语法功能验证.md');
    const source = fs.readFileSync(filePath, 'utf8');

    assert.match(source, /```animts\s*\nanims\/demo-basic\.anim\.ts\s*\n```/m);
    assert.doesNotMatch(source, /```animcs\s*\nanims\/demo-basic\.anim\.ts\s*\n```/m);
});
