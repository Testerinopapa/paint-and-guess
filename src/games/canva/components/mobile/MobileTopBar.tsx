import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileTopBarProps {
  status: string;
  onLeave: () => void;
}

export function MobileTopBar({ status, onLeave }: MobileTopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b z-50 flex items-center justify-between px-3">
      <h1 className="text-lg font-bold">CANVA</h1>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
          {status}
        </span>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Settings className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onLeave}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

