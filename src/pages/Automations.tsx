import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WorkflowCanvas, {
  NodeKind,
  WorkflowEdge,
  WorkflowNode,
  toolIcons,
} from "@/components/automations/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Play, Plus, CheckCircle2, Circle, Layers, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Workflow = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

const initialWorkflows: Workflow[] = [
  {
    id: "wf-1",
    name: "New lead → Slack alert",
    description: "Notify #sales when a new lead lands in Gmail",
    active: true,
    nodes: [
      { id: "n1", kind: "trigger", title: "New Email received", subtitle: "label: leads", tool: "Gmail", x: 480, y: 40 },
      { id: "n2", kind: "condition", title: "Contains keyword", subtitle: '"demo request"', tool: "Filter", x: 480, y: 200 },
      { id: "n3", kind: "action", title: "Post to Slack", subtitle: "#sales-alerts", tool: "Slack", x: 280, y: 360 },
      { id: "n4", kind: "action", title: "Create calendar event", subtitle: "Follow-up in 24h", tool: "Calendar", x: 680, y: 360 },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n2", to: "n4" },
    ],
  },
  {
    id: "wf-2",
    name: "Weekly digest",
    description: "Send Monday summary email to the team",
    active: false,
    nodes: [
      { id: "n1", kind: "trigger", title: "Every Monday 9AM", subtitle: "Recurring", tool: "Delay", x: 480, y: 60 },
      { id: "n2", kind: "action", title: "Send digest", subtitle: "team@company.com", tool: "Gmail", x: 480, y: 240 },
    ],
    edges: [{ from: "n1", to: "n2" }],
  },
];

const triggerPresets = [
  { title: "New Email received", tool: "Gmail" },
  { title: "New Slack message", tool: "Slack" },
  { title: "Scheduled time", tool: "Delay" },
  { title: "Webhook received", tool: "Webhook" },
  { title: "New database row", tool: "Database" },
];
const conditionPresets = [
  { title: "Contains keyword", tool: "Filter" },
  { title: "Field equals", tool: "Filter" },
];
const actionPresets = [
  { title: "Send email", tool: "Gmail" },
  { title: "Post to Slack", tool: "Slack" },
  { title: "Create calendar event", tool: "Calendar" },
  { title: "Save to database", tool: "Database" },
  { title: "Create document", tool: "Docs" },
  { title: "Wait / delay", tool: "Delay" },
];

const connectableTools = [
  { name: "Gmail", status: "connected" as const },
  { name: "Slack", status: "available" as const },
  { name: "Calendar", status: "available" as const },
  { name: "Webhook", status: "available" as const },
  { name: "Database", status: "connected" as const },
  { name: "Docs", status: "available" as const },
];

