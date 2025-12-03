import { useState } from "react";
import { PuzzleProvider, usePuzzle } from "../state/PuzzleContext";
import { PuzzleBoard } from "../components/PuzzleBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PuzzleDifficulty, PuzzleFilters } from "../state/puzzleTypes";

const MOTIFS = [
  // Easy
  "advantage", "fork", "pin", "mateIn1", "oneMove", "hangingPiece", "trappedPiece",
  "equality", "arabianMate", "attackingF2F7", "backRankMate", "bodenMate",
  "doubleBishopMate", "hookMate", "skewer",
  // Medium
  "mateIn2", "mateIn3", "deflection", "discoveredAttack", "doubleCheck",
  "advancedPawn", "attraction", "capturingDefender", "clearance", "exposedKing",
  "interference", "intermezzo", "kingsideAttack", "promotion", "queensideAttack", "xRayAttack",
  // Hard
  "mateIn4", "zugzwang",
  // Other
  "mate", "sacrifice", "short", "smotheredMate",
];

function PuzzlesContent() {
  const { loadRandomPuzzle, loading } = usePuzzle();
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("medium");
  const [minRating, setMinRating] = useState<string>("");
  const [maxRating, setMaxRating] = useState<string>("");
  const [motif, setMotif] = useState<string>("");

  const handleLoadPuzzle = () => {
    const filters: PuzzleFilters = {
      difficulty: difficulty === "custom" ? undefined : difficulty,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      motif: motif || undefined,
    };
    loadRandomPuzzle(filters);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Puzzle Settings</CardTitle>
          <CardDescription>Choose difficulty, rating range, or motif to filter puzzles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as PuzzleDifficulty)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (0-1400)</SelectItem>
                  <SelectItem value="medium">Medium (1400-2000)</SelectItem>
                  <SelectItem value="hard">Hard (2000+)</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {difficulty === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="minRating">Min Rating</Label>
                  <Input
                    id="minRating"
                    type="number"
                    placeholder="0"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRating">Max Rating</Label>
                  <Input
                    id="maxRating"
                    type="number"
                    placeholder="10000"
                    value={maxRating}
                    onChange={(e) => setMaxRating(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="motif">Motif (Optional)</Label>
              <Select value={motif} onValueChange={setMotif}>
                <SelectTrigger id="motif">
                  <SelectValue placeholder="All motifs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All motifs</SelectItem>
                  {MOTIFS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleLoadPuzzle} size="lg" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "New Puzzle"}
          </Button>
        </CardContent>
      </Card>

      {/* Puzzle Board */}
      <PuzzleBoard />
    </div>
  );
}

export default function PuzzlesPage() {
  return (
    <PuzzleProvider>
      <PuzzlesContent />
    </PuzzleProvider>
  );
}

