import { BottomSheet, BottomSheetHeader, BottomSheetContent } from "../BottomSheet";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "../PlayerAvatar";
import type { Player } from "../../state/types";

interface MobilePlayersSheetProps {
  players: Player[];
  currentDrawerId: string | null;
  selfId: string;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

export function MobilePlayersSheet({
  players,
  currentDrawerId,
  selfId,
  expanded,
  onToggle,
}: MobilePlayersSheetProps) {
  return (
    <BottomSheet
      defaultHeight={56}
      maxHeight={300}
      minHeight={56}
      onToggle={onToggle}
    >
      <BottomSheetHeader expanded={expanded} onToggle={() => onToggle(!expanded)}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold">PLAYERS</span>
          <Badge variant="secondary" className="text-xs">
            {players.length}
          </Badge>
        </div>
      </BottomSheetHeader>
      <BottomSheetContent className="px-4 pb-2 overflow-y-auto">
        <div className="space-y-2">
          {players
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded border bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm truncate ${
                          player.id === selfId ? "font-bold" : ""
                        }`}
                      >
                        {player.name}
                      </span>
                      {player.id === currentDrawerId && (
                        <span className="text-xs">🎨</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold whitespace-nowrap ml-2">
                  {player.score || 0} pts
                </span>
              </div>
            ))}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

