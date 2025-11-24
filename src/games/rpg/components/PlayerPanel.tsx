import { Heart, Droplet, Star, Coins, User, X, Image, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { animationDebug, performanceTracker } from "../utils/debug";
import { CharacterSprite } from "./CharacterSprite";
import { CharacterAvatar } from "./CharacterAvatar";

import type { Character } from "../state/useRpgStore";

interface PlayerPanelProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerPanel = ({ character, isOpen, onClose }: PlayerPanelProps) => {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const manaPercent = (character.mana / character.maxMana) * 100;
  const xpPercent = (character.xp / character.xpToNextLevel) * 100;
  const playerNodeRef = useRef<HTMLDivElement>(null);
  
  // Toggle between sprite and SVG avatar
  const [useSprite, setUseSprite] = useState(() => {
    const saved = localStorage.getItem("rpg-player-avatar-mode");
    return saved === "sprite";
  });

  useEffect(() => {
    localStorage.setItem("rpg-player-avatar-mode", useSprite ? "sprite" : "svg");
  }, [useSprite]);

  useEffect(() => {
    animationDebug.start("PlayerPanel", "render");
    const endTracking = performanceTracker.start("PlayerPanel.render");
    return () => {
      endTracking();
      animationDebug.complete("PlayerPanel", "render");
    };
  }, [character]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <Draggable 
        nodeRef={playerNodeRef}
        handle=".player-handle"
        defaultPosition={{ x: typeof window !== "undefined" ? 50 : 0, y: 80 }}
      >
        <div
          ref={playerNodeRef}
          style={{
            position: "fixed",
            zIndex: 50,
            left: 0,
            top: 0,
          }}
        >
      <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-80 bg-card border-2 border-primary/30 rounded-lg shadow-2xl"
          >
            <div
              className="player-handle cursor-move flex items-center justify-between p-4 bg-secondary/30 border-b-2 border-primary/30 rounded-t-lg"
      >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">Player Stats</h3>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUseSprite(!useSprite);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {useSprite ? (
                        <Image className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to {useSprite ? "SVG Avatar" : "Sprite Animation"}</p>
                  </TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-secondary/30 flex items-center justify-center">
                  {useSprite ? (
                    <CharacterSprite
                      characterType={character.spriteType || "character"}
                      animation="idle"
                      weapon="unarmed"
                      scale={4}
                      frameDelay={150}
                      className="w-full h-full flex items-center justify-center"
                    />
                  ) : (
            <CharacterAvatar
              characterName={character.name}
              avatarConfig={character.avatarConfig}
              avatarSeed={character.avatarSeed}
              size={256}
              className="w-full h-full"
              fallback="⚔️"
            />
                  )}
          </div>
          <motion.div
            className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-background"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {character.level}
          </motion.div>
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-primary text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {character.name}
        </motion.h2>

        <div className="space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="space-y-1 cursor-help"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-foreground/80">HP</span>
                  </div>
                  <span className="font-mono text-red-500">
                    {character.hp}/{character.maxHp}
                  </span>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                >
                  <Progress value={hpPercent} className="h-2" />
                </motion.div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Health Points: {character.hp} / {character.maxHp}</p>
              <p className="text-xs text-muted-foreground">
                {hpPercent.toFixed(1)}% remaining
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="flex items-center justify-center gap-4 cursor-help"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span className="text-foreground/80">Mana</span>
                    </div>
                    <span className="font-mono text-blue-500 text-xs">
                      {character.mana}/{character.maxMana}
                    </span>
                  </div>
                  <div className="w-20 h-20 mx-auto">
                    <CircularProgressbar
                      value={manaPercent}
                      text={`${Math.round(manaPercent)}%`}
                      styles={buildStyles({
                        pathColor: "#3b82f6",
                        textColor: "#3b82f6",
                        trailColor: "#1e3a5f",
                        textSize: "16px",
                        pathTransitionDuration: 0.5,
                      })}
                    />
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mana: {character.mana} / {character.maxMana}</p>
              <p className="text-xs text-muted-foreground">
                {manaPercent.toFixed(1)}% remaining
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="flex items-center justify-center gap-4 cursor-help"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-foreground/80">XP</span>
                    </div>
                    <span className="font-mono text-yellow-500 text-xs">
                      {character.xp}/{character.xpToNextLevel}
                    </span>
                  </div>
                  <div className="w-20 h-20 mx-auto">
                    <CircularProgressbar
                      value={xpPercent}
                      text={`${Math.round(xpPercent)}%`}
                      styles={buildStyles({
                        pathColor: "#eab308",
                        textColor: "#eab308",
                        trailColor: "#3f3f1f",
                        textSize: "16px",
                        pathTransitionDuration: 0.5,
                      })}
                    />
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Experience: {character.xp} / {character.xpToNextLevel}</p>
              <p className="text-xs text-muted-foreground">
                {character.xpToNextLevel - character.xp} XP until level {character.level + 1}
              </p>
            </TooltipContent>
          </Tooltip>

          <motion.div
            className="flex items-center justify-between p-3 bg-muted rounded-md border border-primary/20"
            whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(45, 95, 55, 0.3)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-foreground/80">Gold</span>
            </div>
            <motion.span
              className="font-mono font-bold text-primary text-lg"
              key={character.gold}
              initial={{ scale: 1.2, color: "#eab308" }}
              animate={{ scale: 1, color: "inherit" }}
              transition={{ duration: 0.3 }}
            >
              {character.gold}
            </motion.span>
          </motion.div>
              </div>
        </div>
      </motion.div>
        </div>
      </Draggable>
    </TooltipProvider>
  );
};

