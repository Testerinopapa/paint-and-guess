import { useState } from "react";
import { BackgroundEffects } from "../components/BackgroundEffects";
import { PlayerPanel } from "../components/PlayerPanel";
import { StoryWindow } from "../components/StoryWindow";
import { ActionPanel } from "../components/ActionPanel";
import { CommandInput } from "../components/CommandInput";
import { useToast } from "@/shared/hooks/use-toast";

export default function RpgIndex() {
  const { toast } = useToast();

  const [character] = useState({
    name: "Wanderer",
    level: 5,
    hp: 75,
    maxHp: 100,
    mana: 40,
    maxMana: 80,
    xp: 1250,
    xpToNextLevel: 2000,
    gold: 347,
  });

  const [storyText, setStoryText] = useState([
    "The ancient ruins of Eldrath loom before you, their crumbling stones weathered by countless ages. A cold wind whispers through the broken archways, carrying with it the scent of decay and forgotten magic.",
    "",
    "Your torch flickers in the darkness, casting dancing shadows against walls inscribed with arcane symbols. The air itself seems to hum with dormant power.",
    "",
    "What will you do?",
  ]);

  const [availableCommands] = useState([
    "Attack",
    "Investigate Symbols",
    "Cast Light Spell",
    "Search for Treasure",
    "Listen Carefully",
    "Rest",
  ]);

  const handleAction = (action: string) => {
    toast({
      title: "Action Selected",
      description: `You chose to: ${action}`,
    });

    setStoryText((prev) => [
      ...prev,
      "",
      `> ${action}`,
      "The shadows deepen around you as you make your choice...",
    ]);
  };

  const handleCommand = (command: string) => {
    toast({
      title: "Command Received",
      description: command,
    });

    setStoryText((prev) => [
      ...prev,
      "",
      `> ${command}`,
      "The world responds to your will...",
    ]);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 container mx-auto px-4 py-6 h-screen flex flex-col gap-4">
        <header className="text-center py-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-wider">
            CHRONICLES OF THE ABYSS
          </h1>
          <p className="text-accent text-sm mt-2 font-mono tracking-widest">
            A Dark Fantasy Adventure
          </p>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          <div className="lg:col-span-3">
            <PlayerPanel character={character} />
          </div>

          <div className="lg:col-span-6 min-h-[400px] lg:min-h-0">
            <StoryWindow location="Ruins of Eldrath" storyText={storyText} />
          </div>

          <div className="lg:col-span-3">
            <ActionPanel onAction={handleAction} availableCommands={availableCommands} />
          </div>
        </div>

        <div className="w-full">
          <CommandInput onSubmit={handleCommand} />
        </div>
      </div>
    </div>
  );
}

