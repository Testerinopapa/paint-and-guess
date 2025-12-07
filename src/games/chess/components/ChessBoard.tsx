import { useState, useCallback, useMemo, useEffect, memo } from "react";
import { useChess } from "../state/ChessContext";
import { Chess, Square } from "chess.js";
import { debugBoard, isDebugEnabled } from "../utils/debug";
import { ChessPiece } from "../utils/chessPieces";

const SQUARE_SIZE = 60;
const BOARD_SIZE = SQUARE_SIZE * 8;

// Memoized square component - only re-renders when its props change
interface ChessSquareProps {
  squareName: string;
  piece: { type: string; color: string } | null;
  isSelected: boolean;
  isLegalMove: boolean;
  isDragged: boolean;
  isLastMove: boolean;
  bgColor: string;
  showFileLabel: boolean;
  showRankLabel: boolean;
  orientation: "white" | "black";
  disabled: boolean;
  onSquareClick: (square: string) => void;
  onMouseDown: (square: string) => void;
  onMouseUp: (square: string) => void;
}

const ChessSquare = memo(({
  squareName,
  piece,
  isSelected,
  isLegalMove,
  isDragged,
  isLastMove,
  bgColor,
  showFileLabel,
  showRankLabel,
  orientation,
  disabled,
  onSquareClick,
  onMouseDown,
  onMouseUp,
}: ChessSquareProps) => {
  const file = squareName[0];
  const rank = squareName[1];
  const isLightSquare = (parseInt(rank) + (file.charCodeAt(0) - 96)) % 2 === 1;

  return (
    <div
      onClick={() => onSquareClick(squareName)}
      onMouseDown={() => onMouseDown(squareName)}
      onMouseUp={() => onMouseUp(squareName)}
      style={{
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        backgroundColor: isSelected 
          ? "#baca44" 
          : isLegalMove 
          ? "#f6f669" 
          : isLastMove
          ? "#cdd26a"
          : bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : (piece || isLegalMove ? "pointer" : "default"),
        position: "relative",
        userSelect: "none",
        transition: "background-color 0.2s",
        boxShadow: isLastMove ? "inset 0 0 0 2px rgba(139, 195, 74, 0.5)" : "none",
      }}
    >
      {/* Rank label (left side for white, right side for black) */}
      {showRankLabel && (
        <div
          style={{
            position: "absolute",
            left: orientation === "white" ? 2 : "auto",
            right: orientation === "black" ? 2 : "auto",
            top: 2,
            fontSize: "11px",
            fontWeight: "600",
            color: isLightSquare ? "#b58863" : "#f0d9b5",
            pointerEvents: "none",
          }}
        >
          {rank}
        </div>
      )}

      {/* File label (bottom for white, top for black) */}
      {showFileLabel && (
        <div
          style={{
            position: "absolute",
            bottom: orientation === "white" ? 2 : "auto",
            top: orientation === "black" ? 2 : "auto",
            right: 2,
            fontSize: "11px",
            fontWeight: "600",
            color: isLightSquare ? "#b58863" : "#f0d9b5",
            pointerEvents: "none",
          }}
        >
          {file}
        </div>
      )}

      {piece && (
        <div style={{ 
          opacity: isDragged ? 0.5 : 1,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          position: "absolute",
          top: 0,
          left: 0,
          boxSizing: "border-box",
        }}>
          <ChessPiece 
            piece={piece} 
            size={SQUARE_SIZE}
          />
        </div>
      )}
      {isLegalMove && !piece && (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "#000",
            opacity: 0.3,
          }}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - returns true if props are equal (skip render), false if different (render)
  // Note: We don't compare callbacks - if callbacks change but data didn't, we skip render for performance
  
  // Compare piece (handle null case)
  const pieceEqual = 
    (!prevProps.piece && !nextProps.piece) ||
    (prevProps.piece && nextProps.piece && 
     prevProps.piece.type === nextProps.piece.type &&
     prevProps.piece.color === nextProps.piece.color);
  
  return (
    prevProps.squareName === nextProps.squareName &&
    pieceEqual &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLegalMove === nextProps.isLegalMove &&
    prevProps.isDragged === nextProps.isDragged &&
    prevProps.isLastMove === nextProps.isLastMove &&
    prevProps.bgColor === nextProps.bgColor &&
    prevProps.showFileLabel === nextProps.showFileLabel &&
    prevProps.showRankLabel === nextProps.showRankLabel &&
    prevProps.orientation === nextProps.orientation &&
    prevProps.disabled === nextProps.disabled
  );
});

ChessSquare.displayName = "ChessSquare";

interface ChessBoardProps {
  fen?: string; // FEN string to display (if provided, overrides ChessContext)
  orientation?: "white" | "black";
  onMove?: (from: string, to: string) => void;
  disabled?: boolean; // If true, moves are disabled (for puzzle mode when not player's turn)
}

export function ChessBoard({ fen, orientation = "white", onMove, disabled = false }: ChessBoardProps) {
  // Use ChessContext if fen is not provided (backward compatibility)
  const chessContext = useChess();
  
  // Check if AI mode is selected but game hasn't started yet (waiting for "Start Game vs AI")
  const isAIModePending = chessContext.gameState?.gameMode === "ai" && 
    (!chessContext.aiConfig?.enabled);
  
  // Check if AI is thinking or if it's AI's turn (disable player moves)
  const isAIDisabled = chessContext.aiConfig && chessContext.aiConfig.enabled && 
    (chessContext.isAIThinking || chessContext.isAITurn());
  
  const effectiveDisabled = disabled || isAIDisabled || isAIModePending;
  
  // Create game instance from fen if provided, otherwise use ChessContext
  const game = useMemo(() => {
    if (fen) {
      try {
        const gameInstance = new Chess(fen);
        debugBoard.gameInstance(fen, true);
        return gameInstance;
      } catch (error) {
        debugBoard.error(error, "FEN parsing");
        debugBoard.gameInstance(fen, false);
        console.error("Invalid FEN:", fen, error);
        return new Chess(); // Fallback to starting position
      }
    }
    return chessContext.game;
  }, [fen, chessContext.game]);

  // Get move functions - if fen is provided, we handle moves via onMove callback only
  const makeMove = fen ? 
    (from: string, to: string) => {
      // For puzzle mode, moves are handled by parent via onMove callback
      if (onMove) {
        return onMove(from, to);
      }
      return false;
    } : 
    chessContext.makeMove;

  const getLegalMoves = useCallback((square?: string): string[] => {
    if (!game) return [];
    
    const moves = game.moves({ square: square as Square, verbose: true });
    return moves.map(move => move.to);
  }, [game]);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);

  // Reset selection when fen changes (for puzzle mode)
  // This effect ensures board state resets when puzzle loads
  useEffect(() => {
    if (fen) {
      setSelectedSquare(null);
      setLegalMoves([]);
      setDraggedSquare(null);
    }
  }, [fen]);
  
  // Debug FEN changes
  useEffect(() => {
    if (fen && game) {
      const currentFenFromGame = game.fen();
      if (currentFenFromGame !== fen) {
        debugBoard.fenUpdate(currentFenFromGame, fen);
      }
    }
  }, [fen, game]);

  // Debug: Log board render
  useEffect(() => {
    if (isDebugEnabled()) {
      debugBoard.render(game?.fen() || "no game", orientation);
    }
  }, [game, orientation]);

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    return isLight ? "#f0d9b5" : "#b58863";
  };

  const getSquareName = (row: number, col: number): string => {
    const file = String.fromCharCode(97 + col); // a-h
    const rank = 8 - row; // 1-8
    return `${file}${rank}`;
  };

  const handleSquareClick = useCallback((square: string) => {
    if (effectiveDisabled) return; // Don't allow moves if disabled or AI's turn
    
    // In AI mode, don't allow moves until "Start Game vs AI" is clicked
    if (chessContext.gameState?.gameMode === "ai" && !chessContext.aiConfig?.enabled) {
      console.log("[AI DEBUG] Board disabled: AI mode selected but game not started");
      return; // AI mode selected but "Start Game vs AI" not clicked yet
    }
    
    if (selectedSquare === square) {
      // Deselect if clicking the same square
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = game?.get(square as Square);
    const isCurrentPlayerPiece = piece && 
      ((game?.turn() === "w" && piece.color === "w") || 
       (game?.turn() === "b" && piece.color === "b"));

    if (selectedSquare && legalMoves.includes(square)) {
      // Make the move
      const success = makeMove(selectedSquare, square);
      if (success) {
        // onMove is called inside makeMove for fen mode, but we still call it for ChessContext mode
        if (!fen && onMove) {
          onMove(selectedSquare, square);
        }
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (isCurrentPlayerPiece) {
      // Select the piece and show legal moves
      setSelectedSquare(square);
      const moves = getLegalMoves(square);
      setLegalMoves(moves);
      if (isDebugEnabled()) {
        debugBoard.selection(square, moves);
      }
    } else {
      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, game, makeMove, getLegalMoves, onMove, fen, effectiveDisabled, chessContext.gameState?.gameMode, chessContext.aiConfig?.enabled]);

  const handleMouseDown = useCallback((square: string) => {
    const piece = game?.get(square as Square);
    if (piece) {
      setDraggedSquare(square);
    }
  }, [game]);

  const handleMouseUp = useCallback((square: string) => {
    // Prevent drag-drop in AI mode until game is started
    if (chessContext.gameState?.gameMode === "ai" && !chessContext.aiConfig?.enabled) {
      setDraggedSquare(null);
      return;
    }
    
    if (!effectiveDisabled && draggedSquare && draggedSquare !== square) {
      const success = makeMove(draggedSquare, square);
      if (success && !fen && onMove) {
        // onMove is already called in makeMove for fen mode
        onMove(draggedSquare, square);
      }
    }
    setDraggedSquare(null);
  }, [draggedSquare, effectiveDisabled, makeMove, fen, onMove, chessContext.gameState?.gameMode, chessContext.aiConfig?.enabled]);

  // Track the effective FEN - use fen prop if provided (puzzle mode), otherwise use game FEN
  const effectiveFen = fen || game?.fen() || "";
  const lastMove = chessContext?.gameState?.lastMove;

  // Extract piece positions into a stable map - only changes when FEN actually changes
  // This prevents unnecessary recreations when game instance changes but position doesn't
  const pieceMap = useMemo(() => {
    if (!game) return new Map<string, { type: string; color: string } | null>();
    
    const map = new Map<string, { type: string; color: string } | null>();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const squareName = getSquareName(row, col);
        const piece = game.get(squareName as Square);
        map.set(squareName, piece || null);
      }
    }
    return map;
  }, [effectiveFen, game]); // Depend on FEN and game - game changes when FEN changes anyway

  // Memoize the squares array - only recreate when relevant state changes
  // Use pieceMap instead of game instance to prevent unnecessary recreations
  const squares = useMemo(() => {
    const squareArray = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRow = orientation === "white" ? row : 7 - row;
        const displayCol = orientation === "white" ? col : 7 - col;
        const squareName = getSquareName(displayRow, displayCol);
        const piece = pieceMap.get(squareName) || null;
        
        const file = squareName[0];
        const rank = squareName[1];
        const showFileLabel = orientation === "white" ? rank === "1" : rank === "8";
        const showRankLabel = orientation === "white" ? file === "a" : file === "h";
        
        squareArray.push(
          <ChessSquare
            key={squareName}
            squareName={squareName}
            piece={piece}
            isSelected={selectedSquare === squareName}
            isLegalMove={legalMoves.includes(squareName)}
            isDragged={draggedSquare === squareName}
            isLastMove={lastMove?.from === squareName || lastMove?.to === squareName}
            bgColor={getSquareColor(displayRow, displayCol)}
            showFileLabel={showFileLabel}
            showRankLabel={showRankLabel}
            orientation={orientation}
            disabled={effectiveDisabled}
            onSquareClick={handleSquareClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
        );
      }
    }
    
    return squareArray;
  }, [
    pieceMap, // Use pieceMap instead of game - more stable, only changes when pieces actually move
    selectedSquare,
    legalMoves,
    draggedSquare,
    lastMove,
    orientation,
    effectiveDisabled,
    handleSquareClick,
    handleMouseDown,
    handleMouseUp,
  ]);

  // Generate file labels (a-h) based on orientation
  const fileLabels = [];
  if (orientation === "white") {
    for (let i = 0; i < 8; i++) {
      fileLabels.push(String.fromCharCode(97 + i)); // a-h
    }
  } else {
    for (let i = 7; i >= 0; i--) {
      fileLabels.push(String.fromCharCode(97 + i)); // h-a
    }
  }

  // Generate rank labels (1-8) based on orientation
  const rankLabels = [];
  if (orientation === "white") {
    for (let i = 8; i >= 1; i--) {
      rankLabels.push(i.toString()); // 8-1 (top to bottom)
    }
  } else {
    for (let i = 1; i <= 8; i++) {
      rankLabels.push(i.toString()); // 1-8 (top to bottom)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* File labels at top (for black orientation) */}
      {orientation === "black" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            width: BOARD_SIZE,
            height: 20,
            marginBottom: 2,
          }}
        >
          {fileLabels.map((label, idx) => (
            <div
              key={`file-top-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Rank labels on left (for white) or right (for black) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: BOARD_SIZE,
            width: orientation === "white" ? 20 : 0,
            marginRight: orientation === "white" ? 2 : 0,
            marginLeft: orientation === "black" ? 2 : 0,
            justifyContent: "space-between",
          }}
        >
          {orientation === "white" &&
            rankLabels.map((label, idx) => (
              <div
                key={`rank-left-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  height: SQUARE_SIZE,
                }}
              >
                {label}
              </div>
            ))}
        </div>

        {/* Chess board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            border: "2px solid #333",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          {squares}
        </div>

        {/* Rank labels on right (for black) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: BOARD_SIZE,
            width: orientation === "black" ? 20 : 0,
            marginLeft: orientation === "black" ? 2 : 0,
            justifyContent: "space-between",
          }}
        >
          {orientation === "black" &&
            rankLabels.map((label, idx) => (
              <div
                key={`rank-right-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  height: SQUARE_SIZE,
                }}
              >
                {label}
              </div>
            ))}
        </div>
      </div>

      {/* File labels at bottom (for white orientation) */}
      {orientation === "white" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            width: BOARD_SIZE,
            height: 20,
            marginTop: 2,
          }}
        >
          {fileLabels.map((label, idx) => (
            <div
              key={`file-bottom-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

