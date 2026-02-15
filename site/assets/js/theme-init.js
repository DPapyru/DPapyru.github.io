// Early theme initialization to avoid FOUC (Flash Of Unstyled Content).
// Must be loaded in <head> (non-defer).
(function () {
    var MODE_THEME = {
        light: 'light',
        dark: 'dark',
        special: 'dark'
    };

    var MODE_ACCENTS = {
        light: ['green', 'blue', 'purple', 'orange', 'red', 'cyan'],
        dark: ['green', 'blue', 'purple', 'orange', 'red', 'cyan'],
        special: [
            'vs', 'git', 'black', 'white',
            'terraria-crimson', 'terraria-corruption', 'terraria-hallow', 'terraria-tundra', 'terraria-desert'
        ]
    };

    var DEFAULT_MODE = 'dark';
    var DEFAULT_ACCENTS = {
        light: 'green',
        dark: 'green',
        special: 'vs'
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
        white: true,
        'terraria-crimson': true,
        'terraria-corruption': true,
        'terraria-hallow': true,
        'terraria-tundra': true,
        'terraria-desert': true
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

    function resolveMode(storedMode, storedTheme, normalizedAccent) {
        var mode = normalizeMode(storedMode);
        if (mode) return mode;

        if (storedTheme === 'light') return 'light';
        if (storedTheme === 'dark') return 'dark';

        if (SPECIAL_ACCENTS[normalizedAccent]) return 'special';
        return DEFAULT_MODE;
    }

    function resolveAccent(mode, normalizedAccent) {
        var allowed = MODE_ACCENTS[mode] || [];
        if (allowed.indexOf(normalizedAccent) >= 0) return normalizedAccent;
        return DEFAULT_ACCENTS[mode];
    }

    try {
        var savedAccent = normalizeAccent(localStorage.getItem('accent'));
        var savedMode = localStorage.getItem('theme-mode');
        var savedTheme = localStorage.getItem('theme');

        var mode = resolveMode(savedMode, savedTheme, savedAccent);
        var accent = resolveAccent(mode, savedAccent);

        document.documentElement.setAttribute('data-theme-mode', mode);
        document.documentElement.setAttribute('data-theme', MODE_THEME[mode]);
        document.documentElement.setAttribute('data-accent', accent);

        localStorage.setItem('theme-mode', mode);
        localStorage.setItem('theme', MODE_THEME[mode]);
        localStorage.setItem('accent', accent);
    } catch (_) {
        // Ignore storage/privacy errors.
        document.documentElement.setAttribute('data-theme-mode', DEFAULT_MODE);
        document.documentElement.setAttribute('data-theme', MODE_THEME[DEFAULT_MODE]);
        document.documentElement.setAttribute('data-accent', DEFAULT_ACCENTS[DEFAULT_MODE]);
    }
})();
