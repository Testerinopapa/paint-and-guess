import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { useWhiteboardSocket } from "../hooks/useSocket";
import { toast } from "sonner";

interface WhiteboardRoomState {
  roomId: string | null;
  gamePin: string | null;
  playerName: string;
  ownerId: string | null;
  selfId: string | null;
  players: Array<{
    id: string;
    name: string;
    avatar: string | null;
    connected: boolean;
  }>;
}

interface WhiteboardContextType {
  roomState: WhiteboardRoomState;
  socket: Socket | null;
  isConnected: boolean;
  isHost: boolean;
  createRoom: (roomName: string, playerName: string, avatar?: string) => void;
  joinRoom: (gamePin: string, playerName: string, avatar?: string) => void;
  leaveRoom: () => void;
  clearCanvas: () => void;
  updateAvatar: (avatar: string) => void;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

function createInitialState(): WhiteboardRoomState {
  return {
    roomId: null,
    gamePin: null,
    playerName: "",
    ownerId: null,
    selfId: null,
    players: [],
  };
}

export function WhiteboardProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useWhiteboardSocket();
  const [roomState, setRoomState] = useState<WhiteboardRoomState>(createInitialState());

  useEffect(() => {
    if (!socket) return;

    const onSession = ({ playerId }: { playerId: string }) => {
      setRoomState((prev) => ({ ...prev, selfId: playerId }));
    };

    const onRoomCreated = ({ roomId, gamePin, room }: any) => {
      setRoomState((prev) => ({
        ...prev,
        roomId,
        gamePin,
        ownerId: room.ownerId,
        players: room.players,
      }));
      toast.success(`Room created! PIN: ${gamePin}`);
    };

    const onJoined = ({ roomId, playerId }: any) => {
      setRoomState((prev) => ({
        ...prev,
        roomId,
        selfId: playerId,
      }));
    };

    const onRoomState = (room: any) => {
      setRoomState((prev) => ({
        ...prev,
        ownerId: room.ownerId,
        players: room.players || [],
        gamePin: room.gamePin,
      }));
    };

    const onPlayerJoined = ({ player, players }: any) => {
      setRoomState((prev) => ({
        ...prev,
        players: players || prev.players,
      }));
      toast.info(`${player.name} joined the whiteboard`);
    };

    const onPlayerLeft = ({ playerId, players }: any) => {
      setRoomState((prev) => ({
        ...prev,
        players: players || prev.players.filter((p) => p.id !== playerId),
      }));
    };

    const onCanvasCleared = () => {
      // Trigger canvas clear event
      window.dispatchEvent(new CustomEvent("whiteboard:canvas-clear"));
    };

    const onDrawingEvent = (event: any) => {
      // Dispatch to DOM for canvas component to handle
      window.dispatchEvent(new CustomEvent("whiteboard:drawing-event", { detail: event }));
    };

    const onError = ({ message }: { message: string }) => {
      toast.error(message);
    };

    // Register all listeners
    socket.on("session", onSession);
    socket.on("whiteboard:room-created", onRoomCreated);
    socket.on("whiteboard:joined", onJoined);
    socket.on("whiteboard:room-state", onRoomState);
    socket.on("whiteboard:player-joined", onPlayerJoined);
    socket.on("whiteboard:player-left", onPlayerLeft);
    socket.on("whiteboard:drawing-event", onDrawingEvent);
    socket.on("whiteboard:canvas-cleared", onCanvasCleared);
    socket.on("error", onError);

    return () => {
      socket.off("session", onSession);
      socket.off("whiteboard:room-created", onRoomCreated);
      socket.off("whiteboard:joined", onJoined);
      socket.off("whiteboard:room-state", onRoomState);
      socket.off("whiteboard:player-joined", onPlayerJoined);
      socket.off("whiteboard:player-left", onPlayerLeft);
      socket.off("whiteboard:drawing-event", onDrawingEvent);
      socket.off("whiteboard:canvas-cleared", onCanvasCleared);
      socket.off("error", onError);
    };
  }, [socket]);

  const createRoom = (roomName: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    setRoomState((prev) => ({ ...prev, playerName }));
    socket.emit("whiteboard:create-room", { roomName, playerName, avatar });
  };

  const joinRoom = (gamePin: string, playerName: string, avatar?: string) => {
    if (!socket || !isConnected) {
      toast.error("Not connected to server");
      return;
    }
    setRoomState((prev) => ({ ...prev, playerName }));
    socket.emit("whiteboard:join-room", { gamePin, playerName, avatar });
  };

  const leaveRoom = () => {
    if (socket && roomState.roomId) {
      socket.leave(roomState.roomId);
    }
    setRoomState(createInitialState());
  };

  const clearCanvas = () => {
    if (!socket || !roomState.roomId) {
      return;
    }
    socket.emit("whiteboard:clear-canvas");
  };

  const updateAvatar = (avatar: string) => {
    if (!socket || !roomState.roomId) {
      return;
    }
    socket.emit("whiteboard:update-avatar", { avatar });
  };

  const isHost = roomState.ownerId === roomState.selfId;

  return (
    <WhiteboardContext.Provider
      value={{
        roomState,
        socket,
        isConnected,
        isHost,
        createRoom,
        joinRoom,
        leaveRoom,
        clearCanvas,
        updateAvatar,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider");
  }
  return context;
}

