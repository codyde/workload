// API base URL - using relative path to work with Vite proxy
const API_BASE_URL = '/api';

// Types from the server
export type ProjectStatus = 'active' | 'archived' | 'completed';
export type EpicStatus = 'planning' | 'in-progress' | 'blocked' | 'completed';
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'in-review' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

// Interfaces matching our database schema
export interface Project {
  id: string;
  userId: string; // Owner of the project
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: number | Date; // Unix timestamp from server, Date in client
  updatedAt: number | Date; // Unix timestamp from server, Date in client
  icon?: string;
  labels: string[];
}

export interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: EpicStatus;
  priority: Priority;
  startDate?: number | Date; // Unix timestamp from server, Date in client
  dueDate?: number | Date; // Unix timestamp from server, Date in client
  progress: number;
  labels: string[];
}

export interface Task {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  createdAt: number | Date; // Unix timestamp from server, Date in client
  updatedAt: number | Date; // Unix timestamp from server, Date in client
  dueDate?: number | Date; // Unix timestamp from server, Date in client
  estimate?: number;
  labels: string[];
  parentTaskId?: string;
  dependencies: string[];
}

// Helper functions for date conversion
const convertDatesToTimestamps = (obj: any): any => {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = Math.floor(result[key].getTime() / 1000);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertDatesToTimestamps(result[key]);
    }
  }
  return result;
};

