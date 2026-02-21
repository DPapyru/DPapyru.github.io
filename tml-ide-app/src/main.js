import './style.css';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController.js';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution';
import { conf as csharpConf, language as csharpLanguage } from 'monaco-editor/esm/vs/basic-languages/csharp/csharp';

import { DIAGNOSTIC_SEVERITY, MESSAGE_TYPES } from './contracts/messages.js';
import { createEnhancedCsharpLanguage } from './lib/csharp-highlighting.js';
import { buildPatchIndexFromXml } from './lib/language-core.js';
import { createEmptyApiIndex, mergeApiIndex, normalizeApiIndex } from './lib/index-schema.js';
import {
    createDefaultWorkspace,
    exportWorkspaceJson,
    importWorkspaceJson,
    loadWorkspace,
    saveWorkspace
} from './lib/workspace-store.js';

self.MonacoEnvironment = {
    getWorker() {
        return new editorWorker();
    }
};

const dom = {
    appRoot: document.getElementById('app'),
    fileList: document.getElementById('file-list'),
    activeFileName: document.getElementById('active-file-name'),
    editor: document.getElementById('editor'),
    editorStatus: document.getElementById('editor-status'),
    indexInfo: document.getElementById('index-info'),
    workspaceVersion: document.getElementById('workspace-version'),
    eventLog: document.getElementById('event-log'),
    btnAddFile: document.getElementById('btn-add-file'),
    btnRenameFile: document.getElementById('btn-rename-file'),
    btnDeleteFile: document.getElementById('btn-delete-file'),
    btnRunDiagnostics: document.getElementById('btn-run-diagnostics'),
    btnSaveWorkspace: document.getElementById('btn-save-workspace'),
    btnExportWorkspace: document.getElementById('btn-export-workspace'),
    inputImportWorkspace: document.getElementById('input-import-workspace'),
    toggleRoslyn: document.getElementById('toggle-roslyn'),
    inputExtraDll: document.getElementById('input-extra-dll'),
    inputExtraXml: document.getElementById('input-extra-xml'),
    btnImportAssembly: document.getElementById('btn-import-assembly'),
    inputIndexerDllPath: document.getElementById('input-indexer-dll-path'),
    inputIndexerXmlPath: document.getElementById('input-indexer-xml-path'),
    inputIndexerTerrariaDllPath: document.getElementById('input-indexer-terraria-dll-path'),
    inputIndexerTerrariaXmlPath: document.getElementById('input-indexer-terraria-xml-path'),
    inputIndexerOutPath: document.getElementById('input-indexer-out-path'),
    indexCommandPreview: document.getElementById('index-command-preview'),
    btnCopyIndexCommand: document.getElementById('btn-copy-index-command'),
    inputAppendDllPath: document.getElementById('input-append-dll-path'),
    inputAppendXmlPath: document.getElementById('input-append-xml-path'),
    inputAppendOutPath: document.getElementById('input-append-out-path'),
    appendCommandPreview: document.getElementById('append-command-preview'),
    btnCopyAppendCommand: document.getElementById('btn-copy-append-command'),
    inputImportIndex: document.getElementById('input-import-index'),
    btnImportIndex: document.getElementById('btn-import-index'),
    activityButtons: Array.from(document.querySelectorAll('.activity-btn[data-activity]')),
    panelTabButtons: Array.from(document.querySelectorAll('.panel-tab[data-panel-tab]')),
    panelViews: Array.from(document.querySelectorAll('.panel-view[data-panel-view]')),
    bottomPanel: document.getElementById('bottom-panel'),
    btnToggleBottomPanel: document.getElementById('btn-toggle-bottom-panel'),
    commandPalette: document.getElementById('command-palette'),
    commandPaletteBackdrop: document.getElementById('command-palette-backdrop'),
    commandPaletteInput: document.getElementById('command-palette-input'),
    commandPaletteResults: document.getElementById('command-palette-results')
};

const state = {
    index: createEmptyApiIndex(),
    workspace: createDefaultWorkspace(),
    editor: null,
    modelByFileId: new Map(),
    analyzeCache: new Map(),
    diagnosticsTimer: 0,
    saveTimer: 0,
    roslynEnabled: false,
    roslynWorker: null,
    initialized: false,
    ui: {
        sidebarVisible: true,
        panelVisible: true,
        activeActivity: 'explorer',
        activePanelTab: 'problems',
        paletteOpen: false,
        paletteMode: 'commands',
        paletteItems: [],
        paletteSelectedIndex: 0
    }
};

const VSCODE_SHORTCUTS = Object.freeze({
    COMMAND_PALETTE: 'Ctrl+Shift+P',
    QUICK_OPEN: 'Ctrl+P',
    TOGGLE_SIDEBAR: 'Ctrl+B',
    TOGGLE_PANEL: 'Ctrl+J',
    SAVE_WORKSPACE: 'Ctrl+S',
    FOCUS_EXPLORER: 'Ctrl+Shift+E'
});

// Keep Monaco colors aligned with site viewer's Rider dark Prism theme.
const RIDER_CODE_COLORS = Object.freeze({
    bg: '#191A1C',
    bgInline: '#303030',
    border: '#404040',
    fg: '#BDBDBD',
    selection: '#08335E',
    comment: '#85C46C',
    keyword: '#6178FF',
    string: '#FF9D70',
    number: '#ED94C0',
    punctuation: '#A7B0BE',
    operator: '#B6C2FF',
    function: '#39CC9B',
    class: '#FFED19',
    namespace: '#C191FF',
    parameter: '#F2C77D',
    preprocessor: '#FF7CCB',
    constant: '#66C3CC',
    variable: '#95FFE2',
    field: '#B370FF',
    escape: '#D688D4',
    link: '#6C95EB',
    lineNumber: '#808080'
});

const VSCODE_UI_COLORS = Object.freeze({
    editorBg: '#1e1e1e',
    text: '#d4d4d4',
    lineNumber: '#858585',
    lineNumberActive: '#c6c6c6',
    selection: '#264f78',
    selectionInactive: '#3a3d4166',
    selectionHighlight: '#add6ff26',
    widgetBg: '#252526',
    widgetBorder: '#454545',
    listSelectedBg: '#094771',
    listSelectedFg: '#ffffff',
    listFocusBg: '#04395e',
    listFocusFg: '#ffffff',
    listHighlight: '#4fc1ff',
    suggestHighlight: '#18a3ff'
});

