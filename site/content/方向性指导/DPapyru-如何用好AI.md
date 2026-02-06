---
title: 如何用好AI？
description: 理解 AI 的能力边界，写好 Prompt，验证输出正确性
author: DPapyru
category: 方向性指导
topic: ai-tools
last_updated: 2026-01-30
difficulty: intermediate
time: 20分钟
prev_chapter: DPapyru-如何提问.md
next_chapter: DPapyru-AI Agent的使用-在拥有水平后使用Agent提高开发速度.md
---

## 本章目标

学完本章，你能：

- 理解 AI 的能力边界
- 写出高质量的 Prompt
- 验证 AI 输出的正确性
- 避免常见的 AI 使用误区

AI 工具（ChatGPT、Claude 等）能提高开发效率，但它不是"万能答案库"。用好 AI，关键是知道"它能做什么"和"不能做什么"。

## 最短流程（建议照着走）

1. 先把需求写清楚（版本、目标、约束）。
2. 让 AI 给最小可用示例（或先给思路再给代码）。
3. 复制到 IDE 编译。
4. 进游戏验证功能。
5. 再考虑性能与边界情况。

## AI 能做什么，不能做什么？

### AI 擅长

#### 解释代码片段

**场景**：你看到别人的代码，看不懂某个方法。

**Prompt**：
- 请逐行解释下面这段代码在做什么。
- 说明 `player`、`NPC.target`、`Vector2.Distance`、`SafeNormalize` 的意义。
- 如果有潜在 bug 或不稳定点，请指出。

```csharp
public override void AI() {
    Player player = Main.player[NPC.target];
    if (player.active && Vector2.Distance(NPC.position, player.position) < 300) {
        NPC.velocity = (player.position - NPC.position).SafeNormalize(Vector2.One) * 3;
    }
}
```

**AI 能做到**：
- 解释每一行代码
- 说明变量、方法的作用
- 解释算法逻辑

#### 提供代码示例

**场景**：你想做一个右键使用后给玩家加状态的物品，但不知道用哪个方法。

**Prompt**：
```
在 tModLoader 中，如何写一个物品：右键使用后给玩家添加一个持续 10 秒的"速度 + 20%" buff？

请给出完整的 ModItem 类代码示例。
```

**AI 能做到**：
- 给出可用的 API（例如 `AddBuff`）
- 提供完整代码示例
- 解释关键方法（例如 `UseItem`、`CanUseItem`）

#### 查找 API 文档

**场景**：你不知道 `Item.damageType` 怎么设置。

**Prompt**：
```
在 tModLoader 中，`Item.damageType` 有哪些可用的值？
```

**AI 能做到**：
- 列举常用的 `DamageType`（例如 `DamageClass.Melee`）
- 说明每个值的作用
- 给出代码示例

#### 生成测试用例

**场景**：你写了一个工具方法，想测试它的边界情况。

**Prompt**：
```
我有一个方法 `int CalculateDamage(int baseDamage, int multiplier)`。

请帮我想 5 个测试用例，包括：
- 正常情况
- 边界值（0、负数）
- 异常输入

每个测试用例说明：输入、预期输出。
```

### AI 不擅长

#### 复杂的系统设计

**场景**：你想设计一个大型 Mod 的整体架构。

**AI 的问题**：
- AI 不知道你的 Mod 的具体需求
- AI 不了解你的团队规模、技术水平
- AI 无法判断"长远维护性"

**建议**：
- AI 可以给一些"架构建议"（作为参考）
- 最终决策需要你自己（或团队）判断

#### 理解特定项目的上下文

**场景**：你想让 AI 修改你自己的 Mod 代码。

**AI 的问题**：
- AI 不知道你的 Mod 的整体结构
- AI 不知道哪些代码之间有关联

**建议**：
- 提供相关代码上下文（例如整个类）
- 说明你的需求、约束条件

#### 完全正确、可运行的代码

**重要**：研究显示，AI 生成代码的准确率只有 46-65%，50% 的 AI 生成代码包含安全漏洞。

**AI 的典型错误**：
- 推荐不存在的库或 API（"幻觉"）
- 代码语法正确，但逻辑错误
- 忽略边界情况（空值、数组越界）

