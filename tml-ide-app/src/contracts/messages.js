export const MESSAGE_TYPES = Object.freeze({
    INDEX_SET: 'index.set',
    INDEX_SET_RESPONSE: 'index.set.response',
    COMPLETION_REQUEST: 'completion.request',
    COMPLETION_RESPONSE: 'completion.response',
    HOVER_REQUEST: 'hover.request',
    HOVER_RESPONSE: 'hover.response',
    DIAGNOSTICS_RULE_REQUEST: 'diagnostics.rule.request',
    DIAGNOSTICS_RULE_RESPONSE: 'diagnostics.rule.response',
    DIAGNOSTICS_ROSLYN_REQUEST: 'diagnostics.roslyn.request',
    DIAGNOSTICS_ROSLYN_RESPONSE: 'diagnostics.roslyn.response',
    ASSEMBLY_IMPORT_REQUEST: 'assembly.import.request',
    ASSEMBLY_IMPORT_RESPONSE: 'assembly.import.response',
    ERROR: 'error'
});

export const DIAGNOSTIC_SEVERITY = Object.freeze({
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
});