function registerRiderDarkMonacoTheme() {
    monaco.editor.defineTheme('tml-rider-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: '', foreground: 'BDBDBD' },
            { token: 'comment', foreground: '85C46C', fontStyle: 'italic' },
            { token: 'keyword', foreground: '6178FF' },
            { token: 'string', foreground: 'FF9D70' },
            { token: 'string.escape', foreground: 'D688D4' },
            { token: 'number', foreground: 'ED94C0' },
            { token: 'operator', foreground: 'B6C2FF' },
            { token: 'delimiter', foreground: 'A7B0BE' },
            { token: 'delimiter.bracket', foreground: 'A7B0BE' },
            { token: 'delimiter.parenthesis', foreground: 'A7B0BE' },
            { token: 'delimiter.array', foreground: 'A7B0BE' },
            { token: 'identifier', foreground: '95FFE2' },
            { token: 'variable', foreground: '95FFE2' },
            { token: 'variable.parameter', foreground: 'F2C77D' },
            { token: 'parameter', foreground: 'F2C77D' },
            { token: 'property', foreground: 'B370FF' },
            { token: 'function', foreground: '39CC9B' },
            { token: 'function.call', foreground: '39CC9B' },
            { token: 'entity.name.function', foreground: '39CC9B' },
            { token: 'type', foreground: 'FFED19' },
            { token: 'type.identifier', foreground: 'FFED19' },
            { token: 'class', foreground: 'FFED19' },
            { token: 'class.identifier', foreground: 'FFED19' },
            { token: 'interface', foreground: 'FFED19' },
            { token: 'enum', foreground: 'FFED19' },
            { token: 'namespace', foreground: 'C191FF' },
            { token: 'constant', foreground: '66C3CC' },
            { token: 'constant.language', foreground: '66C3CC' },
            { token: 'keyword.directive', foreground: 'FF7CCB' },
            { token: 'preprocessor', foreground: 'FF7CCB' },
            { token: 'regexp', foreground: 'D688D4' },
            { token: 'link', foreground: '6C95EB' }
        ],
        colors: {
            'editor.background': VSCODE_UI_COLORS.editorBg,
            'editor.foreground': VSCODE_UI_COLORS.text,
            'editorLineNumber.foreground': VSCODE_UI_COLORS.lineNumber,
            'editorLineNumber.activeForeground': VSCODE_UI_COLORS.lineNumberActive,
            'editorCursor.foreground': RIDER_CODE_COLORS.variable,
            'editor.selectionBackground': VSCODE_UI_COLORS.selection,
            'editor.inactiveSelectionBackground': VSCODE_UI_COLORS.selectionInactive,
            'editor.selectionHighlightBackground': VSCODE_UI_COLORS.selectionHighlight,
            'editor.wordHighlightBackground': '#575757b8',
            'editor.wordHighlightStrongBackground': '#004972b8',
            'editorBracketMatch.background': '#515c6a80',
            'editorBracketMatch.border': RIDER_CODE_COLORS.operator,
            'editorWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'editorSuggestWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorSuggestWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'editorSuggestWidget.foreground': VSCODE_UI_COLORS.text,
            'editorSuggestWidget.highlightForeground': VSCODE_UI_COLORS.suggestHighlight,
            'editorSuggestWidget.focusHighlightForeground': VSCODE_UI_COLORS.suggestHighlight,
            'editorSuggestWidget.selectedBackground': VSCODE_UI_COLORS.listSelectedBg,
            'editorSuggestWidget.selectedForeground': VSCODE_UI_COLORS.listSelectedFg,
            'editorSuggestWidget.selectedIconForeground': RIDER_CODE_COLORS.function,
            'editorSuggestWidgetStatus.foreground': VSCODE_UI_COLORS.lineNumber,
            'editorHoverWidget.background': VSCODE_UI_COLORS.widgetBg,
            'editorHoverWidget.foreground': VSCODE_UI_COLORS.text,
            'editorHoverWidget.border': VSCODE_UI_COLORS.widgetBorder,
            'list.activeSelectionBackground': VSCODE_UI_COLORS.listSelectedBg,
            'list.activeSelectionForeground': VSCODE_UI_COLORS.listSelectedFg,
            'list.inactiveSelectionBackground': '#37373d',
            'list.inactiveSelectionForeground': VSCODE_UI_COLORS.text,
            'list.focusBackground': VSCODE_UI_COLORS.listFocusBg,
            'list.focusForeground': VSCODE_UI_COLORS.listFocusFg,
            'list.highlightForeground': VSCODE_UI_COLORS.listHighlight
        }
    });
}

function nowStamp() {
    return new Date().toLocaleString('zh-CN', { hour12: false });
}

function setStatus(text) {
    if (!dom.editorStatus) return;
    dom.editorStatus.textContent = `[${nowStamp()}] ${String(text || '')}`;
}

function addEvent(level, message) {
    if (!dom.eventLog) return;
    const item = document.createElement('li');
    item.className = 'event-log-item';
    item.setAttribute('data-level', level || 'info');
    item.textContent = `[${nowStamp()}] ${String(message || '')}`;
    dom.eventLog.prepend(item);
    while (dom.eventLog.childElementCount > 60) {
        dom.eventLog.removeChild(dom.eventLog.lastChild);
    }
}

function applyWorkbenchVisibility() {
    if (!dom.appRoot) return;
    dom.appRoot.classList.toggle('is-sidebar-hidden', !state.ui.sidebarVisible);
    dom.appRoot.classList.toggle('is-panel-hidden', !state.ui.panelVisible);

    if (dom.btnToggleBottomPanel) {
        const icon = dom.btnToggleBottomPanel.querySelector('.panel-collapse-icon');
        if (icon) {
            icon.textContent = state.ui.panelVisible ? '▾' : '▴';
        }
        dom.btnToggleBottomPanel.setAttribute('aria-label', state.ui.panelVisible ? '隐藏底部面板' : '显示底部面板');
    }
}

function showSidebar(nextVisible) {
    state.ui.sidebarVisible = !!nextVisible;
    applyWorkbenchVisibility();
    setStatus(state.ui.sidebarVisible ? 'Primary Side Bar 已显示' : 'Primary Side Bar 已隐藏');
}

