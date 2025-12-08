const Player = require('./Player');
const Timer = require('./Timer');
const Questions = require('./Questions');

class GameSession {
  constructor({ io }) {
    this.io = io;
    this.players = new Map();
    this.masterId = null;
    this.inProgress = false;
    this.currentQuestion = null;
    this.timer = new Timer();
    this.result = null; // { winnerId, winnerName, answer, reason: 'win' | 'timeout' }
  }

  resetSessionState() {
    this.masterId = null;
    this.inProgress = false;
    this.currentQuestion = null;
    this.result = null;
    this.timer.stop();
  }

  addPlayer(id, name, isMaster = false) {
    if (this.inProgress) {
      return { error: 'Cannot join while a game is in progress.' };
    }
    if (isMaster && this.masterId && this.masterId !== id) {
      return { error: 'A game master already exists for this session.' };
    }

    const player = new Player(id, name, isMaster);
    this.players.set(id, player);

    if (isMaster && !this.masterId) {
      this.masterId = id;
    }

    this.emitPlayers();
    this.broadcastState();
    this.io.emit('system:message', `${player.name} joined the session.`);
    return { ok: true };
  }

  removePlayer(id) {
    const player = this.players.get(id);
    this.players.delete(id);

    if (id === this.masterId) {
      this.masterId = null;
      this.inProgress = false;
      this.currentQuestion = null;
      this.result = null;
      this.timer.stop();
      this.io.emit('system:message', 'Game master left. Session reset.');
      this.promoteNextMaster();
    } else if (player) {
      this.io.emit('system:message', `${player.name} left the session.`);
    }

    if (this.players.size === 0) {
      this.resetSessionState();
      this.io.emit('system:message', 'Session deleted (no players).');
    }

    this.emitPlayers();
    this.broadcastState();
  }

  startGame(byId) {
    if (byId !== this.masterId) {
      return { error: 'Only the game master can start the session.' };
    }
    if (this.players.size < 3) {
      return { error: 'Need at least 3 players to start the session.' };
    }
    if (this.inProgress) {
      return { error: 'Game already in progress.' };
    }
    if (!this.currentQuestion) {
      return { error: 'Set a question before starting the game.' };
    }

    this.result = null;
    this.inProgress = true;
    Array.from(this.players.values()).forEach((p) => p.resetForNewRound());
    this.timer.stop();

    this.broadcastState();
    this.io.emit('system:message', 'Game started by the game master.');

    this.timer.start(
      60,
      (remaining) => this.io.emit('timer:update', remaining),
      () => this.handleTimeout()
    );
    return { ok: true };
  }

  createQuestion(byId, { question, answer }) {
    if (byId !== this.masterId) {
      return { error: 'Only the game master can post questions.' };
    }
    if (this.inProgress) {
      return { error: 'Cannot change the question while a game is in progress.' };
    }
    if (!question || !String(answer).trim()) {
      return { error: 'Question and answer are required.' };
    }

    this.currentQuestion = new Questions({ question, answer });
    this.result = null;
    this.broadcastState();
    this.io.emit('system:message', `Question ready: ${question}`);
    return { ok: true };
  }

  handleAnswer(playerId, answer) {
    const player = this.players.get(playerId);
    if (!player || !this.currentQuestion || !this.inProgress) return;
    if (this.result) return; // game already ended
    if (player.attemptsLeft <= 0) return;

    const submitted = String(answer || '').trim();
    player.lastAnswer = submitted;
    const isCorrect = this.currentQuestion.isCorrect(submitted);
    player.lastResult = isCorrect ? 'correct' : 'wrong';
    if (!isCorrect) {
      player.attemptsLeft -= 1;
    }
    if (isCorrect) {
      player.score += 10;
      this.endGame({
        winnerId: player.id,
        winnerName: player.name,
        answer: this.currentQuestion.answer,
        reason: 'win',
      });
    }

    this.emitPlayers();

    this.io.to(playerId).emit('answer:result', {
      correct: player.lastResult === 'correct',
      correctAnswer: this.currentQuestion.answer,
      attemptsLeft: player.attemptsLeft,
      gameOver: Boolean(this.result),
    });
  }

  emitPlayers() {
    this.io.emit('players:update', this.getPlayers());
  }

  broadcastState() {
    this.io.emit('game:state', this.getState());
  }

  getPlayers() {
    return Array.from(this.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      lastAnswer: player.lastAnswer,
      lastResult: player.lastResult,
      isMaster: player.isMaster,
    }));
  }

  getState() {
    return {
      inProgress: this.inProgress,
      currentQuestion: this.currentQuestion
        ? {
            prompt: this.currentQuestion.question,
          }
        : null,
      players: this.getPlayers(),
      playerCount: this.players.size,
      hasMaster: Boolean(this.masterId),
      timeLeft: this.timer.getRemaining(),
      masterId: this.masterId,
      result: this.result,
    };
  }

  endGame({ winnerId = null, winnerName = null, answer = null, reason = 'timeout' }) {
    this.inProgress = false;
    this.result = { winnerId, winnerName, answer, reason };
    this.timer.stop();
    this.broadcastState();
    if (winnerName) {
      this.io.emit('system:message', `${winnerName} got the correct answer!`);
    } else if (answer) {
      this.io.emit('system:message', `Time is up! Correct answer: ${answer}`);
    } else {
      this.io.emit('system:message', 'Time is up!');
    }

    this.promoteNextMaster();
  }

  handleTimeout() {
    if (!this.inProgress || this.result) return;
    const answer = this.currentQuestion ? this.currentQuestion.answer : null;
    this.endGame({ answer, reason: 'timeout' });
  }

  promoteNextMaster() {
    if (this.players.size === 0) {
      this.masterId = null;
      return;
    }

    // pick the first non-master; if none, keep current or set first available
    const candidates = Array.from(this.players.values());
    const next = candidates.find((p) => !p.isMaster) || candidates[0];
    if (!next) return;

    // clear current
    if (this.masterId && this.players.has(this.masterId)) {
      this.players.get(this.masterId).isMaster = false;
    }

    this.masterId = next.id;
    next.isMaster = true;
    this.io.emit('system:message', `${next.name} is now the Game Master.`);
    this.emitPlayers();
    this.broadcastState();
  }
}

module.exports = GameSession;
