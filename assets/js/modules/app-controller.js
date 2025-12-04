/**
 * 应用程序主控制器 - 负责协调和管理所有模块
 */
class AppController {
    constructor(options = {}) {
        this.options = {
            configPath: './docs/config.json',
            enableConfigManager: true,
            enableSearchManager: true,
            enableNavigationManager: true,
            enableFolderManager: true,
            enableSearchHistoryManager: true,
            enablePerformanceManager: true,
            enableResourceManager: true,
            autoInit: true,
            ...options
        };
        
        // 模块实例
        this.configManager = null;
        this.searchManager = null;
        this.navigationManager = null;
        this.folderManager = null;
        this.searchHistoryManager = null;
        this.performanceManager = null;
        this.resourceManager = null;
        
        // 应用状态
        this.isInitialized = false;
        this.currentPage = this.detectCurrentPage();
        this.modules = new Map();
        this.eventBus = null;
    }

    /**
     * 初始化应用程序
     */
    async initialize() {
        try {
            console.log('=== 应用程序初始化开始 ===');
            
            // 初始化事件总线
            this.initializeEventBus();
            
            // 初始化资源管理器（优先初始化以优化资源加载）
            if (this.options.enableResourceManager) {
                await this.initializeResourceManager();
            }
            
            // 初始化性能管理器（优先初始化以监控其他模块）
            if (this.options.enablePerformanceManager) {
                await this.initializePerformanceManager();
            }
            
            // 初始化配置管理器
            if (this.options.enableConfigManager) {
                await this.initializeConfigManager();
            }
            
            // 初始化搜索管理器
            if (this.options.enableSearchManager) {
                await this.initializeSearchManager();
            }
            
            // 初始化导航管理器
            if (this.options.enableNavigationManager) {
                await this.initializeNavigationManager();
            }
            
            // 初始化搜索历史管理器
            if (this.options.enableSearchHistoryManager) {
                await this.initializeSearchHistoryManager();
            }
            
            // 根据当前页面初始化特定模块
            await this.initializePageSpecificModules();
            
            // 设置模块间通信
            this.setupModuleCommunication();
            
            // 设置全局错误处理
            this.setupGlobalErrorHandling();
            
            this.isInitialized = true;
            console.log('=== 应用程序初始化完成 ===');
            
            // 触发初始化完成事件
            this.eventBus.emit('app:initialized', {
                modules: Array.from(this.modules.keys()),
                currentPage: this.currentPage
            });
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 初始化事件总线
     */
    initializeEventBus() {
        // 动态导入EventBus类
        if (typeof EventBus === 'undefined') {
            this.loadScript('assets/js/modules/event-bus.js').then(() => {
                this.eventBus = new EventBus();
                this.eventBus.setDebugMode(true); // 开发模式下启用调试
                console.log('事件总线初始化完成');
            }).catch(error => {
                console.error('事件总线初始化失败:', error);
                // 回退到简单的事件目标
                this.eventBus = new EventTarget();
                console.warn('使用回退事件目标');
            });
        } else {
            this.eventBus = new EventBus();
            this.eventBus.setDebugMode(true); // 开发模式下启用调试
            console.log('事件总线初始化完成');
        }
    }

    /**
     * 初始化资源管理器
     */
    async initializeResourceManager() {
        try {
            // 动态导入ResourceManager类
            if (typeof ResourceManager === 'undefined') {
                await this.loadScript('assets/js/modules/resource-manager.js');
            }
            
            this.resourceManager = new ResourceManager({
                enableCaching: true,
                enablePreloading: true,
                enableCompression: true,
                cacheExpiration: 3600000, // 1小时
                maxCacheSize: 50,
                preloadCriticalResources: true,
                lazyLoadImages: true
            });
            
            await this.resourceManager.initialize();
            
            this.modules.set('resourceManager', this.resourceManager);
            console.log('资源管理器初始化完成');
        } catch (error) {
            console.error('资源管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化性能管理器
     */
    async initializePerformanceManager() {
        try {
            // 动态导入PerformanceManager类
            if (typeof PerformanceManager === 'undefined') {
                await this.loadScript('assets/js/modules/performance-manager.js');
            }
            
            this.performanceManager = new PerformanceManager();
            await this.performanceManager.initialize();
            
            this.modules.set('performanceManager', this.performanceManager);
            console.log('性能管理器初始化完成');
        } catch (error) {
            console.error('性能管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化配置管理器
     */
    async initializeConfigManager() {
        try {
            // 动态导入ConfigManager类
            if (typeof ConfigManager === 'undefined') {
                await this.loadScript('assets/js/modules/config-manager.js');
            }
            
            this.configManager = new ConfigManager(this.options.configPath);
            await this.configManager.loadConfig();
            
            this.modules.set('configManager', this.configManager);
            console.log('配置管理器初始化完成');
        } catch (error) {
            console.error('配置管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化搜索管理器
     */
    async initializeSearchManager() {
        try {
            // 动态导入SearchManager类
            if (typeof SearchManager === 'undefined') {
                await this.loadScript('assets/js/modules/search-manager.js');
            }
            
            this.searchManager = new SearchManager();
            await this.searchManager.initialize(this.configManager);
            
            this.modules.set('searchManager', this.searchManager);
            console.log('搜索管理器初始化完成');
        } catch (error) {
            console.error('搜索管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化导航管理器
     */
    async initializeNavigationManager() {
        try {
            // 动态导入NavigationManager类
            if (typeof NavigationManager === 'undefined') {
                await this.loadScript('assets/js/modules/navigation-manager.js');
            }
            
            this.navigationManager = new NavigationManager();
            this.navigationManager.initialize();
            
            this.modules.set('navigationManager', this.navigationManager);
            console.log('导航管理器初始化完成');
        } catch (error) {
            console.error('导航管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化搜索历史管理器
     */
    async initializeSearchHistoryManager() {
        if (!this.options.enableSearchHistoryManager) return;
        
        try {
            // 动态导入SearchHistoryManager类
            if (typeof SearchHistoryManager === 'undefined') {
                await this.loadScript('assets/js/modules/search-history-manager.js');
            }
            
            this.searchHistoryManager = new SearchHistoryManager();
            await this.searchHistoryManager.initialize(this.searchManager);
            
            this.modules.set('searchHistoryManager', this.searchHistoryManager);
            console.log('搜索历史管理器初始化完成');
        } catch (error) {
            console.error('搜索历史管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化页面特定模块
     */
    async initializePageSpecificModules() {
        switch (this.currentPage) {
            case 'folder':
                await this.initializeFolderManager();
                break;
            case 'search':
                // 搜索页面可能需要额外的初始化
                break;
            case 'viewer':
                await this.initializeViewerModules();
                break;
        }
    }

    /**
     * 初始化文件夹管理器
     */
    async initializeFolderManager() {
        if (!this.options.enableFolderManager) return;
        
        try {
            // 动态导入FolderManager类
            if (typeof FolderManager === 'undefined') {
                await this.loadScript('assets/js/modules/folder-manager.js');
            }
            
            this.folderManager = new FolderManager();
            await this.folderManager.initialize(this.configManager);
            
            this.modules.set('folderManager', this.folderManager);
            console.log('文件夹管理器初始化完成');
        } catch (error) {
            console.error('文件夹管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化查看器模块
     */
    async initializeViewerModules() {
        // 这里可以添加查看器页面特定的模块初始化
        console.log('查看器模块初始化完成');
    }

    /**
     * 设置模块间通信
     */
    setupModuleCommunication() {
        // 使用事件总线进行模块间通信
        this.setupSearchEvents();
        this.setupNavigationEvents();
        this.setupPerformanceEvents();
        this.setupResourceEvents();
        this.setupModuleLifecycleEvents();
    }

    /**
     * 设置搜索相关事件
     */
    setupSearchEvents() {
        // 搜索开始事件
        this.eventBus.on('search:start', (event) => {
            console.log('搜索开始:', event.data);
        });

        // 搜索完成事件
        this.eventBus.on('search:completed', (event) => {
            const { query, results } = event.data;
            
            // 添加到搜索历史
            if (this.searchHistoryManager) {
                this.searchHistoryManager.addToSearchHistory(query);
            }
            
            console.log('搜索完成:', { query, resultsCount: results.length });
        });

        // 搜索输入事件（用于实时搜索建议）
        this.eventBus.on('search:input', (event) => {
            const { query } = event.data;
            
            // 获取搜索建议
            if (this.searchManager) {
                const suggestions = this.searchManager.getSuggestions(query, 5);
                this.eventBus.emit('search:suggestions', { suggestions });
            }
        });
    }

    /**
     * 设置导航相关事件
     */
    setupNavigationEvents() {
        // 页面导航事件
        this.eventBus.on('navigation:navigate', (event) => {
            const { path, title } = event.data;
            
            if (this.navigationManager) {
                this.navigationManager.addToHistory(path);
            }
            
            console.log('页面导航:', { path, title });
        });

        // 面包屑更新事件
        this.eventBus.on('navigation:breadcrumb', (event) => {
            const { breadcrumb } = event.data;
            console.log('面包屑更新:', breadcrumb);
        });
    }

    /**
     * 设置性能监控事件
     */
    setupPerformanceEvents() {
        // 性能指标收集事件
        this.eventBus.on('performance:metric', (event) => {
            const { name, value } = event.data;
            
            if (this.performanceManager) {
                // 性能管理器会自动处理这些指标
            }
            
            console.log('性能指标:', { name, value });
        });

        // 模块加载时间事件
        this.eventBus.on('performance:moduleLoaded', (event) => {
            const { moduleName, loadTime } = event.data;
            console.log('模块加载完成:', { moduleName, loadTime });
        });
    }

    /**
     * 设置资源相关事件
     */
    setupResourceEvents() {
        // 资源加载事件
        this.eventBus.on('resource:load', (event) => {
            const { url, type, size, duration } = event.data;
            console.log('资源加载:', { url, type, size, duration });
        });

        // 资源加载失败事件
        this.eventBus.on('resource:error', (event) => {
            const { url, error } = event.data;
            console.error('资源加载失败:', { url, error });
        });

        // 资源缓存事件
        this.eventBus.on('resource:cache', (event) => {
            const { url, hit } = event.data;
            console.log('资源缓存:', { url, hit });
        });
    }

    /**
     * 设置模块生命周期事件
     */
    setupModuleLifecycleEvents() {
        // 模块初始化事件
        this.eventBus.on('module:initialized', (event) => {
            const { moduleName, version } = event.data;
            console.log('模块初始化:', { moduleName, version });
        });

        // 模块错误事件
        this.eventBus.on('module:error', (event) => {
            const { moduleName, error } = event.data;
            console.error('模块错误:', { moduleName, error });
        });

        // 应用状态变化事件
        this.eventBus.on('app:stateChanged', (event) => {
            const { state, previousState } = event.data;
            console.log('应用状态变化:', { state, previousState });
        });
    }

    /**
     * 检测当前页面
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename.includes('folder')) {
            return 'folder';
        } else if (filename.includes('search')) {
            return 'search';
        } else if (filename.includes('viewer')) {
            return 'viewer';
        } else if (filename.includes('index') || path.endsWith('/')) {
            return 'index';
        }
        
        return 'unknown';
    }

    /**
     * 动态加载脚本
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason);
            this.logError('unhandledRejection', event.reason);
            
            // 通过事件总线通知所有模块
            this.eventBus.emit('app:error', {
                type: 'unhandledRejection',
                error: event.reason
            });
        });
        
        // 捕获全局错误
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
            this.logError('globalError', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // 通过事件总线通知所有模块
            this.eventBus.emit('app:error', {
                type: 'globalError',
                error: event.error
            });
        });
    }

    /**
     * 记录错误
     */
    logError(type, error) {
        try {
            const errorLog = {
                type,
                timestamp: new Date().toISOString(),
                page: this.currentPage,
                userAgent: navigator.userAgent,
                url: window.location.href,
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : error
            };
            
            // 保存到localStorage
            const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            errorLogs.push(errorLog);
            
            // 只保留最近的50条错误
            if (errorLogs.length > 50) {
                errorLogs.splice(0, errorLogs.length - 50);
            }
            
            localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
        } catch (e) {
            console.error('记录错误失败:', e);
        }
    }

    /**
     * 处理初始化错误
     */
    handleInitializationError(error) {
        // 显示友好的错误消息
        const errorContainer = document.createElement('div');
        errorContainer.className = 'app-initialization-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>应用程序初始化失败</h3>
                <p>抱歉，应用程序初始化过程中发生错误。请刷新页面重试。</p>
                <details>
                    <summary>技术详情</summary>
                    <pre>${error.stack || error.message || JSON.stringify(error, null, 2)}</pre>
                </details>
                <button onclick="window.location.reload()">刷新页面</button>
            </div>
        `;
        
        // 添加基本样式
        const style = document.createElement('style');
        style.textContent = `
            .app-initialization-error {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .error-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 500px;
                text-align: center;
            }
            
            .error-content h3 {
                color: #d32f2f;
                margin-top: 0;
            }
            
            .error-content details {
                text-align: left;
                margin: 15px 0;
            }
            
            .error-content pre {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                overflow: auto;
                max-height: 200px;
                font-size: 12px;
            }
            
            .error-content button {
                background-color: #1976d2;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .error-content button:hover {
                background-color: #1565c0;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(errorContainer);
    }

    /**
     * 分发事件（通过事件总线）
     */
    dispatchEvent(eventName, detail = {}) {
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
            this.eventBus.emit(eventName, detail);
        } else {
            // 回退到标准DOM事件
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }
    }

    /**
     * 获取模块实例
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * 获取所有模块
     */
    getAllModules() {
        return Object.fromEntries(this.modules);
    }

    /**
     * 获取应用状态
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            currentPage: this.currentPage,
            modules: Array.from(this.modules.keys()),
            config: this.configManager ? this.configManager.getStats() : null,
            search: this.searchManager ? this.searchManager.getStats() : null,
            navigation: this.navigationManager ? this.navigationManager.getStats() : null,
            performance: this.performanceManager ? this.performanceManager.getMetrics() : null,
            resources: this.resourceManager ? this.resourceManager.getStats() : null
        };
    }

    /**
     * 重启应用程序
     */
    async restart() {
        console.log('重启应用程序...');
        
        // 清理现有模块
        this.modules.forEach((module, name) => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        this.modules.clear();
        
        // 重新初始化
        await this.initialize();
    }

    /**
     * 销毁应用程序
     */
    destroy() {
        console.log('销毁应用程序...');
        
        // 清理模块
        this.modules.forEach((module, name) => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules.clear();
        
        // 销毁事件总线
        if (this.eventBus && typeof this.eventBus.destroy === 'function') {
            this.eventBus.destroy();
        }
        
        // 重置状态
        this.isInitialized = false;
        
        // 分发销毁事件
        this.dispatchEvent('app:destroyed');
    }
}

// 创建全局应用实例
window.app = new AppController({
    configPath: './docs/config.json',
    enableConfigManager: true,
    enableSearchManager: true,
    enableNavigationManager: true,
    enableFolderManager: true,
    enableSearchHistoryManager: true,
    enablePerformanceManager: true,
    enableResourceManager: true,
    autoInit: false // 手动初始化，以便在DOM加载后执行
});

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.app.initialize();
    } catch (error) {
        console.error('应用程序初始化失败:', error);
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppController;
} else if (typeof window !== 'undefined') {
    window.AppController = AppController;
}