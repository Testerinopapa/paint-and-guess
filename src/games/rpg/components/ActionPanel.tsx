import { Button } from "@/components/ui/button";
import { Compass, Package, User, Save, Sword, Eye, MessageCircle, Sparkles } from "lucide-react";

interface ActionPanelProps {
  onAction: (action: string) => void;
  availableCommands: string[];
}

const mainActions = [
  { label: "Explore", icon: Compass, action: "explore" },
  { label: "Inventory", icon: Package, action: "inventory" },
  { label: "Stats", icon: User, action: "stats" },
  { label: "Save", icon: Save, action: "save" },
];

const commandIcons: Record<string, any> = {
  attack: Sword,
  investigate: Eye,
  talk: MessageCircle,
  cast: Sparkles,
};

export const ActionPanel = ({ onAction, availableCommands }: ActionPanelProps) => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-card border-2 border-accent/30 rounded-lg h-full">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
          Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {mainActions.map(({ label, icon: Icon, action }) => (
            <Button
              key={action}
              onClick={() => onAction(action)}
              variant="secondary"
              className="h-12 flex items-center justify-center gap-2 text-sm"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
          Available Commands
        </h3>
        <div className="space-y-2 overflow-y-auto max-h-[400px]">
          {availableCommands.map((command) => {
            const Icon = commandIcons[command.toLowerCase().split(" ")[0]] || Sparkles;
            return (
              <Button
                key={command}
                onClick={() => onAction(command)}
                variant="outline"
                className="w-full justify-start gap-3 h-10 text-sm bg-muted/30 hover:bg-muted/50"
              >
                <Icon className="w-4 h-4" />
                <span>{command}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

