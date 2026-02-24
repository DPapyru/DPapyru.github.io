(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedCompletionListAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderCompletionList(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const root = doc.createElement('ul');
        root.className = 'shared-completion-list';

        (Array.isArray(opts.items) ? opts.items : []).forEach(function (item) {
            const li = doc.createElement('li');
            li.className = 'shared-completion-item';
            li.textContent = String(item && (item.label || item.insertText || item.id) || '');
            root.appendChild(li);
        });

        return root;
    }

    return {
        renderCompletionList
    };
});
