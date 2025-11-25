/**
 * 最新更新模块
 * 自动获取docs目录下所有README.md文件的最后修改时间
 * 并根据修改时间显示最近的更新
 */

// 文档路径列表
const DOC_PATHS = [
    'docs/01-入门指南/README.md',
    'docs/02-基础概念/README.md',
    'docs/03-内容创建/README.md',
    'docs/04-高级开发/README.md',
    'docs/05-专题主题/README.md',
    'docs/06-资源参考/README.md'
];

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
                        estimatedTime: metadata?.estimated_time || '未知',
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
    // 根据URL路径推断文档信息
    const pathParts = url.split('/');
    const categoryFolder = pathParts[pathParts.length - 2];
    
    // 默认文档信息映射
    const defaultDocs = {
        '01-入门指南': {
            title: '入门指南',
            description: '适合初学者的基础入门教程，帮助您快速了解项目的基本概念和使用方法',
            difficulty: '初级',
            estimatedTime: '30分钟',
            lastUpdated: '2025-11-25'
        },
        '02-基础概念': {
            title: '基础概念',
            description: '深入了解项目的核心概念和基本原理，为进一步学习打下坚实基础',
            difficulty: '初级',
            estimatedTime: '45分钟',
            lastUpdated: '2025-11-25'
        },
        '03-内容创建': {
            title: '内容创建',
            description: '学习如何创建高质量的内容，掌握内容组织和呈现的最佳实践',
            difficulty: '中级',
            estimatedTime: '60分钟',
            lastUpdated: '2025-11-25'
        },
        '04-高级开发': {
            title: '高级开发',
            description: '深入探讨项目的高级功能和开发技巧，适合有经验的开发人员',
            difficulty: '高级',
            estimatedTime: '90分钟',
            lastUpdated: '2025-11-25'
        },
        '05-专题主题': {
            title: '专题主题',
            description: '深入探讨特定领域的应用和解决方案，满足专业化需求',
            difficulty: '高级',
            estimatedTime: '75分钟',
            lastUpdated: '2025-11-25'
        },
        '06-资源参考': {
            title: '资源参考',
            description: '提供丰富的参考资源，包括工具、文档、示例和社区支持',
            difficulty: '全部级别',
            estimatedTime: '30分钟',
            lastUpdated: '2025-11-25'
        }
    };
    
    const defaultInfo = defaultDocs[categoryFolder] || {
        title: '未知文档',
        description: '暂无描述',
        difficulty: '未知',
        estimatedTime: '未知',
        lastUpdated: '2025-11-25'
    };
    
    return {
        url: url,
        title: defaultInfo.title,
        description: defaultInfo.description,
        lastUpdated: defaultInfo.lastUpdated,
        difficulty: defaultInfo.difficulty,
        estimatedTime: defaultInfo.estimatedTime,
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
    const difficultyClass = doc.difficulty === '初级' ? 'beginner' : 
                           doc.difficulty === '中级' ? 'intermediate' : 
                           doc.difficulty === '高级' ? 'advanced' : 'unknown';
    
    return `
        <div class="update-card">
            <div class="update-date">${doc.lastUpdated}</div>
            <div class="update-meta">
                <span class="difficulty-tag ${difficultyClass}">${doc.difficulty}</span>
                <span class="estimated-time">⏱️ ${doc.estimatedTime}</span>
            </div>
            <h3 class="update-title">${doc.title}</h3>
            <p class="update-description">${doc.description}</p>
            <a href="${doc.url}" class="update-link">查看详情 →</a>
        </div>
    `;
}

/**
 * 加载并显示最新更新
 */
async function loadLatestUpdates() {
    try {
        showLoadingState();
        
        // 并行获取所有文档信息
        const documentPromises = DOC_PATHS.map(path => fetchDocumentInfo(path));
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