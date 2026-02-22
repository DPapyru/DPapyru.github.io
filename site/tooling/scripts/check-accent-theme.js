/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

function readText(relativePath) {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8');
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const TERRARIA_ACCENTS = [
    'terraria-crimson',
    'terraria-corruption',
    'terraria-hallow',
    'terraria-tundra',
    'terraria-desert'
];

function checkHtmlFile(relativePath, expectedScriptPath) {
    const html = readText(relativePath);

    assert(
        html.includes('id="accent-select"'),
        `${relativePath}: missing #accent-select`
    );

    assert(
        html.includes(`src="${expectedScriptPath}"`)
            || (relativePath === 'site/pages/anim-renderer.html'
                && html.includes('src="../../site/assets/js/accent-theme.js"')),
        `${relativePath}: missing script include ${expectedScriptPath}`
    );

    for (const accent of TERRARIA_ACCENTS) {
        assert(
            html.includes(`value="${accent}"`),
            `${relativePath}: missing accent option ${accent}`
        );
    }
}

function main() {
    const htmlFiles = [
        { file: 'site/index.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/qa.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/search-results.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/404.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/content/index.html', script: '../assets/js/accent-theme.js' },
        { file: 'site/pages/viewer.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/folder.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/article-studio.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/anim-renderer.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/shader-playground.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/shader-contribute.html', script: '/site/assets/js/accent-theme.js' }
    ];

    for (const entry of htmlFiles) {
        checkHtmlFile(entry.file, entry.script);
    }

    const themeInit = readText('site/assets/js/theme-init.js');
    assert(
        /data-theme-mode/.test(themeInit),
        'site/assets/js/theme-init.js: expected early data-theme-mode initialization'
    );
    assert(
        themeInit.includes('special') && themeInit.includes('light') && themeInit.includes('dark'),
        'site/assets/js/theme-init.js: expected light/dark/special mode wiring'
    );

    const accentTheme = readText('site/assets/js/accent-theme.js');
    assert(
        accentTheme.includes('theme-mode-select'),
        'site/assets/js/accent-theme.js: expected theme-mode-select wiring'
    );
    assert(
        accentTheme.includes('MODE_ACCENTS') && accentTheme.includes('special'),
        'site/assets/js/accent-theme.js: expected mode-based accent map'
    );
    for (const accent of TERRARIA_ACCENTS) {
        assert(
            accentTheme.includes(accent),
            `site/assets/js/accent-theme.js: expected accent ${accent}`
        );
    }

    const variablesCss = readText('site/assets/css/variables.css');
    assert(
        variablesCss.includes('[data-theme="light"][data-accent="blue"]'),
        'site/assets/css/variables.css: expected light theme accent overrides'
    );
    assert(
        variablesCss.includes('[data-theme="dark"][data-theme-mode="special"][data-accent="vs"]'),
        'site/assets/css/variables.css: expected special mode accent overrides'
    );
    for (const accent of TERRARIA_ACCENTS) {
        assert(
            variablesCss.includes(`[data-theme="dark"][data-theme-mode="special"][data-accent="${accent}"]`),
            `site/assets/css/variables.css: expected special accent overrides for ${accent}`
        );
    }

    console.log('OK: theme mode + accent wiring detected');
}

try {
    main();
} catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
}
