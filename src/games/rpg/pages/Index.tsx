import { useEffect, useState, useRef } from "react";
import Draggable from "react-draggable";
import { motion } from "framer-motion";
import { BackgroundEffects } from "../components/BackgroundEffects";
import { PlayerPanel } from "../components/PlayerPanel";
import { StoryWindow } from "../components/StoryWindow";
import { ActionPanel } from "../components/ActionPanel";
import { CommandInput } from "../components/CommandInput";
import { InventoryPanel } from "../components/InventoryPanel";
import { WorldMap } from "../components/WorldMap";
import { CharacterCreation } from "../components/CharacterCreation";
import { useRpgStore } from "../state/useRpgStore";
import { useToast } from "@/shared/hooks/use-toast";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import type { AvatarConfig } from "@/lib/avatar/config";
// Initialize debug utilities
import "../utils/debug";

const DEBUG_RPG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true";

export default function RpgIndex() {
  const { toast } = useToast();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [playerPanelOpen, setPlayerPanelOpen] = useState(false);
  const [storyWindowOpen, setStoryWindowOpen] = useState(true); // Open by default
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const testEmojiRef = useRef<HTMLDivElement>(null);

  const character = useRpgStore((state) => state.character);
  const location = useRpgStore((state) => state.location);
  const storyText = useRpgStore((state) => state.storyText);
  const availableCommands = useRpgStore((state) => state.availableCommands);
  const inventory = useRpgStore((state) => state.inventory);
  const isCharacterCreated = useRpgStore((state) => state.isCharacterCreated);
  const performAction = useRpgStore((state) => state.performAction);
  const submitCommand = useRpgStore((state) => state.submitCommand);
  const addItem = useRpgStore((state) => state.addItem);
  const removeItem = useRpgStore((state) => state.removeItem);
  const setCharacterAvatar = useRpgStore((state) => state.setCharacterAvatar);

  // Load avatar config from customization system on mount
  useEffect(() => {
    const avatarConfig = safeLoadAvatarConfig();
    if (avatarConfig) {
      setCharacterAvatar(avatarConfig);
      if (DEBUG_RPG) {
        console.debug("[RPG] Loaded avatar config from customization system", avatarConfig);
      }
    }
  }, [setCharacterAvatar]);

  // Listen for avatar updates from customization system
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<AvatarConfig>;
      if (customEvent.detail) {
        setCharacterAvatar(customEvent.detail);
        if (DEBUG_RPG) {
          console.debug("[RPG] Avatar updated from customization system", customEvent.detail);
        }
      }
    };

    window.addEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    };
  }, [setCharacterAvatar]);

  // Debug: Subscribe to state changes in development
  useEffect(() => {
    if (!DEBUG_RPG) return;

    let prevState = useRpgStore.getState();

    const unsubscribe = useRpgStore.subscribe((state) => {
      // Log state changes
      if (state.character !== prevState.character) {
        console.debug("[RPG] Character changed:", {
          before: prevState.character,
          after: state.character,
          changes: {
            hp: state.character.hp - prevState.character.hp,
            mana: state.character.mana - prevState.character.mana,
            xp: state.character.xp - prevState.character.xp,
            gold: state.character.gold - prevState.character.gold,
            level: state.character.level - prevState.character.level,
          },
        });
      }

      if (state.location !== prevState.location) {
        console.debug("[RPG] Location changed:", {
          from: prevState.location,
          to: state.location,
        });
      }

      if (state.storyText.length !== prevState.storyText.length) {
        console.debug("[RPG] Story text updated:", {
          previousLength: prevState.storyText.length,
          newLength: state.storyText.length,
          newLines: state.storyText.slice(prevState.storyText.length),
        });
      }

      if (state.availableCommands.length !== prevState.availableCommands.length) {
        console.debug("[RPG] Available commands changed:", {
          previousCount: prevState.availableCommands.length,
          newCount: state.availableCommands.length,
          previous: prevState.availableCommands,
          current: state.availableCommands,
          added: state.availableCommands.filter((cmd) => !prevState.availableCommands.includes(cmd)),
        });
      }

      prevState = state;
    });

    return unsubscribe;
  }, []);

  const handleAction = (action: string) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true") {
      console.debug(`[RPG] Action triggered: "${action}"`);
    }

    if (action.toLowerCase() === "inventory") {
      setInventoryOpen(!inventoryOpen);
      return;
    }

    if (action.toLowerCase() === "worldmap") {
      setWorldMapOpen(!worldMapOpen);
      return;
    }

    toast({
      title: "Action Selected",
      description: `You chose to: ${action}`,
    });

    performAction(action);
  };

  const handleCommand = (command: string) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true") {
      console.debug(`[RPG] Command submitted: "${command}"`);
      console.debug(`[RPG] Command normalized: "${command.toLowerCase().trim()}"`);
    }

    toast({
      title: "Command Received",
      description: command,
    });

    try {
      submitCommand(command);
    } catch (error) {
      console.error("[RPG] Error submitting command:", error);
      toast({
        title: "Error",
        description: `Failed to execute command: ${command}`,
        variant: "destructive",
      });
    }
  };

  // Show character creation for first-time players
  if (!isCharacterCreated) {
    return (
      <div className="min-h-screen bg-background relative">
        <BackgroundEffects />
        <CharacterCreation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-6 flex flex-col gap-4 max-w-7xl">
        <header className="text-center py-4 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2 
            }}
            className="relative"
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider relative z-10"
              style={{
                fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                fontWeight: 900,
                letterSpacing: "0.1em",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #fbbf24 75%, #f59e0b 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.5)) drop-shadow(0 0 16px rgba(251, 191, 36, 0.3))",
                textShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              CHRONICLES OF THE ABYSS
            </motion.h1>
            
            {/* Glow effect behind text */}
            <motion.div
              className="absolute inset-0 -z-0 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                borderRadius: "50%",
                transform: "scale(1.2)",
              }}
            />
            
            <motion.p 
              className="text-accent text-xs sm:text-sm mt-2 font-mono tracking-widest relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.6,
                ease: "easeOut"
              }}
              style={{
                textShadow: "0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3)",
              }}
            >
              A Dark Fantasy Adventure
            </motion.p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
          <div className="lg:col-span-12">
            <ActionPanel 
              onAction={handleAction} 
              onOpenPlayerPanel={() => setPlayerPanelOpen(true)}
              onOpenStoryWindow={() => setStoryWindowOpen(true)}
              onOpenWorldMap={() => setWorldMapOpen(true)}
            />
          </div>
        </div>

        <div className="w-full flex-shrink-0 pb-4">
          <CommandInput onSubmit={handleCommand} />
        </div>
      </div>

      <InventoryPanel
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        items={inventory}
        onAddItem={addItem}
        onRemoveItem={removeItem}
      />

      <PlayerPanel
        character={character}
        isOpen={playerPanelOpen}
        onClose={() => setPlayerPanelOpen(false)}
      />

      <StoryWindow
        location={location}
        storyText={storyText}
        isOpen={storyWindowOpen}
        onClose={() => setStoryWindowOpen(false)}
      />

      <WorldMap
        isOpen={worldMapOpen}
        onClose={() => setWorldMapOpen(false)}
        onNPCEncounter={(npc) => {
          // Add NPC dialogue to story
          const npcDialogue = npc.dialogue[0] || "Hello, traveler.";
          const encounterText = [
            "",
            `**${npc.name}** (${npc.title})`,
            `"${npcDialogue}"`,
            npc.hasQuest ? "*This NPC has a quest for you.*" : "",
          ].filter(Boolean);
          
          // Add to story text
          useRpgStore.setState((state) => ({
            storyText: [...state.storyText, ...encounterText],
          }));
          
          // Open story window
          setStoryWindowOpen(true);
        }}
      />

      {/* Test Draggable Emoji */}
      <Draggable nodeRef={testEmojiRef}>
        <div
          ref={testEmojiRef}
          style={{
            position: "fixed",
            top: "100px",
            left: "100px",
            zIndex: 100,
            fontSize: "3rem",
            cursor: "grab",
            userSelect: "none",
            background: "rgba(0, 0, 0, 0.5)",
            padding: "10px",
            borderRadius: "10px",
            border: "2px solid #45b355",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = "grabbing";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = "grab";
          }}
        >
          🧪 TEST
        </div>
      </Draggable>
    </div>
  );
}

