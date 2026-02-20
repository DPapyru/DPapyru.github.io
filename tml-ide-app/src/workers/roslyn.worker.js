import { MESSAGE_TYPES, DIAGNOSTIC_SEVERITY } from '../contracts/messages.js';
import { normalizeApiIndex } from '../lib/index-schema.js';

let index = normalizeApiIndex(null);

function createLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
}

function offsetToPosition(starts, offset) {
    let idx = 0;
    let low = 0;
    let high = starts.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (starts[mid] <= offset) {
            idx = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return {
        line: idx + 1,
        column: offset - starts[idx] + 1
    };
}

function push(diags, starts, start, end, code, severity, message) {
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart + 1, end);
    const startPos = offsetToPosition(starts, safeStart);
    const endPos = offsetToPosition(starts, safeEnd);

    diags.push({
        code,
        severity,
        message,
        startLineNumber: startPos.line,
        startColumn: startPos.column,
        endLineNumber: endPos.line,
        endColumn: endPos.column
    });
}

function analyze(text) {
    const source = String(text || '');
    const starts = createLineStarts(source);
    const diagnostics = [];

    const hasType = /\b(?:class|struct|interface|enum|record)\s+[A-Za-z_][A-Za-z0-9_]*/.test(source);
    const hasNamespace = /\bnamespace\s+[A-Za-z_][A-Za-z0-9_.]*/.test(source);

    if (hasType && !hasNamespace) {
        push(
            diagnostics,
            starts,
            0,
            Math.min(source.length, 1),
            'ROSLYN_NAMESPACE_RECOMMEND',
            DIAGNOSTIC_SEVERITY.INFO,
            '建议为当前文件声明 namespace，以提升工程可维护性。'
        );
    }

    const knownNamespaces = new Set(index.lookup && Array.isArray(index.lookup.namespaces) ? index.lookup.namespaces : []);
    const usingRe = /\busing\s+([A-Za-z_][A-Za-z0-9_.]*)\s*;/g;
    let m;
    while ((m = usingRe.exec(source)) !== null) {
        const ns = m[1];
        if (!knownNamespaces.size) break;
        if (!knownNamespaces.has(ns)) {
            push(
                diagnostics,
                starts,
                m.index,
                m.index + m[0].length,
                'ROSLYN_UNKNOWN_USING',
                DIAGNOSTIC_SEVERITY.WARNING,
                `using 命名空间未在当前索引中命中：${ns}`
            );
        }
    }

    const todoRe = /\bTODO\b/g;
    while ((m = todoRe.exec(source)) !== null) {
        push(
            diagnostics,
            starts,
            m.index,
            m.index + 4,
            'ROSLYN_TODO_NOTE',
            DIAGNOSTIC_SEVERITY.INFO,
            '检测到 TODO 标记，建议在提交前处理或说明。'
        );
    }

    return diagnostics;
}

function send(id, type, payload) {
    self.postMessage({ id, type, payload });
}

self.onmessage = function (event) {
    const req = event && event.data ? event.data : {};
    const id = req.id;
    const type = req.type;
    const payload = req.payload || {};

    try {
        if (type === MESSAGE_TYPES.INDEX_SET) {
            index = normalizeApiIndex(payload.index);
            send(id, MESSAGE_TYPES.INDEX_SET_RESPONSE, { ok: true });
            return;
        }

        if (type === MESSAGE_TYPES.DIAGNOSTICS_ROSLYN_REQUEST) {
            const diagnostics = analyze(payload.text || '');
            send(id, MESSAGE_TYPES.DIAGNOSTICS_ROSLYN_RESPONSE, { diagnostics });
            return;
        }

        throw new Error(`Unsupported message type: ${String(type || '')}`);
    } catch (error) {
        send(id, MESSAGE_TYPES.ERROR, {
            message: error && error.message ? error.message : String(error)
        });
    }
};
