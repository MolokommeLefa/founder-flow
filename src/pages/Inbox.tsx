import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  Inbox as InboxIcon,
  MoreHorizontal,
  PenSquare,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Paperclip,
  ArrowUp,
  Plus,
  FileText,
  FolderOpen,
} from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDocuments } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Attachment = {
  kind: "document" | "project";
  id: string;
  label: string;
};

type Message = {
  id: string;
  author: string;
  authorColor: string;
  subject: string;
  preview: string;
  body: string;
  createdAt: Date;
  unread?: boolean;
  attachments?: Attachment[];
};

const seedMessages = (): Message[] => [
  {
    id: "m1",
    author: "Alex",
    authorColor: "bg-emerald-500",
    subject: "App crashes during onboarding",
    preview: "hey, john kindly have a look at...",
    body: "Hey John,\n\nNoticed the app crashes for new users during the onboarding flow when uploading their avatar. Could you take a look when you get a chance?",
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    unread: true,
  },
  {
    id: "m2",
    author: "Maya",
    authorColor: "bg-emerald-500",
    subject: "UI improvements update",
    preview: "hey, john kindly have a look at...",
    body: "Hey John,\n\nShipped the latest UI polish for the dashboard. Padding on cards, refined typography on metrics, and a few motion tweaks.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unread: true,
  },
  {
    id: "m3",
    author: "Mike",
    authorColor: "bg-zinc-500",
    subject: "Security discussion report",
    preview: "good day, mike just finished compili...",
    body: "Good day team,\n\nJust finished compiling the security audit report. Highlights: RLS coverage, storage bucket review, and a quick threat model.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unread: true,
  },
  {
    id: "m4",
    author: "Emily",
    authorColor: "bg-orange-500",
    subject: "Q4 report update",
    preview: "hi, Emily just sent you the q4 report doc...",
    body: "Hi team,\n\nSharing the Q4 report draft. Numbers look strong across activation and retention. Open to comments before Friday.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "m5",
    author: "Team",
    authorColor: "bg-violet-500",
    subject: "Weekly standup discussion",
    preview: "Good day team, just a quick reminder...",
    body: `Hey John\nHere's a refined version with improved clarity and visual flow:\nAnother week of designing a life I can't wait to wake up to.\nThis week has mostly been about creativity—dialing in the creative side of things. I've realized that the more creative I am, the more I'm able to really dial in on things that bring the greatest ROI for my life and business.\n\nI've also been locking in on the core vision of my life and where I'm looking to go. Sometimes I think it's important to take some time off from the constant busyness and decision-making, and really reflect on your vision in life:\n\n- Where you currently are\n- Where you're looking to go\n- What you need to do to get there\nI found that by doing this, I get more clarity on my life as a whole.\nA quote I live by daily that keeps me grounded: "Slow is smooth, and smooth is fast."\nClarity is found in stillness.`,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
];

const Inbox = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [activeId, setActiveId] = useState<string>("m5");
  const [reply, setReply] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  const { documents } = useDocuments();
  const { projects } = useProjects();
  const replyRef = useRef<HTMLTextAreaElement>(null);

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

  const active = useMemo(() => messages.find((m) => m.id === activeId), [messages, activeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const openMessage = (id: string) => {
    setActiveId(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  };

  const handleCompose = () => {
    const m: Message = {
      id: `m-${Date.now()}`,
      author: userName,
      authorColor: "bg-primary",
      subject: "New message",
      preview: "Draft message...",
      body: "Write your message...",
      createdAt: new Date(),
    };
    setMessages((prev) => [m, ...prev]);
    setActiveId(m.id);
  };

  const sendReply = () => {
    if (!active || (!reply.trim() && pendingAttachments.length === 0)) return;
    const attachmentLine = pendingAttachments.length
      ? `\n\nAttached: ${pendingAttachments.map((a) => `${a.kind === "document" ? "📄" : "📁"} ${a.label}`).join(", ")}`
      : "";
    const updatedBody = `${active.body}\n\n— ${userName}\n${reply}${attachmentLine}`;
    setMessages((prev) =>
      prev.map((m) => (m.id === active.id ? { ...m, body: updatedBody, createdAt: new Date() } : m)),
    );
    setReply("");
    setPendingAttachments([]);
    toast.success("Reply sent");
  };

  const attachDocument = (docId: string, name: string) => {
    if (pendingAttachments.some((a) => a.id === docId)) return;
    setPendingAttachments((p) => [...p, { kind: "document", id: docId, label: name }]);
  };
  const attachProject = (pId: string, title: string) => {
    if (pendingAttachments.some((a) => a.id === pId)) return;
    setPendingAttachments((p) => [...p, { kind: "project", id: pId, label: title }]);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar
          activeItem="Inbox"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Inbox
            <InboxIcon className="w-7 h-7 text-muted-foreground" />
          </h1>
          <p className="text-muted-foreground mt-2">Manage your messages effortlessly</p>
        </div>

        {/* Two-column inbox */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[560px]">
          {/* List */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Inbox<span className="text-muted-foreground">({messages.filter((m) => m.unread).length})</span>
                </span>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCompose}>
                  <PenSquare className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openMessage(m.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 transition-colors",
                    activeId === m.id ? "bg-secondary/60" : "hover:bg-secondary/30",
                  )}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-white",
                        m.authorColor,
                      )}
                    >
                      {m.author.charAt(0)}
                    </div>
                    {m.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{m.subject}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(m.createdAt, { addSuffix: false })
                          .replace("about ", "")
                          .replace(" minutes", "m")
                          .replace(" minute", "m")
                          .replace(" hours", "h")
                          .replace(" hour", "h")
                          .replace(" days", "d ago")
                          .replace(" day", "d ago")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reading pane */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
            {active ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">{active.subject}</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white",
                      active.authorColor,
                    )}
                  >
                    {active.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{active.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(active.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                    {active.body}
                  </pre>
                </div>

                {/* Composer */}
                <div className="px-5 pb-5">
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingAttachments.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-secondary border border-border"
                        >
                          {a.kind === "document" ? (
                            <FileText className="w-3 h-3" />
                          ) : (
                            <FolderOpen className="w-3 h-3" />
                          )}
                          {a.label}
                          <button
                            onClick={() =>
                              setPendingAttachments((p) => p.filter((x) => x.id !== a.id))
                            }
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="rounded-2xl border border-border bg-background/60 backdrop-blur-xl p-3">
                    <Textarea
                      ref={replyRef}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Reply......"
                      className="min-h-[80px] border-0 bg-transparent resize-none focus-visible:ring-0 px-1"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuLabel className="text-xs">Attach document</DropdownMenuLabel>
                          {documents.length === 0 && (
                            <DropdownMenuItem disabled className="text-xs">
                              No documents
                            </DropdownMenuItem>
                          )}
                          {documents.slice(0, 5).map((d) => (
                            <DropdownMenuItem key={d.id} onClick={() => attachDocument(d.id, d.name)}>
                              <FileText className="w-3.5 h-3.5 mr-2" />
                              <span className="truncate">{d.name}</span>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs">Link project</DropdownMenuLabel>
                          {projects.length === 0 && (
                            <DropdownMenuItem disabled className="text-xs">
                              No projects
                            </DropdownMenuItem>
                          )}
                          {projects.slice(0, 5).map((p) => (
                            <DropdownMenuItem key={p.id} onClick={() => attachProject(p.id, p.title)}>
                              <FolderOpen className="w-3.5 h-3.5 mr-2" />
                              <span className="truncate">{p.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        size="icon"
                        onClick={sendReply}
                        className="h-8 w-8 rounded-full"
                        disabled={!reply.trim() && pendingAttachments.length === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a message
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inbox;
