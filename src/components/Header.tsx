import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-soft">
            <img alt="FounderOS logo" className="w-7 h-7 object-contain" src="/lovable-uploads/9c058fc6-0acd-4b31-8e52-d8655e17f93f.png" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">FounderOS</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#apps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Apps</a>
          <a href="#dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button variant="default" size="sm" onClick={() => navigate("/auth?mode=signup")}>
            Get Started
          </Button>
        </div>
      </div>
    </header>);

};

export default Header;