function toggleSidebar() {
    showSidebar(!state.ui.sidebarVisible);
}

function showBottomPanel(nextVisible) {
    state.ui.panelVisible = !!nextVisible;
    applyWorkbenchVisibility();
    setStatus(state.ui.panelVisible ? 'Panel 已显示' : 'Panel 已隐藏');
}

function toggleBottomPanel() {
    showBottomPanel(!state.ui.panelVisible);
}

function setActivePanelTab(panelTab) {
    const safeTab = String(panelTab || 'problems');
    state.ui.activePanelTab = safeTab;

    dom.panelTabButtons.forEach((button) => {
        const isActive = button.dataset.panelTab === safeTab;
        button.classList.toggle('panel-tab-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    dom.panelViews.forEach((view) => {
        const isActive = view.dataset.panelView === safeTab;
        view.classList.toggle('panel-view-active', isActive);
        view.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
}

function setActiveActivity(activity) {
    const safeActivity = String(activity || 'explorer');
    state.ui.activeActivity = safeActivity;
    dom.activityButtons.forEach((button) => {
        const isActive = button.dataset.activity === safeActivity;
        button.classList.toggle('activity-btn-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function focusExplorer() {
    showSidebar(true);
    setActiveActivity('explorer');
    if (!dom.fileList) return;
    const current = dom.fileList.querySelector('.file-item[aria-current="true"]') || dom.fileList.querySelector('.file-item');
    if (current) {
        current.focus();
    }
}

function saveWorkspaceNow() {
    return saveWorkspace(workspaceSnapshotForSave())
        .then(() => {
            addEvent('info', '工作区已保存');
            setStatus('工作区已保存');
        })
        .catch((error) => {
            addEvent('error', `保存工作区失败：${error.message}`);
            setStatus(`保存失败：${error.message}`);
        });
}

function buildCommandPaletteItems(query) {
    const q = String(query || '').trim().toLowerCase();
    const items = [
        {
            id: 'view.toggle-sidebar',
            label: 'View: Toggle Primary Side Bar',
            detail: '显示/隐藏左侧资源管理器',
            shortcut: VSCODE_SHORTCUTS.TOGGLE_SIDEBAR,
            run() {
                toggleSidebar();
            }
        },
        {
            id: 'view.toggle-panel',
            label: 'View: Toggle Panel',
            detail: '显示/隐藏右侧工具面板',
            shortcut: VSCODE_SHORTCUTS.TOGGLE_PANEL,
            run() {
                toggleBottomPanel();
            }
        },
        {
            id: 'view.focus-explorer',
            label: 'View: Focus Explorer',
            detail: '聚焦文件树',
            shortcut: VSCODE_SHORTCUTS.FOCUS_EXPLORER,
            run() {
                focusExplorer();
            }
        },
        {
            id: 'view.output',
            label: 'View: Show Output',
            detail: '切换到输出日志面板',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('output');
            }
        },
        {
            id: 'file.save',
            label: 'File: Save Workspace',
            detail: '保存当前虚拟工作区',
            shortcut: VSCODE_SHORTCUTS.SAVE_WORKSPACE,
            run() {
                saveWorkspaceNow();
            }
        },
        {
            id: 'file.export',
            label: 'File: Export Workspace',
            detail: '导出 workspace.v1.json',
            shortcut: '',
            run() {
                dom.btnExportWorkspace.click();
            }
        },
        {
            id: 'file.import',
            label: 'File: Import Workspace',
            detail: '导入 workspace.v1.json',
            shortcut: '',
            run() {
                dom.inputImportWorkspace.click();
            }
        },
        {
            id: 'file.new',
            label: 'File: New File',
            detail: '新建 .cs 文件',
            shortcut: '',
            run() {
                dom.btnAddFile.click();
            }
        },
        {
            id: 'file.rename',
            label: 'File: Rename File',
            detail: '重命名当前文件',
            shortcut: 'F2',
            run() {
                dom.btnRenameFile.click();
            }
        },
        {
            id: 'file.delete',
            label: 'File: Delete File',
            detail: '删除当前文件',
            shortcut: 'Del',
            run() {
                dom.btnDeleteFile.click();
            }
        },
        {
            id: 'run.diagnostics',
            label: 'Run: Run Diagnostics',
            detail: '执行规则诊断/增强诊断',
            shortcut: '',
            run() {
                dom.btnRunDiagnostics.click();
            }
        },
        {
            id: 'indexer.panel',
            label: 'Tools: Open Indexer Panel',
            detail: '切换到 Indexer 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('indexer');
            }
        },
        {
            id: 'assembly.panel',
            label: 'Tools: Open Assembly Panel',
            detail: '切换到 Assembly 标签',
            shortcut: '',
            run() {
                showBottomPanel(true);
                setActivePanelTab('assembly');
            }
        }
    ];

    if (!q) return items;
    return items.filter((item) => {
        const label = String(item.label || '').toLowerCase();
        const detail = String(item.detail || '').toLowerCase();
        const shortcut = String(item.shortcut || '').toLowerCase();
        return label.includes(q) || detail.includes(q) || shortcut.includes(q);
    });
}

function buildQuickOpenItems(query) {
    const q = String(query || '').trim().toLowerCase();
    return state.workspace.files
        .filter((file) => !q || String(file.path || '').toLowerCase().includes(q))
        .map((file) => ({
            id: `open:${file.id}`,
            label: file.path,
            detail: 'Open Editor',
            shortcut: '',
            run() {
                switchActiveFile(file.id);
            }
        }));
}

function updateCommandPaletteSelection(nextIndex) {
    if (!dom.commandPaletteResults) return;
    const max = state.ui.paletteItems.length;
    if (!max) {
        state.ui.paletteSelectedIndex = 0;
        return;
    }
    let safe = Number(nextIndex);
    if (!Number.isFinite(safe)) safe = 0;
    if (safe < 0) safe = max - 1;
    if (safe >= max) safe = 0;
    state.ui.paletteSelectedIndex = safe;

    const items = Array.from(dom.commandPaletteResults.querySelectorAll('.command-palette-item'));
    items.forEach((node, index) => {
        const isActive = index === safe;
        node.classList.toggle('command-palette-item-active', isActive);
        node.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
            node.scrollIntoView({ block: 'nearest' });
        }
    });
}

function renderCommandPaletteResults() {
    if (!dom.commandPaletteResults) return;
    dom.commandPaletteResults.innerHTML = '';
    if (!state.ui.paletteItems.length) {
        const empty = document.createElement('li');
        empty.className = 'command-palette-empty';
        empty.textContent = '没有匹配结果';
        dom.commandPaletteResults.appendChild(empty);
        return;
    }

    state.ui.paletteItems.forEach((item, index) => {
        const node = document.createElement('li');
        node.className = 'command-palette-item';
        node.setAttribute('role', 'option');

        const titleRow = document.createElement('div');
        titleRow.className = 'command-palette-item-title';

        const labelNode = document.createElement('span');
        labelNode.textContent = String(item.label || '');
        titleRow.appendChild(labelNode);

        if (item.shortcut) {
            const shortcutNode = document.createElement('span');
            shortcutNode.className = 'command-palette-item-shortcut';
            shortcutNode.textContent = String(item.shortcut);
            titleRow.appendChild(shortcutNode);
        }

        node.appendChild(titleRow);

        if (item.detail) {
            const detailNode = document.createElement('div');
            detailNode.className = 'command-palette-item-detail';
            detailNode.textContent = String(item.detail);
            node.appendChild(detailNode);
        }

        node.addEventListener('mouseenter', () => {
            updateCommandPaletteSelection(index);
        });
        node.addEventListener('click', () => {
            executeCommandPaletteSelection(index);
        });

        dom.commandPaletteResults.appendChild(node);
    });

    updateCommandPaletteSelection(state.ui.paletteSelectedIndex);
}

function refreshCommandPaletteItems() {
    if (!dom.commandPaletteInput) return;
    const query = dom.commandPaletteInput.value;
    if (state.ui.paletteMode === 'quick-open') {
        state.ui.paletteItems = buildQuickOpenItems(query);
    } else {
        state.ui.paletteItems = buildCommandPaletteItems(query);
    }
    if (state.ui.paletteSelectedIndex >= state.ui.paletteItems.length) {
        state.ui.paletteSelectedIndex = 0;
    }
    renderCommandPaletteResults();
}

function closeCommandPalette() {
    if (!dom.commandPalette || !state.ui.paletteOpen) return;
    state.ui.paletteOpen = false;
    dom.commandPalette.hidden = true;
    state.ui.paletteItems = [];
    state.ui.paletteSelectedIndex = 0;
    if (state.editor) {
        state.editor.focus();
    }
}

function openCommandPalette(mode, presetText) {
    if (!dom.commandPalette || !dom.commandPaletteInput) return;
    state.ui.paletteOpen = true;
    state.ui.paletteMode = mode === 'quick-open' ? 'quick-open' : 'commands';
    state.ui.paletteSelectedIndex = 0;
    dom.commandPalette.hidden = false;
    dom.commandPaletteInput.value = String(presetText || '');
    dom.commandPaletteInput.placeholder = state.ui.paletteMode === 'quick-open'
        ? `Quick Open (${VSCODE_SHORTCUTS.QUICK_OPEN})`
        : `输入命令（${VSCODE_SHORTCUTS.COMMAND_PALETTE}）`;
    refreshCommandPaletteItems();
    requestAnimationFrame(() => {
        dom.commandPaletteInput.focus();
        dom.commandPaletteInput.select();
    });
}

function executeCommandPaletteSelection(index) {
    if (!state.ui.paletteItems.length) return;
    const safeIndex = Math.max(0, Math.min(Number(index || 0), state.ui.paletteItems.length - 1));
    const item = state.ui.paletteItems[safeIndex];
    closeCommandPalette();
    if (item && typeof item.run === 'function') {
        item.run();
    }
}

function onActivityClicked(activity) {
    const safeActivity = String(activity || '');
    if (!safeActivity) return;

    if (safeActivity === 'explorer') {
        if (state.ui.activeActivity === 'explorer') {
            toggleSidebar();
        } else {
            setActiveActivity('explorer');
            showSidebar(true);
        }
        return;
    }

    setActiveActivity(safeActivity);
    showSidebar(true);

    if (safeActivity === 'search') {
        openCommandPalette('quick-open', '');
        return;
    }

    if (safeActivity === 'run') {
        showBottomPanel(true);
        setActivePanelTab('problems');
        runDiagnostics();
        return;
    }

    if (safeActivity === 'extensions') {
        showBottomPanel(true);
        setActivePanelTab('assembly');
        addEvent('info', 'Extensions 视图映射到 Assembly 面板');
        return;
    }

    if (safeActivity === 'settings') {
        openCommandPalette('commands', 'View:');
        return;
    }

    if (safeActivity === 'scm') {
        addEvent('info', 'Source Control 视图在独立版中仅保留入口布局');
    }
}

function isCtrlOrMeta(event) {
    return !!(event && (event.ctrlKey || event.metaKey));
}

function handleGlobalShortcuts(event) {
    if (!isCtrlOrMeta(event) || event.altKey) return;

    const key = String(event.key || '').toLowerCase();
    const code = String(event.code || '');

    if (key === 's' && !event.shiftKey) {
        event.preventDefault();
        saveWorkspaceNow();
        return;
    }

    if (key === 'b' && !event.shiftKey) {
        event.preventDefault();
        toggleSidebar();
        return;
    }

    if ((key === 'j' && !event.shiftKey) || code === 'Backquote') {
        event.preventDefault();
        toggleBottomPanel();
        return;
    }

    if (key === 'p' && event.shiftKey) {
        event.preventDefault();
        openCommandPalette('commands', '');
        return;
    }

    if (key === 'p' && !event.shiftKey) {
        event.preventDefault();
        openCommandPalette('quick-open', '');
        return;
    }

    if (key === 'e' && event.shiftKey) {
        event.preventDefault();
        focusExplorer();
    }
}

function createWorkerRpc(worker, workerName) {
    let seq = 1;
    const pending = new Map();

    worker.onmessage = function (event) {
        const message = event && event.data ? event.data : {};
        const id = message.id;
        if (!pending.has(id)) return;

        const deferred = pending.get(id);
        pending.delete(id);

        if (message.type === MESSAGE_TYPES.ERROR) {
            deferred.reject(new Error((message.payload && message.payload.message) || `${workerName} error`));
            return;
        }

        deferred.resolve(message.payload || {});
    };

    return {
        call(type, payload) {
            return new Promise((resolve, reject) => {
                const id = seq++;
                pending.set(id, { resolve, reject });
                worker.postMessage({ id, type, payload: payload || {} });
            });
        }
    };
}

const languageWorker = new Worker(new URL('./workers/language.worker.js', import.meta.url), { type: 'module' });
const languageRpc = createWorkerRpc(languageWorker, 'language-worker');
let roslynRpc = null;

async function ensureRoslynWorker() {
    if (roslynRpc) return roslynRpc;
    const worker = new Worker(new URL('./workers/roslyn.worker.js', import.meta.url), { type: 'module' });
    state.roslynWorker = worker;
    roslynRpc = createWorkerRpc(worker, 'roslyn-worker');
    await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    addEvent('info', '增强诊断 Worker 已加载');
    return roslynRpc;
}

function getActiveFile() {
    const activeId = String(state.workspace.activeFileId || '');
    return state.workspace.files.find((file) => file.id === activeId) || null;
}

function updateFileListUi() {
    if (!dom.fileList) return;
    dom.fileList.innerHTML = '';

    state.workspace.files.forEach((file) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'file-item';
        btn.textContent = file.path;
        btn.setAttribute('aria-current', file.id === state.workspace.activeFileId ? 'true' : 'false');
        btn.addEventListener('click', function () {
            switchActiveFile(file.id);
        });
        li.appendChild(btn);
        dom.fileList.appendChild(li);
    });

    const active = getActiveFile();
    if (dom.activeFileName) {
        dom.activeFileName.textContent = active ? active.path : '(无文件)';
    }
}

function workspaceSnapshotForSave() {
    return {
        schemaVersion: 1,
        activeFileId: state.workspace.activeFileId,
        files: state.workspace.files.map((file) => ({
            id: file.id,
            path: file.path,
            content: String(file.content || '')
        }))
    };
}

function scheduleWorkspaceSave() {
    if (state.saveTimer) {
        clearTimeout(state.saveTimer);
    }

    state.saveTimer = setTimeout(async function () {
        state.saveTimer = 0;
        try {
            await saveWorkspace(workspaceSnapshotForSave());
        } catch (error) {
            addEvent('error', `保存工作区失败：${error.message}`);
        }
    }, 280);
}

function ensureModelForFile(file) {
    if (state.modelByFileId.has(file.id)) {
        return state.modelByFileId.get(file.id);
    }

    const model = monaco.editor.createModel(String(file.content || ''), 'csharp', monaco.Uri.parse(`inmemory://model/${file.id}/${file.path}`));
    model.onDidChangeContent(function () {
        file.content = model.getValue();
        scheduleWorkspaceSave();
        scheduleDiagnostics();
    });

    state.modelByFileId.set(file.id, model);
    return model;
}

function switchActiveFile(fileId) {
    const target = state.workspace.files.find((file) => file.id === fileId);
    if (!target || !state.editor) return;

    state.workspace.activeFileId = target.id;
    const model = ensureModelForFile(target);
    state.editor.setModel(model);
    updateFileListUi();
    scheduleWorkspaceSave();
    runDiagnostics();
}

function removeModelForFile(fileId) {
    if (!state.modelByFileId.has(fileId)) return;
    const model = state.modelByFileId.get(fileId);
    state.modelByFileId.delete(fileId);
    model.dispose();
}

function createFileId() {
    return `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toMonacoSeverity(level) {
    if (level === DIAGNOSTIC_SEVERITY.ERROR) return monaco.MarkerSeverity.Error;
    if (level === DIAGNOSTIC_SEVERITY.WARNING) return monaco.MarkerSeverity.Warning;
    return monaco.MarkerSeverity.Info;
}

function convertCompletionKind(kind) {
    if (kind === 'method') return monaco.languages.CompletionItemKind.Method;
    if (kind === 'property') return monaco.languages.CompletionItemKind.Property;
    if (kind === 'field') return monaco.languages.CompletionItemKind.Field;
    if (kind === 'class') return monaco.languages.CompletionItemKind.Class;
    if (kind === 'keyword') return monaco.languages.CompletionItemKind.Keyword;
    return monaco.languages.CompletionItemKind.Text;
}

function diagnosticsToMarkers(diags) {
    return (Array.isArray(diags) ? diags : []).map((diag) => ({
        severity: toMonacoSeverity(diag.severity),
        message: `[${diag.code}] ${diag.message}`,
        startLineNumber: Number(diag.startLineNumber || 1),
        startColumn: Number(diag.startColumn || 1),
        endLineNumber: Number(diag.endLineNumber || 1),
        endColumn: Number(diag.endColumn || 1)
    }));
}

function buildAnalyzeCacheKey(model, offset, maxItems, features) {
    const featureMask = [
        features && features.completion ? 'c1' : 'c0',
        features && features.hover ? 'h1' : 'h0',
        features && features.diagnostics ? 'd1' : 'd0'
    ].join('');
    return [
        model && model.uri ? String(model.uri) : 'model',
        model && model.getVersionId ? String(model.getVersionId()) : '0',
        String(Math.max(0, Number(offset) || 0)),
        String(Math.max(10, Math.min(200, Number(maxItems || 80)))),
        featureMask
    ].join('|');
}

async function requestAnalyzeFromModel(model, offset, options) {
    if (!model) {
        return {
            completionItems: [],
            hover: null,
            diagnosticsRule: [],
            meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
        };
    }

    const maxItems = Math.max(10, Math.min(200, Number(options && options.maxItems || 80)));
    const features = {
        completion: !!(options && options.completion),
        hover: !!(options && options.hover),
        diagnostics: !!(options && options.diagnostics)
    };
    const cacheKey = buildAnalyzeCacheKey(model, offset, maxItems, features);
    if (state.analyzeCache.has(cacheKey)) {
        return await state.analyzeCache.get(cacheKey);
    }

    const request = {
        text: model.getValue(),
        offset: Math.max(0, Number(offset) || 0),
        maxItems,
        features
    };

    const promise = languageRpc.call(MESSAGE_TYPES.ANALYZE_V2_REQUEST, request).finally(() => {
        if (state.analyzeCache.size > 24) {
            const oldestKey = state.analyzeCache.keys().next().value;
            if (oldestKey) state.analyzeCache.delete(oldestKey);
        }
    });

    state.analyzeCache.set(cacheKey, promise);
    return await promise;
}

async function runDiagnostics() {
    const model = state.editor ? state.editor.getModel() : null;
    if (!model) return;

    const position = state.editor && state.editor.getPosition ? state.editor.getPosition() : null;
    const offset = position ? model.getOffsetAt(position) : 0;
    const source = { text: model.getValue() };

    try {
        const analyzePayload = await requestAnalyzeFromModel(model, offset, {
            completion: false,
            hover: false,
            diagnostics: true
        });
        let allDiags = Array.isArray(analyzePayload.diagnosticsRule) ? analyzePayload.diagnosticsRule : [];

        if (state.roslynEnabled) {
            const rpc = await ensureRoslynWorker();
            const roslynPayload = await rpc.call(MESSAGE_TYPES.DIAGNOSTICS_ROSLYN_REQUEST, source);
            const roslynDiags = Array.isArray(roslynPayload.diagnostics) ? roslynPayload.diagnostics : [];
            allDiags = allDiags.concat(roslynDiags);
        }

        monaco.editor.setModelMarkers(model, 'tml-ide', diagnosticsToMarkers(allDiags));
        setStatus(`诊断完成：${allDiags.length} 条`);
    } catch (error) {
        addEvent('error', `运行诊断失败：${error.message}`);
    }
}

function scheduleDiagnostics() {
    if (state.diagnosticsTimer) {
        clearTimeout(state.diagnosticsTimer);
    }

    state.diagnosticsTimer = setTimeout(function () {
        state.diagnosticsTimer = 0;
        runDiagnostics();
    }, 420);
}

function updateIndexInfo(stats) {
    if (!dom.indexInfo) return;
    if (!stats) {
        dom.indexInfo.textContent = 'api-index.v2';
        return;
    }
    dom.indexInfo.textContent = `api-index.v2 · T:${stats.types} M:${stats.methods}`;
}

function downloadTextFile(fileName, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function quoteArg(value) {
    const safe = String(value || '').trim();
    if (!safe) return '""';
    return `"${safe.replace(/"/g, '\\"')}"`;
}

