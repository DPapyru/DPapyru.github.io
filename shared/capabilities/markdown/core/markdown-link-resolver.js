(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownLinkResolver = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function normalizeRepoPath(pathValue) {
        return String(pathValue || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/^\/+/, '')
            .replace(/\/{2,}/g, '/');
    }

    function normalizeContentRelativePath(pathValue) {
        return normalizeRepoPath(pathValue).replace(/^site\/content\//i, '');
    }

    function splitRepoPathSegments(pathValue) {
        const safe = normalizeRepoPath(pathValue);
        return safe ? safe.split('/').filter(Boolean) : [];
    }

    function dirnameRepoPath(pathValue) {
        const segments = splitRepoPathSegments(pathValue);
        if (!segments.length) return '';
        segments.pop();
        return segments.join('/');
    }

    function normalizePath(pathValue) {
        const segments = splitRepoPathSegments(pathValue);
        const stack = [];
        segments.forEach(function (segment) {
            if (!segment || segment === '.') return;
            if (segment === '..') {
                if (stack.length > 0) stack.pop();
                return;
            }
            stack.push(segment);
        });
        return stack.join('/');
    }

    function splitHrefParts(rawHref) {
        const hrefText = String(rawHref || '');
        const hashIndex = hrefText.indexOf('#');
        const beforeHash = hashIndex >= 0 ? hrefText.slice(0, hashIndex) : hrefText;
        const hash = hashIndex >= 0 ? hrefText.slice(hashIndex) : '';
        const queryIndex = beforeHash.indexOf('?');
        const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
        const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : '';
        return {
            path,
            query,
            hash
        };
    }

    function hasProtocolPrefix(pathValue) {
        return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(String(pathValue || ''));
    }

    function isExternalHref(pathValue) {
        const safe = String(pathValue || '').trim();
        if (!safe) return false;
        return (
            safe.startsWith('#') ||
            safe.startsWith('/') ||
            hasProtocolPrefix(safe)
        );
    }

    function resolveRelativeRepoPath(baseDir, relativePath) {
        const raw = String(relativePath || '').trim();
        if (!raw) return '';
        if (isExternalHref(raw)) return '';

        const relativeSegments = splitRepoPathSegments(raw);
        const resolved = raw.startsWith('/')
            ? []
            : splitRepoPathSegments(baseDir);

        relativeSegments.forEach(function (segment) {
            if (segment === '.') return;
            if (segment === '..') {
                if (resolved.length > 0) resolved.pop();
                return;
            }
            resolved.push(segment);
        });

        return resolved.join('/');
    }

    function resolveRelativeHref(rawHref, currentDocPath) {
        if (!rawHref) return rawHref;
        if (!currentDocPath) return rawHref;

        const hrefText = String(rawHref);
        if (isExternalHref(hrefText)) return rawHref;

        const parts = splitHrefParts(hrefText);
        let decodedPath = parts.path;
        try {
            decodedPath = decodeURIComponent(parts.path);
        } catch (_error) {
            decodedPath = parts.path;
        }

        const baseDir = dirnameRepoPath(normalizeContentRelativePath(currentDocPath));
        if (!baseDir) return rawHref;

        const resolved = normalizePath(resolveRelativeRepoPath(baseDir, decodedPath.replace(/^\.?\//, '')));
        if (!resolved) return rawHref;
        return `${resolved}${parts.query}${parts.hash}`;
    }

    function createDocLinkCandidates(decodedPath, currentDocPath) {
        const candidates = [];
        const safePath = String(decodedPath || '');
        if (safePath) {
            candidates.push(safePath);
            candidates.push(safePath.replace(/\.md$/i, ''));
            if (!safePath.endsWith('.md') && !/\.[A-Za-z0-9]+$/.test(safePath)) {
                candidates.push(`${safePath}.md`);
            }
        }

        if (currentDocPath && safePath && safePath.startsWith('文章使用内容索引/')) {
            const root = String(currentDocPath || '').split('/')[0];
            if (root === 'Modder入门') {
                const anchored = normalizePath(`${root}/${safePath}`);
                candidates.unshift(anchored);
                candidates.unshift(anchored.replace(/\.md$/i, ''));
                if (!anchored.endsWith('.md') && !/\.[A-Za-z0-9]+$/.test(anchored)) {
                    candidates.unshift(`${anchored}.md`);
                }
            }
        }

        if (currentDocPath && safePath) {
            const baseDir = dirnameRepoPath(normalizeContentRelativePath(currentDocPath));
            if (baseDir) {
                const joined = normalizePath(`${baseDir}/${safePath}`);
                candidates.unshift(joined);
                candidates.unshift(joined.replace(/\.md$/i, ''));
                if (!joined.endsWith('.md') && !/\.[A-Za-z0-9]+$/.test(joined)) {
                    candidates.unshift(`${joined}.md`);
                }
            }
        }

        return candidates;
    }

    function lookupDocPath(lookupMap, candidate) {
        if (!lookupMap || !candidate) return null;
        const key = String(candidate);
        const lower = key.toLowerCase();
        if (lookupMap instanceof Map) {
            return lookupMap.get(key) || lookupMap.get(lower) || null;
        }
        if (typeof lookupMap === 'object') {
            return lookupMap[key] || lookupMap[lower] || null;
        }
        return null;
    }

    function resolveDocLinkPathWithLookup(href, currentDocPath, lookupMap) {
        if (!href) return null;
        const hrefText = String(href);
        if (hrefText.startsWith('/') || hasProtocolPrefix(hrefText)) return null;

        let decoded = splitHrefParts(hrefText).path;
        try {
            decoded = decodeURIComponent(decoded);
        } catch (_error) {
            decoded = splitHrefParts(hrefText).path;
        }

        decoded = decoded.replace(/^\.?\//, '').replace(/^docs\//, '');
        const candidates = createDocLinkCandidates(decoded, currentDocPath);
        for (let i = 0; i < candidates.length; i += 1) {
            const hit = lookupDocPath(lookupMap, candidates[i]);
            if (hit) return hit;
        }
        return null;
    }

    function resolveContentPathFromMarkdown(markdownPath, rawPath) {
        const source = splitHrefParts(rawPath).path.trim();
        if (!source) return '';
        if (hasProtocolPrefix(source) || source.startsWith('#')) return '';

        if (/^anims\//i.test(source)) {
            return normalizeContentRelativePath(source);
        }

        const markdownDir = dirnameRepoPath(normalizeContentRelativePath(markdownPath));
        return normalizeContentRelativePath(resolveRelativeRepoPath(markdownDir, source));
    }

    function createMarkdownPathResolver(options) {
        const opts = options || {};
        const sharedLookup = opts.docLookupMap || null;

        return {
            normalizePath,
            normalizeRepoPath,
            normalizeContentRelativePath,
            splitRepoPathSegments,
            dirnameRepoPath,
            isExternalHref,
            resolveRelativeRepoPath,
            resolveRelativeHref,
            resolveContentPathFromMarkdown,
            resolveDocLinkPath(href, currentDocPath, lookupMap) {
                return resolveDocLinkPathWithLookup(href, currentDocPath, lookupMap || sharedLookup);
            }
        };
    }

    return {
        createMarkdownPathResolver,
        normalizePath,
        normalizeRepoPath,
        normalizeContentRelativePath,
        resolveRelativeRepoPath,
        resolveRelativeHref,
        resolveDocLinkPath: resolveDocLinkPathWithLookup,
        resolveContentPathFromMarkdown
    };
});
