# Editor Page — Architecture & Component Reference

Complete technical reference for the `/editor` route, all React components, contexts, and hooks.

---

## Table of Contents

1. [Entry Point — `app/editor/page.tsx`](#1-entry-point)
2. [Bootstrap — `EditorWithProviders.tsx`](#2-bootstrap)
3. [Root Shell — `EditorShell.tsx`](#3-root-shell)
4. [Activity Bar — `ActivityBar.tsx`](#4-activity-bar)
5. [Header — `Header.tsx`](#5-header)
6. [Sidebar — `Sidebar.tsx`](#6-sidebar)
7. [Code Editor — `CodeEditor.tsx`](#7-code-editor)
8. [Diagram Preview — `DiagramPreview.tsx`](#8-diagram-preview)
9. [AI Copilot — `AIChat.tsx`](#9-ai-copilot)
10. [State — Contexts](#10-state--contexts)
    - [AuthContext](#authcontext)
    - [UIContext](#uicontext)
    - [EditorContext](#editorcontext)
11. [Hooks](#11-hooks)
    - [useProjects](#useprojects)
    - [useDiagramSync](#usediagramsync)
    - [useKeyboardShortcuts](#usekeyboardshortcuts)
12. [Theming System](#12-theming-system)
13. [Keyboard Shortcuts Reference](#13-keyboard-shortcuts-reference)
14. [Data Flow Diagram](#14-data-flow-diagram)

---

## 1. Entry Point

**File:** `app/editor/page.tsx`

```tsx
'use client';
dynamic(() => import('@/app/_components/EditorWithProviders'), { ssr: false });
```

- Marks the route as a Next.js Client Component (`'use client'`).
- Dynamically imports `EditorWithProviders` with `ssr: false`, preventing any Supabase browser-client code from running on the server.
- Renders a centered loading spinner while the bundle loads: animated indigo ring + `Loading ArchiGram...` in `font-mono`.
- No props, no data fetching — all state lives client-side.

---

## 2. Bootstrap

**File:** `app/_components/EditorWithProviders.tsx`

The thin wrapper that mounts the provider tree before `EditorShell`:

```
UIProvider
  └── EditorProvider
        └── EditorShell
```

- `UIProvider` — view mode, active panel, theme, all modal booleans, AI chat expanded state, and responsive resizing logic.
- `EditorProvider` — project CRUD state via `useProjects` + cloud sync via `useDiagramSync`.
- `EditorShell` — the full layout with all lazy-loaded UI panels.

This file is loaded client-side only (via `next/dynamic ssr:false` in the page), so `supabaseClient.ts` (which creates a browser client at module level) never executes on the server.

---

## 3. Root Shell

**File:** `app/_components/EditorShell.tsx` (873 lines)

The orchestrator. Consumes all three contexts, wires every handler, and renders the top-level layout grid.

### Themes

Six editor themes are defined in a `THEMES` record. Each theme is a set of CSS custom property values applied to the root `div` via inline `style`:

| Theme ID   | Display Name | Character                       |
| ---------- | ------------ | ------------------------------- |
| `dark`     | Obsidian     | Near-void black, indigo accents |
| `midnight` | Abyss        | Deep blue-black                 |
| `forest`   | Phosphor     | Dark green tones                |
| `neutral`  | Arctic       | Cool grey, high contrast        |
| `ember`    | Ember        | Warm red-brown                  |
| `dusk`     | Dusk         | Purple-grey twilight            |

Each theme entry maps these CSS variables:
`--bg`, `--surface`, `--surface-hover`, `--surface-elevated`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--primary`, `--primary-hover`, `--primary-bg`, `--accent`

### Layout

```
<div style={themeVars}>           ← applies CSS vars, full viewport
  <CommandPalette />              ← lazy, global overlay
  <ShortcutsModal />              ← lazy, global overlay
  <PublishModal />                ← lazy, global overlay
  <ImageImportModal />            ← lazy, global overlay
  <AuditModal />                  ← lazy, global overlay
  <AuthModal />                   ← lazy, global overlay
  <DeleteConfirmModal />          ← inline small modal

  <div className="flex h-screen">
    <ActivityBar />               ← 48px left strip
    <Sidebar />                   ← collapsible, width depends on activePanel
    <div className="flex flex-col flex-1">
      <Header />                  ← top bar
      <div className="flex flex-1">   ← main content area
        <CodeEditor />            ← left pane (Split/Code view)
        <DiagramPreview />        ← right pane (Split/Preview view)
      </div>
      <StatusBar />               ← 22px bottom strip
    </div>
    <AIChat />                    ← floating panel, bottom-right
  </div>
</div>
```

### Split Pane

- State: `splitPercent` (number, default `35`)
- Range: 15% – 80%
- Drag handle: `4px` wide `cursor-col-resize` div between CodeEditor and DiagramPreview
- Double-click on handle → resets `splitPercent` to `35`
- Mouse event listeners added to `window` during drag; removed on `mouseup`

### Lazy Loading

All heavy components are loaded with `React.lazy` + `Suspense`:

```typescript
const Header = lazy(() => import('@/components/Header'));
const Sidebar = lazy(() => import('@/components/Sidebar'));
const CodeEditor = lazy(() => import('@/components/CodeEditor'));
const DiagramPreview = lazy(() => import('@/components/DiagramPreview'));
const AIChat = lazy(() => import('@/components/AIChat'));
// + all modals
```

### Share Handler

`handleShare()` — builds a share URL using LZ-string URL compression (`encodeCodeToUrl(code)`), then writes to clipboard and shows a `sonner` toast. Also dispatches a Plausible analytics event.

### Export Handlers

- `handleExportPng()` — `querySelector('#diagram-output-container svg')`, uses `html2canvas` or `saveSvgAsPng`.
- `handleExportSvg()` — finds the SVG element, creates a Blob, triggers download.

### Status Bar

22px VS Code-style chrome at the bottom of the editor pane:

```tsx
<div
  className="h-[22px] border-t border-border bg-surface flex items-center shrink-0 overflow-hidden"
  role="status"
>
  <div className="w-1 self-stretch bg-primary shrink-0" /> {/* left accent strip */}
  {/* Save status indicator (SAVING amber / SAVED green dot) */}
  {/* Last saved time (hidden on mobile) */}
  <div className="flex-1" />
  {/* ⌘K hint (hidden md:flex) */}
  {/* ? hint (hidden lg:flex) */}
</div>
```

- SAVING state: amber `Loader2` spinner + amber `SAVING` text
- SAVED state: emerald dot + `SAVED` text
- All labels: `font-mono text-[10px] tracking-wide`
- Right side: `⌘K` and `?` hints, each a clickable-looking bordered segment

---

## 4. Activity Bar

**File:** `app/_components/ActivityBar.tsx` (71 lines)

A 48px (`w-12`) vertical strip on the far left. `role="navigation"` `aria-label="Activity bar"`.

### Buttons (top section)

| Icon             | `activePanel` value | Tooltip   |
| ---------------- | ------------------- | --------- |
| `FolderOpen`     | `'projects'`        | Projects  |
| `LayoutTemplate` | `'templates'`       | Templates |
| `Globe`          | `'community'`       | Community |

Each button is `w-10 h-10 rounded-md`. Toggle behavior: clicking an already-active panel sets `activePanel` to `null` (closes sidebar).

Active state:

```tsx
className="text-primary bg-primary-bg relative"
// + 2px left accent line:
<div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
```

### Bottom button

- `Sparkles` icon → calls `onOpenCopilot` (toggles `isAIChatExpanded`)

---

## 5. Header

**File:** `components/Header.tsx` (821 lines)

Top bar across the full width of the editor. Contains the logo, project title, view switcher, theme picker, and action menus.

### Props

```typescript
{
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  currentTheme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  onShare: () => void;
  onNewProject: () => void;
  activeProject: Project | undefined;
  onRenameProject: (id: string, name: string) => void;
  onPublish: () => void;
  onNavigate: (view: AppView) => void;
  onSaveVersion: (label?: string) => void;
  onAudit: () => void;
  user: User | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}
```

### Logo

Blueprint Intelligence diamond mark (inline SVG, cyan `#22d3ee`) + `ArchiGram.ai` in Syne font.

### Project Title

Inline editable `<input>` that:

- Shows the active project name
- On click, focuses and selects all text
- On `Enter` or `blur`, calls `onRenameProject`
- `font-mono text-sm` styling

### View Switcher

Three segmented buttons with keyboard shortcut hints:

| Label   | Shortcut | `ViewMode`         |
| ------- | -------- | ------------------ |
| Code    | `⌘1`     | `ViewMode.Code`    |
| Split   | `⌘2`     | `ViewMode.Split`   |
| Preview | `⌘3`     | `ViewMode.Preview` |

### Theme Picker

Dropdown with 6 theme options. Each option shows:

- A `w-3 h-3` color swatch (the theme's primary color)
- Theme display name in `font-display` (Syne)
- Theme ID in `font-mono text-[9px]`

### Share Menu

Dropdown with items:

- **Get Share Link** — copies URL-encoded link to clipboard
- **Copy Link** — same
- **Twitter** — opens `twitter.com/intent/tweet` with pre-filled text
- **LinkedIn** — opens LinkedIn share URL
- **Email** — `mailto:` link with subject + body
- **Embed Diagram** — opens the Embed modal

Share dropdown container: `rounded-lg` (changed from `rounded-xl` in polish pass).

### Embed Modal

Full-screen modal for configuring an iframe embed:

- **Mode** selector: `minimal` / `toolbar` / `interactive`
- **Width** input (default `800`)
- **Height** input (default `600`)
- Preview of the generated `<iframe>` code
- Copy to clipboard button

### Overflow Menu (···)

Three-dot button opens a dropdown with:

- New Project (`⌘N`)
- Save Checkpoint (`⌘S`)
- Run Audit
- Export SVG (`⌘⇧E`)
- Export PNG (`⌘E`)

### Publish Button

`bg-primary text-white rounded-md px-4 py-1.5 text-sm font-medium` — no shadow (removed in polish pass). Calls `onPublish` which opens `PublishModal`.

### Auth Section

- Not logged in: `Sign In` and `Sign Up` buttons
- Logged in: avatar/initials circle + `Sign Out`

---

## 6. Sidebar

**File:** `components/Sidebar.tsx` (452 lines)

Collapsible left panel for project/template/community navigation.

### Props

```typescript
{
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onCreateFromTemplate: (name: string, code: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving';
  onRenameProject: (id: string, newName: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onOpenGallery: () => void;
  onScanImage: () => void;
}
```

### Sections (controlled by `activePanel` in `UIContext`)

- **Projects** (`activePanel === 'projects'`): project list + New Diagram button
- **Templates** (`activePanel === 'templates'`): grid of Mermaid templates
- **Community** (`activePanel === 'community'`): link to gallery

### New Diagram Button

```tsx
className =
  'w-full rounded-md bg-primary text-white text-xs font-medium px-3 py-1.5 flex items-center gap-2 hover:bg-primary-hover transition-colors';
```

No shadow, no scale animation (removed in polish pass).

Scan Image button adjacent to it:

```tsx
<ScanLine className="w-3.5 h-3.5 text-primary" /> // text-primary (was text-indigo-400)
```

### Project List Item

Each project renders:

- **Avatar**: `w-7 h-7 rounded border border-border bg-surface-elevated` with `Box` icon `text-text-dim` (neutral, no color-coded initials)
- Project name (truncated)
- Delete `X` button (shown on hover)
- Inline rename: click name → `<input>` replaces it, `Enter`/`blur` commits

Section header: `font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim`

Footer items: `rounded-md` (was `rounded-xl`)

---

## 7. Code Editor

**File:** `components/CodeEditor.tsx` (460 lines)

A three-layer custom code editor for Mermaid syntax, styled as a professional IDE panel.

### Props

```typescript
{
  code: string;
  onChange: (code: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  error: string | null;
  selectionRequest: string | null;
  theme: DiagramTheme;
  hideToolbar?: boolean;
  collapseStatus?: boolean;
  onFixError?: (error: string) => void;
  isFixing?: boolean;
}
```

### Three-Layer Architecture

```
<div className="relative">
  <LineNumbers />        ← w-12 gutter, right-aligned line numbers
  <SyntaxHighlight />    ← <pre> with dangerouslySetInnerHTML, pointer-events-none
  <textarea />           ← transparent, actual editable input, monospace
</div>
```

All three layers are absolutely positioned and share the same font, line-height, and padding to stay aligned.

### Syntax Highlighter (`highlightCode`)

Custom tokenizer that processes Mermaid code line-by-line with regex, applying HTML `<span>` with color classes:

| Token          | Style                   | Examples                                   |
| -------------- | ----------------------- | ------------------------------------------ |
| Comment (`%%`) | italic, `text-text-dim` | `%% this is a note`                        |
| Strings        | `text-emerald-400`      | `"label text"`                             |
| Diagram types  | bold, `text-accent`     | `graph`, `sequenceDiagram`, `classDiagram` |
| Keywords       | `text-primary`          | `subgraph`, `end`, `participant`, `class`  |
| Arrows         | `text-cyan-400`         | `-->`, `->>`, `-->>`, `:::`                |
| Directions     | `text-orange-400`       | `TD`, `LR`, `TB`, `RL`                     |
| Brackets       | `text-yellow-400`       | `[`, `]`, `(`, `)`, `{`, `}`               |

### Toolbar

```
source.mmd    [Copy ▾]   [?]   [↩] [↪]   Mermaid v11.4
```

- `source.mmd` label: `font-mono text-[10px] text-text-dim`
- `CopyDropdown`: copies raw code or copies as shareable URL
- `?`: opens platform guides modal
- Undo/Redo: `ArrowCounterClockwise` / `ArrowClockwise` icons
- `Mermaid v11.4`: version badge, `font-mono text-[9px]`

### Diagnostics Panel

Bottom-of-editor collapsible panel shown when `error !== null`:

- Red dot + error count badge
- Collapsed by default; toggle arrow expands
- Error message text
- **Fix with AI** button: calls `POST /api/v1/fix-syntax` with `{ code, error }`, receives fixed code, calls `onChange`
- `isFixing` prop drives a loading spinner on the button

### Selection Request

When `selectionRequest` prop changes (set by clicking a diagram node in `DiagramPreview`):

1. Finds the position of `selectionRequest` text in the code
2. Sets textarea `selectionStart` / `selectionEnd`
3. Scrolls the container to make the selection visible

---

## 8. Diagram Preview

**File:** `components/DiagramPreview.tsx` (795 lines)

Renders Mermaid diagrams to SVG with full pan/zoom, interactive tooltips, and a Style Studio panel.

### Props

```typescript
{
  code: string;
  onError: (error: string | null) => void;
  theme: DiagramTheme;
  customStyle?: DiagramStyleConfig;
  onUpdateStyle?: (style: DiagramStyleConfig) => void;
  onElementClick?: (text: string) => void;
  showControls?: boolean;   // default: true
}
```

### Rendering Pipeline

1. **Lazy mount** — `IntersectionObserver` delays render until container is in viewport (100px rootMargin). Prevents rendering hidden panels.
2. **Icon packs** — `mermaid.registerIconPacks()` loads `logos`, `fa6-regular`, `fa6-solid`, `material-symbols` from npm or CDN fallback (esm.sh). Runs once; guarded by `iconsLoaded` state.
3. **Mermaid config** — `mermaid.initialize()` called when theme/style changes. Maps DiagramTheme → Mermaid theme (`dark`/`forest`/`neutral`/`default`). Builds `themeVariables` from `customStyle`.
4. **Render** — `mermaid.render()` called 100ms after code/theme change. Result SVG stored in `svgContent` state and injected via `dangerouslySetInnerHTML`.

### Diagram Type Safety

Some diagram types don't support `handDrawn` look:

- `gitGraph`, `mindmap`, `architecture-beta`
- For these, `look` is forced to `'classic'` even if user selected Sketch mode.

### Pan/Zoom

- **Scroll wheel** (or Ctrl+wheel) — adjusts `scale` (range: 0.2–5)
- **Click + drag** — pans via `position: {x, y}` state
- **Double-click scale label** (in HUD) — resets to scale=1, position={0,0}
- Transform applied to the inner container: `translate(${x}px, ${y}px) scale(${scale})`

### Element Interaction

- Hover over `.node`, `.actor`, `.messageText`, `.classTitle`, `.cluster` → cursor becomes pointer + floating tooltip appears
- Click on element (without dragging) → calls `onElementClick(textContent)` → triggers `selectionRequest` in `CodeEditor`

### Tooltip

Fixed-position `div` at `(mouse.x + 15, mouse.y + 15)`:

- `text-[9px] font-bold text-cyan-400 uppercase` type label
- `text-xs` content

### Style Studio

Floating panel above the HUD controls, toggled by the `Palette` button.

**Presets** (4 built-in):
| Name | Background | Look |
|---|---|---|
| Professional | `#131316` dots | Classic |
| Blueprint | `#1e3a8a` grid | Hand Drawn |
| Cyberpunk | `#09090b` cross | Classic, neon green |
| Paper | `#f5f5f4` solid | Hand Drawn |

**Custom controls:**

- Color pickers: Node, Line, Text, Canvas
- Render mode toggle: Classic / Sketch
- Background pattern selector: Solid, Dots, Grid, Cross (with mini SVG previews)
- Background opacity slider (0–100%)

### HUD Controls Bar

Floating pill at bottom-center: `bg-surface/90 backdrop-blur-xl border rounded-full`:

- `Palette` button (opens Style Studio if `onUpdateStyle` provided)
- `Minus` / zoom% / `Plus`
- `RotateCcw` (reset view)

---

## 9. AI Copilot

**File:** `components/AIChat.tsx` (627 lines)

Floating AI assistant panel positioned bottom-right of the editor.

### Props

```typescript
{
  projectId: string;
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  theme: DiagramTheme;
  versions: ProjectVersion[];
  onRestoreVersion: (version: ProjectVersion) => void;
  onSaveVersion: (label?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSharePrompt?: (prompt: string, resultCode: string) => void;
  externalPrompt?: string | null;
  externalResultCode?: string | null;
  onConsumeExternalPrompt?: () => void;
}
```

### Collapsed State (FAB)

```tsx
<button className="w-9 h-9 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover transition-colors">
  <Sparkles className="w-4 h-4 text-text-muted" />
</button>
```

`boxShadow: '0 2px 8px rgba(0,0,0,0.4)'` — subtle depth only.

### Expanded Panel

Fixed-position panel (`w-80`, right-4 bottom-4, `z-40`):

```
┌─────────────────────────┐  ← rounded-xl, shadow-xl
│ [Bot icon]  AI Copilot  │  ← bg-surface-hover/30 header
│ [Tab: Chat] [Tab: Hist] │
├─────────────────────────┤
│ Chat / History content  │
├─────────────────────────┤
│ [textarea] [Send]       │
└─────────────────────────┘
```

Bot icon: `w-7 h-7 rounded border border-primary/30 bg-primary/10` — flat, no gradient.

### Tabs

- **Chat** — conversation thread, suggested prompts, message input
- **History** — version timeline with restore/label buttons

### Chat Behavior

- Conversation persisted to `localStorage` under key `archigram_chat_${projectId}`
- Clears on project switch
- On send: `POST /api/v1/generate` with `{ prompt, currentCode }`, receives `{ code }`, calls `onCodeUpdate`
- AI response auto-creates a version snapshot via `onSaveVersion('AI Update')`

### Suggested Prompts

Grid of quick-action chips, grouped by domain:

- **General**: Add error handling, Add retry logic, Add logging
- **Healthcare**: Add HIPAA compliance, Add patient data flow
- **Finance**: Add audit trail, Add reconciliation step
- **E-commerce**: Add payment flow, Add inventory check

Chip style: `rounded-md px-3 py-2 text-xs` — flat, no padding inflation.

### External Prompt

When `externalPrompt` prop is set (from the gallery "fork" flow), the component auto-submits the prompt, then calls `onConsumeExternalPrompt` to clear it.

---

## 10. State — Contexts

### AuthContext

**File:** `lib/contexts/AuthContext.tsx`

```typescript
type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  requireAuth: (action: () => void) => void; // queues action until signed in
  openAuth: (mode: 'signin' | 'signup') => void;
  onAuthSuccess: (user: User) => void; // flush pendingAction after sign-in
  handleSignOut: () => Promise<void>;
};
```

**Key behavior:**

- On mount: calls `getCurrentUser()` from `lib/supabase/browser.ts`, then subscribes to `onAuthStateChange`.
- `requireAuth(action)` — if user is null, saves action to `pendingAction` ref, opens modal; if user exists, runs action immediately.
- `onAuthSuccess` — sets user, closes modal, flushes `pendingAction`.

### UIContext

**File:** `lib/contexts/UIContext.tsx`

```typescript
type UIContextValue = {
  viewMode: ViewMode; // 'code' | 'split' | 'preview'
  setViewMode: (mode: ViewMode) => void;
  activePanel: ActivePanel; // 'projects' | 'templates' | 'community' | null
  setActivePanel: (panel: ActivePanel) => void;
  isSidebarOpen: boolean; // derived: activePanel !== null
  setIsSidebarOpen: (open: boolean) => void; // derived: sets 'projects' or null
  isSidebarCollapsed: boolean; // always false (legacy stub)
  setIsSidebarCollapsed: (_: boolean) => void;
  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  isPublishModalOpen: boolean;
  isImageImportModalOpen: boolean;
  isAuditModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsModalOpen: boolean;
  isPublishPromptModalOpen: boolean;
  isAIChatExpanded: boolean;
  setIsAIChatExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  // setters for all modal booleans
};
```

**Responsive behavior:**

- On `resize` event: if viewport < 768px → `setViewMode(Preview)`, `setActivePanel(null)`.
- On resize to ≥ 768px: re-opens panel if it was null.

**Initial state:**

- `viewMode: ViewMode.Split`
- `activePanel: 'projects'`
- `theme: 'dark'`
- `isAIChatExpanded: true`

### EditorContext

**File:** `lib/contexts/EditorContext.tsx`

A thin wrapper: `EditorContextValue = ReturnType<typeof useProjects>`.

The context simply exposes everything returned by `useProjects`. Consumed via `useEditor()`.

Additionally calls `useDiagramSync({ user, projects, setProjects })` — the sync hook is mounted here and has no return value.

---

## 11. Hooks

### useProjects

**File:** `hooks/useProjects.ts` (493 lines)

All project CRUD and diagram state management.

**Returns:**

```typescript
{
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  activeProjectId: string;
  code: string;
  setCode: (code: string) => void;
  customStyle: DiagramStyleConfig;
  setCustomStyle: (style: DiagramStyleConfig) => void;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving';
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  canUndo: boolean;
  canRedo: boolean;
  activeProject: Project | undefined;
  undo: () => void;
  redo: () => void;
  handleCreateProject: () => void;
  handleCreateFromTemplate: (name: string, code: string) => void;
  handleFork: (diagram: CommunityDiagram) => void;
  handleSelectProject: (id: string) => void;
  handleRenameProject: (id: string, name: string) => void;
  handleDeleteProject: (id: string, e: React.MouseEvent) => void;
  confirmDeleteProject: () => void;
  handleImageImport: (code: string) => void;
  handleDuplicateDiagram: () => void;
  handleAIUpdate: (code: string) => void;
  handleManualSnapshot: (label?: string) => void;
  handleRestoreVersion: (version: ProjectVersion) => void;
}
```

**Persistence:**

- Projects stored in `localStorage` under `PROJECTS_STORAGE_KEY` (`'archigram_projects'`)
- Auto-save: debounced 1 second after `projects` state change
- Safety save: `beforeunload` event writes directly from a ref (avoids stale closure)

**Initialization:**

1. Reads `PROJECTS_STORAGE_KEY` from localStorage
2. Migrates legacy single-diagram `STORAGE_KEY` if present and no projects array exists
3. If still empty, seeds with a default "Uber System Flow" diagram (`INITIAL_CODE`)
4. Checks URL hash — if LZ-compressed code found, creates a "Shared Diagram" project and clears the hash

**Undo/Redo:**

- `history: string[]` array of code snapshots
- `historyIndex: number` pointer into history
- New code snapshot added 800ms after last change (debounced)
- `undo()` / `redo()` move the pointer and set code directly

**Version snapshots:**

- `ProjectVersion: { id, timestamp, code, label, source: 'ai' | 'manual' }`
- Up to 50 versions per project (oldest dropped)
- Created by `handleAIUpdate` (source: `'ai'`) and `handleManualSnapshot` (source: `'manual'`)

### useDiagramSync

**File:** `hooks/useDiagramSync.ts` (76 lines)

Syncs localStorage projects with Supabase `user_diagrams` table.

**Behavior:**

- On user sign-in (user changes from null to a User): fetches cloud diagrams via `fetchUserDiagrams(userId)`, merges with local using `mergeProjects()`, updates state, then uploads any local-only projects to cloud (fire-and-forget `upsertUserDiagram`).
- On every `projects` change while user is logged in: detects changed projects (by `updatedAt` comparison), upserts each to Supabase (fire-and-forget).

**`mergeProjects(local, cloud)`:**

- Builds a map starting from cloud projects
- Local projects override cloud when `local.updatedAt > cloud.updatedAt`
- Result sorted by `updatedAt` descending
- Exported separately for unit testing

**Guard:** `syncedUserIdRef` prevents re-fetching cloud diagrams if the same user was already synced this session.

### useKeyboardShortcuts

**File:** `hooks/useKeyboardShortcuts.ts` (210 lines)

Global `window.addEventListener('keydown', ...)` for the editor.

**Guards:**

1. Skips if the focused element is `INPUT`, `TEXTAREA`, or `contentEditable` — allows typing in form fields.
2. `Escape` always works (closes the topmost open modal), even when other shortcuts are suppressed.
3. All shortcuts other than Escape are suppressed when any modal is open.

**Mac/Windows:** Uses `e.metaKey` on Mac (detected via `navigator.platform`), `e.ctrlKey` elsewhere.

---

## 12. Theming System

Two independent theme layers:

### 1. Editor Theme (CSS Variables)

Controls the editor chrome (backgrounds, borders, text colors, primary accent).

Set in `EditorShell.tsx` `THEMES` record. Applied via inline `style` on the root `div`.

Custom properties:

| Variable             | Purpose                               |
| -------------------- | ------------------------------------- |
| `--bg`               | Page background                       |
| `--surface`          | Card / panel backgrounds              |
| `--surface-hover`    | Hover state backgrounds               |
| `--surface-elevated` | Slightly lighter than surface         |
| `--border`           | All borders                           |
| `--text`             | Primary text                          |
| `--text-muted`       | Secondary text                        |
| `--text-dim`         | Tertiary / disabled text              |
| `--primary`          | Accent color (buttons, active states) |
| `--primary-hover`    | Primary hover                         |
| `--primary-bg`       | Low-opacity primary background        |
| `--accent`           | Secondary accent (cyan)               |

### 2. Diagram Theme (Mermaid)

Controls how the rendered SVG looks.

Selected via `DiagramTheme` type: `'dark' | 'midnight' | 'forest' | 'neutral' | 'ember' | 'dusk'`

Mapped to Mermaid's built-in themes:

| DiagramTheme | Mermaid theme |
| ------------ | ------------- |
| `dark`       | `dark`        |
| `midnight`   | `dark`        |
| `forest`     | `forest`      |
| `neutral`    | `default`     |
| `ember`      | `dark`        |
| `dusk`       | `dark`        |

Additionally overridden by `customStyle` (via `DiagramPreview` `themeVariables`): node color, line color, text color.

---

## 13. Keyboard Shortcuts Reference

| Shortcut               | Action                                      |
| ---------------------- | ------------------------------------------- |
| `⌘1` / `Ctrl+1`        | Code view                                   |
| `⌘2` / `Ctrl+2`        | Split view                                  |
| `⌘3` / `Ctrl+3`        | Preview view                                |
| `⌘S` / `Ctrl+S`        | Show "Saved" toast (auto-save confirmation) |
| `⌘⇧S` / `Ctrl+Shift+S` | Share diagram (copy link)                   |
| `⌘N` / `Ctrl+N`        | New project                                 |
| `⌘E` / `Ctrl+E`        | Export PNG                                  |
| `⌘⇧E` / `Ctrl+Shift+E` | Export SVG                                  |
| `⌘/` / `Ctrl+/`        | Toggle AI Copilot                           |
| `⌘K` / `Ctrl+K`        | Open command palette                        |
| `⌘G` / `Ctrl+G`        | Toggle gallery view                         |
| `⌘D` / `Ctrl+D`        | Duplicate diagram                           |
| `⌘⇧P` / `Ctrl+Shift+P` | Open publish modal                          |
| `?`                    | Open keyboard shortcuts modal               |
| `Escape`               | Close topmost modal                         |

---

## 14. Data Flow Diagram

```
URL hash (#lz-encoded)
        │
        ▼
  useProjects (init)
        │  loads/migrates/seeds projects from localStorage
        │
        ▼
  EditorContext (projects, code, handlers)
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Sidebar   CodeEditor
(list)    (edit code)
   │         │
   │    setCode()
   │         │
   │         ▼
   │    useProjects.code
   │         │
   │    (debounce 1s)
   │         │
   │         ▼
   │    localStorage.setItem(PROJECTS_KEY)
   │         │
   │         ▼ (if user logged in)
   │    useDiagramSync → Supabase upsert (fire-and-forget)
   │
   ▼
DiagramPreview
  mermaid.render(code)
        │
        ▼
  SVG (dangerouslySetInnerHTML)
        │
   element click
        │
        ▼
  onElementClick → selectionRequest → CodeEditor scroll+select
```

```
User signs in
        │
        ▼
  AuthContext.onAuthSuccess(user)
        │
        ▼
  useDiagramSync
  fetchUserDiagrams(userId)
  mergeProjects(local, cloud)
  setProjects(merged)
  upload local-only → Supabase
```
