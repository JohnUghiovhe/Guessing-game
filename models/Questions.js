class Questions {
  constructor({ question, answer }) {
    this.question =  question;
    this.answer = answer.trim();
  }

  isCorrect(answer) {
    return this.answer.trim().toLowerCase() === answer.trim().toLowerCase();
  }
}
module.exports = Questions;