function buildRequiredArg(flag, value, placeholder) {
    const safe = String(value || '').trim();
    return safe ? `${flag} ${quoteArg(safe)}` : `${flag} <${placeholder}>`;
}

function buildOptionalArg(flag, value) {
    const safe = String(value || '').trim();
    return safe ? `${flag} ${quoteArg(safe)}` : '';
}

function buildIndexCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', dom.inputIndexerDllPath.value, 'tModLoader.dll'));
    const xmlArg = buildOptionalArg('--xml', dom.inputIndexerXmlPath.value);
    if (xmlArg) parts.push(xmlArg);
    const terrariaDllArg = buildOptionalArg('--terraria-dll', dom.inputIndexerTerrariaDllPath.value);
    if (terrariaDllArg) parts.push(terrariaDllArg);
    const terrariaXmlArg = buildOptionalArg('--terraria-xml', dom.inputIndexerTerrariaXmlPath.value);
    if (terrariaXmlArg) parts.push(terrariaXmlArg);
    parts.push(buildRequiredArg('--out', dom.inputIndexerOutPath.value, 'api-index.v2.json'));
    return parts.join(' ');
}

function buildAppendCommandText() {
    const parts = ['dotnet run --project tml-ide-app/tooling/indexer --'];
    parts.push(buildRequiredArg('--dll', dom.inputAppendDllPath.value, 'extra-mod.dll'));
    const xmlArg = buildOptionalArg('--xml', dom.inputAppendXmlPath.value);
    if (xmlArg) parts.push(xmlArg);
    parts.push(buildRequiredArg('--append', dom.inputAppendOutPath.value, 'session-pack.v1.json'));
    return parts.join(' ');
}

