import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GmailMessage = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
  labelIds: string[];
};

export type GmailFullMessage = GmailMessage & {
  to: string;
  body: string;
  html?: string;
};

const invoke = async <T,>(body: Record<string, unknown>): Promise<T | null> => {
  const { data, error } = await supabase.functions.invoke("gmail", { body });
  if (error) {
    toast.error(error.message || "Gmail request failed");
    return null;
  }
  if ((data as any)?.error) {
    toast.error((data as any).error);
    return null;
  }
  return data as T;
};

export const useGmail = (enabled: boolean) => {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await invoke<{ messages: GmailMessage[] }>({
      action: "list",
      q: "in:inbox",
      maxResults: 25,
    });
    if (res?.messages) setMessages(res.messages);
    else setError("Could not load Gmail");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (enabled) fetchInbox();
  }, [enabled, fetchInbox]);

  const getMessage = async (id: string) =>
    invoke<GmailFullMessage>({ action: "get", id });

  const sendMessage = async (to: string, subject: string, body: string) => {
    const res = await invoke<{ ok: boolean }>({ action: "send", to, subject, body });
    if (res?.ok) toast.success("Email sent");
    return !!res?.ok;
  };

  const markRead = async (id: string) => {
    await invoke({ action: "markRead", id });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  };

  return { messages, loading, error, refresh: fetchInbox, getMessage, sendMessage, markRead };
};
