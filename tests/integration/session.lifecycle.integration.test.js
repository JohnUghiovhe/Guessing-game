const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const GameSession = require('../../models/GameSession');

function waitForEvent(socket, eventName, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for event: ' + eventName));
    }, timeoutMs);

    socket.once(eventName, (...args) => {
      clearTimeout(timer);
      resolve(args);
    });
  });
}

function disconnectSocket(socket) {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve();
      return;
    }
    socket.once('disconnect', () => resolve());
    socket.disconnect();
  });
}

describe('Session lifecycle integration', () => {
  let app;
  let server;
  let io;
  let baseUrl;

  beforeAll((done) => {
    app = express();
    server = http.createServer(app);
    io = new Server(server);

    const gameSession = new GameSession({ io });

    io.on('connection', (socket) => {
      socket.on('player:join', ({ name, isMaster }, cb) => {
        const result = gameSession.addPlayer(socket.id, (name || 'Player').trim() || 'Player', Boolean(isMaster));
        socket.emit('game:state', gameSession.getState());
        if (cb) cb(result);
      });

      socket.on('game:start', (data, cb) => {
        const result = gameSession.startGame(socket.id);
        if (cb) cb(result);
      });

      socket.on('answer:submit', ({ answer }) => {
        gameSession.handleAnswer(socket.id, answer);
      });

      socket.on('question:create', ({ question, answer }, cb) => {
        const result = gameSession.createQuestion(socket.id, { question, answer });
        if (cb) cb(result);
      });

      socket.on('disconnect', () => {
        gameSession.removePlayer(socket.id);
      });
    });

    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = 'http://localhost:' + port;
      done();
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => io.close(() => resolve()));
    await new Promise((resolve) => server.close(() => resolve()));
  });

  test('joins players, starts via question creation, handles winner, and blocks mid-round joins', async () => {
    const gm = ioClient(baseUrl, { transports: ['websocket'] });
    const p1 = ioClient(baseUrl, { transports: ['websocket'] });
    const p2 = ioClient(baseUrl, { transports: ['websocket'] });
    let lateJoiner;

    try {
      await Promise.all([
        waitForEvent(gm, 'connect'),
        waitForEvent(p1, 'connect'),
        waitForEvent(p2, 'connect'),
      ]);

      const joinGmResult = await new Promise((resolve) => {
        gm.emit('player:join', { name: 'GM', isMaster: true }, (resp) => resolve(resp));
      });
      const joinP1Result = await new Promise((resolve) => {
        p1.emit('player:join', { name: 'Player One', isMaster: false }, (resp) => resolve(resp));
      });
      const joinP2Result = await new Promise((resolve) => {
        p2.emit('player:join', { name: 'Player Two', isMaster: false }, (resp) => resolve(resp));
      });

      expect(joinGmResult).toEqual({ ok: true });
      expect(joinP1Result).toEqual({ ok: true });
      expect(joinP2Result).toEqual({ ok: true });

      const createQuestionResult = await new Promise((resolve) => {
        gm.emit('question:create', { question: '2 + 2?', answer: '4' }, (resp) => resolve(resp));
      });
      expect(createQuestionResult).toEqual({ ok: true, started: true });

      lateJoiner = ioClient(baseUrl, { transports: ['websocket'] });
      await waitForEvent(lateJoiner, 'connect');
      const lateJoinResult = await new Promise((resolve) => {
        lateJoiner.emit('player:join', { name: 'Late', isMaster: false }, (resp) => resolve(resp));
      });
      expect(lateJoinResult.error).toBe('Cannot join while a game is in progress.');

      const answerResultPromise = waitForEvent(p1, 'answer:result');
      const gameStateAfterWinPromise = waitForEvent(gm, 'game:state');

      p1.emit('answer:submit', { answer: '4' });

      const [answerResult] = await answerResultPromise;
      expect(answerResult.correct).toBe(true);
      expect(answerResult.gameOver).toBe(true);

      const [state] = await gameStateAfterWinPromise;
      expect(state.inProgress).toBe(false);
      expect(state.result).toMatchObject({ winnerName: 'Player One', answer: '4', reason: 'win' });
    } finally {
      await Promise.all([
        disconnectSocket(gm),
        disconnectSocket(p1),
        disconnectSocket(p2),
        disconnectSocket(lateJoiner),
      ]);
    }
  });
});
