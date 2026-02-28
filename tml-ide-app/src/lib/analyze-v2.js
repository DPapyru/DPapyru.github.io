import { DIAGNOSTIC_SEVERITY } from '../contracts/messages.js';
import { getTypeByFullName, getTypeCandidatesByShortName, normalizeApiIndex } from './index-schema.js';
import {
    collectMemberAccesses,
    collectSyntaxErrors,
    findExpressionChainAtOffset,
    findMemberOwnerBeforeOffset,
    parseCSharp
} from './csharp-ast.js';

const KEYWORDS = [
    'using', 'namespace', 'class', 'struct', 'interface', 'enum', 'record',
    'public', 'private', 'protected', 'internal', 'static', 'virtual', 'override', 'abstract',
    'void', 'bool', 'byte', 'sbyte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong', 'float', 'double', 'decimal', 'string', 'object',
    'if', 'else', 'switch', 'case', 'for', 'foreach', 'while', 'do', 'break', 'continue', 'return', 'new',
    'try', 'catch', 'finally', 'throw', 'var', 'this', 'base', 'true', 'false', 'null', 'params', 'out', 'ref', 'in',
    'async', 'await', 'partial', 'sealed', 'readonly', 'const', 'get', 'set', 'init'
];

const BUILTIN_TYPES = new Set([
    'void', 'bool', 'byte', 'sbyte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong',
    'float', 'double', 'decimal', 'string', 'object', 'char'
]);
const MAX_COMPLETION_ITEMS = 5000;
const EXTENSION_FALLBACK_STATIC_TYPE = 'Terraria.Utils';
const extensionMethodCatalogCache = new WeakMap();

function isIdentifierStart(ch) {
    return /[A-Za-z_]/.test(ch || '');
}

function isIdentifierChar(ch) {
    return /[A-Za-z0-9_]/.test(ch || '');
}

function stripNullable(typeName) {
    return String(typeName || '').trim().replace(/\?+$/, '');
}

function normalizeDeclaredType(typeName) {
    return stripNullable(String(typeName || '').trim()).replace(/\s+/g, '');
}

function stripGenericsAndArrays(typeName) {
    let text = stripNullable(typeName);
    text = text.replace(/\[\]$/g, '');
    const genericCut = text.indexOf('<');
    if (genericCut >= 0) {
        text = text.slice(0, genericCut);
    }
    return text;
}

function splitGenericArguments(rawText) {
    const source = String(rawText || '').trim();
    if (!source) return [];

    const out = [];
    let current = '';
    let depthAngle = 0;
    let depthParen = 0;
    let depthBracket = 0;

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch === '<') depthAngle += 1;
        else if (ch === '>') depthAngle = Math.max(0, depthAngle - 1);
        else if (ch === '(') depthParen += 1;
        else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
        else if (ch === '[') depthBracket += 1;
        else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

        if (ch === ',' && depthAngle === 0 && depthParen === 0 && depthBracket === 0) {
            const item = current.trim();
            if (item) out.push(item);
            current = '';
            continue;
        }

        current += ch;
    }

    const tail = current.trim();
    if (tail) out.push(tail);
    return out;
}

function findMatchingBrace(source, openBraceOffset) {
    const start = Math.max(0, Number(openBraceOffset) || 0);
    if (source[start] !== '{') return source.length;

    let depth = 0;
    for (let i = start; i < source.length; i++) {
        const ch = source[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
        if (depth === 0) return i;
    }

    return source.length;
}

function splitBaseTypeList(rawList) {
    const source = String(rawList || '').trim();
    if (!source) return [];

    const items = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch === '<') {
            depth += 1;
            current += ch;
            continue;
        }
        if (ch === '>') {
            depth = Math.max(0, depth - 1);
            current += ch;
            continue;
        }
        if (ch === ',' && depth === 0) {
            const name = stripGenericsAndArrays(current);
            if (name) items.push(name);
            current = '';
            continue;
        }
        current += ch;
    }

    const last = stripGenericsAndArrays(current);
    if (last) items.push(last);
    return items;
}

