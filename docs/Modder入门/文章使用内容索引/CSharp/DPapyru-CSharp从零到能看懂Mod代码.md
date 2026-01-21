---
title: C#：从零到能看懂 Mod 代码
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 25分钟
description: 面向零基础与入门开发者的 C# 最小知识集，目标是“能读懂并改动 tModLoader 示例代码”
topic: mod-basics
order: 1
min_c: 0
min_t: 0
---

# C#：从零到能看懂 Mod 代码

## 概览（可引用）

你不需要先“精通 C#”才能写 Mod，但至少需要能读懂三类东西：

1. **类与继承**：`class MyItem : ModItem`
2. **方法与重写**：`public override void SetDefaults()`
3. **对象属性**：`Item.damage = 10;`

把它想成“看懂配方表”：你不必先当厨师，但要能看懂“盐 2 克、火候 3 分钟”写在哪里。

## 最小示例（可引用）

{if C == 0}
下面这段代码的目标不是教你所有语法，而是让你能把它当作“结构模板”读懂：

```csharp
public class MyItem : ModItem
{
    public override void SetDefaults()
    {
        Item.damage = 10;
    }
}
```

- `class MyItem`：声明一个“类型”（可以理解为一种物品的“蓝图”）。
- `: ModItem`：表示它继承自 `ModItem`，也就是“这是一个物品”。
- `override`：表示你在**重写**基类提供的行为（tML 会在合适的时机调用它）。
- `Item.damage = 10;`：给当前物品对象的属性赋值。
{else if C == 1}
这段代码的关键是“重写生命周期钩子”并赋值属性：

```csharp
public class MyItem : ModItem
{
    public override void SetDefaults()
    {
        Item.damage = 10;
    }
}
```

阅读时建议按顺序抓四个点：继承链、被重写的方法名、方法何时被调用、属性赋值影响的实际表现。
{else}
这其实就是一个小型面向对象回调点：tML 通过反射/注册机制发现你的派生类型，并在内容初始化阶段调用 `SetDefaults()` 填充 `Item` 结构体/对象的默认字段。
{end}

## 常见坑（可引用）

{if P_troubleshoot}
- “我改了代码但没生效”：很多默认值只在对象创建时读取；你可能需要重新生成物品/重载内容。
- “我找不到某个字段”：注意 `Item`、`Projectile`、`NPC` 等对象不同，字段与生命周期也不同。
- “我复制粘贴报错”：先看命名空间与引用（`using`）是否齐全，再看类名/文件名是否冲突。
{end}

## 进阶与惯用写法（可引用）

{if P_best_practice}
- 优先用“明确意图”的 API：比如 `Item.DefaultToMeleeWeapon(...)` 这类辅助方法（如果版本提供）。
- 避免魔法数字：把关键数值提取成 `const` 或写进清晰的注释（不要“写给自己看的暗号”）。
- 先把代码写到能跑，再逐步抽象：过早抽象通常会把学习曲线抬高。
{end}

## API 速查（可引用）

{if P_api_reference}
- 类声明：`public class X { }`
- 继承：`class A : B`
- 重写：`public override void Foo()`
- 访问修饰符：`public` / `private`
- 赋值：`x = 1;`
{end}

