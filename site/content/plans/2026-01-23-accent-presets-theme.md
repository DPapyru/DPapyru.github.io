# Accent Presets Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan.

**Goal:** Add a top-nav “配色” preset switcher that changes site colors via CSS variables while keeping the site dark-mode only.

**Architecture:** Keep `data-theme="dark"` enforced by `site/assets/js/theme-init.js`. Add `data-accent="<preset>"` on `<html>` early (before paint) to avoid FOUC. Implement presets as CSS variable overrides and a small runtime script for persistence + UI sync.

**Tech Stack:** Static HTML + CSS variables, vanilla JS (CommonJS style), Node `>=18` for a lightweight check script.

---

### Task 1: Add a failing verification script (TDD RED)

**Files:**
- Create: `scripts/check-accent-theme.js`

**Step 1: Write the failing check**

Implement a Node script that exits non-zero if:
- Required HTML pages do not contain `id="accent-select"` and do not include `accent-theme.js`
- `site/assets/js/theme-init.js` does not set `data-accent`
- `site/assets/css/variables.css` does not define any `[data-accent="..."]` overrides

**Step 2: Run it to verify it fails**

Run: `node scripts/check-accent-theme.js`
Expected: FAIL (since the feature doesn’t exist yet).

---

### Task 2: Implement early accent initialization + CSS presets

**Files:**
- Modify: `site/assets/js/theme-init.js`
- Modify: `site/assets/css/variables.css`

**Step 1: Update `theme-init.js`**
- Keep forcing `data-theme="dark"` and clearing `localStorage.theme`
- Read `localStorage.accent` (try/catch), validate against a whitelist, default to `forest`
- Set `document.documentElement.dataset.accent = value` as early as possible

**Step 2: Add preset overrides in `variables.css`**
- Keep existing `[data-theme="dark"] { ... }` as the default baseline
- Add blocks like `[data-theme="dark"][data-accent="ocean"] { ... }`
- Presets may override both accent variables and some background variables (still dark overall)
- Replace `--sidebar-scrollbar-thumb(-hover)` in dark theme to derive from `--primary-color/--primary-hover`

**Step 3: Re-run the check (should still fail)**
Run: `node scripts/check-accent-theme.js`
Expected: still FAIL (UI/scripts not wired yet).

---

### Task 3: Add top-nav UI + runtime script + styling

**Files:**
- Create: `site/assets/js/accent-theme.js`
- Modify: `site/assets/css/header.css`
- Modify: `index.html`
- Modify: `qa.html`
- Modify: `search-results.html`
- Modify: `404.html`
- Modify: `onboarding.html`
- Modify: `site/index.html`
- Modify: `site/pages/viewer.html`
- Modify: `site/pages/folder.html`

**Step 1: Implement `site/assets/js/accent-theme.js`**
- On DOM ready, find `#accent-select`
- Initialize select value from `document.documentElement.dataset.accent` (fallback `forest`)
- On change: set `data-accent`, persist to `localStorage.accent` (try/catch), no throwing

**Step 2: Add UI to top nav**
- Add a new nav item at the end of `.nav-list` containing:
  - a visually-hidden `<label>` and a `<select id="accent-select">`
  - options: `forest`, `ocean`, `grape`, `amber`, `crimson`, `dim`
- Ensure mobile layout behaves (select should not break menu flow)

**Step 3: Style the select**
- Add minimal styles in `site/assets/css/header.css` using existing variables
- Focus ring uses `--search-focus`

**Step 4: Include `accent-theme.js` on all affected pages**
- Root pages: `<script src="site/assets/js/accent-theme.js"></script>`
- Docs pages: `<script src="../site/assets/js/accent-theme.js"></script>`

**Step 5: Run verification**
- Run: `node scripts/check-accent-theme.js`
Expected: PASS (exit code 0).

**Step 6: (Optional) Commit**
```bash
git add scripts/check-accent-theme.js site/assets/js/theme-init.js site/assets/js/accent-theme.js site/assets/css/variables.css site/assets/css/header.css index.html qa.html search-results.html 404.html onboarding.html site/index.html site/pages/viewer.html site/pages/folder.html
git commit -m "feat: add accent preset switcher"
```
