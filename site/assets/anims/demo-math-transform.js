// Generated from anims/demo-math-transform.cs
export function create(runtime) {
    const { Vec2, Color, MathF } = runtime;
    class DemoMathTransform {
        constructor() {
            this._ctx = null;
        }
        OnInit(ctx) {
            
                    this._ctx = ctx;
            
        }
        OnUpdate(dt) {
        }
        OnRender(g) {
            
                    if (this._ctx == null)
                    {
                        return;
                    }
            
                    g.Clear(new Color(8, 12, 16));
            
                    let width = this._ctx.Width;
                    let height = this._ctx.Height;
                    let center = new Vec2(width * 0.5, height * 0.55);
                    let scale = MathF.Min(width, height) * 0.32;
            
                    DemoMathTransform.DrawAxes(g, center, scale);
            
                    let time = this._ctx.Time;
                    let angle = time * 0.7;
                    let shear = 0.35 * MathF.Sin(time * 0.6);
                    let scaleX = 1.0 + 0.18 * MathF.Sin(time * 0.4);
                    let scaleY = 1.0 - 0.16 * MathF.Sin(time * 0.55);
                    let cos = MathF.Cos(angle);
                    let sin = MathF.Sin(angle);
            
                    let m00 = cos * scaleX;
                    let m01 = -sin + shear;
                    let m10 = sin;
                    let m11 = cos * scaleY;
            
                    let basisX = new Vec2(m00, m10);
                    let basisY = new Vec2(m01, m11);
                    let vector = new Vec2(1.1, 0.6);
                    let transformed = DemoMathTransform.Mul(m00, m01, m10, m11, vector);
            
                    DemoMathTransform.DrawArrow(g, center, DemoMathTransform.ToScreen(vector, center, scale), new Color(120, 200, 255), 2, 10);
                    DemoMathTransform.DrawArrow(g, center, DemoMathTransform.ToScreen(transformed, center, scale), new Color(255, 150, 110), 2, 10);
            
                    DemoMathTransform.DrawArrow(g, center, DemoMathTransform.ToScreen(basisX, center, scale), new Color(120, 255, 180), 2, 10);
                    DemoMathTransform.DrawArrow(g, center, DemoMathTransform.ToScreen(basisY, center, scale), new Color(210, 180, 255), 2, 10);
            
                    DemoMathTransform.DrawUnitSquare(g, center, scale, m00, m01, m10, m11);
            
        }
        OnDispose() {
        }
        static ToScreen(v, center, scale) {
            
                    return new Vec2(center.X + v.X * scale, center.Y - v.Y * scale);
            
        }
        static Mul(m00, m01, m10, m11, v) {
            
                    return new Vec2(m00 * v.X + m01 * v.Y, m10 * v.X + m11 * v.Y);
            
        }
        static DrawAxes(g, center, scale) {
            
                    let axisColor = new Color(90, 100, 120, 200);
                    let gridColor = new Color(40, 50, 70, 120);
                    let axisLength = scale * 1.2;
            
                    g.Line(new Vec2(center.X - axisLength, center.Y), new Vec2(center.X + axisLength, center.Y), axisColor, 1.5);
                    g.Line(new Vec2(center.X, center.Y - axisLength), new Vec2(center.X, center.Y + axisLength), axisColor, 1.5);
            
                    for (let i = 1; i <= 4; i++)
                    {
                        let offset = i * scale * 0.25;
                        g.Line(new Vec2(center.X - axisLength, center.Y - offset), new Vec2(center.X + axisLength, center.Y - offset), gridColor, 1);
                        g.Line(new Vec2(center.X - axisLength, center.Y + offset), new Vec2(center.X + axisLength, center.Y + offset), gridColor, 1);
                        g.Line(new Vec2(center.X - offset, center.Y - axisLength), new Vec2(center.X - offset, center.Y + axisLength), gridColor, 1);
                        g.Line(new Vec2(center.X + offset, center.Y - axisLength), new Vec2(center.X + offset, center.Y + axisLength), gridColor, 1);
                    }
            
        }
        static DrawArrow(g, from, to, color, width, headSize) {
            
                    g.Line(from, to, color, width);
            
                    let dir = new Vec2(to.X - from.X, to.Y - from.Y);
                    let len = MathF.Sqrt(dir.X * dir.X + dir.Y * dir.Y);
                    if (len <= 0.001)
                    {
                        return;
                    }
            
                    let ux = dir.X / len;
                    let uy = dir.Y / len;
                    let left = new Vec2(-uy, ux);
            
                    let basePoint = new Vec2(to.X - ux * headSize, to.Y - uy * headSize);
                    let leftPoint = new Vec2(basePoint.X + left.X * headSize * 0.55, basePoint.Y + left.Y * headSize * 0.55);
                    let rightPoint = new Vec2(basePoint.X - left.X * headSize * 0.55, basePoint.Y - left.Y * headSize * 0.55);
            
                    g.Line(to, leftPoint, color, width);
                    g.Line(to, rightPoint, color, width);
            
        }
        static DrawUnitSquare(g, center, scale, m00, m01, m10, m11) {
            
                    let edgeColor = new Color(90, 170, 255, 150);
                    let points =
                    [
                        new Vec2(0, 0),
                        new Vec2(1, 0),
                        new Vec2(1, 1),
                        new Vec2(0, 1)
                    ];
            
                    let transformed = new Array(points.length);
                    for (let i = 0; i < points.length; i++)
                    {
                        transformed[i] = DemoMathTransform.Mul(m00, m01, m10, m11, points[i]);
                    }
            
                    for (let i = 0; i < transformed.length; i++)
                    {
                        let a = DemoMathTransform.ToScreen(transformed[i], center, scale);
                        let b = DemoMathTransform.ToScreen(transformed[(i + 1) % transformed.length], center, scale);
                        g.Line(a, b, edgeColor, 1.3);
                    }
            
        }
    }
    return new DemoMathTransform();
}
