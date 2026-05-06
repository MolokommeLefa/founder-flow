import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RevenueEntry {
  id: string;
  user_id: string;
  amount: number;
  source: string | null;
  description: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface NewRevenueEntry {
  amount: number;
  source?: string;
  description?: string;
  entry_date?: string;
}

export function useRevenue() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("revenue_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    if (error) {
      toast({ title: "Error loading revenue", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setEntries((data as RevenueEntry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async (entry: NewRevenueEntry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("revenue_entries").insert({
      user_id: user.id,
      amount: entry.amount,
      source: entry.source ?? null,
      description: entry.description ?? null,
      entry_date: entry.entry_date ?? new Date().toISOString().slice(0, 10),
    });
    if (error) {
      toast({ title: "Error adding revenue", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Revenue entry added" });
    await fetchEntries();
    return true;
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("revenue_entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchEntries();
    return true;
  };

  return { entries, loading, addEntry, deleteEntry, refetch: fetchEntries };
}
