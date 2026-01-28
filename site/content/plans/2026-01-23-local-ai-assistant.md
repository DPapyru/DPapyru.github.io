# Local AI Assistant (Browser-Only) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add a GitHub Pages–hosted, browser-only “AI 助手” that supports chat-style guidance, error+code diagnostics, and clickable doc-path jumping, with streamed output and a strict size budget (≤150MB, chunked files).

**Architecture:** UI (`ai.html`) talks to a classic Web Worker that loads `site/assets/search-index.json`, runs deterministic routing/retrieval/diagnostics, and optionally hooks in local models later. Default mode works without downloading any large model; “增强” features are opt-in and cached.

**Tech Stack:** Vanilla JS (CommonJS/UMD style), Web Worker, existing Tree-sitter runtime (already vendored), `site/assets/search-index.json` for retrieval, Node `--test` for unit tests, `generate-index.js` for sitemap integration.

---

### Task 1: Add AI core utilities (tokenize/search/router)

**Files:**
- Create: `site/assets/js/ai-core.js`
- Create: `test/ai-core.test.js`

**Step 1: Write failing tests (RED)**
- Add tests for:
  - `tokenizeMixedText()` handles ASCII identifiers + Chinese
  - `scoreDocAgainstQuery()` ranks title hits higher than body
  - `predictRoute()` returns a stable label for known keywords

**Step 2: Run tests to verify failure**
- Run: `node --test test/ai-core.test.js`
- Expected: FAIL (module not found / functions missing)

**Step 3: Implement minimal UMD module (GREEN)**
- Implement: tokenization, lexical scoring, snippet extraction helpers, tiny router inference (keyword + optional model weights).

**Step 4: Run tests to verify pass**
- Run: `node --test test/ai-core.test.js`
- Expected: PASS

---

### Task 2: Add trainable “router model” (offline training artifacts)

**Files:**
- Create: `site/assets/ai/router-training-data.v1.json`
- Create: `site/assets/ai/router-model.v1.json`
- Create: `scripts/train-ai-router.js`
- Modify: `package.json` (add `train:ai-router`)

**Step 1: Write failing tests (RED)**
- Add a test that `router-model.v1.json` is loadable and `predictRoute()` can use it.

**Step 2: Run tests to verify failure**
- Run: `node --test test/ai-core.test.js`
- Expected: FAIL (missing model file / missing integration)

**Step 3: Implement training script (GREEN)**
- Provide deterministic Naive Bayes trainer that reads training data and writes a compact model JSON.

**Step 4: Regenerate model and verify**
- Run: `node scripts/train-ai-router.js`
- Run: `node --test test/ai-core.test.js`
- Expected: PASS

---

### Task 3: Add AI worker (retrieval + diagnostics + streaming events)

**Files:**
- Create: `site/assets/js/ai.worker.js`

**Step 1: Implement worker message protocol**
- `ask` → emits:
  - `trace` events (step updates)
  - `answer_delta` events (streaming text)
  - `result` event (final structured payload: links, diagnostics, raw text)

**Step 2: Retrieval**
- Load `site/assets/search-index.json` once and cache.
- Return top docs + snippets with `site/pages/viewer.html?file=...` links.

**Step 3: Diagnostics**
- If `errorText` present: recognize common exceptions and map to checklists.
- If `codeText` present: parse with existing Tree-sitter C# (reuse the approach from `site/assets/js/knowledge-cards.worker.js`) and run a few safe heuristics.

---

### Task 4: Add AI page + UI (tabs, streamed output, citations)

**Files:**
- Create: `ai.html`
- Create: `site/assets/js/ai.js`
- Create: `site/assets/css/ai.css`

**Step 1: UI**
- Tabs: `对话` / `诊断` / `定位`
- Inputs:
  - Chat query
  - Error text + code paste (diagnose)
- Output:
  - Streamed answer area
  - Streamed trace area (expand/collapse)
  - Clickable source links (doc paths)

**Step 2: Worker integration**
- Spawn `site/assets/js/ai.worker.js`
- Display streaming updates as they arrive

---

### Task 5: Site integration (nav + sitemap)

**Files:**
- Modify: `index.html`
- Modify: `qa.html`
- Modify: `onboarding.html`
- Modify: `search-results.html`
- Modify: `404.html`
- Modify: `site/index.html`
- Modify: `site/pages/folder.html`
- Modify: `site/pages/viewer.html`
- Modify: `generate-index.js` (include `/ai.html` in static pages for sitemap)

**Step 1: Add nav link**
- Add `AI` link pointing to `/site/ai.html` (or `../ai.html` when linking from `/site/pages/`).

**Step 2: Regenerate sitemap / indexes**
- Run: `npm run build`
- Expected: `sitemap.xml` includes `/ai.html`

---

### Task 6: Verification

**Step 1: Run unit tests**
- Run: `node --test`
- Expected: PASS

**Step 2: Check generated files**
- Run: `npm run build`
- Optional: `npm run check-generated` (if git works in this environment)
