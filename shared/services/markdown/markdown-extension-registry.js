(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownExtensionRegistry = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function normalizeTransform(item) {
        if (!item || typeof item !== 'object') return null;
        if (typeof item.transform !== 'function') return null;
        return {
            name: String(item.name || 'anonymous'),
            transform: item.transform
        };
    }

    function createMarkdownExtensionRegistry(initialTransforms) {
        const transforms = [];

        function registerTransform(name, transformFn) {
            if (typeof transformFn !== 'function') {
                throw new TypeError('transformFn must be a function');
            }
            transforms.push({
                name: String(name || 'anonymous'),
                transform: transformFn
            });
            return api;
        }

        function applyTransforms(markdownText, context) {
            let output = String(markdownText || '');
            transforms.forEach(function (entry) {
                output = String(entry.transform(output, context) || '');
            });
            return output;
        }

        function getTransforms() {
            return transforms.slice();
        }

        const api = {
            registerTransform,
            applyTransforms,
            getTransforms
        };

        (Array.isArray(initialTransforms) ? initialTransforms : []).forEach(function (item) {
            const normalized = normalizeTransform(item);
            if (!normalized) return;
            registerTransform(normalized.name, normalized.transform);
        });

        return api;
    }

    function transformAdmonitionBlocks(markdownText) {
        return String(markdownText || '').replace(
            /:::([a-zA-Z][a-zA-Z0-9_-]*)\n([\s\S]*?)\n:::/g,
            function (_all, typeRaw, bodyRaw) {
                const type = String(typeRaw || 'note').toLowerCase();
                const body = String(bodyRaw || '').trim();
                return '<div class="admonition admonition-' + type + '"><p>' + body + '</p></div>';
            }
        );
    }

    function defaultTransforms() {
        return [
            {
                name: 'admonition',
                transform: transformAdmonitionBlocks
            }
        ];
    }

    return {
        createMarkdownExtensionRegistry,
        defaultTransforms,
        transformAdmonitionBlocks
    };
});
