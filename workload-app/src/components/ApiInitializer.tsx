import { useEffect, useState } from 'react';
import { useToast } from './ui/use-toast';

export const ApiInitializer = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Initialize the app by loading data from the API
  useEffect(() => {
    let isMounted = true;
    
    const initializeApi = async () => {
      try {
        // Wait a bit before showing loading state to avoid flash
        const initTimer = setTimeout(() => {
          if (isMounted && !isInitialized) {
            console.log('API initialization taking longer than expected...');
          }
        }, 1000); 
        
        // Make a simple API call to verify connection
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error(`API returned error: ${response.status}`);
        }
        
        const projectsData = await response.json();
        if (isMounted) {
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
        
        clearTimeout(initTimer);
        
        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
          console.log('API initialization complete');
        }
      } catch (err) {
        console.error('Failed to initialize API:', err);
        
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
          setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
          toast({
            title: 'Connection Error',
            description: 'Could not connect to the API server. Please check your connection.',
            variant: 'destructive',
          });
        }
      }
    };
    
    initializeApi();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
    };
  }, [toast]);
  
  // If projects are already loaded or initialization is complete, render the app
  if (isInitialized || projects.length >= 0) {
    return <>{children}</>;
  }
  
  // Show loading state while initializing
  if (isLoading && !isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading application data...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if initialization failed
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 rounded-lg border border-destructive bg-destructive/10 max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">Connection Error</h2>
          <p className="mb-6">
            Could not connect to the API server. Please check your connection and try again.
          </p>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "Unknown error occurred while connecting to the server."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Fallback - this shouldn't normally be reached
  return <>{children}</>;
}; 