function refreshIndexerCommandPreview() {
    if (dom.indexCommandPreview) {
        dom.indexCommandPreview.textContent = buildIndexCommandText();
    }
    if (dom.appendCommandPreview) {
        dom.appendCommandPreview.textContent = buildAppendCommandText();
    }
}

async function copyToClipboard(text) {
    const safe = String(text || '');
    if (!safe) return false;

    if (globalThis.navigator && navigator.clipboard && globalThis.isSecureContext) {
        await navigator.clipboard.writeText(safe);
        return true;
    }

    const area = document.createElement('textarea');
    area.value = safe;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.left = '-2000px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return !!ok;
}

async function applyIndex(nextIndex, sourceLabel) {
    state.index = normalizeApiIndex(nextIndex);
    const result = await languageRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    updateIndexInfo(result.stats || null);
    if (roslynRpc) {
        await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
    }
    const safeLabel = String(sourceLabel || '索引');
    const typeCount = result && result.stats ? result.stats.types : Object.keys(state.index.types).length;
    addEvent('info', `${safeLabel} 已生效：${typeCount} types`);
    runDiagnostics();
}

async function loadInitialIndex() {
    const url = `${import.meta.env.BASE_URL}data/api-index.v2.json`;
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        await applyIndex(json, '基础索引');
    } catch (error) {
        state.index = createEmptyApiIndex();
        await languageRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
        addEvent('error', `基础索引加载失败，将使用空索引：${error.message}`);
        updateIndexInfo(null);
    }
}

