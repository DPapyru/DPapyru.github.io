'use strict';

function validateFeatures(source) {
    const text = String(source || '');
    const errors = [];
    if (/\basync\b/.test(text)) {
        errors.push('async is not supported');
    }
    if (/\bawait\b/.test(text)) {
        errors.push('await is not supported');
    }
    if (/\btry\b/.test(text) || /\bcatch\b/.test(text)) {
        errors.push('try/catch is not supported');
    }
    if (/\bswitch\b/.test(text)) {
        errors.push('switch is not supported');
    }
    return errors;
}

function findClassName(source) {
    const match = source.match(/\bclass\s+([A-Za-z_]\w*)\b/);
    return match ? match[1] : '';
}

function parseFields(source) {
    const fields = [];
    const lines = source.split(/\r?\n/);
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('using ') || trimmed.startsWith('[')) return;
        const parenIndex = trimmed.indexOf('(');
        const eqIndex = trimmed.indexOf('=');
        if (parenIndex !== -1 && (eqIndex === -1 || parenIndex < eqIndex)) {
            return;
        }
        const match = trimmed.match(/^(public|private|protected)\s+(static\s+)?([A-Za-z_][\w<>?\[\]]*)\s+([^;]+);/);
        if (!match) return;
        const typeName = match[3];
        const names = match[4].split(',').map(s => s.trim()).filter(Boolean);
        names.forEach((name) => {
            const clean = name.split('=')[0].trim();
            if (clean) {
                fields.push({ name: clean, type: typeName });
            }
        });
    });
    return fields;
}

function findMethodDeclarations(source) {
    const methods = [];
    const re = /(public|private|protected)\s+(static\s+)?([A-Za-z_][\w<>?]*)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g;
    let match;
    while ((match = re.exec(source)) !== null) {
        const isStatic = Boolean(match[2]);
        const name = match[4];
        const params = match[5].trim();
        const bodyStart = match.index + match[0].length - 1;
        const bodyEnd = findMatchingBrace(source, bodyStart);
        if (bodyEnd === -1) break;
        const body = source.slice(bodyStart, bodyEnd + 1);
        methods.push({ name, isStatic, params, body });
        re.lastIndex = bodyEnd + 1;
    }
    return methods;
}

function findExpressionBodiedMethods(source) {
    const methods = [];
    const re = /(public|private|protected)\s+(static\s+)?([A-Za-z_][\w<>?]*)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*=>\s*([^;]+);/g;
    let match;
    while ((match = re.exec(source)) !== null) {
        const isStatic = Boolean(match[2]);
        const returnType = match[3];
        const name = match[4];
        const params = match[5].trim();
        const expr = match[6].trim();
        const body = returnType === 'void'
            ? `{ ${expr}; }`
            : `{ return ${expr}; }`;
        methods.push({ name, isStatic, params, body });
    }
    return methods;
}

function findMatchingBrace(text, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < text.length; i += 1) {
        const ch = text[i];
        if (ch === '{') depth += 1;
        if (ch === '}') {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function normalizeParameters(paramText) {
    if (!paramText) return '';
    return paramText.split(',').map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        const tokens = trimmed.split(/\s+/);
        return tokens[tokens.length - 1].replace(/\?/, '');
    }).filter(Boolean).join(', ');
}

function getDefaultValue(typeName) {
    const clean = String(typeName || '').replace(/\?$/, '');
    if (clean.endsWith('[]')) return 'null';
    if (clean === 'bool') return 'false';
    if (clean === 'float' || clean === 'double' || clean === 'int') return '0';
    if (clean === 'Vec2') return 'new Vec2(0, 0)';
    if (clean === 'Color') return 'new Color(0, 0, 0, 255)';
    if (clean === 'AnimContext') return 'null';
    return 'null';
}

