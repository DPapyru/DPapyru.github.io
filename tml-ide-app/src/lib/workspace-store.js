const DB_NAME = 'tml-ide-workspace-db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'workspace.v1';
const UNIFIED_WORKSPACE_V2_KEY = 'workspace.v2';
const UNIFIED_WORKSPACE_V3_KEY = 'workspace.v3';

const FALLBACK_STORAGE_KEY = 'tml-ide-workspace.v1';
const UNIFIED_FALLBACK_STORAGE_V2_KEY = 'tml-ide-workspace.v2';
const UNIFIED_FALLBACK_STORAGE_V3_KEY = 'tml-ide-workspace.v3';

const LEGACY_MARKDOWN_STORAGE_KEY = 'articleStudioMarkdown.v9';
const LEGACY_MARKDOWN_VIEWER_PREVIEW_KEY = 'articleStudioViewerPreview.v1';
const LEGACY_SHADER_PLAYGROUND_KEY = 'shader-playground.v1';
const LEGACY_SHADER_CONTRIBUTE_KEY = 'shader-contribute.state.v2';
const LEGACY_SHADER_DRAFT_KEY = 'shader-playground.contribute-draft.v1';

function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
    if (!isObject(value) && !Array.isArray(value)) return null;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (_err) {
        return null;
    }
}

function parseJson(raw) {
    try {
        return JSON.parse(String(raw || ''));
    } catch (_err) {
        return null;
    }
}

function readStorageObject(key) {
    if (!globalThis.localStorage) return null;
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = parseJson(raw);
    return isObject(parsed) ? parsed : null;
}

function normalizeWorkspaceName(value) {
    const safe = String(value || '').trim().toLowerCase();
    return safe === 'markdown' || safe === 'shader' || safe === 'csharp' ? safe : 'csharp';
}

function normalizeWorkspaceFiles(files) {
    return (Array.isArray(files) ? files : [])
        .map((item, idx) => ({
            id: String(item && item.id || `file-${idx + 1}`),
            path: String(item && item.path || `File${idx + 1}.cs`),
            content: String(item && item.content || '')
        }))
        .filter((item) => !!item.path);
}

function normalizeStagedSnapshot(raw) {
    if (!isObject(raw)) return null;
    const files = (Array.isArray(raw.files) ? raw.files : [])
        .map((item) => ({
            path: String(item && item.path || ''),
            content: String(item && item.content || ''),
            encoding: String(item && item.encoding || 'utf8'),
            source: String(item && item.source || ''),
            isMainMarkdown: !!(item && item.isMainMarkdown),
            op: String(item && item.op || '')
        }))
        .filter((item) => !!item.path);

    return {
        workspace: String(raw.workspace || ''),
        targetPath: String(raw.targetPath || ''),
        markdown: String(raw.markdown || ''),
        files,
        workerApiUrl: String(raw.workerApiUrl || ''),
        prTitle: String(raw.prTitle || ''),
        authToken: String(raw.authToken || ''),
        githubUser: String(raw.githubUser || ''),
        warnings: Array.isArray(raw.warnings) ? raw.warnings.map((item) => String(item || '')) : [],
        updatedAt: String(raw.updatedAt || '')
    };
}

function extractStagedSnapshot(raw) {
    if (!isObject(raw)) return null;
    if (isObject(raw.staged)) {
        return normalizeStagedSnapshot(raw.staged);
    }
    if (Array.isArray(raw.files) || raw.targetPath || raw.markdown || raw.workspace) {
        return normalizeStagedSnapshot(raw);
    }
    return null;
}

function normalizeMarkdownSnapshot(raw) {
    const safeRaw = isObject(raw) ? raw : {};
    return {
        staged: extractStagedSnapshot(safeRaw),
        legacyState: cloneJson(safeRaw.legacyState),
        viewerPreview: cloneJson(safeRaw.viewerPreview)
    };
}

