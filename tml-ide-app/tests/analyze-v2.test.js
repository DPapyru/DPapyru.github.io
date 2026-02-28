import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeV2WithIndex } from '../src/lib/analyze-v2.js';
import { normalizeApiIndex } from '../src/lib/index-schema.js';

function method(name, returnType, minArgs, maxArgs, options) {
    const opts = options && typeof options === 'object' ? options : {};
    return {
        kind: 'method',
        name,
        signature: `${returnType} ${name}()`,
        returnType,
        isStatic: !!opts.isStatic,
        isExtension: !!opts.isExtension,
        params: [],
        minArgs: Number(minArgs || 0),
        maxArgs: Number(maxArgs || minArgs || 0),
        summary: '',
        returnsDoc: '',
        paramDocs: {}
    };
}

function methodWithParams(name, returnType, params, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const safeParams = Array.isArray(params) ? params : [];
    return {
        kind: 'method',
        name,
        signature: `${returnType} ${name}(${safeParams.map((item) => `${item.type} ${item.name}`).join(', ')})`,
        returnType,
        isStatic: !!opts.isStatic,
        isExtension: !!opts.isExtension,
        params: safeParams.map((item) => ({
            name: item.name,
            type: item.type,
            optional: !!item.optional,
            defaultValue: Object.prototype.hasOwnProperty.call(item, 'defaultValue') ? item.defaultValue : null
        })),
        minArgs: safeParams.filter((item) => !item.optional).length,
        maxArgs: safeParams.length,
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

function manyFields(prefix, count, type) {
    const safePrefix = String(prefix || 'Field');
    const safeCount = Math.max(0, Number(count) || 0);
    const safeType = String(type || 'int');
    return Array.from({ length: safeCount }, (_, idx) => {
        const name = `${safePrefix}${String(idx).padStart(3, '0')}`;
        return field(name, safeType);
    });
}

function createAnalyzeIndex() {
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
                members: {
                    methods: [],
                    properties: [],
                    fields: [field('damage', 'int')]
                }
            },
            'Terraria.Player': {
                fullName: 'Terraria.Player',
                namespace: 'Terraria',
                name: 'Player',
                summary: '',
                members: {
                    methods: [method('AddBuff', 'void', 2, 2)],
                    properties: [property('HeldItem', 'Terraria.Item'), property('name', 'string')],
                    fields: [field('active', 'bool')]
                }
            },
            'Terraria.Player.CompositeArmStretchAmount': {
                fullName: 'Terraria.Player.CompositeArmStretchAmount',
                namespace: 'Terraria',
                name: 'CompositeArmStretchAmount',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: [field('Full', 'Terraria.Player.CompositeArmStretchAmount')]
                }
            },
            'Terraria.NPC': {
                fullName: 'Terraria.NPC',
                namespace: 'Terraria',
                name: 'NPC',
                summary: '',
                members: {
                    methods: [method('AddBuff', 'void', 2, 2)],
                    properties: [],
                    fields: []
                }
            },
            'Terraria.NPC.HitInfo': {
                fullName: 'Terraria.NPC.HitInfo',
                namespace: 'Terraria',
                name: 'HitInfo',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: []
                }
            },
            'Microsoft.Xna.Framework.Vector2': {
                fullName: 'Microsoft.Xna.Framework.Vector2',
                namespace: 'Microsoft.Xna.Framework',
                name: 'Vector2',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: []
                }
            },
            'Terraria.Utils': {
                fullName: 'Terraria.Utils',
                namespace: 'Terraria',
                name: 'Utils',
                summary: '',
                members: {
                    methods: [
                        methodWithParams('RotatedBy', 'Vector2', [
                            { name: 'spinningpoint', type: 'Vector2' },
                            { name: 'radians', type: 'double' },
                            { name: 'center', type: 'Vector2', optional: true, defaultValue: null }
                        ], { isStatic: true, isExtension: true })
                    ],
                    properties: [],
                    fields: []
                }
            },
            'Example.TextValue': {
                fullName: 'Example.TextValue',
                namespace: 'Example',
                name: 'TextValue',
                summary: '',
                members: {
                    methods: [method('ToString', 'Example.TextValue', 0, 0)],
                    properties: [property('Length', 'int')],
                    fields: []
                }
            },
            'Example.Rand': {
                fullName: 'Example.Rand',
                namespace: 'Example',
                name: 'Rand',
                summary: '',
                members: {
                    methods: [method('Next', 'Example.TextValue', 2, 2)],
                    properties: [],
                    fields: []
                }
            },
            'Terraria.Main': {
                fullName: 'Terraria.Main',
                namespace: 'Terraria',
                name: 'Main',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: [field('rand', 'Example.Rand')]
                }
            },
            'Terraria.WorldGen': {
                fullName: 'Terraria.WorldGen',
                namespace: 'Terraria',
                name: 'WorldGen',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: [field('genRand', 'Example.Rand')]
                }
            },
            'NamespaceA.NamespaceB.Type': {
                fullName: 'NamespaceA.NamespaceB.Type',
                namespace: 'NamespaceA.NamespaceB',
                name: 'Type',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: [field('Member', 'Terraria.Item')]
                }
            },
            'Terraria.ModLoader.ModItem': {
                fullName: 'Terraria.ModLoader.ModItem',
                namespace: 'Terraria.ModLoader',
                name: 'ModItem',
                summary: '',
                members: {
                    methods: [
                        method('SetDefaults', 'void', 0, 0),
                        methodWithParams('AnglerQuestReward', 'void', [
                            { name: 'rareMultiplier', type: 'float' },
                            { name: 'rewardItems', type: 'List<Item>' }
                        ]),
                        methodWithParams('OnHitNPC', 'void', [
                            { name: 'player', type: 'Player' },
                            { name: 'target', type: 'NPC' },
                            { name: 'hit', type: 'HitInfo' },
                            { name: 'damageDone', type: 'int' }
                        ])
                    ],
                    properties: [],
                    fields: []
                }
            },
            'Example.BigType': {
                fullName: 'Example.BigType',
                namespace: 'Example',
                name: 'BigType',
                summary: '',
                members: {
                    methods: [],
                    properties: [],
                    fields: manyFields('Member', 260, 'int')
                }
            }
        }
    });
}

