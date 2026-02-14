// Accent preset switcher (dark-mode only).
(function () {
    'use strict';

    var ALLOWED_ACCENTS = {
        green: true,
        blue: true,
        purple: true,
        orange: true,
        red: true,
        cyan: true,
        vs: true,
        git: true,
        black: true,
        white: true
    };

    var LEGACY_MAP = {
        forest: 'green',
        ocean: 'blue',
        grape: 'purple',
        amber: 'orange',
        crimson: 'red',
        dim: 'cyan'
    };

    function normalizeAccent(value) {
        var key = String(value || '').trim();
        if (LEGACY_MAP[key]) key = LEGACY_MAP[key];
        return ALLOWED_ACCENTS[key] ? key : 'green';
    }

    function getCurrentAccent() {
        var attr = document.documentElement.getAttribute('data-accent');
        return normalizeAccent(attr || 'green');
    }

    function setAccent(value) {
        var accent = normalizeAccent(value);
        document.documentElement.setAttribute('data-accent', accent);

        try {
            localStorage.setItem('accent', accent);
        } catch (_) {
            // Ignore storage/privacy errors.
        }
    }

    function init() {
        var select = document.getElementById('accent-select');
        if (!select) return;

        var current = getCurrentAccent();
        if (select.value !== current) select.value = current;

        select.addEventListener('change', function () {
            setAccent(select.value);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
