export interface Player {
  id: string;
  name: string;
  avatar?: any;
  connected: boolean;
  score?: number;
  isReady?: boolean;
  hasGuessed?: boolean;
}

export interface CanvaRoomState {
  roomId: string | null;
  gamePin: string | null;
  playerName: string;
  ownerId: string | null;
  selfId: string | null;
  players: Player[];
  // Game flow state
  isGameActive: boolean;
  isRoundActive: boolean;
  roundNumber: number;
  roundTime: number;
  timeRemaining: number;
  currentDrawer: { id: string; name: string } | null;
  currentWord: string | null;
  isReady: boolean;
  allPlayersReady: boolean;
}

export interface ChatMessage {
  player: { id: string; name: string };
  message: string;
  timestamp: number;
}

