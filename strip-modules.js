const fs = require('fs');
const path = require('path');

function stripEsModules(code) {
    let result = code.replace(/import\s+[^;]+;/g, '');
    result = result.replace(/export\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'window.$1 = function($2) {');
    result = result.replace(/export\s+default\s+function\s+(\w*)\s*\(([^)]*)\)\s*\{/g, 'window.run = function($2) {');
    result = result.replace(/export\s*\{[^}]*\}/g, '');
    return result;
}

function processOutputDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processOutputDir(full);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            const code = fs.readFileSync(full, 'utf8');
            const stripped = stripEsModules(code);
            fs.writeFileSync(full, stripped, 'utf8');
            console.log('Stripped:', full);
        }
    }
}

processOutputDir('assets/anims');
console.log('Done');
