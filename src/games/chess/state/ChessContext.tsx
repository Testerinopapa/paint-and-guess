import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Chess } from "chess.js";
import type { GameState, GameMode, ChessMove, GameStatus } from "./types";

interface ChessContextType {
  game: Chess;
  gameState: GameState;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  resetGame: () => void;
  loadFromFen: (fen: string) => void;
  loadFromPgn: (pgn: string) => boolean;
  exportPgn: () => string;
  undoMove: () => boolean;
  getLegalMoves: (square?: string) => string[];
  isGameOver: () => boolean;
  setGameMode: (mode: GameMode) => void;
  setPlayers: (white?: string, black?: string) => void;
}

const ChessContext = createContext<ChessContextType | undefined>(undefined);

function createInitialGameState(): GameState {
  return {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    pgn: "",
    moves: [],
    status: "playing",
    turn: "white",
    inCheck: false,
    inCheckmate: false,
    inStalemate: false,
    inDraw: false,
    gameMode: "local",
  };
}

function updateGameState(game: Chess): GameState {
  return {
    fen: game.fen(),
    pgn: game.pgn(),
    moves: game.history({ verbose: true }).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      timestamp: Date.now(),
    })),
    status: getGameStatus(game),
    turn: game.turn() === "w" ? "white" : "black",
    inCheck: game.inCheck(),
    inCheckmate: game.isCheckmate(),
    inStalemate: game.isStalemate(),
    inDraw: game.isDraw(),
    gameMode: "local", // Will be set by setGameMode
  };
}

function getGameStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isDraw()) return "draw";
  return "playing";
}

export function ChessProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = createInitialGameState();
    initialState.fen = game.fen();
    return initialState;
  });
  const [gameMode, setGameModeState] = useState<GameMode>("local");
  const [whitePlayer, setWhitePlayer] = useState<string | undefined>();
  const [blackPlayer, setBlackPlayer] = useState<string | undefined>();

  const updateState = useCallback((newGame: Chess) => {
    const newState = updateGameState(newGame);
    newState.gameMode = gameMode;
    newState.whitePlayer = whitePlayer;
    newState.blackPlayer = blackPlayer;
    setGameState(newState);
    setGame(newGame);
  }, [gameMode, whitePlayer, blackPlayer]);

  const makeMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    try {
      const move = game.move({
        from,
        to,
        promotion: promotion as "q" | "r" | "b" | "n" | undefined,
      });

      if (move === null) {
        return false;
      }

      updateState(game);
      return true;
    } catch (error) {
      console.error("Error making move:", error);
      return false;
    }
  }, [game, updateState]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    const initialState = createInitialGameState();
    initialState.fen = newGame.fen();
    initialState.gameMode = gameMode;
    initialState.whitePlayer = whitePlayer;
    initialState.blackPlayer = blackPlayer;
    setGame(newGame);
    setGameState(initialState);
  }, [gameMode, whitePlayer, blackPlayer]);

  const loadFromFen = useCallback((fen: string) => {
    try {
      const newGame = new Chess(fen);
      updateState(newGame);
    } catch (error) {
      console.error("Error loading FEN:", error);
    }
  }, [updateState]);

  const loadFromPgn = useCallback((pgn: string): boolean => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      updateState(newGame);
      return true;
    } catch (error) {
      console.error("Error loading PGN:", error);
      return false;
    }
  }, [updateState]);

  const exportPgn = useCallback((): string => {
    return game.pgn();
  }, [game]);

  const undoMove = useCallback((): boolean => {
    try {
      if (game.history().length === 0) {
        return false;
      }
      game.undo();
      updateState(game);
      return true;
    } catch (error) {
      console.error("Error undoing move:", error);
      return false;
    }
  }, [game, updateState]);

  const getLegalMoves = useCallback((square?: string): string[] => {
    try {
      if (square) {
        return game.moves({ square, verbose: true }).map((move) => move.to);
      }
      return game.moves({ verbose: true }).map((move) => move.to);
    } catch (error) {
      console.error("Error getting legal moves:", error);
      return [];
    }
  }, [game]);

  const isGameOver = useCallback((): boolean => {
    return game.isGameOver();
  }, [game]);

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode);
    setGameState((prev) => ({ ...prev, gameMode: mode }));
  }, []);

  const setPlayers = useCallback((white?: string, black?: string) => {
    setWhitePlayer(white);
    setBlackPlayer(black);
    setGameState((prev) => ({
      ...prev,
      whitePlayer: white,
      blackPlayer: black,
    }));
  }, []);

  return (
    <ChessContext.Provider
      value={{
        game,
        gameState,
        makeMove,
        resetGame,
        loadFromFen,
        loadFromPgn,
        exportPgn,
        undoMove,
        getLegalMoves,
        isGameOver,
        setGameMode,
        setPlayers,
      }}
    >
      {children}
    </ChessContext.Provider>
  );
}

export function useChess() {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
}
