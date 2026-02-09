# DPapyru-- 语言规范（前端版）

本文档描述当前仓库里正在使用的 DPapyru-- 规则。该规则用于网页实时渲染，不包含游戏回调系统（例如 onHit）。

## 1. 设计目标

- 用最少语法描述挥舞路径与拖尾表现。
- 在前端直接运行，便于快速迭代视觉效果。
- 保留搞怪别名，降低写法负担。
- 引入 C-Make 风格封装块，让写法接近 tModLoader 实战里常见的“高封装调用”。

## 2. 程序模型

DPapyru-- 支持两种入口。

### 2.1 `profile swing`（推荐）

用于状态机式挥舞脚本。

建议在 `state tick` 内优先使用 `make slash { ... }`：

```dp
state slash(SLASH_TICKS) {
    tick {
        let float t = state_tick / SLASH_TICKS;
        let float a = -2.72 + t * 2.34;

        make slash {
            center(0.46, 0.58);
            radius(0.34);
            angle(a - 0.84, a + 0.96);
            count(20);
            width(1.20, 0.26);
            color(rgba(0.94, 0.94, 0.94, 0.22), rgba(1.00, 1.00, 1.00, 0.14));
            uv(0.00, 1.00);
        }
    }
}
```

```dp
profile swing <name> {
    const int N = 10;

    state pre {
        on_tick {
            // emit/biu + 条件跳转
        }
    }

    state slash {
        tick {
            // tick 是 on_tick 的等价写法
        }
    }

    trail {
        shader_pass 0;
        use_shader on;
    }
}
```

### 2.2 `build(ctx)`（兼容）

用于一次性生成轨迹点列表。最常见写法是连续输出多个 `emit(...)`，由渲染器自动连成拖尾。

```dp
fun TrailPoint[] build(TrailContext ctx) {
    emit(v2(0.0, 0.0), 0.1, rgba(1.0, 1.0, 1.0, 0.5), 0.0);
}
```

## 3. 可用关键字与结构

- 关键字：`profile` `swing` `state` `on_tick` `tick` `goto` `trail` `let` `const` `if`
- 状态跳转：
  - `if (<condition>) goto <state>;`
  - `goto <state>;`

每个 `state` 可以写 `on_tick {}` / `tick {}`，也可以直接把语句写在 state 体内，按每帧执行。

支持时长简写：`state slash(SLASH_TICKS) { ... }`。
当 state 带时长且未触发 `goto` 时，会按声明顺序自动切到下一个 state。

## 4. 表达式和变量

表达式以数值计算为主，支持 `+ - * / %`、比较运算、逻辑运算与常见数学函数。

建议写显式类型，便于阅读：

```dp
let float t = state_tick / 24;
const int PRE_TICKS = 8;
```

当前实现主要处理数值变量，不支持复杂对象语义。

## 5. 内置函数与别名

### 5.1 轨迹点输出

- `emit(...)`
- `biu(...)`（`emit` 的搞怪别名）
- `slash(...)` / `arc(...)` / `swing(...)`（一行生成整段弧线轨迹，三者等价）
- `make slash { ... }`（推荐的封装式弧线生成）
- 轨迹连接规则：同一帧内按 `emit` / `biu` 调用顺序连接顶点

`make slash { ... }` 支持字段：

- `center(x, y)` / `at(x, y)` / `pos(x, y)`
- `radius(r)`
- `angle(start, end)`
- `count(n)` / `samples(n)` / `points(n)`
- `width(wStart, wEnd)` / `thickness(wStart, wEnd)`
- `color(cStart, cEnd)` / `colour(cStart, cEnd)`
- `uv(uStart, uEnd)` / `u(uStart, uEnd)`

其中 `center` 与 `angle` 为必填，其余有默认值。

支持三种参数形态：

`slash/arc` 简写参数（兼容保留）：

