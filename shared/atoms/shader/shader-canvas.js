(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedShaderCanvasAtom = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function renderShaderCanvas(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const doc = opts.documentObj || document;
        const canvas = doc.createElement('canvas');
        canvas.className = 'shared-shader-canvas';
        canvas.width = Number(opts.width) > 0 ? Number(opts.width) : 640;
        canvas.height = Number(opts.height) > 0 ? Number(opts.height) : 360;
        return canvas;
    }

    return {
        renderShaderCanvas
    };
});
