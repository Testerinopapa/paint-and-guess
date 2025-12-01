// Quiz questions organized by topic

// General Knowledge Quiz (Mixed topics)
export const GENERAL_QUESTIONS = [
  {
    id: "gen1",
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
    id: "gen2",
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
    id: "gen3",
    text: "What is 2 + 2?",
    options: [
      { id: "a", text: "3", color: "red" },
      { id: "b", text: "4", color: "blue" },
      { id: "c", text: "5", color: "yellow" },
      { id: "d", text: "6", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 15,
  },
  {
    id: "gen4",
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
    id: "gen5",
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
];

// Science Quiz
export const SCIENCE_QUESTIONS = [
  {
    id: "sci1",
    text: "What is the chemical symbol for water?",
    options: [
      { id: "a", text: "H2O", color: "red" },
      { id: "b", text: "CO2", color: "blue" },
      { id: "c", text: "O2", color: "yellow" },
      { id: "d", text: "NaCl", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
  {
    id: "sci2",
    text: "What is the speed of light in vacuum (approximately)?",
    options: [
      { id: "a", text: "300,000 km/s", color: "red" },
      { id: "b", text: "150,000 km/s", color: "blue" },
      { id: "c", text: "450,000 km/s", color: "yellow" },
      { id: "d", text: "200,000 km/s", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 25,
  },
  {
    id: "sci3",
    text: "What is the smallest unit of matter?",
    options: [
      { id: "a", text: "Molecule", color: "red" },
      { id: "b", text: "Atom", color: "blue" },
      { id: "c", text: "Electron", color: "yellow" },
      { id: "d", text: "Proton", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "sci4",
    text: "How many bones does an adult human have?",
    options: [
      { id: "a", text: "196", color: "red" },
      { id: "b", text: "206", color: "blue" },
      { id: "c", text: "216", color: "yellow" },
      { id: "d", text: "226", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "sci5",
    text: "What planet is closest to the Sun?",
    options: [
      { id: "a", text: "Venus", color: "red" },
      { id: "b", text: "Earth", color: "blue" },
      { id: "c", text: "Mercury", color: "yellow" },
      { id: "d", text: "Mars", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "sci6",
    text: "What is the hardest natural substance on Earth?",
    options: [
      { id: "a", text: "Gold", color: "red" },
      { id: "b", text: "Iron", color: "blue" },
      { id: "c", text: "Diamond", color: "yellow" },
      { id: "d", text: "Platinum", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "sci7",
    text: "What gas do plants absorb from the atmosphere?",
    options: [
      { id: "a", text: "Oxygen", color: "red" },
      { id: "b", text: "Nitrogen", color: "blue" },
      { id: "c", text: "Carbon Dioxide", color: "yellow" },
      { id: "d", text: "Hydrogen", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
];

// History Quiz
export const HISTORY_QUESTIONS = [
  {
    id: "his1",
    text: "In which year did World War II end?",
    options: [
      { id: "a", text: "1943", color: "red" },
      { id: "b", text: "1945", color: "blue" },
      { id: "c", text: "1947", color: "yellow" },
      { id: "d", text: "1949", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "his2",
    text: "Who was the first person to walk on the Moon?",
    options: [
      { id: "a", text: "Buzz Aldrin", color: "red" },
      { id: "b", text: "Neil Armstrong", color: "blue" },
      { id: "c", text: "Michael Collins", color: "yellow" },
      { id: "d", text: "Yuri Gagarin", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "his3",
    text: "In which year did the Berlin Wall fall?",
    options: [
      { id: "a", text: "1987", color: "red" },
      { id: "b", text: "1989", color: "blue" },
      { id: "c", text: "1991", color: "yellow" },
      { id: "d", text: "1993", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "his4",
    text: "Which ancient civilization built the Great Pyramid of Giza?",
    options: [
      { id: "a", text: "Greeks", color: "red" },
      { id: "b", text: "Romans", color: "blue" },
      { id: "c", text: "Egyptians", color: "yellow" },
      { id: "d", text: "Babylonians", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "his5",
    text: "Who painted the ceiling of the Sistine Chapel?",
    options: [
      { id: "a", text: "Leonardo da Vinci", color: "red" },
      { id: "b", text: "Raphael", color: "blue" },
      { id: "c", text: "Michelangelo", color: "yellow" },
      { id: "d", text: "Donatello", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "his6",
    text: "In which year did the Titanic sink?",
    options: [
      { id: "a", text: "1910", color: "red" },
      { id: "b", text: "1912", color: "blue" },
      { id: "c", text: "1914", color: "yellow" },
      { id: "d", text: "1916", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
];

// Pop Culture Quiz
export const POP_CULTURE_QUESTIONS = [
  {
    id: "pop1",
    text: "Which movie won the Academy Award for Best Picture in 2020?",
    options: [
      { id: "a", text: "1917", color: "red" },
      { id: "b", text: "Parasite", color: "blue" },
      { id: "c", text: "Joker", color: "yellow" },
      { id: "d", text: "Once Upon a Time in Hollywood", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 25,
  },
  {
    id: "pop2",
    text: "What is the highest-grossing movie of all time?",
    options: [
      { id: "a", text: "Avatar", color: "red" },
      { id: "b", text: "Avengers: Endgame", color: "blue" },
      { id: "c", text: "Titanic", color: "yellow" },
      { id: "d", text: "Star Wars: The Force Awakens", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
  {
    id: "pop3",
    text: "Which artist has won the most Grammy Awards?",
    options: [
      { id: "a", text: "Beyoncé", color: "red" },
      { id: "b", text: "Georg Solti", color: "blue" },
      { id: "c", text: "Quincy Jones", color: "yellow" },
      { id: "d", text: "Taylor Swift", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 25,
  },
  {
    id: "pop4",
    text: "What is the name of the main character in 'The Matrix'?",
    options: [
      { id: "a", text: "Neo", color: "red" },
      { id: "b", text: "Morpheus", color: "blue" },
      { id: "c", text: "Trinity", color: "yellow" },
      { id: "d", text: "Agent Smith", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
  {
    id: "pop5",
    text: "Which streaming service originally produced 'Stranger Things'?",
    options: [
      { id: "a", text: "Hulu", color: "red" },
      { id: "b", text: "Netflix", color: "blue" },
      { id: "c", text: "Amazon Prime", color: "yellow" },
      { id: "d", text: "Disney+", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "pop6",
    text: "What year did the first iPhone launch?",
    options: [
      { id: "a", text: "2005", color: "red" },
      { id: "b", text: "2007", color: "blue" },
      { id: "c", text: "2009", color: "yellow" },
      { id: "d", text: "2011", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
];

// Sports Quiz
export const SPORTS_QUESTIONS = [
  {
    id: "spt1",
    text: "How many players are on a soccer team on the field at one time?",
    options: [
      { id: "a", text: "9", color: "red" },
      { id: "b", text: "10", color: "blue" },
      { id: "c", text: "11", color: "yellow" },
      { id: "d", text: "12", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "spt2",
    text: "Which country has won the most FIFA World Cups?",
    options: [
      { id: "a", text: "Germany", color: "red" },
      { id: "b", text: "Argentina", color: "blue" },
      { id: "c", text: "Brazil", color: "yellow" },
      { id: "d", text: "Italy", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "spt3",
    text: "In basketball, how many points is a three-point shot worth?",
    options: [
      { id: "a", text: "2", color: "red" },
      { id: "b", text: "3", color: "blue" },
      { id: "c", text: "4", color: "yellow" },
      { id: "d", text: "5", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 15,
  },
  {
    id: "spt4",
    text: "Which sport is played at Wimbledon?",
    options: [
      { id: "a", text: "Golf", color: "red" },
      { id: "b", text: "Tennis", color: "blue" },
      { id: "c", text: "Cricket", color: "yellow" },
      { id: "d", text: "Rugby", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "spt5",
    text: "How many Olympic rings are there?",
    options: [
      { id: "a", text: "4", color: "red" },
      { id: "b", text: "5", color: "blue" },
      { id: "c", text: "6", color: "yellow" },
      { id: "d", text: "7", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "spt6",
    text: "What is the national sport of Canada?",
    options: [
      { id: "a", text: "Hockey", color: "red" },
      { id: "b", text: "Basketball", color: "blue" },
      { id: "c", text: "Baseball", color: "yellow" },
      { id: "d", text: "Soccer", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
];

// Geography Quiz
export const GEOGRAPHY_QUESTIONS = [
  {
    id: "geo1",
    text: "What is the smallest country in the world?",
    options: [
      { id: "a", text: "Monaco", color: "red" },
      { id: "b", text: "Vatican City", color: "blue" },
      { id: "c", text: "San Marino", color: "yellow" },
      { id: "d", text: "Liechtenstein", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "geo2",
    text: "Which river is the longest in the world?",
    options: [
      { id: "a", text: "Amazon", color: "red" },
      { id: "b", text: "Nile", color: "blue" },
      { id: "c", text: "Yangtze", color: "yellow" },
      { id: "d", text: "Mississippi", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "geo3",
    text: "What is the capital of Australia?",
    options: [
      { id: "a", text: "Sydney", color: "red" },
      { id: "b", text: "Melbourne", color: "blue" },
      { id: "c", text: "Canberra", color: "yellow" },
      { id: "d", text: "Brisbane", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "geo4",
    text: "How many continents are there?",
    options: [
      { id: "a", text: "5", color: "red" },
      { id: "b", text: "6", color: "blue" },
      { id: "c", text: "7", color: "yellow" },
      { id: "d", text: "8", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "geo5",
    text: "What is the highest mountain in the world?",
    options: [
      { id: "a", text: "K2", color: "red" },
      { id: "b", text: "Mount Everest", color: "blue" },
      { id: "c", text: "Kilimanjaro", color: "yellow" },
      { id: "d", text: "Mount Fuji", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "geo6",
    text: "Which country is known as the Land of the Rising Sun?",
    options: [
      { id: "a", text: "China", color: "red" },
      { id: "b", text: "Korea", color: "blue" },
      { id: "c", text: "Japan", color: "yellow" },
      { id: "d", text: "Thailand", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "geo7",
    text: "What is the largest desert in the world?",
    options: [
      { id: "a", text: "Gobi Desert", color: "red" },
      { id: "b", text: "Sahara Desert", color: "blue" },
      { id: "c", text: "Arabian Desert", color: "yellow" },
      { id: "d", text: "Antarctic Desert", color: "green" },
    ],
    correctOptionId: "d",
    timeLimit: 25,
  },
];

// Technology Quiz
export const TECHNOLOGY_QUESTIONS = [
  {
    id: "tech1",
    text: "What does 'CPU' stand for?",
    options: [
      { id: "a", text: "Central Processing Unit", color: "red" },
      { id: "b", text: "Computer Personal Unit", color: "blue" },
      { id: "c", text: "Central Program Utility", color: "yellow" },
      { id: "d", text: "Computer Processing Utility", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
  {
    id: "tech2",
    text: "Which programming language was created by Guido van Rossum?",
    options: [
      { id: "a", text: "Java", color: "red" },
      { id: "b", text: "JavaScript", color: "blue" },
      { id: "c", text: "Python", color: "yellow" },
      { id: "d", text: "C++", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
  {
    id: "tech3",
    text: "What does 'HTML' stand for?",
    options: [
      { id: "a", text: "HyperText Markup Language", color: "red" },
      { id: "b", text: "High Tech Modern Language", color: "blue" },
      { id: "c", text: "Home Tool Markup Language", color: "yellow" },
      { id: "d", text: "HyperText Modern Language", color: "green" },
    ],
    correctOptionId: "a",
    timeLimit: 20,
  },
  {
    id: "tech4",
    text: "What was the first widely used web browser?",
    options: [
      { id: "a", text: "Internet Explorer", color: "red" },
      { id: "b", text: "Netscape Navigator", color: "blue" },
      { id: "c", text: "Mosaic", color: "yellow" },
      { id: "d", text: "Safari", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 25,
  },
  {
    id: "tech5",
    text: "What does 'AI' stand for in technology?",
    options: [
      { id: "a", text: "Advanced Internet", color: "red" },
      { id: "b", text: "Artificial Intelligence", color: "blue" },
      { id: "c", text: "Automated Interface", color: "yellow" },
      { id: "d", text: "Application Integration", color: "green" },
    ],
    correctOptionId: "b",
    timeLimit: 20,
  },
  {
    id: "tech6",
    text: "Which company created the Android operating system?",
    options: [
      { id: "a", text: "Apple", color: "red" },
      { id: "b", text: "Microsoft", color: "blue" },
      { id: "c", text: "Google", color: "yellow" },
      { id: "d", text: "Samsung", color: "green" },
    ],
    correctOptionId: "c",
    timeLimit: 20,
  },
];

// Quiz registry - maps quiz IDs to their questions
export const QUIZZES = {
  general: {
    id: "general",
    name: "General Knowledge",
    description: "Mix of science, history, geography, and more",
    icon: "🧠",
    questions: GENERAL_QUESTIONS,
  },
  science: {
    id: "science",
    name: "Science",
    description: "Biology, chemistry, physics, and astronomy",
    icon: "🔬",
    questions: SCIENCE_QUESTIONS,
  },
  history: {
    id: "history",
    name: "History",
    description: "World history, events, and historical figures",
    icon: "📜",
    questions: HISTORY_QUESTIONS,
  },
  "pop-culture": {
    id: "pop-culture",
    name: "Pop Culture",
    description: "Movies, music, TV shows, and entertainment",
    icon: "🎬",
    questions: POP_CULTURE_QUESTIONS,
  },
  sports: {
    id: "sports",
    name: "Sports",
    description: "Athletics, teams, and sporting events",
    icon: "⚽",
    questions: SPORTS_QUESTIONS,
  },
  geography: {
    id: "geography",
    name: "Geography",
    description: "Countries, capitals, and world geography",
    icon: "🌍",
    questions: GEOGRAPHY_QUESTIONS,
  },
  technology: {
    id: "technology",
    name: "Technology",
    description: "Computers, programming, and tech history",
    icon: "💻",
    questions: TECHNOLOGY_QUESTIONS,
  },
};

// Legacy function for backwards compatibility
export function getSampleQuestions() {
  return GENERAL_QUESTIONS;
}

// Get questions for a specific quiz ID
export function getQuestionsByQuizId(quizId) {
  const quiz = QUIZZES[quizId];
  if (!quiz) {
    // Fallback to general if quiz not found
    return GENERAL_QUESTIONS;
  }
  return quiz.questions;
}

// Get all available quizzes
export function getAllQuizzes() {
  return Object.values(QUIZZES).map((quiz) => ({
    id: quiz.id,
    name: quiz.name,
    description: quiz.description,
    icon: quiz.icon,
    questionCount: quiz.questions.length,
  }));
}

