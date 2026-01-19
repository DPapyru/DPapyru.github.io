// UMD wrapper: usable in browser (window.KnowledgeCore) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.KnowledgeCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    function normalizeText(text) {
        return String(text == null ? '' : text);
    }

    function tokenizeQuery(text) {
        const normalized = normalizeText(text)
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, ' ')
            .trim();
        if (!normalized) return [];
        return normalized.split(/\s+/g).filter(Boolean);
    }

    function parseInlineMemberAccessCall(code) {
        const raw = normalizeText(code).trim();
        if (!raw) return null;

        let text = raw;
        if (text.endsWith(';')) {
            text = text.slice(0, -1).trim();
        }

        const closeIndex = text.length - 1;
        if (text[closeIndex] !== ')') return null;

        const openIndex = findMatchingOpenParen(text, closeIndex);
        if (openIndex < 0) return null;

        const beforeParen = text.slice(0, openIndex).trim();
        const argsText = text.slice(openIndex + 1, closeIndex);

        const compact = beforeParen.replace(/\s+/g, '');
        if (!compact.includes('.')) return null;

        const parts = compact.split('.').filter(Boolean);
        if (parts.length < 2) return null;

        const memberName = parts[parts.length - 1];
        const receiverChain = parts.slice(0, -1).join('.');
        const receiver = parts[parts.length - 2];

        if (!isIdentifier(memberName) || !isIdentifier(receiver)) return null;

        const argc = countTopLevelArgs(argsText);
        if (argc == null) return null;

        return {
            receiver,
            receiverChain,
            memberName,
            argc,
            declaringTypeHint: inferDeclaringTypeHint(receiver, receiverChain)
        };
    }

    function sanitizeExternalUrl(url) {
        const raw = normalizeText(url).trim();
        if (!raw) return null;
        try {
            const parsed = new URL(raw);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
            return parsed.toString();
        } catch (e) {
            return null;
        }
    }

    function recommendFromCollections(collectionsDoc, query, options) {
        const topN = options && Number.isFinite(options.topN) ? Math.max(1, options.topN) : 3;
        const queryTokens = tokenizeQuery(query);
        if (!queryTokens.length) return [];

        const collections = collectionsDoc && collectionsDoc.collections ? collectionsDoc.collections : null;
        if (!collections || typeof collections !== 'object') return [];

        const scored = [];
        Object.keys(collections).forEach((collectionId) => {
            const collection = collections[collectionId];
            const items = collection && Array.isArray(collection.items) ? collection.items : [];
            items.forEach((item) => {
                const score = scoreItemAgainstQuery(item, queryTokens);
                if (score <= 0) return;
                scored.push({
                    ...item,
                    collectionId,
                    score
                });
            });
        });

        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const wa = Number.isFinite(a.weight) ? a.weight : 0;
            const wb = Number.isFinite(b.weight) ? b.weight : 0;
            if (wb !== wa) return wb - wa;
            const pa = a.path || a.url || '';
            const pb = b.path || b.url || '';
            return String(pa).localeCompare(String(pb));
        });

        return scored.slice(0, topN);
    }

    function inferDeclaringTypeHint(receiver, receiverChain) {
        if (receiverChain === 'Terraria.Main') return 'Terraria.Main';
        if (receiverChain === 'Terraria.Player') return 'Terraria.Player';
        if (receiverChain === 'Terraria.NPC') return 'Terraria.NPC';

        const lower = String(receiver || '').toLowerCase();
        if (lower === 'main') return 'Terraria.Main';
        if (lower === 'player') return 'Terraria.Player';
        if (lower === 'npc') return 'Terraria.NPC';
        return null;
    }

    function isIdentifier(text) {
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text);
    }

    function findMatchingOpenParen(text, closeIndex) {
        let depth = 0;
        let inSingle = false;
        let inDouble = false;
        let inVerbatim = false;

        for (let i = closeIndex; i >= 0; i--) {
            const ch = text[i];
            const prev = i > 0 ? text[i - 1] : '';

            if (inSingle) {
                if (ch === '\'' && prev !== '\\') inSingle = false;
                continue;
            }

            if (inVerbatim) {
                if (ch === '"' && text[i + 1] === '"') {
                    i--;
                    continue;
                }
                if (ch === '"') inVerbatim = false;
                continue;
            }

            if (inDouble) {
                if (ch === '"' && prev !== '\\') inDouble = false;
                continue;
            }

            if (ch === '\'') {
                inSingle = true;
                continue;
            }

            if (ch === '"' && prev === '@') {
                inVerbatim = true;
                i--;
                continue;
            }

            if (ch === '"') {
                inDouble = true;
                continue;
            }

            if (ch === ')') {
                depth++;
                continue;
            }
            if (ch === '(') {
                depth--;
                if (depth === 0) return i;
            }
        }

        return -1;
    }

    function countTopLevelArgs(argsText) {
        const text = normalizeText(argsText);
        let segmentHasNonWs = false;
        let argc = 0;

        let depthParen = 0;
        let depthBrace = 0;
        let depthBracket = 0;
        let inSingle = false;
        let inDouble = false;
        let inVerbatim = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const prev = i > 0 ? text[i - 1] : '';

            if (inSingle) {
                if (ch === '\'' && prev !== '\\') inSingle = false;
                segmentHasNonWs = true;
                continue;
            }

            if (inVerbatim) {
                if (ch === '"' && text[i + 1] === '"') {
                    segmentHasNonWs = true;
                    i++;
                    continue;
                }
                if (ch === '"') inVerbatim = false;
                segmentHasNonWs = true;
                continue;
            }

            if (inDouble) {
                if (ch === '"' && prev !== '\\') inDouble = false;
                segmentHasNonWs = true;
                continue;
            }

            if (ch === '\'') {
                inSingle = true;
                segmentHasNonWs = true;
                continue;
            }

            if (ch === '"' && prev === '@') {
                inVerbatim = true;
                segmentHasNonWs = true;
                continue;
            }

            if (ch === '"') {
                inDouble = true;
                segmentHasNonWs = true;
                continue;
            }

            if (ch === '(') depthParen++;
            else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
            else if (ch === '{') depthBrace++;
            else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
            else if (ch === '[') depthBracket++;
            else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

            const topLevel = depthParen === 0 && depthBrace === 0 && depthBracket === 0;
            if (topLevel && ch === ',') {
                if (segmentHasNonWs) argc++;
                segmentHasNonWs = false;
                continue;
            }

            if (!/\s/.test(ch)) segmentHasNonWs = true;
        }

        if (segmentHasNonWs) argc++;
        return argc;
    }

    function scoreItemAgainstQuery(item, queryTokens) {
        const weight = Number.isFinite(item && item.weight) ? item.weight : 1;
        const itemKeywords = Array.isArray(item && item.keywords) ? item.keywords : [];
        const itemAliases = Array.isArray(item && item.aliases) ? item.aliases : [];

        const haystackTokens = []
            .concat(itemKeywords.flatMap(tokenizeQuery))
            .concat(itemAliases.flatMap(tokenizeQuery));

        let score = 0;
        queryTokens.forEach((qt) => {
            haystackTokens.forEach((ht) => {
                if (qt === ht) score += 10;
                else if (ht && qt && (ht.includes(qt) || qt.includes(ht))) score += 2;
            });
        });

        if (score <= 0) return 0;
        return score * (1 + Math.max(0, weight));
    }

    return {
        normalizeText,
        tokenizeQuery,
        parseInlineMemberAccessCall,
        sanitizeExternalUrl,
        recommendFromCollections
    };
}));