function applyWorkspace(nextWorkspace) {
    const currentIds = new Set(state.workspace.files.map((file) => file.id));
    const nextIds = new Set(nextWorkspace.files.map((file) => file.id));

    currentIds.forEach((id) => {
        if (!nextIds.has(id)) {
            removeModelForFile(id);
        }
    });

    state.workspace = nextWorkspace;
    state.workspace.files.forEach((file) => {
        ensureModelForFile(file);
    });

    updateFileListUi();
    switchActiveFile(state.workspace.activeFileId);
    scheduleWorkspaceSave();
}

function installEditorProviders() {
    monaco.languages.registerCompletionItemProvider('csharp', {
        triggerCharacters: ['.'],
        async provideCompletionItems(model, position) {
            const offset = model.getOffsetAt(position);
            const payload = await requestAnalyzeFromModel(model, offset, {
                completion: true,
                hover: false,
                diagnostics: false,
                maxItems: 120
            });

            const items = Array.isArray(payload.completionItems) ? payload.completionItems : [];
            return {
                suggestions: items.map((item) => ({
                    label: item.label,
                    kind: convertCompletionKind(item.kind),
                    insertText: item.insertText || item.label,
                    detail: item.detail || '',
                    documentation: item.documentation || '',
                    sortText: item.sortText || item.label,
                    range: undefined
                }))
            };
        }
    });

    monaco.languages.registerHoverProvider('csharp', {
        async provideHover(model, position) {
            const offset = model.getOffsetAt(position);
            const payload = await requestAnalyzeFromModel(model, offset, {
                completion: false,
                hover: true,
                diagnostics: false
            });
            const hover = payload && payload.hover ? payload.hover : null;
            if (!hover) return null;

            const start = model.getPositionAt(hover.startOffset);
            const end = model.getPositionAt(hover.endOffset);

            return {
                range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                contents: [{ value: hover.markdown || '' }]
            };
        }
    });
}

