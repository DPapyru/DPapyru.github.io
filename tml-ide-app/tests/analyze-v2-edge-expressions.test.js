import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeV2WithIndex } from '../src/lib/analyze-v2.js';
import { normalizeApiIndex } from '../src/lib/index-schema.js';

function method(name, returnType, minArgs, maxArgs) {
    return {
        kind: 'method',
        name,
        signature: `${returnType} ${name}()`,
        returnType,
        isStatic: false,
        params: [],
        minArgs: Number(minArgs || 0),
        maxArgs: Number(maxArgs || minArgs || 0),
        summary: '',
        returnsDoc: '',
        paramDocs: {}
    };
}

function property(name, type) {
    return {
        kind: 'property',
        name,
        signature: `${type} ${name} { get; set; }`,
        type,
        isStatic: false,
        summary: ''
    };
}

function field(name, type) {
    return {
        kind: 'field',
        name,
        signature: `${type} ${name}`,
        type,
        isStatic: false,
        summary: ''
    };
}

function createIndex() {
    return normalizeApiIndex({
        schemaVersion: 2,
        generatedAt: '2026-02-21T00:00:00.000Z',
        sources: [],
        types: {
            'Terraria.Item': {
                fullName: 'Terraria.Item',
                namespace: 'Terraria',
                name: 'Item',
                summary: '',
                members: { methods: [], properties: [], fields: [field('damage', 'int')] }
            },
            'Terraria.Player': {
                fullName: 'Terraria.Player',
                namespace: 'Terraria',
                name: 'Player',
                summary: '',
                members: {
                    methods: [method('AddBuff', 'void', 2, 2)],
                    properties: [property('name', 'string')],
                    fields: [field('active', 'bool')]
                }
            },
            'Example.BaseType': {
                fullName: 'Example.BaseType',
                namespace: 'Example',
                name: 'BaseType',
                summary: '',
                members: {
                    methods: [method('BaseMethod', 'Terraria.Item', 0, 0)],
                    properties: [],
                    fields: [field('baseField', 'Terraria.Item')]
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
}

function analyze(index, text, offsetNeedle, features) {
    const offset = text.indexOf(offsetNeedle) + offsetNeedle.length;
    return analyzeV2WithIndex(index, {
        text,
        offset,
        maxItems: 120,
        features: features || { completion: true, hover: true, diagnostics: true }
    });
}

test('Analyze v2 completion supports this/base in inherited scope', () => {
    const index = createIndex();
    const source = [
        'using Terraria;',
        'using Example;',
        '',
        'public class LocalDerived : DerivedType {',
        '    void Test() {',
        '        this.baseField.',
        '        base.BaseMethod().',
        '    }',
        '}'
    ].join('\n');

    const byThis = analyze(index, source, 'this.baseField.', { completion: true, hover: false, diagnostics: false });
    const byBase = analyze(index, source, 'base.BaseMethod().', { completion: true, hover: false, diagnostics: false });
    const thisLabels = (byThis.completionItems || []).map((item) => item.label);
    const baseLabels = (byBase.completionItems || []).map((item) => item.label);

    assert.ok(thisLabels.includes('damage'));
    assert.ok(baseLabels.includes('damage'));
});

test('Analyze v2 completion supports pattern variable expression', () => {
    const index = createIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(object obj) {',
        '        _ = obj is Player p && p.',
        '    }',
        '}'
    ].join('\n');

    const result = analyze(index, source, 'obj is Player p && p.', { completion: true, hover: false, diagnostics: false });
    const labels = (result.completionItems || []).map((item) => item.label);
    assert.ok(labels.includes('AddBuff'));
});

test('Analyze v2 diagnostics remains stable in query-expression context', () => {
    const index = createIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player[] players) {',
        '        var names = from p in players where p.active select p.name;',
        '    }',
        '}'
    ].join('\n');

    const result = analyze(index, source, 'p.name;', { completion: false, hover: false, diagnostics: true });
    const unknownMember = (result.diagnosticsRule || []).filter((item) => item.code === 'RULE_UNKNOWN_MEMBER');
    assert.equal(unknownMember.length, 0);
});

test('Analyze v2 returns hover and diagnostics consistently', () => {
    const index = createIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player player) {',
        '        player.AddBuff(1);',
        '    }',
        '}'
    ].join('\n');

    const result = analyze(index, source, 'Add', { completion: true, hover: true, diagnostics: true });
    assert.ok(result.hover);
    assert.match(result.hover.markdown || '', /AddBuff/);
    assert.ok((result.diagnosticsRule || []).some((item) => item.code === 'RULE_ARG_COUNT'));
    assert.equal(typeof result.meta.elapsedMs, 'number');
});

test('Analyze v2 diagnostics does not emit RULE_SYNTAX on valid declarations', () => {
    const index = createIndex();
    const source = [
        'public class Demo {',
        '    public void SetDefaults() {',
        '        int x = 1;',
        '    }',
        '}'
    ].join('\n');

    const result = analyze(index, source, 'SetDefaults', { completion: false, hover: false, diagnostics: true });
    const syntaxErrors = (result.diagnosticsRule || []).filter((item) => item.code === 'RULE_SYNTAX');
    assert.equal(syntaxErrors.length, 0);
});

test('Analyze v2 diagnostics still reports rule issues when syntax parsing noise is disabled', () => {
    const index = createIndex();
    const source = [
        'public class Demo {',
        '    public void SetDefaults() {',
        '        int x = 1',
        '    }',
        '}'
    ].join('\n');

    const result = analyze(index, source, 'SetDefaults', { completion: false, hover: false, diagnostics: true });
    assert.ok((result.diagnosticsRule || []).some((item) => item.code === 'RULE_MISSING_SEMICOLON'));
});
