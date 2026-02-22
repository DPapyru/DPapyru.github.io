function normalizeIssue(issue) {
    const safe = issue && typeof issue === 'object' ? issue : {};
    return {
        source: String(safe.source || ''),
        code: String(safe.code || ''),
        severity: String(safe.severity || 'info'),
        message: String(safe.message || ''),
        startLineNumber: Number(safe.startLineNumber || 1),
        startColumn: Number(safe.startColumn || 1),
        endLineNumber: Number(safe.endLineNumber || safe.startLineNumber || 1),
        endColumn: Number(safe.endColumn || safe.startColumn || 1),
        filePath: String(safe.filePath || '')
    };
}

function toPascalCase(raw) {
    const text = String(raw || '').replace(/\.[A-Za-z0-9]+$/, '');
    const parts = text
        .replace(/[^A-Za-z0-9_]+/g, ' ')
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (!parts.length) return '';
    return parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
        .replace(/[^A-Za-z0-9_]/g, '');
}

export function inferNamespaceFromPath(pathValue) {
    const normalized = String(pathValue || '').replace(/\\/g, '/').trim();
    if (!normalized) return 'YourModNamespace';

    const segments = normalized.split('/').filter(Boolean);
    if (!segments.length) return 'YourModNamespace';

    let start = 0;
    const contentIndex = segments.findIndex((part) => String(part).toLowerCase() === 'content');
    if (contentIndex >= 0) {
        start = contentIndex + 1;
    }

    const ignored = new Set(['site', 'content', 'code', 'anims', 'imgs', 'media']);
    const names = [];
    for (let i = start; i < segments.length; i += 1) {
        const segment = String(segments[i] || '');
        if (!segment) continue;
        const lower = segment.toLowerCase();
        if (ignored.has(lower)) continue;
        const pascal = toPascalCase(segment);
        if (!pascal) continue;
        names.push(pascal);
    }

    if (!names.length) return 'YourModNamespace';
    return names.slice(0, 5).join('.');
}

function buildSuggestion(id, title, description, copyText) {
    return {
        id: String(id || ''),
        title: String(title || ''),
        description: String(description || ''),
        copyText: String(copyText || '')
    };
}