```dp
slash(x, y, radius, start, end, widthStart, widthEnd, colorStart, colorEnd);
slash(x, y, radius, start, end, count, widthStart, widthEnd, colorStart, colorEnd);
slash(x, y, radius, start, end, widthStart, widthEnd, colorStart, colorEnd, uStart, uEnd);
slash(x, y, radius, start, end, count, widthStart, widthEnd, colorStart, colorEnd, uStart, uEnd);
```


```dp
emit(v2(x, y), width, rgba(r, g, b, a), u);
emit(x, y, width, rgba(r, g, b, a), u);
emit(x, y, width, r, g, b, a, u);
```

### 5.2 颜色

- `rgba(r, g, b, a)`
- `rainbow(r, g, b, a)`（颜色函数别名）

### 5.3 向量

- `vec2(x, y)`
- `v2(x, y)`（别名）

## 6. swing 模式上下文变量

`swing` 状态机中可直接读取：

- `state_tick` / `state_time` / `phase_tick`
- `tick` / `global_tick`
- `phase` / `state`
- `Time` `Dt` `Progress`
- `PI`

## 7. trail 配置

`trail` 块可配置（含坐标对齐）：

```dp
trail {
    shader_pass 0;
    use_shader on;
    coord uv;
    uv linear;
}
```

- `shader_pass`：整型，当前用于预留通道选择。
- `use_shader`：`on/off` 或 `true/false` 或 `1/0`。
- `coord`：`uv` / `center` / `auto`，用于强制坐标模式。
- `uv` / `uv_mode`：`linear` / `manual`（`point` 也会按 `manual` 处理）。
- `blend`：`alpha` / `alphablend` / `additive` / `add` / `addictive`（兼容保留；页面实际以顶部混合按钮为准）。

## 8. 不在本规范范围内

以下属于游戏运行时逻辑，不在当前前端 DSL 范围：

- 命中事件（例如 `onHit`）
- NPC/Projectile 生命周期管理
- 网络同步与服务端状态

这些逻辑请在实际 tModLoader C# 工程中实现。

## 9. 默认渲染管线（对齐 tModLoader 顶点思路）

前端默认绘制流程按下面步骤执行：

1. 按脚本 `emit/biu` 输出顺序保存轨迹点，不额外做自动插值；并根据相邻点计算运动方向。
   如果使用 `make slash { ... }`，该块先展开为点序列，再按同样规则继续处理。
2. 由运动方向计算法线，生成左右两个绘制顶点。
3. 每个顶点携带 `position + color + uv` 数据，默认 `uv.u` 按整条拖尾顺序线性插值为 `0 -> 1`。
   当 `make slash { uv(...) }` 或 `slash(..., uStart, uEnd)` 提供点级 UV 时，渲染会自动使用点级 `u`。
   若 `trail` 使用 `uv manual;`，则始终强制采用点级 `u`。
   对于 `slash/arc/swing` 与 `make slash`，`count` 是点数上限：实际可见点数会按时间展开，默认使用
   `visibleCount = round(count * pow(state_progress, 3.5))`。
   这让轨迹在动作刚启动时从“无拖尾”逐步生长，更接近实战挥舞观感。
4. 把相邻段的左右顶点连接成三角形列表。
5. 按三角形列表完成最终绘制，并可叠加 Toy-HLSL 上色。

## 10. 混合模式说明

当前前端实现支持两种常用模式：

- `alpha`
  - `src_rgb = shader_rgb * vertex_rgb`
  - `a = clamp(vertex_a)`
  - `out_rgb = src_rgb + dst_rgb * (1 - a)`
  - `a = 1` 时表现为覆盖；`a = 0` 时完全透明（不改变目标颜色）。
- `additive`
  - `out_rgb = dst_rgb + src_rgb * a`
  - 总是叠加，`a` 控制叠加强度。

其中 `vertex_a` 来自脚本颜色的 alpha，确保 `a=0` 可以映射到完全透明。

这套流程的目标是让网页预览和 tModLoader 顶点拖尾的思路尽量一致，便于从可视化草稿迁移到实际 C# 工程。
