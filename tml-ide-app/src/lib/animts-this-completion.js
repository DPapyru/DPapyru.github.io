function normalizeCompletionOffset(text, offset) {
    const safeText = String(text || '');
    const safeOffset = Number(offset);
    if (!Number.isFinite(safeOffset)) {
        return safeText.length;
    }
    if (safeOffset < 0) return 0;
    if (safeOffset > safeText.length) return safeText.length;
    return Math.floor(safeOffset);
}

function thisCompletionContextAtOffset(text, offset) {
    const source = String(text || '');
    const cursor = normalizeCompletionOffset(source, offset);
    const scope = source.slice(0, cursor);
    const match = scope.match(/([A-Za-z_$][A-Za-z0-9_$.]*)\.([A-Za-z_$][A-Za-z0-9_$]*)?$/);
    if (!match) return null;
    return {
        ownerExpr: String(match[1] || ''),
        prefix: String(match[2] || '')
    };
}

function normalizeTypeName(typeName) {
    const safe = String(typeName || '').trim();
    if (!safe) return '';
    const cleaned = safe
        .replace(/[?[\]\s]/g, '')
        .replace(/^\(?\s*/, '')
        .replace(/\s*\)?$/, '');
    if (!cleaned) return '';
    const parts = cleaned.split('.').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}

function buildIdentifierTypeHints(text, staticIdentifierTypeHints) {
    const hints = new Map();
    const source = String(text || '');
    const staticHints = staticIdentifierTypeHints && typeof staticIdentifierTypeHints === 'object'
        ? staticIdentifierTypeHints
        : {};
    Object.keys(staticHints).forEach((name) => {
        const key = String(name || '').trim();
        const typeName = normalizeTypeName(staticHints[name]);
        if (!key || !typeName) return;
        hints.set(key, typeName);
    });

    const methodRe = /\b(OnInit|OnRender|OnUpdate)\s*\(([^)]*)\)/g;
    let match = null;
    while ((match = methodRe.exec(source)) !== null) {
        const method = String(match[1] || '');
        const params = String(match[2] || '')
            .split(',')
            .map((entry) => String(entry || '').trim())
            .filter(Boolean);

        params.forEach((param, index) => {
            const typedMatch = param.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$.]*)$/);
            if (typedMatch) {
                const name = String(typedMatch[1] || '');
                const typedName = normalizeTypeName(typedMatch[2]);
                if (name && typedName) hints.set(name, typedName);
                return;
            }

            const nameMatch = param.match(/([A-Za-z_$][A-Za-z0-9_$]*)$/);
            const name = nameMatch ? String(nameMatch[1] || '') : '';
            if (!name) return;
            if (index === 0 && method === 'OnInit') hints.set(name, 'AnimContext');
            if (index === 0 && method === 'OnRender') hints.set(name, 'ICanvas2D');
            if (index === 0 && method === 'OnUpdate') hints.set(name, 'number');
        });
    }

    return hints;
}

function resolveOwnerTypeFromChain(ownerExpr, fieldTypeMap, memberReturnTypeByType) {
    const chain = String(ownerExpr || '').split('.').filter(Boolean);
    if (chain.length < 2) return '';
    if (chain[0] !== 'this') return '';

    const fieldName = String(chain[1] || '');
    let currentType = String(fieldTypeMap.get(fieldName) || '');
    if (!currentType) return '';

    for (let i = 2; i < chain.length; i += 1) {
        const memberName = String(chain[i] || '');
        if (!memberName) return '';
        const typeMap = memberReturnTypeByType && typeof memberReturnTypeByType === 'object'
            ? memberReturnTypeByType
            : {};
        const memberMap = typeMap[currentType] && typeof typeMap[currentType] === 'object'
            ? typeMap[currentType]
            : {};
        currentType = normalizeTypeName(memberMap[memberName]);
        if (!currentType) return '';
    }

    return currentType;
}

