# 教程索引

这个文件是泰拉瑞亚Mod制作教程的索引，列出了所有可用的教程资源。索引是自动生成的，贡献者可以通过添加新的教程文件来更新此索引。

## 如何添加新教程

1. 在`docs`目录下创建新的Markdown文件
2. 在文件开头添加以下元数据格式：

```markdown
---
title: 教程标题
difficulty: beginner|intermediate|advanced
category: getting-started|basic-concepts|mod-development|advanced-topics|resources
time: 预计完成时间（分钟）
author: 作者名称
date: 更新日期（YYYY-MM-DD）
description: 简短描述
---
```

3. 运行`node generate-index.js`脚本自动更新此索引文件

## 入门指南

### [给新人的入门建议](DPapyru-ForNewModder.md)
- **难度**: 初级
- **预计时间**: 5分钟
- **作者**: 小天使
- **更新日期**: 2025-11-27
- **描述**: 给新人的入门建议

## 资源参考

### [贡献者怎么编写文章？](DPapyru-ForContributors-Basic.md)
- **难度**: 初级
- **预计时间**: 5分钟
- **作者**: 小天使
- **更新日期**: 2025-11-26
- **描述**: 用于测试文档查看器功能的示例文档

### [Topic 系统使用指南](TopicSystemGuide.md)
- **难度**: 高级
- **预计时间**: 30分钟
- **作者**: 小天使
- **更新日期**: 2025-11-27
- **描述**: 详细介绍Topic系统的使用方法和最佳实践

---

## 自动生成脚本

为了方便贡献者，我们提供了一个Node.js脚本来自动生成教程索引：

```javascript
// generate-index.js
const fs = require('fs');
const path = require('path');

// 读取所有Markdown文件
const docsDir = './docs';
const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');

// 按类别分组
const categories = {
    'getting-started': [],
    'basic-concepts': [],
    'mod-development': [],
    'advanced-topics': [],
    'resources': []
};

// 解析每个文件的元数据
files.forEach(file => {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    const metadata = parseMetadata(content);
    
    if (metadata.category) {
        categories[metadata.category].push({
            file,
            ...metadata
        });
    }
});

// 生成索引内容
let indexContent = `# 教程索引\\n\\n`;
// ... 其余脚本内容
```

要使用此脚本，请运行：

```bash
node generate-index.js
```

这将自动扫描`docs`目录中的所有Markdown文件，解析它们的元数据，并更新`tutorial-index.md`文件。
