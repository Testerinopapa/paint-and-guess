import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer, Trophy, Users, Bot, GraduationCap, ArrowLeft } from "lucide-react";

interface NewGameMenuProps {
  onStartGame: (timeLimit?: number, mode?: string) => void;
  onCancel?: () => void;
}

type PlayMode = "local" | "ai" | "friend" | "tournament" | "coach";

const TIME_OPTIONS = [
  { label: "1 min", value: 1 },
  { label: "3 min", value: 3 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "Unlimited", value: 0 },
];

export function NewGameMenu({ onStartGame, onCancel }: NewGameMenuProps) {
  const navigate = useNavigate();
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [selectedMode, setSelectedMode] = useState<PlayMode | null>(null);

  const handleModeSelect = (mode: PlayMode) => {
    setSelectedMode(mode);
    // For now, immediately start the game with the selected mode
    // In the future, this could navigate to different setup screens
    onStartGame(timeLimit, mode);
  };

  const handleStartGame = () => {
    // Start with default local mode if no mode selected
    onStartGame(timeLimit, selectedMode || "local");
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 md:hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-card border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel || (() => navigate(-1))}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-xl">♟️</span>
          <span className="text-lg font-bold">New Game</span>
        </div>
        
        {/* Spacer to balance the back button */}
        <div className="w-9" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Time Selection */}
        <div className="bg-card rounded-lg shadow-md border-0 p-0 overflow-hidden">
          <Select
            value={timeLimit.toString()}
            onValueChange={(value) => setTimeLimit(parseInt(value))}
          >
            <SelectTrigger className="h-14 bg-card border-0 shadow-none rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Timer className="h-6 w-6 text-green-600" />
                <SelectValue className="text-base font-medium">
                  {TIME_OPTIONS.find((opt) => opt.value === timeLimit)?.label || "10 min"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Game Button */}
        <Button
          onClick={handleStartGame}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-lg rounded-lg"
          size="lg"
        >
          Start Game
        </Button>

        {/* Play Mode Options */}
        <div className="space-y-3 mt-6">
          <ModeButton
            icon={<Trophy className="h-6 w-6 text-yellow-600" />}
            label="Tournaments"
            onClick={() => handleModeSelect("tournament")}
          />
          
          <ModeButton
            icon={<Users className="h-6 w-6 text-blue-600" />}
            label="Play a Friend"
            onClick={() => handleModeSelect("friend")}
          />
          
          <ModeButton
            icon={<Bot className="h-6 w-6 text-cyan-600" />}
            label="Play Bots"
            onClick={() => handleModeSelect("ai")}
          />
          
          <ModeButton
            icon={<GraduationCap className="h-6 w-6 text-purple-600" />}
            label="Play Coach"
            onClick={() => handleModeSelect("coach")}
          />
        </div>

        {/* Scroll indicator (optional) */}
        <div className="flex justify-center pt-4">
          <span className="text-muted-foreground text-sm">⌄</span>
        </div>
      </div>
    </div>
  );
}

interface ModeButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ModeButton({ icon, label, onClick }: ModeButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full h-14 bg-card border-0 shadow-md hover:bg-muted/50 justify-start gap-4 text-base font-medium rounded-lg"
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
    </Button>
  );
}
