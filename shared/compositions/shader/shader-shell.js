(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedShaderComposition = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const adapter = root && root.SharedShaderRuntimeAdapter
        ? root.SharedShaderRuntimeAdapter
        : (typeof module !== 'undefined' && module.exports
            ? require('../../services/shader/shader-runtime-adapter.js')
            : null);

    function compileShaderForPreview(payload) {
        if (!adapter || typeof adapter.buildPreviewPayload !== 'function') {
            return { ok: false, error: 'Shader runtime adapter unavailable' };
        }
        return adapter.buildPreviewPayload(payload || {});
    }

    return {
        compileShaderForPreview
    };
});
