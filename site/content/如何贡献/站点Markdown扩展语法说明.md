---
title: 站点Markdown扩展语法说明
author: 小天使
date: 2026-02-07
last_updated: 2026-03-08
difficulty: beginner
time: 15分钟
description: Markdown 写作参考页：集中查询当前 viewer 与网页 IDE 支持的常用扩展语法。
topic: article-contribution
order: 20
---

# 站点Markdown扩展语法说明

这是一篇“查表页”，不是新的默认主线。

如果你是第一次贡献，优先阅读：

1. `教学文章写作指南.md`
2. `使用网页特殊动画模块.md`

当你只想查“这条语法到底怎么写”时，再回来看本页最省时间。

## 使用前先记住 4 条

1. 协议链接通常要独占一行，嵌入效果才会触发。
2. 当前常用协议前缀是 `cs:`、`anims:`、`fx:`。
3. 旧语法 `{{cs:...}} / {{anim:...}} / {{ref:...}}` 已移除。
4. 提交前先在 IDE 里点一次 `预览` 或 `新标签预览`。

## 普通文档链接

写法：

```text
[显示标题](./目标文档.md)
```

示例：

```text
[先看基础篇](./基础篇.md)
```

用途：

1. 在教程之间跳转
2. 组织阅读顺序
3. 引导读者继续深入

## C# 引用指令

### 引用整份 C# 文件

```text
[待补充说明](cs:./Demo.cs)
```

### 引用 C# 片段

```text
[类型示例](cs:./Demo.cs#cs:t:命名空间.类型名)
[方法示例](cs:./Demo.cs#cs:m:命名空间.类型名.方法名(参数类型))
```

常见选择器：

1. `#cs:t:` 类型
2. `#cs:m:` 方法
3. `#cs:p:` 属性
4. `#cs:f:` 字段
5. `#cs:c:` 常量
6. `#cs:e:` 枚举成员

## 动画引用指令

### 协议链接写法

```text
[待补充说明](anims:anims/demo-basic.anim.ts)
```

### animts 代码块写法

````md
```animts
anims/demo-basic.anim.ts
```
````

要求：

1. 路径通常以 `anims/` 开头。
2. 扩展名必须是 `.anim.ts`。
3. 最终提交前需要跑一次 `npm run build` 刷新产物。

## FX 引用指令

写法：

```text
[待补充说明](fx:./shaders/demo.fx)
```

要求：

1. 路径指向真实 `.fx` 文件。
2. 指令单独占一行时更稳定。
3. 提交前最好用 IDE 的 `渲染预览` 或 viewer 确认效果。

## 提示框（Callout）

写法：

```text
> [!NOTE]
> 说明内容
```

可用级别：

1. `NOTE`
2. `TIP`
3. `IMPORTANT`
4. `WARNING`
5. `CAUTION`

说明：

1. 级别必须写英文大写。
2. viewer 会把它渲染成对应的提示框。

## Quiz 题目语法

### 选择题

````md
```quiz
type: choice
id: demo-choice
question: |
  2 + 2 等于几？
options:
  - id: A
    text: |
      3
  - id: B
    text: |
      4
answer: B
explain: |
  正确答案是 4。
```
````

### 判断题

````md
```quiz
type: tf
id: demo-tf
question: |
  Item.damage 可以设置武器伤害。
answer: true
explain: |
  在 SetDefaults 中设置 Item.damage。
```
````

注意：`tf` 的 `answer` 必须是布尔值，不要写成字符串。

## 常用 Front Matter 字段

### 最小模板

```yaml
---
title: 文章标题
description: 一句话说明本文解决什么问题
topic: article-contribution
---
```

### 推荐补充字段

```yaml
author: 你的名字
difficulty: beginner
time: 15分钟
order: 100
```

### `source_cs`

用于在文章底部展示 C# 源码：

```yaml
source_cs: Modder入门学习/CSharp基础/CSharp_Frist.cs
```

也可以写数组：

```yaml
source_cs:
  - path/first.cs
  - path/second.cs
```

### `colors` 与 `colorChange`

用于正文中的单色文本或颜色动画文本：

```yaml
colors:
  Mad: "#ff4d4f"
colorChange:
  rainbow:
    - "#ff0000"
    - "#00ff00"
    - "#0000ff"
```

配套正文写法：

```text
{color:Mad}{这是一段单色文字}
{colorChange:rainbow}{这是一段颜色动画文字}
```

## 常见报错怎么查

### 1. 动画没有触发嵌入

先检查：

1. 这一行是不是独占一行
2. 路径是不是 `.anim.ts`
3. 路径是不是实际存在

### 2. 自检提示旧语法

如果看到 `{{cs:...}} / {{anim:...}} / {{ref:...}}`，请直接改成 `[]()` 协议链接语法。

### 3. viewer 里能看，提交后不对

优先确认是否在提交前执行过 `npm run build`，因为结构索引、搜索索引和动画产物都依赖它刷新。

## 一句话总结

本页的作用只有一个：当你忘了具体写法时，回来查，不用重新把整条贡献主线再学一遍。
