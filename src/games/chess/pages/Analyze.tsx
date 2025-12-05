import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChessProvider, useChess } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiPath } from "@/config/api";
import { Loader2, FileText, BarChart3 } from "lucide-react";

function AnalyzeContent() {
  const { loadFromPgn, exportPgn, gameState, resetGame, game } = useChess();
  const navigate = useNavigate();
  const [pgnInput, setPgnInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

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

  const handleGenerateReport = useCallback(async () => {
    if (!gameState.moves || gameState.moves.length === 0) {
      toast.error("No game to analyze");
      return;
    }

    try {
      setGeneratingReport(true);
      
      // Collect FENs and SANs from the game
      const { Chess } = await import("chess.js");
      const tempGame = new Chess();
      const fens: string[] = [];
      const sans: string[] = [];

      // Start with initial position
      fens.push(tempGame.fen());

      // Replay moves to get FENs
      for (const move of gameState.moves) {
        try {
          tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
          fens.push(tempGame.fen());
          sans.push(move.san);
        } catch (e) {
          console.error("Error replaying move:", e);
        }
      }

      if (fens.length === 0 || sans.length === 0) {
        toast.error("Failed to extract game data");
        return;
      }

      // Generate report
      const response = await fetch(apiPath("/api/report/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fens,
          sans,
          pgn: gameState.pgn,
          depth: 12,
          multiPv: 3,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setReportId(data.id);
      toast.success("Report generated successfully!");
      
      // Navigate to report page
      navigate(`/hub/games/chess/report/${data.id}`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  }, [gameState, navigate]);

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
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleGenerateReport} 
                disabled={generatingReport}
                className="bg-primary"
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Analysis Report
                  </>
                )}
              </Button>
              <Button onClick={handleExportPgn} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export PGN
              </Button>
              <Button onClick={resetGame} variant="outline">
                Clear Game
              </Button>
            </div>
            {reportId && (
              <div className="mt-2">
                <Button
                  variant="link"
                  onClick={() => navigate(`/hub/games/chess/report/${reportId}`)}
                  className="text-sm"
                >
                  View Latest Report →
                </Button>
              </div>
            )}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Analysis Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Move-by-move evaluation with CAPS1-style grading</li>
                <li>Centipawn Loss (CPL) calculation for each move</li>
                <li>Engine agreement detection (MultiPV analysis)</li>
                <li>Only-move detection for critical positions</li>
                <li>Per-side accuracy and ACPL metrics</li>
                <li>Phase breakdown (opening/middlegame/endgame)</li>
              </ul>
            </div>
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

