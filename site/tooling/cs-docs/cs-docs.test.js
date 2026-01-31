const test = require('node:test');
const assert = require('node:assert/strict');

const { parseCsDoc } = require('./cs-docs');

function wrapCs(attrsLine) {
    return [
        '[Title("T")]',
        attrsLine,
        'public class X { }'
    ].join('\n');
}

test('cs-docs: PrevChapter(typeof(...)) extracts simple type name (unicode)', () => {
    const parsed = parseCsDoc(wrapCs('[PrevChapter(typeof(CSharp控制流))]'), 'x.cs');
    assert.equal(parsed.metadata.prev_chapter, 'CSharp控制流.generated.md');
});

test('cs-docs: PrevChapter(typeof(...)) extracts last segment', () => {
    const parsed = parseCsDoc(wrapCs('[PrevChapter(typeof(Namespace.Outer.CSharp控制流))]'), 'x.cs');
    assert.equal(parsed.metadata.prev_chapter, 'CSharp控制流.generated.md');
});

test('cs-docs: PrevChapter(typeof(global::...)) extracts last segment', () => {
    const parsed = parseCsDoc(wrapCs('[PrevChapter(typeof(global::Foo.Bar))]'), 'x.cs');
    assert.equal(parsed.metadata.prev_chapter, 'Bar.generated.md');
});

test('cs-docs: PrevChapter(nameof(...)) extracts identifier', () => {
    const parsed = parseCsDoc(wrapCs('[PrevChapter(nameof(CSharp控制流))]'), 'x.cs');
    assert.equal(parsed.metadata.prev_chapter, 'CSharp控制流.generated.md');
});

test('cs-docs: PrevChapter("...") keeps string value', () => {
    const parsed = parseCsDoc(wrapCs('[PrevChapter("CSharp快速入门")]'), 'x.cs');
    assert.equal(parsed.metadata.prev_chapter, 'CSharp快速入门');
});

