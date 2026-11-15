# ADR-0004: MSW as the single mock API for dev, tests and E2E

**Status:** Accepted

## Decision

One set of request handlers (`src/mocks/handlers.ts`) serves the browser in dev/E2E (service worker) and Node in Vitest. Tests use the real `fetch` client, real React Query and the real router.

## Consequences

- Integration tests exercise the same network path as the app, including 401 refresh and error mapping, instead of mocking modules.
- The contract is encoded once. Responses are also validated by Zod in the client, so handler drift fails loudly.
- Limitation: the mock DB is in memory and resets on page reload; refresh tokens are self-describing so sessions still survive reloads. It models client-visible behaviour only, not server security.
