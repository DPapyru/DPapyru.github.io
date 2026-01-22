import type { Vec2 } from '@animts/types';

export function vec2(x: number, y: number): Vec2 {
    return { x, y };
}

export function add2(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y };
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
}

export function mul2(a: Vec2, s: number): Vec2 {
    return { x: a.x * s, y: a.y * s };
}

export function len2(a: Vec2): number {
    return Math.hypot(a.x, a.y);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export type Cartesian2D = {
    origin: Vec2;
    unitPx: number;
    yUp: boolean;
    toScreen: (p: Vec2) => Vec2;
    toWorld: (screen: Vec2) => Vec2;
};

export function createCartesian2D(options: { origin: Vec2; unitPx?: number; yUp?: boolean }): Cartesian2D {
    const origin = options.origin;
    const unitPx = Math.max(1e-6, Number(options.unitPx) || 60);
    const yUp = options.yUp !== false;

    function toScreen(p: Vec2): Vec2 {
        const sy = yUp ? -p.y : p.y;
        return { x: origin.x + p.x * unitPx, y: origin.y + sy * unitPx };
    }

    function toWorld(screen: Vec2): Vec2 {
        const dx = (screen.x - origin.x) / unitPx;
        const dy = (screen.y - origin.y) / unitPx;
        return { x: dx, y: yUp ? -dy : dy };
    }

    return { origin, unitPx, yUp, toScreen, toWorld };
}

export function drawAxes2D(
    g: CanvasRenderingContext2D,
    cs: Cartesian2D,
    options?: {
        xMin?: number;
        xMax?: number;
        yMin?: number;
        yMax?: number;
        gridStep?: number;
        tickStep?: number;
        axisColor?: string;
        gridColor?: string;
        textColor?: string;
        font?: string;
        showGrid?: boolean;
        showLabels?: boolean;
    }
) {
    const opts = options && typeof options === 'object' ? options : {};
    const axisColor = opts.axisColor || 'rgba(255,255,255,0.55)';
    const gridColor = opts.gridColor || 'rgba(255,255,255,0.08)';
    const textColor = opts.textColor || 'rgba(255,255,255,0.75)';
    const font = opts.font || '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
    const showGrid = opts.showGrid !== false;
    const showLabels = opts.showLabels !== false;

    const xMin = Number.isFinite(Number(opts.xMin)) ? Number(opts.xMin) : -6;
    const xMax = Number.isFinite(Number(opts.xMax)) ? Number(opts.xMax) : 6;
    const yMin = Number.isFinite(Number(opts.yMin)) ? Number(opts.yMin) : -3.5;
    const yMax = Number.isFinite(Number(opts.yMax)) ? Number(opts.yMax) : 3.5;

    const gridStep = Math.max(1e-6, Number(opts.gridStep) || 1);
    const tickStep = Math.max(1e-6, Number(opts.tickStep) || 1);

    g.save();
    g.lineWidth = 1;

    if (showGrid) {
        g.strokeStyle = gridColor;
        for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax + 1e-9; x += gridStep) {
            const a = cs.toScreen({ x, y: yMin });
            const b = cs.toScreen({ x, y: yMax });
            g.beginPath();
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.stroke();
        }
        for (let y = Math.ceil(yMin / gridStep) * gridStep; y <= yMax + 1e-9; y += gridStep) {
            const a = cs.toScreen({ x: xMin, y });
            const b = cs.toScreen({ x: xMax, y });
            g.beginPath();
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.stroke();
        }
    }

    // Axes
    g.strokeStyle = axisColor;
    const xAxisA = cs.toScreen({ x: xMin, y: 0 });
    const xAxisB = cs.toScreen({ x: xMax, y: 0 });
    g.beginPath();
    g.moveTo(xAxisA.x, xAxisA.y);
    g.lineTo(xAxisB.x, xAxisB.y);
    g.stroke();

    const yAxisA = cs.toScreen({ x: 0, y: yMin });
    const yAxisB = cs.toScreen({ x: 0, y: yMax });
    g.beginPath();
    g.moveTo(yAxisA.x, yAxisA.y);
    g.lineTo(yAxisB.x, yAxisB.y);
    g.stroke();

    // Ticks + labels
    g.strokeStyle = axisColor;
    g.fillStyle = textColor;
    g.font = font;

    for (let x = Math.ceil(xMin / tickStep) * tickStep; x <= xMax + 1e-9; x += tickStep) {
        const p = cs.toScreen({ x, y: 0 });
        g.beginPath();
        g.moveTo(p.x, p.y - 4);
        g.lineTo(p.x, p.y + 4);
        g.stroke();
        if (showLabels && Math.abs(x) > 1e-9) {
            g.fillText(String(Number(x.toFixed(6))), p.x + 2, p.y + 14);
        }
    }

    for (let y = Math.ceil(yMin / tickStep) * tickStep; y <= yMax + 1e-9; y += tickStep) {
        const p = cs.toScreen({ x: 0, y });
        g.beginPath();
        g.moveTo(p.x - 4, p.y);
        g.lineTo(p.x + 4, p.y);
        g.stroke();
        if (showLabels && Math.abs(y) > 1e-9) {
            g.fillText(String(Number(y.toFixed(6))), p.x + 6, p.y - 2);
        }
    }

    g.restore();
}

