import { LucideIcon } from "lucide-react";

interface AppCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  color: string;
  delay?: number;
}

const AppCard = ({ icon: Icon, name, description, color, delay = 0 }: AppCardProps) => {
  return (
    <div 
      className="group p-6 rounded-2xl gradient-card border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: color }}
      >
        <Icon className="w-7 h-7 text-primary-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default AppCard;
