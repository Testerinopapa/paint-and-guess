import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { AvatarCustomizer } from "@/games/paint-and-guess/components/AvatarCustomizer";
import { useState, useEffect } from "react";
import { createDefaultAvatarConfig, AvatarConfig, saveAvatarConfig, encodeAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const sections = ["My Games", "Store", "Community"];
  const { user, isAuthenticated, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [avatarConfig, setAvatarConfig] = useState(() => createDefaultAvatarConfig());
  const [avatarCustomizerOpen, setAvatarCustomizerOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const stored = safeLoadAvatarConfig(user.id);
      if (stored) {
        setAvatarConfig(stored);
      }
    } else {
      const anonymousStored = safeLoadAvatarConfig(null);
      if (anonymousStored) {
        setAvatarConfig(anonymousStored);
      }
    }
  }, [user]);

  // Listen for avatar updates from other tabs/components
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AvatarConfig>).detail;
      if (detail) {
        setAvatarConfig(detail);
      }
    };

    window.addEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener("avatar-config-updated", handleAvatarUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSaveAvatar = async (config: AvatarConfig) => {
    // Save to localStorage with user-specific key if authenticated
    const userId = user?.id || null;
    saveAvatarConfig(config, true, userId);
    setAvatarConfig(config);
    
    // Dispatch event for other components to sync
    window.dispatchEvent(new CustomEvent("avatar-config-updated", { detail: config }));
    
    // Sync to backend if authenticated
    if (isAuthenticated && user?.id) {
      try {
        const encodedConfig = encodeAvatarConfig(config);
        await updateAvatar(encodedConfig);
      } catch (error) {
        console.error('Failed to sync avatar to backend:', error);
        // Don't throw - local save succeeded, backend sync can be retried later
      }
    }
  };

  return (
    <header className="h-16 bg-topbar-bg border-b border-border px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-secondary transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="hidden md:flex items-center gap-6">
          {sections.map((section, index) => (
            <button
              key={section}
              className={`text-sm font-medium transition-colors ${
                index === 0
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative w-32 sm:w-48 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            className="pl-9 bg-secondary border-border text-sm"
          />
        </div>

        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <AvatarPreview config={avatarConfig} size={32} />
                </div>
                <span className="text-sm font-medium text-foreground">{user.username}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAvatarCustomizerOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Customize Avatar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-all">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <AvatarPreview config={avatarConfig} size={32} />
                </div>
                <span className="text-sm font-medium text-foreground">Player</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Guest Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAvatarCustomizerOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Customize Avatar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sm:hidden p-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <AvatarPreview config={avatarConfig} size={32} />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAvatarCustomizerOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Customize Avatar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sm:hidden p-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <AvatarPreview config={avatarConfig} size={32} />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Guest Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAvatarCustomizerOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Customize Avatar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Avatar Customizer Dialog */}
      <AvatarCustomizer
        open={avatarCustomizerOpen}
        onOpenChange={setAvatarCustomizerOpen}
        onSave={handleSaveAvatar}
        initialConfig={avatarConfig}
      />
    </header>
  );
};

export default TopBar;

