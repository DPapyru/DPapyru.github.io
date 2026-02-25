(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedMarkdownPipelineCore = api;
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

    function createFallbackRegistry(initialTransforms) {
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
            if (!item || typeof item !== 'object') return;
            if (typeof item.transform !== 'function') return;
            registerTransform(item.name, item.transform);
        });

        return api;
    }

    function createMarkdownPipeline(options) {
        const opts = options || {};
        const extensionRegistryApi = resolveModule('../../../services/markdown/markdown-extension-registry.js', 'SharedMarkdownExtensionRegistry') || {};
        const safetyApi = resolveModule('./markdown-safety.js', 'SharedMarkdownSafety') || {};

        const createRegistry = typeof extensionRegistryApi.createMarkdownExtensionRegistry === 'function'
            ? extensionRegistryApi.createMarkdownExtensionRegistry
            : createFallbackRegistry;
        const defaultTransforms = typeof extensionRegistryApi.defaultTransforms === 'function'
            ? extensionRegistryApi.defaultTransforms
            : function () { return []; };

        const markedApi = opts.marked || (root && root.marked) || null;
        const escapeHtml = typeof safetyApi.escapeHtml === 'function'
            ? safetyApi.escapeHtml
            : function (value) { return String(value || ''); };
        const createSafeMarkedRenderer = typeof safetyApi.createSafeMarkedRenderer === 'function'
            ? safetyApi.createSafeMarkedRenderer
            : function () { return null; };

        const initialTransforms = Array.isArray(opts.initialTransforms)
            ? opts.initialTransforms
            : defaultTransforms();

        const registry = createRegistry(initialTransforms);
        const renderer = createSafeMarkedRenderer({
            marked: markedApi,
            resolveLinkHref: opts.resolveLinkHref,
            resolveImageSrc: opts.resolveImageSrc,
            renderLinkText: opts.renderLinkText,
            renderImage: opts.renderImage
        });

        const state = {
            disposed: false,
            markedAvailable: !!(markedApi && typeof markedApi.parse === 'function'),
            transformNames: typeof registry.getTransforms === 'function'
                ? registry.getTransforms().map(function (item) { return item.name; })
                : [],
            lastInput: '',
            lastTransformed: '',
            lastOutput: ''
        };

        const markedOptions = Object.assign({
            renderer: renderer || undefined,
            highlight: function (code) {
                return String(code || '');
            },
            breaks: true,
            gfm: true,
            tables: true,
            smartLists: true,
            smartypants: true,
            mangle: true,
            headerIds: true,
            xhtml: false,
            pedantic: false
        }, opts.markedOptions || {});

        if (markedApi && typeof markedApi.setOptions === 'function') {
            markedApi.setOptions(markedOptions);
        }

        function syncTransformNames() {
            state.transformNames = typeof registry.getTransforms === 'function'
                ? registry.getTransforms().map(function (item) { return item.name; })
                : [];
        }

        function registerTransform(name, transformFn) {
            registry.registerTransform(name, transformFn);
            syncTransformNames();
            return api;
        }

        function render(markdownText, context) {
            const source = String(markdownText || '');
            state.lastInput = source;

            let transformed = source;
            try {
                transformed = registry.applyTransforms(source, context);
            } catch (error) {
                if (typeof opts.onError === 'function') {
                    opts.onError(error, {
                        phase: 'transform',
                        source: source
                    });
                }
            }
            state.lastTransformed = String(transformed || '');

            if (markedApi && typeof markedApi.parse === 'function') {
                try {
                    const html = String(markedApi.parse(state.lastTransformed));
                    state.lastOutput = html;
                    return html;
                } catch (error) {
                    if (typeof opts.onError === 'function') {
                        opts.onError(error, {
                            phase: 'parse',
                            source: state.lastTransformed
                        });
                    }
                }
            }

            const fallback = escapeHtml(state.lastTransformed);
            state.lastOutput = fallback;
            return fallback;
        }

        function getState() {
            return {
                disposed: state.disposed,
                markedAvailable: state.markedAvailable,
                transformNames: state.transformNames.slice(),
                lastInput: state.lastInput,
                lastTransformed: state.lastTransformed,
                lastOutput: state.lastOutput
            };
        }

        function dispose() {
            state.disposed = true;
        }

        const api = {
            render,
            registerTransform,
            getState,
            dispose
        };

        return api;
    }

    return {
        createMarkdownPipeline
    };
});
