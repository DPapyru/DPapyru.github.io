(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownCapabilityCore = api;
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

    const pipelineApi = resolveModule('./create-markdown-pipeline.js', 'SharedMarkdownPipelineCore') || {};
    const linkResolverApi = resolveModule('./markdown-link-resolver.js', 'SharedMarkdownLinkResolver') || {};
    const safetyApi = resolveModule('./markdown-safety.js', 'SharedMarkdownSafety') || {};

    return {
        createMarkdownPipeline: pipelineApi.createMarkdownPipeline,
        createMarkdownPathResolver: linkResolverApi.createMarkdownPathResolver,
        escapeHtml: safetyApi.escapeHtml,
        isSafeUrl: safetyApi.isSafeUrl,
        createSafeMarkedRenderer: safetyApi.createSafeMarkedRenderer,
        normalizeRepoPath: linkResolverApi.normalizeRepoPath,
        normalizeContentRelativePath: linkResolverApi.normalizeContentRelativePath,
        resolveRelativeHref: linkResolverApi.resolveRelativeHref,
        resolveDocLinkPath: linkResolverApi.resolveDocLinkPath,
        resolveContentPathFromMarkdown: linkResolverApi.resolveContentPathFromMarkdown
    };
});
