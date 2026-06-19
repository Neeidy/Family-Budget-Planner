# Development Notes

Scratchpad for short-term ideas and observations. Not intended to ship.

## Performance

- Profile chart rendering on slow phones
- Watch main bundle size (currently ~1.25 MB pre-gzip)
- Candidate routes for dynamic import: archive view, reports view

## Code organization

- Consider splitting BudgetContext by concern
- familyBudget router is getting long; could shard by sub-domain

## Testing

- Add integration test for rollover edge cases
- Expand demo-mode mutation guard tests

## UI polish

- Audit empty states across all pages
- Verify TR/EN/DE parity on the new archive screen
- Review safe-area padding on iOS PWA install

## Ops

- Document the launchctl restart procedure in README
- No alerting on prod 5xx rate; consider a simple uptime probe
- Verify mysqldump cron is still running on the host

## Housekeeping

- Prune old archive snapshots > 24 months
- Schedule a quarterly dep refresh + lockfile review

_Reminder: nothing in this file is a commitment — wipe when stale._

<!-- last reviewed: see git log -->

---
