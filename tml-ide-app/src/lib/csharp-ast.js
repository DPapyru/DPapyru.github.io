import { parser as csharpParser } from '@replit/codemirror-lang-csharp';

function isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function isIdentifierStart(ch) {
    return /[A-Za-z_]/.test(ch || '');
}

function isIdentifierChar(ch) {
    return /[A-Za-z0-9_]/.test(ch || '');
}

function skipWhitespaceBackward(text, index) {
    let i = index;
    while (i >= 0 && isWhitespace(text[i])) i -= 1;
    return i;
}

function skipWhitespaceForward(text, index) {
    let i = index;
    while (i < text.length && isWhitespace(text[i])) i += 1;
    return i;
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

function findExpressionStart(text, endIndex) {
    const source = String(text || '');
    let depthParen = 0;
    let depthBracket = 0;
    let depthAngle = 0;
    let inString = false;
    let quote = '';

    for (let i = endIndex; i >= 0; i--) {
        const ch = source[i];
        const prev = i > 0 ? source[i - 1] : '';

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

        if (ch === ')') {
            depthParen += 1;
            continue;
        }
        if (ch === ']') {
            depthBracket += 1;
            continue;
        }
        if (ch === '>') {
            depthAngle += 1;
            continue;
        }
        if (ch === '(') {
            if (depthParen > 0) {
                depthParen -= 1;
                continue;
            }
        }
        if (ch === '[') {
            if (depthBracket > 0) {
                depthBracket -= 1;
                continue;
            }
        }
        if (ch === '<') {
            if (depthAngle > 0) {
                depthAngle -= 1;
                continue;
            }
        }

        if (depthParen === 0 && depthBracket === 0 && depthAngle === 0) {
            const next = i + 1 < source.length ? source[i + 1] : '';
            if (ch === '?' && next === '.') {
                continue;
            }
            if (ch === ':' && next === ':') {
                continue;
            }
            if (
                ch === ';' || ch === '\n' || ch === '\r' || ch === '{' || ch === '}' ||
                ch === '=' || ch === ',' || ch === '+' || ch === '-' ||
                ch === '*' || ch === '/' || ch === '%' || ch === '&' ||
                ch === '|' || ch === '^' || ch === '!' || ch === '?' || ch === ':'
            ) {
                return i + 1;
            }
        }
    }

    return 0;
}

function splitTopLevelByDot(expression) {
    const source = String(expression || '').trim();
    if (!source) return [];

    const parts = [];
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
            if (current.trim()) parts.push(current.trim());
            current = '';
            i += 1;
            continue;
        }
        if (topLevel && ch === '.') {
            if (current.trim()) parts.push(current.trim());
            current = '';
            continue;
        }

        current += ch;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
}

function normalizePath(pathText) {
    const safe = stripEnclosingParens(pathText);
    return splitTopLevelByDot(safe).join('.');
}

function detectAccessAtDot(text, dotIndex) {
    const source = String(text || '');
    const safeDot = Math.max(0, Math.min(source.length - 1, Number(dotIndex) || 0));
    if (source[safeDot] !== '.') return null;

    let prefixStart = safeDot + 1;
    let i = prefixStart;
    while (i < source.length && isIdentifierChar(source[i])) i += 1;
    const memberPrefix = source.slice(prefixStart, i);

    let ownerEnd = safeDot - 1;
    if (ownerEnd >= 0 && source[ownerEnd] === '?') {
        ownerEnd -= 1;
    }
    ownerEnd = skipWhitespaceBackward(source, ownerEnd);
    if (ownerEnd < 0) return null;

    const ownerStart = findExpressionStart(source, ownerEnd);
    const rawOwner = source.slice(ownerStart, ownerEnd + 1).trim();
    if (!rawOwner) return null;

    return {
        objectExpression: normalizePath(rawOwner),
        memberPrefix,
        ownerStartOffset: ownerStart,
        ownerEndOffset: ownerEnd + 1,
        memberStartOffset: prefixStart,
        memberEndOffset: i
    };
}

