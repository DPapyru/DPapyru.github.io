import test from 'node:test';
import assert from 'node:assert/strict';

import { buildUnifiedDiff } from '../src/lib/unified-diff.js';

test('unified diff renders modified text with git markers', () => {
    const patch = buildUnifiedDiff({
        path: 'site/content/docs/a.md',
        oldText: '# old\nline\n',
        newText: '# new\nline\n',
        oldExists: true,
        newExists: true,
        isBinary: false
    });

    assert.match(patch, /^---\s+a\/site\/content\/docs\/a\.md/m);
    assert.match(patch, /^\+\+\+\s+b\/site\/content\/docs\/a\.md/m);
    assert.match(patch, /^@@/m);
    assert.match(patch, /^-# old$/m);
    assert.match(patch, /^\+# new$/m);
});

test('unified diff renders add and delete forms', () => {
    const addPatch = buildUnifiedDiff({
        path: 'site/content/docs/new.md',
        oldText: '',
        newText: '# add\n',
        oldExists: false,
        newExists: true,
        isBinary: false
    });
    assert.match(addPatch, /^---\s+\/dev\/null/m);
    assert.match(addPatch, /^\+\+\+\s+b\/site\/content\/docs\/new\.md/m);

    const delPatch = buildUnifiedDiff({
        path: 'site/content/docs/gone.md',
        oldText: '# gone\n',
        newText: '',
        oldExists: true,
        newExists: false,
        isBinary: false
    });
    assert.match(delPatch, /^---\s+a\/site\/content\/docs\/gone\.md/m);
    assert.match(delPatch, /^\+\+\+\s+\/dev\/null/m);
});

test('unified diff renders binary placeholder', () => {
    const patch = buildUnifiedDiff({
        path: 'site/content/docs/imgs/a.png',
        oldText: 'old-binary',
        newText: 'new-binary',
        oldExists: true,
        newExists: true,
        isBinary: true
    });

    assert.match(patch, /Binary files differ/);
});
