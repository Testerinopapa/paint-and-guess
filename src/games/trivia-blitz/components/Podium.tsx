import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrivia } from "../state/TriviaContext";
import { Trophy, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview/AvatarPreview";
import { decodeAvatarConfig, type AvatarConfig } from "@/lib/avatar/config";

export default function Podium() {
  const { gameState, leaveRoom } = useTrivia();
  const navigate = useNavigate();
  const podium = gameState.podium;

  const handlePlayAgain = () => {
    // Reset and go back to lobby
    leaveRoom();
    navigate("/hub/games/trivia-blitz");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Final Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* Second Place */}
            {podium.second && (() => {
              let avatarConfig: AvatarConfig | null = null;
              if (podium.second?.avatar) {
                if (typeof podium.second.avatar === 'string') {
                  avatarConfig = decodeAvatarConfig(podium.second.avatar);
                } else {
                  avatarConfig = podium.second.avatar as AvatarConfig;
                }
              }
              return (
                <div className="flex flex-col items-center">
                  <Medal className="w-12 h-12 text-gray-400 mb-2" />
                  <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4 w-32 text-center">
                    {avatarConfig && (
                      <div className="flex justify-center mb-2">
                        <AvatarPreview config={avatarConfig} size={64} />
                      </div>
                    )}
                    <p className="font-bold text-lg mb-1">{podium.second.name}</p>
                    <p className="text-2xl font-bold">{podium.second.score}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">2nd</p>
                </div>
              );
            })()}

            {/* First Place */}
            {podium.first && (() => {
              let avatarConfig: AvatarConfig | null = null;
              if (podium.first?.avatar) {
                if (typeof podium.first.avatar === 'string') {
                  avatarConfig = decodeAvatarConfig(podium.first.avatar);
                } else {
                  avatarConfig = podium.first.avatar as AvatarConfig;
                }
              }
              return (
                <div className="flex flex-col items-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mb-2" />
                  <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-6 w-40 text-center border-2 border-yellow-500">
                    {avatarConfig && (
                      <div className="flex justify-center mb-2">
                        <AvatarPreview config={avatarConfig} size={80} />
                      </div>
                    )}
                    <p className="font-bold text-xl mb-1">{podium.first.name}</p>
                    <p className="text-3xl font-bold">{podium.first.score}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold">1st Place</p>
                </div>
              );
            })()}

            {/* Third Place */}
            {podium.third && (() => {
              let avatarConfig: AvatarConfig | null = null;
              if (podium.third?.avatar) {
                if (typeof podium.third.avatar === 'string') {
                  avatarConfig = decodeAvatarConfig(podium.third.avatar);
                } else {
                  avatarConfig = podium.third.avatar as AvatarConfig;
                }
              }
              return (
                <div className="flex flex-col items-center">
                  <Award className="w-12 h-12 text-orange-600 mb-2" />
                  <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-4 w-32 text-center">
                    {avatarConfig && (
                      <div className="flex justify-center mb-2">
                        <AvatarPreview config={avatarConfig} size={64} />
                      </div>
                    )}
                    <p className="font-bold text-lg mb-1">{podium.third.name}</p>
                    <p className="text-2xl font-bold">{podium.third.score}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">3rd</p>
                </div>
              );
            })()}
          </div>

          <div className="text-center">
            <Button onClick={handlePlayAgain} size="lg">
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

