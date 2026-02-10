import { z } from "zod";

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  completed: z.boolean(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Todo = z.infer<typeof TodoSchema>;

// Operation argument schemas

export const CreateTodoArgsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const GetTodoArgsSchema = z.object({
  id: z.string(),
});

export const ListTodosArgsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  completed: z.boolean().optional(),
  label: z.string().optional(),
});

export const UpdateTodoArgsSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  completed: z.boolean().optional(),
});

export const DeleteTodoArgsSchema = z.object({
  id: z.string(),
});

export const CompleteTodoArgsSchema = z.object({
  id: z.string(),
});

// Result schemas

export const ListTodosResultSchema = z.object({
  items: z.array(TodoSchema),
  cursor: z.string().nullable(),
  total: z.number().int(),
});

export const DeleteTodoResultSchema = z.object({
  deleted: z.boolean(),
});
