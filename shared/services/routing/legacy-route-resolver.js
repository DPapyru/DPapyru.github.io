(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedLegacyRouteResolver = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function safeDecode(value) {
        try {
            return decodeURIComponent(String(value || ''));
        } catch (_error) {
            return String(value || '');
        }
    }

    function normalizeSegments(pathValue) {
        const parts = String(pathValue || '').split('/');
        const stack = [];
        for (const partRaw of parts) {
            const part = String(partRaw || '').trim();
            if (!part || part === '.') continue;
            if (part === '..') {
                if (stack.length > 0) stack.pop();
                continue;
            }
            stack.push(part);
        }
        return stack.join('/');
    }

    function normalizeDocPath(rawPath) {
        let pathValue = String(rawPath || '').trim();
        if (!pathValue) return '';

        if (pathValue.indexOf('?file=') >= 0) {
            const queryPart = pathValue.split('?file=')[1] || '';
            pathValue = queryPart.split('&')[0] || '';
        }

        pathValue = safeDecode(pathValue);
        pathValue = pathValue.replace(/\\/g, '/');
        pathValue = pathValue.replace(/^[a-zA-Z]+:\/\//, '');

        const hashIndex = pathValue.indexOf('#');
        if (hashIndex >= 0) pathValue = pathValue.slice(0, hashIndex);

        const queryIndex = pathValue.indexOf('?');
        if (queryIndex >= 0) pathValue = pathValue.slice(0, queryIndex);

        pathValue = pathValue
            .replace(/^\/?site\/content\//i, '')
            .replace(/^\/?content\//i, '')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '');

        pathValue = normalizeSegments(pathValue);
        pathValue = pathValue.replace(/^content\//i, '');
        return pathValue;
    }

    function basename(pathValue) {
        const text = normalizeDocPath(pathValue);
        if (!text) return '';
        const parts = text.split('/');
        return parts[parts.length - 1] || '';
    }

    function buildLookup(allDocs) {
        const lookup = new Map();
        const fileNameIndex = new Map();

        (Array.isArray(allDocs) ? allDocs : []).forEach((doc) => {
            const pathValue = normalizeDocPath(doc && (doc.path || doc.filename));
            if (!pathValue) return;

            const fileName = basename(pathValue);

            lookup.set(pathValue, pathValue);
            lookup.set(pathValue.toLowerCase(), pathValue);
            lookup.set(pathValue.replace(/\.md$/i, ''), pathValue);
            lookup.set(pathValue.replace(/\.md$/i, '').toLowerCase(), pathValue);

            if (doc && doc.filename) {
                const normalizedFilename = normalizeDocPath(doc.filename);
                if (normalizedFilename) {
                    lookup.set(normalizedFilename, pathValue);
                    lookup.set(normalizedFilename.toLowerCase(), pathValue);
                }
            }

            if (fileName) {
                const key = fileName.toLowerCase();
                const list = fileNameIndex.get(key) || [];
                list.push(pathValue);
                fileNameIndex.set(key, list);
            }
        });

        return { lookup, fileNameIndex };
    }

    function resolvePathMapping(pathValue, pathMappings) {
        const mappings = pathMappings && typeof pathMappings === 'object' ? pathMappings : {};
        const normalized = normalizeDocPath(pathValue);
        if (!normalized) return '';

        const direct = mappings[normalized] || mappings[pathValue];
        if (direct) return normalizeDocPath(direct);

        const directNoExt = normalized.replace(/\.md$/i, '');
        if (mappings[directNoExt]) return normalizeDocPath(mappings[directNoExt]);

        return '';
    }

    function resolveViewerFile(rawFile, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const normalized = normalizeDocPath(rawFile);
        const mapped = resolvePathMapping(normalized, opts.pathMappings);
        const { lookup, fileNameIndex } = buildLookup(opts.allDocs);

        if (mapped && lookup.has(mapped)) {
            return { path: lookup.get(mapped), reason: 'path-mapping' };
        }

        if (normalized && lookup.has(normalized)) {
            return { path: lookup.get(normalized), reason: 'exact-match' };
        }

        if (normalized && lookup.has(normalized.toLowerCase())) {
            return { path: lookup.get(normalized.toLowerCase()), reason: 'case-insensitive-match' };
        }

        const fileName = basename(normalized);
        if (fileName) {
            const matches = fileNameIndex.get(fileName.toLowerCase()) || [];
            if (matches.length === 1) {
                return { path: matches[0], reason: 'filename-match' };
            }
        }

        if (mapped) {
            return { path: mapped, reason: 'path-mapping-fallback' };
        }

        return { path: normalized, reason: 'unresolved' };
    }

    function resolveFolderPath(rawPath) {
        return normalizeDocPath(rawPath).replace(/\.md$/i, '');
    }

    function buildViewerHref(pathValue) {
        return '/site/pages/viewer.html?file=' + encodeURIComponent(normalizeDocPath(pathValue));
    }

    function buildFolderHref(pathValue) {
        return '/site/pages/folder.html?path=' + encodeURIComponent(resolveFolderPath(pathValue));
    }

    return {
        normalizeDocPath,
        resolveViewerFile,
        resolveFolderPath,
        buildViewerHref,
        buildFolderHref
    };
});
