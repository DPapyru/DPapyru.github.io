import { createCartesian2D, drawArrow2D, drawAxes2D } from '@animts/math2d';
import { createPanel } from '@animts/ui';
function vec(x, y) { return { x, y }; }
function mulMatVec(m, v) {
    return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}
function drawMatrixText(g, m, x, y) {
    const lines = [
        `M = [ ${m.a.toFixed(2)}  ${m.b.toFixed(2)} ]`,
        `    [ ${m.c.toFixed(2)}  ${m.d.toFixed(2)} ]`
    ];
    g.save();
    g.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    g.fillStyle = 'rgba(255,255,255,0.78)';
    lines.forEach((line, i) => g.fillText(line, x, y + i * 16));
    g.restore();
}
export default async function run(ctx) {
    ctx.stage.style.height = '420px';
    const panel = createPanel(ctx.stage, { title: '矩阵变换（2×2）', pinned: false, position: 'top-right', portal: 'page' });
    let m = { a: 1, b: 0.2, c: 0.0, d: 1 };
    let unitPx = 70;
    let showGrid = true;
    panel.addToggle('网格', showGrid, (v) => (showGrid = v));
    panel.addSlider('a', { min: -2, max: 2, step: 0.01, initial: m.a }, (v) => (m.a = v));
    panel.addSlider('b', { min: -2, max: 2, step: 0.01, initial: m.b }, (v) => (m.b = v));
    panel.addSlider('c', { min: -2, max: 2, step: 0.01, initial: m.c }, (v) => (m.c = v));
    panel.addSlider('d', { min: -2, max: 2, step: 0.01, initial: m.d }, (v) => (m.d = v));
    panel.addSlider('缩放', { min: 40, max: 120, step: 1, initial: unitPx }, (v) => (unitPx = v));
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
            drawAxes2D(g, cs, { xMin: -5, xMax: 5, yMin: -3.5, yMax: 3.5, showGrid });
            // Original basis vectors
            const e1 = vec(1, 0);
            const e2 = vec(0, 1);
            const Me1 = mulMatVec(m, e1);
            const Me2 = mulMatVec(m, e2);
            const O = cs.toScreen(vec(0, 0));
            drawArrow2D(g, O, cs.toScreen(e1), { color: 'rgba(255,255,255,0.35)', label: 'e1' });
            drawArrow2D(g, O, cs.toScreen(e2), { color: 'rgba(255,255,255,0.35)', label: 'e2' });
            // Transformed basis
            drawArrow2D(g, O, cs.toScreen(Me1), { color: 'rgba(120, 200, 255, 0.95)', label: 'M·e1' });
            drawArrow2D(g, O, cs.toScreen(Me2), { color: 'rgba(255, 180, 120, 0.92)', label: 'M·e2' });
            // Unit square -> parallelogram
            const p0 = vec(0, 0);
            const p1 = e1;
            const p2 = vec(e1.x + e2.x, e1.y + e2.y);
            const p3 = e2;
            const q0 = mulMatVec(m, p0);
            const q1 = mulMatVec(m, p1);
            const q2 = mulMatVec(m, p2);
            const q3 = mulMatVec(m, p3);
            function poly(points, fill, stroke) {
                g.save();
                g.fillStyle = fill;
                g.strokeStyle = stroke;
                g.lineWidth = 2;
                g.beginPath();
                const s0 = cs.toScreen(points[0]);
                g.moveTo(s0.x, s0.y);
                for (let i = 1; i < points.length; i++) {
                    const p = cs.toScreen(points[i]);
                    g.lineTo(p.x, p.y);
                }
                g.closePath();
                g.fill();
                g.stroke();
                g.restore();
            }
            poly([p0, p1, p2, p3], 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.18)');
            poly([q0, q1, q2, q3], 'rgba(255, 180, 120, 0.10)', 'rgba(255, 180, 120, 0.35)');
            drawMatrixText(g, m, 12, 18);
            g.save();
            g.fillStyle = 'rgba(255,255,255,0.75)';
            g.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
            g.fillText('橙色平行四边形 = 单位正方形经过矩阵变换', 12, 56);
            g.restore();
        }
    });
}
//# sourceMappingURL=demo-math-matrix.js.map