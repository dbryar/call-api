export const API_URL = process.env.API_URL || "http://localhost:3000"

export interface CallResponse {
  requestId: string
  sessionId?: string
  state: "complete" | "error"
  result?: unknown
  error?: { code: string; message: string }
}

export async function call(op: string, args: Record<string, unknown> = {}, ctx: Record<string, unknown> = {}): Promise<{ status: number; body: CallResponse }> {
  const res = await fetch(`${API_URL}/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, args, ctx }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

export interface RegistryResponse {
  callVersion: string
  operations: Array<{
    op: string
    argsSchema: Record<string, unknown>
    resultSchema: Record<string, unknown>
    sideEffecting: boolean
    idempotencyRequired: boolean
    executionModel: string
    description?: string
    authScopes?: string[]
  }>
}

export async function getRegistry(): Promise<{
  status: number
  body: RegistryResponse
  headers: Headers
}> {
  const res = await fetch(`${API_URL}/.well-known/ops`)
  const body = await res.json()
  return { status: res.status, body, headers: res.headers }
}

export async function waitForServer(url = API_URL, timeoutMs = 5000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/.well-known/ops`)
      if (res.ok) return
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 495))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}
