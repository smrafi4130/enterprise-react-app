# ADR-0001: Feature-based structure with enforced public APIs

**Status:** Accepted

## Context

Layer-based folders (`components/`, `hooks/`, `api/`) scale poorly: a change to one feature touches five directories, and anything can import anything.

## Decision

Code is organised by feature (`features/auth|projects|issues|users`) plus `shared/` (no domain knowledge) and `app/` (composition root).
Each feature exposes a public API through `index.ts`. ESLint `no-restricted-imports` fails the build on deep imports (`@/features/x/internal`) and on features or shared code importing from `app/`.

## Consequences

- Features can be deleted, moved or lazy-loaded as a unit.
- Dependencies point one way: `app → features → shared`.
- Cost: a small amount of re-export boilerplate. Cross-feature needs (e.g. `users` reusing `userSchema`) must be promoted to the owner's public API, which makes the coupling visible. That happened once during development and the lint rule caught it.
