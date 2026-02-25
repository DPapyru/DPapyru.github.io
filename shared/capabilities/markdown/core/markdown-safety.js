(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownSafety = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeMarkedArgs(href, title, text) {
        if (href && typeof href === 'object') {
            return {
                href: href.href,
                title: href.title,
                text: href.text || href.raw || ''
            };
        }
        return {
            href: href,
            title: title,
            text: text
        };
    }

    function isSafeUrl(href) {
        if (!href) return true;
        const trimmed = String(href).trim().toLowerCase();
        return !(
            trimmed.startsWith('javascript:') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('vbscript:')
        );
    }

    function createSafeMarkedRenderer(options) {
        const opts = options || {};
        const markedApi = opts.marked || (typeof globalThis !== 'undefined' ? globalThis.marked : null);
        if (!markedApi || typeof markedApi.Renderer !== 'function') return null;

        const renderer = new markedApi.Renderer();

        renderer.html = function (html) {
            return escapeHtml(html);
        };

        renderer.link = function (href, title, text) {
            const normalized = normalizeMarkedArgs(href, title, text);
            if (!isSafeUrl(normalized.href)) {
                return escapeHtml(normalized.text || '');
            }

            const linkContext = {
                href: String(normalized.href || ''),
                title: normalized.title,
                text: normalized.text || ''
            };

            let resolvedHref = linkContext.href;
            if (typeof opts.resolveLinkHref === 'function') {
                resolvedHref = opts.resolveLinkHref(linkContext);
            }
            if (!resolvedHref) {
                return escapeHtml(linkContext.text || '');
            }

            const linkText = typeof opts.renderLinkText === 'function'
                ? opts.renderLinkText(linkContext)
                : linkContext.text;

            const safeHref = escapeHtml(resolvedHref);
            const safeTitle = linkContext.title ? ` title="${escapeHtml(linkContext.title)}"` : '';
            return `<a href="${safeHref}"${safeTitle}>${linkText || ''}</a>`;
        };

        renderer.image = function (href, title, text) {
            const normalized = normalizeMarkedArgs(href, title, text);
            if (!isSafeUrl(normalized.href)) return '';

            const imageContext = {
                src: String(normalized.href || ''),
                title: normalized.title,
                alt: normalized.text || ''
            };

            let resolvedSrc = imageContext.src;
            if (typeof opts.resolveImageSrc === 'function') {
                resolvedSrc = opts.resolveImageSrc(imageContext);
            }
            if (!resolvedSrc) return '';

            if (typeof opts.renderImage === 'function') {
                return String(opts.renderImage({
                    rawSrc: imageContext.src,
                    src: resolvedSrc,
                    title: imageContext.title,
                    alt: imageContext.alt
                }) || '');
            }

            const safeSrc = escapeHtml(resolvedSrc);
            const safeAlt = escapeHtml(imageContext.alt || '');
            const safeTitle = imageContext.title ? ` title="${escapeHtml(imageContext.title)}"` : '';
            return `<img src="${safeSrc}" alt="${safeAlt}"${safeTitle} />`;
        };

        return renderer;
    }

    return {
        escapeHtml,
        normalizeMarkedArgs,
        isSafeUrl,
        createSafeMarkedRenderer
    };
});
