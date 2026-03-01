const test = require('node:test');
const assert = require('node:assert/strict');

const { migrateLine, parseLegacyDirectivePayload } = require('./migrate-markdown-embed-syntax');

test('migration parser handles optional title payload', () => {
    assert.deepEqual(parseLegacyDirectivePayload('./Demo.cs|类型示例'), {
        target: './Demo.cs',
        label: '类型示例'
    });

    assert.deepEqual(parseLegacyDirectivePayload('anims/demo.cs'), {
        target: 'anims/demo.cs',
        label: '待补充说明'
    });
});

test('migration line conversion rewrites legacy cs/anim directives to protocol links', () => {
    assert.equal(
        migrateLine('{{cs:./Demo.cs#cs:t:Foo.Bar|类型示例}}'),
        '[类型示例](cs:./Demo.cs#cs:t:Foo.Bar)'
    );

    assert.equal(
        migrateLine('{{cs:./Demo.cs#cs:m:Foo.Bar.Baz(int,string)|方法示例}}'),
        '[方法示例](cs:./Demo.cs#cs:m:Foo.Bar.Baz(int,string))'
    );

    assert.equal(
        migrateLine('    {{anim:anims/demo-basic.cs}}'),
        '    [待补充说明](anims:anims/demo-basic.cs)'
    );

    assert.equal(
        migrateLine('说明：{{anim:anims/demo-basic.cs}}'),
        null
    );
});
