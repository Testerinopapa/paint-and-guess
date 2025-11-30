import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Users, Volume2, VolumeX, Link2, Settings } from "lucide-react";
import { useCanva } from "../state/CanvaContext";
import { PlayerAvatar } from "./PlayerAvatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AvatarConfig, encodeAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";

interface LobbyStageProps {
  onLeaveRoom: () => void;
}

// Game presets based on word packs
const GAME_PRESETS = [
  {
    id: "classic",
    name: "Normal",
    icon: "🎯",
    description: "Classic mix of words",
    wordPack: "classic",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "animals",
    name: "Animals",
    icon: "🐾",
    description: "All creatures great and small",
    wordPack: "animals",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "food",
    name: "Food",
    icon: "🍕",
    description: "Delicious dishes",
    wordPack: "food",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌲",
    description: "The great outdoors",
    wordPack: "nature",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "actions",
    name: "Actions",
    icon: "🏃",
    description: "Things you do",
    wordPack: "actions",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "objects",
    name: "Objects",
    icon: "📦",
    description: "Everyday items",
    wordPack: "objects",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "places",
    name: "Places",
    icon: "🏛️",
    description: "Locations around the world",
    wordPack: "places",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "emotions",
    name: "Emotions",
    icon: "❤️",
    description: "Feelings and emotions",
    wordPack: "emotions",
    roundTime: 60,
    maxRounds: 6,
  },
  {
    id: "custom",
    name: "Custom",
    icon: "⚙️",
    description: "Custom settings",
    wordPack: "classic",
    roundTime: 60,
    maxRounds: 6,
  },
];

const MAX_PLAYERS_OPTIONS = [2, 4, 6, 8, 10, 12, 14];

export function LobbyStage({ onLeaveRoom }: LobbyStageProps) {
  const navigate = useNavigate();
  const { gameState, isHost, setReady, startGame, updateAvatar } = useCanva();
  const [selectedPreset, setSelectedPreset] = useState("classic");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [presetSettings, setPresetSettings] = useState<{
    wordPack: string;
    roundTime: number;
    maxRounds: number;
  }>({
    wordPack: "classic",
    roundTime: 60,
    maxRounds: 6,
  });
  
  const playerCount = gameState.players.length;
  const activePreset = GAME_PRESETS.find(p => p.id === selectedPreset) || GAME_PRESETS[0];
  const canStart = isHost && gameState.allPlayersReady && playerCount >= 2;

  // Listen for avatar updates and update player avatar in room
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AvatarConfig>).detail;
      if (detail && gameState.roomId) {
        // Encode avatar config and send to server
        const encodedAvatar = encodeAvatarConfig(detail);
        updateAvatar(encodedAvatar);
      }
    };

    window.addEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    };
  }, [gameState.roomId, updateAvatar]);

  // Update settings when preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = GAME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPresetSettings({
        wordPack: preset.wordPack,
        roundTime: preset.roundTime,
        maxRounds: preset.maxRounds,
      });
    }
  };

  const handleReadyToggle = () => {
    setReady(!gameState.isReady);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleInvite = async () => {
    if (!gameState.gamePin) {
      toast.error("No game PIN available");
      return;
    }

    try {
      // Copy PIN to clipboard
      await navigator.clipboard.writeText(gameState.gamePin);
      toast.success(`Game PIN copied: ${gameState.gamePin}`);
    } catch (error) {
      // Fallback: try Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Join my Canva game!",
            text: `Game PIN: ${gameState.gamePin}`,
          });
          toast.success("Game PIN shared!");
        } catch (shareError) {
          // If share is cancelled or fails, show PIN in toast
          toast.info(`Game PIN: ${gameState.gamePin}`);
        }
      } else {
        // Last resort: show PIN in toast
        toast.info(`Game PIN: ${gameState.gamePin}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeaveRoom}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">CANVA</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-2"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
      </header>

      {/* Main Content - Three Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-4 p-4 overflow-y-auto">
          {/* Left Column - Players */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-4 h-4" />
                PLAYERS {playerCount}/{maxPlayers}
              </CardTitle>
              {isHost && (
                <Select
                  value={maxPlayers.toString()}
                  onValueChange={(value) => setMaxPlayers(parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue>{maxPlayers} PLAYERS</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MAX_PLAYERS_OPTIONS.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} PLAYERS
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {/* Ready Toggle Button */}
              <Button
                onClick={handleReadyToggle}
                variant={gameState.isReady ? "default" : "outline"}
                className="w-full mb-2"
                disabled={playerCount < 2}
              >
                {gameState.isReady ? "✓ Ready" : "Not Ready"}
              </Button>

              {/* Player List */}
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded border bg-card"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
                    <span
                      className={`text-sm truncate ${
                        player.id === gameState.selfId ? "font-bold" : ""
                      }`}
                    >
                      {player.name}
                      {player.id === gameState.selfId && " (You)"}
                    </span>
                    {player.id === gameState.ownerId && (
                      <span className="text-lg">👑</span>
                    )}
                  </div>
                  {player.isReady && (
                    <span className="text-xs text-green-600 font-semibold whitespace-nowrap">
                      ✓ Ready
                    </span>
                  )}
                </div>
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, maxPlayers - playerCount) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-between p-2 rounded border border-dashed bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">👤</span>
                    </div>
                    <span className="text-sm text-muted-foreground">EMPTY</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Center Column - Presets */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base sm:text-lg">PRESETS</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {GAME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`aspect-square flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all relative ${
                      selectedPreset === preset.id
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border hover:border-primary/50 hover:scale-102"
                    }`}
                  >
                    <span className="text-2xl mb-1">{preset.icon}</span>
                    <span className="text-xs font-medium text-center">{preset.name}</span>
                    {selectedPreset === preset.id && (
                      <Settings className="w-3 h-3 absolute top-1 left-1 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Custom Settings */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-base sm:text-lg">CUSTOM SETTINGS</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {selectedPreset && (
                <>
                  <div className="space-y-2">
                    <Label>Word Pack</Label>
                    <Select
                      value={presetSettings.wordPack}
                      onValueChange={(value) => {
                        setPresetSettings(prev => ({ ...prev, wordPack: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="animals">Animals</SelectItem>
                        <SelectItem value="food">Food & Drinks</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="actions">Actions</SelectItem>
                        <SelectItem value="objects">Objects</SelectItem>
                        <SelectItem value="places">Places</SelectItem>
                        <SelectItem value="emotions">Emotions</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Round Time (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="120"
                      step="10"
                      value={presetSettings.roundTime}
                      onChange={(e) => {
                        setPresetSettings(prev => ({
                          ...prev,
                          roundTime: parseInt(e.target.value) || 60,
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Rounds</Label>
                    <Input
                      type="number"
                      min="3"
                      max="10"
                      step="1"
                      value={presetSettings.maxRounds}
                      onChange={(e) => {
                        setPresetSettings(prev => ({
                          ...prev,
                          maxRounds: parseInt(e.target.value) || 6,
                        }));
                      }}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {activePreset.description}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-4 px-4 py-3 border-t bg-card">
        <Button
          variant="outline"
          onClick={handleInvite}
          disabled={!gameState.gamePin}
          className="flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          INVITE
        </Button>
        <Button
          onClick={handleStartGame}
          disabled={!canStart}
          size="lg"
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          START
        </Button>
      </footer>
    </div>
  );
}
