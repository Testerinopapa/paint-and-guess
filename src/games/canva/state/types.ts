export interface Player {
  id: string;
  name: string;
  avatar?: any;
  connected: boolean;
}

export interface CanvaRoomState {
  roomId: string | null;
  gamePin: string | null;
  playerName: string;
  ownerId: string | null;
  selfId: string | null;
  players: Player[];
}