function completionLabels(index, text, needle) {
    const offset = text.indexOf(needle) + needle.length;
    const result = analyzeV2WithIndex(index, {
        text,
        offset,
        maxItems: 120,
        features: { completion: true, hover: false, diagnostics: false }
    });
    return (result.completionItems || []).map((item) => item.label);
}

test('Analyze v2 completion supports method call chains', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Example;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        Main.rand.Next(1, 2).ToString().',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(index, source, 'Main.rand.Next(1, 2).ToString().');
    assert.ok(labels.includes('Length'));
});

test('Analyze v2 completion supports chained field-to-method calls', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        WorldGen.genRand.Next(1, 2).',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(index, source, 'WorldGen.genRand.Next(1, 2).');
    assert.ok(labels.includes('ToString'));
});

test('Analyze v2 completion supports null-conditional access', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player player) {',
        '        player?.HeldItem?.',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(index, source, 'player?.HeldItem?.');
    assert.ok(labels.includes('damage'));
});

test('Analyze v2 completion supports indexer and cast expressions', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player[] players, object obj) {',
        '        players[0].',
        '        ((Player)obj).',
        '    }',
        '}'
    ].join('\n');

    const labelsByIndexer = completionLabels(index, source, 'players[0].');
    const labelsByCast = completionLabels(index, source, '((Player)obj).');
    assert.ok(labelsByIndexer.includes('AddBuff'));
    assert.ok(labelsByCast.includes('HeldItem'));
});

test('Analyze v2 completion supports new expression and namespace-qualified chains', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        new Player().',
        '        NamespaceA.NamespaceB.Type.Member.',
        '    }',
        '}'
    ].join('\n');

    const labelsByNew = completionLabels(index, source, 'new Player().');
    const labelsByQualified = completionLabels(index, source, 'NamespaceA.NamespaceB.Type.Member.');
    assert.ok(labelsByNew.includes('AddBuff'));
    assert.ok(labelsByQualified.includes('damage'));
});

