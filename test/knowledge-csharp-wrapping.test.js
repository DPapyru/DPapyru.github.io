const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('KnowledgeCSharp.makeWrapCandidates provides wrappers for fragments', () => {
    // UMD module should be require()-able in Node.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const KnowledgeCSharp = require('../assets/js/knowledge-csharp.js');

    const candidates = KnowledgeCSharp.makeWrapCandidates('player.AddBuff(1, 2);');
    assert.ok(Array.isArray(candidates));
    assert.ok(candidates.length >= 3);

    const kinds = new Set(candidates.map((c) => c.kind));
    assert.ok(kinds.has('compilationUnit'));
    assert.ok(kinds.has('classMember'));
    assert.ok(kinds.has('methodBody'));
});

test('Tree-sitter can parse a statement via methodBody wrapper', async () => {
    const KnowledgeCSharp = require('../assets/js/knowledge-csharp.js');

    const TreeSitter = require('../assets/js/vendor/web-tree-sitter.commonjs.js');
    const runtimeWasm = path.resolve(__dirname, '..', 'assets/js/vendor/web-tree-sitter.wasm');
    const csharpWasm = path.resolve(__dirname, '..', 'assets/wasm/tree-sitter-c_sharp.wasm');

    await TreeSitter.Parser.init({
        locateFile() {
            return runtimeWasm;
        }
    });

    const CSharp = await TreeSitter.Language.load(csharpWasm);
    const parser = new TreeSitter.Parser();
    parser.setLanguage(CSharp);

    const snippet = 'player.AddBuff(1, 2);';
    const candidates = KnowledgeCSharp.makeWrapCandidates(snippet);
    const methodBody = candidates.find((c) => c.kind === 'methodBody');
    assert.ok(methodBody);

    const tree = parser.parse(methodBody.source);
    assert.equal(tree.rootNode.hasError, false);
});

test('Tree-sitter can parse an expression without semicolon when allowed', async () => {
    const KnowledgeCSharp = require('../assets/js/knowledge-csharp.js');

    const TreeSitter = require('../assets/js/vendor/web-tree-sitter.commonjs.js');
    const runtimeWasm = path.resolve(__dirname, '..', 'assets/js/vendor/web-tree-sitter.wasm');
    const csharpWasm = path.resolve(__dirname, '..', 'assets/wasm/tree-sitter-c_sharp.wasm');

    await TreeSitter.Parser.init({
        locateFile() {
            return runtimeWasm;
        }
    });

    const CSharp = await TreeSitter.Language.load(csharpWasm);
    const parser = new TreeSitter.Parser();
    parser.setLanguage(CSharp);

    const snippet = 'player.AddBuff(1, 2)';
    const candidates = KnowledgeCSharp.makeWrapCandidates(snippet, { allowAppendSemicolon: true });
    const methodBody = candidates.find((c) => c.kind === 'methodBody');
    assert.ok(methodBody);

    const tree = parser.parse(methodBody.source);
    assert.equal(tree.rootNode.hasError, false);
});
