import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { useState, useEffect } from "react";
import { createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const sections = ["My Games", "Store", "Community"];
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarConfig, setAvatarConfig] = useState(() => createDefaultAvatarConfig());

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-topbar-bg border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <nav className="flex items-center gap-6">
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

      <div className="flex items-center gap-4">
        <div className="relative w-64">
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
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-all">
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
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-all">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full"></div>
            <span className="text-sm font-medium text-foreground">Player</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;

