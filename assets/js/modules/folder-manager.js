/**
 * 文件夹管理模块 - 负责文件夹浏览和文档展示功能
 */
class FolderManager {
    constructor(options = {}) {
        this.options = {
            viewMode: 'grid', // 'grid' 或 'list'
            itemsPerPage: 12,
            enableSearchHistory: true,
            enableAdvancedSearch: true,
            ...options
        };
        
        this.configManager = null;
        this.currentFolder = '';
        this.filteredDocuments = [];
        this.searchHistory = [];
        this.isInitialized = false;
    }

    /**
     * 初始化文件夹管理器
     */
    async initialize(configManager) {
        try {
            this.configManager = configManager;
            this.loadSearchHistory();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('文件夹管理器初始化完成');
        } catch (error) {
            console.error('文件夹管理器初始化失败:', error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 搜索输入事件
        const searchInput = document.getElementById('doc-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.handleSearchInput(e.target.value);
            }, 300));
        }

        // 视图切换按钮
        const gridViewBtn = document.getElementById('grid-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setViewMode('grid');
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.setViewMode('list');
            });
        }

        // 过滤器变化事件
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // 高级搜索按钮
        const advancedSearchBtn = document.getElementById('advanced-search-btn');
        if (advancedSearchBtn) {
            advancedSearchBtn.addEventListener('click', () => {
                this.performAdvancedSearch();
            });
        }
    }

    /**
     * 设置当前文件夹
     */
    setCurrentFolder(folderPath) {
        this.currentFolder = folderPath;
        this.filterDocumentsByFolder(folderPath);
        this.updateBreadcrumb(folderPath);
        this.updateFolderHeader(folderPath);
        this.populateFilterOptions();
        this.generateDocumentGrid();
    }

    /**
     * 根据文件夹路径筛选文档
     */
    filterDocumentsByFolder(folderPath) {
        if (!folderPath) {
            this.filteredDocuments = [...this.configManager.getAllFiles()];
            return;
        }

        const allDocs = this.configManager.getAllFiles();
        this.filteredDocuments = allDocs.filter(doc => {
            if (!doc.path) return false;
            const pathParts = doc.path.split('/');
            return pathParts.includes(folderPath);
        });
    }

    /**
     * 处理搜索输入
     */
    handleSearchInput(query) {
        if (!query || query.trim() === '') {
            this.generateDocumentGrid();
            return;
        }

        const results = this.performSearch(query);
        this.generateDocumentGrid(results);
    }

    /**
     * 执行搜索
     */
    performSearch(query) {
        if (!this.configManager) return [];

        const results = this.configManager.searchFiles(query);
        return results.filter(doc => {
            if (!this.currentFolder) return true;
            const pathParts = doc.path.split('/');
            return pathParts.includes(this.currentFolder);
        });
    }

    /**
     * 执行高级搜索
     */
    performAdvancedSearch() {
        const titleSearch = document.getElementById('title-search')?.value.trim().toLowerCase();
        const contentSearch = document.getElementById('content-search')?.value.trim().toLowerCase();
        const tagSearch = document.getElementById('tag-search')?.value.trim().toLowerCase();
        const dateFrom = document.getElementById('date-from')?.value;
        const dateTo = document.getElementById('date-to')?.value;

        let results = [...this.filteredDocuments];

        if (titleSearch) {
            results = results.filter(doc => 
                doc.title.toLowerCase().includes(titleSearch)
            );
        }

        if (contentSearch) {
            results = results.filter(doc => 
                (doc.description && doc.description.toLowerCase().includes(contentSearch))
            );
        }

        if (tagSearch) {
            results = results.filter(doc => 
                doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(tagSearch))
            );
        }

        if (dateFrom) {
            results = results.filter(doc => doc.last_updated >= dateFrom);
        }

        if (dateTo) {
            results = results.filter(doc => doc.last_updated <= dateTo);
        }

        this.generateDocumentGrid(results);
    }

    /**
     * 应用过滤器
     */
    applyFilters() {
        const difficultyFilter = document.getElementById('difficulty-filter')?.value;
        const categoryFilter = document.getElementById('category-filter')?.value;
        const authorFilter = document.getElementById('author-filter')?.value;
        const sortFilter = document.getElementById('sort-filter')?.value;

        let results = [...this.filteredDocuments];

        if (difficultyFilter && difficultyFilter !== 'all') {
            results = results.filter(doc => doc.difficulty === difficultyFilter);
        }

        if (categoryFilter && categoryFilter !== 'all') {
            results = results.filter(doc => doc.category === categoryFilter);
        }

        if (authorFilter && authorFilter !== 'all') {
            results = results.filter(doc => doc.author === authorFilter);
        }

        // 排序
        results = this.sortDocuments(results, sortFilter);

        this.generateDocumentGrid(results);
    }

    /**
     * 排序文档
     */
    sortDocuments(documents, sortBy) {
        if (!sortBy) sortBy = 'order';

        return [...documents].sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'author') {
                return a.author.localeCompare(b.author);
            } else if (sortBy === 'last_updated') {
                return new Date(b.last_updated || 0) - new Date(a.last_updated || 0);
            } else {
                return (a.order || 999) - (b.order || 999);
            }
        });
    }

    /**
     * 设置视图模式
     */
    setViewMode(mode) {
        this.options.viewMode = mode;
        const docGrid = document.getElementById('doc-grid');
        const gridViewBtn = document.getElementById('grid-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');

        if (docGrid) {
            if (mode === 'list') {
                docGrid.classList.add('list-view');
            } else {
                docGrid.classList.remove('list-view');
            }
        }

        if (gridViewBtn && listViewBtn) {
            if (mode === 'grid') {
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            } else {
                gridViewBtn.classList.remove('active');
                listViewBtn.classList.add('active');
            }
        }

        // 保存偏好
        localStorage.setItem('folder-view-mode', mode);
    }

    /**
     * 生成文档网格
     */
    generateDocumentGrid(documents = this.filteredDocuments) {
        const docGrid = document.getElementById('doc-grid');
        const noDocs = document.getElementById('no-docs');

        if (!docGrid || !noDocs) return;

        docGrid.innerHTML = '';

        if (documents.length === 0) {
            docGrid.style.display = 'none';
            noDocs.style.display = 'block';
            return;
        }

        docGrid.style.display = 'grid';
        noDocs.style.display = 'none';

        documents.forEach(doc => {
            const docCard = this.createDocumentCard(doc);
            docGrid.appendChild(docCard);
        });
    }

    /**
     * 创建文档卡片
     */
    createDocumentCard(doc) {
        const docCard = document.createElement('div');
        docCard.className = 'doc-card';

        const difficultyClass = doc.difficulty === 'all' ? 'beginner' : doc.difficulty;
        const difficultyText = this.getDifficultyText(doc.difficulty);

        let tagsHtml = '';
        if (doc.tags && doc.tags.length > 0) {
            tagsHtml = doc.tags.map(tag => `<span class="doc-tag">${tag}</span>`).join('');
        }

        docCard.innerHTML = `
            <div class="doc-card-header">
                <h3 class="doc-title">${doc.title}</h3>
                <div class="doc-meta">
                    <div class="doc-meta-item">
                        <span class="difficulty-badge ${difficultyClass}">${difficultyText}</span>
                    </div>
                    <div class="doc-meta-item">
                        <span>👤 ${doc.author}</span>
                    </div>
                    <div class="doc-meta-item">
                        <span>📅 ${doc.last_updated}</span>
                    </div>
                </div>
            </div>
            <div class="doc-card-body">
                <p class="doc-description">${doc.description || '暂无描述'}</p>
                ${tagsHtml ? `<div class="doc-tags">${tagsHtml}</div>` : ''}
            </div>
            <div class="doc-card-footer">
                <div class="doc-author">作者: ${doc.author}</div>
                <a href="viewer.html?file=${doc.path}" class="doc-link">查看文档</a>
            </div>
        `;

        return docCard;
    }

    /**
     * 更新面包屑导航
     */
    updateBreadcrumb(folderPath) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;

        breadcrumb.innerHTML = `
            <div class="breadcrumb-item">
                <a href="../index.html">首页</a>
            </div>
            <div class="breadcrumb-item">
                <a href="index.html">文档</a>
            </div>
            ${folderPath ? `
                <div class="breadcrumb-item active">${folderPath}</div>
            ` : ''}
        `;
    }

    /**
     * 更新文件夹标题和描述
     */
    updateFolderHeader(folderPath) {
        const folderHeader = document.getElementById('folder-header');
        if (!folderHeader) return;

        if (!folderPath) {
            folderHeader.innerHTML = `
                <h2 class="folder-title">所有文档</h2>
                <p class="folder-description">浏览所有可用的文档，快速找到您需要的学习资源</p>
            `;
            return;
        }

        let folderDescription = '';
        const category = this.configManager.getCategory(folderPath);
        if (category) {
            folderDescription = category.description || '';
        }

        folderHeader.innerHTML = `
            <h2 class="folder-title">${folderPath}</h2>
            <p class="folder-description">${folderDescription || `浏览 "${folderPath}" 文件夹下的所有文档`}</p>
        `;
    }

    /**
     * 填充过滤器选项
     */
    populateFilterOptions() {
        // 填充分类过滤器
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter && this.configManager) {
            const categories = this.configManager.getSortedCategories();
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.key;
                option.textContent = category.title;
                categoryFilter.appendChild(option);
            });
        }

        // 填充作者过滤器
        const authorFilter = document.getElementById('author-filter');
        if (authorFilter && this.configManager) {
            const authors = [...new Set(this.configManager.getAllFiles().map(doc => doc.author))];
            authors.sort().forEach(author => {
                const option = document.createElement('option');
                option.value = author;
                option.textContent = author;
                authorFilter.appendChild(option);
            });
        }
    }

    /**
     * 获取难度文本
     */
    getDifficultyText(difficulty) {
        // 如果有配置管理器，尝试从配置中获取难度映射
        if (this.configManager) {
            const difficultyOptions = this.configManager.getDifficultyOptions();
            if (difficultyOptions[difficulty]) {
                return difficultyOptions[difficulty];
            }
        }
        
        // 默认难度映射（向后兼容）
        const defaultDifficultyMap = {
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级',
            'all': '全部级别'
        };
        return defaultDifficultyMap[difficulty] || difficulty;
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('folder-search-history');
            if (history) {
                this.searchHistory = JSON.parse(history);
                this.displaySearchHistory();
            }
        } catch (error) {
            console.warn('无法加载搜索历史:', error);
            this.searchHistory = [];
        }
    }

    /**
     * 显示搜索历史
     */
    displaySearchHistory() {
        const searchHistoryContainer = document.getElementById('search-history');
        if (!searchHistoryContainer || this.searchHistory.length === 0) return;

        const historyTitle = searchHistoryContainer.querySelector('.search-history-title');
        searchHistoryContainer.innerHTML = '';
        searchHistoryContainer.appendChild(historyTitle);

        const recentHistory = this.searchHistory.slice(-5).reverse();

        recentHistory.forEach(query => {
            const historyItem = document.createElement('div');
            historyItem.className = 'search-history-item';
            historyItem.textContent = query;

            historyItem.addEventListener('click', () => {
                document.getElementById('doc-search').value = query;
                this.handleSearchInput(query);
            });

            searchHistoryContainer.appendChild(historyItem);
        });
    }

    /**
     * 添加到搜索历史
     */
    addToSearchHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        this.searchHistory.unshift(query);

        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }

        try {
            localStorage.setItem('folder-search-history', JSON.stringify(this.searchHistory));
            this.displaySearchHistory();
        } catch (error) {
            console.warn('无法保存搜索历史:', error);
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        if (!this.isInitialized) {
            return null;
        }

        return {
            currentFolder: this.currentFolder,
            totalDocuments: this.filteredDocuments.length,
            viewMode: this.options.viewMode,
            searchHistoryLength: this.searchHistory.length
        };
    }

    /**
     * 销毁文件夹管理器
     */
    destroy() {
        // 清理事件监听器和资源
        this.filteredDocuments = [];
        this.searchHistory = [];
        this.isInitialized = false;
        console.log('文件夹管理器已销毁');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FolderManager;
} else if (typeof window !== 'undefined') {
    window.FolderManager = FolderManager;
}