# animcs C# 子集 (v1)

## 支持的语法

- 顶层：单文件、单入口类（带 `[AnimEntry("...")]`）
- 可选配置：支持 `[AnimProfile(...)]`（用于声明控件、高度缩放与模式选项）
- 类成员：字段、方法（不支持属性 getter/setter）
- 方法签名：`void`、`float`、`int`、`bool`、`Vec2`、`Color`
- 控制流：`if` / `else`、`for`、`return`
- 表达式：
  - 数学运算 `+ - * / %`
  - 比较 `== != < <= > >=`
  - 逻辑 `&& || !`
  - 调用 `MathF`（`Sin`/`Cos`/`Min`/`Max`/`Sqrt`）
  - 调用 `AnimGeom`（`ToScreen` / `DrawAxes` / `DrawArrow`）
  - `new Vec2(...)` / `new Color(...)`

## 不支持的语法

- `async` / `await`
- `LINQ`
- 反射
- `dynamic`
- `unsafe`
- `try/catch`
- `switch` / `goto`
- 复杂泛型（包括自定义泛型类型）

## 运行时约定

- 输出 JS 模块导出 `create()`，返回 `{ onInit, onUpdate, onRender, onDispose }`。
- `AnimContext` / `ICanvas2D` / `Vec2` / `Color` 由 JS 运行时提供。
- `AnimProfile` 会写入 `site/assets/anims/manifest.json` 的 `entries[anims/*.cs].profile`，运行时自动读取并应用。
