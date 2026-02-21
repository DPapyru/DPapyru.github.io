function assertPluginShape(plugin) {
    if (!plugin || typeof plugin !== 'object') {
        throw new TypeError('plugin must be an object');
    }

    const id = String(plugin.id || '').trim();
    if (!id) {
        throw new TypeError('plugin id is required');
    }
    if (typeof plugin.mount !== 'function') {
        throw new TypeError('plugin.mount must be a function');
    }
    if (typeof plugin.unmount !== 'function') {
        throw new TypeError('plugin.unmount must be a function');
    }

    return id;
}

export function createPluginRegistry() {
    const map = new Map();

    return {
        register(plugin) {
            const id = assertPluginShape(plugin);
            if (map.has(id)) {
                throw new Error(`duplicate plugin id: ${id}`);
            }
            map.set(id, plugin);
            return plugin;
        },
        get(id) {
            const key = String(id || '').trim();
            return map.has(key) ? map.get(key) : null;
        },
        has(id) {
            return map.has(String(id || '').trim());
        },
        list() {
            return Array.from(map.values());
        }
    };
}

