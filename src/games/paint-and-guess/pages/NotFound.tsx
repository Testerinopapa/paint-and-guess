import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import GameLayout from "@/games/paint-and-guess/components/GameLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <GameLayout title="Paint & Guess" description="We couldn't find that page">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> 404: Not Found
          </CardTitle>
          <CardDescription>Let's get you back to the hub.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            We couldn't find <span className="font-mono text-foreground">{location.pathname}</span>. Please check the
            link or return to the hub to pick a game.
          </p>
          <Button asChild>
            <Link to="/">Return to Hub</Link>
          </Button>
        </CardContent>
      </Card>
    </GameLayout>
  );
};

export default NotFound;
