/* global self */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AnimTSPaths = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    function normalizeAnimTsSourcePath(sourcePath) {
        let normalized = String(sourcePath || '').trim();
        while (normalized.startsWith('./')) normalized = normalized.slice(2);
        while (normalized.startsWith('/')) normalized = normalized.slice(1);
        normalized = normalized.replace(/\\/g, '/');
        normalized = normalized.replace(/\/{2,}/g, '/');
        return normalized;
    }

    function isAllowedAnimTsSourcePath(sourcePath) {
        const normalized = normalizeAnimTsSourcePath(sourcePath);
        if (!normalized) return false;
        if (!normalized.endsWith('.ts')) return false;
        if (!normalized.startsWith('anims/')) return false;

        if (normalized.includes('..')) return false;
        if (/^[a-zA-Z]+:\/\//.test(normalized)) return false;
        if (normalized.startsWith('data:')) return false;
        if (normalized.startsWith('javascript:')) return false;
        return true;
    }

    function mapSourceTsToBuiltJsUrl(sourcePath, options) {
        options = options || {};
        const normalized = normalizeAnimTsSourcePath(sourcePath);
        if (!isAllowedAnimTsSourcePath(normalized)) return null;

        const withoutExt = normalized.slice(0, -3);
        const builtRelativeToDocs = '../assets/' + withoutExt + '.js';

        if (options.page === 'docs') return builtRelativeToDocs;
        return 'assets/' + withoutExt + '.js';
    }

    return {
        normalizeAnimTsSourcePath,
        isAllowedAnimTsSourcePath,
        mapSourceTsToBuiltJsUrl
    };
});
