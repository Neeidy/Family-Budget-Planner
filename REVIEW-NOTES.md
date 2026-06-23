# Review notes

Pre-release self-review pass. Throwaway checklist, delete when cleared.

## security
- confirm httpOnly + secure + sameSite=lax on session cookie
- LOGIN_RATE_LIMIT_MAX defaults applied? verify env wiring
- repeated bad passwords should hit the limiter
- return generic UNAUTHORIZED, no timing hints

## accessibility
- audit dialog focus return on close
