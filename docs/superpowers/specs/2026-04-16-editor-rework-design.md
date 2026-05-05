# Editor Rework — Design Spec

**Date:** 2026-04-16
**Scope:** Full rebuild of the ArchiGram editor shell — UX layout + code architecture
**Approach:** Option A (Full Rebuild)

---

## Context

The current editor has two compounding problems:

1. **God component:** `EditorShell.tsx` (~873 LOC) owns the layout, all modal state, split pane drag logic, export/publish handlers, keyboard shortcuts, theme application, and error handling. It's hard to change safely.
2. **Layout debt:** The header is overloaded (821 LOC, 9 dropdown states), the AI copilot floats as an afterthought rather than a true panel, the activity bar and sidebar are separate components that need to stay in sync, and the split pane has no persistence or snap points.

The rework addresses both together. Fixing layout without fixing architecture means another refactor pass in 6 months; fixing architecture without fixing layout misses the UX opportunity.

---

## Layout

Four zones, always visible:

```
┌──────────────────────────────────────────────────────┐
│  COMMAND BAR  (h-11)  — logo · title · actions       │
├───────────────────────┬──────────────────┬───────────┤
│  LEFT PANEL  (240px)  │                  │           │
│  ┌─────────────────┐  │   CODE EDITOR    │  COPILOT  │
│  │Projects│Tmpl│Com│  │                  │  PANEL    │
│  ├─────────────────┤  ├──────────────────┤  (320px,  │
│  │                 │  │  DIAGRAM PREVIEW │  toggle)  │
│  │  panel content  │  │                  │           │
│  │                 │  │                  │           │
│  └─────────────────┘  │                  │           │
├───────────────────────┴──────────────────┴───────────┤
│  STATUS BAR  (h-[22px])                              │
└──────────────────────────────────────────────────────┘
```

**Command bar** replaces the current 64px header:

- Left: logo + diagram title (inline-editable `<input>`, saves on blur/Enter, cancels on Escape)
- Right: max 4 actions (Export, Share, Publish, User avatar); overflow into `⋯` menu

**Left panel** merges ActivityBar + Sidebar into one component:

- Tab strip at top (Projects / Templates / Community) replaces the activity bar icon rail
- `activePanel` in UIContext drives the active tab — no separate state to sync
- Collapsible: clicking active tab collapses to 0 width

**Split pane** (Code top, Preview bottom):

- Default: 50% / 50%
- Snap points: 30%, 50%, 70% — double-click handle to cycle
- Persisted to localStorage via `useSplitPane`
- Drag range: 15%–85%

**Copilot panel** docked to the right (320px):

- Toggled by `isCopilotOpen` in UIContext (replaces `isAIChatExpanded`)
- Same content as current AIChat — chat messages, domain selector, suggested prompts, version history
- No floating positioning logic

**Status bar** unchanged (h-[22px], save status, keyboard hint chips).

---

## Component Architecture

### New / renamed components

| Component       | File                              | LOC target | Role                                        |
| --------------- | --------------------------------- | ---------- | ------------------------------------------- |
| `EditorShell`   | `app/_components/EditorShell.tsx` | ~200       | Thin layout grid only — no business logic   |
| `CommandBar`    | `components/CommandBar.tsx`       | ~200       | Replaces Header.tsx; owns inline title edit |
| `LeftPanel`     | `components/LeftPanel.tsx`        | ~300       | Merges ActivityBar + Sidebar                |
| `CopilotPanel`  | `components/CopilotPanel.tsx`     | ~400       | Right-docked version of AIChat              |
| `ModalRenderer` | `components/ModalRenderer.tsx`    | ~40        | Registry-driven modal mount point           |

### Retired components

- `components/Header.tsx` — replaced by `CommandBar`
- `app/_components/ActivityBar.tsx` — absorbed into `LeftPanel`
- `components/Sidebar.tsx` — absorbed into `LeftPanel`
- `components/AIChat.tsx` — replaced by `CopilotPanel`

### Extracted hooks

