// generate-index.js - 自动生成教程索引和配置的脚本
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveCategory, mapToExistingCategory } = require('./lib/category-utils');
const yaml = require('js-yaml');
const zlib = require('zlib');

const SITE_BASE_URL = 'https://dpapyru.github.io';
const SEARCH_INDEX_PATH = './assets/search-index.json';
const GUIDED_INDEX_PATH = './assets/semantic/guided-index.v1.json';
const BM25_INDEX_PATH = './assets/semantic/bm25-index.v1.json';
const SECTION_SEMANTIC_MANUAL_PATH = './docs/search/section-semantic.manual.v1.yml';
const SECTION_SEMANTIC_AI_PATH = './docs/search/section-semantic.ai.v1.json.gz';
const SECTION_SEMANTIC_LEGACY_PATH = './docs/search/section-semantic.v1.yml';

// 项目配置
const projectConfig = {
    name: '主项目',
    docsDir: './docs',
    configFile: './docs/config.json'
};

// 动态配置管理器
class ConfigManager {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = null;
        this.defaultConfig = this.getDefaultConfig();
        this.specialCategories = ['怎么贡献', 'Modder入门'];
        this.categoryMappings = {
            '入门': 'getting-started',
            '基础概念': 'basic-concepts',
            'Mod开发': 'mod-development',
            '高级主题': 'advanced-topics',
            '资源参考': 'resources',
            '进阶': 'intermediate',
            '个人分享': 'personal-sharing'
        };
        this.reverseCategoryMappings = {};

        // 创建反向映射
        Object.keys(this.categoryMappings).forEach(key => {
            this.reverseCategoryMappings[this.categoryMappings[key]] = key;
        });
    }

    // 获取默认配置
    getDefaultConfig() {
        return {
            categories: {
                '入门': {
                    title: '入门',
                    description: '适合初学者的基础教程',
                    topics: {}
                },
                '进阶': {
                    title: '进阶',
                    description: '有一定基础后的进阶教程',
                    topics: {}
                },
                '高级': {
                    title: '高级',
                    description: '面向有经验开发者的高级教程',
                    topics: {}
                },
                '个人分享': {
                    title: '个人分享',
                    description: '社区成员的个人经验和技巧分享',
                    topics: {}
                },
                '怎么贡献': {
                    title: '怎么贡献',
                    description: '介绍贡献者应该怎么贡献文章',
                    topics: {}
                },
                'Modder入门': {
                    title: 'Modder入门',
                    description: 'Modder入门相关的教程',
                    topics: {}
                }
            },
            topics: {
                'mod-basics': {
                    title: 'Mod基础',
                    description: 'Mod开发的基础概念和核心API',
                    icon: '',
                    display_names: {
                        zh: 'Mod基础',
                        en: 'Mod Basics'
                    },
                    aliases: ['Mod基础']
                },
                'env': {
                    title: '环境配置',
                    description: '开发环境搭建和配置',
                    icon: '',
                    display_names: {
                        zh: '环境配置',
                        en: 'Environment Setup'
                    },
                    aliases: ['环境配置']
                },
                'items': {
                    title: '物品系统',
                    description: '物品、武器和装备的开发',
                    icon: '',
                    display_names: {
                        zh: '物品系统',
                        en: 'Item System'
                    },
                    aliases: ['物品系统']
                },
                'npcs': {
                    title: 'NPC系统',
                    description: 'NPC的创建和行为定制',
                    icon: '',
                    display_names: {
                        zh: 'NPC系统',
                        en: 'NPC System'
                    },
                    aliases: ['NPC系统']
                },
                'world-gen': {
                    title: '世界生成',
                    description: '世界生成和地形修改',
                    icon: '',
                    display_names: {
                        zh: '世界生成',
                        en: 'World Generation'
                    },
                    aliases: ['世界生成']
                },
                'ui': {
                    title: 'UI界面',
                    description: '用户界面和交互设计',
                    icon: '',
                    display_names: {
                        zh: 'UI界面',
                        en: 'UI Interface'
                    },
                    aliases: ['UI界面']
                },
                'networking': {
                    title: '网络功能',
                    description: '多人游戏和网络通信',
                    icon: '',
                    display_names: {
                        zh: '网络功能',
                        en: 'Networking'
                    },
                    aliases: ['网络功能']
                },
                'advanced': {
                    title: '高级功能',
                    description: '高级开发技巧和优化',
                    icon: '',
                    display_names: {
                        zh: '高级功能',
                        en: 'Advanced Features'
                    },
                    aliases: ['高级功能']
                },
                'article-contribution': {
                    title: '文章贡献',
                    description: '如何为教程网站贡献文章',
                    icon: '',
                    display_names: {
                        zh: '文章贡献',
                        en: 'Article Contribution'
                    },
                    aliases: ['文章贡献']
                }
            },
            authors: {},
            all_files: [],
            // 新增配置选项
            settings: {
                defaultCategory: '资源参考',
                defaultTopic: 'mod-basics',
                pathMappings: {},
                customFields: ['last_updated', 'time', 'prev_chapter', 'next_chapter', 'colors', 'colorChange', 'min_c', 'min_t'],
                validationRules: {
                    requiredFields: ['title'],
                    optionalFields: ['author', 'description', 'date', 'difficulty', 'order', 'topic', 'last_updated', 'time', 'prev_chapter', 'next_chapter', 'colors', 'colorChange', 'min_c', 'min_t']
                }
            }
        };
    }

    // 加载配置
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configContent = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(configContent);
                this.validateConfig();
                this.mergeWithDefaults();
                console.log('配置文件加载成功');
            } else {
                console.log('配置文件不存在，使用默认配置');
                this.config = JSON.parse(JSON.stringify(this.defaultConfig));
            }
        } catch (error) {
            console.error('加载配置文件时出错:', error.message);
            console.log('使用默认配置');
            this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        }
        return this.config;
    }

    // 验证配置
    validateConfig() {
        if (!this.config) {
            throw new Error('配置为空');
        }

        // 验证基本结构
        if (!this.config.categories || typeof this.config.categories !== 'object') {
            throw new Error('配置中缺少有效的categories对象');
        }

        if (!this.config.topics || typeof this.config.topics !== 'object') {
            throw new Error('配置中缺少有效的topics对象');
        }

        // 验证特殊分类是否存在
        this.specialCategories.forEach(category => {
            if (!this.config.categories[category]) {
                console.warn(`警告: 特殊分类 "${category}" 不存在于配置中，将自动创建`);
            }
        });

        console.log('配置验证通过');
    }

    // 与默认配置合并
    mergeWithDefaults() {
        // 合并设置
        if (!this.config.settings) {
            this.config.settings = JSON.parse(JSON.stringify(this.defaultConfig.settings));
        } else {
            // 合并默认设置
            Object.keys(this.defaultConfig.settings).forEach(key => {
                if (this.config.settings[key] === undefined) {
                    this.config.settings[key] = JSON.parse(JSON.stringify(this.defaultConfig.settings[key]));
                }

                // 特殊处理customFields和validationRules，确保它们包含所有必要的字段
                if (key === 'customFields' && this.config.settings[key].length === 0) {
                    this.config.settings[key] = JSON.parse(JSON.stringify(this.defaultConfig.settings[key]));
                }

                if (key === 'validationRules' && this.config.settings[key]) {
                    // 确保optionalFields包含所有自定义字段
                    const defaultOptionalFields = this.defaultConfig.settings.validationRules.optionalFields;
                    const currentOptionalFields = this.config.settings[key].optionalFields || [];

                    // 添加缺失的自定义字段
                    defaultOptionalFields.forEach(field => {
                        if (!currentOptionalFields.includes(field)) {
                            currentOptionalFields.push(field);
                        }
                    });

                    this.config.settings[key].optionalFields = currentOptionalFields;
                }
            });
        }

        // 清理已废弃字段（向后兼容旧配置）
        if (Array.isArray(this.config.settings.customFields)) {
            this.config.settings.customFields = this.config.settings.customFields.filter(f => f !== 'tags');
            this.config.settings.customFields = this.config.settings.customFields.filter(f => f !== 'colorLD');
        }
        if (this.config.settings.validationRules &&
            Array.isArray(this.config.settings.validationRules.optionalFields)) {
            this.config.settings.validationRules.optionalFields =
                this.config.settings.validationRules.optionalFields.filter(f => f !== 'tags');
            this.config.settings.validationRules.optionalFields =
                this.config.settings.validationRules.optionalFields.filter(f => f !== 'colorLD');
        }

        // 合并默认分类
        Object.keys(this.defaultConfig.categories).forEach(category => {
            if (!this.config.categories[category]) {
                this.config.categories[category] = JSON.parse(JSON.stringify(this.defaultConfig.categories[category]));
            }
        });

        // 合并默认主题
        Object.keys(this.defaultConfig.topics).forEach(topic => {
            if (!this.config.topics[topic]) {
                this.config.topics[topic] = JSON.parse(JSON.stringify(this.defaultConfig.topics[topic]));
            }
        });

        // 清理主题图标，避免生成 emoji
        Object.keys(this.config.topics).forEach(topic => {
            if (this.config.topics[topic] && this.config.topics[topic].icon) {
                this.config.topics[topic].icon = '';
            }
        });
    }

    // 保存配置
    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log('配置文件保存成功');
        } catch (error) {
            console.error('保存配置文件时出错:', error.message);
            throw error;
        }
    }

    // 获取所有分类
    getCategories() {
        return this.config ? this.config.categories : {};
    }

    // 获取所有主题
    getTopics() {
        return this.config ? this.config.topics : {};
    }

    // 获取设置
    getSettings() {
        return this.config && this.config.settings ? this.config.settings : this.defaultConfig.settings;
    }

    // 映射分类名称
    mapCategoryName(categoryName) {
        return mapToExistingCategory(
            categoryName,
            this.config.categories,
            this.categoryMappings,
            this.reverseCategoryMappings
        );
    }

    // 通过别名查找主题
    findTopicByAlias(alias) {
        if (!this.config.topics) return null;

        for (const topicKey in this.config.topics) {
            const topic = this.config.topics[topicKey];
            if (topic.aliases && topic.aliases.includes(alias)) {
                return topicKey;
            }
        }

        return null;
    }

    // 检查是否为特殊分类
    isSpecialCategory(categoryName) {
        return this.specialCategories.includes(categoryName);
    }

    // 添加新分类
    addCategory(categoryKey, categoryData) {
        if (!this.config.categories) {
            this.config.categories = {};
        }
        this.config.categories[categoryKey] = categoryData;
    }

    // 添加新主题
    addTopic(topicKey, topicData) {
        if (!this.config.topics) {
            this.config.topics = {};
        }
        this.config.topics[topicKey] = topicData;
    }

    // 处理路径映射
    mapPath(originalPath) {
        const pathMappings = this.getSettings().pathMappings;
        if (pathMappings && pathMappings[originalPath]) {
            return pathMappings[originalPath];
        }
        return originalPath;
    }
}

