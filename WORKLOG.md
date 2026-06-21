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
