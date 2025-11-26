// Sample questions for MVP
export const SAMPLE_QUESTIONS = [
  {
    id: "q1",
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
    id: "q2",
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
    id: "q3",
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
    id: "q4",
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
    id: "q5",
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

export function getSampleQuestions() {
  return SAMPLE_QUESTIONS;
}

