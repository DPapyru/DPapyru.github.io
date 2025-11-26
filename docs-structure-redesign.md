# 泰拉瑞亚Mod制作教程文档结构重新设计方案

## 概述

本方案旨在解决GitHub Pages无法访问二级子目录的限制，重新设计一个扁平化的文档结构，同时保持良好的分类体验和多人协作的便利性。

## 核心设计原则

1. **扁平化结构**：所有文档文件位于docs根目录下，避免GitHub Pages的访问限制
2. **双层分类系统**：主分类（入门/进阶/高级/个人分享）+ 主题领域分类
3. **元数据驱动**：通过Front Matter元数据实现灵活的分类和导航
4. **自动化生成**：配置文件和索引页面自动生成，支持多人协作
5. **简洁命名**：文件名采用"作者名-文档标题"格式，便于识别和管理

## 1. 文档结构设计

### 1.1 扁平化文件结构

```
docs/
├── index.html              # 自动生成的文档导航页面
├── viewer.html             # 文档查看器
├── config.json             # 自动生成的配置文件
├── test.md                # 测试文档
├── DPapyru-mod基础入门.md
├── Alice-物品系统详解.md
├── Bob-NPC系统开发指南.md
├── Carol-世界生成教程.md
└── ...
```

### 1.2 双层分类系统

**主分类**：
- 入门：适合初学者的基础教程
- 进阶：有一定基础后的进阶教程
- 高级：面向有经验开发者的高级教程
- 个人分享：社区成员的个人经验和技巧分享

**主题领域**：
- env：环境配置
- mod-basics：Mod基础
- items：物品系统
- npcs：NPC系统
- world-gen：世界生成
- ui：UI界面
- networking：网络功能
- advanced：高级功能

## 2. 文件命名方案

### 2.1 命名规则

```
[作者名]-[文档标题].md
```

### 2.2 示例

- `DPapyru-mod基础入门.md`
- `Alice-物品系统详解.md`
- `Bob-NPC系统开发指南.md`
- `Carol-世界生成教程.md`

## 3. Front Matter元数据结构

每个Markdown文档必须包含以下Front Matter：

```yaml
---
title: "Mod基础入门"
author: "DPapyru"
category: "入门"  # 入门、进阶、高级、个人分享
topic: "mod-basics"  # 主题领域代码
order: 1  # 在该分类和主题下的顺序
description: "介绍Mod开发的基础概念和核心API"
tags: ["基础", "API", "入门"]
last_updated: "2025-11-26"
---
```

## 4. 自动生成系统

### 4.1 配置文件结构

**docs/config.json** (自动生成)

```json
{
  "categories": {
    "入门": {
      "title": "入门",
      "description": "适合初学者的基础教程",
      "topics": {
        "mod-basics": {
          "title": "Mod基础",
          "description": "Mod开发的基础概念",
          "files": [
            {
              "filename": "DPapyru-mod基础入门.md",
              "title": "Mod基础入门",
              "author": "DPapyru",
              "order": 1,
              "description": "介绍Mod开发的基础概念和核心API",
              "last_updated": "2025-11-26"
            }
          ]
        }
      }
    }
  },
  "topics": {
    "mod-basics": {
      "title": "Mod基础",
      "description": "Mod开发的基础概念和核心API"
    }
  },
  "authors": {
    "DPapyru": {
      "name": "DPapyru",
      "files": ["DPapyru-mod基础入门.md"]
    }
  },
  "all_files": [
    {
      "filename": "DPapyru-mod基础入门.md",
      "title": "Mod基础入门",
      "author": "DPapyru",
      "category": "入门",
      "topic": "mod-basics",
      "order": 1
    }
  ]
}
```

### 4.2 构建脚本

**scripts/build.js** - 主构建脚本
**scripts/generate-config.js** - 配置文件生成脚本
**scripts/generate-docs-index.js** - 索引页面生成脚本

### 4.3 构建命令

```bash
npm run build-docs          # 完整构建
npm run generate-config     # 仅生成配置文件
npm run generate-index      # 仅生成索引页面
```

## 5. viewer.html更新方案

### 5.1 路径处理逻辑

更新viewer.html中的路径处理逻辑，支持新的文件结构：

```javascript
// 更新后的loadMarkdownDirectly函数
function loadMarkdownDirectly(filePath) {
    // 直接使用文件名，因为所有文件都在docs根目录
    const fetchUrl = `./${filePath}`;
    
    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdownText => {
            // 处理文档内容...
        })
        .catch(error => {
            console.error('加载失败:', error);
        });
}
```

### 5.2 导航更新

基于配置文件动态生成导航菜单：

