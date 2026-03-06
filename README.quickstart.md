# Guessing Arena - Quick Start

Real-time multiplayer guessing game built with `Express` and `Socket.IO`.

This is the short recruiter/interview version.
For full architecture, event flow, and implementation details, see `README.md`.

## What It Does
- Supports live multiplayer guessing sessions in the browser.
- One player acts as Game Master (GM), others join as players.
- GM posts question/answer, players guess in real time.
- Timer and attempt limits enforce round pressure.
- First correct answer wins and gets `+10` points.

## Key Product Highlights
- Real-time updates with Socket.IO.
- Modern responsive UI with:
  - Landing page before entering arena
  - Live game dashboard and player sidebar
  - Light/dark theme toggle
- Accessibility support:
  - `:focus-visible` keyboard focus styles
  - Reduced motion support

## Tech Stack
- Node.js
- Express
- Socket.IO
- Vanilla HTML/CSS/JavaScript

## Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5000`.

## Interview Talking Points
- Event-driven multiplayer architecture with Socket.IO.
- Clear separation of session/game logic in `models/GameSession.js`.
- Responsive and accessible UI redesign while preserving backend behavior.
- State synchronization and role-based interaction (GM vs players).

## Project Snapshot
- Entry server: `index.js`
- Game logic: `models/GameSession.js`
- Frontend: `public/index.html`
- Full technical documentation: `README.md`
