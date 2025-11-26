import { User, MessageSquare, BookOpen, Shield, MapPin, X, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useRef } from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MapNPC } from "../utils/mapGenerator";

interface NPCPanelProps {
  npc: MapNPC;
  isOpen: boolean;
  onClose: () => void;
}

// NPC type icons and colors
const getNPCTypeInfo = (type: MapNPC['type']) => {
  switch (type) {
    case 'merchant':
      return { icon: '💰', color: '#ffd700', name: 'Merchant', bgColor: '#ffd70020' };
    case 'quest_giver':
      return { icon: '📜', color: '#9b59b6', name: 'Quest Giver', bgColor: '#9b59b620' };
    case 'guardian':
      return { icon: '🛡️', color: '#3498db', name: 'Guardian', bgColor: '#3498db20' };
    case 'wanderer':
      return { icon: '🚶', color: '#95a5a6', name: 'Wanderer', bgColor: '#95a5a620' };
    case 'scholar':
      return { icon: '📚', color: '#e67e22', name: 'Scholar', bgColor: '#e67e2220' };
    default:
      return { icon: '👤', color: '#4a90e2', name: 'NPC', bgColor: '#4a90e220' };
  }
};

export const NPCPanel = ({ npc, isOpen, onClose }: NPCPanelProps) => {
  const npcNodeRef = useRef<HTMLDivElement>(null);
  const typeInfo = getNPCTypeInfo(npc.type);

  if (!isOpen || !npc) return null;

  return (
    <TooltipProvider>
      <Draggable 
        nodeRef={npcNodeRef}
        handle=".npc-handle"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 400 : 0, y: 150 }}
      >
        <div
          ref={npcNodeRef}
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
            style={{ borderColor: `${typeInfo.color}80` }}
          >
            <div 
              className="npc-handle cursor-move flex items-center justify-between p-4 rounded-t-lg"
              style={{ 
                backgroundColor: typeInfo.bgColor,
                borderBottom: `2px solid ${typeInfo.color}40`
              }}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" style={{ color: typeInfo.color }} />
                <h3 className="text-lg font-bold" style={{ color: typeInfo.color }}>NPC Encounter</h3>
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
                  className="w-full aspect-square rounded-lg overflow-hidden border-2 bg-secondary/30 flex items-center justify-center"
                  style={{ borderColor: `${typeInfo.color}80` }}
                >
                  <div className="text-8xl">{typeInfo.icon}</div>
                </div>
                <motion.div
                  className="absolute -top-2 -right-2 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-background text-white"
                  style={{ backgroundColor: typeInfo.color }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {typeInfo.icon}
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-center"
                style={{ color: typeInfo.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {npc.name}
              </motion.h2>

              <motion.div
                className="text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span 
                  className="px-3 py-1 rounded text-white font-semibold"
                  style={{ backgroundColor: typeInfo.color }}
                >
                  {npc.title}
                </span>
              </motion.div>

              <motion.div
                className="text-center text-xs text-muted-foreground italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {npc.description}
              </motion.div>

              <div className="space-y-3">
                {/* Dialogue */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="p-3 bg-muted rounded-md border border-primary/20 cursor-help"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" style={{ color: typeInfo.color }} />
                        <span className="text-sm font-semibold">Dialogue</span>
                      </div>
                      <p className="text-sm text-foreground/80 italic">
                        "{npc.dialogue[0]}"
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>What {npc.name} says when you talk to them</p>
                  </TooltipContent>
                </Tooltip>

                {/* NPC Type Info */}
                <div className="grid grid-cols-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="p-3 bg-muted rounded-md border border-primary/20 text-center cursor-help"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <MapPin className="w-5 h-5 mx-auto mb-1" style={{ color: typeInfo.color }} />
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="font-bold text-sm" style={{ color: typeInfo.color }}>
                          {typeInfo.name}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>NPC Type: {typeInfo.name}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="p-3 bg-muted rounded-md border border-primary/20 text-center cursor-help"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {npc.stationary ? (
                          <Shield className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        ) : (
                          <MapPin className="w-5 h-5 mx-auto mb-1 text-green-500" />
                        )}
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="font-bold text-sm">
                          {npc.stationary ? 'Stationary' : 'Mobile'}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{npc.stationary ? 'This NPC stays in place' : 'This NPC can move around'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Quest Indicator */}
                {npc.hasQuest && (
                  <motion.div
                    className="p-3 rounded-md border-2 text-center"
                    style={{ 
                      backgroundColor: '#9b59b620',
                      borderColor: '#9b59b680'
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(155, 89, 182, 0.3)" }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Gift className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-purple-500">Quest Available</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {npc.questId ? `Quest ID: ${npc.questId}` : 'This NPC has a quest for you!'}
                    </div>
                  </motion.div>
                )}

                {/* Discovery Status */}
                <motion.div
                  className="p-3 bg-muted rounded-md border border-primary/20 text-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {npc.discovered ? 'Discovered' : 'New Encounter'}
                    </span>
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









