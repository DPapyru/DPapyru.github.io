import { drawAxes3D, projectIsometric, vec3 } from '@animts/math3d';
import { createPanel } from '@animts/ui';
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export default async function run(ctx) {
    ctx.stage.style.height = '420px';
    const panel = createPanel(ctx.stage, { title: '3D 坐标系（等距投影）', pinned: false, position: 'top-right', portal: 'page' });
    let yaw = Math.PI / 4;
    let pitch = Math.atan2(1, Math.sqrt(2));
    let unitPx = 70;
    let spin = true;
    panel.addToggle('旋转', spin, (v) => (spin = v));
    panel.addSlider('yaw', { min: -3.14, max: 3.14, step: 0.01, initial: yaw }, (v) => (yaw = v));
    panel.addSlider('pitch', { min: -1.2, max: 1.2, step: 0.01, initial: pitch }, (v) => (pitch = v));
    panel.addSlider('缩放', { min: 30, max: 120, step: 1, initial: unitPx }, (v) => (unitPx = v));
    const { canvas, g, resize } = ctx.ui.canvas2d({ className: 'animts-ai-canvas' });
    let t = 0;
    ctx.ui.runLoop({
        update: function (dt) {
            if (spin) {
                t += dt;
                yaw = clamp(yaw + dt * 0.6, -Math.PI, Math.PI);
            }
        },
        draw: function () {
            resize();
            const width = canvas.width;
            const height = canvas.height;
            g.clearRect(0, 0, width, height);
            const origin = { x: width * 0.5, y: height * 0.6 };
            drawAxes3D(g, origin, unitPx, { length: 3.2, yawRad: yaw, pitchRad: pitch });
            // Simple rotating cube wireframe for spatial intuition
            const cube = [
                vec3(-1, -1, -1),
                vec3(1, -1, -1),
                vec3(1, 1, -1),
                vec3(-1, 1, -1),
                vec3(-1, -1, 1),
                vec3(1, -1, 1),
                vec3(1, 1, 1),
                vec3(-1, 1, 1)
            ];
            const a = t * 0.9;
            const cy = Math.cos(a);
            const sy = Math.sin(a);
            const cx = Math.cos(a * 0.7);
            const sx = Math.sin(a * 0.7);
            function rot(p) {
                // Y rotate
                let x = p.x * cy + p.z * sy;
                let z = -p.x * sy + p.z * cy;
                // X rotate
                const y = p.y * cx - z * sx;
                z = p.y * sx + z * cx;
                return { x, y, z };
            }
            function toScreen(p) {
                const q = projectIsometric(p, { yawRad: yaw, pitchRad: pitch });
                return { x: origin.x + q.x * unitPx, y: origin.y - q.y * unitPx };
            }
            const pts = cube.map((p) => toScreen(rot(p)));
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0],
                [4, 5], [5, 6], [6, 7], [7, 4],
                [0, 4], [1, 5], [2, 6], [3, 7]
            ];
            g.save();
            g.strokeStyle = 'rgba(255,255,255,0.35)';
            g.lineWidth = 2;
            g.lineCap = 'round';
            edges.forEach(([i, j]) => {
                const a = pts[i];
                const b = pts[j];
                g.beginPath();
                g.moveTo(a.x, a.y);
                g.lineTo(b.x, b.y);
                g.stroke();
            });
            g.fillStyle = 'rgba(255, 180, 120, 0.85)';
            pts.forEach((p) => {
                g.beginPath();
                g.arc(p.x, p.y, 3, 0, Math.PI * 2);
                g.fill();
            });
            g.restore();
            g.save();
            g.fillStyle = 'rgba(255,255,255,0.75)';
            g.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
            g.fillText('拖动/旋转仅示意：等距投影不是透视相机', 12, 18);
            g.fillText(`yaw=${yaw.toFixed(2)}  pitch=${pitch.toFixed(2)}`, 12, 36);
            g.restore();
        }
    });
}
//# sourceMappingURL=demo-math-axes-3d.js.map