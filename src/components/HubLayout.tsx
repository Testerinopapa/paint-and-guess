import { useEffect, useMemo, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  PaintBucket, 
  Settings, 
  Sparkles, 
  LogIn, 
  LogOut, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Gamepad2,
  Brain,
  Puzzle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGameRegistry } from "@/games/registry";
import type { HubGame } from "@/games/registry";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { AvatarCustomizer } from "@/games/paint-and-guess/components/AvatarCustomizer";
import { AvatarConfig, createDefaultAvatarConfig, setupAvatarCrossTabSync, encodeAvatarConfig, saveAvatarConfig } from "@/lib/avatar/config";
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
  icon?: React.ComponentType<{ className?: string }>;
  subItems?: NavigationLink[];
};

// Icon mapping for games
const getGameIcon = (gameId: string, label: string): React.ComponentType<{ className?: string }> => {
  const id = gameId.toLowerCase();
  const lowerLabel = label.toLowerCase();
  
  if (id.includes("paint") || id.includes("draw") || lowerLabel.includes("paint")) {
    return PaintBucket;
  }
  if (id.includes("trivia") || lowerLabel.includes("trivia")) {
    return Brain;
  }
  if (id.includes("puzzle") || lowerLabel.includes("puzzle")) {
    return Puzzle;
  }
  // Default game icon
  return Gamepad2;
};

export function buildNavigationLinks(games: HubGame[]): NavigationLink[] {
  const derivedLinks = games
    .filter((game) => game.isEnabled && !game.navHidden)
    .map((game) => {
      // Normalize route path: if it starts with /games/, prepend /hub
      let routePath = game.derivedRoute ?? game.route.path;
      if (routePath.startsWith("/games/") && !routePath.startsWith("/hub/games/")) {
        routePath = `/hub${routePath}`;
      }
      return {
        label: game.navLabel ?? game.displayName ?? game.id,
        to: routePath,
        category: game.navCategory ?? game.category?.[0] ?? "uncategorized",
        priority: game.navPriority ?? 0,
        icon: getGameIcon(game.id, game.navLabel ?? game.displayName ?? game.id),
      };
    })
    .sort((a, b) => {
      const categorySort = a.category.localeCompare(b.category);
      if (categorySort !== 0) return categorySort;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.label.localeCompare(b.label);
    });

  return [
    { label: "All Games", to: "/hub", category: "hub", priority: Number.POSITIVE_INFINITY, icon: Home },
    ...derivedLinks,
  ];
}

