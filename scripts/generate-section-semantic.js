// scripts/generate-section-semantic.js
// Build-time helper: generate per-section semantic metadata via OpenAI-compatible chat API.
// Output: docs/search/section-semantic.v1.yml
//
// Env:
// - LLM_API_KEY (required)
// - LLM_BASE_URL (required, OpenAI-compatible base URL, e.g. https://.../v1)
// - LLM_MODEL (optional, default: glm-4.7-flash)
// - SECTION_SEMANTIC_PATH (optional, default: docs/search/section-semantic.v1.yml)
// - MAX_SECTIONS (optional, limit generation)
// - CONCURRENCY (optional, default: 1; 强制上限: 1，避免触发供应商并发限制)
//
// Notes:
// - Only updates new/changed sections (by sha256 hash).
// - Keeps YAML stable and human-editable.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

const DEFAULT_OUT = path.join('docs', 'search', 'section-semantic.v1.yml');
const STAGES = ['intro', 'basics', 'intermediate', 'advanced', 'concept', 'troubleshoot', 'tooling', 'meta'];

function sha256(text) {
    const h = crypto.createHash('sha256');
    h.update(String(text || ''), 'utf8');
    return h.digest('hex');
}

function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function atomicWriteFileSync(filePath, content) {
    ensureDirForFile(filePath);
    const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, filePath);
}

function stripFrontMatter(markdownText) {
    const text = String(markdownText || '').replace(/^\uFEFF/, '');
    const match = text.match(/^\s*---\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/);
    if (!match) return text;
    return text.slice(match[0].length);
}

function normalizeHeadingText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

function slugifyHeading(heading) {
    const raw = normalizeHeadingText(heading);
    const lower = raw.toLowerCase();
    let s = lower.normalize('NFKC');
    s = s.replace(/[\t\r\n]+/g, ' ');
    s = s.replace(/\s+/g, '-');
    s = s.replace(/[^\u4e00-\u9fff\w\-]+/g, '');
    s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s || 'section';
}

function splitIntoSections(markdown, docPath) {
    const body = stripFrontMatter(markdown);
    const lines = body.split(/\r?\n/);

    const sections = [];
    const slugCount = new Map();

    let current = {
        docPath,
        heading: '_root',
        level: 0,
        slug: 'root',
        contentLines: []
    };

    function pushCurrent() {
        const content = current.contentLines.join('\n').trim();
        if (!content) return;
        const headingNorm = normalizeHeadingText(current.heading);
        const id = `${docPath}#${current.slug}`;
        sections.push({
            id,
            docPath,
            heading: headingNorm,
            level: current.level,
            markdown: content
        });
    }

    for (const line of lines) {
        const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
        if (m) {
            pushCurrent();
            const headingText = normalizeHeadingText(m[2]);
            const base = slugifyHeading(headingText);
            const prev = slugCount.get(base) || 0;
            const next = prev + 1;
            slugCount.set(base, next);
            const slug = next > 1 ? `${base}-${next}` : base;
            current = {
                docPath,
                heading: m[2],
                level: m[1].length,
                slug,
                contentLines: []
            };
            continue;
        }
        current.contentLines.push(line);
    }
    pushCurrent();

    return sections;
}

function toPlainText(markdown) {
    let text = String(markdown || '');
    text = text.replace(/```[\s\S]*?```/g, (m) => {
        const inner = m.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
        return `\n${inner}\n`;
    });
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    text = text.replace(/\[[^\]]*\]\([^)]+\)/g, '$1');
    text = text.replace(/^>\s?/gm, '');
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/[*_~]/g, '');
    text = text.replace(/\r/g, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

function loadYamlOrDefault(filePath) {
    if (!fs.existsSync(filePath)) {
        return { version: 1, schema: 'section-semantic.v1', generatedAt: null, model: null, promptVersion: 1, sections: [] };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(raw) || {};
    if (!data.sections || !Array.isArray(data.sections)) data.sections = [];
    if (!data.version) data.version = 1;
    if (!data.schema) data.schema = 'section-semantic.v1';
    if (!data.promptVersion) data.promptVersion = 1;
    if (!('generatedAt' in data)) data.generatedAt = null;
    if (!('model' in data)) data.model = null;
    return data;
}

function stableDumpYaml(doc) {
    const ordered = {
        version: doc.version,
        schema: doc.schema,
        generatedAt: doc.generatedAt,
        model: doc.model,
        promptVersion: doc.promptVersion,
        sections: doc.sections
    };
    return yaml.dump(ordered, {
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
    });
}

function normalizeAliases(rawAliases) {
    if (!rawAliases) return [];
    if (Array.isArray(rawAliases)) {
        const out = [];
        for (const item of rawAliases) {
            if (!item) continue;
            if (typeof item === 'string') continue;
            const from = String(item.from || '').trim();
            const to = String(item.to || '').trim();
            if (!from || !to) continue;
            out.push({ from, to });
        }
        return out;
    }
    if (typeof rawAliases === 'object') {
        const out = [];
        for (const [from, to] of Object.entries(rawAliases)) {
            const f = String(from || '').trim();
            const t = String(to || '').trim();
            if (!f || !t) continue;
            out.push({ from: f, to: t });
        }
        out.sort((a, b) => a.from.localeCompare(b.from));
        return out;
    }
    return [];
}

function normalizeStringList(list, limit) {
    const out = [];
    const seen = new Set();
    for (const x of (Array.isArray(list) ? list : [])) {
        const s = String(x || '').trim();
        if (!s) continue;
        const key = s.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
        if (typeof limit === 'number' && out.length >= limit) break;
    }
    return out;
}

function extractJsonObject(text) {
    const s = String(text || '');
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) return null;
    const candidate = s.slice(start, end + 1);
    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
}

function parseRetryAfterMs(resp) {
    if (!resp || !resp.headers || typeof resp.headers.get !== 'function') return null;
    const raw = String(resp.headers.get('retry-after') || '').trim();
    if (!raw) return null;
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.floor(seconds * 1000);
    const when = Date.parse(raw);
    if (!Number.isFinite(when)) return null;
    const ms = when - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return Math.floor(ms);
}

async function callChat({ baseUrl, apiKey, model, prompt }) {
    const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: [
                        '你是一个“站内检索语义标注器”。',
                        '目标：为一个 Markdown 小节生成可检索的结构化元数据，用于“引用式检索”排序，不生成答案。',
                        '输出必须是严格 JSON（不要代码块，不要额外解释）。'
                    ].join('\n')
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });
    if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        const err = new Error(`LLM 请求失败：${resp.status} ${t}`.slice(0, 800));
        err.status = resp.status;
        err.retryAfterMs = parseRetryAfterMs(resp);
        throw err;
    }
    const json = await resp.json();
    const content = json && json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
    return String(content || '');
}

