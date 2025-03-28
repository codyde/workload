import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  epicId: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
}

interface TaskState {
  epics: Epic[];
  tasks: Task[];
  selectedEpicId: string | null;
  addEpic: (epic: Omit<Epic, 'id'>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  setSelectedEpic: (epicId: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  epics: [],
  tasks: [],
  selectedEpicId: null,
  addEpic: (epic) =>
    set((state) => ({
      epics: [...state.epics, { ...epic, id: crypto.randomUUID() }],
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: crypto.randomUUID() }],
    })),
  setSelectedEpic: (epicId) => set({ selectedEpicId: epicId }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),
}));