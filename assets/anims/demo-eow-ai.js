export function updateAI(state, input, dt) {
    if (!state || typeof state !== 'object')
        return;
    if (!input || typeof input !== 'object')
        return;
    const player = input.player && input.player.pos ? input.player.pos : { x: 0, y: 0 };
    const locked = input.lockedState ? String(input.lockedState) : null;
    if (!state.__init) {
        state.__init = true;
        state.time = 0;
        state.hp = 1;
        state.phase = 1;
        state.mode = 'Seek';
        state.modeTimer = 0;
        state.splitDone = false;
        state.uiStates = [
            { key: 'Seek', label: 'Seek', note: '追踪/绕行玩家' },
            { key: 'Coil', label: 'Coil', note: '收缩盘绕' },
            { key: 'Charge', label: 'Charge', note: '高速冲刺' },
            { key: 'Split', label: 'Split', note: '分裂演示' }
        ];
        const segmentCount = 36;
        const spacing = 14;
        const head = { x: 0, y: -220 };
        const vel = { x: 70, y: 10 };
        const segments = [];
        let prev = { x: head.x, y: head.y };
        for (let i = 0; i < segmentCount; i++) {
            prev = { x: prev.x, y: prev.y - spacing };
            segments.push({ x: prev.x, y: prev.y });
        }
        state.worms = [
            {
                head,
                vel,
                segments,
                spacing,
                color: 'rgba(180, 120, 255, 0.92)'
            }
        ];
    }
    state.time += dt;
    state.modeTimer += dt;
    // Artificial HP decay to trigger phase changes in demo
    state.hp = Math.max(0, state.hp - dt * 0.03);
    if (state.phase === 1 && state.hp <= 0.55)
        state.phase = 2;
    // Lock state (from UI)
    if (locked) {
        state.mode = locked;
        state.modeTimer = 0;
    }
    // Auto transitions when not locked
    if (!locked) {
        if (state.mode === 'Seek' && state.modeTimer >= 1.6) {
            state.mode = 'Charge';
            state.modeTimer = 0;
        }
        else if (state.mode === 'Charge' && state.modeTimer >= (state.phase === 2 ? 0.55 : 0.7)) {
            state.mode = 'Coil';
            state.modeTimer = 0;
        }
        else if (state.mode === 'Coil' && state.modeTimer >= 1.2) {
            state.mode = 'Seek';
            state.modeTimer = 0;
        }
    }
    // Trigger a single split demo near mid HP (only if not already split)
    if (!state.splitDone && state.hp <= 0.72 && state.worms && state.worms.length === 1) {
        state.splitDone = true;
        state.mode = 'Split';
        state.modeTimer = 0;
        const w0 = state.worms[0];
        const half = Math.floor((w0.segments.length || 0) / 2);
        const newHead = { x: w0.segments[half].x + 30, y: w0.segments[half].y + 10 };
        const newVel = { x: -w0.vel.x, y: w0.vel.y };
        const newSegs = [];
        let prev = { x: newHead.x, y: newHead.y };
        for (let i = 0; i < half; i++) {
            prev = { x: prev.x - 0.5 * w0.spacing, y: prev.y - w0.spacing };
            newSegs.push({ x: prev.x, y: prev.y });
        }
        w0.segments = w0.segments.slice(0, half);
        state.worms.push({
            head: newHead,
            vel: newVel,
            segments: newSegs,
            spacing: w0.spacing,
            color: 'rgba(120, 220, 170, 0.92)'
        });
    }
    // Split mode returns to Seek after a short period (unless locked)
    if (!locked && state.mode === 'Split' && state.modeTimer >= 0.9) {
        state.mode = 'Seek';
        state.modeTimer = 0;
    }
    const phase = state.phase || 1;
    const baseSpeed = phase === 2 ? 230 : 170;
    const turn = phase === 2 ? 10 : 7;
    // Update each worm
    const worms = Array.isArray(state.worms) ? state.worms : [];
    for (let wi = 0; wi < worms.length; wi++) {
        const w = worms[wi];
        if (!w || !w.head || !w.vel || !Array.isArray(w.segments))
            continue;
        const head = w.head;
        const vel = w.vel;
        const spacing = Number(w.spacing) || 14;
        // Determine target for head based on mode
        let tx = player.x;
        let ty = player.y;
        const t = state.time + wi * 0.8;
        if (state.mode === 'Seek') {
            const r = 120 + wi * 30;
            tx = player.x + Math.cos(t * 1.2) * r;
            ty = player.y + Math.sin(t * 1.1) * (r * 0.5) - 30;
        }
        else if (state.mode === 'Coil') {
            const r = 70 + wi * 18;
            tx = player.x + Math.cos(t * 2.0) * r;
            ty = player.y + Math.sin(t * 1.7) * (r * 0.6) - 20;
        }
        else if (state.mode === 'Charge') {
            tx = player.x;
            ty = player.y;
        }
        else if (state.mode === 'Split') {
            const r = 160 + wi * 50;
            tx = player.x + Math.cos(t * 0.9) * r;
            ty = player.y + Math.sin(t * 0.8) * (r * 0.55) - 10;
        }
        // Steering towards target
        let dx = tx - head.x;
        let dy = ty - head.y;
        let d = Math.hypot(dx, dy) || 1;
        dx /= d;
        dy /= d;
        const speed = state.mode === 'Charge' ? (baseSpeed * (phase === 2 ? 1.55 : 1.35)) : baseSpeed;
        const desiredX = dx * speed;
        const desiredY = dy * speed;
        const lerp = Math.max(0, Math.min(1, turn * dt));
        vel.x = vel.x + (desiredX - vel.x) * lerp;
        vel.y = vel.y + (desiredY - vel.y) * lerp;
        head.x += vel.x * dt;
        head.y += vel.y * dt;
        // Follow chain: keep spacing
        let px = head.x;
        let py = head.y;
        for (let i = 0; i < w.segments.length; i++) {
            const s = w.segments[i];
            let sx = s.x;
            let sy = s.y;
            let vx = px - sx;
            let vy = py - sy;
            let sd = Math.hypot(vx, vy) || 1;
            const minDist = spacing;
            if (sd > minDist) {
                const k = (sd - minDist) / sd;
                sx += vx * k;
                sy += vy * k;
                s.x = sx;
                s.y = sy;
            }
            px = sx;
            py = sy;
        }
    }
}
export function render(state, input, gfx) {
    if (!state || typeof state !== 'object')
        return;
    if (!gfx || !gfx.g)
        return;
    const g = gfx.g;
    const width = Number(gfx.width) || 1;
    const height = Number(gfx.height) || 1;
    const center = gfx.center ? gfx.center() : { x: width * 0.5, y: height * 0.56 };
    const player = input && input.player && input.player.pos ? input.player.pos : { x: 0, y: 0 };
    function toScreen(p) {
        return { x: center.x + p.x, y: center.y + p.y };
    }
    // Clear
    g.clearRect(0, 0, width, height);
    // Grid
    g.save();
    g.strokeStyle = 'rgba(255,255,255,0.05)';
    g.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= width; x += step) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, height);
        g.stroke();
    }
    for (let y = 0; y <= height; y += step) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(width, y);
        g.stroke();
    }
    g.restore();
    // Player
    const sp = toScreen(player);
    g.save();
    g.fillStyle = 'rgba(120, 200, 255, 0.95)';
    g.beginPath();
    g.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(120, 200, 255, 0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(sp.x, sp.y, 26, 0, Math.PI * 2);
    g.stroke();
    g.restore();
    // Worm(s)
    const worms = Array.isArray(state.worms) ? state.worms : [];
    for (let wi = 0; wi < worms.length; wi++) {
        const w = worms[wi];
        if (!w || !w.head || !Array.isArray(w.segments))
            continue;
        const color = w.color || 'rgba(180, 120, 255, 0.92)';
        // Spine line
        g.save();
        g.strokeStyle = color;
        g.lineWidth = 4;
        g.lineCap = 'round';
        g.beginPath();
        const headP = toScreen(w.head);
        g.moveTo(headP.x, headP.y);
        for (let i = 0; i < w.segments.length; i++) {
            const p = toScreen(w.segments[i]);
            g.lineTo(p.x, p.y);
        }
        g.stroke();
        g.restore();
        // Segments
        g.save();
        for (let i = w.segments.length - 1; i >= 0; i--) {
            const p = toScreen(w.segments[i]);
            const r = i === w.segments.length - 1 ? 7 : 6;
            g.fillStyle = 'rgba(0,0,0,0.55)';
            g.beginPath();
            g.arc(p.x, p.y, r + 1, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = color;
            g.beginPath();
            g.arc(p.x, p.y, r, 0, Math.PI * 2);
            g.fill();
        }
        // Head
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.beginPath();
        g.arc(headP.x, headP.y, 13, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = color;
        g.beginPath();
        g.arc(headP.x, headP.y, 12, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.65)';
        g.beginPath();
        g.arc(headP.x - 4, headP.y - 4, 3, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }
    // HUD
    if (input && input.ui) {
        const lock = input.lockedState ? String(input.lockedState) : '';
        const phase = state.phase || 1;
        const hpPct = Math.max(0, Math.min(1, Number(state.hp) || 0)) * 100;
        input.ui.badges.set(`Phase: ${phase}`, lock ? `Mode: ${state.mode} (LOCK)` : `Mode: ${state.mode}`, `HP: ${hpPct.toFixed(0)}%`);
        input.ui.states.setActive(String(state.mode || ''));
        const w0 = worms[0];
        const vx = w0 && w0.vel ? Number(w0.vel.x) : 0;
        const vy = w0 && w0.vel ? Number(w0.vel.y) : 0;
        const speed = Math.hypot(vx, vy);
        const dx = (w0 && w0.head ? (w0.head.x - player.x) : 0);
        const dy = (w0 && w0.head ? (w0.head.y - player.y) : 0);
        const dist = Math.hypot(dx, dy);
        input.ui.footer.setRight(`speed=${speed.toFixed(0)}  dist=${dist.toFixed(0)}  worms=${worms.length}`);
        const loop = 10;
        const t = ((state.time || 0) % loop) / loop;
        input.ui.footer.setProgress01(t);
    }
    // Pause overlay
    if (input && input.paused) {
        g.save();
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(0, 0, width, height);
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
        g.fillText('PAUSED', 12, 24);
        g.restore();
    }
}
//# sourceMappingURL=demo-eow-ai.js.map