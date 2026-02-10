import { beforeAll, afterAll } from "bun:test";
import { startServer, stopServer } from "./server";
import { waitForServer } from "./client";

if (!process.env.API_URL) {
  beforeAll(async () => {
    await startServer(3000);
    await waitForServer("http://localhost:3000");
  });

  afterAll(async () => {
    await stopServer();
  });
}