function normalizeShaderSnapshot(raw) {
    const safeRaw = isObject(raw) ? raw : {};
    return {
        staged: extractStagedSnapshot(safeRaw),
        contributeState: cloneJson(safeRaw.contributeState),
        playgroundState: cloneJson(safeRaw.playgroundState),
        contributionDraft: cloneJson(safeRaw.contributionDraft)
    };
}

function normalizeSubmitState(raw) {
    const submit = isObject(raw) ? raw : {};
    return {
        workerApiUrl: String(submit.workerApiUrl || ''),
        prTitle: String(submit.prTitle || ''),
        existingPrNumber: String(submit.existingPrNumber || ''),
        anchorPath: String(submit.anchorPath || ''),
        resume: isObject(submit.resume) ? submit.resume : null,
        lastCollection: isObject(submit.lastCollection) ? submit.lastCollection : null
    };
}

function normalizeUnifiedWorkspaceState(raw) {
    const fallback = createDefaultUnifiedWorkspaceState();
    if (!isObject(raw)) return fallback;

    const snapshots = isObject(raw.snapshots) ? raw.snapshots : {};
    const schemaVersion = Number(raw.schemaVersion || 0);
    const markdownSource = schemaVersion >= 3
        ? snapshots.markdown
        : (isObject(snapshots.markdown) ? { staged: snapshots.markdown } : {});
    const shaderSource = schemaVersion >= 3
        ? snapshots.shader
        : (isObject(snapshots.shader) ? { staged: snapshots.shader } : {});

    return {
        schemaVersion: 3,
        lastWorkspace: normalizeWorkspaceName(raw.lastWorkspace || fallback.lastWorkspace),
        snapshots: {
            csharp: {
                updatedAt: String(snapshots.csharp && snapshots.csharp.updatedAt || ''),
                files: normalizeWorkspaceFiles(snapshots.csharp && snapshots.csharp.files)
            },
            markdown: normalizeMarkdownSnapshot(markdownSource),
            shader: normalizeShaderSnapshot(shaderSource)
        },
        submit: normalizeSubmitState(raw.submit)
    };
}

function readLegacyWorkspaceState() {
    return {
        markdownState: readStorageObject(LEGACY_MARKDOWN_STORAGE_KEY),
        markdownViewerPreview: readStorageObject(LEGACY_MARKDOWN_VIEWER_PREVIEW_KEY),
        shaderPlaygroundState: readStorageObject(LEGACY_SHADER_PLAYGROUND_KEY),
        shaderContributeState: readStorageObject(LEGACY_SHADER_CONTRIBUTE_KEY),
        shaderContributionDraft: readStorageObject(LEGACY_SHADER_DRAFT_KEY)
    };
}

function mergeLegacyWorkspaceState(baseState, legacyState) {
    const state = normalizeUnifiedWorkspaceState(baseState);
    const legacy = isObject(legacyState) ? legacyState : {};

    if (!state.snapshots.markdown.legacyState && isObject(legacy.markdownState)) {
        state.snapshots.markdown.legacyState = cloneJson(legacy.markdownState);
    }
    if (!state.snapshots.markdown.viewerPreview && isObject(legacy.markdownViewerPreview)) {
        state.snapshots.markdown.viewerPreview = cloneJson(legacy.markdownViewerPreview);
    }
    if (!state.snapshots.shader.playgroundState && isObject(legacy.shaderPlaygroundState)) {
        state.snapshots.shader.playgroundState = cloneJson(legacy.shaderPlaygroundState);
    }
    if (!state.snapshots.shader.contributeState && isObject(legacy.shaderContributeState)) {
        state.snapshots.shader.contributeState = cloneJson(legacy.shaderContributeState);
    }
    if (!state.snapshots.shader.contributionDraft && isObject(legacy.shaderContributionDraft)) {
        state.snapshots.shader.contributionDraft = cloneJson(legacy.shaderContributionDraft);
    }

    return state;
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

function readDbValue(db, key, errorMessage) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onerror = function () {
            reject(new Error(errorMessage));
        };
        req.onsuccess = function () {
            resolve(req.result || null);
        };
    });
}

