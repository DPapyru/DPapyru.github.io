// UMD wrapper: usable in browser workers (global KnowledgeCSharp) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.KnowledgeCSharp = factory();
}(typeof globalThis !== 'undefined' ? globalThis : self, function () {
    'use strict';

    function normalizeText(text) {
        return String(text == null ? '' : text);
    }

    function makeWrapCandidates(code, options) {
        const original = normalizeText(code);
        const trimmed = original.replace(/\s+$/g, '');
        const allowAppendSemicolon = !!(options && options.allowAppendSemicolon);

        const candidates = [];
        candidates.push({
            kind: 'compilationUnit',
            prefix: '',
            suffix: '',
            source: trimmed,
            offsetDelta: 0
        });

        const classPrefix = 'class __KC__C__ {\n';
        const classSuffix = '\n}\n';
        candidates.push({
            kind: 'classMember',
            prefix: classPrefix,
            suffix: classSuffix,
            source: classPrefix + trimmed + classSuffix,
            offsetDelta: classPrefix.length
        });

        const methodPrefix = 'class __KC__C__ {\nvoid __KC__M__() {\n';
        const methodSuffix = '\n}\n}\n';
        let methodBody = trimmed;
        if (allowAppendSemicolon && methodBody && !/[;}]$/.test(methodBody)) {
            methodBody += ';';
        }
        candidates.push({
            kind: 'methodBody',
            prefix: methodPrefix,
            suffix: methodSuffix,
            source: methodPrefix + methodBody + methodSuffix,
            offsetDelta: methodPrefix.length
        });

        return candidates;
    }

    return {
        makeWrapCandidates
    };
}));
