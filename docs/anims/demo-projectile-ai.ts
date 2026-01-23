/**
 * 弹幕 AI 运动模式可视化
 * 演示：基础 AI、冲刺、追踪、回旋镖、曲线运动
 */

import type { AnimAIInput, AnimGfx2D } from '@animts/types';

type Vec2 = { x: number; y: number };
type Projectile = {
    pos: Vec2;
    vel: Vec2;
    rotation: number;
    mode: string;
    timer: number;
    trail: Vec2[];
};

function vec(x: number, y: number): Vec2 { return { x, y }; }
function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function mul(a: Vec2, s: number): Vec2 { return { x: a.x * s, y: a.y * s }; }
function len(a: Vec2): number { return Math.hypot(a.x, a.y); }
function norm(a: Vec2): Vec2 { const l = len(a) || 1; return mul(a, 1 / l); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 { return vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t)); }
function rotate(v: Vec2, angle: number): Vec2 {
    return {
        x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
        y: v.x * Math.sin(angle) + v.y * Math.cos(angle)
    };
}

// 项目初始化
function initState() {
    return {
        time: 0,
        selectedMode: 'Basic',
        projectiles: [] as Projectile[],
        playerPos: vec(0, 80),
        npcPos: vec(0, -100),
        uiStates: [
            { key: 'Basic', label: 'Basic', note: '基础：旋转+重力' },
            { key: 'Dash', label: 'Dash', note: '冲刺：蓄力→加速→减速' },
            { key: 'Seek', label: 'Seek', note: '追踪：寻找NPC并转向' },
            { key: 'Boomerang', label: 'Boomerang', note: '回旋镖：飞出→折返' },
            { key: 'Curve', label: 'Curve', note: '曲线：持续旋转速度向量' }
        ],
        // 各个模式的独立状态
        dashState: { phase: 'windup' as const, timer: 0 },
        seekState: { targetFound: false, targetId: -1 },
        boomerangState: { phase: 'out' as const, timer: 0, startPos: vec(0, 0) },
        curveState: { angle: 0 },
        autoDemo: true,
        autoDemoTimer: 0
    };
}

export function updateAI(state: any, input: AnimAIInput, dt: number) {
    if (!state.__init) {
        Object.assign(state, initState());
        state.__init = true;
    }

    state.time += dt;

    const player = input.player?.pos || vec(0, 80);
    state.playerPos = player;

    // 自动演示切换
    if (state.autoDemo && !input.lockedState) {
        state.autoDemoTimer += dt;
        if (state.autoDemoTimer > 5) {
            state.autoDemoTimer = 0;
            const modes = ['Basic', 'Dash', 'Seek', 'Boomerang', 'Curve'];
            const currentIdx = modes.indexOf(state.selectedMode);
            state.selectedMode = modes[(currentIdx + 1) % modes.length];
        }
    }

    // 切换模式时重置
    if (input.lockedState && input.lockedState !== state.selectedMode) {
        state.selectedMode = String(input.lockedState);
        resetProjectile(state);
    }

    // 保持单个弹幕
    if (state.projectiles.length === 0) {
        resetProjectile(state);
    }

    const proj = state.projectiles[0];
    if (!proj) return;

    // 根据模式更新
    switch (state.selectedMode) {
        case 'Basic':
            updateBasicAI(proj, state, dt);
            break;
        case 'Dash':
            updateDashAI(proj, state, dt);
            break;
        case 'Seek':
            updateSeekAI(proj, state, dt);
            break;
        case 'Boomerang':
            updateBoomerangAI(proj, state, dt, player);
            break;
        case 'Curve':
            updateCurveAI(proj, state, dt);
            break;
    }

    // 更新拖尾
    proj.trail.push({ x: proj.pos.x, y: proj.pos.y });
    if (proj.trail.length > 40) proj.trail.shift();

    // UI 状态
    state.uiStates.forEach((s: { key: string; note?: string }) => {
        s.note = getModeNote(state.selectedMode);
    });
}

function resetProjectile(state: any) {
    state.projectiles = [{
        pos: vec(0, 0),
        vel: vec(120, 0),
        rotation: 0,
        mode: state.selectedMode,
        timer: 0,
        trail: []
    }];
    state.dashState = { phase: 'windup', timer: 0 };
    state.boomerangState = { phase: 'out', timer: 0, startPos: vec(0, 0) };
    state.curveState = { angle: 0 };
}

