'use strict';

function normalizeAnimPath(input) {
    const rel = String(input || '').replace(/\\/g, '/');
    const match = rel.match(/(?:^|\/)(?:docs\/)?(anims\/[^\s]+\.cs)$/i);
    return match ? match[1] : '';
}

module.exports = {
    normalizeAnimPath
};
