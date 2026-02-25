(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedShaderRuntimeAdapter = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function getShaderAdapter() {
        if (root && root.ShaderHlslAdapter) {
            return root.ShaderHlslAdapter;
        }
        if (typeof module !== 'undefined' && module.exports) {
            try {
                return require('../../../tml-ide-app/public/subapps/assets/js/shader-hlsl-adapter.js');
            } catch (_error) {
                return null;
            }
        }
        return null;
    }

    function buildFragmentSource(commonCode, passCode) {
        const adapter = getShaderAdapter();
        if (!adapter || typeof adapter.buildFragmentSource !== 'function') {
            return { ok: false, error: 'Shader adapter not available' };
        }
        return adapter.buildFragmentSource(String(commonCode || ''), String(passCode || ''));
    }

    function buildPreviewPayload(sourcePayload) {
        const payload = sourcePayload && typeof sourcePayload === 'object' ? sourcePayload : {};
        const passes = Array.isArray(payload.passes) ? payload.passes : [];
        const pass = passes.find(function (item) {
            return String(item && item.type || 'image') === 'image';
        }) || passes[0] || null;
        if (!pass) {
            return { ok: false, error: 'No shader pass available' };
        }

        const built = buildFragmentSource(payload.common || '', pass.code || '');
        if (!built.ok) return built;

        return {
            ok: true,
            source: built.source,
            passName: String(pass.name || pass.type || 'image')
        };
    }

    return {
        getShaderAdapter,
        buildFragmentSource,
        buildPreviewPayload
    };
});
