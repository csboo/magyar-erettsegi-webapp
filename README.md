# Irodalom Érettségi (React + Bun)

Single-page React application for literature exam prep, migrated from static HTML while preserving existing behavior.

## Scripts

```bash
bun install
bun run dev
bun run lint
bun run build
bun run preview
```

## Main routes

- `/` – főoldal
- `/reader` – karakterenkénti olvasó
- `/books` – művek, karakterlistával
- `/search` – fuzzy keresés
- `/archive` – szerző/mű/karakter adattár
- `/tasks` – feladatok
- `/tasks/five-from-one` – "Öt közül egy" játék

Legacy `.html` routes are redirected in-app to the new route structure.
