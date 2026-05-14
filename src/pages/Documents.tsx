import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Library, Filter, SlidersHorizontal, Upload, FileText, Trash2, Download, Search } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocuments, type DbDocument } from "@/hooks/useDocuments";
import DocumentPreviewDialog from "@/components/documents/DocumentPreviewDialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeBadgeStyles: Record<string, string> = {
  pdf: "bg-red-500/15 text-red-400 border-red-500/30",
  "doc.tx": "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const sourceColors = ["bg-orange-500", "bg-emerald-500", "bg-zinc-500", "bg-violet-500", "bg-pink-500"];
const colorForSource = (s: string | null) => {
  const key = (s || "?").charCodeAt(0) % sourceColors.length;
  return sourceColors[key];
};

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pdf" | "doc.tx">("all");
  const [pendingDelete, setPendingDelete] = useState<DbDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { documents, loading: docsLoading, uploadDocument, deleteDocument, downloadDocument } = useDocuments();

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

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.source ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || d.file_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [documents, search, filterType]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument(file, userName);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar
          activeItem="Documents"
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        {/* Title */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Documents
              <Library className="w-7 h-7 text-muted-foreground" />
            </h1>
            <p className="text-muted-foreground mt-2">Store your Documents with ease</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilterType(filterType === "all" ? "pdf" : filterType === "pdf" ? "doc.tx" : "all")}
              title={`Filter: ${filterType}`}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-0"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_0.6fr_40px] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Document Name</div>
            <div>Owner</div>
            <div>Source</div>
            <div>Last Edited</div>
            <div>Type</div>
            <div></div>
          </div>

          {docsLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Loading documents...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No documents yet. Click <span className="text-foreground font-medium">Upload</span> to add your first one.
            </div>
          ) : (
            filtered.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_0.6fr_40px] gap-4 px-5 py-3 items-center text-sm border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors group"
              >
                <button
                  onClick={() => downloadDocument(doc)}
                  className="text-left text-foreground hover:text-primary truncate"
                >
                  {doc.name}
                </button>
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white", colorForSource(userName))}>
                    {userName.charAt(0)}
                  </span>
                  <span className="truncate">{userName}</span>
                </div>
                <div className="text-muted-foreground truncate">{doc.source ?? "—"}</div>
                <div className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: false })} ago
                </div>
                <div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                    typeBadgeStyles[doc.file_type] ?? "bg-secondary text-muted-foreground border-border"
                  )}>
                    {doc.file_type}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.file_path && (
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDelete(doc)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete document</AlertDialogTitle>
              <AlertDialogDescription>
                Delete "{pendingDelete?.name}"? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (pendingDelete) await deleteDocument(pendingDelete);
                  setPendingDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Documents;
