import {
  CreateTodoArgsSchema,
  GetTodoArgsSchema,
  ListTodosArgsSchema,
  UpdateTodoArgsSchema,
  DeleteTodoArgsSchema,
  CompleteTodoArgsSchema,
  type Todo,
} from "./schemas";

type HandlerResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: string; message: string } };

// In-memory storage
let todos = new Map<string, Todo>();
let idempotencyStore = new Map<string, unknown>();

export function resetStorage() {
  todos = new Map();
  idempotencyStore = new Map();
}

export function getIdempotencyStore() {
  return idempotencyStore;
}

function todosCreate(args: unknown): HandlerResult {
  const parsed = CreateTodoArgsSchema.parse(args);
  const now = new Date().toISOString();
  const todo: Todo = {
    id: crypto.randomUUID(),
    title: parsed.title,
    description: parsed.description,
    dueDate: parsed.dueDate,
    labels: parsed.labels,
    completed: false,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  todos.set(todo.id, todo);
  return { ok: true, result: todo };
}

function todosGet(args: unknown): HandlerResult {
  const { id } = GetTodoArgsSchema.parse(args);
  const todo = todos.get(id);
  if (!todo) {
    return {
      ok: false,
      error: { code: "TODO_NOT_FOUND", message: `Todo with id '${id}' not found` },
    };
  }
  return { ok: true, result: todo };
}

function todosList(args: unknown): HandlerResult {
  const { cursor, limit, completed, label } = ListTodosArgsSchema.parse(args);

  let items = Array.from(todos.values());

  // Apply filters
  if (completed !== undefined) {
    items = items.filter((t) => t.completed === completed);
  }
  if (label !== undefined) {
    items = items.filter((t) => t.labels?.includes(label));
  }

  const total = items.length;

  // Apply cursor pagination
  let startIndex = 0;
  if (cursor) {
    try {
      startIndex = parseInt(atob(cursor), 10);
    } catch {
      startIndex = 0;
    }
  }

  const paged = items.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const nextCursor = nextIndex < total ? btoa(String(nextIndex)) : null;

  return {
    ok: true,
    result: { items: paged, cursor: nextCursor, total },
  };
}

function todosUpdate(args: unknown): HandlerResult {
  const { id, ...updates } = UpdateTodoArgsSchema.parse(args);
  const todo = todos.get(id);
  if (!todo) {
    return {
      ok: false,
      error: { code: "TODO_NOT_FOUND", message: `Todo with id '${id}' not found` },
    };
  }

  const updated: Todo = {
    ...todo,
    ...Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    ),
    updatedAt: new Date().toISOString(),
  };
  todos.set(id, updated);
  return { ok: true, result: updated };
}

function todosDelete(args: unknown): HandlerResult {
  const { id } = DeleteTodoArgsSchema.parse(args);
  const todo = todos.get(id);
  if (!todo) {
    return {
      ok: false,
      error: { code: "TODO_NOT_FOUND", message: `Todo with id '${id}' not found` },
    };
  }
  todos.delete(id);
  return { ok: true, result: { deleted: true } };
}

function todosComplete(args: unknown): HandlerResult {
  const { id } = CompleteTodoArgsSchema.parse(args);
  const todo = todos.get(id);
  if (!todo) {
    return {
      ok: false,
      error: { code: "TODO_NOT_FOUND", message: `Todo with id '${id}' not found` },
    };
  }

  if (!todo.completed) {
    const now = new Date().toISOString();
    todo.completed = true;
    todo.completedAt = now;
    todo.updatedAt = now;
    todos.set(id, todo);
  }

  return { ok: true, result: todo };
}

export interface OperationEntry {
  handler: (args: unknown) => HandlerResult;
  sideEffecting: boolean;
}

export const OPERATIONS: Record<string, OperationEntry> = {
  "v1:todos.create": { handler: todosCreate, sideEffecting: true },
  "v1:todos.get": { handler: todosGet, sideEffecting: false },
  "v1:todos.list": { handler: todosList, sideEffecting: false },
  "v1:todos.update": { handler: todosUpdate, sideEffecting: true },
  "v1:todos.delete": { handler: todosDelete, sideEffecting: true },
  "v1:todos.complete": { handler: todosComplete, sideEffecting: true },
};
