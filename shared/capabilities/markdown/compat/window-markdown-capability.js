(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownCapability = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function resolveModule(requirePath, globalKey) {
        let loaded = null;
        if (typeof require === 'function') {
            try {
                loaded = require(requirePath);
            } catch (_error) {
                loaded = null;
            }
        }
        if (!loaded && root && globalKey && root[globalKey]) {
            loaded = root[globalKey];
        }
        if (loaded && typeof loaded === 'object' && loaded.default && typeof loaded.default === 'object') {
            return loaded.default;
        }
        return loaded;
    }

    const coreApi = resolveModule('../core/index.js', 'SharedMarkdownCapabilityCore') || {};
    const reactApi = resolveModule('../react/use-markdown-pipeline.js', 'SharedMarkdownCapabilityReact') || {};

    return Object.assign(
        {
            core: coreApi,
            react: reactApi
        },
        coreApi,
        reactApi
    );
});
