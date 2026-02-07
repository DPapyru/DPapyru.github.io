---
title: 分流路由编写说明（V2）
author: DPapyru
category: 怎么贡献
topic: mod-basics
---

# 分流路由编写说明（V2）

本目录用于存放教程分流配置文件（`*.route.json`）。

## 目标

- 内容作者专注写教程内容，不再手写复杂条件表达式。
- 分流逻辑由 JSON 路由定义承载，并由构建脚本统一校验。

## 目录约定

- 实际生效路由：`site/content/routes/*.route.json`（支持子目录）
- 模板库：`site/content/routes/templates/`（不会编译到产物）
- 示例：`site/content/routes/examples/`（不会编译到产物）

## V2 关键规则

- `version` 必须为 `2`
- `dimension` 仅允许 `C`、`T`、`G`
- `path` 仅允许 `remedial`、`standard`、`fast`、`deep`
- `decision` 节点必须配置 `fallback`
- 每个路由最多 3 个 `decision` 节点

## 构建命令

- 仅编译路由：`npm run generate-routes`
- 内容校验（含路由校验）：`npm run check-content`
- 全量构建：`npm run build`