function getModeNote(mode: string): string {
    switch (mode) {
        case 'Basic': return '基础：旋转+重力+计时器';
        case 'Dash': return '冲刺：蓄力→加速→减速';
        case 'Seek': return '追踪：寻找NPC并平滑转向';
        case 'Boomerang': return '回旋镖：飞出→折返→接住';
        case 'Curve': return '曲线：每帧旋转向量';
        default: return '';
    }
}

// ========== AI 更新函数 ==========

function updateBasicAI(proj: Projectile, state: any, dt: number) {
    proj.timer += dt;

    // 旋转跟随速度方向
    if (len(proj.vel) > 1) {
        proj.rotation = Math.atan2(proj.vel.y, proj.vel.x);
    }

    // 前 2 秒加速，之后受重力
    if (proj.timer <= 2) {
        proj.vel = mul(proj.vel, 1.01); // 轻微加速
    } else {
        proj.vel.y += 80 * dt; // 重力
    }

    proj.pos = add(proj.pos, mul(proj.vel, dt));

    // 边界重置
    if (Math.abs(proj.pos.x) > 300 || proj.pos.y > 200) {
        resetProjectile(state);
    }
}

function updateDashAI(proj: Projectile, state: any, dt: number) {
    const dash = state.dashState;
    dash.timer += dt;

    if (dash.phase === 'windup') {
        // 蓄力阶段：减速
        proj.vel = mul(proj.vel, 0.92);
        if (dash.timer > 0.8) {
            dash.phase = 'dash';
            dash.timer = 0;
            // 朝向玩家方向冲刺
            const dir = norm(sub(state.playerPos, proj.pos));
            proj.vel = mul(dir, 400);
        }
    } else if (dash.phase === 'dash') {
        // 冲刺阶段
        if (dash.timer > 0.3) {
            dash.phase = 'cooldown';
            dash.timer = 0;
        }
    } else {
        // 减速停止
        proj.vel = mul(proj.vel, 0.95);
        if (dash.timer > 0.8) {
            resetProjectile(state);
            dash.phase = 'windup';
            dash.timer = 0;
        }
    }

    proj.pos = add(proj.pos, mul(proj.vel, dt));
    if (len(proj.vel) > 1) {
        proj.rotation = Math.atan2(proj.vel.y, proj.vel.x);
    }
}

function updateSeekAI(proj: Projectile, state: any, dt: number) {
    // 模拟 NPC 目标
    const targetPos = vec(
        Math.sin(state.time * 0.5) * 150,
        -80 + Math.cos(state.time * 0.3) * 60
    );
    state.npcPos = targetPos;

    const toTarget = sub(targetPos, proj.pos);
    const direction = norm(toTarget);

    // 平滑转向
    const turnRate = 2.0;
    proj.vel = lerpVec(proj.vel, mul(direction, 140), turnRate * dt);

    proj.pos = add(proj.pos, mul(proj.vel, dt));
    if (len(proj.vel) > 1) {
        proj.rotation = Math.atan2(proj.vel.y, proj.vel.x);
    }

    // 重置条件
    if (len(toTarget) < 20) {
        resetProjectile(state);
    }
}

function updateBoomerangAI(proj: Projectile, state: any, dt: number, player: Vec2) {
    const boom = state.boomerangState;
    boom.timer += dt;

    if (boom.phase === 'out') {
        // 飞出阶段
        if (boom.timer < 0.5) {
            // 保持方向
        } else {
            boom.phase = 'return';
            boom.timer = 0;
        }
    } else {
        // 折返阶段：飞向玩家
        const toPlayer = sub(player, proj.pos);
        const dir = norm(toPlayer);
        proj.vel = lerpVec(proj.vel, mul(dir, 180), 3 * dt);

        // 被接住
        if (len(toPlayer) < 30) {
            resetProjectile(state);
            boom.phase = 'out';
            boom.timer = 0;
        }
    }

    proj.pos = add(proj.pos, mul(proj.vel, dt));
    proj.rotation += 4 * dt; // 持续旋转
}

function updateCurveAI(proj: Projectile, state: any, dt: number) {
    state.curveState.angle += 1.5 * dt; // 弧度变化

    // 旋转速度向量
    const turnRate = 0.12;
    proj.vel = rotate(proj.vel, turnRate);
    proj.vel = mul(norm(proj.vel), 100); // 保持速度大小

    proj.pos = add(proj.pos, mul(proj.vel, dt));
    if (len(proj.vel) > 1) {
        proj.rotation = Math.atan2(proj.vel.y, proj.vel.x);
    }

    // 边界重置
    if (Math.abs(proj.pos.x) > 280 || Math.abs(proj.pos.y) > 180) {
        resetProjectile(state);
    }
}

// ========== 渲染函数 ==========

