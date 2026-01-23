/**
 * 弹幕 AI 模式 4：回旋镖
 * 演示：飞出 → 检测最远 → 折返玩家
 */
function vec(x, y) { return { x, y }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function mul(a, s) { return { x: a.x * s, y: a.y * s }; }
function len(a) { return Math.hypot(a.x, a.y); }
function norm(a) { const l = len(a) || 1; return mul(a, 1 / l); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpVec(a, b, t) {
    return vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
}
function createState(_mode) {
    return {
        time: 0,
        autoDemo: true,
        autoDemoTimer: 0,
        projectiles: [],
        playerPos: { x: 0, y: 80 },
        trail: [],
        boomState: { phase: 'out', timer: 0 }
    };
}
function resetProjectile(state) {
    state.projectiles = [{
            pos: { x: 0, y: 0 },
            vel: { x: 120, y: 0 },
            rotation: 0,
            timer: 0
        }];
    state.trail = [];
}
function updateTrail(state) {
    const proj = state.projectiles[0];
    if (proj) {
        state.trail.push({ x: proj.pos.x, y: proj.pos.y });
        if (state.trail.length > 40)
            state.trail.shift();
    }
}
function render(state, input, gfx, modeName) {
    const g = gfx.g;
    const width = gfx.width;
    const height = gfx.height;
    const center = gfx.center?.() || { x: width * 0.5, y: height * 0.56 };
    const player = input.player?.pos || { x: 0, y: 80 };
    function toScreen(p) {
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
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, height);
        g.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(width, y);
        g.stroke();
    }
    // 玩家
    const sp = toScreen(player);
    g.save();
    g.fillStyle = 'rgba(120, 200, 255, 0.95)';
    g.beginPath();
    g.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(120, 200, 255, 0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(sp.x, sp.y, 28, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.font = '11px system-ui, sans-serif';
    g.fillText('You', sp.x - 10, sp.y + 32);
    g.restore();
    // 拖尾
    for (let i = 0; i < state.trail.length; i++) {
        const t = state.trail[i];
        const ts = toScreen(t);
        const alpha = (i / state.trail.length) * 0.4;
        const size = (i / state.trail.length) * 6;
        g.fillStyle = `rgba(255, 180, 80, ${alpha})`;
        g.beginPath();
        g.arc(ts.x, ts.y, size, 0, Math.PI * 2);
        g.fill();
    }
    // 弹幕
    const proj = state.projectiles[0];
    if (proj) {
        const pp = toScreen(proj.pos);
        g.save();
        g.translate(pp.x, pp.y);
        g.rotate(proj.rotation);
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
        const velLen = Math.hypot(proj.vel.x, proj.vel.y);
        if (velLen > 10) {
            const velEnd = { x: pp.x + proj.vel.x * 0.15, y: pp.y + proj.vel.y * 0.15 };
            g.strokeStyle = 'rgba(120, 200, 255, 0.5)';
            g.lineWidth = 1.5;
            g.beginPath();
            g.moveTo(pp.x, pp.y);
            g.lineTo(velEnd.x, velEnd.y);
            g.stroke();
        }
    }
    // HUD
    if (input.ui) {
        input.ui.badges.set(modeName, state.autoDemo ? 'Auto' : 'Manual', `t=${state.time.toFixed(1)}s`);
        input.ui.footer.setRight('拖拽玩家');
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
export function updateAI(state, input, dt) {
    if (!state.__init) {
        Object.assign(state, createState('Boomerang'));
        state.__init = true;
        state.boomState = { phase: 'out', timer: 0 };
        resetProjectile(state);
    }
    state.time += dt;
    // 自动循环
    if (state.autoDemo && !input.lockedState) {
        state.autoDemoTimer += dt;
        if (state.autoDemoTimer > 5) {
            state.autoDemoTimer = 0;
            state.boomState = { phase: 'out', timer: 0 };
            resetProjectile(state);
        }
    }
    const proj = state.projectiles[0];
    if (!proj)
        return;
    const boom = state.boomState;
    boom.timer += dt;
    const player = input.player?.pos || { x: 0, y: 80 };
    state.playerPos = player;
    if (boom.phase === 'out') {
        // 飞出阶段：保持方向飞行
        if (boom.timer < 0.5) {
            // 继续飞出
        }
        else {
            boom.phase = 'return';
            boom.timer = 0;
        }
    }
    else {
        // 折返阶段：飞向玩家
        const toPlayer = sub(player, proj.pos);
        const dir = norm(toPlayer);
        proj.vel = lerpVec(proj.vel, mul(dir, 180), 3 * dt);
        // 被接住
        if (len(toPlayer) < 30) {
            state.boomState = { phase: 'out', timer: 0 };
            resetProjectile(state);
        }
    }
    proj.pos = add(proj.pos, mul(proj.vel, dt));
    proj.rotation += 4 * dt; // 持续旋转
    updateTrail(state);
}
export function renderFn(state, input, gfx) {
    render(state, input, gfx, 'Boomerang: 飞出 → 折返 → 接住');
}
//# sourceMappingURL=4-boomerang.js.map