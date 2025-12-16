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
    <div className="flex items-center justify-between w-full max-w-md">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Semantic</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to Play</DialogTitle>
              <DialogDescription className="space-y-3 pt-4">
                <p>Guess the secret word by entering similar words.</p>
                <p>Each guess receives a <strong>rank</strong> based on semantic similarity to the target word.</p>
                <p className="text-sm">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--similarity-perfect))' }} />
                  Rank 1 = Perfect match
                </p>
                <p className="text-sm">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--similarity-excellent))' }} />
                  Rank 2-10 = Excellent
                </p>
                <p className="text-sm">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--similarity-great))' }} />
                  Rank 11-50 = Great
                </p>
                <p className="text-sm">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--similarity-good))' }} />
                  Rank 51-100 = Good
                </p>
                <p className="text-sm">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--similarity-cold))' }} />
                  Higher ranks = Colder
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onHint} disabled={hintsRemaining === 0}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Get Hint ({hintsRemaining} left)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onGiveUp} className="text-destructive">
              <Flag className="mr-2 h-4 w-4" />
              Give Up
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

