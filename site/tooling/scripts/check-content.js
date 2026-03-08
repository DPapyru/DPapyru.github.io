'use strict';

const fs = require('node:fs');
const path = require('node:path');

function writeLine(text) {
    const line = String(text || '');
    fs.writeSync(1, `${line}\n`);
}

function listMarkdownFiles(rootDir) {
    const out = [];
    const queue = [rootDir];

    while (queue.length) {
        const current = queue.pop();
        let entries = [];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch (_) {
            continue;
        }

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                queue.push(fullPath);
                continue;
            }
            if (!entry.isFile()) continue;
            if (!entry.name.toLowerCase().endsWith('.md')) continue;
            out.push(fullPath);
        }
    }

    return out.sort((a, b) => a.localeCompare(b, 'en'));
}

function extractFrontMatter(text) {
    const s = String(text || '');
    const m = s.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    return m ? String(m[1] || '') : '';
}

function parseInlineArray(text) {
    const raw = String(text || '').trim();
    if (!raw.startsWith('[') || !raw.endsWith(']')) return null;
    const body = raw.slice(1, -1).trim();
    if (!body) return [];
    return body.split(',').map((part) => String(part || '').trim()).filter(Boolean);
}

function stripWrappingQuotes(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
        return raw.slice(1, -1).trim();
    }
    return raw;
}

function extractPrefixEntries(frontMatterText) {
    const lines = String(frontMatterText || '').replace(/\r\n/g, '\n').split('\n');
    for (let i = 0; i < lines.length; i += 1) {
        const line = String(lines[i] || '');
        const match = line.match(/^\s*prefix\s*:\s*(.*)$/);
        if (!match) continue;

        const tail = String(match[1] || '').trim();
        if (tail) {
            const inline = parseInlineArray(tail);
            if (!inline) return { entries: null, formatError: 'prefix 必须是数组' };
            return { entries: inline, formatError: '' };
        }

        const entries = [];
        for (let j = i + 1; j < lines.length; j += 1) {
            const blockLine = String(lines[j] || '');
            if (!blockLine.trim()) continue;
            if (!/^\s{2,}-\s+/.test(blockLine)) break;
            entries.push(blockLine.replace(/^\s*-\s+/, '').trim());
            i = j;
        }
        return { entries, formatError: '' };
    }
    return { entries: null, formatError: '' };
}

function validatePrefixEntry(entryText) {
    const raw = stripWrappingQuotes(entryText);
    if (!raw) return 'prefix 项不能为空';
    const match = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return 'prefix 项必须是 Markdown 链接字符串，如 "[标题](路径.md)"';

    const label = String(match[1] || '').trim();
    const href = String(match[2] || '').trim().replace(/\\/g, '/');
    if (!label) return 'prefix 链接文本不能为空';
    if (!href) return 'prefix 链接路径不能为空';
    if (!/\.md$/i.test(href)) return 'prefix 链接路径必须以 .md 结尾';
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
        return 'prefix 路径必须相对 site/content 根目录，不允许 ./ ../ 或绝对路径';
    }
    if (/(^|\/)\.\.(\/|$)/.test(href)) {
        return 'prefix 路径不允许包含 ..';
    }

    return '';
}

