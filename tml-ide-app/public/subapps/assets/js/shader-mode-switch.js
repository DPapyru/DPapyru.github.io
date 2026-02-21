// Shader playground mode switch: Toy-HLSL <-> DPapyru--
// Style: semicolons, 4-space indent, IIFE.

(function () {
    'use strict';

    const STORAGE_KEY = 'shader-playground.mode';

    function $(id) {
        return document.getElementById(id);
    }

    function readStoredMode() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw === 'dp' ? 'dp' : 'hlsl';
        } catch (_) {
            return 'hlsl';
        }
    }

    function saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (_) { }
    }

    function setBtnActive(btn, active) {
        if (!btn) return;
        if (active) btn.classList.add('active');
        else btn.classList.remove('active');
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }

    function applyMode(mode) {
        const shell = $('shaderpg-shell');
        const hlslBtn = $('shaderpg-mode-hlsl');
        const dpBtn = $('shaderpg-mode-dp');
        const modeIndicator = $('shaderpg-mode-indicator');
        const titleEl = document.querySelector('.tutorial-title');
        const currentCrumb = document.querySelector('.breadcrumb .current');
        const metaEl = document.querySelector('.tutorial-meta span');

        if (!shell || !hlslBtn || !dpBtn) return;

        const resolved = mode === 'dp' ? 'dp' : 'hlsl';
        shell.setAttribute('data-mode', resolved);
        setBtnActive(hlslBtn, resolved === 'hlsl');
        setBtnActive(dpBtn, resolved === 'dp');

        if (modeIndicator) {
            if (resolved === 'dp') {
                modeIndicator.textContent = '当前模式: DPapyru--';
                modeIndicator.classList.remove('is-hlsl');
                modeIndicator.classList.add('is-dp');
            } else {
                modeIndicator.textContent = '当前模式: Toy-HLSL';
                modeIndicator.classList.remove('is-dp');
                modeIndicator.classList.add('is-hlsl');
            }
        }

        if (titleEl) {
            titleEl.textContent = resolved === 'dp'
                ? 'DPapyru-- Trail Playground'
                : 'HLSL Shader Playground';
        }

        if (currentCrumb) {
            currentCrumb.textContent = resolved === 'dp'
                ? 'DPapyru-- Trail Playground'
                : 'HLSL Shader Playground';
        }

        if (metaEl) {
            metaEl.textContent = resolved === 'dp'
                ? '用途: tModLoader 拖尾与刀光轨迹脚本编写'
                : '用途: tModLoader Shader 开发与调试';
        }

        saveMode(resolved);
    }

    function init() {
        const hlslBtn = $('shaderpg-mode-hlsl');
        const dpBtn = $('shaderpg-mode-dp');

        if (!hlslBtn || !dpBtn) return;

        hlslBtn.addEventListener('click', function () {
            applyMode('hlsl');
        });

        dpBtn.addEventListener('click', function () {
            applyMode('dp');
        });

        applyMode(readStoredMode());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
