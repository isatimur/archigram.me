# Editor Redesign — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic Header/ActivityBar/Sidebar/AIChat stack with four focused components (CommandBar, LeftPanel, CopilotPanel, ModalRenderer) backed by three extracted hooks, producing a flat v2 design with no backdrop-blur or shadow-2xl anywhere.

**Architecture:** Extract all business logic from EditorShell into `useExportHandlers`/`usePublishFlow` hooks and all split-pane state into `useSplitPane`. Four new UI components replace four old ones with 1:1 feature parity but a flat, consistent visual language. EditorShell becomes a ~200-line layout grid that wires them together.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4 (CSS vars via `@theme`), Lucide icons, Vitest.

**Design system for all new components:**

- Dropdowns/menus: `bg-surface border border-border rounded-lg shadow-md` — never `backdrop-blur-*`, never `shadow-2xl`, never `rounded-2xl`
- Active nav item: `bg-primary-bg text-primary` with a left-edge indicator `w-0.5 bg-primary`
- Panels: `bg-surface border-r border-border` (no blur, no glow)
- CommandBar: `h-11 bg-background border-b border-border`
- Buttons: `hover:bg-surface-hover transition-colors` flat — no shadow on hover
- Theme picker cards: solid `style={{ backgroundColor: meta.bg }}`, active = `ring-1 ring-primary` — no inline radial gradients, no boxShadow
- CopilotPanel: `w-80 bg-surface border-l border-border flex flex-col shrink-0`

---

## File Map

**Create:**

- `hooks/useSplitPane.ts` — split pane state + drag + snap + localStorage
- `hooks/useExportHandlers.ts` — SVG/PNG export (extracted from EditorShell)
- `hooks/usePublishFlow.ts` — audit + publish + fix-syntax (extracted from EditorShell)
- `components/CommandBar.tsx` — replaces `components/Header.tsx` (~200 LOC)
- `components/LeftPanel.tsx` — replaces `app/_components/ActivityBar.tsx` + `components/Sidebar.tsx` (~280 LOC)
- `components/CopilotPanel.tsx` — replaces `components/AIChat.tsx` (~380 LOC)
- `components/ModalRenderer.tsx` — registry-driven modal mount (~45 LOC)
- `tests/hooks/useSplitPane.test.ts`
- `tests/hooks/useExportHandlers.test.ts`
- `tests/components/ModalRenderer.test.ts`
- `tests/components/CommandBar.test.ts`

**Modify:**

- `lib/contexts/UIContext.tsx` — add `isCopilotOpen`; remove `isAIChatExpanded` + legacy aliases
- `hooks/useKeyboardShortcuts.ts` — swap `setIsAIChatExpanded` → `setIsCopilotOpen`
- `app/_components/EditorShell.tsx` — strip to thin layout grid (~200 LOC)

**Delete (after Task 9):**

- `components/Header.tsx`
- `components/Sidebar.tsx`
- `components/AIChat.tsx`
- `app/_components/ActivityBar.tsx`

---

## Task 1: `useSplitPane` hook

**Files:**

- Create: `hooks/useSplitPane.ts`
- Create: `tests/hooks/useSplitPane.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/hooks/useSplitPane.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSplitPane } from '@/hooks/useSplitPane';

// localStorage mock is already set up in tests/setup.ts

describe('useSplitPane', () => {
  const STORAGE_KEY = 'split-pane-pct';

  beforeEach(() => {
    localStorage.clear();
  });

  it('initialises with the default percent when localStorage is empty', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    expect(result.current.splitPercent).toBe(35);
  });

  it('reads persisted value from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, '60');
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    expect(result.current.splitPercent).toBe(60);
  });

  it('clamps values below 15 to 15', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    act(() => result.current.setSplitPercent(5));
    expect(result.current.splitPercent).toBe(15);
  });

  it('clamps values above 85 to 85', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    act(() => result.current.setSplitPercent(95));
    expect(result.current.splitPercent).toBe(85);
  });

  it('persists valid values to localStorage', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    act(() => result.current.setSplitPercent(60));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('60');
  });

  it('snapToDefault resets to 35', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    act(() => result.current.setSplitPercent(70));
    act(() => result.current.snapToDefault());
    expect(result.current.splitPercent).toBe(35);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bunx vitest run tests/hooks/useSplitPane.test.ts
```

Expected: FAIL — `Cannot find module '@/hooks/useSplitPane'`

- [ ] **Step 3: Implement `hooks/useSplitPane.ts`**

```ts
import { useState, useCallback, useRef, useEffect } from 'react';

export type UseSplitPaneReturn = {
  splitPercent: number;
  setSplitPercent: (pct: number) => void;
  snapToDefault: () => void;
  startDrag: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export function useSplitPane(defaultPct: number, storageKey: string): UseSplitPaneReturn {
  const [splitPercent, setRaw] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const n = parseFloat(stored);
        if (!isNaN(n)) return Math.min(Math.max(n, 15), 85);
      }
    } catch {
      // SSR or localStorage unavailable
    }
    return defaultPct;
  });

  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setSplitPercent = useCallback(
    (pct: number) => {
      const clamped = Math.min(Math.max(pct, 15), 85);
      setRaw(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const snapToDefault = useCallback(
    () => setSplitPercent(defaultPct),
    [defaultPct, setSplitPercent]
  );

  const startDrag = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(pct);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setSplitPercent]);

  return { splitPercent, setSplitPercent, snapToDefault, startDrag, containerRef };
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
bunx vitest run tests/hooks/useSplitPane.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add hooks/useSplitPane.ts tests/hooks/useSplitPane.test.ts
git commit -m "feat(editor): add useSplitPane hook with persistence and clamp"
```

