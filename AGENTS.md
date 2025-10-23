# Repository Guidelines

This document guides contributors working in this repo. It reflects current structure, scripts, and conventions—keep changes focused and consistent.

## Project Structure & Module Organization
- `src/` — Vue + TypeScript app. Entry: `src/main.ts`, root `src/App.vue`.
- `src/game/` — Phaser code. Scenes in `src/game/scenes/` (e.g., `Game.ts`, `MainMenu.ts`), shared utils like `EventBus.ts`, game entry `src/game/main.ts`.
- `public/` — Static assets under `public/assets/` and global styles in `public/style.css`.
- `vite/` — Vite configs: `vite/config.dev.mjs`, `vite/config.prod.mjs`.
- Root — `index.html`, configs, lockfiles.

## Build, Test, and Development Commands
- `npm install` — Install deps (Node 18+ recommended).
- `npm run dev` — Start Vite dev server on port 8080; logs a build ping via `log.js`.
- `npm run dev-nolog` — Dev server without network logging.
- `npm run build` — Production build using `vite/config.prod.mjs` (minified, vendor chunk for Phaser).
- `npm run build-nolog` — Production build without logging.
- `npm run typecheck` — Static type check via `vue-tsc`.
- Prefer `pnpm` if desired (e.g., `pnpm dev`).

## Coding Style & Naming Conventions
- TypeScript strict; fix `noUnused*` and related errors.
- Indentation 2 spaces; semicolons required; prefer single quotes in TS.
- Vue SFCs: PascalCase filenames (e.g., `PhaserGame.vue`), use `<script setup lang="ts">` when possible.
- Phaser scenes/classes: PascalCase filenames and class names; one class per file.
- Imports: prefer `@/...` alias for paths under `src/`.

## Testing Guidelines
- No automated runner currently. Validate by: running the dev server and exercising scenes/UI.
- Static checks: `npx vue-tsc --noEmit`.
- Optional: add lightweight unit tests before large refactors; keep near source when practical.

## Commit & Pull Request Guidelines
- Commits: meaningful messages. Conventional Commits encouraged: `feat:`, `fix:`, `chore:`, `docs:`.
- PRs: include a clear summary, steps to run/verify, screenshots or GIFs of gameplay, and link issues.
- Assets: include only licensed media in `public/assets/` and credit as needed.

## Security & Configuration Tips
- `log.js` performs an external HTTPS request during `dev`/`build`; use `*-nolog` scripts if offline or avoiding telemetry.
- Do not commit secrets. Prefer environment-driven config via Vite.
- Recommended Node: 18 or newer (`"engines": { "node": ">=18" }`).

