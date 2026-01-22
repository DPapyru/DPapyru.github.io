// Learning paths: load mapping, read profile/prefs, filter docs lists.
// Style: semicolons, 4-space indent, IIFE with global export.
(function () {
    'use strict';

    var PROFILE_KEY = 'learningProfile';
    var DISMISSED_KEY = 'learningOnboardingDismissed';
    var PREFS_KEY = 'learningPreferences';
    var SHOW_UNMAPPED_KEY = 'learningFilterShowUnmapped';
    var SHOW_ALL_KEY = 'learningFilterShowAll';

    var state = {
        promise: null,
        mapping: null
    };

    function inDocs() {
        return String(window.location.pathname || '').indexOf('/docs/') !== -1;
    }

    function getMappingUrl() {
        return inDocs() ? '../assets/learning-paths.v1.json' : 'assets/learning-paths.v1.json';
    }

    function normalizePath(value) {
        var p = String(value || '')
            .replace(/\\/g, '/')
            .trim();

        p = p.replace(/^\.\//, '');
        p = p.replace(/^\/+|\/+$/g, '');

        // config.json 的 doc.path 是以 docs/ 目录为根的相对路径；
        // learning-paths 映射可能使用 docs/ 前缀，为兼容两种写法，这里统一去掉 docs/。
        p = p.replace(/^docs\//, '');

        return p;
    }

    function normalizePrefix(prefix) {
        var p = normalizePath(prefix);
        if (!p) return '';
        return p.endsWith('/') ? p : (p + '/');
    }

    function clampLevel(value) {
        var n = Number.parseInt(value, 10);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(2, n));
    }

    function readOptionalLevel(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return clampLevel(value);
        if (typeof value === 'string' && value.trim() !== '') return clampLevel(value);
        return null;
    }

    function readJsonFromLocalStorage(key) {
        try {
            var raw = window.localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeLocalStorage(key, value) {
        try {
            window.localStorage.setItem(key, String(value));
        } catch (e) {
            // ignore
        }
    }

    function readBool(key) {
        try {
            return window.localStorage.getItem(key) === 'true';
        } catch (e) {
            return false;
        }
    }

    function getProfile() {
        var parsed = readJsonFromLocalStorage(PROFILE_KEY);
        if (!parsed || typeof parsed !== 'object') return null;
        if (typeof parsed.c === 'undefined' || typeof parsed.t === 'undefined') return null;
        return {
            c: clampLevel(parsed.c),
            t: clampLevel(parsed.t)
        };
    }

    function getPreferences() {
        var parsed = readJsonFromLocalStorage(PREFS_KEY);
        if (!parsed || typeof parsed !== 'object') return {};
        var out = {};
        Object.keys(parsed).forEach(function (key) {
            var v = parsed[key];
            if (v && typeof v === 'object') {
                if (typeof v.value === 'string') {
                    out[key] = {
                        value: v.value,
                        label: typeof v.label === 'string' ? v.label : v.value
                    };
                }
                return;
            }
            if (typeof v === 'string') {
                out[key] = { value: v, label: v };
            }
        });
        return out;
    }

    function getPrefs() {
        return {
            showUnmapped: readBool(SHOW_UNMAPPED_KEY),
            showAll: readBool(SHOW_ALL_KEY)
        };
    }

    function setPref(prefKey, value) {
        if (prefKey === 'showUnmapped') {
            writeLocalStorage(SHOW_UNMAPPED_KEY, value ? 'true' : 'false');
        }
        if (prefKey === 'showAll') {
            writeLocalStorage(SHOW_ALL_KEY, value ? 'true' : 'false');
        }
    }

    function getOnboardingUrl() {
        return inDocs() ? '../onboarding.html' : 'onboarding.html';
    }

    function dismissOnboarding() {
        writeLocalStorage(DISMISSED_KEY, 'true');
    }

    function normalizeMapping(mapping) {
        var out = mapping && typeof mapping === 'object' ? mapping : {};
        if (!Array.isArray(out.prefixRules)) out.prefixRules = [];
        if (!out.docRules || typeof out.docRules !== 'object') out.docRules = {};

        // 归一化 docRules 的 key，避免 docs/ 前缀不一致导致全量“未标注”。
        var normalizedDocRules = {};
        Object.keys(out.docRules).forEach(function (key) {
            var normalizedKey = normalizePath(key);
            if (!normalizedKey) return;
            normalizedDocRules[normalizedKey] = out.docRules[key];
        });
        out.docRules = normalizedDocRules;

        return out;
    }

    async function load(options) {
        options = options || {};
        if (!options.force && state.promise) return state.promise;

        state.promise = (async function () {
            try {
                var url = getMappingUrl();
                var response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) throw new Error('Failed to load learning paths: ' + response.status);
                state.mapping = normalizeMapping(await response.json());
                return state.mapping;
            } catch (e) {
                state.mapping = normalizeMapping(null);
                return state.mapping;
            }
        }());

        return state.promise;
    }

    function isMappingEmpty(mapping) {
        var m = normalizeMapping(mapping);
        return (!m.prefixRules || m.prefixRules.length === 0) && (!m.docRules || Object.keys(m.docRules).length === 0);
    }

    function getEffectiveRule(mapping, docPath) {
        var m = normalizeMapping(mapping);
        var path = normalizePath(docPath);
        if (!path) return null;

        var direct = m.docRules[path];
        if (direct && typeof direct === 'object') {
            return {
                minC: clampLevel(direct.minC),
                minT: clampLevel(direct.minT),
                source: 'doc'
            };
        }

        var best = null;
        var bestLen = -1;
        m.prefixRules.forEach(function (rule) {
            if (!rule || typeof rule !== 'object') return;
            var prefix = normalizePrefix(rule.prefix);
            if (!prefix) return;
            if (path.indexOf(prefix) !== 0) return;
            if (prefix.length > bestLen) {
                bestLen = prefix.length;
                best = rule;
            }
        });

        if (!best) return null;
        return {
            minC: clampLevel(best.minC),
            minT: clampLevel(best.minT),
            source: 'prefix'
        };
    }

    function getMetaRule(doc) {
        if (!doc || typeof doc !== 'object') return null;
        var minC = readOptionalLevel(doc.min_c);
        var minT = readOptionalLevel(doc.min_t);
        if (minC == null && minT == null) return null;
        return {
            minC: minC == null ? 0 : minC,
            minT: minT == null ? 0 : minT,
            source: 'meta'
        };
    }

    async function applyFilter(docs) {
        var mapping = await load();
        var profile = getProfile();
        var prefs = getPrefs();

        var docList = Array.isArray(docs) ? docs : [];
        var visible = [];

        var counts = {
            total: docList.length,
            mapped: 0,
            unmapped: 0,
            visible: 0,
            hidden: 0
        };

        if (!profile || prefs.showAll) {
            visible = docList.slice();
            counts.visible = visible.length;
            counts.hidden = Math.max(0, counts.total - counts.visible);
            return {
                mapping: mapping,
                mappingEmpty: isMappingEmpty(mapping),
                profile: profile,
                prefs: prefs,
                isStrict: Boolean(profile) && !prefs.showAll && !prefs.showUnmapped,
                visibleDocs: visible,
                counts: counts
            };
        }

        docList.forEach(function (doc) {
            var path = doc && (doc.path || doc.filename) ? String(doc.path || doc.filename) : '';
            var normalized = normalizePath(path);
            var rule = getEffectiveRule(mapping, normalized) || getMetaRule(doc);
            if (!rule) {
                counts.unmapped += 1;
                if (prefs.showUnmapped) {
                    visible.push(doc);
                } else {
                    counts.hidden += 1;
                }
                return;
            }

            counts.mapped += 1;
            if (profile.c >= rule.minC && profile.t >= rule.minT) {
                visible.push(doc);
                return;
            }

            counts.hidden += 1;
        });

        counts.visible = visible.length;

        return {
            mapping: mapping,
            mappingEmpty: isMappingEmpty(mapping),
            profile: profile,
            prefs: prefs,
            isStrict: Boolean(profile) && !prefs.showAll && !prefs.showUnmapped,
            visibleDocs: visible,
            counts: counts
        };
    }

    window.LearningPaths = {
        load: load,
        getProfile: getProfile,
        getPreferences: getPreferences,
        getPrefs: getPrefs,
        setPref: setPref,
        getOnboardingUrl: getOnboardingUrl,
        dismissOnboarding: dismissOnboarding,
        getEffectiveRule: getEffectiveRule,
        applyFilter: applyFilter
    };
}());
