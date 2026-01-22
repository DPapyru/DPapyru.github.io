import type { Vec2, Vec3 } from '@animts/types';

export function vec3(x: number, y: number, z: number): Vec3 {
    return { x, y, z };
}

export function add3(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function mul3(a: Vec3, s: number): Vec3 {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function projectIsometric(p: Vec3, options?: { yawRad?: number; pitchRad?: number }): Vec2 {
    const opts = options && typeof options === 'object' ? options : {};
    const yaw = Number.isFinite(Number(opts.yawRad)) ? Number(opts.yawRad) : Math.PI / 4;
    const pitch = Number.isFinite(Number(opts.pitchRad)) ? Number(opts.pitchRad) : Math.atan2(1, Math.sqrt(2));

    // Rotate around Y (yaw), then X (pitch)
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    let x = p.x * cy + p.z * sy;
    let z = -p.x * sy + p.z * cy;

    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const y = p.y * cx - z * sx;
    z = p.y * sx + z * cx;

    // Orthographic projection (ignore z), keep y
    return { x, y };
}

export function drawAxes3D(
    g: CanvasRenderingContext2D,
    origin: Vec2,
    unitPx: number,
    options?: { length?: number; colors?: { x?: string; y?: string; z?: string }; yawRad?: number; pitchRad?: number }
) {
    const opts = options && typeof options === 'object' ? options : {};
    const L = Math.max(0.1, Number(opts.length) || 3);
    const colors = opts.colors || {};

    function drawAxis(dir: Vec3, color: string, label: string) {
        const p = projectIsometric(mul3(dir, L), { yawRad: opts.yawRad, pitchRad: opts.pitchRad });
        const end = { x: origin.x + p.x * unitPx, y: origin.y - p.y * unitPx };
        g.save();
        g.strokeStyle = color;
        g.fillStyle = color;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(origin.x, origin.y);
        g.lineTo(end.x, end.y);
        g.stroke();
        g.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
        g.fillText(label, end.x + 4, end.y + 4);
        g.restore();
    }

    drawAxis({ x: 1, y: 0, z: 0 }, colors.x || 'rgba(255,120,120,0.85)', 'X');
    drawAxis({ x: 0, y: 1, z: 0 }, colors.y || 'rgba(120,255,170,0.85)', 'Y');
    drawAxis({ x: 0, y: 0, z: 1 }, colors.z || 'rgba(120,200,255,0.85)', 'Z');
}

