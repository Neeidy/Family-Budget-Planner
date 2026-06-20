# Roadmap 2026 — draft

Working draft of quarterly priorities. Not a commitment, revisit each month.

## Q1 — stability

- Reduce p95 API latency on archive view
- Verify TR/EN/DE wording parity on all dialogs
- Smoother iOS install hint after second visit

## Q2 — reporting

- Per-owner monthly summary export (PDF)
- Category breakdown: show top-5 + collapse rest
- Goal progress widget on dashboard

## Q3 — mobile

- Touch-target audit on small viewports
- Queue mutations while offline, replay on reconnect
- iOS PWA shortcut for quick-add expense

## Q4 — hardening

- Backup/restore drill with mysqldump
- Uptime probe + 5xx alerting on butce/demo
- Quarterly dependency review + lockfile audit

## Risks

- Single-host deployment is a SPOF
- No automated DB migration rollback path
