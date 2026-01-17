"Build a single-file Vanilla JavaScript timer application using Tailwind CSS for styling and IndexedDB for data persistence.

Design Requirements:

Styling: Use Tailwind CSS via CDN. Design a modern, centered 'Glassmorphism' card for the timer. Use a bold, monospace font for the countdown digits.

UX: Include a 'Start' button that transforms into a 'Pause' button when active. Add a 'Reset' button and a 'Save Session' button.

Functionality Requirements:

Database: Implement a native IndexedDB wrapper to handle database initialization, saving a session (timestamp, duration, label), and retrieving all sessions.

The Timer Engine: Use a requestAnimationFrame loop to ensure the UI updates smoothly and stays perfectly synced with the system clock (handling background tab throttling).

History UI: Below the timer, render a scrollable list of 'Past Sessions' that updates in real-time whenever a new session is saved to IndexedDB.

Persistence: If the user closes the tab and re-opens it, the app should check IndexedDB for a 'runningState' and resume the countdown automatically.

Code Structure:

Provide the complete HTML/JS in one block.

Use clean, commented ES6+ syntax (Classes, Arrow functions, Destructuring)."