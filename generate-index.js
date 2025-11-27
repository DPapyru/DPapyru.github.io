// generate-index.js - 自动生成教程索引和配置的脚本
const fs = require('fs');
const path = require('path');

// 读取所有Markdown文件
const docsDir = './docs';
const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');

// 读取现有的config.json文件（如果存在）
let configData = {};
const configPath = path.join(docsDir, 'config.json');
if (fs.existsSync(configPath)) {
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(configContent);
    } catch (error) {
        console.error('读取config.json时出错:', error.message);
        // 如果读取失败，使用默认配置
        configData = {
            categories: {},
            topics: {},
            authors: {},
            all_files: []
        };
    }
} else {
    // 如果config.json不存在，创建默认配置
    configData = {
        categories: {},
        topics: {},
        authors: {},
        all_files: []
    };
}

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
    
    // 跳过标记为 hide: true 的文件
    if (metadata.hide === 'true' || metadata.hide === true) {
        return;
    }

    if (metadata.category) {
        // 检查分类是否存在，如果不存在则创建或使用默认分类
        let targetCategory = metadata.category;

        // 如果分类不在预定义列表中，尝试映射或使用默认分类
        if (!categories[targetCategory]) {
            // 尝试将中文分类映射到英文分类键
            const categoryMapping = {
                '入门': 'getting-started',
                '基础概念': 'basic-concepts',
                'Mod开发': 'mod-development',
                '高级主题': 'advanced-topics',
                '资源参考': 'resources'
            };

            targetCategory = categoryMapping[metadata.category] || 'resources';

            // 如果映射后仍不存在，确保resources分类存在
            if (!categories[targetCategory]) {
                categories[targetCategory] = [];
            }
        }

        categories[targetCategory].push({
            file,
            ...metadata
        });
    } else {
        // 如果没有指定类别，默认为resources
        if (!categories.resources) {
            categories.resources = [];
        }
        categories.resources.push({
            file,
            ...metadata
        });
    }
});

// 生成索引内容
let indexContent = `# 教程索引\n\n`;
indexContent += `这个文件是泰拉瑞亚Mod制作教程的索引，列出了所有可用的教程资源。索引是自动生成的，贡献者可以通过添加新的教程文件来更新此索引。\n\n`;
indexContent += `## 如何添加新教程\n\n`;
indexContent += `1. 在\`docs\`目录下创建新的Markdown文件\n`;
indexContent += `2. 在文件开头添加以下元数据格式：\n\n`;
indexContent += `\`\`\`markdown\n---\ntitle: 教程标题\ndifficulty: beginner|intermediate|advanced\ncategory: getting-started|basic-concepts|mod-development|advanced-topics|resources\ntime: 预计完成时间（分钟）\nauthor: 作者名称\ndate: 更新日期（YYYY-MM-DD）\ndescription: 简短描述\n---\n\`\`\`\n\n`;
indexContent += `3. 运行\`node generate-index.js\`脚本自动更新此索引文件\n\n`;

// 按类别生成内容
Object.keys(categories).forEach(category => {
    if (categories[category] && categories[category].length > 0) {
        const categoryTitle = getCategoryTitle(category);
        indexContent += `## ${categoryTitle}\n\n`;

        categories[category].sort((a, b) => {
            // 安全地比较标题，处理可能缺失的标题
            const titleA = a.title || '';
            const titleB = b.title || '';
            return titleA.localeCompare(titleB);
        });

        categories[category].forEach(tutorial => {
            indexContent += `### [${tutorial.title || '无标题'}](${tutorial.file})\n`;
            indexContent += `- **难度**: ${getDifficultyText(tutorial.difficulty)}\n`;
            // 检查时间字段是否已经包含"分钟"，避免重复
            const timeText = tutorial.time || '未知';
            const timeDisplay = timeText.includes('分钟') ? timeText : `${timeText}分钟`;
            indexContent += `- **预计时间**: ${timeDisplay}\n`;
            indexContent += `- **作者**: ${tutorial.author || '未知'}\n`;
            indexContent += `- **更新日期**: ${tutorial.date || tutorial.last_updated || '未知'}\n`;
            indexContent += `- **描述**: ${tutorial.description || '无描述'}\n\n`;
        });
    }
});

