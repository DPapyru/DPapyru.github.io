// Shared config loader (GitHub Pages friendly, no build step).
// Provides a single source of truth for docs/config.json loading across pages.
(function () {
  var state = {
    promise: null,
    config: null,
    redirects: {}
  };

  var DEFAULT_PATH_MAPPINGS = {
    'DPapyru-ForNewModder.md': 'Modder入门/DPapyru-给新人的前言.md',
    'DPapyru-ForContributors-Basic.md': '怎么贡献/DPapyru-贡献者如何编写文章基础.md',
    'TopicSystemGuide.md': '怎么贡献/TopicSystem使用指南.md',
    'getting-started.md': 'Modder入门/DPapyru-给新人的前言.md',
    'basic-concepts.md': 'Modder入门/DPapyru-给新人的前言.md',
    'tutorial-index.md': 'Modder入门/DPapyru-给新人的前言.md',
    '01-入门指南/README.md': 'Modder入门/DPapyru-给新人的前言.md',
    '02-基础概念/README.md': 'Modder入门/DPapyru-给新人的前言.md',
    '03-内容创建/README.md': 'Modder入门/DPapyru-给新人的前言.md',
    '04-高级开发/README.md': 'Modder入门/DPapyru-给新人的前言.md',
    '05-专题主题/README.md': 'Modder入门/DPapyru-给新人的前言.md',
    '06-资源参考/README.md': 'Modder入门/DPapyru-给新人的前言.md'
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeUrl(href) {
    if (!href) return true;
    var trimmed = String(href).trim().toLowerCase();
    return !(
      trimmed.indexOf('javascript:') === 0 ||
      trimmed.indexOf('data:') === 0 ||
      trimmed.indexOf('vbscript:') === 0
    );
  }

  function getConfigPath() {
    return window.location.pathname.includes('/docs/') ? './config.json' : 'docs/config.json';
  }

  function generateDefaultConfig() {
    return {
      metadata: {
        title: '泰拉瑞亚Mod制作教程',
        description: '泰拉瑞亚Mod开发的完整教程',
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      },
      categories: {
        '入门': { icon: '', order: 1, description: '新手入门教程' },
        '进阶': { icon: '', order: 2, description: '进阶开发技巧' },
        '高级': { icon: '', order: 3, description: '高级开发技术' },
        '个人分享': { icon: '', order: 4, description: '个人开发经验分享' },
        '怎么贡献': { icon: '', order: 5, description: '贡献指南' },
        'Modder入门': { icon: '', order: 6, description: 'Modder入门教程' }
      },
      topics: {},
      pathMappings: {},
      all_files: [],
      extensions: {
        customFields: {
          difficulty: {
            type: 'select',
            options: {
              beginner: '初级',
              intermediate: '中级',
              advanced: '高级',
              all: '全部级别'
            }
          }
        }
      }
    };
  }

  function normalizeConfig(config) {
    if (!config || typeof config !== 'object') return generateDefaultConfig();
    if (!config.categories) config.categories = {};
    if (!config.topics) config.topics = {};
    if (!config.pathMappings) config.pathMappings = {};
    if (config.settings && config.settings.pathMappings && !Object.keys(config.pathMappings).length) {
      config.pathMappings = config.settings.pathMappings;
    }
    config.pathMappings = Object.assign(
      {},
      DEFAULT_PATH_MAPPINGS,
      (config.settings && config.settings.pathMappings) ? config.settings.pathMappings : {},
      config.pathMappings || {}
    );
    if (config.settings) config.settings.pathMappings = config.pathMappings;
    if (!config.all_files) config.all_files = [];
    return config;
  }

  function setGlobals(config) {
    state.config = config;
    state.redirects = config.pathMappings || {};
    window.DOC_CONFIG = state.config;
    window.PATH_REDIRECTS = state.redirects;
  }

  async function load(options) {
    options = options || {};
    if (!options.force && state.promise) return state.promise;

    state.promise = (async function () {
      try {
        var configPath = getConfigPath();
        var response = await fetch(configPath);
        if (!response.ok) throw new Error('Failed to load config: ' + response.status);
        var config = normalizeConfig(await response.json());
        setGlobals(config);
        window.dispatchEvent(new CustomEvent('siteconfigready', { detail: { config: config } }));
        return config;
      } catch (error) {
        console.warn('SiteConfig: load failed, using default config:', error);
        var fallback = generateDefaultConfig();
        setGlobals(fallback);
        window.dispatchEvent(new CustomEvent('siteconfigready', { detail: { config: fallback } }));
        return fallback;
      }
    })();

    return state.promise;
  }

  function get() {
    return state.config || window.DOC_CONFIG || null;
  }

  window.SiteConfig = {
    load: load,
    get: get,
    getConfigPath: getConfigPath
  };

  window.SiteUtils = window.SiteUtils || {};
  window.SiteUtils.escapeHtml = escapeHtml;
  window.SiteUtils.isSafeUrl = isSafeUrl;
  window.SiteUtils.getViewerBase = function () {
    return window.location.pathname.includes('/docs/') ? 'viewer.html' : 'docs/viewer.html';
  };
  window.SiteUtils.getDocsIndexUrl = function () {
    return window.location.pathname.includes('/docs/') ? 'index.html' : 'docs/index.html';
  };
  window.SiteUtils.getSearchResultsUrl = function (query) {
    var base = window.location.pathname.includes('/docs/') ? '../' : '';
    var q = query == null ? '' : String(query);
    return base + 'search-results.html?q=' + encodeURIComponent(q);
  };
})();
