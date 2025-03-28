import { db } from '../db';
import { projects, epics, projectStatuses } from '../db/schema';
import { eq } from 'drizzle-orm';

export const projectController = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const results = await db.select().from(projects);
      return results;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects');
    }
  },

  // Get project by ID
  getProjectById: async (id: string) => {
    try {
      const results = await db.select().from(projects).where(eq(projects.id, id));
      if (results.length === 0) return null;
      return results[0];
    } catch (error) {
      console.error(`Error fetching project with ID ${id}:`, error);
      throw new Error('Failed to fetch project');
    }
  },

  // Create new project
  createProject: async (projectData: {
    name: string;
    description: string;
    icon?: string;
  }) => {
    try {
      const newProject = {
        name: projectData.name,
        description: projectData.description,
        status: 'active',
        icon: projectData.icon || null,
        labels: [], // PostgreSQL will automatically convert this to JSONB
      };
      
      const [result] = await db.insert(projects).values(newProject).returning();
      return result;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  },

  // Update project
  updateProject: async (
    id: string,
    projectData: Partial<{
      name: string;
      description: string;
      status: typeof projectStatuses[number];
      icon: string;
      labels: string[];
    }>
  ) => {
    try {
      const updateData = {
        ...projectData,
        labels: projectData.labels || undefined,
      };
      
      await db.update(projects).set(updateData).where(eq(projects.id, id));
      
      // Fetch and return updated project
      return await projectController.getProjectById(id);
    } catch (error) {
      console.error(`Error updating project with ID ${id}:`, error);
      throw new Error('Failed to update project');
    }
  },

  // Delete project
  deleteProject: async (id: string) => {
    try {
      await db.delete(projects).where(eq(projects.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      throw new Error('Failed to delete project');
    }
  },
  
  // Get epics by project ID
  getEpicsByProjectId: async (projectId: string) => {
    try {
      const epicsList = await db.select()
        .from(epics)
        .where(eq(epics.projectId, projectId));
        
      return epicsList;
    } catch (error) {
      console.error(`Error fetching epics for project ${projectId}:`, error);
      throw new Error('Failed to fetch epics');
    }
  },
};