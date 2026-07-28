import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      toast({ title: "Error loading profile", description: error.message, variant: "destructive" });
    }

    setProfile(data as Profile | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return false;
    }

    const trimmed = displayName.trim();
    if (!trimmed) {
      toast({ title: "Display name cannot be empty", variant: "destructive" });
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        display_name: trimmed,
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error saving display name", description: error.message, variant: "destructive" });
      return false;
    }

    setProfile(data as Profile);
    toast({ title: "Display name updated" });
    return true;
  }, []);

  return { profile, loading, updateDisplayName, refreshProfile: fetchProfile };
}
