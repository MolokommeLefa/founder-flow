import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  color: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTask {
  title: string;
  description?: string;
  status: "not_started" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date?: string;
  color?: string;
  start_time?: string;
  end_time?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading tasks", description: error.message, variant: "destructive" });
      return;
    }

    setTasks((data as DbTask[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: NewTask) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return false;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || null,
      color: task.color || '#2563eb',
      start_time: task.start_time || null,
      end_time: task.end_time || null,
    });

    if (error) {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Task created successfully" });
    await fetchTasks();
    return true;
  };

  const updateTaskStatus = async (taskId: string, status: DbTask["status"]) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
      return false;
    }

    await fetchTasks();
    return true;
  };

  const updateTask = async (taskId: string, updates: Partial<NewTask>) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updates.title,
        description: updates.description || null,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.due_date || null,
        color: updates.color,
        start_time: updates.start_time || null,
        end_time: updates.end_time || null,
      })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Task updated successfully" });
    await fetchTasks();
    return true;
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Task deleted" });
    await fetchTasks();
    return true;
  };

  const tasksByStatus = {
    not_started: tasks.filter((t) => t.status === "not_started"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  return { tasks, tasksByStatus, loading, addTask, updateTask, updateTaskStatus, deleteTask, fetchTasks };
}