function parseUnknownMemberName(message) {
    const text = String(message || '');
    const match = text.match(/成员[:：]\s*([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : '';
}

function uniqueStrings(values) {
    const set = new Set();
    const list = [];
    (Array.isArray(values) ? values : []).forEach((item) => {
        const text = String(item || '').trim();
        if (!text) return;
        const key = text.toLowerCase();
        if (set.has(key)) return;
        set.add(key);
        list.push(text);
    });
    return list;
}

function buildRuleSuggestions(issue, context) {
    if (issue.code === 'RULE_MISSING_SEMICOLON') {
        return [
            buildSuggestion(
                'rule.add-semicolon',
                '在语句末尾添加分号',
                '该行像是语句但未以分号结束。',
                '在当前语句末尾添加分号 ;'
            )
        ];
    }

    if (issue.code === 'RULE_UNKNOWN_MEMBER') {
        const unknown = parseUnknownMemberName(issue.message);
        const similar = uniqueStrings(context && context.similarMembers);
        if (similar.length > 0) {
            const first = similar[0];
            return [
                buildSuggestion(
                    'rule.member-nearest',
                    `尝试改为 ${first}`,
                    '检测到可能的拼写错误，建议先替换为最接近成员。',
                    `将成员名 ${unknown || '(当前成员)'} 替换为 ${first}`
                ),
                buildSuggestion(
                    'rule.member-candidates',
                    '查看候选成员',
                    '按候选成员逐个验证类型是否匹配。',
                    `候选成员：${similar.join(', ')}`
                )
            ];
        }
        return [
            buildSuggestion(
                'rule.member-check',
                '核对对象类型与成员名',
                '确认访问对象类型是否正确，或成员是否拼写错误。',
                '核对对象类型后修正成员名，必要时检查 using 与继承链。'
            )
        ];
    }

    if (issue.code === 'RULE_UNKNOWN_TYPE') {
        return [
            buildSuggestion(
                'rule.type-using',
                '补充 using 或修正类型名',
                '类型可能不在当前命名空间作用域内。',
                '检查 using 声明，确认类型名拼写，必要时使用完整限定名。'
            )
        ];
    }

    if (issue.code === 'RULE_ARG_COUNT') {
        return [
            buildSuggestion(
                'rule.arg-count',
                '调整方法参数个数',
                '当前调用参数数量与候选重载不匹配。',
                '查看该方法签名并调整参数数量、顺序与可选参数。'
            )
        ];
    }

    if (issue.code === 'RULE_UNCLOSED_SYMBOL' || issue.code === 'RULE_UNEXPECTED_CLOSING') {
        return [
            buildSuggestion(
                'rule.symbol-balance',
                '修复括号/花括号配对',
                '检测到符号未闭合或意外闭合。',
                '从当前行向上检查 () {} [] 的开闭配对并修复。'
            )
        ];
    }

    return [
        buildSuggestion(
            'rule.generic',
            '检查语法与上下文',
            '此规则诊断未提供专用修复模板。',
            '先定位该诊断位置，逐步检查语法、命名与类型匹配。'
        )
    ];
}

function buildRoslynSuggestions(issue) {
    if (issue.code === 'ROSLYN_NAMESPACE_RECOMMEND') {
        const ns = inferNamespaceFromPath(issue.filePath);
        return [
            buildSuggestion(
                'roslyn.namespace',
                '添加 namespace 声明',
                '为文件增加命名空间有助于工程可维护性。',
                `namespace ${ns}\n{\n    // TODO: move types into this namespace\n}`
            )
        ];
    }

    if (issue.code === 'ROSLYN_UNKNOWN_USING') {
        return [
            buildSuggestion(
                'roslyn.using-check',
                '核对 using 命名空间',
                '命名空间未命中索引，可能拼写错误或索引缺失。',
                '检查 using 语句拼写，必要时刷新索引或删除无效 using。'
            )
        ];
    }

    if (issue.code === 'ROSLYN_TODO_NOTE') {
        return [
            buildSuggestion(
                'roslyn.todo-track',
                '处理 TODO 标记',
                '提交前建议处理 TODO 或补充说明。',
                '将 TODO 转换为可执行任务，或在提交说明里标记原因与后续计划。'
            )
        ];
    }

    return [
        buildSuggestion(
            'roslyn.generic',
            '检查 Roslyn 建议',
            '请根据诊断信息手动调整代码。',
            '查看该诊断上下文并按建议修复。'
        )
    ];
}

function buildShaderSuggestions() {
    return [
        buildSuggestion(
            'shader.entry-check',
            '检查像素着色器入口与 technique/pass',
            '确认存在可编译入口函数并在 technique/pass 中正确引用。',
            '确认包含 float4 像素着色器入口，并在 technique/pass 中绑定正确。'
        ),
        buildSuggestion(
            'shader.line-check',
            '按报错行逐段注释定位',
            '从报错行附近逐段注释，快速定位语法或宏展开问题。',
            '从报错行开始逐段注释代码，确认语法、宏与 include 展开是否正确。'
        )
    ];
}

export function buildSuggestions(issueInput, context) {
    const issue = normalizeIssue(issueInput);
    const ctx = context && typeof context === 'object' ? context : {};

    if (issue.source === 'shader' || issue.code === 'SHADER_COMPILE_ERROR') {
        return buildShaderSuggestions();
    }
    if (issue.source === 'roslyn' || issue.code.startsWith('ROSLYN_')) {
        return buildRoslynSuggestions(issue);
    }
    return buildRuleSuggestions(issue, ctx);
}