const HubLayout = () => {
  const { games } = useGameRegistry();
  const navigation = useMemo(() => buildNavigationLinks(games), [games]);
  const { user, isAuthenticated, logout, isLoading: authLoading, updateAvatar, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    // Initialize with default - useEffect will load actual avatar when user data is ready
    return createDefaultAvatarConfig();
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem("hub-sidebar-collapsed");
    return saved === "true";
  });
  const hasSyncedAvatarRef = useRef<boolean>(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("hub-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    // Wait for auth loading to complete before processing avatar
    if (authLoading) {
      return;
    }

    // Only process if user object is loaded (not loading state)
    if (!user && !isAuthenticated) {
      // Not logged in - handle anonymous case
      const anonymousStored = safeLoadAvatarConfig(null);
      if (anonymousStored) {
        setAvatarConfig(anonymousStored);
      } else {
        setAvatarConfig(createDefaultAvatarConfig());
      }
      return;
    }

    if (!user?.id) {
      // User object not loaded yet, wait
      return;
    }

    // Load avatar config from database (priority) or localStorage
    if (user?.avatarConfig) {
      try {
        const parsed = JSON.parse(user.avatarConfig);
        setAvatarConfig(parsed);
        // Save to user-specific localStorage for offline access and cross-tab sync
        saveAvatarConfig(parsed, false, user.id); // false = don't trigger cross-tab sync (we just loaded it)
        return;
      } catch (error) {
        console.error('[HubLayout] Failed to parse database avatar config:', error);
        // Fall through to localStorage
      }
    }
    
    // User is logged in but has no database avatar - check localStorage
    if (user?.id) {
      const stored = safeLoadAvatarConfig(user.id);
      if (stored) {
        setAvatarConfig(stored);
      } else {
        // User has no saved avatar, use default (not anonymous avatar)
        const defaultConfig = createDefaultAvatarConfig();
        setAvatarConfig(defaultConfig);
        // Save default to user's storage for consistency
        saveAvatarConfig(defaultConfig, false, user.id);
      }
      return;
    }
  }, [user, isAuthenticated, authLoading]);

  // Separate effect for syncing localStorage avatar to database (prevents React error #185)
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user?.id || !updateAvatar || !updateUser) {
      return;
    }

    // Only sync if database doesn't have avatar but localStorage does
    if (!user.avatarConfig && hasSyncedAvatarRef.current === false) {
      const stored = safeLoadAvatarConfig(user.id);
      if (stored) {
        hasSyncedAvatarRef.current = true;
        const encoded = encodeAvatarConfig(stored);
        // Use a timeout to ensure this runs after render completes
        const timeoutId = setTimeout(() => {
          updateAvatar(encoded)
            .then(() => {
              // Small delay before refetching to avoid rapid state updates
              setTimeout(() => {
                updateUser();
              }, 100);
            })
            .catch((error) => {
              console.error('[HubLayout] Failed to sync localStorage avatar to database:', error);
              hasSyncedAvatarRef.current = false; // Reset on error to allow retry
            });
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.avatarConfig, isAuthenticated, authLoading]);

  // Reset sync flag when user changes
  useEffect(() => {
    hasSyncedAvatarRef.current = false;
  }, [user?.id]);

  // Set up cross-tab synchronization for avatar changes (user-specific)
  useEffect(() => {
    const cleanup = setupAvatarCrossTabSync((config) => {
      console.log('[HubLayout] Avatar updated in another tab:', config);
      setAvatarConfig(config);
    }, user?.id);
    return cleanup;
  }, [user?.id]);

  const handleLogout = async () => {
    // Note: We keep the avatar in localStorage (user-specific key) so it persists
    // When the user logs back in, their database avatar will be loaded and saved
    // The user-specific key ensures no cross-contamination between accounts
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside
        className={`hidden md:flex border-r bg-background flex-col transition-all duration-300 ease-in-out relative ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-accent transition-colors"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Header */}
        <div className={`flex items-center gap-2 px-4 py-4 border-b ${isSidebarCollapsed ? "justify-center" : ""}`}>
          <Sparkles className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && <span className="text-lg font-semibold">Game Hub</span>}
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <TooltipProvider delayDuration={0}>
            {navigation.map((item) => {
              const Icon = item.icon || Gamepad2;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              const isActive = location.pathname === item.to || 
                (item.to !== "/hub" && location.pathname.startsWith(item.to));

              // Expanded state - full navigation
              if (!isSidebarCollapsed) {
                if (hasSubItems) {
                  return (
                    <DropdownMenu key={item.to}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/50 ${
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 rotate-90" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="w-48">
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon || Gamepad2;
                          const isSubActive = location.pathname === subItem.to;
                          return (
                            <DropdownMenuItem key={subItem.to} asChild>
                              <NavLink
                                to={subItem.to}
                                className={`flex items-center gap-2 cursor-pointer ${
                                  isSubActive ? "bg-accent" : ""
                                }`}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                              </NavLink>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                      }`
                    }
                    end={item.to === "/hub"}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }

              // Collapsed state - icon with tooltip or dropdown
              if (hasSubItems) {
                return (
                  <DropdownMenu key={item.to}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/50 relative ${
                              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="right" align="start" className="w-48">
                      <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon || Gamepad2;
                        const isSubActive = location.pathname === subItem.to;
                        return (
                          <DropdownMenuItem key={subItem.to} asChild>
                            <NavLink
                              to={subItem.to}
                              className={`flex items-center gap-2 cursor-pointer ${
                                isSubActive ? "bg-accent" : ""
                              }`}
                            >
                              <SubIcon className="h-4 w-4" />
                              <span>{subItem.label}</span>
                            </NavLink>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/50 ${
                          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                      end={item.to === "/hub"}
                    >
                      <Icon className="h-4 w-4" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* User Profile / Auth Section */}
        <div className="mt-auto border-t px-2 py-4 space-y-2">
          {authLoading ? (
            <div className={`w-full p-3 text-center text-sm text-muted-foreground ${isSidebarCollapsed ? "px-0" : ""}`}>
              {isSidebarCollapsed ? "..." : "Loading..."}
            </div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full h-auto py-3 px-3 text-sm font-medium ${
                    isSidebarCollapsed ? "justify-center" : "justify-start gap-3"
                  }`}
                  title={isSidebarCollapsed ? `${user.username} (${user.email})` : undefined}
                >
                  <div className="h-8 w-8 flex items-center justify-center shrink-0">
                    <AvatarPreview config={avatarConfig} size={32} />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col items-start flex-1 text-left min-w-0">
                      <span className="text-sm font-medium truncate w-full">{user.username}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                    </div>
                  )}
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
              className={`w-full gap-2 ${isSidebarCollapsed ? "justify-center" : "justify-start"}`}
              title={isSidebarCollapsed ? "Sign In" : undefined}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Sign In</span>}
            </Button>
          )}
          
          {!isAuthenticated && !isSidebarCollapsed && (
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
          {!isAuthenticated && isSidebarCollapsed && (
            <Button
              variant="outline"
              onClick={() => setIsCustomizerOpen(true)}
              className="w-full justify-center h-auto py-3 px-3"
              title="Customize avatar"
            >
              <div className="h-8 w-8 flex items-center justify-center">
                <AvatarPreview config={avatarConfig} size={32} />
              </div>
            </Button>
          )}
        </div>

        <AvatarCustomizer
          open={isCustomizerOpen}
          onOpenChange={setIsCustomizerOpen}
          initialConfig={avatarConfig}
          onSave={async (config) => {
            setAvatarConfig(config);
            window.dispatchEvent(new CustomEvent("avatar-config-updated", { detail: config }));
            
            // Save with backend sync if authenticated (user-specific storage)
            const encoded = encodeAvatarConfig(config);
            
            try {
              if (isAuthenticated && updateAvatar && user?.id) {
                // Save locally first
                saveAvatarConfig(config, true, user.id);
                
                // Then sync to database and wait for completion
                await updateAvatar(encoded);
                
                // Refetch user to ensure state is updated with database avatar
                await updateUser();
                
                console.log('[HubLayout] Avatar saved and synced to database successfully');
              } else {
                // Not authenticated - just save locally
                saveAvatarConfig(config, true, user?.id);
              }
            } catch (error) {
              console.error('[HubLayout] Failed to sync avatar to backend:', error);
              // Local save succeeded, but database sync failed
              // Avatar is still in localStorage and will be available
              // User will see an error but avatar is saved locally
            }
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
                <NavLink to={item.to} end={item.to === "/hub"}>
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

