/* global KnowledgeCore, KnowledgeCSharp, TreeSitter */
'use strict';

importScripts('knowledge-core.js');
importScripts('knowledge-csharp.js');
// Load Tree-sitter runtime in a classic worker (no module / no import.meta).
// The upstream package provides ESM (`web-tree-sitter.js`) and CJS (`web-tree-sitter.commonjs.js`).
// `importScripts` can't execute ESM, so we emulate a minimal CommonJS environment.
var module = { exports: {} };
var exports = module.exports;
importScripts('vendor/web-tree-sitter.commonjs.js');
self.TreeSitter = module.exports;

let cachedCollectionsPromise = null;
let cachedMapPromise = null;
let cachedApiIndexPromise = null;
let cachedCSharpParserPromise = null;

function fetchJson(relativeUrlFromWorker) {
    const url = new URL(relativeUrlFromWorker, self.location.href).toString();
    return fetch(url, { cache: 'no-cache' }).then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
        return res.json();
    });
}

function loadCollections() {
    if (!cachedCollectionsPromise) {
        cachedCollectionsPromise = fetchJson('../knowledge/collections.v1.json').catch(() => null);
    }
    return cachedCollectionsPromise;
}

function loadMap() {
    if (!cachedMapPromise) {
        cachedMapPromise = (async () => {
            const root = await fetchJson('../knowledge/map.v1.json').catch(() => null);
            if (!root || !Array.isArray(root.parts) || root.parts.length === 0) return root;

            const parts = await Promise.all(root.parts.map((p) => {
                if (!p || typeof p.path !== 'string') return Promise.resolve(null);
                return fetchJson('../knowledge/' + p.path.replace(/^\.\//, '').replace(/^knowledge\//, ''))
                    .catch(() => null);
            }));

            const merged = { ...root };
            delete merged.parts;
            parts.filter(Boolean).forEach((partDoc) => {
                mergeInto(merged, partDoc);
            });
            return merged;
        })();
    }
    return cachedMapPromise;
}

function mergeInto(target, source) {
    if (!target || !source) return;
    Object.keys(source).forEach((key) => {
        const sv = source[key];
        const tv = target[key];

        if (Array.isArray(sv)) {
            if (!Array.isArray(tv)) target[key] = sv.slice();
            else target[key] = tv.concat(sv);
            return;
        }

        if (sv && typeof sv === 'object') {
            if (!tv || typeof tv !== 'object' || Array.isArray(tv)) {
                target[key] = Array.isArray(sv) ? sv.slice() : { ...sv };
                return;
            }
            mergeInto(tv, sv);
            return;
        }

        target[key] = sv;
    });
}

function loadApiIndex(mapDoc) {
    if (!mapDoc || !mapDoc.tmodloaderApi || !mapDoc.tmodloaderApi.indexPath) return Promise.resolve(null);
    if (cachedApiIndexPromise) return cachedApiIndexPromise;

    const root = new URL('../../', self.location.href);
    const indexUrl = new URL(String(mapDoc.tmodloaderApi.indexPath).replace(/^\//, ''), root).toString();
    cachedApiIndexPromise = fetch(indexUrl, { cache: 'no-cache' })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
    return cachedApiIndexPromise;
}

function ensureCSharpParser() {
    if (cachedCSharpParserPromise) return cachedCSharpParserPromise;

    cachedCSharpParserPromise = (async () => {
        if (!self.TreeSitter || !self.TreeSitter.Parser || !self.TreeSitter.Language) return null;

        const runtimeWasm = new URL('vendor/web-tree-sitter.wasm', self.location.href).toString();
        await self.TreeSitter.Parser.init({
            locateFile() {
                return runtimeWasm;
            }
        });

        const csharpWasm = new URL('../wasm/tree-sitter-c_sharp.wasm', self.location.href).toString();
        const CSharp = await self.TreeSitter.Language.load(csharpWasm);

        const parser = new self.TreeSitter.Parser();
        parser.setLanguage(CSharp);
        return { parser };
    })().catch(() => null);

    return cachedCSharpParserPromise;
}

function parseCSharpWithWrapping(parser, code, options) {
    if (!parser || !code || !KnowledgeCSharp || typeof KnowledgeCSharp.makeWrapCandidates !== 'function') return null;
    const candidates = KnowledgeCSharp.makeWrapCandidates(code, options);
    if (!Array.isArray(candidates) || !candidates.length) return null;

    let best = null;
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const tree = parser.parse(candidate.source);
        const hasError = !!(tree && tree.rootNode && tree.rootNode.hasError);
        if (!best) best = { candidate, tree, hasError };
        if (!hasError) return { candidate, tree, hasError: false };
    }
    return best;
}

function computeLineStarts(text) {
    const starts = [0];
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

function findLineIndex(lineStarts, offset) {
    if (!Array.isArray(lineStarts) || !lineStarts.length) return 0;
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const start = lineStarts[mid];
        const next = mid + 1 < lineStarts.length ? lineStarts[mid + 1] : Infinity;
        if (offset < start) hi = mid - 1;
        else if (offset >= next) lo = mid + 1;
        else return mid;
    }
    return Math.max(0, Math.min(lineStarts.length - 1, lo));
}

function tryParseClosestSnippet(parser, fullText, offsetStart, offsetEnd) {
    const source = String(fullText || '');
    if (!source) return null;
    if (!Number.isFinite(offsetStart) || !Number.isFinite(offsetEnd)) return null;

    const lineStarts = computeLineStarts(source);
    const lineIndex = findLineIndex(lineStarts, Math.max(0, offsetStart));
    const maxExpand = 10;

    for (let expand = 0; expand <= maxExpand; expand++) {
        const startLine = Math.max(0, lineIndex - expand);
        const endLine = Math.min(lineStarts.length - 1, lineIndex + expand);
        const snippetStart = lineStarts[startLine];
        const snippetEnd = endLine + 1 < lineStarts.length ? lineStarts[endLine + 1] : source.length;
        const snippet = source.slice(snippetStart, snippetEnd);

        const parseResult = parseCSharpWithWrapping(parser, snippet, { allowAppendSemicolon: true });
        if (parseResult && !parseResult.hasError) {
            return {
                ...parseResult,
                snippetStart,
                snippet
            };
        }
    }

    return null;
}

function sliceNodeText(source, node) {
    if (!source || !node) return '';
    return String(source).slice(node.startIndex, node.endIndex);
}

function findAncestorOfType(node, type, maxSteps) {
    let current = node;
    let steps = 0;
    while (current && steps < (Number.isFinite(maxSteps) ? maxSteps : 40)) {
        if (current.type === type) return current;
        current = current.parent;
        steps++;
    }
    return null;
}

function countArgsFromInvocation(invocationNode) {
    if (!invocationNode || typeof invocationNode.childForFieldName !== 'function') return null;
    const argsNode = invocationNode.childForFieldName('arguments');
    if (!argsNode) return 0;
    return argsNode.namedChildCount || 0;
}

function inferDeclaringTypeHintFromReceiverText(receiverText) {
    const raw = String(receiverText || '').replace(/\s+/g, '');
    if (!raw) return null;

    const withoutIndices = raw.replace(/\[[^\]]*\]/g, '[]');

    if (withoutIndices === 'Terraria.Main' || withoutIndices === 'Main') return 'Terraria.Main';
    if (withoutIndices === 'Terraria.Player' || withoutIndices === 'Player') return 'Terraria.Player';
    if (withoutIndices === 'Terraria.NPC' || withoutIndices === 'NPC') return 'Terraria.NPC';

    if (withoutIndices.startsWith('Terraria.Main.')) return 'Terraria.Main';
    if (withoutIndices.startsWith('Terraria.Player.')) return 'Terraria.Player';
    if (withoutIndices.startsWith('Terraria.NPC.')) return 'Terraria.NPC';

    if (withoutIndices.startsWith('Main.LocalPlayer')) return 'Terraria.Player';
    if (withoutIndices.startsWith('Main.player')) return 'Terraria.Player';
    if (withoutIndices.startsWith('Main.npc')) return 'Terraria.NPC';

    const parts = withoutIndices.split('.').filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : '';
    const lower = last.toLowerCase();
    if (lower === 'main') return 'Terraria.Main';
    if (lower === 'player') return 'Terraria.Player';
    if (lower === 'npc') return 'Terraria.NPC';

    return null;
}

const MODLOADER_SHORT_TYPE_MAP = {
    'mod': 'Terraria.ModLoader.Mod',
    'moditem': 'Terraria.ModLoader.ModItem',
    'modprojectile': 'Terraria.ModLoader.ModProjectile',
    'modnpc': 'Terraria.ModLoader.ModNPC',
    'modtile': 'Terraria.ModLoader.ModTile',
    'modplayer': 'Terraria.ModLoader.ModPlayer',
    'modsystem': 'Terraria.ModLoader.ModSystem'
};

function inferDeclaringTypeHintFromTypeText(typeText) {
    const raw = String(typeText || '').trim();
    if (!raw) return null;

    const normalized = raw.replace(/\s+/g, '');
    const lower = normalized.toLowerCase();
    if (MODLOADER_SHORT_TYPE_MAP[lower]) return MODLOADER_SHORT_TYPE_MAP[lower];
    if (normalized.startsWith('Terraria.ModLoader.')) return normalized;
    return null;
}

function findNamedChildOfType(node, type) {
    if (!node || !type) return null;
    if (!Array.isArray(node.namedChildren)) return null;
    for (let i = 0; i < node.namedChildren.length; i++) {
        const child = node.namedChildren[i];
        if (child && child.type === type) return child;
    }
    return null;
}

function inferDeclaringTypeFromContainingType(methodNode, source) {
    const typeNode = findAncestorOfType(methodNode, 'class_declaration', 120)
        || findAncestorOfType(methodNode, 'struct_declaration', 120)
        || findAncestorOfType(methodNode, 'record_declaration', 120);
    if (!typeNode) return null;

    const baseList = findNamedChildOfType(typeNode, 'base_list');
    if (!baseList || !Array.isArray(baseList.namedChildren)) return null;

    for (let i = 0; i < baseList.namedChildren.length; i++) {
        const baseTypeNode = baseList.namedChildren[i];
        const baseText = sliceNodeText(source, baseTypeNode).trim();
        const declaringType = inferDeclaringTypeHintFromTypeText(baseText);
        if (declaringType) return declaringType;
    }

    return null;
}

function extractApiRouteFromMethodDeclaration(node, source) {
    const methodNode = findAncestorOfType(node, 'method_declaration', 120);
    if (!methodNode || typeof methodNode.childForFieldName !== 'function') return null;
    const nameNode = methodNode.childForFieldName('name');
    if (!nameNode) return null;
    const methodName = sliceNodeText(source, nameNode).trim();
    if (!methodName) return null;

    const declaringType = inferDeclaringTypeFromContainingType(methodNode, source);
    if (!declaringType) return null;

    return {
        declaringType,
        memberKind: 'method',
        name: methodName,
        argc: null
    };
}

function extractApiRouteFromInvocation(invocationNode, source) {
    if (!invocationNode || typeof invocationNode.childForFieldName !== 'function') return null;
    const fn = invocationNode.childForFieldName('function');
    if (!fn || fn.type !== 'member_access_expression' || typeof fn.childForFieldName !== 'function') return null;

    const nameNode = fn.childForFieldName('name');
    const exprNode = fn.childForFieldName('expression');
    if (!nameNode) return null;

    const memberName = sliceNodeText(source, nameNode).trim();
    if (!memberName) return null;

    const receiverText = exprNode ? sliceNodeText(source, exprNode) : '';
    const declaringTypeHint = inferDeclaringTypeHintFromReceiverText(receiverText);
    const argc = countArgsFromInvocation(invocationNode);

    return {
        declaringType: declaringTypeHint,
        memberKind: 'method',
        name: memberName,
        argc: Number.isFinite(argc) ? argc : null
    };
}

function extractMemberAccessName(memberAccessNode, source) {
    if (!memberAccessNode || memberAccessNode.type !== 'member_access_expression') return null;
    if (typeof memberAccessNode.childForFieldName !== 'function') return null;
    const nameNode = memberAccessNode.childForFieldName('name');
    if (!nameNode) return null;
    const name = sliceNodeText(source, nameNode).trim();
    if (!name) return null;
    const exprNode = memberAccessNode.childForFieldName('expression');
    const receiverText = exprNode ? sliceNodeText(source, exprNode) : '';
    return {
        declaringType: inferDeclaringTypeHintFromReceiverText(receiverText),
        name
    };
}

function extractApiRouteFromElementAccess(elementAccessNode, source) {
    if (!elementAccessNode || elementAccessNode.type !== 'element_access_expression') return null;
    if (typeof elementAccessNode.childForFieldName !== 'function') return null;
    const exprNode = elementAccessNode.childForFieldName('expression');
    if (!exprNode) return null;

    if (exprNode.type === 'member_access_expression') {
        const access = extractMemberAccessName(exprNode, source);
        if (access && access.name) {
            return {
                declaringType: access.declaringType,
                memberKind: 'field',
                name: access.name
            };
        }
    }

    return null;
}

function findArrayishAncestor(node) {
    const candidates = [
        'array_type',
        'array_creation_expression',
        'implicit_array_creation_expression',
        'stackalloc_expression'
    ];
    for (let i = 0; i < candidates.length; i++) {
        const hit = findAncestorOfType(node, candidates[i], 80);
        if (hit) return hit;
    }
    return null;
}

function resolveConceptFromMap(mapDoc, route) {
    if (!mapDoc || !mapDoc.tmodloaderApi || !Array.isArray(mapDoc.tmodloaderApi.routes)) return null;
    const routes = mapDoc.tmodloaderApi.routes;
    for (let i = 0; i < routes.length; i++) {
        const r = routes[i];
        if (
            r &&
            r.declaringType === route.declaringType &&
            r.memberKind === route.memberKind &&
            r.name === route.name &&
            typeof r.conceptId === 'string'
        ) {
            return r.conceptId;
        }
    }
    return null;
}

function resolveConceptByLexeme(mapDoc, lexeme) {
    if (!mapDoc || !mapDoc.lexemes || typeof mapDoc.lexemes !== 'object') return null;
    const key = String(lexeme || '').trim().toLowerCase();
    if (!key) return null;
    const conceptId = mapDoc.lexemes[key];
    return typeof conceptId === 'string' ? conceptId : null;
}

function buildSignatures(apiIndex, route) {
    if (!apiIndex || !apiIndex.types || !route || !route.declaringType) return [];
    const typeNode = apiIndex.types[route.declaringType];
    if (!typeNode) return [];

    const kindKey = route.memberKind === 'method' ? 'methods'
        : route.memberKind === 'field' ? 'fields'
        : route.memberKind === 'property' ? 'properties'
        : null;
    if (!kindKey) return [];

    const members = typeNode[kindKey];
    if (!members) return [];
    const overloads = members[route.name];
    if (!Array.isArray(overloads) || !overloads.length) return [];

    return overloads
        .slice(0, 3)
        .map((o) => (o && o.signature ? String(o.signature) : null))
        .filter(Boolean);
}

function buildRecommendations(collectionsDoc, concept, queryText) {
    const all = KnowledgeCore.recommendFromCollections(collectionsDoc, queryText, { topN: 24 });
    const limited = Array.isArray(all) ? all.slice(0, 24) : [];

    if (!concept || !concept.collections || !Array.isArray(concept.collections) || !concept.collections.length) {
        return limited.slice(0, 3);
    }

    const boosts = new Map();
    concept.collections.forEach((c) => {
        if (typeof c === 'string') boosts.set(c, 0);
        else if (c && typeof c.id === 'string') boosts.set(c.id, Number.isFinite(c.boost) ? c.boost : 0);
    });

    const filtered = limited
        .filter((item) => boosts.has(item.collectionId))
        .map((item) => ({
            ...item,
            _kcBoostedScore: item.score * (1 + Math.max(0, boosts.get(item.collectionId) || 0))
        }));

    filtered.sort((a, b) => {
        if (b._kcBoostedScore !== a._kcBoostedScore) return b._kcBoostedScore - a._kcBoostedScore;
        return (b.score || 0) - (a.score || 0);
    });

    if (filtered.length) return filtered.slice(0, 3);
    return limited.slice(0, 3);
}

self.onmessage = async function (event) {
    const msg = event && event.data ? event.data : null;
    if (!msg || !msg.type) return;

    if (msg.type === 'detectCSharp') {
        try {
            const code = String(msg.code || '');
            if (!code.trim()) {
                self.postMessage({ type: 'detectCSharpResult', requestId: msg.requestId, ok: false });
                return;
            }

            const parserCtx = await ensureCSharpParser();
            if (!parserCtx || !parserCtx.parser) {
                self.postMessage({ type: 'detectCSharpResult', requestId: msg.requestId, ok: false });
                return;
            }

            const parseResult = parseCSharpWithWrapping(parserCtx.parser, code, { allowAppendSemicolon: true });
            self.postMessage({
                type: 'detectCSharpResult',
                requestId: msg.requestId,
                ok: !!(parseResult && !parseResult.hasError)
            });
        } catch (e) {
            self.postMessage({ type: 'detectCSharpResult', requestId: msg.requestId, ok: false });
        }
        return;
    }

    if (msg.type === 'analyze') {
        try {
            const kind = msg.kind;
            const clickedText = String(msg.clickedText || '');

            let ok = false;
            let queryText = clickedText;
            let apiRoute = null;
            let syntax = null;

            if (kind === 'inline') {
                const parserCtx = await ensureCSharpParser();
                if (parserCtx && parserCtx.parser) {
                    const parseResult = parseCSharpWithWrapping(parserCtx.parser, clickedText, { allowAppendSemicolon: true });
                    if (parseResult && !parseResult.hasError) {
                        const { candidate, tree } = parseResult;
                        const start = candidate.offsetDelta;
                        const end = start + String(clickedText).replace(/\s+$/g, '').length;
                        const probe = tree.rootNode.namedDescendantForIndex(start, Math.max(start, end - 1));
                        const invocation = findAncestorOfType(probe, 'invocation_expression', 60);
                        const route = invocation ? extractApiRouteFromInvocation(invocation, candidate.source) : null;

                        if (route && route.memberKind === 'method' && route.name) {
                            ok = true;
                            queryText = route.name;
                            apiRoute = route;
                            syntax = { kind: 'invocation', name: route.name };
                        } else {
                            const elementAccess = findAncestorOfType(probe, 'element_access_expression', 80);
                            if (elementAccess) {
                                ok = true;
                                queryText = 'indexer';
                                apiRoute = extractApiRouteFromElementAccess(elementAccess, candidate.source);
                                syntax = { kind: 'elementAccess' };
                            } else if (findArrayishAncestor(probe)) {
                                ok = true;
                                queryText = 'array';
                                syntax = { kind: 'array' };
                            }

                            const memberAccess = findAncestorOfType(probe, 'member_access_expression', 40);
                            const access = memberAccess ? extractMemberAccessName(memberAccess, candidate.source) : null;
                            if (access && access.name) {
                                ok = true;
                                queryText = access.name;
                                apiRoute = {
                                    declaringType: access.declaringType,
                                    memberKind: 'property',
                                    name: access.name
                                };
                                syntax = { kind: 'memberAccess', name: access.name };
                            }
                        }
                    }
                }
            } else if (kind === 'blockToken') {
                const blockCode = String(msg.blockCode || '');
                const tokenText = String(msg.tokenText || '').trim();
                const offsetStart = Number.isFinite(msg.blockOffsetStart) ? msg.blockOffsetStart : null;
                const offsetEnd = Number.isFinite(msg.blockOffsetEnd) ? msg.blockOffsetEnd : null;

                if (tokenText && blockCode && offsetStart != null && offsetEnd != null) {
                    const parserCtx = await ensureCSharpParser();
                    if (parserCtx && parserCtx.parser) {
                        let parseResult = parseCSharpWithWrapping(parserCtx.parser, blockCode);
                        let snippetStart = 0;
                        if (!parseResult || parseResult.hasError) {
                            const local = tryParseClosestSnippet(parserCtx.parser, blockCode, offsetStart, offsetEnd);
                            if (local) {
                                parseResult = local;
                                snippetStart = local.snippetStart || 0;
                            }
                        }

                        if (parseResult && !parseResult.hasError) {
                            const { candidate, tree } = parseResult;

                            const innerLen = candidate.source.length - candidate.offsetDelta - String(candidate.suffix || '').length;
                            const relStart = Math.max(0, Math.min(innerLen, Math.max(0, offsetStart - snippetStart)));
                            const relEnd = Math.max(relStart, Math.min(innerLen, Math.max(0, offsetEnd - snippetStart)));
                            const start = candidate.offsetDelta + relStart;
                            const end = candidate.offsetDelta + relEnd;

                            const node = tree.rootNode.namedDescendantForIndex(start, Math.max(start, end - 1));
                            if (node) {
                                const nodeText = sliceNodeText(candidate.source, node).trim();
                                if (nodeText) {
                                    ok = true;
                                    queryText = nodeText;
                                    syntax = { kind: 'node', type: node.type };

                                    const invocation = findAncestorOfType(node, 'invocation_expression', 80);
                                    const route = invocation ? extractApiRouteFromInvocation(invocation, candidate.source) : null;
                                    if (route && route.declaringType && route.name) {
                                        apiRoute = route;
                                        queryText = route.name;
                                        syntax = { kind: 'invocation', name: route.name };
                                    } else {
                                        const memberAccess = findAncestorOfType(node, 'member_access_expression', 40);
                                        const access = memberAccess ? extractMemberAccessName(memberAccess, candidate.source) : null;
                                        if (access && access.name) {
                                            apiRoute = {
                                                declaringType: access.declaringType,
                                                memberKind: 'property',
                                                name: access.name
                                            };
                                            queryText = access.name;
                                            syntax = { kind: 'memberAccess', name: access.name };
                                        } else {
                                            const elementAccess = findAncestorOfType(node, 'element_access_expression', 80);
                                            if (elementAccess) {
                                                apiRoute = extractApiRouteFromElementAccess(elementAccess, candidate.source);
                                                queryText = 'indexer';
                                                syntax = { kind: 'elementAccess' };
                                    } else if (findArrayishAncestor(node)) {
                                        queryText = 'array';
                                        syntax = { kind: 'array' };
                                    }
                                }
                            }

                            if (!apiRoute) {
                                const declRoute = extractApiRouteFromMethodDeclaration(node, candidate.source);
                                if (declRoute && declRoute.declaringType && declRoute.name) {
                                    apiRoute = declRoute;
                                    queryText = declRoute.name;
                                    syntax = { kind: 'declaration', name: declRoute.name };
                                }
                            }
                        }
                    }
                }
            }
                }
            }

            if (!ok) {
                self.postMessage({ type: 'analyzeResult', requestId: msg.requestId, ok: false });
                return;
            }

            const [collectionsDoc, mapDoc] = await Promise.all([loadCollections(), loadMap()]);
            let conceptId = apiRoute ? resolveConceptFromMap(mapDoc, apiRoute) : null;
            if (!conceptId && apiRoute && apiRoute.memberKind === 'property') {
                const fallbackField = { ...apiRoute, memberKind: 'field' };
                conceptId = resolveConceptFromMap(mapDoc, fallbackField);
            } else if (!conceptId && apiRoute && apiRoute.memberKind === 'field') {
                const fallbackProp = { ...apiRoute, memberKind: 'property' };
                conceptId = resolveConceptFromMap(mapDoc, fallbackProp);
            }
            if (!conceptId) {
                conceptId = resolveConceptByLexeme(mapDoc, queryText);
            }
            const concept = conceptId && mapDoc && mapDoc.concepts ? mapDoc.concepts[conceptId] : null;

            const apiIndex = await loadApiIndex(mapDoc);
            let signatures = apiRoute ? buildSignatures(apiIndex, apiRoute) : [];
            if (apiRoute && signatures.length === 0 && (apiRoute.memberKind === 'field' || apiRoute.memberKind === 'property')) {
                const fallbackKind = apiRoute.memberKind === 'field' ? 'property' : 'field';
                signatures = buildSignatures(apiIndex, { ...apiRoute, memberKind: fallbackKind });
            }

            const recommendations = collectionsDoc
                ? buildRecommendations(collectionsDoc, concept, queryText)
                : [];

            self.postMessage({
                type: 'analyzeResult',
                requestId: msg.requestId,
                ok: true,
                model: {
                    clickedText: clickedText,
                    queryText: queryText,
                    conceptTitle: concept && concept.title ? String(concept.title) : null,
                    notes: concept && Array.isArray(concept.notes) ? concept.notes.map(String) : [],
                    signatures: signatures,
                    recommendations: Array.isArray(recommendations) ? recommendations : [],
                    syntax: syntax
                }
            });
        } catch (e) {
            self.postMessage({ type: 'analyzeResult', requestId: msg.requestId, ok: false });
        }
        return;
    }
};