function readIdentifierForward(text, index) {
    let start = index;
    while (start < text.length && !isIdentifierStart(text[start])) start += 1;
    let end = start;
    while (end < text.length && isIdentifierChar(text[end])) end += 1;
    return {
        start,
        end,
        value: text.slice(start, end)
    };
}

function skipCommentOrStringForward(text, start) {
    const source = String(text || '');
    const ch = source[start];
    const next = start + 1 < source.length ? source[start + 1] : '';

    if (ch === '/' && next === '/') {
        let i = start + 2;
        while (i < source.length && source[i] !== '\n') i += 1;
        return i;
    }

    if (ch === '/' && next === '*') {
        let i = start + 2;
        while (i + 1 < source.length) {
            if (source[i] === '*' && source[i + 1] === '/') return i + 2;
            i += 1;
        }
        return source.length;
    }

    if (ch === '"' || ch === '\'') {
        let i = start + 1;
        while (i < source.length) {
            if (source[i] === ch && source[i - 1] !== '\\') return i + 1;
            i += 1;
        }
        return source.length;
    }

    return start + 1;
}

function readCallArgsAfterMember(text, startIndex) {
    const source = String(text || '');
    const calls = [];
    let i = skipWhitespaceForward(source, startIndex);

    while (i < source.length && source[i] === '(') {
        const close = findMatchingCloseForward(source, i, '(', ')');
        if (close < 0) break;
        calls.push(source.slice(i + 1, close));
        i = skipWhitespaceForward(source, close + 1);
    }

    return { calls, nextIndex: i };
}

function collectDotAccesses(text) {
    const source = String(text || '');
    const results = [];

    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (ch === '/' || ch === '"' || ch === '\'') {
            i = skipCommentOrStringForward(source, i) - 1;
            continue;
        }
        if (ch !== '.') continue;

        const access = detectAccessAtDot(source, i);
        if (!access) continue;
        const memberStart = skipWhitespaceForward(source, i + 1);
        if (!isIdentifierStart(source[memberStart])) continue;
        const member = readIdentifierForward(source, memberStart);
        const memberName = member.value;
        if (!memberName) continue;

        const callInfo = readCallArgsAfterMember(source, member.end);
        const argsText = callInfo.calls.length ? callInfo.calls[0] : '';

        results.push({
            ownerExpression: access.objectExpression,
            memberName,
            argsText,
            startOffset: access.ownerStartOffset,
            memberStartOffset: member.start,
            endOffset: callInfo.nextIndex
        });
    }

    return results;
}

export function parseCSharp(text) {
    const source = String(text || '');
    const tree = csharpParser.parse(source);
    return { tree, text: source };
}

export function collectSyntaxErrors(treeOrParsed, text) {
    const source = String(text || (treeOrParsed && treeOrParsed.text) || '');
    const tree = treeOrParsed && treeOrParsed.tree ? treeOrParsed.tree : treeOrParsed;
    if (!tree) return [];

    const errors = [];
    const cursor = tree.cursor();
    do {
        if (cursor.name === '⚠') {
            errors.push({
                from: cursor.from,
                to: cursor.to,
                fragment: source.slice(cursor.from, cursor.to)
            });
        }
    } while (cursor.next());

    return errors;
}

export function findExpressionChainAtOffset(tree, text, offset) {
    const source = String(text || '');
    const pos = Math.max(0, Math.min(source.length, Number(offset) || 0));
    const prefixStart = (function () {
        let i = pos;
        while (i > 0 && isIdentifierChar(source[i - 1])) i -= 1;
        return i;
    })();
    const dotIndex = skipWhitespaceBackward(source, prefixStart - 1);
    if (dotIndex < 0 || source[dotIndex] !== '.') return null;
    return detectAccessAtDot(source, dotIndex);
}

export function findMemberOwnerBeforeOffset(tree, text, memberStartOffset) {
    const source = String(text || '');
    const start = Math.max(0, Math.min(source.length, Number(memberStartOffset) || 0));
    const dot = skipWhitespaceBackward(source, start - 1);
    if (dot < 0 || source[dot] !== '.') return null;
    return detectAccessAtDot(source, dot);
}

export function collectMemberAccesses(tree, text) {
    return collectDotAccesses(text);
}
