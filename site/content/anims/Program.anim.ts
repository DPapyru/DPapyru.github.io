export const profile = {
    heightScale: 1.4
};

export function create(runtime) {
    const { Color } = runtime;

    class ProgramAnim {
        OnInit(ctx) {
            this._ctx = ctx;
        }

        OnUpdate(_dt) {
        }

        OnRender(g) {
            g.Clear(new Color(8, 12, 16));
        }

        OnDispose() {
        }
    }

    return new ProgramAnim();
}