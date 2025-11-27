import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SemanticGuessIndex() {
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = guess.trim();
    if (!value) return;
    setGuesses((prev) => [...prev, value]);
    setGuess("");
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Semantic Guess</CardTitle>
          <CardDescription>
            Daily semantic word puzzle — game hub integration placeholder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Semantic Guess game is now wired into the Game Hub. Semantic similarity scoring
            and daily word selection will be implemented in a later phase.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              placeholder="Type a word guess..."
            />
            <Button type="submit">Guess</Button>
          </form>

          {guesses.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm">Your guesses</h2>
              <ul className="space-y-1 text-sm">
                {guesses.map((word, index) => (
                  <li key={`${word}-${index}`} className="flex items-center justify-between">
                    <span>{word}</span>
                    <span className="text-xs text-muted-foreground">similarity: coming soon</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
