import { db } from "../db";
import { tasks, taskStatuses, priorities } from "../db/schema";
import { eq } from "drizzle-orm";

interface Task {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  estimate: number | null;
  labels: string[];
  parentTaskId: string | null;
  dependencies: string[];
}

export const taskController = {
  // Get all tasks
  getAllTasks: async () => {
    try {
      const results = await db.select().from(tasks);
      return results;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw new Error("Failed to fetch tasks");
    }
  },

  // Get all tasks for an epic
  getTasksByEpicId: async (epicId: string) => {
    try {
      const results = await db.select().from(tasks).where(eq(tasks.epicId, epicId));
      return results;
    } catch (error) {
      console.error(`Error fetching tasks for epic ${epicId}:`, error);
      throw new Error("Failed to fetch tasks");
    }
  },

  // Get tasks by parent task ID (subtasks)
  getSubtasks: async (parentTaskId: string) => {
    try {
      const results = await db.select().from(tasks).where(eq(tasks.parentTaskId, parentTaskId));
      return results;
    } catch (error) {
      console.error(`Error fetching subtasks for task ${parentTaskId}:`, error);
      throw new Error("Failed to fetch subtasks");
    }
  },

  // Get task by ID
  getTaskById: async (id: string): Promise<Task | null> => {
    try {
      const results = await db.select().from(tasks).where(eq(tasks.id, id));
      if (results.length === 0) return null;
      return results[0] as Task;
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      throw new Error("Failed to fetch task");
    }
  },

  // Create new task
  createTask: async (taskData: {
    epicId: string;
    title: string;
    description: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: Date;
    estimate?: number;
    labels?: string[];
    parentTaskId?: string;
    dependencies?: string[];
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
        dependencies: taskData.dependencies || [],
      };
      
      const [result] = await db.insert(tasks).values(newTask).returning();
      return result as Task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw new Error("Failed to create task");
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
      assigneeId: string | null;
      dueDate: Date | null;
      estimate: number | null;
      labels: string[];
      dependencies: string[];
    }>
  ) => {
    try {
      // For PostgreSQL, we don't need to manually set updatedAt as it's handled by defaultNow()
      const updateData = {
        ...taskData,
        labels: taskData.labels || undefined,
        dependencies: taskData.dependencies || undefined,
      };
      
      await db.update(tasks).set(updateData).where(eq(tasks.id, id));
      
      // Fetch and return updated task
      return await taskController.getTaskById(id);
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      throw new Error("Failed to update task");
    }
  },

  // Add dependency between tasks
  addDependency: async (taskId: string, dependsOnTaskId: string) => {
    try {
      const task = await taskController.getTaskById(taskId);
      if (!task) throw new Error("Task not found");
      
      if (!task.dependencies.includes(dependsOnTaskId)) {
        const newDependencies = [...task.dependencies, dependsOnTaskId];
        await taskController.updateTask(taskId, { dependencies: newDependencies });
      }
      
      return await taskController.getTaskById(taskId);
    } catch (error) {
      console.error(`Error adding dependency between tasks ${taskId} and ${dependsOnTaskId}:`, error);
      throw new Error("Failed to add dependency");
    }
  },

  // Remove dependency between tasks
  removeDependency: async (taskId: string, dependsOnTaskId: string) => {
    try {
      const task = await taskController.getTaskById(taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedDependencies = task.dependencies.filter(depId => depId !== dependsOnTaskId);
      await taskController.updateTask(taskId, { dependencies: updatedDependencies });
      
      return await taskController.getTaskById(taskId);
    } catch (error) {
      console.error(`Error removing dependency between tasks ${taskId} and ${dependsOnTaskId}:`, error);
      throw new Error("Failed to remove dependency");
    }
  },

  // Delete task
  deleteTask: async (id: string) => {
    try {
      await db.delete(tasks).where(eq(tasks.id, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      throw new Error("Failed to delete task");
    }
  },
}; 