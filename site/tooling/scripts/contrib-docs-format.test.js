const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_FILES = [
    path.resolve('site/content/怎么贡献/使用网页特殊动画模块.md'),
    path.resolve('site/content/怎么贡献/在线写作IDE使用教程.md')
];

function hasBrokenNestedAnimcsFence(text) {
    return /(^|\n)```text\s*\n```animcs[\s\S]*?\n```\s*\n```(?=\n|$)/m.test(String(text || ''));
}

test('contrib docs avoid broken nested animcs fences', () => {
    TARGET_FILES.forEach((filePath) => {
        const source = fs.readFileSync(filePath, 'utf8');
        assert.equal(hasBrokenNestedAnimcsFence(source), false, `${filePath} 包含嵌套三反引号围栏`);
        assert.match(source, /````text[\s\S]*```animcs[\s\S]*```[\s\S]*````/m);
    });
});