**建议**：
- 永远不要"直接复制粘贴" AI 代码
- 必须验证（编译、测试）

#### 创造性的游戏设计

**场景**：你想让 AI 帮你设计一个有趣的 Boss。

**AI 的问题**：
- AI 不了解"游戏平衡性"
- AI 不知道玩家的预期体验
- AI 的建议可能过于"教科书化"

**建议**：
- AI 可以给"灵感和参考"
- 最终设计需要你自己的判断

## Prompt 的基础技巧

### 技巧1：给具体上下文

#### 错误的 Prompt

```
怎么写一个 Mod
```

问题：AI 不知道你用什么（tModLoader？Minecraft Mod？）

#### 正确的 Prompt

```
在 tModLoader 1.4.4 中，如何创建一个自定义 NPC？

要求：
- NPC 类型：飞行怪物
- 行为：在白天休息、晚上活动
- 请给出完整的代码示例
```

上下文更具体，AI 的答案更准确。

### 技巧2：要求示例代码

#### 错误的 Prompt

```
如何给物品添加合成配方？
```

AI 可能会：用文字解释，没有代码。

#### 正确的 Prompt

```
在 tModLoader 中，如何给物品添加合成配方？

请给出完整的代码示例，包括 `AddRecipes` 方法的实现。
```

明确要求"代码示例"，AI 会直接给出代码。

### 技巧3：要求解释

#### 好的 Prompt

```
请给出一个 tModLoader 物品的完整示例，并逐行解释关键方法的作用。
```

这样你既能得到代码，也能理解代码。

### 技巧4：分步骤

#### 好的 Prompt

```
我想做一个自定义武器，步骤如下：

第一步：创建物品类，继承 ModItem
第二步：在 SetDefaults 里设置基础属性（伤害、大小、使用方式）
第三步：在 AddRecipes 里添加合成配方

请按照这三个步骤，逐步给出代码。
```

分步骤让 AI 的回答更有条理，也更容易理解。

### 技巧5：限制回答范围

#### 好的 Prompt

```
请用 tModLoader 官方 API 写这个物品，不要用第三方库。

我只用 C# 基础语法，不要用 LINQ、lambda 表达式。
```

限制 AI 的"创造力"，避免它用你不懂的语法。

## 验证 AI 输出的重要性

### 必须验证的点

#### 1. API 名称和参数是否正确

**示例**：AI 生成了 `Item.addRecipe(...)`，但实际 API 是 `CreateRecipe(...)`。

**验证方法**：
- 查看官方文档（tModLoader Wiki、GitHub）
- 在 IDE 中尝试"补全"，看看有没有这个方法

#### 2. 代码能否编译

**验证方法**：
- 把 AI 代码复制到 IDE
- 尝试编译
- 修复语法错误（例如缺少 using、拼写错误）

#### 3. 功能是否符合预期

**验证方法**：
- 进游戏测试
- 检查：
  - 物品能不能合成？
  - 使用效果对不对？
  - 有没有报错？

#### 4. 是否有性能隐患

**AI 常见问题**：

```csharp
// AI 可能生成的"错误"代码
public override void Update(...) {
    // 每帧都创建新对象，导致垃圾回收
    MyUtility.Calculate(NPC.position);
}

// 更好的写法
private Vector2 _cachedPosition;
public override void Update(...) {
    _cachedPosition = NPC.position;
    MyUtility.Calculate(_cachedPosition);
}
```

**验证方法**：
- 看代码逻辑，有没有"每帧创建新对象"、"不必要的计算"
- 进游戏测试，看有没有卡顿

### 验证流程

1. AI 生成代码
2. 复制到 IDE
3. 查文档确认 API 是否存在
4. 编译，先把语法与引用问题修好
5. 进游戏验证功能
6. 检查性能（帧率、卡顿）

每一步都通过了，才能说"AI 的代码可用"。

## AI 辅助学习的正确姿势

### 场景1：看不懂代码

**Prompt**：
- 请逐行解释下面这段代码的作用。
- 把你认为关键的 API 点出来（例如某个属性/方法的来源与用途）。
- 如果可能，请说明这段代码最常见的报错点。

