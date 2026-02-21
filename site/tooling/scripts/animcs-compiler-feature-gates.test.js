const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const compiler = require(path.resolve('site/tooling/scripts/animcs-compiler.js'));

test('validateFeatures keeps async/await restrictions', () => {
    const diagnostics = compiler.validateFeatures('async Task Run(){ await Task.Delay(1); }');
    assert.ok(diagnostics.some((entry) => String(entry).includes('async is not supported')));
    assert.ok(diagnostics.some((entry) => String(entry).includes('await is not supported')));
});

test('validateFeatures allows switch for AST pipeline', () => {
    const diagnostics = compiler.validateFeatures(`
switch (mode)
{
    case 1:
        break;
    default:
        break;
}
`);
    assert.equal(diagnostics.some((entry) => String(entry).includes('switch is not supported')), false);
});
