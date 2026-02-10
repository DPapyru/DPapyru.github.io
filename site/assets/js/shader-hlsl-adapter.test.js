const test = require('node:test');
const assert = require('node:assert/strict');

const { buildFragmentSource } = require('./shader-hlsl-adapter');

test('buildFragmentSource maps uv/fragCoord to top-left origin', () => {
    const source = [
        'float4 mainImage(float2 fragCoord)',
        '{',
        '    return float4(fragCoord / iResolution.xy, 0.0, 1.0);',
        '}'
    ].join('\n');

    const result = buildFragmentSource('', source);
    assert.equal(result.ok, true);
    assert.match(result.source, /vec2 uv = vec2\(vUv\.x, 1\.0 - vUv\.y\);/);
    assert.match(result.source, /vec2 fragCoord = uv \* iResolution\.xy;/);
});

test('buildFragmentSource rewrites tex2D sampling to top-left uv', () => {
    const source = [
        'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
        '{',
        '    return tex2D(iChannel0, texCoord);',
        '}'
    ].join('\n');

    const result = buildFragmentSource('', source);
    assert.equal(result.ok, true);
    assert.match(result.source, /texture\(iChannel0, __shaderpgFlipUv\(texCoord\)\)/);
    assert.match(result.source, /fragColor = MainPS\(uv\);/);
});
