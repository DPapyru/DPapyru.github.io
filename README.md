# 泰拉瑞亚 Mod 制作教程（协作站点）

[![GitHub license](https://img.shields.io/github/license/DPapyru/DPapyru.github.io)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/network)
[![GitHub issues](https://img.shields.io/github/issues/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/issues)

这是一个面向泰拉瑞亚 / tModLoader Mod 开发者的教程站点：给新人一个“能照着做”的学习路径，也欢迎大家一起补充内容。

站点框架最早是我用 AI 辅助把基础功能搭起来的（如果你发现哪里不顺手，直接提 Issue 就行）；但教程内容更希望由人来写：说人话、讲清楚、能复现。

- 在线访问：`https://dpapyru.github.io`

## 从哪里开始

- 新人建议先看：`site/content/Modder入门/DPapyru-给新人的前言.md`
- 接着按顺序学：`site/content/Modder入门/DPapyru-提问的艺术.md` → `site/content/Modder入门/DPapyru-快速开始构建Mod.md`
- 风凌的系列：`site/content/风凌的模组制作大观/前言.md`
- 螺线翻译的 tML 教程：`site/content/螺线翻译tml教程/`

## 本地预览

这是纯静态站点，起一个静态服务器就能看：

- `python -m http.server 8000`
- `npx http-server -p 8080`
- `php -S localhost:8080`

然后打开 `http://localhost:8000`。

## 使用的库 / 依赖

- Markdown 渲染：`marked`（`site/assets/js/marked.min.js`）
- 代码高亮：`Prism.js`（`site/assets/js/prism.min.js`、`site/assets/js/prism-csharp.min.js`）
- 流程图：`Mermaid`（`site/assets/js/mermaid.min.js`）
- 构建脚本依赖：`js-yaml`（用于 `site/tooling/generate-index.js` 解析 Markdown 的 YAML Front Matter）

## 写文章/改文档：构建与校验

修改 `site/content/**/*.md` 后，需要重新生成索引与搜索文件（Node `>=18`）：

- 安装依赖：`npm ci`
- 生成结构+动画：`npm run build`
- 生成结构+搜索：`npm run generate-index`
- 模拟 CI 检查：`npm run check-generated`

会更新/生成这些文件，请一起提交（不要手改它们当最终结果）：

- `site/content/config.json`
- `site/sitemap.xml`
- `site/assets/anims/`（动画编译产物）
- `site/assets/search-index.json`（搜索索引）

## 贡献文章（简版）

- 放到 `site/content/` 下面，并带 YAML Front Matter（至少要有 `title`）
- 命名建议：优先沿用当前分类目录的习惯；常见是 `site/content/<分类>/作者-标题.md`（如 `site/content/Modder入门/DPapyru-提问的艺术.md`），系列内容可以像现有目录那样继续分子目录/用 `0-`、`1-` 这类前缀。文件名尽量别用空格和特殊符号，作者名用英文/ASCII 会更省心。
- 图片建议放 `site/assets/imgs/`，并用相对路径引用
- 文章尽量自己写；AI 可以用来查资料/润色，但别整篇直接生成

更详细的流程与字段说明见：`site/content/怎么贡献/教学文章写作指南.md`

## 反馈与交流

- GitHub Issues：`https://github.com/DPapyru/DPapyru.github.io/issues`
- GitHub Discussions：`https://github.com/DPapyru/DPapyru.github.io/discussions`
- QQ 群：`960277607`

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
