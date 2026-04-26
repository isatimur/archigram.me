# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ArchiGram.ai is an AI-powered architecture diagramming app that transforms natural language into diagrams (Mermaid, PlantUML, BPMN) using Google Gemini. Built with **Vite + React 19 + TypeScript**, backed by Firebase (Auth + Firestore `archigram` database) for auth and community features.

## Commands

```bash
bun run dev              # Dev server (port 3000)
bun run build            # Production build → dist/
bun run preview          # Preview production build locally
bun run type-check       # TypeScript check (tsc --noEmit)
bun run lint             # ESLint (zero warnings allowed)
bun run lint:fix         # ESLint with auto-fix
bun run format           # Prettier format all files
bun run format:check     # Prettier check only
bun run test             # Vitest watch mode
bun run test:run         # Vitest single run
bun run test:coverage    # Vitest with v8 coverage
bun run validate         # type-check + lint + test:run (use before committing)
```

Run a single test file: `bunx vitest run tests/services/geminiService.test.ts`

Take a production screenshot (playwright CLI only — do not use the Node.js Playwright API):

```bash
playwright screenshot --browser chromium --wait-for-timeout 8000 "https://archigram-ai.vercel.app" /tmp/screenshot.png
```

## Architecture

**Vite SPA** — single entry point `index.tsx`, no file-system routing. All views are state-driven components rendered inside `EditorShell`. The `app/` directory is a layout shell (not Next.js routing).

**Provider tree:**

```
AuthProvider            ← index.tsx, wraps everything
  └─ UIProvider
       └─ EditorProvider   ← app/_components/EditorWithProviders.tsx
            └─ EditorShell
```

**Three React Contexts** (`lib/contexts/`):

- `AuthContext` — `user`, `requireAuth(action)`, `openAuth(mode)`, `handleSignOut`; `authModalMode: 'signin'|'signup'`
- `UIContext` — `viewMode` (Split/Code/Preview), `theme`, `activePanel: 'projects'|'templates'|'community'|null`, `isAIChatExpanded`, and all modal booleans (`isPublishModalOpen`, `isCommandPaletteOpen`, `isShortcutsModalOpen`, `isImageImportModalOpen`, `isAuditModalOpen`, `isPublishPromptModalOpen`). Legacy aliases: `isSidebarOpen` (derived from `activePanel !== null`), `isSidebarCollapsed` (always false, no-op setter).
- `EditorContext` — spreads return of `useProjects()` + `useDiagramSync()`; key fields: `projects`, `activeProjectId`, `code`, `history`, `historyIndex`, `customStyle: DiagramStyleConfig`, `saveStatus: 'saved'|'saving'`

**Key layers:**

- `index.tsx` — React root; mounts Sentry, Plausible, then `AuthProvider → EditorWithProviders`
- `app/_components/` — Layout shell components:
  - `EditorShell.tsx` — main layout orchestrator (grid: ActivityBar | LeftPanel | Editor | CopilotPanel); holds the 6-theme `THEMES` record; lazy-loads all panels; renders all views (Landing, Gallery, Docs, etc.) via conditional state
  - `ActivityBar.tsx` — 48px icon rail: Projects/Templates/Community panel toggles + Copilot toggle
  - `EditorWithProviders.tsx` — wires UIProvider + EditorProvider around EditorShell
  - `NavigationAdapter.tsx` — maps view enum → URL path (all views map to `/`)
- `components/` — All UI components (35+ files): editor panels, modals, landing page, gallery, docs, etc.
- `lib/contexts/` — `AuthContext.tsx`, `UIContext.tsx`, `EditorContext.tsx`
- `lib/supabase/` — `browser.ts` (client-side), `server.ts` (API routes), `admin.ts` (service role)
- `lib/firebase/` — Firebase client config
- `services/` — External API clients:
  - `geminiService.ts` — Gemini AI (`gemini-2.5-pro-preview` for generation/audit/fix-syntax, `gemini-2.5-flash` for vision); supports `CopilotDomain` (General/Healthcare/Finance/E-commerce) and optional RAG context
  - `ragClient.ts` — Optional enterprise RAG backend with graceful degradation (5s timeout)
