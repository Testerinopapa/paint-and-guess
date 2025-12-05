import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiPath } from "@/config/api";
import { ChessBoard } from "../components/ChessBoard";
import { EvalGraph } from "../components/EvalGraph";
import { Chess } from "chess.js";
import { Loader2, ArrowLeft, Download } from "lucide-react";

interface PerMove {
  ply: number;
  cpl: number;
  tag: string;
  agreement: boolean;
  onlyMove: boolean;
  bestPv?: string[];
  playedPv?: string[];
  phase: "opening" | "middlegame" | "endgame";
  symbol?: string;
  note?: string;
}

interface Aggregates {
  acplWhite: number;
  acplBlack: number;
  accuracyWhite: number;
  accuracyBlack: number;
  tagCounts: Record<string, number>;
  phases: {
    opening: {
      acplWhite: number;
      acplBlack: number;
      accuracyWhite: number;
      accuracyBlack: number;
      tagCounts: Record<string, number>;
    };
    middlegame: {
      acplWhite: number;
      acplBlack: number;
      accuracyWhite: number;
      accuracyBlack: number;
      tagCounts: Record<string, number>;
    };
    endgame: {
      acplWhite: number;
      acplBlack: number;
      accuracyWhite: number;
      accuracyBlack: number;
      tagCounts: Record<string, number>;
    };
  };
}

interface ReportDetails {
  id: string;
  perMove: PerMove[];
  aggregates: Aggregates;
}

const TAG_COLORS: Record<string, string> = {
  Best: "bg-green-100 text-green-800 border-green-300",
  Excellent: "bg-blue-100 text-blue-800 border-blue-300",
  Good: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Inaccuracy: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Mistake: "bg-orange-100 text-orange-800 border-orange-300",
  Blunder: "bg-red-100 text-red-800 border-red-300",
};

const SYMBOL_MAP: Record<string, string> = {
  "!!": "!!",
  "!": "!",
  "?!": "?!",
  "?": "?",
  "??": "??",
};

function getSymbol(tag: string, cpl: number, agreement: boolean, onlyMove: boolean): string {
  if (tag === "Blunder") return "??";
  if (tag === "Mistake") return "?";
  if (tag === "Inaccuracy") return "?!";
  if (tag === "Excellent") return "!!";
  if (tag === "Best" || tag === "Good") {
    return cpl <= 30 && agreement ? "!!" : "!";
  }
  return "";
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPly, setSelectedPly] = useState<number>(0);
  const [game, setGame] = useState<Chess | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // Always use the details endpoint which has full analysis
        const url = apiPath("/api/report/latest/details");
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to load report");
        }
        
        const data = await response.json();
        setReport(data);
        
        // Initialize chess game - start from initial position
        const newGame = new Chess();
        setGame(newGame);
        setSelectedPly(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const keyMoments = useMemo(() => {
    if (!report?.perMove) return [];
    
    return report.perMove
      .map((pm) => ({ ply: pm.ply - 1, tag: pm.tag, cpl: pm.cpl }))
      .filter((x) => x.tag === "Blunder" || x.tag === "Mistake" || x.cpl >= 150)
      .sort((a, b) => {
        const rank = (t: string) =>
          t === "Blunder" ? 3 : t === "Mistake" ? 2 : t === "Inaccuracy" ? 1 : 0;
        return rank(b.tag) - rank(a.tag) || Math.abs(b.cpl) - Math.abs(a.cpl);
      })
      .slice(0, 10);
  }, [report]);

  const cpToY = useCallback((cp: number) => {
    const maxAbs = 1000;
    const clamped = Math.max(-maxAbs, Math.min(maxAbs, cp));
    return 50 - (clamped / maxAbs) * 40;
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Report not found"}
            </p>
            <Link to="/hub/games/chess">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chess
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Analysis Report</h1>
          <p className="text-muted-foreground mt-1">
            Detailed move-by-move analysis with CAPS1 grading
          </p>
        </div>
        <Link to="/hub/games/chess">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {report.aggregates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">White Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.aggregates.accuracyWhite.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ACPL: {(report.aggregates.acplWhite / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Black Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.aggregates.accuracyBlack.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ACPL: {(report.aggregates.acplBlack / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.perMove.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {report.perMove.filter((m) => m.phase === "opening").length} opening,{" "}
                {report.perMove.filter((m) => m.phase === "middlegame").length} middlegame,{" "}
                {report.perMove.filter((m) => m.phase === "endgame").length} endgame
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(report.aggregates.tagCounts.Blunder || 0) +
                  (report.aggregates.tagCounts.Mistake || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {report.aggregates.tagCounts.Blunder || 0} blunders,{" "}
                {report.aggregates.tagCounts.Mistake || 0} mistakes
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eval Graph */}
      <EvalGraph
        perMove={report.perMove}
        selectedPly={selectedPly}
        onPlyClick={setSelectedPly}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
            </CardHeader>
            <CardContent>
              {game && (
                <div className="flex justify-center">
                  <ChessBoard 
                    fen={selectedPly === 0 ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : game.fen()} 
                  />
                </div>
              )}
              {selectedPly > 0 && report.perMove[selectedPly - 1] && (
                <div className="mt-4 text-sm">
                  <div className="font-medium">Move {selectedPly}</div>
                  <div className="text-muted-foreground">
                    {report.perMove[selectedPly - 1].tag} ({report.perMove[selectedPly - 1].cpl} cp)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Move List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Move Analysis</CardTitle>
              <CardDescription>
                Click a move to view the position and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {report.perMove.map((move, idx) => {
                  const symbol = getSymbol(move.tag, move.cpl, move.agreement, move.onlyMove);
                  const moveNumber = Math.floor(move.ply / 2) + 1;
                  const isWhite = move.ply % 2 === 1;
                  const san = move.playedPv?.[0] || `Move ${move.ply}`;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPly === move.ply
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedPly(move.ply)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-muted-foreground min-w-[3rem]">
                          {moveNumber}.{isWhite ? "" : ".."}
                        </span>
                        <span className="font-medium">{san}</span>
                        {symbol && (
                          <Badge variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        )}
                        <Badge
                          className={`text-xs ${TAG_COLORS[move.tag] || "bg-gray-100 text-gray-800"}`}
                        >
                          {move.tag}
                        </Badge>
                        {move.agreement && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            agrees
                          </Badge>
                        )}
                        {move.onlyMove && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            only
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {move.cpl} cp
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {move.phase}
                        </Badge>
                      </div>
                      {selectedPly === move.ply && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                          {move.bestPv && move.bestPv.length > 0 && (
                            <div>
                              <span className="font-medium">Best PV: </span>
                              <span className="font-mono">{move.bestPv.slice(0, 5).join(" ")}</span>
                            </div>
                          )}
                          {move.playedPv && move.playedPv.length > 1 && (
                            <div>
                              <span className="font-medium">Played PV: </span>
                              <span className="font-mono">{move.playedPv.slice(0, 5).join(" ")}</span>
                            </div>
                          )}
                          {move.note && (
                            <div className="text-muted-foreground italic">{move.note}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Moments */}
      {keyMoments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Moments</CardTitle>
            <CardDescription>Critical moves and blunders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyMoments.map((moment, idx) => {
                const move = report.perMove[moment.ply];
                if (!move) return null;
                return (
                  <div key={idx} className="p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge className={TAG_COLORS[move.tag] || "bg-gray-100"}>
                        {move.tag}
                      </Badge>
                      <span className="text-sm">Move {moment.ply + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {move.cpl} cp loss
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

