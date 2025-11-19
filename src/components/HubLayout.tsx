import { useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { PaintBucket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameRegistry } from "@/games/registry";
import type { HubGame } from "@/games/registry";

type NavigationLink = {
  label: string;
  to: string;
  category: string;
  priority: number;
};

export function buildNavigationLinks(games: HubGame[]): NavigationLink[] {
  const derivedLinks = games
    .filter((game) => game.isEnabled && !game.navHidden)
    .map((game) => ({
      label: game.navLabel ?? game.displayName ?? game.id,
      to: game.derivedRoute ?? game.route.path,
      category: game.navCategory ?? game.category?.[0] ?? "uncategorized",
      priority: game.navPriority ?? 0,
    }))
    .sort((a, b) => {
      const categorySort = a.category.localeCompare(b.category);
      if (categorySort !== 0) return categorySort;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.label.localeCompare(b.label);
    });

  return [
    { label: "All Games", to: "/", category: "hub", priority: Number.POSITIVE_INFINITY },
    ...derivedLinks,
  ];
}

const HubLayout = () => {
  const { games } = useGameRegistry();
  const navigation = useMemo(() => buildNavigationLinks(games), [games]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex md:w-64 border-r bg-muted/30 flex-col p-6 gap-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5" />
          Game Hub
        </div>
        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="border-b bg-muted/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <PaintBucket className="h-5 w-5" />
            Game Hub
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {navigation.map((item) => (
              <Button key={item.to} asChild variant="outline" size="sm">
                <NavLink to={item.to} end={item.to === "/"}>
                  {item.label}
                </NavLink>
              </Button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HubLayout;

