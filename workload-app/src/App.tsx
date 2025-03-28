import React, { useState, useEffect } from 'react';
import { LogOut, Code2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectView } from './components/ProjectView';
import { ApiInitializer } from './components/ApiInitializer';
import { Toaster } from './components/ui/toaster';
import { projectApi } from './lib/api';

// App state context for project selection
export const ProjectContext = React.createContext({
  selectedProjectId: null as string | null,
  setSelectedProjectId: (id: string | null) => {}
});

function TaskApp() {
  const logout = useAuthStore((state) => state.logout);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load initial data when the app mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Try to load the project list when the user first lands
        const projects = await projectApi.getAll();
        console.log('Initial projects loaded:', projects);
        
        // If projects exist, optionally pre-select the first one
        if (Array.isArray(projects) && projects.length > 0) {
          // Uncomment if you want to automatically select the first project
          // setSelectedProjectId(projects[0].id);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const projectContextValue = {
    selectedProjectId,
    setSelectedProjectId
  };

  return (
    <ProjectContext.Provider value={projectContextValue}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border fixed top-0 left-0 right-0 z-50 bg-background">
          <div className="flex justify-between items-center h-14 px-4">
            <div className="flex items-center gap-2">
              <Code2 size={24} className="text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Workload
              </h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-border hover:bg-card transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="pt-14 flex">
          <aside className="w-60 border-r border-border fixed left-0 top-14 bottom-0">
            <Sidebar />
          </aside>
          <main className="flex-1 ml-60">
            {selectedProjectId ? <ProjectView /> : <Dashboard isInitialLoading={isInitialLoading} />}
          </main>
        </div>
        
        {/* Toast notifications */}
        <Toaster />
      </div>
    </ProjectContext.Provider>
  );
}

function App() {
  const user = useAuthStore((state) => state.user);
  
  return (
    <ApiInitializer>
      {user ? <TaskApp /> : <LandingPage />}
    </ApiInitializer>
  );
}

export default App;