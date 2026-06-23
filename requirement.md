"Build a single-file Vanilla JavaScript timer application using Tailwind CSS for styling and IndexedDB for data persistence.

Design Requirements:

Styling: Use Tailwind CSS via CDN. Design a modern, centered 'Glassmorphism' card for the timer. Use a bold, monospace font for the countdown digits.

Offline Resilience (CDN fallback): The app must render correctly whether or not external CDNs are reachable — including when a network or corporate tunnel SILENTLY blocks a CDN (returns a 200 "block page" instead of the asset, or hangs the request), not just on a clean network failure.

- Tailwind CSS: load from its CDN first, but vendor a complete precompiled local copy. The CDN script must be loaded asynchronously so a blocked or hung request can never freeze page rendering. The app must fall back to the local copy if the CDN errors, loads an unusable response (the runtime never initializes), or fails to initialize within a short timeout.
- Fonts: self-host locally (no external font CDN). Relying on a font CDN with an onerror fallback is insufficient because a 200 block page does not trigger onerror; self-hosting guarantees fonts always render.

Combined with the service worker (which precaches the app shell and all vendored assets), the application must be FULLY functional offline, including on the first load after install, with no visual degradation.

UX: Include a 'Start' button that transforms into a 'Pause' button when active. Add a 'Reset' button and a 'Save Session' button.

Functionality Requirements:

Database: Implement a native IndexedDB wrapper to handle database initialization, saving a session (timestamp, duration, label), and retrieving all sessions.

The Timer Engine: Use a requestAnimationFrame loop to ensure the UI updates smoothly and stays perfectly synced with the system clock (handling background tab throttling).

History UI: Below the timer, render a scrollable list of 'Past Sessions' that updates in real-time whenever a new session is saved to IndexedDB.

Persistence: If the user closes the tab and re-opens it, the app should check IndexedDB for a 'runningState' and resume the countdown automatically.

Code Structure:

Provide the complete HTML/JS in one block.

Use clean, commented ES6+ syntax (Classes, Arrow functions, Destructuring)."