/**
 * 最新更新模块
 * 自动获取docs目录下所有README.md文件的最后修改时间
 * 并根据修改时间显示最近的更新
 */

// 文档路径列表 - 更新为新的扁平化结构
const DOC_PATHS = [
    'docs/Modder入门/DPapyru-给新人的前言.md',
    'docs/给贡献者阅读的文章/DPapyru-贡献者如何编写文章基础.md',
    'docs/给贡献者阅读的文章/TopicSystem使用指南.md',
    'docs/tutorial-index.md'
];

// 从config.json获取文档列表的函数
async function getDocumentsFromConfig() {
    try {
        const response = await fetch('docs/config.json');
        if (!response.ok) {
            throw new Error(`无法加载config.json: ${response.status}`);
        }
        const config = await response.json();

        // 从config.json中提取所有文档文件
        const documents = [];

        // 直接使用config.all_files数组
        if (config.all_files && Array.isArray(config.all_files)) {
            config.all_files.forEach(file => {
                documents.push(`docs/${file.path}`);
            });
        }

        return documents;
    } catch (error) {
        console.error('获取config.json失败:', error);
        return DOC_PATHS; // 返回默认路径作为后备
    }
}

/**
 * 解析YAML前置元数据
 * @param {string} content - Markdown文件内容
 * @returns {object} 解析后的元数据对象
 */
function parseYamlFrontMatter(content) {
    try {
        // 检查是否有YAML前置元数据
        if (!content.startsWith('---')) {
            return null;
        }

        // 找到YAML元数据的结束位置
        const endIndex = content.indexOf('---', 3);
        if (endIndex === -1) {
            return null;
        }

        // 提取YAML内容
        const yamlContent = content.substring(3, endIndex).trim();
        const lines = yamlContent.split('\n');
        const metadata = {};

        // 解析每一行
        lines.forEach(line => {
            const match = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
            if (match) {
                const key = match[1];
                const value = match[2].replace(/^"|"$/g, ''); // 移除引号
                metadata[key] = value;
            }
        });

        return metadata;
    } catch (error) {
        console.error('解析YAML前置元数据失败:', error);
        return null;
    }
}

/**
 * 获取文档的最后修改时间
 * @param {string} url - 文档URL
 * @returns {Promise} 包含文档信息的Promise
 */
function fetchDocumentInfo(url) {
    return fetch(url, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法获取文档信息: ${response.status}`);
            }

            // 从响应头获取最后修改时间
            const lastModified = response.headers.get('last-modified');
            const lastModifiedDate = lastModified ? new Date(lastModified) : new Date();

            // 获取完整文档内容以解析YAML元数据
            return fetch(url)
                .then(docResponse => {
                    if (!docResponse.ok) {
                        throw new Error(`无法获取文档内容: ${docResponse.status}`);
                    }
                    return docResponse.text();
                })
                .then(content => {
                    const metadata = parseYamlFrontMatter(content);
                    return {
                        url: url,
                        title: metadata?.title || '未知标题',
                        description: metadata?.description || '暂无描述',
                        lastUpdated: metadata?.last_updated || lastModifiedDate.toISOString().split('T')[0],
                        difficulty: metadata?.difficulty || '未知',
                        time: metadata?.time || '未知',
                        lastModifiedDate: lastModifiedDate
                    };
                });
        })
        .catch(error => {
            console.error(`获取文档信息失败 (${url}):`, error);
            // 如果fetch失败，返回默认文档信息
            return getFallbackDocumentInfo(url);
        });
}

/**
 * 获取备用文档信息（当fetch失败时使用）
 * @param {string} url - 文档URL
 * @returns {object} 备用文档信息
 */
function getFallbackDocumentInfo(url) {
    // 根据URL路径推断文档信息 - 更新为新的扁平化结构
    const fileName = url.split('/').pop();

    // 默认文档信息映射 - 基于新的文件名
    const defaultDocs = {
        'DPapyru-给新人的前言.md': {
            title: '给新人的入门建议',
            description: '给新人的入门建议',
            difficulty: '初级',
            time: '30分钟',
            lastUpdated: '2025-11-27'
        },
        'DPapyru-贡献者如何编写文章基础.md': {
            title: '贡献者怎么编写文章？',
            description: '用于测试文档查看器功能的示例文档',
            difficulty: '中级',
            time: '45分钟',
            lastUpdated: '2025-11-27'
        },
        'TopicSystem使用指南.md': {
            title: 'Topic 系统使用指南',
            description: '详细介绍Topic系统的使用方法和最佳实践',
            difficulty: '中级',
            time: '60分钟',
            lastUpdated: '2025-11-27'
        },
        'tutorial-index.md': {
            title: '教程索引',
            description: '提供所有教程的概览和导航，帮助用户快速找到所需内容',
            difficulty: '全部级别',
            time: '15分钟',
            lastUpdated: '2025-11-27'
        }
    };

    const defaultInfo = defaultDocs[fileName] || {
        title: '未知文档',
        description: '暂无描述',
        difficulty: '未知',
        time: '未知',
        lastUpdated: '2025-11-27'
    };

    return {
        url: url,
        title: defaultInfo.title,
        description: defaultInfo.description,
        lastUpdated: defaultInfo.lastUpdated,
        difficulty: defaultInfo.difficulty,
        time: defaultInfo.time,
        lastModifiedDate: new Date(defaultInfo.lastUpdated)
    };
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    const updatesGrid = document.querySelector('.updates-grid');
    if (updatesGrid) {
        updatesGrid.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>正在加载最新更新...</p>
            </div>
        `;
    }
}

