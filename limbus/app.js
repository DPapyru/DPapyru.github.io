function getNumberInputValue(el) {
    const raw = String(el && el.value != null ? el.value : '').trim();
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
    if (!Number.isFinite(value)) return 'NaN';
    const rounded = Math.round(value * 100) / 100;
    return String(rounded);
}

function escapeHtmlAttr(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildOptions(options, selected) {
    return options.map((opt) => {
        const value = String(opt.value);
        const label = String(opt.label);
        const isSelected = selected === value ? ' selected' : '';
        return '<option value="' + escapeHtmlAttr(value) + '"' + isSelected + '>' + label + '</option>';
    }).join('');
}

function populatePresetSelect(selectEl) {
    if (!selectEl) return;
    const api = window.LimbusBuffPresets;
    const presets = (api && Array.isArray(api.presets)) ? api.presets : [];
    selectEl.innerHTML = presets.map((p) => {
        const value = String(p.value || '');
        const label = String(p.label || '');
        return '<option value="' + escapeHtmlAttr(value) + '">' + label + '</option>';
    }).join('');
}

function createEffectRow(preset) {
    const presetsApi = window.LimbusBuffPresets;
    const triggers = (presetsApi && Array.isArray(presetsApi.triggers)) ? presetsApi.triggers : [];
    const sources = (presetsApi && Array.isArray(presetsApi.sources)) ? presetsApi.sources : [];

    const presetName = preset && preset.label ? String(preset.label) : '';
    const presetSource = preset && preset.source ? String(preset.source) : 'buff';
    const presetTrigger = preset && preset.trigger ? String(preset.trigger) : 'always';

    const tr = document.createElement('tr');
    tr.innerHTML = [
        '<td><select data-field="trigger">' + buildOptions(triggers, presetTrigger) + '</select></td>',
        '<td><select data-field="source">' + buildOptions(sources, presetSource) + '</select></td>',
        '<td><input type="text" data-field="label" placeholder="名称" value="' + escapeHtmlAttr(presetName) + '" /></td>',
        '<td><input type="number" step="1" min="0" data-field="times" value="1" /></td>',
        '<td><input type="number" step="any" data-field="powerAdd" value="0" /></td>',
        '<td><input type="number" step="any" data-field="mult2" value="0" /></td>',
        '<td><input type="number" step="any" data-field="add1" value="0" /></td>',
        '<td><input type="number" step="any" data-field="add2" value="0" /></td>',
        '<td style="width: 1%; white-space: nowrap;"><button type="button" class="effect-remove" data-action="remove">删除</button></td>'
    ].join('');
    return tr;
}

function wireEffectTableElements(tableEl, addButtonEl, presetSelectEl, onChange, defaultPreset) {
    if (!tableEl || !addButtonEl) return;

    function addRow(preset) {
        const row = createEffectRow(preset || defaultPreset);
        const body = tableEl.querySelector('tbody');
        if (!body) return;
        body.appendChild(row);
        row.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.matches('[data-action="remove"]')) {
                row.remove();
                onChange();
            }
        });
        row.addEventListener('input', onChange);
        row.addEventListener('change', onChange);
        onChange();
    }

    addButtonEl.addEventListener('click', () => {
        let preset = null;
        if (presetSelectEl) {
            const value = String(presetSelectEl.value || '');
            const api = window.LimbusBuffPresets;
            if (api && Array.isArray(api.presets)) {
                const found = api.presets.find((p) => String(p.value) === value);
                if (found && value) {
                    preset = {
                        label: found.label,
                        source: defaultPreset && defaultPreset.source ? defaultPreset.source : 'buff',
                        trigger: defaultPreset && defaultPreset.trigger ? defaultPreset.trigger : 'always'
                    };
                }
            }
        }
        addRow(preset);
    });
}

function getEffectsByTrigger(tableEl, allowedTriggers) {
    if (!tableEl) return [];
    const allow = new Set(allowedTriggers.map((t) => String(t)));
    const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
    const effects = [];
    rows.forEach((row) => {
        const triggerEl = row.querySelector('[data-field="trigger"]');
        const trigger = triggerEl ? String(triggerEl.value || '') : '';
        if (!allow.has(trigger)) return;
        const timesEl = row.querySelector('[data-field="times"]');
        const rawTimes = timesEl ? getNumberInputValue(timesEl) : 1;
        const times = Math.max(0, Math.floor(Number.isFinite(rawTimes) ? rawTimes : 1));
        effects.push({
            powerAdd: getNumberInputValue(row.querySelector('[data-field="powerAdd"]')),
            mult2: getNumberInputValue(row.querySelector('[data-field="mult2"]')),
            add1: getNumberInputValue(row.querySelector('[data-field="add1"]')) * times,
            add2: getNumberInputValue(row.querySelector('[data-field="add2"]')) * times
        });
    });
    return effects;
}

