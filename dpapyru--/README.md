# DPapyru--

DPapyru-- 在本仓库中的定位是一个前端可运行的小型 DSL，专门用于 `site/pages/shader-playground.html` 里的刀光/拖尾预览。

它现在只负责浏览器端动画表达，不再包含 C# 代码生成链路。

## 当前定位

- 用途：快速描述挥舞轨迹、拖尾宽度和颜色变化。顶点按 `emit(...)` 出现顺序自动连接。
- 运行位置：浏览器端，实时编译并实时渲染。
- 风格：语法尽量简单，保留搞怪别名（`biu`、`rainbow`、`v2`）。

## 项目集成位置

- 运行时与解析器：`site/assets/js/dpapyru-trail-playground.js`
- 高亮与补全：`site/assets/js/shader-editor-assist.js`
- 页面入口：`site/pages/shader-playground.html`

## 语法入口

推荐主语法：`profile swing` + `make slash { ... }`

```dp
profile swing demo {
    const int SLASH_TICKS = 24;

    state slash(SLASH_TICKS) {
        tick {
            let float t = state_tick / SLASH_TICKS;
            let float cx = 0.46;
            let float cy = 0.58;
            let float a = -2.72 + t * 2.34;

            make slash {
                center(cx, cy);
                radius(0.34);
                angle(a - 0.84, a + 0.96);
                count(20);
                width(1.20, 0.26);
                color(rgba(0.94, 0.94, 0.94, 0.22), rgba(1.00, 1.00, 1.00, 0.14));
                uv(0.00, 1.00);
            }
        }
    }

    trail {
        shader_pass 0;
        use_shader on;
        coord uv;
        uv linear;
    }
}
```

这套写法是为了接近 tModLoader 项目里常见的“封装式调用”体验：用一个块表达一次挥舞段，细节参数集中管理，避免大量重复 `emit`。

页面混合模式建议使用顶部按钮切换（AlphaBlend/Additive），不再要求脚本内手写 `blend ...`。

UV 行为：`make slash { uv(...) }` 与 `slash(..., uStart, uEnd)` 可直接驱动点级 UV，不必强制写 `trail uv manual;`。

兼容旧入口：`build(ctx) { emit(...); }`

## 说明

更详细规则见 `dpapyru--/LANGUAGE_SPEC.md`。
