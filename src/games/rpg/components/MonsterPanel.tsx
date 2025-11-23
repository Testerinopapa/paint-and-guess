import { Heart, Shield, Zap, X, Skull } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MapMonster } from "../utils/mapGenerator";

interface MonsterPanelProps {
  monster: MapMonster;
  isOpen: boolean;
  onClose: () => void;
}

// Monster type icons and colors
const getMonsterTypeInfo = (type: MapMonster['type']) => {
  switch (type) {
    case 'shadow':
      return { icon: '👻', color: '#4a148c', name: 'Shadow' };
    case 'beast':
      return { icon: '🐺', color: '#6d4c41', name: 'Beast' };
    case 'undead':
      return { icon: '💀', color: '#424242', name: 'Undead' };
    case 'elemental':
      return { icon: '🔥', color: '#ff6f00', name: 'Elemental' };
    case 'demon':
      return { icon: '😈', color: '#b71c1c', name: 'Demon' };
    default:
      return { icon: '👹', color: '#8b0000', name: 'Monster' };
  }
};

export const MonsterPanel = ({ monster, isOpen, onClose }: MonsterPanelProps) => {
  const monsterNodeRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen || !monster) return null;
  
  const hpPercent = (monster.hp / monster.maxHp) * 100;
  const typeInfo = getMonsterTypeInfo(monster.type);

  // Calculate estimated stats based on level
  const estimatedAttack = Math.floor(10 + monster.level * 3);
  const estimatedDefense = Math.floor(5 + monster.level * 2);
  const estimatedSpeed = Math.floor(8 + monster.level * 1.5);

  return (
    <TooltipProvider>
      <Draggable 
        nodeRef={monsterNodeRef}
        handle=".monster-handle"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 400 : 0, y: 80 }}
      >
        <div
          ref={monsterNodeRef}
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
            className="w-80 bg-card border-2 border-red-500/30 rounded-lg shadow-2xl"
          >
            <div 
              className="monster-handle cursor-move flex items-center justify-between p-4 bg-red-950/30 border-b-2 border-red-500/30 rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-red-500">Monster Encounter</h3>
              </div>
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

            <div className="flex flex-col gap-4 p-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div 
                  className="w-full aspect-square rounded-lg overflow-hidden border-2 border-red-500/50 bg-red-950/30 flex items-center justify-center"
                  style={{ borderColor: `${typeInfo.color}80` }}
                >
                  <div className="text-8xl">{typeInfo.icon}</div>
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-background"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {monster.level}
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-red-500 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {monster.name}
              </motion.h2>

              <motion.div
                className="text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="px-2 py-1 bg-red-950/30 rounded text-red-400">
                  {typeInfo.name}
                </span>
              </motion.div>

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
                          {monster.hp}/{monster.maxHp}
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
                    <p>Health Points: {monster.hp} / {monster.maxHp}</p>
                    <p className="text-xs text-muted-foreground">
                      {hpPercent.toFixed(1)}% remaining
                    </p>
                  </TooltipContent>
                </Tooltip>

                <div className="grid grid-cols-3 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="p-3 bg-muted rounded-md border border-primary/20 text-center cursor-help"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                        <div className="text-xs text-muted-foreground">Attack</div>
                        <div className="font-bold text-yellow-500">{estimatedAttack}</div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated Attack Power: {estimatedAttack}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="p-3 bg-muted rounded-md border border-primary/20 text-center cursor-help"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Shield className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-xs text-muted-foreground">Defense</div>
                        <div className="font-bold text-blue-500">{estimatedDefense}</div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated Defense: {estimatedDefense}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="p-3 bg-muted rounded-md border border-primary/20 text-center cursor-help"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Zap className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <div className="text-xs text-muted-foreground">Speed</div>
                        <div className="font-bold text-green-500">{estimatedSpeed}</div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated Speed: {estimatedSpeed}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <motion.div
                  className="p-3 bg-red-950/20 rounded-md border border-red-500/30 text-center"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(220, 38, 38, 0.3)" }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="text-xs text-muted-foreground mb-1">Patrol Radius</div>
                  <div className="font-mono font-bold text-red-400">
                    {monster.patrolRadius} tiles
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </Draggable>
    </TooltipProvider>
  );
};

