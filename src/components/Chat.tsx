import { useState, useEffect, useRef } from "react";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";
import { Send, MessageSquare } from "lucide-react";

export function Chat() {
  const { gameState, sendGuess, sendChatMessage, chatMessages } = useGame();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (gameState.isGameActive && !gameState.isDrawer) {
      // If game is active and player is not drawer, send as guess
      sendGuess(message);
    } else {
      // Otherwise send as chat message
      sendChatMessage(message);
    }
    setMessage("");
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {gameState.isGameActive && !gameState.isDrawer
            ? "Guess the Word"
            : "Chat"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg ${
                  msg.type === "correct-guess"
                    ? "bg-green-500/20 border border-green-500"
                    : msg.type === "wrong-guess"
                    ? "bg-red-500/20 border border-red-500"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{msg.player.name}</span>
                  {msg.type === "correct-guess" && (
                    <Badge variant="default" className="text-xs">
                      Correct!
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              gameState.isGameActive && !gameState.isDrawer
                ? "Type your guess..."
                : "Type a message..."
            }
            disabled={!gameState.isGameActive && gameState.players.length < 2}
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {gameState.isDrawer && gameState.isGameActive && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            You're drawing! Others are guessing your word.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

