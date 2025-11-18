import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/games/paint-and-guess/state/GameContext";
import Index from "@/games/paint-and-guess/pages/Index";
import Lobby from "@/games/paint-and-guess/pages/Lobby";
import Room from "@/games/paint-and-guess/pages/Room";
import NotFound from "@/games/paint-and-guess/pages/NotFound";

const queryClient = new QueryClient();

export const PaintAndGuessApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GameProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/single" element={<Index />} />
            <Route path="/room/:roomId" element={<Room />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
