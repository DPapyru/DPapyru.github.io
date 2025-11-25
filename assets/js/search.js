// 搜索功能实现
class TutorialSearch {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.isSearchVisible = false;
        this.currentQuery = '';
        this.init();
    }

    // 初始化搜索功能
    init() {
        this.createSearchElements();
        this.bindEvents();
        this.loadSearchIndex();
    }

    // 创建搜索相关的DOM元素
    createSearchElements() {
        // 创建搜索容器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        // 创建搜索框
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = '搜索教程...';
        searchInput.id = 'search-input';
        
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.innerHTML = '<i class="icon-search"></i>';
        searchButton.id = 'search-button';
        
        const clearButton = document.createElement('button');
        clearButton.className = 'search-clear';
        clearButton.innerHTML = '<i class="icon-clear"></i>';
        clearButton.id = 'search-clear';
        clearButton.style.display = 'none';
        
        searchBox.appendChild(searchInput);
        searchBox.appendChild(searchButton);
        searchBox.appendChild(clearButton);
        
        // 创建搜索建议下拉框
        const searchSuggestions = document.createElement('div');
        searchSuggestions.className = 'search-suggestions';
        searchSuggestions.id = 'search-suggestions';
        
        // 创建搜索结果容器
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchResults.id = 'search-results';
        searchResults.style.display = 'none';
        
        searchContainer.appendChild(searchBox);
        searchContainer.appendChild(searchSuggestions);
        searchContainer.appendChild(searchResults);
        
        // 将搜索容器添加到英雄区域的搜索框
        const heroSearchContainer = document.querySelector('.hero-search .search-container');
        if (heroSearchContainer) {
            // 如果英雄区域已有搜索容器，则只绑定事件，不创建新元素
            this.bindHeroSearchEvents();
            return;
        }
        
        // 否则，将搜索容器添加到导航栏（作为后备方案）
        const mainNav = document.querySelector('.main-nav');
        if (mainNav) {
            mainNav.appendChild(searchContainer);
        }
    }

    // 绑定事件
    bindEvents() {
        // 尝试绑定英雄区域的搜索框
        this.bindHeroSearchEvents();
        
        // 作为后备方案，也尝试绑定常规搜索框
        this.bindRegularSearchEvents();
    }
    
    // 绑定英雄区域搜索框事件
    bindHeroSearchEvents() {
        const searchInput = document.getElementById('hero-search-input');
        const searchButton = document.getElementById('hero-search-button');
        const clearButton = document.getElementById('hero-search-clear');
        
        if (!searchInput) return; // 如果英雄区域搜索框不存在，则退出
        
        // 搜索输入事件
        searchInput.addEventListener('input', debounce((e) => {
            this.handleHeroSearchInput(e.target.value);
        }, 300));
        
        searchInput.addEventListener('focus', () => {
            this.showHeroSearchSuggestions();
        });
        
        searchInput.addEventListener('keydown', (e) => {
            this.handleHeroKeydown(e);
        });
        
        // 搜索按钮点击事件
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performHeroSearch();
            });
        }
        
        // 清除按钮点击事件
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearHeroSearch();
            });
        }
    }
    
    // 绑定常规搜索框事件（作为后备）
    bindRegularSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const clearButton = document.getElementById('search-clear');
        
        if (!searchInput) return; // 如果常规搜索框不存在，则退出
        
        // 搜索输入事件
        searchInput.addEventListener('input', debounce((e) => {
            this.handleSearchInput(e.target.value);
        }, 300));
        
        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });
        
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // 搜索按钮点击事件
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        // 清除按钮点击事件
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Ctrl+K 或 Cmd+K 聚焦英雄区域搜索框
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const heroSearchInput = document.getElementById('hero-search-input');
                if (heroSearchInput) {
                    heroSearchInput.focus();
                } else if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // 加载搜索索引
    async loadSearchIndex() {
        try {
            // 显示加载状态
            this.showLoadingState();
            
            // 获取所有教程文件
            const tutorialFiles = await this.getTutorialFiles();
            
            // 为每个文件创建索引
            for (const file of tutorialFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const metadata = this.parseMetadata(content);
                    const plainText = this.stripMarkdown(content);
                    
                    // 更新URL，使其指向viewer.html并加载相应的README.md文件
                    const viewerUrl = `docs/viewer.html?file=${file.replace('docs/', '')}`;
                    
                    this.searchIndex.push({
                        title: metadata.title || this.extractTitle(content),
                        url: viewerUrl,
                        content: plainText,
                        description: metadata.description || this.extractDescription(plainText),
                        category: metadata.category || this.getCategoryFromPath(file),
                        difficulty: metadata.difficulty || '未知',
                        time: metadata.time || '未知',
                        author: metadata.author || '未知',
                        date: metadata.date || '未知'
                    });
                } catch (error) {
                    console.warn(`无法加载文件 ${file}:`, error);
                }
            }
            
            console.log(`搜索索引加载完成，共 ${this.searchIndex.length} 个教程`);
            this.hideLoadingState();
        } catch (error) {
            console.error('加载搜索索引失败:', error);
            this.hideLoadingState();
        }
    }

    // 获取所有教程文件
    async getTutorialFiles() {
        // 返回所有教程文件的路径 - 新的文档结构只包含每个分类目录下的README.md文件
        return [
            'docs/01-入门指南/README.md',
            'docs/02-基础概念/README.md',
            'docs/03-内容创建/README.md',
            'docs/04-高级开发/README.md',
            'docs/05-专题主题/README.md',
            'docs/06-资源参考/README.md'
        ];
    }

    // 解析文件元数据
    parseMetadata(content) {
        const metadataMatch = content.match(/^---\n(.*?)\n---/s);
        if (!metadataMatch) return {};
        
        const metadata = {};
        const lines = metadataMatch[1].split('\n');
        
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                metadata[key.trim()] = valueParts.join(':').trim();
            }
        });
        
        // 处理新文档结构中的元数据字段映射
        // 将estimated_time映射到time，将last_updated映射到date
        if (metadata.estimated_time && !metadata.time) {
            metadata.time = metadata.estimated_time;
        }
        if (metadata.last_updated && !metadata.date) {
            metadata.date = metadata.last_updated;
        }
        
        return metadata;
    }

    // 提取标题
    extractTitle(content) {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : '无标题';
    }

    // 提取描述
    extractDescription(plainText) {
        // 取前100个字符作为描述
        return plainText.substring(0, 100).trim() + '...';
    }

    // 去除Markdown标记
    stripMarkdown(content) {
        // 移除元数据
        content = content.replace(/^---\n.*?\n---\n/s, '');
        
        // 移除代码块
        content = content.replace(/```[\s\S]*?```/g, '');
        
        // 移除行内代码
        content = content.replace(/`[^`]*`/g, '');
        
        // 移除链接
        content = content.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
        
        // 移除图片
        content = content.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
        
        // 移除标题标记
        content = content.replace(/^#{1,6}\s+/gm, '');
        
        // 移除加粗和斜体标记
        content = content.replace(/\*\*([^*]*)\*\*/g, '$1');
        content = content.replace(/\*([^*]*)\*/g, '$1');
        content = content.replace(/__([^_]*)__/g, '$1');
        content = content.replace(/_([^_]*)_/g, '$1');
        
        // 移除列表标记
        content = content.replace(/^[-*+]\s+/gm, '');
        content = content.replace(/^\d+\.\s+/gm, '');
        
        // 移除引用标记
        content = content.replace(/^>\s+/gm, '');
        
        // 移除多余的换行符
        content = content.replace(/\n+/g, ' ');
        
        return content.trim();
    }

    // 处理英雄区域搜索输入
    handleHeroSearchInput(query) {
        this.currentQuery = query.trim();
        const clearButton = document.getElementById('hero-search-clear');
        
        if (this.currentQuery) {
            clearButton.style.display = 'flex';
            this.showHeroSearchSuggestions();
        } else {
            clearButton.style.display = 'none';
            this.hideHeroSearchSuggestions();
        }
    }
    
    // 处理常规搜索输入
    handleSearchInput(query) {
        this.currentQuery = query.trim();
        const clearButton = document.getElementById('search-clear');
        
        if (this.currentQuery) {
            clearButton.style.display = 'block';
            this.showSearchSuggestions();
        } else {
            clearButton.style.display = 'none';
            this.hideSearchSuggestions();
        }
    }

    // 显示英雄区域搜索建议
    showHeroSearchSuggestions() {
        if (!this.currentQuery) return;
        
        const suggestions = this.getSuggestions(this.currentQuery);
        const suggestionsContainer = document.getElementById('hero-search-suggestions');
        
        if (suggestions.length === 0 || !suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = this.highlightText(suggestion.title, this.currentQuery);
            
            item.addEventListener('click', () => {
                document.getElementById('hero-search-input').value = suggestion.title;
                this.currentQuery = suggestion.title;
                this.performHeroSearch();
            });
            
            suggestionsContainer.appendChild(item);
        });
        
        suggestionsContainer.style.display = 'block';
    }
    
    // 显示常规搜索建议
    showSearchSuggestions() {
        if (!this.currentQuery) return;
        
        const suggestions = this.getSuggestions(this.currentQuery);
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (suggestions.length === 0 || !suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = this.highlightText(suggestion.title, this.currentQuery);
            
            item.addEventListener('click', () => {
                document.getElementById('search-input').value = suggestion.title;
                this.currentQuery = suggestion.title;
                this.performSearch();
            });
            
            suggestionsContainer.appendChild(item);
        });
        
        suggestionsContainer.style.display = 'block';
    }

    // 隐藏英雄区域搜索建议
    hideHeroSearchSuggestions() {
        const suggestionsContainer = document.getElementById('hero-search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
    
    // 隐藏常规搜索建议
    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    // 获取搜索建议
    getSuggestions(query) {
        if (!query) return [];
        
        const lowerQuery = query.toLowerCase();
        return this.searchIndex
            .filter(item => item.title.toLowerCase().includes(lowerQuery))
            .slice(0, 5); // 最多显示5个建议
    }

    // 执行英雄区域搜索
    performHeroSearch() {
        if (!this.currentQuery) return;
        
        // 跳转到搜索结果页面
        const searchUrl = `search-results.html?q=${encodeURIComponent(this.currentQuery)}`;
        window.location.href = searchUrl;
    }
    
    // 执行常规搜索
    performSearch() {
        if (!this.currentQuery) return;
        
        // 跳转到搜索结果页面
        const searchUrl = `search-results.html?q=${encodeURIComponent(this.currentQuery)}`;
        window.location.href = searchUrl;
    }

    // 高级搜索算法
    advancedSearch(query) {
        if (!query) return [];
        
        // 解析搜索查询
        const searchQuery = this.parseSearchQuery(query);
        
        const results = [];
        
        this.searchIndex.forEach(item => {
            const score = this.calculateRelevanceScore(item, searchQuery);
            
            if (score > 0) {
                results.push({
                    ...item,
                    score
                });
            }
        });
        
        // 按得分排序
        return results.sort((a, b) => b.score - a.score);
    }

    // 解析搜索查询
    parseSearchQuery(query) {
        // 这是一个简化的查询解析器，支持基本的AND、OR和括号
        // 在实际应用中，可能需要更复杂的解析器
        
        // 移除多余的空格
        query = query.trim().replace(/\s+/g, ' ');
        
        // 处理精确匹配（引号包围的短语）
        const exactMatches = [];
        const exactMatchRegex = /"([^"]+)"/g;
        let match;
        while ((match = exactMatchRegex.exec(query)) !== null) {
            exactMatches.push(match[1].toLowerCase());
        }
        
        // 移除精确匹配部分，处理剩余查询
        query = query.replace(/"[^"]+"/g, '').trim();
        
        // 处理AND操作（+号）
        const andTerms = [];
        const andTermRegex = /\+([^\s+]+)/g;
        while ((match = andTermRegex.exec(query)) !== null) {
            andTerms.push(match[1].toLowerCase());
        }
        
        // 移除AND操作部分
        query = query.replace(/\+[^\s+]+/g, '').trim();
        
        // 处理括号（简化处理，只支持一层括号）
        const bracketGroups = [];
        const bracketRegex = /\(([^)]+)\)/g;
        while ((match = bracketRegex.exec(query)) !== null) {
            bracketGroups.push(match[1].toLowerCase());
        }
        
        // 移除括号部分
        query = query.replace(/\([^)]+\)/g, '').trim();
        
        // 剩余的部分作为OR操作
        const orTerms = query ? query.split(' ').filter(term => term) : [];
        
        return {
            exactMatches,
            andTerms,
            orTerms,
            bracketGroups,
            originalQuery: query
        };
    }

    // 计算相关性得分
    calculateRelevanceScore(item, searchQuery) {
        let score = 0;
        const title = item.title.toLowerCase();
        const content = item.content.toLowerCase();
        const description = item.description.toLowerCase();
        const category = item.category.toLowerCase();
        
        // 精确匹配得分最高
        searchQuery.exactMatches.forEach(term => {
            if (title.includes(term)) score += 50;
            if (description.includes(term)) score += 25;
            if (content.includes(term)) score += 10;
            if (category.includes(term)) score += 15;
        });
        
        // AND操作得分较高
        searchQuery.andTerms.forEach(term => {
            if (title.includes(term)) score += 20;
            if (description.includes(term)) score += 10;
            if (content.includes(term)) score += 5;
            if (category.includes(term)) score += 8;
        });
        
        // OR操作得分较低
        searchQuery.orTerms.forEach(term => {
            if (title.includes(term)) score += 10;
            if (description.includes(term)) score += 5;
            if (content.includes(term)) score += 2;
            if (category.includes(term)) score += 3;
        });
        
        // 括号组得分中等
        searchQuery.bracketGroups.forEach(group => {
            const groupTerms = group.split(' ');
            let groupScore = 0;
            
            groupTerms.forEach(term => {
                if (title.includes(term)) groupScore += 15;
                if (description.includes(term)) groupScore += 8;
                if (content.includes(term)) groupScore += 3;
                if (category.includes(term)) groupScore += 5;
            });
            
            // 如果组内有多个匹配，给予额外奖励
            if (groupScore > 15) {
                score += groupScore * 1.5;
            } else {
                score += groupScore;
            }
        });
        
        // 完全匹配得分更高
        if (title === searchQuery.originalQuery.toLowerCase()) score += 100;
        
        return score;
    }

    // 从文件路径获取分类
    getCategoryFromPath(filePath) {
        const match = filePath.match(/docs\/([^\/]+)/);
        return match ? match[1] : '未分类';
    }

    // 搜索功能（保留原有简单搜索作为后备）
    search(query) {
        if (!query) return [];
        
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        this.searchIndex.forEach(item => {
            const titleMatch = item.title.toLowerCase().includes(lowerQuery);
            const contentMatch = item.content.toLowerCase().includes(lowerQuery);
            const descriptionMatch = item.description.toLowerCase().includes(lowerQuery);
            
            if (titleMatch || contentMatch || descriptionMatch) {
                let score = 0;
                
                // 标题匹配得分最高
                if (titleMatch) score += 10;
                
                // 描述匹配得分中等
                if (descriptionMatch) score += 5;
                
                // 内容匹配得分较低
                if (contentMatch) score += 1;
                
                // 完全匹配得分更高
                if (item.title.toLowerCase() === lowerQuery) score += 20;
                
                results.push({
                    ...item,
                    score
                });
            }
        });
        
        // 按得分排序
        return results.sort((a, b) => b.score - a.score);
    }

    // 显示搜索结果
    displaySearchResults() {
        const resultsContainer = document.getElementById('search-results');
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>没有找到与 "${this.currentQuery}" 相关的教程</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="search-results-header">
                    <h3>搜索结果 (${this.searchResults.length})</h3>
                    <button class="search-close" id="search-close">×</button>
                </div>
                <div class="search-results-list">
                    ${this.searchResults.map(result => this.createResultItem(result)).join('')}
                </div>
            `;
            
            // 绑定关闭按钮事件
            document.getElementById('search-close').addEventListener('click', () => {
                this.hideSearchResults();
            });
        }
        
        resultsContainer.style.display = 'block';
        this.isSearchVisible = true;
    }

    // 创建搜索结果项
    createResultItem(result) {
        const highlightedTitle = this.highlightText(result.title, this.currentQuery);
        const highlightedDescription = this.highlightText(result.description, this.currentQuery);
        
        return `
            <div class="search-result-item" data-url="${result.url}">
                <h4 class="search-result-title">${highlightedTitle}</h4>
                <p class="search-result-description">${highlightedDescription}</p>
                <div class="search-result-meta">
                    <span class="search-result-category">${this.getCategoryText(result.category)}</span>
                    <span class="search-result-difficulty ${result.difficulty}">${this.getDifficultyText(result.difficulty)}</span>
                    <span class="search-result-time">${result.time}分钟</span>
                </div>
            </div>
        `;
    }

    // 高亮文本
    highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // 转义正则表达式特殊字符
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 隐藏搜索结果
    hideSearchResults() {
        document.getElementById('search-results').style.display = 'none';
        this.isSearchVisible = false;
    }

    // 清除英雄区域搜索
    clearHeroSearch() {
        document.getElementById('hero-search-input').value = '';
        document.getElementById('hero-search-clear').style.display = 'none';
        this.currentQuery = '';
        this.hideSearchResults();
        this.hideHeroSearchSuggestions();
    }
    
    // 清除常规搜索
    clearSearch() {
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('search-clear');
        
        if (searchInput) searchInput.value = '';
        if (clearButton) clearButton.style.display = 'none';
        
        this.currentQuery = '';
        this.hideSearchResults();
        this.hideSearchSuggestions();
    }

    // 处理英雄区域键盘事件
    handleHeroKeydown(e) {
        const suggestionsContainer = document.getElementById('hero-search-suggestions');
        if (!suggestionsContainer) return;
        
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // 实现向下导航建议
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // 实现向上导航建议
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
                // 选择第一个建议
                suggestions[0].click();
            } else {
                this.performHeroSearch();
            }
        } else if (e.key === 'Escape') {
            this.hideHeroSearchSuggestions();
            this.hideSearchResults();
        }
    }
    
    // 处理常规键盘事件
    handleKeydown(e) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;
        
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // 实现向下导航建议
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // 实现向上导航建议
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
                // 选择第一个建议
                suggestions[0].click();
            } else {
                this.performSearch();
            }
        } else if (e.key === 'Escape') {
            this.hideSearchSuggestions();
            this.hideSearchResults();
        }
    }

    // 显示加载状态
    showLoadingState() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = '正在加载搜索索引...';
            searchInput.disabled = true;
        }
    }

    // 隐藏加载状态
    hideLoadingState() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = '搜索教程...';
            searchInput.disabled = false;
        }
    }

    // 获取类别文本
    getCategoryText(category) {
        const categories = {
            '01-入门指南': '入门指南',
            '02-基础概念': '基础概念',
            '03-内容创建': '内容创建',
            '04-高级开发': '高级开发',
            '05-专题主题': '专题主题',
            '06-资源参考': '资源参考'
        };
        return categories[category] || category;
    }

    // 获取难度文本
    getDifficultyText(difficulty) {
        const difficulties = {
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级',
            '初级': '初级',
            '中级': '中级',
            '高级': '高级',
            '全部级别': '全部级别'
        };
        return difficulties[difficulty] || difficulty;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 初始化搜索功能
document.addEventListener('DOMContentLoaded', function() {
    // 确保在主脚本之后初始化搜索
    setTimeout(() => {
        window.tutorialSearch = new TutorialSearch();
    }, 100);
});