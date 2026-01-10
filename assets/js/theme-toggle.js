/**
 * 主题切换功能
 * 提供浅色/深色主题切换功能，并保存用户偏好
 */
class ThemeToggle {
    constructor() {
        this.storageKey = 'theme';
        this.darkThemeClass = 'dark-theme';
        this.init();
    }

    /**
     * 初始化主题切换功能
     */
    init() {
        // 检查本地存储的主题偏好
        const savedTheme = this.getSavedTheme();
        
        // 检查系统主题偏好
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 确定初始主题
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        // 应用主题
        this.setTheme(initialTheme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 只有在用户没有手动设置主题时才跟随系统主题
            if (!this.getSavedTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        // 创建或复用主题切换按钮
        this.createThemeToggleButton();
        this.bindToggleButton();
    }

    /**
     * 获取保存的主题偏好
     * @returns {string|null} 保存的主题或null
     */
    getSavedTheme() {
        return localStorage.getItem(this.storageKey);
    }

    /**
     * 保存主题偏好
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    saveTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
    }

    /**
     * 应用主题
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    setTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            document.body.classList.add(this.darkThemeClass);
        } else {
            root.removeAttribute('data-theme');
            document.body.classList.remove(this.darkThemeClass);
        }
        
        // 更新主题切换按钮状态
        this.updateToggleButtonState(theme);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme } 
        }));
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.setTheme(newTheme);
        this.saveTheme(newTheme);
    }

    /**
     * 创建主题切换按钮
     */
    createThemeToggleButton() {
        // 查找或创建主题切换按钮容器
        let themeToggleContainer = document.getElementById('theme-toggle-container');
        
        if (!themeToggleContainer) {
            // 在头部导航中创建主题切换按钮
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.id = 'theme-toggle-container';
                
                const button = document.createElement('button');
                button.className = 'theme-toggle-btn nav-link';
                button.type = 'button';
                button.setAttribute('aria-label', '切换主题');
                button.innerHTML = `
                    <span class="theme-icon">🌙</span>
                    <span class="theme-text">深色</span>
                `;
                
                li.appendChild(button);
                mainNav.querySelector('.nav-list').appendChild(li);
                
                themeToggleContainer = li;
            }
        } else {
            // 页面已有按钮/容器时也要确保能点击切换
            const existingButton = themeToggleContainer.querySelector('.theme-toggle-btn');
            if (existingButton) {
                this.updateToggleButtonState(
                    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
                );
            }
        }
    }

    /**
     * 绑定（或复用）主题切换按钮点击事件
     */
    bindToggleButton() {
        const button = document.querySelector('.theme-toggle-btn');
        if (!button) return;

        if (button.dataset.themeToggleBound === '1') return;
        button.addEventListener('click', () => this.toggleTheme());
        button.dataset.themeToggleBound = '1';
    }

    /**
     * 更新主题切换按钮状态
     * @param {string} theme - 当前主题
     */
    updateToggleButtonState(theme) {
        const button = document.querySelector('.theme-toggle-btn');
        if (!button) return;
        
        const icon = button.querySelector('.theme-icon');
        const text = button.querySelector('.theme-text');

        button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        
        if (theme === 'dark') {
            icon.textContent = '☀️';
            text.textContent = '浅色';
            button.setAttribute('title', '切换到浅色主题');
        } else {
            icon.textContent = '🌙';
            text.textContent = '深色';
            button.setAttribute('title', '切换到深色主题');
        }
    }

    /**
     * 重置主题偏好（跟随系统）
     */
    resetTheme() {
        localStorage.removeItem(this.storageKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(systemPrefersDark ? 'dark' : 'light');
    }
}

// 页面加载完成后初始化主题切换功能
document.addEventListener('DOMContentLoaded', () => {
    window.themeToggle = new ThemeToggle();
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
}
