import { CanvaCanvas } from "./Canvas";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, X, Minimize2 } from "lucide-react";
import { useCanva } from "../state/CanvaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { ChatMessage } from "../state/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileGameStage } from "./MobileGameStage";

interface GameStageProps {
  onLeaveRoom: () => void;
}

interface GuessEntry {
  guess: string;
  player: { id: string; name: string };
  correct: boolean;
  timestamp: number;
}

// Separate component for desktop layout to avoid hook order issues
function DesktopGameStage({ onLeaveRoom }: GameStageProps) {
  const { gameState, isDrawer, makeGuess, sendChatMessage, socket } = useCanva();
  const [guessInput, setGuessInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const guessHistoryEndRef = useRef<HTMLDivElement>(null);

  // Determine if input should be used for guessing or chatting
  const isGuessingMode = !isDrawer && gameState.isGameActive && gameState.isRoundActive && !gameState.currentWord;

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

  // Scroll to bottom of chat/guess history
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    guessHistoryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guessHistory]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = guessInput.trim();
    if (!guess || isDrawer) return;
    makeGuess(guess);
    setGuessInput("");
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    sendChatMessage(message);
    setChatInput("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = gameState.roundTime > 0
    ? ((gameState.roundTime - gameState.timeRemaining) / gameState.roundTime) * 100
    : 0;

  const getStatusText = () => {
    if (!gameState.isGameActive) return "WAIT";
    if (!gameState.isRoundActive) return "WAIT";
    if (isDrawer) return "DRAWING";
    return "GUESSING";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold">CANVA</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-semibold">
            {getStatusText()}
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onLeaveRoom}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Players */}
        <aside className="w-48 sm:w-56 bg-muted/50 p-4 overflow-y-auto flex-shrink-0 hidden md:block">
          <h2 className="font-semibold mb-3 text-sm">PLAYERS</h2>
          <div className="space-y-2">
            {gameState.players
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded border bg-card"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-sm truncate ${
                            player.id === gameState.selfId ? "font-bold" : ""
                          }`}
                        >
                          {player.name}
                        </span>
                        {player.id === gameState.currentDrawer?.id && (
                          <span className="text-xs">🎨</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap ml-2">
                    {player.score || 0} pts
                  </span>
                </div>
              ))}
          </div>
        </aside>

        {/* Canvas Section */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
          {/* Word Display for Drawer */}
          {isDrawer && gameState.currentWord && (
            <div className="mb-4 p-3 bg-primary text-primary-foreground rounded-lg text-center flex-shrink-0">
              <p className="text-xs opacity-90 mb-1">Your word:</p>
              <p className="text-2xl font-bold">{gameState.currentWord}</p>
            </div>
          )}

          {/* Word Hint Overlay for Guessers (faint background) */}
          {!isDrawer && gameState.isRoundActive && !gameState.currentWord && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <span className="text-6xl sm:text-8xl font-bold text-muted/20 select-none">
                ???
              </span>
            </div>
          )}

          {/* Canvas Container */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 overflow-hidden">
            <div className="w-full h-full max-w-full max-h-full flex items-center justify-center p-2">
              <CanvaCanvas />
            </div>
          </div>

          {/* Progress Bar */}
          {gameState.isGameActive && gameState.isRoundActive && (
            <div className="mt-4 flex-shrink-0">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panels - Answers and Chat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 border-t flex-shrink-0">
        {/* Answers Panel */}
        <Card className="flex flex-col h-48">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm">ANSWERS</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-2">
              {guessHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No guesses yet
                </p>
              ) : (
                guessHistory.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-sm ${
                      entry.correct ? "text-green-600 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {entry.correct && "✓ "}
                    {entry.guess}
                    {entry.correct && entry.player && ` (${entry.player.name})`}
                  </div>
                ))
              )}
              <div ref={guessHistoryEndRef} />
            </div>
            <form onSubmit={handleGuessSubmit} className="flex gap-2 flex-shrink-0">
              <Input
                placeholder="Type your guess here..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                disabled={isDrawer || !gameState.isRoundActive}
                className="flex-1"
              />
              <Button type="submit" disabled={!guessInput.trim() || isDrawer || !gameState.isRoundActive}>
                Guess
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="flex flex-col h-48">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm">CHAT</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-2">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No messages yet
                </p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">{msg.player.name}:</span> {msg.message}
                  </div>
                ))
              )}
              <div ref={chatMessagesEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-2 flex-shrink-0">
              <Input
                placeholder="Type your message here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!chatInput.trim()}>
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function GameStage({ onLeaveRoom }: GameStageProps) {
  const isMobile = useIsMobile();
  
  // Use mobile layout on mobile devices
  if (isMobile) {
    return <MobileGameStage onLeaveRoom={onLeaveRoom} />;
  }

  // Desktop layout
  return <DesktopGameStage onLeaveRoom={onLeaveRoom} />;
}
