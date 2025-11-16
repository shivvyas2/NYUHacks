import { SATQuestion } from './types'

export const satQuestions: SATQuestion[] = [
  {
    id: 1,
    question: 'If 2x + 5 = 15, what is the value of x?',
    options: ['5', '10', '7.5', '3'],
    correctAnswer: 0,
    topic: 'Algebra',
    difficulty: 'easy',
    explanation: '2x + 5 = 15, subtract 5: 2x = 10, divide by 2: x = 5'
  },
  {
    id: 2,
    question: 'Which word is most similar to "benevolent"?',
    options: ['Kind', 'Hostile', 'Neutral', 'Angry'],
    correctAnswer: 0,
    topic: 'Vocabulary',
    difficulty: 'easy',
    explanation: 'Benevolent means showing kindness and goodwill.'
  },
  {
    id: 3,
    question: 'What is 15% of 200?',
    options: ['30', '25', '35', '20'],
    correctAnswer: 0,
    topic: 'Math',
    difficulty: 'easy',
    explanation: '15% of 200 = 0.15 × 200 = 30'
  },
  {
    id: 4,
    question: 'Which is the correct form: "She ____ to the store yesterday."',
    options: ['went', 'goes', 'gone', 'going'],
    correctAnswer: 0,
    topic: 'Grammar',
    difficulty: 'easy',
    explanation: '"Went" is the simple past tense of "go".'
  },
  {
    id: 5,
    question: 'If a triangle has angles of 60° and 80°, what is the third angle?',
    options: ['40°', '50°', '60°', '30°'],
    correctAnswer: 0,
    topic: 'Geometry',
    difficulty: 'medium',
    explanation: 'Angles in a triangle sum to 180°. 180° - 60° - 80° = 40°'
  },
  {
    id: 6,
    question: 'What does "ubiquitous" mean?',
    options: ['Everywhere', 'Rare', 'Ancient', 'Modern'],
    correctAnswer: 0,
    topic: 'Vocabulary',
    difficulty: 'medium',
    explanation: 'Ubiquitous means present, appearing, or found everywhere.'
  },
  {
    id: 7,
    question: 'Solve for y: 3y - 7 = 2y + 5',
    options: ['12', '8', '10', '6'],
    correctAnswer: 0,
    topic: 'Algebra',
    difficulty: 'medium',
    explanation: '3y - 2y = 5 + 7, y = 12'
  },
  {
    id: 8,
    question: 'Which punctuation is correct: "Its raining outside" or "It\'s raining outside"?',
    options: ["It's", 'Its', 'Both', 'Neither'],
    correctAnswer: 0,
    topic: 'Grammar',
    difficulty: 'easy',
    explanation: '"It\'s" is a contraction of "it is". "Its" is possessive.'
  },
  {
    id: 9,
    question: 'What is the area of a circle with radius 5? (Use π ≈ 3.14)',
    options: ['78.5', '31.4', '15.7', '25'],
    correctAnswer: 0,
    topic: 'Geometry',
    difficulty: 'medium',
    explanation: 'Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5'
  },
  {
    id: 10,
    question: 'Which word means "to make worse"?',
    options: ['Exacerbate', 'Alleviate', 'Improve', 'Enhance'],
    correctAnswer: 0,
    topic: 'Vocabulary',
    difficulty: 'hard',
    explanation: 'Exacerbate means to make a problem or bad situation worse.'
  }
]