function getFrontMatterScalar(frontMatterText, key) {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`, 'im');
    const m = String(frontMatterText || '').match(re);
    if (!m) return '';
    return String(m[1] || '').trim();
}

function isMissingScalar(value) {
    const v = String(value || '').trim();
    if (!v) return true;
    if (v === "''" || v === '""') return true;
    if (/^null$/i.test(v)) return true;
    return false;
}

function parseStandaloneProtocolEmbedLine(lineText) {
    const source = String(lineText || '');
    const text = source.trim();
    if (!text || text[0] !== '[') return null;

    let index = 1;
    const labelStart = index;
    while (index < text.length && text[index] !== ']') {
        if (text[index] === '\n' || text[index] === '\r') return null;
        index += 1;
    }
    if (index >= text.length || text[index] !== ']') return null;
    const label = text.slice(labelStart, index).trim();
    if (!label) return null;
    index += 1;

    while (index < text.length && /\s/.test(text[index])) index += 1;
    if (text[index] !== '(') return null;
    index += 1;

    const hrefStart = index;
    let depth = 1;
    while (index < text.length && depth > 0) {
        const ch = text[index];
        if (ch === '\n' || ch === '\r') return null;
        if (ch === '(') depth += 1;
        if (ch === ')') depth -= 1;
        index += 1;
    }
    if (depth !== 0) return null;

    const href = text.slice(hrefStart, index - 1).trim();
    if (!href) return null;
    if (index !== text.length && text.slice(index).trim()) return null;

    const protocolMatch = href.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/);
    if (!protocolMatch) return null;
    const kindRaw = String(protocolMatch[1] || '').trim().toLowerCase();
    const kind = kindRaw === 'anim' ? 'anims' : kindRaw;
    const target = String(protocolMatch[2] || '').trim();
    if (!target) return null;
    if (kind !== 'cs' && kind !== 'anims' && kind !== 'fx') return null;

    return {
        kind,
        label,
        href,
        target
    };
}

function lineContainsProtocolEmbedLink(lineText) {
    return /\[[^\]\n\r]+\]\((?:cs|anims|anim|fx):/i.test(String(lineText || ''));
}

function stripInlineCodeSpans(lineText) {
    return String(lineText || '').replace(/(`+)([^`]*?)\1/g, '');
}

function parseFenceMarker(lineText) {
    const trimmed = String(lineText || '').trim();
    const m = trimmed.match(/^(`{3,}|~{3,})/);
    if (!m) return null;
    return {
        char: m[1][0],
        length: m[1].length
    };
}

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/check-content.js [--root <dir>] [--help]',
        '',
        'Checks:',
        '- Require YAML front matter',
        '- Require title in YAML front matter',
        '- Validate prefix metadata as markdown-link array with .md paths under site/content root',
        '- Disallow legacy embed syntax {{cs:...}}/{{anim:...}}/{{ref:...}}',
        '- Disallow empty markdown links []() and [text]()',
        '- Warn protocol embed links not on standalone line',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: Problems found'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = {
        rootDir: path.resolve('site/content'),
        help: false
    };
    const rest = Array.isArray(argv) ? argv.slice() : [];
    while (rest.length) {
        const token = rest.shift();
        if (token === '--help' || token === '-h') {
            args.help = true;
            continue;
        }
        if (token === '--root') {
            const value = rest.shift();
            if (value) args.rootDir = path.resolve(value);
            continue;
        }
    }
    return args;
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return 0;
    }

    const rootDir = args.rootDir;
    const files = listMarkdownFiles(rootDir);
    const errors = [];
    const warnings = [];

    for (const filePath of files) {
        let raw = '';
        try {
            raw = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            errors.push({ filePath, message: `无法读取文件: ${String(e && e.message ? e.message : e)}` });
            continue;
        }

        const fm = extractFrontMatter(raw);
        if (!fm) {
            errors.push({ filePath, message: '缺少 YAML front matter' });
            continue;
        }

        if (isMissingScalar(getFrontMatterScalar(fm, 'title'))) {
            errors.push({ filePath, message: '缺少 title' });
        }

        const prefixMeta = extractPrefixEntries(fm);
        if (prefixMeta.formatError) {
            errors.push({ filePath, message: prefixMeta.formatError });
        } else if (Array.isArray(prefixMeta.entries)) {
            prefixMeta.entries.forEach((entry) => {
                const reason = validatePrefixEntry(entry);
                if (reason) {
                    errors.push({ filePath, message: reason });
                }
            });
        }

        if (/\{\{(?:cs|anim|ref):/i.test(raw)) {
            errors.push({ filePath, message: '检测到旧语法 {{cs:...}}/{{anim:...}}/{{ref:...}}' });
        }
        if (/\[\s*]\(\s*\)/.test(raw)) {
            errors.push({ filePath, message: '检测到空链接 []()' });
        }
        if (/\[[^\]\n\r]+\]\(\s*\)/.test(raw)) {
            errors.push({ filePath, message: '检测到空目标链接 [文本]()' });
        }

        const lines = String(raw || '').replace(/\r\n/g, '\n').split('\n');
        let activeFence = null;
        lines.forEach((line, idx) => {
            const fence = parseFenceMarker(line);
            if (fence) {
                if (!activeFence) {
                    activeFence = fence;
                } else if (activeFence.char === fence.char && fence.length >= activeFence.length) {
                    activeFence = null;
                }
                return;
            }
            if (activeFence) return;

            const normalizedLine = stripInlineCodeSpans(line);
            if (!lineContainsProtocolEmbedLink(normalizedLine)) return;
            if (parseStandaloneProtocolEmbedLine(normalizedLine)) return;
            warnings.push({
                filePath,
                lineNumber: idx + 1,
                message: '协议链接未独占一行，嵌入不会触发'
            });
        });
    }

    if (errors.length) {
        writeLine(`check-content: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = path.relative(process.cwd(), err.filePath).replace(/\\/g, '/');
            writeLine(`- ${rel}: ${err.message}`);
        }
        if (warnings.length) {
            writeLine(`check-content: ${warnings.length} warning(s)`);
            for (const warn of warnings) {
                const rel = path.relative(process.cwd(), warn.filePath).replace(/\\/g, '/');
                writeLine(`- ${rel}:${warn.lineNumber}: ${warn.message}`);
            }
        }
        return 1;
    }

    if (warnings.length) {
        writeLine(`check-content: ${warnings.length} warning(s)`);
        for (const warn of warnings) {
            const rel = path.relative(process.cwd(), warn.filePath).replace(/\\/g, '/');
            writeLine(`- ${rel}:${warn.lineNumber}: ${warn.message}`);
        }
    }

    writeLine(`check-content: OK (${files.length} files scanned)`);
    return 0;
}

process.exitCode = main();
