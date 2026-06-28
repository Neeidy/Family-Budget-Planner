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
