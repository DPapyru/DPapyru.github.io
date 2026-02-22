import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestions } from '../src/lib/diagnostic-suggestions.js';

function firstCopyText(suggestions) {
    const list = Array.isArray(suggestions) ? suggestions : [];
    const first = list[0] || {};
    return String(first.copyText || '');
}

test('RULE_MISSING_SEMICOLON emits direct fix suggestion', () => {
    const suggestions = buildSuggestions({
        source: 'rule',
        code: 'RULE_MISSING_SEMICOLON',
        severity: 'warning',
        message: '疑似缺少分号',
        startLineNumber: 2,
        startColumn: 17,
        endLineNumber: 2,
        endColumn: 18
    }, {});

    assert.ok(suggestions.length > 0);
    assert.match(firstCopyText(suggestions), /分号|;/);
});

test('ROSLYN_NAMESPACE_RECOMMEND falls back to inferred namespace from path', () => {
    const suggestions = buildSuggestions({
        source: 'roslyn',
        code: 'ROSLYN_NAMESPACE_RECOMMEND',
        severity: 'info',
        message: '建议为当前文件声明 namespace',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        filePath: 'site/content/My-Guide/code/player_helper.cs'
    }, {});

    assert.ok(suggestions.length > 0);
    assert.match(firstCopyText(suggestions), /namespace\s+[A-Za-z0-9_.]+/);
    assert.doesNotMatch(firstCopyText(suggestions), /YourModNamespace/);
});

test('ROSLYN_NAMESPACE_RECOMMEND uses placeholder when path unavailable', () => {
    const suggestions = buildSuggestions({
        source: 'roslyn',
        code: 'ROSLYN_NAMESPACE_RECOMMEND',
        severity: 'info',
        message: '建议为当前文件声明 namespace',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2
    }, {});

    assert.ok(suggestions.length > 0);
    assert.match(firstCopyText(suggestions), /YourModNamespace/);
});

test('RULE_UNKNOWN_MEMBER returns nearest member hints from context', () => {
    const suggestions = buildSuggestions({
        source: 'rule',
        code: 'RULE_UNKNOWN_MEMBER',
        severity: 'error',
        message: 'Player 中不存在成员：damge',
        startLineNumber: 6,
        startColumn: 18,
        endLineNumber: 6,
        endColumn: 23
    }, {
        similarMembers: ['damage', 'DamageType']
    });

    assert.ok(suggestions.length > 0);
    assert.match(firstCopyText(suggestions), /damage/);
});

test('shader issue emits compile-focused suggestions', () => {
    const suggestions = buildSuggestions({
        source: 'shader',
        code: 'SHADER_COMPILE_ERROR',
        severity: 'error',
        message: '0:12: syntax error',
        startLineNumber: 12,
        startColumn: 1,
        endLineNumber: 12,
        endColumn: 2
    }, {});

    assert.ok(suggestions.length > 0);
    assert.match(firstCopyText(suggestions), /technique|pass|float4/i);
});
