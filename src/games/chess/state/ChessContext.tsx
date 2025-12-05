import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import type { GameState, GameMode, ChessMove, GameStatus, AIConfig } from "./types";
import { apiPath } from "@/config/api";
import { composePolicies } from "../policies";

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
  // AI functionality
  aiConfig: AIConfig;
  setAIConfig: (config: AIConfig) => void;
  isAITurn: () => boolean;
  isAIThinking: boolean;
  makeAIMove: () => Promise<void>;
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

function updateGameState(game: Chess, lastMove?: { from: string; to: string }): GameState {
  const history = game.history({ verbose: true });
  return {
    fen: game.fen(),
    pgn: game.pgn(),
    moves: history.map((move) => ({
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
    lastMove: lastMove,
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
  const [aiConfig, setAIConfigState] = useState<AIConfig>({
    enabled: false,
    color: "black",
    depth: 12,
  });
  const [isAIThinking, setIsAIThinking] = useState(false);

  const updateState = useCallback((newGame: Chess, lastMove?: { from: string; to: string }) => {
    const newState = updateGameState(newGame, lastMove);
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

      updateState(game, { from, to });
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
    initialState.lastMove = undefined;
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

  // AI functionality
  const isAITurn = useCallback((): boolean => {
    if (!aiConfig.enabled) return false;
    if (isGameOver()) return false;
    return gameState.turn === aiConfig.color;
  }, [aiConfig, gameState.turn, isGameOver]);

  const parseUCIMove = useCallback((uci: string): { from: string; to: string; promotion?: string } | null => {
    if (!uci || uci.length < 4) return null;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    
    // Validate squares
    if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
      return null;
    }
    
    return { from, to, promotion: promotion as "q" | "r" | "b" | "n" | undefined };
  }, []);

  const makeAIMove = useCallback(async () => {
    // Check conditions before proceeding
    if (isAIThinking) {
      return;
    }
    
    // Check if game is over
    if (game.isGameOver()) {
      return;
    }
    
    // Use policy pattern to determine if engine should move
    const { opponent } = composePolicies({ aiConfig });
    const playerColor = aiConfig.color === "white" ? "black" : "white";
    
    if (!opponent.shouldEngineMove({
      turn: gameState.turn,
      playerColor,
      movesCount: gameState.moves.length,
    })) {
      return; // Policy says engine shouldn't move
    }
    
    // Double-check it's actually AI's turn using game state
    const expectedColor = aiConfig.color === "white" ? "w" : "b";
    if (game.turn() !== expectedColor) {
      return; // Not AI's turn according to game state
    }

    setIsAIThinking(true);
    
    try {
      const response = await fetch(apiPath("/api/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: game.fen(),
          depth: aiConfig.depth || 12,
          elo: aiConfig.elo,
          limitStrength: aiConfig.elo !== undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.bestmove) {
        throw new Error("No best move returned from engine");
      }

      const moveData = parseUCIMove(data.bestmove);
      if (!moveData) {
        throw new Error(`Invalid UCI move format: ${data.bestmove}`);
      }

      // Validate move is legal before applying
      const legalMoves = game.moves({ verbose: true });
      const isValidMove = legalMoves.some(
        (m) => m.from === moveData.from && m.to === moveData.to && 
               (!moveData.promotion || m.promotion === moveData.promotion)
      );

      if (!isValidMove) {
        // Fallback: use first legal move if AI move is invalid
        console.warn("AI returned invalid move, using fallback");
        if (legalMoves.length > 0) {
          const fallbackMove = legalMoves[0];
          makeMove(fallbackMove.from, fallbackMove.to, fallbackMove.promotion);
        }
        return;
      }

      // Apply the AI move
      const success = makeMove(moveData.from, moveData.to, moveData.promotion);
      if (!success) {
        console.error("Failed to apply AI move");
      }
    } catch (error) {
      console.error("AI move failed:", error);
      // Fallback: use random legal move if AI fails
      try {
        const legalMoves = game.moves({ verbose: true });
        if (legalMoves.length > 0) {
          const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          makeMove(randomMove.from, randomMove.to, randomMove.promotion);
        }
      } catch (fallbackError) {
        console.error("Fallback move also failed:", fallbackError);
      }
    } finally {
      setIsAIThinking(false);
    }
  }, [game, aiConfig, gameState.turn, gameState.moves.length, isAIThinking, makeMove, parseUCIMove]);

  const setAIConfig = useCallback((config: AIConfig) => {
    setAIConfigState(config);
    // If enabling AI mode, update game mode
    if (config.enabled) {
      setGameModeState("ai");
      setGameState((prev) => ({ ...prev, gameMode: "ai" }));
    }
  }, []);

  // Determine if AI should move now (using policy pattern from commits)
  const shouldAIMoveNow = useMemo(() => {
    if (isAIThinking) return false;
    if (isGameOver()) return false;
    
    // Use policy pattern to determine if engine should move
    const { opponent } = composePolicies({ aiConfig });
    const playerColor = aiConfig.color === "white" ? "black" : "white";
    
    return opponent.shouldEngineMove({
      turn: gameState.turn,
      playerColor,
      movesCount: gameState.moves.length,
    });
  }, [aiConfig, gameState.turn, gameState.moves.length, gameState.status, isAIThinking]);

  // Auto-trigger AI move when conditions are met (pattern from commit 2)
  useEffect(() => {
    if (!shouldAIMoveNow) return;
    
    // Small delay to allow UI to update
    const timer = setTimeout(() => {
      makeAIMove();
    }, 100);
    return () => clearTimeout(timer);
  }, [shouldAIMoveNow, makeAIMove]);

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
        // AI functionality
        aiConfig,
        setAIConfig,
        isAITurn,
        isAIThinking,
        makeAIMove,
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
