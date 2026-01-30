const fs = require('fs');
const path = require('path');

const ATTRIBUTE_MAP = {
    Title: 'title',
    Tooltip: 'description',
    UpdateTime: 'last_updated',
    Author: 'author',
    Category: 'category',
    Topic: 'topic',
    Date: 'date',
    Difficulty: 'difficulty',
    Time: 'time',
    Order: 'order',
    Tags: 'tags',
    PrevChapter: 'prev_chapter',
    NextChapter: 'next_chapter',
    Hide: 'hide'
};

function normalizeNewlines(text) {
    return String(text || '').replace(/\r\n?/g, '\n');
}

function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescapeCSharpString(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}

function extractParenArg(text, openParenIndex) {
    const s = String(text || '');
    let i = openParenIndex;
    if (i < 0 || i >= s.length || s[i] !== '(') return null;

    let depth = 0;
    let start = -1;

    for (; i < s.length; i++) {
        const ch = s[i];
        if (ch === '(') {
            if (depth === 0) start = i + 1;
            depth += 1;
            continue;
        }
        if (ch === ')') {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                return s.slice(start, i);
            }
        }
    }

    return null;
}

function getTypeSimpleName(typeExpression) {
    let s = String(typeExpression || '').trim();
    if (!s) return s;

    if (s.startsWith('global::')) s = s.slice('global::'.length);

    let lastStart = 0;
    let angleDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (ch === '<') angleDepth += 1;
        else if (ch === '>') angleDepth = Math.max(0, angleDepth - 1);
        else if (ch === '(') parenDepth += 1;
        else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
        else if (ch === '[') bracketDepth += 1;
        else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

        if (angleDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
            if (ch === '.' || ch === '+') {
                lastStart = i + 1;
                continue;
            }
            if (ch === ':' && s[i + 1] === ':') {
                lastStart = i + 2;
                i += 1;
            }
        }
    }

    let seg = s.slice(lastStart).trim();
    if (seg.startsWith('@')) seg = seg.slice(1);

    // Strip generic/array/nullable suffixes on this segment.
    for (let i = 0; i < seg.length; i++) {
        const ch = seg[i];
        if (ch === '<' || ch === '[' || ch === '?') {
            seg = seg.slice(0, i).trim();
            break;
        }
    }

    if (seg.startsWith('@')) seg = seg.slice(1);
    return seg;
}

function parseAttributeValue(rawArgs) {
    const text = String(rawArgs || '').trim();
    if (!text) return null;

    // Support passing chapter targets as typeof(ClassName) or nameof(ClassName)
    // in attributes like [PrevChapter(typeof(Foo))].
    if (/^typeof\b/.test(text)) {
        const open = text.indexOf('(');
        const arg = extractParenArg(text, open);
        if (arg != null) {
            const full = arg.trim();
            const name = getTypeSimpleName(full);
            return name || full;
        }
    }

    if (/^nameof\b/.test(text)) {
        const open = text.indexOf('(');
        const arg = extractParenArg(text, open);
        if (arg != null) {
            const full = arg.trim();
            const name = getTypeSimpleName(full);
            return name || full;
        }
    }

    const stringMatch = text.match(/@?"([\s\S]*?)"/);
    if (stringMatch) {
        return unescapeCSharpString(stringMatch[1]);
    }

    const boolMatch = text.match(/\b(true|false)\b/i);
    if (boolMatch) {
        return boolMatch[1].toLowerCase() === 'true';
    }

    const numberMatch = text.match(/\b\d+\b/);
    if (numberMatch) {
        return Number(numberMatch[0]);
    }

    return text;
}

