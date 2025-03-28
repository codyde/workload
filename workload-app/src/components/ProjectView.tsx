import React, { useState, useEffect, useContext } from 'react';
import { Plus, ChevronLeft, RefreshCw, Calendar, Clock, LayoutList, CheckCircle2, GitPullRequest, ArrowRight } from 'lucide-react';
import { Editor } from './Editor';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';
import { ProjectContext } from '../App';
import { toast } from './ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { projectApi, epicApi, taskApi } from '../lib/api';

// Define proper types
interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived' | 'completed';
}

interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'blocked' | 'completed';
}

interface Task {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done';
}

export function ProjectView() {
  const [newEpicTitle, setNewEpicTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const { selectedProjectId, setSelectedProjectId } = useContext(ProjectContext);
  
  // Debug logging
  console.log('ProjectView - selectedProjectId:', selectedProjectId);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects, epics, and tasks when selectedProjectId changes
  useEffect(() => {
    console.log('ProjectView - useEffect triggered with projectId:', selectedProjectId);
    if (selectedProjectId) {
      loadProjectData();
    }
  }, [selectedProjectId]);

  const loadProjectData = async () => {
    if (!selectedProjectId) {
      console.log('No project ID available, cannot load data');
      return;
    }
    
    console.log('Loading project data for ID:', selectedProjectId);
    setIsLoading(true);
    setError(null);
    
    try {
      // Always load projects to ensure we have the latest data
      console.log('Fetching all projects');
      const projectsData = await projectApi.getAll();
      console.log('Projects data:', projectsData);
      setProjects(projectsData);
      
      // Load epics for the selected project
      console.log(`Fetching epics for project ${selectedProjectId}`);
      try {
        const epicsData = await epicApi.getByProjectId(selectedProjectId);
        console.log('Epics data:', epicsData);
        
        // If we get epics data, save it to state
        setEpics(epicsData);
      } catch (epicError) {
        console.error('Error fetching epics:', epicError);
        // Continue loading flow, don't throw
      }
      
      // If there's a selected epic, load its tasks
      if (selectedEpicId !== null) {
        console.log(`Fetching tasks for epic ${selectedEpicId}`);
        const tasksData = await taskApi.getByEpicId(selectedEpicId);
        console.log('Tasks data:', tasksData);
        setTasks(tasksData);
      }
      
      console.log('Project data loaded successfully');
    } catch (error) {
      console.error('Error loading project data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error loading project data');
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpicTitle.trim() || !selectedProjectId) {
      console.log('Cannot create epic: missing title or projectId', {
        title: newEpicTitle,
        projectId: selectedProjectId
      });
      return;
    }
    
    // Create temp ID for optimistic update
    const tempId = `temp-epic-${Date.now()}`;
    
    // Create temporary epic for optimistic UI
    const tempEpic = {
      id: tempId,
      projectId: selectedProjectId,
      title: newEpicTitle,
      description: '',
      status: 'planning',
      priority: 'medium',
      progress: 0,
      labels: [],
      startDate: undefined,
      dueDate: undefined
    };
    
    // Optimistically add epic to UI
    setEpics([...epics, tempEpic]);
    
    // Reset input immediately
    setNewEpicTitle('');
    
    console.log('Creating epic for project:', selectedProjectId, `(${typeof selectedProjectId})`);
    try {
      const epicData = {
        projectId: selectedProjectId,
        title: newEpicTitle,
        description: '',
      };
      
      console.log('Epic data to send:', epicData);
      
      // Use API client
      const newEpic = await epicApi.create(epicData);
      console.log('New epic created:', newEpic);
      
      // Replace temporary epic with real one
      setEpics(prevEpics => 
        prevEpics.map(e => e.id === tempId ? newEpic : e)
      );
      
      toast({
        title: 'Success',
        description: 'Epic created successfully',
      });
    } catch (error) {
      console.error('Error creating epic:', error);
      
      // Remove temporary epic on error
      setEpics(prevEpics => prevEpics.filter(e => e.id !== tempId));
      
      toast({
        title: 'Error',
        description: 'Failed to create epic',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || selectedEpicId === null) {
      console.log('Cannot create task: missing title or epicId', {
        title: newTaskTitle,
        epicId: selectedEpicId
      });
      return;
    }
    
    // Create temp ID for optimistic update
    const tempId = `temp-task-${Date.now()}`;
    
    // Create temporary task for optimistic UI
    const tempTask = {
      id: tempId,
      epicId: selectedEpicId,
      title: newTaskTitle,
      description: '',
      status: 'todo',
      priority: 'medium',
      assigneeId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: undefined,
      estimate: undefined,
      labels: [],
      dependencies: []
    };
    
    // Optimistically add task to UI
    setTasks([...tasks, tempTask]);
    
    // Reset input immediately
    setNewTaskTitle('');
    
    console.log('Creating task for epic:', selectedEpicId, `(${typeof selectedEpicId})`);
    
    try {
      const taskData = {
        epicId: selectedEpicId,
        title: newTaskTitle,
        description: '',
      };
      
      console.log('Task data to send:', taskData);
      
      // Use API client
      const newTask = await taskApi.create(taskData);
      console.log('New task created:', newTask);
      
      // Replace temporary task with real one
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === tempId ? newTask : t)
      );
      
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Remove temporary task on error
      setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
      
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectApi.update(projectId, updates);
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
    }
  };

  const updateEpic = async (epicId: string, updates: Partial<Epic>) => {
    try {
      const updatedEpic = await epicApi.update(epicId, updates);
      setEpics(epics.map(e => e.id === epicId ? updatedEpic : e));
    } catch (error) {
      console.error('Error updating epic:', error);
      toast({
        title: 'Error',
        description: 'Failed to update epic',
        variant: 'destructive',
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await taskApi.update(taskId, updates);
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };
  
  // Delete epic with optimistic UI update
  const handleDeleteEpic = async (epicId: string) => {
    // Store epic for potential restoration
    const epicToDelete = epics.find(e => e.id === epicId);
    if (!epicToDelete) return;
    
    // Optimistically remove from UI
    setEpics(epics.filter(e => e.id !== epicId));
    
    // If selected epic was deleted, go back to epic list
    if (selectedEpicId === epicId) {
      setSelectedEpicId(null);
    }
    
    // Show optimistic success message
    toast({
      title: 'Epic deleted',
      description: 'The epic has been deleted successfully',
    });
    
    try {
      console.log('Deleting epic:', epicId);
      
      // Use the API client
      await epicApi.delete(epicId);
      console.log('Epic deleted from backend successfully');
    } catch (error) {
      console.error('Error deleting epic:', error);
      
      // Restore epic on error
      setEpics(prev => [...prev, epicToDelete]);
      
      toast({
        title: 'Error',
        description: 'Failed to delete epic. The item has been restored.',
        variant: 'destructive',
      });
    }
  };
  
  // Delete task with optimistic UI update
  const handleDeleteTask = async (taskId: string) => {
    // Store task for potential restoration
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    // Optimistically remove from UI
    setTasks(tasks.filter(t => t.id !== taskId));
    
    // Show optimistic success message
    toast({
      title: 'Task deleted',
      description: 'The task has been deleted successfully',
    });
    
    try {
      console.log('Deleting task:', taskId);
      
      // Use the API client
      await taskApi.delete(taskId);
      console.log('Task deleted from backend successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Restore task on error
      setTasks(prev => [...prev, taskToDelete]);
      
      toast({
        title: 'Error',
        description: 'Failed to delete task. The item has been restored.',
        variant: 'destructive',
      });
    }
  };

  const setSelectedEpic = (epicId: string | null) => {
    console.log('Setting selected epic ID:', epicId);
    setSelectedEpicId(epicId);
    if (epicId !== null) {
      // Load tasks for this epic using API client
      taskApi.getByEpicId(epicId)
        .then(data => {
          console.log('Tasks loaded for epic:', data);
          setTasks(data);
        })
        .catch(error => {
          console.error('Error loading tasks:', error);
          toast({
            title: 'Error',
            description: 'Failed to load tasks',
            variant: 'destructive',
          });
        });
    }
  };

  // Ensure project ID is treated as a string for consistent comparison
  const projectIdString = selectedProjectId ? String(selectedProjectId) : null;
  
  // Find selected project
  const selectedProject = projects.find(p => p.id === projectIdString);
  const projectEpics = epics.filter(epic => epic.projectId === projectIdString);
  const selectedEpic = epics.find(epic => epic.id === selectedEpicId);
  const epicTasks = tasks.filter(task => task.epicId === selectedEpicId);

  console.log('Render info - Selected project:', selectedProject);
  console.log('Render info - Project epics:', projectEpics);
  
  const testApiConnection = async () => {
    console.log('Testing API connection...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Test basic API connection using client
      console.log('Testing API connection with projectApi.getAll()');
      const data = await projectApi.getAll();
      console.log('API connection successful! Projects:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        // Show available project IDs for debugging
        console.log('Available project IDs:', data.map(p => `${p.id} (${typeof p.id})`));
        
        if (selectedProjectId) {
          console.log('Currently selected project ID:', selectedProjectId, `(${typeof selectedProjectId})`);
          
          // Always use string comparison for project IDs
          const projectByStringId = data.find(p => String(p.id) === String(selectedProjectId));
          
          console.log('Selected project ID:', selectedProjectId, `(${typeof selectedProjectId})`);
          console.log('Project found by string comparison:', projectByStringId);
          
          if (projectByStringId) {
            console.log('Found project, setting projects array');
            setProjects(data);
            // Give the state time to update
            setTimeout(() => loadProjectData(), 100);
          } else if (data.length > 0) {
            console.log('Project not found, but projects exist. First project ID:', data[0].id, `(${typeof data[0].id})`);
          }
        }
      }
      
      toast({
        title: 'API Connection Test',
        description: `Successfully connected to API. Found ${data.length} projects.`,
      });
    } catch (error) {
      console.error('API connection test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error testing API connection');
      toast({
        title: 'API Connection Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If project isn't found, show a loading or project not found message
  if (!selectedProject) {
    return (
      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <RefreshCw size={32} className="animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading project data...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
            <p className="text-muted-foreground mb-6">The selected project could not be found or loaded.</p>
            <div className="flex gap-3">
              <button
                onClick={() => loadProjectData()}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground"
              >
                <RefreshCw size={16} /> Retry Loading
              </button>
              <button
                onClick={testApiConnection}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted"
              >
                Test API Connection
              </button>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground max-w-lg">
              <p>Selected Project ID: <code>{selectedProjectId !== null ? selectedProjectId : 'null'}</code> (type: {typeof selectedProjectId})</p>
              <p>Projects loaded: {projects.length}</p>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-md text-sm text-destructive max-w-lg">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
          <StatusSelect
            value={selectedProject.status}
            options={['active', 'archived', 'completed']}
            onChange={(status) => updateProject(selectedProject.id, { status: status as 'active' | 'archived' | 'completed' })}
          />
        </div>
        <button
          onClick={loadProjectData}
          className="flex items-center gap-2 px-3 py-1 text-sm rounded-md border border-border hover:bg-muted"
          title="Refresh project data"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Show loading indicator when fetching data */}
      {isLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2 text-sm">
          <RefreshCw size={14} className="animate-spin text-blue-500" />
          <p>Loading project data...</p>
        </div>
      )}

      {/* Show error message if any */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
          <p className="font-medium text-red-700">Error: {error}</p>
        </div>
      )}

      {!selectedEpicId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Epics</h3>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Create New Epic</CardTitle>
              <CardDescription>Add an epic to organize related tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEpic} className="flex gap-2">
                <input
                  type="text"
                  value={newEpicTitle}
                  onChange={(e) => setNewEpicTitle(e.target.value)}
                  placeholder="New epic title..."
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-foreground"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                  disabled={isLoading || !newEpicTitle.trim()}
                >
                  {isLoading ? 
                    <RefreshCw size={18} className="animate-spin" /> : 
                    <Plus size={18} />
                  } 
                  {isLoading ? 'Creating...' : 'Add Epic'}
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectEpics.length > 0 ? (
              projectEpics.map((epic) => (
                <Card 
                  key={epic.id}
                  className="hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedEpic(epic.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{epic.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <StatusSelect
                          value={epic.status}
                          options={['planning', 'in-progress', 'blocked', 'completed']}
                          onChange={(status) => updateEpic(epic.id, { status: status as 'planning' | 'in-progress' | 'blocked' | 'completed' })}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this epic?')) {
                              handleDeleteEpic(epic.id);
                            }
                          }}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete epic"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    {epic.description && (
                      <CardDescription>{epic.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {tasks.filter((task) => task.epicId === epic.id).length} tasks
                      </div>
                      <span className="text-sm text-primary flex items-center">
                        View tasks
                        <ArrowRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 p-3 bg-primary/10 rounded-full">
                      <GitPullRequest size={24} className="text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-1">No epics yet.</p>
                    <p className="text-sm text-muted-foreground">Create your first epic to get started.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedEpicId(null)}
            className="flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6"
          >
            <ChevronLeft size={20} /> Back to Epics
          </button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">{selectedEpic?.title}</h2>
                  {selectedEpic && (
                    <StatusSelect
                      value={selectedEpic.status}
                      options={['planning', 'in-progress', 'blocked', 'completed']}
                      onChange={(status) => updateEpic(selectedEpic.id, { status: status as 'planning' | 'in-progress' | 'blocked' | 'completed' })}
                    />
                  )}
                </div>
              </div>
              {selectedEpic?.description && (
                <CardDescription>{selectedEpic.description}</CardDescription>
              )}
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Create New Task</CardTitle>
              <CardDescription>Add a task to this epic</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="New task title..."
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-foreground"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                  disabled={isLoading || !newTaskTitle.trim()}
                >
                  {isLoading ? 
                    <RefreshCw size={18} className="animate-spin" /> : 
                    <Plus size={18} />
                  } 
                  {isLoading ? 'Creating...' : 'Add Task'}
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {epicTasks.length > 0 ? (
              epicTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{task.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <StatusSelect
                          value={task.status}
                          options={['todo', 'in-progress', 'blocked', 'in-review', 'done']}
                          onChange={(status) => updateTask(task.id, { status: status as 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done' })}
                        />
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                              handleDeleteTask(task.id);
                            }
                          }}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Editor
                      content={task.description}
                      onChange={(content) =>
                        updateTask(task.id, { description: content })
                      }
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card text-center py-8">
                <CardContent>
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 p-3 bg-primary/10 rounded-full">
                      <LayoutList size={24} className="text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-1">No tasks yet.</p>
                    <p className="text-sm text-muted-foreground">Create your first task to get started.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}