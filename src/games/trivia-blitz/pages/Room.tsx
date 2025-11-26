import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrivia } from "../state/TriviaContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LobbyView from "../components/LobbyView";
import HostView from "../components/HostView";
import PlayerView from "../components/PlayerView";
import Leaderboard from "../components/Leaderboard";
import Podium from "../components/Podium";

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { gameState, isHost, leaveRoom, isConnected } = useTrivia();

  useEffect(() => {
    if (!isConnected) {
      navigate("/games/trivia-blitz");
      return;
    }
  }, [isConnected, navigate]);

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate("/games/trivia-blitz");
    toast.info("Left room");
  };

  if (!gameState.roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p>Loading room...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Trivia Blitz</h1>
            {gameState.gamePin && (
              <p className="text-muted-foreground">PIN: {gameState.gamePin}</p>
            )}
          </div>
          <Button variant="outline" onClick={handleLeaveRoom}>
            Leave Room
          </Button>
        </div>

        {/* Phase-based rendering */}
        {gameState.phase === "lobby" && (
          <LobbyView onLeaveRoom={handleLeaveRoom} />
        )}

        {gameState.phase === "question-intro" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Get Ready!</h2>
              <p className="text-xl text-muted-foreground">
                Question {gameState.currentQuestionIndex + 1} of {gameState.totalQuestions}
              </p>
            </Card>
          </div>
        )}

        {gameState.phase === "question" && (
          <>
            {isHost ? (
              <HostView />
            ) : (
              <PlayerView />
            )}
          </>
        )}

        {gameState.phase === "answer-reveal" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="p-8 text-center max-w-2xl w-full">
              <h2 className="text-3xl font-bold mb-4">
                {gameState.currentQuestion?.text}
              </h2>
              <div className="space-y-2 mt-6">
                {gameState.currentQuestion?.options.map((option) => {
                  const isCorrect = option.id === gameState.currentQuestion?.correctOptionId;
                  const count = gameState.answerStats[option.id] || 0;
                  return (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} {count === 1 ? "answer" : "answers"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {gameState.phase === "scoring" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Calculating Scores...</h2>
            </Card>
          </div>
        )}

        {gameState.phase === "leaderboard" && (
          <Leaderboard />
        )}

        {gameState.phase === "podium" && (
          <Podium />
        )}
      </div>
    </div>
  );
}

