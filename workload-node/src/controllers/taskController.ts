import { db } from '../db';
import { tasks, taskStatuses, priorities } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const taskController = {
  // Get task by ID
  getTaskById: async (id: string) => {
    try {
      const results = await db.select().from(tasks).where(eq(tasks.id, id));
      if (results.length === 0) return null;
      return results[0];
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      throw new Error('Failed to fetch task');
    }
  },

  // Create new task
  createTask: async (taskData: {
    epicId: string;
    title: string;
    description: string;
    status?: typeof taskStatuses[number];
    priority?: typeof priorities[number];
    assigneeId?: string;
    dueDate?: Date;
    estimate?: number;
    labels?: string[];
    parentTaskId?: string;
  }) => {
    try {
      const newTask = {
        epicId: taskData.epicId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        assigneeId: taskData.assigneeId || null,
        dueDate: taskData.dueDate || null,
        estimate: taskData.estimate || null,
        labels: taskData.labels || [],
        parentTaskId: taskData.parentTaskId || null,
        dependencies: [],
      };
      
      const [result] = await db.insert(tasks).values(newTask).returning();
      return result;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  },

  // Update task
  updateTask: async (
    id: string,
    taskData: Partial<{
      title: string;
      description: string;
      status: typeof taskStatuses[number];
      priority: typeof priorities[number];
      assigneeId: string;
      dueDate: Date;
      estimate: number;
      labels: string[];
      parentTaskId: string;
    }>
  ) => {
    try {
      const updateData = {
        ...taskData,
        labels: taskData.labels || undefined,
      };
      
      await db.update(tasks).set(updateData).where(eq(tasks.id, id));
      
      // Fetch and return updated task
      return await taskController.getTaskById(id);
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      throw new Error('Failed to update task');
    }
  },

  // Delete task
  deleteTask: async (id: string) => {
    try {
      await db.delete(tasks).where(eq(tasks.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      throw new Error('Failed to delete task');
    }
  },
  
  // Get subtasks
  getSubtasks: async (taskId: string) => {
    try {
      const subtasks = await db.select()
        .from(tasks)
        .where(eq(tasks.parentTaskId, taskId));
        
      return subtasks;
    } catch (error) {
      console.error(`Error fetching subtasks for task ${taskId}:`, error);
      throw new Error('Failed to fetch subtasks');
    }
  },
  
  // Get task dependencies
  // Add dependency
  addDependency: async (taskId: string, dependsOnTaskId: string) => {
    try {
      // First get the current dependencies
      const task = await taskController.getTaskById(taskId);
      if (!task) throw new Error('Task not found');
      
      // Get current dependencies and check if this one already exists
      const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
      if (!dependencies.includes(dependsOnTaskId)) {
        dependencies.push(dependsOnTaskId);
      }
      
      // Update the task
      await db.update(tasks)
        .set({ dependencies })
        .where(eq(tasks.id, taskId));
      
      return { success: true };
    } catch (error) {
      console.error(`Error adding dependency ${dependsOnTaskId} to task ${taskId}:`, error);
      throw new Error('Failed to add dependency');
    }
  },
  
  // Remove dependency
  removeDependency: async (taskId: string, dependsOnTaskId: string) => {
    try {
      // First get the current dependencies
      const task = await taskController.getTaskById(taskId);
      if (!task) throw new Error('Task not found');
      
      // Get current dependencies and filter out the one to remove
      const dependencies = Array.isArray(task.dependencies) 
        ? task.dependencies.filter(id => id !== dependsOnTaskId)
        : [];
      
      // Update the task
      await db.update(tasks)
        .set({ dependencies })
        .where(eq(tasks.id, taskId));
      
      return { success: true };
    } catch (error) {
      console.error(`Error removing dependency ${dependsOnTaskId} from task ${taskId}:`, error);
      throw new Error('Failed to remove dependency');
    }
  },
};