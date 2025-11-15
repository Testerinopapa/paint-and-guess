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
  ownerId: string | null;
  maxRounds: number;
}

interface GameContextType {
  gameState: GameState;
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string, avatar?: string | AvatarConfig) => void;
  createRoom: (roomName: string, isPublic?: boolean) => Promise<string>;
  leaveRoom: () => void;
  startGame: () => void;
  setReadyState: (isReady: boolean) => void;
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
    ownerId: null,
    maxRounds: 6,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("room-state", (state: any) => {
      console.log(`[GameContext] 🏠 Room state received. Host: ${state.ownerId}, Players: ${state.players?.length || 0}, Active: ${state.isGameActive}`);
      
      // Store session credentials in localStorage for reconnection
      if (state.sessionToken && state.playerId) {
        localStorage.setItem(`room_${state.id}_playerId`, state.playerId);
        localStorage.setItem(`room_${state.id}_sessionToken`, state.sessionToken);
        console.log(`[GameContext] 💾 Stored session credentials for room ${state.id}`);
      }
      
      setGameState((prev) => ({
        ...prev,
        ...state,
        // Use persistent playerId instead of socket.id
        isDrawer: state.currentDrawer?.id === state.playerId,
      }));
    });

    socket.on(
      "player-joined",
      ({ player, players, ownerId }: { player: Player; players: Player[]; ownerId: string | null }) => {
        console.log(`[GameContext] ➕ Player joined: ${player.name}. Host: ${ownerId}, Total players: ${players.length}`);
        setGameState((prev) => ({
          ...prev,
          players,
          ownerId: ownerId ?? prev.ownerId,
        }));
        toast.success(`${player.name} joined the room`);
      }
    );

    socket.on(
      "player-left",
      ({ players, ownerId }: { players: Player[]; ownerId: string | null }) => {
        setGameState((prev) => ({
          ...prev,
          players,
          ownerId: ownerId ?? prev.ownerId,
        }));
      }
    );

    socket.on(
      "game-started",
      ({ drawer, roundTime, roundNumber }: { drawer: Player; roundTime: number; roundNumber: number }) => {
        setGameState((prev) => {
          const storedPlayerId = prev.roomId ? localStorage.getItem(`room_${prev.roomId}_playerId`) : null;
          const isDrawer = drawer.id === storedPlayerId;
          console.log(`[GameContext] 🎮 Game started! Round: ${roundNumber}, Drawer: ${drawer.name}, isDrawer: ${isDrawer}`);
          return {
            ...prev,
            isGameActive: true,
            currentDrawer: drawer,
            roundTime,
            timeLeft: roundTime,
            isDrawer,
            roundNumber,
          };
        });
        toast.info("Game started!");
      }
    );

    socket.on("draw-word", ({ word }: { word: string }) => {
      setGameState((prev) => ({
        ...prev,
        currentWord: word,
      }));
      toast.info(`Your word: ${word}`);
    });

    socket.on(
      "round-started",
      ({ drawer, roundTime, roundNumber }: { drawer: Player; roundTime: number; roundNumber: number }) => {
        setGameState((prev) => {
          const storedPlayerId = prev.roomId ? localStorage.getItem(`room_${prev.roomId}_playerId`) : null;
          const isDrawer = drawer.id === storedPlayerId;
          console.log(`[GameContext] 🔄 Round ${roundNumber} started! Drawer: ${drawer.name}, isDrawer: ${isDrawer}`);
          return {
            ...prev,
            currentDrawer: drawer,
            roundTime,
            timeLeft: roundTime,
            isDrawer,
            roundNumber,
            currentWord: null,
          };
        });
        setChatMessages([]);
        toast.info(`Round ${roundNumber} started!`);
      }
    );

    socket.on("round-timer", ({ timeLeft }: { timeLeft: number }) => {
      setGameState((prev) => ({
        ...prev,
        timeLeft,
      }));
    });

    socket.on(
      "round-ended",
      ({ word, scores, roundNumber }: { word: string; scores: Player[]; roundNumber: number }) => {
        console.log(`[GameContext] ⏸️ Round ${roundNumber} ended! Word was: "${word}"`);
        setGameState((prev) => ({
          ...prev,
          players: scores,
          currentWord: word,
          roundNumber,
        }));
        toast.info(`Round ended! The word was: ${word}`);
      }
    );

    socket.on(
      "correct-guess",
      ({ player, points, word, players }: { player: Player; points: number; word: string; players?: Player[] }) => {
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
        setGameState((prev) => {
          const storedPlayerId = prev.roomId ? localStorage.getItem(`room_${prev.roomId}_playerId`) : null;
          if (player.id !== storedPlayerId) {
            toast.success(`${player.name} guessed correctly!`);
          }
          return {
            ...prev,
            players: players ?? prev.players.map((p) =>
              p.id === player.id ? { ...p, score: p.score + points } : p
            ),
          };
        });
      }
    );

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

    socket.on("player-ready", ({ players, ownerId }: { players: Player[]; ownerId: string | null }) => {
      const readyCount = players.filter(p => p.isReady).length;
      console.log(`[GameContext] ${readyCount}/${players.length} players ready. Host: ${ownerId}`);
      setGameState((prev) => ({
        ...prev,
        players,
        ownerId: ownerId ?? prev.ownerId,
      }));
    });

    socket.on(
      "game-ended",
      ({ reason, scores }: { reason: string; scores?: Player[] }) => {
        console.log(`[GameContext] 🏁 Game ended! Reason: ${reason}`);
        setGameState((prev) => ({
          ...prev,
          isGameActive: false,
          players: scores ?? prev.players,
        }));
        toast.info(`Game ended: ${reason}`);
      }
    );

    socket.on("error", ({ message }: { message: string }) => {
      toast.error(message);
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
      socket.off("player-ready");
      socket.off("error");
    };
  }, [socket, gameState.roundNumber]);

  const joinRoom = (roomId: string, playerName: string, avatar?: string | AvatarConfig) => {
    if (!socket) return;
    
    // Check for stored session credentials (for reconnection)
    const storedPlayerId = localStorage.getItem(`room_${roomId}_playerId`);
    const storedSessionToken = localStorage.getItem(`room_${roomId}_sessionToken`);
    
    // Encode avatar config as JSON string if it's an object
    const avatarData = typeof avatar === 'object' ? encodeAvatarConfig(avatar) : avatar;
    
    // Include reconnection credentials if available
    const joinData: any = { 
      roomId, 
      playerName, 
      avatar: avatarData 
    };
    
    if (storedPlayerId && storedSessionToken) {
      joinData.reconnectPlayerId = storedPlayerId;
      joinData.reconnectToken = storedSessionToken;
      console.log(`[GameContext] 🔄 Attempting to reconnect as ${storedPlayerId}`);
    }
    
    console.log(`[GameContext] 🚪 join-room emit`, {
      roomId,
      hasAvatar: Boolean(avatarData),
      isReconnect: Boolean(storedPlayerId && storedSessionToken),
    });
    
    socket.emit("join-room", joinData);
    setGameState((prev) => ({
      ...prev,
      roomId,
      playerName,
    }));
  };

  const createRoom = async (roomName: string, isPublic = true, wordPack = "classic"): Promise<string> => {
    try {
      console.log(`[GameContext] 🏠 Creating room`, { roomName, isPublic, wordPack });
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
          maxRounds: 6,
          wordPack,
        }),
      });
      const data = await response.json();
      console.log(`[GameContext] ✅ Room created`, { roomId: data.roomId });
      return data.roomId;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const leaveRoom = () => {
    if (!socket) return;
    
    // Clear session credentials when leaving
    if (gameState.roomId) {
      localStorage.removeItem(`room_${gameState.roomId}_playerId`);
      localStorage.removeItem(`room_${gameState.roomId}_sessionToken`);
    }
    
    console.log(`[GameContext] 🚪 Leaving room`, { roomId: gameState.roomId });
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
      ownerId: null,
      maxRounds: 6,
    });
    setChatMessages([]);
  };

  const startGame = () => {
    if (!socket) return;
    console.log(`[GameContext] 🎮 start-game emit`);
    socket.emit("start-game");
  };

  const setReadyState = (isReady: boolean) => {
    if (!socket) return;
    console.log(`[GameContext] ${isReady ? '✅' : '❌'} set-ready emit`, { isReady });
    socket.emit("set-ready", { isReady });
  };

  const sendGuess = (guess: string) => {
    if (!socket) return;
    console.log(`[GameContext] 🗨️ guess emit`, { guess });
    socket.emit("guess", { guess });
  };

  const sendChatMessage = (message: string) => {
    if (!socket) return;
    console.log(`[GameContext] 💬 chat-message emit`, { message });
    socket.emit("chat-message", { message });
  };

  const sendDrawingEvent = (event: any) => {
    if (!socket || !gameState.isDrawer) return;
    if (event?.type) {
      console.debug(`[GameContext] ✏️ drawing-event emit`, { type: event.type });
    }
    socket.emit("drawing-event", event);
  };

  const clearCanvas = () => {
    if (!socket || !gameState.isDrawer) return;
    console.debug(`[GameContext] 🧹 clear-canvas emit`);
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
        setReadyState,
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

