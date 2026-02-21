export function createUnifiedSubmitService(options) {
    const opts = options || {};
    const normalizeRepoPath = typeof opts.normalizeRepoPath === 'function'
        ? opts.normalizeRepoPath
        : (value) => String(value || '').trim();

    function normalizeFiles(files, workspace) {
        if (!Array.isArray(files)) return [];
        return files
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                return {
                    workspace: String(workspace || ''),
                    path: normalizeRepoPath(item.path),
                    content: String(item.content || ''),
                    encoding: String(item.encoding || 'utf8').toLowerCase() === 'base64' ? 'base64' : 'utf8',
                    source: String(item.source || workspace || ''),
                    isMainMarkdown: !!item.isMainMarkdown,
                    op: String(item.op || '')
                };
            })
            .filter((item) => item && item.path);
    }

    return {
        normalizeFiles
    };
}

