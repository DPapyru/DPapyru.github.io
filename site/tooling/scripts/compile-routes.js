'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileRoutes } = require('./route-v2');

function writeLine(text) {
    const line = String(text || '');
    fs.writeSync(1, `${line}\n`);
}

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/compile-routes.js [--root <dir>] [--out <file>] [--help]',
        '',
        'Compile *.route.json to route-manifest.json for viewer runtime.',
        '',
        'Defaults:',
        '- root: site/content/routes',
        '- out:  site/assets/route-manifest.json',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: compile failed'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = {
        rootDir: path.resolve('site/content/routes'),
        outFile: path.resolve('site/assets/route-manifest.json'),
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
        if (token === '--out') {
            const value = rest.shift();
            if (value) args.outFile = path.resolve(value);
            continue;
        }
    }

    return args;
}

function ensureDirForFile(filePath) {
    const dirPath = path.dirname(filePath);
    fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return 0;
    }

    const result = compileRoutes({ rootDir: args.rootDir });
    if (result.errors.length) {
        writeLine(`compile-routes: ${result.errors.length} error(s)`);
        for (const err of result.errors) {
            const rel = path.relative(process.cwd(), err.filePath).replace(/\\/g, '/');
            writeLine(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    ensureDirForFile(args.outFile);
    fs.writeFileSync(args.outFile, JSON.stringify(result.manifest, null, 2) + '\n', 'utf8');

    const relOut = path.relative(process.cwd(), args.outFile).replace(/\\/g, '/');
    writeLine(`compile-routes: OK (${result.files.length} files -> ${relOut})`);
    return 0;
}

if (require.main === module) {
    process.exitCode = main();
}

module.exports = {
    main,
    parseArgs
};
