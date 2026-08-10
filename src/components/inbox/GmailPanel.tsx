import { useMemo, useState } from "react";
import {
  Mail,
  RefreshCw,
  ArrowUp,
  ArrowLeft,
  PenSquare,
  SlidersHorizontal,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGmail, type GmailFullMessage, type GmailMessage } from "@/hooks/useGmail";
import EmailBody from "@/components/inbox/EmailBody";
import { cn } from "@/lib/utils";

const formatFrom = (raw: string) => {
  if (!raw) return "Unknown";
  const m = raw.match(/^"?([^"<]+?)"?\s*<.*>$/);
  return (m ? m[1] : raw).trim();
};

const formatDate = (raw: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const groupOf = (raw: string) => {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000);
  if (diffDays < 0) return "Today";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "Last 7 days";
  return "Earlier";
};

const GROUP_ORDER = ["Today", "Yesterday", "Last 7 days", "Earlier"];

const GmailPanel = ({ enabled }: { enabled: boolean }) => {
  const { messages, loading, refresh, getMessage, sendMessage, markRead } = useGmail(enabled);
  const [active, setActive] = useState<GmailFullMessage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, GmailMessage[]>();
    for (const m of messages) {
      const g = groupOf(m.date);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [messages]);

  const openMessage = async (id: string, wasUnread: boolean) => {
    setLoadingDetail(true);
    const m = await getMessage(id);
    if (m) {
      setActive(m);
      if (wasUnread) markRead(id);
    }
    setLoadingDetail(false);
  };

  const handleSend = async () => {
    if (!to.trim()) return;
    setSending(true);
    const ok = await sendMessage(to.trim(), subject.trim() || "(no subject)", body);
    setSending(false);
    if (ok) {
      setComposeOpen(false);
      setTo("");
      setSubject("");
      setBody("");
      refresh();
    }
  };

  const unreadCount = messages.filter((m) => m.unread).length;
  const showReader = loadingDetail || !!active;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden h-[calc(100vh-260px)] min-h-[560px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            {showReader ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 -ml-2"
                onClick={() => setActive(null)}
              >
                <ArrowLeft className="w-4 h-4" /> Inbox
              </Button>
            ) : (
              <>
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Gmail<span className="text-muted-foreground"> ({unreadCount})</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setComposeOpen(true)}
            >
              <PenSquare className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {showReader ? (
          /* Full-view reader */
          <div className="flex-1 overflow-y-auto">
            {loadingDetail || !active ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading message…</div>
            ) : (
              <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  {active.subject || "(no subject)"}
                </h1>
                <div className="flex items-center gap-3 mt-4 pb-5 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-foreground flex items-center justify-center text-xs font-medium">
                    {formatFrom(active.from).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {formatFrom(active.from)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      to {active.to || "me"} · {formatDate(active.date)}
                    </p>
                  </div>
                </div>
                <div className="pt-6">
                  <EmailBody html={active.html} text={active.body || active.snippet} />
                </div>
                <div className="pt-8">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setTo(active.from);
                      setSubject(
                        active.subject?.startsWith("Re:")
                          ? active.subject
                          : `Re: ${active.subject ?? ""}`,
                      );
                      setComposeOpen(true);
                    }}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Full-width list */
          <div className="flex-1 overflow-y-auto">
            {loading && messages.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">Loading Gmail…</div>
            )}
            {!loading && messages.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Your Gmail inbox is empty.
              </div>
            )}
            {grouped.map(({ group, items }) => (
              <div key={group}>
                {group !== "Today" && (
                  <div className="px-6 pt-6 pb-2 text-sm font-semibold text-foreground">
                    {group}
                  </div>
                )}
                {items.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => openMessage(m.id, m.unread)}
                    className="w-full text-left px-6 py-3 grid grid-cols-[minmax(120px,180px)_1fr_auto] items-center gap-4 border-b border-border/40 hover:bg-secondary/30 transition-colors"
                  >
                    <span
                      className={cn(
                        "text-sm truncate",
                        m.unread ? "font-semibold text-foreground" : "font-medium text-foreground/80",
                      )}
                    >
                      {formatFrom(m.from)}
                    </span>
                    <span className="flex items-center gap-2 min-w-0">
                      {m.unread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm truncate shrink-0 max-w-[55%]",
                          m.unread ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {m.subject || "(no subject)"}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">{m.snippet}</span>
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(m.date)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Gmail message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="To (email address)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder="Write your email..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[160px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !to.trim()}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GmailPanel;
