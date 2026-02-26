function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceWord(text, from, to) {
    const pattern = new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g');
    return String(text || '').replace(pattern, to);
}

function normalizeLineEndings(text) {
    return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function isVec2Type(typeName) {
    return /^(?:float2|half2|fixed2|vec2)$/i.test(String(typeName || ''));
}

function isVec3Type(typeName) {
    return /^(?:float3|half3|fixed3|vec3)$/i.test(String(typeName || ''));
}

function isVec4Type(typeName) {
    return /^(?:float4|half4|fixed4|vec4)$/i.test(String(typeName || ''));
}

const DEFAULT_RUNTIME_UNIFORM_LINES = [
    'uniform vec2 uResolution;',
    'uniform float uTime;',
    'uniform vec3 iResolution;',
    'uniform float iTime;',
    'uniform float iTimeDelta;',
    'uniform int iFrame;',
    'uniform vec4 iMouse;',
    'uniform vec4 iDate;',
    'uniform float iChannelTime[4];',
    'uniform vec3 iChannelResolution[4];',
    'uniform sampler2D iChannel0;',
    'uniform sampler2D iChannel1;',
    'uniform sampler2D iChannel2;',
    'uniform sampler2D iChannel3;'
];

const DEFAULT_RUNTIME_UNIFORM_NAMES = new Set(DEFAULT_RUNTIME_UNIFORM_LINES
    .map((line) => {
        const match = String(line || '').match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*;/);
        return match ? match[1] : '';
    })
    .filter(Boolean));

const TOP_LEVEL_SCALAR_OR_VECTOR_DECL_RE = /^(\s*)(?:uniform\s+)?(mat[234]|vec[234]|ivec[234]|uvec[234]|bvec[234]|float|int|uint|bool)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(\[\s*(?:\d+)?\s*\])?\s*;\s*$/;

function countChar(text, needle) {
    const source = String(text || '');
    let count = 0;
    for (let i = 0; i < source.length; i += 1) {
        if (source[i] === needle) count += 1;
    }
    return count;
}

function normalizeTopLevelUniformDeclarations(sourceText) {
    const lines = normalizeLineEndings(sourceText).split('\n');
    const normalized = [];
    let braceDepth = 0;

    for (const line of lines) {
        if (braceDepth === 0) {
            const match = line.match(TOP_LEVEL_SCALAR_OR_VECTOR_DECL_RE);
            if (match) {
                const indent = match[1] || '';
                const type = match[2];
                const name = match[3];
                const arraySuffix = match[4] || '';

                if (!DEFAULT_RUNTIME_UNIFORM_NAMES.has(name)) {
                    normalized.push(`${indent}uniform ${type} ${name}${arraySuffix};`);
                }
            } else {
                normalized.push(line);
            }
        } else {
            normalized.push(line);
        }

        braceDepth += countChar(line, '{');
        braceDepth -= countChar(line, '}');
        if (braceDepth < 0) braceDepth = 0;
    }

    return normalized.join('\n');
}

function inferCoordArg(name, semantic) {
    const sem = String(semantic || '').toUpperCase();
    const lower = String(name || '').toLowerCase();
    if (/TEXCOORD/.test(sem)) return 'uv';
    if (lower.includes('fragcoord')) return 'fragCoord';
    if (lower === 'uv' || lower.includes('tex') || lower.includes('coord')) return 'uv';
    return 'fragCoord';
}

function parseParams(paramListText) {
    const params = [];
    const chunks = String(paramListText || '').split(',');
    for (const raw of chunks) {
        let text = String(raw || '').trim();
        if (!text) continue;

        let semantic = '';
        const semMatch = text.match(/:\s*(SV_[A-Za-z0-9_]+|[A-Z][A-Z0-9_]*)\s*$/);
        if (semMatch) {
            semantic = semMatch[1];
            text = text.slice(0, semMatch.index).trim();
        }

        text = text
            .replace(/\b(inout|in|out|const|uniform)\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const match = text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)$/);
        if (!match) {
            return null;
        }

        params.push({
            type: match[1],
            name: match[2],
            semantic
        });
    }
    return params;
}

