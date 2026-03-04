---
title: 让我们动起来-Mod弹幕与AI指南
author: 小天使
topic: modder-basic
description: 一句话说明本文内容
order: 3
difficulty: beginner
time: 25分钟
prev_chapter: Modder入门/第一把远程武器.md
next_chapter: Modder入门/第一个配置-可调开关.md
colors:
  Mad: "#ff5430"
---

# 前言

> [!WARNING] 来自蟑螂皇帝:
>
> ***倾听我们阴暗的振翅声……我们在阴影中筑巢***
> ***贵族们永恒不变地前进着，即使他们被憎恨***
> ***然后，某一天，当你们沉浸在温暖中安然熟睡，我们就会从舒适的床上突然出现***
> ***……然后所有求生的声音开始喧哗，尖叫，扭动”，归于虚无……被我们的口器一片一片地吞噬***
> ***前进，前进，吞噬，生殖，抹除，再生，前进，前进，前进***
> - --
> {color:Mad}{弹幕如同战争一般，摧毁各种入门Modder的心脏}

上面当然只是开个玩笑（

不过弹幕这边，难的非常难，简单的非常简单。

{color:Mad}{我知道你们这些入门的想要什么，大部分都是冲着制作一把帅的武器来的}

{color:Mad}{做好心理准备，弹幕教程现在开始}

# 弹幕设置

## `SetDefaults()`

[弹幕设置](cs:./code/firstproj.cs#cs:m:ExMod.Content.Projectiles.FirstProj.SetDefaults())

## `AI()`

[弹幕AI](cs:./code/firstproj.cs#cs:m:ExMod.Content.Projectiles.FirstProj.AI())

当然，我们现在来模拟一下**Arrow**的AI

[Arrow模拟](cs:./code/firstproj.cs#cs:m:ExMod.Content.Projectiles.FirstProj.TryArrow())

# AI教学前置-数学中的向量详解

## 向量基础介绍

[动画1](anim:anims/vector-basic.anim.ts)

上面这个可交互的动画是向量的一个演示，如同你所见，向量会指向一个终点。

在数学上，向量是可以复用的，所以向量可以自由移动，所以判断两个向量是否一致，是通过判断长度和方向。

引入直角坐标系之后，向量就可以由起点O(固定(0,0))到终点A，然后我们会把终点A的坐标称呼为**向量OA**。

### 向量计算公式

- 关于指向一个目标: $ vector=终点坐标-起点坐标 $

这一块可能没接触向量的人有一点难理解，我们不妨设想一下：

> [!NOTE] 问题
>
> 如果我们已经用坐标表达的向量的话，那怎么样才能计算出起点到终点的向量？

根据上面所说的，向量是可以复用的，可以自由移动的，那么现在我们假设：

***起点就是(0,0)原点***

那么接下来坐标的加减法就是 $ (X_1-X_2,Y_1-Y_2) $

[箭的AI](anim:anims/arrow-easy-ai.anim.ts)

## 向量合成和分解

[动画2](anim:anims/vector-add-resolution.anim.ts)


