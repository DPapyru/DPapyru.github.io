// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 初始化移动端菜单
    initMobileMenu();

    // 初始化侧边栏导航
    initSidebarNavigation();

    // 初始化平滑滚动
    initSmoothScroll();

    // 初始化教程筛选功能
    initTutorialFilters();

    // 初始化路由系统
    initRouter();

    // 初始化Markdown渲染
    initMarkdownRenderer();

    // 初始化代码高亮
    initCodeHighlight();

    // 初始化搜索结果点击事件
    initSearchResultClickEvents();
});

/**
 * 初始化移动端菜单切换功能
 * 处理汉堡菜单的点击事件和菜单显示/隐藏逻辑
 */
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');

            // 切换汉堡菜单图标
            const bars = mobileMenuToggle.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                if (mainNav.classList.contains('active')) {
                    if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                    if (index === 1) bar.style.opacity = '0';
                    if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
                } else {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                }
            });
        });

        // 点击页面其他地方关闭菜单（提升用户体验）
        document.addEventListener('click', function (event) {
            if (!mobileMenuToggle.contains(event.target) && !mainNav.contains(event.target)) {
                mainNav.classList.remove('active');

                // 重置汉堡菜单图标
                const bars = mobileMenuToggle.querySelectorAll('.bar');
                bars.forEach(bar => {
                    bar.style.transform = 'none';
                    bar.style.opacity = '1';
                });
            }
        });
    }
}

/**
 * 初始化侧边栏导航功能
 * 处理侧边栏链接的点击事件和滚动时的活动状态更新
 */
function initSidebarNavigation() {
    // 获取所有侧边栏导航链接
    const sidebarLinks = document.querySelectorAll('.sidebar-list a');

    // 为每个侧边栏链接添加点击事件监听器
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // 如果是锚点链接，使用平滑滚动
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // 计算目标位置，考虑固定头部的高度以避免内容被遮挡
                    const headerHeight = document.querySelector('.site-header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // 更新导航链接的活动状态（高亮当前项）
                    updateActiveNavLink(this);
                }
            }
        });
    });

    // 监听页面滚动事件，动态更新活动导航链接
    window.addEventListener('scroll', function () {
        updateActiveNavOnScroll();
    });
}

/**
 * 初始化页面内平滑滚动功能
 * 为所有锚点链接添加平滑滚动效果
 */
function initSmoothScroll() {
    // 获取所有页面内锚点链接
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // 计算目标位置，考虑固定头部的高度以避免内容被遮挡
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 初始化教程筛选功能
 * 为筛选下拉菜单添加事件监听器
 */
function initTutorialFilters() {
    // 获取难度筛选器和时间筛选器元素
    const difficultyFilter = document.getElementById('difficulty-filter');
    const timeFilter = document.getElementById('time-filter');

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', filterTutorials);
    }

    if (timeFilter) {
        timeFilter.addEventListener('change', filterTutorials);
    }
}

/**
 * 筛选教程函数
 * 根据选择的难度和时间筛选条件显示或隐藏教程项目
 */
function filterTutorials() {
    // 获取筛选器和教程项目元素
    const difficultyFilter = document.getElementById('difficulty-filter');
    const timeFilter = document.getElementById('time-filter');
    const tutorialItems = document.querySelectorAll('.tutorial-item');

    // 获取当前选择的筛选条件
    const selectedDifficulty = difficultyFilter ? difficultyFilter.value : 'all';
    const selectedTime = timeFilter ? timeFilter.value : 'all';

    // 遍历所有教程项目，根据筛选条件决定显示或隐藏
    tutorialItems.forEach(item => {
        let showItem = true;

        // 检查难度筛选条件
        if (selectedDifficulty !== 'all') {
            const difficultyBadge = item.querySelector('.difficulty-badge');
            if (difficultyBadge && !difficultyBadge.classList.contains(selectedDifficulty)) {
                showItem = false;
            }
        }

        // 检查时间筛选条件
        if (selectedTime !== 'all' && showItem) {
            const timeElement = item.querySelector('.time');
            if (timeElement) {
                const timeText = timeElement.textContent;
                const timeValue = parseInt(timeText);

                if (selectedTime === 'short' && timeValue >= 30) {
                    showItem = false;
                } else if (selectedTime === 'medium' && (timeValue < 30 || timeValue > 60)) {
                    showItem = false;
                } else if (selectedTime === 'long' && timeValue <= 60) {
                    showItem = false;
                }
            }
        }

        // 根据筛选结果显示或隐藏项目
        item.style.display = showItem ? 'flex' : 'none';
    });
}

/**
 * 更新活动导航链接状态
 * @param {HTMLElement} activeLink - 需要设置为活动状态的链接元素
 */
