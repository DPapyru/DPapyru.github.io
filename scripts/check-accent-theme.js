/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function readText(relativePath) {
    return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
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
}

function main() {
    const htmlFiles = [
        { file: 'index.html', script: 'assets/js/accent-theme.js' },
        { file: 'qa.html', script: 'assets/js/accent-theme.js' },
        { file: 'search-results.html', script: 'assets/js/accent-theme.js' },
        { file: '404.html', script: 'assets/js/accent-theme.js' },
        { file: 'onboarding.html', script: 'assets/js/accent-theme.js' },
        { file: 'docs/index.html', script: '../assets/js/accent-theme.js' },
        { file: 'docs/viewer.html', script: '../assets/js/accent-theme.js' },
        { file: 'docs/folder.html', script: '../assets/js/accent-theme.js' }
    ];

    for (const entry of htmlFiles) {
        checkHtmlFile(entry.file, entry.script);
    }

    const themeInit = readText('assets/js/theme-init.js');
    assert(
        /data-accent|dataset\.accent/.test(themeInit),
        'assets/js/theme-init.js: expected early data-accent initialization'
    );

    const variablesCss = readText('assets/css/variables.css');
    assert(
        /\[data-theme="dark"\]\[data-accent="/.test(variablesCss),
        'assets/css/variables.css: expected [data-theme="dark"][data-accent="..."] overrides'
    );

    console.log('OK: accent preset wiring detected');
}

try {
    main();
} catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
}
