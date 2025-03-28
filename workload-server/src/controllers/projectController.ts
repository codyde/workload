import { db } from "../db";
import { projects, projectStatuses } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const projectController = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const results = await db.select().from(projects);
      return results; // No need to parse JSON fields as they are already JSONB
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw new Error("Failed to fetch projects");
    }
  },

  // Get project by ID
  getProjectById: async (id: string) => {
    try {
      const results = await db.select().from(projects).where(eq(projects.id, id));
      if (results.length === 0) return null;
      return results[0]; // No need to parse JSON fields as they are already JSONB
    } catch (error) {
      console.error(`Error fetching project with ID ${id}:`, error);
      throw new Error("Failed to fetch project");
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
        status: "active",
        icon: projectData.icon || null,
        labels: [], // PostgreSQL will automatically convert this to JSONB
      };
      
      const [result] = await db.insert(projects).values(newProject).returning();
      return result;
    } catch (error) {
      console.error("Error creating project:", error);
      throw new Error("Failed to create project");
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
      // For PostgreSQL, we don't need to manually set updatedAt as it's handled by defaultNow()
      const updateData = {
        ...projectData,
        labels: projectData.labels || undefined,
      };
      
      await db.update(projects).set(updateData).where(eq(projects.id, id));
      
      // Fetch and return updated project
      return await projectController.getProjectById(id);
    } catch (error) {
      console.error(`Error updating project with ID ${id}:`, error);
      throw new Error("Failed to update project");
    }
  },

  // Delete project
  deleteProject: async (id: string) => {
    try {
      await db.delete(projects).where(eq(projects.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      throw new Error("Failed to delete project");
    }
  },
}; 