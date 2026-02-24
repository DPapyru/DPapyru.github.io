(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedAnimEditorAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderAnimEditor(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const textarea = doc.createElement('textarea');
        textarea.className = 'shared-anim-editor';
        textarea.value = String(opts.value || '');
        return textarea;
    }

    return {
        renderAnimEditor
    };
});