// 递归扫描目录获取所有Markdown文件和翻译器配置
function scanDirectoryRecursively(dir, baseDir, fileList = [], translatorConfigs = {}) {
    const items = fs.readdirSync(dir);
    const ignoredDirs = new Set(['plans']);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (ignoredDirs.has(item)) {
                return;
            }
            // 递归扫描子目录
            scanDirectoryRecursively(fullPath, baseDir, fileList, translatorConfigs);
        } else if (item === 'Translator.yaml') {
            // 找到Translator.yaml文件，读取并存储翻译配置
            try {
                const translatorContent = fs.readFileSync(fullPath, 'utf8');
                const translatorData = parseYaml(translatorContent);
                const relativeDirPath = path.relative(baseDir, dir).replace(/\\/g, '/');
                translatorConfigs[relativeDirPath] = translatorData;
                console.log(`发现翻译配置文件: ${relativeDirPath}/Translator.yaml`);
            } catch (error) {
                console.error(`读取翻译配置文件 ${fullPath} 时出错:`, error.message);
            }
        } else if (item.endsWith('.md') && item !== 'tutorial-index.md') {
            // 计算相对于docs目录的路径，确保使用正斜杠
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            fileList.push(relativePath);
        }
    });

    return { files: fileList, translatorConfigs };
}

function inferTitleFromFilename(filePath) {
    const base = path.basename(filePath, '.md');
    return base || '未命名文档';
}

