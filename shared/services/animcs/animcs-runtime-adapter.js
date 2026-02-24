(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedAnimcsRuntimeAdapter = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function createAnimcsRuntimeAdapter(runtimeInput) {
        const runtime = runtimeInput || (root && root.AnimcsRuntime) || null;

        function compile(sourceCode, options) {
            if (!runtime || typeof runtime.compile !== 'function') {
                return { ok: false, error: 'Animcs runtime compile API unavailable' };
            }
            try {
                return runtime.compile(String(sourceCode || ''), options || {});
            } catch (error) {
                return { ok: false, error: String(error && error.message || error) };
            }
        }

        function execute(compiledResult, context) {
            if (!runtime || typeof runtime.execute !== 'function') {
                return { ok: false, error: 'Animcs runtime execute API unavailable' };
            }
            try {
                return runtime.execute(compiledResult, context || {});
            } catch (error) {
                return { ok: false, error: String(error && error.message || error) };
            }
        }

        return {
            compile,
            execute
        };
    }

    return {
        createAnimcsRuntimeAdapter
    };
});
