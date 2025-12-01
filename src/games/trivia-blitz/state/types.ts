export type TriviaPhase =
  | "lobby"
  | "question-intro"
  | "question"
  | "answer-reveal"
  | "scoring"
  | "leaderboard"
  | "podium"
  | "game-ended";

export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; color: string }[];
  correctOptionId: string;
  timeLimit: number;
  media?: { type: "image" | "video"; url: string };
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  avatar?: string;
}

export interface TriviaRoomState {
  roomId: string | null;
  gamePin: string | null;
  playerName: string;
  ownerId: string | null;
  selfId: string | null;
  players: Player[];
  phase: TriviaPhase;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | null;
  answerStats: Record<string, number>;
  leaderboard: Player[];
  podium: {
    first: Player | null;
    second: Player | null;
    third: Player | null;
  };
  quizId: string | null;
  quizName: string | null;
}

