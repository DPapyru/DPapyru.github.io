function createTypeRecord(fullName) {
    const safe = String(fullName || '').trim();
    const cut = safe.lastIndexOf('.');
    const ns = cut > 0 ? safe.slice(0, cut) : '';
    const name = cut > 0 ? safe.slice(cut + 1) : safe;
    return {
        fullName: safe,
        namespace: ns,
        name: name,
        summary: '',
        members: {
            methods: [],
            properties: [],
            fields: []
        }
    };
}

function ensureMemberBuckets(typeRecord) {
    if (!typeRecord.members || typeof typeRecord.members !== 'object') {
        typeRecord.members = { methods: [], properties: [], fields: [] };
    }
    if (!Array.isArray(typeRecord.members.methods)) typeRecord.members.methods = [];
    if (!Array.isArray(typeRecord.members.properties)) typeRecord.members.properties = [];
    if (!Array.isArray(typeRecord.members.fields)) typeRecord.members.fields = [];
}

function normalizeMethod(method) {
    const params = Array.isArray(method.params) ? method.params.map((p) => ({
        name: String((p && p.name) || ''),
        type: String((p && p.type) || 'object'),
        optional: !!(p && p.optional),
        defaultValue: p && Object.prototype.hasOwnProperty.call(p, 'defaultValue') ? p.defaultValue : null
    })) : [];

    let minArgs = Number.isFinite(Number(method.minArgs)) ? Number(method.minArgs) : 0;
    let maxArgs = Number.isFinite(Number(method.maxArgs)) ? Number(method.maxArgs) : params.length;

    if (minArgs < 0) minArgs = 0;
    if (maxArgs < minArgs) maxArgs = minArgs;

    return {
        kind: 'method',
        name: String(method.name || ''),
        signature: String(method.signature || ''),
        returnType: String(method.returnType || 'void'),
        isStatic: !!method.isStatic,
        params: params,
        minArgs: minArgs,
        maxArgs: maxArgs,
        summary: String(method.summary || ''),
        returnsDoc: String(method.returnsDoc || ''),
        paramDocs: method.paramDocs && typeof method.paramDocs === 'object' ? method.paramDocs : {}
    };
}

function normalizeProperty(property) {
    return {
        kind: 'property',
        name: String(property.name || ''),
        signature: String(property.signature || ''),
        type: String(property.type || 'object'),
        isStatic: !!property.isStatic,
        summary: String(property.summary || '')
    };
}

function normalizeField(field) {
    return {
        kind: 'field',
        name: String(field.name || ''),
        signature: String(field.signature || ''),
        type: String(field.type || 'object'),
        isStatic: !!field.isStatic,
        summary: String(field.summary || '')
    };
}

export function createEmptyApiIndex() {
    return {
        schemaVersion: 2,
        generatedAt: new Date().toISOString(),
        sources: [],
        types: {},
        lookup: {
            byShortName: {},
            namespaces: []
        }
    };
}

export function buildLookup(index) {
    const byShortName = {};
    const namespaceSet = new Set();

    Object.keys(index.types).forEach((fullName) => {
        const typeRecord = index.types[fullName];
        const shortName = String(typeRecord.name || '').trim();
        if (!shortName) return;
        if (!Array.isArray(byShortName[shortName])) {
            byShortName[shortName] = [];
        }
        byShortName[shortName].push(fullName);
        if (typeRecord.namespace) namespaceSet.add(typeRecord.namespace);
    });

    Object.keys(byShortName).forEach((shortName) => {
        byShortName[shortName].sort((a, b) => a.localeCompare(b));
    });

    index.lookup = {
        byShortName: byShortName,
        namespaces: Array.from(namespaceSet).sort((a, b) => a.localeCompare(b))
    };
    return index.lookup;
}

