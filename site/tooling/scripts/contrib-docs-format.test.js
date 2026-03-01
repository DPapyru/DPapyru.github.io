const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_FILES = [
    path.resolve('site/content/如何贡献/使用网页特殊动画模块.md'),
    path.resolve('site/content/如何贡献/在线写作IDE使用教程.md')
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

test('vertex draw section includes live animcs demo and key draw calls', () => {
    const source = fs.readFileSync(path.resolve('site/content/如何贡献/使用网页特殊动画模块.md'), 'utf8');

    assert.match(source, /##\s*顶点绘制\s*\+\s*FX（首版）/);
    assert.match(source, /```animcs\s*\nanims\/fna-vertex-demo\.cs\s*\n```/m);
    assert.match(source, /DrawUserIndexedPrimitives/);
    assert.match(source, /UseEffect\("anims\/shaders\/fna-vertex-demo\.fx"\)/);
});
