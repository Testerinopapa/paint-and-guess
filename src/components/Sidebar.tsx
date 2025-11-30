import { Home, Library, Clock, Star, Settings, TrendingUp, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { icon: Home, label: "Home", to: "/hub" },
    { icon: Library, label: "Library", to: "/hub/library" },
    { icon: Clock, label: "Recent", to: "/hub/recent" },
    { icon: Star, label: "Favorites", to: "/hub/favorites" },
    { icon: TrendingUp, label: "Trending", to: "/hub/trending" },
    { icon: User, label: "Friends", to: "/hub/friends" },
  ];

  return (
    <aside className="w-16 bg-sidebar-bg border-r border-border flex flex-col items-center py-6 gap-6">
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-xl">
        G
      </div>
      
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`
            }
            title={item.label}
            end={item.to === "/hub"}
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

