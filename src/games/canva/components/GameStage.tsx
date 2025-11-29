import { CanvaCanvas } from "./Canvas";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useCanva } from "../state/CanvaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";

interface GameStageProps {
  onLeaveRoom: () => void;
}

export function GameStage({ onLeaveRoom }: GameStageProps) {
  const { gameState, isDrawer, makeGuess, sendChatMessage } = useCanva();
  const [chatInput, setChatInput] = useState("");

  // Determine if input should be used for guessing or chatting
  const isGuessingMode = !isDrawer && gameState.isGameActive && gameState.isRoundActive && !gameState.currentWord;

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    if (isGuessingMode) {
      // During active round, treat as guess
      makeGuess(message);
    } else {
      // Otherwise, send as chat message
      sendChatMessage(message);
    }
    setChatInput("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-1 sm:p-2 md:p-4 h-[calc(100vh-5rem)] max-h-screen overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 auto-rows-fr">
        {/* Left Sidebar - Game Info & Players */}
        <div className="lg:col-span-2 hidden md:flex flex-col min-h-0 lg:max-h-full gap-2">
          {/* Timer & Round Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Round {gameState.roundNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-center mb-2">
                {formatTime(gameState.timeRemaining)}
              </div>
              {isDrawer && gameState.currentWord && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">Your word:</p>
                  <p className="text-lg font-bold">{gameState.currentWord}</p>
                </div>
              )}
              {!isDrawer && gameState.currentWord && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Word revealed!</p>
                  <p className="text-lg font-bold">{gameState.currentWord}</p>
                </div>
              )}
              {!isDrawer && !gameState.currentWord && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Guess the word!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Players</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {gameState.players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
                        <span className={player.id === gameState.selfId ? "font-bold" : ""}>
                          {player.name}
                          {player.id === gameState.currentDrawer?.id && " 🎨"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold">{player.score || 0}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={onLeaveRoom} variant="outline" className="w-full" size="sm">
            <LogOut className="w-3 h-3 mr-2" />
            Leave
          </Button>
        </div>

        {/* Main Canvas Area */}
        <div className="col-span-1 lg:col-span-8 flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-0 lg:max-h-full">
          <CanvaCanvas />
        </div>

        {/* Right Sidebar - Chat & Guess */}
        <div className="col-span-1 lg:col-span-2 flex flex-col min-h-[250px] sm:min-h-[300px] lg:min-h-0 lg:max-h-full gap-2">
          {/* Chat */}
          <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {isGuessingMode ? "Make a Guess" : "Chat"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                {/* Chat messages would go here - simplified for now */}
                <p className="text-xs text-muted-foreground text-center">
                  {isGuessingMode 
                    ? "Type your guess below" 
                    : "Chat messages will appear here"}
                </p>
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isGuessingMode ? "Type your guess..." : "Type a message..."} 
                  className="flex-1" 
                />
                <Button type="submit" size="sm" disabled={!chatInput.trim()}>
                  {isGuessingMode ? "Guess" : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

