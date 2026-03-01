(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownEmbedLinks = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const EMBED_PROTOCOL_RE = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/;
    const SUPPORTED_KIND_MAP = Object.freeze({
        cs: 'cs',
        anims: 'anims',
        anim: 'anims',
        fx: 'fx'
    });

    function normalizePath(rawPath) {
        return String(rawPath || '')
            .trim()
            .replace(/\\/g, '/')
            .replace(/\/{2,}/g, '/');
    }

    function parseEmbedHref(rawHref) {
        const href = String(rawHref || '').trim();
        if (!href) return null;
        const match = href.match(EMBED_PROTOCOL_RE);
        if (!match) return null;
        const kindRaw = String(match[1] || '').trim().toLowerCase();
        const targetRaw = String(match[2] || '').trim();
        const kind = SUPPORTED_KIND_MAP[kindRaw] || '';
        if (!kind || !targetRaw) return null;
        return {
            kind,
            target: targetRaw
        };
    }

    function parseStandaloneEmbedLink(lineText) {
        const parsedLink = parseStandaloneMarkdownLink(lineText);
        if (!parsedLink) return null;
        const label = String(parsedLink.label || '').trim();
        const href = String(parsedLink.href || '').trim();

        const parsedHref = parseEmbedHref(href);
        if (!parsedHref) return null;

        return {
            kind: parsedHref.kind,
            label,
            href,
            target: parsedHref.target
        };
    }

    function buildEmbedHref(kind, target) {
        const safeKind = SUPPORTED_KIND_MAP[String(kind || '').trim().toLowerCase()] || '';
        const safeTarget = String(target || '').trim();
        if (!safeKind || !safeTarget) return '';
        return `${safeKind}:${safeTarget}`;
    }

    function buildStandaloneEmbedLink(label, kind, target) {
        const safeLabel = String(label || '').trim();
        const href = buildEmbedHref(kind, target);
        if (!safeLabel || !href) return '';
        return `[${safeLabel}](${href})`;
    }

    function isStandaloneEmbedLine(lineText) {
        return !!parseStandaloneEmbedLink(lineText);
    }

    return {
        parseEmbedHref,
        parseStandaloneEmbedLink,
        buildEmbedHref,
        buildStandaloneEmbedLink,
        isStandaloneEmbedLine,
        normalizePath
    };
});
    function isNewlineChar(ch) {
        return ch === '\n' || ch === '\r';
    }

    function parseStandaloneMarkdownLink(text) {
        const source = String(text || '');
        let index = 0;
        while (index < source.length && /\s/.test(source[index])) index += 1;
        if (source[index] !== '[') return null;
        index += 1;

        const labelStart = index;
        while (index < source.length && source[index] !== ']') {
            if (isNewlineChar(source[index])) return null;
            index += 1;
        }
        if (index >= source.length || source[index] !== ']') return null;
        const label = source.slice(labelStart, index).trim();
        if (!label) return null;
        index += 1;

        while (index < source.length && /\s/.test(source[index])) index += 1;
        if (source[index] !== '(') return null;
        index += 1;

        const hrefStart = index;
        let depth = 1;
        while (index < source.length && depth > 0) {
            const ch = source[index];
            if (isNewlineChar(ch)) return null;
            if (ch === '(') depth += 1;
            if (ch === ')') depth -= 1;
            index += 1;
        }
        if (depth !== 0) return null;

        const href = source.slice(hrefStart, index - 1).trim();
        if (!href) return null;

        while (index < source.length) {
            if (!/\s/.test(source[index])) return null;
            index += 1;
        }

        return {
            label,
            href
        };
    }
