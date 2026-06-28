# Tech debt register

Temporary working list while triaging debt. Delete once items are filed.

## state mgmt
- split derived selectors out of the provider
- monthly totals recompute on unrelated updates
- effect captures old budget snapshot on rapid edits

## hooks
- split read/write/undo into focused hooks
- cap undo history at N entries
- ensure no snapshot row when nothing to carry

## server
- isolate isGuest overlay from context wiring
- verify Date round-trips through tRPC + superjson
- multiple inserts per snapshot; wrap in one tx
- optimistic lock should reject stale expectedUpdatedAt

## formatting
- single EUR formatter, drop ad-hoc toFixed calls
- some views use dot, locale wants comma
- destructive token contrast too low on dark bg

## ui
- many pages re-implement the same card shell
- keyboard users can't see focused option

## build
- react/recharts/i18next rarely change; separate chunk
- workbox precaches maps unnecessarily

## deps
- avoid surprise migration generator changes
