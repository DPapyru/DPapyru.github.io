'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');

function validateFeatures(source) {
    const text = String(source || '');
    const errors = [];

    if (/\basync\b/.test(text)) {
        errors.push('async is not supported');
    }
    if (/\bawait\b/.test(text)) {
        errors.push('await is not supported');
    }
    if (/\btry\b/.test(text) || /\bcatch\b/.test(text)) {
        errors.push('try/catch is not supported');
    }
    return errors;
}

function resolveDotnetCommand() {
    return process.env.DOTNET_CMD || 'dotnet';
}

function resolveAstCompilerProject() {
    return path.resolve(__dirname, '..', 'tools', 'animcs-compiler', 'AstCompiler', 'AstCompiler.csproj');
}

function resolveTempRoot() {
    return '/tmp';
}

function runAstCompiler(batchPayload) {
    const project = resolveAstCompilerProject();
    if (!fs.existsSync(project)) {
        throw new Error(`AstCompiler project not found: ${project}`);
    }

    const tmpDir = fs.mkdtempSync(path.join(resolveTempRoot(), 'animcs-ast-'));
    const inputPath = path.join(tmpDir, 'input.json');
    const outputPath = path.join(tmpDir, 'output.json');

    try {
        fs.writeFileSync(inputPath, JSON.stringify(batchPayload), 'utf8');

        const args = [
            'run',
            '--project',
            project,
            '-c',
            'Release',
            '--',
            '--input',
            inputPath,
            '--output',
            outputPath
        ];

        const result = childProcess.spawnSync(resolveDotnetCommand(), args, {
            cwd: path.resolve(__dirname, '..', '..', '..'),
            encoding: 'utf8'
        });

        if (result.error) {
            throw result.error;
        }

        if (result.status !== 0) {
            const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
            throw new Error(`AstCompiler failed (exit ${result.status})${details ? `: ${details}` : ''}`);
        }

        if (!fs.existsSync(outputPath)) {
            throw new Error('AstCompiler output was not generated');
        }

        const outputText = fs.readFileSync(outputPath, 'utf8');
        const output = JSON.parse(outputText);
        if (!Array.isArray(output)) {
            throw new Error('AstCompiler output must be an array');
        }

        return output;
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

function compileAnimBatch(items) {
    const normalized = (items || []).map((item, index) => {
        const sourcePath = String(item && item.sourcePath ? item.sourcePath : `inline-${index}.cs`);
        const sourceText = String(item && item.sourceText ? item.sourceText : '');
        const errors = validateFeatures(sourceText);
        if (errors.length) {
            throw new Error(`[animcs] ${sourcePath}: ${errors.join('; ')}`);
        }

        return {
            sourcePath,
            sourceText
        };
    });

    if (!normalized.length) {
        return [];
    }

    const outputs = runAstCompiler(normalized).map((item, index) => {
        const sourcePath = String(item && item.sourcePath ? item.sourcePath : normalized[index].sourcePath);
        const js = String(item && item.js ? item.js : '');
        const diagnostics = Array.isArray(item && item.diagnostics)
            ? item.diagnostics.map((entry) => String(entry))
            : [];

        return {
            sourcePath,
            js,
            diagnostics
        };
    });

    const failures = outputs.filter((item) => item.diagnostics.length > 0);
    if (failures.length) {
        const details = failures
            .map((item) => `${item.sourcePath}: ${item.diagnostics.join('; ')}`)
            .join(' | ');
        throw new Error(`[animcs] compile failed: ${details}`);
    }

    return outputs;
}

function compileAnimToJs(source) {
    const outputs = compileAnimBatch([
        {
            sourcePath: 'inline.cs',
            sourceText: String(source || '')
        }
    ]);
    return outputs[0] ? outputs[0].js : '';
}

module.exports = {
    validateFeatures,
    compileAnimToJs,
    compileAnimBatch
};
