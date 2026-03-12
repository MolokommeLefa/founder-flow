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
import TaskDialog from "@/components/dashboard/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTasks } from "@/hooks/useTasks";
import type { DbTask, NewTask } from "@/hooks/useTasks";

const Tasks = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<DbTask["status"]>("not_started");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { tasks, tasksByStatus, addTask, updateTask, updateTaskStatus, deleteTask, loading: tasksLoading } = useTasks();

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as DbTask["status"];
    updateTaskStatus(draggableId, newStatus);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id);
      setDeleteDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const handleEditSubmit = async (taskData: NewTask) => {
    if (!selectedTask) return false;
    const success = await updateTask(selectedTask.id, taskData);
    if (success) {
      setSelectedTask(null);
    }
    return success;
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
    setAddDialogOpen(true);
  };

  const formatTasksForColumn = (tasks: DbTask[]) =>
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      priority: t.priority as "low" | "medium" | "high",
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
        <DashboardHeader userName={userName} showGreeting={false} />

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
              setAddDialogOpen(true);
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
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
              <KanbanColumn
                title="In Progress"
                status="in_progress"
                tasks={formatTasksForColumn(inProgressTasks)}
                count={inProgressTasks.length}
                onAddTask={() => handleAddFromColumn("in_progress")}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
              <KanbanColumn
                title="Completed"
                status="completed"
                tasks={formatTasksForColumn(completedTasks)}
                count={completedTasks.length}
                onAddTask={() => handleAddFromColumn("completed")}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </DragDropContext>
        )}

        {/* Add Task Dialog */}
        <AddTaskDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={addTask}
          defaultStatus={defaultStatus}
        />

        {/* Edit Task Dialog */}
        <TaskDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
          selectedTask={selectedTask}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Tasks;
