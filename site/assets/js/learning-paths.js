/* global window, global */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }

    root.LearningPaths = factory();
}(typeof window !== 'undefined' ? window : global, function () {
    'use strict';

    var DEFAULT_OPTIONS = {
        isStrict: false
    };

    function normalizePath(value) {
        return String(value || '')
            .replace(/\\/g, '/')
            .replace(/^\/+|\/+$/g, '');
    }

    function mergeOptions(options) {
        return Object.assign({}, DEFAULT_OPTIONS, options || {});
    }

    function selectRule(pathRules, docPath) {
        if (!pathRules) return null;

        var normalizedPath = normalizePath(docPath);
        if (!normalizedPath) return null;

        return pathRules[normalizedPath] || pathRules[String(normalizedPath).toLowerCase()] || null;
    }

    function filterDocsByPathRules(docs, pathRules, options) {
        var opts = mergeOptions(options);
        var visible = [];
        var counts = {
            mapped: 0,
            unmapped: 0
        };

        (docs || []).forEach(function (doc) {
            var docPath = doc && (doc.path || doc.filename);
            var rule = selectRule(pathRules, docPath);

            if (!rule) {
                counts.unmapped += 1;
                visible.push(doc);
                return;
            }

            counts.mapped += 1;
            if (opts.isStrict && rule.visible === false) return;
            visible.push(doc);
        });

        return {
            visible: visible,
            counts: counts,
            isStrict: !!opts.isStrict
        };
    }

    return {
        normalizePath: normalizePath,
        filterDocsByPathRules: filterDocsByPathRules
    };
}));
