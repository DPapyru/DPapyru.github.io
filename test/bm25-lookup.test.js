const assert = require('node:assert/strict');
const test = require('node:test');

const Bm25LookupEngine = require('../assets/js/bm25-lookup.js');

function makeEngine(chunks) {
    // Minimal in-memory payload; postings arrays can be empty for classifyQuery tests.
    return new Bm25LookupEngine({
        version: 1,
        bucketCount: 8,
        chunkCount: chunks.length,
        avgdl: 1,
        k1: 1.2,
        b: 0.75,
        dlU16: Buffer.from(new Uint16Array(chunks.length).buffer).toString('base64'),
        dfU32: Buffer.from(new Uint32Array(8).buffer).toString('base64'),
        bucketOffsetsU32: Buffer.from(new Uint32Array(9).buffer).toString('base64'),
        postingsChunkIdU32: Buffer.from(new Uint32Array(0).buffer).toString('base64'),
        postingsTfU16: Buffer.from(new Uint16Array(0).buffer).toString('base64'),
        chunks
    });
}

test('Bm25LookupEngine.classifyQuery detects intro intent', () => {
    const engine = makeEngine([]);
    const info = engine.classifyQuery('我怎么入门Mod啊？');
    assert.equal(info.intent, 'intro');
    assert.ok(info.preferredTemplate === 'path');
});

test('Bm25LookupEngine.classifyQuery detects howto item intent', () => {
    const engine = makeEngine([]);
    const info = engine.classifyQuery('怎么做一个物品？');
    assert.equal(info.intent, 'howto');
    assert.ok(info.entities.includes('item'));
});

test('Bm25LookupEngine.classifyQuery detects troubleshoot intent', () => {
    const engine = makeEngine([]);
    const info = engine.classifyQuery('弹幕突然消失的解决方法');
    assert.equal(info.intent, 'troubleshoot');
    assert.ok(info.entities.includes('projectile'));
});

