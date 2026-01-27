'use strict';

function normalizeAnimPath(input) {
    const rel = String(input || '').replace(/\\/g, '/');
    const match = rel.match(/(?:^|\/)(?:docs\/)?(anims\/[^\s]+\.cs)$/i);
    return match ? match[1] : '';
}

async function createRuntime(opts) {
    if (!opts || !opts.runtimeRoot) {
        throw new Error('runtimeRoot required');
    }
}

module.exports = {
    normalizeAnimPath,
    createRuntime
};
