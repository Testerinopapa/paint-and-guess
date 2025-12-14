import { useChess } from "../state/ChessContext";

export function MoveNotation() {
  const { gameState } = useChess();
  
  // Get the last move notation
  const lastMove = gameState.moves[gameState.moves.length - 1];
  
  if (!lastMove) {
    return null;
  }

  // Format move number and notation
  const moveNumber = Math.floor((gameState.moves.length - 1) / 2) + 1;
  const isWhiteMove = (gameState.moves.length - 1) % 2 === 0;
  const notation = isWhiteMove 
    ? `${moveNumber}. ${lastMove.san}`
    : `${moveNumber}... ${lastMove.san}`;

  return (
    <div className="px-4 py-2 bg-muted/50 border-b">
      <div className="flex items-center justify-start">
        <span className="px-3 py-1 bg-muted rounded-full text-sm font-mono">
          {notation}
        </span>
      </div>
    </div>
  );
}
