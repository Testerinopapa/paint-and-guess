import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameRegistry } from "@/games/registry";
import GameCard from "@/components/GameCard";
import MobileGamePath from "@/components/MobileGamePath";

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_GAME_HUB_DEBUG === "true";

const LoadingCards = () => {
  if (DEBUG) {
    console.debug("[hub] Rendering loading skeletons for AllGames");
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-lg bg-game-card overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            ease: "easeOut"
          }}
        >
          <div className="aspect-[3/4]">
            <Skeleton className="h-full w-full animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Helper to get "last played" time
const getLastPlayed = (gameId: string): string | undefined => {
  const lastPlayed = localStorage.getItem(`game-last-played-${gameId}`);
  if (!lastPlayed) return undefined;
  
  const date = new Date(lastPlayed);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return diffMins <= 1 ? "just now" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
};

const AllGames = () => {
  const { games, isLoading, error, source } = useGameRegistry();
  const [lastPlayedMap, setLastPlayedMap] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load last played times
  useEffect(() => {
    const map: Record<string, string> = {};
    games.forEach(game => {
      const lastPlayed = getLastPlayed(game.id);
      if (lastPlayed) {
        map[game.id] = lastPlayed;
      }
    });
    setLastPlayedMap(map);
  }, [games]);

  useEffect(() => {
    if (!DEBUG) return;
    console.debug("[hub] AllGames state updated", {
      loading: isLoading,
      error: error instanceof Error ? error.message : error ?? null,
      source,
      gameCount: games.length,
    });
  }, [games.length, isLoading, error, source]);


  if (isLoading) {
    return <LoadingCards />;
  }

  const errorMessage = error instanceof Error ? error.message : error ? "Unable to load CMS registry" : null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] // Custom easing for smooth animation
      }
    }
  };

  const headerVariants = {
    hidden: { 
      opacity: 0, 
      y: -20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div>
      <motion.div 
        className="mb-6 md:mb-8"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-2xl md:text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          My Games
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-sm md:text-base"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Your gaming library
        </motion.p>
      </motion.div>
      
      {/* Mobile Path View */}
      {isMobile ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <MobileGamePath
            games={games}
            lastPlayedMap={lastPlayedMap}
            onPlay={(gameId) => {
              setLastPlayedMap(prev => ({
                ...prev,
                [gameId]: "just now"
              }));
            }}
          />
        </motion.div>
      ) : (
        /* Desktop Grid View */
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {games.map((game, index) => {
              if (DEBUG) {
                console.debug("[hub] Rendering tile", {
                  id: game.id,
                  status: game.status,
                  enabled: game.isEnabled,
                  route: game.derivedRoute,
                });
              }
              return (
                <motion.div
                  key={game.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GameCard
                    game={game}
                    lastPlayed={lastPlayedMap[game.id]}
                    onPlay={(gameId) => {
                      // Update last played map immediately for UI feedback
                      setLastPlayedMap(prev => ({
                        ...prev,
                        [gameId]: "just now"
                      }));
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default AllGames;

