import { useState, useCallback } from "react";
import { useChess } from "../state/ChessContext";
import { Square } from "chess.js";

const SQUARE_SIZE = 60;
const BOARD_SIZE = SQUARE_SIZE * 8;

const PIECE_SYMBOLS: Record<string, string> = {
  "K": "♔", "Q": "♕", "R": "♖", "B": "♗", "N": "♘", "P": "♙",
  "k": "♚", "q": "♛", "r": "♜", "b": "♝", "n": "♞", "p": "♟",
};

interface ChessBoardProps {
  orientation?: "white" | "black";
  onMove?: (from: string, to: string) => void;
}

export function ChessBoard({ orientation = "white", onMove }: ChessBoardProps) {
  const { game, gameState, makeMove, getLegalMoves } = useChess();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);

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
        onMove?.(selectedSquare, square);
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (isCurrentPlayerPiece) {
      // Select the piece and show legal moves
      setSelectedSquare(square);
      const moves = getLegalMoves(square);
      setLegalMoves(moves);
    } else {
      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, game, makeMove, getLegalMoves, onMove]);

  const renderSquare = (row: number, col: number) => {
    const squareName = getSquareName(row, col);
    const square = game.get(squareName as Square);
    const isSelected = selectedSquare === squareName;
    const isLegalMove = legalMoves.includes(squareName);
    const isDragged = draggedSquare === squareName;
    
    const displayRow = orientation === "white" ? row : 7 - row;
    const displayCol = orientation === "white" ? col : 7 - col;
    const bgColor = getSquareColor(displayRow, displayCol);

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
          if (draggedSquare && draggedSquare !== squareName) {
            const success = makeMove(draggedSquare, squareName);
            if (success) {
              onMove?.(draggedSquare, squareName);
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
          cursor: square || isLegalMove ? "pointer" : "default",
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
            {PIECE_SYMBOLS[square.type] || ""}
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
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const displayRow = orientation === "white" ? row : 7 - row;
          const displayCol = orientation === "white" ? col : 7 - col;
          return renderSquare(displayRow, displayCol);
        })
      )}
    </div>
  );
}

