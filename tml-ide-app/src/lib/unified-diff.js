function normalizePath(pathValue) {
    return String(pathValue || '')
        .trim()
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
}

function normalizeText(text) {
    return String(text || '').replace(/\r\n/g, '\n');
}

function splitLines(text) {
    const normalized = normalizeText(text);
    if (!normalized) return [];
    const lines = normalized.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }
    return lines;
}

function lcsDiff(oldLines, newLines) {
    const n = oldLines.length;
    const m = newLines.length;
    const dp = Array.from({ length: n + 1 }, function () {
        return new Array(m + 1).fill(0);
    });

    for (let i = n - 1; i >= 0; i -= 1) {
        for (let j = m - 1; j >= 0; j -= 1) {
            if (oldLines[i] === newLines[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (oldLines[i] === newLines[j]) {
            ops.push({ type: 'context', line: oldLines[i] });
            i += 1;
            j += 1;
            continue;
        }
        if (dp[i + 1][j] >= dp[i][j + 1]) {
            ops.push({ type: 'del', line: oldLines[i] });
            i += 1;
            continue;
        }
        ops.push({ type: 'add', line: newLines[j] });
        j += 1;
    }

    while (i < n) {
        ops.push({ type: 'del', line: oldLines[i] });
        i += 1;
    }
    while (j < m) {
        ops.push({ type: 'add', line: newLines[j] });
        j += 1;
    }

    return ops;
}

function withLineNumbers(ops) {
    const annotated = [];
    let oldLine = 1;
    let newLine = 1;
    (Array.isArray(ops) ? ops : []).forEach(function (op) {
        const type = String(op && op.type || '');
        const entry = {
            type,
            line: String(op && op.line || ''),
            oldLine,
            newLine
        };
        if (type === 'context') {
            oldLine += 1;
            newLine += 1;
        } else if (type === 'del') {
            oldLine += 1;
        } else if (type === 'add') {
            newLine += 1;
        }
        annotated.push(entry);
    });
    return annotated;
}

function buildHunks(ops, contextLines) {
    const annotated = withLineNumbers(ops);
    const context = Math.max(0, Number(contextLines) || 3);
    const hunks = [];
    let index = 0;

    while (index < annotated.length) {
        while (index < annotated.length && annotated[index].type === 'context') {
            index += 1;
        }
        if (index >= annotated.length) break;

        const start = Math.max(0, index - context);
        let end = index;
        let lastChange = index;
        while (end < annotated.length) {
            if (annotated[end].type !== 'context') {
                lastChange = end;
            }
            if (end - lastChange > context) {
                break;
            }
            end += 1;
        }
        if (end - lastChange > context) {
            end = lastChange + context + 1;
        }
        hunks.push({
            start,
            end,
            lines: annotated.slice(start, end)
        });
        index = end;
    }

    if (hunks.length <= 0 && annotated.length > 0) {
        hunks.push({
            start: 0,
            end: annotated.length,
            lines: annotated.slice()
        });
    }

    return hunks;
}

function renderHeader(path, oldExists, newExists) {
    const safePath = normalizePath(path);
    const oldLabel = oldExists ? `a/${safePath}` : '/dev/null';
    const newLabel = newExists ? `b/${safePath}` : '/dev/null';
    return `--- ${oldLabel}\n+++ ${newLabel}\n`;
}

function renderBinaryDiff(path, oldExists, newExists) {
    return `${renderHeader(path, oldExists, newExists)}Binary files differ\n`;
}

function renderTextHunks(path, oldExists, newExists, ops, contextLines) {
    const header = renderHeader(path, oldExists, newExists);
    const hunks = buildHunks(ops, contextLines);
    if (hunks.length <= 0) {
        return `${header}@@ -0,0 +0,0 @@\n`;
    }

    const parts = [header];
    hunks.forEach(function (hunk) {
        const lines = hunk.lines;
        const oldCount = lines.reduce(function (sum, line) {
            return sum + (line.type !== 'add' ? 1 : 0);
        }, 0);
        const newCount = lines.reduce(function (sum, line) {
            return sum + (line.type !== 'del' ? 1 : 0);
        }, 0);

        let oldStart = lines[0] ? lines[0].oldLine : 0;
        let newStart = lines[0] ? lines[0].newLine : 0;
        if (oldCount === 0) oldStart = Math.max(0, oldStart - 1);
        if (newCount === 0) newStart = Math.max(0, newStart - 1);

        parts.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n`);
        lines.forEach(function (line) {
            if (line.type === 'context') {
                parts.push(` ${line.line}\n`);
                return;
            }
            if (line.type === 'del') {
                parts.push(`-${line.line}\n`);
                return;
            }
            parts.push(`+${line.line}\n`);
        });
    });
    return parts.join('');
}

export function buildUnifiedDiff(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const path = normalizePath(opts.path);
    const oldExists = !!opts.oldExists;
    const newExists = !!opts.newExists;
    const isBinary = !!opts.isBinary;
    const contextLines = Number.isFinite(Number(opts.contextLines)) ? Number(opts.contextLines) : 3;

    if (!path) {
        throw new Error('path is required');
    }

    if (isBinary) {
        return renderBinaryDiff(path, oldExists, newExists);
    }

    const oldLines = splitLines(opts.oldText);
    const newLines = splitLines(opts.newText);
    const ops = lcsDiff(oldLines, newLines);
    return renderTextHunks(path, oldExists, newExists, ops, contextLines);
}
