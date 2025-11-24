import { Button } from "@/components/ui/button";
import { Compass, Package, User, Save, Sword, Eye, MessageCircle, Sparkles, Map } from "lucide-react";
import { motion } from "framer-motion";
import Draggable from "react-draggable";
import { useState, useRef, useEffect } from "react";
import { animationDebug } from "../utils/debug";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionPanelProps {
  onAction: (action: string) => void;
  onCommand?: (command: string) => void;
  availableCommands: string[];
  onOpenPlayerPanel?: () => void;
  onOpenStoryWindow?: () => void;
  onOpenWorldMap?: () => void;
}

const mainActions = [
  { label: "Explore", icon: Compass, action: "explore" },
  { label: "World Map", icon: Map, action: "worldmap" },
  { label: "Stats", icon: User, action: "stats" },
  { label: "Save", icon: Save, action: "save" },
];

const commandIcons: Record<string, any> = {
  attack: Sword,
  investigate: Eye,
  talk: MessageCircle,
  cast: Sparkles,
};

export const ActionPanel = ({ onAction, onCommand, availableCommands, onOpenPlayerPanel, onOpenStoryWindow, onOpenWorldMap }: ActionPanelProps) => {
  // Initialize with fallback positions
  const [defaultPos, setDefaultPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 120, y: window.innerHeight - 120 };
    }
    return { x: 0, y: 0 };
  });
  const [playerPos, setPlayerPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 200, y: window.innerHeight - 120 };
    }
    return { x: 0, y: 0 };
  });
  const [storyPos, setStoryPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 280, y: window.innerHeight - 120 };
    }
    return { x: 0, y: 0 };
  });
  const [worldMapPos, setWorldMapPos] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 360, y: window.innerHeight - 120 };
    }
    return { x: 0, y: 0 };
  });
  const emojiNodeRef = useRef<HTMLDivElement>(null);
  const playerEmojiNodeRef = useRef<HTMLDivElement>(null);
  const storyEmojiNodeRef = useRef<HTMLDivElement>(null);
  const worldMapEmojiNodeRef = useRef<HTMLDivElement>(null);
  const wasDragging = useRef(false);
  const playerWasDragging = useRef(false);
  const storyWasDragging = useRef(false);
  const worldMapWasDragging = useRef(false);

  useEffect(() => {
    // Set initial positions - side by side at bottom
    const updatePositions = () => {
      if (typeof window !== "undefined") {
        // Inventory emoji on the right
        setDefaultPos({
          x: window.innerWidth - 120,
          y: window.innerHeight - 120,
        });
        // Player emoji in the middle
        setPlayerPos({
          x: window.innerWidth - 200,
          y: window.innerHeight - 120,
        });
        // Story emoji on the left
        setStoryPos({
          x: window.innerWidth - 280,
          y: window.innerHeight - 120,
        });
        // World Map emoji on the far left
        setWorldMapPos({
          x: window.innerWidth - 360,
          y: window.innerHeight - 120,
        });
      }
    };
    
    updatePositions();
    // Update on window resize
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Only open inventory if we didn't just drag
    if (!wasDragging.current) {
      e.stopPropagation();
      onAction("inventory");
    }
    wasDragging.current = false;
  };

  const handlePlayerClick = (e: React.MouseEvent) => {
    // Only open player panel if we didn't just drag
    if (!playerWasDragging.current) {
      e.stopPropagation();
      if (onOpenPlayerPanel) {
        console.log("[RPG] Opening player panel");
        onOpenPlayerPanel();
      } else {
        console.warn("[RPG] onOpenPlayerPanel callback not provided");
      }
    }
    playerWasDragging.current = false;
  };

  const handleStoryClick = (e: React.MouseEvent) => {
    // Only open story window if we didn't just drag
    if (!storyWasDragging.current) {
      e.stopPropagation();
      if (onOpenStoryWindow) {
        console.log("[RPG] Opening story window");
        onOpenStoryWindow();
      } else {
        console.warn("[RPG] onOpenStoryWindow callback not provided");
      }
    }
    storyWasDragging.current = false;
  };

  const handleWorldMapClick = (e: React.MouseEvent) => {
    // Only open world map if we didn't just drag
    if (!worldMapWasDragging.current) {
      e.stopPropagation();
      if (onOpenWorldMap) {
        console.log("[RPG] Opening world map");
        onOpenWorldMap();
      } else {
        console.warn("[RPG] onOpenWorldMap callback not provided");
      }
    }
    worldMapWasDragging.current = false;
  };

  return (
    <>
      {/* Draggable Inventory Emoji Button */}
      <Draggable
        nodeRef={emojiNodeRef}
        defaultPosition={defaultPos}
        onStart={() => {
          wasDragging.current = false;
        }}
        onDrag={(e, data) => {
          // Only consider it dragging if moved more than 5px
          if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
            wasDragging.current = true;
          }
        }}
        onStop={() => {
          // Reset after a short delay to allow click to fire
          setTimeout(() => {
            wasDragging.current = false;
          }, 50);
        }}
      >
        <div
          ref={emojiNodeRef}
          onClick={handleClick}
          style={{
            position: "fixed",
            zIndex: 40,
            cursor: "grab",
            left: 0,
            top: 0,
            fontSize: "3rem",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = "grabbing";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = "grab";
          }}
          title="Click to open inventory, drag to move"
        >
          📦
        </div>
      </Draggable>

      {/* Draggable Player Panel Emoji Button */}
      <Draggable
        nodeRef={playerEmojiNodeRef}
        defaultPosition={playerPos}
        onStart={() => {
          playerWasDragging.current = false;
        }}
        onDrag={(e, data) => {
          // Only consider it dragging if moved more than 5px
          if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
            playerWasDragging.current = true;
          }
        }}
        onStop={() => {
          // Reset after a short delay to allow click to fire
          setTimeout(() => {
            playerWasDragging.current = false;
          }, 50);
        }}
      >
        <div
          ref={playerEmojiNodeRef}
          onClick={handlePlayerClick}
          style={{
            position: "fixed",
            zIndex: 40,
            cursor: "grab",
            left: 0,
            top: 0,
            fontSize: "3rem",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = "grabbing";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = "grab";
          }}
          title="Click to open player stats, drag to move"
        >
          ⚔️
        </div>
      </Draggable>

      {/* Draggable Story Window Emoji Button */}
      <Draggable
        nodeRef={storyEmojiNodeRef}
        defaultPosition={storyPos}
        onStart={() => {
          storyWasDragging.current = false;
        }}
        onDrag={(e, data) => {
          // Only consider it dragging if moved more than 5px
          if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
            storyWasDragging.current = true;
          }
        }}
        onStop={() => {
          // Reset after a short delay to allow click to fire
          setTimeout(() => {
            storyWasDragging.current = false;
          }, 50);
        }}
      >
        <div
          ref={storyEmojiNodeRef}
          onClick={handleStoryClick}
          style={{
            position: "fixed",
            zIndex: 40,
            cursor: "grab",
            left: 0,
            top: 0,
            fontSize: "3rem",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = "grabbing";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = "grab";
          }}
          title="Click to open story window, drag to move"
        >
          📜
        </div>
      </Draggable>

      {/* Draggable World Map Emoji Button */}
      <Draggable
        nodeRef={worldMapEmojiNodeRef}
        defaultPosition={worldMapPos}
        onStart={() => {
          worldMapWasDragging.current = false;
        }}
        onDrag={(e, data) => {
          // Only consider it dragging if moved more than 5px
          if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
            worldMapWasDragging.current = true;
          }
        }}
        onStop={() => {
          // Reset after a short delay to allow click to fire
          setTimeout(() => {
            worldMapWasDragging.current = false;
          }, 50);
        }}
      >
        <div
          ref={worldMapEmojiNodeRef}
          onClick={handleWorldMapClick}
          style={{
            position: "fixed",
            zIndex: 40,
            cursor: "grab",
            left: 0,
            top: 0,
            fontSize: "3rem",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = "grabbing";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = "grab";
          }}
          title="Click to open world map, drag to move"
        >
          🗺️
        </div>
      </Draggable>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onAnimationStart={() => animationDebug.start("ActionPanel", "mount")}
        onAnimationComplete={() => animationDebug.complete("ActionPanel", "mount", 500)}
        className="flex flex-col gap-4 p-6 rounded-lg"
      >
        <div className="space-y-2 flex-shrink-0">
          <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
            Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {mainActions.map(({ label, icon: Icon, action }, index) => (
              <motion.div
                key={action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => onAction(action)}
                  variant="secondary"
                  className="h-12 w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

      <div className="space-y-2 flex-shrink-0">
        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
          Available Commands
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {availableCommands.map((command, index) => {
            const Icon = commandIcons[command.toLowerCase().split(" ")[0]] || Sparkles;
            return (
              <motion.div
                key={command}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onCommand ? onCommand(command) : onAction(command)}
                  variant="outline"
                  className="w-full justify-start gap-3 h-10 text-sm bg-muted/30 hover:bg-muted/50"
                >
                  <Icon className="w-4 h-4" />
                  <span>{command}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
      </motion.div>
    </>
  );
};

