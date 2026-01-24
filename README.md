# 泰拉瑞亚 Mod 制作教程（协作站点）

[![GitHub license](https://img.shields.io/github/license/DPapyru/DPapyru.github.io)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/network)
[![GitHub issues](https://img.shields.io/github/issues/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/issues)

这是一个面向泰拉瑞亚 / tModLoader Mod 开发者的教程站点：给新人一个“能照着做”的学习路径，也欢迎大家一起补充内容。

站点框架最早是我用 AI 辅助把基础功能搭起来的（如果你发现哪里不顺手，直接提 Issue 就行）；但教程内容更希望由人来写：说人话、讲清楚、能复现。

- 在线访问：`https://dpapyru.github.io`

## 从哪里开始

- 新人建议先看：`docs/Modder入门/DPapyru-给新人的前言.md`
- 接着按顺序学：`docs/Modder入门/DPapyru-提问的艺术.md` → `docs/Modder入门/DPapyru-快速开始构建Mod.md`
- 风凌的系列：`docs/风凌的模组制作大观/前言.md`
- 螺线翻译的 tML 教程：`docs/螺线翻译tml教程/`

## 本地预览

这是纯静态站点，起一个静态服务器就能看：

- `python -m http.server 8000`
- `npx http-server -p 8080`
- `php -S localhost:8080`

然后打开 `http://localhost:8000`。

## 使用的库 / 依赖

- Markdown 渲染：`marked`（`assets/js/marked.min.js`）
- 代码高亮：`Prism.js`（`assets/js/prism.min.js`、`assets/js/prism-csharp.min.js`）
- 流程图：`Mermaid`（`assets/js/mermaid.min.js`；`docs/viewer.html` 在本地缺失时会尝试从 CDN 兜底加载）
- 构建脚本依赖：`js-yaml`（用于 `generate-index.js` 解析 Markdown 的 YAML Front Matter）

## 写文章/改文档：构建与校验

修改 `docs/**/*.md` 后，需要重新生成索引与搜索文件（Node `>=18`）：

- 安装依赖：`npm ci`
- 生成文件：`npm run build`（或 `node generate-index.js`）
- 模拟 CI 检查：`npm run check-generated`

会更新/生成这些文件，请一起提交（不要手改它们当最终结果）：

- `docs/config.json`
- `assets/search-index.json`（二进制索引，非文本 JSON）
- `sitemap.xml`

## （可选）LLM：按小节生成“抽象语义”检索线索

站内搜索会使用“按 Markdown 小节（section）”的语义元数据来增强对抽象问法/新造词的匹配（仍然只输出来自文章的引用段落）。该元数据分为两份：

- 人工维护表（优先级更高）：`docs/search/section-semantic.manual.v1.yml`
- AI 生成表（二进制，gzip JSON）：`docs/search/section-semantic.ai.v1.json.gz`

维护方式建议走 GitHub Actions 自动开 PR（避免把 API Key 暴露在前端，也避免每次构建都不稳定）：

1. 在仓库 Settings → Secrets and variables → Actions 中添加：
   - `LLM_API_KEY`：大模型 API Key
   - `LLM_BASE_URL`：OpenAI 兼容 base url（以 `/v1` 结尾）
   - （可选）`LLM_MODEL`：默认 `glm-4.7-flash`
   - （可选）`MAX_SECTIONS`：本次最多处理多少个小节（用于分批更新/控成本）
2. 在 Actions 中手动运行：`Update Section Semantic (LLM)`（会自动创建/更新一个 PR）
3. 合并 PR 后，再由 Pages 部署流程发布

普通贡献者不需要运行该 workflow：你只要按上面的方式写文章并 `npm run build` 即可；如遇到“抽象问法搜不到/跑偏”，可以在 PR 里直接手动补充 `docs/search/section-semantic.manual.v1.yml` 的相关小节条目。

## 贡献文章（简版）

- 放到 `docs/` 下面，并带 YAML Front Matter（至少要有 `title`）
- 命名建议：优先沿用当前分类目录的习惯；常见是 `docs/<分类>/作者-标题.md`（如 `docs/Modder入门/DPapyru-提问的艺术.md`），系列内容可以像现有目录那样继续分子目录/用 `0-`、`1-` 这类前缀。文件名尽量别用空格和特殊符号，作者名用英文/ASCII 会更省心。
- 图片建议放 `assets/imgs/`，并用相对路径引用
- 文章尽量自己写；AI 可以用来查资料/润色，但别整篇直接生成

更详细的流程与字段说明见：`docs/怎么贡献/教学文章写作指南.md`

## 反馈与交流

- GitHub Issues：`https://github.com/DPapyru/DPapyru.github.io/issues`
- GitHub Discussions：`https://github.com/DPapyru/DPapyru.github.io/discussions`
- QQ 群：`960277607`

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
