import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    createLanguageState,
    getCompletionItems,
    getHoverInfo,
    getRuleDiagnostics,
    importAssemblyFromXml
} from '../src/lib/language-core.js';
import { normalizeApiIndex } from '../src/lib/index-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleIndex = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../public/data/api-index.v2.json'), 'utf8')
);

function createState() {
    return createLanguageState(normalizeApiIndex(sampleIndex));
}

test('completion suggests members after dot access', () => {
    const state = createState();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        Main.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('Main.') + 'Main.'.length;
    const items = getCompletionItems(state, { text: source, offset });
    assert.ok(items.some((item) => item.label === 'AutoJoin'));
});

test('completion resolves chained member access from fields or properties', () => {
    const state = createState();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test() {',
        '        WorldGen.genRand.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('WorldGen.genRand.') + 'WorldGen.genRand.'.length;
    const items = getCompletionItems(state, { text: source, offset });
    assert.ok(items.some((item) => item.label === 'Next'));
});

test('completion prefers Terraria.Player members over nested BackupIO.Player for local variables', () => {
    const state = createState();
    const source = [
        'using Terraria;',
        'using Terraria.ModLoader;',
        '',
        'public class DemoMod : Mod {',
        '    void Test() {',
        '        Player player = null;',
        '        player.',
        '    }',
        '}'
    ].join('\n');

    const offset = source.indexOf('player.') + 'player.'.length;
    const items = getCompletionItems(state, { text: source, offset });
    assert.ok(items.some((item) => item.label === 'AddBuff'));
});

test('hover returns markdown for known type', () => {
    const state = createState();
    const source = 'using Terraria;\n\npublic class Demo { Player player; }';
    const offset = source.indexOf('Player') + 2;

    const hover = getHoverInfo(state, { text: source, offset });
    assert.ok(hover);
    assert.match(hover.markdown, /Terraria\.Player/);
});

test('rule diagnostics catches unknown member and arg count mismatch', () => {
    const state = createState();
    const source = [
        'using Terraria;',
        '',
        'public class Demo {',
        '    void Test(Player p) {',
        '        p.NotExists();',
        '        p.AddBuff(1);',
        '    }',
        '}'
    ].join('\n');

    const diags = getRuleDiagnostics(state, { text: source });
    assert.ok(diags.some((diag) => diag.code === 'RULE_UNKNOWN_MEMBER'));
    assert.ok(diags.some((diag) => diag.code === 'RULE_ARG_COUNT'));
});

test('assembly import merges xml-documented types', () => {
    const state = createState();
    const xml = [
        '<?xml version="1.0"?>',
        '<doc>',
        '  <members>',
        '    <member name="T:Example.ModApi">',
        '      <summary>示例 API</summary>',
        '    </member>',
        '    <member name="M:Example.ModApi.DoThing(System.Int32)">',
        '      <summary>执行操作</summary>',
        '      <param name="value">值</param>',
        '    </member>',
        '  </members>',
        '</doc>'
    ].join('');

    const result = importAssemblyFromXml(state, {
        dllName: 'ExampleMod.dll',
        xmlText: xml
    });

    assert.equal(result.assemblyName, 'ExampleMod');
    assert.ok(state.index.types['Example.ModApi']);
    assert.ok(
        state.index.types['Example.ModApi'].members.methods.some((method) => method.name === 'DoThing')
    );
});