export function render(state: any, input: any, gfx: AnimGfx2D) {
    const g = gfx.g;
    const width = gfx.width;
    const height = gfx.height;
    const center = gfx.center?.() || { x: width * 0.5, y: height * 0.56 };
    const player = input.player?.pos || vec(0, 80);

    function toScreen(p: Vec2) {
        return { x: center.x + p.x, y: center.y + p.y };
    }

    // 清屏
    g.fillStyle = '#0a0a0f';
    g.fillRect(0, 0, width, height);

    // 网格
    g.strokeStyle = 'rgba(255,255,255,0.04)';
    g.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x <= width; x += gridStep) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.stroke();
    }

    // 玩家
    const sp = toScreen(player);
    g.save();
    g.fillStyle = 'rgba(120, 200, 255, 0.95)';
    g.beginPath(); g.arc(sp.x, sp.y, 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(120, 200, 255, 0.35)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(sp.x, sp.y, 28, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.font = '11px system-ui, sans-serif';
    g.fillText('You', sp.x - 10, sp.y + 32);
    g.restore();

    // NPC（仅 Seek 模式显示）
    if (state.selectedMode === 'Seek') {
        const npcScreen = toScreen(state.npcPos);
        g.save();
        g.fillStyle = 'rgba(255, 80, 80, 0.9)';
        g.beginPath(); g.arc(npcScreen.x, npcScreen.y, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.font = '11px system-ui, sans-serif';
        g.fillText('NPC', npcScreen.x - 11, npcScreen.y + 30);
        g.restore();
    }

    // 弹幕
    const proj = state.projectiles[0];
    if (proj) {
        const pp = toScreen(proj.pos);

        // 拖尾
        g.save();
        for (let i = 0; i < proj.trail.length; i++) {
            const t = proj.trail[i];
            const ts = toScreen(t);
            const alpha = (i / proj.trail.length) * 0.4;
            const size = (i / proj.trail.length) * 6;
            g.fillStyle = `rgba(255, 180, 80, ${alpha})`;
            g.beginPath(); g.arc(ts.x, ts.y, size, 0, Math.PI * 2); g.fill();
        }
        g.restore();

        // 弹幕主体
        g.save();
        g.translate(pp.x, pp.y);
        g.rotate(proj.rotation);

        // 箭头形状
        g.fillStyle = 'rgba(255, 160, 60, 0.95)';
        g.beginPath();
        g.moveTo(14, 0);
        g.lineTo(-10, -8);
        g.lineTo(-6, 0);
        g.lineTo(-10, 8);
        g.closePath();
        g.fill();

        g.strokeStyle = 'rgba(255, 200, 100, 0.6)';
        g.lineWidth = 1.5;
        g.stroke();

        g.restore();

        // 速度方向指示
        if (len(proj.vel) > 10) {
            const velEnd = add(pp, mul(proj.vel, 0.15));
            g.strokeStyle = 'rgba(120, 200, 255, 0.5)';
            g.lineWidth = 1.5;
            g.beginPath();
            g.moveTo(pp.x, pp.y);
            g.lineTo(velEnd.x, velEnd.y);
            g.stroke();
        }
    }

    // 模式说明文字
    g.save();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.font = '13px system-ui, sans-serif';
    const modeDesc: Record<string, string> = {
        Basic: 'Basic: 旋转 + 重力 + 计时器状态机',
        Dash: 'Dash: 蓄力(减速) → 冲刺(加速) → 减速停止',
        Seek: 'Seek: 追踪目标 + 平滑转向 (Lerp)',
        Boomerang: 'Boomerang: 飞出 → 检测最远 → 折返玩家',
        Curve: 'Curve: 每帧旋转向量 (RotatedBy)'
    };
    g.fillText(modeDesc[state.selectedMode] || state.selectedMode, 12, 24);
    g.restore();

    // HUD
    if (input.ui) {
        input.ui.badges.set(
            `Mode: ${state.selectedMode}`,
            state.autoDemo ? 'Auto Demo' : 'Manual',
            `t=${state.time.toFixed(1)}s`
        );
        input.ui.states.setActive(state.selectedMode);
        input.ui.footer.setRight('拖拽玩家 | 点击状态锁定');
        input.ui.footer.setProgress01((state.time % 5) / 5);
    }

    // 暂停覆盖层
    if (input.paused) {
        g.fillStyle = 'rgba(0,0,0,0.4)';
        g.fillRect(0, 0, width, height);
        g.fillStyle = 'rgba(255,255,255,0.8)';
        g.font = '14px system-ui, sans-serif';
        g.fillText('PAUSED', 12, 22);
    }
}
