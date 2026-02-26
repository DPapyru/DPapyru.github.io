const fs = require('node:fs');
const path = require('node:path');

const CONTENT_ROOT = path.resolve('site/content');
const EMBED_LINE_RE = /^(\s*)\{\{(cs|anim):([^}\n]+)\}\}\s*$/;
const FALLBACK_LABEL = '待补充说明';

function walkMarkdownFiles(rootDir) {
    const result = [];
    const stack = [rootDir];
    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        entries.forEach((entry) => {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
                return;
            }
            if (entry.isFile() && full.endsWith('.md')) {
                result.push(full);
            }
        });
    }
    return result;
}

function parseLegacyDirectivePayload(rawPayload) {
    const parts = String(rawPayload || '').split('|');
    const target = String(parts.shift() || '').trim();
    const label = String(parts.join('|') || '').trim();
    return {
        target,
        label: label || FALLBACK_LABEL
    };
}

function migrateLine(line) {
    const match = String(line || '').match(EMBED_LINE_RE);
    if (!match) return null;
    const indent = String(match[1] || '');
    const kindRaw = String(match[2] || '').trim().toLowerCase();
    const payload = parseLegacyDirectivePayload(match[3]);
    if (!payload.target) return null;

    const kind = kindRaw === 'anim' ? 'anims' : 'cs';
    return `${indent}[${payload.label}](${kind}:${payload.target})`;
}

function migrateFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    let changed = false;

    const nextLines = lines.map((line) => {
        const migrated = migrateLine(line);
        if (!migrated || migrated === line) return line;
        changed = true;
        return migrated;
    });

    if (!changed) return false;
    const nextText = `${nextLines.join('\n')}\n`;
    fs.writeFileSync(filePath, nextText, 'utf8');
    return true;
}

function main() {
    const files = walkMarkdownFiles(CONTENT_ROOT);
    let changedCount = 0;
    files.forEach((filePath) => {
        if (migrateFile(filePath)) {
            changedCount += 1;
            console.log(`migrated: ${path.relative(process.cwd(), filePath)}`);
        }
    });
    console.log(`done: ${changedCount}/${files.length} markdown files updated`);
}

if (require.main === module) {
    main();
}

module.exports = {
    migrateLine,
    parseLegacyDirectivePayload
};
