import { ZodError } from "zod";
import { OPERATIONS, getIdempotencyStore } from "./operations";

interface CallRequest {
  op: string;
  args: Record<string, unknown>;
  ctx?: {
    requestId?: string;
    sessionId?: string;
    idempotencyKey?: string;
    [key: string]: unknown;
  };
}

interface CallResponse {
  requestId: string;
  sessionId?: string;
  state: "complete" | "error";
  result?: unknown;
  error?: { code: string; message: string };
}

export function handleCall(envelope: CallRequest): {
  status: number;
  body: CallResponse;
} {
  const requestId = envelope.ctx?.requestId || crypto.randomUUID();
  const sessionId = envelope.ctx?.sessionId;

  const base: Pick<CallResponse, "requestId" | "sessionId"> = { requestId };
  if (sessionId) base.sessionId = sessionId;

  // Validate op is present and a string
  if (!envelope.op || typeof envelope.op !== "string") {
    return {
      status: 400,
      body: {
        ...base,
        state: "error",
        error: {
          code: "INVALID_REQUEST",
          message: "Missing or invalid 'op' field",
        },
      },
    };
  }

  // Look up operation
  const operation = OPERATIONS[envelope.op];
  if (!operation) {
    return {
      status: 400,
      body: {
        ...base,
        state: "error",
        error: {
          code: "UNKNOWN_OP",
          message: `Unknown operation: ${envelope.op}`,
        },
      },
    };
  }

  // Check idempotency store for side-effecting ops
  const idempotencyKey = envelope.ctx?.idempotencyKey;
  if (operation.sideEffecting && idempotencyKey) {
    const store = getIdempotencyStore();
    const cached = store.get(idempotencyKey);
    if (cached) {
      return cached as { status: number; body: CallResponse };
    }
  }

  // Execute handler
  try {
    const result = operation.handler(envelope.args || {});

    let response: { status: number; body: CallResponse };

    if (result.ok) {
      response = {
        status: 200,
        body: { ...base, state: "complete", result: result.result },
      };
    } else {
      // Domain error — HTTP 200
      response = {
        status: 200,
        body: { ...base, state: "error", error: result.error },
      };
    }

    // Store for idempotency
    if (operation.sideEffecting && idempotencyKey) {
      getIdempotencyStore().set(idempotencyKey, response);
    }

    return response;
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        status: 400,
        body: {
          ...base,
          state: "error",
          error: {
            code: "VALIDATION_ERROR",
            message: err.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join("; "),
          },
        },
      };
    }

    // Unexpected error
    return {
      status: 500,
      body: {
        ...base,
        state: "error",
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      },
    };
  }
}
