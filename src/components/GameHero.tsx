import { Link } from "react-router-dom";
import { Settings, List, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HubGame } from "@/games/registry";

interface GameHeroProps {
  game: HubGame;
  onPlay?: () => void;
  onConfigure?: () => void;
}

export const GameHero = ({ game, onPlay, onConfigure }: GameHeroProps) => {
  const backgroundImage = game.assets.background || game.assets.thumbnail;
  const websiteUrl = (game.assets as any)?.websiteUrl;
  const modListUrl = (game.assets as any)?.modListUrl;

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      window.location.href = game.derivedRoute;
    }
  };

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
    } else {
      // Navigate to configure route if it exists
      const configureRoute = `${game.derivedRoute}/configure`;
      window.location.href = configureRoute;
    }
  };

  return (
    <div className="relative min-h-[600px] overflow-hidden rounded-lg border">
      {/* Blurred Background */}
      <div className="absolute inset-0">
        <img 
          src={backgroundImage} 
          alt={`${game.displayName} background`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full min-h-[600px] flex-col justify-between p-8 text-white">
        {/* Game Info */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold drop-shadow-lg">{game.displayName}</h1>
          <p className="max-w-2xl text-lg leading-relaxed drop-shadow-md">
            {game.displayDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {game.isEnabled ? (
            <Button 
              size="lg" 
              onClick={handlePlay}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold"
              asChild={!onPlay}
            >
              {onPlay ? (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  PLAY
                </>
              ) : (
                <Link to={game.derivedRoute}>
                  <Play className="mr-2 h-5 w-5" />
                  PLAY
                </Link>
              )}
            </Button>
          ) : (
            <Button 
              size="lg" 
              disabled
              className="px-8 py-6 text-lg font-semibold"
            >
              Unavailable
            </Button>
          )}
          
          {onConfigure || (game as any).hasConfiguration ? (
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleConfigure}
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-6 text-lg font-semibold backdrop-blur-sm"
            >
              <Settings className="mr-2 h-5 w-5" />
              CONFIGURE
            </Button>
          ) : null}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap justify-between gap-4 pt-4 border-t border-white/20">
          {modListUrl && (
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              asChild
            >
              <a href={modListUrl} target="_blank" rel="noopener noreferrer">
                <List className="mr-2 h-4 w-4" />
                MOD LIST
              </a>
            </Button>
          )}
          
          {websiteUrl && (
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 ml-auto"
              asChild
            >
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                OUR SITE
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