function bindUiEvents() {
    dom.activityButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onActivityClicked(button.dataset.activity);
        });
    });

    dom.panelTabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            showBottomPanel(true);
            setActivePanelTab(button.dataset.panelTab);
        });
    });

    if (dom.btnToggleBottomPanel) {
        dom.btnToggleBottomPanel.addEventListener('click', () => {
            toggleBottomPanel();
        });
    }

    if (dom.commandPaletteBackdrop) {
        dom.commandPaletteBackdrop.addEventListener('click', () => {
            closeCommandPalette();
        });
    }

    if (dom.commandPaletteInput) {
        dom.commandPaletteInput.addEventListener('input', () => {
            state.ui.paletteSelectedIndex = 0;
            refreshCommandPaletteItems();
        });

        dom.commandPaletteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeCommandPalette();
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                updateCommandPaletteSelection(state.ui.paletteSelectedIndex + 1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                updateCommandPaletteSelection(state.ui.paletteSelectedIndex - 1);
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                executeCommandPaletteSelection(state.ui.paletteSelectedIndex);
            }
        });
    }

    window.addEventListener('keydown', (event) => {
        if (state.ui.paletteOpen && event.key === 'Escape') {
            closeCommandPalette();
            return;
        }
        handleGlobalShortcuts(event);
    });

    dom.btnAddFile.addEventListener('click', function () {
        const input = globalThis.prompt('请输入新文件名（.cs）', 'NewFile.cs');
        if (!input) return;

        const fileName = input.trim();
        if (!fileName.toLowerCase().endsWith('.cs')) {
            addEvent('error', '文件名必须以 .cs 结尾');
            return;
        }

        const exists = state.workspace.files.some((file) => file.path.toLowerCase() === fileName.toLowerCase());
        if (exists) {
            addEvent('error', `文件已存在：${fileName}`);
            return;
        }

        const file = {
            id: createFileId(),
            path: fileName,
            content: ''
        };

        state.workspace.files.push(file);
        ensureModelForFile(file);
        switchActiveFile(file.id);
        updateFileListUi();
        scheduleWorkspaceSave();
        addEvent('info', `已新增文件：${fileName}`);
    });

    dom.btnRenameFile.addEventListener('click', function () {
        const active = getActiveFile();
        if (!active) return;

        const input = globalThis.prompt('请输入新的文件名（.cs）', active.path);
        if (!input) return;

        const next = input.trim();
        if (!next.toLowerCase().endsWith('.cs')) {
            addEvent('error', '文件名必须以 .cs 结尾');
            return;
        }

        const exists = state.workspace.files.some((file) => {
            return file.id !== active.id && file.path.toLowerCase() === next.toLowerCase();
        });
        if (exists) {
            addEvent('error', `文件名冲突：${next}`);
            return;
        }

        active.path = next;
        updateFileListUi();
        scheduleWorkspaceSave();
        addEvent('info', `已重命名为：${next}`);
    });

    dom.btnDeleteFile.addEventListener('click', function () {
        const active = getActiveFile();
        if (!active) return;
        if (state.workspace.files.length <= 1) {
            addEvent('error', '至少保留一个文件');
            return;
        }

        const ok = globalThis.confirm(`确认删除 ${active.path} ?`);
        if (!ok) return;

        state.workspace.files = state.workspace.files.filter((file) => file.id !== active.id);
        removeModelForFile(active.id);
        state.workspace.activeFileId = state.workspace.files[0].id;
        updateFileListUi();
        switchActiveFile(state.workspace.activeFileId);
        scheduleWorkspaceSave();
        addEvent('info', `已删除文件：${active.path}`);
    });

    dom.btnRunDiagnostics.addEventListener('click', runDiagnostics);

    dom.btnSaveWorkspace.addEventListener('click', function () {
        saveWorkspaceNow();
    });

    dom.btnExportWorkspace.addEventListener('click', function () {
        const text = exportWorkspaceJson(workspaceSnapshotForSave());
        downloadTextFile('workspace.v1.json', text, 'application/json;charset=utf-8');
        addEvent('info', '已导出 workspace.v1.json');
    });

    dom.inputImportWorkspace.addEventListener('change', async function () {
        const file = dom.inputImportWorkspace.files && dom.inputImportWorkspace.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const workspace = importWorkspaceJson(text);
            applyWorkspace(workspace);
            addEvent('info', `已导入工作区：${file.name}`);
        } catch (error) {
            addEvent('error', `导入失败：${error.message}`);
        } finally {
            dom.inputImportWorkspace.value = '';
        }
    });

    dom.toggleRoslyn.addEventListener('change', async function () {
        state.roslynEnabled = !!dom.toggleRoslyn.checked;
        if (state.roslynEnabled) {
            await ensureRoslynWorker();
        }
        runDiagnostics();
    });

    dom.btnImportAssembly.addEventListener('click', async function () {
        const dllFile = dom.inputExtraDll.files && dom.inputExtraDll.files[0];
        const xmlFile = dom.inputExtraXml.files && dom.inputExtraXml.files[0];
        if (!dllFile || !xmlFile) {
            addEvent('error', '请同时选择 DLL 与 XML 文件');
            return;
        }

        try {
            const xmlText = await xmlFile.text();
            const result = await languageRpc.call(MESSAGE_TYPES.ASSEMBLY_IMPORT_REQUEST, {
                dllName: dllFile.name,
                xmlText
            });

            const patch = buildPatchIndexFromXml(xmlText, dllFile.name);
            state.index = mergeApiIndex(state.index, patch);
            updateIndexInfo(result.stats || null);

            if (roslynRpc) {
                await roslynRpc.call(MESSAGE_TYPES.INDEX_SET, { index: state.index });
            }

            addEvent(
                'info',
                `导入完成：${result.summary.assemblyName}，新增 ${result.summary.importedTypes} types，总计 ${result.summary.totalTypes}`
            );

            runDiagnostics();
        } catch (error) {
            addEvent('error', `程序集导入失败：${error.message}`);
        }
    });

    const indexerInputs = [
        dom.inputIndexerDllPath,
        dom.inputIndexerXmlPath,
        dom.inputIndexerTerrariaDllPath,
        dom.inputIndexerTerrariaXmlPath,
        dom.inputIndexerOutPath,
        dom.inputAppendDllPath,
        dom.inputAppendXmlPath,
        dom.inputAppendOutPath
    ];

    indexerInputs.forEach((input) => {
        if (!input) return;
        input.addEventListener('input', refreshIndexerCommandPreview);
    });

    dom.btnCopyIndexCommand.addEventListener('click', async function () {
        try {
            const ok = await copyToClipboard(buildIndexCommandText());
            if (!ok) {
                throw new Error('浏览器拒绝复制');
            }
            addEvent('info', '已复制基础索引命令');
        } catch (error) {
            addEvent('error', `复制失败：${error.message}`);
        }
    });

    dom.btnCopyAppendCommand.addEventListener('click', async function () {
        try {
            const ok = await copyToClipboard(buildAppendCommandText());
            if (!ok) {
                throw new Error('浏览器拒绝复制');
            }
            addEvent('info', '已复制追加命令');
        } catch (error) {
            addEvent('error', `复制失败：${error.message}`);
        }
    });

    dom.btnImportIndex.addEventListener('click', async function () {
        const file = dom.inputImportIndex.files && dom.inputImportIndex.files[0];
        if (!file) {
            addEvent('error', '请先选择 api-index.v2.json 文件');
            return;
        }

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            await applyIndex(json, `导入索引 ${file.name}`);
        } catch (error) {
            addEvent('error', `导入索引失败：${error.message}`);
        } finally {
            dom.inputImportIndex.value = '';
        }
    });
}

