import {
    createEmptyApiIndex,
    getTypeByFullName,
    getTypeCandidatesByShortName,
    mergeApiIndex,
    normalizeApiIndex
} from './index-schema.js';
import { DIAGNOSTIC_SEVERITY } from '../contracts/messages.js';

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

function stripGenericsAndArrays(typeName) {
    let text = String(typeName || '').trim();
    text = text.replace(/\[\]$/g, '');
    const genericCut = text.indexOf('<');
    if (genericCut >= 0) {
        text = text.slice(0, genericCut);
    }
    return text;
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

    const explicitDeclRe = /\b([A-Za-z_][A-Za-z0-9_<>\[\],.]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\s*(?==|;|,|\))/g;
    while ((m = explicitDeclRe.exec(source)) !== null) {
        const rawType = stripGenericsAndArrays(m[1]);
        if (!rawType || KEYWORDS.includes(rawType)) continue;
        localTypes.set(m[2], rawType);
    }

    const varNewRe = /\bvar\s+([a-zA-Z_][A-Za-z0-9_]*)\s*=\s*new\s+([A-Za-z_][A-Za-z0-9_<>\[\],.]*)/g;
    while ((m = varNewRe.exec(source)) !== null) {
        localTypes.set(m[1], stripGenericsAndArrays(m[2]));
    }

    const foreachRe = /\bforeach\s*\(\s*([A-Za-z_][A-Za-z0-9_<>\[\],.]*)\s+([a-zA-Z_][A-Za-z0-9_]*)\s+in\s+/g;
    while ((m = foreachRe.exec(source)) !== null) {
        localTypes.set(m[2], stripGenericsAndArrays(m[1]));
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
        const fullDirect = getTypeByFullName(index, safe);
        if (fullDirect) return fullDirect;
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
            const namespaceParts = String(candidate.namespace || '')
                .split('.')
                .filter(Boolean);
            const fullNameParts = String(candidate.fullName || '')
                .split('.')
                .filter(Boolean);
            const nestedDepth = Math.max(0, fullNameParts.length - namespaceParts.length - 1);
            return { candidate, score, nestedDepth };
        })
        .sort((a, b) => {
            const byScore = a.score - b.score;
            if (byScore !== 0) return byScore;
            const byNestedDepth = a.nestedDepth - b.nestedDepth;
            if (byNestedDepth !== 0) return byNestedDepth;
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

function resolveMemberResultType(index, context, ownerType, memberName) {
    if (!ownerType) return null;

    const candidates = collectMembersByName(index, context, ownerType, memberName);
    if (!candidates.length) return null;

    for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        const declaredType =
            item.kind === 'method'
                ? stripGenericsAndArrays(item.returnType)
                : stripGenericsAndArrays(item.type || item.returnType);

        if (!declaredType || declaredType === 'void' || BUILTIN_TYPES.has(declaredType)) {
            continue;
        }

        const resolved = getTypeByFullName(index, declaredType) || resolveTypeByName(index, declaredType, context);
        if (resolved) {
            return resolved;
        }
    }

    return null;
}

function resolveAccessPathType(index, accessPath, context, offset) {
    const safePath = String(accessPath || '').trim();
    if (!safePath) return null;

    const directType = getTypeByFullName(index, safePath) || resolveTypeByName(index, safePath, context);
    if (directType) return directType;

    const parts = safePath.split('.').filter(Boolean);
    if (!parts.length) return null;

    let typeRecord = resolveIdentifierType(index, parts[0], context, offset);
    let memberStart = 1;

    if (!typeRecord && parts.length > 1) {
        for (let i = parts.length - 1; i > 0; i--) {
            const maybeTypeName = parts.slice(0, i).join('.');
            const maybeType = getTypeByFullName(index, maybeTypeName) || resolveTypeByName(index, maybeTypeName, context);
            if (maybeType) {
                typeRecord = maybeType;
                memberStart = i;
                break;
            }
        }
    }

    if (!typeRecord) return null;

    for (let i = memberStart; i < parts.length; i++) {
        typeRecord = resolveMemberResultType(index, context, typeRecord, parts[i]);
        if (!typeRecord) {
            return null;
        }
    }

    return typeRecord;
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

function getTokenAtOffset(text, offset) {
    const source = String(text || '');
    const pos = Math.max(0, Math.min(source.length, Number(offset) || 0));

    let start = pos;
    while (start > 0 && /[A-Za-z0-9_]/.test(source[start - 1])) {
        start -= 1;
    }

    let end = pos;
    while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) {
        end += 1;
    }

    if (start === end) {
        return null;
    }

    return {
        token: source.slice(start, end),
        start,
        end
    };
}

function getMemberAccessBeforeCursor(text, offset) {
    const source = String(text || '');
    const pos = Math.max(0, Math.min(source.length, Number(offset) || 0));
    const left = source.slice(0, pos);
    const match = left.match(/([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\.([A-Za-z_][A-Za-z0-9_]*)?$/);
    if (!match) return null;
    return {
        objectName: match[1],
        memberPrefix: match[2] || ''
    };
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

function createLineIndex(text) {
    const source = String(text || '');
    const starts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '\n') {
            starts.push(i + 1);
        }
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

function normalizeDocText(text) {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeParamTypeName(rawName) {
    return String(rawName || '')
        .replace(/\{.*\}/g, '')
        .replace(/&/g, '')
        .replace(/`[0-9]+/g, '')
        .trim();
}

function ensurePatchType(index, fullName) {
    if (!index.types[fullName]) {
        const cut = fullName.lastIndexOf('.');
        const ns = cut >= 0 ? fullName.slice(0, cut) : '';
        const name = cut >= 0 ? fullName.slice(cut + 1) : fullName;
        index.types[fullName] = {
            fullName,
            namespace: ns,
            name,
            summary: '',
            members: {
                methods: [],
                properties: [],
                fields: []
            }
        };
    }
    return index.types[fullName];
}

function parseMemberIdentifier(memberName) {
    const safe = String(memberName || '').trim();
    const cut = safe.indexOf(':');
    if (cut <= 0) return null;
    const prefix = safe.slice(0, cut);
    const value = safe.slice(cut + 1);
    return { prefix, value };
}

function splitDeclaringTypeAndMember(value) {
    const lastDot = value.lastIndexOf('.');
    if (lastDot <= 0) {
        return null;
    }
    return {
        declaringType: value.slice(0, lastDot),
        memberName: value.slice(lastDot + 1)
    };
}

function parseMethodTarget(value) {
    const open = value.indexOf('(');
    const close = value.lastIndexOf(')');
    const methodPath = open >= 0 ? value.slice(0, open) : value;
    const argText = open >= 0 && close > open ? value.slice(open + 1, close) : '';
    const split = splitDeclaringTypeAndMember(methodPath);
    if (!split) return null;

    const params = argText
        ? argText.split(',').map((item) => normalizeParamTypeName(item)).filter(Boolean)
        : [];

    return {
        declaringType: split.declaringType,
        memberName: split.memberName,
        params
    };
}

function pickAssemblyName(dllName) {
    const safe = String(dllName || '').trim();
    if (!safe) return 'ImportedAssembly';
    const slash = Math.max(safe.lastIndexOf('/'), safe.lastIndexOf('\\'));
    const fileName = slash >= 0 ? safe.slice(slash + 1) : safe;
    const cut = fileName.toLowerCase().endsWith('.dll') ? fileName.slice(0, -4) : fileName;
    return cut || 'ImportedAssembly';
}

function decodeXmlText(text) {
    return String(text || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'');
}

function extractTagText(rawXml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = String(rawXml || '').match(regex);
    if (!match) return '';
    return normalizeDocText(decodeXmlText(match[1]));
}

function extractParamDocs(rawXml) {
    const result = {};
    const regex = /<param\s+name=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/param>/gi;
    let match;
    while ((match = regex.exec(String(rawXml || ''))) !== null) {
        const name = String(match[1] || '').trim();
        const text = normalizeDocText(decodeXmlText(match[2]));
        if (!name || !text) continue;
        result[name] = text;
    }
    return result;
}

function extractXmlMembers(xmlText) {
    const safeXml = String(xmlText || '').trim();
    if (!safeXml) return [];

    if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(safeXml, 'application/xml');
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('XML 文档格式错误，无法解析。');
        }

        return Array.from(xmlDoc.querySelectorAll('member')).map((node) => {
            const raw = node.outerHTML || '';
            return {
                name: String(node.getAttribute('name') || '').trim(),
                summary: normalizeDocText((node.querySelector('summary') || {}).textContent || ''),
                returnsDoc: normalizeDocText((node.querySelector('returns') || {}).textContent || ''),
                paramDocs: extractParamDocs(raw)
            };
        });
    }

    const members = [];
    const memberRe = /<member\s+name=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/member>/gi;
    let match;
    while ((match = memberRe.exec(safeXml)) !== null) {
        members.push({
            name: String(match[1] || '').trim(),
            summary: extractTagText(match[2], 'summary'),
            returnsDoc: extractTagText(match[2], 'returns'),
            paramDocs: extractParamDocs(match[2])
        });
    }
    return members;
}

export function buildPatchIndexFromXml(xmlText, dllName) {
    const safeXml = String(xmlText || '').trim();
    if (!safeXml) {
        throw new Error('XML 文档为空，无法导入程序集。');
    }

    const patch = createEmptyApiIndex();
    patch.sources.push({
        assemblyName: pickAssemblyName(dllName),
        dllPath: String(dllName || ''),
        xmlPath: ''
    });

    const members = extractXmlMembers(safeXml);
    members.forEach((memberNode) => {
        const rawName = String(memberNode.name || '').trim();
        if (!rawName) return;

        const parsed = parseMemberIdentifier(rawName);
        if (!parsed) return;

        const summary = String(memberNode.summary || '');
        if (parsed.prefix === 'T') {
            const typeRecord = ensurePatchType(patch, parsed.value);
            if (!typeRecord.summary && summary) {
                typeRecord.summary = summary;
            }
            return;
        }

        if (parsed.prefix === 'M') {
            const method = parseMethodTarget(parsed.value);
            if (!method) return;
            const typeRecord = ensurePatchType(patch, method.declaringType);
            typeRecord.members.methods.push({
                kind: 'method',
                name: method.memberName,
                signature: `${method.memberName}(${method.params.join(', ')})`,
                returnType: 'object',
                isStatic: false,
                params: method.params.map((type, idx) => ({
                    name: `arg${idx + 1}`,
                    type,
                    optional: false,
                    defaultValue: null
                })),
                minArgs: method.params.length,
                maxArgs: method.params.length,
                summary,
                returnsDoc: String(memberNode.returnsDoc || ''),
                paramDocs: memberNode.paramDocs && typeof memberNode.paramDocs === 'object' ? memberNode.paramDocs : {}
            });
            return;
        }

        if (parsed.prefix === 'P') {
            const split = splitDeclaringTypeAndMember(parsed.value);
            if (!split) return;
            const typeRecord = ensurePatchType(patch, split.declaringType);
            typeRecord.members.properties.push({
                kind: 'property',
                name: split.memberName,
                signature: `${split.memberName} { get; set; }`,
                type: 'object',
                isStatic: false,
                summary
            });
            return;
        }

        if (parsed.prefix === 'F') {
            const split = splitDeclaringTypeAndMember(parsed.value);
            if (!split) return;
            const typeRecord = ensurePatchType(patch, split.declaringType);
            typeRecord.members.fields.push({
                kind: 'field',
                name: split.memberName,
                signature: split.memberName,
                type: 'object',
                isStatic: false,
                summary
            });
        }
    });

    return normalizeApiIndex(patch);
}

export function createLanguageState(initialIndex) {
    return {
        index: normalizeApiIndex(initialIndex)
    };
}

export function setLanguageIndex(state, nextIndex) {
    state.index = normalizeApiIndex(nextIndex);
    return state.index;
}

export function importAssemblyFromXml(state, payload) {
    const dllName = payload && payload.dllName ? payload.dllName : '';
    const xmlText = payload && payload.xmlText ? payload.xmlText : '';

    const patch = buildPatchIndexFromXml(xmlText, dllName);
    state.index = mergeApiIndex(state.index, patch);

    return {
        assemblyName: pickAssemblyName(dllName),
        importedTypes: Object.keys(patch.types).length,
        totalTypes: Object.keys(state.index.types).length
    };
}

export function getCompletionItems(state, request) {
    const text = String(request && request.text || '');
    const offset = Number(request && request.offset || 0);
    const maxItems = Math.max(10, Math.min(200, Number(request && request.maxItems || 60)));

    const context = extractContext(text);
    const index = state.index;
    const memberAccess = getMemberAccessBeforeCursor(text, offset);

    if (memberAccess) {
        const ownerType = resolveAccessPathType(index, memberAccess.objectName, context, offset);
        if (!ownerType) {
            return [];
        }

        const members = getMemberCompletionCandidates(index, context, ownerType, memberAccess.memberPrefix)
            .slice(0, maxItems)
            .map((item) => ({
                label: item.name,
                insertText: item.name,
                kind: item.kind,
                detail: item.signature || item.type || item.returnType || '',
                documentation: item.summary || '',
                sortText: `1_${item.name}`
            }));

        return members;
    }

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
            kind: 'keyword',
            detail: 'C# keyword',
            documentation: '',
            sortText: `3_${word}`
        }));

    return typeItems.concat(keywordItems).slice(0, maxItems);
}

export function getHoverInfo(state, request) {
    const text = String(request && request.text || '');
    const offset = Number(request && request.offset || 0);
    const index = state.index;
    const context = extractContext(text);

    const tokenInfo = getTokenAtOffset(text, offset);
    if (!tokenInfo) return null;

    const before = text.slice(0, tokenInfo.start);
    const memberOwnerMatch = before.match(/([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\.$/);

    if (memberOwnerMatch) {
        const ownerType = resolveAccessPathType(index, memberOwnerMatch[1], context, tokenInfo.start);
        if (!ownerType) return null;

        const members = collectMembersByName(index, context, ownerType, tokenInfo.token);
        if (!members.length) return null;

        const lines = [];
        const head = `${ownerType.fullName}.${tokenInfo.token}`;
        lines.push(`**${head}**`);

        const first = members[0];
        if (first.signature) {
            lines.push('', '`' + first.signature + '`');
        }
        if (first.summary) {
            lines.push('', first.summary);
        }
        if (members.length > 1) {
            lines.push('', `重载数: ${members.length}`);
        }

        return {
            startOffset: tokenInfo.start,
            endOffset: tokenInfo.end,
            markdown: lines.join('\n')
        };
    }

    const typeRecord = resolveTypeByName(index, tokenInfo.token, context);
    if (!typeRecord) return null;

    const docLines = [`**${typeRecord.fullName}**`];
    if (typeRecord.summary) {
        docLines.push('', typeRecord.summary);
    }
    docLines.push('', `Methods: ${typeRecord.members.methods.length} · Properties: ${typeRecord.members.properties.length} · Fields: ${typeRecord.members.fields.length}`);

    return {
        startOffset: tokenInfo.start,
        endOffset: tokenInfo.end,
        markdown: docLines.join('\n')
    };
}

export function getRuleDiagnostics(state, request) {
    const text = String(request && request.text || '');
    const index = state.index;
    const lineStarts = createLineIndex(text);
    const diagnostics = [];
    const context = extractContext(text);

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
    let match;
    while ((match = typeDeclRe.exec(text)) !== null) {
        const rawType = stripGenericsAndArrays(match[1]);
        if (!rawType || BUILTIN_TYPES.has(rawType)) continue;
        if (context.declaredTypes.has(rawType)) continue;

        const resolvedType = resolveTypeByName(index, rawType, context);
        if (!resolvedType) {
            pushDiagnostic(
                diagnostics,
                lineStarts,
                match.index,
                match.index + rawType.length,
                'RULE_UNKNOWN_TYPE',
                DIAGNOSTIC_SEVERITY.WARNING,
                `未识别的类型：${rawType}`
            );
        }
    }

    const memberRe = /\b([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\.([A-Za-z_][A-Za-z0-9_]*)\s*(\(([^)]*)\))?/g;
    while ((match = memberRe.exec(text)) !== null) {
        const owner = match[1];
        const member = match[2];
        const argsText = match[4] || '';
        const ownerType = resolveAccessPathType(index, owner, context, match.index);
        if (!ownerType) continue;

        const candidates = collectMembersByName(index, context, ownerType, member);
        if (!candidates.length) {
            pushDiagnostic(
                diagnostics,
                lineStarts,
                match.index + owner.length + 1,
                match.index + owner.length + 1 + member.length,
                'RULE_UNKNOWN_MEMBER',
                DIAGNOSTIC_SEVERITY.ERROR,
                `${ownerType.name} 中不存在成员：${member}`
            );
            continue;
        }

        if (match[3]) {
            const argCount = countArguments(argsText);
            const methods = candidates.filter((item) => item.kind === 'method');
            if (methods.length) {
                const valid = methods.some((method) => argCount >= method.minArgs && argCount <= method.maxArgs);
                if (!valid) {
                    pushDiagnostic(
                        diagnostics,
                        lineStarts,
                        match.index,
                        match.index + match[0].length,
                        'RULE_ARG_COUNT',
                        DIAGNOSTIC_SEVERITY.WARNING,
                        `${member}(...) 参数个数疑似不匹配，当前 ${argCount}`
                    );
                }
            }
        }
    }

    return diagnostics;
}

export function getIndexStats(index) {
    const safe = normalizeApiIndex(index);
    const types = Object.keys(safe.types);
    let methodCount = 0;
    let propertyCount = 0;
    let fieldCount = 0;

    types.forEach((fullName) => {
        const type = safe.types[fullName];
        methodCount += type.members.methods.length;
        propertyCount += type.members.properties.length;
        fieldCount += type.members.fields.length;
    });

    return {
        types: types.length,
        methods: methodCount,
        properties: propertyCount,
        fields: fieldCount,
        sources: safe.sources.length
    };
}
