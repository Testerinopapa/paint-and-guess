import { useState, useEffect } from "react";
import { useCanva } from "../state/CanvaContext";
import { CanvaCanvas } from "./Canvas";
import { MobileTopBar } from "./mobile/MobileTopBar";
import { MobileDrawingTools } from "./mobile/MobileDrawingTools";
import { MobileWordDisplay } from "./mobile/MobileWordDisplay";
import { MobileGameInfoSheet } from "./mobile/MobileGameInfoSheet";
import { MobileAnswersSheet } from "./mobile/MobileAnswersSheet";
import { MobileChatSheet } from "./mobile/MobileChatSheet";
import { MobilePlayersSheet } from "./mobile/MobilePlayersSheet";
import type { ChatMessage } from "../state/types";

interface MobileGameStageProps {
  onLeaveRoom: () => void;
}

interface GuessEntry {
  guess: string;
  player: { id: string; name: string };
  correct: boolean;
  timestamp: number;
}

export function MobileGameStage({ onLeaveRoom }: MobileGameStageProps) {
  const { gameState, isDrawer, makeGuess, sendChatMessage, socket } = useCanva();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  
  // Sheet states
  const [sheetStates, setSheetStates] = useState({
    gameInfo: { expanded: false },
    answers: { expanded: false },
    chat: { expanded: false },
    players: { expanded: false },
  });

  // Determine if drawing should be enabled
  const canDraw = !gameState.isGameActive || (gameState.isGameActive && isDrawer && gameState.isRoundActive);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const onChatMessage = ({ player, message, timestamp }: ChatMessage) => {
      setChatMessages((prev) => [...prev, { player, message, timestamp }]);
    };

    socket.on("canva:chat-message", onChatMessage);

    return () => {
      socket.off("canva:chat-message", onChatMessage);
    };
  }, [socket]);

  // Listen for guess events
  useEffect(() => {
    if (!socket) return;

    const onCorrectGuess = ({ player, word }: any) => {
      setGuessHistory((prev) => [
        ...prev,
        {
          guess: word,
          player,
          correct: true,
          timestamp: Date.now(),
        },
      ]);
      // Auto-expand answers sheet on correct guess
      setSheetStates(prev => ({
        ...prev,
        answers: { expanded: true },
      }));
    };

    const onWrongGuess = ({ player, guess }: any) => {
      setGuessHistory((prev) => [
        ...prev,
        {
          guess,
          player,
          correct: false,
          timestamp: Date.now(),
        },
      ]);
    };

    socket.on("canva:correct-guess", onCorrectGuess);
    socket.on("canva:wrong-guess", onWrongGuess);

    return () => {
      socket.off("canva:correct-guess", onCorrectGuess);
      socket.off("canva:wrong-guess", onWrongGuess);
    };
  }, [socket]);

  // Clear guess history when new round starts
  useEffect(() => {
    if (gameState.isRoundActive && gameState.roundNumber > 0) {
      setGuessHistory([]);
    }
  }, [gameState.roundNumber]);

  const getStatusText = () => {
    if (!gameState.isGameActive) return "WAIT";
    if (!gameState.isRoundActive) return "WAIT";
    if (isDrawer) return "DRAWING";
    return "GUESSING";
  };

  const progressPercentage = gameState.roundTime > 0
    ? ((gameState.roundTime - gameState.timeRemaining) / gameState.roundTime) * 100
    : 0;

  // Calculate canvas top position
  const canvasTop = isDrawer && gameState.currentWord ? 172 : 120; // 56 + 64 + 52 or 56 + 64

  // Calculate bottom sheets height
  const bottomSheetsHeight = 
    (sheetStates.gameInfo.expanded ? 120 : 48) +
    (sheetStates.answers.expanded ? 200 : 56) +
    (sheetStates.chat.expanded ? 200 : 56) +
    (sheetStates.players.expanded ? 300 : 56);

  // Prevent scrolling while drawing on mobile
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      // Only prevent if touching the canvas area
      const target = e.target as HTMLElement;
      if (target.closest('.canvas-container')) {
        e.preventDefault();
      }
    };

    // Use passive: false to allow preventDefault
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Fixed Top Bar */}
      <MobileTopBar status={getStatusText()} onLeave={onLeaveRoom} />
      
      {/* Fixed Drawing Tools */}
      <MobileDrawingTools
        color={color}
        brushSize={brushSize}
        canDraw={canDraw}
        onColorChange={setColor}
        onBrushSizeChange={setBrushSize}
      />
      
      {/* Word Display (Drawer Only) */}
      {isDrawer && gameState.currentWord && (
        <MobileWordDisplay word={gameState.currentWord} />
      )}
      
      {/* Canvas Area */}
      <div
        className="fixed left-0 right-0 overflow-auto bg-muted/20"
        style={{
          top: `${canvasTop}px`,
          bottom: `${bottomSheetsHeight}px`,
        }}
      >
        {/* Word Hint Overlay (Guessers) */}
        {!isDrawer && gameState.isRoundActive && !gameState.currentWord && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-6xl font-bold text-muted/10 select-none">
              ???
            </span>
          </div>
        )}
        
        {/* Canvas Container */}
        <div className="flex items-center justify-center min-h-full p-4 relative z-10 canvas-container">
          <div className="relative">
            <CanvaCanvas 
              color={color}
              brushSize={brushSize}
              onColorChange={setColor}
              onBrushSizeChange={setBrushSize}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom Sheets Stack */}
      <div className="fixed bottom-0 left-0 right-0 z-30 space-y-0">
        <MobileGameInfoSheet
          roundNumber={gameState.roundNumber}
          timeRemaining={gameState.timeRemaining}
          currentWord={gameState.currentWord || null}
          isDrawer={isDrawer}
          progressPercentage={progressPercentage}
          expanded={sheetStates.gameInfo.expanded}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            gameInfo: { expanded },
          }))}
        />
        <MobileAnswersSheet
          guessHistory={guessHistory}
          isDrawer={isDrawer}
          isRoundActive={gameState.isRoundActive}
          expanded={sheetStates.answers.expanded}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            answers: { expanded },
          }))}
          onSubmit={(guess) => makeGuess(guess)}
        />
        <MobileChatSheet
          chatMessages={chatMessages}
          expanded={sheetStates.chat.expanded}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            chat: { expanded },
          }))}
          onSubmit={(message) => sendChatMessage(message)}
        />
        <MobilePlayersSheet
          players={gameState.players}
          currentDrawerId={gameState.currentDrawer?.id || null}
          selfId={gameState.selfId}
          expanded={sheetStates.players.expanded}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            players: { expanded },
          }))}
        />
      </div>
    </div>
  );
}

