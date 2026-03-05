const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('solutions do not reference deleted AnimScripts.Dev project', () => {
    const solutionPaths = [
        path.resolve('ContentProjects.sln'),
        path.resolve('site/ContentProjects.sln')
    ];

    solutionPaths.forEach((solutionPath) => {
        const source = fs.readFileSync(solutionPath, 'utf8');
        assert.doesNotMatch(source, /AnimScripts\.Dev\.csproj/i);
        assert.doesNotMatch(source, /=\s*"AnimScripts\.Dev"/i);
    });
});
