import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DbProject {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: "on_track" | "at_risk" | "off_track";
  start_date: string;
  end_date: string;
  color: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface NewProject {
  title: string;
  description?: string;
  parent_id?: string;
  status?: "on_track" | "at_risk" | "off_track";
  start_date: string;
  end_date: string;
  color?: string;
  progress?: number;
}

export function useProjects() {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      toast({ title: "Error loading projects", description: error.message, variant: "destructive" });
      return;
    }

    setProjects((data as DbProject[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: NewProject) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return false;
    }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: project.title,
      description: project.description || null,
      parent_id: project.parent_id || null,
      status: project.status || "on_track",
      start_date: project.start_date,
      end_date: project.end_date,
      color: project.color || "#2563eb",
      progress: project.progress || 0,
    });

    if (error) {
      toast({ title: "Error creating project", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Project created successfully" });
    await fetchProjects();
    return true;
  };

  const updateProject = async (projectId: string, updates: Partial<NewProject>) => {
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId);

    if (error) {
      toast({ title: "Error updating project", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchProjects();
    return true;
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast({ title: "Error deleting project", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Project deleted" });
    await fetchProjects();
    return true;
  };

  const rootProjects = projects.filter(p => !p.parent_id);
  const getSubProjects = (parentId: string) => projects.filter(p => p.parent_id === parentId);

  const projectsByStatus = {
    on_track: projects.filter(p => p.status === "on_track"),
    at_risk: projects.filter(p => p.status === "at_risk"),
    off_track: projects.filter(p => p.status === "off_track"),
  };

  return {
    projects,
    rootProjects,
    getSubProjects,
    projectsByStatus,
    loading,
    addProject,
    updateProject,
    deleteProject,
    fetchProjects,
  };
}