const convertTimestampsToDates = (obj: any): any => {
  // Handle arrays - if an array is passed, map each item and return an array
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToDates(item));
  }
  
  // If not an object or null, return as is
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const result = { ...obj };
  // List of fields that should be converted to Date objects
  const dateFields = ['createdAt', 'updatedAt', 'startDate', 'dueDate'];
  
  for (const key in result) {
    if (dateFields.includes(key) && typeof result[key] === 'number') {
      // Convert from Unix timestamp to JavaScript Date
      result[key] = new Date(result[key] * 1000);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // Process nested objects and arrays
      result[key] = convertTimestampsToDates(result[key]);
    }
  }
  return result;
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      // Try to read the error body as text first
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      
      if (!errorText.trim()) {
        throw new Error(`API request failed with status: ${response.status} ${response.statusText}`);
      }
      
      // Try to parse as JSON if there's content
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      } catch (parseError) {
        // If JSON parsing fails, use the text directly
        throw new Error(`API error: ${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      // Fallback error
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
  }
  
  try {
    // Try to clone the response for parsing
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    
    // Handle empty responses
    if (!responseText.trim()) {
      console.warn('Empty response body');
      return null;
    }
    
    // Try to parse as JSON
    const data = JSON.parse(responseText);
    return convertTimestampsToDates(data);
  } catch (error) {
    console.error('Error processing response:', error);
    throw new Error('Failed to process API response');
  }
};

// Function to get the current user ID from auth store or localStorage
const getCurrentUserId = (): string => {
  // Try to get from localStorage first (simple implementation for demo)
  const authData = localStorage.getItem('workload-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.state?.user?.id) {
        return parsed.state.user.id;
      }
    } catch (e) {
      console.error('Error parsing auth data:', e);
    }
  }
  
  // Fallback to a fixed ID for demo purposes
  return 'demo-user-id';
};

// API client for projects
export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const userId = getCurrentUserId();
    console.log('Getting all projects for user ID:', userId);
    try {
      // Make the API call
      const response = await fetch(`${API_BASE_URL}/projects?userId=${userId}`);
      console.log('Raw response status:', response.status);
      
      if (!response.ok) {
        console.error(`Error fetching projects: ${response.status} ${response.statusText}`);
        return [];
      }
      
      // Get the response text
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      // Check for empty response
      if (!responseText.trim()) {
        console.warn('Empty response from API, returning empty array');
        return [];
      }
      
      // Parse JSON
      try {
        const data = JSON.parse(responseText);
        
        // Apply timestamp conversion and ensure we return an array
        if (Array.isArray(data)) {
          console.log('Response is an array with', data.length, 'items');
          return convertTimestampsToDates(data);
        } 
        
        if (data && typeof data === 'object') {
          // Handle single project case
          if ('id' in data) {
            console.log('Response is a single project object, wrapping in array');
            return convertTimestampsToDates([data]);
          }
          
          // Look for array properties
          for (const key of ['projects', 'data', 'items', 'results']) {
            if (key in data && Array.isArray(data[key])) {
              console.log(`Found projects array in response.${key} with`, data[key].length, 'items');
              return convertTimestampsToDates(data[key]);
            }
          }
        }
        
        // If we got here, something unexpected came back
        console.error('Response format not recognized:', data);
        return [];
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },
  
  getById: async (id: string): Promise<Project> => {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/projects/${id}?userId=${userId}`);
    return handleResponse(response);
  },
  
  create: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'labels' | 'userId'>): Promise<Project> => {
    const userId = getCurrentUserId();
    const projectWithUserId = { ...project, userId };
    
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectWithUserId),
    });
    return handleResponse(response);
  },
  
  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const convertedProject = convertDatesToTimestamps(project);
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertedProject),
    });
    return handleResponse(response);
  },
  
  delete: async (id: string): Promise<{ success: boolean }> => {
    const userId = getCurrentUserId();
    console.log(`Deleting project ${id} for user ${userId}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        console.error(`Error deleting project: ${response.status} ${response.statusText}`);
        // Try to parse error body if available
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Check if there's any content in the response
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        // Empty response is still valid for a DELETE operation
        console.log('Empty response from delete operation, returning success');
        return { success: true };
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        console.log('Delete response data:', data);
        return { success: true, ...data };
      } catch (parseError) {
        // If parsing fails, just return success since the status was OK
        console.warn('Could not parse delete response as JSON:', parseError);
        return { success: true };
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      throw error;
    }
  },
};

// API client for epics
export const epicApi = {
  getByProjectId: async (projectId: string): Promise<Epic[]> => {
    try {
      console.log(`Fetching epics for project ${projectId}`);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/epics`);
      
      if (!response.ok) {
        console.error(`Error fetching epics: ${response.status} ${response.statusText}`);
        return [];
      }
      
      // Get raw text to diagnose format issues
      const text = await response.text();
      console.log('Raw epics response:', text);
      
      if (!text.trim()) {
        console.warn('Empty response when fetching epics');
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        
        if (Array.isArray(data)) {
          return convertTimestampsToDates(data);
        } else if (data && typeof data === 'object') {
          for (const key of ['epics', 'data', 'items']) {
            if (key in data && Array.isArray(data[key])) {
              return convertTimestampsToDates(data[key]);
            }
          }
          
          if ('id' in data) {
            return [convertTimestampsToDates(data)];
          }
        }
        
        console.warn('Unexpected epics response format:', data);
        return [];
      } catch (parseError) {
        console.error('Error parsing epics response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error in getByProjectId:', error);
      return [];
    }
  },
  
  getById: async (id: string): Promise<Epic> => {
    const response = await fetch(`${API_BASE_URL}/epics/${id}`);
    return handleResponse(response);
  },
  
  create: async (epic: Omit<Epic, 'id' | 'status' | 'priority' | 'progress' | 'labels'>): Promise<Epic> => {
    const convertedEpic = convertDatesToTimestamps(epic);
    const response = await fetch(`${API_BASE_URL}/epics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertedEpic),
    });
    return handleResponse(response);
  },
  
  update: async (id: string, epic: Partial<Epic>): Promise<Epic> => {
    const convertedEpic = convertDatesToTimestamps(epic);
    const response = await fetch(`${API_BASE_URL}/epics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertedEpic),
    });
    return handleResponse(response);
  },
  
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/epics/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// API client for tasks
export const taskApi = {
  getByEpicId: async (epicId: string): Promise<Task[]> => {
    try {
      console.log(`Fetching tasks for epic ${epicId}`);
      const response = await fetch(`${API_BASE_URL}/epics/${epicId}/tasks`);
      
      if (!response.ok) {
        console.error(`Error fetching tasks: ${response.status} ${response.statusText}`);
        return [];
      }
      
      // Get raw text to diagnose format issues
      const text = await response.text();
      console.log('Raw tasks response:', text);
      
      if (!text.trim()) {
        console.warn('Empty response when fetching tasks');
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        
        if (Array.isArray(data)) {
          return convertTimestampsToDates(data);
        } else if (data && typeof data === 'object') {
          for (const key of ['tasks', 'data', 'items']) {
            if (key in data && Array.isArray(data[key])) {
              return convertTimestampsToDates(data[key]);
            }
          }
          
          if ('id' in data) {
            return [convertTimestampsToDates(data)];
          }
        }
        
        console.warn('Unexpected tasks response format:', data);
        return [];
      } catch (parseError) {
        console.error('Error parsing tasks response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error in getByEpicId:', error);
      return [];
    }
  },
  
  getSubtasks: async (parentTaskId: string): Promise<Task[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${parentTaskId}/subtasks`);
    return handleResponse(response);
  },
  
  getById: async (id: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    return handleResponse(response);
  },
  
  create: async (task: Omit<Task, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'labels' | 'dependencies'>): Promise<Task> => {
    const convertedTask = convertDatesToTimestamps(task);
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertedTask),
    });
    return handleResponse(response);
  },
  
  update: async (id: string, task: Partial<Task>): Promise<Task> => {
    const convertedTask = convertDatesToTimestamps(task);
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convertedTask),
    });
    return handleResponse(response);
  },
  
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
  
  addDependency: async (taskId: string, dependsOnTaskId: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/dependencies/${dependsOnTaskId}`, {
      method: 'POST',
    });
    return handleResponse(response);
  },
  
  removeDependency: async (taskId: string, dependsOnTaskId: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/dependencies/${dependsOnTaskId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
}; 