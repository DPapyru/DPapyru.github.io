'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_GALLERY_ROOT = path.resolve('site/content/shader-gallery');
const DEFAULT_GALLERY_INDEX_OUT = path.resolve('site/assets/shader-gallery/index.json');
const NON_WEBP_IMAGE_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.tif',
    '.tiff',
    '.avif',
    '.heic',
    '.heif'
]);

function toPosix(p) {
    return String(p || '').replace(/\\/g, '/');
}

function writeLine(text) {
    fs.writeSync(1, `${String(text || '')}\n`);
}

function ensureDirForFile(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

function writeJsonFile(filePath, data) {
    ensureDirForFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function normalizeSlug(raw) {
    return String(raw || '').trim().toLowerCase();
}

function isValidSlug(slug) {
    return /^[a-z0-9](?:[a-z0-9-]{0,62})$/.test(String(slug || ''));
}

function isRelativePathLike(p) {
    const raw = String(p || '').trim();
    if (!raw) return false;
    if (path.isAbsolute(raw)) return false;
    if (raw.startsWith('..')) return false;
    return true;
}

function listFilesRecursive(rootDir) {
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
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                queue.push(full);
                continue;
            }
            if (entry.isFile()) out.push(full);
        }
    }
    return out.sort((a, b) => a.localeCompare(b, 'en'));
}

function listEntryFiles(rootDir) {
    return listFilesRecursive(rootDir)
        .filter((filePath) => path.basename(filePath).toLowerCase() === 'entry.json');
}

function collectGalleryEntries(rootDir) {
    const resolvedRoot = path.resolve(rootDir || DEFAULT_GALLERY_ROOT);
    const entries = [];
    const errors = [];

    if (!fs.existsSync(resolvedRoot)) {
        return { rootDir: resolvedRoot, entries, errors };
    }

    const entryFiles = listEntryFiles(resolvedRoot);
    for (const entryFile of entryFiles) {
        const entryDir = path.dirname(entryFile);
        try {
            const entry = readJsonFile(entryFile);
            entries.push({
                entryFile,
                entryDir,
                relEntryDir: toPosix(path.relative(resolvedRoot, entryDir)),
                entry
            });
        } catch (error) {
            errors.push({
                filePath: entryFile,
                message: `entry.json 解析失败: ${String(error && error.message ? error.message : error)}`
            });
        }
    }

    return {
        rootDir: resolvedRoot,
        entries,
        errors
    };
}

function toSitePathIfPossible(absPath) {
    const siteRoot = path.resolve('site');
    const rel = path.relative(siteRoot, absPath);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
        return '/site/' + toPosix(rel);
    }
    return toPosix(path.relative(process.cwd(), absPath));
}

function parseNumericArg(value, fallback) {
    const num = Number(value);
    return isFinite(num) ? num : fallback;
}

module.exports = {
    DEFAULT_GALLERY_ROOT,
    DEFAULT_GALLERY_INDEX_OUT,
    NON_WEBP_IMAGE_EXTENSIONS,
    toPosix,
    writeLine,
    ensureDirForFile,
    readJsonFile,
    writeJsonFile,
    normalizeSlug,
    isValidSlug,
    isRelativePathLike,
    listFilesRecursive,
    listEntryFiles,
    collectGalleryEntries,
    toSitePathIfPossible,
    parseNumericArg
};

