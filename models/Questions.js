class Questions {
  constructor({ question, answer }) {
    this.question = question;
    this.answer = answer.trim();
  }

  isCorrect(guess) {
    return this.answer.toLowerCase() === String(guess).trim().toLowerCase();
  }

  isAnswer(guess) {
    // Backward-compatible alias for older call sites.
    return this.isCorrect(guess);
  }
}

module.exports = Questions;