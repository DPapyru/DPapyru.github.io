(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedFolderComposition = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function mountFolderShell(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const documentObj = opts.documentObj || (typeof document !== 'undefined' ? document : null);
        if (!documentObj) return { mounted: false };

        const title = documentObj.getElementById('folder-map-title');
        if (title && opts.title) {
            title.textContent = String(opts.title);
        }

        return { mounted: true };
    }

    return {
        mountFolderShell
    };
});
