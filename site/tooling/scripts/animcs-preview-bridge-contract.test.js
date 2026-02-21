const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('animcs preview bridge project exists with compile and health endpoints', () => {
    const projectDir = path.resolve('site/tooling/tools/animcs-preview-bridge');
    const programPath = path.join(projectDir, 'Program.cs');

    assert.equal(fs.existsSync(projectDir), true, 'bridge directory missing');
    assert.equal(fs.existsSync(programPath), true, 'bridge Program.cs missing');

    const source = fs.readFileSync(programPath, 'utf8');
    assert.match(source, /MapGet\(\s*"\/health"/);
    assert.match(source, /MapPost\(\s*"\/api\/animcs\/compile"/);
    assert.match(source, /127\.0\.0\.1/);
});

test('animcs preview bridge enforces anims path validation', () => {
    const programPath = path.resolve('site/tooling/tools/animcs-preview-bridge/Program.cs');
    const source = fs.readFileSync(programPath, 'utf8');

    assert.match(source, /anims\//i);
    assert.match(source, /\.cs/);
});
