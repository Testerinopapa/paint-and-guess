import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface CommandInputProps {
  onSubmit: (command: string) => void;
}

export const CommandInput = ({ onSubmit }: CommandInputProps) => {
  const [command, setCommand] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onSubmit(command);
      setCommand("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2 p-4 bg-card border-2 border-accent/30 rounded-lg">
        <div className="flex-1 relative">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type your command..."
            className="h-12 font-mono bg-input border-accent/20 focus:border-accent/50"
          />
        </div>
        <Button type="submit" className="h-12 px-6 bg-accent hover:bg-accent/80 text-accent-foreground">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

