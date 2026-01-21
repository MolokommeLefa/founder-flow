import { 
  CheckSquare, 
  Calendar, 
  Wallet, 
  Users, 
  BarChart3, 
  FolderOpen,
  MessageSquare,
  Zap
} from "lucide-react";
import AppCard from "./AppCard";

const apps = [
  {
    icon: CheckSquare,
    name: "Tasks",
    description: "Organize and prioritize your work with smart task management.",
    color: "linear-gradient(135deg, hsl(15 90% 55%) 0%, hsl(25 95% 60%) 100%)"
  },
  {
    icon: Calendar,
    name: "Calendar",
    description: "Time-blocking and scheduling that respects your freedom.",
    color: "linear-gradient(135deg, hsl(200 90% 50%) 0%, hsl(210 95% 55%) 100%)"
  },
  {
    icon: Wallet,
    name: "Finance",
    description: "Track revenue, expenses, and runway in real-time.",
    color: "linear-gradient(135deg, hsl(150 80% 45%) 0%, hsl(160 85% 50%) 100%)"
  },
  {
    icon: Users,
    name: "Team",
    description: "Manage your team, contractors, and collaborators effortlessly.",
    color: "linear-gradient(135deg, hsl(280 70% 55%) 0%, hsl(290 75% 60%) 100%)"
  },
  {
    icon: BarChart3,
    name: "Analytics",
    description: "Insights and metrics that matter for your business growth.",
    color: "linear-gradient(135deg, hsl(45 90% 50%) 0%, hsl(55 95% 55%) 100%)"
  },
  {
    icon: FolderOpen,
    name: "Documents",
    description: "All your contracts, notes, and files in one secure place.",
    color: "linear-gradient(135deg, hsl(0 0% 40%) 0%, hsl(0 0% 50%) 100%)"
  },
  {
    icon: MessageSquare,
    name: "Inbox",
    description: "Unified communications from email, Slack, and more.",
    color: "linear-gradient(135deg, hsl(340 80% 55%) 0%, hsl(350 85% 60%) 100%)"
  },
  {
    icon: Zap,
    name: "Automations",
    description: "Set up workflows that run your business on autopilot.",
    color: "linear-gradient(135deg, hsl(270 80% 55%) 0%, hsl(280 85% 60%) 100%)"
  },
];

const AppsSection = () => {
  return (
    <section id="apps" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            One ecosystem. <span className="text-gradient">Infinite possibilities.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Like Apple's ecosystem, every app works together seamlessly. Data flows between them, so you never have to switch context.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app, index) => (
            <AppCard
              key={app.name}
              icon={app.icon}
              name={app.name}
              description={app.description}
              color={app.color}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppsSection;
