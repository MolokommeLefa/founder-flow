import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import DOMPurify from "dompurify";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bold, Check, Code2, Heading1, Heading2, Italic, List, ListOrdered,
  Loader2, PanelRightOpen, Quote, StickyNote, Strikethrough,
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
  const [recentOpen, setRecentOpen] = useState(true);
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
    <div className="dashboard-shell min-h-screen bg-[#0d0d0d] text-[#f6eee3] flex overflow-hidden">
      <div className="hidden md:block shrink-0 border-r border-white/[0.06]">
        <DashboardSidebar activeItem="Notes" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </div>

      <main className="relative min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 lg:px-12 lg:py-8 lg:pr-[clamp(300px,25.4vw,670px)]">
        <header className="mb-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => void startFresh()}
            aria-label="Start a fresh note"
            className="inline-flex items-center gap-3 text-left text-sm font-medium tracking-wide text-[#f6eee3]/80 transition-colors hover:text-white"
          >
            <StickyNote className="h-5 w-5" strokeWidth={1.5} />
            <span>Notes</span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={recentOpen}
            aria-controls="recent-notes-sidebar"
            onClick={() => setRecentOpen((open) => !open)}
            className={cn("gap-2 text-[#f6eee3]/60 hover:bg-white/[0.06] hover:text-[#f6eee3]", recentOpen && "bg-white/[0.06] text-[#f6eee3]")}
          >
            <PanelRightOpen className="h-4 w-4" strokeWidth={1.6} />
            <span>Recent</span>
          </Button>
        </header>

        <section className="mx-auto w-full max-w-[1518px]">
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

          <div role="toolbar" aria-label="Note formatting" className="mb-7 flex min-h-12 w-fit max-w-full flex-wrap items-center gap-1 rounded-full border-2 border-white/80 px-3 py-1.5 text-[#f6eee3]">
            {formatActions.map((group, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-1">
                {groupIndex > 0 && <span className="mx-2 h-6 w-px bg-white/20" />}
                {group.map(({ label, icon: Icon, command, value }) => (
                  <Button
                    key={label}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={label}
                    aria-label={label}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyFormat(command, value)}
                    className="h-9 w-9 rounded-full text-[#f6eee3]/85 hover:bg-white/10 hover:text-white"
                  >
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
            data-placeholder="Write freely…"
            suppressContentEditableWarning
            onInput={(event) => {
              setBody(event.currentTarget.innerHTML);
              setRevision((version) => version + 1);
            }}
            onMouseUp={updateToolbarPosition}
            onKeyUp={updateToolbarPosition}
            onTouchEnd={updateToolbarPosition}
            className="note-editor mt-4 min-h-[58vh] max-h-[72vh] overflow-y-auto rounded-xl border border-transparent px-0 py-2 text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.9] text-[#f6eee3]/90 outline-none focus:border-white/[0.04]"
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

        {recentOpen && (
          <>
            <button
              type="button"
              aria-label="Close recent notes"
              className="fixed inset-0 z-30 cursor-default bg-black/25 lg:hidden"
              onClick={() => setRecentOpen(false)}
            />
            <aside
              id="recent-notes-sidebar"
              aria-label="Recent notes"
              className="fixed right-4 top-20 z-40 flex max-h-[calc(100vh-6rem)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-2xl shadow-black/50 lg:right-5 lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:max-h-none lg:w-[clamp(300px,25.4vw,670px)] lg:rounded-[30px] lg:border-[#3a3939] lg:bg-[#0d0d0d]"
            >
              <div className="border-b border-white/[0.07] px-5 py-4">
                <h2 className="text-sm font-medium text-[#f6eee3]">Recent notes</h2>
                <p className="mt-1 text-xs text-white/35">Continue an earlier thought</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {docsLoading ? (
                  <div className="flex justify-center py-10 text-white/35"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : notes.length === 0 ? (
                  <p className="px-3 py-8 text-center text-xs leading-relaxed text-white/40">Your notes will appear here as you write.</p>
                ) : (
                  <div className="space-y-1">
                    {notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => void openNote(note.id)}
                        className={cn(
                          "w-full rounded-xl border px-3.5 py-3 text-left transition-colors",
                          activeNoteId === note.id ? "border-white/[0.12] bg-white/[0.06]" : "border-transparent hover:bg-white/[0.04]"
                        )}
                      >
                        <span className="block truncate text-sm font-medium text-[#f6eee3]">{note.name || "Untitled document"}</span>
                        <span className="mt-1.5 block line-clamp-2 text-xs leading-relaxed text-white/40">
                          {(note.content ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() || "No text yet"}
                        </span>
                        <span className="mt-2 block text-[10px] text-white/25">{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
};

export default Documents;
