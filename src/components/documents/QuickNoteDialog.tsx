import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, List, ListOrdered, Heading2, Code, CheckSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (file: File, source?: string) => Promise<boolean>;
  source?: string;
}

type Action = {
  icon: React.ElementType;
  label: string;
  wrap?: [string, string];
  prefix?: string;
};

const actions: Action[] = [
  { icon: Bold, label: "Bold", wrap: ["**", "**"] },
  { icon: Italic, label: "Italic", wrap: ["_", "_"] },
  { icon: Heading2, label: "Heading", prefix: "## " },
  { icon: List, label: "Bullet list", prefix: "- " },
  { icon: ListOrdered, label: "Numbered list", prefix: "1. " },
  { icon: CheckSquare, label: "Checklist", prefix: "- [ ] " },
  { icon: Code, label: "Code", wrap: ["`", "`"] },
];

const QuickNoteDialog = ({ open, onOpenChange, onSave, source }: Props) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: Action) => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);

    let next = body;
    let cursor = end;

    if (action.wrap) {
      const [a, b] = action.wrap;
      next = body.slice(0, start) + a + selected + b + body.slice(end);
      cursor = end + a.length + b.length;
    } else if (action.prefix) {
      const lineStart = body.lastIndexOf("\n", start - 1) + 1;
      next = body.slice(0, lineStart) + action.prefix + body.slice(lineStart);
      cursor = end + action.prefix.length;
    }

    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const reset = () => {
    setTitle("");
    setBody("");
  };

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) {
      toast.error("Add a title or some content first");
      return;
    }
    const safeTitle = (title.trim() || "Quick note").replace(/[\\/:*?"<>|]/g, "-");
    const content = `# ${title.trim() || "Quick note"}\n\n${body}`;
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

          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {actions.map((a) => (
              <Button
                key={a.label}
                type="button"
                variant="ghost"
                size="icon"
                title={a.label}
                aria-label={a.label}
                className="h-8 w-8 rounded-md"
                onClick={() => applyAction(a)}
              >
                <a.icon className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            ))}
          </div>

          <Textarea
            ref={areaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note… Markdown formatting is supported."
            className="min-h-[220px] bg-secondary/40 border-0 font-mono text-sm leading-relaxed resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Saved to your documents as a markdown note. Tags and team mentions are coming soon.
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
