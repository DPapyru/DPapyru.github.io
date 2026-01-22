type Vec2 = { x: number; y: number };

function vec(x: number, y: number): Vec2 {
    return { x, y };
}

function add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
}

function mul(a: Vec2, s: number): Vec2 {
    return { x: a.x * s, y: a.y * s };
}

function len(a: Vec2): number {
    return Math.hypot(a.x, a.y);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
    return vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2, color: string) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const head = 8;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

type Mode =
    | 'Approach'
    | 'Hover'
    | 'ChargePrep'
    | 'Charge'
    | 'Recovery'
    | 'Phase2Transition'
    | 'SummonServants';

type Minion = { pos: Vec2; vel: Vec2; life: number };

export default async function run(ctx: any) {
    const stage: HTMLElement = ctx.stage;
    const scene = ctx.ui.createAiAnalysisScene({
        classPrefix: 'animts-eoc',
        heightPx: 420,
        title: 'AI 状态机（简化版，可视化分析）',
        hint: '拖拽玩家/点击状态锁定；暂停可冻结 AI',
        panelPortal: 'page',
        states: [
            { key: 'Approach', label: 'Approach', note: '靠近预定盘旋点' },
            { key: 'Hover', label: 'Hover', note: '绕玩家盘旋' },
            { key: 'ChargePrep', label: 'ChargePrep', note: '预备：锁定玩家' },
            { key: 'Charge', label: 'Charge', note: '冲刺：高速直线' },
            { key: 'Recovery', label: 'Recovery', note: '回收：减速/重定位' },
            { key: 'SummonServants', label: 'Summon', note: '召唤小眼球' },
            { key: 'Phase2Transition', label: 'Phase2', note: '二阶段过渡' }
        ]
    });

    const canvas = scene.canvas.canvas as HTMLCanvasElement;
    const g = scene.canvas.g as CanvasRenderingContext2D;

    function pxVar(name: string, fallback: string) {
        const s = getComputedStyle(document.documentElement).getPropertyValue(name);
        return String(s || '').trim() || fallback;
    }

    const COLORS = {
        grid: 'rgba(255,255,255,0.06)',
        text: pxVar('--text-color', '#fff'),
        text2: pxVar('--text-secondary', 'rgba(255,255,255,0.75)'),
        player: 'rgba(120, 200, 255, 0.95)',
        eye: 'rgba(255, 90, 90, 0.95)',
        eye2: 'rgba(255, 180, 180, 0.85)',
        minion: 'rgba(255, 200, 120, 0.85)',
        vel: 'rgba(120, 200, 255, 0.75)',
        aim: 'rgba(255, 200, 200, 0.65)'
    };

    const player = { pos: vec(0, 0) };
    const eye = {
        pos: vec(0, -170),
        vel: vec(0, 0),
        hp: 1,
        phase: 1,
        mode: 'Approach' as Mode,
        timer: 0,
        charges: 0,
        orbitAngle: 0
    };

    const minions: Minion[] = [];
    const SIM = {
        time: 0,
        cycle: 0
    };

    function worldCenter(): Vec2 {
        const width = scene.canvas.width;
        const height = scene.canvas.height;
        return vec(width * 0.5, height * 0.56);
    }

    function toScreen(p: Vec2): Vec2 {
        const c = worldCenter();
        return add(c, p);
    }

    function toWorld(screen: Vec2): Vec2 {
        return sub(screen, worldCenter());
    }

    function spawnMinions(count: number) {
        const base = eye.pos;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + eye.orbitAngle * 0.3;
            const dir = vec(Math.cos(a), Math.sin(a));
            minions.push({
                pos: add(base, mul(dir, 24)),
                vel: mul(dir, 90),
                life: 2.2
            });
        }
    }

    function setMode(mode: Mode) {
        eye.mode = mode;
        eye.timer = 0;
        scene.states.setActive(mode);
    }

    function updateHud() {
        const lock = scene.states.lock.get();
        scene.badges.set(
            `Phase: ${eye.phase}`,
            lock ? `Mode: ${eye.mode} (LOCK)` : `Mode: ${eye.mode}`,
            `HP: ${(eye.hp * 100).toFixed(0)}%`
        );
        const speed = len(eye.vel);
        const dist = len(sub(eye.pos, player.pos));
        scene.footer.setRight(`speed=${speed.toFixed(0)}  dist=${dist.toFixed(0)}  charges=${eye.charges}`);
    }

    function updateAI(dt: number) {
        eye.timer += dt;
        SIM.time += dt;

        const forcedMode = scene.states.lock.get() as Mode | null;
        if (forcedMode && eye.mode !== forcedMode) setMode(forcedMode);
        const transitionsAllowed = !forcedMode;
        const phase1ChargeSpeed = 260;
        const phase2ChargeSpeed = 380;
        const hoverRadius = 170;

        const targetOrbit = add(player.pos, vec(Math.cos(eye.orbitAngle) * hoverRadius, -50 + Math.sin(eye.orbitAngle) * 70));

        if (eye.mode === 'Approach') {
            const target = add(player.pos, vec(0, -160));
            const toTarget = sub(target, eye.pos);
            eye.vel = add(eye.vel, mul(toTarget, dt * 2.4));
            eye.vel = mul(eye.vel, 0.92);
            eye.pos = add(eye.pos, mul(eye.vel, dt));
            if (len(toTarget) < 16 && transitionsAllowed) setMode('Hover');
        } else if (eye.mode === 'Hover') {
            eye.orbitAngle += dt * (eye.phase === 1 ? 1.1 : 1.6);
            const toTarget = sub(targetOrbit, eye.pos);
            eye.vel = add(eye.vel, mul(toTarget, dt * 3.4));
            eye.vel = mul(eye.vel, 0.88);
            eye.pos = add(eye.pos, mul(eye.vel, dt));

            const hoverTime = eye.phase === 1 ? 1.2 : 0.7;
            if (eye.timer >= hoverTime && transitionsAllowed) setMode('ChargePrep');
        } else if (eye.mode === 'ChargePrep') {
            const toTarget = sub(targetOrbit, eye.pos);
            eye.vel = add(eye.vel, mul(toTarget, dt * 2.0));
            eye.vel = mul(eye.vel, 0.86);
            eye.pos = add(eye.pos, mul(eye.vel, dt));

            const prepTime = eye.phase === 1 ? 0.55 : 0.38;
            if (eye.timer >= prepTime) {
                const dir = sub(player.pos, eye.pos);
                const d = len(dir) || 1;
                const speed = eye.phase === 1 ? phase1ChargeSpeed : phase2ChargeSpeed;
                eye.vel = mul(dir, speed / d);
                if (transitionsAllowed) setMode('Charge');
            }
        } else if (eye.mode === 'Charge') {
            eye.pos = add(eye.pos, mul(eye.vel, dt));
            eye.vel = mul(eye.vel, 0.995);

            const chargeTime = eye.phase === 1 ? 0.72 : 0.58;
            if (eye.timer >= chargeTime && transitionsAllowed) {
                eye.charges += 1;
                setMode('Recovery');
            }
        } else if (eye.mode === 'Recovery') {
            const toTarget = sub(targetOrbit, eye.pos);
            eye.vel = add(eye.vel, mul(toTarget, dt * 2.2));
            eye.vel = mul(eye.vel, 0.84);
            eye.pos = add(eye.pos, mul(eye.vel, dt));

            if (eye.timer >= 0.48 && transitionsAllowed) {
                const chargesPerCycle = eye.phase === 1 ? 3 : 4;
                if (eye.charges >= chargesPerCycle) {
                    eye.charges = 0;
                    SIM.cycle += 1;
                    eye.hp = clamp(eye.hp - 0.12, 0, 1);
                    if (eye.phase === 1 && eye.hp <= 0.5) {
                        eye.phase = 2;
                        setMode('Phase2Transition');
                        spawnMinions(6);
                    } else {
                        setMode('Hover');
                    }
                } else {
                    if (eye.phase === 2 && eye.charges === 2) {
                        setMode('SummonServants');
                        spawnMinions(8);
                    } else {
                        setMode('ChargePrep');
                    }
                }
            }
        } else if (eye.mode === 'SummonServants') {
            // Visual-only pause: show summon event, then resume charging
            eye.vel = mul(eye.vel, 0.90);
            eye.pos = add(eye.pos, mul(eye.vel, dt));
            if (eye.timer >= 0.55 && transitionsAllowed) setMode('ChargePrep');
        } else if (eye.mode === 'Phase2Transition') {
            // Dramatic shake/settle
            eye.orbitAngle += dt * 2.4;
            const target = add(player.pos, vec(0, -160));
            const toTarget = sub(target, eye.pos);
            eye.vel = add(eye.vel, mul(toTarget, dt * 2.6));
            eye.vel = mul(eye.vel, 0.84);
            eye.pos = add(eye.pos, mul(eye.vel, dt));
            if (eye.timer >= 1.2 && transitionsAllowed) setMode('ChargePrep');
        }

        // Update minions
        for (let i = minions.length - 1; i >= 0; i--) {
            const m = minions[i];
            m.life -= dt;
            m.pos = add(m.pos, mul(m.vel, dt));
            m.vel = mul(m.vel, 0.985);
            if (m.life <= 0) minions.splice(i, 1);
        }

        updateHud();
    }

    function drawGrid() {
        g.save();
        g.strokeStyle = COLORS.grid;
        g.lineWidth = 1;
        const width = scene.canvas.width;
        const height = scene.canvas.height;
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
    }

    function drawPlayer() {
        const p = toScreen(player.pos);
        g.save();
        g.fillStyle = COLORS.player;
        g.beginPath();
        g.arc(p.x, p.y, 8, 0, Math.PI * 2);
        g.fill();

        g.strokeStyle = 'rgba(120, 200, 255, 0.35)';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(p.x, p.y, 26, 0, Math.PI * 2);
        g.stroke();
        g.restore();
    }

    function drawEye(paused: boolean) {
        const e = toScreen(eye.pos);
        const speed = len(eye.vel);
        const radius = eye.phase === 1 ? 26 : 30;
        const pulse = paused ? 0 : Math.sin(SIM.time * 6) * 1.2;

        // body
        g.save();
        g.fillStyle = eye.phase === 1 ? COLORS.eye : COLORS.eye2;
        g.beginPath();
        g.arc(e.x, e.y, radius + pulse, 0, Math.PI * 2);
        g.fill();

        // pupil aims at player
        const dir = sub(player.pos, eye.pos);
        const d = len(dir) || 1;
        const aim = mul(dir, 1 / d);
        const pupil = add(e, mul(aim, 9));
        g.fillStyle = 'rgba(0,0,0,0.72)';
        g.beginPath();
        g.arc(pupil.x, pupil.y, 9, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.beginPath();
        g.arc(pupil.x - 3, pupil.y - 3, 3, 0, Math.PI * 2);
        g.fill();

        // phase2 teeth hint
        if (eye.phase === 2) {
            g.strokeStyle = 'rgba(0,0,0,0.45)';
            g.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const inner = radius - 5;
                const outer = radius + 4;
                g.beginPath();
                g.moveTo(e.x + Math.cos(a) * inner, e.y + Math.sin(a) * inner);
                g.lineTo(e.x + Math.cos(a) * outer, e.y + Math.sin(a) * outer);
                g.stroke();
            }
        }

        // velocity vector
        if (speed > 20) {
            const to = add(e, mul(eye.vel, 0.12));
            drawArrow(g, e, to, COLORS.vel);
        }

        // aim line during prep
        if (eye.mode === 'ChargePrep') {
            const p = toScreen(player.pos);
            drawArrow(g, e, lerpVec(e, p, 0.75), COLORS.aim);
        }

        g.restore();
    }

    function drawMinions() {
        g.save();
        minions.forEach((m) => {
            const p = toScreen(m.pos);
            const alpha = clamp(m.life / 2.2, 0, 1);
            g.fillStyle = COLORS.minion.replace('0.85', String(0.2 + alpha * 0.75));
            g.beginPath();
            g.arc(p.x, p.y, 6, 0, Math.PI * 2);
            g.fill();
        });
        g.restore();
    }

    function drawOverlayText(paused: boolean) {
        if (!paused) return;
        g.save();
        const width = scene.canvas.width;
        const height = scene.canvas.height;
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(0, 0, width, height);
        g.fillStyle = COLORS.text;
        g.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
        g.fillText('PAUSED', 12, 24);
        g.restore();
    }

    function render(paused: boolean) {
        const width = scene.canvas.width;
        const height = scene.canvas.height;
        g.clearRect(0, 0, width, height);
        drawGrid();
        drawPlayer();
        drawMinions();
        drawEye(paused);
        drawOverlayText(paused);

        // timeline progress: loop every ~8s for display
        const loop = 8;
        const t = (SIM.time % loop) / loop;
        scene.footer.setProgress01(t);
    }

    // Interaction: click/drag to reposition the player; double click to reset.
    (function attachDragInteractions() {
        let dragging = false;

        function setPlayerFromEvent(event: PointerEvent) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const p = toWorld(vec(x, y));
            const width = scene.canvas.width;
            const height = scene.canvas.height;
            const limitX = Math.max(60, width * 0.5 - 20);
            const limitY = Math.max(60, height * 0.5 - 20);
            player.pos = vec(clamp(p.x, -limitX, limitX), clamp(p.y, -limitY, limitY));
        }

        function onDown(event: PointerEvent) {
            dragging = true;
            try { canvas.setPointerCapture(event.pointerId); } catch (_) { }
            setPlayerFromEvent(event);
        }

        function onMove(event: PointerEvent) {
            if (!dragging) return;
            setPlayerFromEvent(event);
        }

        function onUp(event: PointerEvent) {
            dragging = false;
            try { canvas.releasePointerCapture(event.pointerId); } catch (_) { }
        }

        function onDblClick() {
            player.pos = vec(0, 0);
        }

        canvas.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        canvas.addEventListener('dblclick', onDblClick);
        ctx.onDispose(() => {
            canvas.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            canvas.removeEventListener('dblclick', onDblClick);
        });
    })();

    // Bind loop: only provide AI update + draw.
    ctx.ui.runLoop({
        update: (dt: number) => updateAI(dt),
        draw: (paused: boolean) => {
            render(paused);
            updateHud();
        }
    });

    // Keep the async function alive until disposed, so errors surface in runtime UI.
    await new Promise<void>((resolve) => {
        if (!ctx.signal || typeof ctx.signal.addEventListener !== 'function') return resolve();
        ctx.signal.addEventListener('abort', () => resolve(), { once: true });
    });
}