```javascript
// 使用配置文件生成导航
function initializeCategoryNavigation() {
    fetch('./config.json')
        .then(response => response.json())
        .then(config => {
            const categorySidebar = document.getElementById('category-sidebar');
            
            Object.keys(config.categories).forEach(categoryKey => {
                const category = config.categories[categoryKey];
                
                // 创建分类导航项
                const categoryItem = document.createElement('li');
                categoryItem.innerHTML = `<h4>${category.title}</h4>`;
                
                // 创建主题子菜单
                const topicList = document.createElement('ul');
                Object.keys(category.topics).forEach(topicKey => {
                    const topic = category.topics[topicKey];
                    
                    topic.files.forEach(file => {
                        const fileItem = document.createElement('li');
                        fileItem.innerHTML = `<a href="?file=${file.filename}">${file.title}</a>`;
                        topicList.appendChild(fileItem);
                    });
                });
                
                categoryItem.appendChild(topicList);
                categorySidebar.appendChild(categoryItem);
            });
        });
}
```

## 6. docs/index.html自动生成

### 6.1 模板系统

使用模板系统生成docs/index.html，支持动态内容注入：

- 模板文件：`templates/docs-index-template.html`
- 配置数据：从`docs/config.json`读取
- 生成目标：`docs/index.html`

### 6.2 动态功能

- 分类卡片自动生成
- 搜索功能基于配置数据
- 响应式设计
- 实时内容更新

## 7. 迁移计划

### 7.1 现有文档迁移

1. **分析现有文档**：扫描现有的二级目录结构
2. **提取元数据**：从现有文档中提取或创建Front Matter
3. **重命名文件**：按照新的命名规则重命名文件
4. **移动文件**：将所有文件移动到docs根目录
5. **更新链接**：更新所有内部链接和引用

### 7.2 迁移脚本

**scripts/migrate-docs.js** - 自动化迁移脚本

```javascript
function migrateDocs() {
    // 1. 扫描现有文档结构
    // 2. 生成新的文件名和元数据
    // 3. 移动和重命名文件
    // 4. 更新内部链接
    // 5. 生成迁移报告
}
```

## 8. 向后兼容性

### 8.1 旧链接重定向

在docs/redirect.html中实现旧链接的重定向：

```javascript
// 重定向逻辑
function handleRedirect() {
    const oldPath = window.location.pathname;
    const newPath = convertOldPathToNew(oldPath);
    
    if (newPath && newPath !== oldPath) {
        window.location.href = newPath;
    }
}

function convertOldPathToNew(oldPath) {
    // 将旧的二级目录路径转换为新的文件名
    // 例如：/docs/01-入门指南/README.md -> /docs/viewer.html?file=DPapyru-mod基础入门.md
}
```

### 8.2 渐进式迁移

- 保留旧文档结构一段时间
- 在新系统中提供旧文档的访问入口
- 逐步引导用户使用新的文档结构

## 9. 实施步骤

### 9.1 准备阶段

1. 创建脚本目录和模板文件
2. 设置构建脚本和package.json配置
3. 测试构建流程

### 9.2 迁移阶段

1. 备份现有文档
2. 运行迁移脚本
3. 验证迁移结果
4. 生成新的配置和索引文件

### 9.3 部署阶段

1. 提交更改到版本控制
2. 部署到GitHub Pages
3. 测试所有功能
4. 监控错误和问题

### 9.4 维护阶段

1. 建立文档更新流程
2. 设置自动化构建（GitHub Actions）
3. 定期检查和优化

## 10. 优势总结

1. **解决GitHub Pages限制**：扁平化结构避免了二级目录访问问题
2. **保持良好的分类体验**：双层分类系统提供了清晰的组织结构
3. **支持多人协作**：自动生成系统减少了手动维护工作
4. **灵活的元数据系统**：Front Matter提供了丰富的文档信息
5. **简洁的文件命名**：便于识别和管理文档
6. **自动化构建**：减少了人工错误和维护成本
7. **向后兼容**：平滑的迁移过程保护了现有链接

## 11. 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **构建工具**：Node.js, npm scripts
- **模板系统**：自定义模板引擎
- **数据处理**：JSON, Front Matter
- **版本控制**：Git, GitHub Pages

## 12. 后续优化

1. **性能优化**：实现文档缓存和增量更新
2. **搜索增强**：添加全文搜索和智能推荐
3. **用户体验**：改进导航和交互设计
4. **国际化**：支持多语言文档
5. **API集成**：与GitHub API集成，自动同步更新

## 13. GitHub Actions自动化工作流

### 13.1 工作流配置

**.github/workflows/docs-build.yml**

