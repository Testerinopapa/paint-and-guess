import { ChessProvider } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { GameInfo } from "../components/GameInfo";
import { MobileChessLayoutWrapper } from "../components/MobileChessLayoutWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";

export default function PlayPage() {
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const isMobile = useIsMobile();

  const handleResign = () => {
    toast.info("Resignation feature coming soon");
  };

  const handleOptions = () => {
    toast.info("Options menu coming soon");
  };

  if (isMobile) {
    return (
      <ChessProvider>
        <MobileChessLayoutWrapper
          board={<ChessBoard orientation={orientation} />}
          showMaterial={true}
          showMoveNotation={true}
          onResign={handleResign}
          onOptions={handleOptions}
        />
      </ChessProvider>
    );
  }

  return (
    <ChessProvider>
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 flex flex-col items-center order-2 lg:order-1">
            <Card className="w-full">
              <CardContent className="p-3 md:p-6">
                <div className="flex justify-center mb-3 md:mb-4">
                  <button
                    onClick={() => setOrientation(orientation === "white" ? "black" : "white")}
                    className="text-xs md:text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    Flip Board
                  </button>
                </div>
                <ChessBoard orientation={orientation} />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 order-1 lg:order-2">
            <GameInfo />
          </div>
        </div>
      </div>
    </ChessProvider>
  );
}