const Automations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [activeId, setActiveId] = useState<string>(initialWorkflows[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const activeWorkflow = useMemo(
    () => workflows.find((w) => w.id === activeId) ?? workflows[0],
    [workflows, activeId]
  );
  const selectedNode = activeWorkflow?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const updateActive = (updater: (w: Workflow) => Workflow) => {
    setWorkflows((prev) => prev.map((w) => (w.id === activeId ? updater(w) : w)));
  };

  const handleMove = (id: string, x: number, y: number) => {
    updateActive((w) => ({ ...w, nodes: w.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }));
  };

  const handleAdd = (kind: NodeKind) => {
    const preset =
      kind === "trigger" ? triggerPresets[0] : kind === "condition" ? conditionPresets[0] : actionPresets[0];
    const newNode: WorkflowNode = {
      id: `n-${Date.now()}`,
      kind,
      title: preset.title,
      tool: preset.tool,
      x: 320,
      y: 120 + activeWorkflow.nodes.length * 30,
    };
    updateActive((w) => {
      const lastNode = w.nodes[w.nodes.length - 1];
      const edges = lastNode ? [...w.edges, { from: lastNode.id, to: newNode.id }] : w.edges;
      return { ...w, nodes: [...w.nodes, newNode], edges };
    });
    setSelectedNodeId(newNode.id);
  };

  const handleDelete = (id: string) => {
    updateActive((w) => ({
      ...w,
      nodes: w.nodes.filter((n) => n.id !== id),
      edges: w.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    setSelectedNodeId(null);
  };

  const handleUpdateNode = (patch: Partial<WorkflowNode>) => {
    if (!selectedNodeId) return;
    updateActive((w) => ({
      ...w,
      nodes: w.nodes.map((n) => (n.id === selectedNodeId ? { ...n, ...patch } : n)),
    }));
  };

  const handleNewWorkflow = () => {
    const wf: Workflow = {
      id: `wf-${Date.now()}`,
      name: "Untitled workflow",
      description: "New automation",
      active: false,
      nodes: [
        { id: "n1", kind: "trigger", title: "Choose a trigger", tool: "Gmail", x: 480, y: 80 },
      ],
      edges: [],
    };
    setWorkflows((p) => [...p, wf]);
    setActiveId(wf.id);
    setSelectedNodeId(null);
  };

  const toggleActive = () => {
    updateActive((w) => ({ ...w, active: !w.active }));
    toast.success(activeWorkflow.active ? "Workflow paused" : "Workflow published");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user || !activeWorkflow) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const presetsForKind =
    selectedNode?.kind === "trigger"
      ? triggerPresets
      : selectedNode?.kind === "condition"
      ? conditionPresets
      : actionPresets;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar
          activeItem="Automations"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              Automations <Zap className="w-5 h-5 text-amber-300" strokeWidth={1.5} />
            </h1>
            <p className="text-muted-foreground text-sm">Design workflows that run your business on autopilot</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewWorkflow}>
              <Plus className="w-3.5 h-3.5" /> New workflow
            </Button>
            <Button size="sm" className="gap-1.5" onClick={toggleActive}>
              <Play className="w-3.5 h-3.5" />
              {activeWorkflow.active ? "Pause" : "Publish"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: workflow list + tools */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-2xl p-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-2">
                Workflows
              </div>
              <div className="space-y-1">
                {workflows.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveId(w.id);
                      setSelectedNodeId(null);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors border",
                      w.id === activeId
                        ? "bg-secondary/60 border-border/60 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{w.name}</span>
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          w.active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-muted-foreground/40"
                        )}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{w.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-2xl p-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-2">
                Connected tools
              </div>
              <div className="space-y-1">
                {connectableTools.map((t) => {
                  const Icon = toolIcons[t.name];
                  return (
                    <div
                      key={t.name}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-foreground/80" strokeWidth={1.5} />}
                        <span className="text-sm text-foreground">{t.name}</span>
                      </div>
                      {t.status === "connected" ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Linked
                        </div>
                      ) : (
                        <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                          <Circle className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Center: canvas */}
          <div className="col-span-12 lg:col-span-6">
            <WorkflowCanvas
              nodes={activeWorkflow.nodes}
              edges={activeWorkflow.edges}
              selectedId={selectedNodeId}
              onSelect={setSelectedNodeId}
              onMove={handleMove}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          </div>

          {/* Right: detail panel */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-foreground">Detail Information</div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border",
                    activeWorkflow.active
                      ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                      : "text-muted-foreground bg-secondary/60 border-border/60"
                  )}
                >
                  {activeWorkflow.active ? "● Active" : "○ Draft"}
                </span>
              </div>

              {selectedNode ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Step type</Label>
                    <div className="mt-1 text-sm capitalize text-foreground">{selectedNode.kind}</div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Preset</Label>
                    <Select
                      value={selectedNode.title}
                      onValueChange={(v) => {
                        const p = presetsForKind.find((x) => x.title === v);
                        handleUpdateNode({ title: v, tool: p?.tool });
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {presetsForKind.map((p) => (
                          <SelectItem key={p.title} value={p.title}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tool</Label>
                    <Select
                      value={selectedNode.tool ?? ""}
                      onValueChange={(v) => handleUpdateNode({ tool: v })}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Choose tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(toolIcons).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Configuration</Label>
                    <Input
                      className="mt-1 h-9"
                      placeholder="e.g. label:leads, #sales, keyword…"
                      value={selectedNode.subtitle ?? ""}
                      onChange={(e) => handleUpdateNode({ subtitle: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Select a step on the canvas to configure it, or add a new Trigger, Condition, or Action from the
                  toolbar above the canvas.
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Automations;
