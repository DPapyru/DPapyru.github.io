function normalizeCompletionOffset(text, offset) {
    const safeText = String(text || '');
    const safeOffset = Number(offset);
    if (!Number.isFinite(safeOffset)) {
        return safeText.length;
    }
    if (safeOffset < 0) return 0;
    if (safeOffset > safeText.length) return safeText.length;
    return Math.floor(safeOffset);
}

function thisCompletionPrefixAtOffset(text, offset) {
    const source = String(text || '');
    const cursor = normalizeCompletionOffset(source, offset);
    const scope = source.slice(0, cursor);
    const match = scope.match(/\bthis\.([A-Za-z_$][A-Za-z0-9_$]*)?$/);
    if (!match) return null;
    return String(match[1] || '');
}

export function extractAnimTsAssignedThisFields(text) {
    const source = String(text || '');
    const fields = new Set();
    const assignRe = /\bthis\.([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:\+\+|--|(?:[+\-*/%&|^]|&&|\|\||\?\?)?=)/g;
    let match = null;

    while ((match = assignRe.exec(source)) !== null) {
        const label = String(match[1] || '');
        if (!label) continue;
        fields.add(label);
    }

    return Array.from(fields).sort((a, b) => a.localeCompare(b));
}

export function buildAnimTsThisFieldCompletionItems(text, offset, maxItems) {
    const prefix = thisCompletionPrefixAtOffset(text, offset);
    if (prefix === null) return [];

    const query = String(prefix || '').toLowerCase();
    const limit = Math.max(10, Number(maxItems) || 80);
    return extractAnimTsAssignedThisFields(text)
        .filter((label) => !query || String(label).toLowerCase().startsWith(query))
        .slice(0, limit)
        .map((label, index) => ({
            label,
            insertText: label,
            insertTextMode: 'plain',
            source: 'anim-this-field',
            kind: 'field',
            detail: 'Animation this-field',
            documentation: '',
            sortText: `0_anim_this_${String(index).padStart(3, '0')}_${label}`
        }));
}
