'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const {
    DEFAULT_GALLERY_ROOT,
    toPosix,
    writeLine,
    normalizeSlug,
    isValidSlug,
    isRelativePathLike,
    collectGalleryEntries,
    parseNumericArg,
    readJsonFile
} = require('./gallery-common');

function printHelp() {
    writeLine([
        'Usage: node site/tooling/scripts/gallery-check.js [--root <dir>] [--max-cover-kb <n>] [--max-edge <n>] [--help]',
        '',
        'Validate shader gallery entries.',
        '',
        'Checks:',
        '- entry.json required fields and valid slug',
        '- shader json exists and contains passes array',
        '- cover must be .webp and within limits (if present)',
        '',
        'Defaults:',
        '- root: site/content/shader-gallery',
        '- max-cover-kb: 300',
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
        maxCoverBytes: 300 * 1024,
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
        if (token === '--max-cover-kb') {
            const kb = parseNumericArg(rest.shift(), 300);
            args.maxCoverBytes = Math.max(1, Math.round(kb * 1024));
            continue;
        }
        if (token === '--max-edge') {
            args.maxEdge = Math.max(64, Math.round(parseNumericArg(rest.shift(), 1280)));
            continue;
        }
    }
    return args;
}

function addError(errors, filePath, message) {
    errors.push({ filePath, message });
}

async function validateCover(entryFile, entryDir, coverRel, args, errors) {
    const coverRaw = String(coverRel || '').trim();
    if (!coverRaw) return;

    if (!isRelativePathLike(coverRaw)) {
        addError(errors, entryFile, `cover 路径非法: ${coverRaw}`);
        return;
    }

    const coverAbs = path.resolve(entryDir, coverRaw);
    if (!coverAbs.startsWith(path.resolve(entryDir))) {
        addError(errors, entryFile, `cover 路径越界: ${coverRaw}`);
        return;
    }

    if (!fs.existsSync(coverAbs) || !fs.statSync(coverAbs).isFile()) {
        addError(errors, entryFile, `cover 文件不存在: ${coverRaw}`);
        return;
    }

    const ext = path.extname(coverAbs).toLowerCase();
    if (ext !== '.webp') {
        addError(errors, entryFile, `cover 必须是 webp: ${coverRaw}`);
    }

    const st = fs.statSync(coverAbs);
    if (st.size > args.maxCoverBytes) {
        addError(errors, entryFile, `cover 体积过大: ${Math.round(st.size / 1024)}KB > ${Math.round(args.maxCoverBytes / 1024)}KB`);
    }

    try {
        const meta = await sharp(coverAbs).metadata();
        const width = Number(meta.width || 0);
        const height = Number(meta.height || 0);
        const longEdge = Math.max(width, height);
        if (longEdge > args.maxEdge) {
            addError(errors, entryFile, `cover 分辨率过大: ${width}x${height}, 最大长边 ${args.maxEdge}`);
        }
    } catch (error) {
        addError(errors, entryFile, `cover 无法读取: ${String(error && error.message ? error.message : error)}`);
    }
}

function validateShaderPayload(entryFile, entryDir, shaderRel, errors) {
    const shaderRaw = String(shaderRel || '').trim();
    if (!shaderRaw) {
        addError(errors, entryFile, '缺少 shader 字段');
        return;
    }
    if (!isRelativePathLike(shaderRaw)) {
        addError(errors, entryFile, `shader 路径非法: ${shaderRaw}`);
        return;
    }
    const shaderAbs = path.resolve(entryDir, shaderRaw);
    if (!shaderAbs.startsWith(path.resolve(entryDir))) {
        addError(errors, entryFile, `shader 路径越界: ${shaderRaw}`);
        return;
    }
    if (!fs.existsSync(shaderAbs) || !fs.statSync(shaderAbs).isFile()) {
        addError(errors, entryFile, `shader 文件不存在: ${shaderRaw}`);
        return;
    }

    let shader = null;
    try {
        shader = readJsonFile(shaderAbs);
    } catch (error) {
        addError(errors, entryFile, `shader json 解析失败: ${String(error && error.message ? error.message : error)}`);
        return;
    }

    if (!shader || !Array.isArray(shader.passes) || shader.passes.length === 0) {
        addError(errors, entryFile, 'shader 结构非法: passes 不能为空');
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printHelp();
        return 0;
    }

    const collected = collectGalleryEntries(args.rootDir);
    const errors = collected.errors.slice();
    const seenSlug = new Set();

    for (const item of collected.entries) {
        const entryFile = item.entryFile;
        const entryDir = item.entryDir;
        const entry = item.entry || {};

        const title = String(entry.title || '').trim();
        const author = String(entry.author || '').trim();
        const description = String(entry.description || '').trim();
        const slug = normalizeSlug(entry.slug || path.basename(entryDir));

        if (!title) addError(errors, entryFile, '缺少 title');
        if (!author) addError(errors, entryFile, '缺少 author');
        if (!description) addError(errors, entryFile, '缺少 description');
        if (!isValidSlug(slug)) {
            addError(errors, entryFile, `slug 非法: ${slug || '<empty>'}`);
        } else if (seenSlug.has(slug)) {
            addError(errors, entryFile, `slug 重复: ${slug}`);
        } else {
            seenSlug.add(slug);
        }

        validateShaderPayload(entryFile, entryDir, entry.shader, errors);
        await validateCover(entryFile, entryDir, entry.cover, args, errors);
    }

    if (errors.length) {
        writeLine(`gallery-check: ${errors.length} error(s)`);
        for (const err of errors) {
            const rel = toPosix(path.relative(process.cwd(), err.filePath));
            writeLine(`- ${rel}: ${err.message}`);
        }
        return 1;
    }

    writeLine(`gallery-check: OK (${collected.entries.length} entries scanned)`);
    return 0;
}

if (require.main === module) {
    main().then((code) => {
        process.exitCode = code;
    }).catch((error) => {
        writeLine(`gallery-check: fatal: ${String(error && error.message ? error.message : error)}`);
        process.exitCode = 1;
    });
}

module.exports = {
    parseArgs,
    main
};