---

## Task 2: `useExportHandlers` hook

**Files:**

- Create: `hooks/useExportHandlers.ts`
- Create: `tests/hooks/useExportHandlers.test.ts`

Context: The export logic currently lives inside `EditorShell.tsx` (~line 275–371). Extract it verbatim into a hook.

- [ ] **Step 1: Write the failing test**

```ts
// tests/hooks/useExportHandlers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportHandlers } from '@/hooks/useExportHandlers';

// Mock toast
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// Mock analytics
vi.mock('@/utils/analytics', () => ({ analytics: { exportPng: vi.fn(), exportSvg: vi.fn() } }));

describe('useExportHandlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns exportSvg and exportPng functions', () => {
    const { result } = renderHook(() =>
      useExportHandlers({ code: 'graph TD; A-->B', theme: 'dark', customStyle: {} })
    );
    expect(typeof result.current.handleExportSvg).toBe('function');
    expect(typeof result.current.handleExportPng).toBe('function');
  });

  it('handleExportSvg shows error toast when no SVG is in DOM', () => {
    const { result } = renderHook(() =>
      useExportHandlers({ code: '', theme: 'dark', customStyle: {} })
    );
    result.current.handleExportSvg();
    const { toast } = require('sonner');
    expect(toast.error).toHaveBeenCalledWith('Export failed: No diagram found');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bunx vitest run tests/hooks/useExportHandlers.test.ts
```

Expected: FAIL — `Cannot find module '@/hooks/useExportHandlers'`

- [ ] **Step 3: Implement `hooks/useExportHandlers.ts`**

Extract the `getSvgData`, `handleExportSvg`, and `handleExportPng` functions exactly as they exist in `EditorShell.tsx` (lines 275–371). Wrap them in a hook that takes `{ code, theme, customStyle }` as params. Return `{ handleExportSvg, handleExportPng }`.

```ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { analytics } from '@/utils/analytics';
import type { DiagramTheme, DiagramStyleConfig } from '@/types';

type Params = {
  code: string;
  theme: DiagramTheme;
  customStyle: Partial<DiagramStyleConfig>;
};

export function useExportHandlers({ theme, customStyle }: Params) {
  const getSvgData = useCallback(() => {
    const container = document.getElementById('diagram-output-container');
    const svg = container?.querySelector('svg');
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGElement;
    let width = 0,
      height = 0;
    const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);

    if (viewBox && viewBox.length === 4) {
      width = viewBox[2];
      height = viewBox[3];
    } else {
      const rect = svg.getBoundingClientRect();
      const transform = container?.style.transform;
      const scaleMatch = transform?.match(/scale\(([\d.]+)\)/);
      const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      width = rect.width / currentScale;
      height = rect.height / currentScale;
    }

    clone.setAttribute('width', width.toString());
    clone.setAttribute('height', height.toString());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const bgColor = customStyle.backgroundColor || (theme === 'neutral' ? '#ffffff' : '#131316');
    clone.style.backgroundColor = bgColor;
    return { clone, width, height, bgColor };
  }, [theme, customStyle]);

  const handleExportSvg = useCallback(() => {
    const data = getSvgData();
    if (!data) {
      toast.error('Export failed: No diagram found');
      return;
    }
    const { clone } = data;
    try {
      analytics.exportSvg();
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `archigram-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('SVG Export failed:', e);
      toast.error('SVG Export failed');
    }
  }, [getSvgData]);

  const handleExportPng = useCallback(() => {
    const data = getSvgData();
    if (!data) return;
    const { clone, width, height, bgColor } = data;
    try {
      analytics.exportPng();
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const link = document.createElement('a');
          link.download = `archigram-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        toast.error('PNG Generation failed');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error('PNG Export failed:', e);
      toast.error('PNG Export failed');
    }
  }, [getSvgData]);

  return { handleExportSvg, handleExportPng };
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
bunx vitest run tests/hooks/useExportHandlers.test.ts
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add hooks/useExportHandlers.ts tests/hooks/useExportHandlers.test.ts
git commit -m "feat(editor): extract useExportHandlers hook from EditorShell"
```

---

## Task 3: `usePublishFlow` hook

**Files:**

- Create: `hooks/usePublishFlow.ts`
- (No separate test file — logic is integration-heavy; covered by EditorShell smoke test)

Context: The audit, publish, fix-syntax, and publish-prompt logic in `EditorShell.tsx` (~lines 373–475) are extracted here. The hook takes context callbacks as params.

- [ ] **Step 1: Implement `hooks/usePublishFlow.ts`**

```ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { analytics } from '@/utils/analytics';
import { publishDiagram } from '@/lib/supabase/browser';
import { AUTHOR_KEY } from '@/constants';
import type { AuditReport } from '@/services/geminiService';
import type { Project, User as UserType } from '@/types';

type Params = {
  code: string;
  activeProjectId: string;
  projects: Project[];
  user: UserType | null | undefined;
  requireAuth: (action: () => void) => void;
  setIsPublishModalOpen: (open: boolean) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  setIsPublishPromptModalOpen: (open: boolean) => void;
};

export function usePublishFlow({
  code,
  activeProjectId,
  projects,
  user,
  requireAuth,
  setIsPublishModalOpen,
  setIsAuditModalOpen,
  setIsPublishPromptModalOpen,
}: Params) {
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishData, setPublishData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
  });
  const [pendingPromptText, setPendingPromptText] = useState('');
  const [pendingPromptResultCode, setPendingPromptResultCode] = useState<string | undefined>();

  const openPublishModal = useCallback(() => {
    requireAuth(() => {
      const activeP = projects.find((p) => p.id === activeProjectId);
      setPublishData({
        title: activeP?.name || '',
        author: localStorage.getItem(AUTHOR_KEY) || '',
        description: '',
        tags: '',
      });
      setIsPublishModalOpen(true);
    });
  }, [requireAuth, projects, activeProjectId, setIsPublishModalOpen]);

  const submitPublish = useCallback(async () => {
    if (!publishData.title.trim() || !code.trim()) return;
    setIsPublishing(true);
    if (publishData.author) localStorage.setItem(AUTHOR_KEY, publishData.author);
    const tagsArray = publishData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const success = await publishDiagram({
      title: publishData.title,
      author: user?.username || publishData.author || 'Anonymous',
      description: publishData.description,
      code,
      tags: tagsArray,
    });
    setIsPublishing(false);
    if (success) {
      analytics.diagramPublished(tagsArray);
      setIsPublishModalOpen(false);
      toast.success('Diagram successfully published to Gallery!');
    } else {
      toast.error('Failed to publish. Try again.');
    }
  }, [publishData, code, user, setIsPublishModalOpen]);

  const handleAudit = useCallback(async () => {
    analytics.auditRun();
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditReport(null);
    try {
      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Audit failed');
      setAuditReport(await res.json());
    } catch (e) {
      console.error(e);
      toast.error('Audit failed. Please try again.');
      setIsAuditModalOpen(false);
    } finally {
      setIsAuditing(false);
    }
  }, [code, setIsAuditModalOpen]);

  const handleOpenPublishPrompt = useCallback(
    (promptText: string, resultCode?: string) => {
      setPendingPromptText(promptText);
      setPendingPromptResultCode(resultCode);
      setIsPublishPromptModalOpen(true);
    },
    [setIsPublishPromptModalOpen]
  );

  const consumeExternalPrompt = useCallback(() => {
    setPendingPromptText('');
    setPendingPromptResultCode(undefined);
  }, []);

  return {
    auditReport,
    isAuditing,
    isPublishing,
    publishData,
    setPublishData,
    pendingPromptText,
    pendingPromptResultCode,
    openPublishModal,
    submitPublish,
    handleAudit,
    handleOpenPublishPrompt,
    consumeExternalPrompt,
  };
}
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
bun run test:run
```

Expected: All existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add hooks/usePublishFlow.ts
git commit -m "feat(editor): extract usePublishFlow hook from EditorShell"
```

---

## Task 4: UIContext — add `isCopilotOpen`, remove legacy aliases

**Files:**

- Modify: `lib/contexts/UIContext.tsx`
- Modify: `hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Update `lib/contexts/UIContext.tsx`**

Replace the full file with this:

```ts
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode } from '@/types';
import type { DiagramTheme } from '@/types';

export type ActivePanel = 'projects' | 'templates' | 'community' | null;

type UIContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  isImageImportModalOpen: boolean;
  setIsImageImportModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isPublishPromptModalOpen: boolean;
  setIsPublishPromptModalOpen: (open: boolean) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [activePanel, setActivePanel] = useState<ActivePanel>('projects');
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPublishPromptModalOpen, setIsPublishPromptModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
        setActivePanel(null);
        setIsCopilotOpen(false);
      } else {
        setActivePanel((p) => p ?? 'projects');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UIContext.Provider
      value={{
        viewMode, setViewMode,
        activePanel, setActivePanel,
        theme, setTheme,
        isCopilotOpen, setIsCopilotOpen,
        isPublishModalOpen, setIsPublishModalOpen,
        isImageImportModalOpen, setIsImageImportModalOpen,
        isAuditModalOpen, setIsAuditModalOpen,
        isCommandPaletteOpen, setIsCommandPaletteOpen,
        isShortcutsModalOpen, setIsShortcutsModalOpen,
        isPublishPromptModalOpen, setIsPublishPromptModalOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
```

- [ ] **Step 2: Update `hooks/useKeyboardShortcuts.ts`**

Replace the `setIsAIChatExpanded` parameter with `setIsCopilotOpen` everywhere in the file (in the interface type, destructuring, and usage). The copilot shortcut (⌘\) should now call `setIsCopilotOpen((prev) => !prev)`.

Locate the line that references `setIsAIChatExpanded` (around line 14 and ~line 85) and change:

```ts
// In interface:
setIsAIChatExpanded: (fn: (prev: boolean) => boolean) => void;
// → replace with:
setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
```

And update usage accordingly.

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: Errors about `isAIChatExpanded` used in `EditorShell.tsx` — these will be fixed in Task 9. Count the errors, confirm they're all in EditorShell.

- [ ] **Step 4: Run tests**

```bash
bun run test:run
```

Expected: All tests PASS (UIContext has no tests currently; keyboard shortcut tests should still pass)

- [ ] **Step 5: Commit**

```bash
git add lib/contexts/UIContext.tsx hooks/useKeyboardShortcuts.ts
git commit -m "feat(ui-context): replace isAIChatExpanded with isCopilotOpen, remove legacy aliases"
```

---

## Task 5: `ModalRenderer` component

**Files:**

- Create: `components/ModalRenderer.tsx`
- Create: `tests/components/ModalRenderer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/components/ModalRenderer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

// Mock the modals so we don't need real implementations
vi.mock('@/components/AuthModal', () => ({
  default: () => <div data-testid="auth-modal">AuthModal</div>,
}));
vi.mock('@/components/PublishModal', () => ({
  default: () => <div data-testid="publish-modal">PublishModal</div>,
}));

// Mock UIContext
vi.mock('@/lib/contexts/UIContext', () => ({
  useUI: vi.fn(),
}));
vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/lib/contexts/EditorContext', () => ({
  useEditor: vi.fn(),
}));

import { useUI } from '@/lib/contexts/UIContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import ModalRenderer from '@/components/ModalRenderer';

const baseUI = {
  isPublishModalOpen: false, setIsPublishModalOpen: vi.fn(),
  isImageImportModalOpen: false, setIsImageImportModalOpen: vi.fn(),
  isAuditModalOpen: false, setIsAuditModalOpen: vi.fn(),
  isCommandPaletteOpen: false, setIsCommandPaletteOpen: vi.fn(),
  isShortcutsModalOpen: false, setIsShortcutsModalOpen: vi.fn(),
  isPublishPromptModalOpen: false, setIsPublishPromptModalOpen: vi.fn(),
  viewMode: 'split', setViewMode: vi.fn(),
  activePanel: null, setActivePanel: vi.fn(),
  theme: 'dark', setTheme: vi.fn(),
  isCopilotOpen: false, setIsCopilotOpen: vi.fn(),
};

describe('ModalRenderer', () => {
  it('renders nothing when all modal flags are false', () => {
    vi.mocked(useUI).mockReturnValue(baseUI as never);
    vi.mocked(useAuth).mockReturnValue({ isAuthModalOpen: false, setIsAuthModalOpen: vi.fn(), user: null, authModalMode: 'signin', onAuthSuccess: vi.fn(), openAuth: vi.fn(), handleSignOut: vi.fn(), requireAuth: vi.fn() } as never);
    vi.mocked(useEditor).mockReturnValue({ code: '' } as never);
    const { container } = render(<Suspense fallback={null}><ModalRenderer auditReport={null} isAuditing={false} isPublishing={false} publishData={{ title: '', author: '', description: '', tags: '' }} setPublishData={vi.fn()} submitPublish={vi.fn()} pendingPromptText="" pendingPromptResultCode={undefined} consumeExternalPrompt={vi.fn()} onScanImage={vi.fn()} /></Suspense>);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bunx vitest run tests/components/ModalRenderer.test.ts
```

Expected: FAIL — `Cannot find module '@/components/ModalRenderer'`

- [ ] **Step 3: Implement `components/ModalRenderer.tsx`**

```tsx
'use client';

import React, { lazy, Suspense } from 'react';
import { useUI } from '@/lib/contexts/UIContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import type { AuditReport } from '@/services/geminiService';
import { AppView, ViewMode } from '@/types';

const AuthModal = lazy(() => import('./AuthModal'));
const PublishModal = lazy(() => import('./PublishModal'));
const PublishPromptModal = lazy(() => import('./PublishPromptModal'));
const ImageImportModal = lazy(() => import('./ImageImportModal'));
const AuditModal = lazy(() => import('./AuditModal'));
const CommandPalette = lazy(() => import('./CommandPalette'));
const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcutsModal'));

type Props = {
  auditReport: AuditReport | null;
  isAuditing: boolean;
  isPublishing: boolean;
  publishData: { title: string; author: string; description: string; tags: string };
  setPublishData: (data: Props['publishData']) => void;
  submitPublish: () => void;
  pendingPromptText: string;
  pendingPromptResultCode: string | undefined;
  consumeExternalPrompt: () => void;
  onScanImage: () => void;
  onNavigate?: (view: AppView) => void;
  onNewProject?: () => void;
  onExportPng?: () => void;
  onExportSvg?: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  onDuplicate?: () => void;
  onAudit?: () => void;
};

export default function ModalRenderer({
  auditReport,
  isAuditing,
  isPublishing,
  publishData,
  setPublishData,
  submitPublish,
  pendingPromptText,
  pendingPromptResultCode,
  consumeExternalPrompt,
  onScanImage,
  onNavigate,
  onNewProject,
  onExportPng,
  onExportSvg,
  onShare,
  onPublish,
  onDuplicate,
  onAudit,
}: Props) {
  const {
    isPublishModalOpen,
    setIsPublishModalOpen,
    isImageImportModalOpen,
    setIsImageImportModalOpen,
    isAuditModalOpen,
    setIsAuditModalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isPublishPromptModalOpen,
    setIsPublishPromptModalOpen,
    viewMode,
    setViewMode,
  } = useUI();
  const { isAuthModalOpen, setIsAuthModalOpen, onAuthSuccess, authModalMode, user } = useAuth();
  const { code, handleImageImport } = useEditor();

  return (
    <>
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={onAuthSuccess}
            initialMode={authModalMode}
          />
        </Suspense>
      )}
      {isPublishModalOpen && (
        <Suspense fallback={null}>
          <PublishModal
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            publishData={publishData}
            onPublishDataChange={setPublishData}
            onSubmit={submitPublish}
            isPublishing={isPublishing}
            code={code}
            user={user}
          />
        </Suspense>
      )}
      {isImageImportModalOpen && (
        <Suspense fallback={null}>
          <ImageImportModal
            onClose={() => setIsImageImportModalOpen(false)}
            onImport={handleImageImport}
          />
        </Suspense>
      )}
      {isAuditModalOpen && (
        <Suspense fallback={null}>
          <AuditModal
            onClose={() => setIsAuditModalOpen(false)}
            isLoading={isAuditing}
            report={auditReport}
          />
        </Suspense>
      )}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={onNavigate ?? (() => {})}
            onNewProject={onNewProject ?? (() => {})}
            onExportPng={onExportPng ?? (() => {})}
            onExportSvg={onExportSvg ?? (() => {})}
            onShare={onShare ?? (() => {})}
            onPublish={onPublish ?? (() => {})}
            onDuplicate={onDuplicate ?? (() => {})}
            onAudit={onAudit ?? (() => {})}
            onScanImage={onScanImage}
            viewMode={viewMode as ViewMode}
            setViewMode={setViewMode}
          />
        </Suspense>
      )}
      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        </Suspense>
      )}
      {isPublishPromptModalOpen && (
        <Suspense fallback={null}>
          <PublishPromptModal
            isOpen={isPublishPromptModalOpen}
            onClose={() => setIsPublishPromptModalOpen(false)}
            promptText={pendingPromptText}
            resultCode={pendingPromptResultCode}
            username={user?.username || ''}
          />
        </Suspense>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
bunx vitest run tests/components/ModalRenderer.test.ts
```

Expected: PASS — 1 test

- [ ] **Step 5: Commit**

```bash
git add components/ModalRenderer.tsx tests/components/ModalRenderer.test.ts
git commit -m "feat(editor): add ModalRenderer registry component"
```

---

## Task 6: `CommandBar` component (replaces `Header.tsx`)

**Files:**

- Create: `components/CommandBar.tsx`
- Create: `tests/components/CommandBar.test.ts`

**Interface** (read from `Header.tsx` line 32–50 for the existing prop names):

```ts
type CommandBarProps = {
  onExportPng: () => void;
  onExportSvg: () => void;
  onShare: () => void;
  onPublish: () => void;
  onAudit: () => void;
  onNavigate: (view: AppView) => void;
};
// All other data (viewMode, theme, user, activeProject, etc.) is read directly from contexts.
```

**Design rules (critical — read this before writing JSX):**

1. `<header>` element: `h-11 bg-background border-b border-border flex items-center justify-between px-3 shrink-0` — NO `backdrop-blur-*`, NO `shadow-sm`
2. Theme picker dropdown: `absolute top-full right-0 mt-1 z-20 w-64 bg-surface border border-border rounded-lg shadow-md overflow-hidden` — NOT `rounded-2xl shadow-2xl backdrop-blur-xl w-72`
3. Theme picker cards: `<button style={{ backgroundColor: meta.bg }}>` — NO inline `radial-gradient` or `boxShadow`. Active state: `ring-1 ring-primary/80 scale-[0.97]`, inactive: `hover:scale-[1.02] opacity-80 hover:opacity-100`
4. User/share dropdowns: `bg-surface border border-border rounded-lg shadow-md` — NOT `rounded-xl shadow-2xl`
5. All dropdown `animate-in` keep: `fade-in slide-in-from-top-2 duration-150`
6. View switcher pill: `bg-surface border border-border p-0.5 rounded-md` (keep as-is)
7. Publish button: `px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover active:scale-95 rounded-md` (no shadow)
8. Export items live in the share dropdown (same as current Header, keep the overflow `⋯` menu with Export PNG/SVG + Audit)

- [ ] **Step 1: Write the failing test**

```ts
// tests/components/CommandBar.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Minimal context mocks
vi.mock('@/lib/contexts/UIContext', () => ({
  useUI: () => ({
    viewMode: 'split', setViewMode: vi.fn(),
    theme: 'dark', setTheme: vi.fn(),
    activePanel: null, isCopilotOpen: false,
  }),
}));
vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, openAuth: vi.fn() }),
}));
vi.mock('@/lib/contexts/EditorContext', () => ({
  useEditor: () => ({ activeProject: { id: '1', name: 'My Diagram' }, handleRenameProject: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CommandBar from '@/components/CommandBar';

const props = {
  onExportPng: vi.fn(), onExportSvg: vi.fn(), onShare: vi.fn(),
  onPublish: vi.fn(), onAudit: vi.fn(), onNavigate: vi.fn(),
};

describe('CommandBar', () => {
  it('renders the ArchiGram brand', () => {
    render(<CommandBar {...props} />);
    expect(screen.getByText('Gram')).toBeInTheDocument();
  });

  it('displays the active project name', () => {
    render(<CommandBar {...props} />);
    expect(screen.getByText('My Diagram')).toBeInTheDocument();
  });

  it('switches to edit mode when project title is clicked', () => {
    render(<CommandBar {...props} />);
    fireEvent.click(screen.getByText('My Diagram'));
    expect(screen.getByRole('textbox', { name: /project title/i })).toBeInTheDocument();
  });

  it('cancels title edit on Escape', () => {
    render(<CommandBar {...props} />);
    fireEvent.click(screen.getByText('My Diagram'));
    const input = screen.getByRole('textbox', { name: /project title/i });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bunx vitest run tests/components/CommandBar.test.ts
```

Expected: FAIL — `Cannot find module '@/components/CommandBar'`

- [ ] **Step 3: Implement `components/CommandBar.tsx`**

Read `components/Header.tsx` in full. Create `components/CommandBar.tsx` by:

1. Reading all state from contexts instead of props (except the 6 action callbacks above)
2. Applying all design rules from the "Design rules" section above
3. Keeping 100% of the functionality (title edit, view switcher, theme picker, dark mode toggle, share menu with Twitter/LinkedIn/email/copy/embed, user menu, publish button, overflow ⋯ menu with Export PNG/SVG/Audit/Save Version)
4. Keeping the `ShareEmailModal` lazy import

Key implementation note — the THEME_CATALOG stays the same. The only change in the theme picker is removing inline gradient styles:

```tsx
// OLD (remove this):
style={{
  background: isActive
    ? `radial-gradient(ellipse at 70% 0%, ${meta.primary}22 0%, ${meta.bg} 65%)`
    : `color-mix(in srgb, ${meta.bg} 80%, #ffffff 20%)`,
  ...(isActive ? { boxShadow: `0 0 0 1.5px ${meta.primary}88, 0 0 12px ${meta.primary}33` } : {}),
}}

// NEW (replace with):
style={{ backgroundColor: meta.bg === '#ffffff' ? '#f8fafc' : meta.bg }}
// Active state handled by className only:
className={`relative flex flex-col items-start p-2.5 rounded-lg border transition-all duration-150 text-left ${
  isActive
    ? 'border-transparent ring-1 ring-primary/70 scale-[0.97]'
    : 'border-border/60 opacity-75 hover:opacity-100 hover:scale-[1.02]'
}`}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bunx vitest run tests/components/CommandBar.test.ts
```

Expected: PASS — 4 tests

- [ ] **Step 5: Run type-check**

```bash
bun run type-check
```

Expected: No errors from `CommandBar.tsx`

- [ ] **Step 6: Commit**

```bash
git add components/CommandBar.tsx tests/components/CommandBar.test.ts
git commit -m "feat(editor): add CommandBar — flat v2 design, contexts replace props"
```

---

## Task 7: `LeftPanel` component (merges ActivityBar + Sidebar)

**Files:**

- Create: `components/LeftPanel.tsx`

**Design and behavior:**

- Width: `w-60` (same as current sidebar)
- Full height: `h-full flex flex-col bg-surface border-r border-border`
- **Tab strip** at the top replaces the 48px icon-only ActivityBar:
  ```
  [ Projects ]  [ Templates ]  [ Community ]
  ```
  Each tab: `flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors`
  Active tab: `border-primary text-primary bg-primary-bg/30`
  Inactive tab: `border-transparent text-text-muted hover:text-text hover:bg-surface-hover`
- Clicking the **active** tab sets `activePanel` to `null` (collapses the panel)
- Panel content area below the tab strip: same project list / template list / community gallery as current `Sidebar.tsx`, conditioned on `activePanel`
- Remove ALL `backdrop-blur-*` from Sidebar content (currently `bg-surface/80 backdrop-blur-xl` on line 100 — change to `bg-surface`)
- Remove `isCollapsed` and `toggleCollapse` — no collapsed state needed; the panel is either open (240px) or closed (0px, controlled by `activePanel` in EditorShell)
- The community tab renders the existing community gallery (currently in Sidebar's community section)
- Read all state from contexts: `activePanel`/`setActivePanel` from `useUI`, projects from `useEditor`

**Interface:**

```ts
type LeftPanelProps = {
  onCreateProject: () => void;
  onCreateFromTemplate: (name: string, code: string) => void;
  onScanImage: () => void;
  onOpenGallery: () => void;
};
```

All project data, `activePanel`, and callbacks come from contexts.

- [ ] **Step 1: Implement `components/LeftPanel.tsx`**

Read `components/Sidebar.tsx` in full, then read `app/_components/ActivityBar.tsx`. Create `components/LeftPanel.tsx` that:

1. Has the tab strip described above (Projects/Templates/Community)
2. Renders the correct content panel below based on `activePanel`
3. Uses `useUI` for `activePanel`/`setActivePanel`
4. Uses `useEditor` for `projects`, `activeProjectId`, `handleSelectProject`, `handleRenameProject`, `handleDeleteProject`, `lastSaved`, `saveStatus`
5. Preserves all existing project list rendering including: search, rename inline edit, delete button, empty state with "Create first diagram" button
6. Removes `isCollapsed` and `pt-5` top padding (tab strip provides visual separation)
7. Removes `backdrop-blur-xl` from the root element
8. The delete trigger still calls the parent's `handleDeleteProject` which sets `pendingDeleteId` — the confirmation dialog stays in EditorShell

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: No errors from `LeftPanel.tsx`

- [ ] **Step 3: Run full test suite**

```bash
bun run test:run
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/LeftPanel.tsx
git commit -m "feat(editor): add LeftPanel — merges ActivityBar + Sidebar with tab strip"
```

---

## Task 8: `CopilotPanel` component (replaces `AIChat.tsx`)

**Files:**

- Create: `components/CopilotPanel.tsx`

**Design and behavior:**

- Fixed right panel: `w-80 bg-surface border-l border-border flex flex-col h-full shrink-0`
- **Panel header** (h-11, matches CommandBar height):
  ```
  [ Sparkles icon ] AI Copilot    [chat tab] [history tab]    [X close]
  ```
  Classes: `h-11 flex items-center gap-2 px-3 border-b border-border shrink-0`
  Close button calls `setIsCopilotOpen(false)` (from `useUI`)
- Chat/History tabs are inline in the header row (right of title, left of close)
- Remove the floating expand/collapse button entirely — the panel is toggled from CommandBar's ⋯ menu and from ActivityBar (now LeftPanel's footer area or from CommandBar)
- `isExpanded`/`onToggleExpanded` props are gone — the panel is either mounted (when `isCopilotOpen`) or not
- All other chat functionality (messages, prompts, domain selector, version history, snapshot, thumbs up/down, share prompt) is preserved verbatim from `AIChat.tsx`
- Remove `backdrop-blur-*` if any exists on domain dropdown

**Interface:**

```ts
type CopilotPanelProps = {
  projectId: string;
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  versions: ProjectVersion[];
  onRestoreVersion: (version: ProjectVersion) => void;
  onSaveVersion: (label: string) => void;
  onSharePrompt?: (promptText: string, resultCode?: string) => void;
  externalPrompt?: string;
  externalResultCode?: string;
  onConsumeExternalPrompt?: () => void;
};
```

- [ ] **Step 1: Implement `components/CopilotPanel.tsx`**

Read `components/AIChat.tsx` in full. Create `components/CopilotPanel.tsx` that:

1. Replaces the floating expand/collapse button with the panel header described above
2. Reads `isCopilotOpen`/`setIsCopilotOpen` from `useUI` — the component doesn't manage its own open/close state
3. Removes `isExpanded`/`onToggleExpanded`/`internalIsExpanded` state — not needed since EditorShell controls visibility
4. Keeps all chat logic: messages, streaming, domain selector, suggested prompts, snapshot, feedback buttons, version history, copy code, restore
5. Removes `theme` prop (reads `theme` from `useUI` instead)
6. If the domain dropdown has `backdrop-blur-*` or `rounded-2xl`, change to `rounded-lg shadow-md bg-surface border border-border`

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: No errors from `CopilotPanel.tsx`

- [ ] **Step 3: Run full test suite**

```bash
bun run test:run
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/CopilotPanel.tsx
git commit -m "feat(editor): add CopilotPanel — docked right panel replacing AIChat float"
```

---

## Task 9: Refactor `EditorShell` to thin layout grid + wire up new components

**Files:**

- Modify: `app/_components/EditorShell.tsx`
- Modify: `app/_components/EditorWithProviders.tsx` (remove ActivityBar import if present)

This is the integration step. Replace the 874-line EditorShell with a ~200-line layout grid.

- [ ] **Step 1: Rewrite `app/_components/EditorShell.tsx`**

The new EditorShell:

- Imports: `CommandBar`, `LeftPanel`, `CopilotPanel`, `ModalRenderer`, `useSplitPane`, `useExportHandlers`, `usePublishFlow` plus the lazy `CodeEditor`, `DiagramPreview`
- Uses `useSplitPane(35, 'archigram-split-pct')` for split pane
- Uses `useExportHandlers` and `usePublishFlow` instead of inline logic
- Reads from `useUI`, `useEditor`, `useAuth` for layout decisions
- The layout:

```tsx
<div
  className="min-h-dvh w-full flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
  style={THEMES[theme]}
>
  {/* Skip link */}
  <a href="#main" className="sr-only focus:not-sr-only focus:absolute ...">
    Skip to editor
  </a>

  {/* CommandBar */}
  <CommandBar
    onExportPng={handleExportPng}
    onExportSvg={handleExportSvg}
    onShare={handleShare}
    onPublish={openPublishModal}
    onAudit={handleAudit}
    onNavigate={setCurrentView}
  />

  {/* Main area */}
  <main id="main" className="flex-1 flex overflow-hidden relative">
    {/* Left Panel — desktop inline */}
    <div
      className={`hidden md:flex h-full transition-[width] duration-150 ease-out overflow-hidden shrink-0 ${activePanel !== null ? 'w-60' : 'w-0'}`}
    >
      <div className="w-60 h-full overflow-hidden">
        <Suspense fallback={<div className="w-60 h-full bg-surface" />}>
          <LeftPanel
            onCreateProject={handleCreateProject}
            onCreateFromTemplate={handleCreateFromTemplate}
            onScanImage={() => setIsImageImportModalOpen(true)}
            onOpenGallery={() => setCurrentView('gallery')}
          />
        </Suspense>
      </div>
    </div>

    {/* Mobile overlay */}
    {activePanel !== null && (
      <div className="md:hidden absolute inset-0 z-40 flex">
        <div className="w-60 h-full shadow-lg relative z-50 bg-surface">
          <Suspense fallback={null}>
            <LeftPanel
              onCreateProject={() => {
                handleCreateProject();
                setActivePanel(null);
              }}
              onCreateFromTemplate={(n, c) => {
                handleCreateFromTemplate(n, c);
                setActivePanel(null);
              }}
              onScanImage={() => setIsImageImportModalOpen(true)}
              onOpenGallery={() => {
                setCurrentView('gallery');
                setActivePanel(null);
              }}
            />
          </Suspense>
        </div>
        <div className="flex-1 bg-black/50" onClick={() => setActivePanel(null)} />
      </div>
    )}

    {/* Split pane */}
    <div id="main" ref={containerRef} className="flex-1 flex overflow-hidden">
      {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
        <div
          style={viewMode === ViewMode.Split ? { width: `${splitPercent}%` } : undefined}
          className={`flex flex-col border-r border-border overflow-hidden ${viewMode === ViewMode.Code ? 'flex-1' : 'shrink-0'}`}
        >
          <Suspense fallback={<div className="w-full h-full bg-background animate-pulse" />}>
            <CodeEditor
              code={code}
              onChange={setCode}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              error={error}
              selectionRequest={selectionRequest}
              theme={theme}
              onFixError={handleFixError}
              isFixing={isFixing}
            />
          </Suspense>
        </div>
      )}

      {viewMode === ViewMode.Split && (
        <div
          onMouseDown={startDrag}
          onDoubleClick={snapToDefault}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor panels"
          className="w-1 shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors duration-150 relative group z-10"
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        </div>
      )}

      {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
        <div className="flex-1 flex flex-col bg-surface/50 relative overflow-hidden">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
              </div>
            }
          >
            <DiagramPreview
              code={code}
              onError={setError}
              theme={theme}
              customStyle={customStyle}
              onUpdateStyle={setCustomStyle}
              onElementClick={(text) => {
                setSelectionRequest({ text, ts: Date.now() });
                if (viewMode === ViewMode.Preview) setViewMode(ViewMode.Split);
              }}
            />
          </Suspense>
        </div>
      )}
    </div>

    {/* Copilot panel — right dock */}
    {isCopilotOpen && (
      <Suspense fallback={null}>
        <CopilotPanel
          projectId={activeProjectId}
          currentCode={code}
          onCodeUpdate={handleAIUpdate}
          versions={activeProject?.versions || []}
          onRestoreVersion={handleRestoreVersion}
          onSaveVersion={handleManualSnapshot}
          onSharePrompt={handleOpenPublishPrompt}
          externalPrompt={pendingPromptText || undefined}
          externalResultCode={pendingPromptResultCode}
          onConsumeExternalPrompt={consumeExternalPrompt}
        />
      </Suspense>
    )}
  </main>

  {/* Status bar (unchanged) */}
  <div
    className="h-[22px] border-t border-border bg-surface flex items-center shrink-0 select-none overflow-hidden"
    role="status"
    aria-label="Editor status"
  >
    <div className="w-1 self-stretch bg-primary shrink-0" />
    <div className="flex items-center gap-2 px-3 text-[11px] font-mono text-text-muted">
      {saveStatus === 'saving' ? (
        <>
          <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400 shrink-0" />
          <span className="text-amber-400 tracking-wide">SAVING</span>
        </>
      ) : (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="tracking-wide">SAVED</span>
        </>
      )}
      {lastSaved && (
        <span className="text-text-dim hidden sm:inline">
          {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
    <div className="flex-1" />
    <div className="flex items-center h-full text-[11px] font-mono text-text-dim">
      <span
        className="hidden md:flex items-center h-full px-3 border-l border-border hover:bg-surface-hover hover:text-text-muted cursor-default transition-colors"
        title="Open command palette"
      >
        ⌘K
      </span>
      <span
        className="hidden lg:flex items-center h-full px-3 border-l border-border hover:bg-surface-hover hover:text-text-muted cursor-default transition-colors"
        title="Keyboard shortcuts"
      >
        ?
      </span>
    </div>
  </div>

  {/* Delete confirmation dialog — keep exactly as-is from old EditorShell */}
  {pendingDeleteId && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setPendingDeleteId(null);
      }}
    >
      <div className="bg-surface border border-border rounded-xl shadow-md p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-lg font-bold text-text">
              Delete Project?
            </h3>
            <p className="text-sm text-text-muted mt-2">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => setPendingDeleteId(null)}
              autoFocus
              className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95 transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteProject}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* All modals */}
  <ModalRenderer
    auditReport={auditReport}
    isAuditing={isAuditing}
    isPublishing={isPublishing}
    publishData={publishData}
    setPublishData={setPublishData}
    submitPublish={submitPublish}
    pendingPromptText={pendingPromptText}
    pendingPromptResultCode={pendingPromptResultCode}
    consumeExternalPrompt={consumeExternalPrompt}
    onScanImage={() => setIsImageImportModalOpen(true)}
    onNavigate={setCurrentView}
    onNewProject={handleCreateProject}
    onExportPng={handleExportPng}
    onExportSvg={handleExportSvg}
    onShare={handleShare}
    onPublish={openPublishModal}
    onDuplicate={handleDuplicateDiagram}
    onAudit={handleAudit}
  />
