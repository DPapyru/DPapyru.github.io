// UMD wrapper: usable in browser (window.MediaZoomUtils) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.MediaZoomUtils = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    function normalizeText(text) {
        return String(text == null ? '' : text);
    }

    function normalizeSvgMarkup(svgMarkup) {
        const raw = normalizeText(svgMarkup).trim();
        if (!raw) return '';
        if (!raw.startsWith('<svg')) return '';

        let normalized = raw;

        if (!/\sxmlns=/.test(normalized.slice(0, 200))) {
            normalized = normalized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        if (normalized.includes('xlink:') && !/\sxmlns:xlink=/.test(normalized.slice(0, 240))) {
            normalized = normalized.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        return normalized;
    }

    function base64EncodeUtf8(text) {
        const raw = normalizeText(text);
        if (!raw) return '';

        if (typeof Buffer !== 'undefined') {
            return Buffer.from(raw, 'utf8').toString('base64');
        }

        // Browser fallback.
        // eslint-disable-next-line no-undef
        return btoa(unescape(encodeURIComponent(raw)));
    }

    function svgMarkupToDataUrl(svgMarkup) {
        const normalized = normalizeSvgMarkup(svgMarkup);
        if (!normalized) return '';

        const base64 = base64EncodeUtf8(normalized);
        if (!base64) return '';

        return `data:image/svg+xml;base64,${base64}`;
    }

    function svgMarkupToObjectUrl(svgMarkup) {
        const normalized = normalizeSvgMarkup(svgMarkup);
        if (!normalized) return '';

        if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
            return '';
        }

        const blob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' });
        return URL.createObjectURL(blob);
    }

    function revokeObjectUrl(url) {
        const raw = normalizeText(url).trim();
        if (!raw) return;
        if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
        URL.revokeObjectURL(raw);
    }

    return {
        normalizeSvgMarkup,
        svgMarkupToDataUrl,
        svgMarkupToObjectUrl,
        revokeObjectUrl
    };
}));
