import test from 'node:test';
import assert from 'node:assert/strict';

import { isAutoIssueEligible, shouldAutoOpenIssue } from '../src/ui/fix-popup.js';

function issue(overrides) {
    return {
        fileId: 'file-1',
        source: 'rule',
        code: 'RULE_UNKNOWN_MEMBER',
        severity: 'error',
        message: 'Player 中不存在成员：damge',
        startLineNumber: 6,
        startColumn: 12,
        ...overrides
    };
}

test('Fix popup auto-open ignores info diagnostics', () => {
    assert.equal(isAutoIssueEligible(issue({ severity: 'info' })), false);
    assert.equal(isAutoIssueEligible(issue({ severity: 'warning' })), true);
    assert.equal(isAutoIssueEligible(issue({ severity: 'error' })), true);
});

test('Fix popup auto-open enforces per-issue cooldown', () => {
    const base = issue();
    const lastOpenedAtByKey = new Map([
        ['file-1|rule|RULE_UNKNOWN_MEMBER|error|6|12|Player 中不存在成员：damge', 10_000]
    ]);

    const blocked = shouldAutoOpenIssue({
        issue: base,
        lastOpenedAtByKey,
        nowMs: 10_500,
        cooldownMs: 1_000
    });
    const allowed = shouldAutoOpenIssue({
        issue: base,
        lastOpenedAtByKey,
        nowMs: 11_500,
        cooldownMs: 1_000
    });

    assert.equal(blocked, false);
    assert.equal(allowed, true);
});
