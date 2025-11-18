import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gameRegistry } from "@/games/registry";
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
        {gameRegistry.map((game) => (
          <Card key={game.id} className="flex flex-col overflow-hidden">
            <img
              src={game.thumbnail}
              alt={`${game.name} thumbnail`}
              className="h-40 w-full object-cover"
            />
            <CardHeader className="flex-1 space-y-2">
              <CardTitle>{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              {game.route === "#" ? (
                <Button variant="outline" className="w-full" disabled>
                  Coming soon
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={game.route}>Play now</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AllGames;
