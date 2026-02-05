const test = require('node:test');
const assert = require('node:assert/strict');

const { computeTheoreticalDamageRange, sumEffects } = require('./damage-core');

function assertApprox(actual, expected, eps = 1e-12) {
    assert.ok(
        Math.abs(actual - expected) <= eps,
        'Expected ' + String(actual) + ' ~= ' + String(expected)
    );
}

test('sumEffects aggregates mult2/add1/add2', () => {
    const sum = sumEffects([
        { mult2: 0.1, add1: 2, add2: 3 },
        { mult2: -0.05, add1: 1.5, add2: 0 }
    ], 'g');

    assert.deepEqual(sum, {
        mult2: 0.05,
        add1: 3.5,
        add2: 3
    });
});

test('computeTheoreticalDamageRange returns expected parts', () => {
    const result = computeTheoreticalDamageRange({
        powerMin: 6,
        powerMax: 36,
        defenseBonus: 0.2,
        observationBonus: 0.1,
        physicalResistBonus: 0.3,
        sinResistBonus: 0.0,
        attackerExisting: [{ mult2: 0.15, add1: 2, add2: 0 }],
        attackerOnUse: [{ mult2: 0.05, add1: 0, add2: 10 }],
        defenderExisting: [{ mult2: -0.1, add1: 1, add2: -2 }]
    });

    assertApprox(result.mult1, 1.6);
    assertApprox(result.mult2, 1.1);
    assertApprox(result.add1Factor, 0.1);
    assertApprox(result.add1, 0.3);
    assertApprox(result.add2, 8);
    assertApprox(result.damageRange.min, 18.86);
    assertApprox(result.damageRange.max, 71.66);
});

test('computeTheoreticalDamageRange validates numbers', () => {
    assert.throws(
        () => computeTheoreticalDamageRange({
            powerMin: 1,
            powerMax: 2,
            defenseBonus: 0,
            observationBonus: 0,
            physicalResistBonus: 0,
            sinResistBonus: NaN
        }),
        /sinResistBonus must be a finite number/
    );
});
