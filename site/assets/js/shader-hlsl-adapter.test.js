const test = require('node:test');
const assert = require('node:assert/strict');

const { buildFragmentSource } = require('../../../tml-ide-app/public/subapps/assets/js/shader-hlsl-adapter.js');

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
    assert.match(result.source, /texture\(iChannel0, _shaderpgFlipUv\(texCoord\)\)/);
    assert.match(result.source, /fragColor = MainPS\(uv\);/);
});

test('buildFragmentSource avoids reserved double-underscore helper names', () => {
    const source = [
        'float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0',
        '{',
        '    float4 c0 = tex2D(iChannel0, texCoord);',
        '    float4 c1 = tex2Dgrad(iChannel1, texCoord, float2(1.0, 0.0), float2(0.0, 1.0));',
        '    return c0 * 0.5 + c1 * 0.5;',
        '}'
    ].join('\n');

    const result = buildFragmentSource('', source);
    assert.equal(result.ok, true);

    assert.doesNotMatch(result.source, /__shaderpgFlipUv/);
    assert.doesNotMatch(result.source, /__shaderpgFlipUvGrad/);
    assert.doesNotMatch(result.source, /__shaderpgFlipProj/);

    assert.match(result.source, /_shaderpgFlipUv\(/);
    assert.match(result.source, /_shaderpgFlipUvGrad\(/);
    assert.match(result.source, /_shaderpgFlipProj\(/);
});
