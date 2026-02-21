// Generated from anims/animgeom-toolkit-recipes.cs
export function create(runtime) {
    const { Vec2, Vec3, Mat4, Color, MathF, AnimGeom } = runtime;
    class AnimgeomToolkitRecipes {
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
            g.Clear(new Color(10, 13, 19));
            let center = new Vec2(this._ctx.Width * 0.5, this._ctx.Height * 0.58);
            let scale = MathF.Min(this._ctx.Width, this._ctx.Height) * 0.33;
            AnimGeom.DrawAxes(g, center, scale, new Color(90, 110, 140, 210), new Color(48, 64, 90, 130));
            let mode = this._ctx.Input.ModeLocked ? this._ctx.Input.Mode : 0;
            if (mode == 1)
            {
                this.DrawOrbitSamples(g, center, scale);
            }
            else
            {
                this.DrawArrowRecipes(g, center, scale);
            }
            g.Text("AnimGeom Toolkit Recipes", new Vec2(12, 12), new Color(225, 235, 245, 235), 13);
            g.Text(mode == 1 ? "\u6A21\u5F0F: \u8F68\u8FF9\u91C7\u6837" : "\u6A21\u5F0F: \u5750\u6807\u8F74\u002B\u7BAD\u5934", new Vec2(12, 30), new Color(155, 190, 225, 220), 12);
            g.Text("\u6F14\u793A ToScreen / DrawAxes / DrawArrow \u5E38\u89C1\u7EC4\u5408", new Vec2(12, 48), new Color(130, 150, 175, 220), 12);
        }
        OnDispose() {
        }
        DrawArrowRecipes(g, center, scale) {
            let t = this._ctx == null ? 0 : this._ctx.Time;
            let vectors = [new Vec2(MathF.Cos(t * 0.8) * 1.1, MathF.Sin(t * 0.8) * 0.7), new Vec2(MathF.Cos(t * 1.1 + 1.3) * 0.8, MathF.Sin(t * 1.1 + 1.3) * 1), new Vec2(MathF.Cos(t * 1.5 + 2.4) * 0.6, MathF.Sin(t * 1.5 + 2.4) * 0.55)];
            let colors = [new Color(115, 220, 255, 240), new Color(255, 170, 115, 230), new Color(145, 255, 140, 230)];
            let index = 0;
            for (const v of vectors)
            {
                let tip = AnimGeom.ToScreen(v, center, scale);
                AnimGeom.DrawArrow(g, center, tip, colors[index], 2, 10);
                index += 1;
            }
        }
        DrawOrbitSamples(g, center, scale) {
            if (this._ctx == null)
            {
                return;
            }
            let i = 0;
            while (i < 20)
            {
                let t = this._ctx.Time - i * 0.12;
                let p = new Vec2(MathF.Cos(t) * 1.1, MathF.Sin(t * 1.4) * 0.6);
                let screen = AnimGeom.ToScreen(p, center, scale);
                let alpha = MathF.Max(60, 240 - i * 9);
                g.FillCircle(screen, 3.2, new Color(120, 200, 255, alpha));
                i += 1;
            }
            let current = new Vec2(MathF.Cos(this._ctx.Time) * 1.1, MathF.Sin(this._ctx.Time * 1.4) * 0.6);
            let currentScreen = AnimGeom.ToScreen(current, center, scale);
            AnimGeom.DrawArrow(g, center, currentScreen, new Color(255, 190, 120, 240), 2.1, 10);
        }
    }
    return new AnimgeomToolkitRecipes();
}

