'use strict';

const path = require('node:path');
const {
    DEFAULT_GALLERY_ROOT,
    DEFAULT_GALLERY_INDEX_OUT,
    toPosix,
    writeLine,
    writeJsonFile,
    readJsonFile,
    normalizeSlug,
    isValidSlug,
    isRelativePathLike,
    collectGalleryEntries,
    toSitePathIfPossible
} = require('./gallery-common');

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/generate-shader-gallery.js [--root <dir>] [--out <file>] [--help]',
        '',
        'Generate static shader gallery index JSON from entry.json files.',
        '',
        'Defaults:',
        '- root: site/content/shader-gallery',
        '- out: site/assets/shader-gallery/index.json',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: Problems found'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = {
        rootDir: DEFAULT_GALLERY_ROOT,
        outFile: DEFAULT_GALLERY_INDEX_OUT,
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

function safeArray(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((x) => String(x || '').trim())
        .filter(Boolean);
}

function resolveRelative(entryDir, relPath) {
    if (!isRelativePathLike(relPath)) return '';
    const abs = path.resolve(entryDir, relPath);
    if (!abs.startsWith(path.resolve(entryDir))) return '';
    return abs;
}

function buildItem(item, errors) {
    const entryFile = item.entryFile;
    const entryDir = item.entryDir;
    const entry = item.entry || {};

    const slug = normalizeSlug(entry.slug || path.basename(entryDir));
    if (!isValidSlug(slug)) {
        errors.push({ filePath: entryFile, message: `slug 非法: ${slug || '<empty>'}` });
        return null;
    }

    const shaderAbs = resolveRelative(entryDir, entry.shader);
    if (!shaderAbs) {
        errors.push({ filePath: entryFile, message: `shader 路径非法: ${String(entry.shader || '')}` });
        return null;
    }

    let shader = null;
    try {
        shader = readJsonFile(shaderAbs);
    } catch (error) {
        errors.push({ filePath: entryFile, message: `shader 文件无法解析: ${String(error && error.message ? error.message : error)}` });
        return null;
    }

    const coverAbs = entry.cover ? resolveRelative(entryDir, entry.cover) : '';
    const title = String(entry.title || '').trim();
    const author = String(entry.author || '').trim();
    const description = String(entry.description || '').trim();
    const tags = safeArray(entry.tags);
    const updatedAt = String(entry.updated_at || entry.last_updated || '').trim();

    return {
        slug,
        title,
        author,
        description,
        tags,
        updated_at: updatedAt,
        cover: coverAbs ? toSitePathIfPossible(coverAbs) : '',
        source: {
            entry: toSitePathIfPossible(entryFile),
            shader: toSitePathIfPossible(shaderAbs)
        },
        payload: shader
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return 0;
    }

    const collected = collectGalleryEntries(args.rootDir);
    const errors = collected.errors.slice();
    const items = [];
    const slugSet = new Set();

    for (const item of collected.entries) {
        const built = buildItem(item, errors);
        if (!built) continue;
        if (slugSet.has(built.slug)) {
            errors.push({ filePath: item.entryFile, message: `slug 重复: ${built.slug}` });
            continue;
        }
        slugSet.add(built.slug);
        items.push(built);
    }

    if (errors.length) {
        writeLine(`generate-shader-gallery: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = toPosix(path.relative(process.cwd(), err.filePath));
            writeLine(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    items.sort((a, b) => {
        const ta = String(a.title || '').toLowerCase();
        const tb = String(b.title || '').toLowerCase();
        return ta.localeCompare(tb, 'en');
    });

    const payload = {
        generated_at: new Date().toISOString(),
        total: items.length,
        items
    };

    writeJsonFile(args.outFile, payload);
    const relOut = toPosix(path.relative(process.cwd(), args.outFile));
    writeLine(`generate-shader-gallery: OK (${items.length} items -> ${relOut})`);
    return 0;
}

if (require.main === module) {
    main().then((code) => {
        process.exitCode = code;
    }).catch((error) => {
        writeLine(`generate-shader-gallery: fatal: ${String(error && error.message ? error.message : error)}`);
        process.exitCode = 1;
    });
}

module.exports = {
    parseArgs,
    main
};