// 处理主项目
function processMainProject() {
    console.log(`\n正在处理 ${projectConfig.name} 项目...`);

    const { docsDir, configFile } = projectConfig;

    // 检查目录是否存在
    if (!fs.existsSync(docsDir)) {
        console.log(`警告: ${projectConfig.name} 的文档目录不存在: ${docsDir}`);
        return null;
    }

    // 初始化配置管理器
    const configManager = new ConfigManager(configFile);
    const configData = configManager.loadConfig();

    // 扫描所有Markdown文件和翻译器配置
    const scanResult = scanDirectoryRecursively(docsDir, docsDir);
    const files = scanResult.files;
    const translatorConfigs = scanResult.translatorConfigs;
    console.log(`找到 ${files.length} 个Markdown文件`);
    console.log(`找到 ${Object.keys(translatorConfigs).length} 个翻译配置文件`);

    // 按类别分组
    const categories = {};

    // 解析每个文件的元数据
    files.forEach(file => {
        const fullPath = path.join(docsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        let metadata = parseMetadata(content);
        if (!metadata.title) metadata.title = inferTitleFromFilename(file);
        if (!metadata.title) metadata.title = inferTitleFromFilename(file);

        // 跳过标记为 hide: true 的文件
        if (metadata.hide === 'true' || metadata.hide === true) {
            return;
        }

        // 验证元数据
        const validation = validateMetadata(metadata, configManager);
        if (validation.errors.length > 0) {
            console.error(`文件 ${file} 元数据验证失败:`, validation.errors.join(', '));
            return; // 跳过有错误的文件
        }

        // 显示警告
        if (validation.warnings.length > 0) {
            console.warn(`文件 ${file} 元数据警告:`, validation.warnings.join(', '));
        }

        // 处理自定义字段
        metadata = processCustomFields(metadata, configManager);

        // 使用配置管理器处理分类
        const targetCategory = resolveCategory({
            filePath: file,
            categories: configManager.getCategories(),
            categoryMappings: configManager.categoryMappings,
            reverseCategoryMappings: configManager.reverseCategoryMappings,
            defaultCategory: configManager.getSettings().defaultCategory
        });

        // 特殊分类处理
        if (configManager.isSpecialCategory(targetCategory)) {
            console.log(`处理特殊分类: ${targetCategory}`);
        }

        // 如果分类不存在，创建新分类
        if (!categories[targetCategory]) {
            categories[targetCategory] = [];
        }

        // 应用路径映射
        const mappedPath = configManager.mapPath(file);

        categories[targetCategory].push({
            file,
            path: mappedPath, // 使用映射后的路径
            originalPath: file, // 保留原始路径
            ...metadata
        });
    });

    // 更新config.json数据
    updateConfigData(docsDir, files, configManager, translatorConfigs);

    // 保存配置文件
    configManager.saveConfig();
    console.log(`${projectConfig.name} 配置文件已更新！`);

    return configManager.config;
}

function formatLastMod(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function safeGitLastMod(repoRelativePath) {
    try {
        const output = execSync(`git log -1 --format=%cs -- "${repoRelativePath}"`, {
            stdio: ['ignore', 'pipe', 'ignore']
        }).toString().trim();
        return output || null;
    } catch {
        return null;
    }
}

function getLastModForPath(repoRelativePath) {
    const gitDate = safeGitLastMod(repoRelativePath);
    if (gitDate) return gitDate;

    try {
        const stat = fs.statSync(repoRelativePath);
        return formatLastMod(stat.mtime);
    } catch {
        return null;
    }
}

function generateSitemap(config) {
    if (!config || !Array.isArray(config.all_files)) {
        console.warn('跳过 sitemap.xml 生成：配置文件缺少 all_files');
        return;
    }

    // 为了让 CI 与本地构建输出一致：避免使用 localeCompare 的“默认 locale”路径，
    // 这里统一用简单的 Unicode 码点顺序排序，保证跨平台/跨语言环境可复现。
    function stableStringCompare(left, right) {
        const a = String(left || '');
        const b = String(right || '');
        if (a === b) return 0;
        return a < b ? -1 : 1;
    }

    const staticPages = [
        { path: '/', file: 'index.html', priority: '1.0', changefreq: 'weekly' },
        { path: '/docs/', file: 'docs/index.html', priority: '0.9', changefreq: 'weekly' },
        { path: '/qa.html', file: 'qa.html', priority: '0.7', changefreq: 'daily' }
    ];

    const urls = [];

    for (const page of staticPages) {
        const lastmod = getLastModForPath(page.file);
        urls.push({
            loc: `${SITE_BASE_URL}${page.path}`,
            lastmod,
            changefreq: page.changefreq,
            priority: page.priority
        });
    }

    const folders = new Set();
    for (const doc of config.all_files) {
        if (!doc || !doc.path) continue;
        const topLevel = String(doc.path).split('/')[0];
        if (topLevel) folders.add(topLevel);
    }

    for (const folder of [...folders].sort(stableStringCompare)) {
        urls.push({
            loc: `${SITE_BASE_URL}/docs/folder.html?path=${encodeURIComponent(folder)}`,
            lastmod: getLastModForPath('docs/config.json'),
            changefreq: 'weekly',
            priority: '0.6'
        });
    }

    for (const doc of config.all_files) {
        if (!doc || !doc.path) continue;
        const filePath = String(doc.path);
        const repoPath = path.join('docs', filePath).replace(/\\/g, '/');
        const lastmod = getLastModForPath(repoPath);

        urls.push({
            loc: `${SITE_BASE_URL}/docs/viewer.html?file=${encodeURIComponent(filePath)}`,
            lastmod,
            changefreq: 'monthly',
            priority: '0.8'
        });
    }

    const uniqueByLoc = new Map();
    for (const entry of urls) {
        if (!entry || !entry.loc) continue;
        uniqueByLoc.set(entry.loc, entry);
    }

    const finalUrls = [...uniqueByLoc.values()].sort((a, b) => stableStringCompare(a.loc, b.loc));

    const xmlLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    for (const u of finalUrls) {
        xmlLines.push('  <url>');
        xmlLines.push(`    <loc>${u.loc}</loc>`);
        if (u.lastmod) xmlLines.push(`    <lastmod>${u.lastmod}</lastmod>`);
        if (u.changefreq) xmlLines.push(`    <changefreq>${u.changefreq}</changefreq>`);
        if (u.priority) xmlLines.push(`    <priority>${u.priority}</priority>`);
        xmlLines.push('  </url>');
    }

    xmlLines.push('</urlset>');

    fs.writeFileSync('./sitemap.xml', xmlLines.join('\n') + '\n', 'utf8');
    console.log(`sitemap.xml 已生成，包含 ${finalUrls.length} 条URL`);
}

function stripFrontMatter(markdownText) {
    const text = String(markdownText || '');
    if (text.startsWith('---')) {
        const endIndex = text.indexOf('\n---', 3);
        if (endIndex !== -1) {
            return text.slice(endIndex + 4);
        }
    }
    return text;
}

function normalizeHeadingText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

function slugifyHeading(heading) {
    const raw = normalizeHeadingText(heading);
    const lower = raw.toLowerCase();
    let s = lower.normalize('NFKC');
    s = s.replace(/[\t\r\n]+/g, ' ');
    s = s.replace(/\s+/g, '-');
    // keep: CJK + latin/number/_ + dash
    s = s.replace(/[^\u4e00-\u9fff\w\-]+/g, '');
    s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s || 'section';
}

function loadSectionSemanticMap() {
    try {
        const aiById = new Map();
        const manualById = new Map();

        // AI table (binary gzip JSON)
        if (fs.existsSync(SECTION_SEMANTIC_AI_PATH)) {
            const buf = fs.readFileSync(SECTION_SEMANTIC_AI_PATH);
            const jsonText = zlib.gunzipSync(buf).toString('utf8');
            const doc = JSON.parse(jsonText) || {};
            const sections = Array.isArray(doc.sections) ? doc.sections : [];
            for (const s of sections) {
                if (!s || !s.id) continue;
                aiById.set(String(s.id), s);
            }
        } else if (fs.existsSync(SECTION_SEMANTIC_LEGACY_PATH)) {
            // legacy fallback (YAML)
            const raw = fs.readFileSync(SECTION_SEMANTIC_LEGACY_PATH, 'utf8');
            const doc = yaml.load(raw) || {};
            const sections = Array.isArray(doc.sections) ? doc.sections : [];
            for (const s of sections) {
                if (!s || !s.id) continue;
                aiById.set(String(s.id), s);
            }
        }

        // Manual table (YAML)
        if (fs.existsSync(SECTION_SEMANTIC_MANUAL_PATH)) {
            const raw = fs.readFileSync(SECTION_SEMANTIC_MANUAL_PATH, 'utf8');
            const doc = yaml.load(raw) || {};
            const sections = Array.isArray(doc.sections) ? doc.sections : [];
            for (const s of sections) {
                if (!s || !s.id) continue;
                manualById.set(String(s.id), s);
            }
        }

        const out = new Map();
        const allIds = new Set([...aiById.keys(), ...manualById.keys()]);
        for (const id of allIds) {
            const ai = aiById.get(id) || null;
            const manual = manualById.get(id) || null;

            const merged = Object.assign({}, ai || {}, manual || {});

            // list-like fields: union (manual first), keep deterministic order
            const phrases = [];
            const questions = [];
            const beginnerQuestions = [];
            const avoid = [];
            const aliases = [];

            const pushUnique = (arr, value) => {
                const s = String(value || '').trim();
                if (!s) return;
                if (arr.some(x => x.toLowerCase() === s.toLowerCase())) return;
                arr.push(s);
            };

            for (const src of [manual, ai]) {
                if (!src) continue;
                if (Array.isArray(src.phrases)) for (const p of src.phrases) pushUnique(phrases, p);
                if (Array.isArray(src.questions)) for (const q of src.questions) pushUnique(questions, q);
                if (Array.isArray(src.beginnerQuestions)) for (const q of src.beginnerQuestions) pushUnique(beginnerQuestions, q);
                if (Array.isArray(src.beginner_questions)) for (const q of src.beginner_questions) pushUnique(beginnerQuestions, q);
                if (Array.isArray(src.avoid)) for (const v of src.avoid) pushUnique(avoid, v);
                if (Array.isArray(src.aliases)) {
                    for (const a of src.aliases) {
                        if (!a) continue;
                        const from = String(a.from || '').trim();
                        const to = String(a.to || '').trim();
                        if (!from || !to) continue;
                        if (aliases.some(x => String(x.from || '').trim() === from)) continue;
                        aliases.push({ from, to });
                    }
                }
            }

            merged.phrases = phrases;
            merged.questions = questions;
            merged.beginnerQuestions = beginnerQuestions;
            merged.avoid = avoid;
            merged.aliases = aliases;

            out.set(id, merged);
        }

        return out;
    } catch (e) {
        console.warn('读取 section semantic 失败，将忽略：', e && e.message ? e.message : String(e));
        return new Map();
    }
}

function buildSectionAugmentText(sectionMeta) {
    if (!sectionMeta) return '';
    const parts = [];
    if (Array.isArray(sectionMeta.phrases)) {
        for (const p of sectionMeta.phrases) {
            const s = String(p || '').trim();
            if (s) parts.push(s);
        }
    }
    if (Array.isArray(sectionMeta.questions)) {
        for (const q of sectionMeta.questions) {
            const s = String(q || '').trim();
            if (s) parts.push(s);
        }
    }
    if (Array.isArray(sectionMeta.beginnerQuestions)) {
        for (const q of sectionMeta.beginnerQuestions) {
            const s = String(q || '').trim();
            if (s) parts.push(s);
        }
    }
    if (Array.isArray(sectionMeta.aliases)) {
        for (const a of sectionMeta.aliases) {
            if (!a) continue;
            const from = String(a.from || '').trim();
            const to = String(a.to || '').trim();
            if (from) parts.push(from);
            if (to) parts.push(to);
        }
    }
    return parts.join('\n');
}

function stripMarkdown(markdownText) {
    let text = stripFrontMatter(markdownText);

    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/`[^`]*`/g, ' ');
    text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ');
    text = text.replace(/\[[^\]]*\]\([^\)]*\)/g, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/[#>*_~\\-]+/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

function generateSearchIndex(config) {
    if (!config || !Array.isArray(config.all_files)) {
        console.warn('跳过 search-index.json 生成：配置文件缺少 all_files');
        return;
    }

    // 为加载速度与体积考虑：search-index.json 以二进制格式写入（仍保留原路径，前端使用 arrayBuffer 解析）
    // 内容仅包含文档级元数据（不包含全文 content），全文检索由段落 BM25 索引负责。
    const docs = [];
    for (const doc of config.all_files) {
        if (!doc || !doc.path) continue;
        const filePath = String(doc.path);
        docs.push({
            path: filePath,
            filename: doc.filename || path.basename(filePath),
            title: doc.title || inferTitleFromFilename(filePath),
            description: doc.description || '',
            category: doc.category || '',
            topic: doc.topic || '',
            author: doc.author || '',
            difficulty: doc.difficulty || '',
            time: doc.time || '',
            last_updated: doc.last_updated || ''
        });
    }

    const fieldNames = [
        'path',
        'filename',
        'title',
        'description',
        'category',
        'topic',
        'author',
        'difficulty',
        'time',
        'last_updated'
    ];

    const stringToIndex = new Map();
    const strings = [];
    const addString = (value) => {
        const s = String(value == null ? '' : value);
        if (!s) return 0;
        const existing = stringToIndex.get(s);
        if (existing != null) return existing;
        const idx = strings.length + 1; // 0 reserved for empty
        strings.push(s);
        stringToIndex.set(s, idx);
        return idx;
    };

    const record = new Uint32Array(docs.length * fieldNames.length);
    for (let i = 0; i < docs.length; i++) {
        const base = i * fieldNames.length;
        const d = docs[i];
        for (let f = 0; f < fieldNames.length; f++) {
            record[base + f] = addString(d[fieldNames[f]]);
        }
    }

    const offsets = new Uint32Array(strings.length + 1);
    const utf8Chunks = new Array(strings.length);
    let totalBytes = 0;
    for (let i = 0; i < strings.length; i++) {
        offsets[i] = totalBytes;
        const buf = Buffer.from(strings[i], 'utf8');
        utf8Chunks[i] = buf;
        totalBytes += buf.length;
    }
    offsets[strings.length] = totalBytes;

    const headerBytes = 24;
    const offsetsBytes = offsets.byteLength;
    const recordBytes = record.byteLength;
    const paddingBytes = (4 - ((headerBytes + offsetsBytes + totalBytes) % 4)) % 4;
    const totalSize = headerBytes + offsetsBytes + totalBytes + paddingBytes + recordBytes;

    const out = Buffer.allocUnsafe(totalSize);
    let cursor = 0;
    out.write('TSI2', cursor, 'ascii'); cursor += 4;
    out.writeUInt32LE(2, cursor); cursor += 4; // version
    out.writeUInt32LE(docs.length, cursor); cursor += 4; // docCount
    out.writeUInt32LE(fieldNames.length, cursor); cursor += 4; // fieldCount
    out.writeUInt32LE(strings.length, cursor); cursor += 4; // stringCount
    out.writeUInt32LE(strings.length + 1, cursor); cursor += 4; // offsetsCount

    Buffer.from(offsets.buffer, offsets.byteOffset, offsets.byteLength).copy(out, cursor);
    cursor += offsetsBytes;

    for (let i = 0; i < utf8Chunks.length; i++) {
        utf8Chunks[i].copy(out, cursor);
        cursor += utf8Chunks[i].length;
    }

    if (paddingBytes) {
        out.fill(0, cursor, cursor + paddingBytes);
        cursor += paddingBytes;
    }

    Buffer.from(record.buffer, record.byteOffset, record.byteLength).copy(out, cursor);
    cursor += recordBytes;

    fs.writeFileSync(SEARCH_INDEX_PATH, out);
    console.log(`search-index 已生成：${SEARCH_INDEX_PATH}（binary，${docs.length} 条）`);
}

function ensureDirForFile(filePath) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    } catch {
        // ignore
    }
}

function float32ToFloat16Bits(value) {
    const floatView = new Float32Array(1);
    const intView = new Uint32Array(floatView.buffer);

    floatView[0] = value;
    const x = intView[0];

    const sign = (x >> 16) & 0x8000;
    let mantissa = x & 0x007fffff;
    let exp = (x >> 23) & 0xff;

    if (exp === 0xff) {
        if (mantissa) return sign | 0x7e00; // NaN
        return sign | 0x7c00; // Infinity
    }

    exp = exp - 127 + 15;
    if (exp >= 0x1f) return sign | 0x7c00; // overflow -> inf
    if (exp <= 0) {
        if (exp < -10) return sign; // underflow -> 0
        mantissa = (mantissa | 0x00800000) >> (1 - exp);
        return sign | ((mantissa + 0x00001000) >> 13);
    }

    return sign | (exp << 10) | ((mantissa + 0x00001000) >> 13);
}

function encodeFloat32ArrayToBase64Float16(float32Array) {
    const out = new Uint8Array(float32Array.length * 2);
    for (let i = 0; i < float32Array.length; i++) {
        const bits = float32ToFloat16Bits(float32Array[i]);
        out[i * 2] = bits & 0xff;
        out[i * 2 + 1] = (bits >> 8) & 0xff;
    }
    return Buffer.from(out.buffer).toString('base64');
}

function encodeUint32ArrayToBase64(uint32Array) {
    return Buffer.from(uint32Array.buffer).toString('base64');
}

function encodeUint16ArrayToBase64(uint16Array) {
    return Buffer.from(uint16Array.buffer).toString('base64');
}

function fnv1a32(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6d2b79f5;
        let r = t;
        r = Math.imul(r ^ (r >>> 15), r | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function createGaussianRng(seed) {
    const rand = mulberry32(seed);
    let hasSpare = false;
    let spare = 0;
    return function () {
        if (hasSpare) {
            hasSpare = false;
            return spare;
        }
        let u = 0;
        let v = 0;
        while (u === 0) u = rand();
        while (v === 0) v = rand();
        const mag = Math.sqrt(-2.0 * Math.log(u));
        const z0 = mag * Math.cos(2.0 * Math.PI * v);
        const z1 = mag * Math.sin(2.0 * Math.PI * v);
        spare = z1;
        hasSpare = true;
        return z0;
    };
}

function stripMarkdownForGuidedBlock(markdownBlock) {
    let text = String(markdownBlock || '');

    text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, ' $1 ');
    text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, ' $1 ');

    // 保留行内代码内容
    text = text.replace(/`([^`]*)`/g, '$1');

    // 移除剩余 markdown 标记与 html 标签
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/^[ \t]*#{1,6}\s+/gm, '');
    text = text.replace(/[*_~>]+/g, ' ');

    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function extractGuidedTokens(text) {
    const lower = String(text || '').toLowerCase();
    const tokens = [];

    const latin = lower.match(/[a-z0-9_\.#+-]+/g) || [];
    for (const t of latin) {
        if (t.length >= 2) tokens.push(t);
    }

    const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
    if (cjk.length > 0) {
        for (let i = 0; i < cjk.length; i++) tokens.push(cjk[i]);
        for (let i = 0; i + 1 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1]);
        for (let i = 0; i + 2 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1] + cjk[i + 2]);
    }

    return tokens;
}

function extractBm25Tokens(text) {
    const lower = String(text || '').toLowerCase();
    const tokens = [];

    const latin = lower.match(/[a-z0-9_\.#+-]+/g) || [];
    for (const t of latin) {
        if (t.length >= 2) tokens.push(t);
    }

    const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
    if (cjk.length >= 2) {
        for (let i = 0; i + 1 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1]); // bigram
    }
    if (cjk.length >= 3) {
        for (let i = 0; i + 2 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1] + cjk[i + 2]); // trigram
    }

    return tokens;
}

function dotColumnMajor(a, aOffset, b, bOffset, n) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += a[aOffset + i] * b[bOffset + i];
    return sum;
}

function axpyColumnMajor(dst, dstOffset, src, srcOffset, n, scale) {
    for (let i = 0; i < n; i++) dst[dstOffset + i] -= scale * src[srcOffset + i];
}

function norm2ColumnMajor(a, offset, n) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const v = a[offset + i];
        sum += v * v;
    }
    return Math.sqrt(sum);
}

