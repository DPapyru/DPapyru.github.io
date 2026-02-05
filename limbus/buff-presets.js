(function () {
    var triggers = [
        { value: 'always', label: '常驻' },
        { value: 'combatStart', label: '战斗开始时' },
        { value: 'turnStart', label: '回合开始时' },
        { value: 'onUse', label: '使用时' },
        { value: 'beforeAttack', label: '攻击开始前' },
        { value: 'clashWin', label: '拼点胜利时' },
        { value: 'clashLose', label: '拼点失败' },
        { value: 'onHit', label: '命中时' },
        { value: 'headsHit', label: '正面命中时' },
        { value: 'tailsHit', label: '反面命中时' },
        { value: 'onCrit', label: '暴击命中时' },
        { value: 'onEvade', label: '闪避成功时' },
        { value: 'afterAttack', label: '攻击结束时' },
        { value: 'turnEnd', label: '回合结束时' },
        { value: 'combatEnd', label: '战斗结束' }
    ];

    var sources = [
        { value: 'buff', label: 'Buff/状态' },
        { value: 'passive', label: '被动' },
        { value: 'skill', label: '技能效果' },
        { value: 'field', label: '场地' },
        { value: 'ego', label: 'E.G.O/饰品' },
        { value: 'other', label: '其他' }
    ];

    var presets = [
        { value: '', label: '自定义…' },
        { value: 'enhancement', label: '强壮 (Enhancement)' },
        { value: 'reduction', label: '虚弱 (Reduction)' },
        { value: 'resultEnhancement', label: '威力提升 (ResultEnhancement)' },
        { value: 'resultReduction', label: '威力降低 (ResultReduction)' },
        { value: 'paralyze', label: '麻痹 (Paralyze)' },
        { value: 'plusCoinBoost', label: '加算硬币强化 (Plus Coin Boost)' },
        { value: 'plusCoinDrop', label: '加算硬币弱化 (Plus Coin Drop)' },
        { value: 'plusCoinDecline', label: '加算硬币弱化 (Plus Coin Decline，旧译名)' },
        { value: 'minusCoinBoost', label: '减算硬币强化 (Minus Coin Boost)' },
        { value: 'minusCoinDrop', label: '减算硬币弱化 (Minus Coin Drop)' },
        { value: 'minusCoinDecline', label: '减算硬币弱化 (Minus Coin Decline，旧译名)' },
        { value: 'timesCoinBoost', label: '乘算硬币强化 (Times Coin Boost)' },
        { value: 'timesCoinDrop', label: '乘算硬币弱化 (Times Coin Drop)' },
        { value: 'timesCoinDecline', label: '乘算硬币弱化 (Times Coin Decline，旧译名)' },
        { value: 'skillPowerUp', label: '基础威力提升 (SkillPowerUp)' },
        { value: 'bleed', label: '流血 (Bleed)' },
        { value: 'burn', label: '烧伤 (Burn)' },
        { value: 'rupture', label: '破裂 (Rupture)' },
        { value: 'fragile', label: '易损 (Fragile)' },
        { value: 'protection', label: '守护 (Protection)' },
        { value: 'slashFragility', label: '斩击易损 (Slash Fragility)' },
        { value: 'pierceFragility', label: '突刺易损 (Pierce Fragility)' },
        { value: 'bluntFragility', label: '打击易损 (Blunt Fragility)' },
        { value: 'slashProtection', label: '斩击守护 (Slash Protection)' },
        { value: 'pierceProtection', label: '突刺守护 (Pierce Protection)' },
        { value: 'bluntProtection', label: '打击守护 (Blunt Protection)' },
        { value: 'slashDmgUp', label: '斩击伤害强化 (Slash DMG Up)' },
        { value: 'pierceDmgUp', label: '突刺伤害强化 (Pierce DMG Up)' },
        { value: 'bluntDmgUp', label: '打击伤害强化 (Blunt DMG Up)' },
        { value: 'slashDmgDown', label: '斩击伤害弱化 (Slash DMG Down)' },
        { value: 'pierceDmgDown', label: '突刺伤害弱化 (Pierce DMG Down)' },
        { value: 'bluntDmgDown', label: '打击伤害弱化 (Blunt DMG Down)' },
        { value: 'wrathDmgUp', label: '暴怒伤害强化 (Wrath DMG Up)' },
        { value: 'lustDmgUp', label: '色欲伤害强化 (Lust DMG Up)' },
        { value: 'slothDmgUp', label: '怠惰伤害强化 (Sloth DMG Up)' },
        { value: 'gluttonyDmgUp', label: '暴食伤害强化 (Gluttony DMG Up)' },
        { value: 'gloomDmgUp', label: '忧郁伤害强化 (Gloom DMG Up)' },
        { value: 'prideDmgUp', label: '傲慢伤害强化 (Pride DMG Up)' },
        { value: 'envyDmgUp', label: '嫉妒伤害强化 (Envy DMG Up)' },
        { value: 'wrathDmgDown', label: '暴怒伤害弱化 (Wrath DMG Down)' },
        { value: 'lustDmgDown', label: '色欲伤害弱化 (Lust DMG Down)' },
        { value: 'slothDmgDown', label: '怠惰伤害弱化 (Sloth DMG Down)' },
        { value: 'gluttonyDmgDown', label: '暴食伤害弱化 (Gluttony DMG Down)' },
        { value: 'gloomDmgDown', label: '忧郁伤害弱化 (Gloom DMG Down)' },
        { value: 'prideDmgDown', label: '傲慢伤害弱化 (Pride DMG Down)' },
        { value: 'envyDmgDown', label: '嫉妒伤害弱化 (Envy DMG Down)' },
        { value: 'offenseLevelUp', label: '攻击等级提升 (Offense Level Up)' },
        { value: 'offenseLevelDown', label: '攻击等级降低 (Offense Level Down)' },
        { value: 'defenseLevelUp', label: '防御等级提升 (Defense Level Up)' },
        { value: 'defenseLevelDown', label: '防御等级降低 (Defense Level Down)' },
        { value: 'damagePlus', label: '固定加算伤害 +X' },
        { value: 'damageMinus', label: '固定减算伤害 -X' }
    ];

    var api = {
        triggers: triggers,
        sources: sources,
        presets: presets
    };

    if (typeof window !== 'undefined') {
        window.LimbusBuffPresets = api;
    }
})();