// 添加自动生成脚本部分
indexContent += `---\n\n`;
indexContent += `## 自动生成脚本\n\n`;
indexContent += `为了方便贡献者，我们提供了一个Node.js脚本来自动生成教程索引：\n\n`;
indexContent += `\`\`\`javascript\n// generate-index.js\nconst fs = require('fs');\nconst path = require('path');\n\n// 读取所有Markdown文件\nconst docsDir = './docs';\nconst files = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');\n\n// 按类别分组\nconst categories = {\n    'getting-started': [],\n    'basic-concepts': [],\n    'mod-development': [],\n    'advanced-topics': [],\n    'resources': []\n};\n\n// 解析每个文件的元数据\nfiles.forEach(file => {\n    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');\n    const metadata = parseMetadata(content);\n    \n    if (metadata.category) {\n        categories[metadata.category].push({\n            file,\n            ...metadata\n        });\n    }\n});\n\n// 生成索引内容\nlet indexContent = \`# 教程索引\\\\n\\\\n\`;\n// ... 其余脚本内容\n\`\`\`\n\n`;
indexContent += `要使用此脚本，请运行：\n\n`;
indexContent += `\`\`\`bash\nnode generate-index.js\n\`\`\`\n\n`;
indexContent += `这将自动扫描\`docs\`目录中的所有Markdown文件，解析它们的元数据，并更新\`tutorial-index.md\`文件。\n`;

// 更新config.json数据
updateConfigData();

// 写入索引文件
fs.writeFileSync(path.join(docsDir, 'tutorial-index.md'), indexContent);
console.log('教程索引已更新！');

// 写入配置文件
fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
console.log('配置文件已更新！');

// 辅助函数
function parseMetadata(content) {
    try {
        // 移除可能的BOM字符
        content = content.replace(/^\uFEFF/, '');

        // 尝试多种正则表达式模式
        let metadataMatch = content.match(/---\r?\n(.*?)\r?\n---/s);
        if (!metadataMatch) {
            metadataMatch = content.match(/^---\s*\n(.*?)\n---/ms);
        }
        if (!metadataMatch) {
            return {};
        }

        const metadata = {};
        const lines = metadataMatch[1].split(/\r?\n/);

        lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                metadata[key] = value;
            }
        });

        return metadata;
    } catch (error) {
        console.error('解析元数据时出错:', error.message);
        return {};
    }
}

function getCategoryTitle(category) {
    const titles = {
        'getting-started': '入门指南',
        'basic-concepts': '基础概念',
        'mod-development': 'Mod开发',
        'advanced-topics': '高级主题',
        'resources': '资源参考',
        // 直接支持中文分类名称
        '入门': '入门指南',
        '基础概念': '基础概念',
        'Mod开发': 'Mod开发',
        '高级主题': '高级主题',
        '资源参考': '资源参考'
    };
    return titles[category] || category;
}

function getDifficultyText(difficulty) {
    const texts = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
    };
    return texts[difficulty] || difficulty;
}

