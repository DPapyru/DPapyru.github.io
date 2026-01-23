// guided-lookup.js - 引导学习与内容查找（纯静态：构建期语义投影 + 运行期混合检索）
(function () {
    'use strict';

    function fnv1a32(str) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return hash >>> 0;
    }

    function float16ToFloat32(bits) {
        const sign = (bits & 0x8000) ? -1 : 1;
        const exp = (bits >> 10) & 0x1f;
        const frac = bits & 0x03ff;

        if (exp === 0) {
            if (frac === 0) return sign * 0;
            return sign * Math.pow(2, -14) * (frac / 1024);
        }
        if (exp === 31) return frac ? NaN : (sign * Infinity);
        return sign * Math.pow(2, exp - 15) * (1 + (frac / 1024));
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function decodeBase64Float16ToFloat32Array(base64) {
        const bytes = base64ToUint8Array(base64);
        const out = new Float32Array(bytes.length / 2);
        for (let i = 0; i < out.length; i++) {
            const lo = bytes[i * 2];
            const hi = bytes[i * 2 + 1];
            const bits = (hi << 8) | lo;
            out[i] = float16ToFloat32(bits);
        }
        return out;
    }

    function extractGuidedTokens(text) {
        const lower = String(text || '').toLowerCase();
        const tokens = [];

        const latin = lower.match(/[a-z0-9_\.#+-]+/g) || [];
        for (const t of latin) {
            if (t.length >= 2) tokens.push(t);
        }

        const cjkChars = lower.match(/[\u4e00-\u9fff]/g) || [];
        if (cjkChars.length > 0) {
            for (let i = 0; i < cjkChars.length; i++) tokens.push(cjkChars[i]);
            for (let i = 0; i + 1 < cjkChars.length; i++) tokens.push(cjkChars[i] + cjkChars[i + 1]);
            for (let i = 0; i + 2 < cjkChars.length; i++) tokens.push(cjkChars[i] + cjkChars[i + 1] + cjkChars[i + 2]);
        }

        return tokens;
    }

    function looksLikeCodeOrError(query) {
        const q = String(query || '');
        if (q.length >= 18 && /[A-Za-z_]\w*\s*\(/.test(q)) return true;
        if (q.length >= 18 && /Exception|StackTrace|NullReference|Argument/.test(q)) return true;
        if (q.length >= 24 && /[{};<>]/.test(q)) return true;
        if (q.length >= 24 && /[A-Za-z0-9_]+\.[A-Za-z0-9_]+/.test(q)) return true;
        return false;
    }

    function normalizeL2(vec, offset, dim) {
        let norm = 0;
        for (let i = 0; i < dim; i++) {
            const v = vec[offset + i];
            norm += v * v;
        }
        norm = Math.sqrt(norm) || 1;
        for (let i = 0; i < dim; i++) vec[offset + i] /= norm;
    }

    function dot(a, aOffset, b, bOffset, dim) {
        let sum = 0;
        for (let i = 0; i < dim; i++) sum += a[aOffset + i] * b[bOffset + i];
        return sum;
    }

    function createMinHeap(capacity) {
        const heapScore = [];
        const heapIndex = [];

        function swap(i, j) {
            const ts = heapScore[i];
            heapScore[i] = heapScore[j];
            heapScore[j] = ts;
            const ti = heapIndex[i];
            heapIndex[i] = heapIndex[j];
            heapIndex[j] = ti;
        }

        function bubbleUp(pos) {
            while (pos > 0) {
                const parent = (pos - 1) >> 1;
                if (heapScore[parent] <= heapScore[pos]) break;
                swap(parent, pos);
                pos = parent;
            }
        }

        function bubbleDown(pos) {
            for (;;) {
                const left = pos * 2 + 1;
                const right = left + 1;
                let smallest = pos;
                if (left < heapScore.length && heapScore[left] < heapScore[smallest]) smallest = left;
                if (right < heapScore.length && heapScore[right] < heapScore[smallest]) smallest = right;
                if (smallest === pos) break;
                swap(pos, smallest);
                pos = smallest;
            }
        }

        return {
            tryPush(score, index) {
                if (heapScore.length < capacity) {
                    heapScore.push(score);
                    heapIndex.push(index);
                    bubbleUp(heapScore.length - 1);
                    return;
                }
                if (capacity <= 0) return;
                if (score <= heapScore[0]) return;
                heapScore[0] = score;
                heapIndex[0] = index;
                bubbleDown(0);
            },
            toSortedDesc() {
                const out = [];
                for (let i = 0; i < heapScore.length; i++) out.push({ score: heapScore[i], index: heapIndex[i] });
                out.sort((a, b) => b.score - a.score);
                return out;
            }
        };
    }

    function GuidedLookupEngine(payload) {
        this.version = payload.version;
        this.featureDim = payload.featureDim;
        this.latentDim = payload.latentDim;
        this.chunkCount = payload.chunkCount;
        this.chunks = payload.chunks || [];

        this.idf = decodeBase64Float16ToFloat32Array(payload.idfF16);
        this.v = decodeBase64Float16ToFloat32Array(payload.vF16);
        this.chunkVec = decodeBase64Float16ToFloat32Array(payload.chunkVecF16);
    }

    GuidedLookupEngine.load = async function (url) {
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error('无法加载 guided index：' + resp.status);
        const payload = await resp.json();
        return new GuidedLookupEngine(payload);
    };

    GuidedLookupEngine.prototype.buildQueryVector = function (query) {
        const tokens = extractGuidedTokens(query);
        if (!tokens.length) return null;

        const tf = new Map();
        for (const t of tokens) {
            const idx = fnv1a32(t) % this.featureDim;
            tf.set(idx, (tf.get(idx) || 0) + 1);
        }

        const qVec = new Float32Array(this.latentDim);
        for (const [idx, count] of tf.entries()) {
            const w = (1 + Math.log(count)) * this.idf[idx];
            const vOffset = idx * this.latentDim;
            for (let d = 0; d < this.latentDim; d++) qVec[d] += w * this.v[vOffset + d];
        }
        normalizeL2(qVec, 0, this.latentDim);
        return qVec;
    };

    GuidedLookupEngine.prototype.lexicalScore = function (chunk, queryLower, lexTokens) {
        const title = (chunk.title || '').toLowerCase();
        const text = (chunk.text || '').toLowerCase();
        const category = (chunk.category || '').toLowerCase();
        const topic = (chunk.topic || '').toLowerCase();

        let score = 0;
        if (queryLower && queryLower.length >= 3) {
            if (title.includes(queryLower)) score += 6;
            if (text.includes(queryLower)) score += 4;
        }

        for (const token of lexTokens) {
            if (!token) continue;
            if (title.includes(token)) score += 3;
            if (text.includes(token)) score += 1;
            if (category.includes(token)) score += 1.5;
            if (topic.includes(token)) score += 1;
        }

        return score;
    };

    GuidedLookupEngine.prototype.search = function (query, options) {
        const opts = options || {};
        const limit = typeof opts.limit === 'number' ? opts.limit : 8;
        const candidateLimit = typeof opts.candidateLimit === 'number' ? opts.candidateLimit : 400;
        const categoryFilter = opts.category || '';
        const difficultyFilter = opts.difficulty || '';

        const qVec = this.buildQueryVector(query);
        if (!qVec) return [];

        const qLower = String(query || '').toLowerCase().trim();
        const lexAll = extractGuidedTokens(query).slice(0, 32);
        const lexTokens = lexAll.filter(t => t.length >= 2).slice(0, 24);

        let candidates;
        if (looksLikeCodeOrError(query)) {
            const heap = createMinHeap(Math.max(candidateLimit, 800));
            for (let i = 0; i < this.chunks.length; i++) {
                const chunk = this.chunks[i];
                if (categoryFilter && chunk.category !== categoryFilter) continue;
                if (difficultyFilter && chunk.difficulty !== difficultyFilter) continue;
                const s = this.lexicalScore(chunk, qLower, lexTokens);
                if (s > 0) heap.tryPush(s, i);
            }
            candidates = heap.toSortedDesc().map(x => ({ index: x.index, lex: x.score }));
        } else {
            const heap = createMinHeap(candidateLimit);
            for (let i = 0; i < this.chunks.length; i++) {
                const chunk = this.chunks[i];
                if (categoryFilter && chunk.category !== categoryFilter) continue;
                if (difficultyFilter && chunk.difficulty !== difficultyFilter) continue;
                const score = dot(this.chunkVec, i * this.latentDim, qVec, 0, this.latentDim);
                heap.tryPush(score, i);
            }
            candidates = heap.toSortedDesc().map(x => ({ index: x.index, sem: x.score }));
        }

        let maxLex = 0;
        const scored = [];
        for (const c of candidates) {
            const i = c.index;
            const chunk = this.chunks[i];
            const sem = typeof c.sem === 'number'
                ? c.sem
                : dot(this.chunkVec, i * this.latentDim, qVec, 0, this.latentDim);
            const lex = typeof c.lex === 'number' ? c.lex : this.lexicalScore(chunk, qLower, lexTokens);
            if (lex > maxLex) maxLex = lex;
            scored.push({ index: i, sem, lex });
        }

        const semWeight = typeof opts.semanticWeight === 'number' ? opts.semanticWeight : 0.75;
        const lexWeight = 1 - semWeight;
        for (const s of scored) {
            const lexNorm = maxLex > 0 ? (s.lex / maxLex) : 0;
            s.score = (s.sem * semWeight) + (lexNorm * lexWeight);
        }
        scored.sort((a, b) => b.score - a.score);

        const out = [];
        const seenDoc = new Set();
        for (const s of scored) {
            const chunk = this.chunks[s.index];
            const key = chunk.path + '|' + chunk.text;
            if (out.length < Math.max(3, Math.floor(limit / 2))) {
                // 初期阶段尽量多样化（不同文章）
                if (seenDoc.has(chunk.path)) continue;
            }
            if (seenDoc.has(key)) continue;
            seenDoc.add(key);
            seenDoc.add(chunk.path);
            out.push({
                ...chunk,
                score: s.score,
                semantic: s.sem,
                lexical: s.lex
            });
            if (out.length >= limit) break;
        }

        return out;
    };

    window.GuidedLookupEngine = GuidedLookupEngine;
})();

