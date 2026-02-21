// Command parameter helpers for shader playground.
// Style: semicolons, 4-space indent, IIFE.

(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ShaderCommandParams = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function toFiniteNumber(v, fallback) {
        const n = Number(v);
        return isFinite(n) ? n : fallback;
    }

    function normalizeBounds(min, max, fallbackValue) {
        let lo = toFiniteNumber(min, fallbackValue - 1);
        let hi = toFiniteNumber(max, fallbackValue + 1);
        if (hi < lo) {
            const t = lo;
            lo = hi;
            hi = t;
        }
        return { min: lo, max: hi };
    }

    function parseCommandSpec(specText, initialValue, type) {
        const raw = String(specText || '').trim();
        const fallback = toFiniteNumber(initialValue, 0);
        const lowerType = String(type || 'float').toLowerCase();
        const defaults = {
            min: fallback - 1,
            max: fallback + 1,
            step: lowerType === 'int' ? 1 : 0.1
        };

        if (!raw) {
            const b = normalizeBounds(defaults.min, defaults.max, fallback);
            return { min: b.min, max: b.max, step: defaults.step };
        }

        const parts = raw.split(',').map((x) => String(x || '').trim()).filter(Boolean);
        let namedFound = false;
        const named = {};

        for (const p of parts) {
            const kv = p.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([+\-]?(?:\d+(?:\.\d+)?|\.\d+))$/);
            if (!kv) continue;
            namedFound = true;
            named[kv[1].toLowerCase()] = Number(kv[2]);
        }

        if (namedFound) {
            const b = normalizeBounds(named.min, named.max, fallback);
            const step = toFiniteNumber(named.step, defaults.step);
            return {
                min: b.min,
                max: b.max,
                step: step > 0 ? step : defaults.step
            };
        }

        const values = parts
            .map((x) => Number(x))
            .filter((x) => isFinite(x));

        const b = normalizeBounds(values[0], values[1], fallback);
        const step = toFiniteNumber(values[2], defaults.step);

        return {
            min: b.min,
            max: b.max,
            step: step > 0 ? step : defaults.step
        };
    }

    function clampCommandValue(type, value, min, max) {
        const lowerType = String(type || 'float').toLowerCase();
        let v = toFiniteNumber(value, 0);
        const b = normalizeBounds(min, max, v);
        v = Math.max(b.min, Math.min(b.max, v));
        if (lowerType === 'int') {
            v = Math.round(v);
        }
        return v;
    }

    function formatCommandNumber(type, value) {
        const lowerType = String(type || 'float').toLowerCase();
        if (lowerType === 'int') {
            return String(Math.round(toFiniteNumber(value, 0)));
        }
        const n = toFiniteNumber(value, 0);
        const t = n.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
        return t || '0';
    }

    function parseCommandLine(lineText, lineIndex) {
        const line = String(lineText || '');
        const m = line.match(/^(\s*)(float|int)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([+\-]?(?:\d+(?:\.\d+)?|\.\d+))(\s*;\s*\/\/\s*Command\s*\(([^)]*)\).*)$/);
        if (!m) return null;

        const type = String(m[2]).toLowerCase();
        const name = m[3];
        const value = Number(m[4]);
        const spec = parseCommandSpec(m[6], value, type);
        const clampedValue = clampCommandValue(type, value, spec.min, spec.max);

        return {
            lineIndex: lineIndex,
            name: name,
            type: type,
            value: clampedValue,
            min: spec.min,
            max: spec.max,
            step: spec.step,
            declarationPrefix: m[1] + m[2] + ' ' + name + ' = ',
            declarationSuffix: m[5]
        };
    }

    function parseCommandVariables(sourceText) {
        const lines = String(sourceText || '').split('\n');
        const vars = [];

        for (let i = 0; i < lines.length; i += 1) {
            const parsed = parseCommandLine(lines[i], i);
            if (parsed) vars.push(parsed);
        }

        return vars;
    }

    function applyCommandValues(sourceText, valuesMap) {
        const lines = String(sourceText || '').split('\n');
        const map = valuesMap || {};

        for (let i = 0; i < lines.length; i += 1) {
            const parsed = parseCommandLine(lines[i], i);
            if (!parsed) continue;
            if (!Object.prototype.hasOwnProperty.call(map, parsed.name)) continue;

            const nextRaw = map[parsed.name];
            const next = clampCommandValue(parsed.type, nextRaw, parsed.min, parsed.max);
            lines[i] = parsed.declarationPrefix + formatCommandNumber(parsed.type, next) + parsed.declarationSuffix;
        }

        return lines.join('\n');
    }

    return {
        parseCommandSpec: parseCommandSpec,
        parseCommandVariables: parseCommandVariables,
        applyCommandValues: applyCommandValues,
        clampCommandValue: clampCommandValue,
        formatCommandNumber: formatCommandNumber
    };
});
