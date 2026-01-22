import type { AnimContext, Vec2 } from '@animts/types';
import { createCartesian2D, drawAxes2D, fillIntegralArea2D, plotFunction2D } from '@animts/math2d';
import { finiteDiff, tangentLineAt } from '@animts/calc';
import { createPanel } from '@animts/ui';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function pxVar(name: string, fallback: string) {
    const s = getComputedStyle(document.documentElement).getPropertyValue(name);
    return String(s || '').trim() || fallback;
}

export default async function run(ctx: AnimContext) {
    // Make the stage taller for charts
    ctx.stage.style.height = '420px';

    const panel = createPanel(ctx.stage, { title: '数学可视化（函数/切线/积分）', pinned: false, position: 'top-right', portal: 'page' });

    let a = -1;
    let b = 1;
    let x0 = 0.7;
    let unitPx = 60;

    panel.addSlider('a', { min: -4, max: 4, step: 0.01, initial: a }, (v) => (a = v));
    panel.addSlider('b', { min: -4, max: 4, step: 0.01, initial: b }, (v) => (b = v));
    panel.addSlider('x0', { min: -4, max: 4, step: 0.01, initial: x0 }, (v) => (x0 = v));
    panel.addSlider('缩放', { min: 30, max: 120, step: 1, initial: unitPx }, (v) => (unitPx = v));

    const { canvas, g, resize } = ctx.ui.canvas2d({ className: 'animts-ai-canvas' });

    const COLORS = {
        curve: 'rgba(120, 200, 255, 0.95)',
        tangent: 'rgba(255, 180, 120, 0.9)',
        point: 'rgba(255, 90, 90, 0.95)',
        text: pxVar('--text-secondary', 'rgba(255,255,255,0.75)')
    };

    function drawPoint(p: Vec2, radius: number, color: string) {
        g.save();
        g.fillStyle = color;
        g.beginPath();
        g.arc(p.x, p.y, radius, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    // f(x) can be replaced freely (keep it deterministic for teaching)
    function f(x: number) {
        return Math.sin(x);
    }

    ctx.ui.runLoop({
        update: function () { },
        draw: function () {
            resize();

            const width = canvas.width;
            const height = canvas.height;
            g.clearRect(0, 0, width, height);

            const origin = { x: width * 0.5, y: height * 0.58 };
            const cs = createCartesian2D({ origin, unitPx, yUp: true });

            drawAxes2D(g, cs, { xMin: -6, xMax: 6, yMin: -2.2, yMax: 2.2, gridStep: 1, tickStep: 1 });

            // Integral shading
            const aa = clamp(a, -6, 6);
            const bb = clamp(b, -6, 6);
            fillIntegralArea2D(g, cs, f, aa, bb, { fillStyle: 'rgba(255, 180, 120, 0.18)' });

            // Function curve
            plotFunction2D(g, cs, f, { xMin: -6, xMax: 6, samples: 320, strokeStyle: COLORS.curve, lineWidth: 2 });

            // Tangent at x0
            const xx = clamp(x0, -5.5, 5.5);
            const tline = tangentLineAt(f, xx, { h: 1e-3 });
            plotFunction2D(g, cs, tline, { xMin: xx - 2.5, xMax: xx + 2.5, samples: 120, strokeStyle: COLORS.tangent, lineWidth: 2 });

            const y0 = f(xx);
            const m = finiteDiff(f, xx, 1e-3);

            // Mark the tangent point
            const p = cs.toScreen({ x: xx, y: y0 });
            drawPoint(p, 6, COLORS.point);

            // HUD text
            g.save();
            g.fillStyle = COLORS.text;
            g.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
            g.fillText(`f(x)=sin(x)`, 12, 18);
            g.fillText(`x0=${xx.toFixed(2)}  f(x0)=${y0.toFixed(3)}  f'(x0)≈${m.toFixed(3)}`, 12, 36);
            g.fillText(`积分区间: [${aa.toFixed(2)}, ${bb.toFixed(2)}]（阴影）`, 12, 54);
            g.restore();
        }
    });
}
