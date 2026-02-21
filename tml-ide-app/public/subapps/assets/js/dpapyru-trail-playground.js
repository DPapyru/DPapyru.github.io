// DPapyru-- trail playground for shader page (front-end render only).
// Style: semicolons, 4-space indent, IIFE.

(function () {
    'use strict';

    const MODE_DP = 'dp';
    const BLEND_MODE_STORAGE_KEY = 'shader-playground.blend-mode';
    const editorAssist = (typeof window !== 'undefined' && window.ShaderEditorAssist)
        ? window.ShaderEditorAssist
        : null;
    const DP_PRESET_DEFAULT = 'longsword_manual';
    const DP_PRESET_SOURCES = {
        longsword_manual: [
            'profile swing longsword_manual {',
            '    const int SLASH_TICKS = 50;',
            '',
            '    state slash(SLASH_TICKS) {',
            '        tick {',
            '            let float t = state_tick / SLASH_TICKS;',
            '            let float cx = 0.46 + 0.01 * sin(Time * 1.2);',
            '            let float cy = 0.58 + 0.01 * cos(Time * 0.9);',
            '            let float a = -2.52 + t * 2.34;',
            '',
            '            make slash {',
            '                center(cx, cy);',
            '                radius(0.34);',
            '                angle(a - 0.84, a + 2.3);',
            '                count(60);',
            '                width(1.22, 1.22);',
            '                color(rgba(1, 1, 1, 1), rgba(1.00, 1.00, 1.00, 1));',
            '                uv(0.00, 1.00);',
            '            }',
            '        }',
            '    }',
            '',
            '    trail {',
            '        shader_pass 0;',
            '        use_shader on;',
            '        coord uv;',
            '        uv linear;',
            '    }',
            '}'
        ].join('\n'),
        single_rect: [
            'profile swing single_rect {',
            '    const int RECT_TICKS = 60;',
            '',
            '    state rect(RECT_TICKS) {',
            '        tick {',
            '            let float cx = 0.50;',
            '            let float cy = 0.56;',
            '            let float half_w = 0.18;',
            '            let float half_h = 0.12;',
            '',
            '            emit mesh {',
            '                topology triangle_list;',
            '                vertices [',
            '                    v(cx - half_w, cy - half_h, rgba(1, 1, 1, 1), 0, 1),',
            '                    v(cx + half_w, cy - half_h, rgba(1, 1, 1, 1), 1, 1),',
            '                    v(cx - half_w, cy + half_h, rgba(1, 1, 1, 1), 0, 0),',
            '                    v(cx + half_w, cy + half_h, rgba(1, 1, 1, 1), 1, 0)',
            '                ];',
            '                indices [0, 1, 2, 2, 1, 3];',
            '                vertex_offset 0;',
            '                num_vertices 4;',
            '                index_offset 0;',
            '                primitive_count 2;',
            '            }',
            '        }',
            '    }',
            '',
            '    trail {',
            '        shader_pass 0;',
            '        use_shader on;',
            '        coord uv;',
            '        uv linear;',
            '    }',
            '}'
        ].join('\n')
    };

    const EXPR_ALLOWED = /^[A-Za-z0-9_+\-*/%().,\s<>=!&|?:]+$/;
    const EXPR_BLOCKLIST = [
        'window', 'document', 'globalthis', 'function', '=>', 'constructor',
        '__proto__', 'prototype', 'eval', 'import', 'new ', 'this'
    ];

    function $(id) {
        return document.getElementById(id);
    }

    function setText(el, text) {
        if (!el) return;
        el.textContent = String(text || '');
    }

    function setValue(el, text) {
        if (!el) return;
        el.value = String(text || '');
    }

    function readStoredBlendMode() {
        try {
            const raw = localStorage.getItem(BLEND_MODE_STORAGE_KEY);
            return raw === 'additive' ? 'additive' : 'alpha';
        } catch (_) {
            return 'alpha';
        }
    }

    function saveBlendMode(mode) {
        try {
            localStorage.setItem(BLEND_MODE_STORAGE_KEY, mode === 'additive' ? 'additive' : 'alpha');
        } catch (_) { }
    }

    function normalizePresetId(value) {
        const id = String(value || '').trim();
        if (Object.prototype.hasOwnProperty.call(DP_PRESET_SOURCES, id)) return id;
        return DP_PRESET_DEFAULT;
    }

    function getPresetSource(presetId) {
        const id = normalizePresetId(presetId);
        return String(DP_PRESET_SOURCES[id] || DP_PRESET_SOURCES[DP_PRESET_DEFAULT] || '');
    }

    function getPresetDisplayName(presetId) {
        const id = normalizePresetId(presetId);
        if (id === 'single_rect') return '单个矩形';
        return '刀光';
    }

    function dispatchBlendModeChanged(mode) {
        if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
        const detail = { mode: mode === 'additive' ? 'additive' : 'alpha' };
        try {
            window.dispatchEvent(new CustomEvent('shader-playground:blend-mode-changed', { detail: detail }));
            return;
        } catch (_) { }
        try {
            const event = document.createEvent('CustomEvent');
            event.initCustomEvent('shader-playground:blend-mode-changed', false, false, detail);
            window.dispatchEvent(event);
        } catch (_) { }
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function clamp01(v) {
        return clamp(Number(v || 0), 0, 1);
    }

    function safeNumber(v, fallback) {
        const n = Number(v);
        if (!isFinite(n)) return Number(fallback || 0);
        return n;
    }

    function createEl(tag, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    function isIdentifierChar(ch) {
        return /[A-Za-z0-9_]/.test(String(ch || ''));
    }

    function normalizeColor(c) {
        return {
            r: clamp01(c && c.r),
            g: clamp01(c && c.g),
            b: clamp01(c && c.b),
            a: clamp01(c && c.a)
        };
    }

    function colorToCss(c) {
        const nc = normalizeColor(c);
        return 'rgba(' +
            Math.round(nc.r * 255) + ', ' +
            Math.round(nc.g * 255) + ', ' +
            Math.round(nc.b * 255) + ', ' +
            nc.a.toFixed(3) +
            ')';
    }

    function stripComments(source) {
        let text = String(source || '');
        text = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
        text = text.replace(/\/\/[^\n]*/g, ' ');
        return text;
    }

    function splitTopLevelArgs(text) {
        const raw = String(text || '');
        const result = [];
        let depth = 0;
        let start = 0;

        for (let i = 0; i < raw.length; i += 1) {
            const ch = raw[i];
            if (ch === '(') {
                depth += 1;
            } else if (ch === ')') {
                depth -= 1;
            } else if (ch === ',' && depth === 0) {
                result.push(raw.slice(start, i).trim());
                start = i + 1;
            }
        }

        const tail = raw.slice(start).trim();
        if (tail.length > 0) result.push(tail);
        return result;
    }

    function splitTopLevelStatements(text) {
        const raw = String(text || '');
        const result = [];
        let depthParen = 0;
        let depthBrace = 0;
        let start = 0;

        for (let i = 0; i < raw.length; i += 1) {
            const ch = raw[i];
            if (ch === '(') {
                depthParen += 1;
            } else if (ch === ')') {
                depthParen = Math.max(0, depthParen - 1);
            } else if (ch === '{') {
                depthBrace += 1;
            } else if (ch === '}') {
                depthBrace = Math.max(0, depthBrace - 1);
            } else if (ch === ';' && depthParen === 0 && depthBrace === 0) {
                const statement = raw.slice(start, i).trim();
                if (statement.length > 0) {
                    result.push(statement);
                }
                start = i + 1;
            }
        }

        const tail = raw.slice(start).trim();
        if (tail.length > 0) {
            result.push(tail);
        }

        return result;
    }

    function findBuildHeader(text) {
        const source = String(text || '');
        const patterns = [
            /\bfun\s+TrailPoint\[\]\s+build\s*\(\s*TrailContext\s+ctx\s*\)\s*\{/,
            /\bfun\s+TrailPoint\[\]\s+build\s*\(\s*ctx\s*:\s*TrailContext\s*\)\s*\{/,
            /\bfun\s+build\s*\(\s*ctx\s*\)\s*\{/,
            /\bbuild\s*\(\s*ctx\s*\)\s*\{/
        ];

        for (const re of patterns) {
            const m = source.match(re);
            if (m) return m;
        }
        return null;
    }

    function extractBuildBody(source) {
        const text = String(source || '');
        const headMatch = findBuildHeader(text);

        if (!headMatch) {
            return {
                ok: false,
                error: '未找到 build 入口。支持: fun TrailPoint[] build(TrailContext ctx) { ... } 或 build(ctx) { ... }'
            };
        }

        let idx = headMatch.index + headMatch[0].length;
        let depth = 1;
        while (idx < text.length && depth > 0) {
            const ch = text[idx];
            if (ch === '{') depth += 1;
            else if (ch === '}') depth -= 1;
            idx += 1;
        }

        if (depth !== 0) {
            return {
                ok: false,
                error: 'build 函数大括号不匹配。'
            };
        }

        return {
            ok: true,
            body: text.slice(headMatch.index + headMatch[0].length, idx - 1)
        };
    }

    function compileExpression(expressionText) {
        const expr = String(expressionText || '').trim();
        if (!expr) {
            return {
                ok: false,
                error: '表达式为空。'
            };
        }

        if (!EXPR_ALLOWED.test(expr)) {
            return {
                ok: false,
                error: '表达式包含不支持的字符: ' + expr
            };
        }

        const lower = expr.toLowerCase();
        for (const blocked of EXPR_BLOCKLIST) {
            if (lower.indexOf(blocked) >= 0) {
                return {
                    ok: false,
                    error: '表达式包含不允许的标记: ' + blocked
                };
            }
        }

        let runner = null;
        try {
            runner = new Function('scope', 'with (scope) { return (' + expr + '); }');
        } catch (_) {
            return {
                ok: false,
                error: '表达式解析失败: ' + expr
            };
        }

        return {
            ok: true,
            evaluate: function (scope) {
                try {
                    const value = runner(scope || {});
                    const numberValue = Number(value);
                    if (!isFinite(numberValue)) {
                        return { ok: false, error: '表达式结果不是有效数字: ' + expr };
                    }
                    return { ok: true, value: numberValue };
                } catch (err) {
                    return {
                        ok: false,
                        error: '表达式执行失败: ' + expr + ' | ' + String(err && err.message ? err.message : err)
                    };
                }
            }
        };
    }

    function compileVec2(rawArg) {
        const text = String(rawArg || '').trim();
        const m = text.match(/^(?:vec2|v2)\s*\((.*)\)$/i);
        if (!m) {
            return { ok: false, error: '需要 vec2(...) / v2(...)，当前: ' + text };
        }

        const parts = splitTopLevelArgs(m[1]);
        if (parts.length !== 2) {
            return { ok: false, error: 'vec2(...) 需要 2 个参数，当前: ' + parts.length };
        }

        const xEval = compileExpression(parts[0]);
        if (!xEval.ok) return xEval;

        const yEval = compileExpression(parts[1]);
        if (!yEval.ok) return yEval;

        return {
            ok: true,
            evaluate: function (scope) {
                const x = xEval.evaluate(scope);
                if (!x.ok) return x;
                const y = yEval.evaluate(scope);
                if (!y.ok) return y;
                return {
                    ok: true,
                    value: { x: x.value, y: y.value }
                };
            }
        };
    }

    function compileColor(rawArg) {
        const text = String(rawArg || '').trim();
        const m = text.match(/^(?:rgba|rainbow)\s*\((.*)\)$/i);
        if (!m) {
            return { ok: false, error: '需要 rgba(...) / rainbow(...)，当前: ' + text };
        }

        const parts = splitTopLevelArgs(m[1]);
        if (parts.length !== 4) {
            return { ok: false, error: 'rgba(...) 需要 4 个参数，当前: ' + parts.length };
        }

        const rEval = compileExpression(parts[0]);
        if (!rEval.ok) return rEval;
        const gEval = compileExpression(parts[1]);
        if (!gEval.ok) return gEval;
        const bEval = compileExpression(parts[2]);
        if (!bEval.ok) return bEval;
        const aEval = compileExpression(parts[3]);
        if (!aEval.ok) return aEval;

        return {
            ok: true,
            evaluate: function (scope) {
                const r = rEval.evaluate(scope);
                if (!r.ok) return r;
                const g = gEval.evaluate(scope);
                if (!g.ok) return g;
                const b = bEval.evaluate(scope);
                if (!b.ok) return b;
                const a = aEval.evaluate(scope);
                if (!a.ok) return a;
                return {
                    ok: true,
                    value: normalizeColor({ r: r.value, g: g.value, b: b.value, a: a.value })
                };
            }
        };
    }

    function createTrailPoint(x, y, width, color, u, uDefined) {
        return {
            x: safeNumber(x, 0),
            y: safeNumber(y, 0),
            width: Math.max(0.001, safeNumber(width, 0.06)),
            color: normalizeColor(color),
            u: safeNumber(u, 0),
            uDefined: !!uDefined
        };
    }

    function resolveSlashExpandTime(scope) {
        const source = scope && typeof scope === 'object' ? scope : null;
        if (!source) return null;

        const candidates = [
            source.state_progress,
            source.phase_progress,
            source.time
        ];

        for (const candidate of candidates) {
            const n = Number(candidate);
            if (isFinite(n)) {
                return clamp01(n);
            }
        }

        return null;
    }

    function resolveSlashVisibleCount(totalCount, scope) {
        const count = clamp(Math.floor(Math.abs(safeNumber(totalCount, 0))), 0, 256);
        if (count <= 0) return 0;

        const time01 = resolveSlashExpandTime(scope);
        if (time01 === null) {
            return count;
        }

        const eased = Math.pow(time01, 3.5);
        return clamp(Math.round(count * clamp01(eased)), 0, count);
    }

    function compileSlashCall(argsText) {
        const args = splitTopLevelArgs(argsText);
        const argLen = args.length;
        const hasCount = argLen === 10 || argLen === 12;
        const hasUvRange = argLen === 11 || argLen === 12;

        if (![9, 10, 11, 12].includes(argLen)) {
            return {
                ok: false,
                error: 'slash/arc/swing 参数不匹配。支持: 9参(基础), 10参(含count), 11参(含uv区间), 12参(含count+uv区间)。'
            };
        }

        const xEval = compileExpression(args[0]);
        if (!xEval.ok) return xEval;
        const yEval = compileExpression(args[1]);
        if (!yEval.ok) return yEval;
        const radiusEval = compileExpression(args[2]);
        if (!radiusEval.ok) return radiusEval;
        const startEval = compileExpression(args[3]);
        if (!startEval.ok) return startEval;
        const endEval = compileExpression(args[4]);
        if (!endEval.ok) return endEval;

        let countEval = null;
        let widthStartIdx = 5;
        if (hasCount) {
            countEval = compileExpression(args[5]);
            if (!countEval.ok) return countEval;
            widthStartIdx = 6;
        }

        const widthStartEval = compileExpression(args[widthStartIdx]);
        if (!widthStartEval.ok) return widthStartEval;
        const widthEndEval = compileExpression(args[widthStartIdx + 1]);
        if (!widthEndEval.ok) return widthEndEval;
        const colorStartEval = compileColor(args[widthStartIdx + 2]);
        if (!colorStartEval.ok) return colorStartEval;
        const colorEndEval = compileColor(args[widthStartIdx + 3]);
        if (!colorEndEval.ok) return colorEndEval;

        let uStartEval = null;
        let uEndEval = null;
        if (hasUvRange) {
            uStartEval = compileExpression(args[widthStartIdx + 4]);
            if (!uStartEval.ok) return uStartEval;
            uEndEval = compileExpression(args[widthStartIdx + 5]);
            if (!uEndEval.ok) return uEndEval;
        }

        return {
            ok: true,
            evaluate: function (scope) {
                const x = xEval.evaluate(scope);
                if (!x.ok) return x;
                const y = yEval.evaluate(scope);
                if (!y.ok) return y;
                const radius = radiusEval.evaluate(scope);
                if (!radius.ok) return radius;
                const start = startEval.evaluate(scope);
                if (!start.ok) return start;
                const end = endEval.evaluate(scope);
                if (!end.ok) return end;

                let countValue = 0;
                if (countEval) {
                    const count = countEval.evaluate(scope);
                    if (!count.ok) return count;
                    countValue = safeNumber(count.value, 10);
                }

                const widthStart = widthStartEval.evaluate(scope);
                if (!widthStart.ok) return widthStart;
                const widthEnd = widthEndEval.evaluate(scope);
                if (!widthEnd.ok) return widthEnd;
                const colorStart = colorStartEval.evaluate(scope);
                if (!colorStart.ok) return colorStart;
                const colorEnd = colorEndEval.evaluate(scope);
                if (!colorEnd.ok) return colorEnd;

                const uStart = uStartEval ? uStartEval.evaluate(scope) : { ok: true, value: 0 };
                if (!uStart.ok) return uStart;
                const uEnd = uEndEval ? uEndEval.evaluate(scope) : { ok: true, value: 1 };
                if (!uEnd.ok) return uEnd;

                const cx = safeNumber(x.value, 0);
                const cy = safeNumber(y.value, 0);
                const rr = safeNumber(radius.value, 0.3);
                const a0 = safeNumber(start.value, 0);
                const a1 = safeNumber(end.value, Math.PI * 0.5);
                const arcLen = Math.abs(a1 - a0);
                const autoCount = clamp(Math.ceil(arcLen * 8), 6, 28);
                const c = clamp(Math.floor(Math.abs(countValue || autoCount)), 2, 64);
                const visibleCount = resolveSlashVisibleCount(c, scope);

                const points = [];
                for (let i = 0; i < visibleCount; i += 1) {
                    const t = c <= 1 ? 0 : (i / (c - 1));
                    const angle = mixNumber(a0, a1, t);
                    const px = cx + Math.cos(angle) * rr;
                    const py = cy + Math.sin(angle) * rr;
                    const w = mixNumber(widthStart.value, widthEnd.value, t);
                    const color = mixColor(colorStart.value, colorEnd.value, t);
                    const u = hasUvRange ? mixNumber(uStart.value, uEnd.value, t) : t;
                    points.push(createTrailPoint(px, py, w, color, u, hasUvRange));
                }

                return {
                    ok: true,
                    values: points
                };
            }
        };
    }

    function compileMakeSlashCall(rawBody) {

        const body = String(rawBody || '');
        const statements = splitTopLevelStatements(body);

        let centerXEval = null;
        let centerYEval = null;
        let radiusEval = null;
        let angleStartEval = null;
        let angleEndEval = null;
        let countEval = null;
        let widthStartEval = null;
        let widthEndEval = null;
        let colorStartEval = null;
        let colorEndEval = null;
        let uStartEval = null;
        let uEndEval = null;

        for (const statement of statements) {
            const callMatch = String(statement).match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/);
            if (!callMatch) {
                return {
                    ok: false,
                    error: 'make slash 块语句无效: ' + statement
                };
            }

            const name = String(callMatch[1] || '').toLowerCase();
            const args = splitTopLevelArgs(callMatch[2]);

            if (name === 'center' || name === 'at' || name === 'pos') {
                if (args.length !== 2) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 2 个参数。'
                    };
                }
                centerXEval = compileExpression(args[0]);
                if (!centerXEval.ok) return centerXEval;
                centerYEval = compileExpression(args[1]);
                if (!centerYEval.ok) return centerYEval;
                continue;
            }

            if (name === 'radius' || name === 'r') {
                if (args.length !== 1) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 1 个参数。'
                    };
                }
                radiusEval = compileExpression(args[0]);
                if (!radiusEval.ok) return radiusEval;
                continue;
            }

            if (name === 'angle' || name === 'arc') {
                if (args.length !== 2) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 2 个参数。'
                    };
                }
                angleStartEval = compileExpression(args[0]);
                if (!angleStartEval.ok) return angleStartEval;
                angleEndEval = compileExpression(args[1]);
                if (!angleEndEval.ok) return angleEndEval;
                continue;
            }

            if (name === 'count' || name === 'samples' || name === 'points') {
                if (args.length !== 1) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 1 个参数。'
                    };
                }
                countEval = compileExpression(args[0]);
                if (!countEval.ok) return countEval;
                continue;
            }

            if (name === 'width' || name === 'thickness') {
                if (args.length !== 2) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 2 个参数。'
                    };
                }
                widthStartEval = compileExpression(args[0]);
                if (!widthStartEval.ok) return widthStartEval;
                widthEndEval = compileExpression(args[1]);
                if (!widthEndEval.ok) return widthEndEval;
                continue;
            }

            if (name === 'color' || name === 'colour') {
                if (args.length !== 2) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 2 个参数。'
                    };
                }
                colorStartEval = compileColor(args[0]);
                if (!colorStartEval.ok) return colorStartEval;
                colorEndEval = compileColor(args[1]);
                if (!colorEndEval.ok) return colorEndEval;
                continue;
            }

            if (name === 'uv' || name === 'u') {
                if (args.length !== 2) {
                    return {
                        ok: false,
                        error: name + '(...) 需要 2 个参数。'
                    };
                }
                uStartEval = compileExpression(args[0]);
                if (!uStartEval.ok) return uStartEval;
                uEndEval = compileExpression(args[1]);
                if (!uEndEval.ok) return uEndEval;
                continue;
            }

            return {
                ok: false,
                error: 'make slash 不支持字段: ' + name + '(...)'
            };
        }

        if (!centerXEval || !centerYEval) {
            return {
                ok: false,
                error: 'make slash 缺少 center(x, y)。'
            };
        }

        if (!angleStartEval || !angleEndEval) {
            return {
                ok: false,
                error: 'make slash 缺少 angle(start, end)。'
            };
        }

        return {
            ok: true,
            evaluate: function (scope) {
                const cx = centerXEval.evaluate(scope);
                if (!cx.ok) return cx;
                const cy = centerYEval.evaluate(scope);
                if (!cy.ok) return cy;

                const radius = radiusEval ? radiusEval.evaluate(scope) : { ok: true, value: 0.34 };
                if (!radius.ok) return radius;

                const angleStart = angleStartEval.evaluate(scope);
                if (!angleStart.ok) return angleStart;
                const angleEnd = angleEndEval.evaluate(scope);
                if (!angleEnd.ok) return angleEnd;

                const countOut = countEval ? countEval.evaluate(scope) : { ok: true, value: 20 };
                if (!countOut.ok) return countOut;

                const widthStart = widthStartEval ? widthStartEval.evaluate(scope) : { ok: true, value: 1.22 };
                if (!widthStart.ok) return widthStart;
                const widthEnd = widthEndEval ? widthEndEval.evaluate(scope) : { ok: true, value: 0.28 };
                if (!widthEnd.ok) return widthEnd;

                const colorStart = colorStartEval
                    ? colorStartEval.evaluate(scope)
                    : { ok: true, value: normalizeColor({ r: 0.94, g: 0.94, b: 0.94, a: 0.22 }) };
                if (!colorStart.ok) return colorStart;
                const colorEnd = colorEndEval
                    ? colorEndEval.evaluate(scope)
                    : { ok: true, value: normalizeColor({ r: 1, g: 1, b: 1, a: 0.14 }) };
                if (!colorEnd.ok) return colorEnd;

                const hasCustomUv = !!(uStartEval && uEndEval);
                const uStart = uStartEval ? uStartEval.evaluate(scope) : { ok: true, value: 0 };
                if (!uStart.ok) return uStart;
                const uEnd = uEndEval ? uEndEval.evaluate(scope) : { ok: true, value: 1 };
                if (!uEnd.ok) return uEnd;

                const cxv = safeNumber(cx.value, 0);
                const cyv = safeNumber(cy.value, 0);
                const rr = safeNumber(radius.value, 0.34);
                const a0 = safeNumber(angleStart.value, 0);
                const a1 = safeNumber(angleEnd.value, Math.PI * 0.5);
                const count = clamp(Math.floor(Math.abs(safeNumber(countOut.value, 20))), 2, 96);
                const visibleCount = resolveSlashVisibleCount(count, scope);

                const points = [];
                for (let i = 0; i < visibleCount; i += 1) {
                    const t = count <= 1 ? 0 : (i / (count - 1));
                    const angle = mixNumber(a0, a1, t);
                    const px = cxv + Math.cos(angle) * rr;
                    const py = cyv + Math.sin(angle) * rr;
                    const w = mixNumber(widthStart.value, widthEnd.value, t);
                    const color = mixColor(colorStart.value, colorEnd.value, t);
                    const u = mixNumber(uStart.value, uEnd.value, t);
                    points.push(createTrailPoint(px, py, w, color, u, hasCustomUv));
                }

                return {
                    ok: true,
                    values: points
                };
            }
        };
    }

    function compileEmitCall(callName, argsText) {
        const call = String(callName || 'emit').toLowerCase();
        if (call === 'slash' || call === 'arc' || call === 'swing') {
            return compileSlashCall(argsText);
        }
        const args = splitTopLevelArgs(argsText);

        if (args.length === 4) {
            const posEval = compileVec2(args[0]);
            if (!posEval.ok) return posEval;

            const widthEval = compileExpression(args[1]);
            if (!widthEval.ok) return widthEval;

            const colorEval = compileColor(args[2]);
            if (!colorEval.ok) return colorEval;

            const uEval = compileExpression(args[3]);
            if (!uEval.ok) return uEval;

            return {
                ok: true,
                evaluate: function (scope) {
                    const pos = posEval.evaluate(scope);
                    if (!pos.ok) return pos;
                    const width = widthEval.evaluate(scope);
                    if (!width.ok) return width;
                    const color = colorEval.evaluate(scope);
                    if (!color.ok) return color;
                    const u = uEval.evaluate(scope);
                    if (!u.ok) return u;
                    return {
                        ok: true,
                        value: createTrailPoint(pos.value.x, pos.value.y, width.value, color.value, u.value, true)
                    };
                }
            };
        }

        if (args.length === 5) {
            const xEval = compileExpression(args[0]);
            if (!xEval.ok) return xEval;

            const yEval = compileExpression(args[1]);
            if (!yEval.ok) return yEval;

            const widthEval = compileExpression(args[2]);
            if (!widthEval.ok) return widthEval;

            const colorEval = compileColor(args[3]);
            if (!colorEval.ok) return colorEval;

            const uEval = compileExpression(args[4]);
            if (!uEval.ok) return uEval;

            return {
                ok: true,
                evaluate: function (scope) {
                    const x = xEval.evaluate(scope);
                    if (!x.ok) return x;
                    const y = yEval.evaluate(scope);
                    if (!y.ok) return y;
                    const width = widthEval.evaluate(scope);
                    if (!width.ok) return width;
                    const color = colorEval.evaluate(scope);
                    if (!color.ok) return color;
                    const u = uEval.evaluate(scope);
                    if (!u.ok) return u;
                    return {
                        ok: true,
                        value: createTrailPoint(x.value, y.value, width.value, color.value, u.value, true)
                    };
                }
            };
        }

        if (args.length === 8) {
            const xEval = compileExpression(args[0]);
            if (!xEval.ok) return xEval;
            const yEval = compileExpression(args[1]);
            if (!yEval.ok) return yEval;
            const widthEval = compileExpression(args[2]);
            if (!widthEval.ok) return widthEval;
            const rEval = compileExpression(args[3]);
            if (!rEval.ok) return rEval;
            const gEval = compileExpression(args[4]);
            if (!gEval.ok) return gEval;
            const bEval = compileExpression(args[5]);
            if (!bEval.ok) return bEval;
            const aEval = compileExpression(args[6]);
            if (!aEval.ok) return aEval;
            const uEval = compileExpression(args[7]);
            if (!uEval.ok) return uEval;

            return {
                ok: true,
                evaluate: function (scope) {
                    const x = xEval.evaluate(scope);
                    if (!x.ok) return x;
                    const y = yEval.evaluate(scope);
                    if (!y.ok) return y;
                    const width = widthEval.evaluate(scope);
                    if (!width.ok) return width;
                    const r = rEval.evaluate(scope);
                    if (!r.ok) return r;
                    const g = gEval.evaluate(scope);
                    if (!g.ok) return g;
                    const b = bEval.evaluate(scope);
                    if (!b.ok) return b;
                    const a = aEval.evaluate(scope);
                    if (!a.ok) return a;
                    const u = uEval.evaluate(scope);
                    if (!u.ok) return u;
                    return {
                        ok: true,
                        value: createTrailPoint(x.value, y.value, width.value, { r: r.value, g: g.value, b: b.value, a: a.value }, u.value, true)
                    };
                }
            };
        }

        return {
            ok: false,
            error: 'emit/biu 参数不匹配。支持: 4参(vec2,...), 5参(x,y,...), 8参(x,y,w,r,g,b,a,u)。slash/arc/swing 支持 9/10/11/12 参，或使用 make slash { ... } / emit mesh { ... }。'
        };
    }

    function compileMeshVertexLiteral(rawText) {
        const text = String(rawText || '').trim();
        const m = text.match(/^v\s*\(([\s\S]*)\)$/i);
        if (!m) {
            return {
                ok: false,
                error: 'vertices 仅支持 v(...) 顶点字面量，当前: ' + text
            };
        }

        const args = splitTopLevelArgs(m[1]);
        if (args.length === 5) {
            const xEval = compileExpression(args[0]);
            if (!xEval.ok) return xEval;
            const yEval = compileExpression(args[1]);
            if (!yEval.ok) return yEval;
            const colorEval = compileColor(args[2]);
            if (!colorEval.ok) return colorEval;
            const uEval = compileExpression(args[3]);
            if (!uEval.ok) return uEval;
            const vEval = compileExpression(args[4]);
            if (!vEval.ok) return vEval;

            return {
                ok: true,
                evaluate: function (scope) {
                    const x = xEval.evaluate(scope);
                    if (!x.ok) return x;
                    const y = yEval.evaluate(scope);
                    if (!y.ok) return y;
                    const color = colorEval.evaluate(scope);
                    if (!color.ok) return color;
                    const u = uEval.evaluate(scope);
                    if (!u.ok) return u;
                    const v = vEval.evaluate(scope);
                    if (!v.ok) return v;
                    return {
                        ok: true,
                        value: {
                            x: safeNumber(x.value, 0),
                            y: safeNumber(y.value, 0),
                            color: normalizeColor(color.value),
                            uv: {
                                u: clamp01(safeNumber(u.value, 0)),
                                v: clamp01(safeNumber(v.value, 0))
                            }
                        }
                    };
                }
            };
        }

        if (args.length === 8) {
            const xEval = compileExpression(args[0]);
            if (!xEval.ok) return xEval;
            const yEval = compileExpression(args[1]);
            if (!yEval.ok) return yEval;
            const rEval = compileExpression(args[2]);
            if (!rEval.ok) return rEval;
            const gEval = compileExpression(args[3]);
            if (!gEval.ok) return gEval;
            const bEval = compileExpression(args[4]);
            if (!bEval.ok) return bEval;
            const aEval = compileExpression(args[5]);
            if (!aEval.ok) return aEval;
            const uEval = compileExpression(args[6]);
            if (!uEval.ok) return uEval;
            const vEval = compileExpression(args[7]);
            if (!vEval.ok) return vEval;

            return {
                ok: true,
                evaluate: function (scope) {
                    const x = xEval.evaluate(scope);
                    if (!x.ok) return x;
                    const y = yEval.evaluate(scope);
                    if (!y.ok) return y;
                    const r = rEval.evaluate(scope);
                    if (!r.ok) return r;
                    const g = gEval.evaluate(scope);
                    if (!g.ok) return g;
                    const b = bEval.evaluate(scope);
                    if (!b.ok) return b;
                    const a = aEval.evaluate(scope);
                    if (!a.ok) return a;
                    const u = uEval.evaluate(scope);
                    if (!u.ok) return u;
                    const v = vEval.evaluate(scope);
                    if (!v.ok) return v;
                    return {
                        ok: true,
                        value: {
                            x: safeNumber(x.value, 0),
                            y: safeNumber(y.value, 0),
                            color: normalizeColor({
                                r: safeNumber(r.value, 0),
                                g: safeNumber(g.value, 0),
                                b: safeNumber(b.value, 0),
                                a: safeNumber(a.value, 1)
                            }),
                            uv: {
                                u: clamp01(safeNumber(u.value, 0)),
                                v: clamp01(safeNumber(v.value, 0))
                            }
                        }
                    };
                }
            };
        }

        return {
            ok: false,
            error: 'v(...) 需要 5 参(x,y,rgba,u,v) 或 8 参(x,y,r,g,b,a,u,v)，当前: ' + String(args.length)
        };
    }

    function compileMeshVerticesField(rawText) {
        const text = String(rawText || '').trim();
        const m = text.match(/^\[([\s\S]*)\]$/);
        if (!m) {
            return {
                ok: false,
                error: 'vertices 需要 [v(...), ...] 列表。'
            };
        }

        const inner = String(m[1] || '').trim();
        if (!inner) {
            return {
                ok: false,
                error: 'vertices 不能为空。'
            };
        }

        const items = splitTopLevelArgs(inner);
        const vertexEvals = [];
        for (const item of items) {
            const vertexEval = compileMeshVertexLiteral(item);
            if (!vertexEval.ok) return vertexEval;
            vertexEvals.push(vertexEval);
        }

        return {
            ok: true,
            evaluate: function (scope) {
                const vertices = [];
                for (const vertexEval of vertexEvals) {
                    const out = vertexEval.evaluate(scope);
                    if (!out.ok) return out;
                    vertices.push(out.value);
                }
                return {
                    ok: true,
                    value: vertices
                };
            }
        };
    }

    function compileMeshIndicesField(rawText) {
        const text = String(rawText || '').trim();
        const m = text.match(/^\[([\s\S]*)\]$/);
        if (!m) {
            return {
                ok: false,
                error: 'indices 需要 [i0, i1, ...] 列表。'
            };
        }

        const inner = String(m[1] || '').trim();
        const items = inner ? splitTopLevelArgs(inner) : [];
        const indexEvals = [];
        for (const item of items) {
            const evalResult = compileExpression(item);
            if (!evalResult.ok) return evalResult;
            indexEvals.push(evalResult);
        }

        return {
            ok: true,
            evaluate: function (scope) {
                const indices = [];
                for (const evalResult of indexEvals) {
                    const out = evalResult.evaluate(scope);
                    if (!out.ok) return out;
                    indices.push(Math.floor(safeNumber(out.value, 0)));
                }
                return {
                    ok: true,
                    value: indices
                };
            }
        };
    }

    function compileMeshEmitCall(rawBody) {
        const statements = splitTopLevelStatements(stripComments(rawBody));
        let topology = '';
        let verticesEval = null;
        let indicesEval = null;
        let vertexOffsetEval = null;
        let numVerticesEval = null;
        let indexOffsetEval = null;
        let primitiveCountEval = null;

        for (const statement of statements) {
            const match = String(statement || '').match(/^([A-Za-z_][A-Za-z0-9_]*)\s+([\s\S]+)$/);
            if (!match) {
                return {
                    ok: false,
                    error: 'emit mesh 字段语法无效: ' + String(statement || '')
                };
            }

            const name = String(match[1] || '').toLowerCase();
            const valueText = String(match[2] || '').trim();
            if (name === 'topology') {
                const token = valueText.toLowerCase();
                if (token !== 'triangle_list' && token !== 'triangle_strip') {
                    return {
                        ok: false,
                        error: 'topology 仅支持 triangle_list / triangle_strip。'
                    };
                }
                topology = token;
                continue;
            }

            if (name === 'vertices') {
                const compiled = compileMeshVerticesField(valueText);
                if (!compiled.ok) return compiled;
                verticesEval = compiled;
                continue;
            }

            if (name === 'indices') {
                const compiled = compileMeshIndicesField(valueText);
                if (!compiled.ok) return compiled;
                indicesEval = compiled;
                continue;
            }

            if (name === 'vertex_offset') {
                const compiled = compileExpression(valueText);
                if (!compiled.ok) return compiled;
                vertexOffsetEval = compiled;
                continue;
            }

            if (name === 'num_vertices') {
                const compiled = compileExpression(valueText);
                if (!compiled.ok) return compiled;
                numVerticesEval = compiled;
                continue;
            }

            if (name === 'index_offset') {
                const compiled = compileExpression(valueText);
                if (!compiled.ok) return compiled;
                indexOffsetEval = compiled;
                continue;
            }

            if (name === 'primitive_count') {
                const compiled = compileExpression(valueText);
                if (!compiled.ok) return compiled;
                primitiveCountEval = compiled;
                continue;
            }

            return {
                ok: false,
                error: 'emit mesh 不支持字段: ' + name
            };
        }

        if (!topology) {
            return {
                ok: false,
                error: 'emit mesh 缺少 topology。'
            };
        }

        if (!verticesEval) {
            return {
                ok: false,
                error: 'emit mesh 缺少 vertices。'
            };
        }

        if (!primitiveCountEval) {
            return {
                ok: false,
                error: 'emit mesh 缺少 primitive_count。'
            };
        }

        return {
            ok: true,
            evaluate: function (scope) {
                const verticesOut = verticesEval.evaluate(scope);
                if (!verticesOut.ok) return verticesOut;
                const vertices = Array.isArray(verticesOut.value) ? verticesOut.value : [];
                if (!vertices.length) {
                    return {
                        ok: false,
                        error: 'emit mesh vertices 为空。'
                    };
                }

                const vertexOffsetOut = vertexOffsetEval ? vertexOffsetEval.evaluate(scope) : { ok: true, value: 0 };
                if (!vertexOffsetOut.ok) return vertexOffsetOut;
                const vertexOffset = Math.floor(safeNumber(vertexOffsetOut.value, 0));

                if (vertexOffset < 0 || vertexOffset >= vertices.length) {
                    return {
                        ok: false,
                        error: 'vertex_offset 越界。'
                    };
                }

                const numVerticesOut = numVerticesEval
                    ? numVerticesEval.evaluate(scope)
                    : { ok: true, value: vertices.length - vertexOffset };
                if (!numVerticesOut.ok) return numVerticesOut;
                const numVertices = Math.floor(safeNumber(numVerticesOut.value, vertices.length - vertexOffset));

                if (numVertices <= 0 || (vertexOffset + numVertices) > vertices.length) {
                    return {
                        ok: false,
                        error: 'num_vertices 非法或越界。'
                    };
                }

                const primitiveCountOut = primitiveCountEval.evaluate(scope);
                if (!primitiveCountOut.ok) return primitiveCountOut;
                const primitiveCount = Math.floor(safeNumber(primitiveCountOut.value, 0));
                if (primitiveCount <= 0) {
                    return {
                        ok: false,
                        error: 'primitive_count 必须大于 0。'
                    };
                }

                const indexed = !!indicesEval;
                let indexOffset = 0;
                let logicalIndices = [];
                if (indexed) {
                    const indicesOut = indicesEval.evaluate(scope);
                    if (!indicesOut.ok) return indicesOut;
                    const indices = Array.isArray(indicesOut.value) ? indicesOut.value : [];

                    const indexOffsetOut = indexOffsetEval ? indexOffsetEval.evaluate(scope) : { ok: true, value: 0 };
                    if (!indexOffsetOut.ok) return indexOffsetOut;
                    indexOffset = Math.floor(safeNumber(indexOffsetOut.value, 0));
                    if (indexOffset < 0 || indexOffset > indices.length) {
                        return {
                            ok: false,
                            error: 'index_offset 越界。'
                        };
                    }

                    const needIndices = topology === 'triangle_list'
                        ? (primitiveCount * 3)
                        : (primitiveCount + 2);
                    if ((indexOffset + needIndices) > indices.length) {
                        return {
                            ok: false,
                            error: 'indices 不足以覆盖 primitive_count。'
                        };
                    }

                    logicalIndices = indices.slice(indexOffset, indexOffset + needIndices);
                    for (let i = 0; i < logicalIndices.length; i += 1) {
                        const idx = Math.floor(safeNumber(logicalIndices[i], 0));
                        if (idx < 0 || idx >= numVertices) {
                            return {
                                ok: false,
                                error: 'indices[' + String(indexOffset + i) + '] 超出 num_vertices 范围。'
                            };
                        }
                        logicalIndices[i] = vertexOffset + idx;
                    }
                } else {
                    const needVertices = topology === 'triangle_list'
                        ? (primitiveCount * 3)
                        : (primitiveCount + 2);
                    if (needVertices > numVertices) {
                        return {
                            ok: false,
                            error: 'num_vertices 不足以覆盖 primitive_count。'
                        };
                    }

                    logicalIndices = [];
                    for (let i = 0; i < needVertices; i += 1) {
                        logicalIndices.push(vertexOffset + i);
                    }
                }

                const triangles = [];
                if (topology === 'triangle_list') {
                    for (let i = 0; i < primitiveCount; i += 1) {
                        const base = i * 3;
                        triangles.push([
                            logicalIndices[base],
                            logicalIndices[base + 1],
                            logicalIndices[base + 2]
                        ]);
                    }
                } else {
                    for (let i = 0; i < primitiveCount; i += 1) {
                        const i0 = logicalIndices[i];
                        const i1 = logicalIndices[i + 1];
                        const i2 = logicalIndices[i + 2];
                        if ((i % 2) === 0) {
                            triangles.push([i0, i1, i2]);
                        } else {
                            triangles.push([i1, i0, i2]);
                        }
                    }
                }

                return {
                    ok: true,
                    meshes: [{
                        ribbon: [],
                        vertices: vertices,
                        triangles: triangles,
                        uvResolvedMode: 'manual',
                        uvModeSource: 'mesh_emit'
                    }]
                };
            }
        };
    }

    function compileTrailCall(call) {
        if (!call || typeof call !== 'object') {
            return {
                ok: false,
                error: '轨迹语句为空。'
            };
        }

        if (call.kind === 'make_slash') {
            return compileMakeSlashCall(call.body);
        }

        if (call.kind === 'mesh_emit') {
            return compileMeshEmitCall(call.body);
        }

        return compileEmitCall(call.name, call.args);
    }

    function collectTrailCalls(rawBody) {
        const body = String(rawBody || '');
        const calls = [];

        const makeRe = /\bmake\s+(slash|arc|swing)\s*\{/gi;
        let makeMatch;
        while ((makeMatch = makeRe.exec(body)) !== null) {
            const braceStart = makeMatch.index + makeMatch[0].length - 1;
            const makeBlock = extractBraceBlock(body, braceStart);
            if (!makeBlock.ok) {
                return {
                    ok: false,
                    error: 'make ' + makeMatch[1] + ' 块异常: ' + makeBlock.error
                };
            }

            calls.push({
                kind: 'make_slash',
                name: makeMatch[1],
                body: makeBlock.body,
                index: makeMatch.index
            });

            makeRe.lastIndex = makeBlock.endIndex;
        }

        const meshRe = /\bemit\s+mesh\s*\{/gi;
        let meshMatch;
        while ((meshMatch = meshRe.exec(body)) !== null) {
            const braceStart = meshMatch.index + meshMatch[0].length - 1;
            const meshBlock = extractBraceBlock(body, braceStart);
            if (!meshBlock.ok) {
                return {
                    ok: false,
                    error: 'emit mesh 块异常: ' + meshBlock.error
                };
            }

            calls.push({
                kind: 'mesh_emit',
                name: 'emit mesh',
                body: meshBlock.body,
                index: meshMatch.index
            });

            meshRe.lastIndex = meshBlock.endIndex;
        }

        const callRe = /\b(emit|biu|slash|arc|swing)\s*\(/g;
        let m;

        while ((m = callRe.exec(body)) !== null) {
            const name = m[1];
            const argsStart = callRe.lastIndex;
            let idx = argsStart;
            let depth = 1;

            while (idx < body.length && depth > 0) {
                const ch = body[idx];
                if (ch === '(') depth += 1;
                else if (ch === ')') depth -= 1;
                idx += 1;
            }

            if (depth !== 0) {
                return {
                    ok: false,
                    error: name + '(...) 括号不匹配。'
                };
            }

            calls.push({
                kind: 'call',
                name: name,
                args: body.slice(argsStart, idx - 1),
                index: m.index
            });

            callRe.lastIndex = idx;
        }

        calls.sort(function (a, b) {
            return Number(a.index || 0) - Number(b.index || 0);
        });

        return {
            ok: true,
            calls: calls
        };
    }

    function collectDeclarations(rawBody) {
        const body = stripComments(rawBody);
        const re = /\b(?:let|const)\s+(?:(?:[A-Za-z_][A-Za-z0-9_\[\]]*)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[A-Za-z_][A-Za-z0-9_\[\]]*)?\s*=\s*([^;]+);/g;
        const declarations = [];
        let m;

        while ((m = re.exec(body)) !== null) {
            const name = String(m[1] || '').trim();
            const exprText = String(m[2] || '').trim();
            if (!name) continue;

            const compiledExpr = compileExpression(exprText);
            if (!compiledExpr.ok) {
                return {
                    ok: false,
                    error: '变量 ' + name + ' 初始化失败: ' + compiledExpr.error
                };
            }

            declarations.push({
                name: name,
                evaluate: compiledExpr.evaluate
            });
        }

        return {
            ok: true,
            declarations: declarations
        };
    }

    function extractBraceBlock(text, braceStartIndex) {
        const raw = String(text || '');
        const start = Number(braceStartIndex || 0);
        if (start < 0 || start >= raw.length || raw[start] !== '{') {
            return {
                ok: false,
                error: '未找到起始大括号。'
            };
        }

        let idx = start + 1;
        let depth = 1;
        while (idx < raw.length && depth > 0) {
            const ch = raw[idx];
            if (ch === '{') depth += 1;
            else if (ch === '}') depth -= 1;
            idx += 1;
        }

        if (depth !== 0) {
            return {
                ok: false,
                error: '大括号不匹配。'
            };
        }

        return {
            ok: true,
            body: raw.slice(start + 1, idx - 1),
            startIndex: start,
            endIndex: idx
        };
    }

    function maskRanges(text, ranges) {
        const raw = String(text || '');
        if (!Array.isArray(ranges) || ranges.length === 0) return raw;

        let out = raw;
        const sorted = ranges.slice().sort(function (a, b) { return b.start - a.start; });
        sorted.forEach(function (range) {
            const s = Math.max(0, Math.min(raw.length, Number(range.start || 0)));
            const e = Math.max(s, Math.min(raw.length, Number(range.end || 0)));
            const mask = ' '.repeat(Math.max(0, e - s));
            out = out.slice(0, s) + mask + out.slice(e);
        });
        return out;
    }

    function compileConditionExpression(expressionText) {
        const expr = String(expressionText || '').trim();
        if (!expr) {
            return {
                ok: false,
                error: '条件表达式为空。'
            };
        }

        if (!EXPR_ALLOWED.test(expr)) {
            return {
                ok: false,
                error: '条件表达式包含不支持的字符: ' + expr
            };
        }

        const lower = expr.toLowerCase();
        for (const blocked of EXPR_BLOCKLIST) {
            if (lower.indexOf(blocked) >= 0) {
                return {
                    ok: false,
                    error: '条件表达式包含不允许的标记: ' + blocked
                };
            }
        }

        let runner = null;
        try {
            runner = new Function('scope', 'with (scope) { return !!(' + expr + '); }');
        } catch (_) {
            return {
                ok: false,
                error: '条件表达式解析失败: ' + expr
            };
        }

        return {
            ok: true,
            evaluate: function (scope) {
                try {
                    return {
                        ok: true,
                        value: !!runner(scope || {})
                    };
                } catch (err) {
                    return {
                        ok: false,
                        error: '条件表达式执行失败: ' + expr + ' | ' + String(err && err.message ? err.message : err)
                    };
                }
            }
        };
    }

    function parseStateTransitions(rawBody) {
        const body = stripComments(rawBody);
        const re = /\bif\s*\(([^)]+)\)\s*goto\s+([A-Za-z_][A-Za-z0-9_]*)\s*;|\bgoto\s+([A-Za-z_][A-Za-z0-9_]*)\s*;/g;
        const transitions = [];
        let m;

        while ((m = re.exec(body)) !== null) {
            if (m[2]) {
                const cond = compileConditionExpression(m[1]);
                if (!cond.ok) {
                    return {
                        ok: false,
                        error: '状态跳转条件失败: ' + cond.error
                    };
                }
                transitions.push({
                    kind: 'if',
                    target: m[2],
                    condition: cond.evaluate,
                    rawCondition: String(m[1] || '').trim()
                });
            } else if (m[3]) {
                transitions.push({
                    kind: 'goto',
                    target: m[3]
                });
            }
        }

        return {
            ok: true,
            transitions: transitions
        };
    }

    function compileEmittersFromCalls(calls) {
        const emitters = [];
        for (const call of calls) {
            const emitter = compileTrailCall(call);
            if (!emitter.ok) {
                const label = call && call.kind === 'make_slash'
                    ? 'make ' + String(call.name || 'slash') + ' {...}'
                    : String(call && call.name ? call.name : 'emit') + '(...)';
                return {
                    ok: false,
                    error: label + ' 编译失败: ' + emitter.error
                };
            }
            emitters.push(emitter);
        }
        return {
            ok: true,
            emitters: emitters
        };
    }

    function compileBuildProgram(source) {
        const extracted = extractBuildBody(source);
        if (!extracted.ok) return extracted;

        const body = extracted.body;

        const declResult = collectDeclarations(body);
        if (!declResult.ok) return declResult;

        const callResult = collectTrailCalls(body);
        if (!callResult.ok) return callResult;

        if (!callResult.calls.length) {
            return {
                ok: false,
                error: 'build 中至少需要一次 emit(...) / biu(...) / slash(...) / swing(...) / emit mesh { ... }，或 make slash { ... }。'
            };
        }

        const emitterResult = compileEmittersFromCalls(callResult.calls);
        if (!emitterResult.ok) return emitterResult;

        return {
            ok: true,
            program: {
                kind: 'build',
                declarations: declResult.declarations,
                emitters: emitterResult.emitters,
                source: String(source || '')
            }
        };
    }

    function compileSwingState(name, rawStateBody, durationRaw) {
        const stateBody = String(rawStateBody || '');
        const durationExpr = String(durationRaw || '').trim();

        let durationEvaluate = null;
        if (durationExpr) {
            const durationCompiled = compileExpression(durationExpr);
            if (!durationCompiled.ok) {
                return {
                    ok: false,
                    error: 'state ' + name + ' 时长表达式失败: ' + durationCompiled.error
                };
            }
            durationEvaluate = durationCompiled.evaluate;
        }

        let tickBody = stateBody;
        const onTickMatch = stateBody.match(/\b(?:on_tick|tick)\s*\{/);
        if (onTickMatch) {
            const onTickBraceStart = onTickMatch.index + onTickMatch[0].length - 1;
            const onTickBlock = extractBraceBlock(stateBody, onTickBraceStart);
            if (!onTickBlock.ok) {
                return {
                    ok: false,
                    error: 'state ' + name + ' 的 on_tick 块异常: ' + onTickBlock.error
                };
            }
            tickBody = onTickBlock.body;
        }

        const declResult = collectDeclarations(tickBody);
        if (!declResult.ok) {
            return {
                ok: false,
                error: 'state ' + name + ' 变量声明失败: ' + declResult.error
            };
        }

        const callResult = collectTrailCalls(tickBody);
        if (!callResult.ok) {
            return {
                ok: false,
                error: 'state ' + name + ' 轨迹语句解析失败: ' + callResult.error
            };
        }

        const emitterResult = compileEmittersFromCalls(callResult.calls);
        if (!emitterResult.ok) {
            return {
                ok: false,
                error: 'state ' + name + ' 轨迹语句编译失败: ' + emitterResult.error
            };
        }

        const transitionResult = parseStateTransitions(tickBody);
        if (!transitionResult.ok) {
            return {
                ok: false,
                error: 'state ' + name + ' 跳转解析失败: ' + transitionResult.error
            };
        }

        return {
            ok: true,
            state: {
                name: name,
                durationExpr: durationExpr || null,
                durationEvaluate: durationEvaluate,
                autoNext: null,
                declarations: declResult.declarations,
                emitters: emitterResult.emitters,
                transitions: transitionResult.transitions
            }
        };
    }

    function parseTrailConfig(rawTrailBody) {
        const body = stripComments(rawTrailBody);
        const config = {
            shaderPass: 0,
            useShader: null,
            coordMode: null,
            uvMode: 'linear',
            blendMode: 'alpha'
        };

        const shaderPassMatch = body.match(/\bshader_pass\s+([0-9]+)\s*;/i);
        if (shaderPassMatch) {
            config.shaderPass = clamp(Number(shaderPassMatch[1]), 0, 8);
        }

        const useShaderMatch = body.match(/\buse_shader\s+(on|off|true|false|1|0)\s*;/i);
        if (useShaderMatch) {
            const token = String(useShaderMatch[1] || '').toLowerCase();
            config.useShader = (token === 'on' || token === 'true' || token === '1');
        }

        const coordMatch = body.match(/\b(?:coord|space)\s+(uv|center|auto)\s*;/i);
        if (coordMatch) {
            const token = String(coordMatch[1] || '').toLowerCase();
            config.coordMode = token === 'auto' ? null : token;
        }

        const uvModeMatch = body.match(/\b(?:uv|uv_mode)\s+(linear|manual|point)\s*;/i);
        if (uvModeMatch) {
            const token = String(uvModeMatch[1] || '').toLowerCase();
            config.uvMode = token === 'point' ? 'manual' : token;
        }

        const blendMatch = body.match(/\bblend\s+(alpha|alphablend|additive|add|addictive)\s*;/i);
        if (blendMatch) {
            const token = String(blendMatch[1] || '').toLowerCase();
            if (token === 'additive' || token === 'add' || token === 'addictive') {
                config.blendMode = 'additive';
            } else {
                config.blendMode = 'alpha';
            }
        }

        return {
            ok: true,
            config: config
        };
    }

    function compileSwingProfileProgram(source) {
        const raw = String(source || '');
        const profileMatch = raw.match(/\bprofile\s+swing\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/i);
        if (!profileMatch) {
            return {
                ok: false,
                error: '未找到 profile swing 入口。'
            };
        }

        const profileName = String(profileMatch[1] || 'swing_profile');
        const profileBraceStart = profileMatch.index + profileMatch[0].length - 1;
        const profileBlock = extractBraceBlock(raw, profileBraceStart);
        if (!profileBlock.ok) {
            return {
                ok: false,
                error: 'profile swing 块异常: ' + profileBlock.error
            };
        }

        const profileBody = profileBlock.body;
        const stateMap = {};
        const stateOrder = [];
        const maskedRanges = [];

        const stateRe = /\bstate\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*\(\s*([^)]+)\s*\)|\s+([A-Za-z_][A-Za-z0-9_]*|[0-9]+(?:\.[0-9]+)?))?\s*\{/gi;
        let stateMatch;
        while ((stateMatch = stateRe.exec(profileBody)) !== null) {
            const stateName = String(stateMatch[1] || '').trim();
            if (!stateName) continue;
            if (stateMap[stateName]) {
                return {
                    ok: false,
                    error: 'state 重复定义: ' + stateName
                };
            }

            const braceStart = stateMatch.index + stateMatch[0].length - 1;
            const stateBlock = extractBraceBlock(profileBody, braceStart);
            if (!stateBlock.ok) {
                return {
                    ok: false,
                    error: 'state ' + stateName + ' 块异常: ' + stateBlock.error
                };
            }

            const durationRaw = String(stateMatch[2] || stateMatch[3] || '').trim();
            const compiledState = compileSwingState(stateName, stateBlock.body, durationRaw);
            if (!compiledState.ok) {
                return compiledState;
            }

            stateMap[stateName] = compiledState.state;
            stateOrder.push(stateName);
            maskedRanges.push({ start: stateMatch.index, end: stateBlock.endIndex });
            stateRe.lastIndex = stateBlock.endIndex;
        }

        if (!stateOrder.length) {
            return {
                ok: false,
                error: 'profile swing 至少需要一个 state。'
            };
        }

        for (let i = 0; i < stateOrder.length; i += 1) {
            const current = stateOrder[i];
            const next = stateOrder[(i + 1) % stateOrder.length];
            if (stateMap[current]) {
                stateMap[current].autoNext = next;
            }
        }

        let trailConfig = {
            shaderPass: 0,
            useShader: null,
            coordMode: null,
            uvMode: 'linear',
            blendMode: 'alpha'
        };
        const trailMatch = profileBody.match(/\btrail\s*\{/i);
        if (trailMatch) {
            const braceStart = trailMatch.index + trailMatch[0].length - 1;
            const trailBlock = extractBraceBlock(profileBody, braceStart);
            if (!trailBlock.ok) {
                return {
                    ok: false,
                    error: 'trail 块异常: ' + trailBlock.error
                };
            }

            const parsedTrail = parseTrailConfig(trailBlock.body);
            if (!parsedTrail.ok) {
                return parsedTrail;
            }
            trailConfig = parsedTrail.config;
            maskedRanges.push({ start: trailMatch.index, end: trailBlock.endIndex });
        }

        const topLevelBody = maskRanges(profileBody, maskedRanges);
        const declResult = collectDeclarations(topLevelBody);
        if (!declResult.ok) {
            return {
                ok: false,
                error: 'profile 变量声明失败: ' + declResult.error
            };
        }

        const initialState = stateMap.pre ? 'pre' : stateOrder[0];
        return {
            ok: true,
            program: {
                kind: 'swing',
                profileName: profileName,
                declarations: declResult.declarations,
                states: stateMap,
                stateOrder: stateOrder,
                initialState: initialState,
                trailConfig: trailConfig,
                runtime: {
                    activeState: initialState,
                    stateTick: 0,
                    totalTick: 0
                },
                source: raw
            }
        };
    }

    function compileTrailProgram(source) {
        const raw = String(source || '');
        if (/\bprofile\s+swing\b/i.test(raw)) {
            return compileSwingProfileProgram(raw);
        }
        return compileBuildProgram(raw);
    }

    function createRuntimeScope(ctx, vars) {
        const scope = {
            ctx: ctx,
            Time: ctx.Time,
            Dt: ctx.Dt,
            Progress: ctx.Progress,
            time: ctx.Time,
            OriginX: ctx.OriginX,
            OriginY: ctx.OriginY,
            DirX: ctx.DirX,
            DirY: ctx.DirY,
            Length: ctx.Length,
            Seed: ctx.Seed,
            t: ctx.Time,
            dt: ctx.Dt,
            p: ctx.Progress,
            PI: Math.PI,
            pi: Math.PI,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            pow: Math.pow,
            sqrt: Math.sqrt,
            abs: Math.abs,
            min: Math.min,
            max: Math.max,
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            clamp: function (value, minV, maxV) {
                return Math.max(Number(minV || 0), Math.min(Number(maxV || 0), Number(value || 0)));
            },
            lerp: function (a, b, t) {
                return Number(a || 0) + (Number(b || 0) - Number(a || 0)) * Number(t || 0);
            }
        };

        if (vars) {
            Object.keys(vars).forEach(function (k) {
                scope[k] = vars[k];
            });
        }

        return scope;
    }

    function executeBuildProgram(program, ctx) {
        const vars = {};

        for (const decl of program.declarations) {
            const scope = createRuntimeScope(ctx, vars);
            const val = decl.evaluate(scope);
            if (!val.ok) {
                return {
                    ok: false,
                    error: '变量 ' + decl.name + ' 计算失败: ' + val.error
                };
            }
            vars[decl.name] = val.value;
        }

        const points = [];
        const meshes = [];
        for (const emitter of program.emitters) {
            const scope = createRuntimeScope(ctx, vars);
            const out = emitter.evaluate(scope);
            if (!out.ok) {
                return {
                    ok: false,
                    error: '轨迹语句执行失败: ' + out.error
                };
            }
            if (Array.isArray(out.values)) points.push.apply(points, out.values);
            else if (out.value) points.push(out.value);
            if (Array.isArray(out.meshes)) meshes.push.apply(meshes, out.meshes);
        }

        return {
            ok: true,
            points: points,
            meshes: meshes,
            vars: Object.assign({}, vars),
            state: null,
            durationLimit: null
        };
    }

    function ensureSwingRuntime(program) {
        if (!program.runtime || typeof program.runtime !== 'object') {
            program.runtime = {
                activeState: program.initialState,
                stateTick: 0,
                totalTick: 0
            };
        }

        if (!program.runtime.activeState || !program.states[program.runtime.activeState]) {
            program.runtime.activeState = program.initialState;
            program.runtime.stateTick = 0;
        }

        if (!isFinite(program.runtime.stateTick)) program.runtime.stateTick = 0;
        if (!isFinite(program.runtime.totalTick)) program.runtime.totalTick = 0;
        return program.runtime;
    }

    function executeSwingProgram(program, ctx) {
        const runtime = ensureSwingRuntime(program);
        const vars = {};

        const activeName = runtime.activeState;
        const activeState = program.states[activeName];
        if (!activeState) {
            return {
                ok: false,
                error: '当前状态不存在: ' + activeName
            };
        }

        const metaBase = {
            state: activeName,
            phase: activeName,
            state_tick: runtime.stateTick,
            state_time: runtime.stateTick,
            phase_tick: runtime.stateTick,
            tick: runtime.totalTick,
            global_tick: runtime.totalTick
        };

        for (const decl of (program.declarations || [])) {
            const scope = createRuntimeScope(ctx, Object.assign({}, metaBase, vars));
            const val = decl.evaluate(scope);
            if (!val.ok) {
                return {
                    ok: false,
                    error: 'profile 变量计算失败: ' + val.error
                };
            }
            vars[decl.name] = val.value;
        }

        for (const decl of (activeState.declarations || [])) {
            const scope = createRuntimeScope(ctx, Object.assign({}, metaBase, vars));
            const val = decl.evaluate(scope);
            if (!val.ok) {
                return {
                    ok: false,
                    error: 'state ' + activeName + ' 变量计算失败: ' + val.error
                };
            }
            vars[decl.name] = val.value;
        }

        let durationLimit = null;
        if (activeState.durationEvaluate) {
            const durationScope = createRuntimeScope(ctx, Object.assign({}, metaBase, vars));
            const durationOut = activeState.durationEvaluate(durationScope);
            if (!durationOut.ok) {
                return {
                    ok: false,
                    error: 'state ' + activeName + ' 时长计算失败: ' + durationOut.error
                };
            }
            durationLimit = Math.max(0, Math.floor(safeNumber(durationOut.value, 0)));
        }

        if (durationLimit !== null) {
            metaBase.state_progress = durationLimit > 0
                ? clamp01(runtime.stateTick / durationLimit)
                : 1;
            metaBase.phase_progress = metaBase.state_progress;
        } else {
            metaBase.state_progress = clamp01(ctx && isFinite(ctx.Progress) ? Number(ctx.Progress) : 0);
            metaBase.phase_progress = metaBase.state_progress;
        }

        const points = [];
        const meshes = [];
        for (const emitter of (activeState.emitters || [])) {
            const scope = createRuntimeScope(ctx, Object.assign({}, metaBase, vars));
            const out = emitter.evaluate(scope);
            if (!out.ok) {
                return {
                    ok: false,
                    error: 'state ' + activeName + ' 轨迹语句执行失败: ' + out.error
                };
            }
            if (Array.isArray(out.values)) points.push.apply(points, out.values);
            else if (out.value) points.push(out.value);
            if (Array.isArray(out.meshes)) meshes.push.apply(meshes, out.meshes);
        }

        let transitioned = false;
        for (const transition of (activeState.transitions || [])) {
            let passed = false;

            if (transition.kind === 'goto') {
                passed = true;
            } else {
                const scope = createRuntimeScope(ctx, Object.assign({}, metaBase, vars));
                const cond = transition.condition(scope);
                if (!cond.ok) {
                    return {
                        ok: false,
                        error: 'state ' + activeName + ' 条件失败: ' + cond.error
                    };
                }
                passed = !!cond.value;
            }

            if (!passed) continue;

            if (!program.states[transition.target]) {
                return {
                    ok: false,
                    error: 'state ' + activeName + ' 跳转到未知状态: ' + transition.target
                };
            }

            runtime.activeState = transition.target;
            runtime.stateTick = 0;
            transitioned = true;
            break;
        }

        if (!transitioned && durationLimit !== null && runtime.stateTick >= durationLimit) {
            const autoTarget = activeState.autoNext;
            if (!autoTarget || !program.states[autoTarget]) {
                return {
                    ok: false,
                    error: 'state ' + activeName + ' 自动跳转目标无效: ' + String(autoTarget || '')
                };
            }
            runtime.activeState = autoTarget;
            runtime.stateTick = 0;
            transitioned = true;
        }

        if (!transitioned) {
            runtime.stateTick += 1;
        }
        runtime.totalTick += 1;

        return {
            ok: true,
            points: points,
            meshes: meshes,
            state: runtime.activeState,
            stateBefore: activeName,
            stateTick: runtime.stateTick,
            totalTick: runtime.totalTick,
            vars: Object.assign({}, metaBase, vars),
            durationLimit: durationLimit
        };
    }

    function executeProgram(program, ctx) {
        if (!program || typeof program !== 'object') {
            return {
                ok: false,
                error: '程序为空。'
            };
        }

        if (program.kind === 'swing') {
            return executeSwingProgram(program, ctx);
        }

        return executeBuildProgram(program, ctx);
    }

    function detectCoordMode(points) {
        if (!Array.isArray(points) || points.length === 0) return 'center';
        let in01 = true;
        for (const p of points) {
            if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
                in01 = false;
                break;
            }
        }
        return in01 ? 'uv' : 'center';
    }

    function worldToScreen(point, width, height, mode) {
        const x = Number(point.x || 0);
        const y = Number(point.y || 0);

        if (mode === 'uv') {
            return {
                x: x * width,
                y: (1 - y) * height
            };
        }

        return {
            x: (x * 0.5 + 0.5) * width,
            y: (1 - (y * 0.5 + 0.5)) * height
        };
    }

    function detectCoordModeForMeshes(meshes) {
        if (!Array.isArray(meshes) || meshes.length === 0) return 'center';
        const probe = [];
        for (const mesh of meshes) {
            if (!mesh || !Array.isArray(mesh.vertices)) continue;
            for (const vertex of mesh.vertices) {
                if (!vertex) continue;
                probe.push({
                    x: safeNumber(vertex.x, 0),
                    y: safeNumber(vertex.y, 0)
                });
                if (probe.length >= 128) break;
            }
            if (probe.length >= 128) break;
        }
        if (!probe.length) return 'center';
        return detectCoordMode(probe);
    }

    function buildMeshFromScriptMeshes(rawMeshes, width, height, coordMode) {
        const merged = {
            ribbon: [],
            vertices: [],
            triangles: [],
            uvResolvedMode: 'manual',
            uvModeSource: 'mesh_emit'
        };

        if (!Array.isArray(rawMeshes) || rawMeshes.length === 0) {
            return merged;
        }

        for (const item of rawMeshes) {
            if (!item || !Array.isArray(item.vertices) || !Array.isArray(item.triangles)) continue;
            const base = merged.vertices.length;
            const vertexCount = item.vertices.length;

            for (const vertex of item.vertices) {
                const pos = worldToScreen(vertex || {}, width, height, coordMode);
                const uv = vertex && vertex.uv ? vertex.uv : { u: 0, v: 0 };
                merged.vertices.push({
                    x: safeNumber(pos.x, 0),
                    y: safeNumber(pos.y, 0),
                    color: normalizeColor(vertex && vertex.color),
                    uv: {
                        u: clamp01(safeNumber(uv.u, 0)),
                        v: clamp01(safeNumber(uv.v, 0))
                    }
                });
            }

            for (const tri of item.triangles) {
                if (!Array.isArray(tri) || tri.length < 3) continue;
                const i0 = Math.floor(safeNumber(tri[0], 0));
                const i1 = Math.floor(safeNumber(tri[1], 0));
                const i2 = Math.floor(safeNumber(tri[2], 0));
                if (i0 < 0 || i1 < 0 || i2 < 0) continue;
                if (i0 >= vertexCount || i1 >= vertexCount || i2 >= vertexCount) continue;
                merged.triangles.push([
                    base + i0,
                    base + i1,
                    base + i2
                ]);
            }
        }

        return merged;
    }

    function mergeTrailMeshes(meshList, uvMode, uvModeSource) {
        const merged = {
            ribbon: [],
            vertices: [],
            triangles: [],
            uvResolvedMode: uvMode || 'linear',
            uvModeSource: uvModeSource || 'linear_auto'
        };

        if (!Array.isArray(meshList) || meshList.length === 0) {
            return merged;
        }

        for (const item of meshList) {
            if (!item || !Array.isArray(item.vertices) || !Array.isArray(item.triangles)) continue;
            const base = merged.vertices.length;

            for (const vertex of item.vertices) {
                merged.vertices.push(vertex);
            }

            for (const tri of item.triangles) {
                if (!Array.isArray(tri) || tri.length < 3) continue;
                merged.triangles.push([
                    base + Math.floor(safeNumber(tri[0], 0)),
                    base + Math.floor(safeNumber(tri[1], 0)),
                    base + Math.floor(safeNumber(tri[2], 0))
                ]);
            }

            if (!merged.ribbon.length && Array.isArray(item.ribbon) && item.ribbon.length) {
                merged.ribbon = item.ribbon;
            }
        }

        return merged;
    }

    function getPreviewRect(width, height) {
        return {
            x: 0,
            y: 0,
            w: Math.max(1, safeNumber(width, 1)),
            h: Math.max(1, safeNumber(height, 1))
        };
    }

    function drawBackground(ctx2d, width, height, baseCanvas) {
        ctx2d.save();
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        ctx2d.globalCompositeOperation = 'source-over';
        ctx2d.globalAlpha = 1.0;
        ctx2d.clearRect(0, 0, width, height);
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(0, 0, width, height);

        ctx2d.restore();
        return getPreviewRect(width, height);
    }


    function getTrailStrokeWidth(point, scaleBase) {
        const logical = Math.max(0.01, safeNumber(point && point.width, 0.06));
        const px = logical * scaleBase * 0.085;
        return clamp(px, 1.8, scaleBase * 0.26);
    }

    function mixNumber(a, b, t) {
        return Number(a || 0) + (Number(b || 0) - Number(a || 0)) * Number(t || 0);
    }

    function mixColor(a, b, t) {
        const ca = normalizeColor(a || {});
        const cb = normalizeColor(b || {});
        return {
            r: mixNumber(ca.r, cb.r, t),
            g: mixNumber(ca.g, cb.g, t),
            b: mixNumber(ca.b, cb.b, t),
            a: mixNumber(ca.a, cb.a, t)
        };
    }

    function colorToCssWithMul(color, alphaMul) {
        const c = normalizeColor(color || {});
        const mul = clamp01(alphaMul == null ? 1 : alphaMul);
        return 'rgba(' +
            Math.round(c.r * 255) + ', ' +
            Math.round(c.g * 255) + ', ' +
            Math.round(c.b * 255) + ', ' +
            (c.a * mul).toFixed(3) +
            ')';
    }

    function colorToCssWithMode(color, alphaMul, colorMode) {
        const c = normalizeColor(color || {});
        const mul = clamp01(alphaMul == null ? 1 : alphaMul);

        if (colorMode === 'rgb_only') {
            return 'rgba(' +
                Math.round(c.r * 255) + ', ' +
                Math.round(c.g * 255) + ', ' +
                Math.round(c.b * 255) + ', 1.000)';
        }

        if (colorMode === 'alpha_only') {
            return 'rgba(255, 255, 255, ' + (c.a * mul).toFixed(3) + ')';
        }

        return colorToCssWithMul(c, mul);
    }

    function composeTrailColorCanvas(composeCanvas, composeCtx, shaderCanvas, colorMaskCanvas, width, height) {
        if (!composeCanvas || !composeCtx || !shaderCanvas || !colorMaskCanvas) return false;

        ensureCanvasSize(composeCanvas, width, height);

        composeCtx.save();
        composeCtx.setTransform(1, 0, 0, 1, 0, 0);
        composeCtx.globalCompositeOperation = 'source-over';
        composeCtx.globalAlpha = 1.0;
        composeCtx.clearRect(0, 0, width, height);

        composeCtx.drawImage(shaderCanvas, 0, 0, width, height);
        composeCtx.globalCompositeOperation = 'multiply';
        composeCtx.drawImage(colorMaskCanvas, 0, 0, width, height);
        composeCtx.globalCompositeOperation = 'destination-in';
        composeCtx.drawImage(colorMaskCanvas, 0, 0, width, height);

        composeCtx.restore();
        return true;
    }

    function buildInterpolatedTrailSamples(screenPoints) {
        if (!Array.isArray(screenPoints) || screenPoints.length === 0) return [];

        const samples = [];
        const count = screenPoints.length;
        for (let i = 0; i < count; i += 1) {
            const item = screenPoints[i] || {};
            const point = item.point || {};
            const pos = item.pos || {};
            const autoU = count > 1 ? (i / (count - 1)) : 0;
            samples.push({
                x: safeNumber(pos.x, 0),
                y: safeNumber(pos.y, 0),
                width: Math.max(0.001, safeNumber(point.width, 0.06)),
                color: normalizeColor(point.color),
                u: safeNumber(point.u, autoU),
                uDefined: !!point.uDefined
            });
        }

        return samples;
    }

    function buildRibbonGeometry(samples, scaleBase, uvMode) {
        if (!Array.isArray(samples) || samples.length < 2) {
            return {
                ribbon: [],
                vertices: [],
                triangles: [],
                segments: [],
                uvResolvedMode: uvMode === 'manual' ? 'manual' : 'linear',
                uvModeSource: uvMode === 'manual' ? 'trail_manual' : 'linear_auto'
            };
        }

        const ribbon = [];
        const vertices = [];
        const triangles = [];
        const segments = [];
        let lastDirX = 1;
        let lastDirY = 0;
        let lastNormalX = 0;
        let lastNormalY = -1;
        const requestedUvMode = uvMode === 'manual' ? 'manual' : 'linear';
        const hasPointUv = samples.some(function (item) { return !!(item && item.uDefined); });
        const usePointUv = requestedUvMode === 'manual' || hasPointUv;
        const resolvedUvMode = usePointUv ? 'manual' : 'linear';
        const uvModeSource = requestedUvMode === 'manual'
            ? 'trail_manual'
            : (hasPointUv ? 'point_uv' : 'linear_auto');

        for (let i = 0; i < samples.length; i += 1) {
            const cur = samples[i];
            const prev = samples[Math.max(0, i - 1)];
            const next = samples[Math.min(samples.length - 1, i + 1)];

            let tx = 0;
            let ty = 0;
            if (i < samples.length - 1) {
                tx = next.x - cur.x;
                ty = next.y - cur.y;
            } else {
                tx = cur.x - prev.x;
                ty = cur.y - prev.y;
            }

            let len = Math.hypot(tx, ty);
            if (len <= 1e-5) {
                tx = next.x - prev.x;
                ty = next.y - prev.y;
                len = Math.hypot(tx, ty);
            }

            if (len > 1e-5) {
                tx /= len;
                ty /= len;
                lastDirX = tx;
                lastDirY = ty;
            } else {
                tx = lastDirX;
                ty = lastDirY;
            }

            let nx = -ty;
            let ny = tx;
            const nlen = Math.hypot(nx, ny);
            if (nlen > 1e-5) {
                nx /= nlen;
                ny /= nlen;
                lastNormalX = nx;
                lastNormalY = ny;
            } else {
                nx = lastNormalX;
                ny = lastNormalY;
            }

            let uCoord = samples.length > 1 ? (i / (samples.length - 1)) : 0;
            if (usePointUv) {
                uCoord = clamp01(safeNumber(cur.u, uCoord));
            }
            const color = normalizeColor(cur.color);
            const halfWidth = Math.max(0.8, getTrailStrokeWidth(cur, scaleBase) * 0.5);
            const left = { x: cur.x + nx * halfWidth, y: cur.y + ny * halfWidth };
            const right = { x: cur.x - nx * halfWidth, y: cur.y - ny * halfWidth };

            ribbon.push({
                center: { x: cur.x, y: cur.y },
                left: left,
                right: right,
                halfWidth: halfWidth,
                color: color,
                dir: { x: tx, y: ty },
                normal: { x: nx, y: ny },
                u: uCoord
            });

            vertices.push({
                x: left.x,
                y: left.y,
                color: color,
                uv: { u: uCoord, v: 0 }
            });
            vertices.push({
                x: right.x,
                y: right.y,
                color: color,
                uv: { u: uCoord, v: 1 }
            });

            if (i < samples.length - 1) {
                const leftA = i * 2;
                const rightA = leftA + 1;
                const leftB = leftA + 2;
                const rightB = leftA + 3;

                triangles.push([leftA, rightA, leftB]);
                triangles.push([leftB, rightA, rightB]);
                segments.push({ a: leftA, b: rightA, c: leftB, d: rightB });
            }
        }

        return {
            ribbon: ribbon,
            vertices: vertices,
            triangles: triangles,
            segments: segments,
            uvResolvedMode: resolvedUvMode,
            uvModeSource: uvModeSource
        };
    }


    function drawMeshTriangles(ctx2d, mesh, alphaMul, colorMode) {
        if (!mesh || !Array.isArray(mesh.vertices) || !Array.isArray(mesh.triangles) || mesh.triangles.length < 1) {
            return;
        }

        const vertices = mesh.vertices;
        const triangles = mesh.triangles;
        const ribbon = Array.isArray(mesh.ribbon) ? mesh.ribbon : [];
        const mul = clamp01(alphaMul == null ? 1 : alphaMul);

        const start = ribbon.length > 0
            ? ribbon[0].center
            : { x: vertices[0].x, y: vertices[0].y };
        const end = ribbon.length > 0
            ? ribbon[ribbon.length - 1].center
            : { x: vertices[vertices.length - 1].x, y: vertices[vertices.length - 1].y };

        const grad = ctx2d.createLinearGradient(start.x, start.y, end.x, end.y);
        if (ribbon.length > 1) {
            for (let i = 0; i < ribbon.length; i += 1) {
                const t = i / (ribbon.length - 1);
                grad.addColorStop(t, colorToCssWithMode(ribbon[i].color, mul, colorMode));
            }
        } else {
            const firstColor = normalizeColor(vertices[0].color);
            const lastColor = normalizeColor(vertices[vertices.length - 1].color);
            grad.addColorStop(0, colorToCssWithMode(firstColor, mul, colorMode));
            grad.addColorStop(1, colorToCssWithMode(lastColor, mul, colorMode));
        }

        ctx2d.save();
        ctx2d.beginPath();
        for (const tri of triangles) {
            const v0 = vertices[tri[0]];
            const v1 = vertices[tri[1]];
            const v2 = vertices[tri[2]];
            if (!v0 || !v1 || !v2) continue;
            ctx2d.moveTo(v0.x, v0.y);
            ctx2d.lineTo(v1.x, v1.y);
            ctx2d.lineTo(v2.x, v2.y);
            ctx2d.closePath();
        }
        ctx2d.fillStyle = grad;
        ctx2d.fill();
        ctx2d.restore();
    }



    function computeAffineFromTriangle(src0, src1, src2, dst0, dst1, dst2) {
        const x0 = safeNumber(dst0 && dst0.x, 0);
        const y0 = safeNumber(dst0 && dst0.y, 0);
        const x1 = safeNumber(dst1 && dst1.x, 0);
        const y1 = safeNumber(dst1 && dst1.y, 0);
        const x2 = safeNumber(dst2 && dst2.x, 0);
        const y2 = safeNumber(dst2 && dst2.y, 0);

        const u0 = safeNumber(src0 && src0.x, 0);
        const v0 = safeNumber(src0 && src0.y, 0);
        const u1 = safeNumber(src1 && src1.x, 0);
        const v1 = safeNumber(src1 && src1.y, 0);
        const u2 = safeNumber(src2 && src2.x, 0);
        const v2 = safeNumber(src2 && src2.y, 0);

        const den = (u0 * (v1 - v2)) + (u1 * (v2 - v0)) + (u2 * (v0 - v1));
        if (Math.abs(den) < 1e-5) return null;

        const a = ((x0 * (v1 - v2)) + (x1 * (v2 - v0)) + (x2 * (v0 - v1))) / den;
        const b = ((y0 * (v1 - v2)) + (y1 * (v2 - v0)) + (y2 * (v0 - v1))) / den;
        const c = ((x0 * (u2 - u1)) + (x1 * (u0 - u2)) + (x2 * (u1 - u0))) / den;
        const d = ((y0 * (u2 - u1)) + (y1 * (u0 - u2)) + (y2 * (u1 - u0))) / den;
        const e = ((x0 * ((u1 * v2) - (u2 * v1))) + (x1 * ((u2 * v0) - (u0 * v2))) + (x2 * ((u0 * v1) - (u1 * v0)))) / den;
        const f = ((y0 * ((u1 * v2) - (u2 * v1))) + (y1 * ((u2 * v0) - (u0 * v2))) + (y2 * ((u0 * v1) - (u1 * v0)))) / den;

        return { a: a, b: b, c: c, d: d, e: e, f: f };
    }

    function mapVertexUvToSource(vertex, uvRect) {
        const uv = vertex && vertex.uv ? vertex.uv : { u: 0, v: 0 };
        const u = clamp01(safeNumber(uv.u, 0));
        const v = clamp01(safeNumber(uv.v, 0));
        return {
            x: uvRect.x + uvRect.w * u,
            y: uvRect.y + uvRect.h * v
        };
    }

    function drawMeshUvMappedTriangles(ctx2d, mesh, sourceCanvas, uvRect, alphaMul) {
        if (!ctx2d || !mesh || !sourceCanvas || !uvRect) return false;
        if (!Array.isArray(mesh.vertices) || !Array.isArray(mesh.triangles) || mesh.triangles.length < 1) return false;

        const vertices = mesh.vertices;
        const triangles = mesh.triangles;
        const mul = clamp01(alphaMul == null ? 1 : alphaMul);

        ctx2d.save();
        ctx2d.globalAlpha = mul;

        for (const tri of triangles) {
            const v0 = vertices[tri[0]];
            const v1 = vertices[tri[1]];
            const v2 = vertices[tri[2]];
            if (!v0 || !v1 || !v2) continue;

            const d0 = { x: safeNumber(v0.x, 0), y: safeNumber(v0.y, 0) };
            const d1 = { x: safeNumber(v1.x, 0), y: safeNumber(v1.y, 0) };
            const d2 = { x: safeNumber(v2.x, 0), y: safeNumber(v2.y, 0) };

            const s0 = mapVertexUvToSource(v0, uvRect);
            const s1 = mapVertexUvToSource(v1, uvRect);
            const s2 = mapVertexUvToSource(v2, uvRect);

            const m = computeAffineFromTriangle(s0, s1, s2, d0, d1, d2);
            if (!m) continue;

            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.moveTo(d0.x, d0.y);
            ctx2d.lineTo(d1.x, d1.y);
            ctx2d.lineTo(d2.x, d2.y);
            ctx2d.closePath();
            ctx2d.clip();
            ctx2d.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
            ctx2d.drawImage(sourceCanvas, 0, 0);
            ctx2d.restore();
        }

        ctx2d.restore();
        return true;
    }

    function ensureCanvasSize(canvas, width, height) {
        if (!canvas) return;
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
    }

    function drawTrail(ctx2d, width, height, points, options) {
        const opts = options || {};
        const previewRect = drawBackground(ctx2d, width, height, opts.baseCanvas);
        const rawMeshes = Array.isArray(opts.meshes) ? opts.meshes : [];
        const hasPointData = Array.isArray(points) && points.length > 0;
        const hasMeshData = rawMeshes.length > 0;

        if (!hasPointData && !hasMeshData) {
            ctx2d.save();
            ctx2d.fillStyle = 'rgba(235, 238, 245, 0.72)';
            ctx2d.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
            ctx2d.fillText('DP 预览: 暂无轨迹点（请调用 make slash / emit / emit mesh）', 16, 28);
            ctx2d.restore();
            return {
                ok: false,
                reason: 'no_points',
                coordMode: 'auto',
                pointCount: 0,
                sampleCount: 0,
                vertexCount: 0,
                triangleCount: 0,
                previewVertices: []
            };
        }

        const resolvedUvMode = opts.uvMode === 'manual' ? 'manual' : 'linear';
        const resolvedBlendMode = opts.blendMode === 'additive' ? 'additive' : 'alpha';
        const coordMode = (opts.forceCoordMode === 'uv' || opts.forceCoordMode === 'center')
            ? opts.forceCoordMode
            : (hasPointData ? detectCoordMode(points) : detectCoordModeForMeshes(rawMeshes));

        const scaleBase = Math.min(width, height);
        let samples = [];
        let meshParts = [];

        if (hasPointData) {
            const screenPoints = points.map(function (p) {
                return {
                    point: p,
                    pos: worldToScreen(p, width, height, coordMode)
                };
            });
            samples = buildInterpolatedTrailSamples(screenPoints);
            meshParts.push(buildRibbonGeometry(samples, scaleBase, resolvedUvMode));
        }

        if (hasMeshData) {
            meshParts.push(buildMeshFromScriptMeshes(rawMeshes, width, height, coordMode));
        }

        const mesh = mergeTrailMeshes(meshParts, resolvedUvMode, hasMeshData ? 'mesh_emit' : null);
        const ribbon = mesh.ribbon;
        const effectiveUvMode = mesh.uvResolvedMode || resolvedUvMode;

        const drawInfo = {
            ok: true,
            coordMode: coordMode,
            pointCount: hasPointData ? points.length : 0,
            sampleCount: samples.length,
            vertexCount: mesh.vertices.length,
            triangleCount: mesh.triangles.length,
            uvMode: effectiveUvMode,
            blendMode: resolvedBlendMode,
            blendFormula: resolvedBlendMode === 'additive'
                ? 'out = dst + src * a'
                : 'out = src + dst * (1 - a)',
            uvSource: 'render_window',
            uvModeSource: mesh.uvModeSource || 'linear_auto',
            uvRect: {
                x: previewRect && previewRect.x,
                y: previewRect && previewRect.y,
                w: previewRect && previewRect.w,
                h: previewRect && previewRect.h
            },
            previewRibbon: ribbon.slice(0, 20).map(function (item) {
                return {
                    x: item.center && item.center.x,
                    y: item.center && item.center.y,
                    dirX: item.dir && item.dir.x,
                    dirY: item.dir && item.dir.y,
                    normalX: item.normal && item.normal.x,
                    normalY: item.normal && item.normal.y,
                    u: item.u
                };
            }),
            previewVertices: mesh.vertices.slice(0, 20).map(function (v) {
                return {
                    x: v.x,
                    y: v.y,
                    u: v.uv && v.uv.u,
                    v: v.uv && v.uv.v,
                    a: v.color && v.color.a
                };
            }),
            previewTriangles: mesh.triangles.slice(0, 20).map(function (tri) {
                return {
                    i0: tri[0],
                    i1: tri[1],
                    i2: tri[2]
                };
            })
        };

        const hasRenderableMesh = Array.isArray(mesh.vertices)
            && mesh.vertices.length >= 3
            && Array.isArray(mesh.triangles)
            && mesh.triangles.length >= 1;

        if (!hasRenderableMesh) {
            ctx2d.save();
            ctx2d.fillStyle = 'rgba(235, 238, 245, 0.72)';
            ctx2d.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
            ctx2d.fillText('DP 预览: 轨迹数据不足', 16, 28);
            ctx2d.restore();
            drawInfo.ok = false;
            drawInfo.reason = 'not_enough_ribbon';
            return drawInfo;
        }

        let shaderApplied = false;
        let colorMaskApplied = false;
        let alphaMaskApplied = false;
        let composeApplied = false;
        let sourceColorCanvas = null;
        let sourceColorCtx = null;
        let sourceLayer = 'none';

        if (opts.maskCanvas && opts.maskCtx) {
            ensureCanvasSize(opts.maskCanvas, width, height);
            opts.maskCtx.clearRect(0, 0, width, height);
            drawMeshTriangles(opts.maskCtx, mesh, 1.0, 'rgb_only');
            colorMaskApplied = true;
            sourceColorCanvas = opts.maskCanvas;
            sourceColorCtx = opts.maskCtx;
            sourceLayer = 'vertex_rgb';
        }

        if (opts.alphaMaskCanvas && opts.alphaMaskCtx) {
            ensureCanvasSize(opts.alphaMaskCanvas, width, height);
            opts.alphaMaskCtx.clearRect(0, 0, width, height);
            drawMeshTriangles(opts.alphaMaskCtx, mesh, 1.0, 'alpha_only');
            alphaMaskApplied = true;
        }

        if (opts.useShaderColor && opts.baseCanvas && opts.shaderCanvas && opts.shaderCtx) {
            ensureCanvasSize(opts.shaderCanvas, width, height);
            opts.shaderCtx.clearRect(0, 0, width, height);

            shaderApplied = drawMeshUvMappedTriangles(opts.shaderCtx, mesh, opts.baseCanvas, previewRect, 1.0);

            if (shaderApplied && colorMaskApplied) {
                composeApplied = composeTrailColorCanvas(
                    opts.composeCanvas,
                    opts.composeCtx,
                    opts.shaderCanvas,
                    opts.maskCanvas,
                    width,
                    height
                );
            }

            if (shaderApplied && composeApplied) {
                sourceColorCanvas = opts.composeCanvas;
                sourceColorCtx = opts.composeCtx;
                sourceLayer = 'shader_x_vertex_rgb';
            } else if (shaderApplied) {
                sourceColorCanvas = opts.shaderCanvas;
                sourceColorCtx = opts.shaderCtx;
                sourceLayer = 'shader_raw';
            }
        }

        if (sourceColorCanvas) {
            if (resolvedBlendMode === 'additive' && alphaMaskApplied && sourceColorCtx && opts.alphaMaskCanvas) {
                sourceColorCtx.save();
                sourceColorCtx.globalCompositeOperation = 'destination-in';
                sourceColorCtx.globalAlpha = 1.0;
                sourceColorCtx.drawImage(opts.alphaMaskCanvas, 0, 0, width, height);
                sourceColorCtx.restore();
                sourceLayer += '_times_a';
            }

            ctx2d.save();
            if (resolvedBlendMode === 'alpha' && alphaMaskApplied && opts.alphaMaskCanvas) {
                ctx2d.globalCompositeOperation = 'destination-out';
                ctx2d.globalAlpha = 1.0;
                ctx2d.drawImage(opts.alphaMaskCanvas, 0, 0, width, height);
                sourceLayer += '_dst_times_1_minus_a';
            }
            ctx2d.globalCompositeOperation = 'lighter';
            ctx2d.globalAlpha = 1.0;
            ctx2d.drawImage(sourceColorCanvas, 0, 0, width, height);
            ctx2d.restore();
        } else {
            drawMeshTriangles(ctx2d, mesh, 1.0);
            sourceLayer = 'fallback_gradient';
        }

        drawInfo.shaderApplied = shaderApplied;
        drawInfo.maskApplied = alphaMaskApplied;
        drawInfo.colorMaskApplied = colorMaskApplied;
        drawInfo.composeApplied = composeApplied;
        drawInfo.sourceLayer = sourceLayer;

        return drawInfo;
    }

    function getMode() {

        const shell = $('shaderpg-shell');
        if (!shell) return 'hlsl';
        return shell.getAttribute('data-mode') === MODE_DP ? MODE_DP : 'hlsl';
    }

    function syncDpCanvasSize(dpCanvas, referenceCanvas) {
        if (!dpCanvas) return;

        const ref = referenceCanvas || $('shaderpg-canvas');
        if (!ref) return;

        if (dpCanvas.width !== ref.width) dpCanvas.width = ref.width;
        if (dpCanvas.height !== ref.height) dpCanvas.height = ref.height;
    }

    function init() {
        const editor = $('shaderpg-dp-editor');
        const editorSurface = $('shaderpg-dp-editor-surface');
        const editorStack = $('shaderpg-dp-editor-stack');
        const editorHighlight = $('shaderpg-dp-editor-highlight');
        const editorHighlightCode = $('shaderpg-dp-editor-highlight-code');
        const editorAutocomplete = $('shaderpg-dp-autocomplete');

        const compileBtn = $('shaderpg-dp-compile');
        const presetSelect = $('shaderpg-dp-preset');
        const shaderToggleBtn = $('shaderpg-dp-shader-toggle');
        const blendToggleBtn = $('shaderpg-blend-toggle') || $('shaderpg-dp-blend-toggle');
        const resetBtn = $('shaderpg-dp-reset');
        const syntaxBodyEl = $('shaderpg-dp-syntax-body');
        const apiBodyEl = $('shaderpg-dp-api-body');
        const statusEl = $('shaderpg-dp-status');
        const logEl = $('shaderpg-dp-log');
        const paramsEl = $('shaderpg-dp-params');

        const dpCanvas = $('shaderpg-dp-canvas');
        const baseCanvas = $('shaderpg-canvas');
        const dpCtx = dpCanvas ? dpCanvas.getContext('2d') : null;

        if (!editor || !compileBtn || !resetBtn || !statusEl || !dpCanvas || !dpCtx) {
            return;
        }

        const completionState = {
            items: [],
            selected: 0,
            start: 0,
            end: 0,
            visible: false
        };

        const initialBlendMode = readStoredBlendMode();

        const runtime = {
            program: null,
            lastError: '',
            startMs: performance.now(),
            lastMs: performance.now(),
            frame: 0,
            lastPoints: [],
            autoCompileTimer: 0,
            useShaderColor: false,
            presetId: DP_PRESET_DEFAULT,
            forceCoordMode: null,
            forceUvMode: 'linear',
            forceBlendMode: initialBlendMode,
            userBlendMode: initialBlendMode,
            shaderTrailCanvas: document.createElement('canvas'),
            shaderTrailCtx: null,
            shaderTrailMaskCanvas: document.createElement('canvas'),
            shaderTrailMaskCtx: null,
            shaderTrailAlphaMaskCanvas: document.createElement('canvas'),
            shaderTrailAlphaMaskCtx: null,
            shaderTrailComposeCanvas: document.createElement('canvas'),
            shaderTrailComposeCtx: null
        };

        runtime.shaderTrailCtx = runtime.shaderTrailCanvas.getContext('2d');
        runtime.shaderTrailMaskCtx = runtime.shaderTrailMaskCanvas.getContext('2d');
        runtime.shaderTrailAlphaMaskCtx = runtime.shaderTrailAlphaMaskCanvas.getContext('2d');
        runtime.shaderTrailComposeCtx = runtime.shaderTrailComposeCanvas.getContext('2d');

        runtime.presetId = normalizePresetId(presetSelect && presetSelect.value ? presetSelect.value : runtime.presetId);
        if (presetSelect) presetSelect.value = runtime.presetId;

        function getCaretVisualPosition(textarea, cursorPos) {
            const el = textarea;
            const raw = String(el.value || '');
            const pos = clamp(Number(cursorPos || 0), 0, raw.length);
            const cs = window.getComputedStyle(el);

            const mirror = createEl('div');
            const marker = createEl('span');
            const props = [
                'boxSizing', 'width', 'height',
                'overflowX', 'overflowY',
                'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
                'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
                'lineHeight', 'fontFamily', 'letterSpacing', 'textTransform',
                'textIndent', 'textDecoration', 'wordSpacing', 'tabSize',
                'fontVariantLigatures', 'fontFeatureSettings', 'fontKerning',
                'fontVariantNumeric', 'fontSynthesis', 'textRendering'
            ];

            props.forEach(function (name) {
                mirror.style[name] = cs[name];
            });

            mirror.style.position = 'absolute';
            mirror.style.visibility = 'hidden';
            mirror.style.left = '-99999px';
            mirror.style.top = '0';
            mirror.style.pointerEvents = 'none';
            mirror.style.whiteSpace = 'pre';
            mirror.style.wordBreak = 'normal';
            mirror.style.overflow = 'hidden';

            mirror.textContent = raw.slice(0, pos);
            marker.textContent = '\u200b';
            mirror.appendChild(marker);
            document.body.appendChild(mirror);

            const left = marker.offsetLeft - el.scrollLeft;
            const top = marker.offsetTop - el.scrollTop;
            const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 12) * 1.55;

            document.body.removeChild(mirror);
            return { left: left, top: top, lineHeight: lineHeight };
        }

        function positionAutocompleteAtCursor() {
            if (!editorAutocomplete || !editorSurface || !completionState.visible) return;

            const caret = getCaretVisualPosition(editor, editor.selectionStart || 0);
            const taRect = editor.getBoundingClientRect();
            const surfaceRect = editorSurface.getBoundingClientRect();

            let left = (taRect.left - surfaceRect.left) + caret.left + 6;
            let top = (taRect.top - surfaceRect.top) + caret.top + caret.lineHeight + 6;

            const panelWidth = editorAutocomplete.offsetWidth || 260;
            const panelHeight = editorAutocomplete.offsetHeight || 180;
            const surfaceWidth = editorSurface.clientWidth || 0;
            const surfaceHeight = editorSurface.clientHeight || 0;
            const edgePadding = 8;

            const maxLeft = Math.max(edgePadding, surfaceWidth - panelWidth - edgePadding);
            left = clamp(left, edgePadding, maxLeft);

            const maxTop = Math.max(edgePadding, surfaceHeight - panelHeight - edgePadding);
            if (top > maxTop) {
                top = (taRect.top - surfaceRect.top) + caret.top - panelHeight - 6;
            }
            top = clamp(top, edgePadding, maxTop);

            editorAutocomplete.style.left = Math.round(left) + 'px';
            editorAutocomplete.style.top = Math.round(top) + 'px';
        }

        function syncEditorScroll() {
            if (editorHighlight) {
                editorHighlight.scrollTop = 0;
                editorHighlight.scrollLeft = 0;
            }
            if (editorHighlightCode) {
                const x = -Math.round(Number(editor.scrollLeft || 0));
                const y = -Math.round(Number(editor.scrollTop || 0));
                editorHighlightCode.style.transform = 'translate(' + String(x) + 'px, ' + String(y) + 'px)';
            }
            syncEditorSizing();
            if (!completionState.visible) return;
            positionAutocompleteAtCursor();
        }

        function refreshEditorHighlight() {
            if (!editorHighlightCode) return;
            if (!editorAssist || typeof editorAssist.highlightDpapyruToHtml !== 'function') {
                editorHighlightCode.textContent = String(editor.value || '');
                return;
            }
            editorHighlightCode.innerHTML = editorAssist.highlightDpapyruToHtml(editor.value || '');
            syncEditorScroll();
        }

        function refreshSyntaxHighlight() {
            if (!editorAssist || typeof editorAssist.highlightDpapyruToHtml !== 'function') {
                return;
            }

            if (syntaxBodyEl) {
                const syntaxRaw = String(syntaxBodyEl.textContent || '');
                syntaxBodyEl.innerHTML = editorAssist.highlightDpapyruToHtml(syntaxRaw);
            }

            if (apiBodyEl) {
                const apiRaw = String(apiBodyEl.textContent || '');
                apiBodyEl.innerHTML = editorAssist.highlightDpapyruToHtml(apiRaw);
            }
        }

        function syncEditorSizing() {
            if (editorStack) {
                const minHeight = Math.max(260, editor.clientHeight || 0);
                editorStack.style.minHeight = minHeight + 'px';
            }
            if (!completionState.visible) return;
            positionAutocompleteAtCursor();
        }

        function hideAutocomplete() {
            completionState.items = [];
            completionState.selected = 0;
            completionState.start = 0;
            completionState.end = 0;
            completionState.visible = false;
            if (editorAutocomplete) {
                editorAutocomplete.classList.remove('show');
                editorAutocomplete.replaceChildren();
                editorAutocomplete.style.left = '';
                editorAutocomplete.style.top = '';
            }
        }

        function applyCompletionAtSelected() {
            if (!editorAssist || completionState.items.length === 0) return false;
            const current = completionState.items[completionState.selected];
            if (!current) return false;

            const res = editorAssist.applyCompletion(editor.value, editor.selectionStart, current);
            editor.value = res.text;
            editor.selectionStart = res.cursor;
            editor.selectionEnd = res.cursor;
            refreshEditorHighlight();
            hideAutocomplete();
            scheduleAutoCompile('补全');
            return true;
        }

        function renderAutocomplete() {
            if (!editorAutocomplete || !completionState.visible || completionState.items.length === 0) {
                hideAutocomplete();
                return;
            }

            editorAutocomplete.replaceChildren();
            completionState.items.forEach(function (word, idx) {
                const btn = createEl('button', 'shaderpg-autocomplete-item');
                btn.type = 'button';
                btn.textContent = word;
                btn.setAttribute('data-selected', idx === completionState.selected ? 'true' : 'false');
                btn.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    completionState.selected = idx;
                    applyCompletionAtSelected();
                });
                editorAutocomplete.appendChild(btn);
            });
            editorAutocomplete.classList.add('show');
            positionAutocompleteAtCursor();
        }

        function showAutocompleteForCurrentCursor() {
            if (!editorAssist || !editorAutocomplete || typeof editorAssist.getCompletionRange !== 'function') {
                return;
            }

            const range = editorAssist.getCompletionRange(editor.value, editor.selectionStart);
            if (!range || !range.prefix) {
                hideAutocomplete();
                return;
            }

            const collect = typeof editorAssist.collectDpapyruCompletionItems === 'function'
                ? editorAssist.collectDpapyruCompletionItems
                : editorAssist.collectCompletionItems;

            const items = collect(range.prefix, editor.value, editor.selectionStart);
            if (!items.length) {
                hideAutocomplete();
                return;
            }

            completionState.items = items;
            completionState.selected = 0;
            completionState.start = range.start;
            completionState.end = range.end;
            completionState.visible = true;
            renderAutocomplete();
        }

        function afterEditorChanged() {
            refreshEditorHighlight();
            syncEditorSizing();
            showAutocompleteForCurrentCursor();
        }

        function setRuntimeLog(text) {
            if (!logEl) return;
            logEl.textContent = String(text || '');
        }

        function setParamText(text) {
            if (!paramsEl) return;
            paramsEl.textContent = String(text || '');
        }

        function setStatus(text) {
            setText(statusEl, text);
        }

        function formatParamNumber(value, digits) {
            const n = Number(value);
            if (!isFinite(n)) return String(value == null ? 0 : value);
            return n.toFixed(digits == null ? 3 : digits);
        }

        function buildParamText(exec, ctxData, drawInfo) {
            const lines = [];
            lines.push('time=' + formatParamNumber(ctxData.Time, 3) + 's');
            lines.push('dt=' + formatParamNumber(ctxData.Dt, 3) + 's');
            lines.push('progress=' + formatParamNumber(ctxData.Progress, 3));

            if (runtime.program && runtime.program.kind === 'swing') {
                const cfg = runtime.program.trailConfig || {};
                lines.push('state=' + String(exec.stateBefore || exec.state || 'slash') + ' -> ' + String(exec.state || 'slash'));
                if (exec.durationLimit !== null && exec.durationLimit !== undefined) {
                    lines.push('duration=' + String(exec.durationLimit));
                }
                lines.push('coord=' + String(runtime.forceCoordMode || cfg.coordMode || 'auto'));
                lines.push('uv_mode=' + String(runtime.forceUvMode || cfg.uvMode || 'linear'));
                lines.push('blend=' + String(runtime.forceBlendMode || cfg.blendMode || 'alpha'));
                lines.push('use_shader=' + (runtime.useShaderColor ? 'on' : 'off'));
                lines.push('shader_pass=' + String(cfg.shaderPass == null ? 0 : cfg.shaderPass));
            }

            const vars = exec && exec.vars ? exec.vars : null;
            if (vars && typeof vars === 'object') {
                const keys = Object.keys(vars).sort();
                if (keys.length > 0) {
                    lines.push('');
                    lines.push('vars:');
                    const shown = keys.slice(0, 20);
                    for (const key of shown) {
                        lines.push('  ' + key + ' = ' + formatParamNumber(vars[key], 4));
                    }
                    if (keys.length > shown.length) {
                        lines.push('  ... +' + String(keys.length - shown.length));
                    }
                }
            }

            if (drawInfo && typeof drawInfo === 'object') {
                lines.push('');
                lines.push('pipeline:');
                lines.push('  points=' + String(drawInfo.pointCount || 0) + ' samples=' + String(drawInfo.sampleCount || 0));
                lines.push('  vertices=' + String(drawInfo.vertexCount || 0) + ' triangles=' + String(drawInfo.triangleCount || 0));
                lines.push('  coord_mode=' + String(drawInfo.coordMode || 'auto'));
                lines.push('  uv_mode=' + String(drawInfo.uvMode || 'linear'));
                lines.push('  uv_mode_source=' + String(drawInfo.uvModeSource || 'linear_auto'));
                lines.push('  blend_mode=' + String(drawInfo.blendMode || 'alpha'));
                lines.push('  blend_formula=' + String(drawInfo.blendFormula || 'out = src + dst * (1 - a)'));
                lines.push('  source_layer=' + String(drawInfo.sourceLayer || 'none'));
                lines.push('  uv_align=' + ((drawInfo.uvMode === 'manual') ? 'point_value' : 'linear_0_1'));
                lines.push('  uv_source=' + String(drawInfo.uvSource || 'preview_rect'));
                lines.push('  shader_applied=' + (drawInfo.shaderApplied ? 'yes' : 'no'));
                lines.push('  alpha_mask=' + (drawInfo.maskApplied ? 'yes' : 'no'));
                lines.push('  color_mask=' + (drawInfo.colorMaskApplied ? 'yes' : 'no'));
                lines.push('  compose=' + (drawInfo.composeApplied ? 'gpu_canvas' : 'none'));
                if (drawInfo.uvRect) {
                    lines.push(
                        '  uv_rect=(' +
                        formatParamNumber(drawInfo.uvRect.x, 1) + ',' +
                        formatParamNumber(drawInfo.uvRect.y, 1) + ',' +
                        formatParamNumber(drawInfo.uvRect.w, 1) + ',' +
                        formatParamNumber(drawInfo.uvRect.h, 1) + ')'
                    );
                }

                const ribbonPreview = Array.isArray(drawInfo.previewRibbon) ? drawInfo.previewRibbon : [];
                for (let i = 0; i < Math.min(20, ribbonPreview.length); i += 1) {
                    const item = ribbonPreview[i];
                    lines.push(
                        '  r' + i +
                        ' p=(' + formatParamNumber(item.x, 2) + ',' + formatParamNumber(item.y, 2) + ')' +
                        ' dir=(' + formatParamNumber(item.dirX, 2) + ',' + formatParamNumber(item.dirY, 2) + ')' +
                        ' n=(' + formatParamNumber(item.normalX, 2) + ',' + formatParamNumber(item.normalY, 2) + ')'
                    );
                }

                const vertexPreview = Array.isArray(drawInfo.previewVertices) ? drawInfo.previewVertices : [];
                for (let i = 0; i < Math.min(20, vertexPreview.length); i += 1) {
                    const item = vertexPreview[i];
                    lines.push(
                        '  v' + i +
                        ' pos=(' + formatParamNumber(item.x, 1) + ',' + formatParamNumber(item.y, 1) + ')' +
                        ' uv=(' + formatParamNumber(item.u, 2) + ',' + formatParamNumber(item.v, 2) + ')' +
                        ' a=' + formatParamNumber(item.a, 2)
                    );
                }

                const trianglePreview = Array.isArray(drawInfo.previewTriangles) ? drawInfo.previewTriangles : [];
                for (let i = 0; i < Math.min(20, trianglePreview.length); i += 1) {
                    const item = trianglePreview[i];
                    lines.push(
                        '  t' + i +
                        ' idx=(' + String(item.i0) + ',' + String(item.i1) + ',' + String(item.i2) + ')'
                    );
                }
            }

            const points = Array.isArray(exec && exec.points) ? exec.points : [];
            lines.push('');
            lines.push('points=' + String(points.length));
            for (let i = 0; i < Math.min(8, points.length); i += 1) {
                const p = points[i];
                lines.push(
                    '#' + i +
                    ' x=' + formatParamNumber(p.x, 3) +
                    ' y=' + formatParamNumber(p.y, 3) +
                    ' w=' + formatParamNumber(p.width, 3) +
                    ' u=' + formatParamNumber(p.u, 3) +
                    ' a=' + formatParamNumber(p.color && p.color.a, 3)
                );
            }

            return lines.join('\n');
        }

        function getShaderModeText() {
            return runtime.useShaderColor ? '开' : '关';
        }

        function getBlendModeText() {
            return runtime.forceBlendMode === 'additive' ? 'Additive' : 'AlphaBlend';
        }

        function applyPreset(presetId, reason) {
            runtime.presetId = normalizePresetId(presetId);
            if (presetSelect) presetSelect.value = runtime.presetId;
            setValue(editor, getPresetSource(runtime.presetId));
            afterEditorChanged();
            compileFromEditor(String(reason || ('切换预设(' + getPresetDisplayName(runtime.presetId) + ')')));
        }

        function refreshShaderToggleButton() {
            if (!shaderToggleBtn) return;
            shaderToggleBtn.textContent = 'Shader上色: ' + getShaderModeText();
            shaderToggleBtn.classList.add('btn');
            shaderToggleBtn.classList.toggle('btn-outline', !runtime.useShaderColor);
        }

        function refreshBlendToggleButton() {
            if (!blendToggleBtn) return;
            blendToggleBtn.textContent = '混合: ' + getBlendModeText();
            blendToggleBtn.classList.add('btn');
            blendToggleBtn.classList.toggle('btn-outline', runtime.forceBlendMode !== 'additive');
            dispatchBlendModeChanged(runtime.forceBlendMode);
        }

        function compileFromEditor(reason) {
            const source = String(editor.value || '');
            const compiled = compileTrailProgram(source);

            if (!compiled.ok) {
                runtime.program = null;
                runtime.lastError = compiled.error;
                setStatus('脚本无效（' + reason + '）：' + compiled.error);
                setRuntimeLog('[Compile Failed]\n' + compiled.error);
                setParamText('[参数不可用]\n' + compiled.error);
                return false;
            }

            runtime.program = compiled.program;
            runtime.lastError = '';
            runtime.startMs = performance.now();
            runtime.lastMs = runtime.startMs;
            runtime.frame = 0;

            if (runtime.program.kind === 'swing') {
                runtime.program.runtime = {
                    activeState: runtime.program.initialState,
                    stateTick: 0,
                    totalTick: 0
                };

                const shaderFlag = runtime.program.trailConfig && typeof runtime.program.trailConfig.useShader === 'boolean'
                    ? runtime.program.trailConfig.useShader
                    : null;
                if (shaderFlag !== null) {
                    runtime.useShaderColor = shaderFlag;
                }

                const coordMode = runtime.program.trailConfig && runtime.program.trailConfig.coordMode
                    ? runtime.program.trailConfig.coordMode
                    : null;
                runtime.forceCoordMode = coordMode;

                const uvMode = runtime.program.trailConfig && runtime.program.trailConfig.uvMode === 'manual'
                    ? 'manual'
                    : 'linear';
                runtime.forceUvMode = uvMode;

                runtime.forceBlendMode = runtime.userBlendMode === 'additive' ? 'additive' : 'alpha';
            } else {
                runtime.forceCoordMode = null;
                runtime.forceUvMode = 'linear';
                runtime.forceBlendMode = runtime.userBlendMode === 'additive' ? 'additive' : 'alpha';
            }

            refreshShaderToggleButton();
            refreshBlendToggleButton();

            const modeLabel = runtime.program.kind === 'swing'
                ? 'profile swing'
                : 'build/emit';

            const presetLabel = getPresetDisplayName(runtime.presetId);

            setStatus('脚本已应用（' + reason + '） | 预设: ' + presetLabel + ' | 模式: ' + modeLabel + ' | Shader上色: ' + getShaderModeText() + ' | 混合: ' + getBlendModeText());
            setRuntimeLog('[Compile OK]\n已启用前端渲染\n语法模式: ' + modeLabel + '\n可用别名: biu / rainbow / v2，推荐 make slash { ... } 封装写法\n状态字段: state_tick / tick / phase\n坐标模式: ' + (runtime.forceCoordMode || 'auto') + '\nUV模式: ' + (runtime.forceUvMode || 'linear') + '\n混合模式(按钮): ' + getBlendModeText() + '\nShader上色: ' + getShaderModeText());
            setParamText('等待首帧执行...');
            return true;
        }

        function scheduleAutoCompile(reason) {


            if (runtime.autoCompileTimer) {
                window.clearTimeout(runtime.autoCompileTimer);
                runtime.autoCompileTimer = 0;
            }

            runtime.autoCompileTimer = window.setTimeout(function () {
                runtime.autoCompileTimer = 0;
                compileFromEditor('自动:' + reason);
            }, 260);
        }

        function buildRuntimeContext(nowMs) {
            const now = Number(nowMs || performance.now());
            const dt = Math.max(0.001, Math.min(0.1, (now - runtime.lastMs) / 1000));
            runtime.lastMs = now;

            const t = Math.max(0, (now - runtime.startMs) / 1000);
            const p = 0.5 + 0.5 * Math.sin(t * 0.7);

            return {
                Time: t,
                Dt: dt,
                Progress: p,
                OriginX: 0,
                OriginY: 0,
                DirX: 1,
                DirY: 0,
                Length: 1,
                Seed: 7
            };
        }

        function renderRuntime(nowMs) {
            syncDpCanvasSize(dpCanvas, baseCanvas);

            if (!runtime.program) {
                drawBackground(dpCtx, dpCanvas.width, dpCanvas.height, baseCanvas);
                dpCtx.save();
                dpCtx.fillStyle = 'rgba(235, 238, 245, 0.72)';
                dpCtx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
                dpCtx.fillText('DP 脚本未就绪。请点击“应用脚本”。', 16, 28);
                if (runtime.lastError) {
                    dpCtx.fillStyle = 'rgba(255, 129, 129, 0.85)';
                    dpCtx.fillText(runtime.lastError, 16, 52);
                }
                dpCtx.restore();
                setParamText('脚本未就绪');
                return;
            }

            const ctxData = buildRuntimeContext(nowMs);
            const exec = executeProgram(runtime.program, ctxData);
            if (!exec.ok) {
                runtime.lastError = exec.error;
                setStatus('运行失败：' + exec.error);
                setRuntimeLog('[Runtime Error]\n' + exec.error);
                setParamText('[Runtime Error]\n' + exec.error);

                drawBackground(dpCtx, dpCanvas.width, dpCanvas.height, baseCanvas);
                dpCtx.save();
                dpCtx.fillStyle = 'rgba(255, 129, 129, 0.9)';
                dpCtx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
                dpCtx.fillText('DP Runtime Error: ' + exec.error, 16, 28);
                dpCtx.restore();
                return;
            }

            runtime.frame += 1;
            runtime.lastPoints = exec.points;
            const drawInfo = drawTrail(dpCtx, dpCanvas.width, dpCanvas.height, exec.points, {
                meshes: exec.meshes,
                useShaderColor: runtime.useShaderColor,
                forceCoordMode: runtime.forceCoordMode,
                uvMode: runtime.forceUvMode,
                blendMode: runtime.forceBlendMode,
                baseCanvas: baseCanvas,
                shaderCanvas: runtime.shaderTrailCanvas,
                shaderCtx: runtime.shaderTrailCtx,
                maskCanvas: runtime.shaderTrailMaskCanvas,
                maskCtx: runtime.shaderTrailMaskCtx,
                alphaMaskCanvas: runtime.shaderTrailAlphaMaskCanvas,
                alphaMaskCtx: runtime.shaderTrailAlphaMaskCtx,
                composeCanvas: runtime.shaderTrailComposeCanvas,
                composeCtx: runtime.shaderTrailComposeCtx
            });
            setParamText(buildParamText(exec, ctxData, drawInfo));

            if (runtime.frame % 8 === 0) {
                const modeLabel = runtime.program && runtime.program.kind === 'swing' ? 'profile swing' : 'build/emit';
                const info = [
                    'frame: ' + runtime.frame,
                    'mode: ' + modeLabel,
                    'time: ' + ctxData.Time.toFixed(2) + 's',
                    'dt: ' + ctxData.Dt.toFixed(3) + 's',
                    'progress: ' + ctxData.Progress.toFixed(3),
                    'points: ' + exec.points.length,
                    'aliases: biu/rainbow/v2 + make slash',
                    'coord: ' + (runtime.forceCoordMode || 'auto'),
                    'uv_mode: ' + (runtime.forceUvMode || 'linear'),
                    'blend: ' + (runtime.forceBlendMode || 'alpha'),
                    'shader: ' + getShaderModeText()
                ];
                if (runtime.program && runtime.program.kind === 'swing' && runtime.program.runtime) {
                    info.push('state: ' + runtime.program.runtime.activeState + ' #' + runtime.program.runtime.stateTick);
                }
                setRuntimeLog(info.join('\n'));
            }
        }

        function loop(nowMs) {
            if (getMode() === MODE_DP) {
                renderRuntime(nowMs);
            }
            window.requestAnimationFrame(loop);
        }

        applyPreset(runtime.presetId, '初始化');
        refreshSyntaxHighlight();
        refreshShaderToggleButton();
        refreshBlendToggleButton();

        compileBtn.addEventListener('click', function () {
            compileFromEditor('手动');
        });

        if (presetSelect) {
            presetSelect.addEventListener('change', function () {
                applyPreset(presetSelect.value, '切换预设(' + getPresetDisplayName(presetSelect.value) + ')');
            });
        }

        if (shaderToggleBtn) {
            shaderToggleBtn.addEventListener('click', function () {
                runtime.useShaderColor = !runtime.useShaderColor;
                refreshShaderToggleButton();
                setStatus('Shader上色已切换为: ' + getShaderModeText() + ' | 混合: ' + getBlendModeText());
            });
        }

        if (blendToggleBtn) {
            blendToggleBtn.addEventListener('click', function () {
                runtime.userBlendMode = runtime.userBlendMode === 'additive' ? 'alpha' : 'additive';
                runtime.forceBlendMode = runtime.userBlendMode;
                saveBlendMode(runtime.userBlendMode);
                refreshBlendToggleButton();
                setStatus('混合模式已切换为: ' + getBlendModeText());
            });
        }

        resetBtn.addEventListener('click', function () {
            applyPreset(runtime.presetId, '重置示例(' + getPresetDisplayName(runtime.presetId) + ')');
        });

        editor.addEventListener('keydown', function (ev) {
            if (ev.key === 'Tab' && (ev.shiftKey || !completionState.visible || completionState.items.length === 0)) {
                ev.preventDefault();
                if (editorAssist && typeof editorAssist.indentTextBlock === 'function') {
                    const raw = String(editor.value || '');
                    const res = editorAssist.indentTextBlock(raw, editor.selectionStart, editor.selectionEnd, !!ev.shiftKey);
                    editor.value = res.text;
                    editor.selectionStart = res.start;
                    editor.selectionEnd = res.end;
                    afterEditorChanged();
                    scheduleAutoCompile('缩进');
                }
                return;
            }

            if (completionState.visible && completionState.items.length > 0) {
                const key = String(ev.key || '');
                if (key === 'ArrowDown') {
                    ev.preventDefault();
                    completionState.selected = (completionState.selected + 1) % completionState.items.length;
                    renderAutocomplete();
                    return;
                }
                if (key === 'ArrowUp') {
                    ev.preventDefault();
                    completionState.selected = (completionState.selected - 1 + completionState.items.length) % completionState.items.length;
                    renderAutocomplete();
                    return;
                }
                if (key === 'Enter' || key === 'Tab') {
                    ev.preventDefault();
                    applyCompletionAtSelected();
                    return;
                }
                if (key === 'Escape') {
                    ev.preventDefault();
                    hideAutocomplete();
                    return;
                }
                if (!isIdentifierChar(key) && key !== 'Backspace' && key !== 'Delete') {
                    hideAutocomplete();
                }
            }

            if ((ev.ctrlKey || ev.metaKey) && ev.key === ' ') {
                ev.preventDefault();
                showAutocompleteForCurrentCursor();
                return;
            }

            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'enter') {
                ev.preventDefault();
                compileFromEditor('快捷键');
            }
        });

        editor.addEventListener('input', function () {
            afterEditorChanged();
            scheduleAutoCompile('输入');
        });

        editor.addEventListener('scroll', syncEditorScroll);
        editor.addEventListener('click', showAutocompleteForCurrentCursor);
        editor.addEventListener('keyup', function (ev) {
            const key = String(ev.key || '');
            if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Enter' || key === 'Escape' || key === 'Tab') {
                return;
            }
            showAutocompleteForCurrentCursor();
        });

        window.addEventListener('resize', function () {
            syncEditorSizing();
            syncDpCanvasSize(dpCanvas, baseCanvas);
        });

        document.addEventListener('click', function (ev) {
            if (!editorAutocomplete || !completionState.visible || completionState.items.length === 0) return;
            if (ev.target === editor || editorAutocomplete.contains(ev.target)) return;
            hideAutocomplete();
        });

        window.requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
