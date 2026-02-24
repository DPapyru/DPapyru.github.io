(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedViewerComposition = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    function resolveDeps() {
        const deps = {
            route: root && root.SharedLegacyRouteResolver,
            tree: root && root.SharedDocTreeService,
            outline: root && root.SharedHeadingOutlineService,
            pageTreeNav: root && root.SharedPageTreeNavAtom,
            articleOutline: root && root.SharedArticleOutlineAtom
        };

        if (typeof module !== 'undefined' && module.exports) {
            deps.route = deps.route || require('../../services/routing/legacy-route-resolver.js');
            deps.tree = deps.tree || require('../../services/doc-tree/doc-tree-service.js');
            deps.outline = deps.outline || require('../../services/outline/heading-outline-service.js');
            deps.pageTreeNav = deps.pageTreeNav || require('../../atoms/doc/page-tree-nav.js');
            deps.articleOutline = deps.articleOutline || require('../../atoms/doc/article-outline.js');
        }

        return deps;
    }

    function parseCurrentFileFromSearch(searchText) {
        const search = String(searchText || '').replace(/^\?/, '');
        if (!search) return '';
        const params = new URLSearchParams(search);
        return params.get('file') || '';
    }

    function findCurrentDoc(allDocs, pathValue) {
        const list = Array.isArray(allDocs) ? allDocs : [];
        return list.find(function (doc) {
            return String(doc && (doc.path || doc.filename) || '') === String(pathValue || '');
        }) || null;
    }

    function folderPathForDoc(doc) {
        const pathValue = String(doc && (doc.path || doc.filename) || '');
        if (!pathValue) return '';
        const parts = pathValue.split('/');
        parts.pop();
        return parts.join('/');
    }

    function buildViewerModel(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const deps = resolveDeps();

        const allDocs = Array.isArray(opts.allDocs) ? opts.allDocs : [];
        const resolved = deps.route.resolveViewerFile(opts.rawFile, {
            allDocs: allDocs,
            pathMappings: opts.pathMappings || {}
        });

        const tree = deps.tree.buildDocTree(allDocs);
        const current = findCurrentDoc(allDocs, resolved.path) || { path: resolved.path, title: '' };
        const folderPath = folderPathForDoc(current);
        const visibleDocs = deps.tree.flattenVisibleDocs(tree, { folderPath: folderPath });
        const neighbors = deps.tree.findDocNeighbors(tree, current.path, { folderPath: folderPath });
        const outline = deps.outline.extractHeadingOutlineFromElements(opts.headingElements || []);

        return {
            tree,
            current,
            visibleDocs,
            neighbors,
            outline,
            resolveReason: resolved.reason
        };
    }

    function defaultLoadConfig() {
        if (typeof fetch !== 'function') {
            return Promise.resolve({ all_files: [], pathMappings: {} });
        }
        return fetch('/site/content/config.json', { cache: 'no-store' })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('config load failed: ' + response.status);
                }
                return response.json();
            })
            .catch(function () {
                return { all_files: [], pathMappings: {} };
            });
    }

    function mountViewerShell(options) {
        const opts = options && typeof options === 'object' ? options : {};
        const deps = resolveDeps();
        const documentObj = opts.documentObj || (typeof document !== 'undefined' ? document : null);
        if (!documentObj) {
            return Promise.resolve({ refresh: function () { return null; }, destroy: function () {} });
        }

        const categorySidebar = documentObj.getElementById('category-sidebar');
        const toc = documentObj.getElementById('table-of-contents');
        const markdownRoot = documentObj.getElementById('markdown-content');
        const loadConfig = typeof opts.loadConfig === 'function' ? opts.loadConfig : defaultLoadConfig;

        let observer = null;

        function collectHeadings() {
            if (!markdownRoot || typeof markdownRoot.querySelectorAll !== 'function') return [];
            return Array.from(markdownRoot.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        }

        function render(model) {
            if (categorySidebar && deps.pageTreeNav && typeof deps.pageTreeNav.renderPageTreeNav === 'function') {
                categorySidebar.innerHTML = '';
                categorySidebar.appendChild(deps.pageTreeNav.renderPageTreeNav({
                    documentObj: documentObj,
                    docs: model.visibleDocs,
                    currentPath: model.current.path
                }));
            }

            if (toc && deps.articleOutline && typeof deps.articleOutline.renderArticleOutline === 'function') {
                toc.innerHTML = '';
                if (model.outline.length > 0) {
                    toc.style.display = '';
                    toc.appendChild(deps.articleOutline.renderArticleOutline({
                        documentObj: documentObj,
                        headings: model.outline
                    }));
                } else {
                    toc.style.display = 'none';
                }
            }
        }

        function refresh() {
            return loadConfig().then(function (config) {
                const searchText = opts.searchText || (root && root.location ? root.location.search : '');
                const rawFile = opts.rawFile || parseCurrentFileFromSearch(searchText);
                const model = buildViewerModel({
                    rawFile: rawFile,
                    allDocs: config.all_files || [],
                    pathMappings: config.pathMappings || {},
                    headingElements: collectHeadings()
                });
                render(model);
                return model;
            });
        }

        if (typeof MutationObserver !== 'undefined' && markdownRoot) {
            observer = new MutationObserver(function () {
                refresh();
            });
            observer.observe(markdownRoot, {
                childList: true,
                subtree: true
            });
        }

        return refresh().then(function () {
            return {
                refresh: refresh,
                destroy: function () {
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                }
            };
        });
    }

    return {
        parseCurrentFileFromSearch,
        buildViewerModel,
        mountViewerShell
    };
});