function scoreEntryCandidate(name, returnSemantic, params) {
    let score = 0;
    const lower = String(name || '').toLowerCase();
    if (name === 'mainImage') score += 100;
    if (/(?:mainps|pixel|ps|fragment)/.test(lower)) score += 40;
    if (returnSemantic) score += 20;
    if (params.some((item) => /TEXCOORD/i.test(String(item.semantic || '')))) score += 15;
    if (params.filter((item) => isVec2Type(item.type)).length === 1) score += 5;
    return score;
}

function buildCallArgsFromParams(params) {
    const callArgs = [];
    let vec2Count = 0;

    for (const param of params) {
        if (isVec2Type(param.type)) {
            vec2Count += 1;
            callArgs.push(inferCoordArg(param.name, param.semantic));
            continue;
        }

        if (isVec4Type(param.type)) {
            if (/COLOR/i.test(String(param.semantic || '')) || /color/i.test(String(param.name || ''))) {
                callArgs.push('vertexColor');
            } else {
                callArgs.push('constVec4');
            }
            continue;
        }

        return null;
    }

    if (vec2Count === 0) return null;
    return callArgs;
}

export function detectEntryFunction(sourceText) {
    const source = normalizeLineEndings(sourceText);
    const outMatch = source.match(/\bvoid\s+mainImage\s*\(\s*out\s+(?:float4|half4|fixed4)\s+([A-Za-z_][A-Za-z0-9_]*)\s*,\s*(?:float2|half2|fixed2)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
    if (outMatch) {
        return {
            kind: 'out',
            name: 'mainImage',
            callArgs: ['fragColorOut', inferCoordArg(outMatch[2], '')]
        };
    }

    let best = null;
    const fnRe = /\b(?:float4|half4|fixed4)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*(SV_[A-Za-z0-9_]+|COLOR0|COLOR))?/g;
    let match;
    while ((match = fnRe.exec(source)) !== null) {
        const fnName = match[1];
        const params = parseParams(match[2]);
        if (!params || params.length === 0) continue;
        const callArgs = buildCallArgsFromParams(params);
        if (!callArgs) continue;

        const candidate = {
            kind: 'return',
            name: fnName,
            callArgs,
            score: scoreEntryCandidate(fnName, match[3] || '', params)
        };
        if (!best || candidate.score > best.score) {
            best = candidate;
        }
    }

    if (!best) return null;
    delete best.score;
    return best;
}

function stripTechniqueSections(sourceText) {
    const text = normalizeLineEndings(sourceText);
    const techniqueIndex = text.search(/\btechnique(?:10|11)?\b/i);
    return techniqueIndex >= 0 ? text.slice(0, techniqueIndex) : text;
}

function detectVertexEntryFunction(sourceText, entryName) {
    const source = normalizeLineEndings(sourceText);
    const safeName = String(entryName || 'MainVS').trim() || 'MainVS';
    const fnRe = new RegExp(
        `\\b(?:float4|half4|fixed4|vec4)\\s+${escapeRegExp(safeName)}\\s*\\(([^)]*)\\)\\s*(?::\\s*(SV_[A-Za-z0-9_]+|POSITION0|POSITION))?`,
        'i'
    );
    const match = source.match(fnRe);
    if (!match) return null;
    const params = parseParams(match[1]);
    if (!params) return null;

    const callArgs = [];
    for (const param of params) {
        if (isVec3Type(param.type)) {
            callArgs.push('position');
            continue;
        }
        if (isVec2Type(param.type)) {
            callArgs.push('texCoord');
            continue;
        }
        if (isVec4Type(param.type)) {
            if (/COLOR/i.test(String(param.semantic || '')) || /color/i.test(String(param.name || ''))) {
                callArgs.push('vertexColor');
            } else {
                callArgs.push('constVec4');
            }
            continue;
        }
        return null;
    }

    return {
        name: safeName,
        callArgs
    };
}

function applyHlslTransforms(sourceText) {
    let transformed = normalizeLineEndings(sourceText);
    transformed = transformed.replace(/\s*:\s*register\s*\(\s*[A-Za-z]\d+\s*\)/gi, '');
    transformed = transformed.replace(/\bsampler_state(?:\s+[A-Za-z_][A-Za-z0-9_]*)?\s*\{[\s\S]*?\}\s*;/g, '');
    transformed = transformed.replace(/^\s*(?:sampler2D|Texture2D)\s+[A-Za-z_][A-Za-z0-9_]*\s*;\s*$/gmi, '');
    transformed = transformed.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(SV_[A-Za-z0-9_]+|[A-Z][A-Z0-9_]*)\b/g, '$1');
    transformed = transformed.replace(/\)\s*:\s*(SV_[A-Za-z0-9_]+|COLOR0|COLOR)\b/g, ')');

    transformed = replaceWord(transformed, 'float4x4', 'mat4');
    transformed = replaceWord(transformed, 'float3x3', 'mat3');
    transformed = replaceWord(transformed, 'float2x2', 'mat2');
    transformed = replaceWord(transformed, 'half4x4', 'mat4');
    transformed = replaceWord(transformed, 'half3x3', 'mat3');
    transformed = replaceWord(transformed, 'half2x2', 'mat2');
    transformed = replaceWord(transformed, 'fixed4x4', 'mat4');
    transformed = replaceWord(transformed, 'fixed3x3', 'mat3');
    transformed = replaceWord(transformed, 'fixed2x2', 'mat2');

    transformed = replaceWord(transformed, 'float4', 'vec4');
    transformed = replaceWord(transformed, 'float3', 'vec3');
    transformed = replaceWord(transformed, 'float2', 'vec2');
    transformed = replaceWord(transformed, 'half4', 'vec4');
    transformed = replaceWord(transformed, 'half3', 'vec3');
    transformed = replaceWord(transformed, 'half2', 'vec2');
    transformed = replaceWord(transformed, 'fixed4', 'vec4');
    transformed = replaceWord(transformed, 'fixed3', 'vec3');
    transformed = replaceWord(transformed, 'fixed2', 'vec2');

    transformed = replaceWord(transformed, 'int4', 'ivec4');
    transformed = replaceWord(transformed, 'int3', 'ivec3');
    transformed = replaceWord(transformed, 'int2', 'ivec2');
    transformed = replaceWord(transformed, 'uint4', 'uvec4');
    transformed = replaceWord(transformed, 'uint3', 'uvec3');
    transformed = replaceWord(transformed, 'uint2', 'uvec2');
    transformed = replaceWord(transformed, 'bool4', 'bvec4');
    transformed = replaceWord(transformed, 'bool3', 'bvec3');
    transformed = replaceWord(transformed, 'bool2', 'bvec2');

    transformed = replaceWord(transformed, 'half', 'float');
    transformed = replaceWord(transformed, 'fixed', 'float');
    transformed = replaceWord(transformed, 'min16float', 'float');
    transformed = replaceWord(transformed, 'min10float', 'float');
    transformed = replaceWord(transformed, 'min16int', 'int');
    transformed = replaceWord(transformed, 'min16uint', 'uint');

    transformed = replaceWord(transformed, 'uImage0', 'iChannel0');
    transformed = replaceWord(transformed, 'uImage1', 'iChannel1');
    transformed = replaceWord(transformed, 'uImage2', 'iChannel2');
    transformed = replaceWord(transformed, 'uImage3', 'iChannel3');

    transformed = replaceWord(transformed, 'lerp', 'mix');
    transformed = replaceWord(transformed, 'frac', 'fract');
    transformed = replaceWord(transformed, 'rsqrt', 'inversesqrt');
    transformed = replaceWord(transformed, 'ddx', 'dFdx');
    transformed = replaceWord(transformed, 'ddy', 'dFdy');
    transformed = replaceWord(transformed, 'atan2', 'atan');
    transformed = replaceWord(transformed, 'mad', 'fma');
    transformed = replaceWord(transformed, 'fmod', 'mod');

    transformed = transformed.replace(/\btex2D\s*\(\s*([^,]+)\s*,\s*([^\)]+)\)/g, 'texture($1, _shaderpgFlipUv($2))');
    transformed = transformed.replace(/\btex2Dproj\s*\(\s*([^,]+)\s*,\s*([^\)]+)\)/g, 'textureProj($1, _shaderpgFlipProj($2))');
    transformed = transformed.replace(/\btex2Dlod\s*\(\s*([^,]+)\s*,\s*float4\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,\)]+)\s*,\s*([^\)]+)\s*\)\s*\)/g, 'textureLod($1, _shaderpgFlipUv(vec2($2, $3)), $5)');
    transformed = transformed.replace(/\btex2Dlod\s*\(\s*([^,]+)\s*,\s*([^\)]+)\)/g, 'textureLod($1, _shaderpgFlipUv(($2).xy), ($2).w)');
    transformed = transformed.replace(/\btex2Dbias\s*\(\s*([^,]+)\s*,\s*([^\)]+)\)/g, 'texture($1, _shaderpgFlipUv(($2).xy))');
    transformed = transformed.replace(/\btex2Dgrad\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\)]+)\)/g, 'textureGrad($1, _shaderpgFlipUv($2), _shaderpgFlipUvGrad($3), _shaderpgFlipUvGrad($4))');
    transformed = transformed.replace(/\bmul\s*\(\s*([^,]+)\s*,\s*([^\)]+)\)/g, '($1 * $2)');
    transformed = transformed.replace(/\bclip\s*\(\s*([^\)]+)\s*\)\s*;/g, 'if (($1) < 0.0) discard;');
    transformed = transformed.replace(/\brcp\s*\(\s*([^()]+)\s*\)/g, '(1.0 / ($1))');
    transformed = transformed.replace(/\blog10\s*\(\s*([^()]+)\s*\)/g, '(log($1) / log(10.0))');
    transformed = normalizeTopLevelUniformDeclarations(transformed);
    return transformed;
}

