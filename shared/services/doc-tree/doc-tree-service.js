(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedDocTreeService = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function normalizePath(pathValue) {
        return String(pathValue || '')
            .replace(/\\/g, '/')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '')
            .trim();
    }

    function compareDocs(a, b) {
        const orderA = Number.isFinite(Number(a && a.order)) ? Number(a.order) : 999;
        const orderB = Number.isFinite(Number(b && b.order)) ? Number(b.order) : 999;
        if (orderA !== orderB) return orderA - orderB;

        const titleA = String((a && (a.title || a.path || a.filename)) || '');
        const titleB = String((b && (b.title || b.path || b.filename)) || '');
        return titleA.localeCompare(titleB, 'zh-CN');
    }

    function createNode(name, pathValue) {
        return {
            type: 'folder',
            name: String(name || ''),
            path: String(pathValue || ''),
            children: {},
            folders: [],
            docs: []
        };
    }

    function ensureChild(parent, folderName) {
        if (!parent.children[folderName]) {
            const nextPath = parent.path ? parent.path + '/' + folderName : folderName;
            const child = createNode(folderName, nextPath);
            parent.children[folderName] = child;
            parent.folders.push(child);
        }
        return parent.children[folderName];
    }

    function sortNode(node) {
        node.folders.sort(function (a, b) {
            return a.name.localeCompare(b.name, 'zh-CN');
        });
        node.docs.sort(compareDocs);
        node.folders.forEach(sortNode);
    }

    function buildDocTree(docsInput) {
        const docs = Array.isArray(docsInput) ? docsInput : [];
        const root = createNode('', '');

        docs.forEach(function (doc) {
            const docPath = normalizePath(doc && (doc.path || doc.filename));
            if (!docPath) return;

            const segments = docPath.split('/').filter(Boolean);
            if (!segments.length) return;

            const fileName = segments.pop();
            let cursor = root;
            segments.forEach(function (folderName) {
                cursor = ensureChild(cursor, folderName);
            });

            cursor.docs.push(Object.assign({}, doc, {
                path: docPath,
                fileName: fileName
            }));
        });

        sortNode(root);
        return root;
    }

    function findNodeByFolderPath(root, folderPath) {
        const normalizedFolderPath = normalizePath(folderPath);
        if (!normalizedFolderPath) return root;

        const segments = normalizedFolderPath.split('/').filter(Boolean);
        let cursor = root;
        for (const folderName of segments) {
            if (!cursor.children[folderName]) return null;
            cursor = cursor.children[folderName];
        }
        return cursor;
    }

    function collectDocs(node, output) {
        node.docs.forEach(function (doc) {
            output.push(doc);
        });
        node.folders.forEach(function (folderNode) {
            collectDocs(folderNode, output);
        });
    }

    function flattenVisibleDocs(root, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const scope = String(opts.scope || 'all').trim().toLowerCase();
        const anchorNode = scope === 'folder'
            ? findNodeByFolderPath(root, opts.folderPath || '')
            : root;
        if (!anchorNode) return [];

        const output = [];
        collectDocs(anchorNode, output);
        return output;
    }

    function findDocNeighbors(root, currentPath, options) {
        const docs = flattenVisibleDocs(root, options);
        const normalizedCurrentPath = normalizePath(currentPath);
        const index = docs.findIndex(function (doc) {
            return normalizePath(doc.path) === normalizedCurrentPath;
        });
        if (index < 0) {
            return { previous: null, next: null };
        }

        return {
            previous: index > 0 ? docs[index - 1] : null,
            next: index + 1 < docs.length ? docs[index + 1] : null
        };
    }

    return {
        normalizePath,
        buildDocTree,
        flattenVisibleDocs,
        findDocNeighbors
    };
});