function buildPrompt({ docPath, heading, level, plainText }) {
    const clipped = plainText.length > 1800 ? (plainText.slice(0, 1800) + '\n…') : plainText;
    return [
        '请为以下 Markdown 小节生成结构化检索元数据。',
        '',
        `文档路径: ${docPath}`,
        `小节标题: ${heading}`,
        `标题级别: ${level}`,
        '',
        '小节正文（已去掉大部分 Markdown 语法，可能截断）：',
        clipped,
        '',
        '要求：',
        `- stage 必须是以下之一：${STAGES.join(', ')}`,
        '- phrases: 3~8 条，尽量贴近用户会问的自然语言问题（中文为主），短句即可。',
        '- aliases: 0~6 条，表示“新造词/黑话/别名 -> 站内常用术语/关键词”。',
        '- avoid: 0~6 条，容易造成跑偏的泛词/元词（例如“目录/索引/引用/搜索”等），用于检索时降权。',
        '',
        '仅返回 JSON，格式如下：',
        '{',
        '  "stage": "intro|basics|intermediate|advanced|concept|troubleshoot|tooling|meta",',
        '  "phrases": ["..."],',
        '  "aliases": [{"from": "...", "to": "..."}],',
        '  "avoid": ["..."]',
        '}'
    ].join('\n');
}

