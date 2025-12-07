export type GameStatus = "playing" | "checkmate" | "stalemate" | "draw" | "resign" | "timeout";

export type GameMode = "local" | "online" | "ai";

export interface AIConfig {
  enabled: boolean;
  color: "white" | "black";
  elo?: number;        // 1350-2850, or undefined for max strength
  depth?: number;      // Analysis depth (default 12)
  opponentId?: string; // Reference to selected opponent
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  timestamp: number;
}

export interface GameState {
  fen: string;
  pgn: string;
  moves: ChessMove[];
  status: GameStatus;
  turn: "white" | "black";
  inCheck: boolean;
  inCheckmate: boolean;
  inStalemate: boolean;
  inDraw: boolean;
  gameMode: GameMode;
  whitePlayer?: string;
  blackPlayer?: string;
  lastMove?: { from: string; to: string }; // For highlighting last move
}

