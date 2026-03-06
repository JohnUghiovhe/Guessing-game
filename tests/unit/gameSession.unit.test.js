const GameSession = require('../../models/GameSession');
const Timer = require('../../models/Timer');
const Questions = require('../../models/Questions');

function createIoMock() {
  return {
    emit: jest.fn(),
    to: jest.fn((id) => ({
      emit: jest.fn(),
      id,
    })),
  };
}

describe('GameSession unit lifecycle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prevents joining while game is in progress', () => {
    const io = createIoMock();
    const session = new GameSession({ io });

    session.addPlayer('gm', 'GM', true);
    session.addPlayer('p1', 'P1');
    session.addPlayer('p2', 'P2');
    session.currentQuestion = new Questions({ question: '2+2?', answer: '4' });

    const timerStartSpy = jest.spyOn(Timer.prototype, 'start').mockImplementation(() => {});
    const startResult = session.startGame('gm');

    expect(startResult).toEqual({ ok: true });
    expect(timerStartSpy).toHaveBeenCalled();

    const joinResult = session.addPlayer('late', 'Late Player');
    expect(joinResult.error).toBe('Cannot join while a game is in progress.');
  });

  test('awards winner and ends game on correct answer', () => {
    const io = createIoMock();
    const session = new GameSession({ io });

    jest.spyOn(Timer.prototype, 'start').mockImplementation(() => {});
    jest.spyOn(Timer.prototype, 'stop').mockImplementation(() => {});

    session.addPlayer('gm', 'GM', true);
    session.addPlayer('p1', 'P1');
    session.addPlayer('p2', 'P2');

    const createResult = session.createQuestion('gm', { question: 'Capital of France?', answer: 'Paris' });
    expect(createResult.ok).toBe(true);

    session.handleAnswer('p1', 'paris');

    expect(session.inProgress).toBe(false);
    expect(session.result).toMatchObject({
      winnerId: 'p1',
      winnerName: 'P1',
      answer: 'Paris',
      reason: 'win',
    });

    const winner = session.players.get('p1');
    expect(winner.score).toBe(10);
  });

  test('times out and reveals answer when timeout fires', () => {
    const io = createIoMock();
    const session = new GameSession({ io });

    let onComplete;
    jest.spyOn(Timer.prototype, 'start').mockImplementation((duration, onTick, complete) => {
      onComplete = complete;
    });
    jest.spyOn(Timer.prototype, 'stop').mockImplementation(() => {});

    session.addPlayer('gm', 'GM', true);
    session.addPlayer('p1', 'P1');
    session.addPlayer('p2', 'P2');
    session.createQuestion('gm', { question: 'Sky color?', answer: 'Blue' });

    onComplete();

    expect(session.inProgress).toBe(false);
    expect(session.result).toMatchObject({ answer: 'Blue', reason: 'timeout' });
    expect(session.result.winnerId).toBe(null);
  });

  test('promotes next master when current master leaves', () => {
    const io = createIoMock();
    const session = new GameSession({ io });

    session.addPlayer('gm', 'GM', true);
    session.addPlayer('p1', 'P1');
    session.addPlayer('p2', 'P2');

    session.removePlayer('gm');

    expect(session.masterId).toBe('p1');
    expect(session.players.get('p1').isMaster).toBe(true);
  });
});
