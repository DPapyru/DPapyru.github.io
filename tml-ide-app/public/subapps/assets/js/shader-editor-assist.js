// Editor assist helpers for shader playground (highlight + autocomplete).
// Style: semicolons, 4-space indent, IIFE.

(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ShaderEditorAssist = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const KEYWORDS = [
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'discard', 'struct', 'static', 'const', 'in', 'out', 'inout', 'uniform'
    ];

    const TYPES = [
        'void', 'bool', 'int', 'uint', 'float', 'half', 'fixed',
        'bool2', 'bool3', 'bool4',
        'int2', 'int3', 'int4',
        'uint2', 'uint3', 'uint4',
        'float2', 'float3', 'float4',
        'half2', 'half3', 'half4',
        'fixed2', 'fixed3', 'fixed4',
        'float2x2', 'float3x3', 'float4x4',
        'half2x2', 'half3x3', 'half4x4',
        'fixed2x2', 'fixed3x3', 'fixed4x4',
        'min16float', 'min10float', 'min16int', 'min16uint',
        'sampler2D', 'Texture2D', 'sampler_state'
    ];

    const FUNCTIONS = [
        'mainImage', 'MainPS',
        'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'clamp', 'clip', 'cos', 'cross',
        'ddx', 'ddy', 'degrees', 'distance', 'dot', 'exp', 'exp2', 'faceforward', 'floor',
        'fmod', 'frac', 'fwidth', 'isnan', 'isinf', 'length', 'lerp', 'log', 'log10', 'log2',
        'mad', 'max', 'min', 'mix', 'mod', 'mul', 'normalize', 'pow', 'radians', 'reflect',
        'refract', 'rcp', 'round', 'rsqrt', 'saturate', 'sign', 'sin', 'smoothstep', 'sqrt',
        'step', 'tan', 'tex2D', 'tex2Dproj', 'tex2Dbias', 'tex2Dlod', 'tex2Dgrad',
        'texture', 'textureProj', 'textureLod', 'textureGrad',
        'transpose', 'determinant', 'inverse',
        'Hash21'
    ];

    const BUILTINS = [
        'iTime', 'iTimeDelta', 'iFrame', 'iResolution', 'iMouse', 'iDate',
        'iChannel0', 'iChannel1', 'iChannel2', 'iChannel3',
        'uImage0', 'uImage1', 'uImage2', 'uImage3',
        'uv', 'fragCoord', 'fragColor', 'vertexColor',
        'TEXCOORD0', 'COLOR0', 'SV_TARGET', 'SV_POSITION'
    ];

    const DP_KEYWORDS = [
        'profile', 'swing',
        'state', 'on_tick', 'tick', 'goto', 'trail', 'coord', 'space', 'uv_mode', 'blend',
        'fun', 'let', 'const', 'if', 'else', 'for', 'while', 'break', 'continue', 'return',
        'make'
    ];

    const DP_TYPES = [
        'void', 'bool', 'int', 'float',
        'vec2', 'vec3', 'vec4',
        'TrailPoint', 'TrailContext', 'TrailVec2', 'TrailColor'
    ];

    const DP_FUNCTIONS = [
        'build', 'emit', 'biu', 'slash', 'arc', 'swing',
        'rgba', 'rainbow',
        'vec2', 'v2',
        'sin', 'cos', 'tan', 'pow', 'sqrt', 'abs',
        'min', 'max', 'clamp', 'lerp', 'length', 'normalize', 'dot',
        'shader_pass', 'use_shader', 'uv', 'blend', 'u',
        'center', 'at', 'pos',
        'radius', 'angle',
        'count', 'samples', 'points',
        'width', 'thickness',
        'color', 'colour'
    ];

    const DP_BUILTINS = [
        'ctx', 'Time', 'Dt', 'Progress', 'Origin', 'Dir', 'Length', 'Seed',
        't', 'dt', 'p',
        'state_tick', 'state_time', 'phase_tick', 'tick', 'global_tick', 'phase', 'on', 'off', 'uv', 'center', 'auto',
        'linear', 'manual', 'point', 'alpha', 'alphablend', 'additive', 'add', 'addictive', 'PI', 'pi'
    ];

    const COMPLETION_WORDS = Array.from(new Set([
        ...KEYWORDS,
        ...TYPES,
        ...FUNCTIONS,
        ...BUILTINS
    ])).sort((a, b) => a.localeCompare(b));

    const DP_COMPLETION_WORDS = Array.from(new Set([
        ...DP_KEYWORDS,
        ...DP_TYPES,
        ...DP_FUNCTIONS,
        ...DP_BUILTINS,
        'TrailPoint[]'
    ])).sort((a, b) => a.localeCompare(b));

    const COMPLETION_RESERVED = new Set(COMPLETION_WORDS.map((word) => word.toLowerCase()));
    const DP_COMPLETION_RESERVED = new Set(DP_COMPLETION_WORDS.map((word) => word.toLowerCase()));

    function clampInt(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeRegExp(s) {
        return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getCompletionRange(text, cursor) {
        const raw = String(text || '');
        const pos = clampInt(Number(cursor || 0), 0, raw.length);
        const left = raw.slice(0, pos);
        const m = left.match(/[A-Za-z_][A-Za-z0-9_]*$/);
        if (!m) return null;
        const prefix = m[0];
        return {
            start: pos - prefix.length,
            end: pos,
            prefix: prefix
        };
    }

    function stripCommentsAndStrings(text) {
        let raw = String(text || '');
        raw = raw.replace(/\/\*[\s\S]*?\*\//g, ' ');
        raw = raw.replace(/\/\/[^\n]*/g, ' ');
        raw = raw.replace(/"(?:\\.|[^"\\])*"/g, ' ');
        raw = raw.replace(/'(?:\\.|[^'\\])*'/g, ' ');
        return raw;
    }

    function isSwizzleIdentifier(word) {
        return /^[xyzwrgba]{1,4}$/.test(String(word || '').toLowerCase());
    }

    function collectUserDefinedIdentifiers(sourceText, reservedSet) {
        const cleaned = stripCommentsAndStrings(sourceText);
        const matches = cleaned.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
        const result = [];
        const seen = new Set();
        const reserved = reservedSet || COMPLETION_RESERVED;

        matches.forEach((word) => {
            const key = String(word || '').toLowerCase();
            if (!key) return;
            if (reserved.has(key)) return;
            if (isSwizzleIdentifier(key)) return;
            if (seen.has(word)) return;
            seen.add(word);
            result.push(word);
        });

        return result;
    }

    function compareCompletionItems(a, b, prefixLower) {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        const aExact = aLower === prefixLower;
        const bExact = bLower === prefixLower;
        if (aExact !== bExact) return aExact ? -1 : 1;

        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    }

    function collectCompletionItemsFromDictionary(prefix, sourceText, dictionaryWords, reservedSet) {
        const query = String(prefix || '').trim();
        const queryLower = query.toLowerCase();
        const dynamicWords = collectUserDefinedIdentifiers(sourceText, reservedSet);
        const dictionary = Array.from(new Set([
            ...dictionaryWords,
            ...dynamicWords
        ]));

        if (!queryLower) return dictionary.slice(0, 30);

        const items = dictionary.filter((item) => item.toLowerCase().startsWith(queryLower));
        items.sort((a, b) => compareCompletionItems(a, b, queryLower));
        return items.slice(0, 30);
    }

    function collectCompletionItems(prefix, sourceText) {
        return collectCompletionItemsFromDictionary(prefix, sourceText, COMPLETION_WORDS, COMPLETION_RESERVED);
    }

    function collectDpapyruCompletionItems(prefix, sourceText) {
        return collectCompletionItemsFromDictionary(prefix, sourceText, DP_COMPLETION_WORDS, DP_COMPLETION_RESERVED);
    }

    function applyCompletion(text, cursor, completion) {
        const raw = String(text || '');
        const selected = String(completion || '');
        const pos = clampInt(Number(cursor || 0), 0, raw.length);
        const range = getCompletionRange(raw, pos) || { start: pos, end: pos, prefix: '' };

        const nextText = raw.slice(0, range.start) + selected + raw.slice(range.end);
        const nextCursor = range.start + selected.length;
        return {
            text: nextText,
            cursor: nextCursor,
            start: range.start,
            end: range.end
        };
    }

    function indentTextBlock(text, selectionStart, selectionEnd, useShift) {
        const raw = String(text || '');
        const start = clampInt(Number(selectionStart || 0), 0, raw.length);
        const end = clampInt(Number(selectionEnd || 0), 0, raw.length);

        const lineStart = raw.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        const lineEndIdx = raw.indexOf('\n', end);
        const blockEnd = lineEndIdx >= 0 ? lineEndIdx : raw.length;
        const block = raw.slice(lineStart, blockEnd);
        const lines = block.split('\n');

        if (!useShift) {
            const indentedLines = lines.map((line) => '    ' + line);
            const indented = indentedLines.join('\n');
            const nextText = raw.slice(0, lineStart) + indented + raw.slice(blockEnd);

            if (start === end) {
                const next = start + 4;
                return { text: nextText, start: next, end: next };
            }

            return {
                text: nextText,
                start: start + 4,
                end: end + (lines.length * 4)
            };
        }

        let removedBeforeStart = 0;
        let removedTotal = 0;
        const unindentedLines = lines.map((line, idx) => {
            if (line.startsWith('    ')) {
                removedTotal += 4;
                if (idx === 0) removedBeforeStart = 4;
                return line.slice(4);
            }
            if (line.startsWith('\t')) {
                removedTotal += 1;
                if (idx === 0) removedBeforeStart = 1;
                return line.slice(1);
            }
            return line;
        });

        const unindented = unindentedLines.join('\n');
        const nextText = raw.slice(0, lineStart) + unindented + raw.slice(blockEnd);

        if (start === end) {
            const next = Math.max(lineStart, start - removedBeforeStart);
            return { text: nextText, start: next, end: next };
        }

        return {
            text: nextText,
            start: Math.max(lineStart, start - removedBeforeStart),
            end: Math.max(lineStart, end - removedTotal)
        };
    }

    function protectTokens(text, re, className, placeholders) {
        return text.replace(re, function (match) {
            const tokenIndex = placeholders.length;
            const html = '<span class="' + className + '">' + match + '</span>';
            const key = '@@TOKEN' + tokenIndex + '@@';
            placeholders.push(html);
            return key;
        });
    }

    function restoreTokens(text, placeholders) {
        return text.replace(/@@TOKEN(\d+)@@/g, function (_m, index) {
            return placeholders[Number(index)] || '';
        });
    }

    function highlightWordSet(text, words, className) {
        const sorted = words.slice().sort((a, b) => b.length - a.length);
        const re = new RegExp('\\b(' + sorted.map(escapeRegExp).join('|') + ')\\b', 'g');
        return text.replace(re, '<span class="' + className + '">$1</span>');
    }

    function highlightHlslToHtml(source) {
        const placeholders = [];
        let html = escapeHtml(source);

        html = protectTokens(html, /\/\*[\s\S]*?\*\//g, 'shaderpg-token-comment', placeholders);
        html = protectTokens(html, /\/\/[^\n]*/g, 'shaderpg-token-comment', placeholders);
        html = protectTokens(html, /"(?:\\.|[^"\\])*"/g, 'shaderpg-token-string', placeholders);
        html = protectTokens(html, /'(?:\\.|[^'\\])*'/g, 'shaderpg-token-string', placeholders);

        html = html.replace(/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:f|u)?\b/g, '<span class="shaderpg-token-number">$&</span>');
        html = html.replace(/#\s*[A-Za-z_][A-Za-z0-9_]*/g, '<span class="shaderpg-token-preproc">$&</span>');
        html = highlightWordSet(html, TYPES, 'shaderpg-token-type');
        html = highlightWordSet(html, KEYWORDS, 'shaderpg-token-keyword');
        html = highlightWordSet(html, FUNCTIONS, 'shaderpg-token-function');
        html = highlightWordSet(html, BUILTINS, 'shaderpg-token-builtin');

        html = restoreTokens(html, placeholders);

        if (html.length === 0) {
            return ' ';
        }
        return html;
    }

    function highlightDpapyruToHtml(source) {
        const placeholders = [];
        let html = escapeHtml(source);

        html = protectTokens(html, /\/\*[\s\S]*?\*\//g, 'shaderpg-token-comment', placeholders);
        html = protectTokens(html, /\/\/[^\n]*/g, 'shaderpg-token-comment', placeholders);
        html = protectTokens(html, /"(?:\\.|[^"\\])*"/g, 'shaderpg-token-string', placeholders);
        html = protectTokens(html, /'(?:\\.|[^'\\])*'/g, 'shaderpg-token-string', placeholders);

        html = html.replace(/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:f)?\b/g, '<span class="shaderpg-token-number">$&</span>');
        html = highlightWordSet(html, DP_TYPES, 'shaderpg-token-type');
        html = highlightWordSet(html, DP_KEYWORDS, 'shaderpg-token-keyword');
        html = highlightWordSet(html, DP_FUNCTIONS, 'shaderpg-token-function');
        html = highlightWordSet(html, DP_BUILTINS, 'shaderpg-token-builtin');

        html = restoreTokens(html, placeholders);

        if (html.length === 0) {
            return ' ';
        }
        return html;
    }

    return {
        COMPLETION_WORDS: COMPLETION_WORDS,
        DP_COMPLETION_WORDS: DP_COMPLETION_WORDS,
        getCompletionRange: getCompletionRange,
        collectCompletionItems: collectCompletionItems,
        collectDpapyruCompletionItems: collectDpapyruCompletionItems,
        applyCompletion: applyCompletion,
        indentTextBlock: indentTextBlock,
        highlightHlslToHtml: highlightHlslToHtml,
        highlightDpapyruToHtml: highlightDpapyruToHtml
    };
});
