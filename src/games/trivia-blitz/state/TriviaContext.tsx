import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { useTriviaSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import type { TriviaPhase, Question, Player } from "./types";

interface TriviaRoomState {
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
  hasAnswered: boolean;
  lastAnswerResult: {
    isCorrect: boolean;
    points: number;
    newScore: number;
    newStreak: number;
  } | null;
}

interface TriviaContextType {
  gameState: TriviaRoomState;
  socket: Socket | null;
  isConnected: boolean;
  isHost: boolean;
  createRoom: (roomName: string, playerName: string, avatar?: string, quizId?: string) => void;
  joinRoom: (gamePin: string, playerName: string, avatar?: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  submitAnswer: (optionId: string) => void;
  nextQuestion: () => void;
}

const TriviaContext = createContext<TriviaContextType | undefined>(undefined);

function createInitialState(): TriviaRoomState {
  return {
    roomId: null,
    gamePin: null,
    playerName: "",
    ownerId: null,
    selfId: null,
    players: [],
    phase: "lobby",
    currentQuestionIndex: 0,
    totalQuestions: 0,
    currentQuestion: null,
    answerStats: {},
    leaderboard: [],
    podium: {
      first: null,
      second: null,
      third: null,
    },
    quizId: null,
    quizName: null,
    hasAnswered: false,
    lastAnswerResult: null,
  };
}

export function TriviaProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useTriviaSocket();
  const [gameState, setGameState] = useState<TriviaRoomState>(createInitialState());

  useEffect(() => {
    if (!socket) return;

    socket.on("session", ({ playerId }: { playerId: string }) => {
      setGameState((prev) => ({
        ...prev,
        selfId: playerId,
      }));
    });

    socket.on("trivia:room-created", ({ roomId, gamePin, room }) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        gamePin,
        ownerId: room.ownerId,
        players: room.players,
        phase: "lobby",
      }));
      toast.success(`Room created! PIN: ${gamePin}`);
      // Navigation handled by Room component
    });

    socket.on("trivia:joined", ({ roomId, room }) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        gamePin: room.gamePin,
        players: room.players,
        phase: "lobby",
      }));
      toast.success("Joined room!");
      // Navigation handled by Room component
    });

    socket.on("trivia:room-state", (state) => {
      setGameState((prev) => ({
        ...prev,
        roomId: state.id,
        gamePin: state.gamePin,
        ownerId: state.ownerId,
        players: state.players,
        phase: state.phase || "lobby",
        currentQuestionIndex: state.currentQuestionIndex || 0,
        totalQuestions: state.totalQuestions || 0,
        quizId: state.quizId || null,
        quizName: state.quizName || null,
      }));
    });

    socket.on("trivia:player-joined", ({ players }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
    });

    socket.on("trivia:player-left", ({ players }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
    });

    socket.on("trivia:phase-changed", ({ phase, questionIndex }) => {
      setGameState((prev) => ({
        ...prev,
        phase: phase as TriviaPhase,
        currentQuestionIndex: questionIndex ?? prev.currentQuestionIndex,
        hasAnswered: false,
        lastAnswerResult: null,
      }));
    });

    socket.on("trivia:question", ({ question, questionIndex, totalQuestions }) => {
      setGameState((prev) => ({
        ...prev,
        currentQuestion: question,
        currentQuestionIndex: questionIndex,
        totalQuestions,
        hasAnswered: false,
        answerStats: {},
      }));
    });

    socket.on("trivia:answer-reveal", ({ correctOptionId, answerStats }) => {
      setGameState((prev) => ({
        ...prev,
        answerStats,
      }));
    });

    socket.on("trivia:scoring", ({ players }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
    });

    socket.on("trivia:leaderboard", ({ leaderboard }) => {
      setGameState((prev) => ({
        ...prev,
        leaderboard,
      }));
    });

    socket.on("trivia:podium", ({ podium, finalScores }) => {
      setGameState((prev) => ({
        ...prev,
        podium,
        players: finalScores,
      }));
    });

    socket.on("trivia:answer-result", (result) => {
      setGameState((prev) => ({
        ...prev,
        hasAnswered: true,
        lastAnswerResult: result,
        players: prev.players.map((p) =>
          p.id === prev.selfId
            ? { ...p, score: result.newScore, streak: result.newStreak }
            : p
        ),
      }));

      if (result.isCorrect) {
        toast.success(`Correct! +${result.points} points`);
      } else {
        toast.error("Incorrect");
      }
    });

    socket.on("error", ({ message }: { message: string }) => {
      toast.error(message);
    });

    return () => {
      socket.off("session");
      socket.off("trivia:room-created");
      socket.off("trivia:joined");
      socket.off("trivia:room-state");
      socket.off("trivia:player-joined");
      socket.off("trivia:player-left");
      socket.off("trivia:phase-changed");
      socket.off("trivia:question");
      socket.off("trivia:answer-reveal");
      socket.off("trivia:scoring");
      socket.off("trivia:leaderboard");
      socket.off("trivia:podium");
      socket.off("trivia:answer-result");
      socket.off("error");
    };
  }, [socket]);

  const createRoom = (roomName: string, playerName: string, avatar?: string, quizId?: string) => {
    if (!socket) return;
    socket.emit("trivia:create-room", { roomName, playerName, avatar, quizId });
    setGameState((prev) => ({
      ...prev,
      playerName,
    }));
  };

  const joinRoom = (gamePin: string, playerName: string, avatar?: string) => {
    if (!socket) return;
    socket.emit("trivia:join-room", { gamePin, playerName, avatar });
    setGameState((prev) => ({
      ...prev,
      playerName,
    }));
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit("leave-room");
    setGameState(createInitialState());
  };

  const startGame = () => {
    if (!socket) return;
    socket.emit("trivia:start-game");
  };

  const submitAnswer = (optionId: string) => {
    if (!socket || gameState.hasAnswered) return;
    socket.emit("trivia:submit-answer", { optionId });
  };

  const nextQuestion = () => {
    if (!socket) return;
    socket.emit("trivia:next-question");
  };

  const isHost = gameState.ownerId === gameState.selfId;

  return (
    <TriviaContext.Provider
      value={{
        gameState,
        socket,
        isConnected,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        submitAnswer,
        nextQuestion,
      }}
    >
      {children}
    </TriviaContext.Provider>
  );
}

export function useTrivia() {
  const context = useContext(TriviaContext);
  if (context === undefined) {
    throw new Error("useTrivia must be used within a TriviaProvider");
  }
  return context;
}

