import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DbDocument = {
  id: string;
  user_id: string;
  name: string;
  source: string | null;
  file_type: string;
  file_path: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
};

export const useDocuments = () => {
  const [documents, setDocuments] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Failed to load documents");
    } else {
      setDocuments((data ?? []) as DbDocument[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const inferType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx", "txt", "md"].includes(ext)) return "doc.tx";
    return ext || "doc.tx";
  };

  const uploadDocument = async (file: File, source?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) {
      toast.error("Upload failed");
      return false;
    }
    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      name: file.name,
      source: source ?? null,
      file_type: inferType(file.name),
      file_path: path,
      size_bytes: file.size,
    });
    if (error) {
      toast.error("Failed to save document");
      return false;
    }
    toast.success("Document uploaded");
    fetchDocuments();
    return true;
  };

  const addDocumentEntry = async (name: string, source?: string, file_type?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("documents").insert({
      user_id: user.id,
      name,
      source: source ?? null,
      file_type: file_type ?? inferType(name),
    });
    if (error) {
      toast.error("Failed to add document");
      return false;
    }
    toast.success("Document added");
    fetchDocuments();
    return true;
  };

  const deleteDocument = async (doc: DbDocument) => {
    if (doc.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Document deleted");
    fetchDocuments();
  };

  const downloadDocument = async (doc: DbDocument) => {
    if (!doc.file_path) {
      toast.error("No file attached");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return { documents, loading, uploadDocument, addDocumentEntry, deleteDocument, downloadDocument, refresh: fetchDocuments };
};