function normalizeDate(value) {
    if (!value) return value;
    const match = String(value).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
    if (!match) return value;
    const yyyy = match[1];
    const mm = String(match[2]).padStart(2, '0');
    const dd = String(match[3]).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function extractAttributes(text) {
    const attributes = {};

    // We can't use a simple regex for attribute args because `typeof(X)` / `nameof(X)`
    // contain nested parentheses. This scanner extracts `[Name(...)]` blocks safely.
    const s = String(text || '');
    let i = 0;
    while (i < s.length) {
        const open = s.indexOf('[', i);
        if (open < 0) break;
        i = open + 1;

        // Parse attribute identifier.
        while (i < s.length && /\s/.test(s[i])) i++;
        const nameStart = i;
        while (i < s.length && /\w/.test(s[i])) i++;
        const name = s.slice(nameStart, i);
        if (!name) continue;

        while (i < s.length && /\s/.test(s[i])) i++;
        if (s[i] !== '(') {
            continue;
        }
        i += 1; // skip '('

        // Collect args until matching ')', tracking nesting and strings.
        let depth = 1;
        let inString = false;
        let inVerbatim = false;
        let inChar = false;
        let args = '';

        while (i < s.length && depth > 0) {
            const ch = s[i];
            const next = s[i + 1];

            if (inString) {
                args += ch;
                if (inVerbatim) {
                    // In verbatim strings @"...", doubled quotes escape.
                    if (ch === '"' && next === '"') {
                        args += next;
                        i += 2;
                        continue;
                    }
                    if (ch === '"') {
                        inString = false;
                        inVerbatim = false;
                    }
                    i += 1;
                    continue;
                }

                // Normal string: backslash escapes.
                if (ch === '\\' && next) {
                    args += next;
                    i += 2;
                    continue;
                }
                if (ch === '"') {
                    inString = false;
                }
                i += 1;
                continue;
            }

            if (inChar) {
                args += ch;
                if (ch === '\\' && next) {
                    args += next;
                    i += 2;
                    continue;
                }
                if (ch === '\'') inChar = false;
                i += 1;
                continue;
            }

            if (ch === '@' && next === '"') {
                inString = true;
                inVerbatim = true;
                args += ch;
                i += 1;
                continue;
            }
            if (ch === '"') {
                inString = true;
                args += ch;
                i += 1;
                continue;
            }
            if (ch === '\'') {
                inChar = true;
                args += ch;
                i += 1;
                continue;
            }

            if (ch === '(') {
                depth += 1;
                args += ch;
                i += 1;
                continue;
            }
            if (ch === ')') {
                depth -= 1;
                if (depth === 0) {
                    i += 1; // consume ')'
                    break;
                }
                args += ch;
                i += 1;
                continue;
            }

            args += ch;
            i += 1;
        }

        // Move to the closing bracket if present.
        while (i < s.length && /\s/.test(s[i])) i++;
        if (s[i] === ']') i += 1;

        if (!ATTRIBUTE_MAP[name]) continue;
        const value = parseAttributeValue(args);
        attributes[name] = value;
    }

    return attributes;
}

function collectDocLines(lines, options = {}) {
    const docLines = [];
    let docsIfDepth = 0;
    let docsRegionDepth = 0;
    let continuationTag = null;

    const inDocsBlock = () => docsIfDepth > 0 || docsRegionDepth > 0;

    const shouldCollect = () => {
        if (options.onlyDocsBlock) return inDocsBlock();
        if (options.excludeDocsBlock) return !inDocsBlock();
        return true;
    };

    lines.forEach(line => {
        const trimmed = line.trim();

        // Robust DOCS block tracking:
        // - '#if DOCS' ... '#endif' (supports nested #if inside)
        // - '#region DOCS' ... '#endregion' (supports nested #region inside)
        if (/^#if\b/i.test(trimmed)) {
            if (/^#if\s+DOCS\b/i.test(trimmed)) {
                docsIfDepth = 1;
                continuationTag = null;
                return;
            }
            if (docsIfDepth > 0) {
                docsIfDepth += 1;
                return;
            }
        }
        if (/^#endif\b/i.test(trimmed) && docsIfDepth > 0) {
            docsIfDepth -= 1;
            continuationTag = null;
            return;
        }

        if (/^#region\b/i.test(trimmed)) {
            if (/^#region\s+DOCS\b/i.test(trimmed)) {
                docsRegionDepth = 1;
                continuationTag = null;
                return;
            }
            if (docsRegionDepth > 0) {
                docsRegionDepth += 1;
                return;
            }
        }
        if (/^#endregion\b/i.test(trimmed) && docsRegionDepth > 0) {
            docsRegionDepth -= 1;
            continuationTag = null;
            return;
        }

        if (!shouldCollect()) return;

        const docMatch = line.match(/^\s*\/\/\/(.*)$/);
        if (docMatch) {
            // Preserve author-intended indentation (especially inside code fences).
            // We only strip a single leading space after '///' for convenience.
            let content = docMatch[1];
            if (content.startsWith(' ')) content = content.slice(1);
            docLines.push(content);

            const contentTrimmed = content.trim();
            const openMatch = contentTrimmed.match(/<(summary|remarks)>/i);
            if (openMatch && !new RegExp(`</${openMatch[1]}>`, 'i').test(contentTrimmed)) {
                continuationTag = openMatch[1].toLowerCase();
            }
            if (continuationTag && new RegExp(`</${continuationTag}>`, 'i').test(contentTrimmed)) {
                continuationTag = null;
            }
            return;
        }

        if (continuationTag) {
            docLines.push(trimmed);
            if (new RegExp(`</${continuationTag}>`, 'i').test(trimmed)) {
                continuationTag = null;
            }
        }
    });

    return docLines;
}

function extractDocLinesBeforeClass(text, classIndex) {
    const lines = text.slice(0, classIndex).split('\n');
    return collectDocLines(lines, { excludeDocsBlock: true });
}

function extractDocLinesFromDocsBlocks(text) {
    const lines = text.split('\n');
    return collectDocLines(lines, { onlyDocsBlock: true });
}

function extractDocsBlocksSource(text) {
    const lines = text.split('\n');
    const blocks = [];
    let docsIfDepth = 0;
    let docsRegionDepth = 0;
    let buf = [];

    const flush = () => {
        if (buf.length) blocks.push(buf.join('\n'));
        buf = [];
    };

    lines.forEach(line => {
        const trimmed = line.trim();
        const inDocsBlock = docsIfDepth > 0 || docsRegionDepth > 0;

        if (/^#if\b/i.test(trimmed)) {
            if (/^#if\s+DOCS\b/i.test(trimmed) && !inDocsBlock) {
                docsIfDepth = 1;
                buf = [];
                return;
            }
            if (docsIfDepth > 0) {
                docsIfDepth += 1;
                return;
            }
        }

        if (/^#endif\b/i.test(trimmed) && docsIfDepth > 0) {
            docsIfDepth -= 1;
            if (docsIfDepth === 0 && docsRegionDepth === 0) flush();
            return;
        }

        if (/^#region\b/i.test(trimmed)) {
            if (/^#region\s+DOCS\b/i.test(trimmed) && !inDocsBlock) {
                docsRegionDepth = 1;
                buf = [];
                return;
            }
            if (docsRegionDepth > 0) {
                docsRegionDepth += 1;
                return;
            }
        }

        if (/^#endregion\b/i.test(trimmed) && docsRegionDepth > 0) {
            docsRegionDepth -= 1;
            if (docsIfDepth === 0 && docsRegionDepth === 0) flush();
            return;
        }

        if (docsIfDepth > 0 || docsRegionDepth > 0) buf.push(line);
    });

    if (docsIfDepth > 0 || docsRegionDepth > 0) flush();
    return blocks;
}

function parseCSharpStringLiteral(text, startIndex) {
    const s = text;
    let i = startIndex;
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) return null;

    // raw string literal: """..."""
    if (s[i] === '"') {
        let q = i;
        while (q < s.length && s[q] === '"') q++;
        const quoteCount = q - i;
        if (quoteCount >= 3) {
            const delim = '"'.repeat(quoteCount);
            let contentStart = q;
            // Most raw strings start with a newline. If present, skip it.
            if (s[contentStart] === '\n') contentStart += 1;

            // Find closing delimiter as a line that starts with optional whitespace + delim.
            const tail = s.slice(contentStart);
            const closeRegex = new RegExp(`(^|\\n)([\\t ]*)${escapeRegex(delim)}(?=\\s*;?)`, 'g');
            const m = closeRegex.exec(tail);
            if (!m) return null;

            const closeLinePrefix = m[2] || '';
            const closePosInTail = m.index + (m[1] ? m[1].length : 0);
            const closeLineStart = contentStart + closePosInTail;

            let raw = s.slice(contentStart, closeLineStart);
            // Unindent using the closing delimiter indentation.
            if (closeLinePrefix) {
                raw = raw
                    .split('\n')
                    .map(line => line.startsWith(closeLinePrefix) ? line.slice(closeLinePrefix.length) : line)
                    .join('\n');
            }
            raw = raw.replace(/\n$/, '');

            // Compute endIndex past the closing delimiter.
            const afterClose = closeLineStart + closeLinePrefix.length + delim.length;
            return { value: raw, endIndex: afterClose };
        }
    }

    // verbatim string literal: @"..."
    if (s[i] === '@' && s[i + 1] === '"') {
        i += 2;
        let out = '';
        while (i < s.length) {
            const ch = s[i];
            if (ch === '"') {
                if (s[i + 1] === '"') {
                    out += '"';
                    i += 2;
                    continue;
                }
                i += 1;
                return { value: out, endIndex: i };
            }
            out += ch;
            i += 1;
        }
        return null;
    }

    // normal string literal: "..."
    if (s[i] === '"') {
        i += 1;
        let out = '';
        while (i < s.length) {
            const ch = s[i];
            if (ch === '\\') {
                out += ch;
                if (i + 1 < s.length) out += s[i + 1];
                i += 2;
                continue;
            }
            if (ch === '"') {
                i += 1;
                return { value: unescapeCSharpString(out), endIndex: i };
            }
            out += ch;
            i += 1;
        }
        return null;
    }

    return null;
}

