const DB_NAME = 'tml-ide-workspace-db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'workspace.v1';

const FALLBACK_STORAGE_KEY = 'tml-ide-workspace.v1';

export function createDefaultWorkspace() {
    return {
        schemaVersion: 1,
        activeFileId: 'file-program',
        files: [
            {
                id: 'file-program',
                path: 'Program.cs',
                content: [
                    'using Terraria;',
                    'using Terraria.ModLoader;',
                    '',
                    'public class ExampleItem : ModItem',
                    '{',
                    '    public override void SetDefaults()',
                    '    {',
                    '        Main.NewText("Hello tML IDE");',
                    '    }',
                    '}'
                ].join('\n')
            }
        ]
    };
}

function normalizeWorkspace(raw) {
    const fallback = createDefaultWorkspace();
    if (!raw || typeof raw !== 'object') return fallback;

    const files = Array.isArray(raw.files) ? raw.files : [];
    const normalizedFiles = files
        .map((file, idx) => ({
            id: String(file && file.id || `file-${idx + 1}`),
            path: String(file && file.path || `File${idx + 1}.cs`),
            content: String(file && file.content || '')
        }))
        .filter((file) => !!file.path);

    if (!normalizedFiles.length) return fallback;

    const activeFileId = String(raw.activeFileId || normalizedFiles[0].id);
    const exists = normalizedFiles.some((file) => file.id === activeFileId);

    return {
        schemaVersion: 1,
        activeFileId: exists ? activeFileId : normalizedFiles[0].id,
        files: normalizedFiles
    };
}

function openDatabase() {
    if (!('indexedDB' in globalThis)) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function () {
            reject(new Error('IndexedDB 打开失败'));
        };
        request.onupgradeneeded = function () {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = function () {
            resolve(request.result);
        };
    });
}

export async function loadWorkspace() {
    try {
        const db = await openDatabase();
        if (db) {
            const value = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(WORKSPACE_KEY);
                req.onerror = function () {
                    reject(new Error('读取 IndexedDB 失败'));
                };
                req.onsuccess = function () {
                    resolve(req.result || null);
                };
            });
            db.close();
            if (value) return normalizeWorkspace(value);
        }
    } catch (_err) {
        // Fallback below.
    }

    try {
        const raw = globalThis.localStorage ? globalThis.localStorage.getItem(FALLBACK_STORAGE_KEY) : null;
        if (!raw) return createDefaultWorkspace();
        const parsed = JSON.parse(raw);
        return normalizeWorkspace(parsed);
    } catch (_err) {
        return createDefaultWorkspace();
    }
}

export async function saveWorkspace(workspace) {
    const payload = normalizeWorkspace(workspace);

    try {
        const db = await openDatabase();
        if (db) {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.put(payload, WORKSPACE_KEY);
                req.onerror = function () {
                    reject(new Error('保存 IndexedDB 失败'));
                };
                req.onsuccess = function () {
                    resolve(null);
                };
            });
            db.close();
            return;
        }
    } catch (_err) {
        // localStorage fallback below.
    }

    if (globalThis.localStorage) {
        globalThis.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(payload));
    }
}

export function exportWorkspaceJson(workspace) {
    return JSON.stringify(normalizeWorkspace(workspace), null, 4) + '\n';
}

export function importWorkspaceJson(text) {
    const parsed = JSON.parse(String(text || '{}'));
    return normalizeWorkspace(parsed);
}
