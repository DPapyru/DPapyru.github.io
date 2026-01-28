// bm25-lookup.js - BM25 + (CJK 2/3-gram) + 哈希 bucket 倒排索引（纯静态，引用式回答）
// UMD wrapper: usable in browser (window.Bm25LookupEngine) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.Bm25LookupEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    function fnv1a32(str) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return hash >>> 0;
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function decodeBase64ToUint32Array(base64) {
        const bytes = base64ToUint8Array(base64);
        return new Uint32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
    }

    function decodeBase64ToUint16Array(base64) {
        const bytes = base64ToUint8Array(base64);
        return new Uint16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    }

    function extractBm25Tokens(text) {
        const lower = String(text || '').toLowerCase();
        const tokens = [];

        const latin = lower.match(/[a-z0-9_\.#+-]+/g) || [];
        for (const t of latin) {
            if (t.length >= 2) tokens.push(t);
        }

        const cjk = lower.match(/[\u4e00-\u9fff]/g) || [];
        if (cjk.length >= 2) {
            for (let i = 0; i + 1 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1]); // bigram
        }
        if (cjk.length >= 3) {
            for (let i = 0; i + 2 < cjk.length; i++) tokens.push(cjk[i] + cjk[i + 1] + cjk[i + 2]); // trigram
        }

        return tokens;
    }

    function buildStopwordSet() {
        // 常见问句功能词/虚词：用于减少“怎么/如何/怎么办”类噪声
        const list = [
            '怎么', '如何', '什么', '为啥', '为什么', '能否', '是否', '可以', '可不', '能不', '要不', '怎么做', '如何做',
            '怎么办', '怎么弄', '如何弄', '我想', '我要', '请问', '能不能', '可不可以', '可以吗', '行不行', '有没有', '有没有人',
            '一下', '一下子', '这', '那个', '这个', '那', '呢', '吗', '呀', '啊'
        ];
        const set = new Set();
        for (const s of list) set.add(s.toLowerCase());
        return set;
    }

    const STOPWORDS = buildStopwordSet();

    const MOD_NAME_RULES = [
        { name: 'calamity', pattern: /灾厄|calamity|calamitymod/i }
    ];

    function detectModInfo(lower) {
        const names = [];
        const patterns = [];
        for (const rule of MOD_NAME_RULES) {
            if (!rule || !rule.pattern) continue;
            if (rule.pattern.test(lower)) {
                names.push(rule.name);
                patterns.push(rule.pattern);
            }
        }
        return { names, patterns };
    }

    function stripByPatterns(text, patterns) {
        let out = String(text || '');
        for (const p of patterns || []) {
            if (!p) continue;
            const flags = p.flags.includes('g') ? p.flags : `${p.flags}g`;
            const re = new RegExp(p.source, flags);
            out = out.replace(re, ' ');
        }
        return out.replace(/\s+/g, ' ').trim();
    }

    function stripQuestionWords(query) {
        let q = String(query || '').toLowerCase();
        q = q.replace(/[?？!！。，、,:：;；"“”'‘’（）()\[\]{}<>]/g, ' ');
        q = q.replace(/\s+/g, ' ').trim();

        // 先处理多字短语，避免被拆散
        const phrases = [
            '可不可以', '能不能', '有没有', '怎么做', '如何做', '怎么办', '怎么弄', '如何弄', '请问', '我想', '我要'
        ];
        for (const p of phrases) q = q.split(p).join(' ');
        for (const w of ['怎么', '如何', '什么', '为什么', '为啥', '能否', '是否', '可以', '吗', '呢', '呀', '啊']) {
            q = q.split(w).join(' ');
        }
        q = q.replace(/\s+/g, ' ').trim();
        return q;
    }

    function extractKeyTerms(query) {
        // 用于“硬过滤”明显不相关结果：优先抓住查询里的实体词（通常是末尾名词）
        const cleaned = stripQuestionWords(query);
        const cjkSeq = cleaned.match(/[\u4e00-\u9fff]{2,}/g) || [];
        const keyTerms = [];

        for (const s of cjkSeq) {
            if (s.length >= 2) keyTerms.push(s);
            if (s.length >= 4) keyTerms.push(s.slice(-4));
            if (s.length >= 3) keyTerms.push(s.slice(-3));
            keyTerms.push(s.slice(-2));
        }

        // 去重并去掉明显停用词
        const out = [];
        const seen = new Set();
        for (const t of keyTerms) {
            const term = String(t || '').trim();
            if (!term || term.length < 2) continue;
            if (STOPWORDS.has(term)) continue;
            if (seen.has(term)) continue;
            seen.add(term);
            out.push(term);
        }

        return out.slice(0, 8);
    }

    function expandKeyTermSynonyms(term) {
        // 极小同义词扩展：先覆盖最核心的新手高频概念
        const t = String(term || '').toLowerCase();
        if (!t) return [t];

        const table = {
            '联动': ['联动', '兼容', '跨模组', 'cross mod', 'cross-mod', 'compat', 'compatibility', 'interop', 'interoperability', 'mod call', 'modcall', 'weak references', 'weakreferences'],
            '兼容': ['兼容', '联动', '跨模组', 'cross mod', 'cross-mod', 'compat', 'compatibility', 'interop', 'interoperability', 'mod call', 'modcall', 'weak references', 'weakreferences'],
            '跨模组': ['跨模组', '联动', '兼容', 'cross mod', 'cross-mod', 'compat', 'compatibility', 'interop', 'interoperability', 'mod call', 'modcall', 'weak references', 'weakreferences'],
            '补丁': ['补丁', 'patch', 'patching', 'monomod', 'patching other mods'],
            '灾厄': ['灾厄', 'calamity', 'calamitymod'],
            '物品': ['物品', 'item', 'moditem', 'setdefaults'],
            '武器': ['武器', 'weapon', 'shoot'],
            '弹幕': ['弹幕', 'projectile', 'modprojectile'],
            '入门': ['入门', '从这里开始', '学习路线', '前言', 'modder入门'],
            '合成': ['合成', '配方', 'recipe', 'addrecipes', 'addrecipe'],
            '贴图': ['贴图', '纹理', 'texture', 'sprite'],
            '报错': ['报错', '异常', 'exception', 'stacktrace', 'nullreference']
        };

        for (const k of Object.keys(table)) {
            if (t.includes(k)) return table[k].map(x => x.toLowerCase());
        }
        return [t];
    }

    function classifyQuery(query) {
        const raw = String(query || '').trim();
        const lower = raw.toLowerCase();
        const modInfo = detectModInfo(lower);
        const cleaned = stripQuestionWords(lower);

        const flags = {
            hasMod: /mod|tmod|tmodloader|tml/.test(lower) || /模组|mod/.test(lower),
            hasCsharp: /c#|csharp|\.net/.test(lower) || /c#|csharp|语言|语法|基础/.test(lower),
            hasOtherLang: /别的语言|其他语言|会(.*)语言|有(.*)经验|python|java|js|javascript|lua|c\+\+|cpp/.test(lower),
            hasNpc: /npc/.test(lower) || /npc|怪|敌怪|小怪|boss|脱战|售卖|商店|商人/.test(lower),
            hasProjectile: /projectile|弹幕|回旋镖/.test(lower),
            hasWeapon: /weapon|武器|挥舞|刀光/.test(lower),
            hasItem: /item|物品|材料/.test(lower),
            // 注意：不要仅因为“怎么办”就判定为排错（例如“我要入门怎么办”）。需要更明确的失败/异常信号。
            hasTrouble: /报错|异常|崩溃|闪退|卡死|不生效|没效果|突然|消失|解决|怎么修|怎么排查|修复|排错|bug/.test(lower)
                || /(不|没)(脱战|生效|效果|工作|显示|触发|刷新|生成|攻击|掉落|消失)/.test(lower)
                || /exception|stacktrace|nullreference|error|crash/.test(lower),
            hasIntro: /入门|从零|新手|开始|路线|先学|学什么|不会|玩家|好奇/.test(lower),
            hasConcept: /原理|机制|概念|本质|为什么|为何|区别|差别|流程|生命周期|怎么运作|如何运作|底层/.test(lower),
            hasHowTo: /怎么|如何|实现|做|写|添加|让|制作|创建/.test(lower),
            hasMeta: /引用|索引|目录|搜索|查找|阅读|文章使用内容索引/.test(lower),
            hasCrossMod: /联动|兼容|兼容性|跨模组|跨mod|cross[- ]?mod|crossmod|compat|compatibility|interop|interoperability|mod call|modcall|modreferences|weak references|weakreferences|补丁|patching|patch/.test(lower),
            hasAdvanced: /源码|源代码|il\b|il编辑|il edit|detour|detouring|hook|hookendpointmanager|monomod|反编译|补丁|patching|patch/.test(lower),
            hasModName: modInfo.names.length > 0
        };

        if (flags.hasModName) flags.hasMod = true;

	        // Intent priority: troubleshooting > meta > intro > concept > howto > unknown
	        let intent = 'unknown';
	        if (flags.hasTrouble) intent = 'troubleshoot';
	        else if (flags.hasMeta) intent = 'meta';
            else if (flags.hasCrossMod) intent = 'crossmod';
	        else if (flags.hasIntro) intent = 'intro';
	        else if (flags.hasConcept) intent = 'concept';
	        else if (flags.hasHowTo) intent = 'howto';

        const entities = new Set();
        if (flags.hasItem) entities.add('item');
        if (flags.hasWeapon) entities.add('weapon');
        if (flags.hasProjectile) entities.add('projectile');
        if (flags.hasNpc) entities.add('npc');
        if (flags.hasCsharp) entities.add('csharp');
        if (flags.hasOtherLang) entities.add('otherlang');

        // Category-level multipliers (tunable, keep simple)
        const categoryMultiplier = {};
        const pathMultiplier = [];
        const tokenHints = [];

	        const penalizeContrib = 0.22;
	        const penalizeMeta = 0.55;

	        if (intent === 'meta') {
	            categoryMultiplier['Modder入门'] = 1.35;
	            categoryMultiplier['怎么贡献'] = penalizeContrib;
	            // “索引/引用/目录/搜索”类：主动引导到内容索引文档
	            pathMultiplier.push({ pattern: /文章使用内容索引/i, mult: 2.1 });
	            pathMultiplier.push({ pattern: /怎么贡献/i, mult: penalizeContrib });
        } else if (intent === 'intro') {
            categoryMultiplier['Modder入门'] = 2.2;
            categoryMultiplier['怎么贡献'] = penalizeContrib;
            // “提问/写作”偏元内容，入门时不应抢占
            pathMultiplier.push({ pattern: /提问|写作指南|教学文章写作指南/i, mult: penalizeMeta });
            pathMultiplier.push({ pattern: /怎么贡献/i, mult: penalizeContrib });
            // 入门优先：先把“从这里开始/推荐学习路径/1-入门”推上来；压制“文章使用内容索引”的导读抢占
            pathMultiplier.push({ pattern: /Modder入门\/1-入门/i, mult: 1.45 });
            pathMultiplier.push({ pattern: /Modder入门\/DPapyru-从这里开始\.md/i, mult: 1.7 });
            pathMultiplier.push({ pattern: /Modder入门\/DPapyru-推荐学习路径\.md/i, mult: 1.6 });
            // 入门问句通常不希望直接落到“文章使用内容索引”的深处
            pathMultiplier.push({ pattern: /文章使用内容索引\//i, mult: 0.28 });
            pathMultiplier.push({ pattern: /文章使用内容索引\/DPapyru-文章使用内容索引-导读\.md/i, mult: 0.28 });
        } else if (intent === 'concept') {
	            // 概念/原理类：提升“概念了解/原理/机制”相关内容，避免元内容抢占
	            categoryMultiplier['概念了解'] = 1.9;
	            categoryMultiplier['怎么贡献'] = penalizeContrib;
	            pathMultiplier.push({ pattern: /概念了解|原理|机制|生命周期|流程|本质|区别|世界观|坐标系|geometry|assets|reflection|polymorphism|logging/i, mult: 1.55 });
	            pathMultiplier.push({ pattern: /提问|写作指南|教学文章写作指南/i, mult: penalizeMeta });
	            pathMultiplier.push({ pattern: /怎么贡献/i, mult: penalizeContrib });
        } else if (intent === 'howto') {
            categoryMultiplier['怎么贡献'] = penalizeContrib;
            pathMultiplier.push({ pattern: /提问|写作指南|教学文章写作指南/i, mult: penalizeMeta });
            pathMultiplier.push({ pattern: /怎么贡献/i, mult: penalizeContrib });
            if (flags.hasWeapon || flags.hasItem) {
                pathMultiplier.push({ pattern: /螺线翻译tml教程\/1-基础\/(1-Basic-Item|4-Basic-Ammo|5-Basic-Projectile)/i, mult: 1.6 });
                if (!flags.hasAdvanced) {
                    pathMultiplier.push({ pattern: /螺线翻译tml教程\/3-高阶|螺线翻译tml教程\/4-专家/i, mult: 0.55 });
                }
            }
	        } else if (intent === 'troubleshoot') {
            // 排错时不强行惩罚“提问”，但仍然轻微压制写作类
            categoryMultiplier['怎么贡献'] = 0.35;
	            pathMultiplier.push({ pattern: /教学文章写作指南/i, mult: 0.35 });
	        }

        if (flags.hasCrossMod) {
            pathMultiplier.push({ pattern: /expert-cross-mod-content|patching-other-mods|detouring-and-il-editing|advanced-detouring|expert-il-editing|weak references|weakreferences|cross[- ]?mod/i, mult: 1.7 });
            pathMultiplier.push({ pattern: /螺线翻译tml教程\/4-专家|螺线翻译tml教程\/3-高阶|螺线翻译tml教程\/杂项\/(detouring|patching)/i, mult: 1.2 });
            tokenHints.push('cross mod');
            tokenHints.push('cross-mod');
            tokenHints.push('mod call');
            tokenHints.push('weak references');
            tokenHints.push('patching other mods');
            tokenHints.push('detouring');
            tokenHints.push('il editing');
        }

	        // 非“索引/引用/目录/搜索”意图时，避免“文章使用内容索引：导读”在各类问题上霸榜
	        if (intent !== 'meta' && intent !== 'intro') {
	            pathMultiplier.push({ pattern: /文章使用内容索引\/DPapyru-文章使用内容索引-导读\.md/i, mult: 0.55 });
	        }

        // C# 前置：优先 CSharp/语言相关索引文档
        if (entities.has('csharp')) {
            pathMultiplier.push({ pattern: /csharp|c#|\.net/i, mult: 1.35 });
        }
        if (entities.has('otherlang')) {
            pathMultiplier.push({ pattern: /csharp|c#|\.net|从零/i, mult: 1.15 });
        }

        // 实作实体：压制明显无关“网页动画模块”
        if (entities.has('item') || entities.has('weapon') || entities.has('projectile') || entities.has('npc')) {
            pathMultiplier.push({ pattern: /网页|动画模块|animts/i, mult: 0.15 });
            // 实作问题优先指向“做法/最小示例”，避免“提问/写作”类元内容抢占
            pathMultiplier.push({ pattern: /提问|写作指南|教学文章写作指南/i, mult: 0.22 });
        }

	        const preferredTemplate = (intent === 'intro') ? 'path' : 'concise';

        // Key term expansion: add entity hints for hard filtering
        const keyHints = [];
        if (entities.has('item')) keyHints.push('物品');
        if (entities.has('weapon')) keyHints.push('武器');
        if (entities.has('projectile')) keyHints.push('弹幕');
        if (entities.has('npc')) keyHints.push('npc');
        if (entities.has('csharp')) keyHints.push('c#');
        if (intent === 'intro') keyHints.push('入门');
        if (intent === 'concept') keyHints.push('原理');

        // Combine with extracted key terms (from raw query)
        let tokenQuery = lower;
        if (flags.hasModName && !flags.hasCrossMod) {
            tokenQuery = stripByPatterns(tokenQuery, modInfo.patterns);
        }
        if (!tokenQuery.trim()) tokenQuery = lower;

        const extracted = extractKeyTerms(tokenQuery);
        for (const t of extracted) keyHints.push(t);

        const uniqueHints = [];
        const seen = new Set();
        for (const h of keyHints) {
            const hh = String(h || '').toLowerCase().trim();
            if (!hh || hh.length < 2) continue;
            if (seen.has(hh)) continue;
            seen.add(hh);
            uniqueHints.push(hh);
        }

        return {
            intent,
            entities: Array.from(entities),
            categoryMultiplier,
            pathMultiplier,
            preferredTemplate,
            keyHints: uniqueHints.slice(0, 10),
            cleaned,
            flags,
            tokenQuery,
            tokenHints
        };
    }

    function countCjkChars(text) {
        const m = String(text || '').match(/[\u4e00-\u9fff]/g);
        return m ? m.length : 0;
    }

    function looksLikeOnlySingleCjk(query) {
        const q = String(query || '').trim();
        if (!q) return false;
        if (q.length === 1 && /[\u4e00-\u9fff]/.test(q)) return true;
        // 例如用户输入两个汉字但仍很短且不包含拉丁 token
        if (countCjkChars(q) <= 2 && !/[a-z0-9_]/i.test(q)) return true;
        return false;
    }

    function Bm25LookupEngine(payload) {
        this.version = payload.version;
        this.bucketCount = payload.bucketCount;
        this.chunkCount = payload.chunkCount;
        this.avgdl = payload.avgdl || 1;
        this.k1 = typeof payload.k1 === 'number' ? payload.k1 : 1.2;
        this.b = typeof payload.b === 'number' ? payload.b : 0.75;

        this.chunks = payload.chunks || [];

        this.dl = decodeBase64ToUint16Array(payload.dlU16);
        this.df = decodeBase64ToUint32Array(payload.dfU32);
        this.bucketOffsets = decodeBase64ToUint32Array(payload.bucketOffsetsU32);
        this.postingsChunkId = decodeBase64ToUint32Array(payload.postingsChunkIdU32);
        this.postingsTf = decodeBase64ToUint16Array(payload.postingsTfU16);
    }

    Bm25LookupEngine.load = async function (url) {
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error('无法加载 bm25 index：' + resp.status);
        const payload = await resp.json();
        return new Bm25LookupEngine(payload);
    };

    Bm25LookupEngine.prototype.classifyQuery = function (query) {
        return classifyQuery(query);
    };

    Bm25LookupEngine.prototype.search = function (query, options) {
        const opts = options || {};
        const limit = typeof opts.limit === 'number' ? opts.limit : 8;
        const categoryFilter = opts.category || '';
        const difficultyFilter = opts.difficulty || '';
        const blockedDocs = opts.blockedDocs || null;
        const blockedSet = blockedDocs
            ? (blockedDocs instanceof Set ? blockedDocs : new Set(blockedDocs))
            : null;

        const q = String(query || '').trim();
        if (!q) return [];

        const routing = classifyQuery(q);

        // 极短中文查询：倒排会非常“泛”，这里直接做 substring 兜底（仍然引用式）
        if (looksLikeOnlySingleCjk(q)) {
            const qLower = q.toLowerCase();
            const matches = [];
            for (let i = 0; i < this.chunks.length; i++) {
                const c = this.chunks[i];
                if (blockedSet && blockedSet.has(c.path)) continue;
                if (categoryFilter && c.category !== categoryFilter) continue;
                if (difficultyFilter && c.difficulty !== difficultyFilter) continue;
                const t = (c.text || '').toLowerCase();
                const title = (c.title || '').toLowerCase();
                if (t.includes(qLower) || title.includes(qLower)) {
                    matches.push({ index: i, score: (title.includes(qLower) ? 2 : 0) + 1 });
                }
            }
            matches.sort((a, b) => b.score - a.score);
            return matches.slice(0, limit).map(x => ({ ...this.chunks[x.index], score: x.score }));
        }

        const tokenQuery = routing && routing.tokenQuery ? routing.tokenQuery : q;
        let tokens = extractBm25Tokens(tokenQuery).filter(t => !STOPWORDS.has(t));
        if (routing && Array.isArray(routing.tokenHints)) {
            for (const hint of routing.tokenHints) {
                for (const t of extractBm25Tokens(hint)) tokens.push(t);
            }
        }
        tokens = Array.from(new Set(tokens));
        if (!tokens.length) return [];

        const keyTerms = extractKeyTerms(tokenQuery);

        // Hard vs soft key terms:
        // - Hard: entity-derived hints (物品/弹幕/NPC...) must match at least one when present.
        // - Soft: intent/extracted hints can match any, but should not override hard requirements.
        const hardHints = [];
        if (routing && Array.isArray(routing.entities)) {
            const ents = new Set(routing.entities);
            if (ents.has('item')) hardHints.push('物品');
            if (ents.has('weapon')) hardHints.push('武器');
            if (ents.has('projectile')) hardHints.push('弹幕');
            if (ents.has('npc')) hardHints.push('npc');
            if (ents.has('csharp')) hardHints.push('c#');
        }

        const routingHints = routing && Array.isArray(routing.keyHints) ? routing.keyHints : [];
        const expandedHardTerms = [];
        const expandedSoftTerms = [];

        for (const t of hardHints) {
            for (const s of expandKeyTermSynonyms(t)) expandedHardTerms.push(s);
        }

        for (const t of keyTerms.concat(routingHints)) {
            // Avoid duplicating hard hints into soft terms.
            const tl = String(t || '').toLowerCase();
            if (hardHints.some(h => tl.includes(String(h).toLowerCase()))) continue;
            for (const s of expandKeyTermSynonyms(t)) expandedSoftTerms.push(s);
        }

        const qBuckets = new Set();
        for (const t of tokens) {
            qBuckets.add(fnv1a32(t) % this.bucketCount);
        }

        const scores = new Map();

        const N = this.chunkCount;
        const avgdl = this.avgdl || 1;
        const k1 = this.k1;
        const b = this.b;

        for (const bucket of qBuckets) {
            const df = this.df[bucket] || 0;
            const idf = Math.log(((N - df + 0.5) / (df + 0.5)) + 1);

            const start = this.bucketOffsets[bucket];
            const end = this.bucketOffsets[bucket + 1];
            for (let p = start; p < end; p++) {
                const chunkId = this.postingsChunkId[p];
                const tf = this.postingsTf[p];

                const chunk = this.chunks[chunkId];
                if (!chunk) continue;
                if (blockedSet && blockedSet.has(chunk.path)) continue;
                if (categoryFilter && chunk.category !== categoryFilter) continue;
                if (difficultyFilter && chunk.difficulty !== difficultyFilter) continue;

                const dl = this.dl[chunkId] || 1;
                const denom = tf + k1 * (1 - b + b * (dl / avgdl));
                const bm25 = idf * (tf * (k1 + 1)) / (denom || 1);

                scores.set(chunkId, (scores.get(chunkId) || 0) + bm25);
            }
        }

        const qLower = String(tokenQuery || '').toLowerCase();
        const results = [];
        for (const [chunkId, score] of scores.entries()) {
            const chunk = this.chunks[chunkId];
            if (!chunk) continue;

            let s = score;
            const titleLower = (chunk.title || '').toLowerCase();
            if (qLower.length >= 3 && titleLower.includes(qLower)) s *= 1.1;

            // 路由加权：按 category 与 path（标题/路径名）调节，减少跑偏
            if (routing) {
                const cat = chunk.category || '';
                if (routing.categoryMultiplier && routing.categoryMultiplier[cat]) {
                    s *= routing.categoryMultiplier[cat];
                }

                if (routing.pathMultiplier && routing.pathMultiplier.length) {
                    const pathHay = `${chunk.path || ''} ${(chunk.title || '')}`;
                    for (const rule of routing.pathMultiplier) {
                        if (rule && rule.pattern && rule.pattern.test(pathHay)) {
                            s *= (rule.mult || 1);
                        }
                    }
                }
            }

            results.push({ ...chunk, score: s, __intent: routing ? routing.intent : 'unknown' });
        }

        results.sort((a, b) => b.score - a.score);

        // 二次复核与重排（减少哈希碰撞/泛词命中）
        const pre = results.slice(0, Math.max(200, limit * 30));
        const qTokensUnique = Array.from(new Set(tokens)).slice(0, 64);
        const minTokenHit = qTokensUnique.length <= 6 ? 1 : 2;
        const requireHardTerm = expandedHardTerms.length > 0;
        const requireSoftTerm = expandedSoftTerms.length > 0;

        const rescored = [];
        for (const item of pre) {
            const textLower = (item.text || '').toLowerCase();
            const titleLower = (item.title || '').toLowerCase();
            const hintLower = (item.hint || '').toLowerCase();
            const hay = titleLower + '\n' + textLower;

            let hit = 0;
            let hintHit = 0;
            for (const t of qTokensUnique) {
                if (!t) continue;
                if (hay.includes(t)) hit++;
                else if (hintLower && hintLower.includes(t)) hintHit++;
            }

            let hardHit = 0;
            if (requireHardTerm) {
                for (const kt of expandedHardTerms) {
                    if (!kt || kt.length < 2) continue;
                    if (hay.includes(kt)) {
                        hardHit++;
                        break;
                    }
                }
            }

            let softHit = 0;
            let softHintHit = 0;
            if (requireSoftTerm) {
                for (const kt of expandedSoftTerms) {
                    if (!kt || kt.length < 2) continue;
                    if (hay.includes(kt)) {
                        softHit++;
                        break;
                    } else if (hintLower && hintLower.includes(kt)) {
                        softHintHit++;
                        break;
                    }
                }
            }

            // 规则：
            // - 如果识别到“实体硬词”（物品/弹幕/NPC...），必须至少命中一个硬词，否则大幅降权
            // - 软词（例如“入门”）仅在没有硬词时起作用，避免“入门”掩盖实体意图
            // - 必须命中一定数量的 query token，否则降权（抵御 bucket 碰撞）
            let multiplier = 1;
            if (hit < minTokenHit) multiplier *= 0.35;
            if (requireHardTerm && hardHit === 0) multiplier *= 0.08;
            else if (!requireHardTerm && requireSoftTerm && softHit === 0) multiplier *= (softHintHit > 0 ? 0.6 : 0.22);

            const hintBoost = Math.min(0.12, hintHit * 0.03);
            const boosted = item.score * multiplier * (1 + Math.min(0.25, hit * 0.04) + hintBoost);
            rescored.push({ item, score: boosted, hit, hardHit, softHit });
        }

        rescored.sort((a, b) => b.score - a.score);

        // 文档层多样性与两阶段过滤：先选 top 文档，再取段落（避免跑偏文档霸榜）
        const docLimit = typeof opts.docLimit === 'number' ? Math.max(3, opts.docLimit) : 12;
        const maxPerDoc = typeof opts.maxPerDoc === 'number' ? Math.max(1, opts.maxPerDoc) : 3;

        const docScore = new Map();
        for (const r of rescored.slice(0, Math.max(200, limit * 40))) {
            const p = r.item.path || '';
            if (blockedSet && blockedSet.has(p)) continue;
            const prev = docScore.get(p) || 0;
            // 用 top 段落的 score 作为 doc score（更稳）
            docScore.set(p, Math.max(prev, r.score));
        }

        const topDocs = Array.from(docScore.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, docLimit)
            .map(([p]) => p);

        const allowedDocs = new Set(topDocs);
        const perDocCount = new Map();
        const out = [];
        for (const x of rescored) {
            const p = x.item.path || '';
            if (!allowedDocs.has(p)) continue;
            const c = perDocCount.get(p) || 0;
            if (c >= maxPerDoc) continue;
            perDocCount.set(p, c + 1);
            out.push({ ...x.item, score: x.score, __hit: x.hit, __hardHit: x.hardHit, __softHit: x.softHit });
            if (out.length >= limit) break;
        }

        return out;
    };

    return Bm25LookupEngine;
}));
