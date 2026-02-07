'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ALLOWED_DIMENSIONS = new Set(['C', 'T', 'G']);
const ALLOWED_PATHS = new Set(['remedial', 'standard', 'fast', 'deep']);

function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toPosixPath(filePath) {
    return String(filePath || '').replace(/\\/g, '/');
}

function listRouteFiles(rootDir) {
    const absRoot = path.resolve(String(rootDir || ''));
    if (!fs.existsSync(absRoot)) return [];

    const out = [];
    const queue = [absRoot];
    while (queue.length) {
        const current = queue.pop();
        let entries = [];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch (_) {
            continue;
        }

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                const dirName = String(entry.name || '').toLowerCase();
                if (dirName === 'templates' || dirName === 'examples') {
                    continue;
                }
                queue.push(fullPath);
                continue;
            }
            if (!entry.isFile()) continue;
            if (!entry.name.toLowerCase().endsWith('.route.json')) continue;
            out.push(fullPath);
        }
    }

    return out.sort((a, b) => a.localeCompare(b, 'en'));
}

function parseRouteJson(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return { data: JSON.parse(raw), error: null };
    } catch (error) {
        return {
            data: null,
            error: `JSON 解析失败: ${String(error && error.message ? error.message : error)}`
        };
    }
}

function validateRouteDefinition(routeData, filePath) {
    const errors = [];
    const route = isObject(routeData) ? routeData : null;

    if (!route) {
        return { errors: ['route 文件必须是对象'], route: null };
    }

    if (route.version !== 2) {
        errors.push('version 必须为 2');
    }

    if (typeof route.article !== 'string' || !route.article.trim()) {
        errors.push('article 必须是非空字符串');
    }

    if (typeof route.entry !== 'string' || !route.entry.trim()) {
        errors.push('entry 必须是非空字符串');
    }

    if (!Array.isArray(route.nodes) || route.nodes.length === 0) {
        errors.push('nodes 必须是非空数组');
        return { errors, route: null };
    }

    let decisionCount = 0;
    const nodeMap = new Map();

    for (const node of route.nodes) {
        if (!isObject(node)) {
            errors.push('nodes 中每一项必须是对象');
            continue;
        }

        const id = typeof node.id === 'string' ? node.id.trim() : '';
        const type = typeof node.type === 'string' ? node.type.trim() : '';

        if (!id) {
            errors.push('节点 id 不能为空');
            continue;
        }

        if (nodeMap.has(id)) {
            errors.push(`节点 id 重复: ${id}`);
            continue;
        }

        if (type !== 'decision' && type !== 'path') {
            errors.push(`节点 ${id} 的 type 必须是 decision 或 path`);
            continue;
        }

        if (type === 'decision') {
            decisionCount += 1;

            if (!ALLOWED_DIMENSIONS.has(node.dimension)) {
                errors.push(`节点 ${id} 的 dimension 必须是 C/T/G`);
            }
            if (!isObject(node.map)) {
                errors.push(`节点 ${id} 的 map 必须是对象`);
            }
            if (typeof node.fallback !== 'string' || !node.fallback.trim()) {
                errors.push(`节点 ${id} 缺少 fallback`);
            }

            if (isObject(node.map)) {
                const keys = Object.keys(node.map);
                for (const key of keys) {
                    if (!['0', '1', '2'].includes(key)) {
                        errors.push(`节点 ${id} 的 map 键只能是 0/1/2`);
                        break;
                    }
                    const target = node.map[key];
                    if (typeof target !== 'string' || !target.trim()) {
                        errors.push(`节点 ${id} 的 map.${key} 必须是非空字符串`);
                    }
                }
            }
        }

        if (type === 'path') {
            if (!ALLOWED_PATHS.has(node.path)) {
                errors.push(`节点 ${id} 的 path 必须是 remedial/standard/fast/deep`);
            }
            if (node.next != null && (typeof node.next !== 'string' || !node.next.trim())) {
                errors.push(`节点 ${id} 的 next 必须是非空字符串或省略`);
            }
        }

        nodeMap.set(id, node);
    }

    if (decisionCount > 3) {
        errors.push('decision 节点最多 3 个');
    }

    if (typeof route.entry === 'string' && route.entry.trim() && !nodeMap.has(route.entry.trim())) {
        errors.push(`entry 未指向有效节点: ${route.entry.trim()}`);
    }

    for (const [id, node] of nodeMap.entries()) {
        if (node.type === 'decision') {
            if (typeof node.fallback === 'string' && node.fallback.trim() && !nodeMap.has(node.fallback.trim())) {
                errors.push(`节点 ${id} 的 fallback 指向不存在节点: ${node.fallback}`);
            }

            if (isObject(node.map)) {
                for (const key of Object.keys(node.map)) {
                    const targetId = node.map[key];
                    if (typeof targetId === 'string' && targetId.trim() && !nodeMap.has(targetId.trim())) {
                        errors.push(`节点 ${id} 的 map.${key} 指向不存在节点: ${targetId}`);
                    }
                }
            }
        }

        if (node.type === 'path' && typeof node.next === 'string' && node.next.trim() && !nodeMap.has(node.next.trim())) {
            errors.push(`节点 ${id} 的 next 指向不存在节点: ${node.next}`);
        }
    }

    return { errors, route };
}

function normalizeNodes(nodes) {
    const out = {};
    for (const node of nodes) {
        if (!isObject(node) || typeof node.id !== 'string' || !node.id.trim()) continue;
        const id = node.id.trim();
        if (node.type === 'decision') {
            const map = isObject(node.map) ? node.map : {};
            out[id] = {
                type: 'decision',
                dimension: node.dimension,
                map: {
                    '0': map['0'] || null,
                    '1': map['1'] || null,
                    '2': map['2'] || null
                },
                fallback: node.fallback
            };
            continue;
        }

        if (node.type === 'path') {
            out[id] = {
                type: 'path',
                path: node.path
            };
            if (typeof node.next === 'string' && node.next.trim()) {
                out[id].next = node.next.trim();
            }
        }
    }
    return out;
}

function compileRoutes(options = {}) {
    const rootDir = path.resolve(options.rootDir || 'site/content/routes');
    const files = listRouteFiles(rootDir);
    const manifest = {
        version: 2,
        generatedAt: new Date().toISOString(),
        routes: {}
    };
    const errors = [];

    for (const filePath of files) {
        const parsed = parseRouteJson(filePath);
        if (parsed.error) {
            errors.push({ filePath, message: parsed.error });
            continue;
        }

        const checked = validateRouteDefinition(parsed.data, filePath);
        if (checked.errors.length) {
            for (const message of checked.errors) {
                errors.push({ filePath, message });
            }
            continue;
        }

        const route = checked.route;
        const article = route.article.trim();
        if (manifest.routes[article]) {
            errors.push({ filePath, message: `article 重复定义: ${article}` });
            continue;
        }

        manifest.routes[article] = {
            entry: route.entry.trim(),
            nodes: normalizeNodes(route.nodes),
            source: toPosixPath(path.relative(rootDir, filePath))
        };
    }

    return { rootDir, files, errors, manifest };
}

module.exports = {
    ALLOWED_DIMENSIONS,
    ALLOWED_PATHS,
    compileRoutes,
    listRouteFiles,
    validateRouteDefinition
};
