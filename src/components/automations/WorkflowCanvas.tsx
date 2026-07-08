import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Zap,
  GitBranch,
  Workflow,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Calendar,
  Database,
  FileText,
  Webhook,
  Clock,
  Filter,
  Send,
} from "lucide-react";

export type NodeKind = "trigger" | "condition" | "action";

export type WorkflowNode = {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle?: string;
  tool?: string;
  x: number;
  y: number;
};

export type WorkflowEdge = { from: string; to: string };

interface Props {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onAdd: (kind: NodeKind) => void;
}

const NODE_W = 220;
const NODE_H = 110;

const kindStyles: Record<NodeKind, { icon: any; ring: string; badge: string; label: string }> = {
  trigger: {
    icon: Zap,
    ring: "ring-emerald-400/40 hover:ring-emerald-400/70",
    badge: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    label: "Trigger",
  },
  condition: {
    icon: GitBranch,
    ring: "ring-amber-400/40 hover:ring-amber-400/70",
    badge: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    label: "Condition",
  },
  action: {
    icon: Workflow,
    ring: "ring-sky-400/40 hover:ring-sky-400/70",
    badge: "text-sky-300 bg-sky-400/10 border-sky-400/20",
    label: "Action",
  },
};

export const toolIcons: Record<string, any> = {
  Gmail: Mail,
  Slack: MessageSquare,
  Calendar: Calendar,
  Database: Database,
  Docs: FileText,
  Webhook: Webhook,
  Delay: Clock,
  Filter: Filter,
  Send: Send,
};

const WorkflowCanvas = ({ nodes, edges, selectedId, onSelect, onMove, onDelete, onAdd }: Props) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragging({
      id: node.id,
      dx: e.clientX - rect.left - node.x,
      dy: e.clientY - rect.top - node.y,
    });
    onSelect(node.id);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragging.dx);
      const y = Math.max(0, e.clientY - rect.top - dragging.dy);
      onMove(dragging.id, x, y);
    },
    [dragging, onMove]
  );

  const pathFor = (from: WorkflowNode, to: WorkflowNode) => {
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    const mid = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-2 text-sm text-foreground/90">
          <Workflow className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-medium">Workflow Canvas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAdd("trigger")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Trigger
          </button>
          <button
            onClick={() => onAdd("condition")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Condition
          </button>
          <button
            onClick={() => onAdd("action")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-sky-300 bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Action
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
        onClick={(e) => {
          if (e.target === canvasRef.current) onSelect(null);
        }}
        className="relative w-full h-[calc(100vh-260px)] min-h-[640px] overflow-auto"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 1400, minHeight: 800 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground) / 0.6)" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            return (
              <path
                key={i}
                d={pathFor(from, to)}
                fill="none"
                stroke="hsl(var(--muted-foreground) / 0.5)"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const style = kindStyles[node.kind];
          const Icon = style.icon;
          const ToolIcon = node.tool ? toolIcons[node.tool] : null;
          const isSelected = selectedId === node.id;
          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
              }}
              className={cn(
                "absolute select-none cursor-grab active:cursor-grabbing rounded-xl bg-background/80 backdrop-blur-xl border border-border/60 ring-1 transition-all",
                style.ring,
                isSelected && "ring-2 ring-foreground/40 shadow-lg"
              )}
              style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className={cn("flex items-center gap-1.5 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border", style.badge)}>
                  <Icon className="w-3 h-3" strokeWidth={1.75} />
                  {style.label}
                </div>
                {isSelected && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="px-3 py-2.5 flex items-start gap-2.5">
                {ToolIcon && (
                  <div className="w-8 h-8 rounded-md bg-secondary/60 border border-border/60 flex items-center justify-center flex-shrink-0">
                    <ToolIcon className="w-4 h-4 text-foreground/80" strokeWidth={1.5} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{node.title}</div>
                  {node.subtitle && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{node.subtitle}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
