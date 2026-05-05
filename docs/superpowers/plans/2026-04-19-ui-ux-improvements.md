# UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix six targeted UI/UX issues identified by a ui-ux-pro-max audit: viewport height on mobile, skip link for keyboard a11y, z-index inconsistency, missing press feedback, status bar font size, and missing reduced-motion support.

**Architecture:** All changes are isolated to CSS (globals.css), layout (layout.tsx), the editor shell (EditorShell.tsx), and the header (Header.tsx). No new components, no new dependencies.

**Tech Stack:** Next.js 15, React 19, Tailwind v4, TypeScript

---

## Task 1: Fix viewport height on mobile (`h-screen` → `min-h-dvh`)

**Files:**

- Modify: `app/_components/EditorShell.tsx` — line 504

`h-screen` maps to `height: 100vh`, which on mobile browsers includes the browser chrome (address bar), causing the bottom of the editor to be hidden. `min-h-dvh` uses the dynamic viewport height unit which accounts for collapsible browser chrome.

- [ ] **Step 1: Open `app/_components/EditorShell.tsx` and find line 504**

Current code:

```tsx
<div
  className="h-screen w-screen flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
  style={appStyle}
>
```

- [ ] **Step 2: Replace `h-screen w-screen` with `min-h-dvh w-full`**

```tsx
<div
  className="min-h-dvh w-full flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
  style={appStyle}
>
```

Why `w-full` instead of `w-screen`: `w-screen` = `100vw` which includes scrollbar width and can cause horizontal overflow. `w-full` = `100%` of parent, which is correct here.

- [ ] **Step 3: Run type-check to confirm no errors**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/_components/EditorShell.tsx
git commit -m "fix(editor): replace h-screen/w-screen with min-h-dvh/w-full for mobile viewport"
```

---

## Task 2: Add skip link for keyboard accessibility

**Files:**

- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/_components/EditorShell.tsx` — add `id="main"` to main content area

A skip link lets keyboard users jump past the activity bar and sidebar directly to the editor. It's visually hidden by default and appears on focus.

- [ ] **Step 1: Add skip link styles to `app/globals.css`**

Add after the `body` block (after line 85):

```css
/* Skip link for keyboard accessibility */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: 8px 16px;
  background: rgb(var(--primary));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  z-index: 9999;
  border-radius: 0 0 6px 0;
  text-decoration: none;
  transition: top 0.1s;
}
.skip-link:focus {
  top: 0;
}
```

- [ ] **Step 2: Add skip link to `app/layout.tsx`**

Current `<body>` (line 52):

```tsx
<body>
  <AuthProvider>
    {/* Redirect old hash-based bookmarks to clean URLs */}
    <LegacyHashRouter />
    {children}
    <Toaster richColors position="bottom-right" />
  </AuthProvider>
</body>
```

Replace with:

```tsx
<body>
  <a href="#main" className="skip-link">
    Skip to editor
  </a>
  <AuthProvider>
    {/* Redirect old hash-based bookmarks to clean URLs */}
    <LegacyHashRouter />
    {children}
    <Toaster richColors position="bottom-right" />
  </AuthProvider>
</body>
```

- [ ] **Step 3: Add `id="main"` to the main content area in `app/_components/EditorShell.tsx`**

Find the div that wraps CodeEditor and DiagramPreview (the main content flex container). It is the inner `flex flex-1` div around the split pane, approximately at line 625. It looks like:

```tsx
<div className="flex flex-1 overflow-hidden" ref={splitContainerRef}>
```

Add `id="main"` to it:

```tsx
<div id="main" className="flex flex-1 overflow-hidden" ref={splitContainerRef}>
```

- [ ] **Step 4: Run lint to confirm no issues**

```bash
bun run lint
```

Expected: no errors or warnings.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css app/_components/EditorShell.tsx
git commit -m "feat(a11y): add skip-to-editor link for keyboard navigation"
```

---

## Task 3: Normalize embed modal z-index

**Files:**

- Modify: `components/Header.tsx` — line 675

The embed modal uses `z-[200]` while every other modal in the codebase uses `z-50`. Since it is a `fixed` element it breaks out of any stacking context, so `z-50` is sufficient to appear above all other UI.

- [ ] **Step 1: Open `components/Header.tsx` and find line 675**

Current:

```tsx
className =
  'fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4';
```

- [ ] **Step 2: Replace `z-[200]` with `z-50`**

```tsx
className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4';
```

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "fix(header): normalize embed modal z-index from z-[200] to z-50"
```

