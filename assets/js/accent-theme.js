// Accent preset switcher (dark-mode only).
(function () {
    'use strict';

    const ALLOWED_ACCENTS = {
        forest: true,
        ocean: true,
        grape: true,
        amber: true,
        crimson: true,
        dim: true
    };

    function normalizeAccent(value) {
        const key = String(value || '').trim();
        return ALLOWED_ACCENTS[key] ? key : 'forest';
    }

    function getCurrentAccent() {
        const attr = document.documentElement.getAttribute('data-accent');
        return normalizeAccent(attr || 'forest');
    }

    function setAccent(value) {
        const accent = normalizeAccent(value);
        document.documentElement.setAttribute('data-accent', accent);

        try {
            localStorage.setItem('accent', accent);
        } catch (_) {
            // Ignore storage/privacy errors.
        }
    }

    function init() {
        const select = document.getElementById('accent-select');
        if (!select) return;

        const current = getCurrentAccent();
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
