
const QUESTION_TYPES = ['addition', 'subtraction', 'multiplication', 'division'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];

  let a, b, questionText, correctAnswer;

  switch (type) {
    case 'addition': {
      a = randomInt(10, 999);
      b = randomInt(10, 999);
      questionText = `${a} + ${b}`;
      correctAnswer = a + b;
      break;
    }

    case 'subtraction': {
      a = randomInt(50, 999);
      b = randomInt(10, a); // ensure positive result
      questionText = `${a} − ${b}`;
      correctAnswer = a - b;
      break;
    }

    case 'multiplication': {
      a = randomInt(2, 25);
      b = randomInt(2, 25);
      questionText = `${a} × ${b}`;
      correctAnswer = a * b;
      break;
    }

    case 'division': {
      // Generate clean division (no remainders)
      b = randomInt(2, 15);
      correctAnswer = randomInt(2, 50);
      a = b * correctAnswer;
      questionText = `${a} ÷ ${b}`;
      break;
    }
  }

  return {
    question_text: questionText,
    correct_answer: correctAnswer,
  };
}

module.exports = { generateQuestion };
