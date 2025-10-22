# Repository Guidelines

## Project Structure & Module Organization
- `src/` — Vue + TypeScript app code. Entry: `src/main.ts` and root `src/App.vue`.
- `src/game/` — Phaser game code. Scenes in `src/game/scenes/` (e.g., `Game.ts`, `MainMenu.ts`), shared utilities like `EventBus.ts`, game entry `src/game/main.ts`.
- `public/` — Static assets (images under `public/assets/`) and global styles (`public/style.css`).
- `vite/` — Vite configs: `vite/config.dev.mjs` and `vite/config.prod.mjs`.
- Root — `index.html`, configs, lockfiles.

## Build, Test, and Development Commands
- `npm install` — Install dependencies (Node 18+ recommended).
- `npm run dev` — Start Vite dev server on port 8080 (logs a build ping via `log.js`).
- `npm run dev-nolog` — Start dev server without network logging.
- `npm run build` — Production build using `vite/config.prod.mjs` (minified, vendor chunk for Phaser).
- `npm run build-nolog` — Production build without network logging.
- `npm run typecheck` — Static type check via `vue-tsc`.
- You may use `pnpm` if preferred (a `pnpm-lock.yaml` exists): e.g., `pnpm dev`.

## Coding Style & Naming Conventions
- TypeScript: strict mode enabled in `tsconfig.json` — fix `noUnused*` and related errors.
- Indentation: 2 spaces; semicolons required; single quotes preferred in TS.
- Vue SFCs: PascalCase filenames (e.g., `PhaserGame.vue`), `<script setup lang="ts">` when possible.
- Phaser scenes and classes: PascalCase filenames and class names (one class per file).
- Imports: prefer `@/...` alias for paths under `src/`.

## Testing Guidelines
- No automated test runner currently. Validate changes by:
  - Running the dev server and exercising scenes and UI.
  - Running `npx vue-tsc --noEmit` for static checks.
  - Optional: add lightweight unit tests before large refactors.

## Commit & Pull Request Guidelines
- Commits: use meaningful messages. Conventional Commits are encouraged: `feat:`, `fix:`, `chore:`, `docs:`.
- PRs: include a clear summary, steps to run/verify, screenshots or GIFs of gameplay, and link issues.
- Assets: include only licensed media in `public/assets/` and credit as needed.

## Security & Configuration Tips
- `log.js` makes an external HTTPS request during `dev`/`build`. Use `*-nolog` scripts if offline or avoiding telemetry.
- Do not commit secrets. Prefer environment-driven config via Vite when needed.
 - Recommended Node: 18 or newer (`"engines": { "node": ">=18" }`).
