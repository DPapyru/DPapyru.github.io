import type { AnimContext, Vec2 } from '@animts/types';
import { createCartesian2D, drawArrow2D, drawAxes2D } from '@animts/math2d';
import { createPanel } from '@animts/ui';

function vec(x: number, y: number): Vec2 { return { x, y }; }
function dot(a: Vec2, b: Vec2) { return a.x * b.x + a.y * b.y; }
function len(a: Vec2) { return Math.hypot(a.x, a.y); }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }

export default async function run(ctx: AnimContext) {
    ctx.stage.style.height = '420px';
    const panel = createPanel(ctx.stage, { title: '向量可视化（2D）', pinned: false, position: 'top-right', portal: 'page' });

    let u = vec(2.2, 1.1);
    let v = vec(-1.2, 2.0);
    let showProjection = true;
    let unitPx = 70;

    panel.addToggle('投影', showProjection, (val) => (showProjection = val));
    panel.addSlider('u.x', { min: -4, max: 4, step: 0.01, initial: u.x }, (val) => (u.x = val));
    panel.addSlider('u.y', { min: -4, max: 4, step: 0.01, initial: u.y }, (val) => (u.y = val));
    panel.addSlider('v.x', { min: -4, max: 4, step: 0.01, initial: v.x }, (val) => (v.x = val));
    panel.addSlider('v.y', { min: -4, max: 4, step: 0.01, initial: v.y }, (val) => (v.y = val));
    panel.addSlider('缩放', { min: 40, max: 120, step: 1, initial: unitPx }, (val) => (unitPx = val));

    const { canvas, g, resize } = ctx.ui.canvas2d({ className: 'animts-ai-canvas' });

    ctx.ui.runLoop({
        update: function () { },
        draw: function () {
            resize();
            const width = canvas.width;
            const height = canvas.height;
            g.clearRect(0, 0, width, height);

            const origin = { x: width * 0.5, y: height * 0.58 };
            const cs = createCartesian2D({ origin, unitPx, yUp: true });
            drawAxes2D(g, cs, { xMin: -5, xMax: 5, yMin: -3.5, yMax: 3.5 });

            const O = cs.toScreen(vec(0, 0));
            const U = cs.toScreen(u);
            const V = cs.toScreen(v);

            drawArrow2D(g, O, U, { color: 'rgba(120, 200, 255, 0.95)', label: 'u' });
            drawArrow2D(g, O, V, { color: 'rgba(255, 180, 120, 0.92)', label: 'v' });

            const d = dot(u, v);
            const lu = len(u);
            const lv = len(v);
            const cos = lu > 1e-6 && lv > 1e-6 ? d / (lu * lv) : 0;
            const angle = Math.acos(clamp(cos, -1, 1));

            if (showProjection && lu > 1e-6) {
                const k = d / (lu * lu);
                const proj = vec(u.x * k, u.y * k);
                const P = cs.toScreen(proj);
                drawArrow2D(g, O, P, { color: 'rgba(180, 255, 170, 0.85)', label: 'proj_v_on_u' });

                // Perpendicular from v to proj
                g.save();
                g.setLineDash([6, 6]);
                g.strokeStyle = 'rgba(255,255,255,0.25)';
                g.lineWidth = 2;
                g.beginPath();
                g.moveTo(V.x, V.y);
                g.lineTo(P.x, P.y);
                g.stroke();
                g.restore();
            }

            // Small angle arc
            g.save();
            g.strokeStyle = 'rgba(255,255,255,0.35)';
            g.lineWidth = 2;
            g.beginPath();
            g.arc(O.x, O.y, 36, 0, -Math.sign(u.y * v.x - u.x * v.y) * angle, true);
            g.stroke();
            g.restore();

            g.save();
            g.fillStyle = 'rgba(255,255,255,0.75)';
            g.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
            g.fillText(`dot(u,v)=${d.toFixed(3)}  |u|=${lu.toFixed(3)}  |v|=${lv.toFixed(3)}`, 12, 18);
            g.fillText(`angle(u,v)=${(angle * 180 / Math.PI).toFixed(1)}°`, 12, 36);
            g.restore();
        }
    });
}
