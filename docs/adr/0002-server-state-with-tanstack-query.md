# ADR-0002: Server state in TanStack Query, client state in Zustand

**Status:** Accepted

## Context

Most "state" in this app is a cache of server data (projects, issues, users). Hand-rolling loading, error, retry, dedup and invalidation in a global store duplicates what a query cache does.

## Decision

- Server state: TanStack Query. Query keys live beside their queries (`projectKeys`, `issueKeys`) so invalidation targets cannot drift.
- Client state: a small Zustand store, used only for the session (user + tokens).
- Mutations that users perceive as instant (issue status) are optimistic with rollback and a final `invalidateQueries` reconciliation.
- Retries apply only to failures that can succeed on retry (network, 5xx, 429), never to 4xx.

## Alternatives considered

Redux Toolkit + RTK Query: comparable capability, more ceremony for this size. SWR: lacks first-class mutation lifecycle.

## Consequences

Little hand-written async state. Risk: stale data between related queries, handled explicitly (creating an issue invalidates the project list's open-issue count).
