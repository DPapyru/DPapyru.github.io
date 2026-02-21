function safeStorageGet(storage, key) {
    try {
        if (!storage) return '';
        return String(storage.getItem(key) || '');
    } catch (_err) {
        return '';
    }
}

function safeStorageSet(storage, key, value) {
    try {
        if (!storage) return;
        storage.setItem(key, String(value || ''));
    } catch (_err) {
        // Ignore storage failures.
    }
}

function safeStorageRemove(storage, key) {
    try {
        if (!storage) return;
        storage.removeItem(key);
    } catch (_err) {
        // Ignore storage failures.
    }
}

function parseJson(value) {
    try {
        return JSON.parse(String(value || ''));
    } catch (_err) {
        return null;
    }
}

export function createStorageService() {
    const ls = globalThis.localStorage;
    const ss = globalThis.sessionStorage;

    return {
        getLocalText(key) {
            return safeStorageGet(ls, key);
        },
        setLocalText(key, value) {
            safeStorageSet(ls, key, value);
        },
        removeLocalKey(key) {
            safeStorageRemove(ls, key);
        },
        getLocalJson(key, fallbackValue) {
            const raw = safeStorageGet(ls, key);
            const parsed = parseJson(raw);
            return parsed === null ? fallbackValue : parsed;
        },
        setLocalJson(key, value) {
            safeStorageSet(ls, key, JSON.stringify(value));
        },
        getSessionText(key) {
            return safeStorageGet(ss, key);
        },
        setSessionText(key, value) {
            safeStorageSet(ss, key, value);
        },
        removeSessionKey(key) {
            safeStorageRemove(ss, key);
        }
    };
}

