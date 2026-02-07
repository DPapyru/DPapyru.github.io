'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileRoutes } = require('./route-v2');

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

function hasExplicitNullKey(frontMatterText, key) {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*null\\s*$`, 'im');
    return re.test(String(frontMatterText || ''));
}

function hasExplicitTrueKey(frontMatterText, key) {
    const re = new RegExp(`^\\s*${key}\\s*:\\s*true\\s*$`, 'im');
    return re.test(String(frontMatterText || ''));
}

function stripFrontMatter(text) {
    const s = String(text || '');
    const m = s.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!m) return s;
    return s.slice(m[0].length);
}

function hasRoutingAssertion(bodyText, profileLabel) {
    const normalized = String(profileLabel || '').replace('/', '\\s*\\/\\s*');
    const re = new RegExp(`^\\s*(?:[-*]|\\d+\\.)\\s*${normalized}\\s*[：:]`, 'im');
    return re.test(String(bodyText || ''));
}

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/check-content.js [--root <dir>] [--routes <dir>] [--help]',
        '',
        'Checks:',
        '- Disallow prev_chapter: null / next_chapter: null (use empty value or omit key)',
        '- If routing_manual: true, require 3 assertions (C0/T0, C1/T1, C2/T2)',
        '- Validate route v2 files (*.route.json): fallback/targets/path coverage',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: Problems found'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = {
        rootDir: path.resolve('site/content'),
        routesDir: path.resolve('site/content/routes'),
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
        if (token === '--routes') {
            const value = rest.shift();
            if (value) args.routesDir = path.resolve(value);
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

        if (hasExplicitTrueKey(fm, 'routing_manual')) {
            const body = stripFrontMatter(raw);
            const requiredProfiles = ['C0/T0', 'C1/T1', 'C2/T2'];
            const missingProfiles = requiredProfiles.filter(function (label) {
                return !hasRoutingAssertion(body, label);
            });

            if (missingProfiles.length) {
                errors.push({
                    filePath,
                    message: 'routing_manual: true 但缺少分流断言：' + missingProfiles.join(', ')
                });
            }
        }
    }

    const routeResult = compileRoutes({ rootDir: args.routesDir });
    for (const err of routeResult.errors) {
        errors.push({
            filePath: err.filePath,
            message: `route 校验失败: ${err.message}`
        });
    }

    if (errors.length) {
        writeLine(`check-content: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = path.relative(process.cwd(), err.filePath).replace(/\\/g, '/');
            writeLine(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    writeLine(`check-content: OK (${files.length} files scanned)`);
    return 0;
}

process.exitCode = main();