function jacobiEigenSymmetric(matrix, n, maxIter, eps) {
    const a = new Float64Array(matrix);
    const v = new Float64Array(n * n);
    for (let i = 0; i < n; i++) v[i * n + i] = 1;

    const maxIterations = typeof maxIter === 'number' ? maxIter : (n * n * 20);
    const threshold = typeof eps === 'number' ? eps : 1e-10;

    for (let iter = 0; iter < maxIterations; iter++) {
        let p = 0;
        let q = 1;
        let max = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const val = Math.abs(a[i * n + j]);
                if (val > max) {
                    max = val;
                    p = i;
                    q = j;
                }
            }
        }
        if (max < threshold) break;

        const app = a[p * n + p];
        const aqq = a[q * n + q];
        const apq = a[p * n + q];

        const phi = 0.5 * Math.atan2(2 * apq, (aqq - app));
        const c = Math.cos(phi);
        const s = Math.sin(phi);

        for (let k = 0; k < n; k++) {
            if (k === p || k === q) continue;
            const aik = a[p * n + k];
            const aqk = a[q * n + k];
            a[p * n + k] = c * aik - s * aqk;
            a[k * n + p] = a[p * n + k];
            a[q * n + k] = s * aik + c * aqk;
            a[k * n + q] = a[q * n + k];
        }

        const appNew = c * c * app - 2 * s * c * apq + s * s * aqq;
        const aqqNew = s * s * app + 2 * s * c * apq + c * c * aqq;
        a[p * n + p] = appNew;
        a[q * n + q] = aqqNew;
        a[p * n + q] = 0;
        a[q * n + p] = 0;

        for (let k = 0; k < n; k++) {
            const vip = v[k * n + p];
            const viq = v[k * n + q];
            v[k * n + p] = c * vip - s * viq;
            v[k * n + q] = s * vip + c * viq;
        }
    }

    const eigenvalues = new Float64Array(n);
    for (let i = 0; i < n; i++) eigenvalues[i] = a[i * n + i];

    return { eigenvalues, eigenvectors: v };
}

