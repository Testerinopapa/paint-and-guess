import { useEffect, useState, useRef } from "react";
import Draggable from "react-draggable";
import { BackgroundEffects } from "../components/BackgroundEffects";
import { PlayerPanel } from "../components/PlayerPanel";
import { StoryWindow } from "../components/StoryWindow";
import { ActionPanel } from "../components/ActionPanel";
import { CommandInput } from "../components/CommandInput";
import { InventoryPanel } from "../components/InventoryPanel";
import { WorldMap } from "../components/WorldMap";
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

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-6 flex flex-col gap-4 max-w-7xl">
        <header className="text-center py-4 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-wider">
            CHRONICLES OF THE ABYSS
          </h1>
          <p className="text-accent text-xs sm:text-sm mt-2 font-mono tracking-widest">
            A Dark Fantasy Adventure
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
          <div className="lg:col-span-12">
            <ActionPanel 
              onAction={handleAction} 
              onCommand={handleCommand}
              availableCommands={availableCommands}
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

