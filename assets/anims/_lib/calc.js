export function finiteDiff(f, x, h) {
    const hh = Math.max(1e-6, Number(h) || 1e-3);
    const a = f(x + hh);
    const b = f(x - hh);
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return NaN;
    return (a - b) / (2 * hh);
}
export function tangentLineAt(f, x0, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const y0 = f(x0);
    const m = finiteDiff(f, x0, opts.h);
    return (x) => y0 + m * (x - x0);
}
export function riemannSum(f, a, b, n, method) {
    const N = Math.max(1, Math.floor(Number(n) || 1));
    const minX = Math.min(a, b);
    const maxX = Math.max(a, b);
    const dx = (maxX - minX) / N;
    const pick = method || 'mid';
    let sum = 0;
    for (let i = 0; i < N; i++) {
        const xL = minX + i * dx;
        const xR = xL + dx;
        const x = pick === 'left' ? xL : pick === 'right' ? xR : (xL + xR) * 0.5;
        const y = f(x);
        if (!Number.isFinite(y))
            continue;
        sum += y * dx;
    }
    return sum;
}
export function riemannRectangles(f, a, b, n, method) {
    const N = Math.max(1, Math.floor(Number(n) || 1));
    const minX = Math.min(a, b);
    const maxX = Math.max(a, b);
    const dx = (maxX - minX) / N;
    const pick = method || 'mid';
    const rects = [];
    for (let i = 0; i < N; i++) {
        const xL = minX + i * dx;
        const xR = xL + dx;
        const x = pick === 'left' ? xL : pick === 'right' ? xR : (xL + xR) * 0.5;
        const y = f(x);
        rects.push({ x: xL, w: dx, h: Number.isFinite(y) ? y : 0 });
    }
    return rects;
}
//# sourceMappingURL=calc.js.map