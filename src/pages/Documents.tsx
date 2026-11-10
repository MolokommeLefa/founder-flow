import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDownToLine, Bold, CalendarDays, Check, ChevronDown, Code2, FileText,
  Heading1, Heading2, Italic, List, ListOrdered, Loader2, MoreHorizontal,
  Plus, Quote, Search, Share2, StickyNote, Strikethrough, Trash2, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocuments, type DbDocument } from "@/hooks/useDocuments";
import DocumentPreviewDialog from "@/components/documents/DocumentPreviewDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditorAction = { label: string; icon: React.ElementType; run: () => void };

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DbDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DbDocument | null>(null);
  const [filesView, setFilesView] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    documents, loading: docsLoading, uploadDocument, saveNote,
    deleteDocument, downloadDocument, refresh,
  } = useDocuments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const notes = useMemo(
    () => documents.filter((doc) => doc.file_type === "note"),
    [documents]
  );
  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) =>
      note.name.toLowerCase().includes(query) ||
      (note.content ?? "").replace(/<[^>]*>/g, " ").toLowerCase().includes(query)
    );
  }, [notes, search]);
  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;
  const files = documents.filter((doc) => doc.file_type !== "note");

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) setActiveNoteId(notes[0].id);
  }, [activeNoteId, notes]);

  useEffect(() => {
    setTitle(activeNote?.name ?? "");
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(activeNote?.content ?? "");
    }
  }, [activeNoteId, activeNote?.updated_at]);

  const startNewNote = () => {
    setFilesView(false);
    setActiveNoteId("__new__");
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    window.setTimeout(() => editorRef.current?.focus(), 0);
  };

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, '<ul class="note-check"><li><input type="checkbox" /> <span>To-do</span></li></ul><p><br/></p>');
  };

  const toolbar: EditorAction[][] = [
    [
      { label: "Bold", icon: Bold, run: () => runEditorCommand("bold") },
      { label: "Italic", icon: Italic, run: () => runEditorCommand("italic") },
      { label: "Strikethrough", icon: Strikethrough, run: () => runEditorCommand("strikeThrough") },
    ],
    [
      { label: "Heading 1", icon: Heading1, run: () => runEditorCommand("formatBlock", "H1") },
      { label: "Heading 2", icon: Heading2, run: () => runEditorCommand("formatBlock", "H2") },
    ],
    [
      { label: "Bullet list", icon: List, run: () => runEditorCommand("insertUnorderedList") },
      { label: "Numbered list", icon: ListOrdered, run: () => runEditorCommand("insertOrderedList") },
      { label: "Checklist", icon: Check, run: insertChecklist },
    ],
    [
      { label: "Quote", icon: Quote, run: () => runEditorCommand("formatBlock", "BLOCKQUOTE") },
      { label: "Code block", icon: Code2, run: () => runEditorCommand("formatBlock", "PRE") },
    ],
  ];

  const handleSave = async () => {
    const html = editorRef.current?.innerHTML ?? "";
    const plainText = editorRef.current?.textContent?.trim() ?? "";
    if (!title.trim() && !plainText) {
      toast.error("Add a title or some content first");
      return;
    }
    setSaving(true);
    const ok = await saveNote(title.trim() || "Untitled note", html, "Note", activeNoteId && activeNoteId !== "__new__" ? activeNoteId : undefined);
    setSaving(false);
    if (ok) {
      await refresh();
      if (activeNoteId === "__new__") setActiveNoteId(null);
      toast.success("All changes saved");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const prefix = user.email?.split("@")[0] || "You";
    const firstName = prefix.split(/[._-]/)[0];
    await uploadDocument(file, firstName.charAt(0).toUpperCase() + firstName.slice(1));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const deletedId = pendingDelete.id;
    await deleteDocument(pendingDelete);
    if (activeNoteId === deletedId) {
      const nextNote = notes.find((note) => note.id !== deletedId);
      setActiveNoteId(nextNote?.id ?? null);
      if (!nextNote && editorRef.current) editorRef.current.innerHTML = "";
    }
    setPendingDelete(null);
  };

  const shareNote = async () => {
    const shareText = title.trim() || "Untitled note";
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Note title copied");
    } catch {
      toast.error("Clipboard access is unavailable");
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-sm text-muted-foreground">Loading notes…</div>;
  }

  const dateLabel = activeNote
    ? format(new Date(activeNote.updated_at), "EEEE, d MMMM yyyy")
    : format(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div className="dashboard-shell min-h-screen bg-[#0d0d0d] text-[#f6eee3] flex">
      <div className="hidden md:block shrink-0 border-r border-white/5">
        <DashboardSidebar activeItem="Notes" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </div>

      <main className="min-w-0 flex-1 flex flex-col lg:flex-row">
        <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StickyNote className="h-5 w-5 text-[#f6eee3]/70" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide">Notes</span>
              <span className="text-xs text-white/35">{notes.length} saved</span>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
              <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-[#f6eee3] hover:bg-white/[0.08]" onClick={() => setFilesView((value) => !value)}>
                <FileText className="mr-2 h-4 w-4" /> {filesView ? "Back to notes" : "Files"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-[#f6eee3] hover:bg-white/[0.08]">
                    <Upload className="mr-2 h-4 w-4" /> Upload <ChevronDown className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileRef.current?.click()} className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload a file
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startNewNote} className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Create a note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="bg-[#f6eee3] text-[#111] hover:bg-white" onClick={startNewNote}>
                <Plus className="mr-2 h-4 w-4" /> New note
              </Button>
            </div>
          </header>

          {filesView ? (
            <section className="mx-auto max-w-5xl">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight">Your files</h1>
                  <p className="mt-2 text-sm text-white/45">Files stored alongside your notes.</p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input placeholder="Search files…" value={search} onChange={(event) => setSearch(event.target.value)} className="border-white/10 bg-white/[0.04] pl-9 text-white placeholder:text-white/35" />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {docsLoading ? (
                  <div className="py-16 text-center text-sm text-white/45">Loading files…</div>
                ) : files.length === 0 ? (
                  <div className="py-16 text-center text-sm text-white/45">No files uploaded yet.</div>
                ) : (
                  files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase())).map((file) => (
                    <div key={file.id} className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-4 last:border-0 hover:bg-white/[0.03]">
                      <FileText className="h-5 w-5 shrink-0 text-white/45" />
                      <button onClick={() => setPreviewDoc(file)} className="min-w-0 flex-1 truncate text-left text-sm hover:text-white">{file.name}</button>
                      <span className="hidden text-xs text-white/40 sm:block">{formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
                      {file.file_path && <Button variant="ghost" size="icon" onClick={() => downloadDocument(file)} aria-label="Download file"><ArrowDownToLine className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete(file)} aria-label="Delete file"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:gap-16">
              <article className="min-w-0">
                <div className="mb-3 text-xs tracking-wide text-white/35">
                  {activeNote ? dateLabel : "A place to think clearly"}
                </div>
                <Input
                  aria-label="Note title"
                  placeholder="Untitled document"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-auto border-0 bg-transparent px-0 py-1 text-3xl font-medium tracking-[-0.04em] text-[#f6eee3] shadow-none placeholder:text-white/30 focus-visible:ring-0 sm:text-4xl lg:text-5xl"
                />

                <div className="my-7 flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[0.025] p-1.5 sm:inline-flex">
                  {toolbar.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex items-center gap-1">
                      {groupIndex > 0 && <span className="mx-1 h-5 w-px bg-white/10" />}
                      {group.map(({ label, icon: Icon, run }) => (
                        <Button key={label} type="button" variant="ghost" size="icon" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={run} className="h-9 w-9 rounded-full text-[#f6eee3]/75 hover:bg-white/10 hover:text-white">
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  role="textbox"
                  aria-label="Note content"
                  aria-multiline="true"
                  data-placeholder="Start writing…"
                  suppressContentEditableWarning
                  className="note-editor min-h-[48vh] max-h-[68vh] overflow-y-auto rounded-xl border border-transparent px-0 py-2 text-base leading-[1.85] text-[#f6eee3]/90 outline-none focus:border-white/[0.04] sm:text-lg"
                />

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                  <span className="text-xs text-white/35">{activeNote ? "Saved notes stay private to your workspace." : "Your new note will appear in Recent notes."}</span>
                  <div className="flex items-center gap-2">
                    {activeNote && <Button variant="ghost" size="icon" aria-label="Delete note" onClick={() => setPendingDelete(activeNote)} className="text-white/45 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>}
                    <Button variant="outline" size="sm" onClick={shareNote} className="border-white/10 bg-transparent text-[#f6eee3] hover:bg-white/[0.06]"><Share2 className="mr-2 h-4 w-4" /> Copy title</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#f6eee3] text-[#111] hover:bg-white">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      {saving ? "Saving…" : "Save note"}
                    </Button>
                  </div>
                </div>
              </article>

              <aside className="border-t border-white/[0.08] pt-6 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-medium text-[#f6eee3]">Recent notes</h2>
                    <p className="mt-1 text-xs text-white/35">Pick up where you left off</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="New note" onClick={startNewNote} className="text-white/55 hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                  <Input placeholder="Search notes" value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 border-white/10 bg-white/[0.035] pl-9 text-xs text-white placeholder:text-white/35" />
                </div>
                {docsLoading ? (
                  <div className="flex justify-center py-10 text-white/35"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : visibleNotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                    <StickyNote className="mx-auto mb-3 h-5 w-5 text-white/35" />
                    <p className="text-sm text-white/65">{search ? "No matching notes" : "No notes yet"}</p>
                    <p className="mt-1 text-xs text-white/35">Create a note to start capturing ideas.</p>
                    <Button variant="ghost" size="sm" onClick={startNewNote} className="mt-3 text-[#f6eee3]"><Plus className="mr-1 h-4 w-4" /> New note</Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {visibleNotes.map((note) => (
                      <button key={note.id} onClick={() => { setFilesView(false); setActiveNoteId(note.id); }} className={cn("group w-full rounded-xl border px-3.5 py-3 text-left transition-colors", activeNoteId === note.id ? "border-white/[0.13] bg-white/[0.06]" : "border-transparent hover:bg-white/[0.04]")}>
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-medium text-[#f6eee3]">{note.name}</span>
                          <MoreHorizontal className="h-4 w-4 shrink-0 text-white/25 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="mt-1.5 block line-clamp-2 text-xs leading-relaxed text-white/40">{(note.content ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "No text in this note yet."}</span>
                        <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/25">{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          )}
        </section>
      </main>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.file_type === "note" ? "note" : "file"}?</AlertDialogTitle>
            <AlertDialogDescription>Delete “{pendingDelete?.name}”? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentPreviewDialog doc={previewDoc} open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)} />
    </div>
  );
};

export default Documents;
