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
  offerDraw: () => void; // Offer/accept draw - ends game as draw
  abortGame: () => void; // Abort game - resets to new game
  // AI functionality
  aiConfig: AIConfig;
  setAIConfig: (config: AIConfig) => void;
  isAITurn: () => boolean;
  isAIThinking: boolean;
  makeAIMove: () => Promise<void>;
}

export const ChessContext = createContext<ChessContextType | undefined>(undefined);

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
    depth: 8,  // Default to a more reasonable depth (Intermediate level)
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

  const offerDraw = useCallback(() => {
    // In local games, offering a draw immediately ends the game as a draw
    // We manually set the game state to draw
    setGameState((prev) => ({
      ...prev,
      status: "draw",
      inDraw: true,
    }));
  }, []);

  const abortGame = useCallback(() => {
    // Abort the game by resetting to a new game
    resetGame();
  }, [resetGame]);

  const loadFromFen = useCallback((fen: string) => {
    try {
      const newGame = new Chess(fen);
      const newState = updateGameState(newGame); // Don't pass lastMove - it will be undefined
      newState.gameMode = gameMode;
      newState.whitePlayer = whitePlayer;
      newState.blackPlayer = blackPlayer;
      newState.lastMove = undefined; // Explicitly clear lastMove (same pattern as resetGame)
      setGameState(newState);
      setGame(newGame);
    } catch (error) {
      console.error("Error loading FEN:", error);
    }
  }, [gameMode, whitePlayer, blackPlayer]);

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
    console.log("[AI DEBUG] makeAIMove called", {
      isAIThinking,
      gameOver: game.isGameOver(),
      aiConfigEnabled: aiConfig.enabled,
      aiConfigColor: aiConfig.color,
      gameStateTurn: gameState.turn,
      gameTurn: game.turn(),
      movesCount: gameState.moves.length,
    });
    
    // Check conditions before proceeding
    if (isAIThinking) {
      console.log("[AI DEBUG] Already thinking, returning early");
      return;
    }
    
    // Check if game is over
    if (game.isGameOver()) {
      console.log("[AI DEBUG] Game is over, returning early");
      return;
    }
    
    // Use policy pattern to determine if engine should move
    const { opponent } = composePolicies({ aiConfig });
    const playerColor = aiConfig.color === "white" ? "black" : "white";
    
    const shouldMove = opponent.shouldEngineMove({
      turn: gameState.turn,
      playerColor,
      movesCount: gameState.moves.length,
    });
    
    console.log("[AI DEBUG] Policy evaluation", {
      shouldMove,
      turn: gameState.turn,
      playerColor,
      movesCount: gameState.moves.length,
    });
    
    if (!shouldMove) {
      console.log("[AI DEBUG] Policy says engine shouldn't move, returning");
      return; // Policy says engine shouldn't move
    }
    
    // Double-check it's actually AI's turn using game state
    const expectedColor = aiConfig.color === "white" ? "w" : "b";
    const actualTurn = game.turn();
    if (actualTurn !== expectedColor) {
      console.log("[AI DEBUG] Turn mismatch", {
        expectedColor,
        actualTurn,
        returning: true,
      });
      return; // Not AI's turn according to game state
    }

    console.log("[AI DEBUG] Setting isAIThinking = true");
    setIsAIThinking(true);
    
    // Safety timeout: if thinking state persists for too long, reset it
    const safetyTimeout = setTimeout(() => {
      console.error("[AI DEBUG] SAFETY TIMEOUT: isAIThinking has been true for 60 seconds, forcing reset");
      setIsAIThinking(false);
    }, 60000); // 60 second safety timeout
    
    try {
      const fen = game.fen();
      const requestBody = {
        fen,
        depth: aiConfig.depth || 8,
        elo: aiConfig.elo,
        limitStrength: aiConfig.elo !== undefined,
      };
      
      console.log("[AI DEBUG] Calling /api/analyze", requestBody);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("[AI DEBUG] API call timeout after 30 seconds");
        controller.abort();
      }, 30000); // 30 second timeout
      
      let response: Response;
      try {
        response = await fetch(apiPath("/api/analyze"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("[AI DEBUG] Response received", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error("[AI DEBUG] API call was aborted (timeout)");
          throw new Error("API call timed out after 30 seconds");
        }
        console.error("[AI DEBUG] Fetch error", {
          error: fetchError,
          errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
          errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
        });
        throw fetchError;
      }

      console.log("[AI DEBUG] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("[AI DEBUG] Analysis failed", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[AI DEBUG] Response data received", {
        hasBestmove: !!data.bestmove,
        bestmove: data.bestmove,
        cp: data.cp,
      });
      
      if (!data.bestmove) {
        console.error("[AI DEBUG] No bestmove in response", data);
        throw new Error("No best move returned from engine");
      }

      const moveData = parseUCIMove(data.bestmove);
      console.log("[AI DEBUG] Parsed UCI move", {
        uci: data.bestmove,
        parsed: moveData,
      });
      
      if (!moveData) {
        console.error("[AI DEBUG] Failed to parse UCI move", data.bestmove);
        throw new Error(`Invalid UCI move format: ${data.bestmove}`);
      }

      // Validate move is legal before applying
      const legalMoves = game.moves({ verbose: true });
      const isValidMove = legalMoves.some(
        (m) => m.from === moveData.from && m.to === moveData.to && 
               (!moveData.promotion || m.promotion === moveData.promotion)
      );

      console.log("[AI DEBUG] Move validation", {
        isValidMove,
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion,
        legalMovesCount: legalMoves.length,
      });

      if (!isValidMove) {
        // Fallback: use first legal move if AI move is invalid
        console.warn("[AI DEBUG] AI returned invalid move, using fallback");
        if (legalMoves.length > 0) {
          const fallbackMove = legalMoves[0];
          console.log("[AI DEBUG] Applying fallback move", fallbackMove);
          makeMove(fallbackMove.from, fallbackMove.to, fallbackMove.promotion);
        }
        console.log("[AI DEBUG] Setting isAIThinking = false (fallback path)");
        setIsAIThinking(false);
        return;
      }

      // Apply the AI move
      console.log("[AI DEBUG] Applying AI move", moveData);
      const success = makeMove(moveData.from, moveData.to, moveData.promotion);
      console.log("[AI DEBUG] Move applied", { success });
      
      if (!success) {
        console.error("[AI DEBUG] Failed to apply AI move");
      }
    } catch (error) {
      console.error("[AI DEBUG] AI move failed with error", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      
      // Fallback: use random legal move if AI fails
      try {
        const legalMoves = game.moves({ verbose: true });
        console.log("[AI DEBUG] Attempting fallback move", {
          legalMovesCount: legalMoves.length,
        });
        
        if (legalMoves.length > 0) {
          const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          console.log("[AI DEBUG] Applying random fallback move", randomMove);
          makeMove(randomMove.from, randomMove.to, randomMove.promotion);
        }
      } catch (fallbackError) {
        console.error("[AI DEBUG] Fallback move also failed", {
          error: fallbackError,
          errorMessage: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
      }
    } finally {
      clearTimeout(safetyTimeout);
      console.log("[AI DEBUG] Finally block: Setting isAIThinking = false");
      setIsAIThinking(false);
      console.log("[AI DEBUG] isAIThinking should now be false");
      
      // Double-check: verify state was actually updated
      setTimeout(() => {
        console.log("[AI DEBUG] Post-finally check: isAIThinking state after 100ms");
      }, 100);
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
    console.log("[AI DEBUG] useEffect triggered", {
      shouldAIMoveNow,
      isAIThinking,
      aiConfigEnabled: aiConfig.enabled,
    });
    
    if (!shouldAIMoveNow) {
      console.log("[AI DEBUG] shouldAIMoveNow is false, not triggering makeAIMove");
      return;
    }
    
    console.log("[AI DEBUG] Scheduling makeAIMove in 100ms");
    // Small delay to allow UI to update
    const timer = setTimeout(() => {
      console.log("[AI DEBUG] Timer fired, calling makeAIMove");
      makeAIMove();
    }, 100);
    return () => {
      console.log("[AI DEBUG] Cleaning up timer");
      clearTimeout(timer);
    };
  }, [shouldAIMoveNow, makeAIMove, isAIThinking, aiConfig.enabled]);

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
        offerDraw,
        abortGame,
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
