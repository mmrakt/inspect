# Style and conventions

## General dev rules
- Follow DRY, YAGNI, SOLID (esp. SRP/OCP), KISS.
- Before implementation: identify unclear points/risks and confirm with user.
- Always run quality checks (static analysis + tests) before finishing.

## Testing conventions
- Always create tests for implementation code.
- Keep tests valuable and resilient to change.
- Frontend: colocate tests next to implementation.
- Backend: in-source tests.

## Frontend conventions
- Split components by feature; prioritize high cohesion/low coupling.
- Extract component logic into custom hooks when non-trivial.
- Avoid logic inside UI (DOM); keep control flow minimal in JSX.
- Use path aliases (no relative import paths).
- Avoid manual memoization (`useMemo`/`useCallback`); rely on React Compiler.
- Avoid unnecessary `useEffect`/`useRef` escape hatches.
