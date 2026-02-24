(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedArticleOutlineAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderArticleOutline(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const nav = doc.createElement('nav');
        nav.className = 'shared-article-outline';

        const list = doc.createElement('ul');
        list.className = 'shared-article-outline-list';

        const headings = Array.isArray(opts.headings) ? opts.headings : [];
        headings.forEach(function (item) {
            const li = doc.createElement('li');
            li.className = 'shared-article-outline-item level-' + String(item.level || 1);

            const anchor = doc.createElement('a');
            anchor.className = 'shared-article-outline-link';
            anchor.href = '#' + String(item.id || '');
            anchor.textContent = String(item.text || '');

            if (typeof opts.onSelect === 'function') {
                anchor.addEventListener('click', function (event) {
                    opts.onSelect({ event: event, heading: item });
                });
            }

            li.appendChild(anchor);
            list.appendChild(li);
        });

        nav.appendChild(list);
        return nav;
    }

    return {
        renderArticleOutline
    };
});
