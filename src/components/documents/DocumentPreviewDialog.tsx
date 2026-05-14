import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useDocuments, type DbDocument } from "@/hooks/useDocuments";

interface Props {
  doc: DbDocument | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
const isPdf = (name: string) => /\.pdf$/i.test(name);
const isText = (name: string) => /\.(txt|md|json|csv|log|xml|yml|yaml)$/i.test(name);

const DocumentPreviewDialog = ({ doc, open, onOpenChange }: Props) => {
  const { getPreviewUrl, downloadDocument } = useDocuments();
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc) {
      setUrl(null);
      setTextContent(null);
      return;
    }
    if (!doc.file_path) return;
    setLoading(true);
    getPreviewUrl(doc).then(async (u) => {
      setUrl(u);
      if (u && isText(doc.name)) {
        try {
          const res = await fetch(u);
          setTextContent(await res.text());
        } catch {
          setTextContent("Unable to load preview.");
        }
      }
      setLoading(false);
    });
  }, [open, doc]);

  if (!doc) return null;

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      );
    }
    if (!doc.file_path || !url) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
          <FileText className="w-10 h-10" />
          <p className="text-sm">No file attached to preview.</p>
        </div>
      );
    }
    if (isImage(doc.name)) {
      return (
        <div className="flex items-center justify-center h-full bg-secondary/20 rounded-lg overflow-auto">
          <img src={url} alt={doc.name} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
    if (isPdf(doc.name)) {
      return <iframe src={url} title={doc.name} className="w-full h-full rounded-lg bg-white" />;
    }
    if (isText(doc.name) && textContent !== null) {
      return (
        <pre className="w-full h-full overflow-auto text-xs p-4 bg-secondary/30 rounded-lg whitespace-pre-wrap font-mono text-foreground">
          {textContent}
        </pre>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <FileText className="w-12 h-12" />
        <p className="text-sm">Preview not available for this file type.</p>
        <Button size="sm" variant="outline" onClick={() => window.open(url, "_blank")}>
          <ExternalLink className="w-4 h-4" /> Open in new tab
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[92vw] h-[80vh] p-0 flex flex-col gap-0 overflow-hidden opacity-100">
        <DialogHeader className="px-5 py-3 border-b border-border flex-row items-center justify-between space-y-0">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{doc.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.source ?? "—"} · {doc.file_type}
            </p>
          </div>
          <div className="flex items-center gap-1 mr-8">
            {doc.file_path && (
              <>
                <Button size="sm" variant="ghost" onClick={() => url && window.open(url, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc)}>
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 p-4 overflow-hidden">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
