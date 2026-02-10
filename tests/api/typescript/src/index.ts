import { buildRegistry } from "./registry";
import { handleCall } from "./router";
import { resetStorage } from "./operations";

export function createServer(port: number = 3000) {
  resetStorage();

  const registry = buildRegistry();
  const registryJson = JSON.stringify(registry);
  const registryEtag = `"${Bun.hash(registryJson).toString(16)}"`;

  return Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);

      // GET /.well-known/ops — registry
      if (req.method === "GET" && url.pathname === "/.well-known/ops") {
        const ifNoneMatch = req.headers.get("if-none-match");
        if (ifNoneMatch === registryEtag) {
          return new Response(null, { status: 304 });
        }
        return new Response(registryJson, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ETag: registryEtag,
          },
        });
      }

      // POST /call — operation invocation
      if (req.method === "POST" && url.pathname === "/call") {
        return (async () => {
          let envelope: unknown;
          try {
            envelope = await req.json();
          } catch {
            return Response.json(
              {
                requestId: crypto.randomUUID(),
                state: "error",
                error: {
                  code: "INVALID_REQUEST",
                  message: "Invalid JSON in request body",
                },
              },
              { status: 400 }
            );
          }

          const { status, body } = handleCall(
            envelope as Parameters<typeof handleCall>[0]
          );
          return Response.json(body, { status });
        })();
      }

      // Everything else — 404
      return Response.json(
        {
          requestId: crypto.randomUUID(),
          state: "error",
          error: { code: "NOT_FOUND", message: "Not found" },
        },
        { status: 404 }
      );
    },
  });
}

// Start server when run directly
if (import.meta.main) {
  const port = parseInt(process.env.PORT || "3000", 10);
  const server = createServer(port);
  console.log(`OpenCALL Todo API listening on http://localhost:${server.port}`);
}
