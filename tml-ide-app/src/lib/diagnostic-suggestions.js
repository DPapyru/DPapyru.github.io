import * as sharedDiagnosticSuggestions from '../../../shared/services/ide-assist/diagnostic-suggestions.js';

const sharedDefault = sharedDiagnosticSuggestions && typeof sharedDiagnosticSuggestions === 'object'
    ? Reflect.get(sharedDiagnosticSuggestions, 'default')
    : null;

const sharedModule = sharedDefault && typeof sharedDefault === 'object'
    ? sharedDefault
    : (sharedDiagnosticSuggestions && typeof sharedDiagnosticSuggestions === 'object'
        ? sharedDiagnosticSuggestions
        : {});

export const inferNamespaceFromPath = typeof sharedModule.inferNamespaceFromPath === 'function'
    ? sharedModule.inferNamespaceFromPath
    : function inferNamespaceFromPath(pathValue) {
        const normalized = String(pathValue || '').replace(/\\/g, '/').trim();
        if (!normalized) return 'YourModNamespace';
        return normalized
            .split('/')
            .filter(Boolean)
            .map((part) => part.replace(/[^A-Za-z0-9_]+/g, ''))
            .filter(Boolean)
            .slice(0, 5)
            .join('.') || 'YourModNamespace';
    };

export const buildSuggestions = typeof sharedModule.buildSuggestions === 'function'
    ? sharedModule.buildSuggestions
    : function buildSuggestions() {
        return [];
    };
