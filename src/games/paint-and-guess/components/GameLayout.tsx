import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface GameLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actionSlot?: ReactNode;
  contentClassName?: string;
}

export function GameLayout({ title, description, children, actionSlot, contentClassName }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Hub
              </Link>
            </Button>
            {title ? (
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-semibold leading-tight">{title}</span>
                {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
              </div>
            ) : null}
          </div>
          {actionSlot}
        </div>
        <Separator />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className={cn("space-y-6", contentClassName)}>{children}</div>
      </main>
    </div>
  );
}

export default GameLayout;

