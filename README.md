# 泰拉瑞亚Mod制作教程网站

[![GitHub license](https://img.shields.io/github/license/DPapyru/DPapyru.github.io)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/network)
[![GitHub issues](https://img.shields.io/github/issues/DPapyru/DPapyru.github.io)](https://github.com/DPapyru/DPapyru.github.io/issues)

这是一个面向泰拉瑞亚Mod开发者的协作教程项目，旨在降低Mod制作门槛，让更多人能够参与到泰拉瑞亚Mod的开发中来。

## 🌟 项目概述

泰拉瑞亚是一个内容丰富的沙盒游戏，而Mod开发让玩家能够扩展游戏内容，创造全新的游戏体验。然而，Mod开发的学习曲线往往较为陡峭，特别是对于没有编程经验的玩家。

本教程网站提供：

- **循序渐进的学习路径**：从基础概念到高级技巧
- **实用的代码示例**：可直接使用的代码片段
- **最佳实践指导**：避免常见错误和陷阱
- **社区支持**：与其他Mod开发者交流和学习

## ✨ 功能特点

- **📝 Markdown支持**：使用Markdown编写内容，支持代码高亮、表格、引用等扩展语法
- **📱 响应式设计**：适配各种设备，包括桌面、平板和手机
- **🔍 智能搜索**：快速查找所需内容和代码示例
- **📋 自动目录生成**：从标题自动生成页面目录，便于导航
- **🎨 代码高亮**：支持多种编程语言的语法高亮，特别针对C#优化
- **🚀 简单路由**：基于URL的简单路由系统，支持Markdown文件直接访问
- **⚡ 快速加载**：优化的资源加载和缓存策略

## 🏗️ 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **Markdown解析**：[marked.js](https://marked.js.org/)
- **代码高亮**：[Prism.js](https://prismjs.com/)
- **部署平台**：GitHub Pages
- **构建工具**：GitHub Actions

## 📁 项目结构

```
DPapyru.github.io/
├── index.html              # 网站首页
├── README.md               # 项目说明文档
├── CONTRIBUTING.md         # 贡献指南
├── CODE_OF_CONDUCT.md      # 行为准则
├── SECURITY.md             # 安全政策
├── LICENSE                 # 许可证文件
├── _config.yml             # GitHub Pages配置
├── _redirects              # URL重定向规则
├── sitemap.xml             # 网站地图
├── robots.txt              # 爬虫指令
├── assets/                 # 静态资源
│   ├── css/               # 样式文件
│   │   ├── style.css      # 主样式文件
│   │   └── prism.min.css  # 代码高亮样式
│   ├── js/                # JavaScript文件
│   │   ├── main.js        # 主要功能脚本
│   │   ├── marked.min.js  # Markdown解析库
│   │   ├── prism.min.js   # 代码高亮库
│   │   ├── prism-csharp.min.js # C#语言支持
│   │   ├── search.js      # 搜索功能
│   │   └── navigation.js  # 导航功能
│   └── images/            # 图片资源
├── docs/                  # 文档目录
│   ├── index.html         # 文档首页
│   ├── getting-started.md  # 入门指南
│   ├── basic-concepts.md  # 基础概念
│   ├── tutorial-index.md  # 教程索引
│   └── ...                # 其他Markdown文档
├── templates/             # HTML模板
│   ├── base.html          # 基础模板
│   ├── tutorial.html      # 教程页面模板
│   └── category.html      # 分类页面模板
├── .github/               # GitHub配置
│   ├── workflows/         # GitHub Actions工作流
│   │   └── deploy.yml     # 自动部署配置
│   └── ISSUE_TEMPLATE/    # 问题模板
```

## 🚀 快速开始

### 在线访问

直接访问网站：[https://dpapyru.github.io](https://dpapyru.github.io)

### 本地运行

1. **克隆仓库**：
   ```bash
   git clone https://github.com/DPapyru/DPapyru.github.io.git
   cd DPapyru.github.io
   ```

2. **启动本地服务器**：
   ```bash
   # 使用Python（推荐）
   python -m http.server 8000
   
   # 或使用Node.js
   npx http-server -p 8000
   
   # 或使用PHP
   php -S localhost:8000
   ```

3. **访问网站**：
   打开浏览器访问 `http://localhost:8000`

## 📖 使用指南

### 添加新文档

1. 在`docs/`目录下创建新的Markdown文件（`.md`扩展名）
2. 在相应的HTML页面中添加链接到新文档
3. 系统会自动加载并渲染Markdown内容

### Markdown语法支持

支持标准Markdown语法以及以下扩展：

- **代码块**：使用```language指定语言，支持C#语法高亮
- **表格**：支持标准Markdown表格语法
- **引用块**：使用`>`创建引用块
- **列表**：支持有序和无序列表
- **链接**：支持内部和外部链接
- **图片**：支持图片嵌入和响应式显示

### 示例代码块

```csharp
using Terraria;
using Terraria.ModLoader;

namespace MyMod
{
    public class MyMod : Mod
    {
        public override void SetStaticDefaults()
        {
            DisplayName.SetDefault("我的第一个Mod");
        }
        
        public override void Load()
        {
            // Mod加载时的代码
        }
    }
}
```

### 自定义样式

可以通过修改`assets/css/style.css`来自定义样式：

- `.markdown-content`：Markdown内容容器样式
- `.table-of-contents`：目录样式
- `.loading-indicator`：加载指示器样式
- `.error-message`：错误信息样式

## 🔧 开发指南

### 环境要求

- 现代浏览器（Chrome 60+, Firefox 55+, Safari 12+, Edge 79+）
- Git版本控制工具
- 文本编辑器（推荐VS Code）

### 开发流程

1. **Fork仓库**并克隆到本地
2. **创建功能分支**：`git checkout -b feature/your-feature`
3. **进行开发**并遵循[贡献指南](CONTRIBUTING.md)
4. **提交更改**：`git commit -m "feat: 添加新功能"`
5. **推送到分支**：`git push origin feature/your-feature`
6. **创建Pull Request**

### 代码规范

- JavaScript使用2个空格缩进
- CSS使用连字符命名法
- 遵循语义化HTML5标签
- 保持代码简洁和可读性

## 🌐 浏览器支持

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📊 项目状态

![GitHub contributors](https://img.shields.io/github/contributors/DPapyru/DPapyru.github.io)
![GitHub last commit](https://img.shields.io/github/last-commit/DPapyru/DPapyru.github.io)
![GitHub repo size](https://img.shields.io/github/repo-size/DPapyru/DPapyru.github.io)

## 🤝 贡献指南

我们欢迎各种形式的贡献！请阅读我们的[贡献指南](CONTRIBUTING.md)了解详细信息。

### 贡献类型

- 📝 **内容贡献**：新教程、代码示例、概念解释
- 🐛 **错误修复**：修复网站功能问题
- ✨ **功能改进**：增强网站功能和用户体验
- 🌐 **翻译工作**：将内容翻译为其他语言
- 📖 **文档完善**：改进现有文档和说明

### 贡献者

感谢所有为本项目做出贡献的开发者！

<a href="https://github.com/DPapyru/DPapyru.github.io/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DPapyru/DPapyru.github.io" />
</a>

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🔒 安全政策

如果您发现安全漏洞，请查看我们的[安全政策](SECURITY.md)了解如何报告。

## 📋 行为准则

请阅读并遵守我们的[行为准则](CODE_OF_CONDUCT.md)，确保社区环境友好和包容。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 🐛 **GitHub Issues**：[提交问题](https://github.com/DPapyru/DPapyru.github.io/issues)
- 💬 **GitHub Discussions**：[参与讨论](https://github.com/DPapyru/DPapyru.github.io/discussions)
- 📧 **邮箱**：contact@example.com

## 🙏 致谢

感谢以下开源项目和社区：

- [marked.js](https://marked.js.org/) - Markdown解析器
- [Prism.js](https://prismjs.com/) - 代码高亮库
- [tModLoader](https://github.com/tModLoader/tModLoader) - 泰拉瑞亚Mod加载器
- [GitHub Pages](https://pages.github.com/) - 免费静态网站托管
- [泰拉瑞亚社区](https://forums.terraria.org/) - 活跃的Mod开发社区

## 📈 路线图

- [ ] 添加多语言支持
- [ ] 实现用户评论系统
- [ ] 添加代码在线编辑器
- [ ] 创建视频教程
- [ ] 开发移动应用
- [ ] 添加Mod模板生成器

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！

🔄 保持更新，定期查看新内容和功能。