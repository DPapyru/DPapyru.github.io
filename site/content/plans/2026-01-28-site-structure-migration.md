# Site Structure Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the site into `/site` with shared JS in `/shared`, update all paths, and keep root as the multi-site publish root without running any heavy generation.

**Architecture:** The repository root becomes the publish root hosting multiple sites; the current site lives under `/site` while shared JS lives under `/shared`. All references are rewritten to use `/site` paths, and legacy `/docs` paths are removed.

**Tech Stack:** Static HTML/CSS/JS, Node build scripts (CommonJS), GitHub Pages.

### Task 1: Create the new directory skeleton

**Files:**
- Create: `site/pages/`
- Create: `site/content/`
- Create: `site/assets/`
- Create: `site/tooling/`
- Create: `site/tests/`
- Create: `shared/assets/js/`

**Step 1: Create directories**

Run:
```bash
mkdir -p site/pages site/content site/assets site/tooling site/tests shared/assets/js
```
Expected: directories exist, no output.

**Step 2: Verify**

Run:
```bash
ls -la site shared/assets
```
Expected: new folders listed.

---

### Task 2: Move site entry pages into `/site`

**Files:**
- Move: `index.html` -> `site/index.html`
- Move: `search-results.html` -> `site/search-results.html`
- Move: `404.html` -> `site/404.html`
- Move: `onboarding.html` -> `site/onboarding.html`
- Move: `qa.html` -> `site/qa.html`
- Move: `robots.txt` -> `site/robots.txt`
- Move: `sitemap.xml` -> `site/sitemap.xml`

**Step 1: Move files**

Run:
```bash
mv index.html search-results.html 404.html onboarding.html qa.html robots.txt sitemap.xml site/
```
Expected: files moved into `site/`.

---

### Task 3: Move content, assets, tooling, tests

**Files:**
- Move: `docs/` -> `site/content/`
- Move: `assets/` -> `site/assets/`
- Move: `scripts/` -> `site/tooling/scripts/`
- Move: `tools/` -> `site/tooling/tools/`
- Move: `lib/` -> `site/tooling/lib/`
- Move: `generate-index.js` -> `site/tooling/generate-index.js`
- Move: `test/` -> `site/tests/`

**Step 1: Move directories**

Run:
```bash
mv docs site/content
mv assets site/assets
mv scripts site/tooling/scripts
mv tools site/tooling/tools
mv lib site/tooling/lib
mv generate-index.js site/tooling/generate-index.js
mv test site/tests
```
Expected: paths updated, old paths absent.

---

### Task 4: Place `.nojekyll` at publish root

**Files:**
- Move (if exists): `site/content/.nojekyll` -> `.nojekyll`
- Or create: `.nojekyll`

**Step 1: Move if present**

Run:
```bash
if [ -f site/content/.nojekyll ]; then mv site/content/.nojekyll .nojekyll; fi
```
Expected: `.nojekyll` exists at repo root.

**Step 2: Ensure exists**

Run:
```bash
if [ ! -f .nojekyll ]; then : > .nojekyll; fi
```
Expected: `.nojekyll` present.

---

### Task 5: Add shared JS entrypoint

**Files:**
- Create: `shared/assets/js/site-core.js`

**Step 1: Add base config and bootstrap**

Create `shared/assets/js/site-core.js` with:
```js
(function () {
    if (window.SITE) return;
    window.SITE = {
        assetsRoot: '/site/assets',
        contentRoot: '/site/content',
        pagesRoot: '/site/pages'
    };

    window.SITE.bootstrapPage = function bootstrapPage(pageName) {
        var root = document.documentElement;
        root.setAttribute('data-site', 'site');
        if (!pageName) return;
        root.setAttribute('data-page', pageName);
    };
})();
```
Expected: shared JS available to all sites.

---

### Task 6: Update package.json scripts for new paths

**Files:**
- Modify: `package.json`

**Step 1: Update build scripts**

Change script paths to:
- `node site/tooling/generate-index.js`
- Any `scripts/...` paths -> `site/tooling/scripts/...`

Expected: no scripts reference old root paths.

---

### Task 7: Update generate-index and tooling paths

**Files:**
- Modify: `site/tooling/generate-index.js`
- Modify: `site/tooling/scripts/*`
- Modify: `site/tooling/scripts/knowledge/*`

**Step 1: Update constants**

Replace:
- `./docs/...` -> `./site/content/...`
- `./assets/...` -> `./site/assets/...`
- `./sitemap.xml` -> `./site/sitemap.xml`

**Step 2: Update sitemap URLs**

Update sitemap URLs to point to:
- `/site/` for site entry pages
- `/site/pages/viewer.html` and `/site/pages/folder.html`

