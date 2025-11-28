// 导航功能实现
class NavigationEnhancements {
    constructor() {
        this.init();
    }

    // 初始化所有导航功能
    init() {
        // this.initBreadcrumb();
        this.initSidebarNavigation();
        this.initBackToTop();
        this.initKeyboardShortcuts();
        this.initMobileNavigation();
    }

    // // 初始化面包屑导航
    // initBreadcrumb() {
    //     // 检查是否已有面包屑导航
    //     if (!document.querySelector('.breadcrumb-nav')) {
    //         this.createBreadcrumb();
    //     }
    // }

    // 创建面包屑导航
    createBreadcrumb() {
        const mainContent = document.querySelector('.main-content') || document.querySelector('.content-wrapper');
        if (!mainContent) return;

        // 创建面包屑容器
        const breadcrumbNav = document.createElement('nav');
        breadcrumbNav.className = 'breadcrumb-nav';

        const breadcrumbList = document.createElement('ul');
        breadcrumbList.className = 'breadcrumb-list';

        // 获取当前路径
        const currentPath = window.location.pathname;
        const breadcrumbItems = this.generateBreadcrumbItems(currentPath);

        // 添加面包屑项
        breadcrumbItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'breadcrumb-item';

            if (item.isCurrent) {
                li.innerHTML = `<span class="breadcrumb-current">${item.text}</span>`;
            } else {
                // 清理路径并适配新的扁平化结构
                let cleanUrl = item.url;
                if (typeof window.cleanPath === 'function') {
                    cleanUrl = window.cleanPath(cleanUrl);
                }
                
                // 如果是Markdown文件，使用viewer.html加载
                if (cleanUrl.endsWith('.md') && !cleanUrl.includes('viewer.html')) {
                    // 如果是文件名，尝试在文档列表中查找完整路径
                    if (!cleanUrl.includes('/') && typeof window.ALL_DOCS !== 'undefined' && window.ALL_DOCS.length > 0) {
                        const doc = window.ALL_DOCS.find(d => d.filename === cleanUrl.split('/').pop() || d.path === cleanUrl);
                        if (doc && doc.path) {
                            cleanUrl = `docs/viewer.html?file=${doc.path}`;
                        } else {
                            const fileName = cleanUrl.split('/').pop();
                            cleanUrl = `docs/viewer.html?file=${fileName}`;
                        }
                    } else {
                        const fileName = cleanUrl.split('/').pop();
                        cleanUrl = `docs/viewer.html?file=${cleanUrl}`;
                    }
                }
                
                li.innerHTML = `<a href="${cleanUrl}" class="breadcrumb-link">${item.text}</a>`;
            }

            breadcrumbList.appendChild(li);
        });

        breadcrumbNav.appendChild(breadcrumbList);

        // 将面包屑插入到主内容区域的开头
        mainContent.insertBefore(breadcrumbNav, mainContent.firstChild);
    }

    // 生成面包屑项
    generateBreadcrumbItems(path) {
        const items = [];
        
        // 添加首页
        items.push({
            text: '首页',
            url: '/index.html',
            isCurrent: false
        });

        // 解析路径 - 更新为新的扁平化文档结构
        if (path.includes('/docs/')) {
            items.push({
                text: '教程',
                url: 'docs/tutorial-index.md',
                isCurrent: false
            });

            // 获取当前文档标题
            const title = this.extractPageTitle();
            if (title) {
                items.push({
                    text: title,
                    url: '',
                    isCurrent: true
                });
            }
        } else if (path.includes('DPapyru-ForNewModder.md') || path.includes('01-入门指南')) {
            items.push({
                text: '入门指南',
                url: '',
                isCurrent: true
            });
        } else if (path.includes('DPapyru-ForContributors-Basic.md') || path.includes('给贡献者阅读的文章')) {
            items.push({
                text: '贡献指南',
                url: '',
                isCurrent: true
            });
        } else if (path.includes('TopicSystemGuide.md')) {
            items.push({
                text: '系统指南',
                url: '',
                isCurrent: true
            });
        } else if (path.includes('tutorial-index.md') || path.includes('02-基础概念')) {
            items.push({
                text: '教程索引',
                url: '',
                isCurrent: true
            });
        }

        return items;
    }

    // 提取页面标题
    extractPageTitle() {
        // 尝试从h1标签获取标题
        const h1 = document.querySelector('h1');
        if (h1) return h1.textContent.trim();

        // 尝试从title标签获取标题
        const title = document.title;
        if (title) {
            // 移除网站后缀
            return title.replace(' - 泰拉瑞亚Mod制作教程', '').trim();
        }

        return '';
    }

    // 初始化侧边栏导航
    initSidebarNavigation() {
        const sidebarSections = document.querySelectorAll('.sidebar-section');
        
        sidebarSections.forEach(section => {
            const title = section.querySelector('.sidebar-title');
            const list = section.querySelector('.sidebar-list');
            
            if (title && list && list.children.length > 5) {
                // 添加折叠功能
                this.makeSidebarCollapsible(section, title, list);
            }
        });

        // 添加活动状态指示
        this.updateSidebarActiveState();
        
        // 监听滚动事件，更新活动状态
        window.addEventListener('scroll', throttle(() => {
            this.updateSidebarActiveState();
        }, 100));
    }

    // 使侧边栏可折叠
    makeSidebarCollapsible(section, title, list) {
        // 创建折叠按钮
        const toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.innerHTML = '▼';
        toggle.setAttribute('aria-label', '折叠/展开');
        
        // 调整标题样式以容纳按钮
        title.style.paddingRight = '25px';
        title.style.position = 'relative';
        
        // 添加按钮到标题
        title.appendChild(toggle);
        
        // 添加点击事件
        toggle.addEventListener('click', () => {
            list.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
            toggle.innerHTML = list.classList.contains('collapsed') ? '▶' : '▼';
        });
        
        // 添加折叠类
        list.classList.add('collapsible');
    }

    // 更新侧边栏活动状态
    updateSidebarActiveState() {
        const sections = document.querySelectorAll('.content-section, .category-section, h2[id], h3[id]');
        const sidebarLinks = document.querySelectorAll('.sidebar-list a[href^="#"]');
        
        if (sections.length === 0 || sidebarLinks.length === 0) return;
        
        // 获取当前滚动位置
        const scrollPosition = window.scrollY + 100;
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // 更新活动链接
        sidebarLinks.forEach(link => {
            const linkUrl = link.getAttribute('href');
            const parentLi = link.parentElement;
            
            parentLi.classList.remove('active');
            
            if (linkUrl === `#${currentSection}`) {
                parentLi.classList.add('active');
            }
        });
    }

    // 初始化返回顶部按钮
    initBackToTop() {
        // 创建返回顶部按钮
        const backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.setAttribute('aria-label', '返回顶部');
        backToTop.innerHTML = '↑';
        
        // 添加到页面
        document.body.appendChild(backToTop);
        
        // 滚动事件
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, 100));
        
        // 点击事件
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 初始化键盘快捷键
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 忽略在输入框中的按键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Ctrl+K 或 Cmd+K 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // ESC 关闭搜索结果
            if (e.key === 'Escape') {
                const searchResults = document.getElementById('search-results');
                if (searchResults && searchResults.style.display === 'block') {
                    searchResults.style.display = 'none';
                }
            }
            
            // Home 键返回顶部
            if (e.key === 'Home' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            
            // G 然后 H 跳转到首页
            if (e.key === 'g' && !this.gPressed) {
                this.gPressed = true;
                this.gTimer = setTimeout(() => {
                    this.gPressed = false;
                }, 1000);
            } else if (e.key === 'h' && this.gPressed) {
                e.preventDefault();
                clearTimeout(this.gTimer);
                this.gPressed = false;
                window.location.href = '/index.html';
            }
            
            // G 然后 T 跳转到教程索引
            if (e.key === 't' && this.gPressed) {
                e.preventDefault();
                clearTimeout(this.gTimer);
                this.gPressed = false;
                
                // 使用cleanPath函数处理路径（如果可用）
                let tutorialPath = 'docs/tutorial-index.md';
                if (typeof window.cleanPath === 'function') {
                    tutorialPath = window.cleanPath(tutorialPath);
                    console.log(`键盘快捷键G+T：清理后的教程路径: ${tutorialPath}`);
                }
                
                // 使用更安全的导航方式，避免直接跳转导致的问题
                if (tutorialPath.endsWith('.md')) {
                    // 如果是Markdown文件，使用viewer.html加载
                    console.log(`通过viewer.html加载Markdown: ${tutorialPath}`);
                    const fileName = tutorialPath.split('/').pop();
                    const viewerUrl = `docs/viewer.html?file=${fileName}`;
                    window.location.href = viewerUrl;
                } else {
                    window.location.href = tutorialPath;
                }
            }

            // G 然后 N 跳转到新手指南
            if (e.key === 'n' && this.gPressed) {
                e.preventDefault();
                clearTimeout(this.gTimer);
                this.gPressed = false;
                
                let newPath = 'docs/DPapyru-ForNewModder.md';
                if (typeof window.cleanPath === 'function') {
                    newPath = window.cleanPath(newPath);
                    console.log(`键盘快捷键G+N：清理后的路径: ${newPath}`);
                }
                
                if (newPath.endsWith('.md')) {
                    const fileName = newPath.split('/').pop();
                    const viewerUrl = `docs/viewer.html?file=${fileName}`;
                    window.location.href = viewerUrl;
                } else {
                    window.location.href = newPath;
                }
            }
        });
    }

    // 初始化移动端导航
    initMobileNavigation() {
        // 添加触摸滑动支持
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    // 处理滑动手势
    handleSwipe(startX, endX) {
        // 向左滑动打开侧边栏（在移动设备上）
        if (endX - startX > 50 && startX < 50) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && window.innerWidth <= 768) {
                sidebar.classList.add('mobile-open');
            }
        }
        
        // 向右滑动关闭侧边栏（在移动设备上）
        if (startX - endX > 50) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        }
    }

    // 添加页面进度指示器
    addPageProgressIndicator() {
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'page-progress';
        
        // 添加到页面顶部
        document.body.appendChild(progressBar);
        
        // 更新进度
        window.addEventListener('scroll', throttle(() => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height);
            progressBar.style.width = scrolled * 100 + '%';
        }, 50));
    }

    // 添加阅读时间估算
    addReadingTimeEstimate() {
        const content = document.querySelector('.markdown-content, .content-wrapper');
        if (!content) return;
        
        const text = content.textContent;
        const wordsPerMinute = 200; // 平均阅读速度
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        
        // 创建阅读时间元素
        const readingTime = document.createElement('div');
        readingTime.className = 'reading-time';
        readingTime.textContent = `预计阅读时间: ${minutes} 分钟`;
        
        // 添加到内容顶部
        const firstElement = content.firstElementChild;
        if (firstElement) {
            content.insertBefore(readingTime, firstElement);
        } else {
            content.appendChild(readingTime);
        }
    }
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 初始化导航增强功能
document.addEventListener('DOMContentLoaded', function() {
    // 确保在主脚本之后初始化导航
    setTimeout(() => {
        window.navigationEnhancements = new NavigationEnhancements();
    }, 200);
});