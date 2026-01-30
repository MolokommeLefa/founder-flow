import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FolderOpen, 
  ImageIcon, 
  FileText, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Zap,
  Settings,
  Search,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const sidebarApps = [
  { icon: LayoutDashboard, name: "Dashboard", active: true },
  { icon: CheckSquare, name: "Tasks", badge: 3 },
  { icon: Calendar, name: "Calendar" },
  { icon: FolderOpen, name: "Projects" },
  { icon: ImageIcon, name: "Media Library" },
  { icon: FileText, name: "Documents" },
  { icon: Users, name: "Team" },
  { icon: BarChart3, name: "Analytics" },
  { icon: MessageSquare, name: "Inbox", badge: 12 },
  { icon: Zap, name: "Automations" },
];

interface SidebarItemProps {
  icon: React.ElementType;
  name: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, name, active = false, badge, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors w-full text-left",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium flex-1">{name}</span>
    {badge && (
      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

const DashboardSidebar = () => {
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
    <aside className="w-56 border-r border-border bg-secondary/30 p-3 flex flex-col h-full">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border mb-4">
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search...</span>
        <span className="ml-auto text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</span>
      </div>
      
      {/* Apps */}
      <div className="space-y-1 flex-1">
        {sidebarApps.map((app) => (
          <SidebarItem 
            key={app.name} 
            icon={app.icon} 
            name={app.name} 
            active={app.active}
            badge={app.badge}
          />
        ))}
      </div>
      
      {/* Settings & Logout */}
      <div className="pt-4 border-t border-border space-y-1">
        <SidebarItem icon={Settings} name="Settings" />
        <SidebarItem icon={LogOut} name="Sign Out" onClick={handleSignOut} />
      </div>
    </aside>
  );
};

export default DashboardSidebar;
