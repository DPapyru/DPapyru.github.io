// Theme mode + accent preset switcher.
(function () {
    'use strict';

    var MODE_THEME = {
        light: 'light',
        dark: 'dark',
        special: 'dark'
    };

    var MODE_OPTIONS = [
        { value: 'light', label: '亮色' },
        { value: 'dark', label: '暗色' },
        { value: 'special', label: '特殊' }
    ];

    var MODE_ACCENTS = {
        light: ['green', 'blue', 'purple', 'orange', 'red', 'cyan'],
        dark: ['green', 'blue', 'purple', 'orange', 'red', 'cyan'],
        special: ['vs', 'git', 'black', 'white']
    };

    var DEFAULT_MODE = 'dark';
    var DEFAULT_ACCENT = {
        light: 'green',
        dark: 'green',
        special: 'vs'
    };

    var ACCENT_LABELS = {
        green: '绿色',
        blue: '蓝色',
        purple: '紫色',
        orange: '橙色',
        red: '红色',
        cyan: '青色',
        black: '黑色',
        white: '白色',
        vs: 'VS',
        git: 'Git'
    };

    var LEGACY_MAP = {
        forest: 'green',
        ocean: 'blue',
        grape: 'purple',
        amber: 'orange',
        crimson: 'red',
        dim: 'cyan'
    };

    var SPECIAL_ACCENTS = {
        vs: true,
        git: true,
        black: true,
        white: true
    };

    function normalizeMode(value) {
        var key = String(value || '').trim().toLowerCase();
        return MODE_ACCENTS[key] ? key : '';
    }

    function normalizeAccent(value) {
        var key = String(value || '').trim();
        if (LEGACY_MAP[key]) key = LEGACY_MAP[key];
        return key;
    }

    function resolveMode(modeValue, themeValue, accentValue) {
        var mode = normalizeMode(modeValue);
        if (mode) return mode;

        if (themeValue === 'light') return 'light';
        if (themeValue === 'dark') {
            if (SPECIAL_ACCENTS[accentValue]) return 'special';
            return 'dark';
        }

        if (SPECIAL_ACCENTS[accentValue]) return 'special';
        return DEFAULT_MODE;
    }

    function resolveAccent(mode, accentValue) {
        var accent = normalizeAccent(accentValue);
        var allowed = MODE_ACCENTS[mode] || [];
        if (allowed.indexOf(accent) >= 0) return accent;
        return DEFAULT_ACCENT[mode];
    }

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function applyState(mode, accent) {
        var theme = MODE_THEME[mode];
        document.documentElement.setAttribute('data-theme-mode', mode);
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-accent', accent);

        try {
            localStorage.setItem('theme-mode', mode);
            localStorage.setItem('theme', theme);
            localStorage.setItem('accent', accent);
        } catch (_) {
            // Ignore storage/privacy errors.
        }
    }

    function createOption(value, label) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    function clearSelect(select) {
        while (select.children.length > 0) {
            select.removeChild(select.children[0]);
        }
    }

    function rebuildModeOptions(modeSelect) {
        clearSelect(modeSelect);
        for (var i = 0; i < MODE_OPTIONS.length; i += 1) {
            var modeOption = MODE_OPTIONS[i];
            modeSelect.appendChild(createOption(modeOption.value, modeOption.label));
        }
    }

    function rebuildAccentOptions(accentSelect, mode, selectedAccent) {
        var accents = MODE_ACCENTS[mode] || [];
        clearSelect(accentSelect);
        for (var i = 0; i < accents.length; i += 1) {
            var accentValue = accents[i];
            accentSelect.appendChild(createOption(accentValue, ACCENT_LABELS[accentValue] || accentValue));
        }
        var normalized = resolveAccent(mode, selectedAccent);
        accentSelect.value = normalized;
        return normalized;
    }

    function ensureModeSelect(accentSelect) {
        var existing = document.getElementById('theme-mode-select');
        if (existing) return existing;

        var accentItem = accentSelect.parentNode;
        if (!accentItem || !accentItem.parentNode) return null;

        var modeItem = document.createElement('li');
        modeItem.className = 'nav-item nav-theme-mode';

        var label = document.createElement('label');
        label.className = 'visually-hidden';
        label.setAttribute('for', 'theme-mode-select');
        label.textContent = '主题模式';

        var select = document.createElement('select');
        select.className = 'nav-accent-select nav-mode-select';
        select.id = 'theme-mode-select';
        select.setAttribute('aria-label', '主题模式');

        modeItem.appendChild(label);
        modeItem.appendChild(select);

        accentItem.parentNode.insertBefore(modeItem, accentItem);
        return select;
    }

    function init() {
        var accentSelect = document.getElementById('accent-select');
        if (!accentSelect) return;

        var modeSelect = ensureModeSelect(accentSelect);
        if (!modeSelect) return;

        rebuildModeOptions(modeSelect);

        var attrAccent = normalizeAccent(document.documentElement.getAttribute('data-accent'));
        var storedAccent = normalizeAccent(readStorage('accent'));
        var attrTheme = document.documentElement.getAttribute('data-theme');
        var attrMode = normalizeMode(document.documentElement.getAttribute('data-theme-mode'));
        var storedMode = readStorage('theme-mode');

        var mode = resolveMode(storedMode || attrMode, attrTheme, storedAccent || attrAccent);
        var accent = rebuildAccentOptions(accentSelect, mode, storedAccent || attrAccent);
        modeSelect.value = mode;
        applyState(mode, accent);

        modeSelect.addEventListener('change', function () {
            var nextMode = resolveMode(modeSelect.value, document.documentElement.getAttribute('data-theme'), accentSelect.value);
            var nextAccent = rebuildAccentOptions(accentSelect, nextMode, accentSelect.value);
            modeSelect.value = nextMode;
            applyState(nextMode, nextAccent);
        });

        accentSelect.addEventListener('change', function () {
            var currentMode = resolveMode(modeSelect.value, document.documentElement.getAttribute('data-theme'), accentSelect.value);
            var nextAccent = resolveAccent(currentMode, accentSelect.value);
            accentSelect.value = nextAccent;
            applyState(currentMode, nextAccent);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
