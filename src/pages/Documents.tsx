import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bold, Check, Code2, Heading1, Heading2, Italic, List, ListOrdered,
  Loader2, PanelRightClose, PanelRightOpen, Plus, Quote, SquarePen, Strikethrough,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocuments } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

type ToolbarPosition = { top: number; left: number };
type FormatAction = { label: string; icon: React.ElementType; command: string; value?: string };

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [revision, setRevision] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionToken = useRef(0);
  const hydratedNoteId = useRef<string | null>(null);

  const { documents, loading: docsLoading, saveNote } = useDocuments();
  const notes = useMemo(() => documents.filter((doc) => doc.file_type === "note"), [documents]);
  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;

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

  const loadedNoteId = activeNote?.id;
  const loadedNoteTitle = activeNote?.name;
  const loadedNoteContent = activeNote?.content;

  useEffect(() => {
    if (activeNoteId === null) {
      if (hydratedNoteId.current !== null) {
        hydratedNoteId.current = null;
        setTitle("");
        setBody("");
        if (editorRef.current) editorRef.current.innerHTML = "";
      }
      return;
    }
    if (!loadedNoteId || !loadedNoteTitle || hydratedNoteId.current === loadedNoteId || revision > savedRevision) return;
    const safeHtml = DOMPurify.sanitize(loadedNoteContent ?? "");
    hydratedNoteId.current = loadedNoteId;
    setTitle(loadedNoteTitle);
    setBody(safeHtml);
    if (editorRef.current) editorRef.current.innerHTML = safeHtml;
  }, [activeNoteId, loadedNoteId, loadedNoteTitle, loadedNoteContent, revision, savedRevision]);

  const persistDraft = useCallback(async (
    draftTitle: string,
    draftBody: string,
    noteId: string | null,
    draftRevision: number,
    token: number
  ) => {
    const htmlText = draftBody.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    if (!draftTitle.trim() && !htmlText) {
      if (token === selectionToken.current) setSavedRevision(draftRevision);
      return true;
    }

    if (token === selectionToken.current) setSaveState("saving");
    const result = await saveNote(
      draftTitle.trim() || "Untitled document",
      draftBody,
      "Note",
      noteId ?? undefined,
      { silent: true }
    );
    if (!result) {
      if (token === selectionToken.current) setSaveState("error");
      return false;
    }

    if (token === selectionToken.current) {
      if (!noteId && typeof result === "string") setActiveNoteId(result);
      setSavedRevision(draftRevision);
      setSaveState("saved");
    }
    return true;
  }, [saveNote]);

  useEffect(() => {
    if (revision <= savedRevision) return;
    const draftRevision = revision;
    const draftTitle = title;
    const draftBody = body;
    const noteId = activeNoteId;
    const token = selectionToken.current;
    const text = draftBody.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();

    if (!draftTitle.trim() && !text) {
      setSavedRevision(draftRevision);
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDraft(draftTitle, draftBody, noteId, draftRevision, token);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [revision, savedRevision, title, body, activeNoteId, persistDraft]);

  const flushDraft = async () => {
    if (revision <= savedRevision) return true;
    return persistDraft(title, body, activeNoteId, revision, selectionToken.current);
  };

  const startFresh = async () => {
    if (!(await flushDraft())) return;
    selectionToken.current += 1;
    setActiveNoteId(null);
    setRecentOpen(false);
    setRevision((value) => value + 1);
    setSavedRevision((value) => value + 1);
    setSaveState("saved");
    setToolbarPosition(null);
  };

  const openNote = async (noteId: string) => {
    if (!(await flushDraft())) return;
    selectionToken.current += 1;
    setActiveNoteId(noteId);
    setRecentOpen(false);
    setToolbarPosition(null);
  };

  const updateToolbarPosition = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.isCollapsed || !selection.toString().trim() || selection.rangeCount === 0) {
      setToolbarPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      setToolbarPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setToolbarPosition(null);
      return;
    }
    setToolbarPosition({
      top: Math.max(12, rect.top - 14),
      left: Math.min(Math.max(160, rect.left + rect.width / 2), window.innerWidth - 160),
    });
  }, []);

  const formatActions: FormatAction[][] = [
    [
      { label: "Bold", icon: Bold, command: "bold" },
      { label: "Italic", icon: Italic, command: "italic" },
      { label: "Strikethrough", icon: Strikethrough, command: "strikeThrough" },
    ],
    [
      { label: "Heading 1", icon: Heading1, command: "formatBlock", value: "H1" },
      { label: "Heading 2", icon: Heading2, command: "formatBlock", value: "H2" },
    ],
    [
      { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
      { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
      { label: "Quote", icon: Quote, command: "formatBlock", value: "BLOCKQUOTE" },
      { label: "Code block", icon: Code2, command: "formatBlock", value: "PRE" },
    ],
  ];

  const applyFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
      setRevision((version) => version + 1);
    }
    setToolbarPosition(null);
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-sm text-white/45">Loading notes…</div>;
  }

  const dateLabel = activeNote
    ? format(new Date(activeNote.updated_at), "EEEE, d MMMM yyyy")
    : format(new Date(), "EEEE, d MMMM yyyy");

  return (
    <div className="dark dashboard-shell min-h-screen bg-background text-foreground flex overflow-hidden">
      <div className="hidden md:block shrink-0 border-r border-border/70">
        <DashboardSidebar activeItem="Notes" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </div>

      <main className="relative min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => void startFresh()}
            aria-label="Start a fresh note"
            title="New note"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#f6eee3]/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </button>

        </header>

        {!recentOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open recent notes"
            aria-expanded={false}
            aria-controls="recent-notes-sidebar"
            onClick={() => setRecentOpen(true)}
            className="fixed right-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-border/70 bg-background/80 text-foreground/70 shadow-lg shadow-black/30 backdrop-blur-xl transition-transform duration-150 hover:scale-105 hover:bg-card active:scale-[0.97]"
          >
            <PanelRightOpen className="h-4 w-4" strokeWidth={1.6} />
          </Button>
        )}

        <section className="w-full min-w-0">
          <div className="mb-3 text-xs tracking-wide text-white/35">{dateLabel}</div>
          <Input
            aria-label="Note title"
            placeholder="Untitled document"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setRevision((version) => version + 1);
            }}
            className="h-auto border-0 bg-transparent px-0 py-1 text-[clamp(2.5rem,4vw,3rem)] font-medium tracking-[-0.04em] text-[#f6eee3] shadow-none placeholder:text-white/30 focus-visible:ring-0"
          />

          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label="Note content"
            aria-multiline="true"
            data-placeholder="Write freely…"
            suppressContentEditableWarning
            onInput={(event) => {
              setBody(event.currentTarget.innerHTML);
              setRevision((version) => version + 1);
            }}
            onMouseUp={updateToolbarPosition}
            onKeyUp={updateToolbarPosition}
            onTouchEnd={updateToolbarPosition}
            className="note-editor mt-8 min-h-[calc(100vh-18rem)] w-full overflow-visible border-0 px-0 py-2 text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.65] text-foreground/90 outline-none"
          />

          <footer className="mt-6 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-white/35" aria-live="polite">
            {saveState === "saving" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
            ) : saveState === "error" ? (
              <><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Couldn’t save. Keep editing to retry.</>
            ) : (
              <><Check className="h-3.5 w-3.5" /> {activeNoteId ? "All changes saved" : "Changes save automatically"}</>
            )}
          </footer>
        </section>

        {toolbarPosition && (
          <div
            role="toolbar"
            aria-label="Text formatting"
            className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-xl border border-white/10 bg-[#171717] p-1.5 shadow-2xl shadow-black/50"
            style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
            onMouseDown={(event) => event.preventDefault()}
          >
            {formatActions.map((group, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-1">
                {groupIndex > 0 && <span className="mx-1 h-5 w-px bg-white/10" />}
                {group.map(({ label, icon: Icon, command, value }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={label}
                    aria-label={label}
                    onClick={() => applyFormat(command, value)}
                    className="h-8 w-8 rounded-lg text-[#f6eee3]/75 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </Button>
                ))}
              </div>
            ))}
          </div>
        )}

        <aside
              id="recent-notes-sidebar"
              aria-label="Recent notes"
              aria-hidden={!recentOpen}
              ref={(element) => {
                if (element) element.inert = !recentOpen;
              }}
              className={cn(
                "fixed bottom-3 right-3 top-3 z-40 flex w-[min(500px,calc(100vw-24px))] flex-col overflow-hidden rounded-[20px] border border-border/70 bg-background/80 text-foreground shadow-2xl shadow-black/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70 transition-[transform,opacity] duration-300 ease-out will-change-transform",
                recentOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+0.75rem)] opacity-0 pointer-events-none",
                "motion-reduce:translate-x-0 motion-reduce:duration-200 motion-reduce:ease-linear"
              )}
            >
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-4 sm:px-5">
                <h2 className="text-sm font-medium tracking-[0.01em] text-foreground">Recent notes</h2>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Start a new note"
                    title="New note"
                    onClick={() => void startFresh()}
                    className="h-8 w-8 rounded-md text-foreground/70 transition-transform duration-150 hover:bg-foreground/10 hover:text-foreground active:scale-[0.97]"
                  >
                    <SquarePen className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close recent notes"
                    title="Close sidebar"
                    onClick={() => setRecentOpen(false)}
                    className="h-8 w-8 rounded-md text-[#f6eee3]/70 hover:bg-white/10 hover:text-white"
                  >
                    <PanelRightClose className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {docsLoading ? (
                  <div className="flex justify-center py-10 text-white/35"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : notes.length === 0 ? (
                  <p className="px-3 py-8 text-center text-xs leading-relaxed text-white/40">Your notes will appear here as you write.</p>
                ) : (
                  <div className="space-y-5 p-2 sm:p-1.5">
                    {notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => void openNote(note.id)}
                        className={cn(
                          "min-h-[126px] w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-colors duration-200 hover:border-border hover:bg-card/65 active:scale-[0.99] sm:min-h-[150px] sm:px-5 sm:py-4",
                          activeNoteId === note.id ? "ring-1 ring-primary/40" : ""
                        )}
                      >
                        <span className="block truncate text-sm font-medium text-foreground">{note.name || "Untitled document"}</span>
                        <span className="mt-6 block line-clamp-5 text-xs leading-relaxed text-muted-foreground">
                          {(note.content ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() || "No text yet"}
                        </span>
                        <span className="mt-2 block text-[10px] tracking-[0.02em] text-muted-foreground/75">{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
      </main>
    </div>
  );
};

export default Documents;
