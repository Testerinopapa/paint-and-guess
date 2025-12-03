import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import { useIsMobile } from "@/hooks/useIsMobile";

const DESKTOP_SQUARE_SIZE = 60;
const MOBILE_SQUARE_SIZE = 40;

const PIECE_SYMBOLS: Record<string, string> = {
  "K": "♔", "Q": "♕", "R": "♖", "B": "♗", "N": "♘", "P": "♙",
  "k": "♚", "q": "♛", "r": "♜", "b": "♝", "n": "♞", "p": "♟",
};

interface PuzzleBoardProps {
  fen: string;
  orientation?: "white" | "black";
  onMove?: (from: string, to: string) => void;
  disabled?: boolean;
}

export function PuzzleBoard({ fen, orientation = "white", onMove, disabled = false }: PuzzleBoardProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(isMobile ? MOBILE_SQUARE_SIZE : DESKTOP_SQUARE_SIZE);
  const [game, setGame] = useState<Chess | null>(null);
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

  // Update game when FEN changes
  useEffect(() => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setSelectedSquare(null);
      setLegalMoves([]);
    } catch (error) {
      console.error("Error loading FEN:", error);
    }
  }, [fen]);

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
    if (disabled || !game) return;

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
      if (onMove) {
        onMove(selectedSquare, square);
      }
      setSelectedSquare(null);
      setLegalMoves([]);
    } else if (isCurrentPlayerPiece) {
      // Select the piece and show legal moves
      setSelectedSquare(square);
      try {
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((move) => move.to));
      } catch (error) {
        console.error("Error getting legal moves:", error);
        setLegalMoves([]);
      }
    } else {
      // Clear selection
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, game, disabled, onMove]);

  const renderSquare = (row: number, col: number) => {
    const squareName = getSquareName(row, col);
    const square = game?.get(squareName as Square);
    const isSelected = selectedSquare === squareName;
    const isLegalMove = legalMoves.includes(squareName);
    const isDragged = draggedSquare === squareName;
    const bgColor = getSquareColor(row, col);

    return (
      <div
        key={squareName}
        onClick={() => !disabled && handleSquareClick(squareName)}
        onMouseDown={() => {
          if (square && !disabled) {
            setDraggedSquare(squareName);
          }
        }}
        onMouseUp={() => {
          if (draggedSquare && draggedSquare !== squareName && !disabled && onMove) {
            onMove(draggedSquare, squareName);
          }
          setDraggedSquare(null);
        }}
        onTouchStart={(e) => {
          if (!disabled && square) {
            e.preventDefault();
            setDraggedSquare(squareName);
          }
        }}
        onTouchEnd={(e) => {
          if (!disabled) {
            e.preventDefault();
            if (draggedSquare && draggedSquare !== squareName && onMove) {
              onMove(draggedSquare, squareName);
            }
            setDraggedSquare(null);
          }
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
          cursor: (square || isLegalMove) && !disabled ? "pointer" : "default",
          position: "relative",
          fontSize: `${squareSize * 0.8}px`,
          userSelect: "none",
          transition: "background-color 0.2s",
          opacity: disabled ? 0.6 : 1,
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

  if (!game) {
    return (
      <div ref={containerRef} className="w-full flex items-center justify-center p-4" style={{ minHeight: boardSize }}>
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    );
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

