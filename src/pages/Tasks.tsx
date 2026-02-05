 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { User } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { Search, Filter, Plus } from "lucide-react";
 import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
 import DashboardHeader from "@/components/dashboard/DashboardHeader";
 import KanbanColumn from "@/components/dashboard/KanbanColumn";
 import { Task } from "@/components/dashboard/KanbanCard";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 
 // Sample tasks data
const notStartedSampleTasks: Task[] = [
  { id: "1", title: "Design new landing page", description: "Create wireframes and high-fidelity mockups for the homepage redesign", priority: "high", dueDate: "Feb 8" },
  { id: "2", title: "Set up analytics dashboard", priority: "low", dueDate: "Feb 12" },
  { id: "3", title: "Write product documentation", description: "Document the new features for the developer portal", priority: "medium", dueDate: "Feb 7" },
];

const inProgressSampleTasks: Task[] = [
  { id: "4", title: "Review brand guidelines", description: "Go through the updated brand book with the team", priority: "medium", dueDate: "Feb 10" },
  { id: "5", title: "Client presentation prep", priority: "high", dueDate: "Feb 6" },
  { id: "6", title: "Update API endpoints", description: "Refactor authentication endpoints for better security", priority: "high" },
];

const completedSampleTasks: Task[] = [
  { id: "7", title: "Team standup notes", priority: "low", dueDate: "Feb 5" },
  { id: "8", title: "Finalize Q1 roadmap", description: "Complete the product roadmap for the first quarter", priority: "medium" },
];
 
 const Tasks = () => {
   const navigate = useNavigate();
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         setLoading(false);
         
         if (!session?.user) {
           navigate("/auth");
         }
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       setLoading(false);
       
       if (!session?.user) {
         navigate("/auth");
       }
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
 
   if (!user) {
     return null;
   }
 
   const emailPrefix = user.email?.split("@")[0] || "there";
   const firstName = emailPrefix.split(/[._-]/)[0];
   const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
 
   // Filter tasks based on search
  const filterTasks = (tasks: Task[]) => tasks.filter(task =>
     task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     task.description?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
  const notStartedTasks = filterTasks(notStartedSampleTasks);
  const inProgressTasks = filterTasks(inProgressSampleTasks);
  const completedTasks = filterTasks(completedSampleTasks);
 
   return (
     <div className="min-h-screen bg-background flex">
       {/* Sidebar - hidden on mobile */}
       <div className="hidden md:block">
         <DashboardSidebar />
       </div>
 
       {/* Main content */}
       <main className="flex-1 p-6 md:p-8 overflow-auto">
         <DashboardHeader userName={userName} />
 
         {/* Tasks Header */}
         <div className="mb-8">
           <h1 className="text-2xl font-bold text-foreground mb-1">Tasks</h1>
           <p className="text-muted-foreground">Manage and organize your work</p>
         </div>
 
         {/* Toolbar */}
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
           <Button size="default" className="gap-2">
             <Plus className="w-4 h-4" />
             Add Task
           </Button>
         </div>
 
         {/* Kanban Board */}
         <div className="flex gap-6 overflow-x-auto pb-4">
           <KanbanColumn
             title="Not Started"
             status="not_started"
             tasks={notStartedTasks}
             count={notStartedTasks.length}
           />
           <KanbanColumn
             title="In Progress"
             status="in_progress"
             tasks={inProgressTasks}
             count={inProgressTasks.length}
           />
           <KanbanColumn
             title="Completed"
             status="completed"
             tasks={completedTasks}
             count={completedTasks.length}
           />
         </div>
       </main>
     </div>
   );
 };
 
 export default Tasks;