```yaml
name: Documentation Build and Deploy

on:
  push:
    branches: [ main, master ]
    paths:
      - 'docs/**/*.md'
      - 'scripts/**'
      - 'templates/**'
      - 'package.json'
  pull_request:
    branches: [ main, master ]
    paths:
      - 'docs/**/*.md'
      - 'scripts/**'
      - 'templates/**'
      - 'package.json'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: |
        npm ci
        
    - name: Validate documentation
      run: |
        node scripts/validate-docs.js
        
    - name: Build documentation
      run: |
        npm run build-docs
        
    - name: Check for changes
      id: verify-changed-files
      run: |
        if [ -n "$(git status --porcelain)" ]; then
          echo "changed=true" >> $GITHUB_OUTPUT
        else
          echo "changed=false" >> $GITHUB_OUTPUT
        fi
        
    - name: Commit and push changes
      if: steps.verify-changed-files.outputs.changed == 'true' && github.event_name == 'push'
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add docs/config.json docs/index.html
        git commit -m "Auto-update documentation structure [skip ci]"
        git push
        
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

### 13.2 文档验证脚本

**scripts/validate-docs.js**

```javascript
const fs = require('fs');
const path = require('path');

function validateDocs() {
  const docsDir = path.join(__dirname, '../docs');
  const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));
  
  let errors = [];
  let warnings = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    const frontMatter = parseFrontMatter(content);
    
    // 检查是否有Front Matter
    if (!frontMatter.metadata) {
      errors.push(`${file}: 缺少Front Matter`);
      return;
    }
    
    // 检查必需字段
    const requiredFields = ['title', 'author', 'category', 'topic'];
    requiredFields.forEach(field => {
      if (!frontMatter.metadata[field]) {
        errors.push(`${file}: 缺少必需字段 "${field}"`);
      }
    });
    
    // 检查分类有效性
    const validCategories = ['入门', '进阶', '高级', '个人分享'];
    if (frontMatter.metadata.category && !validCategories.includes(frontMatter.metadata.category)) {
      errors.push(`${file}: 无效的分类 "${frontMatter.metadata.category}"`);
    }
    
    // 检查主题有效性
    const validTopics = ['env', 'mod-basics', 'items', 'npcs', 'world-gen', 'ui', 'networking', 'advanced'];
    if (frontMatter.metadata.topic && !validTopics.includes(frontMatter.metadata.topic)) {
      errors.push(`${file}: 无效的主题 "${frontMatter.metadata.topic}"`);
    }
    
    // 检查文件名格式
    const fileNamePattern = /^[^-]+-.*\.md$/;
    if (!fileNamePattern.test(file)) {
      warnings.push(`${file}: 文件名格式建议为 "作者名-文档标题.md"`);
    }
  });
  
  // 输出结果
  if (errors.length > 0) {
    console.error('❌ 验证失败:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ 警告:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log(`✅ 验证通过! 检查了 ${files.length} 个文档文件`);
}

function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (match) {
    const metadata = {};
    const metadataLines = match[1].split('\n');
    
    metadataLines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        metadata[key] = value;
      }
    });
    
    return {
      metadata: metadata,
      content: match[2]
    };
  }
  
  return {
    metadata: {},
    content: content
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  validateDocs();
}

module.exports = { validateDocs };
```

### 13.3 工作流特性

1. **触发条件**：
   - 推送到主分支时，当docs目录或相关脚本发生变化
   - 创建Pull Request时
   - 手动触发

2. **验证流程**：
   - 检查文档Front Matter完整性
   - 验证分类和主题的有效性
   - 检查文件命名规范

3. **构建流程**：
   - 自动生成配置文件
   - 自动生成索引页面
   - 提交生成的文件

4. **部署流程**：
   - 自动部署到GitHub Pages
   - 支持多分支部署

### 13.4 贡献者工作流程

1. **创建新文档**：
   ```bash
   # 1. 创建新文档
   touch docs/作者名-文档标题.md
   
   # 2. 添加Front Matter
   # 3. 编写内容
   # 4. 提交更改
   git add docs/作者名-文档标题.md
   git commit -m "添加新文档: 文档标题"
   git push
   ```

2. **自动处理**：
   - GitHub Actions自动验证文档格式
   - 自动生成配置和索引文件
   - 自动部署到GitHub Pages

3. **错误处理**：
   - 验证失败时，工作流会报错并阻止合并
   - 详细的错误信息帮助贡献者修复问题

### 13.5 优势

1. **自动化**：无需手动构建和部署
2. **验证**：确保文档质量和一致性
3. **即时更新**：提交后立即生效
4. **错误预防**：在合并前发现问题
5. **协作友好**：简化贡献流程

---

*本设计方案旨在为泰拉瑞亚Mod制作教程项目提供一个可扩展、易维护的文档系统，同时解决GitHub Pages的技术限制。通过GitHub Actions自动化工作流，实现了真正的多人协作文档管理。*