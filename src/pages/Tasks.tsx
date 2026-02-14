import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Plus } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KanbanColumn from "@/components/dashboard/KanbanColumn";
import AddTaskDialog from "@/components/dashboard/AddTaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";
import type { DbTask } from "@/hooks/useTasks";

const Tasks = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<DbTask["status"]>("not_started");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { tasksByStatus, addTask, updateTaskStatus, loading: tasksLoading } = useTasks();

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as DbTask["status"];
    updateTaskStatus(draggableId, newStatus);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) navigate("/auth");
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const emailPrefix = user.email?.split("@")[0] || "there";
  const firstName = emailPrefix.split(/[._-]/)[0];
  const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const filterTasks = (tasks: DbTask[]) =>
    tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const notStartedTasks = filterTasks(tasksByStatus.not_started);
  const inProgressTasks = filterTasks(tasksByStatus.in_progress);
  const completedTasks = filterTasks(tasksByStatus.completed);

  const handleAddFromColumn = (status: DbTask["status"]) => {
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const formatTasksForColumn = (tasks: DbTask[]) =>
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      priority: t.priority,
      dueDate: t.due_date
        ? new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : undefined,
    }));

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Tasks</h1>
          <p className="text-muted-foreground">Manage and organize your work</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button
            size="default"
            className="gap-2"
            onClick={() => {
              setDefaultStatus("not_started");
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {tasksLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4">
              <KanbanColumn
                title="Not Started"
                status="not_started"
                tasks={formatTasksForColumn(notStartedTasks)}
                count={notStartedTasks.length}
                onAddTask={() => handleAddFromColumn("not_started")}
              />
              <KanbanColumn
                title="In Progress"
                status="in_progress"
                tasks={formatTasksForColumn(inProgressTasks)}
                count={inProgressTasks.length}
                onAddTask={() => handleAddFromColumn("in_progress")}
              />
              <KanbanColumn
                title="Completed"
                status="completed"
                tasks={formatTasksForColumn(completedTasks)}
                count={completedTasks.length}
                onAddTask={() => handleAddFromColumn("completed")}
              />
            </div>
          </DragDropContext>
        )}

        <AddTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={addTask}
          defaultStatus={defaultStatus}
        />
      </main>
    </div>
  );
};

export default Tasks;
