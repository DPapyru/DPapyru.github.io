/* global window, global */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }

    root.FolderFilter = factory();
}(typeof window !== 'undefined' ? window : global, function () {
    'use strict';

    function normalizePath(value) {
        return String(value || '')
            .replace(/\\/g, '/')
            .replace(/^\/+|\/+$/g, '');
    }

    function matchesFolderPath(docPath, folderPath) {
        var normalizedDoc = normalizePath(docPath);
        var normalizedFolder = normalizePath(folderPath);

        if (!normalizedDoc || !normalizedFolder) return false;
        if (normalizedDoc === normalizedFolder) return true;

        return normalizedDoc.indexOf(normalizedFolder + '/') === 0;
    }

    function buildSubfolderEntries(docPaths, basePath) {
        var normalizedBase = normalizePath(basePath);
        var entries = new Map();

        if (!Array.isArray(docPaths)) return [];

        docPaths.forEach(function (docPath) {
            var normalizedDoc = normalizePath(docPath);
            if (!normalizedDoc) return;

            if (normalizedBase) {
                if (normalizedDoc.indexOf(normalizedBase + '/') !== 0) return;
                normalizedDoc = normalizedDoc.slice(normalizedBase.length + 1);
            }

            var parts = normalizedDoc.split('/').filter(Boolean);
            if (parts.length <= 1) return;

            parts.pop();

            var prefix = normalizedBase;
            parts.forEach(function (part) {
                prefix = prefix ? prefix + '/' + part : part;
                if (!entries.has(prefix)) {
                    var label = normalizedBase ? prefix.slice(normalizedBase.length + 1) : prefix;
                    entries.set(prefix, label);
                }
            });
        });

        return Array.from(entries.entries())
            .map(function (entry) {
                return { path: entry[0], label: entry[1] };
            })
            .sort(function (a, b) {
                return a.path.localeCompare(b.path, 'zh-CN');
            });
    }

    function hasSubfolders(docPaths, basePath) {
        return buildSubfolderEntries(docPaths, basePath).length > 0;
    }

    return {
        matchesFolderPath: matchesFolderPath,
        buildSubfolderEntries: buildSubfolderEntries,
        hasSubfolders: hasSubfolders
    };
}));
