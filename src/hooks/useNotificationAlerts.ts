import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotificationAlerts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPendingTasks, setHasPendingTasks] = useState(false);
  const [hasUnreadInbox, setHasUnreadInbox] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshTasks = async (uid: string) => {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .in("status", ["not_started", "in_progress"]);
    setHasPendingTasks((count ?? 0) > 0);
  };

  const refreshInbox = async (uid: string) => {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", uid)
      .eq("read", false);
    setHasUnreadInbox((count ?? 0) > 0);
  };

  useEffect(() => {
    if (!userId) {
      setHasPendingTasks(false);
      setHasUnreadInbox(false);
      return;
    }
    refreshTasks(userId);
    refreshInbox(userId);

    const channel = supabase
      .channel("notification-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => refreshTasks(userId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        () => refreshInbox(userId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { hasPendingTasks, hasUnreadInbox };
}
