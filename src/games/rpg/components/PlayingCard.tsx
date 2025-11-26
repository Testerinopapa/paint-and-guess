import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Card {
  id: string;
  suit: 'attack' | 'defend' | 'special' | 'loot' | 'event';
  rank: string;
  value: number;
  description?: string;
  icon?: string;
}

interface PlayingCardProps {
  card: Card;
  index: number;
  isFlipped?: boolean;
  onClick?: () => void;
  className?: string;
}

// Card suit colors and icons
const getSuitInfo = (suit: Card['suit']) => {
  switch (suit) {
    case 'attack':
      return { 
        color: '#ef4444', 
        bgColor: '#fee2e2',
        icon: '⚔️',
        name: 'Attack'
      };
    case 'defend':
      return { 
        color: '#3b82f6', 
        bgColor: '#dbeafe',
        icon: '🛡️',
        name: 'Defend'
      };
    case 'special':
      return { 
        color: '#8b5cf6', 
        bgColor: '#ede9fe',
        icon: '✨',
        name: 'Special'
      };
    case 'loot':
      return { 
        color: '#f59e0b', 
        bgColor: '#fef3c7',
        icon: '💰',
        name: 'Loot'
      };
    case 'event':
      return { 
        color: '#10b981', 
        bgColor: '#d1fae5',
        icon: '🎲',
        name: 'Event'
      };
    default:
      return { 
        color: '#6b7280', 
        bgColor: '#f3f4f6',
        icon: '❓',
        name: 'Unknown'
      };
  }
};

export const PlayingCard = ({ 
  card, 
  index, 
  isFlipped = false, 
  onClick,
  className 
}: PlayingCardProps) => {
  const suitInfo = getSuitInfo(card.suit);

  return (
    <motion.div
      initial={{ 
        y: 100, 
        opacity: 0,
        rotate: -10,
        scale: 0.8
      }}
      animate={{ 
        y: 0, 
        opacity: 1,
        rotate: 0,
        scale: 1
      }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      whileHover={{ 
        y: -10, 
        scale: 1.05,
        rotate: 2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative w-20 h-28 rounded-lg shadow-lg cursor-pointer",
        "border-2 transition-all duration-200",
        onClick && "hover:shadow-xl",
        className
      )}
      style={{
        backgroundColor: suitInfo.bgColor,
        borderColor: suitInfo.color,
      }}
    >
      {/* Card Back (when flipped) */}
      {isFlipped ? (
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-4xl">🂠</div>
        </div>
      ) : (
        <>
          {/* Card Front */}
          <div className="w-full h-full rounded-lg p-2 flex flex-col">
            {/* Top: Rank and Suit Icon */}
            <div className="flex items-center justify-between">
              <div 
                className="text-lg font-bold"
                style={{ color: suitInfo.color }}
              >
                {card.rank}
              </div>
              <div className="text-xl">{suitInfo.icon}</div>
            </div>

            {/* Center: Large Suit Icon */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-4xl">{suitInfo.icon}</div>
            </div>

            {/* Bottom: Value */}
            <div className="text-xs text-center" style={{ color: suitInfo.color }}>
              <div className="font-semibold">{suitInfo.name}</div>
              {card.value > 0 && (
                <div className="text-xs opacity-75">+{card.value}</div>
              )}
            </div>
          </div>

          {/* Hover Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${suitInfo.color}20, transparent)`,
            }}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </>
      )}
    </motion.div>
  );
};