function generateGuidedSemanticIndex(config) {
    if (!config || !Array.isArray(config.all_files)) {
        console.warn('跳过 guided-index.v1.json 生成：配置文件缺少 all_files');
        return;
    }

    const sectionMetaById = loadSectionSemanticMap();

    const featureDim = 2048;
    const latentDim = 64;
    const oversample = 16;
    const m = latentDim + oversample;
    const minChunkChars = 30;
    const maxChunkChars = 800;

    const chunkMeta = [];
    const sparseRows = [];

    for (const doc of config.all_files) {
        if (!doc || !doc.path) continue;
        const filePath = String(doc.path);
        const repoPath = path.join('docs', filePath);

        let markdown = '';
        try {
            markdown = fs.readFileSync(repoPath, 'utf8');
        } catch {
            markdown = '';
        }

        const body = stripFrontMatter(markdown);

        // 与 bm25-index 对齐：保留代码块，但避免被大量空行切碎（先替换为占位符）
        const codeBlocks = [];
        const bodyWithPlaceholders = body.replace(/```[\s\S]*?```/g, (m) => {
            const content = m.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
            const compact = content.replace(/\n{2,}/g, '\n').trim();
            const id = codeBlocks.length;
            codeBlocks.push(compact);
            return `\n\n[[[CODE_BLOCK_${id}]]]\n\n`;
        });
        const bodyWithHeadings = bodyWithPlaceholders.replace(/^#{1,6}\s+.+$/gm, '\n\n$&\n\n');
        const blocks = bodyWithHeadings.split(/\n{2,}/g);

        let currentSectionSlug = 'root';
        let currentHeading = '_root';
        const slugCount = new Map();

        for (const block of blocks) {
            const trimmed = String(block || '').trim();
            if (!trimmed) continue;

            const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
            if (headingMatch) {
                const headingText = normalizeHeadingText(headingMatch[2]);
                const base = slugifyHeading(headingText);
                const prev = slugCount.get(base) || 0;
                const next = prev + 1;
                slugCount.set(base, next);
                currentSectionSlug = next > 1 ? `${base}-${next}` : base;
                currentHeading = headingText || '_root';
                continue;
            }

            let blockText = trimmed;
            const codeMatch = /^\[\[\[CODE_BLOCK_(\d+)\]\]\]$/.exec(trimmed);
            if (codeMatch) {
                const code = codeBlocks[Number(codeMatch[1])] || '';
                blockText = code ? code : '';
            }

            const cleaned = stripMarkdownForGuidedBlock(blockText);
            if (!cleaned || cleaned.length < minChunkChars) continue;

            const text = cleaned.length > maxChunkChars ? (cleaned.slice(0, maxChunkChars) + '…') : cleaned;

            const tfByFeature = new Map();
            const title = doc.title || inferTitleFromFilename(filePath);
            const category = doc.category || '';
            const topic = doc.topic || '';
            const sectionId = `${filePath}#${currentSectionSlug}`;
            const sectionMeta = sectionMetaById.get(sectionId) || null;
            const sectionAugment = buildSectionAugmentText(sectionMeta);
            const stage = sectionMeta && sectionMeta.stage ? String(sectionMeta.stage) : '';

            const addTokens = (sourceText, weight) => {
                if (!sourceText) return;
                const tokens = extractGuidedTokens(sourceText);
                for (const token of tokens) {
                    const idx = fnv1a32(token) % featureDim;
                    tfByFeature.set(idx, (tfByFeature.get(idx) || 0) + weight);
                }
            };

            // 主文本
            addTokens(text, 1);
            // 字段增强：标题更重要
            addTokens(title, 2);
            addTokens(category, 1);
            addTokens(topic, 1);
            // 小节语义增强（构建期生成，不影响引用显示）
            addTokens(currentHeading, 2);
            addTokens(sectionAugment, 1);

            if (tfByFeature.size === 0) continue;

            chunkMeta.push({
                path: filePath,
                title,
                category,
                topic,
                author: doc.author || '',
                difficulty: doc.difficulty || '',
                time: doc.time || '',
                last_updated: doc.last_updated || '',
                sectionId,
                heading: currentHeading,
                stage,
                text
            });

            sparseRows.push(tfByFeature);
        }
    }

    const n = chunkMeta.length;
    if (n < 20) {
        console.warn(`跳过 guided-index.v1.json 生成：chunk 数量太少（${n}）`);
        return;
    }

    console.log(`开始生成 guided-index（段落 chunks：${n}，featureDim：${featureDim}，latentDim：${latentDim}）...`);

    const df = new Uint32Array(featureDim);
    for (const tfMap of sparseRows) {
        for (const idx of tfMap.keys()) df[idx]++;
    }

    const idf = new Float32Array(featureDim);
    for (let i = 0; i < featureDim; i++) {
        idf[i] = Math.log((n + 1) / (df[i] + 1)) + 1;
    }

    // 将 sparseRows 转换为可用于线性代数的稀疏行（并在 TF-IDF 空间归一化）
    const rows = new Array(n);
    for (let i = 0; i < n; i++) {
        const tfMap = sparseRows[i];
        const indices = [];
        const values = [];
        let norm2 = 0;
        for (const [idx, tf] of tfMap.entries()) {
            const w = (1 + Math.log(tf)) * idf[idx];
            indices.push(idx);
            values.push(w);
            norm2 += w * w;
        }
        const norm = Math.sqrt(norm2) || 1;
        for (let j = 0; j < values.length; j++) values[j] /= norm;
        rows[i] = { indices, values };
    }

    // Randomized SVD: A (n x featureDim) -> V_k (featureDim x latentDim)
    const randn = createGaussianRng(0x5eedc0de);
    const omega = new Float32Array(featureDim * m);
    for (let i = 0; i < omega.length; i++) omega[i] = randn();

    // Y = A * Omega  (column-major: m columns, each length n)
    const y = new Float32Array(n * m);
    for (let rowIndex = 0; rowIndex < n; rowIndex++) {
        const row = rows[rowIndex];
        for (let t = 0; t < row.indices.length; t++) {
            const idx = row.indices[t];
            const val = row.values[t];
            const omegaOffset = idx * m;
            for (let j = 0; j < m; j++) {
                y[j * n + rowIndex] += val * omega[omegaOffset + j];
            }
        }
    }

    // Q = orth(Y) via modified Gram-Schmidt (column-major)
    const q = new Float32Array(n * m);
    const tmp = new Float32Array(n);
    for (let j = 0; j < m; j++) {
        const yColOffset = j * n;
        const qColOffset = j * n;

        // tmp = y[:,j]
        tmp.set(y.subarray(yColOffset, yColOffset + n));

        for (let i = 0; i < j; i++) {
            const qiOffset = i * n;
            const r = dotColumnMajor(q, qiOffset, tmp, 0, n);
            axpyColumnMajor(tmp, 0, q, qiOffset, n, r);
        }

        // re-orth for stability
        for (let i = 0; i < j; i++) {
            const qiOffset = i * n;
            const r = dotColumnMajor(q, qiOffset, tmp, 0, n);
            axpyColumnMajor(tmp, 0, q, qiOffset, n, r);
        }

        const colNorm = norm2ColumnMajor(tmp, 0, n) || 1;
        for (let k = 0; k < n; k++) q[qColOffset + k] = tmp[k] / colNorm;
    }

    // B = Q^T A  (m x featureDim), row-major
    const b = new Float32Array(m * featureDim);
    for (let rowIndex = 0; rowIndex < n; rowIndex++) {
        const row = rows[rowIndex];
        for (let t = 0; t < row.indices.length; t++) {
            const idx = row.indices[t];
            const val = row.values[t];
            for (let j = 0; j < m; j++) {
                b[j * featureDim + idx] += q[j * n + rowIndex] * val;
            }
        }
    }

    // C = B B^T (m x m), symmetric
    const c = new Float64Array(m * m);
    for (let i = 0; i < m; i++) {
        const bi = b.subarray(i * featureDim, (i + 1) * featureDim);
        for (let j = i; j < m; j++) {
            const bj = b.subarray(j * featureDim, (j + 1) * featureDim);
            let sum = 0;
            for (let k = 0; k < featureDim; k++) sum += bi[k] * bj[k];
            c[i * m + j] = sum;
            c[j * m + i] = sum;
        }
    }

    const { eigenvalues, eigenvectors } = jacobiEigenSymmetric(c, m, m * m * 30, 1e-12);
    const order = Array.from({ length: m }, (_, i) => i).sort((i, j) => eigenvalues[j] - eigenvalues[i]);

    const vMat = new Float32Array(featureDim * latentDim);
    for (let dim = 0; dim < latentDim; dim++) {
        const eigIndex = order[dim];
        const lambda = Math.max(0, eigenvalues[eigIndex]);
        const sVal = Math.sqrt(lambda);
        const invS = sVal > 1e-6 ? (1 / sVal) : 0;

        for (let feat = 0; feat < featureDim; feat++) {
            let sum = 0;
            for (let r = 0; r < m; r++) {
                sum += b[r * featureDim + feat] * eigenvectors[r * m + eigIndex];
            }
            vMat[feat * latentDim + dim] = sum * invS;
        }
    }

    // chunkVec = A_row * V_k，并在 latent 空间归一化
    const chunkVec = new Float32Array(n * latentDim);
    for (let rowIndex = 0; rowIndex < n; rowIndex++) {
        const row = rows[rowIndex];
        const outOffset = rowIndex * latentDim;
        for (let t = 0; t < row.indices.length; t++) {
            const idx = row.indices[t];
            const val = row.values[t];
            const vOffset = idx * latentDim;
            for (let d = 0; d < latentDim; d++) {
                chunkVec[outOffset + d] += val * vMat[vOffset + d];
            }
        }

        let norm = 0;
        for (let d = 0; d < latentDim; d++) {
            const x = chunkVec[outOffset + d];
            norm += x * x;
        }
        norm = Math.sqrt(norm) || 1;
        for (let d = 0; d < latentDim; d++) chunkVec[outOffset + d] /= norm;
    }

    ensureDirForFile(GUIDED_INDEX_PATH);
    const payload = {
        version: 1,
        generatedAt: getLastModForPath('docs/config.json'),
        featureDim,
        latentDim,
        chunkCount: n,
        tokenization: {
            cjk: ['1-gram', '2-gram', '3-gram'],
            latin: true,
            featureHash: 'fnv1a32'
        },
        idfF16: encodeFloat32ArrayToBase64Float16(idf),
        vF16: encodeFloat32ArrayToBase64Float16(vMat),
        chunkVecF16: encodeFloat32ArrayToBase64Float16(chunkVec),
        chunks: chunkMeta
    };

    fs.writeFileSync(GUIDED_INDEX_PATH, JSON.stringify(payload), 'utf8');
    console.log(`guided-index 已生成：${GUIDED_INDEX_PATH}（${n} 个段落）`);
}

function generateBm25Index(config) {
    if (!config || !Array.isArray(config.all_files)) {
        console.warn('跳过 bm25-index.v1.json 生成：配置文件缺少 all_files');
        return;
    }

    const sectionMetaById = loadSectionSemanticMap();

    const bucketCount = 131072;
    const minChunkChars = 30;
    const maxChunkChars = 800;

    const chunks = [];
    const dl = [];

    // bucket -> array of [chunkId, tf]
    const bucketToPostings = new Map();
    const df = new Uint32Array(bucketCount);
    const k1 = 1.2;
    const b = 0.75;

    let totalDl = 0;

    const pushTfMap = (chunkId, tfMap, dlValue) => {
        dl.push(dlValue);
        totalDl += dlValue;

        for (const [bucket, tf] of tfMap.entries()) {
            df[bucket]++;
            let postings = bucketToPostings.get(bucket);
            if (!postings) {
                postings = [];
                bucketToPostings.set(bucket, postings);
            }
            postings.push(chunkId, tf);
        }
    };

    for (const doc of config.all_files) {
        if (!doc || !doc.path) continue;
        const filePath = String(doc.path);
        const repoPath = path.join('docs', filePath);

        let markdown = '';
        try {
            markdown = fs.readFileSync(repoPath, 'utf8');
        } catch {
            markdown = '';
        }

        const body = stripFrontMatter(markdown);

        // 保留代码块但按段落切分时避免被大量空行切碎：先把 fenced code block 替换为单段文本块
        const codeBlocks = [];
        const bodyWithPlaceholders = body.replace(/```[\s\S]*?```/g, (m) => {
            const content = m.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
            const compact = content.replace(/\n{2,}/g, '\n').trim();
            const id = codeBlocks.length;
            codeBlocks.push(compact);
            return `\n\n[[[CODE_BLOCK_${id}]]]\n\n`;
        });

        const bodyWithHeadings = bodyWithPlaceholders.replace(/^#{1,6}\s+.+$/gm, '\n\n$&\n\n');
        const blocks = bodyWithHeadings.split(/\n{2,}/g);

        let currentSectionSlug = 'root';
        let currentHeading = '_root';
        const slugCount = new Map();
        for (const rawBlock of blocks) {
            const trimmed = String(rawBlock || '').trim();
            if (!trimmed) continue;

            const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
            if (headingMatch) {
                const headingText = normalizeHeadingText(headingMatch[2]);
                const base = slugifyHeading(headingText);
                const prev = slugCount.get(base) || 0;
                const next = prev + 1;
                slugCount.set(base, next);
                currentSectionSlug = next > 1 ? `${base}-${next}` : base;
                currentHeading = headingText || '_root';
                continue;
            }

            let blockText = trimmed;
            const codeMatch = /^\[\[\[CODE_BLOCK_(\d+)\]\]\]$/.exec(trimmed);
            if (codeMatch) {
                const code = codeBlocks[Number(codeMatch[1])] || '';
                blockText = code ? code : '';
            }

            const cleaned = stripMarkdownForGuidedBlock(blockText);
            if (!cleaned || cleaned.length < minChunkChars) continue;

            const text = cleaned.length > maxChunkChars ? (cleaned.slice(0, maxChunkChars) + '…') : cleaned;

            const title = doc.title || inferTitleFromFilename(filePath);
            const category = doc.category || '';
            const topic = doc.topic || '';
            const sectionId = `${filePath}#${currentSectionSlug}`;
            const sectionMeta = sectionMetaById.get(sectionId) || null;
            const sectionAugment = buildSectionAugmentText(sectionMeta);
            const stage = sectionMeta && sectionMeta.stage ? String(sectionMeta.stage) : '';

            const tfByBucket = new Map();
            let dlValue = 0;

            const addTokens = (sourceText, weight) => {
                if (!sourceText) return;
                const tokens = extractBm25Tokens(sourceText);
                for (const t of tokens) {
                    const bucket = fnv1a32(t) % bucketCount;
                    const prev = tfByBucket.get(bucket) || 0;
                    const next = prev + weight;
                    tfByBucket.set(bucket, next > 65535 ? 65535 : next);
                    dlValue += weight;
                }
            };

            // 主文本
            addTokens(text, 1);
            // 字段增强：标题更重要
            addTokens(title, 2);
            addTokens(category, 1);
            addTokens(topic, 1);
            // 小节语义增强（构建期生成，不影响引用显示）
            addTokens(currentHeading, 2);
            addTokens(sectionAugment, 1);

            if (tfByBucket.size === 0) continue;

            const chunkId = chunks.length;
            chunks.push({
                path: filePath,
                title,
                category,
                topic,
                author: doc.author || '',
                difficulty: doc.difficulty || '',
                last_updated: doc.last_updated || '',
                sectionId,
                heading: currentHeading,
                stage,
                text
            });

            pushTfMap(chunkId, tfByBucket, dlValue > 65535 ? 65535 : dlValue);
        }
    }

    const chunkCount = chunks.length;
    if (chunkCount < 20) {
        console.warn(`跳过 bm25-index.v1.json 生成：chunk 数量太少（${chunkCount}）`);
        return;
    }

    const avgdl = totalDl / chunkCount;
    console.log(`开始生成 bm25-index（段落 chunks：${chunkCount}，bucketCount：${bucketCount}）...`);

    // Flatten postings
    const bucketOffsets = new Uint32Array(bucketCount + 1);

    let totalPairs = 0;
    for (const postings of bucketToPostings.values()) totalPairs += postings.length / 2;

    const postingsChunkId = new Uint32Array(totalPairs);
    const postingsTf = new Uint16Array(totalPairs);

    let cursor = 0;
    for (let bucket = 0; bucket < bucketCount; bucket++) {
        bucketOffsets[bucket] = cursor;
        const postings = bucketToPostings.get(bucket);
        if (!postings || postings.length === 0) continue;

        // postings is [chunkId, tf, chunkId, tf ...]
        const pairCount = postings.length / 2;
        const pairs = new Array(pairCount);
        for (let i = 0; i < pairCount; i++) {
            pairs[i] = { id: postings[i * 2], tf: postings[i * 2 + 1] };
        }
        pairs.sort((a, b) => a.id - b.id);

        for (let i = 0; i < pairs.length; i++) {
            postingsChunkId[cursor] = pairs[i].id;
            postingsTf[cursor] = pairs[i].tf > 65535 ? 65535 : pairs[i].tf;
            cursor++;
        }
    }
    bucketOffsets[bucketCount] = cursor;

    const dlArr = new Uint16Array(chunkCount);
    for (let i = 0; i < chunkCount; i++) dlArr[i] = dl[i] > 65535 ? 65535 : dl[i];

    ensureDirForFile(BM25_INDEX_PATH);
    const payload = {
        version: 1,
        generatedAt: getLastModForPath('docs/config.json'),
        bucketCount,
        chunkCount,
        avgdl,
        k1,
        b,
        tokenization: {
            cjk: ['2-gram', '3-gram'],
            latin: 'word',
            featureHash: 'fnv1a32'
        },
        dlU16: encodeUint16ArrayToBase64(dlArr),
        dfU32: encodeUint32ArrayToBase64(df),
        bucketOffsetsU32: encodeUint32ArrayToBase64(bucketOffsets),
        postingsChunkIdU32: encodeUint32ArrayToBase64(postingsChunkId),
        postingsTfU16: encodeUint16ArrayToBase64(postingsTf),
        chunks
    };

    fs.writeFileSync(BM25_INDEX_PATH, JSON.stringify(payload), 'utf8');
    console.log(`bm25-index 已生成：${BM25_INDEX_PATH}（${chunkCount} 个段落）`);
}


// 更新config.json数据的函数
function updateConfigData(docsDir, files, configManager, translatorConfigs = {}) {
    const configData = configManager.config;

    // 获取当前docs目录中所有实际存在的Markdown文件（包括子目录）
    const currentScanResult = scanDirectoryRecursively(docsDir, docsDir);
    const currentFiles = currentScanResult.files;
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

            // 使用配置管理器确定类别
            const category = resolveCategory({
                filePath: file,
                categories: configManager.getCategories(),
                categoryMappings: configManager.categoryMappings,
                reverseCategoryMappings: configManager.reverseCategoryMappings,
                defaultCategory: configManager.getSettings().defaultCategory
            });

            fileToCorrectCategory[file] = category;
        } catch (error) {
            console.error(`解析文件 ${file} 时出错:`, error.message);
            fileToCorrectCategory[file] = configManager.getSettings().defaultCategory; // 使用默认类别
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

    // 重置all_files数组
    configData.all_files = [];

    // 处理每个文件
    files.forEach(file => {
        const fullPath = path.join(docsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        let metadata = parseMetadata(content);

        // 跳过隐藏文件
        if (metadata.hide === 'true' || metadata.hide === true) {
            return;
        }

        // 应用翻译配置
        metadata = applyTranslatorConfig(file, metadata, translatorConfigs);
        if (!metadata.title) metadata.title = inferTitleFromFilename(file);

        // 验证元数据
        const validation = validateMetadata(metadata, configManager);
        if (validation.errors.length > 0) {
            console.error(`文件 ${file} 元数据验证失败:`, validation.errors.join(', '));
            return; // 跳过有错误的文件
        }

        // 显示警告
        if (validation.warnings.length > 0) {
            console.warn(`文件 ${file} 元数据警告:`, validation.warnings.join(', '));
        }

        // 处理自定义字段
        metadata = processCustomFields(metadata, configManager);

        // 使用配置管理器确定类别
        const category = resolveCategory({
            filePath: file,
            categories: configManager.getCategories(),
            categoryMappings: configManager.categoryMappings,
            reverseCategoryMappings: configManager.reverseCategoryMappings,
            defaultCategory: configManager.getSettings().defaultCategory
        });

        // 确定主题
        let topic = metadata.topic || configManager.getSettings().defaultTopic;

        // 如果主题不在预定义列表中，尝试通过别名查找
        if (!configData.topics[topic]) {
            topic = configManager.findTopicByAlias(topic) || configManager.getSettings().defaultTopic;
        }

        // 确保类别存在
        if (!configData.categories[category]) {
            configManager.addCategory(category, {
                title: category,
                description: `${category}相关的教程`,
                topics: {}
            });
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

        // 应用路径映射
        const mappedPath = configManager.mapPath(file);

        // 创建文件对象
        const fileObj = {
            filename: path.basename(file), // 仅文件名，向后兼容
            path: mappedPath, // 使用映射后的路径
            originalPath: file, // 保留原始路径
            title: metadata.title || path.basename(file, '.md'),
            author: metadata.author || '未知',
            order: parseOrder(metadata.order),
            description: metadata.description || '无描述',
            last_updated: metadata.last_updated || metadata.date || '2017-9-18',
            // 添加新的自定义字段
            time: metadata.time || '不具体',
            difficulty: metadata.difficulty || 'beginner',
            prev_chapter: metadata.prev_chapter || null,
            next_chapter: metadata.next_chapter || null,
            min_c: (typeof metadata.min_c === 'number' ? metadata.min_c : null),
            min_t: (typeof metadata.min_t === 'number' ? metadata.min_t : null),
            colors: metadata.colors || metadata.colorLD || null,
            colorChange: metadata.colorChange || null
        };

        // 检查文件是否已存在于主题的文件列表中
        const existingFileIndex = configData.categories[category].topics[topic].files.findIndex(
            f => f.filename === path.basename(file) || f.path === mappedPath
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
            path: mappedPath, // 使用映射后的路径
            originalPath: file, // 保留原始路径
            title: metadata.title || path.basename(file, '.md'),
            author: metadata.author || '未知',
            category: category,
            topic: topic,
            order: parseOrder(metadata.order),
            // 添加新的自定义字段
            time: metadata.time || '不具体',
            difficulty: metadata.difficulty || 'beginner',
            prev_chapter: metadata.prev_chapter || null,
            next_chapter: metadata.next_chapter || null,
            min_c: (typeof metadata.min_c === 'number' ? metadata.min_c : null),
            min_t: (typeof metadata.min_t === 'number' ? metadata.min_t : null),
            colors: metadata.colors || metadata.colorLD || null,
            colorChange: metadata.colorChange || null,
            last_updated: metadata.last_updated || metadata.date || '2017-9-18'
        });

        // 更新作者信息
        if (metadata.author) {
            if (!configData.authors[metadata.author]) {
                configData.authors[metadata.author] = {
                    name: metadata.author,
                    files: []
                };
            }

            // 检查文件是否已存在于作者的文件列表中
            if (!configData.authors[metadata.author].files.includes(path.basename(file))) {
                configData.authors[metadata.author].files.push(path.basename(file));
            }

            // 从其他作者的文件列表中移除此文件，确保作者信息一致性
            Object.keys(configData.authors).forEach(author => {
                if (author !== metadata.author && configData.authors[author].files.includes(path.basename(file))) {
                    configData.authors[author].files = configData.authors[author].files.filter(f => f !== path.basename(file));

                    // 如果该作者没有其他文件了，移除该作者
                    if (configData.authors[author].files.length === 0) {
                        delete configData.authors[author];
                    }
                }
            });
        }
    });

    // 按order排序all_files
    configData.all_files.sort((a, b) => a.order - b.order);
}

// 应用翻译配置的函数
function applyTranslatorConfig(filePath, metadata, translatorConfigs) {
    // 获取文件所在的目录路径
    const dirPath = path.dirname(filePath);

    // 查找该目录或父目录中的翻译配置
    let translatorConfig = null;
    let configPath = null;

    // 从当前目录开始，向上查找翻译配置
    let currentPath = dirPath;
    while (currentPath && currentPath !== '.') {
        if (translatorConfigs[currentPath]) {
            translatorConfig = translatorConfigs[currentPath];
            configPath = currentPath;
            break;
        }
        // 向上一级目录查找
        currentPath = path.dirname(currentPath);
    }

    // 如果找到了翻译配置，应用它
    if (translatorConfig) {
        console.log(`应用翻译配置 ${configPath}/Translator.yaml 到文件: ${filePath}`);

        // 创建新的元数据对象，优先使用翻译配置中的值
        const newMetadata = { ...metadata };

        if (translatorConfig.author !== null && translatorConfig.author !== undefined) {
            newMetadata.author = translatorConfig.author;
            newMetadata.title = path.basename(filePath, '.md');
            newMetadata.description = translatorConfig.description;
            newMetadata.order = translatorConfig.order;
            newMetadata.category = translatorConfig.category;
        }

        return newMetadata;
    }

    // 如果没有找到翻译配置，返回原始元数据
    return metadata;
}

// 辅助函数
function parseMetadata(content) {
    try {
        // 移除可能的BOM字符
        content = content.replace(/^\uFEFF/, '');

        // 仅解析文件起始处的 Front Matter，避免误把正文中的 '---' 当成元数据
        const metadataMatch = content.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
        if (!metadataMatch) return {};

        // 使用更强大的YAML解析器
        return parseYaml(metadataMatch[1]);
    } catch (error) {
        console.error('解析元数据时出错:', error.message);
        return {};
    }
}

function parseOrder(value, fallback = 999) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

// 简单的YAML解析器，支持嵌套对象和数组
function parseYaml(yamlText) {
    // 移除开头和结尾的空白行
    const lines = yamlText.trim().split('\n');
    const result = {};

    // 简单的栈结构跟踪当前对象和缩进级别
    const stack = [{ obj: result, indent: -1 }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // 计算实际缩进（空格数）
        const indent = line.search(/\S/);
        const trimmedLine = line.trim();

        // 移除比当前缩进级别更深的所有对象
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        const current = stack[stack.length - 1];
        const currentObj = current.obj;

        // 处理数组项（以-开头）
        if (trimmedLine.startsWith('-')) {
            const content = trimmedLine.substring(1).trim();

            // 检查是否是键值对形式 (- key: value)
            if (content.includes(':')) {
                const colonIndex = content.indexOf(':');
                const key = content.substring(0, colonIndex).trim();
                const value = content.substring(colonIndex + 1).trim();

                // 处理带引号的字符串
                let finalValue = value;
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    finalValue = value.substring(1, value.length - 1);
                }

                // 如果当前对象是数组，则推入新对象
                if (Array.isArray(currentObj)) {
                    const newObj = {};
                    newObj[key] = finalValue;
                    currentObj.push(newObj);
                } else {
                    // 否则创建数组并添加第一个元素
                    const arrayKey = Object.keys(currentObj).pop();
                    if (!Array.isArray(currentObj[arrayKey])) {
                        currentObj[arrayKey] = [];
                    }
                    const newObj = {};
                    newObj[key] = finalValue;
                    currentObj[arrayKey].push(newObj);
                }
            } else {
                // 简单值形式 (- value)
                let finalValue = content;
                if ((content.startsWith('"') && content.endsWith('"')) ||
                    (content.startsWith("'") && content.endsWith("'"))) {
                    finalValue = content.substring(1, content.length - 1);
                }

                // 确保当前上下文是数组
                const parent = stack[stack.length - 2];
                if (parent) {
                    const parentObj = parent.obj;
                    const arrayKey = Object.keys(parentObj).pop();

                    if (!Array.isArray(parentObj[arrayKey])) {
                        parentObj[arrayKey] = [];
                    }
                    parentObj[arrayKey].push(finalValue);
                }
            }
        }
        // 处理键值对 (key: value)
        else if (trimmedLine.includes(':')) {
            const colonIndex = trimmedLine.indexOf(':');
            const key = trimmedLine.substring(0, colonIndex).trim();
            const value = trimmedLine.substring(colonIndex + 1).trim();

            // 如果值为空，这是一个嵌套对象
            if (!value) {
                const newObj = {};
                currentObj[key] = newObj;
                stack.push({ obj: newObj, indent: indent });
            }
            // 如果值不为空，是简单键值对
            else {
                // 处理带引号的字符串
                let finalValue = value;
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    finalValue = value.substring(1, value.length - 1);
                }
                // 处理颜色值等特殊格式
                else if (value.startsWith('#')) {
                    finalValue = value;
                }
                // 尝试转换数字
                else if (!isNaN(value) && !isNaN(parseFloat(value))) {
                    finalValue = parseFloat(value);
                }
                // 处理布尔值
                else if (value.toLowerCase() === 'true') {
                    finalValue = true;
                }
                else if (value.toLowerCase() === 'false') {
                    finalValue = false;
                }

                currentObj[key] = finalValue;
            }
        }
        // 处理数组开始的情况 ([key]:)
        else if (trimmedLine.endsWith(':')) {
            const key = trimmedLine.slice(0, -1).trim();
            const newArray = [];
            currentObj[key] = newArray;
            stack.push({ obj: newArray, indent: indent });
        }
    }

    return result;
}


// 验证元数据字段
function validateMetadata(metadata, configManager) {
    const settings = configManager.getSettings();
    const validationRules = settings.validationRules;
    const errors = [];
    const warnings = [];

    // 检查必需字段
    if (validationRules && validationRules.requiredFields) {
        validationRules.requiredFields.forEach(field => {
            if (!metadata[field]) {
                errors.push(`缺少必需字段: ${field}`);
            }
        });
    }

    // 检查可选字段
    if (validationRules && validationRules.optionalFields) {
        Object.keys(metadata).forEach(field => {
            if (!validationRules.requiredFields.includes(field) &&
                !validationRules.optionalFields.includes(field) &&
                !settings.customFields.includes(field)) {
                warnings.push(`未知字段: ${field}`);
            }
        });
    }

    // 验证主题
    if (metadata.topic) {
        const topicKey = configManager.findTopicByAlias(metadata.topic) || metadata.topic;
        if (!configManager.getTopics()[topicKey]) {
            warnings.push(`未知主题: ${metadata.topic}，将使用默认主题`);
        }
    }

    return { errors, warnings };
}

// 处理自定义字段
function processCustomFields(metadata, configManager) {
    const settings = configManager.getSettings();
    const customFields = settings.customFields || [];
    const processedMetadata = { ...metadata };

    // 处理自定义字段
    customFields.forEach(field => {
        if (metadata[field]) {
            // 这里可以添加自定义字段的处理逻辑
            console.log(`处理自定义字段 ${field}: ${metadata[field]}`);
        }
    });

    return processedMetadata;
}

// 主处理逻辑
console.log('开始生成教程索引和配置文件...');
const mainConfig = processMainProject();
generateSitemap(mainConfig);
generateSearchIndex(mainConfig);
generateGuidedSemanticIndex(mainConfig);
generateBm25Index(mainConfig);
console.log('\n主项目处理完成！');
