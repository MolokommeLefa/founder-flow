import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, FolderKanban, CheckSquare, X, File } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Category = "all" | "documents" | "tasks" | "projects";

type SearchItem = {
  id: string;
  title: string;
  category: Exclude<Category, "all">;
  subtitle?: string;
  route: string;
  file_path?: string | null;
  file_type?: string | null;
};

interface RecentViewed extends SearchItem {
  previewUrl?: string | null;
  viewedAt: number;
}

const RECENT_KEY = "lumaco:recent-search";
const VIEWED_KEY = "lumaco:recent-viewed";

const loadRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
};
const loadViewed = (): RecentViewed[] => {
  try { return JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]"); } catch { return []; }
};

export const pushRecentViewed = (item: Omit<RecentViewed, "viewedAt">) => {
  const list = loadViewed().filter((i) => i.id !== item.id);
  list.unshift({ ...item, viewedAt: Date.now() });
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list.slice(0, 12)));
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const WorkspaceSearch = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [viewed, setViewed] = useState<RecentViewed[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    setViewed(loadViewed());
    setQuery("");
    setCategory("all");
  }, [open]);

  // Load all searchable items when dialog opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      const [docsRes, tasksRes, projectsRes] = await Promise.all([
        supabase.from("documents").select("id,name,source,file_type,file_path,updated_at").order("updated_at", { ascending: false }),
        supabase.from("tasks").select("id,title,description,updated_at").order("updated_at", { ascending: false }),
        supabase.from("projects").select("id,title,description,updated_at").order("updated_at", { ascending: false }),
      ]);
      const merged: SearchItem[] = [
        ...((docsRes.data ?? []) as any[]).map((d) => ({
          id: d.id, title: d.name, subtitle: d.source ?? undefined,
          category: "documents" as const, route: "/documents",
          file_path: d.file_path, file_type: d.file_type,
        })),
        ...((tasksRes.data ?? []) as any[]).map((t) => ({
          id: t.id, title: t.title, subtitle: t.description ?? undefined,
          category: "tasks" as const, route: "/tasks",
        })),
        ...((projectsRes.data ?? []) as any[]).map((p) => ({
          id: p.id, title: p.title, subtitle: p.description ?? undefined,
          category: "projects" as const, route: "/projects",
        })),
      ];
      setItems(merged);
    })();
  }, [open]);

  // Load thumbnails for recently viewed image documents
  useEffect(() => {
    if (!open) return;
    (async () => {
      const entries: Record<string, string> = {};
      await Promise.all(
        viewed.map(async (v) => {
          if (v.category !== "documents" || !v.file_path) return;
          const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(v.file_path);
          if (!isImage) return;
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(v.file_path, 300);
          if (data?.signedUrl) entries[v.id] = data.signedUrl;
        }),
      );
      setThumbs(entries);
    })();
  }, [viewed, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => category === "all" || i.category === category)
      .filter((i) =>
        !q ||
        i.title.toLowerCase().includes(q) ||
        (i.subtitle ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [items, query, category]);

  const handleSelect = (item: SearchItem) => {
    // store recent search term
    if (query.trim()) {
      const next = [query.trim(), ...recent.filter((r) => r !== query.trim())].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    }
    pushRecentViewed({
      id: item.id,
      title: item.title,
      category: item.category,
      subtitle: item.subtitle,
      route: item.route,
      file_path: item.file_path,
      file_type: item.file_type,
    });
    onOpenChange(false);
    navigate(item.route);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };
  const clearViewed = () => {
    localStorage.removeItem(VIEWED_KEY);
    setViewed([]);
  };

  const Icon = ({ c }: { c: SearchItem["category"] }) =>
    c === "documents" ? <FileText className="w-3.5 h-3.5" /> :
    c === "projects" ? <FolderKanban className="w-3.5 h-3.5" /> :
    <CheckSquare className="w-3.5 h-3.5" />;

  const tabs: { id: Category; label: string }[] = [
    { id: "all", label: "All" },
    { id: "documents", label: "Documents" },
    { id: "projects", label: "Library" },
  ];

  const showQuickPanel = !query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden bg-background/80 backdrop-blur-2xl border border-border/60 rounded-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Workspace..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-7 text-base placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 px-5 py-2.5 border-b border-border/40 text-xs">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setCategory(t.id)}
              className={cn(
                "transition-colors",
                category === t.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {showQuickPanel ? (
            <>
              {/* Recent searches */}
              <Section title="Recent" onClear={recent.length ? clearRecent : undefined}>
                {recent.length === 0 && viewed.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-muted-foreground">No recent activity yet.</p>
                ) : (
                  <>
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => setQuery(r)}
                        className="w-full flex items-center gap-2.5 px-5 py-2 text-sm text-foreground hover:bg-secondary/40 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate">{r}</span>
                      </button>
                    ))}
                    {viewed.slice(0, 6).map((v) => (
                      <button
                        key={`v-${v.id}`}
                        onClick={() => handleSelect(v)}
                        className="w-full flex items-center gap-2.5 px-5 py-2 text-sm text-foreground hover:bg-secondary/40 transition-colors"
                      >
                        <span className="text-muted-foreground"><Icon c={v.category} /></span>
                        <span className="truncate">{v.title}</span>
                      </button>
                    ))}
                  </>
                )}
              </Section>

              {/* Recently viewed thumbnails */}
              <Section title="Recently viewed" onClear={viewed.length ? clearViewed : undefined}>
                {viewed.length === 0 ? (
                  <p className="px-5 py-3 text-xs text-muted-foreground">Items you open will appear here.</p>
                ) : (
                  <div className="flex gap-3 px-5 py-3 overflow-x-auto">
                    {viewed.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelect(v)}
                        title={v.title}
                        className="shrink-0 w-20 h-20 rounded-lg border border-border/50 overflow-hidden bg-secondary/40 flex items-center justify-center hover:border-primary/50 transition-colors group"
                      >
                        {thumbs[v.id] ? (
                          <img src={thumbs[v.id]} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 px-2 text-center">
                            <File className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            <span className="text-[9px] text-muted-foreground line-clamp-2">{v.title}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Section>
            </>
          ) : (
            <div className="py-2">
              {filtered.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No results for "{query}"
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={`${item.category}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <span className="text-muted-foreground"><Icon c={item.category} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-secondary/60 border border-border/40">↵</kbd> to open</span>
          <span><kbd className="px-1 py-0.5 rounded bg-secondary/60 border border-border/40">⌘K</kbd> to toggle</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({
  title, onClear, children,
}: { title: string; onClear?: () => void; children: React.ReactNode }) => (
  <div className="py-1">
    <div className="flex items-center justify-between px-5 pt-3 pb-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</span>
      {onClear && (
        <button onClick={onClear} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
    {children}
  </div>
);

export default WorkspaceSearch;
