import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import PlayPage from "./Play";
import AnalyzePage from "./Analyze";
import PuzzlePage from "./Puzzle";

export default function ChessIndex() {
  const [gameMode, setGameMode] = useState<"play" | "analyze" | "puzzles">("play");
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Chess</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Play chess with friends, analyze games with Stockfish, or solve puzzles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={gameMode} onValueChange={(v) => setGameMode(v as typeof gameMode)}>
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="play" className="text-xs md:text-sm py-2 md:py-1.5">Play</TabsTrigger>
              <TabsTrigger value="analyze" className="text-xs md:text-sm py-2 md:py-1.5">Analyze</TabsTrigger>
              <TabsTrigger value="puzzles" className="text-xs md:text-sm py-2 md:py-1.5">Puzzles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="play" className="mt-4 md:mt-6">
              <PlayPage />
            </TabsContent>
            
            <TabsContent value="analyze" className="mt-4 md:mt-6">
              <AnalyzePage />
            </TabsContent>
            
            <TabsContent value="puzzles" className="mt-4 md:mt-6">
              <PuzzlePage />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

