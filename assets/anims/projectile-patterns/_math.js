/**
 * 共享数学工具 - 向量运算
 */
function vec(x, y) {
    return { x, y };
}
function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}
function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
function mul(a, s) {
    return { x: a.x * s, y: a.y * s };
}
function len(a) {
    return Math.hypot(a.x, a.y);
}
function norm(a) {
    const l = len(a) || 1;
    return mul(a, 1 / l);
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function lerpVec(a, b, t) {
    return vec(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
}
function rotate(v, angle) {
    return {
        x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
        y: v.x * Math.sin(angle) + v.y * Math.cos(angle)
    };
}
//# sourceMappingURL=_math.js.map