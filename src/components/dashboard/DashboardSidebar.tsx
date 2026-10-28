import { useState } from "react";
import {
  LayoutDashboard,
  SquarePen,
  Calendar,
  Folder,
  StickyNote,
  BarChart4,
  Zap,
  Settings,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";
import { useProfile } from "@/hooks/useProfile";

type AlertKey = "tasks" | "inbox";
const sidebarApps: Array<{ icon: React.ElementType; name: string; href?: string; alertKey?: AlertKey }> = [
  { icon: LayoutDashboard, name: "Dashboard", href: "/dashboard" },
  { icon: SquarePen, name: "Tasks", alertKey: "tasks", href: "/tasks" },
  { icon: Calendar, name: "Calendar", href: "/calendar" },
  { icon: StickyNote, name: "Notes", href: "/documents" },
  { icon: BarChart4, name: "Analytics", href: "/analytics" },
  { icon: Folder, name: "Projects", href: "/projects" },
  { icon: Zap, name: "Automations", href: "/automations" },
];port { useState } from "react";
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
  PanelLeftOpen,
  ChevronDown,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";
import { useProfile } from "@/hooks/useProfile";

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
  { icon: Zap, name: "Automations", href: "/automations" },
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
              "group flex items-center rounded-lg cursor-pointer transition-colors duration-200 w-full text-left overflow-hidden",
              collapsed ? "px-2.5 py-2.5 justify-center gap-0" : "px-3 py-2.5 gap-3",
              active
                ? "bg-secondary/70 text-foreground border border-border/80"
                : "border border-transparent text-muted-foreground hover:bg-secondary/45 hover:text-foreground"
            )}
          >
            <Icon className="w-[19px] h-[19px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105" strokeWidth={1.65} />
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
  const { profile, updateDisplayName } = useProfile();
  const [displayName, setDisplayName] = useState("");

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
          <div className="flex flex-col gap-2">
            <span>Settings</span>
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
        <div className="ml-7 mt-1 mb-1 space-y-2 px-3 py-2 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <div className="space-y-1">
            <label htmlFor="display-name" className="text-xs text-muted-foreground">Display name</label>
            <Input
              id="display-name"
              placeholder="Set a custom greeting name"
              defaultValue={profile?.display_name || ""}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => {
                if (displayName.trim() && displayName.trim() !== profile?.display_name) {
                  updateDisplayName(displayName);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && displayName.trim() && displayName.trim() !== profile?.display_name) {
                  updateDisplayName(displayName);
                }
              }}
              className="h-8 text-xs bg-background"
            />
          </div>
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
  const { hasPendingTasks, hasUnreadInbox } = useNotificationAlerts();
  const [accountOpen, setAccountOpen] = useState(false);

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
      "border-r border-border/80 bg-background px-3 py-4 flex flex-col h-full transition-all duration-300 ease-out overflow-hidden",
      collapsed ? "w-[76px]" : "w-[252px]"
    )}>
      {/* Brand and compact utility control */}
      <div className={cn("mb-5 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 text-foreground">
            <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-base font-semibold tracking-tight">Lefa</span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

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
      <div className="space-y-1 flex-1 pt-1">
        {sidebarApps.map((app) => (
          <SidebarItem 
            key={app.name} 
            icon={app.icon} 
            name={app.name} 
            active={app.name === activeItem}
            dot={app.alertKey === "tasks" ? hasPendingTasks : app.alertKey === "inbox" ? hasUnreadInbox : false}
            href={app.href}
            collapsed={collapsed}
          />
        ))}
      </div>

      
      {/* Account area */}
      <div className="mt-4 border-t border-border/80 pt-4">
        {!collapsed ? (
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/40">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-medium text-foreground">LM</div>
            <button onClick={() => setAccountOpen((open) => !open)} className="flex min-w-0 flex-1 items-center gap-1 text-left">
              <span className="truncate text-[11px] text-foreground">Lefa molokomme</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
            <button onClick={onToggle} aria-label="Collapse sidebar" className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><PanelRight className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-secondary text-[10px] font-medium">LM</div>
            <button onClick={onToggle} aria-label="Expand sidebar" className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><PanelRight className="h-4 w-4" /></button>
          </div>
        )}
        {accountOpen && !collapsed && (
          <div className="mt-2 space-y-1 rounded-lg border border-border bg-card p-2">
            <SettingsItem collapsed={false} />
            <SidebarItem icon={LogOut} name="Sign out" onClick={handleSignOut} collapsed={false} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
