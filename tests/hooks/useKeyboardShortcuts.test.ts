import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.ts';

const makeOptions = (overrides = {}) => ({
  currentView: 'app' as const,
  isPublishModalOpen: false,
  isImageImportModalOpen: false,
  isAuditModalOpen: false,
  isCommandPaletteOpen: false,
  isShortcutsModalOpen: false,
  setCurrentView: vi.fn(),
  setIsCopilotOpen: vi.fn(),
  setIsCommandPaletteOpen: vi.fn(),
  setIsPublishModalOpen: vi.fn(),
  setIsImageImportModalOpen: vi.fn(),
  setIsAuditModalOpen: vi.fn(),
  setIsShortcutsModalOpen: vi.fn(),
  handleCreateProject: vi.fn(),
  handleExportPng: vi.fn(),
  handleExportSvg: vi.fn(),
  handleDuplicateDiagram: vi.fn(),
  handleShare: vi.fn(),
  openPublishModal: vi.fn(),
  ...overrides,
});

const fireKey = (key: string, extra: Partial<KeyboardEventInit> = {}) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
};

const fireMod = (key: string, extra: Partial<KeyboardEventInit> = {}) => {
  // Simulate Ctrl (non-Mac) for test environment
  fireKey(key, { ctrlKey: true, ...extra });
};

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // jsdom navigator.platform is empty string — ctrlKey is the mod key
    Object.defineProperty(navigator, 'platform', { value: '', configurable: true });
  });

  it('calls handleShare on Ctrl+Shift+S', () => {
    const opts = makeOptions();
    renderHook(() => useKeyboardShortcuts(opts));
    fireMod('S', { shiftKey: true });
    expect(opts.handleShare).toHaveBeenCalledOnce();
  });

  it('calls setIsShortcutsModalOpen(true) on ?', () => {
    const opts = makeOptions();
    renderHook(() => useKeyboardShortcuts(opts));
    fireKey('?');
    expect(opts.setIsShortcutsModalOpen).toHaveBeenCalledWith(true);
  });

  it('does not call setIsShortcutsModalOpen on Ctrl+?', () => {
    const opts = makeOptions();
    renderHook(() => useKeyboardShortcuts(opts));
    fireKey('?', { ctrlKey: true });
    expect(opts.setIsShortcutsModalOpen).not.toHaveBeenCalled();
  });

  it('closes shortcuts modal on Escape when open', () => {
    const opts = makeOptions({ isShortcutsModalOpen: true });
    renderHook(() => useKeyboardShortcuts(opts));
    fireKey('Escape');
    expect(opts.setIsShortcutsModalOpen).toHaveBeenCalledWith(false);
  });

  it('does not fire shortcuts when target is a textarea', () => {
    const opts = makeOptions();
    renderHook(() => useKeyboardShortcuts(opts));
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    document.body.removeChild(textarea);
    expect(opts.setIsShortcutsModalOpen).not.toHaveBeenCalled();
  });
});