Expected: all tooling uses new directory layout.

---

### Task 8: Move and update viewer/folder/anim-renderer pages

**Files:**
- Move: `site/content/viewer.html` -> `site/pages/viewer.html`
- Move: `site/content/folder.html` -> `site/pages/folder.html`
- Move: `site/content/anim-renderer.html` -> `site/pages/anim-renderer.html`
- Modify: `site/pages/viewer.html`
- Modify: `site/pages/folder.html`
- Modify: `site/pages/anim-renderer.html`

**Step 1: Move pages**

Run:
```bash
mv site/content/viewer.html site/pages/viewer.html
mv site/content/folder.html site/pages/folder.html
mv site/content/anim-renderer.html site/pages/anim-renderer.html
```

**Step 2: Update page references**

In each page:
- Replace `../assets/...` if needed to match new location under `/site/pages/` (typically `../assets/...` still correct)
- Replace hardcoded `/docs/` or `docs/` with `/site/content/` or `content/` appropriately
- Update canonical/og URLs to `/site/pages/...`
- Add `<script src="/shared/assets/js/site-core.js"></script>` before other scripts
- Call `SITE.bootstrapPage('<page-name>')` in an inline snippet

Expected: pages load resources from `/site` and shared JS.

---

### Task 9: Update site entry pages to new paths

**Files:**
- Modify: `site/index.html`
- Modify: `site/search-results.html`
- Modify: `site/404.html`
- Modify: `site/onboarding.html`
- Modify: `site/qa.html`

**Step 1: Update assets and links**

- Replace references to `assets/...` with `/site/assets/...` or relative `./assets/...`
- Update links to `viewer.html` -> `/site/pages/viewer.html`
- Update links to `docs/...` -> `/site/content/...` where needed
- Include shared JS and call `SITE.bootstrapPage('<page-name>')`

Expected: entry pages work under `/site`.

---

### Task 10: Update viewer logic for new content root

**Files:**
- Modify: `site/pages/viewer.html`

**Step 1: Replace docs path logic**

Update logic so:
- config path becomes `../content/config.json`
- content fetch base becomes `../content/`
- any `/docs/` hardcoded path replaced with `/site/content/`
- remove old compatibility logic for `docs/` redirects

Expected: viewer loads from `/site/content` only.

---

### Task 11: Update search index and semantic references

**Files:**
- Modify: `site/assets/js/site-config.js` (if it loads `assets/search-index.json` or config)
- Modify: `site/assets/js/main.js` / `navigation.js` (if they refer to `/docs/` or `viewer.html`)

**Step 1: Update references**

- config file path -> `/site/content/config.json` or `../content/config.json`
- search index path -> `/site/assets/search-index.json`
- viewer link -> `/site/pages/viewer.html`

Expected: search and navigation use new roots.

---

### Task 12: Update animcs tooling paths

**Files:**
- Modify: `site/tooling/scripts/build-animcs.js`
- Modify: `site/tooling/scripts/build-anims.js`
- Modify: any C# runtime or tests that reference `docs/anims` or `assets/anims`

**Step 1: Update anim paths**

- `docs/anims` -> `site/content/anims`
- `assets/anims` -> `site/assets/anims`

Expected: tooling aligns with new layout (no generation run now).

---

### Task 13: Update tests to new paths

**Files:**
- Modify: `site/tests/*`

**Step 1: Replace old root paths**

- `docs/` -> `site/content/`
- `assets/` -> `site/assets/`

Expected: tests reference new layout.

---

### Task 14: Global path sweep

**Files:**
- Modify: any file containing `docs/`, `/docs/`, `assets/`, `/assets/` where it’s a site path

**Step 1: Ripgrep and patch**

Run:
```bash
rg -n "\bdocs/|/docs/|\bassets/|/assets/" site shared -S
```
Update remaining references to `/site/content` and `/site/assets` or shared JS as needed.

Expected: no legacy paths remain.

---

### Task 15: Browser verification (no generation)

**Files:**
- None (manual check)

**Step 1: Start local server**

Run:
```bash
python -m http.server 8000
```
Expected: server running.

**Step 2: Check pages**

Open in browser:
- `http://localhost:8000/site/index.html`
- `http://localhost:8000/site/search-results.html`
- `http://localhost:8000/site/pages/viewer.html?file=...`
- `http://localhost:8000/site/pages/anim-renderer.html`

Check:
- No 404s in Network
- No critical console errors
- Viewer loads a document from `/site/content/`
- Anim embed loads runtime assets (no compile required)

---

**Constraints**
- Do NOT run `npm run build`, `node site/tooling/generate-index.js`, or any search-index generation.
- Do NOT introduce `/docs` backward compatibility.

