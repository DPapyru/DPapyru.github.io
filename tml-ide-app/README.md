# tml-ide-app

独立于 `site` / `limbus` 的 tModLoader C# IDE 工程源码目录。

- 运行开发：`npm run dev`
- 构建发布：`npm run build`
- 单元测试：`npm run test`

构建输出固定写入仓库根目录 `tml-ide/`，用于静态托管访问 `/tml-ide/`。

## 数据契约

- `api-index.v2.json`：基础补全索引（放在 `public/data/api-index.v2.json`）
- `workspace.v1.json`：浏览器导出/导入的工作区格式
- `session-pack.v1.json`：追加程序集离线包

## 索引生成 CLI

```bash
dotnet run --project tml-ide-app/tooling/indexer -- \
  --dll <tModLoader.dll> \
  [--xml <tModLoader.xml>] \
  [--terraria-dll <Terraria.dll>] \
  [--terraria-xml <Terraria.xml>] \
  --out <api-index.v2.json>
```

```bash
dotnet run --project tml-ide-app/tooling/indexer -- \
  --dll <extra-mod.dll> \
  [--xml <extra-mod.xml>] \
  --append <session-pack.v1.json>
```

说明：
- 若未提供 `--xml`，工具会自动尝试 `<dll 同目录同名 .xml>`；未找到时继续生成但不含 XML 文档。
- `--terraria-dll/--terraria-xml` 可选；提供时会并入同一份 `api-index.v2.json`。
