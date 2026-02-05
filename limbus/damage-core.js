function normalizeNumber(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError(name + ' must be a finite number');
    }
    return value;
}

function normalizeEffect(effect, index, groupName) {
    if (!effect || typeof effect !== 'object') {
        throw new TypeError(groupName + '[' + index + '] must be an object');
    }

    return {
        mult2: normalizeNumber(effect.mult2, groupName + '[' + index + '].mult2'),
        add1: normalizeNumber(effect.add1, groupName + '[' + index + '].add1'),
        add2: normalizeNumber(effect.add2, groupName + '[' + index + '].add2')
    };
}

function sumEffects(effects, groupName) {
    if (!Array.isArray(effects)) {
        throw new TypeError(groupName + ' must be an array');
    }

    var sum = {
        mult2: 0,
        add1: 0,
        add2: 0
    };

    var i;
    var normalized;

    for (i = 0; i < effects.length; i++) {
        normalized = normalizeEffect(effects[i], i, groupName);
        sum.mult2 += normalized.mult2;
        sum.add1 += normalized.add1;
        sum.add2 += normalized.add2;
    }

    return sum;
}

function computeTheoreticalDamageRange(input) {
    if (!input || typeof input !== 'object') {
        throw new TypeError('input must be an object');
    }

    var powerMin = normalizeNumber(input.powerMin, 'powerMin');
    var powerMax = normalizeNumber(input.powerMax, 'powerMax');

    var defenseBonus = normalizeNumber(input.defenseBonus, 'defenseBonus');
    var observationBonus = normalizeNumber(input.observationBonus, 'observationBonus');
    var physicalResistBonus = normalizeNumber(input.physicalResistBonus, 'physicalResistBonus');
    var sinResistBonus = normalizeNumber(input.sinResistBonus, 'sinResistBonus');

    var attackerExisting = sumEffects(input.attackerExisting || [], 'attackerExisting');
    var attackerOnUse = sumEffects(input.attackerOnUse || [], 'attackerOnUse');
    var defenderExisting = sumEffects(input.defenderExisting || [], 'defenderExisting');

    var mult1 = 1 + defenseBonus + observationBonus + physicalResistBonus + sinResistBonus;
    var mult2 = 1 + (defenderExisting.mult2 + attackerExisting.mult2 + attackerOnUse.mult2);

    var add1Factor = (physicalResistBonus + sinResistBonus - defenseBonus);
    var add1 = (defenderExisting.add1 + attackerExisting.add1 + attackerOnUse.add1) * add1Factor;
    var add2 = (defenderExisting.add2 + attackerExisting.add2 + attackerOnUse.add2);

    var damageMin = powerMin * mult1 * mult2 + add1 + add2;
    var damageMax = powerMax * mult1 * mult2 + add1 + add2;

    return {
        powerRange: {
            min: powerMin,
            max: powerMax
        },
        mult1: mult1,
        mult2: mult2,
        add1Factor: add1Factor,
        add1: add1,
        add2: add2,
        damageRange: {
            min: damageMin,
            max: damageMax
        }
    };
}

var api = {
    computeTheoreticalDamageRange: computeTheoreticalDamageRange,
    sumEffects: sumEffects
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}

if (typeof window !== 'undefined') {
    window.LimbusDamageCore = api;
}
