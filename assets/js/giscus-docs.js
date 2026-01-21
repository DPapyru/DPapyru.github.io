// Docs viewer Giscus integration (best-effort; never blocks content rendering).
(function () {
    'use strict';

    const GISCUS_ORIGIN = 'https://giscus.app';
    const GISCUS_OPTIONS = {
        repo: 'DPapyru/DPapyru.github.io',
        repoId: 'R_kgDOQczhug',
        mapping: 'specific',
        theme: 'dark_dimmed',
        lang: 'zh-CN'
    };

    function findGiscusContainer() {
        return document.getElementById('giscus-container');
    }

    function findGiscusIframe(container) {
        if (!container) return null;
        return container.querySelector('iframe.giscus-frame');
    }

    function postGiscusTerm(container, term) {
        const iframe = findGiscusIframe(container);
        if (!iframe || !iframe.contentWindow) return false;

        const src = String(iframe.getAttribute('src') || '').trim();
        // When the iframe is created but not navigated yet, it can be about:blank (same-origin),
        // posting with a strict targetOrigin would throw. Retry later.
        if (!src || src === 'about:blank') return false;
        if (!src.startsWith(GISCUS_ORIGIN)) return false;

        try {
            iframe.contentWindow.postMessage(
                { giscus: { setConfig: { term: String(term) } } },
                GISCUS_ORIGIN
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    function retryPostTerm(container, term) {
        if (!container) return;
        const maxTries = 20;
        const delayMs = 150;
        let tries = 0;

        const tick = function () {
            tries += 1;
            if (postGiscusTerm(container, term)) return;
            if (tries >= maxTries) return;
            window.setTimeout(tick, delayMs);
        };

        window.setTimeout(tick, delayMs);
    }

    function ensureGiscusLoaded(container, term) {
        if (!container) return;

        const existingScript = container.querySelector('script[data-giscus-script="true"]');
        const existingIframe = findGiscusIframe(container);
        if (existingIframe) {
            if (!postGiscusTerm(container, term)) {
                retryPostTerm(container, term);
            }
            return;
        }

        if (existingScript) return;

        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-giscus-script', 'true');
        script.setAttribute('data-repo', GISCUS_OPTIONS.repo);
        script.setAttribute('data-repo-id', GISCUS_OPTIONS.repoId);
        script.setAttribute('data-mapping', GISCUS_OPTIONS.mapping);
        script.setAttribute('data-term', String(term));
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'top');
        script.setAttribute('data-theme', GISCUS_OPTIONS.theme);
        script.setAttribute('data-lang', GISCUS_OPTIONS.lang);
        script.setAttribute('data-loading', 'lazy');
        container.appendChild(script);

        // The iframe is injected asynchronously; schedule a best-effort retry so term updates don't throw.
        retryPostTerm(container, term);
    }

    function normalizeTerm(docPath) {
        return String(docPath || '')
            .replace(/^(\.\/)+/, '')
            .replace(/^\/+/, '')
            .trim();
    }

    window.updateGiscusForDoc = function (docPath) {
        try {
            const container = findGiscusContainer();
            if (!container) return;
            const term = normalizeTerm(docPath);
            if (!term) return;
            ensureGiscusLoaded(container, term);
        } catch (error) {
            console.warn('Giscus: update failed:', error);
        }
    };
})();
