import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AVATAR_OPTIONS, DEFAULT_AVATAR, getStoredAvatar, setStoredAvatar, getAvatarById, getAvatarEmoji } from "@/lib/avatars";
import { Smile } from "lucide-react";

interface AvatarSelectorProps {
  selectedAvatar: string;
  onAvatarChange: (avatarId: string) => void;
}

export function AvatarSelector({ selectedAvatar, onAvatarChange }: AvatarSelectorProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Load stored avatar on mount
    const stored = getStoredAvatar();
    if (stored) {
      onAvatarChange(stored);
    }
  }, [onAvatarChange]);

  const handleSelect = (avatarId: string) => {
    onAvatarChange(avatarId);
    setStoredAvatar(avatarId);
    setOpen(false);
  };

  const currentAvatar = getAvatarById(selectedAvatar || DEFAULT_AVATAR.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-2xl">
              {currentAvatar.emoji}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Avatar</span>
            <span className="text-xs text-muted-foreground">{currentAvatar.name}</span>
          </div>
          <Smile className="ml-auto h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Choose Your Avatar</h4>
            <p className="text-xs text-muted-foreground">
              Select an avatar to represent you in the game
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar.id)}
                className={`
                  aspect-square rounded-lg border-2 p-3 transition-all
                  hover:scale-110 hover:border-primary
                  ${
                    selectedAvatar === avatar.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }
                `}
                title={avatar.name}
              >
                <span className="text-3xl">{avatar.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

