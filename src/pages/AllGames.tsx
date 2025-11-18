import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AllGames = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Games</h1>
        <p className="text-muted-foreground">
          Explore our collection of party games. More experiences are coming soon!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Paint &amp; Guess</CardTitle>
            <CardDescription>
              Draw prompts, guess your friends&apos; sketches, and keep the points flowing.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button asChild className="w-full">
              <Link to="/games/paint-and-guess">Play now</Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>More games coming soon</CardTitle>
            <CardDescription>
              Stay tuned for new social party experiences. Check back often!
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button variant="outline" className="w-full" disabled>
              Coming soon
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AllGames;
