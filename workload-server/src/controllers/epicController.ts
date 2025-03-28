import { db } from "../db";
import { epics, epicStatuses, priorities } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const epicController = {
  // Get all epics for a project
  getEpicsByProjectId: async (projectId: string) => {
    try {
      const results = await db.select().from(epics).where(eq(epics.projectId, projectId));
      
      // Parse JSON fields
      return results.map(epic => ({
        ...epic,
        labels: epic.labels ? JSON.parse(epic.labels) : [],
      }));
    } catch (error) {
      console.error(`Error fetching epics for project ${projectId}:`, error);
      throw new Error("Failed to fetch epics");
    }
  },

  // Get epic by ID
  getEpicById: async (id: string) => {
    try {
      const results = await db.select().from(epics).where(eq(epics.id, id));
      if (results.length === 0) return null;
      
      // Parse JSON fields
      const epic = results[0];
      return {
        ...epic,
        labels: epic.labels ? JSON.parse(epic.labels) : [],
      };
    } catch (error) {
      console.error(`Error fetching epic with ID ${id}:`, error);
      throw new Error("Failed to fetch epic");
    }
  },

  // Create new epic
  createEpic: async (epicData: {
    projectId: string;
    title: string;
    description: string;
    startDate?: Date;
    dueDate?: Date;
  }) => {
    try {
      const id = uuidv4();
      
      // Convert dates to Unix timestamps if provided
      const startTimestamp = epicData.startDate ? Math.floor(epicData.startDate.getTime() / 1000) : null;
      const dueTimestamp = epicData.dueDate ? Math.floor(epicData.dueDate.getTime() / 1000) : null;
      
      const newEpic = {
        id,
        projectId: epicData.projectId,
        title: epicData.title,
        description: epicData.description,
        status: "planning",
        priority: "medium",
        startDate: startTimestamp,
        dueDate: dueTimestamp,
        progress: 0,
        labels: JSON.stringify([]),
      };
      
      await db.insert(epics).values(newEpic);
      
      return {
        ...newEpic,
        labels: [],
      };
    } catch (error) {
      console.error("Error creating epic:", error);
      throw new Error("Failed to create epic");
    }
  },

  // Update epic
  updateEpic: async (
    id: string,
    epicData: Partial<{
      title: string;
      description: string;
      status: typeof epicStatuses[number];
      priority: typeof priorities[number];
      startDate: Date | null;
      dueDate: Date | null;
      progress: number;
      labels: string[];
    }>
  ) => {
    try {
      // Convert dates to Unix timestamps if provided
      const updateData: any = { ...epicData };
      
      if (epicData.startDate !== undefined) {
        updateData.startDate = epicData.startDate ? Math.floor(epicData.startDate.getTime() / 1000) : null;
      }
      
      if (epicData.dueDate !== undefined) {
        updateData.dueDate = epicData.dueDate ? Math.floor(epicData.dueDate.getTime() / 1000) : null;
      }
      
      // Handle labels
      if (epicData.labels) {
        updateData.labels = JSON.stringify(epicData.labels);
      }
      
      await db.update(epics).set(updateData).where(eq(epics.id, id));
      
      // Fetch and return updated epic
      return await epicController.getEpicById(id);
    } catch (error) {
      console.error(`Error updating epic with ID ${id}:`, error);
      throw new Error("Failed to update epic");
    }
  },

  // Delete epic
  deleteEpic: async (id: string) => {
    try {
      await db.delete(epics).where(eq(epics.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting epic with ID ${id}:`, error);
      throw new Error("Failed to delete epic");
    }
  },
}; 