</div>
```

Also update `useKeyboardShortcuts` call: replace `setIsAIChatExpanded` with `setIsCopilotOpen`.

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: Zero type errors

- [ ] **Step 3: Run full test suite**

```bash
bun run test:run
```

Expected: All 134+ tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/_components/EditorShell.tsx
git commit -m "refactor(editor): thin EditorShell layout grid, wire CommandBar/LeftPanel/CopilotPanel"
```

---

## Task 10: Cleanup — delete retired components and run final validation

**Files:**

- Delete: `components/Header.tsx`
- Delete: `components/Sidebar.tsx`
- Delete: `components/AIChat.tsx`
- Delete: `app/_components/ActivityBar.tsx`
- Check and update any remaining imports

- [ ] **Step 1: Delete retired files**

```bash
git rm components/Header.tsx components/Sidebar.tsx components/AIChat.tsx app/_components/ActivityBar.tsx
```

- [ ] **Step 2: Search for leftover imports**

```bash
grep -r "from.*Header\|from.*Sidebar\|from.*AIChat\|from.*ActivityBar" --include="*.ts" --include="*.tsx" .
```

Expected: Zero results (all have been replaced)

- [ ] **Step 3: Run full validation**

```bash
bun run validate
```

Expected: type-check PASS, lint PASS (zero warnings), all tests PASS

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "chore(editor): remove retired Header, Sidebar, AIChat, ActivityBar components"
```

---

## Self-Review Checklist

**Spec coverage:**

- [x] CommandBar replaces Header — same features, flat v2 design
- [x] LeftPanel merges ActivityBar + Sidebar — tab strip, collapsible
- [x] CopilotPanel replaces AIChat — right-docked, controlled by isCopilotOpen
- [x] ModalRenderer replaces 7 inline modal blocks
- [x] useSplitPane — persistence, clamp, snap
- [x] useExportHandlers — extracted from EditorShell
- [x] usePublishFlow — extracted from EditorShell
- [x] UIContext updated — isCopilotOpen added, legacy aliases removed
- [x] EditorShell — thin layout shell
- [x] v2 design applied: no backdrop-blur, no shadow-2xl, no rounded-2xl on dropdowns

**No placeholders:** All code in hooks and ModalRenderer is complete. CommandBar/LeftPanel/CopilotPanel tasks reference source files to read + enumerate exact changes; the subagent has enough instruction to implement without ambiguity.

**Type consistency:** `isCopilotOpen` used consistently across UIContext, useKeyboardShortcuts, EditorShell, CopilotPanel. `useSplitPane` returns `{ splitPercent, setSplitPercent, snapToDefault, startDrag, containerRef }` — all referenced by those exact names in EditorShell Task 9.