function inferTypeFromExpression(exprText, identifierHints, fieldTypeMap) {
    const expr = String(exprText || '').trim();
    if (!expr || expr === 'null' || expr === 'undefined') return '';
    if (/^(true|false)$/.test(expr)) return 'boolean';
    if (/^-?\d+(\.\d+)?$/.test(expr)) return 'number';
    if (/^['"`]/.test(expr)) return 'string';

    const newMatch = expr.match(/^new\s+([A-Za-z_$][A-Za-z0-9_$.]*)\b/);
    if (newMatch) {
        return normalizeTypeName(newMatch[1]);
    }

    const asMatch = expr.match(/\bas\s+([A-Za-z_$][A-Za-z0-9_$.]*)$/);
    if (asMatch) {
        return normalizeTypeName(asMatch[1]);
    }

    const selfFieldMatch = expr.match(/^this\.([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (selfFieldMatch) {
        return String(fieldTypeMap.get(String(selfFieldMatch[1] || '')) || '');
    }

    const identifierMatch = expr.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (identifierMatch) {
        const key = String(identifierMatch[1] || '');
        return String(identifierHints.get(key) || '');
    }

    return '';
}

function inferThisFieldTypeMap(text, options) {
    const source = String(text || '');
    const opts = options && typeof options === 'object' ? options : {};
    const memberLabelsByType = opts.memberLabelsByType && typeof opts.memberLabelsByType === 'object'
        ? opts.memberLabelsByType
        : {};
    const hintMap = buildIdentifierTypeHints(source, opts.staticIdentifierTypeHints);
    const fieldTypes = new Map();

    const assignRe = /\bthis\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^;\n]+)\s*;?/g;
    let match = null;
    while ((match = assignRe.exec(source)) !== null) {
        const fieldName = String(match[1] || '');
        const expr = String(match[2] || '');
        if (!fieldName) continue;
        const inferred = normalizeTypeName(inferTypeFromExpression(expr, hintMap, fieldTypes));
        if (!inferred) continue;
        if (Object.prototype.hasOwnProperty.call(memberLabelsByType, inferred)) {
            fieldTypes.set(fieldName, inferred);
            continue;
        }
        if (!fieldTypes.has(fieldName)) {
            fieldTypes.set(fieldName, inferred);
        }
    }

    return fieldTypes;
}

function filterByPrefix(labels, prefix) {
    const query = String(prefix || '').toLowerCase();
    return labels.filter((label) => !query || String(label).toLowerCase().startsWith(query));
}

function createCompletionItems(labels, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const kind = String(opts.kind || 'property');
    const source = String(opts.source || 'anim-this-member');
    const detail = String(opts.detail || 'Animation member');
    const methodLabels = opts.methodLabels instanceof Set ? opts.methodLabels : new Set();
    const maxItems = Math.max(10, Number(opts.maxItems) || 80);

    return labels
        .slice(0, maxItems)
        .map((label, index) => ({
            label,
            insertText: label,
            insertTextMode: 'plain',
            source,
            kind: methodLabels.has(label) ? 'method' : kind,
            detail,
            documentation: '',
            sortText: `0_anim_this_${String(index).padStart(3, '0')}_${label}`
        }));
}

export function extractAnimTsAssignedThisFields(text) {
    const source = String(text || '');
    const fields = new Set();
    const assignRe = /\bthis\.([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:\+\+|--|(?:[+\-*/%&|^]|&&|\|\||\?\?)?=)/g;
    let match = null;

    while ((match = assignRe.exec(source)) !== null) {
        const label = String(match[1] || '');
        if (!label) continue;
        fields.add(label);
    }

    return Array.from(fields).sort((a, b) => a.localeCompare(b));
}

export function buildAnimTsThisCompletionItems(text, offset, options) {
    const source = String(text || '');
    const context = thisCompletionContextAtOffset(source, offset);
    if (!context) return [];

    const opts = options && typeof options === 'object' ? options : {};
    const maxItems = Math.max(10, Number(opts.maxItems) || 80);
    const methodLabels = opts.methodLabels instanceof Set
        ? opts.methodLabels
        : new Set(Array.isArray(opts.methodLabels) ? opts.methodLabels : []);
    const memberLabelsByType = opts.memberLabelsByType && typeof opts.memberLabelsByType === 'object'
        ? opts.memberLabelsByType
        : {};
    const memberReturnTypeByType = opts.memberReturnTypeByType && typeof opts.memberReturnTypeByType === 'object'
        ? opts.memberReturnTypeByType
        : {};

    if (context.ownerExpr === 'this') {
        const labels = filterByPrefix(extractAnimTsAssignedThisFields(source), context.prefix);
        return createCompletionItems(labels, {
            kind: 'field',
            source: 'anim-this-field',
            detail: 'Animation this-field',
            maxItems,
            methodLabels
        });
    }

    if (!context.ownerExpr.startsWith('this.')) {
        return [];
    }

    const fieldTypeMap = inferThisFieldTypeMap(source, {
        memberLabelsByType,
        staticIdentifierTypeHints: opts.staticIdentifierTypeHints
    });
    const ownerType = resolveOwnerTypeFromChain(context.ownerExpr, fieldTypeMap, memberReturnTypeByType);
    if (!ownerType) return [];

    const labels = filterByPrefix(
        Array.isArray(memberLabelsByType[ownerType]) ? memberLabelsByType[ownerType].map((label) => String(label || '')) : [],
        context.prefix
    ).filter(Boolean).sort((a, b) => a.localeCompare(b));

    return createCompletionItems(labels, {
        kind: 'property',
        source: 'anim-this-member',
        detail: `${ownerType} (anim)`,
        maxItems,
        methodLabels
    });
}

export function buildAnimTsThisFieldCompletionItems(text, offset, maxItems) {
    return buildAnimTsThisCompletionItems(text, offset, {
        maxItems: Number(maxItems) || 80,
        memberLabelsByType: {},
        memberReturnTypeByType: {},
        methodLabels: []
    }).filter((item) => item.kind === 'field');
}
