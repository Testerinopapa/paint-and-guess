import { Link } from "react-router-dom";
import { Settings, List, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HubGame } from "@/games/registry";
import { useIsMobile } from "@/hooks/useIsMobile";

interface GameHeroProps {
  game: HubGame;
  onPlay?: () => void;
  onConfigure?: () => void;
}

export const GameHero = ({ game, onPlay, onConfigure }: GameHeroProps) => {
  const isMobile = useIsMobile();
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
    <div className="relative min-h-[400px] md:min-h-[600px] overflow-hidden rounded-lg border">
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
      <div className="relative z-10 flex h-full min-h-[400px] md:min-h-[600px] flex-col justify-between p-4 md:p-8 text-white">
        {/* Game Info */}
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-lg leading-tight">
            {game.displayName}
          </h1>
          <p className="max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed drop-shadow-md line-clamp-3 md:line-clamp-none">
            {game.displayDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {game.isEnabled ? (
            <Button 
              size={isMobile ? "default" : "lg"}
              onClick={handlePlay}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-5 md:px-8 md:py-6 text-base md:text-lg font-semibold h-12 md:h-auto"
              asChild={!onPlay}
            >
              {onPlay ? (
                <>
                  <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  PLAY
                </>
              ) : (
                <Link to={game.derivedRoute}>
                  <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  PLAY
                </Link>
              )}
            </Button>
          ) : (
            <Button 
              size={isMobile ? "default" : "lg"}
              disabled
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg font-semibold h-12 md:h-auto"
            >
              Unavailable
            </Button>
          )}
          
          {onConfigure || (game as any).hasConfiguration ? (
            <Button 
              size={isMobile ? "default" : "lg"}
              variant="outline"
              onClick={handleConfigure}
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-5 md:px-8 md:py-6 text-base md:text-lg font-semibold backdrop-blur-sm h-12 md:h-auto"
            >
              <Settings className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              CONFIGURE
            </Button>
          ) : null}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 pt-3 md:pt-4 border-t border-white/20">
          {modListUrl && (
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "default"}
              className="text-white hover:bg-white/10 text-xs md:text-sm"
              asChild
            >
              <a href={modListUrl} target="_blank" rel="noopener noreferrer">
                <List className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                MOD LIST
              </a>
            </Button>
          )}
          
          {websiteUrl && (
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "default"}
              className="text-white hover:bg-white/10 sm:ml-auto text-xs md:text-sm"
              asChild
            >
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                OUR SITE
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

