const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const GameSession = require('./models/GameSession');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameSession = new GameSession({ io });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('player:join', ({ name, isMaster }, cb) => {
    const safeName = (name || 'Player').trim() || 'Player';
    const result = gameSession.addPlayer(socket.id, safeName, Boolean(isMaster));
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

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});