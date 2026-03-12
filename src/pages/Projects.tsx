import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import GanttTimeline from "@/components/projects/GanttTimeline";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import { useProjects } from "@/hooks/useProjects";
import { Filter, SlidersHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Projects = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { projects, rootProjects, getSubProjects, loading: projectsLoading, addProject, updateProject, deleteProject } = useProjects();

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

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <DashboardSidebar activeItem="Projects" collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <DashboardHeader userName={userName} showGreeting={false} />

        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-muted-foreground text-sm">Track and Manage your projects</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sort
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              New Project
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground mb-4">No projects yet. Create your first project to get started.</p>
              <Button onClick={() => setAddDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </div>
          ) : (
            <GanttTimeline
              projects={projects}
              rootProjects={rootProjects}
              getSubProjects={getSubProjects}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onAddSubProject={(parentId) => {
                setAddDialogOpen(true);
              }}
            />
          )}
        </div>

        <AddProjectDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={addProject}
          parentProjects={rootProjects}
        />
      </main>
    </div>
  );
};

export default Projects;
