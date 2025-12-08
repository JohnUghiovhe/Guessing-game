# Live Guessing Game

A real-time guessing game using Express and Socket.IO. One player is the Game Master (GM) who sets the question/answer and starts the session. Players join, see each other’s scores, and have limited attempts to guess before the timer expires.

## Features
- Chat-like interface showing system and result messages.
- Game Master flow: one GM at a time, sets question and starts the round.
- Join gating: players cannot join while a game is in progress.
- Attempts & timer: each player gets 3 attempts; round timer defaults to 60s.
- Win/timeout handling:
  - First correct answer ends the round, awards +10, and announces winner/answer.
  - On timeout, no winner, answer is revealed, and guessing stops.
- Scoreboard shows all players, scores, and attempts left.
- Post-game GM rotation: next player is promoted when the game ends or GM leaves.
- Session cleanup: session resets when all players leave.

## Requirements
- Node.js 18+ (recommended)

## Setup
```bash
npm install
```

## Run
```bash
npm start
```
Then open http://localhost:5000 in multiple browser tabs to play.

## How to Play
1) One user joins as Game Master (check “Join as Game Master”). Others join as players.
2) GM enters a question and answer, then starts the game (requires at least 3 players).
3) Each player gets 3 attempts and 60s to guess. Answers are text-based.
4) Round ends on first correct guess (winner announced) or when time runs out (answer revealed, no winner).
5) After a round, another player is automatically promoted to GM if needed; repeat with a new question.

## Project Structure
- `index.js` — Express/Socket.IO server setup.
- `public/index.html` — Client UI and socket interactions.
- `models/GameSession.js` — Game rules, state, GM logic, attempts/timer handling.
- `models/Player.js` — Player model (score, attempts, GM flag).
- `models/Questions.js` — Simple question/answer model (free-form).
- `models/Timer.js` — Countdown timer helper.

## Notes
- Default timer is 60 seconds; adjust in `models/Timer.js` if needed.
- Players cannot join mid-round; wait until the current game ends.***

