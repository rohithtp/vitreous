# Plan & Strategy: Tailwind CSS v4 Upgrade and Ongoing Maintenance

## Goal

1. **Upgrade** `vitreous` from Tailwind CSS v3 (`https://cdn.tailwindcss.com` + precompiled [vendor/tailwind.css](../vendor/tailwind.css) v3.4.19) to the **latest stable Tailwind CSS v4.x** release.
2. **Establish a repeatable, low-friction maintenance strategy** that keeps the Browser CDN and vendored offline stylesheet (`vendor/tailwind.css`) strictly version-matched, up to date, and verified against silent CDN blocks—without breaking the zero-build-step runtime experience for end users opening [timer.html](../timer.html).

---

## Current State & Gaps

| Aspect | Current (`v3`) | Gap / Risk |
|---|---|---|
| CDN runtime | `https://cdn.tailwindcss.com` (unpinned v3 Play CDN) | Legacy v3 runtime; unpinned CDN can drift from vendored CSS |
| Vendored fallback | `vendor/tailwind.css` (`tailwindcss v3.4.19`, 14.6 KB) | Manually generated; no reproducible source CSS, package lock, or build script in repo |
| Config mechanism | Inline JS `TAILWIND_CONFIG` assigned to `window.tailwind.config` | Removed in Tailwind v4 (replaced by CSS-first `@theme`) |
| Silent-block detection | `typeof tailwind !== 'undefined'` | **Breaks in v4**: `@tailwindcss/browser` (since v4.0.1) is an IIFE and does not expose a `window.tailwind` global |
| Staleness protection | None | Editing utility classes in `timer.html` silently leaves `vendor/tailwind.css` out of sync for offline/proxy users |

---

## Phase 1: Initial Migration to Latest Stable Tailwind CSS v4.x

### 1.1 Resolve & Pin the Exact Latest Stable v4 Release
- Query npm for the current latest stable `4.x.y` version (e.g., `npm view tailwindcss version`, `npm view @tailwindcss/cli version`, `npm view @tailwindcss/browser version`) so all three packages share the **exact same `4.x.y` version**.
- Add a minimal, dev-only `package.json` (with `package-lock.json`) at repo root:
  - `devDependencies`: `"tailwindcss": "<exact-4.x.y>"`, `"@tailwindcss/cli": "<exact-4.x.y>"` (zero runtime dependencies; end users still open `timer.html` directly with no build step).
  - Keep `node_modules/` in `.gitignore`.

### 1.2 Create Single-Source Tailwind v4 Input CSS
Create `src/tailwind.input.css` as the canonical input for `@tailwindcss/cli`:
```css
@import "tailwindcss";
@source "../timer.html";

@theme inline {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  /* Theme color tokens & blob animation synchronized with timer.html */
  --animate-blob: blob 7s infinite;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
```
- Mirror the exact `@theme inline` block in `<style type="text/tailwindcss">` inside [timer.html](../timer.html) (or verify via the sync script that both blocks match byte-for-byte so CDN and vendored output never diverge).

### 1.3 Upgrade CDN Loader & Silent-Block Fallback Detection in `timer.html`
Replace the v3 loader (lines 31–93 of [timer.html](../timer.html)) with a v4-compatible async loader:
- **Pinned CDN URL**: `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@<exact-4.x.y>` (matching `package.json`).
- **v4 Runtime Health Check (replaces `typeof tailwind !== 'undefined'`)**:
  - Because `@tailwindcss/browser` v4 runs in an IIFE and compiles classes into a dynamically injected `<style>` tag rather than setting `window.tailwind`, verify initialization via a **computed CSS signal** after `script.onload` (e.g., verify `getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()` or check that an injected `<style>` containing Tailwind v4 rules applied a known utility like `display: flex` on a probe / existing element).
  - Keep all three fallback triggers required by [requirement.md](../requirement.md):
    1. `onerror` (hard network/DNS failure)
    2. `onload` succeeded, but CSS signal check fails after a microtask/frame (handles a 200 corporate proxy "block page")
    3. Timeout fallback (`setTimeout(loadLocalTailwind, 1200)`) for hung/throttled CDN requests
  - Keep `loadLocalTailwind()` idempotent and non-duplicating: if the CDN initializes *after* the local fallback already loaded, avoid double-styling conflicts (or remove the fallback `<link>` only if desired—leaving the precompiled fallback active once triggered is simpler and flicker-free).

### 1.4 Migrate Tailwind v3 Utility Classes in `timer.html` to v4 Equivalents
Audit and update every utility class affected by Tailwind v4 breaking changes:
- `backdrop-blur-sm` → `backdrop-blur-xs`
- `rounded` (4px badge/pill) → `rounded-sm`
- `flex-shrink-0` → `shrink-0`
- `bg-gradient-to-r` → `bg-linear-to-r` (or replaced by theme classes in the Purple Renaissance plan)
- Explicit border colors on any `border` / `border-b` element (v4 defaults bare `border` to `currentColor` instead of `gray-200`)
- Explicit `button:not(:disabled) { cursor: pointer; }` in `<style>` (v4 Preflight changed buttons to `cursor: default`)

### 1.5 Recompile `vendor/tailwind.css` & Update Service Worker
- Build minified local fallback:
  ```bash
  npx @tailwindcss/cli -i ./src/tailwind.input.css -o ./vendor/tailwind.css --minify
  ```
- Confirm the generated header banner reads `/*! tailwindcss v4.x.y ...` matching the pinned CDN version.
- Bump `CACHE_NAME` in [sw.js](../sw.js) (e.g., `glass-timer-v5`) whenever `vendor/tailwind.css` changes so offline PWA caches update cleanly.

---

