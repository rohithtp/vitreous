# Glass Timer

A modern, precision-engineered focus timer built with Vanilla JavaScript, Tailwind CSS, and IndexedDB, featuring a premium Glassmorphism aesthetic and robust state persistence. No build step required — open [timer.html](timer.html) directly in any modern browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🎨 Design & UX
- **Glassmorphism Aesthetic**: Uses modern backdrop-filters, subtle gradients, and translucent layers for a premium feel.
- **Responsive Interface**: Perfectly centered and readable on devices of all sizes.
- **Micro-interactions**: Smooth hover states, glowing gradients, and animated button transitions.
- **Monospace Typography**: Uses `JetBrains Mono` for precise, jitter-free timer digits.

### ⚙️ Technical Core
- **Drift-Free Timing**: Uses `Date.now()` wall-clock delta calculations for all elapsed time — `requestAnimationFrame` drives the render loop, but time is never counted by ticking frames, so the result is always accurate regardless of frame rate.
- **State Persistence**: 
  - **Auto-Resume**: If you accidentally close the tab while the timer is running, it will automatically calculate the elapsed time and resume exactly where it should be upon reopening.
  - **IndexedDB**: Uses a native Wrapper class for asynchronous, persistent storage of session history and application state.
- **Background Throttling Protection**: Browsers pause `requestAnimationFrame` in background tabs, but because elapsed time is derived from `Date.now()` wall-clock deltas, the timer catches up accurately the moment the tab is foregrounded again.
- **Resilient Asset Loading**: Tailwind loads from its CDN first (async, so a blocked or hung request never freezes the page) and falls back to the precompiled `vendor/tailwind.css` if the CDN errors, returns an unusable response (e.g. a proxy "block page"), or times out. Fonts are self-hosted (`vendor/fonts.css`) rather than loaded from a font CDN, since a 200 block page would silently defeat an onerror-based fallback. The service worker precaches every vendored asset, so the app renders correctly offline or behind a blocking tunnel — even on the first load after install.

## 🚀 Usage

1. **Running the App**:
   - Open [timer.html](timer.html) in any modern web browser (Chrome, Edge, Firefox, Safari).
   - No build step or server required. It's a single self-contained file.

2. **Timer Controls**:
   - **Start**: Begins the focus session.
   - **Pause**: Halts the timer (state is saved safely).
   - **Reset**: Clears the current timer back to 00:00:00.
   - **Save**: Records the current elapsed time to the History log.

3. **History**:
   - The "Past Sessions" panel below the timer automatically updates when you save a session.
   - Sessions are stored permanently in your browser's IndexedDB.

## 🔮 Roadmap

To take this project further, the following features are planned or recommended:

- ~~**PWA Support**~~: ✅ Implemented — installable as a native app with full offline support via service worker.
- **Data Export**: Functionality to export session history as `CSV` or `JSON` for analysis.
- **Multiple Modes**: Support for **Pomodoro** intervals (25/5 min) and Countdown timers.
- **Theming**: A toggle for Light/Dark mode or customizable gradient backgrounds.
- **Sound Effects**: Subtle notification sounds for timer completion or milestones.
- **Task Association**: Ability to tag specific sessions to named tasks or projects.

## 🛠️ Technology Stack

- **HTML5**: Semantic structure.
- **Tailwind CSS (CDN)**: Utility-first styling.
- **Vanilla JavaScript (ES6+)**: Core logic (Classes, Async/Await).
- **IndexedDB**: Browser-native NoSQL database.
- **Web App Manifest + Service Worker**: PWA support for offline use and installability.
- **Self-hosted Fonts**: Inter & JetBrains Mono vendored under `vendor/fonts/` (no external font CDN).

---
*Created as a single-file demonstration of modern web capabilities.*
