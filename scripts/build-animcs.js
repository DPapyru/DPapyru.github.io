'use strict';

function buildManifest(items) {
    const entries = {};
    for (const item of items || []) {
        const key = String(item.source || '').replace(/.*?(anims\/[^\/]+\.cs)$/i, '$1');
        if (!key) continue;
        entries[key] = { assembly: `${item.entry}.dll`, entry: item.entry };
    }
    return { schemaVersion: 1, entries };
}

module.exports = {
    buildManifest
};
