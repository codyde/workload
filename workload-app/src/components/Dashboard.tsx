import React, { useEffect, useState, useContext } from 'react';
import { Plus, ArrowRight, RefreshCw, GitPullRequest, LayoutGrid, CheckCircle, AlertCircle, BarChart } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Project, Epic, Task, projectApi, epicApi, taskApi } from '../lib/api';
import { useToast } from './ui/use-toast';
import { ProjectContext } from '../App';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface DashboardProps {
  isInitialLoading?: boolean;
}

export function Dashboard({ isInitialLoading = false }: DashboardProps) {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  
  const { selectedProjectId, setSelectedProjectId } = useContext(ProjectContext);
  const { toast } = useToast();
  
  // Load projects on component mount
  useEffect(() => {
    if (!isInitialLoading) {
      loadProjects();
    }
  }, [isInitialLoading]);
  
  // Load projects function
  const loadProjects = async () => {
    setIsBackgroundLoading(true);
    setError(null);
    
    try {
      console.log('Loading projects...');
      const data = await projectApi.getAll();
      console.log('Projects loaded:', data);
      
      // We should always get an array from the API now
      if (Array.isArray(data)) {
        console.log(`Setting ${data.length} projects`);
        setProjects(data);
      } else {
        // This should never happen now, but we'll keep it as a fallback
        console.error('Expected array but got:', typeof data, data);
        setProjects([]);
        setError("Received unexpected data format from server. Please try refreshing.");
        toast({
          title: "Data Error",
          description: "Unexpected data format from server",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]); // Reset to empty array to avoid filter errors
      setError(error instanceof Error ? error.message : 'Unknown error loading projects');
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsBackgroundLoading(false);
    }
  };
  
  // Handle project selection
  const handleSelectProject = async (projectId: string) => {
    console.log('Dashboard: Selecting project with ID:', projectId, `(${typeof projectId})`);
    
    // Always use string IDs to maintain consistency
    const projectIdStr = String(projectId);
    console.log('Dashboard: Ensuring project ID is string:', projectIdStr);
    
    setSelectedProjectId(projectIdStr);
    
    try {
      console.log('Dashboard: Fetching epics for project:', projectIdStr);
      const projectEpics = await epicApi.getByProjectId(projectIdStr);
      console.log('Dashboard: Epics fetched:', projectEpics);
      setEpics(projectEpics);
      
      // Load tasks for each epic
      const allTasks: Task[] = [];
      for (const epic of projectEpics) {
        console.log('Dashboard: Fetching tasks for epic:', epic.id);
        const epicTasks = await taskApi.getByEpicId(epic.id);
        allTasks.push(...epicTasks);
      }
      
      console.log('Dashboard: All tasks fetched:', allTasks);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading project details:', error);
      toast({
        title: "Error loading project details",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };
  
  // Create new project with optimistic UI updates
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    // Create temporary project for optimistic update
    const tempProject: Project = {
      id: tempId,
      userId: 'temp-user-id', // Will be set properly by the API
      name: newProjectName,
      description: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: [],
    };
    
    // Optimistically add to UI
    setProjects([...projects, tempProject]);
    
    // Reset form immediately for better UX
    setNewProjectName('');
    
    // Start background loading indicator
    setIsBackgroundLoading(true);
    
    try {
      console.log('Creating new project:', newProjectName);
      
      // Actual API call
      const createdProject = await projectApi.create({
        name: newProjectName,
        description: ''
      });
      
      console.log('Project created:', createdProject);
      
      // Replace temporary project with real one
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === tempId ? createdProject : p)
      );
      
      // Show success toast
      toast({
        title: "Project created",
        description: "Your new project has been created successfully."
      });

      // Dispatch an event to notify other components (like Sidebar)
      const projectCreatedEvent = new CustomEvent('projectCreated', {
        detail: { project: createdProject }
      });
      window.dispatchEvent(projectCreatedEvent);
      
    } catch (error) {
      console.error('Error creating project:', error);
      
      // Remove temporary project on error
      setProjects(prevProjects => prevProjects.filter(p => p.id !== tempId));
      
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsBackgroundLoading(false);
    }
  };
  
  // Delete project with optimistic UI updates
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    // Safety check: ensure projects is an array
    if (!Array.isArray(projects)) {
      console.error('projects is not an array:', projects);
      toast({
        title: "Error",
        description: "Cannot delete project due to invalid data format",
        variant: "destructive"
      });
      return;
    }
    
    // Store project for restoration in case of error
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) {
      console.warn('Project not found for deletion:', projectId);
      return;
    }
    
    try {
      // Optimistically remove from UI
      setProjects(projects.filter(p => p.id !== projectId));
      
      // If the deleted project was selected, deselect it
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      
      // Dispatch an event to notify other components (like Sidebar)
      const projectDeletedEvent = new CustomEvent('projectDeleted', {
        detail: { projectId }
      });
      window.dispatchEvent(projectDeletedEvent);
      
      // Show optimistic toast
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully."
      });
      
      // Start background loading indicator
      setIsBackgroundLoading(true);
      
      console.log('Deleting project:', projectId);
      
      // Actual API call - using the imported API
      await projectApi.delete(projectId);
      console.log('Project successfully deleted from backend');
      
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Safety check before restoring
      if (Array.isArray(projects) && projectToDelete) {
        // Restore project on error
        setProjects(prev => {
          if (Array.isArray(prev)) {
            return [...prev, projectToDelete];
          }
          return [projectToDelete];
        });
      }
      
      // Dispatch event to notify restoration
      const projectRestoredEvent = new CustomEvent('projectRestored', {
        detail: { project: projectToDelete }
      });
      window.dispatchEvent(projectRestoredEvent);
      
      // Show error toast
      toast({
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsBackgroundLoading(false);
    }
  };

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const activeEpics = epics.filter(epic => epic.status === 'in-progress').length;
  const activeProjects = projects.filter(project => project.status === 'active').length;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <LayoutGrid size={24} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <button 
          onClick={loadProjects} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      
      {/* Only show loading indicator for background operations */}
      {isBackgroundLoading && (
        <div className="fixed top-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin text-primary" />
          <span className="text-sm">Updating...</span>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-lg shadow-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-md">
                <LayoutGrid size={16} className="text-blue-600" />
              </div>
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeProjects}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-md">
                <GitPullRequest size={16} className="text-purple-600" />
              </div>
              <CardTitle className="text-lg">Active Epics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeEpics}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {epics.length} total epics
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-md">
                <BarChart size={16} className="text-green-600" />
              </div>
              <CardTitle className="text-lg">Task Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {completedTasks} of {totalTasks} tasks complete
            </p>
            
            {totalTasks > 0 && (
              <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${Math.round((completedTasks / totalTasks) * 100)}%` }}
                ></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <span className="text-sm text-muted-foreground">{projects.length} total</span>
            </div>
            <CardDescription>
              Your most recently created or updated projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length > 0 ? (
              projects.slice(0, 3).map((project) => (
                <Collapsible key={project.id} className="border border-border rounded-lg">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground mr-2">
                        {epics.filter(epic => epic.projectId === project.id).length} epics
                      </span>
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="text-muted-foreground"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        {project.description || "No description provided"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          ID: {project.id}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete project"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProject(project.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-primary bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium"
                            title="View project"
                          >
                            View <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <div className="py-8 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-primary" />
                    <span>Loading projects...</span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex justify-center">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <LayoutGrid size={24} className="text-primary" />
                      </div>
                    </div>
                    <p className="text-muted-foreground">No projects yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first project to get started.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <button
              onClick={() => document.getElementById('projectNameInput')?.focus()}
              className="flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <Plus size={16} /> Create New Project
            </button>
          </CardFooter>
        </Card>

        {/* Create Project */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Add a new project to start organizing your work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="projectNameInput" className="text-sm font-medium">
                  Project Name
                </label>
                <input
                  id="projectNameInput"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full rounded-md border border-border bg-card px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !newProjectName.trim()}
              >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />} 
                {isLoading ? 'Creating Project...' : 'Create Project'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Task Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Task Overview</CardTitle>
          <CardDescription>
            Status breakdown of tasks across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-md">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">To Do</h3>
                <p className="text-2xl font-bold">
                  {tasks.filter(task => task.status === 'todo').length}
                </p>
                {totalTasks > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((tasks.filter(task => task.status === 'todo').length / totalTasks) * 100)}% of all tasks
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <RefreshCw size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">In Progress</h3>
                <p className="text-2xl font-bold">
                  {inProgressTasks}
                </p>
                {totalTasks > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((inProgressTasks / totalTasks) * 100)}% of all tasks
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Completed</h3>
                <p className="text-2xl font-bold">
                  {completedTasks}
                </p>
                {totalTasks > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round((completedTasks / totalTasks) * 100)}% of all tasks
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}