import test from 'node:test';
import assert from 'node:assert/strict';

import { createChangeTracker } from '../src/lib/change-tracker.js';

function tracker() {
    return createChangeTracker({
        normalizePath(path) {
            return String(path || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
        }
    });
}

test('change-tracker computes M/A/D states and ignores unchanged files', () => {
    const t = tracker();

    t.setBaseline('site/content/docs/a.md', {
        exists: true,
        content: '# A\n',
        mode: 'text'
    });
    t.upsert('site/content/docs/a.md', '# A\n');
    assert.equal(t.listChanges().length, 0);

    t.upsert('site/content/docs/a.md', '# A changed\n');
    const changed = t.getChange('site/content/docs/a.md');
    assert.ok(changed);
    assert.equal(changed.status, 'M');

    t.setBaseline('site/content/docs/new.md', {
        exists: false,
        content: '',
        mode: 'text'
    });
    t.upsert('site/content/docs/new.md', '# New\n');
    const added = t.getChange('site/content/docs/new.md');
    assert.ok(added);
    assert.equal(added.status, 'A');

    t.markDeleted('site/content/docs/a.md');
    const deleted = t.getChange('site/content/docs/a.md');
    assert.ok(deleted);
    assert.equal(deleted.status, 'D');

    t.restore('site/content/docs/a.md');
    assert.equal(t.getChange('site/content/docs/a.md'), null);
});

test('change-tracker rename behaves as delete old + add new', () => {
    const t = tracker();

    t.setBaseline('site/content/docs/old.md', {
        exists: true,
        content: '# old\n',
        mode: 'text'
    });
    t.setBaseline('site/content/docs/new.md', {
        exists: false,
        content: '',
        mode: 'text'
    });

    t.rename('site/content/docs/old.md', 'site/content/docs/new.md', '# old\n', { mode: 'text' });

    const oldChange = t.getChange('site/content/docs/old.md');
    const newChange = t.getChange('site/content/docs/new.md');
    assert.ok(oldChange);
    assert.ok(newChange);
    assert.equal(oldChange.status, 'D');
    assert.equal(newChange.status, 'A');
});
