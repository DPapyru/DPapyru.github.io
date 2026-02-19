# animcs C# 子集 (v1)

## 支持的语法

- 顶层：单文件、单入口类（带 `[AnimEntry("...")]`）
- 可选配置：支持 `[AnimProfile(...)]`（用于声明控件、高度缩放与模式选项）
- 类成员：字段、方法（不支持属性 getter/setter）
- 方法签名：`void`、`float`、`int`、`bool`、`string`、`Vec2`、`Vec3`、`Mat4`、`Color`
- 控制流：`if` / `else`、`for`、`return`
- 表达式：
  - 数学运算 `+ - * / %`
  - 比较 `== != < <= > >=`
  - 逻辑 `&& || !`
  - 调用 `MathF`（`Sin`/`Cos`/`Tan`/`Min`/`Max`/`Sqrt`/`Abs`/`Round`）
  - 调用 `AnimGeom`（`ToScreen` / `DrawAxes` / `DrawArrow`）
  - `new Vec2(...)` / `new Vec3(...)` / `new Color(...)`
  - `new T[] { ... }`、`new[] { ... }`

## 运算符降级规则

- `Vec2 + Vec2` / `Vec2 - Vec2` / `Vec2 * float` / `float * Vec2` / `Vec2 / float`
- `Vec3 + Vec3` / `Vec3 - Vec3` / `Vec3 * float` / `float * Vec3` / `Vec3 / float`
- `Mat4 * Mat4` / `Mat4 * Vec2` / `Mat4 * Vec3`

上述表达式在编译阶段会降级为 JS 运行时帮助方法调用，不会保留对象直接 `*` 的不合法语义。

## 常用方法降级

- `ToString()`（无参数）会降级为 JS 的 `.toString()` 调用。

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
- `AnimContext` / `ICanvas2D` / `Vec2` / `Vec3` / `Mat4` / `Color` 由 JS 运行时提供。
- `AnimContext.Input` 支持 `WheelDelta`（每帧滚轮增量，帧尾清零）。
- `ICanvas2D` 支持 `Text(string, Vec2, Color, float)`。
- `AnimProfile` 会写入 `site/assets/anims/manifest.json` 的 `entries[anims/*.cs].profile`，运行时自动读取并应用。
