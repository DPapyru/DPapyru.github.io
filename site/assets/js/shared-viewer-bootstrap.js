(function () {
    'use strict';

    if (window.__sharedViewerBootstrapLoaded) return;
    if (window.__disableSharedViewerBootstrap === true) return;
    window.__sharedViewerBootstrapLoaded = true;

    function startSharedViewer() {
        if (!window.SharedViewerComposition || typeof window.SharedViewerComposition.mountViewerShell !== 'function') {
            return;
        }

        window.SharedViewerComposition
            .mountViewerShell()
            .then(function (handle) {
                window.__sharedViewerHandle = handle;
            })
            .catch(function (error) {
                console.warn('Shared viewer shell mount failed:', error);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startSharedViewer, { once: true });
    } else {
        startSharedViewer();
    }
})();
