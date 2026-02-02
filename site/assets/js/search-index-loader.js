// search-index-loader.js - loads search index from binary (preferred) or JSON (fallback)
// UMD wrapper: usable in browser (window.SearchIndexLoader) and Node (require()).
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.SearchIndexLoader = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const MAGIC = 'TSI2';
    const FIELD_NAMES = [
        'path',
        'filename',
        'title',
        'description',
        'category',
        'topic',
        'author',
        'difficulty',
        'time'
    ];

    function readU32(dv, offset) {
        return dv.getUint32(offset, true);
    }

    function decodeBinaryIndex(arrayBuffer) {
        const dv = new DataView(arrayBuffer);
        if (dv.byteLength < 24) throw new Error('binary index too small');

        const magic =
            String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
        if (magic !== MAGIC) throw new Error('not a TSI2 index');

        const version = readU32(dv, 4);
        if (version !== 2) throw new Error('unsupported index version: ' + version);

        const docCount = readU32(dv, 8);
        const fieldCount = readU32(dv, 12);
        const stringCount = readU32(dv, 16);
        const offsetsCount = readU32(dv, 20);

        if (fieldCount !== FIELD_NAMES.length) throw new Error('unexpected fieldCount: ' + fieldCount);
        if (offsetsCount !== stringCount + 1) throw new Error('unexpected offsetsCount');

        let cursor = 24;
        const offsetsBytes = offsetsCount * 4;
        if (cursor + offsetsBytes > dv.byteLength) throw new Error('offsets out of range');

        const offsets = new Uint32Array(arrayBuffer, cursor, offsetsCount);
        cursor += offsetsBytes;

        const stringsLen = offsets[offsetsCount - 1] >>> 0;
        if (cursor + stringsLen > dv.byteLength) throw new Error('strings out of range');

        const stringsBytes = new Uint8Array(arrayBuffer, cursor, stringsLen);
        cursor += stringsLen;

        const recordCount = docCount * fieldCount;
        const recordsBytes = recordCount * 4;
        const alignedCursor = (cursor + 3) & ~3;

        function scoreRecordsStart(start) {
            const sample = Math.min(recordCount, 12);
            let good = 0;
            for (let i = 0; i < sample; i++) {
                const v = readU32(dv, start + i * 4);
                if (v <= stringCount) good++;
            }
            if (docCount > 0) {
                const firstPath = readU32(dv, start);
                if (firstPath !== 0 && firstPath <= stringCount) good += 2;
            }
            return good;
        }

        const candidates = [];
        if (cursor + recordsBytes <= dv.byteLength) candidates.push(cursor);
        if (alignedCursor !== cursor && alignedCursor + recordsBytes <= dv.byteLength) candidates.push(alignedCursor);
        if (!candidates.length) throw new Error('records out of range');

        let recordStart = candidates[0];
        if (candidates.length === 2) {
            const score0 = scoreRecordsStart(candidates[0]);
            const score1 = scoreRecordsStart(candidates[1]);
            if (score1 > score0 || (score1 === score0 && candidates[1] === alignedCursor)) {
                recordStart = candidates[1];
            }
        }

        let records;
        if ((recordStart & 3) === 0) {
            records = new Uint32Array(arrayBuffer, recordStart, recordCount);
        } else {
            records = new Uint32Array(recordCount);
            for (let i = 0; i < recordCount; i++) {
                records[i] = readU32(dv, recordStart + i * 4);
            }
        }

        const decoder = new TextDecoder('utf-8');
        const stringCache = new Array(stringCount);
        function getString(index) {
            if (index === 0) return '';
            const idx = index - 1;
            if (idx < 0 || idx >= stringCount) return '';
            const cached = stringCache[idx];
            if (cached != null) return cached;
            const start = offsets[idx] >>> 0;
            const end = offsets[idx + 1] >>> 0;
            const text = decoder.decode(stringsBytes.subarray(start, end));
            stringCache[idx] = text;
            return text;
        }

        const docs = [];
        for (let i = 0; i < docCount; i++) {
            const base = i * fieldCount;
            const doc = {};
            for (let f = 0; f < fieldCount; f++) {
                doc[FIELD_NAMES[f]] = getString(records[base + f]);
            }
            docs.push(doc);
        }

        return { version, docs };
    }

    async function load(url) {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error('无法加载索引: ' + response.status);

        const buf = await response.arrayBuffer();
        try {
            return decodeBinaryIndex(buf);
        } catch (e) {
            // Fallback: parse JSON payload
            const text = new TextDecoder('utf-8').decode(new Uint8Array(buf));
            const payload = JSON.parse(text);
            if (!payload || !Array.isArray(payload.docs)) throw new Error('invalid JSON index');
            return payload;
        }
    }

    return {
        MAGIC,
        decodeBinaryIndex,
        load
    };
}));
