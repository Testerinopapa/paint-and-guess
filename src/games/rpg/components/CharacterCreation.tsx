import { useState } from "react";
import { motion } from "framer-motion";
import { useRpgStore } from "../state/useRpgStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sword, Wand2, Target, Shield } from "lucide-react";
import { AvatarCustomization } from "./AvatarCustomization";
import type { AvatarConfig } from "@/lib/avatar/config";
import type { CharacterType } from "./CharacterSprite";

interface CharacterClass {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stats: {
    hp: string;
    mana: string;
    playstyle: string;
  };
}

const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: "warrior",
    name: "Warrior",
    description: "A fierce fighter with high health and physical strength",
    icon: Sword,
    stats: {
      hp: "120 HP",
      mana: "50 Mana",
      playstyle: "Tank & Melee",
    },
  },
  {
    id: "mage",
    name: "Mage",
    description: "A master of arcane magic with powerful spells",
    icon: Wand2,
    stats: {
      hp: "80 HP",
      mana: "120 Mana",
      playstyle: "Magic & Ranged",
    },
  },
  {
    id: "rogue",
    name: "Rogue",
    description: "A stealthy assassin with balanced abilities",
    icon: Target,
    stats: {
      hp: "100 HP",
      mana: "70 Mana",
      playstyle: "Stealth & Agility",
    },
  },
  {
    id: "paladin",
    name: "Paladin",
    description: "A holy warrior with healing and combat skills",
    icon: Shield,
    stats: {
      hp: "110 HP",
      mana: "80 Mana",
      playstyle: "Support & Defense",
    },
  },
];

export const CharacterCreation = () => {
  const [characterName, setCharacterName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [spriteType, setSpriteType] = useState<CharacterType>("character");
  const initializeCharacter = useRpgStore((state) => state.initializeCharacter);
  const setCharacterAvatar = useRpgStore((state) => state.setCharacterAvatar);
  const setCharacterSpriteType = useRpgStore((state) => state.setCharacterSpriteType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterName.trim() && selectedClass) {
      initializeCharacter(characterName.trim(), selectedClass);
      // Set avatar config after character is initialized
      if (avatarConfig) {
        setCharacterAvatar(avatarConfig);
      }
      // Set sprite type
      setCharacterSpriteType(spriteType);
    }
  };

  const handleAvatarChange = (config: AvatarConfig | null) => {
    setAvatarConfig(config);
  };
  
  const handleSpriteTypeChange = (type: CharacterType) => {
    setSpriteType(type);
  };

  const canSubmit = characterName.trim().length >= 2 && selectedClass !== null;

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="w-full max-w-7xl relative">
        {/* Character Creation Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-card border-2 border-primary/30 p-8 shadow-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2 tracking-wider" style={{ fontFamily: "'Cinzel Decorative', 'Cinzel', serif" }}>
              Create Your Character
            </h2>
            <p className="text-accent text-sm font-mono tracking-widest">
              Begin Your Journey Into The Abyss
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="character-name" className="text-lg font-semibold text-primary mb-2 block">
                Character Name
              </Label>
              <Input
                id="character-name"
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter your character's name..."
                className="bg-background border-2 border-primary/30 focus:border-primary text-lg h-12 font-mono"
                maxLength={20}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {characterName.length}/20 characters
              </p>
            </motion.div>

            {/* Class Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-lg font-semibold text-primary mb-4 block">
                Choose Your Class
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHARACTER_CLASSES.map((charClass, index) => {
                  const Icon = charClass.icon;
                  const isSelected = selectedClass === charClass.id;
                  
                  return (
                    <motion.button
                      key={charClass.id}
                      type="button"
                      onClick={() => setSelectedClass(charClass.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-primary/30 bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          isSelected ? "bg-primary/20" : "bg-secondary/30"
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isSelected ? "text-primary" : "text-foreground/70"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg mb-1 ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}>
                            {charClass.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {charClass.description}
                          </p>
                          <div className="flex gap-4 text-xs">
                            <span className="text-red-500 font-mono">{charClass.stats.hp}</span>
                            <span className="text-blue-500 font-mono">{charClass.stats.mana}</span>
                            <span className="text-accent">{charClass.stats.playstyle}</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center pt-4"
            >
              <Button
                type="submit"
                disabled={!canSubmit}
                className="px-8 py-6 text-lg font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                Begin Your Journey
              </Button>
            </motion.div>
          </form>
          </Card>
        </motion.div>

        {/* Avatar Customization Popup */}
        {characterName.trim().length >= 2 && (
          <AvatarCustomization
            characterName={characterName.trim()}
            onAvatarChange={handleAvatarChange}
            onSpriteTypeChange={handleSpriteTypeChange}
            initialSpriteType={spriteType}
          />
        )}
      </div>
    </div>
  );
};

