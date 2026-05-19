import { useState } from "react";
import { Mail, RefreshCw, ArrowUp, Inbox as InboxIcon } from "lucide-react";
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
import { useGmail, type GmailFullMessage } from "@/hooks/useGmail";
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

const GmailPanel = ({ enabled }: { enabled: boolean }) => {
  const { messages, loading, refresh, getMessage, sendMessage, markRead } = useGmail(enabled);
  const [active, setActive] = useState<GmailFullMessage | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-260px)] min-h-[560px]">
        {/* List */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Gmail<span className="text-muted-foreground"> ({unreadCount})</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setComposeOpen(true)}
              >
                <ArrowUp className="w-4 h-4 rotate-45" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && messages.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading Gmail…
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Your Gmail inbox is empty.
              </div>
            )}
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => openMessage(m.id, m.unread)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/50 transition-colors",
                  active?.id === m.id ? "bg-secondary/60" : "hover:bg-secondary/30",
                )}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-foreground flex items-center justify-center text-xs font-medium">
                    {formatFrom(m.from).charAt(0).toUpperCase()}
                  </div>
                  {m.unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm truncate",
                        m.unread ? "font-semibold text-foreground" : "font-medium text-foreground",
                      )}
                    >
                      {formatFrom(m.from)}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(m.date)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 truncate">
                    {m.subject || "(no subject)"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{m.snippet}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reading pane */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-2xl flex flex-col overflow-hidden">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Loading message…
            </div>
          ) : active ? (
            <>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  {active.subject || "(no subject)"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  From {active.from} · {formatDate(active.date)}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                  {active.body || active.snippet || "—"}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
              <InboxIcon className="w-4 h-4" /> Select a Gmail message
            </div>
          )}
        </div>
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