- `hooks/` — `useProjects` (project CRUD + localStorage), `useDiagramSync` (merges local ↔ Supabase `user_diagrams` on sign-in; higher `updatedAt` wins), `useKeyboardShortcuts`, `useExportHandlers`, `usePublishFlow`, `useSplitPane`
- `utils/` — Helpers (Plausible analytics, LZ-string URL compression, trending)
- `api/` — Serverless route handlers (legacy from Next.js migration; still deployed as Vercel Functions):
  - `v1/generate` — AI diagram generation
  - `v1/audit` — architecture audit (returns `AuditReport`: score 0–100, risks, strengths, improvements)
  - `v1/fix-syntax` — auto-correct broken diagram code
  - `v1/image-to-diagram` — vision-based image → Mermaid
  - `v1/diagrams/[id]` — CRUD for cloud-persisted diagrams
  - `share-diagram`, `newsletter`, `send-email`, `welcome-email`, `unsubscribe`
- `types.ts` — Shared types: `Project`, `ProjectVersion`, `DiagramStyleConfig`, `ViewMode`, `DiagramTheme`, `User`, `CommunityDiagram`, `ChatMessage`, `AuditReport`
- `constants.ts` — Domain constants, templates, static community data fallback

**Diagram state** is persisted in URL via LZ-string compression, in localStorage via `useProjects`, and synced to Supabase `user_diagrams` on sign-in via `useDiagramSync`.

**Sub-projects:**

- `cli/` — CLI tool (`bun run cli "describe diagram"`) for generating Mermaid from terminal
- `mcp-server/` — Model Context Protocol server exposing `generate_diagram` and `get_diagram` tools
- `rag/` — Python RAG backend (separate dependency tree, tested via pytest/ruff/mypy)

## Testing

- Framework: Vitest with jsdom environment, globals enabled
- Setup: `tests/setup.ts` mocks ResizeObserver, IntersectionObserver, clipboard, URL APIs
- Custom render: `tests/utils/test-utils.tsx` wraps testing-library
- Coverage: v8 provider, thresholds at 70% (branches 65%), covers `services/`, `utils/`, `hooks/`, `constants.ts`
- Tests live in `tests/` directory mirroring source structure

## Code Style

- **Commits**: Conventional Commits format — `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, etc.
- **TypeScript**: Prefer `type` over `interface`. Avoid `any` (use `unknown`). Target ES2022.
- **React**: Functional components only. Use `React.memo()` for expensive renders.
- **Styling**: Tailwind v4 — no `tailwind.config.ts`; all theme tokens live in the `@theme` block in `app/globals.css`. CSS variables for theming (`--bg`, `--surface`, `--primary`). Six editor themes: `dark` (Obsidian), `midnight` (Abyss), `forest` (Phosphor), `neutral` (Arctic), `ember` (Ember), `dusk` (Dusk). Themes are applied as inline `style` on the root div in `EditorShell`, not via class names. Tailwind color utilities (`bg-background`, `text-text`, `border-border`, etc.) and font utilities (`font-display`, `font-sans`, `font-mono`) are auto-generated from the `@theme` variables.
- **Path alias**: `@/*` maps to project root.
- **Formatting**: Prettier — single quotes, trailing commas (ES5), 100 char width, 2-space indent.
- **Pre-commit**: Husky + lint-staged runs ESLint fix + Prettier on staged `.ts/.tsx` files.

## Environment Variables

`GEMINI_API_KEY` is required for AI generation (server-side in API functions). `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY` enable community gallery and auth (the `NEXT_PUBLIC_*` prefix is shimmed in `vite.config.ts` — both `VITE_*` and `NEXT_PUBLIC_*` names work). See `.env.example` for all options.

## Deployment

Vercel with `framework: null` (raw Node.js serverless) — `vite build` output in `dist/` is served as a static SPA; `api/` handlers run as Vercel Functions. CI runs type-check, lint, format-check, tests, coverage upload (Codecov), CodeQL security analysis, and RAG service tests.
