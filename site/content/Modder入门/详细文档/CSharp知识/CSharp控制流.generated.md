---
title: "C#控制流"
description: 掌握 if/else、循环与 return，让代码“按条件运行”
author: 小天使
category: Modder入门
topic: know-csharp
date: 2026-01-25
difficulty: beginner
time: 15分钟
last_updated: 2026-01-28
prev_chapter: CSharp变量表达式
next_chapter: CSharp数组与集合
---

## 控制流是什么

控制流就是“让程序按条件走不同的路”：
- 条件判断：`if/else`、`switch`
- 循环：`for`、`foreach`、`while`
- 跳转：`return`、`break`、`continue`

做 Mod 时，你会不停写这种逻辑：满足某个条件才生效、不满足就跳过。

下面给三段小例子，分别对应：`if/else`、`switch`、循环。

初学建议：
- 先把“退出条件”写出来（比如 `if (!enabled) return;`）
- 再写核心逻辑
- 最后再补充日志/调试输出

### 示例代码：if / else（最常用）

```csharp
public static int ClampToNonNegative(int value) {
    if (value < 0) return 0;
    return value;
}
```

## 早返回（guard clause）：让嵌套更少

很多新手会写出很深的嵌套：

- `if (a) { if (b) { if (c) { ... } } }`

更推荐的写法是“早返回/早 continue”：
- 先把不满足条件的情况排除掉
- 剩下的代码就是你真正关心的路径

这会让你的代码有两个好处：
- 缩短嵌套层级（更好读）
- 更容易插入调试输出（你知道每个 return 对应什么原因）

### 示例代码：早返回

```csharp
public static int SafeDivide(int a, int b) {
    if (b == 0) return 0;
    return a / b;
}
```

### 示例代码：switch（多分支选择）

```csharp
public static string RarityName(int rarity) {
    return rarity switch {
        0 => "White",
        1 => "Blue",
        2 => "Green",
        _ => "Other"
    };
}
```

### 示例代码：for / foreach / while

```csharp
public static int SumFirstN(int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum += i;
    }
    return sum;
}

public static void IteratePlayers() {
    // 这里用 Main.player 做示例；实际 Mod 里你会更小心地处理 null / inactive 等情况。
    foreach (Player player in Main.player) {
        if (player == null || !player.active) continue;
        // ...对玩家做处理
    }
}
```

## break/continue：循环里的两种跳转

在循环里你会经常用到两种“跳转”：
- `continue`：跳过本次循环，直接进入下一次
- `break`：直接退出整个循环

经验法则：
- “这个元素不满足条件” -> `continue`
- “已经找到了目标/不需要继续” -> `break`

### 示例代码：break/continue

```csharp
public static int FindFirstPositive(int[] values) {
    foreach (int v in values) {
        if (v <= 0) continue;
        return v; // 找到后直接结束方法，也是一种“早退出”
    }
    return 0;
}
```

## while：当你不知道循环次数时

`for` 适合“循环次数明确”的场景。

`while` 适合“直到满足某个条件为止”的场景（循环次数不一定固定）。

注意：`while` 很容易写成死循环，写的时候要特别关注退出条件。

### 示例代码：while（带退出条件）

```csharp
public static int Countdown(int start) {
    int x = start;
    while (x > 0) {
        x--;
    }
    return x;
}
```

## 经验法则：先写最清晰的版本

初学阶段的优先级：
1. 逻辑正确
2. 可读性强（未来一眼能看懂）
3. 再考虑“少写几行”

常见建议：
- 条件很简单：直接 `if` + 早返回（early return）
- 分支很多：`switch` 或拆成多个小方法
- 循环里尽量用 `continue` 把“异常/不满足条件”的情况提前过滤掉

关于 `foreach`：
- 可读性最好，适合遍历集合
- 但不要在 `foreach` 里修改正在遍历的集合（会抛异常或产生奇怪行为）

关于 `switch`：
- 分支很少：if/else 更直接
- 分支很多且互斥：switch 更清晰

关于“嵌套 if”：
- 如果你写出了三层以上的嵌套，优先考虑拆方法或用早返回

## 下一步

下一章会讲“把很多数据放在一起怎么管”：数组与集合。

<!-- generated from: Modder入门/详细文档/CSharp知识/CSharp控制流.cs -->
