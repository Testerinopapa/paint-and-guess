import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { AvatarConfig, encodeAvatarConfig, decodeAvatarConfig } from "@/lib/avatar/config";

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  avatar?: string | AvatarConfig; // Support both old string format and new config
}

interface GameState {
  roomId: string | null;
  players: Player[];
  isGameActive: boolean;
  currentDrawer: Player | null;
  currentWord: string | null;
  roundTime: number;
  timeLeft: number;
  roundNumber: number;
  isDrawer: boolean;
  playerName: string;
}

interface GameContextType {
  gameState: GameState;
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string, avatar?: string | AvatarConfig) => void;
  createRoom: (roomName: string, isPublic?: boolean) => Promise<string>;
  leaveRoom: () => void;
  startGame: () => void;
  sendGuess: (guess: string) => void;
  sendChatMessage: (message: string) => void;
  sendDrawingEvent: (event: any) => void;
  clearCanvas: () => void;
  chatMessages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  player: { id: string; name: string };
  message: string;
  timestamp: number;
  type: "message" | "correct-guess" | "wrong-guess" | "system";
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    players: [],
    isGameActive: false,
    currentDrawer: null,
    currentWord: null,
    roundTime: 60,
    timeLeft: 60,
    roundNumber: 0,
    isDrawer: false,
    playerName: "",
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("room-state", (state: any) => {
      setGameState((prev) => ({
        ...prev,
        ...state,
        isDrawer: state.currentDrawer?.id === socket.id,
      }));
    });

    socket.on("player-joined", ({ player, players }: { player: Player; players: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
      toast.success(`${player.name} joined the room`);
    });

    socket.on("player-left", ({ players }: { players: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
    });

    socket.on("game-started", ({ drawer, roundTime }: { drawer: Player; roundTime: number }) => {
      setGameState((prev) => ({
        ...prev,
        isGameActive: true,
        currentDrawer: drawer,
        roundTime,
        timeLeft: roundTime,
        isDrawer: drawer.id === socket.id,
        roundNumber: 1,
      }));
      toast.info("Game started!");
    });

    socket.on("draw-word", ({ word }: { word: string }) => {
      setGameState((prev) => ({
        ...prev,
        currentWord: word,
      }));
      toast.info(`Your word: ${word}`);
    });

    socket.on("round-started", ({ drawer, roundTime }: { drawer: Player; roundTime: number }) => {
      let newRoundNumber = 1;
      setGameState((prev) => {
        newRoundNumber = prev.roundNumber + 1;
        return {
          ...prev,
          currentDrawer: drawer,
          roundTime,
          timeLeft: roundTime,
          isDrawer: drawer.id === socket.id,
          roundNumber: newRoundNumber,
          currentWord: null,
        };
      });
      setChatMessages([]);
      toast.info(`Round ${newRoundNumber} started!`);
    });

    socket.on("round-timer", ({ timeLeft }: { timeLeft: number }) => {
      setGameState((prev) => ({
        ...prev,
        timeLeft,
      }));
    });

    socket.on("round-ended", ({ word, scores }: { word: string; scores: Player[] }) => {
      setGameState((prev) => ({
        ...prev,
        players: scores,
        currentWord: word,
      }));
      toast.info(`Round ended! The word was: ${word}`);
    });

    socket.on("correct-guess", ({ player, points, word }: { player: Player; points: number; word: string }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          player,
          message: `Correctly guessed "${word}"! +${points} points`,
          timestamp: Date.now(),
          type: "correct-guess",
        },
      ]);
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === player.id ? { ...p, score: p.score + points } : p
        ),
      }));
      if (player.id !== socket.id) {
        toast.success(`${player.name} guessed correctly!`);
      }
    });

    socket.on("wrong-guess", ({ player, guess }: { player: Player; guess: string }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          player,
          message: guess,
          timestamp: Date.now(),
          type: "wrong-guess",
        },
      ]);
    });

    socket.on("chat-message", ({ player, message, timestamp }: ChatMessage) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: timestamp.toString(),
          player,
          message,
          timestamp,
          type: "message",
        },
      ]);
    });

    socket.on("drawing-event", (event: any) => {
      // This will be handled by the Canvas component
      window.dispatchEvent(new CustomEvent("drawing-event", { detail: event }));
    });

    socket.on("canvas-cleared", () => {
      window.dispatchEvent(new CustomEvent("canvas-cleared"));
    });

    socket.on("game-ended", ({ reason }: { reason: string }) => {
      setGameState((prev) => ({
        ...prev,
        isGameActive: false,
      }));
      toast.info(`Game ended: ${reason}`);
    });

    return () => {
      socket.off("room-state");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("game-started");
      socket.off("draw-word");
      socket.off("round-started");
      socket.off("round-timer");
      socket.off("round-ended");
      socket.off("correct-guess");
      socket.off("wrong-guess");
      socket.off("chat-message");
      socket.off("drawing-event");
      socket.off("canvas-cleared");
      socket.off("game-ended");
    };
  }, [socket, gameState.roundNumber]);

  const joinRoom = (roomId: string, playerName: string, avatar?: string | AvatarConfig) => {
    if (!socket) return;
    // Encode avatar config as JSON string if it's an object
    const avatarData = typeof avatar === 'object' ? encodeAvatarConfig(avatar) : avatar;
    socket.emit("join-room", { roomId, playerName, avatar: avatarData });
    setGameState((prev) => ({
      ...prev,
      roomId,
      playerName,
    }));
  };

  const createRoom = async (roomName: string, isPublic = true): Promise<string> => {
    try {
      const response = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          isPublic,
          maxPlayers: 6,
          roundTime: 60,
        }),
      });
      const data = await response.json();
      return data.roomId;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit("leave-room");
    setGameState({
      roomId: null,
      players: [],
      isGameActive: false,
      currentDrawer: null,
      currentWord: null,
      roundTime: 60,
      timeLeft: 60,
      roundNumber: 0,
      isDrawer: false,
      playerName: "",
    });
    setChatMessages([]);
  };

  const startGame = () => {
    if (!socket) return;
    socket.emit("start-game");
  };

  const sendGuess = (guess: string) => {
    if (!socket) return;
    socket.emit("guess", { guess });
  };

  const sendChatMessage = (message: string) => {
    if (!socket) return;
    socket.emit("chat-message", { message });
  };

  const sendDrawingEvent = (event: any) => {
    if (!socket || !gameState.isDrawer) return;
    socket.emit("drawing-event", event);
  };

  const clearCanvas = () => {
    if (!socket || !gameState.isDrawer) return;
    socket.emit("clear-canvas");
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        socket,
        isConnected,
        joinRoom,
        createRoom,
        leaveRoom,
        startGame,
        sendGuess,
        sendChatMessage,
        sendDrawingEvent,
        clearCanvas,
        chatMessages,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

