import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Handshake, X, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlayOptionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraw: () => void;
  onAbort: () => void;
  gameInProgress: boolean;
  hasMoves: boolean;
}

export function PlayOptionsMenu({
  open,
  onOpenChange,
  onDraw,
  onAbort,
  gameInProgress,
  hasMoves,
}: PlayOptionsMenuProps) {
  const [showDrawConfirm, setShowDrawConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  const handleDrawClick = () => {
    if (!gameInProgress || !hasMoves) {
      // If game hasn't started or no moves, just close
      onOpenChange(false);
      return;
    }
    setShowDrawConfirm(true);
  };

  const handleAbortClick = () => {
    if (!gameInProgress) {
      // If game hasn't started, just close
      onOpenChange(false);
      return;
    }
    setShowAbortConfirm(true);
  };

  const confirmDraw = () => {
    onDraw();
    setShowDrawConfirm(false);
    onOpenChange(false);
  };

  const confirmAbort = () => {
    onAbort();
    setShowAbortConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Game Options</SheetTitle>
            <SheetDescription>
              Manage your game
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            {/* Offer Draw Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleDrawClick}
              disabled={!gameInProgress || !hasMoves}
            >
              <Handshake className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Offer Draw</span>
                <span className="text-xs text-muted-foreground">
                  {!hasMoves ? "Make a move first" : "Propose a draw to your opponent"}
                </span>
              </div>
            </Button>

            {/* Abort Game Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
              onClick={handleAbortClick}
              disabled={!gameInProgress}
            >
              <X className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Abort Game</span>
                <span className="text-xs text-muted-foreground">
                  Cancel the current game
                </span>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Draw Confirmation Dialog */}
      <AlertDialog open={showDrawConfirm} onOpenChange={setShowDrawConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Offer Draw?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to offer a draw? In local games, this will end the game as a draw.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDraw}>
              Offer Draw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abort Confirmation Dialog */}
      <AlertDialog open={showAbortConfirm} onOpenChange={setShowAbortConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Abort Game?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to abort this game? This will cancel the current game and start a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAbort} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Abort Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
