import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { usePuzzle } from "../state/PuzzleContext";
import { Settings, Puzzle, Flame, Calendar, Shield, Book, BarChart3, Filter } from "lucide-react";
import type { PuzzleDifficulty } from "../state/puzzleTypes";

interface PuzzleSidebarProps {
  difficulty: PuzzleDifficulty;
  setDifficulty: (d: PuzzleDifficulty) => void;
  minRating: string;
  setMinRating: (r: string) => void;
  maxRating: string;
  setMaxRating: (r: string) => void;
  motif: string;
  setMotif: (m: string) => void;
  onLoadPuzzle: () => void;
  loading: boolean;
}

export function PuzzleSidebar({
  difficulty,
  setDifficulty,
  minRating,
  setMinRating,
  maxRating,
  setMaxRating,
  motif,
  setMotif,
  onLoadPuzzle,
  loading,
}: PuzzleSidebarProps) {
  const { pz, idx, solved, pv, playerSide } = usePuzzle();
  const puzzleRating = pz?.rating || 0;
  const streak = 6; // TODO: Implement streak tracking

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            <CardTitle className="text-xl">Puzzles</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info Section */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Think you're faster than most solvers? Try warming up with a Puzzle Battle!
              </p>
            </div>
          </div>

          {/* Rating Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{puzzleRating || 0}</span>
            </div>
            
            {/* Streak Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={(streak / 10) * 100} className="h-2" />
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">{streak}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Button */}
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!loading) {
            onLoadPuzzle();
          }
        }}
        size="lg"
        className="w-full h-12 text-base font-semibold"
        disabled={loading}
      >
        {loading ? "Loading..." : "Solve Puzzles"}
      </Button>

      {/* Puzzle Settings - Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          <CardDescription>Customize puzzle selection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Combined Difficulty + Motif Selection */}
          <div className="space-y-2">
            <Label htmlFor="puzzle-filter">Puzzle Type</Label>
            <Select 
              value={`${difficulty}:${motif || "all"}`} 
              onValueChange={(value) => {
                const [newDifficulty, newMotif] = value.split(":");
                setDifficulty(newDifficulty as PuzzleDifficulty);
                setMotif(newMotif === "all" ? "" : newMotif);
              }}
            >
              <SelectTrigger id="puzzle-filter">
                <SelectValue placeholder="Select puzzle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Easy (0-1400)</SelectLabel>
                  <SelectItem value="easy:all">Easy - All Themes</SelectItem>
                  <SelectItem value="easy:fork">Easy - Fork</SelectItem>
                  <SelectItem value="easy:pin">Easy - Pin</SelectItem>
                  <SelectItem value="easy:skewer">Easy - Skewer</SelectItem>
                  <SelectItem value="easy:hangingPiece">Easy - Hanging Piece</SelectItem>
                  <SelectItem value="easy:mateIn1">Easy - Mate in 1</SelectItem>
                  <SelectItem value="easy:backRankMate">Easy - Back Rank Mate</SelectItem>
                  <SelectItem value="easy:advantage">Easy - Advantage</SelectItem>
                  <SelectItem value="easy:equality">Easy - Equality</SelectItem>
                </SelectGroup>
                
                <SelectSeparator />
                
                <SelectGroup>
                  <SelectLabel>Medium (1400-2000)</SelectLabel>
                  <SelectItem value="medium:all">Medium - All Themes</SelectItem>
                  <SelectItem value="medium:mateIn2">Medium - Mate in 2</SelectItem>
                  <SelectItem value="medium:mateIn3">Medium - Mate in 3</SelectItem>
                  <SelectItem value="medium:deflection">Medium - Deflection</SelectItem>
                  <SelectItem value="medium:discoveredAttack">Medium - Discovered Attack</SelectItem>
                  <SelectItem value="medium:doubleCheck">Medium - Double Check</SelectItem>
                  <SelectItem value="medium:interference">Medium - Interference</SelectItem>
                  <SelectItem value="medium:capturingDefender">Medium - Capturing Defender</SelectItem>
                  <SelectItem value="medium:promotion">Medium - Promotion</SelectItem>
                </SelectGroup>
                
                <SelectSeparator />
                
                <SelectGroup>
                  <SelectLabel>Hard (2000+)</SelectLabel>
                  <SelectItem value="hard:all">Hard - All Themes</SelectItem>
                  <SelectItem value="hard:mateIn4">Hard - Mate in 4</SelectItem>
                  <SelectItem value="hard:zugzwang">Hard - Zugzwang</SelectItem>
                  <SelectItem value="hard:sacrifice">Hard - Sacrifice</SelectItem>
                </SelectGroup>
                
                <SelectSeparator />
                
                <SelectGroup>
                  <SelectLabel>Custom Range</SelectLabel>
                  <SelectItem value="custom:all">Custom - All Themes</SelectItem>
                  <SelectItem value="custom:fork">Custom - Fork</SelectItem>
                  <SelectItem value="custom:pin">Custom - Pin</SelectItem>
                  <SelectItem value="custom:mate">Custom - Mate</SelectItem>
                  <SelectItem value="custom:sacrifice">Custom - Sacrifice</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Rating Range (only shown when custom is selected) */}
          {difficulty === "custom" && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="minRating">Min Rating</Label>
                <Input
                  id="minRating"
                  type="number"
                  placeholder="0"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  min="0"
                  max="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRating">Max Rating</Label>
                <Input
                  id="maxRating"
                  type="number"
                  placeholder="3000"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  min="0"
                  max="3000"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Puzzle Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">More Puzzles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            <Flame className="mr-2 h-4 w-4" />
            Puzzle Rush
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Daily Puzzle
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Shield className="mr-2 h-4 w-4" />
            Puzzle Battle
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            <Book className="mr-2 h-4 w-4" />
            Custom Puzzles
          </Button>
        </CardContent>
      </Card>

      {/* Stats Link */}
      <Button variant="ghost" className="w-full justify-start" disabled>
        <BarChart3 className="mr-2 h-4 w-4" />
        Stats
      </Button>

      {/* Current Puzzle Info */}
      {pz && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Puzzle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-semibold">
                You are: <span className="capitalize ml-1">{playerSide}</span>
              </Badge>
            </div>
            {pz.rating && (
              <div className="text-sm text-muted-foreground">
                Rating: {pz.rating}
              </div>
            )}
            {pz.motifs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pz.motifs.slice(0, 3).map((m, moveIdx) => (
                  <Badge key={moveIdx} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
            {!solved && (
              <div className="text-sm text-muted-foreground">
                Move {idx + 1} / {pv.length}
              </div>
            )}
            {solved && (
              <Badge variant="default" className="bg-green-600">
                ✓ Solved!
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

