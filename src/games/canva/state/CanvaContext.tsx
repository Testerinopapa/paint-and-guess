import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { useCanvaSocket } from "../hooks/useSocket";
import { toast } from "sonner";
import type { CanvaRoomState, Player } from "./types";

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

    socket.on("session", ({ playerId }: { playerId: string }) => {
      setGameState((prev) => ({
        ...prev,
        selfId: playerId,
      }));
    });

    socket.on("canva:room-created", ({ roomId, gamePin, room }) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        gamePin,
        ownerId: room.ownerId,
        players: room.players,
      }));
      toast.success(`Room created! PIN: ${gamePin}`);
    });

    socket.on("canva:joined", ({ roomId, playerId }) => {
      setGameState((prev) => ({
        ...prev,
        roomId,
        selfId: playerId,
      }));
    });

    socket.on("canva:room-state", (room) => {
      setGameState((prev) => ({
        ...prev,
        gamePin: room.gamePin,
        ownerId: room.ownerId,
        players: room.players,
      }));
    });

    socket.on("canva:player-joined", ({ players }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
      toast.success("Player joined!");
    });

    socket.on("canva:player-left", ({ players }) => {
      setGameState((prev) => ({
        ...prev,
        players,
      }));
    });

    socket.on("error", ({ message }: { message: string }) => {
      toast.error(message);
    });

    return () => {
      socket.off("session");
      socket.off("canva:room-created");
      socket.off("canva:joined");
      socket.off("canva:room-state");
      socket.off("canva:player-joined");
      socket.off("canva:player-left");
      socket.off("error");
    };
  }, [socket]);

  const createRoom = (roomName: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      playerName,
    }));

    socket.emit("canva:create-room", {
      roomName,
      playerName,
      avatar,
    });
  };

  const joinRoom = (gamePin: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      playerName,
    }));

    socket.emit("canva:join-room", {
      gamePin,
      playerName,
      avatar,
    });
  };

  const leaveRoom = () => {
    if (socket && gameState.roomId) {
      socket.leave(gameState.roomId);
    }
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

