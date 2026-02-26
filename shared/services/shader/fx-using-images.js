(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedFxUsingImages = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SLOT_MIN = 0;
    const SLOT_MAX = 3;
    const USING_LINE_RE = /^\s*\/\/\s*using:img([0-3])\s*=\s*"([^"\n\r]+)"\s*$/gim;

    function normalizePath(pathValue) {
        return String(pathValue || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/\/{2,}/g, '/');
    }

    function dirname(pathValue) {
        const safe = normalizePath(pathValue);
        if (!safe) return '';
        const index = safe.lastIndexOf('/');
        if (index < 0) return '';
        return safe.slice(0, index);
    }

    function joinPath(baseDir, nextPath) {
        const base = normalizePath(baseDir).replace(/^\.\/+/, '');
        const next = normalizePath(nextPath)
            .replace(/^\.\/+/, '')
            .replace(/\/\.\//g, '/');
        if (!next) return base;
        if (next.startsWith('/')) return next.slice(1);
        if (!base) return next;
        return `${base}/${next}`.replace(/\/{2,}/g, '/');
    }

    function toRelativePath(fromDir, toPath) {
        const from = normalizePath(fromDir).split('/').filter(Boolean);
        const to = normalizePath(toPath).split('/').filter(Boolean);
        if (to.length <= 0) return '';

        let i = 0;
        while (i < from.length && i < to.length && from[i] === to[i]) {
            i += 1;
        }
        const up = new Array(Math.max(0, from.length - i)).fill('..');
        const down = to.slice(i);
        const rel = up.concat(down).join('/');
        if (!rel) return './';
        return rel.startsWith('.') ? rel : `./${rel}`;
    }

    function parseUsingImageDirectives(sourceText) {
        const source = String(sourceText || '');
        const entries = [];
        let match = null;
        while ((match = USING_LINE_RE.exec(source)) !== null) {
            const slot = Number(match[1]);
            const path = normalizePath(match[2]);
            if (!Number.isInteger(slot) || slot < SLOT_MIN || slot > SLOT_MAX) continue;
            if (!path) continue;
            entries.push({
                slot,
                path,
                line: match[0]
            });
        }
        return entries;
    }

    function usingMapFromSource(sourceText) {
        const map = {};
        parseUsingImageDirectives(sourceText).forEach((entry) => {
            map[entry.slot] = entry.path;
        });
        return map;
    }

    function firstEmptySlot(usingMap) {
        const map = usingMap && typeof usingMap === 'object' ? usingMap : {};
        for (let i = SLOT_MIN; i <= SLOT_MAX; i += 1) {
            if (!map[i]) return i;
        }
        return -1;
    }

    function buildUsingLine(slotIndex, relativePath) {
        const slot = Number(slotIndex);
        if (!Number.isInteger(slot) || slot < SLOT_MIN || slot > SLOT_MAX) return '';
        const safePath = normalizePath(relativePath);
        if (!safePath) return '';
        return `// using:img${slot}="${safePath}"`;
    }

    function upsertUsingLine(sourceText, slotIndex, relativePath) {
        const slot = Number(slotIndex);
        const safePath = normalizePath(relativePath);
        const source = String(sourceText || '');
        if (!Number.isInteger(slot) || slot < SLOT_MIN || slot > SLOT_MAX || !safePath) {
            return source;
        }

        const lineText = buildUsingLine(slot, safePath);
        const singleRe = new RegExp(`^\\s*\\/\\/\\s*using:img${slot}\\s*=\\s*\"([^\"\\n\\r]+)\"\\s*$`, 'im');
        if (singleRe.test(source)) {
            return source.replace(singleRe, lineText);
        }

        if (!source.trim()) {
            return `${lineText}\n`;
        }
        return `${lineText}\n${source}`;
    }

    function resolveUsingPathToRepoPath(fxRepoPath, usingPath) {
        const fxPath = normalizePath(fxRepoPath);
        const raw = normalizePath(usingPath);
        if (!fxPath || !raw) return '';
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return '';
        if (raw.startsWith('/')) return raw.replace(/^\/+/, '');
        const baseDir = dirname(fxPath);
        return joinPath(baseDir, raw).replace(/^\/+/, '');
    }

    function makeUsingPathFromImageRepoPath(fxRepoPath, imageRepoPath) {
        const fxPath = normalizePath(fxRepoPath);
        const imagePath = normalizePath(imageRepoPath);
        if (!fxPath || !imagePath) return '';
        const baseDir = dirname(fxPath);
        return toRelativePath(baseDir, imagePath);
    }

    return {
        SLOT_MIN,
        SLOT_MAX,
        parseUsingImageDirectives,
        usingMapFromSource,
        firstEmptySlot,
        buildUsingLine,
        upsertUsingLine,
        resolveUsingPathToRepoPath,
        makeUsingPathFromImageRepoPath,
        normalizePath
    };
});
