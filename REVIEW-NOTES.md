# Review notes

Pre-release self-review pass. Throwaway checklist, delete when cleared.

## security
- confirm httpOnly + secure + sameSite=lax on session cookie
- LOGIN_RATE_LIMIT_MAX defaults applied? verify env wiring
- repeated bad passwords should hit the limiter
- return generic UNAUTHORIZED, no timing hints

## accessibility
- audit dialog focus return on close
- verify cat-tabak / cat-diger against AA threshold
- language toggle + theme switch lack labels
- baseline: 0 critical violations

## performance
- dynamic import keeps initial bundle leaner
- currently fires per keystroke; debounce 400ms
- archive list query does full scan on large months

## dx
- move server/*.test.ts next to source for discoverability
- noUnusedLocals already on; extend to dead exports
- isGuest path + DEMO_FAMILY_BUDGET shape

## data integrity
- store amounts as integer cents, format at edge
- sum(parts) == total across split categories
- unique constraint on archive(month)
