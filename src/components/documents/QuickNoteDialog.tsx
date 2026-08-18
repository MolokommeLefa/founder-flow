import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Code,
  CheckSquare,
  Quote,
  Strikethrough,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (file: File, source?: string) => Promise<boolean>;
  source?: string;
}

type Action = {
  icon: React.ElementType;
  label: string;
  run: (exec: (cmd: string, value?: string) => void, insertBlock: (tag: string) => void) => void;
};

const actions: Action[][] = [
  [
    { icon: Bold, label: "Bold", run: (e) => e("bold") },
    { icon: Italic, label: "Italic", run: (e) => e("italic") },
    { icon: Strikethrough, label: "Strikethrough", run: (e) => e("strikeThrough") },
  ],
  [
    { icon: Heading1, label: "Heading 1", run: (e) => e("formatBlock", "H1") },
    { icon: Heading2, label: "Heading 2", run: (e) => e("formatBlock", "H2") },
    { icon: Heading3, label: "Heading 3", run: (e) => e("formatBlock", "H3") },
  ],
  [
    { icon: List, label: "Bullet list", run: (e) => e("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: (e) => e("insertOrderedList") },
    { icon: CheckSquare, label: "Checklist", run: (_e, insert) => insert("checklist") },
  ],
  [
    { icon: Code, label: "Code block", run: (_e, insert) => insert("pre") },
    { icon: Quote, label: "Quote", run: (e) => e("formatBlock", "BLOCKQUOTE") },
  ],
];

/** Convert the editor's HTML into markdown for storage. */
const htmlToMarkdown = (root: HTMLElement): string => {
  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(inline).join("");
    switch (el.tagName) {
      case "B":
      case "STRONG":
        return inner ? `**${inner}**` : "";
      case "I":
      case "EM":
        return inner ? `_${inner}_` : "";
      case "S":
      case "STRIKE":
      case "DEL":
        return inner ? `~~${inner}~~` : "";
      case "CODE":
        return inner ? `\`${inner}\`` : "";
      case "BR":
        return "\n";
      case "A":
        return `[${inner}](${el.getAttribute("href") ?? ""})`;
      default:
        return inner;
    }
  };

  const block = (el: HTMLElement): string => {
    switch (el.tagName) {
      case "H1":
        return `# ${inline(el)}`;
      case "H2":
        return `## ${inline(el)}`;
      case "H3":
        return `### ${inline(el)}`;
      case "BLOCKQUOTE":
        return inline(el)
          .split("\n")
          .map((l) => `> ${l}`)
          .join("\n");
      case "PRE":
        return "```\n" + (el.textContent ?? "") + "\n```";
      case "UL":
      case "OL":
        return Array.from(el.children)
          .map((li, i) => {
            const isCheck = li.querySelector('input[type="checkbox"]');
            const text = inline(li).trim();
            if (isCheck) {
              const checked = (isCheck as HTMLInputElement).checked;
              return `- [${checked ? "x" : " "}] ${text}`;
            }
            return el.tagName === "OL" ? `${i + 1}. ${text}` : `- ${text}`;
          })
          .join("\n");
      default: {
        const t = inline(el).trim();
        return t;
      }
    }
  };

  return Array.from(root.childNodes)
    .map((n) => {
      if (n.nodeType === Node.TEXT_NODE) return (n.textContent ?? "").trim();
      if (n.nodeType !== Node.ELEMENT_NODE) return "";
      return block(n as HTMLElement);
    })
    .filter((s) => s.length > 0)
    .join("\n\n");
};

const QuickNoteDialog = ({ open, onOpenChange, onSave, source }: Props) => {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [empty, setEmpty] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && editorRef.current) {
      editorRef.current.innerHTML = "";
      setEmpty(true);
    }
  }, [open]);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncEmpty();
  };

  const insertBlock = (tag: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (tag === "pre") {
      document.execCommand(
        "insertHTML",
        false,
        '<pre class="note-code"><code>code…</code></pre><p><br/></p>'
      );
    } else if (tag === "checklist") {
      document.execCommand(
        "insertHTML",
        false,
        '<ul class="note-check"><li><input type="checkbox" /> <span>To-do</span></li></ul><p><br/></p>'
      );
    }
    syncEmpty();
  };

  const syncEmpty = () => {
    const text = editorRef.current?.textContent?.trim() ?? "";
    setEmpty(text.length === 0);
  };

  const reset = () => {
    setTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setEmpty(true);
  };

  const handleSave = async () => {
    const md = editorRef.current ? htmlToMarkdown(editorRef.current) : "";
    if (!title.trim() && !md.trim()) {
      toast.error("Add a title or some content first");
      return;
    }
    const safeTitle = (title.trim() || "Quick note").replace(/[\\/:*?"<>|]/g, "-");
    const content = `# ${title.trim() || "Quick note"}\n\n${md}\n`;
    const file = new File([content], `${safeTitle}.md`, { type: "text/markdown" });
    setSaving(true);
    const ok = await onSave(file, source);
    setSaving(false);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick note</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary/50 border-0 text-base"
          />

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
            {actions.map((group, gi) => (
              <div key={gi} className="flex items-center gap-1">
                {gi > 0 && <span className="mx-1 h-5 w-px bg-border" />}
                {group.map((a) => (
                  <Button
                    key={a.label}
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={a.label}
                    aria-label={a.label}
                    className="h-8 w-8 rounded-md"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => a.run(exec, insertBlock)}
                  >
                    <a.icon className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                ))}
              </div>
            ))}
          </div>

          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Note content"
              onInput={syncEmpty}
              onBlur={syncEmpty}
              suppressContentEditableWarning
              className={cn(
                "note-editor min-h-[240px] max-h-[45vh] overflow-y-auto rounded-lg bg-secondary/40 px-4 py-3",
                "text-sm leading-relaxed outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
            />
            {empty && (
              <span className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
                Write your note… use the toolbar to format text.
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formatting is applied live. Saved to your documents as a note. Tags and team mentions are coming soon.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickNoteDialog;
