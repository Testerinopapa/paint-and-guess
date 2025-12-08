import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Trophy, Flag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GameCompleteProps {
  won: boolean;
  targetWord: string;
  guessCount: number;
  onShare: () => void;
}

export function GameComplete({ won, targetWord, guessCount, onShare }: GameCompleteProps) {
  const handleShare = () => {
    const text = won 
      ? `I found the word "${targetWord}" in ${guessCount} guesses! 🎯`
      : `I gave up on today's word: "${targetWord}" 🏳️`;
    
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Share your result!',
      });
    }
    onShare();
  };

  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="text-center">
        {won ? (
          <>
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
            <CardTitle className="text-2xl">Congratulations!</CardTitle>
            <CardDescription>
              You found the word in {guessCount} guesses!
            </CardDescription>
          </>
        ) : (
          <>
            <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle className="text-2xl">Game Over</CardTitle>
            <CardDescription>
              Better luck next time!
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">The word was</p>
          <p className="text-3xl font-bold text-primary">{targetWord}</p>
        </div>
        <Button onClick={handleShare} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share Result
        </Button>
        <p className="text-sm text-muted-foreground">
          Come back tomorrow for a new word!
        </p>
      </CardContent>
    </Card>
  );
}

