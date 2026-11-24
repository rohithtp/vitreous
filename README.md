# Glass Timer

A modern, precision-engineered focus timer built with Vanilla JavaScript, Tailwind CSS v4, and IndexedDB, featuring a dual-preset Purple Renaissance Glassmorphism aesthetic and robust state persistence. No build step required — open [timer.html](timer.html) directly in any modern browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🎨 Design & UX
- **Purple Renaissance Dual-Theme System**: Switch instantaneously (with zero FOUC and cross-tab sync) between **Neon Focus** (dark canvas with Electric Violet + Burnt Orange accents) and **Lilac Calm** (airy lavender light mode with Royal Plum + Cinnamon Slate accents).
- **Glassmorphism Aesthetic**: Layered ambient radial meshes, translucent frosted cards, active running radial glow, and WCAG AA contrast across both presets.
- **Responsive & Accessible Interface**: Semantic landmarks, keyboard `:focus-visible` rings, `prefers-reduced-motion` and `forced-colors` support, and comfortable touch targets.
- **HUD Monospace Typography**: Uses `JetBrains Mono` with `tabular-nums` for precise, jitter-free millisecond digits.
- **Mood-Tagged Session History**: Recorded sessions display frosted cards with a left accent rail and a mood preset badge (`Neon Focus` or `Lilac Calm`).

### ⚙️ Technical Core
- **Drift-Free Timing**: Uses `Date.now()` wall-clock delta calculations for all elapsed time — `requestAnimationFrame` drives the render loop, but time is never counted by ticking frames, so the result is always accurate regardless of frame rate.
- **State Persistence**: 
  - **Auto-Resume**: If you accidentally close the tab while the timer is running, it will automatically calculate the elapsed time and resume exactly where it should be upon reopening.
  - **IndexedDB**: Uses a native Wrapper class for asynchronous, persistent storage of session history (including active theme preset) and application state.
- **Background Throttling Protection**: Browsers pause `requestAnimationFrame` in background tabs, but because elapsed time is derived from `Date.now()` wall-clock deltas, the timer catches up accurately the moment the tab is foregrounded again.
- **Resilient Asset Loading (Tailwind CSS v4)**: Loads the pinned Tailwind CSS v4 Browser CDN (`@tailwindcss/browser@4.3.5`) asynchronously with `@theme inline` tokens and automatically falls back to the exact version-matched precompiled `vendor/tailwind.css` if the CDN errors, returns a silent 200 proxy block page, or times out. Fonts are self-hosted (`vendor/fonts.css`), and the service worker precaches every vendored asset for full offline rendering.

## 🚀 Usage

1. **Running the App**:
   - Open [timer.html](timer.html) in any modern web browser (Chrome, Edge, Firefox, Safari).
   - No build step or server required. It's a single self-contained file.

2. **Theme Presets**:
   - Use the **Neon Focus | Lilac Calm** switcher in the card header to toggle between dark focus mode and light calm/reset mode. Your selection is saved to `localStorage` and synchronized across tabs.

3. **Timer Controls**:
   - **Start**: Begins the focus session and illuminates the card with an active radial glow.
   - **Pause**: Halts the timer (state is saved safely).
   - **Reset**: Clears the current timer back to 00:00:00.
   - **Save**: Records the current elapsed time and active theme preset to the History log.

4. **History**:
   - The "Past Sessions" panel below the timer automatically updates when you save a session.
   - Sessions are stored permanently in your browser's IndexedDB.

## 🔮 Roadmap

To take this project further, the following features are planned or recommended:

- ~~**PWA Support**~~: ✅ Implemented — installable as a native app with full offline support via service worker.
- ~~**Theming**~~: ✅ Implemented — dual Purple Renaissance presets (**Neon Focus** & **Lilac Calm**) with FOUC-free persistence, cross-tab sync, and WCAG AA contrast.
- **Data Export**: Functionality to export session history as `CSV` or `JSON` for analysis.
- **Multiple Modes**: Support for **Pomodoro** intervals (25/5 min) and Countdown timers.
- **Sound Effects**: Subtle notification sounds for timer completion or milestones.
- **Task Association**: Ability to tag specific sessions to named tasks or projects.

## 🛠️ Technology Stack

- **HTML5**: Semantic landmarks and ARIA-annotated interactive controls.
- **Tailwind CSS v4 (Browser CDN + Vendored CLI Build)**: CSS-first `@theme inline` tokens with automated CDN/offline synchronization (`npm run tailwind:build` / `npm run tailwind:check`).
- **Vanilla JavaScript (ES6+)**: Core logic (Classes, Async/Await).
- **IndexedDB**: Browser-native NoSQL database.
- **Web App Manifest + Service Worker**: PWA support for offline use and installability.
- **Self-hosted Fonts**: Inter & JetBrains Mono vendored under `vendor/fonts/` (no external font CDN).

---
*Created as a single-file demonstration of modern web capabilities.*
