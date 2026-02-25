(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownCapabilityReact = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function resolveReactApi() {
        if (root && root.React) return root.React;
        if (typeof require === 'function') {
            try {
                return require('react');
            } catch (_error) {
                return null;
            }
        }
        return null;
    }

    function resolveCoreApi() {
        if (root && root.SharedMarkdownCapabilityCore) {
            return root.SharedMarkdownCapabilityCore;
        }
        if (typeof require === 'function') {
            try {
                return require('../core/index.js');
            } catch (_error) {
                return null;
            }
        }
        return null;
    }

    function useMarkdownPipeline(params) {
        const reactApi = resolveReactApi();
        if (!reactApi || typeof reactApi.useMemo !== 'function' || typeof reactApi.useEffect !== 'function') {
            throw new Error('useMarkdownPipeline requires React hooks');
        }

        const coreApi = resolveCoreApi();
        if (!coreApi || typeof coreApi.createMarkdownPipeline !== 'function') {
            throw new Error('useMarkdownPipeline requires createMarkdownPipeline');
        }

        const options = params && typeof params === 'object' ? params : {};
        const deps = Array.isArray(options.deps)
            ? options.deps
            : [
                options.marked,
                options.resolveLinkHref,
                options.resolveImageSrc,
                options.renderLinkText,
                options.renderImage
            ];

        const pipeline = reactApi.useMemo(function () {
            return coreApi.createMarkdownPipeline(options);
        }, deps);

        reactApi.useEffect(function () {
            return function () {
                if (pipeline && typeof pipeline.dispose === 'function') {
                    pipeline.dispose();
                }
            };
        }, [pipeline]);

        return pipeline;
    }

    return {
        useMarkdownPipeline
    };
});
