'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const {
    DEFAULT_GALLERY_ROOT,
    NON_WEBP_IMAGE_EXTENSIONS,
    toPosix,
    writeLine,
    readJsonFile,
    writeJsonFile,
    normalizeSlug,
    isValidSlug,
    isRelativePathLike,
    collectGalleryEntries,
    parseNumericArg
} = require('./gallery-common');

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/gallery-normalize.js [--root <dir>] [--quality <n>] [--max-edge <n>] [--help]',
        '',
        'Normalize gallery covers to cover.webp and rewrite entry.json cover fields.',
        '',
        'Defaults:',
        '- root: site/content/shader-gallery',
        '- quality: 80',
        '- max-edge: 1280',
        '',
        'Exit codes:',
        '- 0: OK',
        '- 1: Problems found'
    ].join('\n'));
}

function parseArgs(argv) {
    const args = {
        rootDir: DEFAULT_GALLERY_ROOT,
        quality: 80,
        maxEdge: 1280,
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
        if (token === '--quality') {
            args.quality = parseNumericArg(rest.shift(), args.quality);
            continue;
        }
        if (token === '--max-edge') {
            args.maxEdge = parseNumericArg(rest.shift(), args.maxEdge);
            continue;
        }
    }
    args.quality = Math.max(1, Math.min(100, Math.round(args.quality)));
    args.maxEdge = Math.max(64, Math.round(args.maxEdge));
    return args;
}

function inferCoverCandidate(entryDir) {
    const candidates = [
        'cover.webp',
        'cover.png',
        'cover.jpg',
        'cover.jpeg',
        'cover.gif'
    ];
    for (const name of candidates) {
        const abs = path.join(entryDir, name);
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return name;
    }
    return '';
}

async function normalizeOne(item, options) {
    const entry = item.entry || {};
    const slug = normalizeSlug(entry.slug || path.basename(item.entryDir));
    if (!isValidSlug(slug)) {
        return {
            ok: false,
            changed: false,
            message: `无效 slug: ${slug || '<empty>'}`
        };
    }

    const coverValueRaw = String(entry.cover || '').trim() || inferCoverCandidate(item.entryDir);
    if (!coverValueRaw) {
        return {
            ok: true,
            changed: false,
            message: 'skip: no cover found'
        };
    }

    if (!isRelativePathLike(coverValueRaw)) {
        return {
            ok: false,
            changed: false,
            message: `cover 路径非法: ${coverValueRaw}`
        };
    }

    const coverAbs = path.resolve(item.entryDir, coverValueRaw);
    if (!coverAbs.startsWith(path.resolve(item.entryDir))) {
        return {
            ok: false,
            changed: false,
            message: `cover 路径越界: ${coverValueRaw}`
        };
    }
    if (!fs.existsSync(coverAbs) || !fs.statSync(coverAbs).isFile()) {
        return {
            ok: false,
            changed: false,
            message: `cover 文件不存在: ${coverValueRaw}`
        };
    }

    const coverWebpAbs = path.join(item.entryDir, 'cover.webp');
    const coverWebpRel = 'cover.webp';
    const ext = path.extname(coverAbs).toLowerCase();
    const shouldConvert = ext !== '.webp' || path.basename(coverAbs) !== 'cover.webp';

    if (shouldConvert || !fs.existsSync(coverWebpAbs)) {
        await sharp(coverAbs)
            .rotate()
            .resize({
                width: options.maxEdge,
                height: options.maxEdge,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: options.quality })
            .toFile(coverWebpAbs);
    }

    if (coverAbs !== coverWebpAbs && NON_WEBP_IMAGE_EXTENSIONS.has(ext)) {
        try {
            fs.unlinkSync(coverAbs);
        } catch (_) { }
    }

    const nextEntry = {
        ...entry,
        slug,
        cover: coverWebpRel
    };

    const before = JSON.stringify(entry);
    const after = JSON.stringify(nextEntry);
    const changed = before !== after;
    if (changed) {
        writeJsonFile(item.entryFile, nextEntry);
    }

    return {
        ok: true,
        changed,
        message: changed
            ? `normalized ${toPosix(path.relative(process.cwd(), item.entryFile))}`
            : `already normalized ${toPosix(path.relative(process.cwd(), item.entryFile))}`
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
    let changedCount = 0;
    let handledCount = 0;

    for (const item of collected.entries) {
        const res = await normalizeOne(item, args);
        handledCount += 1;
        if (!res.ok) {
            errors.push({
                filePath: item.entryFile,
                message: res.message
            });
            continue;
        }
        if (res.changed) changedCount += 1;
    }

    if (errors.length) {
        writeLine(`gallery-normalize: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = toPosix(path.relative(process.cwd(), err.filePath));
            writeLine(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    writeLine(`gallery-normalize: OK (${handledCount} entries, ${changedCount} changed)`);
    return 0;
}

if (require.main === module) {
    main().then((code) => {
        process.exitCode = code;
    }).catch((error) => {
        writeLine(`gallery-normalize: fatal: ${String(error && error.message ? error.message : error)}`);
        process.exitCode = 1;
    });
}

module.exports = {
    main,
    parseArgs
};

