(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownBlockAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderMarkdownBlock(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const container = doc.createElement('article');
        container.className = 'shared-markdown-block';
        container.innerHTML = String(opts.html || '');
        return container;
    }

    return {
        renderMarkdownBlock
    };
});
