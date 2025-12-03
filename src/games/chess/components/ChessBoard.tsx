import { useState, useCallback, useEffect, useRef } from "react";
import { useChess } from "../state/ChessContext";
import { Square } from "chess.js";
import { useIsMobile } from "@/hooks/useIsMobile";

const DESKTOP_SQUARE_SIZE = 60;
const MOBILE_SQUARE_SIZE = 40;

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
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(isMobile ? MOBILE_SQUARE_SIZE : DESKTOP_SQUARE_SIZE);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);

  // Calculate responsive square size
  useEffect(() => {
    const updateSquareSize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const maxSquareSize = Math.floor((containerWidth - 32) / 8); // Account for padding
      const calculatedSize = isMobile 
        ? Math.min(MOBILE_SQUARE_SIZE, maxSquareSize)
        : Math.min(DESKTOP_SQUARE_SIZE, maxSquareSize);
      
      setSquareSize(Math.max(30, calculatedSize)); // Minimum 30px
    };

    updateSquareSize();
    window.addEventListener('resize', updateSquareSize);
    return () => window.removeEventListener('resize', updateSquareSize);
  }, [isMobile]);

  const boardSize = squareSize * 8;

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
          if (draggedSquare && draggedSquare !== squareName) {
            const success = makeMove(draggedSquare, squareName);
            if (success) {
              onMove?.(draggedSquare, squareName);
            }
          }
          setDraggedSquare(null);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (square) {
            setDraggedSquare(squareName);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (draggedSquare && draggedSquare !== squareName) {
            const success = makeMove(draggedSquare, squareName);
            if (success) {
              onMove?.(draggedSquare, squareName);
            }
          }
          setDraggedSquare(null);
        }}
        style={{
          width: squareSize,
          height: squareSize,
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
          fontSize: `${squareSize * 0.8}px`,
          userSelect: "none",
          transition: "background-color 0.2s",
          touchAction: "none", // Prevent scrolling on touch
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
              width: Math.max(12, squareSize * 0.33),
              height: Math.max(12, squareSize * 0.33),
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
    <div ref={containerRef} className="w-full flex justify-center p-4">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          width: boardSize,
          height: boardSize,
          border: "2px solid #333",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          maxWidth: "100%",
        }}
      >
        {squares}
      </div>
    </div>
  );
}

