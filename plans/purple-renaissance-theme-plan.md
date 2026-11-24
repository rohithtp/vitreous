# Implementation Plan: Aligning Glass Timer with *The Purple Renaissance (2025–2026)* (Tailwind CSS v4)

> **Prerequisite / Companion Plan:** See [tailwind-upgrade-and-maintenance-strategy.md](./tailwind-upgrade-and-maintenance-strategy.md) for upgrading the repository from Tailwind v3 (`cdn.tailwindcss.com` + `vendor/tailwind.css` v3.4.19) to the **latest stable Tailwind CSS v4.x** and maintaining CDN/offline parity going forward.

---

## Goal

Evolve [timer.html](../timer.html) from its static blue-violet glassmorphism into a two-preset themeable system (**Digital Neon — Focus Mode** and **Millennial Lilac — Calm / Reset Mode**) grounded in [*The Purple Renaissance: Design Trends & Aesthetic Evolution (2025–2026)*](https://rohithtp.github.io/ThoughtsInWords/articles/design/purple-design-aesthetic-trends-2026.html), built on **latest stable Tailwind CSS v4.x** (CSS-first `@theme` configuration + `@tailwindcss/browser@4` CDN + matching `@tailwindcss/cli@4` precompiled `vendor/tailwind.css`), while preserving the single-file runtime experience, IndexedDB persistence, WCAG AA contrast, and offline/blocked-CDN resilience.

---

## Key Architectural Notes

- **Tailwind CSS v4 Alignment**:
  - Replace the legacy v3 Play CDN (`https://cdn.tailwindcss.com`) and JS `TAILWIND_CONFIG` object with the **latest stable Tailwind v4 Browser CDN** (`https://cdn.jsdelivr.net/npm/@tailwindcss/browser@<pinned-v4-version>`) paired with a CSS-first `<style type="text/tailwindcss">` block defining `@theme` tokens (`--font-sans`, `--font-mono`, `--animate-blob`, `@keyframes blob`, and semantic color tokens mapped to the active theme's CSS custom properties).
  - Rebuild [vendor/tailwind.css](../vendor/tailwind.css) using the exact same pinned `@tailwindcss/cli@<pinned-v4-version>` per [tailwind-upgrade-and-maintenance-strategy.md](./tailwind-upgrade-and-maintenance-strategy.md), so every v4 utility class used in [timer.html](../timer.html) renders identically online, offline, or behind a silently blocking proxy.
  - Account for Tailwind v4 utility changes during markup updates (`backdrop-blur-sm` → `backdrop-blur-xs`, `rounded` → `rounded-sm`, `flex-shrink-0` → `shrink-0`, explicit border colors since v4 defaults `border` to `currentColor`, and explicit `cursor: pointer` on enabled buttons since v4 Preflight sets `button { cursor: default }`).
- **Separate Repository for Editorial Article**:
  - Only the `vitreous` workspace is currently mounted. Section 3.2 (adding the interactive demo callout to `purple-design-aesthetic-trends-2026.html`) lives in the `ThoughtsInWords` repository and must be applied there separately (exact drop-in markup is provided below).

---

## 1. Theme Architecture (Tailwind v4 `@theme` + CSS Custom Properties)

**Target file:** [timer.html](../timer.html) (`<head>`, Tailwind v4 loader, and `<style>` blocks)

### 1.1 Document `<head>` & Early FOUC-Free Theme Bootstrap
1. Add `<meta name="color-scheme" content="dark light">` and update `<meta name="theme-color" content="#121216">` (matching the default `neon-focus` canvas).
2. Place a tiny, synchronous inline `<script>` immediately after those `<meta>` tags (before stylesheets and `<body>`) to eliminate Flash of Un-themed Content (FOUC):
   - Reads `localStorage.getItem('vitreous-theme')` inside `try { ... } catch {}` (gracefully handling blocked storage).
   - Validates against `'neon-focus'` | `'millennial-lilac'`, defaulting to `'neon-focus'`.
   - Applies `document.documentElement.dataset.theme = theme` and updates `<meta name="color-scheme">` (`dark` vs `light`) and `<meta name="theme-color">` (`#121216` vs `#f3effa`).

### 1.2 Theme Custom Properties & Tailwind v4 `@theme` Integration
1. Define the two theme token sets in a standard `<style>` block (so they work identically under both the Browser CDN and precompiled `vendor/tailwind.css`):
   - **`:root, [data-theme="neon-focus"]`** (`color-scheme: dark`):
     - Core tokens:
       - `--bg-canvas: #121216;`
       - `--bg-mesh-1: rgba(124, 58, 237, 0.22);` *(Electric Violet glow)*
       - `--bg-mesh-2: rgba(34, 211, 238, 0.12);` *(Tech/SaaS Cyan subtle shift)*
       - `--glass-surface: rgba(30, 30, 38, 0.65);`
       - `--glass-border: rgba(167, 139, 250, 0.25);`
       - `--text-primary: #f5f3ff;`
       - `--text-muted: #a1a1aa;`
       - `--accent-primary: #8b5cf6;` *(Electric Violet)*
       - `--accent-hover: #7c3aed;`
       - `--accent-secondary: #ea580c;` *(Burnt Orange — Dopamine alert/reset)*
       - `--status-saved: #c084fc;`
     - Supporting surface/interaction tokens: `--glass-shadow`, `--row-surface`, `--row-surface-hover`, `--divider`, `--pill-track`, `--accent-contrast-text: #ffffff`, `--active-glow: rgba(139, 92, 246, 0.28)`, `--scrollbar-thumb`, `--scrollbar-track`.
   - **`[data-theme="millennial-lilac"]`** (`color-scheme: light`):
     - Core tokens:
       - `--bg-canvas: #f3effa;`
       - `--bg-mesh-1: rgba(196, 181, 253, 0.45);` *(Airy Lavender)*
       - `--bg-mesh-2: rgba(154, 107, 94, 0.18);` *(Cinnamon Slate undertone)*
       - `--glass-surface: rgba(255, 255, 255, 0.58);`
       - `--glass-border: rgba(107, 33, 168, 0.18);`
       - `--text-primary: #2e1065;` *(Deep Royal Plum ink)*
       - `--text-muted: #6b5b7b;`
       - `--accent-primary: #7e22ce;` *(Royal Plum)*
       - `--accent-hover: #6b21a8;`
       - `--accent-secondary: #8c5a4f;` *(Cinnamon Slate)*
       - `--status-saved: #7e22ce;`
     - Supporting light-mode glass shadow, frosted row surfaces, divider, pill track, `--accent-contrast-text: #ffffff`, `--active-glow: rgba(126, 34, 206, 0.20)`, and scrollbar tokens.
2. Expose font families, blob animation, and semantic color tokens to Tailwind v4 via `@theme inline` (in both `<style type="text/tailwindcss">` for CDN mode and `src/tailwind.input.css` for the CLI build):
   ```css
   @theme inline {
     --font-sans: 'Inter', sans-serif;
     --font-mono: 'JetBrains Mono', monospace;
     --color-canvas: var(--bg-canvas);
     --color-surface: var(--glass-surface);
     --color-glass-border: var(--glass-border);
     --color-ink: var(--text-primary);
     --color-muted: var(--text-muted);
     --color-accent: var(--accent-primary);
     --color-accent-hover: var(--accent-hover);
     --color-accent-secondary: var(--accent-secondary);
     --color-saved: var(--status-saved);
     --animate-blob: blob 7s infinite;
   }
   ```
   Using `@theme inline` ensures Tailwind v4 utilities (`text-ink`, `text-muted`, `text-accent`, `border-glass-border`, `bg-accent`, `hover:bg-accent-hover`, `font-mono`, `animate-blob`) reference the live runtime CSS custom properties so switching `data-theme` on `<html>` instantaneously re-themes every utility class without JS class swapping.
3. **Canvas & Decorative Mesh**:
   - Replace the static `#667eea → #764ba2` body gradient with layered radial gradients using `--bg-mesh-1` (top-right) and `--bg-mesh-2` (bottom-left) over `var(--bg-canvas)`.
   - Replace hardcoded `text-white` and `selection:bg-pink-500` on `<body>` with `text-ink` and `::selection` styled with `var(--accent-primary)`.
   - Re-color the two `.animate-blob` decorative circles inside the timer card to use `--bg-mesh-1` and `--bg-mesh-2` (removing `mix-blend-multiply` so light mode stays luminous instead of darkening muddily).
4. **Scrollbars, Reduced Motion & High Contrast**:
   - Style `.custom-scrollbar` with standard `scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track); scrollbar-width: thin;` (never transitioning `scrollbar-color` to avoid WebKit flicker), and place legacy `::-webkit-scrollbar` fallback rules inside `@supports not (scrollbar-color: auto)` (resetting `scrollbar-width: auto` inside the fallback block).
   - Add `@media (prefers-reduced-motion: reduce)` to pause `.animate-blob` and glow animations.
   - Add `@media (forced-colors: active)` border/outline fallbacks (`CanvasText`, `Highlight`, `ButtonBorder`) so cards, active pills, and focus rings remain clear in High Contrast mode.
   - Preserve pointer cursors on enabled buttons (`button:not(:disabled) { cursor: pointer; }`) to compensate for Tailwind v4 Preflight's `cursor: default`.

---

## 2. Component & Control Updates

**Target file:** [timer.html](../timer.html) (HTML markup & ES6 controller)

### 2.1 Header Theme Toggle (`Neon Focus | Lilac Calm`)
- Update the timer card header (`Work Session` / `Focus Timer`) into a responsive flex layout pairing the title/subtitle with a compact pill switcher:
  - Container: `role="group" aria-label="Color theme preset"` styled with `--pill-track` and `--glass-border`.
  - Two `<button type="button">` options: **Neon Focus** (`data-theme-option="neon-focus"`) and **Lilac Calm** (`data-theme-option="millennial-lilac"`), with `aria-pressed="true|false"` and visible `focus-visible` outlines.
- Add theme management to `App`:
  - Applies `document.documentElement.dataset.theme`, syncs `<meta name="color-scheme">` and `<meta name="theme-color">`, updates `aria-pressed`, and persists to `localStorage` (`try/catch`).
  - Subscribes to `window.addEventListener('storage', ...)` to keep multiple open tabs in sync.

### 2.2 HUD-Style Timer Readout (`00:00:02.21`)
- Enforce `font-variant-numeric: tabular-nums` via both Tailwind `tabular-nums` and an explicit CSS rule on `#timer-display` so millisecond ticks never jitter horizontally.
- Style the millisecond decimal span (`.21`) in initial HTML and `formatTimeHTML(ms)` using `text-accent` (`var(--accent-primary)` — Electric Violet in dark mode, Royal Plum in light mode).
- Toggle `data-running="true|false"` on the main timer card inside `App.updateControls(isRunning)`:
  - When `[data-running="true"]`, render a subtle purple radial glow behind/around the timer card (`::before` / layered `box-shadow` driven by `--active-glow` and `--accent-primary`) that transitions smoothly on start/pause.

### 2.3 Button Hierarchy (Complementary Palette Mapping)
Replace hardcoded emerald/teal and amber/orange classes in HTML and `App.updateControls()` with theme-driven styles:
- **`[START]` / `[PAUSE]` (`#toggle-btn`)**:
  - Primary solid/translucent pill using `var(--accent-primary)` (`var(--accent-hover)` on hover) with crisp white text (`#ffffff`) and subtle accent glow.
  - In the active `PAUSE` state, keep the `--accent-primary` palette while shifting to a clearly distinguishable active style (e.g., translucent violet/plum tint + crisp `--accent-primary` border + subtle running indicator) so state isn't conveyed by color alone.
  - *Contrast check:* Verify button text contrast in `neon-focus` (`#ffffff` over `#8b5cf6` is ~4.2:1; using bold text + subtle `#8b5cf6`→`#7c3aed` vertical sheen or slightly deeper `#7c3aed` fill ensures ≥ 4.5:1 WCAG AA compliance).
- **`[RESET]` (`#reset-btn`)**:
  - Secondary ghost button styled with `var(--accent-secondary)` text and a `color-mix(in oklab, var(--accent-secondary) 55%, transparent)` border (with fallback), giving Burnt Orange (`#ea580c`) high-contrast dopamine visibility in dark mode and Cinnamon Slate (`#8c5a4f`) in light mode.
- **`[SAVE]` (`#save-btn`)**:
  - Glass-bordered button (`var(--row-surface)`, `1px solid var(--glass-border)`, `var(--text-primary)`).
  - When triggering the `"Session Saved successfully"` toast, momentarily apply a `.is-saved` highlight state using `var(--status-saved)` (border, glow, and text accent) synced with the 3-second toast duration; also update the toast checkmark icon from `text-emerald-400` to `text-saved` (`var(--status-saved)`).

### 2.4 Past Sessions List & Mood Preset Badges
- **IndexedDB persistence (`DBManager.saveSession`)**:
  - Extend saved session objects to include `theme` (`'neon-focus'` or `'millennial-lilac'`): `{ timestamp, duration, label: 'Work Session', theme }`. No IndexedDB version bump is required since `sessions` is schemaless.
  - Gracefully support legacy sessions without a `theme` field (render cleanly without a broken badge).
- **Row styling (`App.renderHistory` & `emptyStateHTML`)**:
  - Style recorded session cards as subtle frosted rows (`var(--row-surface)`, hover `var(--row-surface-hover)`) with a thin left accent border (`border-left: 3px solid var(--accent-primary)`).
  - Display a compact mood preset badge (`.mood-badge`) indicating `Neon Focus` or `Lilac Calm` (paired with a small subtle dot/icon + label so meaning does not depend on color alone).
  - Style timestamps, labels, duration (`tabular-nums`), `#session-count`, history header divider, and empty state using `--text-primary`, `--text-muted`, and `--divider` instead of hardcoded `text-white/*` and `text-emerald-300`.

---

## 3. Editorial Cross-Linking & Supporting Project Files

### 3.1 Footer Attribution on `timer.html`
Add a minimal `<footer>` below the Past Sessions card:
```html
<footer class="text-center text-xs text-muted">
    Color system inspired by
    <a href="https://rohithtp.github.io/ThoughtsInWords/articles/design/purple-design-aesthetic-trends-2026.html"
       target="_blank" rel="noopener noreferrer"
       class="text-accent underline underline-offset-4 hover:text-accent-hover">
        The Purple Renaissance: Design Trends &amp; Aesthetic Evolution (2025–2026)
    </a>.
</footer>
```

### 3.2 Interactive Demo Callout in `ThoughtsInWords` (External Repository)
- **Target file (outside this workspace):** `ThoughtsInWords/articles/design/purple-design-aesthetic-trends-2026.html`, under **Section 1 (Cognitive Stimulation)**.
- Drop-in callout snippet to apply in that repository:
  ```html
  <aside class="demo-callout" aria-label="Live interactive example">
      <p>
          <strong>Live Example:</strong> See Electric Violet (<em>Neon Focus</em>) and Millennial Lilac
          (<em>Lilac Calm</em>) applied to a deep-work session workflow in
          <a href="https://rohithtp.github.io/vitreous/timer.html" target="_blank" rel="noopener noreferrer">Glass Timer</a>.
      </p>
  </aside>
  ```

### 3.3 Vendored Tailwind Rebuild, PWA Metadata & Docs
- Rebuild [vendor/tailwind.css](../vendor/tailwind.css) via the Tailwind v4 CLI workflow defined in [tailwind-upgrade-and-maintenance-strategy.md](./tailwind-upgrade-and-maintenance-strategy.md) after editing [timer.html](../timer.html).
- Update [manifest.json](../manifest.json) `background_color` and `theme_color` from `#667eea` to `#121216`.
- Bump `CACHE_NAME` in [sw.js](../sw.js) (e.g., `'glass-timer-v5'`) so PWA installs refresh `vendor/tailwind.css` and `manifest.json`.
- Update [README.md](../README.md) to reflect Tailwind CSS v4 and mark the Roadmap **Theming** item as complete.

---

## 4. Verification Checklist

1. **Tailwind v4 Online & Offline Parity**:
   - Verify Browser CDN (`@tailwindcss/browser@<pinned>`) loads cleanly online and compiles `@theme inline` tokens.
   - Verify blocking `cdn.jsdelivr.net` (network error, hung request > 1200ms, or simulated 200 HTML block page) seamlessly activates precompiled `vendor/tailwind.css` with zero visual regressions.
2. **Theme Switching & Persistence**:
   - Confirm zero FOUC on reload in both `neon-focus` and `millennial-lilac`.
   - Confirm `localStorage` persistence, cross-tab `storage` sync, `<meta name="theme-color">` updates, and keyboard/screen-reader accessibility (`aria-pressed`, visible focus rings).
3. **Timer, Controls & Session History**:
   - Verify `tabular-nums` (zero jitter), `--accent-primary` decimal styling, and active radial glow when running.
   - Verify `[START]`/`[PAUSE]`, `[RESET]` (`--accent-secondary`), and `[SAVE]` (`--status-saved` highlight + toast).
   - Verify saved sessions show the `3px solid var(--accent-primary)` left accent border and the recorded mood badge (`Neon Focus` / `Lilac Calm`), while pre-existing sessions without `theme` render cleanly.
4. **Contrast & Editorial Link**:
   - Confirm WCAG AA contrast in both themes (≥ 4.5:1 text, ≥ 3:1 UI borders/icons) and verify the footer link opens the Purple Renaissance article cleanly in a new tab.
