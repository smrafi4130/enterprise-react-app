# ADR-0003: Token storage and refresh

**Status:** Accepted for this reference app; **not** the recommended production setup.

## Decision

- Access token: memory only.
- Refresh token: `sessionStorage`, so a reload restores the session without re-login.
- 401 handling: one single-flight refresh shared by concurrent requests, then one retry. `/auth/*` endpoints never trigger a refresh. Failure clears the session.

## Why

Keeping the short-lived credential out of persistent storage limits what XSS can steal. Single-flight matters because refresh tokens rotate: two parallel refreshes would invalidate each other.

## Limitation

Any script on the page can still read `sessionStorage`. In production the refresh token should be an `httpOnly; Secure; SameSite` cookie issued by the backend, with CSRF protection on the refresh endpoint. This repo has no real backend (MSW), so that option is documented rather than built.
