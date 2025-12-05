import { useState } from "react";
import { useChess } from "../state/ChessContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bot, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DIFFICULTY_PRESETS = [
  { label: "Beginner", elo: 1000, depth: 4, description: "Makes frequent mistakes, fast responses" },
  { label: "Intermediate", elo: 1400, depth: 6, description: "Club player level, quick moves" },
  { label: "Advanced", elo: 1800, depth: 8, description: "Strong club player" },
  { label: "Expert", elo: 2200, depth: 10, description: "Master level" },
  { label: "Master", elo: 2600, depth: 12, description: "Grandmaster level" },
  { label: "Maximum", elo: undefined, depth: 14, description: "Full Stockfish strength" },
] as const;

export function AIConfig() {
  const { aiConfig, setAIConfig, resetGame } = useChess();
  const [selectedPreset, setSelectedPreset] = useState<string>("intermediate");
  const [customElo, setCustomElo] = useState<number>(aiConfig.elo || 1500);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetData = DIFFICULTY_PRESETS.find((p) => p.label.toLowerCase() === preset);
    if (presetData) {
      setCustomElo(presetData.elo || 1500);
      setAIConfig({
        enabled: aiConfig.enabled,
        color: aiConfig.color,
        elo: presetData.elo,
        depth: presetData.depth,
      });
    }
  };

  const handleStartGame = () => {
    const presetData = DIFFICULTY_PRESETS.find((p) => p.label.toLowerCase() === selectedPreset);
    const elo = selectedPreset === "custom" 
      ? customElo 
      : presetData?.elo;
    const depth = selectedPreset === "custom"
      ? aiConfig.depth || 8  // Default depth for custom
      : presetData?.depth || 8;
    
    setAIConfig({
      enabled: true,
      color: aiConfig.color,
      elo: elo,
      depth: depth,
    });
    resetGame();
  };

  const handleStopGame = () => {
    setAIConfig({
      enabled: false,
      color: aiConfig.color,
      elo: aiConfig.elo,
      depth: aiConfig.depth,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Opponent
        </CardTitle>
        <CardDescription>Configure AI difficulty and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiConfig.enabled ? (
          <>
            {/* Difficulty Preset */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_PRESETS.map((preset) => (
                    <SelectItem key={preset.label.toLowerCase()} value={preset.label.toLowerCase()}>
                      <div>
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {preset.elo ? `Elo ~${preset.elo}` : "No limit"} • Depth {preset.depth}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Elo</SelectItem>
                </SelectContent>
              </Select>
              {selectedPreset !== "custom" && (
                <p className="text-xs text-muted-foreground">
                  {DIFFICULTY_PRESETS.find((p) => p.label.toLowerCase() === selectedPreset)?.description}
                </p>
              )}
            </div>

            {/* Custom Elo Slider */}
            {selectedPreset === "custom" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Elo: {customElo}</Label>
                  <span className="text-xs text-muted-foreground">1350-2850</span>
                </div>
                <Slider
                  value={[customElo]}
                  onValueChange={([value]) => {
                    const clampedValue = Math.max(1350, Math.min(2850, value));
                    setCustomElo(clampedValue);
                  }}
                  min={1350}
                  max={2850}
                  step={50}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the slider to set a custom Elo rating for the AI
                </p>
              </div>
            )}

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Play as</Label>
              <RadioGroup
                value={aiConfig.color}
                onValueChange={(value) =>
                  setAIConfig({
                    enabled: false,
                    color: value as "white" | "black",
                    elo: aiConfig.elo,
                    depth: aiConfig.depth,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="white" />
                  <Label htmlFor="white" className="cursor-pointer">
                    White (move first)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="black" id="black" />
                  <Label htmlFor="black" className="cursor-pointer">
                    Black (AI moves first)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Start Game Button */}
            <Button onClick={handleStartGame} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Game vs AI
            </Button>
          </>
        ) : (
          <>
            {/* Game Active State */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI Game Active</span>
                <Badge variant="secondary">
                  {aiConfig.elo ? `Elo ${aiConfig.elo}` : "Maximum"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Playing as {aiConfig.color === "white" ? "White" : "Black"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Search depth: {aiConfig.depth || 8}
              </p>
              <Button onClick={handleStopGame} variant="outline" size="sm" className="w-full">
                Stop AI Game
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

