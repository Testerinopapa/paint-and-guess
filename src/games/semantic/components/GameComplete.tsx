import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Trophy, Flag } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface GameCompleteProps {
  won: boolean;
  targetWord: string;
  guessCount: number;
  onShare: () => void;
}

export function GameComplete({ won, targetWord, guessCount, onShare }: GameCompleteProps) {
  const { toast } = useToast();
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-similarity-excellent">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Congratulations!</CardTitle>
            <CardDescription>
              You found the word <span className="font-bold capitalize">"{targetWord}"</span> in {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}!
            </CardDescription>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Flag className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Game Over</CardTitle>
            <CardDescription>
              The word was <span className="font-bold capitalize">"{targetWord}"</span>. Better luck tomorrow!
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleShare} className="w-full" size="lg">
          <Share2 className="mr-2 h-4 w-4" />
          Share Result
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New word available tomorrow!
        </p>
      </CardContent>
    </Card>
  );
}