function updateActiveNavLink(activeLink) {
    // 移除所有导航链接的活动状态
    const sidebarLinks = document.querySelectorAll('.sidebar-list a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });

    // 添加活动状态到当前点击的链接
    activeLink.classList.add('active');
}

/**
 * 滚动时更新活动导航链接
 * 根据当前滚动位置自动高亮对应的导航链接
 */
function updateActiveNavOnScroll() {
    // 获取所有内容区域和侧边栏锚点链接
    const sections = document.querySelectorAll('.content-section, .category-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-list a[href^="#"]');

    // 如果没有内容区域或链接，直接返回
    if (sections.length === 0 || sidebarLinks.length === 0) return;

    // 获取当前滚动位置（添加偏移量以提前触发状态变化）
    const scrollPosition = window.scrollY + 100; // 添加一些偏移量

    let currentSection = '';

    // 遍历所有内容区域，找出当前滚动位置对应的区域
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        // 判断当前滚动位置是否在某个内容区域内
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    // 更新导航链接的活动状态
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

/**
 * 初始化路由系统
 * 处理页面导航、Markdown文件加载和URL路由
 */
function initRouter() {
    console.log('=== 路由系统调试信息 ===');
    console.log('初始化路由系统...');

    // 检查是否为viewer.html页面，或者是被禁用的路由系统
    if (window.IS_VIEWER_PAGE || window.DISABLE_ROUTER) {
        console.log('检测到viewer.html页面或禁用路由，跳过路由系统初始化');
        return;
    }

    // 获取当前页面路径信息，用于判断是否需要加载Markdown内容
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    console.log(`当前路径: ${currentPath}`);
    console.log(`当前完整URL: ${currentHref}`);
    console.log(`当前搜索参数: ${window.location.search}`);
    console.log(`当前哈希: ${window.location.hash}`);

    // 检查关键DOM元素是否存在，用于调试
    const markdownContent = document.getElementById('markdown-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    console.log(`markdown-content元素存在: ${!!markdownContent}`);
    console.log(`loading-indicator元素存在: ${!!loadingIndicator}`);
    console.log(`error-message元素存在: ${!!errorMessage}`);
    if (markdownContent) {
        console.log(`markdown-content当前内容长度: ${markdownContent.innerHTML.length}`);
        console.log(`markdown-content当前显示状态: ${window.getComputedStyle(markdownContent).display}`);
    }

    // 路径检测逻辑 - 修复HTML页面误判问题，精确判断是否需要加载Markdown
    console.log('=== 路径检测详细分析 ===');

    // 首先检查是否为明确的HTML页面（避免误判）
    const isExplicitHtml = currentPath.endsWith('.html') || currentPath.includes('.html?');
    console.log(`是否为明确HTML页面: ${isExplicitHtml}`);

    // 检查是否为需要加载Markdown的页面 - 更新为新的扁平化文档结构
    const isMarkdownPage = currentPath.includes('/docs/') && !currentPath.includes('.html') ||
        currentPath.endsWith('.md') ||
        (currentPath.includes('tutorial-index') && !currentPath.includes('.html')) ||
        (currentPath.includes('DPapyru-ForNewModder') && !currentPath.includes('.html')) ||
        (currentPath.includes('DPapyru-ForContributors-Basic') && !currentPath.includes('.html')) ||
        (currentPath.includes('TopicSystemGuide') && !currentPath.includes('.html'));

    // 只有在不是HTML页面的情况下才考虑加载Markdown内容
    const isDocsPage = !isExplicitHtml && isMarkdownPage;

    console.log(`路径检测结果 - 是否为文档页面: ${isDocsPage}`);
    console.log(`路径包含/docs/: ${currentPath.includes('/docs/')}`);
    console.log(`路径包含.md: ${currentPath.includes('.md')}`);
    console.log(`路径包含tutorial-index: ${currentPath.includes('tutorial-index')}`);
    console.log(`路径包含getting-started: ${currentPath.includes('getting-started')}`);
    console.log(`路径包含basic-concepts: ${currentPath.includes('basic-concepts')}`);
    console.log(`不是HTML文件: ${!currentPath.includes('.html')}`);
    console.log(`修复后逻辑 - 明确HTML: ${isExplicitHtml}, Markdown页面: ${isMarkdownPage}, 最终判断: ${isDocsPage}`);

    // 如果是文档页面，加载对应的Markdown文件
    if (isDocsPage) {
        console.log('=== 开始处理Markdown页面 ===');
        console.log('检测到Markdown页面，准备加载内容...');

        // 从URL中提取Markdown文件路径并进行处理
        let markdownPath = currentPath;
        console.log(`初始markdownPath: ${markdownPath}`);

        // 处理GitHub Pages等特殊情况下的路径
        if (currentPath === '/' || currentPath === '/index.html') {
            // 首页不需要加载Markdown
            console.log('首页，跳过Markdown加载');
            return;
        }

        // 处理路径特殊情况（目录路径和文件扩展名）
        if (currentPath.endsWith('/')) {
            markdownPath += 'index.md';
            console.log(`路径以/结尾，添加index.md: ${markdownPath}`);
        } else if (!currentPath.endsWith('.md')) {
            markdownPath += '.md';
            console.log(`路径不以.md结尾，添加.md: ${markdownPath}`);
        }

        // 移除开头的斜杠，确保使用正确的相对路径
        if (markdownPath.startsWith('/')) {
            markdownPath = markdownPath.substring(1);
            console.log(`移除开头斜杠: ${markdownPath}`);
        }

        // 应用路径清理函数，确保路径格式正确
        markdownPath = cleanPath(markdownPath);
        console.log(`清理后的最终路径: ${markdownPath}`);

        // 检查文件是否存在（通过HEAD请求测试）
        console.log('测试文件可访问性...');
        fetch(markdownPath, { method: 'HEAD' })
            .then(response => {
                console.log(`文件访问测试结果: ${response.status} ${response.statusText}`);
                if (response.ok) {
                    console.log(`将要加载的Markdown文件: ${markdownPath}`);

                    // 延迟加载以确保DOM完全准备好并避免竞态条件
                    setTimeout(() => {
                        console.log('开始延迟加载Markdown内容...');
                        loadMarkdownContent(markdownPath);
                    }, 100);
                } else {
                    console.error(`文件不存在或无法访问: ${markdownPath}`);
                    // 文件不存在时尝试备用路径
                    tryFallbackPaths(markdownPath);
                }
            })
            .catch(error => {
                console.error(`文件访问测试失败: ${error}`);
                tryFallbackPaths(markdownPath);
            });
    } else {
        console.log('当前页面不是Markdown页面，跳过加载');

        // 检查特殊情况：有markdown-content元素但没有加载内容
        const markdownContent = document.getElementById('markdown-content');
        if (markdownContent && window.location.pathname.includes('docs/')) {
            console.log('检测到docs页面但没有触发Markdown加载，尝试手动加载...');
            // 尝试加载默认的tutorial-index.md
            setTimeout(() => {
                loadMarkdownContent('docs/tutorial-index.md');
            }, 100);
        }
    }

    // 监听页面内链接点击事件，处理Markdown文件链接
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (link && link.href && link.getAttribute('href').endsWith('.md')) {
            e.preventDefault();
            let href = link.getAttribute('href');

            // 将Markdown文件链接重定向到viewer.html页面
            if (!href.includes('viewer.html')) {
                const fileName = href.split('/').pop();
                href = `docs/viewer.html?file=${fileName}`;
            }

            console.log(`点击了Markdown链接，重定向到: ${href}`);

            // 如果当前已经在viewer.html页面中，直接加载内容而不跳转
            if (window.location.pathname.includes('viewer.html')) {
                const urlParams = new URLSearchParams(window.location.search);
                const currentFile = urlParams.get('file');
                const newFile = href.split('file=')[1];

                if (currentFile !== newFile) {
                    // 更新浏览器URL参数（不刷新页面）
                    const newUrl = window.location.pathname + '?file=' + newFile;
                    history.pushState({}, '', newUrl);

                    // 加载新的Markdown内容
                    if (typeof loadMarkdownContent === 'function') {
                        loadMarkdownContent(newFile);
                    }
                }
            } else {
                // 跳转到viewer.html页面
                window.location.href = href;
            }
        }
    });

    // 监听浏览器前进后退按钮，处理历史记录导航
    window.addEventListener('popstate', function () {
        const currentPath = window.location.pathname;
        console.log(`浏览器前进后退，当前路径: ${currentPath}`);

        // 使用增强的路径检测逻辑 - 更新为新的文档结构
        const isDocsPage = currentPath.includes('/docs/') || currentPath.includes('.md') ||
            currentPath.includes('tutorial-index') || currentPath.includes('DPapyru-ForNewModder') ||
            currentPath.includes('DPapyru-ForContributors-Basic') || currentPath.includes('TopicSystemGuide');

        if (isDocsPage) {
            // 处理路径，确保使用正确的相对路径
            let pathToLoad = currentPath;
            pathToLoad = cleanPath(pathToLoad);

            console.log(`处理后要加载的路径: ${pathToLoad}`);
            loadMarkdownContent(pathToLoad);
        }
    });
}

/**
 * 初始化Markdown渲染功能
 * 配置marked.js库的选项，包括代码高亮和表格支持
 */
function initMarkdownRenderer() {
    // 检查marked.js库是否已加载并配置选项
    if (typeof marked !== 'undefined') {
        console.log('Marked.js已加载，正在配置...');
        marked.setOptions({
            highlight: function (code, lang) {
                if (typeof Prism !== 'undefined' && Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
            breaks: true,
            gfm: true,
            tables: true,
            sanitize: false,
            smartLists: true,
            smartypants: true,
            mangle: true,
            headerIds: true,
            xhtml: false,
            pedantic: false
        });
        console.log('Marked.js配置完成');
    } else {
        console.error('Marked.js未加载，请检查库文件是否正确引入');
    }
}

/**
 * 初始化代码高亮功能
 * 使用Prism.js为页面中的代码块添加语法高亮
 */
function initCodeHighlight() {
    // 检查Prism.js库是否已加载并应用代码高亮
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

/**
 * 路径清理函数
 * 修复路径重复问题，确保路径格式正确
 * @param {string} path - 需要清理的路径
 * @returns {string} 清理后的路径
 */
function cleanPath(path) {
    console.log(`=== 路径清理调试 ===`);
    console.log(`原始路径: "${path}"`);

    const originalPath = path; // 保存原始路径用于日志

    // 移除开头的斜杠，确保使用相对路径
    if (path.startsWith('/')) {
        path = path.substring(1);
        console.log(`移除开头斜杠: "${path}"`);
    }

    // 修复重复的docs路径 - 使用增强版本处理各种重复情况
    let docsReplaced = true;
    let replaceCount = 0;
    while (docsReplaced && replaceCount < 10) { // 防止无限循环的安全措施
        const beforeReplace = path;
        // 修复所有可能的docs路径重复模式
        path = path.replace(/docs\/docs\/+/g, 'docs/');
        path = path.replace(/docs\/docs/g, 'docs/');
        path = path.replace(/\/docs\//g, '/docs/'); // 确保单斜杠
        docsReplaced = beforeReplace !== path;
        if (docsReplaced) replaceCount++;
    }
    if (replaceCount > 0) {
        console.log(`修复重复的docs路径，替换次数: ${replaceCount}, 结果: "${path}"`);
    }

    // 修复双斜杠
    path = path.replace(/\/\//g, '/');
    if (path !== originalPath && path.includes('//')) {
        console.log(`修复双斜杠: "${path}"`);
    }

    // 特殊处理：如果路径已经包含.html文件，保持原样不修改
    if (path.includes('.html')) {
        console.log(`路径包含HTML文件，保持原样: "${path}"`);
        console.log(`路径清理完成，原始: "${originalPath}" -> 最终: "${path}"`);
        return path;
    }

    // 新的扁平化结构处理：如果路径包含旧的结构，尝试映射到新结构
    const oldStructureMappings = {
        '01-入门指南/README.md': 'DPapyru-ForNewModder.md',
        '02-基础概念/README.md': 'tutorial-index.md',
        '03-内容创建/README.md': 'tutorial-index.md',
        '04-高级开发/README.md': 'tutorial-index.md',
        '05-专题主题/README.md': 'tutorial-index.md',
        '06-资源参考/README.md': 'tutorial-index.md',
        'getting-started.md': 'DPapyru-ForNewModder.md',
        'basic-concepts.md': 'tutorial-index.md'
    };

    // 检查是否需要映射旧路径到新路径
    for (const [oldPath, newPath] of Object.entries(oldStructureMappings)) {
        if (path.includes(oldPath)) {
            path = path.replace(oldPath, newPath);
            console.log(`映射旧路径到新路径: ${oldPath} -> ${newPath}`);
            break;
        }
    }

    // 如果是文件名且没有路径分隔符，尝试在全局文档列表中查找完整路径
    if (!path.includes('/') && typeof window.ALL_DOCS !== 'undefined' && window.ALL_DOCS.length > 0) {
        const doc = window.ALL_DOCS.find(d => d.filename === path || d.path === path);
        if (doc && doc.path) {
            path = doc.path;
            console.log(`通过文档列表找到完整路径: ${path}`);
        }
    }

    // 确保以.md结尾（如果不是目录路径）
    if (!path.endsWith('/') && !path.endsWith('.md')) {
        path += '.md';
        console.log(`添加.md扩展名: "${path}"`);
    }

    // 检查路径是否包含docs目录前缀
    if (!path.startsWith('docs/') && !path.startsWith('http') && !path.startsWith('#')) {
        path = `docs/${path}`;
        console.log(`添加docs前缀: "${path}"`);
    }

    console.log(`最终清理路径: "${path}"`);
    console.log(`路径清理完成，原始: "${originalPath}" -> 最终: "${path}"`);
    return path;
}

/**
 * 尝试备用路径
 * 当主路径无法访问时，尝试一系列可能的备用路径
 * @param {string} originalPath - 原始路径
 */
function tryFallbackPaths(originalPath) {
    console.log(`=== 尝试备用路径 ===`);
    console.log(`原始路径: ${originalPath}`);

    // 检查是否为HTML页面误判（避免对HTML页面进行Markdown加载尝试）
    if (originalPath.includes('.html')) {
        console.log(`检测到HTML页面路径，停止Markdown加载尝试: ${originalPath}`);
        showError(`这是一个HTML页面，不需要加载Markdown文件: ${originalPath}`);
        return;
    }

    // 定义可能的备用路径列表 - 更新为新的扁平化结构
    const fallbackPaths = [
        originalPath,
        `docs/${originalPath}`,
        `docs/${originalPath.replace(/^docs\//, '')}`,
        originalPath.replace(/^docs\//, ''),
        originalPath.replace(/\.md$/, '') + '.md'
    ];

    // 如果是文件名，尝试在全局文档列表中查找完整路径
    if (!originalPath.includes('/') && typeof window.ALL_DOCS !== 'undefined' && window.ALL_DOCS.length > 0) {
        const doc = window.ALL_DOCS.find(d => d.filename === originalPath || d.path === originalPath);
        if (doc && doc.path) {
            fallbackPaths.unshift(doc.path);
            console.log(`添加文档列表中的路径作为备用: ${doc.path}`);
        }
    }

    // 添加旧结构到新结构的映射作为备用路径
    const oldToNewMappings = {
        'docs/01-入门指南/README.md': 'docs/DPapyru-ForNewModder.md',
        'docs/02-基础概念/README.md': 'docs/tutorial-index.md',
        'docs/03-内容创建/README.md': 'docs/tutorial-index.md',
        'docs/04-高级开发/README.md': 'docs/tutorial-index.md',
        'docs/05-专题主题/README.md': 'docs/tutorial-index.md',
        'docs/06-资源参考/README.md': 'docs/tutorial-index.md',
        'docs/getting-started.md': 'docs/DPapyru-ForNewModder.md',
        'docs/basic-concepts.md': 'docs/tutorial-index.md'
    };

    // 检查原始路径是否匹配旧结构，如果是则添加新结构路径作为备用
    for (const [oldPath, newPath] of Object.entries(oldToNewMappings)) {
        if (originalPath.includes(oldPath) || originalPath.includes(oldPath.replace('docs/', ''))) {
            fallbackPaths.push(newPath);
            break;
        }
    }

    // 去除重复路径
    const uniquePaths = [...new Set(fallbackPaths)];
    console.log(`要尝试的备用路径: ${uniquePaths.join(', ')}`);

    let pathIndex = 0;

    // 递归尝试下一个路径的内部函数
    function tryNextPath() {
        if (pathIndex >= uniquePaths.length) {
            console.error('所有备用路径都失败了');
            showError(`无法找到对应的Markdown文件，尝试的路径: ${uniquePaths.join(', ')}`);
            return;
        }

        const testPath = uniquePaths[pathIndex];
        console.log(`尝试路径 ${pathIndex + 1}/${uniquePaths.length}: ${testPath}`);

        fetch(testPath, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log(`找到可用路径: ${testPath}`);
                    setTimeout(() => {
                        loadMarkdownContent(testPath);
                    }, 100);
                } else {
                    console.log(`路径 ${testPath} 不可用: ${response.status}`);
                    pathIndex++;
                    tryNextPath();
                }
            })
            .catch(error => {
                console.log(`路径 ${testPath} 访问失败: ${error}`);
                pathIndex++;
                tryNextPath();
            });
    }

    tryNextPath();
}

/**
 * 显示错误信息
 * 在页面上显示加载失败的错误信息
 * @param {string} message - 要显示的错误消息
 */
function showError(message) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (errorMessage) {
        errorMessage.style.display = 'block';
        if (errorText) {
            errorText.textContent = message;
        }
    }
}

/**
 * 加载Markdown内容
 * 从指定路径获取Markdown文件并渲染到页面中
 * @param {string} filePath - Markdown文件的路径
 */
function loadMarkdownContent(filePath) {
    console.log(`=== 开始加载Markdown内容 ===`);
    console.log(`尝试加载Markdown文件: ${filePath}`);

    // 清理和标准化文件路径
    const originalPath = filePath;
    filePath = cleanPath(filePath);
    console.log(`原始路径: ${originalPath}, 清理后路径: ${filePath}`);

    // 获取页面中的关键DOM元素
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const markdownContent = document.getElementById('markdown-content');
    const tableOfContents = document.getElementById('table-of-contents');
    const defaultContent = document.getElementById('default-content');

    // 防止重复的docs路径问题
    if (filePath.startsWith('docs/docs/')) {
        filePath = filePath.replace('docs/docs/', 'docs/');
        console.log(`修复重复的docs路径: ${filePath}`);
    }

    // 检查必要的DOM元素是否存在
    if (!markdownContent) {
        console.error('找不到markdown-content元素');
        return;
    }

    // 显示加载状态，隐藏其他内容
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (markdownContent) markdownContent.style.display = 'none';
    if (tableOfContents) tableOfContents.style.display = 'none';
    if (defaultContent) defaultContent.style.display = 'none';

    // 通过fetch API获取Markdown文件内容
    console.log(`发起fetch请求: ${filePath}`);
    const fetchStartTime = Date.now();

    fetch(filePath)
        .then(response => {
            const fetchTime = Date.now() - fetchStartTime;
            console.log(`fetch响应时间: ${fetchTime}ms`);
            console.log(`获取文件响应状态: ${response.status} ${response.statusText}`);
            console.log(`响应头: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

            // 检查响应状态，如果不是200则抛出错误
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            // 以文本形式获取响应内容（UTF-8编码）
            return response.text();
        })
        .then(markdownText => {
            console.log(`成功获取Markdown内容，长度: ${markdownText.length}`);
            console.log(`marked库状态: ${typeof marked !== 'undefined' ? '已加载' : '未加载'}`);

            // 使用marked.js渲染Markdown内容为HTML
            if (typeof marked !== 'undefined' && markdownContent) {
                try {
                    // 将Markdown文本解析为HTML
                    const renderedHTML = marked.parse(markdownText);
                    console.log('Markdown渲染成功');
                    markdownContent.innerHTML = renderedHTML;

                    // 为新渲染的内容应用代码语法高亮
                    if (typeof Prism !== 'undefined') {
                        console.log('正在应用代码高亮...');
                        Prism.highlightAllUnder(markdownContent);
                    } else {
                        console.warn('Prism.js未加载，跳过代码高亮');
                    }

                    // 自动生成文档目录
                    generateTableOfContents(markdownContent);

                    // 显示渲染后的内容，隐藏加载指示器
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (markdownContent) markdownContent.style.display = 'block';
                    if (tableOfContents) tableOfContents.style.display = 'block';

                    // 更新页面标题和面包屑导航
                    updatePageTitle(markdownContent);

                    // 更新侧边栏导航链接
                    updateSidebarNavigation(markdownContent);

                    // 为新内容初始化平滑滚动功能
                    initSmoothScroll();
                } catch (error) {
                    console.error('Markdown渲染错误:', error);
                    throw error;
                }
            } else {
                console.error('marked库未加载或markdown-content元素不存在');
            }
        })
        .catch(error => {
            console.error('Error loading markdown:', error);

            // 显示错误信息
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (errorMessage) {
                errorMessage.style.display = 'block';
                const errorText = document.getElementById('error-text');
                if (errorText) {
                    errorText.textContent = `无法加载文件 "${filePath}": ${error.message}`;
                }
            }
        });
}

/**
 * 生成文档目录
 * 根据内容中的标题自动生成可点击的目录
 * @param {HTMLElement} contentElement - 包含Markdown内容的DOM元素
 */
function generateTableOfContents(contentElement) {
    console.log('开始生成目录...');

    const tableOfContents = document.getElementById('table-of-contents');
    const tocList = document.getElementById('toc-list');

    if (!tableOfContents || !tocList || !contentElement) {
        console.error('目录元素或内容元素不存在');
        return;
    }

    // 获取内容中的所有标题元素（h1-h6）
    const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log(`找到 ${headings.length} 个标题`);

    if (headings.length === 0) {
        tableOfContents.style.display = 'none';
        console.log('没有找到标题，隐藏目录');
        return;
    }

    // 清空现有目录内容
    tocList.innerHTML = '';

    // 遍历标题生成对应的目录项
    headings.forEach((heading, index) => {
        console.log(`处理标题 ${index + 1}: ${heading.tagName} - ${heading.textContent}`);

        // 为没有ID的标题自动生成ID（用于锚点跳转）
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        // 创建目录链接元素
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;

        // 根据标题级别设置缩进（层级结构）
        const level = parseInt(heading.tagName.substring(1));
        a.style.paddingLeft = `${(level - 1) * 15}px`;

        li.appendChild(a);
        tocList.appendChild(li);

        // 为目录项添加点击事件，实现平滑滚动到对应标题
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.getElementById(heading.id);
            if (targetElement) {
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 显示目录
    tableOfContents.style.display = 'block';
    console.log('目录生成完成');
}

/**
 * 更新页面标题
 * 根据内容中的第一个标题更新页面标题和面包屑导航
 * @param {HTMLElement} contentElement - 包含Markdown内容的DOM元素
 */
function updatePageTitle(contentElement) {
    if (!contentElement) return;

    // 获取内容中的第一个标题作为页面标题
    const firstHeading = contentElement.querySelector('h1, h2');
    if (firstHeading) {
        const title = firstHeading.textContent;
        // 更新浏览器标题栏
        document.title = `${title} - 泰拉瑞亚Mod制作教程`;

        // 更新面包屑导航中的当前页面名称
        const breadcrumbCurrent = document.querySelector('.breadcrumb .current');
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = title;
        }

        // 更新页面主标题
        const pageTitle = document.querySelector('.tutorial-title, .category-title');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }
}

/**
 * 更新侧边栏导航
 * 根据内容中的标题生成侧边栏导航链接
 * @param {HTMLElement} contentElement - 包含Markdown内容的DOM元素
 */
function updateSidebarNavigation(contentElement) {
    if (!contentElement) return;

    // 获取h2和h3级别的标题作为导航项
    const headings = contentElement.querySelectorAll('h2, h3');
    const sidebarList = document.querySelector('.sidebar-list');

    // 如果没有侧边栏或标题，直接返回
    if (!sidebarList || headings.length === 0) return;

    // 清空现有侧边栏导航内容
    sidebarList.innerHTML = '';

    // 遍历标题生成侧边栏导航项
    headings.forEach((heading, index) => {
        // 为没有ID的标题自动生成ID
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        // 创建侧边栏导航链接
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;

        li.appendChild(a);
        sidebarList.appendChild(li);
    });
}

/**
 * 工具函数：防抖（Debounce）
 * 在事件触发后等待指定时间再执行函数，避免频繁执行
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * 工具函数：节流（Throttle）
 * 在指定时间间隔内最多执行一次函数，限制执行频率
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 使用节流函数优化滚动事件性能
window.addEventListener('scroll', throttle(function () {
    // 这里可以添加滚动相关的优化逻辑
}, 100));

// 使用防抖函数优化窗口大小调整事件性能
window.addEventListener('resize', debounce(function () {
    // 这里可以添加窗口大小调整相关的逻辑
    // 例如重新计算布局等
}, 250));

// 页面加载完成后的额外初始化
window.addEventListener('load', function () {
    console.log('=== 页面完全加载事件触发 ===');

    // 检查是否为viewer.html页面，如果是则跳过自动加载逻辑
    if (window.IS_VIEWER_PAGE) {
        console.log('检测到viewer.html页面，跳过页面加载检查');
        return;
    }

    // 添加加载完成的CSS类，可用于页面过渡效果
    document.body.classList.add('loaded');

    // 预加载关键资源（提升用户体验）
    preloadCriticalResources();

    console.log('页面完全加载，执行额外检查...');

    // 检查是否需要加载Markdown内容（处理页面刷新情况）
    const currentPath = window.location.pathname;
    console.log(`页面加载检查 - 当前路径: ${currentPath}`);

    // 检查是否直接访问了Markdown文件，如果是则重定向到查看器页面
    if (currentPath.endsWith('.md') && !window.location.pathname.includes('viewer.html')) {
        console.log('检测到直接访问Markdown文件，重定向到viewer.html');
        const fileName = currentPath.split('/').pop();
        const newPath = currentPath.replace(fileName, `viewer.html?file=${fileName}`);
        window.location.replace(newPath);
        return;
    }

    // 使用更精确的文档页面检测逻辑 - 排除HTML页面
    const isExplicitHtml = currentPath.endsWith('.html') || currentPath.includes('.html?');
    const isDocsPage = !isExplicitHtml && (
        currentPath.includes('/docs/') ||
        currentPath.endsWith('.md') ||
        currentPath.includes('tutorial-index') ||
        currentPath.includes('DPapyru-ForNewModder') ||
        currentPath.includes('DPapyru-ForContributors-Basic') ||
        currentPath.includes('TopicSystemGuide')
    );

    console.log(`页面加载检查 - 是否为HTML页面: ${isExplicitHtml}`);
    console.log(`页面加载检查 - 是否为文档页面: ${isDocsPage}`);

    if (isDocsPage) {
        // 检查markdown-content元素是否已有内容（处理页面刷新情况）
        const markdownContent = document.getElementById('markdown-content');
        console.log(`markdown-content元素存在: ${!!markdownContent}`);

        if (markdownContent) {
            const contentLength = markdownContent.innerHTML.length;
            const contentTrimmed = markdownContent.innerHTML.trim();
            console.log(`markdown-content内容长度: ${contentLength}`);
            console.log(`markdown-content是否为空: ${contentTrimmed === ''}`);
            console.log(`markdown-content显示状态: ${window.getComputedStyle(markdownContent).display}`);

            if (contentLength === 0 || contentTrimmed === '') {
                console.log('=== 检测到页面刷新但内容未加载，开始重新加载 ===');

                // 从当前URL推断需要加载的文件路径
                let filePath = currentPath;
                console.log(`从URL推断的初始文件路径: ${filePath}`);

                if (filePath.startsWith('/')) {
                    filePath = filePath.substring(1);
                    console.log(`移除开头斜杠: ${filePath}`);
                }

                if (!filePath.endsWith('.md') && !filePath.includes('.html')) {
                    filePath += '.md';
                    console.log(`添加.md扩展名: ${filePath}`);
                }

                filePath = cleanPath(filePath);
                console.log(`页面刷新后最终加载路径: ${filePath}`);

                // 使用更长的延迟确保所有资源都完全加载完成
                setTimeout(() => {
                    console.log('开始延迟加载Markdown内容...');
                    loadMarkdownContent(filePath);
                }, 300);
            } else {
                console.log('页面已有内容，跳过重新加载');
            }
        } else {
            console.error('markdown-content元素不存在！');
        }
    } else {
        console.log('页面加载检查 - 不是文档页面，跳过Markdown加载检查');
    }
});

/**
 * 预加载关键资源
 * 预加载下一页可能需要的资源，提升用户体验
 */
function preloadCriticalResources() {
    // 这里可以添加预加载关键资源的逻辑
    // 例如预加载下一页的图片等
}

// 全局错误处理监听器
window.addEventListener('error', function (e) {
    console.error('JavaScript错误:', e.error);
    // 这里可以添加错误上报逻辑
});

// 导出函数供其他脚本使用（模块化接口）
window.TerrariaModTutorial = {
    initMobileMenu,
    initSidebarNavigation,
    initSmoothScroll,
    initTutorialFilters,
    debounce,
    throttle,
    cleanPath  // 导出路径清理函数
};

// 同时将cleanPath设为全局函数，方便其他脚本使用
window.cleanPath = cleanPath;

/**
 * 初始化搜索结果点击事件
 * 处理搜索结果项的点击事件，支持Markdown文件和普通链接
 */
function initSearchResultClickEvents() {
    // 使用事件委托处理动态生成的搜索结果点击事件
    document.addEventListener('click', function (e) {
        const searchResultItem = e.target.closest('.search-result-item');
        if (searchResultItem) {
            let url = searchResultItem.getAttribute('data-url');
            if (url) {
                // 清理路径
                url = cleanPath(url);

                // 如果是Markdown文件链接，使用现有的Markdown加载机制
                if (url.endsWith('.md')) {
                    e.preventDefault();

                    // 如果是文件名，尝试在文档列表中查找完整路径
                    if (!url.includes('/') && typeof window.ALL_DOCS !== 'undefined' && window.ALL_DOCS.length > 0) {
                        const doc = window.ALL_DOCS.find(d => d.filename === url.split('/').pop() || d.path === url);
                        if (doc && doc.path) {
                            url = doc.path;
                            console.log(`搜索结果中找到完整路径: ${url}`);
                        }
                    }

                    // 隐藏搜索结果面板
                    const searchResults = document.getElementById('search-results');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }

                    // 加载Markdown内容到当前页面
                    if (typeof loadMarkdownContent === 'function') {
                        loadMarkdownContent(url);
                    }

                    // 更新浏览器历史记录（不刷新页面）
                    history.pushState({}, '', url);
                } else {
                    // 普通链接，正常跳转
                    window.location.href = url;
                }
            }
        }
    });
}

// 增强Markdown内容加载功能，添加搜索索引自动更新
const originalLoadMarkdownContent = loadMarkdownContent;
if (typeof originalLoadMarkdownContent === 'function') {
    window.loadMarkdownContent = function (filePath) {
        // 清理文件路径
        filePath = cleanPath(filePath);

        // 调用原始函数
        originalLoadMarkdownContent(filePath);

        // 如果搜索功能已初始化，将新加载的内容添加到搜索索引
        if (window.tutorialSearch && window.tutorialSearch.searchIndex.length > 0) {
            // 检查当前文件是否已存在于搜索索引中
            const isInIndex = window.tutorialSearch.searchIndex.some(item => item.url === filePath);

            if (!isInIndex) {
                // 如果不在索引中，获取文件内容并添加到搜索索引
                fetch(filePath)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.text();
                    })
                    .then(content => {
                        // 解析文件元数据和纯文本内容
                        const metadata = window.tutorialSearch.parseMetadata(content);
                        const plainText = window.tutorialSearch.stripMarkdown(content);

                        // 将文件信息添加到搜索索引
                        window.tutorialSearch.searchIndex.push({
                            title: metadata.title || window.tutorialSearch.extractTitle(content),
                            url: filePath,
                            content: plainText,
                            description: metadata.description || window.tutorialSearch.extractDescription(plainText),
                            category: metadata.category || '未分类',
                            difficulty: metadata.difficulty || '未知',
                            time: metadata.time || '未知',
                            author: metadata.author || '未知',
                            date: metadata.date || '未知'
                        });

                        console.log(`已将 ${filePath} 添加到搜索索引`);
                    })
                    .catch(error => {
                        console.warn(`无法将 ${filePath} 添加到搜索索引:`, error);
                    });
            }
        }
    };
}