function sumPowerAdd(effects) {
    if (!Array.isArray(effects)) return 0;
    return effects.reduce((acc, effect) => {
        const value = effect && typeof effect.powerAdd === 'number' ? effect.powerAdd : 0;
        return acc + (Number.isFinite(value) ? value : 0);
    }, 0);
}

function getEffectsFromTables(tables, allowedTriggers) {
    const all = [];
    tables.forEach((tableEl) => {
        getEffectsByTrigger(tableEl, allowedTriggers).forEach((effect) => {
            all.push(effect);
        });
    });
    return all;
}

function updateResultText(root, key, value) {
    const el = root.querySelector('[data-result="' + key + '"]');
    if (!el) return;
    el.textContent = value;
}

function createSkillInstanceElement(groupKey, index, accent, badgeText) {
    const el = document.createElement('div');
    el.className = 'limbus-panel limbus-panel-accent limbus-skill-instance';
    el.style.setProperty('--accent', accent);
    el.setAttribute('data-instance', groupKey);
    el.setAttribute('data-instance-id', '');
    el.innerHTML = [
        '<div class="limbus-instance-head">',
        '  <div class="limbus-instance-left">',
        '    <div class="limbus-instance-badge">' + badgeText + ' #' + String(index) + '</div>',
        '    <div class="limbus-field limbus-instance-name">',
        '      <label>名称（可选）</label>',
        '      <input type="text" data-field="name" placeholder="例如：W唐 S3 连发" />',
        '    </div>',
        '  </div>',
        '  <div class="limbus-panel-actions">',
        '    <button type="button" class="effect-remove" data-action="delete-instance">删除该技能</button>',
        '  </div>',
        '</div>',
        '<div class="limbus-instance-grid">',
        '  <div class="limbus-panel limbus-panel-accent" style="--accent: ' + accent + ';">',
        '    <div class="limbus-panel-head">',
        '      <div><div class="limbus-panel-kicker">PARAMS</div><h3 class="limbus-panel-title">技能威力区间</h3></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field"><label>拼点次数（可选）</label><input type="number" step="1" min="0" data-field="clashCount" value="0" /></div>',
        '      <div class="limbus-field"><label>拼点增伤</label><input type="text" data-field="clashHint" value="每次 +3%（理论）" readonly /></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field"><label>下限</label><input type="number" step="any" data-field="powerMin" value="0" /></div>',
        '      <div class="limbus-field"><label>上限</label><input type="number" step="any" data-field="powerMax" value="0" /></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field">',
        '        <label>点数推算</label>',
        '        <label class="limbus-inline"><input type="checkbox" data-field="autoPower" checked /> 自动根据基础/硬币推算区间</label>',
        '      </div>',
        '      <div class="limbus-field"></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field"><label>基础威力（可选）</label><input type="number" step="any" data-field="basePower" value="0" /></div>',
        '      <div class="limbus-field"><label>硬币威力（可选）</label><input type="number" step="any" data-field="coinPower" value="0" /></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field"><label>硬币数</label><input type="number" step="1" min="0" data-field="coinCount" value="1" /></div>',
        '      <div class="limbus-field"><label>命中硬币数（可选）</label><input type="number" step="1" min="0" data-field="hitCoinCount" value="1" /></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field">',
        '        <label>硬币类型</label>',
        '        <select data-field="coinType">',
        '          <option value="plus">加算（Plus）</option>',
        '          <option value="minus">减算（Minus）</option>',
        '        </select>',
        '      </div>',
        '      <div class="limbus-field"><label>麻痹层数（可选）</label><input type="number" step="1" min="0" data-field="paralyze" value="0" /></div>',
        '    </div>',
        '    <div class="limbus-row">',
        '      <div class="limbus-field">',
        '        <label>由基础/硬币推算区间</label>',
        '        <button type="button" class="btn btn-outline btn-small" data-action="apply-power-builder">套用到上方区间</button>',
        '      </div>',
        '      <div class="limbus-field"></div>',
        '    </div>',
        '    <details class="limbus-mini-disclosure">',
        '      <summary class="limbus-mini-summary">硬币强化/弱化（可选）</summary>',
        '      <div class="limbus-mini-body">',
        '        <div class="limbus-row">',
        '          <div class="limbus-field"><label>加算强化层数</label><input type="number" step="1" min="0" data-field="plusCoinBoost" value="0" /></div>',
        '          <div class="limbus-field"><label>加算弱化层数</label><input type="number" step="1" min="0" data-field="plusCoinDrop" value="0" /></div>',
        '        </div>',
        '        <div class="limbus-row">',
        '          <div class="limbus-field"><label>减算强化层数</label><input type="number" step="1" min="0" data-field="minusCoinBoost" value="0" /></div>',
        '          <div class="limbus-field"><label>减算弱化层数</label><input type="number" step="1" min="0" data-field="minusCoinDrop" value="0" /></div>',
        '        </div>',
        '      </div>',
        '    </details>',
        '    <p class="limbus-hint">说明：区间上下限近似为“全正面/全反面”。加算/减算硬币强化/弱化每层使对应硬币威力 <span class="mono">±1</span>；麻痹会使若干硬币威力固定为 <span class="mono">0</span>。</p>',
        '  </div>',
        '  <div class="limbus-panel limbus-panel-accent" style="--accent: ' + accent + ';">',
        '    <div class="limbus-panel-head">',
        '      <div><div class="limbus-panel-kicker">EFFECTS</div><h3 class="limbus-panel-title">本技能触发效果（进攻方）</h3></div>',
        '      <div class="limbus-panel-actions">',
        '        <label class="limbus-inline">基础Buff</label>',
        '        <select data-role="preset"></select>',
        '        <button type="button" class="btn btn-outline btn-small" data-role="add-effect">添加</button>',
        '        <button type="button" class="btn btn-outline btn-small" data-action="fill-coin-times">按硬币数填次数</button>',
        '      </div>',
        '    </div>',
        '    <table class="effect-table" data-role="skill-effects">',
        '      <thead><tr><th>触发</th><th>来源</th><th>名称</th><th>次数</th><th>power+</th><th>伤害% (mult2)</th><th>抗性加算 (add1)</th><th>固定加算 (add2)</th><th></th></tr></thead>',
        '      <tbody></tbody>',
        '    </table>',
        '  </div>',
        '  <div class="limbus-panel limbus-panel-accent" style="--accent: ' + accent + '; grid-column: 1 / -1;">',
        '    <div class="limbus-panel-head">',
        '      <div><div class="limbus-panel-kicker">RESULT</div><h3 class="limbus-panel-title">结果</h3></div>',
        '    </div>',
        '    <div class="result-grid">',
        '      <div class="result-item"><div class="k">技能威力区间</div><div class="v mono" data-result="power"></div></div>',
        '      <div class="result-item"><div class="k">mult1</div><div class="v mono" data-result="mult1"></div></div>',
        '      <div class="result-item"><div class="k">mult2</div><div class="v mono" data-result="mult2"></div></div>',
        '      <div class="result-item"><div class="k">add1Factor</div><div class="v mono" data-result="add1Factor"></div></div>',
        '      <div class="result-item"><div class="k">add1</div><div class="v mono" data-result="add1"></div></div>',
        '      <div class="result-item"><div class="k">add2</div><div class="v mono" data-result="add2"></div></div>',
        '      <div class="result-item" style="grid-column: 1 / -1;"><div class="k">理论伤害区间</div><div class="v mono" data-result="damage"></div></div>',
        '    </div>',
        '    <div class="limbus-error mono" data-result="error"></div>',
        '  </div>',
        '</div>'
    ].join('');
    return el;
}

