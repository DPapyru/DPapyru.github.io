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
            
            // 首先尝试从config.json获取文档列表
            let tutorialFiles = await this.getTutorialFilesFromConfig();
            
            // 如果config.json获取失败或为空，使用默认路径
            if (!tutorialFiles || tutorialFiles.length === 0) {
                tutorialFiles = await this.getTutorialFiles();
            }
            
            // 为每个文件创建索引
            for (const file of tutorialFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) continue;
                    
                    const content = await response.text();
                    const fileName = file.split('/').pop();
                    const metadata = await this.parseMetadataWithConfig(content, fileName, file);
                    const plainText = this.stripMarkdown(content);
                    
                    // 获取相对于docs目录的路径
                    let relativePath = file;
                    if (file.startsWith('docs/')) {
                        relativePath = file.substring(5);
                    }
                    
                    // 更新URL，使其指向viewer.html并加载相应的文件
                    // 使用完整路径，包括子目录
                    const viewerUrl = `docs/viewer.html?file=${encodeURIComponent(relativePath)}`;
                    
                    this.searchIndex.push({
                        title: metadata.title || this.extractTitle(content),
                        url: viewerUrl,
                        content: plainText,
                        description: metadata.description || this.extractDescription(plainText),
                        category: metadata.category || this.getCategoryFromPath(file),
                        difficulty: metadata.difficulty || '未知',
                        time: metadata.time || metadata.estimated_time || '未知',
                        author: metadata.author || '未知',
                        date: metadata.date || metadata.last_updated || '未知',
                        filePath: file // 保存完整文件路径用于后续匹配
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

    // 从config.json获取所有教程文件
    async getTutorialFilesFromConfig() {
        try {
            const response = await fetch('docs/config.json');
            if (!response.ok) {
                throw new Error(`无法加载config.json: ${response.status}`);
            }
            const config = await response.json();
            
            // 从config.json中提取所有文档文件
            const documents = [];
            const processedFiles = new Set(); // 使用Set来避免重复文件
            
            // 直接使用all_files数组，这是最直接的文档列表
            if (config.all_files && Array.isArray(config.all_files)) {
                config.all_files.forEach(file => {
                    // 使用完整的路径，包括子目录
                    if (file.path) {
                        const fullPath = `docs/${file.path}`;
                        if (!processedFiles.has(fullPath)) {
                            documents.push(fullPath);
                            processedFiles.add(fullPath);
                        }
                    } else {
                        // 如果没有path字段，回退到filename
                        const fullPath = `docs/${file.filename}`;
                        if (!processedFiles.has(fullPath)) {
                            documents.push(fullPath);
                            processedFiles.add(fullPath);
                        }
                    }
                });
            }
            
            // 同时也遍历类别和主题，以确保不遗漏任何文件
            if (config.categories) {
                Object.values(config.categories).forEach(category => {
                    if (category.topics) {
                        Object.values(category.topics).forEach(topic => {
                            if (topic.files && Array.isArray(topic.files)) {
                                topic.files.forEach(file => {
                                    if (file.path) {
                                        const fullPath = `docs/${file.path}`;
                                        if (!processedFiles.has(fullPath)) {
                                            documents.push(fullPath);
                                            processedFiles.add(fullPath);
                                        }
                                    } else if (file.filename) {
                                        const fullPath = `docs/${file.filename}`;
                                        if (!processedFiles.has(fullPath)) {
                                            documents.push(fullPath);
                                            processedFiles.add(fullPath);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
            console.log('从config.json获取的文档列表:', documents);
            return documents;
        } catch (error) {
            console.error('获取config.json失败:', error);
            return []; // 返回空数组，让调用者使用默认路径
        }
    }

    // 获取所有教程文件（默认后备方案）
    async getTutorialFiles() {
        // 返回所有教程文件的路径 - 更新为新的嵌套文档结构
        return [
            'docs/Modder入门/DPapyru-给新人的前言.md',
            'docs/给贡献者阅读的文章/DPapyru-贡献者如何编写文章基础.md',
            'docs/给贡献者阅读的文章/TopicSystem使用指南.md',
            'docs/tutorial-index.md'
        ];
    }

    // 解析文件元数据 - 增强版，支持从config.json获取元数据
    async parseMetadataWithConfig(content, fileName, fullPath) {
        let metadata = this.parseMetadata(content);
        
        // 尝试从config.json获取更完整的元数据
        try {
            const response = await fetch('docs/config.json');
            if (response.ok) {
                const config = await response.json();
                
                // 在all_files中查找当前文件，先尝试完整路径匹配，再尝试文件名匹配
                let fileInfo = config.all_files.find(file => file.path === fullPath || file.filename === fileName);
                
                // 如果没找到，尝试只使用文件名部分进行匹配
                if (!fileInfo) {
                    const fileNameOnly = fileName.split('/').pop();
                    fileInfo = config.all_files.find(file => file.filename === fileNameOnly);
                }
                
                if (fileInfo) {
                    // 合并config.json中的元数据
                    metadata = {
                        ...metadata,
                        title: fileInfo.title || metadata.title,
                        author: fileInfo.author || metadata.author,
                        category: fileInfo.category || metadata.category,
                        topic: fileInfo.topic || metadata.topic,
                        order: fileInfo.order || metadata.order,
                        path: fileInfo.path || fullPath
                    };
                    
                    // 从categories中获取更多信息
                    if (fileInfo.category && config.categories[fileInfo.category]) {
                        const categoryInfo = config.categories[fileInfo.category];
                        if (categoryInfo.topics[fileInfo.topic]) {
                            const topicInfo = categoryInfo.topics[fileInfo.topic];
                            const fileInTopic = topicInfo.files.find(f =>
                                f.filename === fileName ||
                                f.path === fullPath ||
                                f.filename === fileName.split('/').pop()
                            );
                            if (fileInTopic) {
                                metadata = {
                                    ...metadata,
                                    title: fileInTopic.title || metadata.title,
                                    author: fileInTopic.author || metadata.author,
                                    description: fileInTopic.description || metadata.description,
                                    last_updated: fileInTopic.last_updated || metadata.last_updated,
                                    order: fileInTopic.order || metadata.order,
                                    path: fileInTopic.path || metadata.path
                                };
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('从config.json获取元数据失败:', error);
        }
        
        return metadata;
    }

    // 解析文件元数据（原始方法）
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
                // 生成匹配片段
                const snippet = this.generateSnippet(item.content, searchQuery);
                
                results.push({
                    ...item,
                    score,
                    snippet
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
        
        // 添加调试日志
        console.log('原始查询:', query);
        
        // 处理URL编码的字符
        query = decodeURIComponent(query);
        console.log('解码后查询:', query);
        
        // 移除多余的空格
        query = query.trim().replace(/\s+/g, ' ');
        console.log('规范化后查询:', query);
        
        // 处理精确匹配（引号包围的短语）
        const exactMatches = [];
        const exactMatchRegex = /"([^"]+)"/g;
        let match;
        while ((match = exactMatchRegex.exec(query)) !== null) {
            exactMatches.push(match[1].toLowerCase());
        }
        console.log('精确匹配项:', exactMatches);
        
        // 移除精确匹配部分，处理剩余查询
        query = query.replace(/"[^"]+"/g, '').trim();
        
        // 处理括号组（先处理括号，因为括号内可能包含AND/OR操作）
        const bracketGroups = [];
        const bracketRegex = /\(([^)]+)\)/g;
        while ((match = bracketRegex.exec(query)) !== null) {
            bracketGroups.push(match[1].toLowerCase());
        }
        console.log('括号组:', bracketGroups);
        
        // 移除括号部分
        query = query.replace(/\([^)]+\)/g, '').trim();
        
        // 处理AND操作（+号）
        const andTerms = [];
        const andTermRegex = /\+([^\s+]+)/g;
        while ((match = andTermRegex.exec(query)) !== null) {
            andTerms.push(match[1].toLowerCase());
        }
        console.log('AND项:', andTerms);
        
        // 移除AND操作部分
        query = query.replace(/\+[^\s+]+/g, '').trim();
        
        // 剩余的部分作为OR操作
        const orTerms = query ? query.split(' ').filter(term => term) : [];
        console.log('OR项:', orTerms);
        
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
        
        // 收集所有搜索词
        const allTerms = [
            ...searchQuery.exactMatches,
            ...searchQuery.andTerms,
            ...searchQuery.orTerms,
            ...searchQuery.bracketGroups.flatMap(group => group.split(' '))
        ].filter(term => term.trim() !== '');
        
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
        
        // 中文搜索优化：如果搜索词是中文，增加对完整匹配的权重
        allTerms.forEach(term => {
            if (this.isChinese(term)) {
                if (title.includes(term)) score += 15;
                if (content.includes(term)) score += 8;
                if (description.includes(term)) score += 10;
            }
        });
        
        return score;
    }

    // 生成匹配片段
    generateSnippet(content, searchQuery) {
        // 收集所有搜索词
        const allTerms = [
            ...searchQuery.exactMatches,
            ...searchQuery.andTerms,
            ...searchQuery.orTerms,
            ...searchQuery.bracketGroups.flatMap(group => group.split(' '))
        ].filter(term => term.trim() !== '');
        
        if (allTerms.length === 0) return '';
        
        // 查找第一个匹配的位置
        let firstMatchIndex = -1;
        let matchedTerm = '';
        
        for (const term of allTerms) {
            const index = content.toLowerCase().indexOf(term.toLowerCase());
            if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
                firstMatchIndex = index;
                matchedTerm = term;
            }
        }
        
        if (firstMatchIndex === -1) return '';
        
        // 提取片段（前后各50个字符）
        const start = Math.max(0, firstMatchIndex - 50);
        const end = Math.min(content.length, firstMatchIndex + matchedTerm.length + 50);
        let snippet = content.substring(start, end);
        
        // 添加省略号
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        // 高亮匹配的词
        snippet = this.highlightText(snippet, matchedTerm);
        
        return snippet;
    }

    // 判断是否为中文字符
    isChinese(text) {
        return /[\u4e00-\u9fa5]/.test(text);
    }

    // 从文件路径获取分类 - 更新为新的嵌套文档结构
    getCategoryFromPath(filePath) {
        const fileName = filePath.split('/').pop();
        
        // 基于文件名映射到分类
        const categoryMappings = {
            'DPapyru-给新人的前言.md': '入门',
            'DPapyru-贡献者如何编写文章基础.md': '怎么贡献',
            'TopicSystem使用指南.md': '怎么贡献',
            'tutorial-index.md': '教程索引'
        };
        
        return categoryMappings[fileName] || '未分类';
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
                ${result.snippet ? `<p class="search-result-snippet">${result.snippet}</p>` : ''}
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

    // 获取类别文本 - 更新为新的嵌套文档结构
    getCategoryText(category) {
        const categories = {
            '入门': '入门',
            '进阶': '进阶',
            '高级': '高级',
            '个人分享': '个人分享',
            '怎么贡献': '怎么贡献',
            '教程索引': '教程索引',
            '01-入门指南': '入门指南', // 保留旧映射以兼容性
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