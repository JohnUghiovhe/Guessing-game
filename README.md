# Guessing Arena

Real-time multiplayer guessing game built with `Express` + `Socket.IO`.

For recruiter/interview review, see the concise version: `README.quickstart.md`.

One player acts as the Game Master (GM), posts a question, and manages rounds while other players race the timer and limited attempts to win points.

## Table Of Contents
1. Overview
2. Highlights
3. What Changed (Detailed Update Log)
4. Gameplay Rules
5. UI/UX Overview
6. Technical Architecture
7. Socket Events
8. Getting Started
9. Development Commands
10. Project Structure
11. Troubleshooting
12. Known Limitations
13. Future Improvements

## Overview
- Runtime: Node.js server on port `5000`
- Stack: `Express`, `Socket.IO`, vanilla HTML/CSS/JS
- Mode: Multi-user live session in browser tabs/devices
- Role model: 1 active GM, multiple players

## Highlights
- Real-time session state synchronization via Socket.IO.
- Question rounds with timer and win/timeout resolution.
- Score tracking per player (`+10` for first correct answer).
- Modernized, responsive UI with:
  - Pre-game landing page
  - Arena dashboard layout
  - Live feed and player list panels
  - Theme support (light/dark)
- Accessibility-focused refinements:
  - Keyboard `:focus-visible` styling
  - Reduced-motion support for motion-sensitive users
  - ARIA state updates for toggle controls

## What Changed (Detailed Update Log)

### 1. Major Frontend Redesign
- Replaced the original minimal layout with a more structured, polished visual system.
- Introduced visual tokens using CSS variables for spacing, colors, elevation, and surface contrast.
- Improved responsiveness for desktop, tablet, and mobile breakpoints.

### 2. New Landing Experience
- Added a dedicated landing/home page shown before entering the game arena.
- Added CTA: `Enter Gaming Arena` to reveal the full game interface.
- Added feature cards and game intro copy to orient new users before joining.

### 3. Theme System (Light/Dark)
- Added persistent theme support using `localStorage` key: `guessing-game-theme`.
- Added a compact emoji theme toggle button (`☀️` / `🌙`) in the join control row.
- Added theme toggle on landing section as secondary control.
- Supports fallback to system preference (`prefers-color-scheme`) when no saved theme exists.

### 4. Accessibility Refinements
- Added clear keyboard focus outlines via `:focus-visible`.
- Added reduced-motion behavior via `@media (prefers-reduced-motion: reduce)`.
- Added ARIA press state updates for theme controls.
- Retained semantic heading hierarchy and readable panel structure.

### 5. Feed And Rendering Safety Improvements
- Message rendering uses `textContent` for safer output.
- Player display values are escaped before injection into markup.

### 6. UI Behavior Enhancements
- Added clearer session/round status chips and summary indicators.
- Added live counters and improved readability for scoreboard/feed cards.
- Preserved all existing game functionality and socket flows during UI upgrades.

## Gameplay Rules
- Minimum players required to start a round: `3`.
- One GM at a time per session.
- Current implementation detail: posting a question via GM control also attempts to start the round immediately.
- A round uses:
  - `60s` timer (default)
  - `3` attempts per player per round
- First correct answer wins and ends round.
- Winner receives `+10` score.
- On timeout:
  - Round ends
  - Correct answer is revealed
- Joining is blocked while a round is in progress.
- GM rotation:
  - If GM leaves, session resets and next player is promoted.
  - Promotion can also occur after round completion.

## UI/UX Overview

### Landing Page
- Intro headline and value proposition.
- Feature preview cards.
- `Enter Gaming Arena` action.
- Theme switch action.

### Arena Page
- Header with join controls.
- Status cards for round state, timer, and player count.
- Main gameplay panel:
  - Current question state
  - GM controls for posting questions
  - Live feed/messages
  - Answer submission area
- Sidebar panel for players and basic stats.

## Technical Architecture

### Server
- `index.js` initializes:
  - Express static server
  - HTTP server
  - Socket.IO server
  - `GameSession` lifecycle manager

### Domain Models
- `models/GameSession.js`
  - Manages players, rounds, timer lifecycle, outcomes, and role promotion.
- `models/Player.js`
  - Tracks player identity, role, score, and per-round attempts.
- `models/Questions.js`
  - Stores question/answer data and answer-checking helper.
- `models/Timer.js`
  - Encapsulates countdown with tick and completion callbacks.

### Client
- `public/index.html`
  - Full UI, styling, and client-side socket orchestration in one file.

## Socket Events

### Client -> Server
- `player:join`
- `game:start`
- `question:create`
- `answer:submit`

### Server -> Client
- `game:state`
- `players:update`
- `timer:update`
- `answer:result`
- `system:message`

## Getting Started

### Prerequisites
- Node.js `18+` recommended
- npm `9+` recommended

### Install
```bash
npm install
```

### Run (Production style)
```bash
npm start
```

### Run (Development with auto-reload)
```bash
npm run dev
```

Open:
`http://localhost:5000`

Use multiple tabs or devices to simulate multiple players.

## Development Commands
- `npm start`: Start server with Node.
- `npm run dev`: Start server with Nodemon.
- `npm run start:dev`: Alias for dev startup.
- `npm test`: Run all tests (unit + integration).
- `npm run test:unit`: Run unit tests only.
- `npm run test:integration`: Run integration tests only.

## Project Structure
```text
.
|-- index.js
|-- package.json
|-- README.md
|-- models/
|   |-- GameSession.js
|   |-- Player.js
|   |-- Questions.js
|   `-- Timer.js
`-- public/
    `-- index.html
```

## Troubleshooting

### Port already in use (`EADDRINUSE: 5000`)
Another process is already using port `5000`.

Fix options:
1. Stop the currently running Node process using that port.
2. Restart the app with `npm run dev` or `npm start`.

### Cannot join session
- Joining is intentionally blocked during active rounds.
- Wait for round end or reset the session.

### Round does not start
- Ensure there are at least `3` connected players.
- Ensure a question and answer have been set by GM.
- Note: the `question:create` flow currently auto-triggers `startGame` on the server.

## Known Limitations
- Test coverage currently focuses on session lifecycle; broader UI and end-to-end scenarios are still limited.
- Frontend is single-file (`public/index.html`) and can be modularized for scale.

## Future Improvements
2. Split frontend into separate CSS/JS modules.
3. Add persistent rooms and session history.
4. Add authentication/identity beyond socket connection IDs.
5. Add admin controls and round configuration in UI.