## Phase 2: Ongoing Tailwind Update & Synchronization Strategy

To guarantee Tailwind stays current without manual drift or broken offline builds, standardize four pillars:

### Pillar A: Single-Source Version Pinning & Automated Sync Script
Create lightweight npm scripts (backed by a small Node script `scripts/tailwind-sync.mjs`, zero extra dependencies):
1. **`npm run tailwind:build`**:
   - Reads the pinned `tailwindcss` version from `package.json`.
   - Syncs the `@tailwindcss/browser@<version>` URL in [timer.html](../timer.html) and verifies the `@theme inline` block matches `src/tailwind.input.css`.
   - Runs `@tailwindcss/cli -i src/tailwind.input.css -o vendor/tailwind.css --minify`.
2. **`npm run tailwind:check`** (read-only verification):
   - Verifies the version embedded in `vendor/tailwind.css` header (`/*! tailwindcss vX.Y.Z`) equals `package.json` AND equals the `@tailwindcss/browser@X.Y.Z` URL in [timer.html](../timer.html).
   - Rebuilds to a temp file and diffs against committed `vendor/tailwind.css` to guarantee zero uncompiled utility classes exist in `timer.html`.
   - Exits non-zero if anything is out of sync.
3. **`npm run tailwind:upgrade`**:
   - Resolves the latest stable `tailwindcss` / `@tailwindcss/cli` version (within the approved semver policy—patch/minor by default, explicit flag for major).
   - Installs matching versions, runs `npm run tailwind:build`, reminds to bump `CACHE_NAME` in [sw.js](../sw.js), and prints a diff summary (version delta + `vendor/tailwind.css` size delta).

### Pillar B: Cadence & Trigger Policy

| Trigger | Scope | Action Required |
|---|---|---|
| **Any edit to `timer.html` classes** | Immediate (every PR/commit) | Run `npm run tailwind:build` and verify `npm run tailwind:check` passes. Bump `sw.js` `CACHE_NAME` if `vendor/tailwind.css` changed. |
| **Patch release (`4.x.Y`)** | Monthly (or immediately for security/regression fixes) | Run `npm run tailwind:upgrade` (patch), run parity checks, commit updated `package.json`, `package-lock.json`, `timer.html`, `vendor/tailwind.css`, `sw.js`. |
| **Minor release (`4.X.0`)** | Quarterly (or when adopting new v4 features) | Review Tailwind GitHub release notes, run `npm run tailwind:upgrade` (minor), run full visual + offline verification matrix. |
| **Major release (`5.0.0+`)** | Planned migration branch | Review official Tailwind upgrade guide, run `@tailwindcss/upgrade` dry-run, re-verify Browser CDN URL & silent-block detection logic, visually verify all themes and PWA offline flow before merging. |

### Pillar C: Automated CI Guard (GitHub Actions)
Add a lightweight `.github/workflows/tailwind-check.yml` workflow triggered on PRs and pushes to `main` (plus an optional monthly scheduled check):
1. **Sync Guard (on PR / push)**:
   - Runs `npm ci` and `npm run tailwind:check`.
   - Fails the PR if `timer.html` adds a new utility class without rebuilding `vendor/tailwind.css`, or if the CDN pin and `vendor/tailwind.css` versions diverge.
2. **Scheduled Outdated Check (monthly cron or Dependabot)**:
   - Either enable **Dependabot** for `npm` (monthly schedule, grouped `tailwindcss` + `@tailwindcss/cli` PRs) or run a monthly workflow checking `npm outdated tailwindcss` and opening an issue/PR when a newer stable version is available.

### Pillar D: Verification & Rollback Protocol
Before merging any Tailwind update, run this 5-point verification matrix:
1. **Online CDN mode**: Open `timer.html` normally; confirm `@tailwindcss/browser@<version>` loads with HTTP 200 and zero console errors.
2. **Hard CDN failure**: Block `cdn.jsdelivr.net` in DevTools; confirm `vendor/tailwind.css` loads immediately with identical layout/colors in both themes.
3. **Silent 200 block page**: Intercept `cdn.jsdelivr.net` (DevTools local override returning `200 OK` HTML text); confirm the v4 CSS probe detects the invalid runtime and swaps in `vendor/tailwind.css`.
4. **Hung CDN timeout**: Throttle/delay `cdn.jsdelivr.net` > 1500ms; confirm the 1200ms timeout activates `vendor/tailwind.css` cleanly.
5. **PWA offline reload**: Register service worker, switch browser to Offline, hard-reload; confirm full styling and fonts work offline.

**Rollback:** Because `package.json`, `timer.html`, `vendor/tailwind.css`, and `sw.js` are updated atomically in one commit per upgrade, rolling back a bad Tailwind release is a single `git revert` (plus bumping `sw.js` `CACHE_NAME` if already deployed to users).

---

## Execution Order (Across Both Plans)

1. Execute **Phase 1** of this plan (`tailwind-upgrade-and-maintenance-strategy.md`) — set up `package.json`, `src/tailwind.input.css`, `scripts/tailwind-sync.mjs`, migrate `timer.html` to Tailwind v4 Browser CDN + v4 fallback probe, and compile v4 `vendor/tailwind.css`.
2. Execute [purple-renaissance-theme-plan.md](./purple-renaissance-theme-plan.md) — implement the Purple Renaissance theme tokens, `@theme inline` bindings, header switcher, HUD readout, button hierarchy, session mood badges, and footer link, then run `npm run tailwind:build` + `npm run tailwind:check`.
3. Execute **Phase 2** of this plan — add the CI sync guard (`.github/workflows/tailwind-check.yml`) and Dependabot/monthly check config, bump [sw.js](../sw.js) `CACHE_NAME`, and run the full 5-point verification matrix.