| Hook                                   | File                         | Extracted from            |
| -------------------------------------- | ---------------------------- | ------------------------- |
| `useSplitPane(defaultPct, storageKey)` | `hooks/useSplitPane.ts`      | EditorShell inline state  |
| `useExportHandlers()`                  | `hooks/useExportHandlers.ts` | EditorShell export logic  |
| `usePublishFlow()`                     | `hooks/usePublishFlow.ts`    | EditorShell publish logic |

### Modal registry

Replace 7 inline `{isX && <Suspense><Modal/></Suspense>}` blocks with a single registry:

```ts
// components/ModalRenderer.tsx
const MODALS: ModalEntry[] = [
  { flag: 'isPublishModalOpen', load: () => import('./PublishModal') },
  { flag: 'isShortcutsModalOpen', load: () => import('./KeyboardShortcutsModal') },
  { flag: 'isImageImportModalOpen', load: () => import('./ImageImportModal') },
  { flag: 'isAuditModalOpen', load: () => import('./AuditModal') },
  { flag: 'isCommandPaletteOpen', load: () => import('./CommandPalette') },
  { flag: 'isPublishPromptModalOpen', load: () => import('./PublishPromptModal') },
  { flag: 'isAuthModalOpen', load: () => import('./AuthModal') },
];
```

Adding a new modal = one line in the registry.

---

## State Changes

### UIContext additions

```ts
splitPercent: number; // default 50, persisted via useSplitPane
isCopilotOpen: boolean; // default true, replaces isAIChatExpanded
```

### UIContext removals

```ts
// Remove legacy aliases (no longer needed):
isSidebarOpen; // was derived from activePanel !== null
isSidebarCollapsed; // was always false
isAIChatExpanded; // replaced by isCopilotOpen
```

All other existing state (`activePanel`, modal booleans, `viewMode`, `theme`) unchanged.

### Provider tree (unchanged)

```
AuthProvider (app/layout.tsx)
  └─ UIProvider
       └─ EditorProvider (app/_components/EditorWithProviders.tsx)
            └─ EditorShell
```

---

## Error Handling

- `CodeEditor` error panel auto-expands when a Mermaid syntax error is present, collapses when cleared. Single `hasError` boolean replaces the current split `isDiagnosticsOpen` / error state.
- `DiagramPreview` Mermaid parse error overlay unchanged.
- `useSplitPane` clamps silently (never throws) — percent always within 15%–85%.
- `ModalRenderer` wraps each lazy import in `<Suspense fallback={null}>` — a failed modal load renders nothing, does not crash the shell.

---

## Testing

All new hooks follow the existing Vitest pattern in `tests/hooks/`.

| Target              | Test focus                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| `useSplitPane`      | Drag logic, snap points (30/50/70%), localStorage read/write, clamp at 15%/85% |
| `useExportHandlers` | PNG/SVG blob generation (mock canvas API)                                      |
| `ModalRenderer`     | Correct modal rendered per flag; nothing rendered when all false               |
| `CommandBar`        | Inline title edit: saves on blur/Enter, cancels on Escape                      |

No new test infrastructure needed — coverage thresholds and setup unchanged.

---

## Files Modified / Created

**New files:**

- `components/CommandBar.tsx`
- `components/LeftPanel.tsx`
- `components/CopilotPanel.tsx`
- `components/ModalRenderer.tsx`
- `hooks/useSplitPane.ts`
- `hooks/useExportHandlers.ts`
- `hooks/usePublishFlow.ts`
- `tests/hooks/useSplitPane.test.ts`
- `tests/hooks/useExportHandlers.test.ts`
- `tests/components/ModalRenderer.test.ts`
- `tests/components/CommandBar.test.ts`

**Modified:**

- `app/_components/EditorShell.tsx` — stripped to layout shell (~200 LOC)
- `app/_components/EditorWithProviders.tsx` — remove ActivityBar import
- `lib/contexts/UIContext.tsx` — add `splitPercent`, `isCopilotOpen`; remove legacy aliases

**Retired (delete after migration):**

- `components/Header.tsx`
- `components/AIChat.tsx`
- `components/Sidebar.tsx`
- `app/_components/ActivityBar.tsx`
