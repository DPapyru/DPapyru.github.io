import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProgramSource } from '../src/lib/shader-hlsl-adapter.js';

test('buildProgramSource keeps vertex/fragment runtime uniforms aligned for anim fx', () => {
    const source = [
        'float uPulse;',
        'float iTime;',
        '',
        'float4 MainVS(float3 position : POSITION0, float2 texCoord : TEXCOORD0, float4 color : COLOR0) : SV_Position',
        '{',
        '    float wave = sin(uTime + iTime + texCoord.x);',
        '    return float4(position.x, position.y + wave + uPulse, position.z, 1.0);',
        '}',
        '',
        'float4 MainPS(float2 texCoord : TEXCOORD0, float4 vertexColor : COLOR0) : COLOR0',
        '{',
        '    float pulse = 0.5 + 0.5 * sin(uTime + iTime + texCoord.y);',
        '    return float4(pulse, pulse, pulse, 1.0) * vertexColor;',
        '}'
    ].join('\n');

    const result = buildProgramSource(source, { vertexEntry: 'MainVS' });
    assert.equal(result.ok, true);

    assert.match(result.vertexSource, /uniform vec2 uResolution;/);
    assert.match(result.vertexSource, /uniform float uTime;/);
    assert.match(result.vertexSource, /uniform vec3 iResolution;/);
    assert.match(result.vertexSource, /uniform float iTime;/);

    assert.match(result.fragmentSource, /uniform vec2 uResolution;/);
    assert.match(result.fragmentSource, /uniform float uTime;/);
    assert.match(result.fragmentSource, /uniform vec3 iResolution;/);
    assert.match(result.fragmentSource, /uniform float iTime;/);

    assert.match(result.vertexSource, /uniform float uPulse;/);
    assert.match(result.fragmentSource, /uniform float uPulse;/);

    assert.equal((result.vertexSource.match(/\buniform float iTime;/g) || []).length, 1);
    assert.equal((result.fragmentSource.match(/\buniform float iTime;/g) || []).length, 1);
});
