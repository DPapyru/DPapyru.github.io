const test = require('node:test');
const assert = require('node:assert/strict');

const {
    parseCommandVariables,
    applyCommandValues,
    clampCommandValue
} = require('./shader-command-params');

test('parseCommandVariables parses Command metadata from inline declarations', () => {
    const source = [
        'float speed = 1.25; // Command(min=0,max=5,step=0.25)',
        'float amplitude = 0.5; // Command(0, 2, 0.1)',
        'float ignored = 2.0;',
        'int   repeat  = 4; // Command(min=1,max=12,step=1)'
    ].join('\n');

    const vars = parseCommandVariables(source);
    assert.equal(vars.length, 3);

    assert.deepEqual(vars.map((v) => ({
        name: v.name,
        type: v.type,
        value: v.value,
        min: v.min,
        max: v.max,
        step: v.step
    })), [
        { name: 'speed', type: 'float', value: 1.25, min: 0, max: 5, step: 0.25 },
        { name: 'amplitude', type: 'float', value: 0.5, min: 0, max: 2, step: 0.1 },
        { name: 'repeat', type: 'int', value: 4, min: 1, max: 12, step: 1 }
    ]);
});

test('applyCommandValues rewrites only matched Command variable values', () => {
    const source = [
        'float speed = 1.25; // Command(min=0,max=5,step=0.25)',
        'float amplitude = 0.5; // Command(0, 2, 0.1)',
        'float ignored = 2.0;'
    ].join('\n');

    const result = applyCommandValues(source, {
        speed: 2.5,
        amplitude: 0.25,
        ignored: 99
    });

    assert.match(result, /float speed = 2.5; \/\/ Command\(min=0,max=5,step=0.25\)/);
    assert.match(result, /float amplitude = 0.25; \/\/ Command\(0, 2, 0.1\)/);
    assert.match(result, /float ignored = 2.0;/);
});

test('clampCommandValue respects min/max and int rounding', () => {
    assert.equal(clampCommandValue('float', 10, 0, 5), 5);
    assert.equal(clampCommandValue('float', -1, 0, 5), 0);
    assert.equal(clampCommandValue('int', 2.8, 1, 5), 3);
    assert.equal(clampCommandValue('int', 999, 1, 5), 5);
});
