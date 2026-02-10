import { describe, expect, test } from "bun:test";
import { getRegistry } from "./helpers/client";

describe("Self-Description (REQ-SELF)", () => {
  test("GET /.well-known/ops returns 200 with application/json", async () => {
    const { status, headers } = await getRegistry();
    expect(status).toBe(200);
    expect(headers.get("content-type")).toContain("application/json");
  });

  test("callVersion is a YYYY-MM-DD date string", async () => {
    const { body } = await getRegistry();
    expect(body.callVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("registry includes all six todo operations", async () => {
    const { body } = await getRegistry();
    const opNames = body.operations.map((o) => o.op);
    expect(opNames).toContain("v1:todos.create");
    expect(opNames).toContain("v1:todos.get");
    expect(opNames).toContain("v1:todos.list");
    expect(opNames).toContain("v1:todos.update");
    expect(opNames).toContain("v1:todos.delete");
    expect(opNames).toContain("v1:todos.complete");
  });

  test("each operation has required registry fields", async () => {
    const { body } = await getRegistry();
    for (const op of body.operations) {
      expect(op).toHaveProperty("op");
      expect(op).toHaveProperty("argsSchema");
      expect(op).toHaveProperty("resultSchema");
      expect(op).toHaveProperty("sideEffecting");
      expect(op).toHaveProperty("executionModel");
    }
  });

  test("argsSchema is JSON Schema with type object and properties", async () => {
    const { body } = await getRegistry();
    for (const op of body.operations) {
      const schema = op.argsSchema as Record<string, unknown>;
      expect(schema.type).toBe("object");
      expect(schema).toHaveProperty("properties");
    }
  });

  test("side-effecting operations declare idempotencyRequired", async () => {
    const { body } = await getRegistry();
    const sideEffecting = body.operations.filter((o) => o.sideEffecting);
    expect(sideEffecting.length).toBeGreaterThan(0);
    for (const op of sideEffecting) {
      expect(op.idempotencyRequired).toBe(true);
    }
  });

  test("v1:todos.create argsSchema requires title", async () => {
    const { body } = await getRegistry();
    const create = body.operations.find((o) => o.op === "v1:todos.create");
    expect(create).toBeDefined();
    const schema = create!.argsSchema as { required?: string[] };
    expect(schema.required).toContain("title");
  });

  test("all operations use sync execution model", async () => {
    const { body } = await getRegistry();
    for (const op of body.operations) {
      expect(op.executionModel).toBe("sync");
    }
  });

  test("response includes caching headers", async () => {
    const { headers } = await getRegistry();
    expect(headers.get("cache-control")).toBeTruthy();
    expect(headers.get("etag")).toBeTruthy();
  });
});
