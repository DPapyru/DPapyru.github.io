(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedFrontMatterUtils = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DEFAULT_METADATA = Object.freeze({
        title: '',
        author: '',
        topic: 'article-contribution',
        description: '',
        order: '',
        difficulty: 'beginner',
        time: '',
        prev_chapter: '',
        next_chapter: '',
        min_c: '',
        min_t: '',
        colors: {},
        colorChange: {}
    });

    function ensureObject(value) {
        return value && typeof value === 'object' ? value : {};
    }

    function normalizeMetaNumberInput(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        const num = Number(text);
        if (!Number.isFinite(num)) return '';
        const normalized = Math.max(0, Math.floor(num));
        return String(normalized);
    }

    function parseSimpleYamlValue(raw) {
        const text = String(raw || '').trim();
        if (!text) return '';
        if (
            (text.startsWith('"') && text.endsWith('"'))
            || (text.startsWith('\'') && text.endsWith('\''))
        ) {
            return text.slice(1, -1);
        }
        return text;
    }

    function parseFrontMatterBlock(yamlText) {
        const metadata = {};
        const lines = String(yamlText || '').replace(/\r\n/g, '\n').split('\n');
        let i = 0;

        while (i < lines.length) {
            const rawLine = lines[i];
            const line = String(rawLine || '');
            const trimmed = line.trim();
            i += 1;

            if (!trimmed || trimmed.startsWith('#')) continue;
            if (/^\s/.test(line)) continue;

            const keyMatch = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
            if (!keyMatch) continue;
            const key = String(keyMatch[1] || '').trim();
            const tail = String(keyMatch[2] || '').trim();
            if (!key) continue;

            if (key === 'colors') {
                const colors = {};
                while (i < lines.length) {
                    const nextLine = String(lines[i] || '');
                    const nextTrimmed = nextLine.trim();
                    if (!nextTrimmed) {
                        i += 1;
                        continue;
                    }
                    if (!/^\s{2,}/.test(nextLine)) break;
                    const entry = nextTrimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
                    if (entry) {
                        const colorName = String(entry[1] || '').trim();
                        const colorValue = parseSimpleYamlValue(entry[2]);
                        if (colorName && colorValue) {
                            colors[colorName] = colorValue;
                        }
                    }
                    i += 1;
                }
                metadata.colors = colors;
                continue;
            }

            if (key === 'colorChange') {
                const colorChange = {};
                let currentName = '';
                while (i < lines.length) {
                    const nextLine = String(lines[i] || '');
                    const nextTrimmed = nextLine.trim();
                    if (!nextTrimmed) {
                        i += 1;
                        continue;
                    }
                    if (!/^\s{2,}/.test(nextLine)) break;

                    if (/^\s{2}[A-Za-z0-9_-]+\s*:/.test(nextLine)) {
                        const animMatch = nextTrimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*$/);
                        if (animMatch) {
                            currentName = String(animMatch[1] || '').trim();
                            if (currentName && !Array.isArray(colorChange[currentName])) {
                                colorChange[currentName] = [];
                            }
                        }
                        i += 1;
                        continue;
                    }

                    if (/^\s{4}-\s+/.test(nextLine) && currentName) {
                        const value = parseSimpleYamlValue(nextTrimmed.replace(/^-+\s*/, ''));
                        if (value) {
                            colorChange[currentName].push(value);
                        }
                    }
                    i += 1;
                }
                metadata.colorChange = colorChange;
                continue;
            }

            metadata[key] = parseSimpleYamlValue(tail);
        }

        return metadata;
    }

    function parseFrontMatter(markdownText) {
        const text = String(markdownText || '').replace(/\r\n/g, '\n');
        const frontMatterMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
        if (!frontMatterMatch) {
            return {
                hasFrontMatter: false,
                frontMatter: '',
                metadata: {},
                body: text
            };
        }

        const yamlText = String(frontMatterMatch[1] || '');
        const body = text.slice(frontMatterMatch[0].length);
        return {
            hasFrontMatter: true,
            frontMatter: yamlText,
            metadata: parseFrontMatterBlock(yamlText),
            body
        };
    }

    function applyMetadataDefaults(metadata) {
        const base = ensureObject(metadata);
        const merged = {
            ...DEFAULT_METADATA,
            ...base
        };
        merged.title = String(merged.title || '').trim();
        merged.author = String(merged.author || '').trim();
        merged.topic = String(merged.topic || 'article-contribution').trim() || 'article-contribution';
        merged.description = String(merged.description || '').trim();
        merged.order = normalizeMetaNumberInput(merged.order);
        merged.difficulty = String(merged.difficulty || 'beginner').trim() || 'beginner';
        merged.time = String(merged.time || '').trim();
        merged.prev_chapter = String(merged.prev_chapter || '').trim();
        merged.next_chapter = String(merged.next_chapter || '').trim();
        merged.min_c = normalizeMetaNumberInput(merged.min_c);
        merged.min_t = normalizeMetaNumberInput(merged.min_t);
        merged.colors = ensureObject(merged.colors);
        merged.colorChange = ensureObject(merged.colorChange);
        if (!['beginner', 'intermediate', 'advanced'].includes(merged.difficulty)) {
            merged.difficulty = 'beginner';
        }
        return merged;
    }

    function buildFrontMatterLines(metadata) {
        const m = applyMetadataDefaults(metadata);
        const lines = [
            '---',
            `title: ${m.title || '新文章'}`,
            `author: ${m.author || ''}`,
            `topic: ${m.topic || 'article-contribution'}`,
            `description: ${m.description || ''}`,
            `order: ${m.order || '100'}`,
            `difficulty: ${m.difficulty || 'beginner'}`,
            `time: ${m.time || ''}`
        ];
        if (m.prev_chapter) lines.push(`prev_chapter: ${m.prev_chapter}`);
        if (m.next_chapter) lines.push(`next_chapter: ${m.next_chapter}`);
        if (m.min_c) lines.push(`min_c: ${m.min_c}`);
        if (m.min_t) lines.push(`min_t: ${m.min_t}`);

        const colorEntries = Object.entries(m.colors);
        if (colorEntries.length > 0) {
            lines.push('colors:');
            colorEntries.forEach((entry) => {
                const name = String(entry[0] || '').trim();
                const value = String(entry[1] || '').trim();
                if (!name || !value) return;
                lines.push(`  ${name}: "${value}"`);
            });
        }

        const changeEntries = Object.entries(m.colorChange);
        if (changeEntries.length > 0) {
            lines.push('colorChange:');
            changeEntries.forEach((entry) => {
                const name = String(entry[0] || '').trim();
                const colors = Array.isArray(entry[1]) ? entry[1] : [];
                if (!name || colors.length <= 0) return;
                lines.push(`  ${name}:`);
                colors.forEach((colorValue) => {
                    const safeColor = String(colorValue || '').trim();
                    if (!safeColor) return;
                    lines.push(`    - "${safeColor}"`);
                });
            });
        }

        lines.push('---', '');
        return lines;
    }

    function buildFrontMatterText(metadata) {
        return `${buildFrontMatterLines(metadata).join('\n')}`;
    }

    function mergeFrontMatter(markdownText, metadata) {
        const parsed = parseFrontMatter(markdownText);
        const body = String(parsed.body || markdownText || '').replace(/^\s+/, '');
        const front = buildFrontMatterText(metadata);
        return `${front}${body}`;
    }

    function ensureFrontMatter(markdownText, metadata) {
        const parsed = parseFrontMatter(markdownText);
        if (parsed.hasFrontMatter) return String(markdownText || '');
        return mergeFrontMatter(markdownText, metadata || {});
    }

    return {
        DEFAULT_METADATA,
        parseFrontMatter,
        applyMetadataDefaults,
        buildFrontMatterLines,
        buildFrontMatterText,
        mergeFrontMatter,
        ensureFrontMatter,
        normalizeMetaNumberInput
    };
});
