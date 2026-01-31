'use strict';

const fs = require('node:fs');
const path = require('node:path');

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

function hasExplicitNullKey(frontMatterText, key) {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*null\\s*$`, 'im');
    return re.test(String(frontMatterText || ''));
}

function printHelp() {
    console.log([
        'Usage: node site/tooling/scripts/check-content.js [--root <dir>] [--help]',
        '',
        'Checks:',
        '- Disallow prev_chapter: null / next_chapter: null (use empty value or omit key)',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: Problems found'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = { rootDir: path.resolve('site/content'), help: false };
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

    for (const filePath of files) {
        let raw = '';
        try {
            raw = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            errors.push({ filePath, message: `无法读取文件: ${String(e && e.message ? e.message : e)}` });
            continue;
        }

        const fm = extractFrontMatter(raw);
        if (!fm) continue;

        if (hasExplicitNullKey(fm, 'prev_chapter')) {
            errors.push({ filePath, message: 'prev_chapter: null' });
        }
        if (hasExplicitNullKey(fm, 'next_chapter')) {
            errors.push({ filePath, message: 'next_chapter: null' });
        }
    }

    if (errors.length) {
        console.log(`check-content: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = path.relative(process.cwd(), err.filePath).replace(/\\/g, '/');
            console.log(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    console.log(`check-content: OK (${files.length} files scanned)`);
    return 0;
}

process.exitCode = main();

