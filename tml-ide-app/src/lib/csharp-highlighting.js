const CALLABLE_IDENTIFIER_PATTERN = /\@?[a-zA-Z_]\w*(?=\s*\()/;
const IDENTIFIER_PATTERN = /\@?[a-zA-Z_]\w*/;
const CONSTANT_IDENTIFIER_PATTERN = /\@?[A-Z][A-Z0-9_]*\b/;
const TYPE_IDENTIFIER_PATTERN = /\@?[A-Z][A-Za-z0-9_]*\b/;

export function classifyCsharpIdentifier(value) {
    const input = String(value || '');

    if (/^@?[A-Z][A-Z0-9_]*$/.test(input)) {
        return 'constant';
    }

    if (/^@?[A-Z][A-Za-z0-9_]*$/.test(input)) {
        return 'type.identifier';
    }

    return 'identifier';
}

export function createEnhancedCsharpLanguage(baseLanguage) {
    const base = baseLanguage || {};
    const tokenizer = base.tokenizer || {};
    const root = Array.isArray(tokenizer.root) ? tokenizer.root : [];
    const qualified = Array.isArray(tokenizer.qualified) ? tokenizer.qualified : [];

    return {
        ...base,
        constantIdentifiers: /^@?[A-Z][A-Z0-9_]*$/,
        typeIdentifiers: /^@?[A-Z][A-Za-z0-9_]*$/,
        tokenizer: {
            ...tokenizer,
            root: [
                [
                    CALLABLE_IDENTIFIER_PATTERN,
                    {
                        cases: {
                            '@keywords': { token: 'keyword.$0', next: '@qualified' },
                            '@default': { token: 'function.call', next: '@qualified' }
                        }
                    }
                ],
                [CONSTANT_IDENTIFIER_PATTERN, { token: 'constant', next: '@qualified' }],
                [TYPE_IDENTIFIER_PATTERN, { token: 'type.identifier', next: '@qualified' }],
                [
                    IDENTIFIER_PATTERN,
                    {
                        cases: {
                            '@namespaceFollows': { token: 'keyword.$0', next: '@namespace' },
                            '@keywords': { token: 'keyword.$0', next: '@qualified' },
                            '@default': { token: 'identifier', next: '@qualified' }
                        }
                    }
                ],
                ...root.slice(1)
            ],
            qualified: [
                [
                    CALLABLE_IDENTIFIER_PATTERN,
                    {
                        cases: {
                            '@keywords': { token: 'keyword.$0' },
                            '@default': 'function.call'
                        }
                    }
                ],
                [CONSTANT_IDENTIFIER_PATTERN, 'constant'],
                [TYPE_IDENTIFIER_PATTERN, 'type.identifier'],
                [
                    IDENTIFIER_PATTERN,
                    {
                        cases: {
                            '@keywords': { token: 'keyword.$0' },
                            '@default': 'identifier'
                        }
                    }
                ],
                ...qualified.slice(1)
            ]
        }
    };
}