async function main() {
    const apiKey = process.env.LLM_API_KEY || '';
    const baseUrl = process.env.LLM_BASE_URL || '';
    const model = process.env.LLM_MODEL || 'glm-4.7-flash';
    const outPath = process.env.SECTION_SEMANTIC_PATH || DEFAULT_OUT;
    const maxSections = process.env.MAX_SECTIONS ? Number(process.env.MAX_SECTIONS) : null;
    const concurrencyRequested = process.env.CONCURRENCY ? Math.max(1, Number(process.env.CONCURRENCY)) : 1;
    const concurrency = 1;
    const flushEvery = process.env.FLUSH_EVERY ? Math.max(1, Number(process.env.FLUSH_EVERY)) : 10;

    if (!apiKey) throw new Error('缺少环境变量 LLM_API_KEY');
    if (!baseUrl) throw new Error('缺少环境变量 LLM_BASE_URL（OpenAI 兼容 base url，如 https://.../v1）');

    const docsDir = 'docs';
    const allMd = [];
    (function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.isFile() && p.toLowerCase().endsWith('.md')) allMd.push(p);
        }
    }(docsDir));

    const existing = loadYamlOrDefault(outPath);
    const existingById = new Map();
    for (const s of existing.sections) {
        if (!s || !s.id) continue;
        existingById.set(String(s.id), s);
    }

    const discovered = [];
    for (const absPath of allMd) {
        const rel = path.relative(docsDir, absPath).replace(/\\/g, '/');
        const markdown = fs.readFileSync(absPath, 'utf8');
        const sections = splitIntoSections(markdown, rel);
        for (const sec of sections) {
            const plain = toPlainText(sec.markdown);
            const hash = 'sha256:' + sha256(sec.heading + '\n' + plain);
            discovered.push({
                id: sec.id,
                docPath: rel,
                heading: sec.heading,
                level: sec.level,
                hash,
                plainText: plain
            });
        }
    }

    discovered.sort((a, b) => (a.docPath + a.id).localeCompare(b.docPath + b.id));

    const toUpdate = [];
    for (const sec of discovered) {
        const prev = existingById.get(sec.id);
        if (!prev || String(prev.hash || '') !== sec.hash) {
            toUpdate.push(sec);
        }
    }

    const limited = (typeof maxSections === 'number' && Number.isFinite(maxSections))
        ? toUpdate.slice(0, Math.max(0, maxSections))
        : toUpdate;

    console.log(`section-semantic: 发现 ${discovered.length} 个小节；需要更新 ${toUpdate.length} 个；本次处理 ${limited.length} 个。`);
    if (limited.length === 0) return;

    let cursor = 0;
    let processed = 0;
    let flushChain = Promise.resolve();

    const buildSnapshotDoc = () => {
        const sections = Array.from(existingById.values());
        sections.sort((a, b) => {
            const ap = String(a.docPath || '');
            const bp = String(b.docPath || '');
            if (ap !== bp) return ap.localeCompare(bp);
            const al = (a.level || 0) - (b.level || 0);
            if (al !== 0) return al;
            return String(a.id || '').localeCompare(String(b.id || ''));
        });
        return {
            version: 1,
            schema: 'section-semantic.v1',
            generatedAt: new Date().toISOString(),
            model,
            promptVersion: 1,
            sections
        };
    };

    const scheduleFlush = (force) => {
        flushChain = flushChain.then(() => {
            if (!force && processed % flushEvery !== 0) return;
            const snapshot = buildSnapshotDoc();
            atomicWriteFileSync(outPath, stableDumpYaml(snapshot));
            console.log(`已写入（中间保存）：${outPath}（已完成 ${processed}/${limited.length}）`);
        }).catch((e) => {
            console.warn('中间保存失败（可继续运行，但可能无法断点续跑）：', e && e.message ? e.message : String(e));
        });
    };

    async function worker() {
        while (cursor < limited.length) {
            const idx = cursor++;
            const sec = limited[idx];

            const prompt = buildPrompt(sec);
            console.log(`LLM 标注: ${idx + 1}/${limited.length} ${sec.docPath} # ${sec.heading}`);

            let content = '';
            for (let attempt = 1; attempt <= 8; attempt++) {
                try {
                    content = await callChat({ baseUrl, apiKey, model, prompt });
                    break;
                } catch (e) {
                    const status = e && typeof e.status === 'number' ? e.status : null;
                    const retryAfterMs = e && typeof e.retryAfterMs === 'number' ? e.retryAfterMs : null;
                    const retryable = status === 429 || status === 408 || (typeof status === 'number' && status >= 500 && status <= 599);
                    if (attempt === 8 || !retryable) throw e;

                    const base = status === 429 ? 2500 : 800;
                    const cap = status === 429 ? 60000 : 15000;
                    const backoff = Math.min(cap, base * Math.pow(2, attempt - 1));
                    const jitter = Math.floor(Math.random() * 250);
                    const waitMs = Math.max(300, retryAfterMs != null ? retryAfterMs : backoff) + jitter;
                    console.warn(`LLM 重试：${sec.docPath} # ${sec.heading}（attempt ${attempt}/8, status=${status || 'unknown'}, wait=${waitMs}ms）`);
                    await new Promise(r => setTimeout(r, waitMs));
                }
            }

            const obj = extractJsonObject(content);
            if (!obj) {
                throw new Error(`LLM 输出无法解析为 JSON：${sec.docPath}#${sec.heading}\n${content.slice(0, 400)}`);
            }

            const stageRaw = String(obj.stage || '').trim();
            const stage = STAGES.includes(stageRaw) ? stageRaw : 'basics';
            const phrases = normalizeStringList(obj.phrases, 8);
            const avoid = normalizeStringList(obj.avoid, 6);
            const aliases = normalizeAliases(obj.aliases).slice(0, 6);

            const next = {
                id: sec.id,
                docPath: sec.docPath,
                heading: sec.heading,
                level: sec.level,
                hash: sec.hash,
                stage,
                phrases,
                aliases,
                avoid
            };
            existingById.set(sec.id, next);

            processed++;
            if (processed % flushEvery === 0) scheduleFlush(false);
        }
    }

    if (concurrencyRequested !== concurrency) {
        console.warn(`提示：CONCURRENCY=${concurrencyRequested} 已被忽略；当前仅支持并发=${concurrency}（避免 429 并发限制）。`);
    }

    const workers = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    try {
        await Promise.all(workers);
    } catch (e) {
        scheduleFlush(true);
        await flushChain;
        console.error(`已尝试写入断点文件：${outPath}（已完成 ${processed}/${limited.length}）`);
        throw e;
    }

    scheduleFlush(true);
    await flushChain;
    console.log(`已写入：${outPath}（已完成 ${processed}/${limited.length}，累计 ${existingById.size} 个小节）`);
}

main().catch((e) => {
    console.error(e && e.stack ? e.stack : String(e));
    process.exit(1);
});