test('Analyze v2 completion provides override snippets with metadata', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class ExampleItem : ModItem',
        '{',
        '    public override void Set',
        '}'
    ].join('\n');

    const offset = source.indexOf('Set') + 'Set'.length;
    const result = analyzeV2WithIndex(index, {
        text: source,
        offset,
        maxItems: 120,
        features: { completion: true, hover: false, diagnostics: false }
    });
    const candidate = (result.completionItems || []).find((item) => item.label === 'SetDefaults');

    assert.ok(candidate);
    assert.equal(candidate.source, 'override');
    assert.equal(candidate.insertTextMode, 'snippet');
    assert.match(String(candidate.insertText || ''), /SetDefaults\(\)/);
    assert.match(String(candidate.insertText || ''), /\{/);
});

test('Analyze v2 override snippet includes parameter types and names', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class ExampleItem : ModItem',
        '{',
        '    public override void Ang',
        '}'
    ].join('\n');

    const offset = source.indexOf('Ang') + 'Ang'.length;
    const result = analyzeV2WithIndex(index, {
        text: source,
        offset,
        maxItems: 120,
        features: { completion: true, hover: false, diagnostics: false }
    });
    const candidate = (result.completionItems || []).find((item) => item.label === 'AnglerQuestReward');

    assert.ok(candidate);
    assert.equal(candidate.insertTextMode, 'snippet');
    assert.match(
        String(candidate.insertText || ''),
        /AnglerQuestReward\(float rareMultiplier, List<Item> rewardItems\)/
    );
});

test('Analyze v2 completion resolves nested type member chains', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        Player.CompositeArmStretchAmount.',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(index, source, 'Player.CompositeArmStretchAmount.');
    assert.ok(labels.includes('Full'));
});

test('Analyze v2 diagnostics does not flag nested type references in method signatures', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class DemoBlade : ModItem',
        '{',
        '    public override void OnHitNPC(Player player, NPC target, NPC.HitInfo hit, int damageDone)',
        '    {',
        '    }',
        '}'
    ].join('\n');

    const result = analyzeV2WithIndex(index, {
        text: source,
        offset: source.indexOf('NPC.HitInfo') + 3,
        maxItems: 120,
        features: { completion: false, hover: false, diagnostics: true }
    });
    const unknownMembers = (result.diagnosticsRule || []).filter((item) => item.code === 'RULE_UNKNOWN_MEMBER');
    const semicolonWarnings = (result.diagnosticsRule || []).filter((item) => item.code === 'RULE_MISSING_SEMICOLON');

    assert.equal(unknownMembers.length, 0);
    assert.equal(semicolonWarnings.length, 0);
});

test('Analyze v2 override snippet prefers nested type qualification when needed', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class DemoBlade : ModItem',
        '{',
        '    public override void OnHitN',
        '}'
    ].join('\n');

    const offset = source.indexOf('OnHitN') + 'OnHitN'.length;
    const result = analyzeV2WithIndex(index, {
        text: source,
        offset,
        maxItems: 120,
        features: { completion: true, hover: false, diagnostics: false }
    });
    const candidate = (result.completionItems || []).find((item) => item.label === 'OnHitNPC');

    assert.ok(candidate);
    assert.match(String(candidate.detail || ''), /OnHitNPC\(Player player, NPC target, NPC\.HitInfo hit, int damageDone\)/);
    assert.match(String(candidate.insertText || ''), /OnHitNPC\(Player player, NPC target, NPC\.HitInfo hit, int damageDone\)/);
});

