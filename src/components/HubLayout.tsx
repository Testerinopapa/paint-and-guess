import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PaintBucket, Settings, Sparkles, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameRegistry } from "@/games/registry";
import type { HubGame } from "@/games/registry";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { AvatarCustomizer } from "@/games/paint-and-guess/components/AvatarCustomizer";
import { AvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    // Try to load from user first, then localStorage
    if (user?.avatarConfig) {
      try {
        return JSON.parse(user.avatarConfig);
      } catch {
        // Fall through to localStorage
      }
    }
    return safeLoadAvatarConfig() || createDefaultAvatarConfig();
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    // Load avatar config from user or localStorage
    if (user?.avatarConfig) {
      try {
        const parsed = JSON.parse(user.avatarConfig);
        setAvatarConfig(parsed);
        return;
      } catch {
        // Fall through
      }
    }
    const stored = safeLoadAvatarConfig();
    if (stored) {
      setAvatarConfig(stored);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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

        {/* User Profile / Auth Section */}
        <div className="mt-auto space-y-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 px-3 text-sm font-medium"
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    <AvatarPreview config={avatarConfig} size={32} />
                  </div>
                  <div className="flex flex-col items-start flex-1 text-left min-w-0">
                    <span className="text-sm font-medium truncate w-full">{user.username}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCustomizerOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Avatar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="w-full justify-start gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
          
          {!isAuthenticated && (
            <Button
              variant="outline"
              onClick={() => setIsCustomizerOpen(true)}
              className="w-full justify-start gap-3 h-auto py-3 px-3 text-sm font-medium"
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <AvatarPreview config={avatarConfig} size={32} />
              </div>
              <div className="flex flex-col items-start flex-1 text-left">
                <span className="text-sm font-medium">{avatarConfig.name}</span>
                <span className="text-xs text-muted-foreground">Customize avatar</span>
              </div>
              <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        <AvatarCustomizer
          open={isCustomizerOpen}
          onOpenChange={setIsCustomizerOpen}
          initialConfig={avatarConfig}
          onSave={(config) => {
            setAvatarConfig(config);
            window.dispatchEvent(new CustomEvent("avatar-config-updated", { detail: config }));
          }}
        />
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

