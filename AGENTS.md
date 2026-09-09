# Project instructions

- This is a React 19 application created with Create React App.
- This is not a Next.js project.
- Use TypeScript for all new source files.
- Use functional components and hooks.
- Use React Router DOM 7 for routing.
- Use SCSS Modules for component styles.
- Do not introduce Tailwind or styled-components.
- Use pnpm for dependency management and scripts.
- Preserve the existing folder structure and naming conventions.
- Do not hardcode credentials or environment values.
- The frontend may only use Supabase publishable credentials.
- Never expose Supabase secret or service-role credentials.
- Before completing a change, run the relevant tests and `pnpm build`.
- Explain the root cause when fixing a bug.
- HTTP contracts live in `../docs/api/`. Repo map: `../docs/architecture.md`.
- The Express package is `../backend/` (`cd backend && npm start`). SQL definitions are in `../schemas/`.
- Call the HTTP API only; do not query PostgREST for business tables.