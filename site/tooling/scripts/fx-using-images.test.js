const test = require('node:test');
const assert = require('node:assert/strict');

const usingApi = require('../../../shared/services/shader/fx-using-images.js');

test('fx using parser extracts img0~img3 directives', () => {
    const source = [
        '// using:img0="./imgs/a.png"',
        '// using:img2="../shared/b.png"',
        'float4 MainPS(float2 uv : TEXCOORD0) : COLOR0 { return 1; }'
    ].join('\n');

    const map = usingApi.usingMapFromSource(source);
    assert.equal(map[0], './imgs/a.png');
    assert.equal(map[2], '../shared/b.png');
    assert.equal(usingApi.firstEmptySlot(map), 1);
});

test('fx using upsert and path conversion helpers work for relative image refs', () => {
    const source = 'float4 MainPS(float2 uv : TEXCOORD0) : COLOR0 { return 1; }\n';
    const next = usingApi.upsertUsingLine(source, 1, './imgs/new.png');
    assert.match(next, /^\/\/ using:img1="\.\/*imgs\/new\.png"/);

    const resolved = usingApi.resolveUsingPathToRepoPath('文章/章节/effect.fx', './imgs/new.png');
    assert.equal(resolved, '文章/章节/imgs/new.png');

    const relative = usingApi.makeUsingPathFromImageRepoPath('文章/章节/effect.fx', '文章/章节/imgs/new.png');
    assert.equal(relative, './imgs/new.png');
});
