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

    const STANDALONE_LINK_RE = /^\s*\[([^\]\n\r]+)\]\(([^)\n\r]+)\)\s*$/;
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
        const text = String(lineText || '');
        const match = text.match(STANDALONE_LINK_RE);
        if (!match) return null;

        const label = String(match[1] || '').trim();
        const href = String(match[2] || '').trim();
        if (!label || !href) return null;

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
