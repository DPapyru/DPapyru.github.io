// Generated from anims/vector-basic.cs
export function create(runtime) {
    const { Vec2, Color, MathF } = runtime;
    class VectorBasic {
        constructor() {
            this._ctx = null;
            this._mousePos = new Vec2(0, 0);
        }
        OnInit(ctx) {
            
                    this._ctx = ctx;
            
        }
        OnUpdate(dt) {
            
                    if (this._ctx == null)
                        return;
            
                    if (this._ctx.Input.IsInside)
                        this._mousePos = new Vec2(this._ctx.Input.X, this._ctx.Input.Y);
            
        }
        OnRender(g) {
            
                    if (this._ctx == null)
                        return;
                    g.Clear(new Color(8, 12, 16));
                    let width = this._ctx.Width;
                    let height = this._ctx.Height;
                    let center = new Vec2(width * 0.5, height * 0.5);
                    let scale = MathF.Min(width, height) * 0.52;
                    let vec2 = new Vec2(0.3, 0.5);
            
                    if (this._mousePos.X != 0 || this._mousePos.Y != 0)
                        vec2 = new Vec2((this._mousePos.X - center.X) / width * 4, -(this._mousePos.Y - center.Y) / height * 2);
            
                    VectorBasic.DrawAxes(g, center, scale);
            
                    VectorBasic.DrawArrow(g, center, VectorBasic.ToScreen(vec2, center, scale), new Color(255, 255, 255, 200), 2, 10);
            
        }
        OnDispose() {
        }
        static ToScreen(v, center, scale) {
            
                    return new Vec2(center.X + v.X * scale, center.Y - v.Y * scale);
            
        }
        static DrawAxes(g, center, scale) {
            
                    let axisColor = new Color(90, 100, 120, 200);
                    let gridColor = new Color(40, 50, 70, 120);
                    let axisLength = scale * 1.2;
            
                    g.Line(new Vec2(center.X - axisLength, center.Y), new Vec2(center.X + axisLength, center.Y), axisColor, 1.5
                    );
                    g.Line(new Vec2(center.X, center.Y - axisLength), new Vec2(center.X, center.Y + axisLength), axisColor, 1.5
                    );
            
                    for (let i = 1; i <= 4; i++)
                    {
                        let offset = i * scale * 0.25;
                        g.Line(new Vec2(center.X - axisLength, center.Y - offset),
                            new Vec2(center.X + axisLength, center.Y - offset), gridColor, 1
                        );
                        g.Line(new Vec2(center.X - axisLength, center.Y + offset),
                            new Vec2(center.X + axisLength, center.Y + offset), gridColor, 1
                        );
                        g.Line(new Vec2(center.X - offset, center.Y - axisLength),
                            new Vec2(center.X - offset, center.Y + axisLength), gridColor, 1
                        );
                        g.Line(new Vec2(center.X + offset, center.Y - axisLength),
                            new Vec2(center.X + offset, center.Y + axisLength), gridColor, 1
                        );
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
    }
    return new VectorBasic();
}
