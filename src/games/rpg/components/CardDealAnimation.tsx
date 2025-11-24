import { motion } from "framer-motion";
import { useRef, useMemo } from "react";
import Draggable from "react-draggable";
import { PlayingCard, type Card } from "./PlayingCard";
import type { MapMonster } from "../utils/mapGenerator";

interface CardDealAnimationProps {
  monster: MapMonster;
  isOpen: boolean;
  onClose: () => void;
  onCardSelect?: (card: Card) => void;
}

// Seeded random for consistent card generation
const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

// Generate 5 cards based on monster (deterministic based on monster ID)
const generateCards = (monster: MapMonster): Card[] => {
  const suits: Card['suit'][] = ['attack', 'defend', 'special', 'loot', 'event'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  // Use monster ID as seed for deterministic generation
  const seed = monster.id.split('-').reduce((acc, val) => acc + val.charCodeAt(0), 0);
  const random = seededRandom(seed);
  
  // Base value on monster level
  const baseValue = monster.level * 5;
  
  return suits.map((suit, index) => {
    const rank = ranks[Math.floor(random() * ranks.length)];
    let value = baseValue;
    
    // Adjust value based on suit type
    switch (suit) {
      case 'attack':
        value = baseValue + Math.floor(random() * 10);
        break;
      case 'defend':
        value = baseValue + Math.floor(random() * 8);
        break;
      case 'special':
        value = baseValue + Math.floor(random() * 15);
        break;
      case 'loot':
        value = baseValue + Math.floor(random() * 20);
        break;
      case 'event':
        value = baseValue + Math.floor(random() * 5);
        break;
    }
    
    return {
      id: `card-${monster.id}-${index}`,
      suit,
      rank,
      value,
      description: `${suit} card for ${monster.name}`,
    };
  });
};

export const CardDealAnimation = ({ 
  monster, 
  isOpen, 
  onClose,
  onCardSelect 
}: CardDealAnimationProps) => {
  const cardNodeRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen || !monster) return null;
  
  // Memoize cards so they don't regenerate on every render
  const cards = useMemo(() => generateCards(monster), [monster.id, monster.level]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <Draggable 
      nodeRef={cardNodeRef}
      defaultPosition={{ 
        x: typeof window !== "undefined" ? window.innerWidth - 500 : 0, 
        y: 80 
      }}
    >
      <div
        ref={cardNodeRef}
        style={{
          position: "fixed",
          zIndex: 50,
          left: 0,
          top: 0,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {/* Cards Container */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-3 justify-center items-center flex-wrap"
          >
            {cards.map((card, index) => (
              <PlayingCard
                key={card.id}
                card={card}
                index={index}
                onClick={() => {
                  if (onCardSelect) {
                    onCardSelect(card);
                  }
                }}
              />
            ))}
          </motion.div>

        </motion.div>
      </div>
    </Draggable>
  );
};