export function plotFunction2D(
    g: CanvasRenderingContext2D,
    cs: Cartesian2D,
    f: (x: number) => number,
    options?: {
        xMin?: number;
        xMax?: number;
        samples?: number;
        strokeStyle?: string;
        lineWidth?: number;
    }
) {
    const opts = options && typeof options === 'object' ? options : {};
    const xMin = Number.isFinite(Number(opts.xMin)) ? Number(opts.xMin) : -6;
    const xMax = Number.isFinite(Number(opts.xMax)) ? Number(opts.xMax) : 6;
    const samples = Math.max(8, Math.floor(Number(opts.samples) || 240));
    const strokeStyle = opts.strokeStyle || 'rgba(120, 200, 255, 0.9)';
    const lineWidth = Math.max(1, Number(opts.lineWidth) || 2);

    g.save();
    g.strokeStyle = strokeStyle;
    g.lineWidth = lineWidth;
    g.lineJoin = 'round';
    g.lineCap = 'round';

    let started = false;
    g.beginPath();
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = xMin + (xMax - xMin) * t;
        const y = f(x);
        if (!Number.isFinite(y)) {
            started = false;
            continue;
        }
        const p = cs.toScreen({ x, y });
        if (!started) {
            g.moveTo(p.x, p.y);
            started = true;
        } else {
            g.lineTo(p.x, p.y);
        }
    }
    g.stroke();
    g.restore();
}

export function fillIntegralArea2D(
    g: CanvasRenderingContext2D,
    cs: Cartesian2D,
    f: (x: number) => number,
    a: number,
    b: number,
    options?: {
        samples?: number;
        fillStyle?: string;
        baseline?: number;
    }
) {
    const opts = options && typeof options === 'object' ? options : {};
    const samples = Math.max(8, Math.floor(Number(opts.samples) || 220));
    const fillStyle = opts.fillStyle || 'rgba(255, 180, 120, 0.18)';
    const baseline = Number.isFinite(Number(opts.baseline)) ? Number(opts.baseline) : 0;

    const minX = Math.min(a, b);
    const maxX = Math.max(a, b);

    g.save();
    g.fillStyle = fillStyle;
    g.beginPath();

    const p0 = cs.toScreen({ x: minX, y: baseline });
    g.moveTo(p0.x, p0.y);
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = minX + (maxX - minX) * t;
        const y = f(x);
        const p = cs.toScreen({ x, y: Number.isFinite(y) ? y : baseline });
        g.lineTo(p.x, p.y);
    }
    const p1 = cs.toScreen({ x: maxX, y: baseline });
    g.lineTo(p1.x, p1.y);
    g.closePath();
    g.fill();
    g.restore();
}

export function drawArrow2D(
    g: CanvasRenderingContext2D,
    from: Vec2,
    to: Vec2,
    options?: {
        color?: string;
        lineWidth?: number;
        headPx?: number;
        label?: string;
        font?: string;
        labelOffsetPx?: { x: number; y: number };
    }
) {
    const opts = options && typeof options === 'object' ? options : {};
    const color = opts.color || 'rgba(255,255,255,0.85)';
    const lineWidth = Math.max(1, Number(opts.lineWidth) || 2);
    const head = Math.max(4, Number(opts.headPx) || 10);
    const label = opts.label ? String(opts.label) : '';
    const font = opts.font || '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
    const labelOffset = opts.labelOffsetPx || { x: 6, y: 4 };

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    g.save();
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = lineWidth;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    g.beginPath();
    g.moveTo(from.x, from.y);
    g.lineTo(to.x, to.y);
    g.stroke();

    g.beginPath();
    g.moveTo(to.x, to.y);
    g.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
    g.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
    g.closePath();
    g.fill();

    if (label) {
        g.font = font;
        g.fillText(label, to.x + labelOffset.x, to.y + labelOffset.y);
    }

    g.restore();
}
