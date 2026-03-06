const socket = io();
let myId = null;
const joinForm = document.getElementById('join-form');
const nameInput = document.getElementById('name-input');
const masterCheckbox = document.getElementById('master-checkbox');
const startBtn = document.getElementById('start-btn');
const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const answerInput = document.getElementById('answer-input');
const questionTitle = document.getElementById('question-title');
const answerForm = document.getElementById('answer-form');
const submitBtn = document.getElementById('submit-btn');
const playerAnswer = document.getElementById('player-answer');
const timerMeta = document.getElementById('timer-meta');
const playersList = document.getElementById('players');
const playerCount = document.getElementById('player-count');
const playersOnline = document.getElementById('players-online');
const messagesEl = document.getElementById('messages');
const masterTools = document.getElementById('master-tools');
const stateChip = document.getElementById('state-chip');
const roundStatus = document.getElementById('round-status');
const themeToggle = document.getElementById('theme-toggle');
const landingThemeToggle = document.getElementById('landing-theme-toggle');
const landingView = document.getElementById('landing-view');
const arenaShell = document.getElementById('arena-shell');
const enterArenaBtn = document.getElementById('enter-arena-btn');
const THEME_KEY = 'guessing-game-theme';

let joined = false;
let isMaster = false;
let currentQuestion = null;
let lastResultSignature = '';

initializeTheme();

enterArenaBtn.addEventListener('click', () => {
  landingView.hidden = true;
  arenaShell.hidden = false;
  nameInput.focus();
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    // Ignore storage failures and keep in-memory theme.
  }
});

landingThemeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    // Ignore storage failures and keep in-memory theme.
  }
});

socket.on('connect', () => {
  myId = socket.id;
});

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!nameInput.value.trim()) return;

  const payload = { name: nameInput.value.trim(), isMaster: masterCheckbox.checked };
  socket.emit('player:join', payload, (resp) => {
    if (resp && resp.error) {
      pushMessage('Join failed: ' + resp.error, true);
      return;
    }

    joined = true;
    isMaster = masterCheckbox.checked;
    joinForm.querySelector('button').disabled = true;
    nameInput.disabled = true;
    masterCheckbox.disabled = true;
    startBtn.disabled = !isMaster;
    masterTools.style.display = isMaster ? 'grid' : 'none';
    pushMessage('You joined as ' + (isMaster ? 'Game Master.' : 'Player.'), true);
  });
});

startBtn.addEventListener('click', () => {
  socket.emit('game:start', null, (resp) => {
    if (resp && resp.error) pushMessage(resp.error, true);
  });
});

questionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!questionInput.value.trim() || !answerInput.value.trim()) return;
  socket.emit(
    'question:create',
    { question: questionInput.value.trim(), answer: answerInput.value.trim() },
    (resp) => {
      if (resp && resp.error) {
        pushMessage(resp.error, true);
        return;
      }
      questionInput.value = '';
      answerInput.value = '';
    }
  );
});

answerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentQuestion) return;
  if (!playerAnswer.value.trim()) return;
  socket.emit('answer:submit', { answer: playerAnswer.value.trim() });
  playerAnswer.value = '';
});

socket.on('game:state', renderState);
socket.on('players:update', renderPlayers);
socket.on('timer:update', (seconds) => {
  timerMeta.textContent = seconds + 's';
});
socket.on('answer:result', ({ correct, attemptsLeft, gameOver }) => {
  const attemptMsg = typeof attemptsLeft === 'number' ? ' Attempts left: ' + attemptsLeft + '.' : '';
  const msg = correct ? 'Correct! You have won.' : 'Wrong.' + (gameOver ? '' : attemptMsg);
  pushMessage(msg.trim(), true);
});
socket.on('system:message', (msg) => pushMessage(msg, false));

function renderState(state) {
  currentQuestion = state.currentQuestion;

  const currentCount = state.playerCount || 0;
  playerCount.textContent = String(currentCount);
  playersOnline.textContent = String(currentCount);

  const me = state.players && state.players.find((p) => p.id === myId);
  isMaster = Boolean(me && me.isMaster);
  startBtn.disabled = !isMaster || state.inProgress;
  masterTools.style.display = isMaster ? 'grid' : 'none';

  if (!state.inProgress) {
    questionTitle.textContent = 'Waiting to start...';
    submitBtn.disabled = true;
    timerMeta.textContent = '--';
    setStateVisual(false);

    if (state.result) {
      const winnerLine = state.result.winnerName ? 'Winner: ' + state.result.winnerName : 'No winner.';
      const answerLine = state.result.answer ? ' Answer: ' + state.result.answer : '';
      const signature = winnerLine + answerLine;
      if (signature !== lastResultSignature) {
        pushMessage((winnerLine + answerLine).trim(), false);
        lastResultSignature = signature;
      }
    }
    return;
  }

  setStateVisual(true);
  lastResultSignature = '';

  if (currentQuestion) {
    questionTitle.textContent = currentQuestion.prompt;
    submitBtn.disabled = !joined;
    timerMeta.textContent = (state.timeLeft || '--') + 's';
  } else {
    questionTitle.textContent = 'Waiting for next question...';
    submitBtn.disabled = true;
  }

  if (me && me.attemptsLeft <= 0) {
    submitBtn.disabled = true;
    pushMessage('No attempts left.', true);
  }

  if (state.result) {
    submitBtn.disabled = true;
  }
}

function renderPlayers(players = []) {
  playerCount.textContent = String(players.length);
  playersOnline.textContent = String(players.length);

  if (!players.length) {
    playersList.innerHTML = '<li class="empty">No players yet. Join to begin the action.</li>';
    return;
  }

  playersList.innerHTML = players
    .map((p) => {
      const safeName = escapeHtml(p.name || 'Player');
      const gmTag = p.isMaster ? '<span class="tag">GM</span>' : '';
      const score = (p.score || 0) + ' pts | ' + (p.attemptsLeft || 0) + ' tries';

      return (
        '<li class="player">' +
        '<span class="player-name">' +
        safeName +
        ' ' +
        gmTag +
        '</span>' +
        '<span class="score">' +
        escapeHtml(score) +
        '</span>' +
        '</li>'
      );
    })
    .join('');
}

function setStateVisual(inProgress) {
  stateChip.className = 'chip ' + (inProgress ? 'live' : 'waiting');
  stateChip.textContent = inProgress ? 'Round live' : 'Session idle';
  roundStatus.textContent = inProgress ? 'In Progress' : 'Waiting';
}

function pushMessage(text, isLocal) {
  const entry = document.createElement('article');
  entry.className = 'message' + (isLocal ? ' local' : '');

  const content = document.createElement('span');
  content.textContent = String(text);

  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  entry.appendChild(content);
  entry.appendChild(time);
  messagesEl.appendChild(entry);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initializeTheme() {
  let preferredTheme = 'light';

  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      preferredTheme = savedTheme;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      preferredTheme = 'dark';
    }
  } catch (error) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      preferredTheme = 'dark';
    }
  }

  applyTheme(preferredTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  themeToggle.setAttribute('aria-label', 'Current theme: ' + (theme === 'dark' ? 'Dark' : 'Light'));
  themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  landingThemeToggle.textContent = theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
  landingThemeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}
