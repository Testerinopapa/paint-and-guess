import { useState, useCallback, useMemo, useEffect } from "react";
import { useChess } from "../state/ChessContext";
import { Chess, Square } from "chess.js";
import { debugBoard, isDebugEnabled } from "../utils/debug";

const SQUARE_SIZE = 60;
const BOARD_SIZE = SQUARE_SIZE * 8;

const PIECE_SYMBOLS: Record<string, string> = {
  "K": "♔", "Q": "♕", "R": "♖", "B": "♗", "N": "♘", "P": "♙",
  "k": "♚", "q": "♛", "r": "♜", "b": "♝", "n": "♞", "p": "♟",
};

interface ChessBoardProps {
  fen?: string; // FEN string to display (if provided, overrides ChessContext)
  orientation?: "white" | "black";
  onMove?: (from: string, to: string) => void;
  disabled?: boolean; // If true, moves are disabled (for puzzle mode when not player's turn)
}

export function ChessBoard({ fen, orientation = "white", onMove, disabled = false }: ChessBoardProps) {
  // Use ChessContext if fen is not provided (backward compatibility)
  const chessContext = useChess();
  
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
  useEffect(() => {
    if (fen) {
      const prevFen = game?.fen();
      if (prevFen && prevFen !== fen) {
        debugBoard.fenUpdate(prevFen, fen);
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      setDraggedSquare(null);
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
    if (disabled) return; // Don't allow moves if disabled
    
    if (selectedSquare === square) {
      // Deselect if clicking the same square
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = game.get(square as Square);
    const isCurrentPlayerPiece = piece && 
      ((game.turn() === "w" && piece.color === "w") || 
       (game.turn() === "b" && piece.color === "b"));

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
  }, [selectedSquare, legalMoves, game, makeMove, getLegalMoves, onMove, fen, disabled]);

  const renderSquare = (row: number, col: number) => {
    const squareName = getSquareName(row, col);
    const square = game.get(squareName as Square);
    const isSelected = selectedSquare === squareName;
    const isLegalMove = legalMoves.includes(squareName);
    const isDragged = draggedSquare === squareName;
    const bgColor = getSquareColor(row, col);

    return (
      <div
        key={squareName}
        onClick={() => handleSquareClick(squareName)}
        onMouseDown={() => {
          if (square) {
            setDraggedSquare(squareName);
          }
        }}
        onMouseUp={() => {
          if (!disabled && draggedSquare && draggedSquare !== squareName) {
            const success = makeMove(draggedSquare, squareName);
            if (success && !fen && onMove) {
              // onMove is already called in makeMove for fen mode
              onMove(draggedSquare, squareName);
            }
          }
          setDraggedSquare(null);
        }}
        style={{
          width: SQUARE_SIZE,
          height: SQUARE_SIZE,
          backgroundColor: isSelected 
            ? "#baca44" 
            : isLegalMove 
            ? "#f6f669" 
            : bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : (square || isLegalMove ? "pointer" : "default"),
          position: "relative",
          fontSize: "48px",
          userSelect: "none",
          transition: "background-color 0.2s",
        }}
      >
        {square && (
          <span style={{ 
            opacity: isDragged ? 0.5 : 1,
            pointerEvents: "none",
          }}>
            {PIECE_SYMBOLS[square.color === "w" ? square.type.toUpperCase() : square.type] || ""}
          </span>
        )}
        {isLegalMove && !square && (
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
  };

  // Create squares in the correct order based on orientation
  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const displayRow = orientation === "white" ? row : 7 - row;
      const displayCol = orientation === "white" ? col : 7 - col;
      squares.push(renderSquare(displayRow, displayCol));
    }
  }

  return (
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
  );
}

