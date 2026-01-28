(function () {
    if (window.SITE) return;
    window.SITE = {
        assetsRoot: '/site/assets',
        contentRoot: '/site/content',
        pagesRoot: '/site/pages'
    };

    window.SITE.bootstrapPage = function bootstrapPage(pageName) {
        var root = document.documentElement;
        root.setAttribute('data-site', 'site');
        if (!pageName) return;
        root.setAttribute('data-page', pageName);
    };
})();
