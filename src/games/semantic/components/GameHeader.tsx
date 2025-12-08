import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Lightbulb, Flag, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GameHeaderProps {
  onHint: () => void;
  onGiveUp: () => void;
  hintsRemaining: number;
  guessCount: number;
}

export function GameHeader({ onHint, onGiveUp, hintsRemaining, guessCount }: GameHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Semantic</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to Play</DialogTitle>
              <DialogDescription className="space-y-2 pt-2">
                <p>Guess the secret word by typing related words.</p>
                <p>The closer your guess is semantically, the higher the rank!</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><span className="text-green-500">Rank 1</span> - Very close or exact match</li>
                  <li><span className="text-yellow-500">Rank 2</span> - Related word</li>
                  <li><span className="text-orange-500">Rank 3</span> - Somewhat related</li>
                  <li><span className="text-muted-foreground">?</span> - Not in database</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Guesses: {guessCount}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onHint} disabled={hintsRemaining <= 0}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Get Hint ({hintsRemaining} left)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onGiveUp} className="text-destructive">
              <Flag className="h-4 w-4 mr-2" />
              Give Up
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

