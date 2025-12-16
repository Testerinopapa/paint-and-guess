import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Infinity, Flame } from "lucide-react";
import type { PuzzleRushMode } from "../state/puzzleRushTypes";

interface PuzzleRushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (mode: PuzzleRushMode) => void;
}

export function PuzzleRushDialog({ open, onOpenChange, onStart }: PuzzleRushDialogProps) {
  const [selectedMode, setSelectedMode] = useState<PuzzleRushMode | null>(null);

  const modes: Array<{ mode: PuzzleRushMode; title: string; description: string; icon: React.ReactNode }> = [
    {
      mode: "standard-3min",
      title: "3 Minutes",
      description: "Solve as many puzzles as you can in 3 minutes. Three strikes and you're out!",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      mode: "standard-5min",
      title: "5 Minutes",
      description: "Solve as many puzzles as you can in 5 minutes. Three strikes and you're out!",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      mode: "survival",
      title: "Survival",
      description: "No time limit! Solve puzzles until you make 3 mistakes. How long can you last?",
      icon: <Infinity className="h-5 w-5" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Puzzle Rush
          </DialogTitle>
          <DialogDescription>
            Solve as many puzzles as possible! Puzzles get progressively harder. Three incorrect answers end your run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {modes.map((modeInfo) => (
            <Card
              key={modeInfo.mode}
              className={`cursor-pointer transition-all ${
                selectedMode === modeInfo.mode
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedMode(modeInfo.mode)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {modeInfo.icon}
                  {modeInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{modeInfo.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedMode) {
                onStart(selectedMode);
                onOpenChange(false);
              }
            }}
            disabled={!selectedMode}
          >
            Start Puzzle Rush
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

