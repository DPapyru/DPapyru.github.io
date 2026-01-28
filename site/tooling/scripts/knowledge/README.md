# 知识库工具

## tModLoader API index (v1)

本仓库提供了一个脚手架生成器：读取 `tModLoader.dll` 并导出离线 JSON 索引：

- 输出：`site/assets/knowledge/tmodloader-api-index.v1.json`
- 范围（v1）：
  - tModLoader「可 override 的 hooks」：常用 `Terraria.ModLoader.*` 基类中，`public/protected` 且 `virtual/abstract` 的实例方法
  - Terraria 核心类型：`Terraria.Main`、`Terraria.Player`、`Terraria.NPC` 的公开成员（methods + fields + properties）

### 运行（Windows）

```bash
dotnet run --project scripts/knowledge/tmodloader-api-indexer -- ^
  --dll "F:\steam\steamapps\common\tModLoader\tModLoader.dll" ^
  --out "assets\knowledge\tmodloader-api-index.v1.json"
```

说明：
- 该工具使用 `MetadataLoadContext`，不会执行游戏代码。
- 请确保 `.dll` 所在目录包含依赖的 `.dll` 文件（Steam 安装目录通常已包含）。

## 从导出的索引生成 map 占位项

当你已经生成 `site/assets/knowledge/tmodloader-api-index.v1.json` 后，可以用脚本批量补充 route 映射 / 概念占位条目：

```bash
node scripts/knowledge/generate-map-stubs-from-api-index.js --index site/assets/knowledge/tmodloader-api-index.v1.json --map site/assets/knowledge/map.v1.json
```

### map 文件已拆分（推荐直接编辑分文件）

为避免 `site/assets/knowledge/map.v1.json` 过长不便维护，现在采用「根索引 + 分文件」结构：

- 根索引：`site/assets/knowledge/map.v1.json`（只包含 `schemaVersion` + `parts`）
- 概念内容：`site/assets/knowledge/map.v1.concepts.json`（`concepts`）
- 词条映射：`site/assets/knowledge/map.v1.lexemes.json`（`lexemes`）
- tML API 路由：`site/assets/knowledge/map.v1.tmodloaderApi.json`（`tmodloaderApi`）

脚本依然接受 `--map site/assets/knowledge/map.v1.json`，并会自动把更新写入对应的分文件中。