function mapCallArgExpr(arg, context) {
    if (arg === 'uv') return context.uvName;
    if (arg === 'fragCoord') return context.fragCoordName;
    if (arg === 'vertexColor') return context.vertexColorName;
    if (arg === 'constVec4') return 'vec4(1.0)';
    if (arg === 'fragColorOut') return context.fragColorOutName;
    return null;
}

export function buildFragmentSource(common, passCode) {
    return buildFragmentSourceWithOptions(common, passCode, {});
}

function buildFragmentSourceWithOptions(common, passCode, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const userSource = `${String(common || '')}\n\n${String(passCode || '')}`;
    const normalized = normalizeLineEndings(userSource);
    const entry = detectEntryFunction(normalized);

    if (!entry) {
        return {
            ok: false,
            error: '未找到可用的像素着色入口。支持 mainImage(...)，或 float4 MainPS(float2 texCoord : TEXCOORD0) : COLOR0。'
        };
    }

    const transformed = applyHlslTransforms(normalized);
    const prelude = [
        '#version 300 es',
        'precision highp float;',
        'precision highp int;',
        '',
        'in vec2 vUv;',
        opts.vertexColorVarying ? 'in vec4 vColor;' : '',
        'out vec4 fragColor;',
        '',
        ...DEFAULT_RUNTIME_UNIFORM_LINES,
        '',
        'float saturate(float x) { return clamp(x, 0.0, 1.0); }',
        'vec2 saturate(vec2 x) { return clamp(x, vec2(0.0), vec2(1.0)); }',
        'vec3 saturate(vec3 x) { return clamp(x, vec3(0.0), vec3(1.0)); }',
        'vec4 saturate(vec4 x) { return clamp(x, vec4(0.0), vec4(1.0)); }',
        'vec2 _shaderpgFlipUv(vec2 uv) { return vec2(uv.x, 1.0 - uv.y); }',
        'vec2 _shaderpgFlipUvGrad(vec2 gradUv) { return vec2(gradUv.x, -gradUv.y); }',
        'vec3 _shaderpgFlipProj(vec3 uvw) { return vec3(uvw.x, uvw.z - uvw.y, uvw.z); }',
        'vec4 _shaderpgFlipProj(vec4 uvzw) { return vec4(uvzw.x, uvzw.w - uvzw.y, uvzw.z, uvzw.w); }',
        ''
    ].join('\n');

    const context = {
        uvName: 'uv',
        fragCoordName: 'fragCoord',
        vertexColorName: 'vertexColor',
        fragColorOutName: 'outColor'
    };
    const mappedArgs = [];
    for (const arg of entry.callArgs) {
        const expr = mapCallArgExpr(arg, context);
        if (!expr) {
            return { ok: false, error: `入口函数参数暂不支持：${String(arg)}` };
        }
        mappedArgs.push(expr);
    }

    const glue = [
        'void main() {',
        '    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);',
        '    vec2 fragCoord = uv * iResolution.xy;',
        opts.vertexColorVarying ? '    vec4 vertexColor = vColor;' : '    vec4 vertexColor = vec4(1.0);'
    ];
    if (entry.kind === 'out') {
        glue.push('    vec4 outColor = vec4(0.0);');
        glue.push(`    ${entry.name}(${mappedArgs.join(', ')});`);
        glue.push('    fragColor = outColor;');
    } else {
        glue.push(`    fragColor = ${entry.name}(${mappedArgs.join(', ')});`);
    }
    glue.push('}');

    return {
        ok: true,
        source: `${prelude}\n#line 1\n${transformed}\n\n${glue.join('\n')}\n`
    };
}

