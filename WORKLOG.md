# Worklog

Running notes while investigating a few rough edges. Temporary.

## rollover
- repro: month with all-zero balances skips snapshot row
- guard: only snapshot when at least one line item present
- carryover should follow renamed category id, not label

## familyBudget router
- 600+ lines, consider splitting save/load/archive concerns
- proposal: budget.save / budget.archive / budget.report

## reports
- memoize breakdown selector keyed by month + owner
- chart unmounts/remounts; keep instance, swap data

## demo mode
- audit: every mutating procedure checks isGuest
- expect FORBIDDEN on budget.archive when isGuest

## i18n
- missing de-AT keys for archive empty state
- verify Intl.DateTimeFormat month long form

## ui
- align padding tokens on empty states
