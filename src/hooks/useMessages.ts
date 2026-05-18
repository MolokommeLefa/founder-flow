import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Attachment = {
  kind: "document" | "project";
  id: string;
  label: string;
};

export type DbMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  read: boolean;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
};

export const useMessages = (userId: string | null) => {
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load messages");
    } else {
      setMessages((data ?? []) as unknown as DbMessage[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as unknown as DbMessage;
          if (m.recipient_id !== userId && m.sender_id !== userId) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]));
          if (m.recipient_id === userId && m.sender_id !== userId) {
            toast.message("New message", { description: m.subject || "(no subject)" });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as unknown as DbMessage;
          if (m.recipient_id !== userId && m.sender_id !== userId) return;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const old = payload.old as Partial<DbMessage>;
          if (!old?.id) return;
          setMessages((prev) => prev.filter((x) => x.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const sendMessage = async (
    recipientId: string,
    subject: string,
    body: string,
    attachments: Attachment[] = [],
  ) => {
    if (!userId) return false;
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: recipientId,
      subject,
      body,
      attachments: attachments as unknown as never,
    });
    if (error) {
      toast.error("Failed to send message");
      return false;
    }
    return true;
  };

  const markRead = async (id: string) => {
    const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
    if (error) toast.error("Failed to mark read");
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
  };

  return { messages, loading, sendMessage, markRead, deleteMessage, refresh: fetchMessages };
};
