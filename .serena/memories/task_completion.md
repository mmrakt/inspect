# Task completion checklist

- Confirm unclear requirements/risks with the user before implementation.
- Implement with DRY/YAGNI/SOLID/KISS principles.
- Add/adjust tests (frontend colocated, backend in-source).
- Run quality checks before finishing:
  - `bun run lint`
  - `bun run test` (or targeted FE/BE tests)
  - `bun run type-check` when TS changes are involved