// 更新config.json数据的函数
function updateConfigData() {
    // 获取当前docs目录中所有实际存在的Markdown文件
    const currentFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md') && file !== 'tutorial-index.md');
    const existingFiles = new Set(currentFiles);
    
    // 创建文件到正确类别的映射表
    const fileToCorrectCategory = {};
    // 创建隐藏文件集合
    const hiddenFiles = new Set();
    
    // 首先解析所有文件的元数据，确定每个文件应该属于哪个类别
    currentFiles.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
            const metadata = parseMetadata(content);
            
            // 检查是否为隐藏文件
            if (metadata.hide === 'true' || metadata.hide === true) {
                hiddenFiles.add(file);
                return; // 跳过隐藏文件
            }
            
            // 确定类别
            let category = metadata.category || '资源参考';
            // 将英文类别映射到中文
            const categoryMapping = {
                'getting-started': '入门',
                'basic-concepts': '基础概念',
                'mod-development': 'Mod开发',
                'advanced-topics': '高级主题',
                'resources': '资源参考'
            };
            category = categoryMapping[category] || category;
            
            fileToCorrectCategory[file] = category;
        } catch (error) {
            console.error(`解析文件 ${file} 时出错:`, error.message);
            fileToCorrectCategory[file] = '资源参考'; // 默认类别
        }
    });
    
    // 清理categories中的无效文件记录和错误分类的文件
    if (configData.categories) {
        Object.keys(configData.categories).forEach(category => {
            if (configData.categories[category].topics) {
                Object.keys(configData.categories[category].topics).forEach(topic => {
                    if (configData.categories[category].topics[topic].files) {
                        // 过滤掉无效的文件记录和错误分类的文件
                        configData.categories[category].topics[topic].files =
                            configData.categories[category].topics[topic].files.filter(fileObj => {
                                // 检查文件对象是否有效且文件实际存在
                                if (!fileObj || !fileObj.filename || !existingFiles.has(fileObj.filename)) {
                                    return false; // 返回false，表示该文件对象无效
                                }
                                
                                // 检查文件是否为隐藏文件
                                if (hiddenFiles.has(fileObj.filename)) {
                                    return false; // 跳过隐藏文件
                                }
                                
                                // 检查文件是否属于当前类别（防止文件出现在错误的类别中）
                                const correctCategory = fileToCorrectCategory[fileObj.filename];
                                return correctCategory === category;
                            });
                    }
                });
            }
        });
    }
    
    // 清理authors中的无效记录
    if (configData.authors) {
        Object.keys(configData.authors).forEach(author => {
            if (configData.authors[author].files) {
                // 过滤掉不存在的文件和隐藏文件
                configData.authors[author].files =
                    configData.authors[author].files.filter(filename => {
                        return existingFiles.has(filename) && !hiddenFiles.has(filename);
                    });
                
                // 如果作者没有有效文件了，移除该作者
                if (configData.authors[author].files.length === 0) {
                    delete configData.authors[author];
                }
            }
        });
    }
    
    // 初始化类别结构（如果不存在）
    const defaultCategories = {
        '入门': {
            title: '入门',
            description: '适合初学者的基础教程',
            topics: {}
        },
        '进阶': {
            title: '进阶',
            description: '有一定基础后的进阶教程',
            topics: {}
        },
        '高级': {
            title: '高级',
            description: '面向有经验开发者的高级教程',
            topics: {}
        },
        '个人分享': {
            title: '个人分享',
            description: '社区成员的个人经验和技巧分享',
            topics: {}
        },
        '怎么贡献': {
            title: '怎么贡献',
            description: '介绍贡献者应该怎么贡献文章',
            topics: {}
        }
    };

    // 确保所有默认类别都存在
    Object.keys(defaultCategories).forEach(category => {
        if (!configData.categories[category]) {
            configData.categories[category] = defaultCategories[category];
        }
    });

    // 初始化默认主题（如果不存在）
    const defaultTopics = {
        'mod-basics': {
            title: 'Mod基础',
            description: 'Mod开发的基础概念和核心API',
            icon: '📖',
            display_names: {
                zh: 'Mod基础',
                en: 'Mod Basics'
            },
            aliases: ['Mod基础']
        },
        'env': {
            title: '环境配置',
            description: '开发环境搭建和配置',
            icon: '🛠️',
            display_names: {
                zh: '环境配置',
                en: 'Environment Setup'
            },
            aliases: ['环境配置']
        },
        'items': {
            title: '物品系统',
            description: '物品、武器和装备的开发',
            icon: '⚔️',
            display_names: {
                zh: '物品系统',
                en: 'Item System'
            },
            aliases: ['物品系统']
        },
        'npcs': {
            title: 'NPC系统',
            description: 'NPC的创建和行为定制',
            icon: '👥',
            display_names: {
                zh: 'NPC系统',
                en: 'NPC System'
            },
            aliases: ['NPC系统']
        },
        'world-gen': {
            title: '世界生成',
            description: '世界生成和地形修改',
            icon: '🌍',
            display_names: {
                zh: '世界生成',
                en: 'World Generation'
            },
            aliases: ['世界生成']
        },
        'ui': {
            title: 'UI界面',
            description: '用户界面和交互设计',
            icon: '🎨',
            display_names: {
                zh: 'UI界面',
                en: 'UI Interface'
            },
            aliases: ['UI界面']
        },
        'networking': {
            title: '网络功能',
            description: '多人游戏和网络通信',
            icon: '🌐',
            display_names: {
                zh: '网络功能',
                en: 'Networking'
            },
            aliases: ['网络功能']
        },
        'advanced': {
            title: '高级功能',
            description: '高级开发技巧和优化',
            icon: '🔧',
            display_names: {
                zh: '高级功能',
                en: 'Advanced Features'
            },
            aliases: ['高级功能']
        }
    };

    // 确保所有默认主题都存在
    Object.keys(defaultTopics).forEach(topic => {
        if (!configData.topics[topic]) {
            configData.topics[topic] = defaultTopics[topic];
        }
    });

    // 重置all_files数组
    configData.all_files = [];

    // 处理每个文件
    files.forEach(file => {
        const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
        const metadata = parseMetadata(content);
        
        // 跳过隐藏文件
        if (metadata.hide === 'true' || metadata.hide === true) {
            return;
        }

        // 确定类别
        let category = metadata.category || '资源参考';
        // 将英文类别映射到中文
        const categoryMapping = {
            'getting-started': '入门',
            'basic-concepts': '基础概念',
            'mod-development': 'Mod开发',
            'advanced-topics': '高级主题',
            'resources': '资源参考'
        };
        category = categoryMapping[category] || category;

        // 确定主题
        let topic = metadata.topic || 'mod-basics';

        // 如果主题不在预定义列表中，尝试通过别名查找
        if (!configData.topics[topic]) {
            let foundTopic = null;
            Object.keys(configData.topics).forEach(topicKey => {
                const topicData = configData.topics[topicKey];
                if (topicData.aliases && topicData.aliases.includes(topic)) {
                    foundTopic = topicKey;
                }
            });
            topic = foundTopic || 'mod-basics';
        }

        // 确保类别存在
        if (!configData.categories[category]) {
            configData.categories[category] = {
                title: category,
                description: `${category}相关的教程`,
                topics: {}
            };
        }

        // 确保主题在类别中存在
        if (!configData.categories[category].topics[topic]) {
            const topicData = configData.topics[topic];
            configData.categories[category].topics[topic] = {
                title: topicData ? topicData.title : topic,
                description: topicData ? topicData.description : `${topic}相关教程`,
                files: []
            };
        }

        // 创建文件对象
        const fileObj = {
            filename: file,
            title: metadata.title || file.replace('.md', ''),
            author: metadata.author || '未知',
            order: parseInt(metadata.order) || 999,
            description: metadata.description || '无描述',
            last_updated: metadata.last_updated || metadata.date || '未知'
        };

        // 检查文件是否已存在于主题的文件列表中
        const existingFileIndex = configData.categories[category].topics[topic].files.findIndex(
            f => f.filename === file
        );

        if (existingFileIndex >= 0) {
            // 更新现有文件
            configData.categories[category].topics[topic].files[existingFileIndex] = fileObj;
        } else {
            // 添加新文件
            configData.categories[category].topics[topic].files.push(fileObj);
        }

        // 按order排序
        configData.categories[category].topics[topic].files.sort((a, b) => a.order - b.order);

        // 添加到all_files
        configData.all_files.push({
            filename: file,
            title: metadata.title || file.replace('.md', ''),
            author: metadata.author || '未知',
            category: category,
            topic: topic,
            order: parseInt(metadata.order) || 999
        });

        // 更新作者信息
        if (metadata.author) {
            if (!configData.authors[metadata.author]) {
                configData.authors[metadata.author] = {
                    name: metadata.author,
                    files: []
                };
            }

            // 检查文件是否已存在于作者的文件列表中
            if (!configData.authors[metadata.author].files.includes(file)) {
                configData.authors[metadata.author].files.push(file);
            }
            
            // 从其他作者的文件列表中移除此文件，确保作者信息一致性
            Object.keys(configData.authors).forEach(author => {
                if (author !== metadata.author && configData.authors[author].files.includes(file)) {
                    configData.authors[author].files = configData.authors[author].files.filter(f => f !== file);
                    
                    // 如果该作者没有其他文件了，移除该作者
                    if (configData.authors[author].files.length === 0) {
                        delete configData.authors[author];
                    }
                }
            });
        }
    });

    // 按order排序all_files
    configData.all_files.sort((a, b) => a.order - b.order);
}