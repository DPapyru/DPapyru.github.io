function identity(value) {
    return value;
}

function normalizeText(value) {
    return String(value || '').replace(/\r\n/g, '\n');
}

function normalizeMode(value) {
    return String(value || 'text').trim().toLowerCase() === 'binary' ? 'binary' : 'text';
}

function toRepoPath(pathValue, normalizePath) {
    const normalized = String((normalizePath || identity)(pathValue) || '').trim();
    if (!normalized) {
        throw new Error('path is required');
    }
    return normalized;
}

function normalizeBaseline(input) {
    const source = input && typeof input === 'object' ? input : {};
    return {
        exists: !!source.exists,
        content: normalizeText(source.content),
        mode: normalizeMode(source.mode)
    };
}

function normalizeCurrent(input, fallback) {
    const source = input && typeof input === 'object' ? input : {};
    const base = fallback && typeof fallback === 'object' ? fallback : { exists: false, content: '', mode: 'text' };
    return {
        exists: !!source.exists,
        content: normalizeText(source.content),
        mode: normalizeMode(source.mode || base.mode)
    };
}

function computeStatus(baseline, current) {
    if (!baseline.exists && current.exists) {
        return 'A';
    }
    if (baseline.exists && !current.exists) {
        return 'D';
    }
    if (baseline.exists && current.exists) {
        if (baseline.mode !== current.mode) return 'M';
        if (baseline.content !== current.content) return 'M';
    }
    return '';
}

function comparePath(a, b) {
    const left = String(a || '').toLowerCase();
    const right = String(b || '').toLowerCase();
    if (left === right) return 0;
    return left < right ? -1 : 1;
}

export function createChangeTracker(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const normalizePath = typeof opts.normalizePath === 'function' ? opts.normalizePath : identity;

    const baselines = new Map();
    const currents = new Map();

    function pathKey(pathValue) {
        return toRepoPath(pathValue, normalizePath);
    }

    function getBaselineOrDefault(path) {
        if (!baselines.has(path)) {
            baselines.set(path, {
                exists: false,
                content: '',
                mode: 'text'
            });
        }
        return baselines.get(path);
    }

    function getCurrentOrDefault(path) {
        if (!currents.has(path)) {
            const baseline = getBaselineOrDefault(path);
            currents.set(path, {
                exists: baseline.exists,
                content: baseline.content,
                mode: baseline.mode
            });
        }
        return currents.get(path);
    }

    function materializeChange(path) {
        const baseline = getBaselineOrDefault(path);
        const current = getCurrentOrDefault(path);
        const status = computeStatus(baseline, current);
        if (!status) {
            return null;
        }
        return {
            path,
            status,
            op: status === 'D' ? 'delete' : 'upsert',
            oldExists: baseline.exists,
            newExists: current.exists,
            oldContent: baseline.content,
            newContent: current.content,
            oldMode: baseline.mode,
            newMode: current.mode,
            mode: current.mode,
            isBinary: baseline.mode === 'binary' || current.mode === 'binary'
        };
    }

    function setBaseline(pathValue, baselineInput, options) {
        const path = pathKey(pathValue);
        const baseline = normalizeBaseline(baselineInput);
        baselines.set(path, baseline);
        const opts = options && typeof options === 'object' ? options : {};
        const preserveCurrent = !!opts.preserveCurrent;
        if (preserveCurrent && currents.has(path)) {
            const current = getCurrentOrDefault(path);
            currents.set(path, {
                exists: current.exists,
                content: current.content,
                mode: current.mode
            });
        } else {
            currents.set(path, {
                exists: baseline.exists,
                content: baseline.content,
                mode: baseline.mode
            });
        }
        return path;
    }

    function upsert(pathValue, content, meta) {
        const path = pathKey(pathValue);
        const baseline = getBaselineOrDefault(path);
        const current = normalizeCurrent({
            exists: true,
            content,
            mode: meta && meta.mode ? meta.mode : baseline.mode
        }, baseline);
        currents.set(path, current);
        return materializeChange(path);
    }

    function markDeleted(pathValue) {
        const path = pathKey(pathValue);
        const baseline = getBaselineOrDefault(path);
        currents.set(path, {
            exists: false,
            content: '',
            mode: baseline.mode
        });
        return materializeChange(path);
    }

    function restore(pathValue) {
        const path = pathKey(pathValue);
        const baseline = getBaselineOrDefault(path);
        currents.set(path, {
            exists: baseline.exists,
            content: baseline.content,
            mode: baseline.mode
        });
        return materializeChange(path);
    }

    function rename(oldPathValue, newPathValue, content, meta) {
        const oldPath = pathKey(oldPathValue);
        const newPath = pathKey(newPathValue);
        if (oldPath === newPath) {
            return [upsert(newPath, content, meta)].filter(Boolean);
        }
        const deleted = markDeleted(oldPath);
        const added = upsert(newPath, content, meta);
        return [deleted, added].filter(Boolean);
    }

    function getChange(pathValue) {
        const path = pathKey(pathValue);
        return materializeChange(path);
    }

    function listChanges() {
        const paths = new Set();
        baselines.forEach((_value, key) => paths.add(key));
        currents.forEach((_value, key) => paths.add(key));
        return Array.from(paths)
            .map((path) => materializeChange(path))
            .filter(Boolean)
            .sort((left, right) => comparePath(left.path, right.path));
    }

    function hasBaseline(pathValue) {
        const path = pathKey(pathValue);
        return baselines.has(path);
    }

    function getBaseline(pathValue) {
        const path = pathKey(pathValue);
        if (!baselines.has(path)) return null;
        const baseline = baselines.get(path);
        return {
            path,
            exists: baseline.exists,
            content: baseline.content,
            mode: baseline.mode
        };
    }

    function getCurrent(pathValue) {
        const path = pathKey(pathValue);
        const current = getCurrentOrDefault(path);
        return {
            path,
            exists: current.exists,
            content: current.content,
            mode: current.mode
        };
    }

    return {
        setBaseline,
        upsert,
        markDeleted,
        restore,
        rename,
        getChange,
        listChanges,
        hasBaseline,
        getBaseline,
        getCurrent
    };
}
