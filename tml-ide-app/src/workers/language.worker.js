import { MESSAGE_TYPES } from '../contracts/messages.js';
import {
    createLanguageState,
    getCompletionItems,
    getHoverInfo,
    getIndexStats,
    getRuleDiagnostics,
    importAssemblyFromXml,
    setLanguageIndex
} from '../lib/language-core.js';
import { createEmptyApiIndex } from '../lib/index-schema.js';

const state = createLanguageState(createEmptyApiIndex());

function send(id, type, payload) {
    self.postMessage({ id, type, payload });
}

self.onmessage = function (event) {
    const request = event && event.data ? event.data : {};
    const id = request.id;
    const type = request.type;
    const payload = request.payload || {};

    try {
        if (type === MESSAGE_TYPES.INDEX_SET) {
            const index = setLanguageIndex(state, payload.index);
            send(id, MESSAGE_TYPES.INDEX_SET_RESPONSE, {
                ok: true,
                stats: getIndexStats(index)
            });
            return;
        }

        if (type === MESSAGE_TYPES.COMPLETION_REQUEST) {
            const items = getCompletionItems(state, payload);
            send(id, MESSAGE_TYPES.COMPLETION_RESPONSE, { items });
            return;
        }

        if (type === MESSAGE_TYPES.HOVER_REQUEST) {
            const hover = getHoverInfo(state, payload);
            send(id, MESSAGE_TYPES.HOVER_RESPONSE, { hover });
            return;
        }

        if (type === MESSAGE_TYPES.DIAGNOSTICS_RULE_REQUEST) {
            const diagnostics = getRuleDiagnostics(state, payload);
            send(id, MESSAGE_TYPES.DIAGNOSTICS_RULE_RESPONSE, { diagnostics });
            return;
        }

        if (type === MESSAGE_TYPES.ASSEMBLY_IMPORT_REQUEST) {
            const summary = importAssemblyFromXml(state, payload);
            send(id, MESSAGE_TYPES.ASSEMBLY_IMPORT_RESPONSE, {
                summary,
                stats: getIndexStats(state.index)
            });
            return;
        }

        throw new Error(`Unsupported message type: ${String(type || '')}`);
    } catch (error) {
        send(id, MESSAGE_TYPES.ERROR, {
            message: error && error.message ? error.message : String(error)
        });
    }
};
