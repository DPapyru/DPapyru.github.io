(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedPageTreeNavAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function createRoot(documentObj) {
        const ul = documentObj.createElement('ul');
        ul.className = 'shared-page-tree-nav';
        return ul;
    }

    function renderPageTreeNav(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const root = createRoot(doc);
        const docs = Array.isArray(opts.docs) ? opts.docs : [];
        const currentPath = String(opts.currentPath || '');

        docs.forEach(function (item) {
            const li = doc.createElement('li');
            li.className = 'shared-page-tree-item';

            const anchor = doc.createElement('a');
            anchor.className = 'shared-page-tree-link';
            anchor.href = '/site/pages/viewer.html?file=' + encodeURIComponent(String(item.path || ''));
            anchor.textContent = String(item.title || item.fileName || item.path || '未命名文档');

            if (String(item.path || '') === currentPath) {
                anchor.classList.add('active');
            }

            if (typeof opts.onNavigate === 'function') {
                anchor.addEventListener('click', function (event) {
                    opts.onNavigate({ event: event, doc: item });
                });
            }

            li.appendChild(anchor);
            root.appendChild(li);
        });

        return root;
    }

    return {
        renderPageTreeNav
    };
});
