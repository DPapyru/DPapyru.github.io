import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildAnimTsThisFieldCompletionItems,
    extractAnimTsAssignedThisFields
} from '../src/lib/animts-this-completion.js';

test('extractAnimTsAssignedThisFields collects class fields assigned through this', () => {
    const source = [
        'class Mat4ViewProjection {',
        '    constructor() {',
        '        this._ctx = null;',
        '        this._yaw = null;',
        '        this._pitch = null;',
        '    }',
        '}'
    ].join('\n');

    const labels = extractAnimTsAssignedThisFields(source);
    assert.deepEqual(labels, ['_ctx', '_pitch', '_yaw']);
});

test('buildAnimTsThisFieldCompletionItems provides this-field completion after dot access', () => {
    const source = [
        'class Mat4ViewProjection {',
        '    constructor() {',
        '        this._ctx = null;',
        '        this._yaw = null;',
        '        this._pitch = null;',
        '    }',
        '',
        '    OnRender() {',
        '        this.',
        '    }',
        '}'
    ].join('\n');
    const offset = source.indexOf('this.') + 'this.'.length;
    const labels = buildAnimTsThisFieldCompletionItems(source, offset, 20).map((item) => item.label);

    assert.deepEqual(labels, ['_ctx', '_pitch', '_yaw']);
});

test('buildAnimTsThisFieldCompletionItems filters by prefix and only in this-context', () => {
    const source = [
        'class Mat4ViewProjection {',
        '    constructor() {',
        '        this._ctx = null;',
        '        this._yaw = null;',
        '        this._pitch = null;',
        '    }',
        '',
        '    OnRender(ctx) {',
        '        this._p',
        '        ctx.',
        '    }',
        '}'
    ].join('\n');

    const thisOffset = source.indexOf('this._p') + 'this._p'.length;
    const thisLabels = buildAnimTsThisFieldCompletionItems(source, thisOffset, 20).map((item) => item.label);
    assert.deepEqual(thisLabels, ['_pitch']);

    const ctxOffset = source.indexOf('ctx.') + 'ctx.'.length;
    const ctxLabels = buildAnimTsThisFieldCompletionItems(source, ctxOffset, 20).map((item) => item.label);
    assert.deepEqual(ctxLabels, []);
});