---

## Task 4: Add press feedback (`active:scale-95`) to primary action buttons

**Files:**

- Modify: `components/Header.tsx` — Publish button (~line 484), Share button, export buttons
- Modify: `app/_components/EditorShell.tsx` — delete confirmation buttons (~line 766)

Press feedback gives tactile confirmation that a button was clicked. The theme picker already uses `scale-[0.98]` on active state — this extends the same pattern to all primary actions.

- [ ] **Step 1: Add `active:scale-95` to the Publish button in `components/Header.tsx`**

Find (~line 484):

```tsx
className =
  'hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all';
```

Replace with:

```tsx
className =
  'hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover active:scale-95 rounded-lg transition-all';
```

- [ ] **Step 2: Add `active:scale-95` to the Share button in `components/Header.tsx`**

Find the Share button (the one that toggles `showShareMenu`, ~line 496):

```tsx
className =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-lg transition-colors';
```

Replace with:

```tsx
className =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover active:scale-95 rounded-lg transition-colors';
```

- [ ] **Step 3: Add `active:scale-95` to the delete confirmation buttons in `app/_components/EditorShell.tsx`**

Find the Cancel button (~line 766):

```tsx
className =
  'flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-sm font-medium';
```

Replace with:

```tsx
className =
  'flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95 transition-all text-sm font-medium';
```

Find the Delete button (~line 772):

```tsx
className =
  'flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium shadow-lg shadow-red-500/20';
```

Replace with:

```tsx
className =
  'flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-medium shadow-lg shadow-red-500/20';
```

- [ ] **Step 4: Run lint**

```bash
bun run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx app/_components/EditorShell.tsx
git commit -m "feat(ux): add active:scale-95 press feedback to primary action buttons"
```

---

## Task 5: Fix status bar font size (`text-[10px]` → `text-[11px]`)

**Files:**

- Modify: `app/_components/EditorShell.tsx` — status bar section (~lines 704, 727)

`text-[10px]` is below the 12px minimum for body text. In a compact 22px IDE status bar, `text-[11px]` is a reasonable compromise that satisfies readability while keeping the VS Code-style density.

- [ ] **Step 1: Find and replace both `text-[10px]` instances in the status bar section of `app/_components/EditorShell.tsx`**

Find the save status container (~line 704):

```tsx
<div className="flex items-center gap-2 px-3 text-[10px] font-mono text-text-muted">
```

Replace with:

```tsx
<div className="flex items-center gap-2 px-3 text-[11px] font-mono text-text-muted">
```

Find the keyboard hint chips container (~line 727):

```tsx
<div className="flex items-center h-full text-[10px] font-mono text-text-dim">
```

Replace with:

```tsx
<div className="flex items-center h-full text-[11px] font-mono text-text-dim">
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/EditorShell.tsx
git commit -m "fix(editor): bump status bar font from 10px to 11px for readability"
```

---

## Task 6: Add `prefers-reduced-motion` support to keyframe animations

**Files:**

- Modify: `app/globals.css`

The `@keyframes fadeIn` and `@keyframes slideUp` animations (used by `animate-fade-in` and `animate-slide-up` on the delete dialog) must be disabled for users who have requested reduced motion via their OS settings.

- [ ] **Step 1: Add `prefers-reduced-motion` block to `app/globals.css`**

Add at the end of the file:

```css
/* Respect user's reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This catches all animations including Tailwind's built-in `animate-spin`, `animate-pulse`, and the custom `animate-fade-in` / `animate-slide-up` classes — without requiring changes to every component.

- [ ] **Step 2: Run type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(a11y): respect prefers-reduced-motion for all animations"
```

---

## Verification

After all tasks are complete, run the full validation suite:

```bash
bun run validate
```

Expected: type-check passes, lint passes (zero warnings), all tests pass.

Manual checks:

1. Open http://localhost:3009/editor — confirm no horizontal scroll on any screen width
2. Resize browser to 375px width — confirm editor fills viewport without clipping at bottom
3. Press Tab on the landing page — confirm "Skip to editor" link appears and functions
4. Click the Publish button — confirm it scales down on press
5. Click the Share button — confirm it scales down on press
6. Open DevTools → Rendering → Enable "Emulate CSS prefers-reduced-motion: reduce" — confirm no animations play
7. Open DevTools → Toggle device toolbar to iPhone 14 — confirm bottom of editor is visible and not clipped by browser chrome
