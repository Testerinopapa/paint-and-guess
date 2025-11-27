// Three hardcoded quiz sets

export const QUIZ_GENERAL_KNOWLEDGE = {
  id: "general-knowledge",
  name: "General Knowledge",
  description: "Test your knowledge on a variety of topics",
  questions: [
    {
      id: "gk1",
      text: "What is the capital of France?",
      options: [
        { id: "a", text: "London", color: "red" },
        { id: "b", text: "Berlin", color: "blue" },
        { id: "c", text: "Paris", color: "yellow" },
        { id: "d", text: "Madrid", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
    {
      id: "gk2",
      text: "Which planet is known as the Red Planet?",
      options: [
        { id: "a", text: "Venus", color: "red" },
        { id: "b", text: "Mars", color: "blue" },
        { id: "c", text: "Jupiter", color: "yellow" },
        { id: "d", text: "Saturn", color: "green" },
      ],
      correctOptionId: "b",
      timeLimit: 20,
    },
    {
      id: "gk3",
      text: "Who painted the Mona Lisa?",
      options: [
        { id: "a", text: "Van Gogh", color: "red" },
        { id: "b", text: "Picasso", color: "blue" },
        { id: "c", text: "Leonardo da Vinci", color: "yellow" },
        { id: "d", text: "Michelangelo", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
    {
      id: "gk4",
      text: "What is the largest ocean on Earth?",
      options: [
        { id: "a", text: "Atlantic", color: "red" },
        { id: "b", text: "Indian", color: "blue" },
        { id: "c", text: "Arctic", color: "yellow" },
        { id: "d", text: "Pacific", color: "green" },
      ],
      correctOptionId: "d",
      timeLimit: 20,
    },
    {
      id: "gk5",
      text: "In which year did World War II end?",
      options: [
        { id: "a", text: "1943", color: "red" },
        { id: "b", text: "1944", color: "blue" },
        { id: "c", text: "1945", color: "yellow" },
        { id: "d", text: "1946", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
  ],
};

export const QUIZ_SCIENCE_TECH = {
  id: "science-tech",
  name: "Science & Technology",
  description: "Questions about science, technology, and innovation",
  questions: [
    {
      id: "st1",
      text: "What is the chemical symbol for water?",
      options: [
        { id: "a", text: "H2O", color: "red" },
        { id: "b", text: "CO2", color: "blue" },
        { id: "c", text: "NaCl", color: "yellow" },
        { id: "d", text: "O2", color: "green" },
      ],
      correctOptionId: "a",
      timeLimit: 15,
    },
    {
      id: "st2",
      text: "What is the speed of light in a vacuum?",
      options: [
        { id: "a", text: "300,000 km/s", color: "red" },
        { id: "b", text: "150,000 km/s", color: "blue" },
        { id: "c", text: "450,000 km/s", color: "yellow" },
        { id: "d", text: "600,000 km/s", color: "green" },
      ],
      correctOptionId: "a",
      timeLimit: 20,
    },
    {
      id: "st3",
      text: "Which programming language is known as the 'language of the web'?",
      options: [
        { id: "a", text: "Python", color: "red" },
        { id: "b", text: "Java", color: "blue" },
        { id: "c", text: "JavaScript", color: "yellow" },
        { id: "d", text: "C++", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
    {
      id: "st4",
      text: "What does CPU stand for?",
      options: [
        { id: "a", text: "Central Processing Unit", color: "red" },
        { id: "b", text: "Computer Personal Unit", color: "blue" },
        { id: "c", text: "Central Program Unit", color: "yellow" },
        { id: "d", text: "Computer Processing Unit", color: "green" },
      ],
      correctOptionId: "a",
      timeLimit: 15,
    },
    {
      id: "st5",
      text: "How many bits are in a byte?",
      options: [
        { id: "a", text: "4", color: "red" },
        { id: "b", text: "8", color: "blue" },
        { id: "c", text: "16", color: "yellow" },
        { id: "d", text: "32", color: "green" },
      ],
      correctOptionId: "b",
      timeLimit: 15,
    },
  ],
};

export const QUIZ_POP_CULTURE = {
  id: "pop-culture",
  name: "Pop Culture",
  description: "Movies, music, TV shows, and entertainment",
  questions: [
    {
      id: "pc1",
      text: "Which movie features the quote 'May the Force be with you'?",
      options: [
        { id: "a", text: "Star Trek", color: "red" },
        { id: "b", text: "Star Wars", color: "blue" },
        { id: "c", text: "Guardians of the Galaxy", color: "yellow" },
        { id: "d", text: "The Matrix", color: "green" },
      ],
      correctOptionId: "b",
      timeLimit: 20,
    },
    {
      id: "pc2",
      text: "Who sang 'Bohemian Rhapsody'?",
      options: [
        { id: "a", text: "The Beatles", color: "red" },
        { id: "b", text: "Queen", color: "blue" },
        { id: "c", text: "Led Zeppelin", color: "yellow" },
        { id: "d", text: "Pink Floyd", color: "green" },
      ],
      correctOptionId: "b",
      timeLimit: 20,
    },
    {
      id: "pc3",
      text: "What is the name of the coffee shop in the TV show 'Friends'?",
      options: [
        { id: "a", text: "Starbucks", color: "red" },
        { id: "b", text: "Central Perk", color: "blue" },
        { id: "c", text: "The Grind", color: "yellow" },
        { id: "d", text: "Café Nervosa", color: "green" },
      ],
      correctOptionId: "b",
      timeLimit: 20,
    },
    {
      id: "pc4",
      text: "Which streaming service created 'Stranger Things'?",
      options: [
        { id: "a", text: "Hulu", color: "red" },
        { id: "b", text: "Amazon Prime", color: "blue" },
        { id: "c", text: "Netflix", color: "yellow" },
        { id: "d", text: "Disney+", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
    {
      id: "pc5",
      text: "What year did the first iPhone launch?",
      options: [
        { id: "a", text: "2005", color: "red" },
        { id: "b", text: "2006", color: "blue" },
        { id: "c", text: "2007", color: "yellow" },
        { id: "d", text: "2008", color: "green" },
      ],
      correctOptionId: "c",
      timeLimit: 20,
    },
  ],
};

// Export all quizzes
export const QUIZZES = [
  QUIZ_GENERAL_KNOWLEDGE,
  QUIZ_SCIENCE_TECH,
  QUIZ_POP_CULTURE,
];

// Get quiz by ID
export function getQuizById(quizId) {
  return QUIZZES.find((quiz) => quiz.id === quizId) || QUIZ_GENERAL_KNOWLEDGE;
}

// Get all quizzes (for selection UI)
export function getAllQuizzes() {
  return QUIZZES.map((quiz) => ({
    id: quiz.id,
    name: quiz.name,
    description: quiz.description,
    questionCount: quiz.questions.length,
  }));
}

// Legacy function for backward compatibility
export function getSampleQuestions() {
  return QUIZ_GENERAL_KNOWLEDGE.questions;
}

