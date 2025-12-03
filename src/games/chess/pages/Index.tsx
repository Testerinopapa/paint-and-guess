import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import PlayPage from "./Play";
import AnalyzePage from "./Analyze";

export default function ChessIndex() {
  const [gameMode, setGameMode] = useState<"play" | "analyze" | "puzzles">("play");
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Chess</CardTitle>
          <CardDescription>
            Play chess with friends, analyze games with Stockfish, or solve puzzles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={gameMode} onValueChange={(v) => setGameMode(v as typeof gameMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="play">Play</TabsTrigger>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              <TabsTrigger value="puzzles">Puzzles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="play" className="mt-6">
              <PlayPage />
            </TabsContent>
            
            <TabsContent value="analyze" className="mt-6">
              <AnalyzePage />
            </TabsContent>
            
            <TabsContent value="puzzles" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chess Puzzles</CardTitle>
                  <CardDescription>Solve tactical puzzles to improve your chess skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button size="lg">Random Puzzle</Button>
                    <Button size="lg" variant="outline">Filter by Difficulty</Button>
                    <Button size="lg" variant="outline">Filter by Motif</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Puzzle mode coming soon. This will include difficulty levels and motif filtering (tactics, endgames, etc.).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

