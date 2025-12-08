class Player {
  constructor(id, name, isMaster = false) {
    this.id = id;
    this.name = name;
    this.isMaster = isMaster;
    this.score = 0;
    this.attemptsLeft = 3;
    this.lastAnswer = null;
    this.lastResult = null;
  }

  resetForNewRound() {
    this.attemptsLeft = 3;
    this.lastAnswer = null;
    this.lastResult = null;
  }
}

module.exports = Player;
