import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { useCanvaSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import type { CanvaRoomState } from "./types";

interface CanvaContextType {
  gameState: CanvaRoomState;
  socket: Socket | null;
  isConnected: boolean;
  isHost: boolean;
  isDrawer: boolean;
  createRoom: (roomName: string, playerName: string, avatar?: string) => void;
  joinRoom: (gamePin: string, playerName: string, avatar?: string) => void;
  leaveRoom: () => void;
  setReady: (isReady: boolean) => void;
  startGame: () => void;
  makeGuess: (guess: string) => void;
  sendChatMessage: (message: string) => void;
  clearCanvas: () => void;
}

const CanvaContext = createContext<CanvaContextType | undefined>(undefined);

function createInitialState(): CanvaRoomState {
  return {
    roomId: null,
    gamePin: null,
    playerName: "",
    ownerId: null,
    selfId: null,
    players: [],
    isGameActive: false,
    isRoundActive: false,
    roundNumber: 0,
    roundTime: 60,
    timeRemaining: 60,
    currentDrawer: null,
    currentWord: null,
    isReady: false,
    allPlayersReady: false,
  };
}

export function CanvaProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useCanvaSocket();
  const [gameState, setGameState] = useState<CanvaRoomState>(createInitialState());

  useEffect(() => {
    if (!socket) return;

    // Set up ALL listeners immediately when socket is available
    const onSession = ({ playerId }: { playerId: string }) => {
      setGameState((prev) => ({ ...prev, selfId: playerId }));
    };

    const onRoomCreated = ({ roomId, gamePin, room }: any) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        gamePin,
        ownerId: room.ownerId,
        players: room.players,
      }));
      toast.success(`Room created! PIN: ${gamePin}`);
    };

    const onJoined = ({ roomId, playerId }: any) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        selfId: playerId,
      }));
    };

    const onRoomState = (room: any) => {
      setGameState((prev) => {
        // Don't overwrite currentDrawer if we're in an active round and have a valid drawer
        // This prevents room-state from overwriting the drawer set by round-started
        const shouldPreserveDrawer = prev.isGameActive && prev.isRoundActive && prev.currentDrawer?.id;
        return {
          ...prev,
          gamePin: room.gamePin,
          ownerId: room.ownerId,
          players: room.players,
          isGameActive: room.isGameActive ?? false,
          isRoundActive: room.isRoundActive ?? false,
          roundNumber: room.roundNumber ?? 0,
          roundTime: room.roundTime ?? 60,
          currentDrawer: shouldPreserveDrawer ? prev.currentDrawer : (room.currentDrawer ?? null),
          currentWord: room.currentWord ?? null,
        };
      });
    };

    const onPlayerJoined = ({ players }: any) => {
      setGameState((prev) => ({ ...prev, players }));
      toast.success("Player joined!");
    };

    const onPlayerLeft = ({ players }: any) => {
      setGameState((prev) => ({ ...prev, players }));
    };

    const onPlayerReady = ({ playerId, isReady, allReady, players }: any) => {
      setGameState((prev) => ({
        ...prev,
        players,
        allPlayersReady: allReady ?? false,
        isReady: playerId === prev.selfId ? isReady : prev.isReady,
      }));
    };

    const onGameStarted = ({ drawer, roundTime, roundNumber }: any) => {
      setGameState((prev) => ({
        ...prev,
        isGameActive: true,
        isRoundActive: true,
        roundNumber,
        roundTime,
        timeRemaining: roundTime,
        currentDrawer: drawer,
      }));
      toast.success("Game started!");
    };

    const onDrawWord = ({ word }: { word: string }) => {
      setGameState((prev) => ({ ...prev, currentWord: word }));
      toast.info(`Your word: ${word}`);
    };

    const onRoundTimer = ({ timeLeft }: { timeLeft: number }) => {
      setGameState((prev) => ({ ...prev, timeRemaining: timeLeft }));
    };

    const onCorrectGuess = ({ player, points, word, players }: any) => {
      setGameState((prev) => ({
        ...prev,
        players,
        currentWord: word, // Reveal word when someone guesses correctly
      }));
      toast.success(`${player.name} guessed correctly! +${points} points`);
    };

    const onWrongGuess = ({ player, guess }: any) => {
      // Just update UI, no state change needed
    };

    const onRoundEnded = ({ word, roundNumber }: any) => {
      setGameState((prev) => ({
        ...prev,
        isRoundActive: false,
        currentDrawer: null, // Clear drawer to prevent drawing between rounds
        currentWord: word, // Show the previous word
        roundNumber,
      }));
      toast.info(`Round ${roundNumber} ended! Word was: ${word}`);
    };

    const onRoundStarted = ({ drawer, roundNumber, roundTime }: any) => {
      console.log("[CanvaContext] onRoundStarted received", { drawer, roundNumber, roundTime, selfId: gameState.selfId });
      
      if (!drawer || !drawer.id) {
        console.error("[CanvaContext] Invalid drawer in onRoundStarted", drawer);
        return;
      }

      setGameState((prev) => {
        const newState = {
          ...prev,
          isRoundActive: true,
          currentDrawer: drawer, // Explicitly set the new drawer
          roundNumber,
          roundTime,
          timeRemaining: roundTime,
          currentWord: null, // Hide word until someone guesses or round ends
        };
        const isDrawerNow = newState.currentDrawer?.id === newState.selfId;
        console.log("[CanvaContext] Round started - state updated", { 
          drawer,
          currentDrawer: newState.currentDrawer, 
          selfId: newState.selfId, 
          isDrawer: isDrawerNow,
          isRoundActive: newState.isRoundActive,
          wasDrawer: prev.currentDrawer?.id === prev.selfId,
        });
        return newState;
      });
      // Clear canvas when new round starts
      window.dispatchEvent(new CustomEvent("canva:canvas-clear"));
      toast.success(`Round ${roundNumber} started!`);
    };

    const onGameEnded = ({ players }: any) => {
      setGameState((prev) => ({
        ...prev,
        isGameActive: false,
        isRoundActive: false,
        players,
      }));
      toast.success("Game ended!");
    };

    const onCanvasCleared = () => {
      // Trigger canvas clear event
      window.dispatchEvent(new CustomEvent("canva:canvas-clear"));
    };

    // CRITICAL: Set up drawing event listener - this MUST be registered
    const onDrawingEvent = (event: any) => {
      console.log("[CanvaContext] ✅✅✅ RECEIVED canva:drawing-event:", event);
      // Dispatch to DOM immediately
      window.dispatchEvent(new CustomEvent("canva:drawing-event", { detail: event }));
    };
    
    // TEST: Listen for test event
    const onTestEvent = (data: any) => {
      console.log("[CanvaContext] ✅✅✅ TEST EVENT RECEIVED:", data);
      toast.info("Test event received! Connection works!");
    };
    socket.on("canva:test-event", onTestEvent);

    // Also set up a catch-all listener to see ANY events
    const onAnyEvent = (...args: any[]) => {
      const eventName = args[0];
      console.log("[CanvaContext] 🔍 ANY EVENT:", eventName, args.slice(1));
      if (eventName === "canva:drawing-event") {
        console.log("[CanvaContext] 🔍 Catch-all received canva:drawing-event:", args[1]);
      }
    };
    socket.onAny(onAnyEvent);

    const onError = ({ message }: { message: string }) => {
      toast.error(message);
    };

    // Register all listeners
    socket.on("session", onSession);
    socket.on("canva:room-created", onRoomCreated);
    socket.on("canva:joined", onJoined);
    socket.on("canva:room-state", onRoomState);
    socket.on("canva:player-joined", onPlayerJoined);
    socket.on("canva:player-left", onPlayerLeft);
    socket.on("canva:drawing-event", onDrawingEvent);
    socket.on("canva:player-ready", onPlayerReady);
    socket.on("canva:game-started", onGameStarted);
    socket.on("canva:draw-word", onDrawWord);
    socket.on("canva:round-timer", onRoundTimer);
    socket.on("canva:correct-guess", onCorrectGuess);
    socket.on("canva:wrong-guess", onWrongGuess);
    socket.on("canva:round-ended", onRoundEnded);
    socket.on("canva:round-started", onRoundStarted);
    socket.on("canva:game-ended", onGameEnded);
    socket.on("canva:canvas-cleared", onCanvasCleared);
    socket.on("error", onError);

    // Test: Listen to ALL events to see what's coming through
    const originalOnevent = socket.onevent;
    socket.onevent = function(packet: any) {
      if (packet.data && packet.data[0] === "canva:drawing-event") {
        console.log("[CanvaContext] INTERCEPTED canva:drawing-event at onevent level:", packet.data[1]);
      }
      return originalOnevent.call(this, packet);
    };

    return () => {
      socket.off("session", onSession);
      socket.off("canva:room-created", onRoomCreated);
      socket.off("canva:joined", onJoined);
      socket.off("canva:room-state", onRoomState);
      socket.off("canva:player-joined", onPlayerJoined);
      socket.off("canva:player-left", onPlayerLeft);
      socket.off("canva:drawing-event", onDrawingEvent);
      socket.off("canva:test-event", onTestEvent);
      socket.off("canva:player-ready", onPlayerReady);
      socket.off("canva:game-started", onGameStarted);
      socket.off("canva:draw-word", onDrawWord);
      socket.off("canva:round-timer", onRoundTimer);
      socket.off("canva:correct-guess", onCorrectGuess);
      socket.off("canva:wrong-guess", onWrongGuess);
      socket.off("canva:round-ended", onRoundEnded);
      socket.off("canva:round-started", onRoundStarted);
      socket.off("canva:game-ended", onGameEnded);
      socket.off("canva:canvas-cleared", onCanvasCleared);
      socket.off("error", onError);
      socket.offAny(onAnyEvent);
      socket.onevent = originalOnevent;
    };
  }, [socket]);

  const createRoom = (roomName: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    setGameState((prev) => ({ ...prev, playerName }));
    socket.emit("canva:create-room", { roomName, playerName, avatar });
  };

  const joinRoom = (gamePin: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    setGameState((prev) => ({ ...prev, playerName }));
    socket.emit("canva:join-room", { gamePin, playerName, avatar });
  };

  const leaveRoom = () => {
    setGameState(createInitialState());
  };

  const setReady = (isReady: boolean) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    socket.emit("canva:set-ready", { isReady });
    setGameState((prev) => ({ ...prev, isReady }));
  };

  const startGame = () => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    if (!isHost) {
      toast.error("Only the host can start the game");
      return;
    }
    socket.emit("canva:start-game");
  };

  const makeGuess = (guess: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    socket.emit("canva:guess", { guess });
  };

  const sendChatMessage = (message: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    socket.emit("canva:chat-message", { message });
  };

  const clearCanvas = () => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    if (!isDrawer) {
      toast.error("Only the drawer can clear the canvas");
      return;
    }
    socket.emit("canva:clear-canvas");
  };

  const isHost = gameState.ownerId === gameState.selfId;
  const isDrawer = gameState.currentDrawer?.id === gameState.selfId;

  return (
    <CanvaContext.Provider
      value={{
        gameState,
        socket,
        isConnected,
        isHost,
        isDrawer,
        createRoom,
        joinRoom,
        leaveRoom,
        setReady,
        startGame,
        makeGuess,
        sendChatMessage,
        clearCanvas,
      }}
    >
      {children}
    </CanvaContext.Provider>
  );
}

export function useCanva() {
  const context = useContext(CanvaContext);
  if (context === undefined) {
    throw new Error("useCanva must be used within a CanvaProvider");
  }
  return context;
}
