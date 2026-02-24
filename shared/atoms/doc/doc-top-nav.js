(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedDocTopNavAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderDocTopNav(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const nav = doc.createElement('div');
        nav.className = 'shared-doc-top-nav';

        const title = doc.createElement('h2');
        title.className = 'shared-doc-top-nav-title';
        title.textContent = String(opts.title || '文档');
        nav.appendChild(title);

        const actions = doc.createElement('div');
        actions.className = 'shared-doc-top-nav-actions';

        (Array.isArray(opts.actions) ? opts.actions : []).forEach(function (action) {
            const button = doc.createElement(action.href ? 'a' : 'button');
            button.className = 'shared-doc-top-nav-action';
            button.textContent = String(action.label || action.id || '操作');
            if (action.href) {
                button.href = String(action.href);
            } else {
                button.type = 'button';
                if (typeof action.onClick === 'function') {
                    button.addEventListener('click', action.onClick);
                }
            }
            actions.appendChild(button);
        });

        nav.appendChild(actions);
        return nav;
    }

    return {
        renderDocTopNav
    };
});
