import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CreateTodoArgsSchema,
  GetTodoArgsSchema,
  ListTodosArgsSchema,
  UpdateTodoArgsSchema,
  DeleteTodoArgsSchema,
  CompleteTodoArgsSchema,
  TodoSchema,
  ListTodosResultSchema,
  DeleteTodoResultSchema,
} from "./schemas";

function toJsonSchema(zodSchema: Parameters<typeof zodToJsonSchema>[0]) {
  const schema = zodToJsonSchema(zodSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

export interface RegistryOperation {
  op: string;
  description: string;
  argsSchema: Record<string, unknown>;
  resultSchema: Record<string, unknown>;
  sideEffecting: boolean;
  idempotencyRequired: boolean;
  executionModel: string;
  authScopes: string[];
}

export interface Registry {
  callVersion: string;
  operations: RegistryOperation[];
}

export function buildRegistry(): Registry {
  return {
    callVersion: "2026-02-10",
    operations: [
      {
        op: "v1:todos.create",
        description: "Create a new todo item",
        argsSchema: toJsonSchema(CreateTodoArgsSchema),
        resultSchema: toJsonSchema(TodoSchema),
        sideEffecting: true,
        idempotencyRequired: true,
        executionModel: "sync",
        authScopes: [],
      },
      {
        op: "v1:todos.get",
        description: "Get a todo item by ID",
        argsSchema: toJsonSchema(GetTodoArgsSchema),
        resultSchema: toJsonSchema(TodoSchema),
        sideEffecting: false,
        idempotencyRequired: false,
        executionModel: "sync",
        authScopes: [],
      },
      {
        op: "v1:todos.list",
        description: "List todo items with optional filters and pagination",
        argsSchema: toJsonSchema(ListTodosArgsSchema),
        resultSchema: toJsonSchema(ListTodosResultSchema),
        sideEffecting: false,
        idempotencyRequired: false,
        executionModel: "sync",
        authScopes: [],
      },
      {
        op: "v1:todos.update",
        description: "Update a todo item",
        argsSchema: toJsonSchema(UpdateTodoArgsSchema),
        resultSchema: toJsonSchema(TodoSchema),
        sideEffecting: true,
        idempotencyRequired: true,
        executionModel: "sync",
        authScopes: [],
      },
      {
        op: "v1:todos.delete",
        description: "Delete a todo item",
        argsSchema: toJsonSchema(DeleteTodoArgsSchema),
        resultSchema: toJsonSchema(DeleteTodoResultSchema),
        sideEffecting: true,
        idempotencyRequired: true,
        executionModel: "sync",
        authScopes: [],
      },
      {
        op: "v1:todos.complete",
        description: "Mark a todo item as complete",
        argsSchema: toJsonSchema(CompleteTodoArgsSchema),
        resultSchema: toJsonSchema(TodoSchema),
        sideEffecting: true,
        idempotencyRequired: true,
        executionModel: "sync",
        authScopes: [],
      },
    ],
  };
}
