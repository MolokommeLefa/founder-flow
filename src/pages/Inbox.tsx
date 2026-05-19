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
  ArrowUp,
  Plus,
  FileText,
  FolderOpen,
  Trash2,
  Mail,
} from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useMessages, type Attachment, type DbMessage } from "@/hooks/useMessages";
import { useGmail, type GmailFullMessage } from "@/hooks/useGmail";
import GmailPanel from "@/components/inbox/GmailPanel";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const colorForId = (id: string) => {
  const palette = [
    "bg-emerald-500",
    "bg-orange-500",
    "bg-violet-500",
    "bg-zinc-500",
    "bg-sky-500",
    "bg-pink-500",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % palette.length;
  return palette[h];
};

const shortAgo = (date: Date) =>
  formatDistanceToNow(date, { addSuffix: false })
    .replace("about ", "")
    .replace("less than a minute", "now")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d ago")
    .replace(" day", "d ago");

const Inbox = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { messages, sendMessage, markRead, deleteMessage } = useMessages(user?.id ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");

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

  // Auto-select first message
  useEffect(() => {
    if (!activeId && messages.length > 0) setActiveId(messages[0].id);
  }, [messages, activeId]);

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

  const unreadCount = messages.filter((m) => !m.read && m.recipient_id === user.id).length;

  const openMessage = (m: DbMessage) => {
    setActiveId(m.id);
    if (!m.read && m.recipient_id === user.id) markRead(m.id);
  };

  const handleSendCompose = async () => {
    const recipient = composeRecipient.trim() || user.id;
    const ok = await sendMessage(
      recipient,
      composeSubject.trim() || "(no subject)",
      composeBody.trim(),
    );
    if (ok) {
      setComposeOpen(false);
      setComposeSubject("");
      setComposeBody("");
      setComposeRecipient("");
    }
  };

  const sendReply = async () => {
    if (!active || (!reply.trim() && pendingAttachments.length === 0)) return;
    // Reply goes back to the original sender (or to self if user authored it)
    const recipient = active.sender_id === user.id ? active.recipient_id : active.sender_id;
    const subject = active.subject.startsWith("Re:") ? active.subject : `Re: ${active.subject}`;
    const ok = await sendMessage(recipient, subject, reply.trim(), pendingAttachments);
    if (ok) {
      setReply("");
      setPendingAttachments([]);
    }
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

        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Inbox
            <InboxIcon className="w-7 h-7 text-muted-foreground" />
          </h1>
          <p className="text-muted-foreground mt-2">Manage your messages effortlessly</p>
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="inbox" className="gap-2">
              <InboxIcon className="w-3.5 h-3.5" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="gmail" className="gap-2">
              <Mail className="w-3.5 h-3.5" /> Gmail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="mt-0">
            <GmailPanel enabled />
          </TabsContent>

          <TabsContent value="inbox" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-260px)] min-h-[560px]">
          {/* List */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Inbox<span className="text-muted-foreground">({unreadCount})</span>
                </span>
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setComposeOpen(true)}>
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
              {messages.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No messages yet. Tap the pencil icon to compose.
                </div>
              )}
              {messages.map((m) => {
                const isUnread = !m.read && m.recipient_id === user.id;
                const created = new Date(m.created_at);
                return (
                  <button
                    key={m.id}
                    onClick={() => openMessage(m)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 transition-colors",
                      activeId === m.id ? "bg-secondary/60" : "hover:bg-secondary/30",
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-white",
                          colorForId(m.sender_id),
                        )}
                      >
                        {(m.sender_id === user.id ? userName : "?").charAt(0).toUpperCase()}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm truncate", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                          {m.subject || "(no subject)"}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {shortAgo(created)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.body || "—"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading pane */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
            {active ? (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">{active.subject || "(no subject)"}</h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMessage(active.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white",
                      colorForId(active.sender_id),
                    )}
                  >
                    {(active.sender_id === user.id ? userName : "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {active.sender_id === user.id ? `${userName} (you)` : "Sender"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(active.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                    {active.body || "—"}
                  </pre>
                  {active.attachments?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {active.attachments.map((a) => (
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
                        </span>
                      ))}
                    </div>
                  )}
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
          </TabsContent>
        </Tabs>

        {/* Compose dialog */}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New message</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Recipient user ID (leave blank to send to yourself)"
                value={composeRecipient}
                onChange={(e) => setComposeRecipient(e.target.value)}
              />
              <Input
                placeholder="Subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your message..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="min-h-[140px]"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendCompose}>Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Inbox;