export function buildVertexSource(effectSource, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const sourceBody = stripTechniqueSections(effectSource);
    const entryName = String(opts.vertexEntry || 'MainVS').trim() || 'MainVS';
    const entry = detectVertexEntryFunction(sourceBody, entryName);
    if (!entry) {
        return {
            ok: false,
            error: `未找到可用的顶点着色入口。需要 ${entryName}(...) 且返回 float4。`
        };
    }

    const transformed = applyHlslTransforms(sourceBody);
    const mappedArgs = [];
    for (const arg of entry.callArgs) {
        if (arg === 'position') {
            mappedArgs.push('position');
            continue;
        }
        if (arg === 'texCoord') {
            mappedArgs.push('texCoord');
            continue;
        }
        if (arg === 'vertexColor') {
            mappedArgs.push('vertexColorIn');
            continue;
        }
        if (arg === 'constVec4') {
            mappedArgs.push('vec4(1.0)');
            continue;
        }
        return { ok: false, error: `顶点入口参数暂不支持：${String(arg)}` };
    }

    const source = [
        '#version 300 es',
        'precision highp float;',
        'precision highp int;',
        '',
        'layout(location = 0) in vec3 aPosition;',
        'layout(location = 1) in vec4 aColor;',
        'layout(location = 2) in vec2 aTexCoord;',
        '',
        'out vec4 vColor;',
        'out vec2 vUv;',
        '',
        ...DEFAULT_RUNTIME_UNIFORM_LINES,
        '',
        '#line 1',
        transformed,
        '',
        'void main() {',
        '    vec3 position = aPosition;',
        '    vec4 vertexColorIn = aColor;',
        '    vec2 texCoord = aTexCoord;',
        `    vec4 vsOut = ${entry.name}(${mappedArgs.join(', ')});`,
        '    vec2 pixelPos = vsOut.xy;',
        '    vec2 safeResolution = max(uResolution, vec2(1.0));',
        '    vec2 clipPos = vec2(',
        '        (pixelPos.x / safeResolution.x) * 2.0 - 1.0,',
        '        1.0 - (pixelPos.y / safeResolution.y) * 2.0',
        '    );',
        '    gl_Position = vec4(clipPos, vsOut.z, 1.0);',
        '    vColor = vertexColorIn;',
        '    vUv = vec2(texCoord.x, 1.0 - texCoord.y);',
        '}',
        ''
    ].join('\n');

    return {
        ok: true,
        source
    };
}

export function buildProgramSource(effectSource, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const sourceBody = stripTechniqueSections(effectSource);
    const vertex = buildVertexSource(sourceBody, {
        vertexEntry: opts.vertexEntry || 'MainVS'
    });
    if (!vertex.ok) return vertex;

    const fragment = buildFragmentSourceWithOptions('', sourceBody, {
        vertexColorVarying: true
    });
    if (!fragment.ok) return fragment;

    return {
        ok: true,
        vertexSource: vertex.source,
        fragmentSource: fragment.source
    };
}

export { replaceWord, escapeRegExp };
