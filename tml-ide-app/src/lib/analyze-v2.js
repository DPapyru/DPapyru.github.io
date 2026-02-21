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

function collectMembersForTypeHierarchy(index, context, typeRecord) {
    if (!typeRecord) return [];

    const queue = [typeRecord];
    const seenTypes = new Set();
    const seenMembers = new Set();
    const allMembers = [];

    while (queue.length) {
        const current = queue.shift();
        if (!current) continue;

        const fullName = String(current.fullName || '');
        if (fullName && seenTypes.has(fullName)) continue;
        if (fullName) seenTypes.add(fullName);

        const pushMember = (item) => {
            const key = `${item.kind}:${item.name}:${item.signature || ''}`;
            if (seenMembers.has(key)) return;
            seenMembers.add(key);
            allMembers.push(item);
        };

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
    if (!candidates.length) return null;

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

function pushDiagnostic(diags, lineStarts, startOffset, endOffset, code, severity, message) {
    const safeStart = Math.max(0, Number(startOffset) || 0);
    const safeEnd = Math.max(safeStart + 1, Number(endOffset) || safeStart + 1);
    const startPos = offsetToPosition(lineStarts, safeStart);
    const endPos = offsetToPosition(lineStarts, safeEnd);

    diags.push({
        code,
        severity,
        message,
        startLineNumber: startPos.line,
        startColumn: startPos.column,
        endLineNumber: endPos.line,
        endColumn: endPos.column
    });
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

function buildOverrideSnippet(methodItem) {
    const params = Array.isArray(methodItem && methodItem.params) ? methodItem.params : [];
    const signatureArgs = params
        .map((item, idx) => {
            const name = String(item && item.name || '').trim();
            const type = String(item && item.type || '').trim();
            const safeName = name || `arg${idx + 1}`;
            return type ? `${type} ${safeName}` : safeName;
        })
        .join(', ');

    return `${methodItem.name}(${signatureArgs})\n{\n    $0\n}`;
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
        .filter((item) => item && item.kind === 'method' && !item.isStatic)
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
        .map((item) => ({
            label: item.name,
            insertText: buildOverrideSnippet(item),
            insertTextMode: 'snippet',
            source: 'override',
            kind: 'method',
            detail: item.signature || '',
            documentation: item.summary || '',
            sortText: `0_${item.name}`
        }));
}

function buildCompletionItems(index, context, text, offset, maxItems, parsedTree) {
    const memberAccess = findExpressionChainAtOffset(parsedTree, text, offset);
    if (memberAccess) {
        const ownerType = resolveAccessPathType(index, memberAccess.objectExpression, context, offset);
        if (!ownerType) return [];

        return getMemberCompletionCandidates(index, context, ownerType, memberAccess.memberPrefix)
            .slice(0, maxItems)
            .map((item) => ({
                label: item.name,
                insertText: item.name,
                insertTextMode: 'plain',
                source: 'member',
                kind: item.kind,
                detail: item.signature || item.type || item.returnType || '',
                documentation: item.summary || '',
                sortText: `1_${item.name}`
            }));
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
        .map((typeName) => ({
            label: typeName,
            insertText: typeName,
            insertTextMode: 'plain',
            source: 'type',
            kind: 'class',
            detail: (index.lookup.byShortName[typeName] || [])[0] || '',
            documentation: '',
            sortText: `2_${typeName}`
        }));

    const keywordItems = KEYWORDS
        .filter((word) => {
            if (!prefix) return true;
            return word.startsWith(prefix);
        })
        .map((word) => ({
            label: word,
            insertText: word,
            insertTextMode: 'plain',
            source: 'keyword',
            kind: 'keyword',
            detail: 'C# keyword',
            documentation: '',
            sortText: `3_${word}`
        }));

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
                    `意外的闭合符号 '${ch}'`
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
            `符号 '${left.ch}' 未闭合`
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
            /^(if|for|foreach|while|switch|catch|else|try|do)\b/.test(trimmed);

        if (likelyStatement && !ignore) {
            const lineOffset = cursor + line.length;
            pushDiagnostic(
                diagnostics,
                lineStarts,
                Math.max(cursor, lineOffset - 1),
                Math.max(cursor + 1, lineOffset),
                'RULE_MISSING_SEMICOLON',
                DIAGNOSTIC_SEVERITY.WARNING,
                '疑似缺少分号'
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
                `未识别的类型：${rawType}`
            );
        }
    }

    const accesses = collectMemberAccesses(parsedTree, text);
    accesses.forEach((access) => {
        const ownerType = resolveAccessPathType(index, access.ownerExpression, context, access.startOffset);
        if (!ownerType) return;

        const candidates = collectMembersByName(index, context, ownerType, access.memberName);
        if (!candidates.length) {
            pushDiagnostic(
                diagnostics,
                lineStarts,
                access.memberStartOffset,
                access.memberStartOffset + access.memberName.length,
                'RULE_UNKNOWN_MEMBER',
                DIAGNOSTIC_SEVERITY.ERROR,
                `${ownerType.name} 中不存在成员：${access.memberName}`
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
                    `${access.memberName}(...) 参数个数疑似不匹配，当前 ${argCount}`
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
