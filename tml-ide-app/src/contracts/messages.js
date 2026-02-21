export const MESSAGE_TYPES = Object.freeze({
    INDEX_SET: 'index.set',
    INDEX_SET_RESPONSE: 'index.set.response',
    ANALYZE_V2_REQUEST: 'analyze.v2.request',
    ANALYZE_V2_RESPONSE: 'analyze.v2.response',
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
