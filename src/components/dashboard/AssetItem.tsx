import { Play, FolderOpen, ImageIcon, File, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetItemProps {
  name: string;
  type: "pdf" | "video" | "file" | "folder" | "image";
  size?: string;
  date: string;
  count?: number;
}

const AssetItem = ({ name, type, size, date, count }: AssetItemProps) => {
  const getIcon = () => {
    switch (type) {
      case "video": return <Play className="w-4 h-4" />;
      case "folder": return <FolderOpen className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };
  
  const getPreviewBg = () => {
    switch (type) {
      case "video": return "bg-gradient-to-br from-primary/20 to-primary/5";
      case "folder": return "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5";
      case "image": return "bg-gradient-to-br from-green-500/20 to-green-500/5";
      default: return "bg-gradient-to-br from-muted/50 to-muted/20";
    }
  };
  
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground",
        getPreviewBg()
      )}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{name}</div>
        <div className="text-xs text-muted-foreground">
          {count ? `${count} items` : size} · {date}
        </div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all">
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default AssetItem;