function normalizeDocMarkdownValue(value) {
    let text = normalizeNewlines(value);

    // Common authoring pattern:
    // public const string DocMarkdown = @"
    //     line...
    // ";
    // Strip exactly one leading newline introduced by formatting.
    if (text.startsWith('\n')) text = text.slice(1);

    // Strip a single trailing newline for nicer markdown output.
    if (text.endsWith('\n')) text = text.slice(0, -1);

    const lines = text.split('\n');
    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length === 0) return text.trim();

    // Compute common leading whitespace prefix across non-empty lines.
    let prefix = (nonEmpty[0].match(/^[\t ]*/g) || [''])[0] || '';
    for (let i = 1; i < nonEmpty.length && prefix; i++) {
        const w = (nonEmpty[i].match(/^[\t ]*/g) || [''])[0] || '';
        while (prefix && !w.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
        }
    }

    if (!prefix) return text;
    return lines
        .map(l => l.startsWith(prefix) ? l.slice(prefix.length) : l)
        .join('\n')
        .trimEnd();
}

function extractDocMarkdownFromDocsBlocks(text) {
    const blocks = extractDocsBlocksSource(text);
    const results = [];

    // If authors use #region inside #if DOCS, we treat region titles as headings and
    // collect DocMarkdown* string literals under the closest open region.
    const extractFromBlock = (block) => {
        const lines = block.split('\n');
        const sections = [];
        const sectionStack = [];
        const freeParts = [];

        const pushSection = (title) => {
            const depth = sectionStack.length + 1; // 1-based depth within DOCS regions
            const sec = { depth, title, parts: [] };
            sections.push(sec);
            sectionStack.push(sec);
        };

        const addPart = (value) => {
            const v = normalizeDocMarkdownValue(value);
            if (!v) return;
            if (sectionStack.length) sectionStack[sectionStack.length - 1].parts.push(v);
            else freeParts.push(v);
        };

        // We scan line-by-line for region boundaries, then use a regex to locate
        // DocMarkdown* identifiers and parse the assigned string literal.
        let offset = 0;
        for (let li = 0; li < lines.length; li++) {
            const line = lines[li];
            const trimmed = line.trim();

            const regionMatch = trimmed.match(/^#region\s+(.+?)\s*$/i);
            if (regionMatch) {
                pushSection(regionMatch[1].trim());
                offset += line.length + 1;
                continue;
            }
            if (/^#endregion\b/i.test(trimmed)) {
                sectionStack.pop();
                offset += line.length + 1;
                continue;
            }

            // Find all DocMarkdown identifiers on this line. We support DocMarkdown, DocMarkdown_1, etc.
            const lineStart = offset;
            const lineEnd = offset + line.length;
            const lineSlice = block.slice(lineStart, lineEnd);
            const re = /\bDocMarkdown\w*\b/g;
            let m;
            while ((m = re.exec(lineSlice)) !== null) {
                const hit = lineStart + m.index;
                const eq = block.indexOf('=', hit);
                if (eq < 0) continue;
                const parsed = parseCSharpStringLiteral(block, eq + 1);
                if (parsed && parsed.value != null) {
                    addPart(parsed.value);
                }
            }

            offset += line.length + 1;
        }

        const out = [];
        if (freeParts.length) out.push(freeParts.join('\n\n').trim());

        sections.forEach(sec => {
            const body = sec.parts.join('\n\n').trim();
            if (!sec.title || !body) return;
            const hashes = '#'.repeat(Math.min(6, sec.depth + 1)); // depth=1 => "##"
            out.push(`${hashes} ${sec.title}`.trim());
            out.push(body);
        });

        return out.join('\n\n').trim();
    };

    blocks.forEach(block => {
        const v = extractFromBlock(block);
        if (v) results.push(v);
    });

    return results.join('\n\n').trim();
}

function isMetadataRegionTitle(title) {
    const t = String(title || '').trim().toLowerCase();
    return t === '元数据' || t === 'metadata';
}

function buildInlineBodyFromSource(sourceText) {
    const text = normalizeNewlines(sourceText);
    const lines = text.split('\n');

    let docsIfDepth = 0;
    let docsRegionDepth = 0;
    const inDocsBlock = () => docsIfDepth > 0 || docsRegionDepth > 0;

    const docRegionStack = [];
    const codeRegionStack = [];

    // parts is an ordered mix of markdown snippets and code placeholders.
    // We fill code placeholders when their #region closes.
    const parts = [];

    const pushMd = (value) => {
        const v = String(value || '').trimEnd();
        if (!v.trim()) return;
        parts.push({ type: 'md', content: v });
    };

    const pushCodeRegion = (title, depth) => {
        const sec = { type: 'code', title, depth, lines: [], code: '', skip: isMetadataRegionTitle(title) };
        if (!sec.skip) parts.push(sec);
        codeRegionStack.push(sec);
    };

    let offset = 0;
    for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        const trimmed = line.trim();

        // DOCS guards: '#if DOCS' ... '#endif' (supports nested #if)
        if (/^#if\b/i.test(trimmed)) {
            if (/^#if\s+DOCS\b/i.test(trimmed) && !inDocsBlock()) {
                docsIfDepth = 1;
                offset += line.length + 1;
                continue;
            }
            if (docsIfDepth > 0) {
                docsIfDepth += 1;
                offset += line.length + 1;
                continue;
            }
        }
        if (/^#endif\b/i.test(trimmed) && docsIfDepth > 0) {
            docsIfDepth -= 1;
            offset += line.length + 1;
            continue;
        }

        // DOCS guards: '#region DOCS' ... '#endregion' (supports nested #region)
        if (/^#region\b/i.test(trimmed)) {
            if (/^#region\s+DOCS\b/i.test(trimmed) && !inDocsBlock()) {
                docsRegionDepth = 1;
                offset += line.length + 1;
                continue;
            }
            if (docsRegionDepth > 0) {
                docsRegionDepth += 1;
                offset += line.length + 1;
                continue;
            }
        }
        if (/^#endregion\b/i.test(trimmed) && docsRegionDepth > 0) {
            docsRegionDepth -= 1;
            offset += line.length + 1;
            continue;
        }

        if (inDocsBlock()) {
            const regionMatch = trimmed.match(/^#region\s+(.+?)\s*$/i);
            if (regionMatch && !/^DOCS\b/i.test(regionMatch[1].trim())) {
                const title = regionMatch[1].trim();
                docRegionStack.push(title);
                const hashes = '#'.repeat(Math.min(6, docRegionStack.length + 1)); // depth=1 => "##"
                pushMd(`${hashes} ${title}`.trim());
                offset += line.length + 1;
                continue;
            }

            if (/^#endregion\b/i.test(trimmed)) {
                docRegionStack.pop();
                offset += line.length + 1;
                continue;
            }

            // Parse any DocMarkdown* assignment on this line.
            const lineStart = offset;
            const lineSlice = text.slice(lineStart, lineStart + line.length);
            const re = /\bDocMarkdown\w*\b/g;
            let m;
            while ((m = re.exec(lineSlice)) !== null) {
                const hit = lineStart + m.index;
                const eq = text.indexOf('=', hit);
                if (eq < 0) continue;
                const parsed = parseCSharpStringLiteral(text, eq + 1);
                if (parsed && parsed.value != null) {
                    pushMd(normalizeDocMarkdownValue(parsed.value));
                }
            }

            offset += line.length + 1;
            continue;
        }

        // Non-DOCS: capture #region blocks as inline code snippets.
        const regionMatch = trimmed.match(/^#region\s+(.+?)\s*$/i);
        if (regionMatch) {
            const title = regionMatch[1].trim();
            pushCodeRegion(title, codeRegionStack.length + 1);
            offset += line.length + 1;
            continue;
        }

        if (/^#endregion\b/i.test(trimmed)) {
            const sec = codeRegionStack.pop();
            if (sec && !sec.skip) {
                sec.code = dedentLines(sec.lines);
            }
            offset += line.length + 1;
            continue;
        }

        if (codeRegionStack.length) {
            codeRegionStack[codeRegionStack.length - 1].lines.push(line);
        }

        offset += line.length + 1;
    }

    const out = [];
    parts.forEach(part => {
        if (!part) return;
        if (part.type === 'md') {
            out.push(part.content.trimEnd());
            return;
        }
        if (part.type === 'code') {
            const code = String(part.code || '').trimEnd();
            if (!code.trim()) return;
            const hashes = '#'.repeat(Math.min(6, part.depth + 2)); // depth=1 => "###"
            out.push(`${hashes} ${part.title}`.trim() + '\n\n' + '```csharp' + '\n' + code + '\n' + '```');
            return;
        }
    });

    return out.join('\n\n').trim();
}

function extractXmlTag(text, tag) {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const results = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        const raw = match[1];
        const normalized = raw.replace(/\\n/g, '\n').replace(/\\r/g, '');
        results.push(normalized.trim());
    }
    return results;
}

function buildBody(summaryParts, remarksParts) {
    const sections = [];
    const summary = summaryParts.filter(Boolean).join('\n\n').trim();
    const remarks = remarksParts.filter(Boolean).join('\n\n').trim();
    if (summary) sections.push(summary);
    if (remarks) sections.push(remarks);
    return sections.join('\n\n').trim();
}

function parseCsDoc(sourceText, filePath = '') {
    const text = normalizeNewlines(sourceText);
    const attributes = extractAttributes(text);

    if (!attributes.Title) {
        return null;
    }

    const metadata = {};
    Object.keys(attributes).forEach(key => {
        const mapped = ATTRIBUTE_MAP[key];
        let value = attributes[key];
        if (mapped === 'last_updated') {
            value = normalizeDate(value);
        }
        metadata[mapped] = value;
    });

    const titleIndex = text.search(/\[\s*Title\s*\(/);
    const classSearchBase = titleIndex >= 0 ? text.slice(titleIndex) : text;
    const classOffset = classSearchBase.search(/\bclass\b/);
    const classIndex = classOffset >= 0
        ? (titleIndex >= 0 ? titleIndex + classOffset : classOffset)
        : text.length;

    const docLines = [];
    docLines.push(...extractDocLinesBeforeClass(text, classIndex));
    docLines.push(...extractDocLinesFromDocsBlocks(text));

    const docText = docLines.join('\n');
    const summaries = extractXmlTag(docText, 'summary');
    const remarks = extractXmlTag(docText, 'remarks');

    if (!metadata.description && summaries.length > 0) {
        metadata.description = summaries[0].split('\n')[0].trim();
    }

    let body = '';
    const remarksOnly = remarks.filter(Boolean).join('\n\n').trim();
    body = buildInlineBodyFromSource(text).trim();
    if (body) {
        if (remarksOnly) {
            body = body ? (body + '\n\n' + remarksOnly) : remarksOnly;
        }
    } else {
        body = buildBody(summaries, remarks);
    }

    return {
        metadata,
        body,
        sourcePath: filePath,
        sourceText: text
    };
}

function stringifyYamlValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    const text = String(value);
    if (text === '') return '""';
    if (/[:#\n]/.test(text) || /^\s|\s$/.test(text)) {
        return '"' + text.replace(/"/g, '\\"') + '"';
    }
    return text;
}

function generateMarkdown(parsed, sourcePath) {
    if (!parsed || !parsed.metadata || !parsed.metadata.title) return null;
    const metadata = parsed.metadata;
    const lines = ['---'];
    const order = [
        'title',
        'description',
        'author',
        'category',
        'topic',
        'date',
        'difficulty',
        'time',
        'order',
        'tags',
        'last_updated',
        'prev_chapter',
        'next_chapter',
        'hide'
    ];

    const used = new Set();
    order.forEach(key => {
        if (metadata[key] === undefined) return;
        lines.push(`${key}: ${stringifyYamlValue(metadata[key])}`);
        used.add(key);
    });

    Object.keys(metadata).forEach(key => {
        if (used.has(key)) return;
        lines.push(`${key}: ${stringifyYamlValue(metadata[key])}`);
    });

    lines.push('---');
    lines.push('');
    if (parsed.body) {
        lines.push(parsed.body.trim());
        lines.push('');
    }

    if (sourcePath) {
        lines.push(`<!-- generated from: ${sourcePath} -->`);
        lines.push('');
    }

    return lines.join('\n');
}

function dedentLines(lines) {
    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length === 0) return lines.join('\n').trimEnd();
    let prefix = (nonEmpty[0].match(/^[\t ]*/g) || [''])[0] || '';
    for (let i = 1; i < nonEmpty.length && prefix; i++) {
        const w = (nonEmpty[i].match(/^[\t ]*/g) || [''])[0] || '';
        while (prefix && !w.startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    if (!prefix) return lines.join('\n').trimEnd();
    return lines
        .map(l => l.startsWith(prefix) ? l.slice(prefix.length) : l)
        .join('\n')
        .trimEnd();
}

function extractSourceRegions(sourceText) {
    const text = normalizeNewlines(sourceText);
    if (!text) return [];
    const lines = text.split('\n');

    const regions = [];
    const stack = [];
    let docsIfDepth = 0;
    let docsRegionDepth = 0;

    const inDocsBlock = () => docsIfDepth > 0 || docsRegionDepth > 0;

    lines.forEach(line => {
        const trimmed = line.trim();

        // Skip any content inside DOCS-only blocks so it doesn't show up in the "源码" section.
        if (/^#if\b/i.test(trimmed)) {
            if (/^#if\s+DOCS\b/i.test(trimmed)) {
                docsIfDepth = 1;
                return;
            }
            if (docsIfDepth > 0) {
                docsIfDepth += 1;
                return;
            }
        }

        if (/^#endif\b/i.test(trimmed) && docsIfDepth > 0) {
            docsIfDepth -= 1;
            return;
        }

        if (/^#region\b/i.test(trimmed)) {
            if (/^#region\s+DOCS\b/i.test(trimmed)) {
                docsRegionDepth = 1;
                return;
            }
            if (docsRegionDepth > 0) {
                docsRegionDepth += 1;
                return;
            }
        }

        if (/^#endregion\b/i.test(trimmed) && docsRegionDepth > 0) {
            docsRegionDepth -= 1;
            return;
        }
        if (inDocsBlock()) return;

        const regionMatch = trimmed.match(/^#region\s+(.+?)\s*$/i);
        if (regionMatch) {
            const title = regionMatch[1].trim();
            const sec = { depth: stack.length + 1, title, lines: [] };
            regions.push(sec);
            stack.push(sec);
            return;
        }

        if (/^#endregion\b/i.test(trimmed)) {
            stack.pop();
            return;
        }

        if (stack.length) {
            stack[stack.length - 1].lines.push(line);
        }
    });

    return regions
        .map(r => ({
            depth: r.depth,
            title: r.title,
            code: dedentLines(r.lines)
        }))
        .filter(r => r.title && r.code.trim() !== '');
}

function scanFiles(rootDir, matcher) {
    const results = [];
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    entries.forEach(entry => {
        const fullPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            results.push(...scanFiles(fullPath, matcher));
            return;
        }
        if (matcher(entry.name)) {
            results.push(fullPath);
        }
    });
    return results;
}

function runGenerator(options = {}) {
    const rootDir = options.rootDir
        ? path.resolve(options.rootDir)
        : path.resolve(__dirname, '../../content');

    if (!fs.existsSync(rootDir)) {
        console.warn(`cs-docs: root directory not found: ${rootDir}`);
        return;
    }

    const csFiles = scanFiles(rootDir, name => name.endsWith('.cs'));
    const expectedOutputs = new Set();

    csFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const parsed = parseCsDoc(content, relativePath);
        const outputPath = filePath.replace(/\.cs$/i, '.generated.md');

        if (!parsed) {
            return;
        }

        const markdown = generateMarkdown(parsed, relativePath);
        if (!markdown) return;

        expectedOutputs.add(outputPath);

        if (fs.existsSync(outputPath)) {
            const existing = fs.readFileSync(outputPath, 'utf8');
            if (existing === markdown) return;
        }

        fs.writeFileSync(outputPath, markdown, 'utf8');
    });

    const generatedFiles = scanFiles(rootDir, name => name.endsWith('.generated.md'));
    generatedFiles.forEach(filePath => {
        if (!expectedOutputs.has(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
}

module.exports = {
    parseCsDoc,
    generateMarkdown,
    runGenerator
};