function extractContext(text) {
    const source = String(text || '');
    const usings = new Set();
    const declaredTypes = new Set();
    const localTypes = new Map();
    const classScopes = [];

    let m;
    const usingRe = /^\s*using\s+([A-Za-z_][A-Za-z0-9_.]*)\s*;/gm;
    while ((m = usingRe.exec(source)) !== null) {
        usings.add(m[1]);
    }

    const classDeclRe = /\b(?:class|struct|interface|record)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*([^{\n]+))?\s*\{/g;
    while ((m = classDeclRe.exec(source)) !== null) {
        const className = m[1];
        declaredTypes.add(className);

        const openBraceOffset = classDeclRe.lastIndex - 1;
        const closeBraceOffset = findMatchingBrace(source, openBraceOffset);
        classScopes.push({
            name: className,
            start: m.index,
            end: closeBraceOffset,
            baseTypes: splitBaseTypeList(m[2] || '')
        });
    }

    const typeDeclRe = /\b(?:class|struct|interface|enum|record)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
    while ((m = typeDeclRe.exec(source)) !== null) {
        declaredTypes.add(m[1]);
    }

    const explicitDeclRe = /\b([A-Za-z_][A-Za-z0-9_<>\[\],.?]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\s*(?==|;|,|\))/g;
    while ((m = explicitDeclRe.exec(source)) !== null) {
        const rawType = normalizeDeclaredType(m[1]);
        if (!rawType || KEYWORDS.includes(stripGenericsAndArrays(rawType))) continue;
        localTypes.set(m[2], rawType);
    }

    const varNewRe = /\bvar\s+([a-zA-Z_][A-Za-z0-9_]*)\s*=\s*new\s+([A-Za-z_][A-Za-z0-9_<>\[\],.?]*)/g;
    while ((m = varNewRe.exec(source)) !== null) {
        localTypes.set(m[1], normalizeDeclaredType(m[2]));
    }

    const foreachRe = /\bforeach\s*\(\s*([A-Za-z_][A-Za-z0-9_<>\[\],.?]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\s+in\s+/g;
    while ((m = foreachRe.exec(source)) !== null) {
        localTypes.set(m[2], normalizeDeclaredType(m[1]));
    }

    const patternIsRe = /\bis\s+([A-Za-z_][A-Za-z0-9_<>\[\],.?]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\b/g;
    while ((m = patternIsRe.exec(source)) !== null) {
        localTypes.set(m[2], normalizeDeclaredType(m[1]));
    }

    return {
        usings,
        declaredTypes,
        localTypes,
        classScopes
    };
}

function resolveTypeByName(index, typeName, context) {
    const safe = stripGenericsAndArrays(typeName);
    if (!safe) return null;

    if (safe.includes('.')) {
        const direct = getTypeByFullName(index, safe);
        if (direct) return direct;

        const segments = safe.split('.').filter(Boolean);
        if (segments.length > 1) {
            const headType = resolveTypeByName(index, segments[0], context);
            if (headType) {
                const nested = getTypeByFullName(index, `${headType.fullName}.${segments.slice(1).join('.')}`);
                if (nested) return nested;
            }
        }
    }

    const candidates = getTypeCandidatesByShortName(index, safe);
    if (!candidates.length) return null;

    const usingSet = context && context.usings instanceof Set ? context.usings : new Set();
    const ranked = candidates
        .map((candidate) => {
            let score = 10;
            if (candidate.namespace && usingSet.has(candidate.namespace)) score = 0;
            if (candidate.namespace === 'Terraria') score = Math.min(score, 1);
            if (candidate.namespace === 'Terraria.ModLoader') score = Math.min(score, 2);
            const namespaceParts = String(candidate.namespace || '').split('.').filter(Boolean);
            const fullNameParts = String(candidate.fullName || '').split('.').filter(Boolean);
            const nestedDepth = Math.max(0, fullNameParts.length - namespaceParts.length - 1);
            return { candidate, score, nestedDepth };
        })
        .sort((a, b) => {
            const byScore = a.score - b.score;
            if (byScore !== 0) return byScore;
            const byNested = a.nestedDepth - b.nestedDepth;
            if (byNested !== 0) return byNested;
            const byLength = a.candidate.fullName.length - b.candidate.fullName.length;
            if (byLength !== 0) return byLength;
            return a.candidate.fullName.localeCompare(b.candidate.fullName);
        });

    return ranked[0].candidate;
}

function resolveNestedTypeByOwner(index, ownerType, nestedMemberName) {
    if (!ownerType) return null;
    const ownerFull = String(ownerType.fullName || '').trim();
    const nestedName = stripGenericsAndArrays(String(nestedMemberName || '').trim());
    if (!ownerFull || !nestedName) return null;
    return getTypeByFullName(index, `${ownerFull}.${nestedName}`);
}

function getClassScopeAtOffset(context, offset) {
    const scopes = context && Array.isArray(context.classScopes) ? context.classScopes : [];
    if (!scopes.length) return null;

    const safeOffset = Math.max(0, Number(offset) || 0);
    let match = null;
    for (let i = 0; i < scopes.length; i++) {
        const scope = scopes[i];
        if (safeOffset < scope.start || safeOffset > scope.end) continue;
        if (!match || scope.start >= match.start) {
            match = scope;
        }
    }
    return match;
}

function resolveIdentifierType(index, identifier, context, offset) {
    const safe = String(identifier || '').trim();
    if (!safe) return null;

    if (safe === 'this' || safe === 'base') {
        const scope = getClassScopeAtOffset(context, offset);
        if (!scope) return null;
        const baseType = Array.isArray(scope.baseTypes) && scope.baseTypes.length ? scope.baseTypes[0] : '';
        if (safe === 'base') {
            return baseType ? resolveTypeByName(index, baseType, context) : null;
        }

        const current = resolveTypeByName(index, scope.name, context);
        if (current) return current;
        return baseType ? resolveTypeByName(index, baseType, context) : null;
    }

    if (context.localTypes.has(safe)) {
        return resolveTypeByName(index, context.localTypes.get(safe), context);
    }

    if (/^[A-Z]/.test(safe) || context.declaredTypes.has(safe)) {
        return resolveTypeByName(index, safe, context);
    }

    return null;
}

function isTypeAssignableTo(index, context, sourceType, targetTypeName) {
    if (!sourceType) return false;

    const safeTargetName = resolveDeclaredTypeName(targetTypeName);
    if (!safeTargetName) return false;

    const resolvedTarget = getTypeByFullName(index, safeTargetName) || resolveTypeByName(index, safeTargetName, context);
    if (resolvedTarget) {
        const targetFull = String(resolvedTarget.fullName || '');
        const queue = [sourceType];
        const seen = new Set();
        while (queue.length) {
            const current = queue.shift();
            if (!current) continue;

            const currentFull = String(current.fullName || '');
            if (currentFull === targetFull) return true;
            if (currentFull && seen.has(currentFull)) continue;
            if (currentFull) seen.add(currentFull);

            if (current.baseType) {
                const baseType = getTypeByFullName(index, current.baseType) || resolveTypeByName(index, current.baseType, context);
                if (baseType) queue.push(baseType);
            }

            if (Array.isArray(current.interfaces)) {
                current.interfaces.forEach((name) => {
                    const iface = getTypeByFullName(index, name) || resolveTypeByName(index, name, context);
                    if (iface) queue.push(iface);
                });
            }
        }
        return false;
    }

    const targetShortName = safeTargetName.split('.').filter(Boolean).pop();
    if (!targetShortName) return false;
    return String(sourceType.name || '') === targetShortName;
}

function extensionDefaultValueText(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
}

function buildMethodSignatureText(methodItem, params) {
    const safeParams = Array.isArray(params) ? params : [];
    const paramsText = safeParams.map((param, idx) => {
        const safeParam = param && typeof param === 'object' ? param : {};
        const type = String(safeParam.type || 'object').trim() || 'object';
        const name = String(safeParam.name || '').trim() || `arg${idx + 1}`;
        if (!safeParam.optional) {
            return `${type} ${name}`;
        }
        if (Object.prototype.hasOwnProperty.call(safeParam, 'defaultValue')) {
            return `${type} ${name} = ${extensionDefaultValueText(safeParam.defaultValue)}`;
        }
        return `${type} ${name}`;
    }).join(', ');
    return `${String(methodItem.returnType || 'void')} ${String(methodItem.name || '')}(${paramsText})`;
}

function getExtensionMethodCatalog(index) {
    if (extensionMethodCatalogCache.has(index)) {
        return extensionMethodCatalogCache.get(index);
    }

    const entries = [];
    const allTypes = Object.values(index.types || {});
    let hasFlaggedExtensions = false;

    allTypes.forEach((typeRecord) => {
        const methods = Array.isArray(typeRecord && typeRecord.members && typeRecord.members.methods)
            ? typeRecord.members.methods
            : [];
        methods.forEach((method) => {
            if (method && method.isExtension === true) {
                hasFlaggedExtensions = true;
            }
        });
    });

    if (hasFlaggedExtensions) {
        allTypes.forEach((typeRecord) => {
            const methods = Array.isArray(typeRecord && typeRecord.members && typeRecord.members.methods)
                ? typeRecord.members.methods
                : [];
            methods.forEach((method) => {
                if (!method || method.isExtension !== true || method.isStatic !== true) return;
                if (!Array.isArray(method.params) || method.params.length < 1) return;
                entries.push({
                    declaringType: typeRecord,
                    method
                });
            });
        });
    } else {
        const fallbackType = getTypeByFullName(index, EXTENSION_FALLBACK_STATIC_TYPE);
        const methods = Array.isArray(fallbackType && fallbackType.members && fallbackType.members.methods)
            ? fallbackType.members.methods
            : [];
        methods.forEach((method) => {
            if (!method || method.isStatic !== true) return;
            if (!Array.isArray(method.params) || method.params.length < 1) return;
            entries.push({
                declaringType: fallbackType,
                method
            });
        });
    }

    extensionMethodCatalogCache.set(index, entries);
    return entries;
}

function isExtensionNamespaceVisible(context, declaringType, ownerType) {
    const namespace = String(declaringType && declaringType.namespace || '').trim();
    if (!namespace) return true;
    const usings = context && context.usings instanceof Set ? context.usings : new Set();
    if (usings.has(namespace)) return true;
    const ownerNamespace = String(ownerType && ownerType.namespace || '').trim();
    if (ownerNamespace && ownerNamespace === namespace) return true;
    return false;
}

function toInstanceStyleExtensionMethod(entry) {
    const method = entry && entry.method && typeof entry.method === 'object' ? entry.method : {};
    const params = Array.isArray(method.params) ? method.params.slice(1) : [];
    const minArgs = Math.max(0, Number(method.minArgs || 0) - 1);
    const maxArgs = Math.max(minArgs, Number(method.maxArgs || 0) - 1);

    return {
        kind: 'method',
        name: String(method.name || ''),
        signature: buildMethodSignatureText(method, params),
        returnType: String(method.returnType || ''),
        isStatic: false,
        isExtension: true,
        params,
        minArgs,
        maxArgs,
        summary: String(method.summary || ''),
        returnsDoc: String(method.returnsDoc || ''),
        paramDocs: method.paramDocs && typeof method.paramDocs === 'object' ? method.paramDocs : {}
    };
}

function collectExtensionMethodsForType(index, context, ownerType) {
    if (!ownerType) return [];

    const catalog = getExtensionMethodCatalog(index);
    const result = [];
    for (let i = 0; i < catalog.length; i++) {
        const entry = catalog[i];
        const method = entry.method;
        if (!method || !Array.isArray(method.params) || method.params.length < 1) continue;
        if (!isExtensionNamespaceVisible(context, entry.declaringType, ownerType)) continue;
        if (!isTypeAssignableTo(index, context, ownerType, method.params[0] && method.params[0].type)) continue;
        result.push(toInstanceStyleExtensionMethod(entry));
    }
    return result;
}

function collectMembersForTypeHierarchy(index, context, typeRecord) {
    if (!typeRecord) return [];

    const queue = [typeRecord];
    const seenTypes = new Set();
    const seenMembers = new Set();
    const allMembers = [];
    const pushMember = (item) => {
        const key = `${item.kind}:${item.name}:${item.signature || ''}`;
        if (seenMembers.has(key)) return;
        seenMembers.add(key);
        allMembers.push(item);
    };

    while (queue.length) {
        const current = queue.shift();
        if (!current) continue;

        const fullName = String(current.fullName || '');
        if (fullName && seenTypes.has(fullName)) continue;
        if (fullName) seenTypes.add(fullName);

        current.members.methods.forEach(pushMember);
        current.members.properties.forEach(pushMember);
        current.members.fields.forEach(pushMember);

        const parents = [];
        if (current.baseType) parents.push(current.baseType);
        if (Array.isArray(current.interfaces)) {
            current.interfaces.forEach((name) => {
                if (name) parents.push(name);
            });
        }

        parents.forEach((name) => {
            const parent =
                getTypeByFullName(index, name) ||
                resolveTypeByName(index, name, context);
            if (parent) queue.push(parent);
        });
    }

    collectExtensionMethodsForType(index, context, typeRecord).forEach(pushMember);

    return allMembers;
}

function collectMembersByName(index, context, typeRecord, name) {
    const safe = String(name || '').trim();
    if (!safe || !typeRecord) return [];
    return collectMembersForTypeHierarchy(index, context, typeRecord).filter((item) => item.name === safe);
}

function getMemberCompletionCandidates(index, context, typeRecord, prefix) {
    const needle = String(prefix || '').toLowerCase();
    const members = collectMembersForTypeHierarchy(index, context, typeRecord);

    return members
        .filter((item) => item.name.toLowerCase().startsWith(needle))
        .sort((a, b) => {
            const byName = a.name.localeCompare(b.name);
            if (byName !== 0) return byName;
            return String(a.signature || '').localeCompare(String(b.signature || ''));
        });
}

function splitPathByDotWithNesting(text) {
    const source = String(text || '').trim();
    if (!source) return [];

    const items = [];
    let current = '';
    let depthParen = 0;
    let depthBracket = 0;
    let depthAngle = 0;
    let inString = false;
    let quote = '';

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        const prev = i > 0 ? source[i - 1] : '';
        const next = i + 1 < source.length ? source[i + 1] : '';

        if (inString) {
            current += ch;
            if (ch === quote && prev !== '\\') {
                inString = false;
                quote = '';
            }
            continue;
        }

        if (ch === '"' || ch === '\'') {
            inString = true;
            quote = ch;
            current += ch;
            continue;
        }

        if (ch === '(') depthParen += 1;
        else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
        else if (ch === '[') depthBracket += 1;
        else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);
        else if (ch === '<') depthAngle += 1;
        else if (ch === '>') depthAngle = Math.max(0, depthAngle - 1);

        const topLevel = depthParen === 0 && depthBracket === 0 && depthAngle === 0;
        if (topLevel && ch === '?' && next === '.') {
            if (current.trim()) items.push(current.trim());
            current = '';
            i += 1;
            continue;
        }
        if (topLevel && ch === '.') {
            if (current.trim()) items.push(current.trim());
            current = '';
            continue;
        }

        current += ch;
    }

    if (current.trim()) items.push(current.trim());
    return items;
}

function findMatchingOpenBackward(text, closeIndex, openCh, closeCh) {
    let depth = 0;
    for (let i = closeIndex; i >= 0; i--) {
        const ch = text[i];
        if (ch === closeCh) {
            depth += 1;
            continue;
        }
        if (ch === openCh) {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function findMatchingCloseForward(text, openIndex, openCh, closeCh) {
    let depth = 0;
    for (let i = openIndex; i < text.length; i++) {
        const ch = text[i];
        if (ch === openCh) {
            depth += 1;
            continue;
        }
        if (ch === closeCh) {
            depth -= 1;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function stripEnclosingParens(text) {
    let safe = String(text || '').trim();
    while (safe.startsWith('(') && safe.endsWith(')')) {
        const close = findMatchingCloseForward(safe, 0, '(', ')');
        if (close !== safe.length - 1) break;
        safe = safe.slice(1, -1).trim();
    }
    return safe;
}

function detectCastTypeName(text) {
    const safe = stripEnclosingParens(text);
    if (!safe.startsWith('(')) return '';
    const close = findMatchingCloseForward(safe, 0, '(', ')');
    if (close <= 0 || close >= safe.length - 1) return '';
    const typeCandidate = safe.slice(1, close).trim();
    const rest = safe.slice(close + 1).trim();
    if (!rest) return '';
    if (!/^[A-Za-z_][A-Za-z0-9_<>\[\],.?]*$/.test(typeCandidate)) return '';
    return typeCandidate;
}

function extractTypeNameAfterNew(text) {
    const safe = String(text || '').trim();
    if (!safe.startsWith('new ')) return '';
    const rest = safe.slice(4).trim();
    let out = '';
    let depth = 0;
    for (let i = 0; i < rest.length; i++) {
        const ch = rest[i];
        if (ch === '<') depth += 1;
        else if (ch === '>') depth = Math.max(0, depth - 1);

        if (depth === 0 && (ch === '(' || ch === '[' || ch === '{' || /\s/.test(ch))) {
            break;
        }
        out += ch;
    }
    return out.trim();
}

function parseAccessSegment(rawSegment) {
    let safe = String(rawSegment || '').trim();
    const info = {
        raw: safe,
        name: '',
        calls: [],
        indexers: 0,
        castType: '',
        newType: ''
    };
    if (!safe) return info;

    while (safe.endsWith('!')) {
        safe = safe.slice(0, -1).trim();
    }

    let changed = true;
    while (changed) {
        changed = false;
        if (safe.endsWith(']')) {
            const open = findMatchingOpenBackward(safe, safe.length - 1, '[', ']');
            if (open >= 0) {
                info.indexers += 1;
                safe = safe.slice(0, open).trim();
                changed = true;
                continue;
            }
        }
        if (safe.endsWith(')')) {
            const open = findMatchingOpenBackward(safe, safe.length - 1, '(', ')');
            if (open >= 0) {
                info.calls.unshift(safe.slice(open + 1, safe.length - 1));
                safe = safe.slice(0, open).trim();
                changed = true;
            }
        }
    }

    info.newType = extractTypeNameAfterNew(safe);
    info.castType = detectCastTypeName(safe);

    let baseName = stripEnclosingParens(safe);
    if (info.newType) {
        baseName = info.newType;
    } else if (info.castType) {
        baseName = info.castType;
    }

    if (baseName.startsWith('global::')) {
        baseName = baseName.slice('global::'.length);
    }
    if (baseName.includes('::')) {
        baseName = baseName.slice(baseName.lastIndexOf('::') + 2);
    }

    info.name = baseName.trim();
    return info;
}

function resolveDeclaredTypeName(rawType) {
    const safe = stripNullable(String(rawType || '').trim());
    if (!safe) return '';
    return safe;
}

function resolveIndexedTypeFromName(index, context, rawTypeName) {
    const safe = resolveDeclaredTypeName(rawTypeName);
    if (!safe) return null;

    if (safe.endsWith('[]')) {
        const element = safe.slice(0, -2);
        return getTypeByFullName(index, element) || resolveTypeByName(index, element, context);
    }

    const genericMatch = safe.match(/^([A-Za-z0-9_.]+)<(.+)>$/);
    if (genericMatch) {
        const typeName = genericMatch[1];
        const args = splitGenericArguments(genericMatch[2]);
        if (!args.length) return null;
        const elementName =
            /Dictionary$|IDictionary$/.test(typeName) && args.length >= 2
                ? args[1]
                : args[0];
        const normalized = resolveDeclaredTypeName(elementName);
        return getTypeByFullName(index, normalized) || resolveTypeByName(index, normalized, context);
    }

    return null;
}

function resolveMemberResultType(index, context, ownerType, memberName, callArgText) {
    if (!ownerType) return null;

    const candidates = collectMembersByName(index, context, ownerType, memberName);
    if (!candidates.length) {
        if (typeof callArgText === 'string') return null;
        return resolveNestedTypeByOwner(index, ownerType, memberName);
    }

    if (typeof callArgText === 'string') {
        const methods = candidates.filter((item) => item.kind === 'method');
        if (!methods.length) return null;
        const argCount = countArguments(callArgText);
        const chosen = methods.find((item) => argCount >= item.minArgs && argCount <= item.maxArgs) || methods[0];
        const typeName = resolveDeclaredTypeName(chosen.returnType);
        if (!typeName || BUILTIN_TYPES.has(typeName)) return null;
        return getTypeByFullName(index, typeName) || resolveTypeByName(index, typeName, context);
    }

    const preferKind = (item) => item.kind === 'property' ? 0 : item.kind === 'field' ? 1 : 2;
    const sorted = candidates.slice().sort((a, b) => {
        const byKind = preferKind(a) - preferKind(b);
        if (byKind !== 0) return byKind;
        return String(a.signature || '').localeCompare(String(b.signature || ''));
    });

    const chosen = sorted[0];
    const typeName =
        chosen.kind === 'method'
            ? resolveDeclaredTypeName(chosen.returnType)
            : resolveDeclaredTypeName(chosen.type || chosen.returnType);
    if (!typeName || BUILTIN_TYPES.has(typeName)) return null;
    return getTypeByFullName(index, typeName) || resolveTypeByName(index, typeName, context);
}

function applyIndexers(index, context, typeRecord, count) {
    let current = typeRecord;
    let left = Math.max(0, Number(count) || 0);
    while (left > 0) {
        if (!current) return null;
        current = resolveIndexedTypeFromName(index, context, current.fullName || current.name);
        left -= 1;
    }
    return current;
}

function resolveAccessPathType(index, accessPath, context, offset) {
    const safePath = String(accessPath || '').trim();
    if (!safePath) return null;

    const directType = getTypeByFullName(index, safePath) || resolveTypeByName(index, safePath, context);
    if (directType) return directType;

    const rawSegments = splitPathByDotWithNesting(safePath);
    if (!rawSegments.length) return null;
    const segments = rawSegments.map(parseAccessSegment);

    let typeRecord = null;
    let memberStart = 0;

    for (let i = segments.length; i > 0; i--) {
        const prefixSegments = segments.slice(0, i);
        const hasDynamic = prefixSegments.some((seg) => seg.calls.length || seg.indexers || seg.castType || seg.newType);
        if (hasDynamic) continue;
        const fullName = prefixSegments
            .map((seg) => String(seg.name || '').trim())
            .filter(Boolean)
            .join('.');
        if (!fullName) continue;
        const maybe = getTypeByFullName(index, fullName) || resolveTypeByName(index, fullName, context);
        if (maybe) {
            typeRecord = maybe;
            memberStart = i;
            break;
        }
    }

    if (!typeRecord) {
        const first = segments[0];
        const firstName = String(first.name || '').trim();
        if (!firstName) return null;
        let localTypeName = '';
        if (context && context.localTypes instanceof Map && context.localTypes.has(firstName)) {
            localTypeName = String(context.localTypes.get(firstName) || '').trim();
        }

        typeRecord = resolveIdentifierType(index, firstName, context, offset) || resolveTypeByName(index, firstName, context);
        if (first.newType) {
            typeRecord = resolveTypeByName(index, first.newType, context);
        } else if (first.castType) {
            typeRecord = resolveTypeByName(index, first.castType, context);
        }
        if (!typeRecord) return null;

        if (first.indexers) {
            if (localTypeName) {
                let indexed = resolveIndexedTypeFromName(index, context, localTypeName);
                let remaining = Math.max(0, first.indexers - 1);
                while (remaining > 0 && indexed) {
                    indexed = resolveIndexedTypeFromName(index, context, indexed.fullName || indexed.name);
                    remaining -= 1;
                }
                if (indexed) {
                    typeRecord = indexed;
                } else {
                    typeRecord = applyIndexers(index, context, typeRecord, first.indexers);
                }
            } else {
                typeRecord = applyIndexers(index, context, typeRecord, first.indexers);
            }
            if (!typeRecord) return null;
        }
        memberStart = 1;
    }

    for (let i = memberStart; i < segments.length; i++) {
        const seg = segments[i];
        const memberName = String(seg.name || '').trim();
        if (!memberName) return null;
        if (seg.calls.length) {
            for (let c = 0; c < seg.calls.length; c++) {
                typeRecord = resolveMemberResultType(index, context, typeRecord, memberName, seg.calls[c]);
                if (!typeRecord) return null;
            }
        } else {
            typeRecord = resolveMemberResultType(index, context, typeRecord, memberName, null);
            if (!typeRecord) return null;
        }

        if (seg.indexers) {
            typeRecord = applyIndexers(index, context, typeRecord, seg.indexers);
            if (!typeRecord) return null;
        }
    }

    return typeRecord;
}

function countArguments(argumentText) {
    const raw = String(argumentText || '').trim();
    if (!raw) return 0;

    let depthParen = 0;
    let depthSquare = 0;
    let depthCurly = 0;
    let inString = false;
    let quote = '';
    let count = 1;

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const prev = i > 0 ? raw[i - 1] : '';

        if (inString) {
            if (ch === quote && prev !== '\\') {
                inString = false;
                quote = '';
            }
            continue;
        }

        if (ch === '"' || ch === '\'') {
            inString = true;
            quote = ch;
            continue;
        }

        if (ch === '(') depthParen += 1;
        else if (ch === ')') depthParen -= 1;
        else if (ch === '[') depthSquare += 1;
        else if (ch === ']') depthSquare -= 1;
        else if (ch === '{') depthCurly += 1;
        else if (ch === '}') depthCurly -= 1;
        else if (ch === ',' && depthParen === 0 && depthSquare === 0 && depthCurly === 0) count += 1;
    }

    return Math.max(0, count);
}

function getTokenAtOffset(text, offset) {
    const source = String(text || '');
    const pos = Math.max(0, Math.min(source.length, Number(offset) || 0));

    let start = pos;
    while (start > 0 && isIdentifierChar(source[start - 1])) start -= 1;

    let end = pos;
    while (end < source.length && isIdentifierChar(source[end])) end += 1;

    if (start === end) return null;
    return {
        token: source.slice(start, end),
        start,
        end
    };
}

function createLineIndex(text) {
    const source = String(text || '');
    const starts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

function offsetToPosition(lineStarts, offset) {
    let low = 0;
    let high = lineStarts.length - 1;
    let idx = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (lineStarts[mid] <= offset) {
            idx = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return {
        line: idx + 1,
        column: offset - lineStarts[idx] + 1
    };
}

function normalizeHintIds(value, fallback) {
    const raw = Array.isArray(value) ? value : fallback;
    return (Array.isArray(raw) ? raw : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function buildRuleDiagnosticMetadata(code, overrides) {
    const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};
    const safeCode = String(code || '').trim();

    const defaultsByCode = {
        RULE_MISSING_SEMICOLON: { confidence: 0.72, hintIds: ['rule.add-semicolon'] },
        RULE_UNKNOWN_MEMBER: { confidence: 0.93, hintIds: ['rule.member-check'] },
        RULE_UNKNOWN_TYPE: { confidence: 0.8, hintIds: ['rule.type-using'] },
        RULE_ARG_COUNT: { confidence: 0.86, hintIds: ['rule.arg-count'] },
        RULE_UNCLOSED_SYMBOL: { confidence: 0.97, hintIds: ['rule.symbol-balance'] },
        RULE_UNEXPECTED_CLOSING: { confidence: 0.97, hintIds: ['rule.symbol-balance'] }
    };
    const defaults = defaultsByCode[safeCode] || { confidence: 0.65, hintIds: ['rule.generic'] };

    const numericConfidence = Number(safeOverrides.confidence);
    const confidence = Number.isFinite(numericConfidence)
        ? Math.max(0, Math.min(1, numericConfidence))
        : defaults.confidence;

    return {
        source: 'rule',
        confidence,
        hintIds: normalizeHintIds(safeOverrides.hintIds, defaults.hintIds)
    };
}

function pushDiagnostic(diags, lineStarts, startOffset, endOffset, code, severity, message, metadata) {
    const safeStart = Math.max(0, Number(startOffset) || 0);
    const safeEnd = Math.max(safeStart + 1, Number(endOffset) || safeStart + 1);
    const startPos = offsetToPosition(lineStarts, safeStart);
    const endPos = offsetToPosition(lineStarts, safeEnd);
    const diagnosticMetadata = metadata && typeof metadata === 'object'
        ? metadata
        : buildRuleDiagnosticMetadata(code);

    diags.push({
        code,
        severity,
        message,
        startLineNumber: startPos.line,
        startColumn: startPos.column,
        endLineNumber: endPos.line,
        endColumn: endPos.column,
        source: String(diagnosticMetadata.source || 'rule'),
        confidence: Number.isFinite(Number(diagnosticMetadata.confidence))
            ? Number(diagnosticMetadata.confidence)
            : 0.65,
        hintIds: normalizeHintIds(diagnosticMetadata.hintIds, ['rule.generic'])
    });
}

function completionMatchKind(label, prefix) {
    const safeLabel = String(label || '').toLowerCase();
    const safePrefix = String(prefix || '').toLowerCase();
    if (!safePrefix) return 'none';
    if (safeLabel === safePrefix) return 'exact';
    if (safeLabel.startsWith(safePrefix)) return 'prefix';
    if (safeLabel.includes(safePrefix)) return 'contains';
    return 'fuzzy';
}

function completionMatchWeight(matchKind) {
    if (matchKind === 'exact') return 130;
    if (matchKind === 'prefix') return 110;
    if (matchKind === 'contains') return 90;
    if (matchKind === 'none') return 75;
    return 60;
}

function completionSourceWeight(source) {
    if (source === 'override') return 220;
    if (source === 'member') return 200;
    if (source === 'type') return 130;
    if (source === 'keyword') return 90;
    return 60;
}

function completionKindWeight(kind) {
    if (kind === 'method') return 18;
    if (kind === 'property') return 14;
    if (kind === 'field') return 12;
    if (kind === 'class') return 8;
    if (kind === 'keyword') return 4;
    return 0;
}

function completionScore(source, kind, label, prefix, tieBreaker) {
    return completionSourceWeight(source)
        + completionMatchWeight(completionMatchKind(label, prefix))
        + completionKindWeight(kind)
        - Math.min(25, Math.max(0, Number(tieBreaker) || 0));
}

function completionConfidence(source, matchKind, isExtension) {
    let base = source === 'member' ? 0.91 : source === 'override' ? 0.93 : source === 'type' ? 0.74 : 0.62;
    if (matchKind === 'exact') base += 0.05;
    else if (matchKind === 'prefix') base += 0.03;
    else if (matchKind === 'fuzzy') base -= 0.12;
    if (isExtension) base -= 0.04;
    return Math.max(0, Math.min(1, base));
}

function normalizeTypeIdentity(typeName) {
    const safe = stripGenericsAndArrays(String(typeName || '').trim())
        .replace(/^global::/, '')
        .replace(/\s+/g, '');
    return safe;
}

function returnTypeMatches(index, context, declaredReturnType, candidateReturnType) {
    const declared = normalizeTypeIdentity(declaredReturnType);
    const candidate = normalizeTypeIdentity(candidateReturnType);
    if (!declared || !candidate) return false;
    if (declared === candidate) return true;
    if (declared.split('.').pop() === candidate.split('.').pop()) return true;

    const declaredResolved = resolveTypeByName(index, declared, context) || getTypeByFullName(index, declared);
    const candidateResolved = resolveTypeByName(index, candidate, context) || getTypeByFullName(index, candidate);
    if (declaredResolved && candidateResolved) {
        return String(declaredResolved.fullName || '') === String(candidateResolved.fullName || '');
    }

    return false;
}

function parseOverrideContext(text, offset) {
    const source = String(text || '');
    const safeOffset = Math.max(0, Math.min(source.length, Number(offset) || 0));
    const lineStart = Math.max(0, source.lastIndexOf('\n', Math.max(0, safeOffset - 1)) + 1);
    const linePrefix = source.slice(lineStart, safeOffset);
    if (!/\boverride\b/.test(linePrefix)) return null;

    const overrideMatch = linePrefix.match(/\boverride\b([\s\S]*)$/);
    if (!overrideMatch) return null;
    const tail = String(overrideMatch[1] || '');
    if (!tail.trim()) return null;
    if (/[(){};=]/.test(tail)) return null;

    const pieces = tail.trim().split(/\s+/).filter(Boolean);
    if (!pieces.length || pieces.length > 2) return null;
    const returnType = pieces[0];
    const memberPrefix = pieces.length > 1 ? pieces[1] : '';

    if (!/^[A-Za-z_][A-Za-z0-9_<>\[\],.?]*$/.test(returnType)) return null;
    if (memberPrefix && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(memberPrefix)) return null;

    return {
        returnType,
        memberPrefix
    };
}

function buildNestedTypeChain(index, typeRecord) {
    if (!typeRecord || typeof typeRecord !== 'object') return [];

    const fullName = String(typeRecord.fullName || '').trim();
    const namespace = String(typeRecord.namespace || '').trim();
    if (!fullName) return [];

    const fullParts = fullName.split('.').filter(Boolean);
    if (fullParts.length <= 1) return [];

    const namespaceParts = namespace ? namespace.split('.').filter(Boolean) : [];
    const namespacePrefixMatches = !namespaceParts.length
        || fullParts.slice(0, namespaceParts.length).join('.') === namespaceParts.join('.');

    if (namespacePrefixMatches) {
        const relative = fullParts.slice(namespaceParts.length);
        if (relative.length >= 2) {
            return relative;
        }
    }

    if (namespace) {
        const parentType = getTypeByFullName(index, namespace);
        if (parentType && fullName === `${namespace}.${typeRecord.name}`) {
            const parentChain = buildNestedTypeChain(index, parentType);
            if (parentChain.length) {
                return parentChain.concat(String(typeRecord.name || '').trim());
            }
            const parentName = String(parentType.name || '').trim();
            if (parentName) {
                return [parentName, String(typeRecord.name || '').trim()].filter(Boolean);
            }
        }
    }

    return [];
}

function formatTypeForOverrideSnippet(index, context, rawType) {
    const safe = String(rawType || '').trim();
    if (!safe) return safe;

    const hasNullable = safe.endsWith('?');
    const baseType = stripNullable(safe);
    if (!baseType || /[<>\[\],]/.test(baseType)) {
        return safe;
    }

    const resolved = resolveTypeByName(index, baseType, context) || getTypeByFullName(index, baseType);
    if (!resolved) {
        return safe;
    }

    const nestedChain = buildNestedTypeChain(index, resolved);
    if (nestedChain.length >= 2) {
        const fullParts = String(resolved.fullName || '').split('.').filter(Boolean);
        const topFullName = fullParts.slice(0, fullParts.length - nestedChain.length + 1).join('.');
        const topName = nestedChain[0];
        const topResolved = topName ? resolveTypeByName(index, topName, context) : null;
        if (topResolved && String(topResolved.fullName || '') === topFullName) {
            return `${nestedChain.join('.')}${hasNullable ? '?' : ''}`;
        }
    }

    return `${resolved.name}${hasNullable ? '?' : ''}`;
}

function buildOverrideSignatureArgs(index, context, methodItem) {
    const params = Array.isArray(methodItem && methodItem.params) ? methodItem.params : [];
    return params
        .map((item, idx) => {
            const name = String(item && item.name || '').trim();
            const type = formatTypeForOverrideSnippet(index, context, String(item && item.type || '').trim());
            const safeName = name || `arg${idx + 1}`;
            return type ? `${type} ${safeName}` : safeName;
        })
        .join(', ');
}

function buildOverrideSnippet(index, context, methodItem) {
    const signatureArgs = buildOverrideSignatureArgs(index, context, methodItem);
    return `${methodItem.name}(${signatureArgs})\n{\n    $0\n}`;
}

function buildOverrideDetail(index, context, methodItem) {
    const returnType = formatTypeForOverrideSnippet(index, context, String(methodItem && methodItem.returnType || 'void'));
    const signatureArgs = buildOverrideSignatureArgs(index, context, methodItem);
    return `${returnType} ${methodItem.name}(${signatureArgs})`;
}

function buildOverrideCompletionItems(index, context, text, offset, maxItems) {
    const overrideContext = parseOverrideContext(text, offset);
    if (!overrideContext) return [];

    const scope = getClassScopeAtOffset(context, offset);
    if (!scope || !Array.isArray(scope.baseTypes) || !scope.baseTypes.length) return [];

    const baseTypeName = String(scope.baseTypes[0] || '').trim();
    if (!baseTypeName) return [];

    const baseType = resolveTypeByName(index, baseTypeName, context) || getTypeByFullName(index, baseTypeName);
    if (!baseType) return [];

    const prefix = String(overrideContext.memberPrefix || '').toLowerCase();
    const methods = collectMembersForTypeHierarchy(index, context, baseType)
        .filter((item) => item && item.kind === 'method' && !item.isStatic && !item.isExtension)
        .filter((item) => returnTypeMatches(index, context, overrideContext.returnType, item.returnType))
        .filter((item) => {
            if (!prefix) return true;
            return String(item.name || '').toLowerCase().startsWith(prefix);
        })
        .sort((a, b) => {
            const byName = String(a.name || '').localeCompare(String(b.name || ''));
            if (byName !== 0) return byName;
            return String(a.signature || '').localeCompare(String(b.signature || ''));
        });

    return methods
        .slice(0, maxItems)
        .map((item, idx) => {
            const matchKind = completionMatchKind(item.name, prefix);
            const score = completionScore('override', 'method', item.name, prefix, idx);
            return {
                label: item.name,
                insertText: buildOverrideSnippet(index, context, item),
                insertTextMode: 'snippet',
                source: 'override',
                kind: 'method',
                detail: buildOverrideDetail(index, context, item),
                documentation: item.summary || '',
                sortText: `0_${String(9999 - score).padStart(4, '0')}_${item.name}`,
                score,
                matchKind,
                ownerType: String(baseType.fullName || ''),
                confidence: completionConfidence('override', matchKind, false)
            };
        });
}

function buildCompletionItems(index, context, text, offset, maxItems, parsedTree) {
    const memberAccess = findExpressionChainAtOffset(parsedTree, text, offset);
    if (memberAccess) {
        const ownerType = resolveAccessPathType(index, memberAccess.objectExpression, context, offset);
        if (!ownerType) return [];

        const prefix = memberAccess.memberPrefix || '';
        return getMemberCompletionCandidates(index, context, ownerType, prefix)
            .slice(0, maxItems)
            .map((item, idx) => {
                const matchKind = completionMatchKind(item.name, prefix);
                const score = completionScore('member', item.kind, item.name, prefix, idx);
                return {
                    label: item.name,
                    insertText: item.name,
                    insertTextMode: 'plain',
                    source: 'member',
                    kind: item.kind,
                    detail: item.signature || item.type || item.returnType || '',
                    documentation: item.summary || '',
                    sortText: `1_${String(9999 - score).padStart(4, '0')}_${item.name}`,
                    score,
                    matchKind,
                    ownerType: String(ownerType.fullName || ''),
                    confidence: completionConfidence('member', matchKind, !!item.isExtension)
                };
            });
    }

    const overrideItems = buildOverrideCompletionItems(index, context, text, offset, maxItems);
    if (overrideItems.length) return overrideItems;

    const prefixMatch = text.slice(0, offset).match(/[A-Za-z_][A-Za-z0-9_]*$/);
    const prefix = prefixMatch ? prefixMatch[0].toLowerCase() : '';

    const typeItems = Object.keys(index.lookup.byShortName || {})
        .filter((typeName) => {
            if (!prefix) return true;
            return typeName.toLowerCase().startsWith(prefix);
        })
        .sort((a, b) => a.localeCompare(b))
        .slice(0, maxItems)
        .map((typeName, idx) => {
            const matchKind = completionMatchKind(typeName, prefix);
            const score = completionScore('type', 'class', typeName, prefix, idx);
            return {
                label: typeName,
                insertText: typeName,
                insertTextMode: 'plain',
                source: 'type',
                kind: 'class',
                detail: (index.lookup.byShortName[typeName] || [])[0] || '',
                documentation: '',
                sortText: `2_${String(9999 - score).padStart(4, '0')}_${typeName}`,
                score,
                matchKind,
                ownerType: '',
                confidence: completionConfidence('type', matchKind, false)
            };
        });

    const keywordItems = KEYWORDS
        .filter((word) => {
            if (!prefix) return true;
            return word.startsWith(prefix);
        })
        .map((word, idx) => {
            const matchKind = completionMatchKind(word, prefix);
            const score = completionScore('keyword', 'keyword', word, prefix, idx);
            return {
                label: word,
                insertText: word,
                insertTextMode: 'plain',
                source: 'keyword',
                kind: 'keyword',
                detail: 'C# keyword',
                documentation: '',
                sortText: `3_${String(9999 - score).padStart(4, '0')}_${word}`,
                score,
                matchKind,
                ownerType: '',
                confidence: completionConfidence('keyword', matchKind, false)
            };
        });

    return typeItems.concat(keywordItems).slice(0, maxItems);
}

function buildHover(index, context, text, offset, parsedTree) {
    const tokenInfo = getTokenAtOffset(text, offset);
    if (!tokenInfo) return null;

    const memberOwner = findMemberOwnerBeforeOffset(parsedTree, text, tokenInfo.start);
    if (memberOwner) {
        const ownerType = resolveAccessPathType(index, memberOwner.objectExpression, context, tokenInfo.start);
        if (!ownerType) return null;

        const members = collectMembersByName(index, context, ownerType, tokenInfo.token);
        if (!members.length) return null;

        const lines = [];
        lines.push(`**${ownerType.fullName}.${tokenInfo.token}**`);
        if (members[0].signature) lines.push('', '`' + members[0].signature + '`');
        if (members[0].summary) lines.push('', members[0].summary);
        if (members.length > 1) lines.push('', `重载数: ${members.length}`);

        return {
            startOffset: tokenInfo.start,
            endOffset: tokenInfo.end,
            markdown: lines.join('\n')
        };
    }

    const typeRecord = resolveTypeByName(index, tokenInfo.token, context);
    if (!typeRecord) return null;

    const lines = [`**${typeRecord.fullName}**`];
    if (typeRecord.summary) lines.push('', typeRecord.summary);
    lines.push('', `Methods: ${typeRecord.members.methods.length} · Properties: ${typeRecord.members.properties.length} · Fields: ${typeRecord.members.fields.length}`);

    return {
        startOffset: tokenInfo.start,
        endOffset: tokenInfo.end,
        markdown: lines.join('\n')
    };
}

function isLikelyMethodSignatureLine(trimmedLine) {
    const line = String(trimmedLine || '').trim();
    if (!line) return false;
    if (!line.includes('(') || !line.includes(')')) return false;
    if (/;|\{|}|=>/.test(line)) return false;
    if (/^(if|for|foreach|while|switch|catch|else|try|do|return|throw|await|new|using|namespace)\b/.test(line)) {
        return false;
    }

    const open = line.indexOf('(');
    if (open <= 0) return false;

    const head = line.slice(0, open).trim();
    if (!head || /=/.test(head)) return false;

    const tokens = head.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return false;

    const methodName = tokens[tokens.length - 1];
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(methodName);
}

function buildRuleDiagnostics(index, context, text, parsedTree) {
    const diagnostics = [];
    const lineStarts = createLineIndex(text);

    const stack = [];
    const openToClose = { '(': ')', '{': '}', '[': ']' };
    const closeToOpen = { ')': '(', '}': '{', ']': '[' };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (openToClose[ch]) {
            stack.push({ ch, offset: i });
            continue;
        }
        if (closeToOpen[ch]) {
            const top = stack.pop();
            if (!top || top.ch !== closeToOpen[ch]) {
                pushDiagnostic(
                    diagnostics,
                    lineStarts,
                    i,
                    i + 1,
                    'RULE_UNEXPECTED_CLOSING',
                    DIAGNOSTIC_SEVERITY.ERROR,
                    `意外的闭合符号 '${ch}'`,
                    buildRuleDiagnosticMetadata('RULE_UNEXPECTED_CLOSING')
                );
            }
        }
    }

    stack.forEach((left) => {
        pushDiagnostic(
            diagnostics,
            lineStarts,
            left.offset,
            left.offset + 1,
            'RULE_UNCLOSED_SYMBOL',
            DIAGNOSTIC_SEVERITY.ERROR,
            `符号 '${left.ch}' 未闭合`,
            buildRuleDiagnosticMetadata('RULE_UNCLOSED_SYMBOL')
        );
    });

    const lines = text.split(/\r?\n/);
    let cursor = 0;
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) {
            cursor += line.length + 1;
            return;
        }

        const likelyStatement = /[=.]|\b(return|throw|await|new)\b/.test(trimmed);
        const ignore =
            trimmed.endsWith(';') ||
            trimmed.endsWith('{') ||
            trimmed.endsWith('}') ||
            trimmed.endsWith(':') ||
            trimmed.startsWith('using ') ||
            trimmed.startsWith('namespace ') ||
            trimmed.startsWith('#') ||
            /^\[/.test(trimmed) ||
            /^(if|for|foreach|while|switch|catch|else|try|do)\b/.test(trimmed) ||
            isLikelyMethodSignatureLine(trimmed);

        if (likelyStatement && !ignore) {
            const lineOffset = cursor + line.length;
            pushDiagnostic(
                diagnostics,
                lineStarts,
                Math.max(cursor, lineOffset - 1),
                Math.max(cursor + 1, lineOffset),
                'RULE_MISSING_SEMICOLON',
                DIAGNOSTIC_SEVERITY.WARNING,
                '疑似缺少分号',
                buildRuleDiagnosticMetadata('RULE_MISSING_SEMICOLON')
            );
        }

        cursor += line.length + 1;
    });

    const typeDeclRe = /\b([A-Z][A-Za-z0-9_]*(?:\[\])?)\s+[a-zA-Z_][A-Za-z0-9_]*\b/g;
    let m;
    while ((m = typeDeclRe.exec(text)) !== null) {
        const rawType = stripGenericsAndArrays(m[1]);
        if (!rawType || BUILTIN_TYPES.has(rawType)) continue;
        if (context.declaredTypes.has(rawType)) continue;

        const resolvedType = resolveTypeByName(index, rawType, context);
        if (!resolvedType) {
            pushDiagnostic(
                diagnostics,
                lineStarts,
                m.index,
                m.index + rawType.length,
                'RULE_UNKNOWN_TYPE',
                DIAGNOSTIC_SEVERITY.WARNING,
                `未识别的类型：${rawType}`,
                buildRuleDiagnosticMetadata('RULE_UNKNOWN_TYPE')
            );
        }
    }

    const accesses = collectMemberAccesses(parsedTree, text);
    accesses.forEach((access) => {
        const ownerType = resolveAccessPathType(index, access.ownerExpression, context, access.startOffset);
        if (!ownerType) return;

        const candidates = collectMembersByName(index, context, ownerType, access.memberName);
        if (!candidates.length) {
            const nestedType = resolveNestedTypeByOwner(index, ownerType, access.memberName);
            if (nestedType) return;
            pushDiagnostic(
                diagnostics,
                lineStarts,
                access.memberStartOffset,
                access.memberStartOffset + access.memberName.length,
                'RULE_UNKNOWN_MEMBER',
                DIAGNOSTIC_SEVERITY.ERROR,
                `${ownerType.name} 中不存在成员：${access.memberName}`,
                buildRuleDiagnosticMetadata('RULE_UNKNOWN_MEMBER')
            );
            return;
        }

        if (typeof access.argsText === 'string' && access.argsText.length >= 0) {
            const methods = candidates.filter((item) => item.kind === 'method');
            if (!methods.length) return;
            const argCount = countArguments(access.argsText);
            const valid = methods.some((item) => argCount >= item.minArgs && argCount <= item.maxArgs);
            if (!valid) {
                pushDiagnostic(
                    diagnostics,
                    lineStarts,
                    access.startOffset,
                    access.endOffset,
                    'RULE_ARG_COUNT',
                    DIAGNOSTIC_SEVERITY.WARNING,
                    `${access.memberName}(...) 参数个数疑似不匹配，当前 ${argCount}`,
                    buildRuleDiagnosticMetadata('RULE_ARG_COUNT')
                );
            }
        }
    });

    return diagnostics;
}

function normalizeFeatureFlags(features) {
    if (!features || typeof features !== 'object') {
        return {
            completion: true,
            hover: true,
            diagnostics: true
        };
    }
    return {
        completion: features.completion !== false,
        hover: features.hover !== false,
        diagnostics: features.diagnostics !== false
    };
}

export function analyzeDocumentV2(state, request) {
    const startedAt = Date.now();
    const index = normalizeApiIndex(state && state.index ? state.index : null);
    const text = String(request && request.text || '');
    const offset = Math.max(0, Math.min(text.length, Number(request && request.offset || 0)));
    const maxItems = Math.max(10, Math.min(MAX_COMPLETION_ITEMS, Number(request && request.maxItems || 80)));
    const features = normalizeFeatureFlags(request && request.features);

    const parsed = parseCSharp(text);
    const context = extractContext(text);

    const completionItems = features.completion
        ? buildCompletionItems(index, context, text, offset, maxItems, parsed.tree)
        : [];
    const hover = features.hover
        ? buildHover(index, context, text, offset, parsed.tree)
        : null;
    const diagnosticsRule = features.diagnostics
        ? buildRuleDiagnostics(index, context, text, parsed.tree)
        : [];
    const syntaxErrors = collectSyntaxErrors(parsed.tree, text).length;

    return {
        completionItems,
        hover,
        diagnosticsRule,
        meta: {
            parsed: true,
            syntaxErrors,
            elapsedMs: Date.now() - startedAt
        }
    };
}

export function analyzeV2WithIndex(index, request) {
    return analyzeDocumentV2({ index }, request);
}
