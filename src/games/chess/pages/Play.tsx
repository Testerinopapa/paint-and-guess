import { ChessProvider } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { GameInfo } from "../components/GameInfo";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function PlayPage() {
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  return (
    <ChessProvider>
      <div className="container mx-auto p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col items-center">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => setOrientation(orientation === "white" ? "black" : "white")}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Flip Board
                  </button>
                </div>
                <ChessBoard orientation={orientation} />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <GameInfo />
          </div>
        </div>
      </div>
    </ChessProvider>
  );
}

