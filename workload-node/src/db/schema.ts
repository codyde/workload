import { pgTable, text, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

// Project status enum values
export const projectStatuses = ['active', 'archived', 'completed'] as const;
// Epic status enum values
export const epicStatuses = ['planning', 'in-progress', 'blocked', 'completed'] as const;
// Task status enum values
export const taskStatuses = ['todo', 'in-progress', 'blocked', 'in-review', 'done'] as const;
// Priority enum values
export const priorities = ['urgent', 'high', 'medium', 'low'] as const;

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  icon: text('icon'),
  labels: jsonb('labels').default('[]'),
});

// Project configurations
export const configs = pgTable('configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
});

// Epics table
export const epics = pgTable('epics', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('planning'),
  priority: text('priority').notNull().default('medium'),
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date'),
  progress: integer('progress').notNull().default(0),
  labels: jsonb('labels').default('[]'),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  epicId: uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  estimate: integer('estimate'), // Story points or time estimate
  labels: jsonb('labels').default('[]'),
  parentTaskId: uuid('parent_task_id'), // Will reference tasks.id, but we handle this at the application level
  dependencies: jsonb('dependencies').default('[]'),
});

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  reactions: jsonb('reactions').default('[]'),
});