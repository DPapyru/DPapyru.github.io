#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
}

function mergeInto(target, source) {
    if (!target || !source) return;
    Object.keys(source).forEach((key) => {
        const sv = source[key];
        const tv = target[key];

        if (Array.isArray(sv)) {
            if (!Array.isArray(tv)) target[key] = sv.slice();
            else target[key] = tv.concat(sv);
            return;
        }

        if (sv && typeof sv === 'object') {
            if (!tv || typeof tv !== 'object' || Array.isArray(tv)) {
                target[key] = { ...sv };
                return;
            }
            mergeInto(tv, sv);
            return;
        }

        target[key] = sv;
    });
}

function readMapBundle(mapPath) {
    const root = readJson(mapPath);
    if (!root || !Array.isArray(root.parts) || root.parts.length === 0) {
        return {
            mode: 'single',
            rootPath: mapPath,
            merged: root,
            providers: null
        };
    }

    const providers = {};
    const merged = { ...root };
    delete merged.parts;

    root.parts.forEach((p) => {
        if (!p || typeof p.path !== 'string') return;
        const partPath = path.resolve(path.dirname(mapPath), p.path);
        const partDoc = readJson(partPath);
        mergeInto(merged, partDoc);

        const provides = Array.isArray(p.provides) ? p.provides : [];
        provides.forEach((k) => {
            if (typeof k === 'string' && k) providers[k] = partPath;
        });
    });

    return {
        mode: 'bundle',
        rootPath: mapPath,
        merged,
        providers
    };
}

function writeMapBundle(bundle) {
    if (!bundle || !bundle.merged) return;
    if (bundle.mode !== 'bundle' || !bundle.providers) {
        writeJson(bundle.rootPath, bundle.merged);
        return;
    }

    const providers = bundle.providers;
    const merged = bundle.merged;

    Object.keys(providers).forEach((key) => {
        const filePath = providers[key];
        if (!filePath) return;
        const partDoc = readJson(filePath);
        partDoc[key] = merged[key];
        writeJson(filePath, partDoc);
    });
}

function toAsciiId(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-')
        .slice(0, 80);
}

function ensureObject(obj, key) {
    if (!obj[key] || typeof obj[key] !== 'object') obj[key] = {};
    return obj[key];
}

function ensureArray(obj, key) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    return obj[key];
}

function uniquePush(arr, item, isSame) {
    for (let i = 0; i < arr.length; i++) {
        if (isSame(arr[i], item)) return;
    }
    arr.push(item);
}

function main() {
    const args = process.argv.slice(2);
    const indexArg = args.indexOf('--index');
    const mapArg = args.indexOf('--map');
    if (indexArg < 0 || mapArg < 0 || !args[indexArg + 1] || !args[mapArg + 1]) {
        console.error('Usage: node scripts/knowledge/generate-map-stubs-from-api-index.js --index <tmodloader-api-index.v1.json> --map <site/assets/knowledge/map.v1.json>');
        process.exit(2);
    }

    const indexPath = path.resolve(args[indexArg + 1]);
    const mapPath = path.resolve(args[mapArg + 1]);

    const apiIndex = readJson(indexPath);
    const bundle = readMapBundle(mapPath);
    const mapDoc = bundle.merged;

    const concepts = ensureObject(mapDoc, 'concepts');
    const routes = ensureArray(ensureObject(mapDoc, 'tmodloaderApi'), 'routes');
    const lexemes = ensureObject(mapDoc, 'lexemes');

    const allowlist = {
        'Terraria.Player': ['AddBuff', 'HealEffect', 'Hurt', 'KillMe'],
        'Terraria.NPC': ['AddBuff', 'StrikeNPC', 'TargetClosest', 'AnyNPCs'],
        'Terraria.Main': ['NewText']
    };

    Object.keys(allowlist).forEach((typeName) => {
        const typeNode = apiIndex && apiIndex.types ? apiIndex.types[typeName] : null;
        if (!typeNode) return;

        const methods = typeNode.methods || {};
        allowlist[typeName].forEach((methodName) => {
            if (!methods[methodName]) return;

            const id = 'api-' + toAsciiId(typeName) + '-' + toAsciiId(methodName);
            if (!concepts[id]) {
                const shortType = typeName.split('.').pop();
                concepts[id] = {
                    title: shortType + '.' + methodName + '(...)',
                    notes: [
                        '（自动生成占位）后续可补充：用途、常见场景、注意事项。'
                    ],
                    collections: [
                        { id: 'tmodloader-vanilla-methods', boost: 1 }
                    ]
                };
            }

            uniquePush(routes, {
                declaringType: typeName,
                memberKind: 'method',
                name: methodName,
                conceptId: id
            }, (a, b) => a && b &&
                a.declaringType === b.declaringType &&
                a.memberKind === b.memberKind &&
                a.name === b.name
            );

            const lexKey = String(methodName || '').toLowerCase();
            if (!lexemes[lexKey]) {
                lexemes[lexKey] = id;
            }
        });
    });

    writeMapBundle(bundle);
    console.log('Updated:', bundle.rootPath);
}

main();