async function bootstrap() {
    dom.workspaceVersion.textContent = 'workspace.v1';
    const enhancedCsharpLanguage = createEnhancedCsharpLanguage(csharpLanguage);
    monaco.languages.setLanguageConfiguration('csharp', csharpConf);
    monaco.languages.setMonarchTokensProvider('csharp', enhancedCsharpLanguage);
    registerRiderDarkMonacoTheme();
    setActiveActivity(state.ui.activeActivity);
    setActivePanelTab(state.ui.activePanelTab);
    applyWorkbenchVisibility();

    if (dom.commandPalette) {
        dom.commandPalette.hidden = true;
    }
    if (dom.commandPaletteInput) {
        dom.commandPaletteInput.placeholder = `输入命令（${VSCODE_SHORTCUTS.COMMAND_PALETTE}）`;
    }

    state.initialized = false;
    setStatus('初始化中...');

    state.editor = monaco.editor.create(dom.editor, {
        language: 'csharp',
        theme: 'tml-rider-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        tabSize: 4,
        insertSpaces: true,
        fontSize: 14,
        smoothScrolling: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        readOnly: true
    });

    globalThis.__tmlIdeDebug = {
        isReady() {
            return !!state.initialized;
        },
        triggerSuggest() {
            if (!state.initialized || !state.editor) return Promise.resolve();
            const action = state.editor.getAction('editor.action.triggerSuggest');
            if (action) {
                return action.run();
            }
            state.editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
            return Promise.resolve();
        },
        setEditorText(text) {
            if (!state.initialized || !state.editor || !state.editor.getModel()) return false;
            state.editor.getModel().setValue(String(text || ''));
            return true;
        },
        setCursorAfterText(needle) {
            if (!state.initialized || !state.editor || !state.editor.getModel()) return false;
            const model = state.editor.getModel();
            const text = model.getValue();
            const safeNeedle = String(needle || '');
            if (!safeNeedle) return false;
            const index = text.indexOf(safeNeedle);
            if (index < 0) return false;
            const position = model.getPositionAt(index + safeNeedle.length);
            state.editor.setPosition(position);
            state.editor.focus();
            return true;
        },
        getEditorText() {
            if (!state.editor || !state.editor.getModel()) return '';
            return state.editor.getModel().getValue();
        },
        async requestAnalyzeAtCursor(options) {
            if (!state.initialized || !state.editor) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const model = state.editor.getModel();
            if (!model) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const position = state.editor.getPosition();
            if (!position) {
                return {
                    completionItems: [],
                    hover: null,
                    diagnosticsRule: [],
                    meta: { parsed: false, syntaxErrors: 0, elapsedMs: 0 }
                };
            }
            const offset = model.getOffsetAt(position);
            return await requestAnalyzeFromModel(model, offset, {
                completion: !options || options.completion !== false,
                hover: !!(options && options.hover),
                diagnostics: !!(options && options.diagnostics),
                maxItems: Number(options && options.maxItems || 80)
            });
        },
        async requestCompletionsAtCursor(maxItems) {
            const result = await this.requestAnalyzeAtCursor({
                completion: true,
                hover: false,
                diagnostics: false,
                maxItems: Number(maxItems || 80)
            });
            return Array.isArray(result && result.completionItems) ? result.completionItems : [];
        },
        async requestHoverAtCursor() {
            const result = await this.requestAnalyzeAtCursor({
                completion: false,
                hover: true,
                diagnostics: false
            });
            return result && result.hover ? result.hover : null;
        }
    };

    installEditorProviders();
    bindUiEvents();
    refreshIndexerCommandPreview();

    await loadInitialIndex();

    const workspace = await loadWorkspace();
    applyWorkspace(workspace);
    state.initialized = true;
    state.editor.updateOptions({ readOnly: false });

    addEvent('info', 'tML IDE 初始化完成');
    setStatus('就绪');
    runDiagnostics();
}

bootstrap().catch((error) => {
    state.initialized = false;
    addEvent('error', `初始化失败：${error.message}`);
    setStatus(`初始化失败：${error.message}`);
});