```csharp
[你的代码]
```

**使用方法**：
- 对比 AI 的解释和你自己的理解
- 不懂的地方再追问："第 5 行的 `SafeNormalize` 是什么意思？"

### 场景2：不知道从哪下手

**Prompt**：
```
我想做一个自定义 Boss，需求如下：
- 第一个阶段：AI 是飞行，发射弹幕
- 第二个阶段：AI 变为地面行走，释放召唤物

第一步应该做什么？请给出建议，不要直接给完整代码。
```

**使用方法**：
- AI 给出建议（"先设计 Boss 类结构"、"先实现第一个阶段的 AI"）
- 你自己动手实现
- 遇到问题再问 AI

### 场景3：调试报错

**Prompt**：
我的 Mod 在加载时报错，我想知道可能的原因，以及我应该按什么顺序排查。

错误信息（完整粘贴）：
```text
[Error] Mod failed to load: MyMod
System.NullReferenceException: Object reference not set to an instance of an object
   at MyMod.MyModClass.Load()
```

相关代码：
```csharp
public override void Load() {
    var item = ModContent.ItemType<MySword>();
    // 这里的 item 会不会是 null？
    ...
}
```

**使用方法**：
- AI 给出可能的原因（例如 `MySword` 没注册）
- 你自己验证 AI 的建议
- 修正代码后再测试

## 常见误区

### 误区1：AI 永远是对的

AI 会犯错，有时是明显的 API 幻觉，有时是更隐蔽的逻辑问题。你必须自己验证。

**正确做法**：
- 把 AI 当作"初级开发者"
- AI 的代码需要你审核、验证、测试

### 误区2：直接复制粘贴 AI 代码

**错误做法**：
```
AI 给了代码 -> 直接复制到项目 -> 提交 -> 发布
```

**问题**：
- 你不理解代码
- 出 Bug 时不知道怎么修
- 后续维护困难

**正确做法**：
```
AI 给了代码 -> 阅读并理解 -> 验证（编译、测试）-> 根据需要调整 -> 提交
```

### 误区3：完全依赖 AI 解决问题

**错误做法**：
- 遇到问题就问 AI
- 不自己思考、不查文档
- AI 说是什么就是什么

**问题**：
- 你的能力不会提升
- AI 可能把问题引向错误方向

**正确做法**：
- 先自己思考："这个问题可能是什么原因？"
- 查找文档、搜索资料
- 把 AI 当作"辅助工具"，而不是"替代工具"

### 误区4：不验证就运行

**错误做法**：
- AI 生成了代码，直接进游戏测试
- 测不过，又问 AI，又直接复制

**问题**：
- 累积大量 Bug
- 不知道问题出在哪里

**正确做法**：
- 先编译（检查语法）
- 再检查 API（查文档）
- 最后测试游戏

## 进阶：如何让 AI 更理解你的项目

### 提供项目上下文

**示例 Prompt**：
```
我的 Mod 结构如下：
- MyMod/
  - MyMod.cs
  - Items/
    - MySword.cs
    - MyBow.cs
  - NPCs/
    - MyEnemy.cs
  - Projectiles/
    - MyArrow.cs

我使用的 tModLoader 版本：1.4.4.9

我想给所有 Items 下的物品添加一个自定义属性"magicPower"，应该如何实现？
```

### 限制回答范围

**示例 Prompt**：
```
请用 tModLoader 官方 API 写这个功能，不要用第三方库。

我只用 C# 基础语法，不要用 LINQ、lambda 表达式。
```

### 要求"最小可运行示例"

**示例 Prompt**：
```
请给出一个最小可运行的示例，不要包含复杂的逻辑。

重点展示：如何调用 `AddBuff` 方法。
```

## 下一步

熟练使用 AI 后，你可以尝试使用 AI Agent 进行更复杂的开发任务。但注意：AI Agent 有更高的使用门槛，需要你先掌握基础的 Mod 开发能力。

{{ref:DPapyru-AI Agent的使用-在拥有水平后使用Agent提高开发速度.md|AI Agent 的使用——在拥有水平后使用Agent提高开发速度}}
