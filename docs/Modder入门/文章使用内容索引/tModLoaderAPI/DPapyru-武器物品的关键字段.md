---
title: tModLoader：武器物品的关键字段（从能用到好用）
author: 小天使
date: 2026-01-21
last_updated: 2026-01-21
difficulty: beginner
time: 18分钟
description: 以 ModItem 为例，解释武器的核心字段：DamageType、useTime/useAnimation、useStyle、击退、自动挥舞、发射弹幕等
topic: items
order: 20
min_c: 0
min_t: 0
---

# tModLoader：武器物品的关键字段（从能用到好用）

## 概览

在 tModLoader 里，“武器”首先是一个 `ModItem`，它的核心是：**伤害模型 + 使用动作 +（可选）发射**。

你通常需要理解并设置这些字段：

- **伤害与类型**
  - `Item.damage`：基础伤害数值
  - `Item.DamageType`：伤害类别（近战/远程/魔法/召唤等，影响词缀、加成与 UI）
- **使用动作（手感）**
  - `Item.useTime`：使用间隔（越小越快）
  - `Item.useAnimation`：使用动画长度（通常与 `useTime` 相同或略大）
  - `Item.useStyle`：使用方式（挥舞/刺击/举枪等）
- **表现与附加**
  - `Item.knockBack`：击退
  - `Item.UseSound`：使用音效
  - `Item.autoReuse`：按住持续使用
- **发射（可选）**
  - `Item.shoot` / `Item.shootSpeed`：默认发射的弹幕类型与速度
  - `Shoot(...)`：高级入口，用于“自定义发射逻辑”（随机散射、连发、多弹、条件换弹幕等）

把它类比成“乐谱”更准确：`damage` 是音高，`useTime/useAnimation` 是节拍，`useStyle` 是演奏方式；写对了才谈得上“好听”。

## 最小示例

{if T == 0}
下面是一个“能用”的近战武器最小集合（字段不求完备，但要能解释清楚）：

```csharp
using Terraria;
using Terraria.ID;
using Terraria.ModLoader;

public class FirstSword : ModItem
{
    public override void SetDefaults()
    {
        Item.width = 40;
        Item.height = 40;

        Item.damage = 12;
        Item.DamageType = DamageClass.Melee;
        Item.knockBack = 4f;

        Item.useStyle = ItemUseStyleID.Swing;
        Item.useTime = 20;
        Item.useAnimation = 20;
        Item.UseSound = SoundID.Item1;
        Item.autoReuse = true;
    }
}
```

阅读顺序建议是：先理解 `DamageType`，再看 `useTime/useAnimation`，最后看 `useStyle` 与 `autoReuse`。
{else if T == 1}
你可以把“近战挥舞类”武器的最小配置理解为三组：碰撞体积（`width/height`）、伤害模型（`damage/DamageType/knockBack`）、动作（`useStyle/useTime/useAnimation/UseSound`）。
{else}
对工程化写法而言，关键是把“手感相关”的字段分组并集中调参（例如用 `const` 或一处表驱动），避免在多处写魔法数字导致手感不可控。
{end}

## 常见坑

{if P_troubleshoot}
- 忘了设置 `Item.DamageType`：伤害加成与 UI 表现可能不符合预期（尤其从示例改动时）。
- `useTime` 与 `useAnimation` 不匹配：看起来“能挥”，但手感与动画会出现不一致，甚至出现奇怪的节奏。
- 只改 `damage` 不验证：请用“新生成的物品实例”验证默认值（热重载并不总能让旧实例更新）。
- 设置了 `Item.shoot` 却没设置 `Item.shootSpeed`：弹幕会出现但速度为 0 或表现异常。
{end}

## 进阶与惯用写法

{if P_best_practice}
- 把“需要频繁调参”的字段放在一起（`damage/useTime/useAnimation/knockBack/shootSpeed`），并避免在多处重复写同一组值。
- 如果你使用的 tML 版本提供 `Item.DefaultTo...` 这类辅助方法，可以用它减少遗漏字段；但优先保证你理解每个字段的含义。
- 先做一个“可验证的最小武器”，再叠加发射、特效与 AI；这样排错成本最低。
{end}

## API 速查

{if P_api_reference}
- `Item.damage`：基础伤害
- `Item.DamageType`：伤害类别（`DamageClass.Melee`/`Ranged`/`Magic`/`Summon`…）
- `Item.useTime` / `Item.useAnimation`：使用间隔 / 动画长度
- `Item.useStyle`：使用动作（`ItemUseStyleID.*`）
- `Item.knockBack`：击退
- `Item.autoReuse`：自动连用
- `Item.shoot` / `Item.shootSpeed`：默认发射弹幕
- `ModItem.Shoot(...)`：自定义发射逻辑入口
{end}
