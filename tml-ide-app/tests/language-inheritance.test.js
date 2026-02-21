import test from 'node:test';
import assert from 'node:assert/strict';

import { createLanguageState, getCompletionItems } from '../src/lib/language-core.js';
import { normalizeApiIndex } from '../src/lib/index-schema.js';

function createInheritanceState() {
    const index = normalizeApiIndex({
        schemaVersion: 2,
        generatedAt: '2026-02-21T00:00:00.000Z',
        sources: [],
        types: {
            'Example.BaseType': {
                fullName: 'Example.BaseType',
                namespace: 'Example',
                name: 'BaseType',
                summary: '',
                members: {
                    methods: [
                        {
                            kind: 'method',
                            name: 'FromBaseMethod',
                            signature: 'void FromBaseMethod()',
                            returnType: 'void',
                            isStatic: false,
                            params: [],
                            minArgs: 0,
                            maxArgs: 0,
                            summary: '',
                            returnsDoc: '',
                            paramDocs: {}
                        }
                    ],
                    properties: [
                        {
                            kind: 'property',
                            name: 'FromBaseProperty',
                            signature: 'int FromBaseProperty { get; set; }',
                            type: 'int',
                            isStatic: false,
                            summary: ''
                        }
                    ],
                    fields: [
                        {
                            kind: 'field',
                            name: 'FromBaseField',
                            signature: 'int FromBaseField',
                            type: 'int',
                            isStatic: false,
                            summary: ''
                        }
                    ]
                }
            },
            'Example.DerivedType': {
                fullName: 'Example.DerivedType',
                namespace: 'Example',
                name: 'DerivedType',
                summary: '',
                baseType: 'Example.BaseType',
                interfaces: [],
                members: {
                    methods: [],
                    properties: [],
                    fields: []
                }
            }
        }
    });

    return createLanguageState(index);
}

test('completion includes inherited members from base type', () => {
    const state = createInheritanceState();
    const source = [
        'using Example;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        DerivedType value = null;',
        '        value.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('value.') + 'value.'.length;
    const items = getCompletionItems(state, { text: source, offset, maxItems: 60 });

    assert.ok(items.some((item) => item.label === 'FromBaseMethod'));
    assert.ok(items.some((item) => item.label === 'FromBaseProperty'));
    assert.ok(items.some((item) => item.label === 'FromBaseField'));
});

test('completion resolves this to inherited base members in local derived class', () => {
    const state = createInheritanceState();
    const source = [
        'using Example;',
        '',
        'public class LocalDerived : DerivedType {',
        '    void Test() {',
        '        this.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('this.') + 'this.'.length;
    const items = getCompletionItems(state, { text: source, offset, maxItems: 60 });

    assert.ok(items.some((item) => item.label === 'FromBaseMethod'));
});
