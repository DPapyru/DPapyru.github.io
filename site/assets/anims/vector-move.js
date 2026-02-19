// Generated from anims/vector-move.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class vector_move {
        constructor() {
            this._ctx = null;
        }
        OnDispose() {
        }
        OnInit(ctx) {
            this._ctx = ctx;
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
            AnimGeom.DrawAxes(g, center, scale);
        }
        OnUpdate(dt) {
            if (this._ctx == null)
            {
                return;
            }
        }
    }
    return new vector_move();
}

