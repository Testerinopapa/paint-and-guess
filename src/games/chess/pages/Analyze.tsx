import { useState, useRef } from "react";
import { ChessProvider, useChess } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function AnalyzeContent() {
  const { loadFromPgn, exportPgn, gameState, resetGame } = useChess();
  const [pgnInput, setPgnInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportPgn = () => {
    if (!pgnInput.trim()) {
      toast.error("Please enter a PGN string");
      return;
    }

    const success = loadFromPgn(pgnInput);
    if (success) {
      toast.success("PGN loaded successfully!");
      setPgnInput("");
    } else {
      toast.error("Failed to load PGN. Please check the format.");
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = loadFromPgn(content);
      if (success) {
        toast.success("PGN file loaded successfully!");
        setPgnInput("");
      } else {
        toast.error("Failed to load PGN file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportPgn = () => {
    const pgn = exportPgn();
    if (!pgn) {
      toast.error("No game to export");
      return;
    }

    const blob = new Blob([pgn], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chess-game-${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PGN exported successfully!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import PGN</CardTitle>
          <CardDescription>Load a game from PGN notation or file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pgn-input">PGN String</Label>
            <Textarea
              id="pgn-input"
              placeholder="Paste PGN notation here..."
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              rows={6}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleImportPgn}>Import PGN</Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Import from File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pgn,.txt"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {gameState.moves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Game Analysis</CardTitle>
            <CardDescription>View and analyze the loaded game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ChessBoard />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportPgn} variant="outline">
                Export PGN
              </Button>
              <Button onClick={resetGame} variant="outline">
                Clear Game
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Stockfish analysis integration coming soon. This will provide move-by-move analysis, 
              blunder detection, and CAPS1-style grading.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <ChessProvider>
      <AnalyzeContent />
    </ChessProvider>
  );
}

