(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.SharedHeadingOutlineService = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const PINYIN_MAP = Object.freeze({
        '标': 'biao',
        '题': 'ti',
        '第': 'di',
        '二': 'er',
        '节': 'jie',
        '小': 'xiao'
    });

    function slugify(text) {
        const raw = String(text || '').trim();
        if (!raw) return '';

        const tokens = [];
        let asciiBuffer = '';

        function flushAscii() {
            const chunk = asciiBuffer.trim().toLowerCase();
            if (chunk) tokens.push(chunk);
            asciiBuffer = '';
        }

        for (const char of raw) {
            if (/^[A-Za-z0-9]$/.test(char)) {
                asciiBuffer += char;
                continue;
            }
            if (PINYIN_MAP[char]) {
                flushAscii();
                tokens.push(PINYIN_MAP[char]);
                continue;
            }
            flushAscii();
        }

        flushAscii();

        return tokens.join('-')
            .replace(/-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    function ensureUniqueId(idValue, usedIds) {
        const base = String(idValue || '').trim();
        if (!base) return '';

        if (!usedIds.has(base)) {
            usedIds.add(base);
            return base;
        }

        let index = 2;
        let next = base + '-' + index;
        while (usedIds.has(next)) {
            index += 1;
            next = base + '-' + index;
        }
        usedIds.add(next);
        return next;
    }

    function createHeadingId(level, text, usedIds) {
        const slug = slugify(text);
        const base = slug ? 'section-' + level + '-' + slug : 'section-' + level;
        return ensureUniqueId(base, usedIds);
    }

    function extractHeadingOutlineFromMarkdown(markdownText) {
        const lines = String(markdownText || '').split(/\r?\n/);
        const usedIds = new Set();
        const output = [];

        lines.forEach(function (line) {
            const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
            if (!match) return;

            const level = match[1].length;
            const text = String(match[2] || '').trim();
            if (!text) return;

            const id = createHeadingId(level, text, usedIds);
            output.push({ level: level, text: text, id: id });
        });

        return output;
    }

    function normalizeHeadingElement(item) {
        if (!item || typeof item !== 'object') return null;
        const tagName = String(item.tagName || '').toUpperCase();
        const match = tagName.match(/^H([1-6])$/);
        if (!match) return null;

        const level = Number(match[1]);
        const text = String(item.textContent || '').trim();
        if (!text) return null;

        const id = String(item.id || '').trim();
        return { level: level, text: text, id: id, element: item };
    }

    function extractHeadingOutlineFromElements(elementsInput) {
        const elements = Array.isArray(elementsInput) ? elementsInput : Array.from(elementsInput || []);
        const usedIds = new Set();
        const output = [];

        elements.forEach(function (item) {
            const normalized = normalizeHeadingElement(item);
            if (!normalized) return;

            let id = normalized.id;
            if (!id) {
                id = createHeadingId(normalized.level, normalized.text, usedIds);
            } else {
                id = ensureUniqueId(id, usedIds);
            }

            if (normalized.element && normalized.element.id !== id) {
                normalized.element.id = id;
            }

            output.push({
                level: normalized.level,
                text: normalized.text,
                id: id,
                element: normalized.element
            });
        });

        return output;
    }

    return {
        slugify,
        extractHeadingOutlineFromMarkdown,
        extractHeadingOutlineFromElements
    };
});
