// scripts/section-semantic-ai-translator.js
// Translate (decode/encode) site/content/search/section-semantic.ai.v1.json.gz (gzip JSON) to readable formats.
//
// Usage:
//   node scripts/section-semantic-ai-translator.js dump --input site/content/search/section-semantic.ai.v1.json.gz --output /tmp/section-semantic.ai.v1.json
//   node scripts/section-semantic-ai-translator.js dump --input site/content/search/section-semantic.ai.v1.json.gz --output /tmp/section-semantic.ai.v1.yml
//   node scripts/section-semantic-ai-translator.js pack --input /tmp/section-semantic.ai.v1.json --output site/content/search/section-semantic.ai.v1.json.gz
//
// Notes:
// - Output is intended for debugging/inspection.
// - pack tries to normalize key ordering and section ordering to minimize diffs.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const yaml = require('js-yaml');

function parseArgs(argv) {
    const args = { _: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith('--')) {
            args._.push(a);
            continue;
        }
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next == null || next.startsWith('--')) {
            args[key] = true;
            continue;
        }
        args[key] = next;
        i++;
    }
    return args;
}

function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readTextAuto(filePath) {
    const buf = fs.readFileSync(filePath);
    if (filePath.toLowerCase().endsWith('.gz')) {
        return zlib.gunzipSync(buf).toString('utf8');
    }
    return buf.toString('utf8');
}

function parseDocAuto(filePath) {
    const text = readTextAuto(filePath);
    if (filePath.toLowerCase().endsWith('.yml') || filePath.toLowerCase().endsWith('.yaml')) {
        return yaml.load(text);
    }
    return JSON.parse(text);
}

function normalizeAiDoc(doc) {
    const sections = Array.isArray(doc.sections) ? doc.sections.slice() : [];
    sections.sort((a, b) => {
        const ap = String(a.docPath || '');
        const bp = String(b.docPath || '');
        if (ap !== bp) return ap.localeCompare(bp);
        const al = (a.level || 0) - (b.level || 0);
        if (al !== 0) return al;
        return String(a.id || '').localeCompare(String(b.id || ''));
    });

    const includeSectionPromptVersion = sections.some(s => s && typeof s.promptVersion === 'number');
    const includeQuestions = sections.some(s => s && Array.isArray(s.questions));
    const includeBeginnerQuestions = sections.some(s => s && (Array.isArray(s.beginnerQuestions) || Array.isArray(s.beginner_questions)));

    const orderedSections = [];
    for (const s of sections) {
        const out = {
            id: s.id,
            docPath: s.docPath,
            heading: s.heading,
            level: s.level,
            hash: s.hash,
            stage: s.stage,
            phrases: Array.isArray(s.phrases) ? s.phrases : []
        };
        if (includeSectionPromptVersion) out.promptVersion = s.promptVersion;
        if (includeQuestions) out.questions = Array.isArray(s.questions) ? s.questions : [];
        if (includeBeginnerQuestions) {
            out.beginnerQuestions = Array.isArray(s.beginnerQuestions)
                ? s.beginnerQuestions
                : (Array.isArray(s.beginner_questions) ? s.beginner_questions : []);
        }
        out.aliases = Array.isArray(s.aliases) ? s.aliases : [];
        out.avoid = Array.isArray(s.avoid) ? s.avoid : [];
        orderedSections.push(out);
    }

    return {
        version: doc.version,
        schema: doc.schema,
        model: doc.model,
        promptVersion: doc.promptVersion,
        sections: orderedSections
    };
}

function stableStringifyAiDocCompact(doc) {
    return JSON.stringify(normalizeAiDoc(doc));
}

function stableStringifyAiDocPretty(doc) {
    return JSON.stringify(normalizeAiDoc(doc), null, 2);
}

function writeOutput(outputPath, textOrBuffer) {
    if (outputPath === '-' || outputPath === '/dev/stdout') {
        process.stdout.write(textOrBuffer);
        return;
    }
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, textOrBuffer);
}

function dump({ input, output }) {
    if (!input) throw new Error('Missing --input');
    if (!output) throw new Error('Missing --output');
    const doc = parseDocAuto(input) || {};

    const outLower = output.toLowerCase();
    if (outLower.endsWith('.yml') || outLower.endsWith('.yaml')) {
        const text = yaml.dump(normalizeAiDoc(doc), { noRefs: true, lineWidth: 120 });
        writeOutput(output, text);
        return;
    }
    const text = stableStringifyAiDocPretty(doc);
    writeOutput(output, text);
}

function pack({ input, output }) {
    if (!input) throw new Error('Missing --input');
    if (!output) throw new Error('Missing --output');
    const doc = parseDocAuto(input) || {};
    const json = stableStringifyAiDocCompact(doc);
    const buf = Buffer.from(json, 'utf8');
    const outLower = output.toLowerCase();
    if (outLower.endsWith('.gz')) {
        const gz = zlib.gzipSync(buf, { level: 9, mtime: 0 });
        writeOutput(output, gz);
        return;
    }
    writeOutput(output, json);
}

function main() {
    const argv = process.argv.slice(2);
    const args = parseArgs(argv);
    const cmd = args._[0];
    if (!cmd || cmd === 'help' || args.help) {
        console.log([
            'section-semantic.ai translator',
            '',
            'Commands:',
            '  dump --input <path.(json|yml|json.gz)> --output <path.(json|yml)|->',
            '  pack --input <path.(json|yml|json.gz)> --output <path.(json|json.gz)|->',
            ''
        ].join('\n'));
        process.exit(0);
    }

    if (cmd === 'dump') return dump({ input: args.input, output: args.output });
    if (cmd === 'pack') return pack({ input: args.input, output: args.output });
    throw new Error(`Unknown command: ${cmd}`);
}

main();
