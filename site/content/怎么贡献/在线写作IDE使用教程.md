---
title: 在线写作IDE使用教程
author: 小天使
date: 2026-02-07
last_updated: 2026-02-21
difficulty: beginner
time: 30分钟
description: 面向 article-studio 的写作、预览、实时动画编译与 PR 提交流程
topic: article-contribution
order: 3
prev_chapter: 站点Markdown扩展语法说明.md
next_chapter: ContentProjects解决方案说明.md
---

# 在线写作IDE使用教程

本文对应页面：`/tml-ide/?workspace=markdown`。

当前页面定位：

1. Markdown 写作
2. viewer 同级预览
3. 本地桥接下的 animcs 实时预览
4. PR 提交

## 快速开始

1. 打开页面并设置目标文档路径
2. 点击“插入模板”生成初稿
3. 在中栏写作，右栏实时看预览
4. 完成后提交 PR

## 界面分区

1. 左栏 Explorer：文档与资源导航、上下文菜单
2. 中栏 Editor：Markdown 与 Preview
3. 右栏 Publish：登录与提交流程

## 实时动画预览（新）

### 1. 本地启动桥接服务

在仓库根目录运行：

```bash
dotnet run --project site/tooling/tools/animcs-preview-bridge
```

默认地址：`http://127.0.0.1:5078`。

### 2. 在 IDE 中连接桥接

1. 打开任意 `anims/*.cs` 资源到 C# 编辑弹窗
2. 在弹窗顶部确认桥接地址
3. 点击“连接”

状态栏会显示：

1. `AnimBridge: 已连接 ...`
2. `Anim预览: 编译中/编译成功/编译失败`

### 3. 实时编译触发规则

1. 只对 `anims/*.cs` 生效
2. 输入后 400ms 防抖自动编译
3. 单次编译超时 8s
4. 编译失败会中断动画并显示诊断

## animcs 写作规范

优先使用代码块写法：

```text
```animcs
anims/vec2-basic-ops.cs
```
```

也可使用：

```text
{{anim:anims/vec2-basic-ops.cs}}
```

## 推荐模块（首版 6 个）

1. `anims/vec2-basic-ops.cs`
2. `anims/vec2-project-decompose.cs`
3. `anims/vec3-axis-orbit.cs`
4. `anims/mat4-trs-compose.cs`
5. `anims/mat4-view-projection.cs`
6. `anims/animgeom-toolkit-recipes.cs`

## 提交流程

1. 填写 Worker API 地址
2. GitHub 登录
3. 选择新建 PR 或继续已有 PR
4. 点击提交并记录返回链接

## 发布前检查

1. Front Matter 完整（至少 `title`）
2. `animcs` 路径都是 `anims/*.cs`
3. 预览无报错
4. `npm run build` 可通过

## 常见问题

1. `AnimBridge 未连接`

先确认桥接进程是否运行，或手动改成实际地址再点“连接”。

2. `Anim预览未激活`

当前编辑文件不在 `anims/*.cs`。

3. 代码改了但动画没变

确认编辑的是被文章引用的同一路径。

4. 编译失败后不恢复

继续修改触发下一次自动编译；必要时先修复最先出现的语法错误。
