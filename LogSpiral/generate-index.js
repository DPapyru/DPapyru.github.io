// generate-index.js - LogSpiral项目专用配置生成脚本
const fs = require('fs');
const path = require('path');

// 项目配置
const projectConfig = {
    name: 'LogSpiral',
    docsDir: './docs',
    configFile: './docs/config.json',
    ignoreDirs: ['原文件名顺序-方便查找原文对比'],
    translator: '错数螺线(LogSpiral)'
};

// 递归扫描目录获取所有Markdown文件
function scanDirectoryRecursively(dir, baseDir, fileList = []) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 检查是否为忽略的目录
            if (!projectConfig.ignoreDirs.includes(item)) {
                // 递归扫描子目录
                scanDirectoryRecursively(fullPath, baseDir, fileList);
            }
        } else if (item.endsWith('.md') && item !== 'tutorial-index.md') {
            // 计算相对于docs目录的路径，确保使用正斜杠
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            fileList.push(relativePath);
        }
    });

    return fileList;
}

// 从文件路径提取类别
function extractCategoryFromPath(filePath) {
    const parts = filePath.split('/');
    if (parts.length > 1) {
        return parts[0]; // 第一级目录作为类别
    }
    return '杂项'; // 默认类别
}

// 处理LogSpiral项目
function processLogSpiralProject() {
    console.log(`\n正在处理 ${projectConfig.name} 项目...`);

    const { docsDir, configFile } = projectConfig;

    // 检查目录是否存在
    if (!fs.existsSync(docsDir)) {
        console.log(`警告: ${projectConfig.name} 的文档目录不存在: ${docsDir}`);
        return;
    }

    // 扫描所有Markdown文件
    const files = scanDirectoryRecursively(docsDir, docsDir);
    console.log(`找到 ${files.length} 个Markdown文件`);

    // 读取现有的config.json文件（如果存在）
    let configData = {};
    if (fs.existsSync(configFile)) {
        try {
            const configContent = fs.readFileSync(configFile, 'utf8');
            configData = JSON.parse(configContent);
        } catch (error) {
            console.error(`读取${projectConfig.name}的config.json时出错:`, error.message);
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

    // 更新config.json数据
    updateConfigData(docsDir, files, configData);

    // 写入配置文件
    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
    console.log(`${projectConfig.name} 配置文件已更新！`);
}

// 更新config.json数据的函数
function updateConfigData(docsDir, files, configData) {
    // 获取当前docs目录中所有实际存在的Markdown文件（包括子目录）
    const currentFiles = scanDirectoryRecursively(docsDir, docsDir);
    const existingFiles = new Set(currentFiles);

    // 创建文件到正确类别的映射表
    const fileToCorrectCategory = {};
    // 创建隐藏文件集合
    const hiddenFiles = new Set();

    // 首先解析所有文件的元数据，确定每个文件应该属于哪个类别
    currentFiles.forEach(file => {
        try {
            const fullPath = path.join(docsDir, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            const metadata = parseMetadata(content);

            // 检查是否为隐藏文件
            if (metadata.hide === 'true' || metadata.hide === true) {
                hiddenFiles.add(file);
                return; // 跳过隐藏文件
            }

            // 从文件路径提取类别
            let category = extractCategoryFromPath(file);

            // 如果元数据中有指定类别，使用元数据中的类别
            if (metadata.category) {
                category = metadata.category;
            }

            fileToCorrectCategory[file] = category;
        } catch (error) {
            console.error(`解析文件 ${file} 时出错:`, error.message);
            fileToCorrectCategory[file] = '杂项'; // 默认类别
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
        '0-开始': {
            title: '开始',
            description: 'tModLoader基础知识和入门指南',
            topics: {}
        },
        '1-基础': {
            title: '基础',
            description: 'Mod开发的基础概念和核心API',
            topics: {}
        },
        '2-中阶': {
            title: '中阶',
            description: '有一定基础后的进阶教程',
            topics: {}
        },
        '3-高阶': {
            title: '高阶',
            description: '面向有经验开发者的高级教程',
            topics: {}
        },
        '4-专家': {
            title: '专家',
            description: '面向专家级开发者的深度教程',
            topics: {}
        },
        '概念了解': {
            title: '概念了解',
            description: '各种概念和术语的解释',
            topics: {}
        },
        '原版代码文档': {
            title: '原版代码文档',
            description: '原版代码的详细文档和参考',
            topics: {}
        },
        '杂项': {
            title: '杂项',
            description: '其他有用的教程和资源',
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
        'getting-started': {
            title: '入门指南',
            description: 'tModLoader基础知识和入门指南',
            icon: '🚀',
            display_names: {
                zh: '入门指南',
                en: 'Getting Started'
            },
            aliases: ['入门指南']
        },
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
        'intermediate': {
            title: '进阶功能',
            description: '进阶开发技巧和功能实现',
            icon: '⚡',
            display_names: {
                zh: '进阶功能',
                en: 'Intermediate Features'
            },
            aliases: ['进阶功能']
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
        },
        'expert': {
            title: '专家功能',
            description: '专家级开发技巧和深度优化',
            icon: '💎',
            display_names: {
                zh: '专家功能',
                en: 'Expert Features'
            },
            aliases: ['专家功能']
        },
        'concepts': {
            title: '概念解释',
            description: '各种概念和术语的解释',
            icon: '🧠',
            display_names: {
                zh: '概念解释',
                en: 'Concepts'
            },
            aliases: ['概念解释']
        },
        'vanilla': {
            title: '原版代码',
            description: '原版代码的详细文档和参考',
            icon: '🔍',
            display_names: {
                zh: '原版代码',
                en: 'Vanilla Code'
            },
            aliases: ['原版代码']
        },
        'misc': {
            title: '杂项资源',
            description: '其他有用的教程和资源',
            icon: '📦',
            display_names: {
                zh: '杂项资源',
                en: 'Miscellaneous'
            },
            aliases: ['杂项资源']
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
        const fullPath = path.join(docsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const metadata = parseMetadata(content);

        // 跳过隐藏文件
        if (metadata.hide === 'true' || metadata.hide === true) {
            return;
        }

        // 从文件路径提取类别
        let category = extractCategoryFromPath(file);

        // 如果元数据中有指定类别，使用元数据中的类别
        if (metadata.category) {
            category = metadata.category;
        }

        // 根据类别确定默认主题
        const categoryToTopicMap = {
            '0-开始': 'getting-started',
            '1-基础': 'mod-basics',
            '2-中阶': 'intermediate',
            '3-高阶': 'advanced',
            '4-专家': 'expert',
            '概念了解': 'concepts',
            '原版代码文档': 'vanilla',
            '杂项': 'misc'
        };
        let topic = metadata.topic || categoryToTopicMap[category] || 'misc';

        // 如果主题不在预定义列表中，尝试通过别名查找
        if (!configData.topics[topic]) {
            let foundTopic = null;
            Object.keys(configData.topics).forEach(topicKey => {
                const topicData = configData.topics[topicKey];
                if (topicData.aliases && topicData.aliases.includes(topic)) {
                    foundTopic = topicKey;
                }
            });
            topic = foundTopic || 'misc';
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
            filename: path.basename(file), // 仅文件名，向后兼容
            path: file, // 完整相对路径
            title: metadata.title || path.basename(file, '.md'),
            author: projectConfig.translator, // 使用固定的翻译者名称
            translator: projectConfig.translator, // 添加翻译者字段
            order: parseInt(metadata.order) || 999,
            description: metadata.description || '无描述',
            last_updated: metadata.last_updated || metadata.date || '未知'
        };

        // 检查文件是否已存在于主题的文件列表中
        const existingFileIndex = configData.categories[category].topics[topic].files.findIndex(
            f => f.filename === path.basename(file) || f.path === file
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
            filename: path.basename(file), // 仅文件名，向后兼容
            path: file, // 完整相对路径
            title: metadata.title || path.basename(file, '.md'),
            author: projectConfig.translator, // 使用固定的翻译者名称
            translator: projectConfig.translator, // 添加翻译者字段
            category: category,
            topic: topic,
            order: parseInt(metadata.order) || 999
        });

        // 更新翻译者信息
        if (!configData.authors[projectConfig.translator]) {
            configData.authors[projectConfig.translator] = {
                name: projectConfig.translator,
                files: []
            };
        }

        // 检查文件是否已存在于翻译者的文件列表中
        if (!configData.authors[projectConfig.translator].files.includes(path.basename(file))) {
            configData.authors[projectConfig.translator].files.push(path.basename(file));
        }

        // 从其他作者的文件列表中移除此文件，确保作者信息一致性
        Object.keys(configData.authors).forEach(author => {
            if (author !== projectConfig.translator && configData.authors[author].files.includes(path.basename(file))) {
                configData.authors[author].files = configData.authors[author].files.filter(f => f !== path.basename(file));

                // 如果该作者没有其他文件了，移除该作者
                if (configData.authors[author].files.length === 0) {
                    delete configData.authors[author];
                }
            }
        });
    });

    // 按order排序all_files
    configData.all_files.sort((a, b) => a.order - b.order);
}

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

// 主处理逻辑
console.log('开始生成LogSpiral项目配置文件...');
processLogSpiralProject();
console.log('\nLogSpiral项目处理完成！');