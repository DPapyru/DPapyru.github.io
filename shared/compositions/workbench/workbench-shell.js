(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedWorkbenchComposition = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const diagnosticsService = root && root.SharedDiagnosticSuggestions
        ? root.SharedDiagnosticSuggestions
        : (typeof module !== 'undefined' && module.exports
            ? require('../../services/ide-assist/diagnostic-suggestions.js')
            : null);

    function buildDiagnosticCards(issue, context) {
        if (!diagnosticsService || typeof diagnosticsService.buildSuggestions !== 'function') {
            return [];
        }
        return diagnosticsService.buildSuggestions(issue, context || {});
    }

    return {
        buildDiagnosticCards
    };
});
