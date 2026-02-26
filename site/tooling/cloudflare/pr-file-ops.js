const ALLOWED_UPLOAD_SUFFIXES = Object.freeze([
    '.md',
    '.fx',
    '.route.json',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.avif',
    '.mp4',
    '.webm',
    '.cs'
]);

const EXTRA_FILE_ALLOWLIST_HINT = '只允许 site/content 下符合后缀白名单的文件：.md、.fx、.route.json、.json、.png、.jpg、.jpeg、.gif、.webp、.svg、.bmp、.avif、.mp4、.webm、.cs';

function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIncomingPath(input) {
    let path = String(input || '').trim().replace(/\\/g, '/');
    path = path.replace(/\s+\(workspace-[a-z0-9-]+\)$/i, '');
    path = path.replace(/^\.\/+/, '');
    path = path.replace(/^\/+/, '');
    path = path.replace(/\/{2,}/g, '/');
    return path;
}

function hasTraversal(path) {
    return /(^|\/)\.\.(\/|$)/.test(String(path || ''));
}

function sanitizeLegacyTargetPath(input) {
    let path = normalizeIncomingPath(input);
    path = path.replace(/^site\/content\//i, '');
    if (!path) {
        throw new Error('targetPath 为空');
    }
    if (hasTraversal(path)) {
        throw new Error('targetPath 非法');
    }
    if (!/\.md$/i.test(path)) {
        throw new Error('只允许 .md');
    }
    return path;
}

function sanitizeRepoPath(input) {
    const path = normalizeIncomingPath(input);
    if (!path) {
        throw new Error('file path 为空');
    }
    if (hasTraversal(path)) {
        throw new Error('file path 非法');
    }
    if (!/^site\/content\//i.test(path)) {
        throw new Error(`file path 必须位于 site/content：${path}`);
    }
    return path;
}

function isAllowedRepoPath(path) {
    const safe = String(path || '').toLowerCase();
    return ALLOWED_UPLOAD_SUFFIXES.some((suffix) => safe.endsWith(suffix));
}

function normalizeFileEncoding(rawEncoding, fieldLabel) {
    const encoding = String(rawEncoding || 'utf8').trim().toLowerCase();
    if (encoding !== 'utf8' && encoding !== 'base64') {
        throw new Error(`${fieldLabel} encoding 非法`);
    }
    return encoding;
}

function normalizeFileItem(raw, index) {
    if (!isObject(raw)) {
        throw new Error(`files[${index}] 必须是对象`);
    }

    const path = sanitizeRepoPath(raw.path);
    if (!isAllowedRepoPath(path)) {
        throw new Error(`file path 不在白名单：${path}；只允许 ${EXTRA_FILE_ALLOWLIST_HINT}`);
    }

    const op = String(raw.op || 'upsert').trim().toLowerCase() || 'upsert';
    if (op !== 'upsert' && op !== 'delete') {
        throw new Error(`files[${index}] op 非法：${op}`);
    }

    if (op === 'delete') {
        return {
            path,
            op: 'delete'
        };
    }

    const encoding = normalizeFileEncoding(raw.encoding, `files[${index}]`);
    const content = String(raw.content || '');
    if (encoding === 'base64') {
        if (content && !/^[A-Za-z0-9+/=\s]+$/.test(content)) {
            throw new Error(`files[${index}] base64 content 非法`);
        }
        return {
            path,
            op: 'upsert',
            encoding: 'base64',
            content: content.replace(/\s+/g, '')
        };
    }

    return {
        path,
        op: 'upsert',
        encoding: 'utf8',
        content
    };
}

function normalizeFilesArray(filesInput) {
    if (!Array.isArray(filesInput)) {
        throw new Error('files 必须是数组');
    }
    if (filesInput.length <= 0) {
        throw new Error('files 不能为空');
    }
    return filesInput.map((item, index) => normalizeFileItem(item, index));
}

function normalizeLegacyExtraFiles(extraFiles) {
    if (!Array.isArray(extraFiles)) return [];
    return extraFiles.map((item, index) => {
        if (!isObject(item)) {
            throw new Error(`extraFiles[${index}] 必须是对象`);
        }
        const path = sanitizeRepoPath(item.path);
        if (!isAllowedRepoPath(path)) {
            throw new Error(`extra file path 不在白名单：${path}；只允许 ${EXTRA_FILE_ALLOWLIST_HINT}`);
        }
        const encoding = normalizeFileEncoding(item.encoding, `extraFiles[${index}]`);
        const content = String(item.content || '');
        if (encoding === 'base64') {
            if (content && !/^[A-Za-z0-9+/=\s]+$/.test(content)) {
                throw new Error(`extraFiles[${index}] base64 content 非法`);
            }
            return {
                path,
                op: 'upsert',
                encoding: 'base64',
                content: content.replace(/\s+/g, '')
            };
        }
        return {
            path,
            op: 'upsert',
            encoding: 'utf8',
            content
        };
    });
}

function normalizeLegacyBody(body) {
    const safe = isObject(body) ? body : {};
    const targetPath = sanitizeLegacyTargetPath(safe.targetPath);
    const markdown = String(safe.markdown || '');
    if (!markdown.trim()) {
        throw new Error('markdown 不能为空');
    }

    const mainFile = {
        path: `site/content/${targetPath}`,
        op: 'upsert',
        encoding: 'utf8',
        content: markdown
    };
    const extraFiles = normalizeLegacyExtraFiles(safe.extraFiles);
    return {
        mode: 'legacy',
        targetPath,
        files: [mainFile].concat(extraFiles),
        primaryPath: mainFile.path
    };
}

export function resolveRequestFiles(body) {
    const safe = isObject(body) ? body : {};
    if (Object.prototype.hasOwnProperty.call(safe, 'files')) {
        const files = normalizeFilesArray(safe.files);
        return {
            mode: 'files',
            files,
            primaryPath: files[0] ? files[0].path : ''
        };
    }
    return normalizeLegacyBody(safe);
}

export function preflightDuplicatePathErrors(files) {
    const seen = new Set();
    const errors = [];
    (Array.isArray(files) ? files : []).forEach((file) => {
        const key = String(file && file.path || '').toLowerCase();
        if (!key) return;
        if (seen.has(key)) {
            errors.push({
                code: 'duplicate_file_path',
                path: String(file.path || ''),
                message: 'files 中出现重复路径'
            });
            return;
        }
        seen.add(key);
    });
    return errors;
}

export function toLegacyCompatibleResponseView(files) {
    const list = Array.isArray(files) ? files : [];
    const primary = list[0] || null;
    const extras = list.slice(1).map((item) => String(item.path || '')).filter(Boolean);
    return {
        filePath: primary ? String(primary.path || '') : '',
        extraFiles: extras
    };
}

export function getExtraFileAllowlistHint() {
    return EXTRA_FILE_ALLOWLIST_HINT;
}
