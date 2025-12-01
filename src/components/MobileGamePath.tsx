import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Check, Lock } from "lucide-react";
import type { HubGame } from "@/games/registry";

interface MobileGamePathProps {
  games: HubGame[];
  lastPlayedMap: Record<string, string>;
  onPlay?: (gameId: string) => void;
}

const MobileGamePath = ({ games, lastPlayedMap, onPlay }: MobileGamePathProps) => {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Group games by category
  const groupedGames = games.reduce((acc, game) => {
    const category = game.category?.[0] || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(game);
    return acc;
  }, {} as Record<string, HubGame[]>);

  const handlePlay = (game: HubGame) => {
    if (game.isEnabled) {
      if (onPlay) {
        onPlay(game.id);
      }
      localStorage.setItem(`game-last-played-${game.id}`, new Date().toISOString());
      navigate(game.derivedRoute);
    }
  };

  const handleImageError = (gameId: string) => {
    setImageErrors(prev => new Set(prev).add(gameId));
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const unitVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const gameItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(groupedGames).map(([category, categoryGames], categoryIndex) => {
        const firstUnplayedIndex = categoryGames.findIndex(game => !lastPlayedMap[game.id] && game.isEnabled);
        
        return (
          <motion.div 
            key={category} 
            className="space-y-4"
            variants={unitVariants}
          >
            {/* Unit Header */}
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
            >
              <div>
                <h2 className="text-xl font-bold">Unit {categoryIndex + 1}</h2>
                <p className="text-sm text-muted-foreground capitalize">{category} games</p>
              </div>
            </motion.div>

            {/* Path Container */}
            <div className="relative pl-8">
              {/* Vertical Path Line */}
              <motion.div 
                className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 + 0.2, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
              />
              
              {/* Game Nodes */}
              <div className="space-y-6">
                <AnimatePresence>
                  {categoryGames.map((game, gameIndex) => {
                  const hasPlayed = lastPlayedMap[game.id];
                  const isCurrent = gameIndex === firstUnplayedIndex && game.isEnabled;
                  const isLocked = !game.isEnabled;
                  const imagePath = game.assets.background || game.assets.thumbnail || '';
                  const baseUrl = import.meta.env.BASE_URL || '/';
                  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
                  const cardImage = `${baseUrl}${normalizedPath}`;
                  const hasError = imageErrors.has(game.id);

                  return (
                    <motion.div 
                      key={game.id} 
                      className="relative flex items-center gap-4"
                      variants={gameItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Path Node */}
                      <motion.div 
                        className="relative z-10 flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: categoryIndex * 0.1 + gameIndex * 0.05 + 0.3,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                      >
                        {hasPlayed ? (
                          <motion.div 
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-6 h-6 text-primary-foreground" />
                          </motion.div>
                        ) : isCurrent ? (
                          <motion.button
                            onClick={() => handlePlay(game)}
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ 
                              scale: [1, 1.05, 1],
                            }}
                            transition={{ 
                              hover: { duration: 0.2 },
                              tap: { duration: 0.1 },
                              animate: { 
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                              }
                            }}
                          >
                            <Play className="w-6 h-6 text-primary-foreground fill-current" />
                          </motion.button>
                        ) : isLocked ? (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-secondary border-2 border-border flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-muted" />
                          </div>
                        )}
                      </motion.div>

                      {/* Game Card */}
                      <motion.div
                        onClick={() => !isLocked && handlePlay(game)}
                        className={`flex-1 flex items-center gap-3 p-3 rounded-lg bg-card border border-border ${
                          isCurrent ? 'ring-2 ring-primary' : ''
                        } ${!isLocked ? 'cursor-pointer' : 'opacity-60'}`}
                        whileHover={!isLocked ? { 
                          backgroundColor: "hsl(var(--secondary))",
                          x: 4,
                          transition: { duration: 0.2 }
                        } : {}}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3,
                          delay: categoryIndex * 0.1 + gameIndex * 0.05 + 0.3
                        }}
                      >
                        {/* Game Image/Icon */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-game-card">
                          {!hasError && cardImage ? (
                            <img
                              src={cardImage}
                              alt={game.displayName}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(game.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-2xl">🎮</span>
                            </div>
                          )}
                        </div>

                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{game.displayName}</h3>
                          {game.displayDescription && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {game.displayDescription}
                            </p>
                          )}
                          {hasPlayed && lastPlayedMap[game.id] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Played {lastPlayedMap[game.id]}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isCurrent && (
                          <div className="flex-shrink-0">
                            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                              START
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default MobileGamePath;

