// section-semantic-loader.js - loads docs/search/section-semantic.ai.v1.json.gz (gzip JSON) for runtime downweighting hints
// UMD wrapper: usable in browser (window.SectionSemanticLoader) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.SectionSemanticLoader = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    function isGzipBytes(u8) {
        return !!(u8 && u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b);
    }

    function normalizeStringList(list) {
        if (!Array.isArray(list)) return [];
        const out = [];
        for (const v of list) {
            const s = String(v || '').trim();
            if (!s) continue;
            out.push(s);
        }
        return out;
    }

    function createSectionMap(payload) {
        const map = new Map();
        if (!payload || !Array.isArray(payload.sections)) return map;
        for (const raw of payload.sections) {
            if (!raw || !raw.id) continue;
            const id = String(raw.id);
            map.set(id, {
                avoid: normalizeStringList(raw.avoid),
                phrases: normalizeStringList(raw.phrases),
                questions: normalizeStringList(raw.questions),
                beginnerQuestions: normalizeStringList(raw.beginnerQuestions),
                aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
                stage: raw.stage ? String(raw.stage) : ''
            });
        }
        return map;
    }

    function applyAvoidPenalty(score, query, avoidList, options) {
        const baseScore = Number(score) || 0;
        if (!baseScore) return baseScore;

        const avoids = normalizeStringList(avoidList);
        if (!avoids.length) return baseScore;

        const q = String(query || '').toLowerCase();
        if (!q) return baseScore;

        const opts = options || {};
        const perHit = typeof opts.perHit === 'number' ? opts.perHit : 0.6;
        const minFactor = typeof opts.minFactor === 'number' ? opts.minFactor : 0.12;

        let hits = 0;
        for (const raw of avoids) {
            const a = String(raw || '').trim().toLowerCase();
            if (!a) continue;
            if (q.includes(a)) hits += 1;
        }
        if (!hits) return baseScore;

        const factor = Math.max(minFactor, Math.pow(perHit, hits));
        return baseScore * factor;
    }

    async function decodeArrayBufferJson(arrayBuffer) {
        const u8 = new Uint8Array(arrayBuffer || new ArrayBuffer(0));
        const decoder = new TextDecoder('utf-8');
        if (!isGzipBytes(u8)) {
            const text = decoder.decode(u8);
            return JSON.parse(text);
        }

        // GitHub Pages serves *.gz as raw gzip bytes (no Content-Encoding). Use DecompressionStream when available.
        if (typeof DecompressionStream !== 'function') {
            throw new Error('当前浏览器不支持 gzip 解码（缺少 DecompressionStream）');
        }

        const ds = new DecompressionStream('gzip');
        const stream = new Blob([u8]).stream().pipeThrough(ds);
        const text = await new Response(stream).text();
        return JSON.parse(text);
    }

    async function load(url) {
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error('无法加载 section semantic：' + resp.status);
        const buf = await resp.arrayBuffer();
        return decodeArrayBufferJson(buf);
    }

    function decodeGzipJsonSync(buffer) {
        // Node-only helper for tests/scripts.
        // eslint-disable-next-line global-require
        const zlib = require('node:zlib');
        const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer || []);
        if (!isGzipBytes(u8)) {
            return JSON.parse(Buffer.from(u8).toString('utf8'));
        }
        const jsonText = zlib.gunzipSync(Buffer.from(u8)).toString('utf8');
        return JSON.parse(jsonText);
    }

    return {
        load,
        decodeArrayBufferJson,
        decodeGzipJsonSync,
        createSectionMap,
        applyAvoidPenalty
    };
}));

