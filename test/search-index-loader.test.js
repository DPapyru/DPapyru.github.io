const assert = require('node:assert/strict');
const test = require('node:test');

const SearchIndexLoader = require('../assets/js/search-index-loader.js');

function encodeU32LE(num) {
    const b = Buffer.allocUnsafe(4);
    b.writeUInt32LE(num >>> 0, 0);
    return b;
}

function buildBinaryIndex(docs) {
    const fieldNames = [
        'path',
        'filename',
        'title',
        'description',
        'category',
        'topic',
        'author',
        'difficulty',
        'time',
        'last_updated'
    ];

    const stringToIndex = new Map();
    const strings = [];
    const addString = (v) => {
        const s = String(v == null ? '' : v);
        if (!s) return 0;
        const found = stringToIndex.get(s);
        if (found != null) return found;
        const idx = strings.length + 1;
        strings.push(s);
        stringToIndex.set(s, idx);
        return idx;
    };

    const records = new Uint32Array(docs.length * fieldNames.length);
    for (let i = 0; i < docs.length; i++) {
        const base = i * fieldNames.length;
        for (let f = 0; f < fieldNames.length; f++) {
            records[base + f] = addString(docs[i][fieldNames[f]]);
        }
    }

    const offsets = new Uint32Array(strings.length + 1);
    const parts = [];
    let totalBytes = 0;
    for (let i = 0; i < strings.length; i++) {
        offsets[i] = totalBytes;
        const buf = Buffer.from(strings[i], 'utf8');
        parts.push(buf);
        totalBytes += buf.length;
    }
    offsets[strings.length] = totalBytes;

    const header = Buffer.concat([
        Buffer.from('TSI2', 'ascii'),
        encodeU32LE(2),
        encodeU32LE(docs.length),
        encodeU32LE(fieldNames.length),
        encodeU32LE(strings.length),
        encodeU32LE(strings.length + 1)
    ]);

    const offsetsBuf = Buffer.from(offsets.buffer, offsets.byteOffset, offsets.byteLength);
    const stringsBuf = Buffer.concat(parts);
    const recordsBuf = Buffer.from(records.buffer, records.byteOffset, records.byteLength);
    return Buffer.concat([header, offsetsBuf, stringsBuf, recordsBuf]);
}

test('SearchIndexLoader.decodeBinaryIndex decodes docs', () => {
    const buf = buildBinaryIndex([{
        path: 'Modder入门/a.md',
        filename: 'a.md',
        title: 'A',
        description: 'D',
        category: 'Modder入门',
        topic: 'mod-basics',
        author: 'X',
        difficulty: 'beginner',
        time: '5分钟',
        last_updated: '2026-01-01'
    }]);

    const decoded = SearchIndexLoader.decodeBinaryIndex(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    assert.equal(decoded.version, 2);
    assert.equal(decoded.docs.length, 1);
    assert.equal(decoded.docs[0].path, 'Modder入门/a.md');
    assert.equal(decoded.docs[0].title, 'A');
});

