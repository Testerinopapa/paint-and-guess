import { Button } from "@/components/ui/button";
import { Compass, Package, User, Save, Sword, Eye, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { animationDebug } from "../utils/debug";

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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationStart={() => animationDebug.start("ActionPanel", "mount")}
      onAnimationComplete={() => animationDebug.complete("ActionPanel", "mount", 500)}
      className="flex flex-col gap-4 p-6 bg-card border-2 border-accent/30 rounded-lg"
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
                  onClick={() => onAction(command)}
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
  );
};