function main() {
    const root = document.getElementById('limbus-root');
    if (!root) return;

    const globalSettingsDialog = root.querySelector('#global-settings-dialog');
    const openGlobalSettings = document.getElementById('open-global-settings');

    function closeGlobalSettings() {
        if (!globalSettingsDialog) return;
        if (typeof globalSettingsDialog.close === 'function') {
            globalSettingsDialog.close();
        } else {
            globalSettingsDialog.removeAttribute('open');
        }
    }

    function showGlobalSettings() {
        if (!globalSettingsDialog) return;
        if (typeof globalSettingsDialog.showModal === 'function') {
            globalSettingsDialog.showModal();
        } else {
            globalSettingsDialog.setAttribute('open', '');
        }
    }

    if (openGlobalSettings) {
        openGlobalSettings.addEventListener('click', () => {
            showGlobalSettings();
        });
    }

    if (globalSettingsDialog) {
        globalSettingsDialog.addEventListener('cancel', (e) => {
            e.preventDefault();
            closeGlobalSettings();
        });

        globalSettingsDialog.addEventListener('click', (e) => {
            if (e.target === globalSettingsDialog) {
                closeGlobalSettings();
            }
        });

        globalSettingsDialog.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.matches('[data-action="close-global-settings"]')) {
                closeGlobalSettings();
            }
        });
    }

    var core = window.LimbusDamageCore;
    if (!core || typeof core.computeTheoreticalDamageRange !== 'function') {
        return;
    }

    const EXISTING_TRIGGERS = ['always', 'combatStart', 'turnStart', 'turnEnd', 'combatEnd'];
    const SKILL_TRIGGERS = ['onUse', 'beforeAttack', 'clashWin', 'clashLose', 'onHit', 'headsHit', 'tailsHit', 'onCrit', 'onEvade', 'afterAttack'];

    const globalInputs = {
        defenseBonus: root.querySelector('#defense-bonus'),
        observationBonus: root.querySelector('#observation-bonus'),
        physicalResistBonus: root.querySelector('#physical-resist-bonus'),
        sinResistBonus: root.querySelector('#sin-resist-bonus')
    };

    const attackerCurrentTable = root.querySelector('#attacker-current');
    const attackerPassiveTable = root.querySelector('#attacker-passive');
    const defenderCurrentTable = root.querySelector('#defender-current');

    populatePresetSelect(root.querySelector('#preset-attacker-current'));
    populatePresetSelect(root.querySelector('#preset-attacker-passive'));
    populatePresetSelect(root.querySelector('#preset-defender-current'));

    wireEffectTableElements(
        attackerCurrentTable,
        root.querySelector('#add-attacker-current'),
        root.querySelector('#preset-attacker-current'),
        recalcAll,
        { trigger: 'always', source: 'buff' }
    );
    wireEffectTableElements(
        attackerPassiveTable,
        root.querySelector('#add-attacker-passive'),
        root.querySelector('#preset-attacker-passive'),
        recalcAll,
        { trigger: 'always', source: 'passive' }
    );
    wireEffectTableElements(
        defenderCurrentTable,
        root.querySelector('#add-defender-current'),
        root.querySelector('#preset-defender-current'),
        recalcAll,
        { trigger: 'always', source: 'buff' }
    );

    const groupMeta = {
        skill1: { accent: '#16849f', badge: 'SKILL 1', label: '一技能' },
        skill2: { accent: '#0054c6', badge: 'SKILL 2', label: '二技能' },
        skill3: { accent: '#b60000', badge: 'SKILL 3', label: '三技能' },
        defense: { accent: '#60a5fa', badge: 'DEFENSE', label: '防御' }
    };

    const groupsRoot = root.querySelector('#skill-groups');
    const addInstanceButton = root.querySelector('#add-skill-instance');
    const tabButtons = Array.from(root.querySelectorAll('[data-skill-tab]'));

    let activeGroupKey = 'skill1';
    let instanceCounter = 0;

    const instanceListItems = new Map();
    const instanceElements = new Map();

    function getGroupContainer(groupKey) {
        return groupsRoot ? groupsRoot.querySelector('[data-skill-group="' + groupKey + '"]') : null;
    }

    function getGroupParts(groupKey) {
        const container = getGroupContainer(groupKey);
        return {
            container: container,
            list: container ? container.querySelector('[data-role="instance-list"]') : null,
            detail: container ? container.querySelector('[data-role="instance-detail"]') : null
        };
    }

    function createInstanceListItem(instanceId, meta, index) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'limbus-skill-card';
        btn.style.setProperty('--accent', meta.accent);
        btn.setAttribute('data-target', instanceId);
        btn.innerHTML = [
            '<div class="k">' + escapeHtmlAttr(meta.badge) + ' #' + String(index) + '</div>',
            '<div class="t" data-role="title">未命名</div>',
            '<div class="s mono" data-role="summary">0 ~ 0</div>'
        ].join('');
        return btn;
    }

    function selectInstance(groupKey, instanceId) {
        const parts = getGroupParts(groupKey);
        if (!parts.detail || !parts.list) return;

        Array.from(parts.detail.querySelectorAll('.limbus-skill-instance')).forEach((el) => {
            el.classList.toggle('limbus-hidden', String(el.getAttribute('data-instance-id')) !== instanceId);
        });

        Array.from(parts.list.querySelectorAll('[data-target]')).forEach((el) => {
            el.classList.toggle('limbus-skill-card-active', String(el.getAttribute('data-target')) === instanceId);
        });
    }

    function deleteInstance(instanceEl) {
        const instanceId = String(instanceEl.getAttribute('data-instance-id') || '');
        const groupKey = String(instanceEl.getAttribute('data-instance') || '');
        const parts = getGroupParts(groupKey);
        const listItem = instanceListItems.get(instanceId);
        if (listItem) listItem.remove();
        instanceListItems.delete(instanceId);
        instanceElements.delete(instanceId);
        instanceEl.remove();

        if (parts.detail && parts.list) {
            const remaining = Array.from(parts.detail.querySelectorAll('.limbus-skill-instance'));
            if (remaining.length) {
                const nextId = String(remaining[0].getAttribute('data-instance-id') || '');
                if (nextId) selectInstance(groupKey, nextId);
            }
        }

        recalcAll();
    }

    function setActiveGroup(groupKey) {
        activeGroupKey = groupKey;
        tabButtons.forEach((btn) => {
            const isActive = String(btn.getAttribute('data-skill-tab')) === groupKey;
            btn.classList.toggle('limbus-tab-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        Object.keys(groupMeta).forEach((key) => {
            const container = getGroupContainer(key);
            if (!container) return;
            container.classList.toggle('limbus-hidden', key !== groupKey);
        });
    }

    function recalcInstance(instanceEl) {
        const powerMinEl = instanceEl.querySelector('[data-field="powerMin"]');
        const powerMaxEl = instanceEl.querySelector('[data-field="powerMax"]');
        const powerMin = getNumberInputValue(powerMinEl);
        const powerMax = getNumberInputValue(powerMaxEl);
        const normalizedMin = Math.min(powerMin, powerMax);
        const normalizedMax = Math.max(powerMin, powerMax);

        const globalExisting = getEffectsFromTables([attackerCurrentTable, attackerPassiveTable], EXISTING_TRIGGERS);
        const globalSkillEffects = getEffectsFromTables([attackerCurrentTable, attackerPassiveTable], SKILL_TRIGGERS);

        const instanceSkillTable = instanceEl.querySelector('table[data-role="skill-effects"]');
        const instanceSkillEffects = getEffectsByTrigger(instanceSkillTable, SKILL_TRIGGERS);

        const defenderExisting = getEffectsByTrigger(defenderCurrentTable, EXISTING_TRIGGERS);

        const powerAdd = sumPowerAdd(globalExisting)
            + sumPowerAdd(globalSkillEffects)
            + sumPowerAdd(instanceSkillEffects);

        const clashCount = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="clashCount"]'))));
        const clashMult2 = 0.03 * clashCount;

        const attackerOnUse = globalSkillEffects.concat(instanceSkillEffects);
        if (clashMult2) {
            attackerOnUse.push({ mult2: clashMult2, add1: 0, add2: 0, powerAdd: 0 });
        }

        const model = {
            powerMin: normalizedMin + powerAdd,
            powerMax: normalizedMax + powerAdd,
            defenseBonus: getNumberInputValue(globalInputs.defenseBonus),
            observationBonus: getNumberInputValue(globalInputs.observationBonus),
            physicalResistBonus: getNumberInputValue(globalInputs.physicalResistBonus),
            sinResistBonus: getNumberInputValue(globalInputs.sinResistBonus),
            attackerExisting: globalExisting,
            attackerOnUse: attackerOnUse,
            defenderExisting: defenderExisting
        };

        try {
            const result = core.computeTheoreticalDamageRange(model);
            updateResultText(instanceEl, 'power', formatNumber(result.powerRange.min) + ' ~ ' + formatNumber(result.powerRange.max));
            updateResultText(instanceEl, 'mult1', formatNumber(result.mult1));
            updateResultText(instanceEl, 'mult2', formatNumber(result.mult2));
            updateResultText(instanceEl, 'add1Factor', formatNumber(result.add1Factor));
            updateResultText(instanceEl, 'add1', formatNumber(result.add1));
            updateResultText(instanceEl, 'add2', formatNumber(result.add2));
            updateResultText(instanceEl, 'damage', formatNumber(result.damageRange.min) + ' ~ ' + formatNumber(result.damageRange.max));
            updateResultText(instanceEl, 'error', '');

            const instanceId = String(instanceEl.getAttribute('data-instance-id') || '');
            const listItem = instanceListItems.get(instanceId);
            if (listItem) {
                const titleEl = listItem.querySelector('[data-role="title"]');
                const summaryEl = listItem.querySelector('[data-role="summary"]');
                const nameEl = instanceEl.querySelector('[data-field="name"]');
                const name = nameEl ? String(nameEl.value || '').trim() : '';
                if (titleEl) titleEl.textContent = name || '未命名';
                if (summaryEl) summaryEl.textContent = formatNumber(result.damageRange.min) + ' ~ ' + formatNumber(result.damageRange.max);
            }
        } catch (e) {
            updateResultText(instanceEl, 'error', String(e && e.message ? e.message : e));
        }
    }

    function recalcAll() {
        if (!groupsRoot) return;
        Array.from(groupsRoot.querySelectorAll('.limbus-skill-instance')).forEach(recalcInstance);
    }

    function wireInstance(instanceEl) {
        function setPowerReadonly(isReadonly) {
            const powerMinEl = instanceEl.querySelector('[data-field="powerMin"]');
            const powerMaxEl = instanceEl.querySelector('[data-field="powerMax"]');
            if (powerMinEl) powerMinEl.readOnly = !!isReadonly;
            if (powerMaxEl) powerMaxEl.readOnly = !!isReadonly;
        }

        function applyPowerBuilder() {
            const basePower = getNumberInputValue(instanceEl.querySelector('[data-field="basePower"]'));
            const coinPower = getNumberInputValue(instanceEl.querySelector('[data-field="coinPower"]'));
            const coinCount = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="coinCount"]'))));
            const coinTypeEl = instanceEl.querySelector('[data-field="coinType"]');
            const coinType = coinTypeEl ? String(coinTypeEl.value || 'plus') : 'plus';
            const paralyze = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="paralyze"]'))));
            const plusCoinBoost = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="plusCoinBoost"]'))));
            const plusCoinDrop = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="plusCoinDrop"]'))));
            const minusCoinBoost = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="minusCoinBoost"]'))));
            const minusCoinDrop = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="minusCoinDrop"]'))));

            const coinDelta = (coinType === 'minus')
                ? (minusCoinBoost - minusCoinDrop)
                : (plusCoinBoost - plusCoinDrop);

            const effectiveCoinPower = coinPower + coinDelta;
            const activeCoinCount = Math.max(0, coinCount - Math.min(coinCount, paralyze));
            const delta = effectiveCoinPower * activeCoinCount;
            const min = basePower + Math.min(0, delta);
            const max = basePower + Math.max(0, delta);
            const powerMinEl = instanceEl.querySelector('[data-field="powerMin"]');
            const powerMaxEl = instanceEl.querySelector('[data-field="powerMax"]');
            if (powerMinEl) powerMinEl.value = String(min);
            if (powerMaxEl) powerMaxEl.value = String(max);

            const hitCoinCountEl = instanceEl.querySelector('[data-field="hitCoinCount"]');
            if (hitCoinCountEl) {
                const currentHit = Math.max(0, Math.floor(getNumberInputValue(hitCoinCountEl)));
                if (!currentHit || currentHit > coinCount) {
                    hitCoinCountEl.value = String(coinCount);
                }
            }
        }

        const presetSelect = instanceEl.querySelector('select[data-role="preset"]');
        const addEffectButton = instanceEl.querySelector('button[data-role="add-effect"]');
        const table = instanceEl.querySelector('table[data-role="skill-effects"]');
        populatePresetSelect(presetSelect);
        wireEffectTableElements(table, addEffectButton, presetSelect, recalcAll, { trigger: 'onUse', source: 'skill' });

        const autoPowerEl = instanceEl.querySelector('[data-field="autoPower"]');
        setPowerReadonly(autoPowerEl && autoPowerEl.checked);
        if (autoPowerEl) {
            autoPowerEl.addEventListener('change', () => {
                setPowerReadonly(autoPowerEl.checked);
                if (autoPowerEl.checked) {
                    applyPowerBuilder();
                    recalcInstance(instanceEl);
                }
            });
        }

        instanceEl.addEventListener('input', (e) => {
            const target = e.target;
            if (!target) return;
            if (target.matches('input') || target.matches('select')) {
                if (autoPowerEl && autoPowerEl.checked) {
                    if (
                        target.matches('[data-field="basePower"]')
                        || target.matches('[data-field="coinPower"]')
                        || target.matches('[data-field="coinCount"]')
                        || target.matches('[data-field="coinType"]')
                        || target.matches('[data-field="paralyze"]')
                        || target.matches('[data-field="plusCoinBoost"]')
                        || target.matches('[data-field="plusCoinDrop"]')
                        || target.matches('[data-field="minusCoinBoost"]')
                        || target.matches('[data-field="minusCoinDrop"]')
                    ) {
                        applyPowerBuilder();
                    }
                }
                if (autoPowerEl && autoPowerEl.checked) {
                    if (target.matches('[data-field="powerMin"]') || target.matches('[data-field="powerMax"]')) {
                        autoPowerEl.checked = false;
                        setPowerReadonly(false);
                    }
                }
                recalcInstance(instanceEl);
            }
        });

        instanceEl.addEventListener('click', (e) => {
            const target = e.target;
            if (!target) return;
            if (target.matches('[data-action="delete-instance"]')) {
                deleteInstance(instanceEl);
                return;
            }
            if (target.matches('[data-action="apply-power-builder"]')) {
                if (autoPowerEl) {
                    autoPowerEl.checked = true;
                    setPowerReadonly(true);
                }
                applyPowerBuilder();
                recalcInstance(instanceEl);
                return;
            }
            if (target.matches('[data-action="fill-coin-times"]')) {
                const hitCoinCount = Math.max(0, Math.floor(getNumberInputValue(instanceEl.querySelector('[data-field="hitCoinCount"]'))));
                const rows = Array.from(instanceEl.querySelectorAll('table[data-role="skill-effects"] tbody tr'));
                rows.forEach((row) => {
                    const triggerEl = row.querySelector('[data-field="trigger"]');
                    const timesEl = row.querySelector('[data-field="times"]');
                    const trigger = triggerEl ? String(triggerEl.value || '') : '';
                    if (!timesEl) return;
                    if (trigger === 'onHit' || trigger === 'headsHit' || trigger === 'tailsHit') {
                        timesEl.value = String(hitCoinCount);
                    }
                });
                recalcInstance(instanceEl);
            }
        });
    }

    function addSkillInstance(groupKey) {
        const parts = getGroupParts(groupKey);
        if (!parts.container || !parts.list || !parts.detail) return;
        instanceCounter += 1;
        const meta = groupMeta[groupKey];

        const instanceId = groupKey + '-' + String(instanceCounter);
        const instanceEl = createSkillInstanceElement(groupKey, instanceCounter, meta.accent, meta.badge);
        instanceEl.setAttribute('data-instance-id', instanceId);

        const listItem = createInstanceListItem(instanceId, meta, instanceCounter);
        listItem.addEventListener('click', () => {
            selectInstance(groupKey, instanceId);
        });

        parts.list.appendChild(listItem);
        parts.detail.appendChild(instanceEl);
        instanceListItems.set(instanceId, listItem);
        instanceElements.set(instanceId, instanceEl);
        wireInstance(instanceEl);
        recalcInstance(instanceEl);
        selectInstance(groupKey, instanceId);
    }

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            setActiveGroup(String(btn.getAttribute('data-skill-tab')));
        });
    });

    if (addInstanceButton) {
        addInstanceButton.addEventListener('click', () => {
            addSkillInstance(activeGroupKey);
        });
    }

    Object.values(globalInputs).forEach((el) => {
        if (!el) return;
        el.addEventListener('input', recalcAll);
    });

    addSkillInstance('skill1');
    setActiveGroup('skill1');
    recalcAll();
}

document.addEventListener('DOMContentLoaded', main);