/**
 * 显示错误状态
 * @param {string} message - 错误消息
 */
function showErrorState(message) {
    const updatesGrid = document.querySelector('.updates-grid');
    if (updatesGrid) {
        updatesGrid.innerHTML = `
            <div class="error-indicator">
                <div class="error-icon">⚠️</div>
                <p>加载失败: ${message}</p>
                <button class="btn btn-secondary retry-button" onclick="loadLatestUpdates()">重试</button>
            </div>
        `;
    }
}

/**
 * 生成更新卡片HTML
 * @param {object} doc - 文档信息对象
 * @returns {string} 更新卡片HTML
 */
function generateUpdateCard(doc) {
    let difficultyClass = getDifficultyClass(doc);
    let difficultyText = getDifficultyText(doc);
    if (difficultyText === 'unknown')
        difficultyText = getDifficultyTextFromDocClass(difficultyClass);

    // 为Markdown文件链接添加viewer.html前缀
    let viewUrl = doc.url;
    if (viewUrl.endsWith('.md') && !viewUrl.includes('viewer.html')) {
        const fileName = viewUrl.split('/').pop();
        viewUrl = `docs/viewer.html?file=${fileName}`;
    }

    return `
        <div class="update-card">
            <div class="update-date">${doc.lastUpdated}</div>
            <div class="update-meta">
                <span class="difficulty-tag ${difficultyClass}">${difficultyText}</span>
                <span class="estimated-time">⏱️ ${doc.time}</span>
            </div>
            <h3 class="update-title">${doc.title}</h3>
            <p class="update-description">${doc.description}</p>
            <a href="${viewUrl}" class="update-link">查看详情 →</a>
        </div>
    `;
}

/**
 * 获取难度类信息-css类名用
 */
function getDifficultyClass(doc) {
    if (doc.difficulty === 'beginner' || doc.difficulty === 'intermediate' || doc.difficulty === 'advanced')
        return doc.difficulty;
    const difficulty = doc.difficulty === '初级' ? 'beginner' :
        doc.difficulty === '中级' ? 'intermediate' :
            doc.difficulty === '高级' ? 'advanced' : 'unknown';
    return difficulty;
}

/**
 * 获取难度信息-通过doc
 */
function getDifficultyText(doc) {
    if (doc.difficulty === '初级' || doc.difficulty === '中级' || doc.difficulty === '高级')
        return doc.difficulty === '初级' ? '初级' :
            doc.difficulty === 'intermediate' ? '中级' : '高级';
    return doc.difficulty === 'beginner' ? '初级' :
        doc.difficulty === 'intermediate' ? '中等' :
            doc.difficulty === 'advanced' ? '难' : 'unknown';
}

/**
 * 如果doc的获取为unknown就会调用这个获取难度信息的
 */
function getDifficultyTextFromDocClass(docClass) {
    return docClass === 'beginner' ? '初级' :
        docClass === 'intermediate' ? '中等' :
            docClass === 'advanced' ? '难' : 'unknown';
}

/**
 * 加载并显示最新更新
 */
async function loadLatestUpdates() {
    try {
        showLoadingState();

        // 首先尝试从config.json获取文档列表
        let docPaths = await getDocumentsFromConfig();

        // 如果config.json获取失败或为空，使用默认路径
        if (!docPaths || docPaths.length === 0) {
            docPaths = DOC_PATHS;
        }

        // 并行获取所有文档信息
        const documentPromises = docPaths.map(path => fetchDocumentInfo(path));
        const documents = await Promise.all(documentPromises);

        // 过滤出成功加载的文档
        const validDocuments = documents.filter(doc => !doc.error);

        // 按最后修改时间排序（最新的在前）
        validDocuments.sort((a, b) => {
            const dateA = new Date(a.lastModifiedDate);
            const dateB = new Date(b.lastModifiedDate);
            return dateB - dateA;
        });

        // 取前5个最新文档
        const latestDocuments = validDocuments.slice(0, 5);

        // 生成HTML内容
        const updatesGrid = document.querySelector('.updates-grid');
        if (updatesGrid) {
            if (latestDocuments.length === 0) {
                showErrorState('没有找到可用的文档');
                return;
            }

            const cardsHtml = latestDocuments.map(doc => generateUpdateCard(doc)).join('');
            updatesGrid.innerHTML = cardsHtml;
        }
    } catch (error) {
        console.error('加载最新更新失败:', error);
        showErrorState('加载最新更新时发生错误，请稍后重试');
    }
}

/**
 * 初始化最新更新功能
 */
function initLatestUpdates() {
    // 检查是否在首页
    if (document.querySelector('.latest-updates')) {
        // 页面加载完成后自动加载最新更新
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadLatestUpdates);
        } else {
            loadLatestUpdates();
        }
    }
}

// 导出函数供其他脚本使用
window.loadLatestUpdates = loadLatestUpdates;

// 初始化
initLatestUpdates();