test('Analyze v2 completion and diagnostics support extension methods', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Microsoft.Xna.Framework;',
        '',
        'public class Demo {',
        '    void Test(Vector2 velocity) {',
        '        velocity.RotatedBy(0.15);',
        '        velocity.',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(index, source, 'velocity.');
    assert.ok(labels.includes('RotatedBy'));

    const result = analyzeV2WithIndex(index, {
        text: source,
        offset: source.indexOf('RotatedBy') + 2,
        maxItems: 120,
        features: { completion: false, hover: false, diagnostics: true }
    });
    const unknownMembers = (result.diagnosticsRule || []).filter((item) => item.code === 'RULE_UNKNOWN_MEMBER');
    assert.equal(unknownMembers.length, 0);
});

test('Analyze v2 extension methods enforce argument count after dropping receiver', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        'using Microsoft.Xna.Framework;',
        '',
        'public class Demo {',
        '    void Test(Vector2 velocity) {',
        '        velocity.RotatedBy();',
        '    }',
        '}'
    ].join('\n');

    const result = analyzeV2WithIndex(index, {
        text: source,
        offset: source.indexOf('RotatedBy') + 4,
        maxItems: 120,
        features: { completion: false, hover: false, diagnostics: true }
    });
    assert.ok((result.diagnosticsRule || []).some((item) => item.code === 'RULE_ARG_COUNT'));
});

test('Analyze v2 extension method fallback works with legacy index shape', () => {
    const modern = createAnalyzeIndex();
    const legacyRaw = JSON.parse(JSON.stringify(modern));
    Object.values(legacyRaw.types || {}).forEach((typeRecord) => {
        const methods = typeRecord && typeRecord.members && Array.isArray(typeRecord.members.methods)
            ? typeRecord.members.methods
            : [];
        methods.forEach((method) => {
            delete method.isExtension;
        });
    });
    const legacy = normalizeApiIndex(legacyRaw);

    const source = [
        'using Terraria;',
        'using Microsoft.Xna.Framework;',
        '',
        'public class Demo {',
        '    void Test(Vector2 velocity) {',
        '        velocity.',
        '    }',
        '}'
    ].join('\n');

    const labels = completionLabels(legacy, source, 'velocity.');
    assert.ok(labels.includes('RotatedBy'));
});

test('Analyze v2 completion supports more than 200 members for large tML-like types', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Example;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        BigType value = null;',
        '        value.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('value.') + 'value.'.length;
    const result = analyzeV2WithIndex(index, {
        text: source,
        offset,
        maxItems: 5000,
        features: { completion: true, hover: false, diagnostics: false }
    });
    const labels = (result.completionItems || []).map((item) => item.label);

    assert.ok(labels.includes('Member259'));
    assert.ok(labels.length >= 260);
});

test('Analyze v2 member completion emits ranking metadata for UI decisions', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player player) {',
        '        player.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('player.') + 'player.'.length;
    const result = analyzeV2WithIndex(index, {
        text: source,
        offset,
        maxItems: 120,
        features: { completion: true, hover: false, diagnostics: false }
    });

    const candidate = (result.completionItems || []).find((item) => item.label === 'HeldItem');
    assert.ok(candidate);
    assert.equal(candidate.source, 'member');
    assert.equal(candidate.ownerType, 'Terraria.Player');
    assert.equal(typeof candidate.score, 'number');
    assert.equal(typeof candidate.matchKind, 'string');
    assert.equal(typeof candidate.confidence, 'number');
});

test('Analyze v2 rule diagnostics emits source and actionable hint metadata', () => {
    const index = createAnalyzeIndex();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player player) {',
        '        player.AddBuff(1)',
        '    }',
        '}'
    ].join('\n');

    const result = analyzeV2WithIndex(index, {
        text: source,
        offset: source.indexOf('AddBuff') + 'AddBuff'.length,
        maxItems: 120,
        features: { completion: false, hover: false, diagnostics: true }
    });

    const semicolon = (result.diagnosticsRule || []).find((item) => item.code === 'RULE_MISSING_SEMICOLON');
    assert.ok(semicolon);
    assert.equal(semicolon.source, 'rule');
    assert.equal(typeof semicolon.confidence, 'number');
    assert.ok(Array.isArray(semicolon.hintIds));
    assert.ok(semicolon.hintIds.includes('rule.add-semicolon'));
});
