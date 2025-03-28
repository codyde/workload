import React, { useContext, useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProjectContext } from '../App';
import { Project, projectApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function Sidebar() {
  const { selectedProjectId, setSelectedProjectId } = useContext(ProjectContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore(state => state.user);

  // Load projects when the sidebar mounts
  useEffect(() => {
    loadProjects();
  }, []);

  // Subscribe to project events to update sidebar
  useEffect(() => {
    // Custom event for project deletion
    const handleProjectDeleted = (e: CustomEvent) => {
      const deletedProjectId = e.detail.projectId;
      console.log('Sidebar: Received project deleted event for ID:', deletedProjectId);
      setProjects(prev => prev.filter(p => p.id !== deletedProjectId));
      
      // If the deleted project was selected, go back to dashboard
      if (selectedProjectId === deletedProjectId) {
        setSelectedProjectId(null);
      }
    };

    // Custom event for project creation
    const handleProjectCreated = (e: CustomEvent) => {
      const newProject = e.detail.project;
      console.log('Sidebar: Received project created event:', newProject);
      setProjects(prev => [...prev, newProject]);
    };

    // Add event listeners
    window.addEventListener('projectDeleted' as any, handleProjectDeleted as EventListener);
    window.addEventListener('projectCreated' as any, handleProjectCreated as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('projectDeleted' as any, handleProjectDeleted as EventListener);
      window.removeEventListener('projectCreated' as any, handleProjectCreated as EventListener);
    };
  }, [selectedProjectId, setSelectedProjectId]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectApi.getAll();
      console.log('Sidebar: Projects loaded:', data);
      
      // Simply set the data as projects (API ensures it's an array)
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        // This should not happen anymore
        console.error('Sidebar: Expected array but got:', typeof data, data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects in sidebar:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine if a project is selected
  const isSelectedProject = (projectId: string, selectedId: string | number | null): boolean => {
    if (selectedId === null) return false;
    // Convert both to strings for comparison
    return String(selectedId) === String(projectId);
  };

  return (
    <div className="pb-12 min-h-screen flex flex-col bg-background border-r border-border">
      {/* User section with avatar */}
      <div className="p-3 flex items-center gap-3 border-b border-border">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name} className="h-8 w-8 rounded-full" />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-medium">{user?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
        </div>
      </div>
      
      {/* Search area - Linear style */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-muted-foreground">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 flex-1 bg-transparent text-sm outline-none"
          />
          <span className="ml-2 text-xs border border-border rounded px-1.5 py-0.5">⌘K</span>
        </div>
      </div>
      
      {/* Main navigation */}
      <div className="px-3 py-2">
        <div className="space-y-1">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
              !selectedProjectId ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
            )}
          >
            <LayoutDashboard size={16} />
            Home
          </button>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      {/* Projects section */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1 px-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</h3>
          {isLoading ? (
            <RefreshCw size={14} className="animate-spin text-muted-foreground" />
          ) : (
            <button 
              onClick={loadProjects}
              className="text-muted-foreground hover:text-foreground"
              title="Refresh projects"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-300px)] px-1">
          <div className="space-y-0.5">
            {projects.length > 0 ? (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    console.log('Sidebar: selecting project:', project.id);
                    const projectIdStr = String(project.id);
                    setSelectedProjectId(projectIdStr);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                    isSelectedProject(project.id, selectedProjectId)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-4 h-4 rounded-sm bg-primary/20 text-primary flex items-center justify-center">
                      {project.icon || <FolderKanban size={12} />}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-50" />
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {isLoading ? 'Loading projects...' : 'No projects yet'}
              </div>
            )}
            
            <button
              className="w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted text-primary/80 hover:text-primary mt-1"
              onClick={() => {
                // You can implement project creation dialog here later
                console.log('Create new project');
              }}
            >
              <Plus size={14} />
              New Project
            </button>
          </div>
        </ScrollArea>
      </div>
      
      {/* Settings at the bottom */}
      <div className="mt-auto px-3 py-2 border-t border-border">
        <button
          className="w-full flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted text-foreground/80"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
}