import { MobileChessLayout } from "./MobileChessLayout";
import { useChess } from "../state/ChessContext";

interface MobileChessLayoutWrapperProps {
  board: React.ReactNode;
  showMaterial?: boolean;
  showMoveNotation?: boolean;
  onResign?: () => void;
  onHint?: () => void;
  onUndo?: () => void;
  onOptions?: () => void;
}

export function MobileChessLayoutWrapper(props: MobileChessLayoutWrapperProps) {
  const { game, gameState, undoMove } = useChess();
  
  const handleUndo = () => {
    if (props.onUndo) {
      props.onUndo();
    } else {
      undoMove();
    }
  };
  
  return (
    <MobileChessLayout
      {...props}
      puzzleMode={false}
      game={game}
      moves={gameState.moves}
      onUndo={handleUndo}
    />
  );
}

