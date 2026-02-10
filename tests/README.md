# OpenCALL Example APIs & Test Suite

Language-agnostic test suite for validating OpenCALL API implementations, plus reference implementations in multiple languages.

## Quick Start

```bash
# Install test deps and run tests against the TypeScript API (in-process)
bun install && bun test
```

## How It Works

The test suite communicates with any OpenCALL-compliant API via HTTP. By default, it starts the TypeScript API in-process for fast TDD cycles. Set `API_URL` to test against any running server.

### In-Process Testing (default)

Tests import the TypeScript API's `createServer()` function, start it in `beforeAll`, and stop it in `afterAll`. No external process needed.

### External Server Testing

```bash
# Start any OpenCALL-compliant server, then:
API_URL=http://localhost:3000 bun test
```

### Docker Testing

```bash
docker compose -f docker/docker-compose.yml up --build -d
API_URL=http://localhost:3000 bun test
```

## Folder Structure

```
tests/
├── package.json              # Test deps only
├── bunfig.toml               # Preloads server lifecycle
├── helpers/                  # Shared test infrastructure
│   ├── client.ts             # HTTP client (call, getRegistry)
│   ├── fixtures.ts           # Todo factories
│   ├── server.ts             # Start/stop server
│   └── setup.ts              # beforeAll/afterAll lifecycle
├── self-description.test.ts  # Registry endpoint tests
├── envelope.test.ts          # Response envelope tests
├── crud.test.ts              # CRUD operation tests
├── errors.test.ts            # Error handling tests
├── idempotency.test.ts       # Idempotency key tests
├── specs/                    # Kiro-format specifications
├── api/
│   └── typescript/           # Reference TypeScript implementation
│       ├── package.json
│       └── src/
│           ├── index.ts      # Server entry point + createServer()
│           ├── schemas.ts    # Zod schemas (single source of truth)
│           ├── operations.ts # Handler functions + in-memory store
│           ├── registry.ts   # /.well-known/ops builder
│           └── router.ts     # POST /call dispatcher
└── docker/
    ├── docker-compose.yml
    └── .env.example
```

## Adding a New Language Implementation

1. Create `api/<language>/` with the API implementation
2. The API must implement:
   - `GET /.well-known/ops` — return the operation registry
   - `POST /call` — accept the OpenCALL envelope and dispatch operations
3. Start the server and run: `API_URL=http://localhost:<port> bun test`
4. All tests should pass — the same contract applies to every implementation

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3000` | URL of the API server to test against |
| `PORT` | `3000` | Port for the API server (used by Docker and direct run) |
