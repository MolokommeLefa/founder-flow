import { useState } from "react";
import {
  LayoutDashboard,
  SquarePen,
  Calendar,
  Folder,
  Library,
  StickyNote,
  UserRound,
  BarChart4,
  Inbox,
  Zap,
  Settings,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ThemeToggle from "./ThemeToggle";
import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";

type AlertKey = "tasks" | "inbox";
const sidebarApps: Array<{ icon: React.ElementType; name: string; href?: string; alertKey?: AlertKey }> = [
  { icon: LayoutDashboard, name: "Dashboard", href: "/dashboard" },
  { icon: SquarePen, name: "Tasks", alertKey: "tasks", href: "/tasks" },
  { icon: Calendar, name: "Calendar", href: "/calendar" },
  { icon: Folder, name: "Projects", href: "/projects" },
  { icon: Library, name: "Media Library" },
  { icon: StickyNote, name: "Documents", href: "/documents" },
  { icon: UserRound, name: "Team" },
  { icon: BarChart4, name: "Analytics", href: "/analytics" },
  { icon: Inbox, name: "Inbox", alertKey: "inbox", href: "/inbox" },
  { icon: Zap, name: "Automations" },
];

interface SidebarItemProps {
  icon: React.ElementType;
  name: string;
  active?: boolean;
  dot?: boolean;
  onClick?: () => void;
  href?: string;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, name, active = false, dot, onClick, href, collapsed = false }: SidebarItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <Tooltip delayDuration={collapsed ? 0 : 999999}>
      <TooltipTrigger asChild>
        <div className="relative">
          <button
            onClick={handleClick}
            className={cn(
              "group flex items-center rounded-xl cursor-pointer transition-all duration-300 ease-out w-full text-left overflow-hidden",
              collapsed ? "px-2 py-2 justify-center gap-0" : "px-3 py-2.5 gap-3",
              active
                ? "bg-secondary/60 text-foreground border border-border/60"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.5} />
            <span className={cn(
              "text-sm font-medium flex-1 whitespace-nowrap transition-all duration-300 ease-out",
              collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
            )}>
              {name}
            </span>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] flex-shrink-0 transition-all duration-300 ease-out",
              collapsed ? "opacity-0 max-w-0 ml-0" : "opacity-100 max-w-4 ml-auto",
              !dot && "hidden"
            )} />
            {collapsed && dot && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            )}
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {name}
      </TooltipContent>
    </Tooltip>
  );
};

const SettingsItem = ({ collapsed }: { collapsed: boolean }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="group flex items-center justify-center px-2 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors w-full"
            >
              <Settings className="w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-90" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="flex items-center gap-2">
            <span>Theme</span>
            <ThemeToggle />
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="group flex items-center gap-3 rounded-lg cursor-pointer transition-colors w-full text-left px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      >
        <Settings className="w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-90" />
        <span className="text-sm font-medium flex-1">Settings</span>
      </button>
      {settingsOpen && (
        <div className="ml-7 mt-1 mb-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/30">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      )}
    </div>
  );
};

interface DashboardSidebarProps {
  activeItem?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

const DashboardSidebar = ({ activeItem = "Dashboard", collapsed = false, onToggle }: DashboardSidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <aside className={cn(
      "border-r border-border bg-secondary/30 p-3 flex flex-col h-full transition-all duration-300 ease-out overflow-hidden",
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors mb-3"
      >
        {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {/* Search */}
      {!collapsed ? (
        <div
          onClick={() => window.dispatchEvent(new CustomEvent("open-workspace-search"))}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border mb-4 cursor-pointer hover:bg-secondary/50 transition-colors animate-fade-in"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search...</span>
          <span className="ml-auto text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</span>
        </div>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div
              onClick={() => window.dispatchEvent(new CustomEvent("open-workspace-search"))}
              className="flex items-center justify-center p-2 rounded-lg bg-background border border-border mb-4 cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Search (⌘K)</TooltipContent>
        </Tooltip>
      )}
      
      {/* Apps */}
      <div className="space-y-1 flex-1">
        {sidebarApps.map((app) => (
          <SidebarItem 
            key={app.name} 
            icon={app.icon} 
            name={app.name} 
            active={app.name === activeItem}
            dot={app.dot}
            href={app.href}
            collapsed={collapsed}
          />
        ))}
      </div>
      
      {/* Settings & Logout */}
      <div className="pt-4 border-t border-border space-y-1">
        {/* Settings with expandable theme toggle */}
        <SettingsItem collapsed={collapsed} />
        <SidebarItem icon={LogOut} name="Sign Out" onClick={handleSignOut} collapsed={collapsed} />
      </div>
    </aside>
  );
};

export default DashboardSidebar;
