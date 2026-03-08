import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const mission = sqliteTable('mission', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const objectives = sqliteTable('objectives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  missionId: integer('mission_id').references(() => mission.id),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  objectiveId: integer('objective_id').references(() => objectives.id),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  status: text('status').notNull().default('active'),
  progress: real('progress').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planId: integer('plan_id').references(() => plans.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  sortOrder: integer('sort_order').default(0),
  deadline: text('deadline'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  path: text('path'),
  description: text('description'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projectLinks = sqliteTable('project_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  linkableType: text('linkable_type').notNull(),
  linkableId: integer('linkable_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const ideas = sqliteTable('ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  promotedToTaskId: integer('promoted_to_task_id').references(() => tasks.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});
