# Shader Gallery 投稿说明

社区 Shader 通过 Pull Request 提交到这里。

目录结构建议：

- `site/content/shader-gallery/<slug>/entry.json`
- `site/content/shader-gallery/<slug>/shader.json`
- `site/content/shader-gallery/<slug>/cover.webp`（推荐）

## entry.json 示例

```json
{
  "slug": "noise-vignette",
  "title": "Noise Vignette",
  "author": "DPapyru",
  "description": "简单的噪声暗角示例，适合测试 iTime 与采样。",
  "shader": "shader.json",
  "cover": "cover.webp",
  "tags": ["noise", "vignette", "demo"],
  "updated_at": "2026-02-08"
}
```

## 规则

1. `slug` 仅允许小写字母、数字、`-`。
2. `shader` 必须指向同目录内的 `json` 文件。
3. 封面最终必须是 `webp`。
4. 提交前建议运行：
   - `npm run gallery:normalize`
   - `npm run gallery:check`

## 自动转换

允许先提交 `png/jpg/jpeg/gif`，但仓库最终应保留 `cover.webp`。
运行 `npm run gallery:normalize` 会自动转换并更新 `entry.json`。
