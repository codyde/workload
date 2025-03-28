import { db } from '../db';
import { epics, tasks, epicStatuses, priorities } from '../db/schema';
import { eq } from 'drizzle-orm';

export const epicController = {
  // Get epic by ID
  getEpicById: async (id: string) => {
    try {
      const results = await db.select().from(epics).where(eq(epics.id, id));
      if (results.length === 0) return null;
      return results[0];
    } catch (error) {
      console.error(`Error fetching epic with ID ${id}:`, error);
      throw new Error('Failed to fetch epic');
    }
  },

  // Create new epic
  createEpic: async (epicData: {
    projectId: string;
    title: string;
    description: string;
    status?: typeof epicStatuses[number];
    priority?: typeof priorities[number];
    startDate?: Date;
    dueDate?: Date;
    labels?: string[];
  }) => {
    try {
      const newEpic = {
        projectId: epicData.projectId,
        title: epicData.title,
        description: epicData.description,
        status: epicData.status || 'planning',
        priority: epicData.priority || 'medium',
        startDate: epicData.startDate || null,
        dueDate: epicData.dueDate || null,
        progress: 0,
        labels: epicData.labels || [],
      };
      
      const [result] = await db.insert(epics).values(newEpic).returning();
      return result;
    } catch (error) {
      console.error('Error creating epic:', error);
      throw new Error('Failed to create epic');
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
      startDate: Date;
      dueDate: Date;
      progress: number;
      labels: string[];
    }>
  ) => {
    try {
      const updateData = {
        ...epicData,
        labels: epicData.labels || undefined,
      };
      
      await db.update(epics).set(updateData).where(eq(epics.id, id));
      
      // Fetch and return updated epic
      return await epicController.getEpicById(id);
    } catch (error) {
      console.error(`Error updating epic with ID ${id}:`, error);
      throw new Error('Failed to update epic');
    }
  },

  // Delete epic
  deleteEpic: async (id: string) => {
    try {
      await db.delete(epics).where(eq(epics.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting epic with ID ${id}:`, error);
      throw new Error('Failed to delete epic');
    }
  },
  
  // Get tasks by epic ID
  getTasksByEpicId: async (epicId: string) => {
    try {
      const tasksList = await db.select()
        .from(tasks)
        .where(eq(tasks.epicId, epicId));
        
      return tasksList;
    } catch (error) {
      console.error(`Error fetching tasks for epic ${epicId}:`, error);
      throw new Error('Failed to fetch tasks');
    }
  },
};