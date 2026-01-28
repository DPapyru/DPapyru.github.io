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

function checkHtmlFile(relativePath, expectedScriptPath) {
    const html = readText(relativePath);

    assert(
        html.includes('id="accent-select"'),
        `${relativePath}: missing #accent-select`
    );

    assert(
        html.includes(`src="${expectedScriptPath}"`),
        `${relativePath}: missing script include ${expectedScriptPath}`
    );

    const expectedValues = ['green', 'blue', 'purple', 'orange', 'red', 'cyan', 'black', 'white'];
    for (const value of expectedValues) {
        assert(
            html.includes(`value="${value}"`),
            `${relativePath}: missing accent option value="${value}"`
        );
    }
}

function main() {
    const htmlFiles = [
        { file: 'site/index.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/qa.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/search-results.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/404.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/onboarding.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/viewer.html', script: '/site/assets/js/accent-theme.js' },
        { file: 'site/pages/folder.html', script: '/site/assets/js/accent-theme.js' }
    ];

    for (const entry of htmlFiles) {
        checkHtmlFile(entry.file, entry.script);
    }

    const themeInit = readText('site/assets/js/theme-init.js');
    assert(
        /data-accent|dataset\.accent/.test(themeInit),
        'site/assets/js/theme-init.js: expected early data-accent initialization'
    );
    assert(
        themeInit.includes('black') && themeInit.includes('white'),
        'site/assets/js/theme-init.js: expected black/white in allowed accents'
    );

    const variablesCss = readText('site/assets/css/variables.css');
    assert(
        /\[data-theme="dark"\]\[data-accent="/.test(variablesCss),
        'site/assets/css/variables.css: expected [data-theme="dark"][data-accent="..."] overrides'
    );
    for (const value of ['green', 'blue', 'purple', 'orange', 'red', 'cyan', 'black', 'white']) {
        assert(
            variablesCss.includes(`[data-theme="dark"][data-accent="${value}"]`),
            `site/assets/css/variables.css: missing accent block for ${value}`
        );
    }

    console.log('OK: accent preset wiring detected');
}

try {
    main();
} catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
}