function transformBody(body, className, fieldNames, staticMethods) {
    let trimmed = body.trim();
    if (trimmed.startsWith('{')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('}')) trimmed = trimmed.slice(0, -1);
    const lines = trimmed.split(/\r?\n/);
    let inImplicitArray = false;
    let pendingImplicitArray = false;
    const output = lines.map((line) => {
        let current = line;
        if (/new\s*\[\]/.test(current)) {
            current = current.replace(/new\s*\[\]\s*/g, '');
            if (current.includes('{')) {
                current = current.replace('{', '[');
                inImplicitArray = true;
            } else {
                pendingImplicitArray = true;
            }
        }
        if (pendingImplicitArray && current.trim().startsWith('{')) {
            current = current.replace('{', '[');
            pendingImplicitArray = false;
            inImplicitArray = true;
        }
        if (inImplicitArray && current.includes('};')) {
            current = current.replace('};', '];');
            inImplicitArray = false;
        } else if (inImplicitArray && current.trim() === '}') {
            current = current.replace('}', ']');
            inImplicitArray = false;
        }
        current = current.replace(/(\d+(?:\.\d+)?|\.\d+)f\b/g, '$1');
        current = current.replace(/\bis\s+not\s+null\b/g, '!= null');
        current = current.replace(/\bis\s+null\b/g, '== null');
        current = current.replace(/\.Length\b/g, '.length');
        current = current.replace(/new\s+Vec2\s*\[([^\]]+)\]/g, 'new Array($1)');
        current = current.replace(/\bfor\s*\(\s*(var|int|float|bool)\s+/g, 'for (let ');
        current = current.replace(/^(\s*)(var|float|int|bool|Vec2|Color|AnimContext)\s+/g, '$1let ');
        const isWordChar = (ch) => /[A-Za-z0-9_]/.test(ch);
        fieldNames.forEach((field) => {
            const re = new RegExp(field, 'g');
            current = current.replace(re, (match, offset, str) => {
                const prev = offset > 0 ? str[offset - 1] : '';
                const next = offset + match.length < str.length ? str[offset + match.length] : '';
                if (prev === '.' || isWordChar(prev)) return match;
                if (isWordChar(next)) return match;
                return `this.${field}`;
            });
        });
        staticMethods.forEach((name) => {
            const re = new RegExp(name, 'g');
            current = current.replace(re, (match, offset, str) => {
                const prev = offset > 0 ? str[offset - 1] : '';
                const next = offset + match.length < str.length ? str[offset + match.length] : '';
                if (prev === '.' || isWordChar(prev)) return match;
                if (isWordChar(next)) return match;
                const rest = str.slice(offset + match.length);
                if (!/^\s*\(/.test(rest)) return match;
                return `${className}.${name}`;
            });
        });
        return current;
    });
    return output.join('\n');
}

function compileAnimToJs(source) {
    const text = String(source || '');
    const errors = validateFeatures(text);
    if (errors.length) {
        throw new Error(errors.join('; '));
    }
    const className = findClassName(text);
    if (!className) {
        throw new Error('class declaration not found');
    }
    const fields = parseFields(text);
    const fieldNames = fields.map(f => f.name);
    const methods = findMethodDeclarations(text).concat(findExpressionBodiedMethods(text));
    const staticMethods = methods.filter(m => m.isStatic).map(m => m.name);

    const lines = [];
    lines.push('export function create(runtime) {');
    lines.push('    const { Vec2, Color, MathF } = runtime;');
    lines.push(`    class ${className} {`);
    lines.push('        constructor() {');
    if (fields.length === 0) {
        lines.push('        }');
    } else {
        fields.forEach((field) => {
            lines.push(`            this.${field.name} = ${getDefaultValue(field.type)};`);
        });
        lines.push('        }');
    }
    methods.forEach((method) => {
        const params = normalizeParameters(method.params);
        const jsBody = transformBody(method.body, className, fieldNames, staticMethods);
        const keyword = method.isStatic ? 'static ' : '';
        lines.push(`        ${keyword}${method.name}(${params}) {`);
        if (jsBody.trim()) {
            jsBody.split(/\r?\n/).forEach((line) => {
                lines.push(`            ${line.trimEnd()}`);
            });
        }
        lines.push('        }');
    });
    lines.push('    }');
    lines.push(`    return new ${className}();`);
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}

module.exports = {
    validateFeatures,
    compileAnimToJs
};