export function normalizeApiIndex(raw) {
    const index = createEmptyApiIndex();
    if (!raw || typeof raw !== 'object') {
        return index;
    }

    index.generatedAt = String(raw.generatedAt || index.generatedAt);
    if (Array.isArray(raw.sources)) {
        index.sources = raw.sources.map((source) => ({
            assemblyName: String(source && source.assemblyName || ''),
            dllPath: String(source && source.dllPath || ''),
            xmlPath: String(source && source.xmlPath || '')
        }));
    }

    const sourceTypes = raw.types && typeof raw.types === 'object' ? raw.types : {};
    Object.keys(sourceTypes).forEach((fullName) => {
        const sourceType = sourceTypes[fullName];
        const record = createTypeRecord(fullName);
        record.namespace = String(sourceType && sourceType.namespace || record.namespace);
        record.name = String(sourceType && sourceType.name || record.name);
        record.summary = String(sourceType && sourceType.summary || '');
        ensureMemberBuckets(record);

        const sourceMembers = sourceType && sourceType.members && typeof sourceType.members === 'object'
            ? sourceType.members
            : {};

        const methods = Array.isArray(sourceMembers.methods) ? sourceMembers.methods : [];
        const properties = Array.isArray(sourceMembers.properties) ? sourceMembers.properties : [];
        const fields = Array.isArray(sourceMembers.fields) ? sourceMembers.fields : [];

        record.members.methods = methods
            .map(normalizeMethod)
            .filter((m) => !!m.name)
            .sort((a, b) => {
                const byName = a.name.localeCompare(b.name);
                if (byName !== 0) return byName;
                const byMinArgs = a.minArgs - b.minArgs;
                if (byMinArgs !== 0) return byMinArgs;
                return a.signature.localeCompare(b.signature);
            });

        record.members.properties = properties
            .map(normalizeProperty)
            .filter((p) => !!p.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        record.members.fields = fields
            .map(normalizeField)
            .filter((f) => !!f.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        index.types[fullName] = record;
    });

    buildLookup(index);
    return index;
}

function indexMemberKey(member) {
    return `${member.kind}:${member.name}:${member.signature}`;
}

export function mergeApiIndex(baseIndex, patchIndex) {
    const base = normalizeApiIndex(baseIndex);
    const patch = normalizeApiIndex(patchIndex);

    patch.sources.forEach((source) => {
        const exists = base.sources.some((existing) => {
            return existing.assemblyName === source.assemblyName && existing.dllPath === source.dllPath;
        });
        if (!exists) {
            base.sources.push(source);
        }
    });

    Object.keys(patch.types).forEach((fullName) => {
        const incoming = patch.types[fullName];
        if (!base.types[fullName]) {
            base.types[fullName] = incoming;
            return;
        }

        const current = base.types[fullName];
        ensureMemberBuckets(current);
        if (!current.summary && incoming.summary) {
            current.summary = incoming.summary;
        }

        const mergeKind = (kind) => {
            const merged = new Map();
            current.members[kind].forEach((item) => {
                merged.set(indexMemberKey(item), item);
            });
            incoming.members[kind].forEach((item) => {
                const key = indexMemberKey(item);
                if (!merged.has(key)) {
                    merged.set(key, item);
                    return;
                }
                const prev = merged.get(key);
                if (!prev.summary && item.summary) {
                    merged.set(key, item);
                }
            });
            current.members[kind] = Array.from(merged.values()).sort((a, b) => {
                const byName = a.name.localeCompare(b.name);
                if (byName !== 0) return byName;
                return a.signature.localeCompare(b.signature);
            });
        };

        mergeKind('methods');
        mergeKind('properties');
        mergeKind('fields');
    });

    buildLookup(base);
    return base;
}

export function getTypeByFullName(index, fullName) {
    const safe = String(fullName || '').trim();
    if (!safe) return null;
    return index.types[safe] || null;
}

export function getTypeCandidatesByShortName(index, shortName) {
    const safe = String(shortName || '').trim();
    if (!safe) return [];
    const map = index.lookup && index.lookup.byShortName ? index.lookup.byShortName : {};
    const list = Array.isArray(map[safe]) ? map[safe] : [];
    return list.map((fullName) => getTypeByFullName(index, fullName)).filter(Boolean);
}