function writeDbValue(db, key, payload, errorMessage) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(payload, key);
        req.onerror = function () {
            reject(new Error(errorMessage));
        };
        req.onsuccess = function () {
            resolve(null);
        };
    });
}

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

export function createDefaultUnifiedWorkspaceState() {
    return {
        schemaVersion: 3,
        lastWorkspace: 'csharp',
        snapshots: {
            csharp: {
                updatedAt: '',
                files: []
            },
            markdown: {
                staged: null,
                legacyState: null,
                viewerPreview: null
            },
            shader: {
                staged: null,
                contributeState: null,
                playgroundState: null,
                contributionDraft: null
            }
        },
        submit: {
            workerApiUrl: '',
            prTitle: '',
            existingPrNumber: '',
            anchorPath: '',
            resume: null,
            lastCollection: null
        }
    };
}

function normalizeWorkspace(raw) {
    const fallback = createDefaultWorkspace();
    if (!isObject(raw)) return fallback;

    const normalizedFiles = normalizeWorkspaceFiles(raw.files);
    if (!normalizedFiles.length) return fallback;

    const activeFileId = String(raw.activeFileId || normalizedFiles[0].id);
    const exists = normalizedFiles.some((file) => file.id === activeFileId);

    return {
        schemaVersion: 1,
        activeFileId: exists ? activeFileId : normalizedFiles[0].id,
        files: normalizedFiles
    };
}

export async function loadWorkspace() {
    try {
        const db = await openDatabase();
        if (db) {
            const value = await readDbValue(db, WORKSPACE_KEY, '读取 IndexedDB 失败');
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
            await writeDbValue(db, WORKSPACE_KEY, payload, '保存 IndexedDB 失败');
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

export async function loadUnifiedWorkspaceState() {
    const legacy = readLegacyWorkspaceState();

    try {
        const db = await openDatabase();
        if (db) {
            const v3 = await readDbValue(db, UNIFIED_WORKSPACE_V3_KEY, '读取 workspace.v3 失败');
            if (v3) {
                db.close();
                return normalizeUnifiedWorkspaceState(v3);
            }
            const v2 = await readDbValue(db, UNIFIED_WORKSPACE_V2_KEY, '读取 workspace.v2 失败');
            db.close();
            if (v2) {
                return mergeLegacyWorkspaceState(normalizeUnifiedWorkspaceState(v2), legacy);
            }
        }
    } catch (_err) {
        // Fallback below.
    }

    const localV3 = readStorageObject(UNIFIED_FALLBACK_STORAGE_V3_KEY);
    if (localV3) {
        return normalizeUnifiedWorkspaceState(localV3);
    }

    const localV2 = readStorageObject(UNIFIED_FALLBACK_STORAGE_V2_KEY);
    if (localV2) {
        return mergeLegacyWorkspaceState(normalizeUnifiedWorkspaceState(localV2), legacy);
    }

    return mergeLegacyWorkspaceState(createDefaultUnifiedWorkspaceState(), legacy);
}

export async function saveUnifiedWorkspaceState(unifiedState) {
    const payload = normalizeUnifiedWorkspaceState(unifiedState);

    try {
        const db = await openDatabase();
        if (db) {
            await writeDbValue(db, UNIFIED_WORKSPACE_V3_KEY, payload, '保存 workspace.v3 失败');
            db.close();
            return;
        }
    } catch (_err) {
        // localStorage fallback below.
    }

    if (globalThis.localStorage) {
        globalThis.localStorage.setItem(UNIFIED_FALLBACK_STORAGE_V3_KEY, JSON.stringify(payload));
    }
}

export function exportWorkspaceJson(workspace) {
    return JSON.stringify(normalizeWorkspace(workspace), null, 4) + '\n';
}

export function importWorkspaceJson(text) {
    const parsed = JSON.parse(String(text || '{}'));
    return normalizeWorkspace(parsed);
}
