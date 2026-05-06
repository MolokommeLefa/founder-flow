import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FocusSession {
  id: string;
  user_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useFocusSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("*")
      .order("started_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading focus sessions", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setSessions((data as FocusSession[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}

export async function logFocusSession(durationSeconds: number, startedAt: Date, endedAt: Date) {
  if (durationSeconds < 5) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("focus_sessions").insert({
    user_id: user.id,
    duration_seconds: durationSeconds,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
  });
}
