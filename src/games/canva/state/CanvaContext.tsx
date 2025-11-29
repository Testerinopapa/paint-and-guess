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
  createRoom: (roomName: string, playerName: string, avatar?: string) => void;
  joinRoom: (gamePin: string, playerName: string, avatar?: string) => void;
  leaveRoom: () => void;
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
      setGameState((prev) => ({
        ...prev,
        gamePin: room.gamePin,
        ownerId: room.ownerId,
        players: room.players,
      }));
    };

    const onPlayerJoined = ({ players }: any) => {
      setGameState((prev) => ({ ...prev, players }));
      toast.success("Player joined!");
    };

    const onPlayerLeft = ({ players }: any) => {
      setGameState((prev) => ({ ...prev, players }));
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

  const isHost = gameState.ownerId === gameState.selfId;

  return (
    <CanvaContext.Provider
      value={{
        gameState,
        socket,
        isConnected,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
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
