import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppRouter } from '@/hooks/useAppRouter';

describe('useAppRouter', () => {
  beforeEach(() => {
    window.location.hash = '';
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('defaults to landing when no hash and no stored projects', () => {
    const { result } = renderHook(() => useAppRouter());
    expect(result.current.currentView).toBe('landing');
  });

  it('reads a valid view from the URL hash on mount', async () => {
    window.location.hash = '#gallery';
    const { result } = renderHook(() => useAppRouter());
    await waitFor(() => expect(result.current.currentView).toBe('gallery'));
  });

  it('falls back to app view when projects exist in localStorage', async () => {
    localStorage.setItem('archigram_projects', JSON.stringify([{ id: '1' }]));
    const { result } = renderHook(() => useAppRouter());
    await waitFor(() => expect(result.current.currentView).toBe('app'));
  });

  it('ignores unknown hash values and falls back gracefully', async () => {
    window.location.hash = '#unknown-route';
    const { result } = renderHook(() => useAppRouter());
    await waitFor(() => expect(result.current.currentView).toBe('landing'));
  });

  it('setCurrentView updates state and pushes to history', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useAppRouter());
    act(() => {
      result.current.setCurrentView('docs');
    });
    expect(result.current.currentView).toBe('docs');
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#docs');
  });

  it('handles all valid AppView values without throwing', () => {
    const views = [
      'landing',
      'app',
      'plantuml',
      'bpmn',
      'docs',
      'gallery',
      'discover',
      'prompts',
      'faq',
      'privacy',
      'terms',
      'license',
      'profile',
    ] as const;
    const { result } = renderHook(() => useAppRouter());
    for (const view of views) {
      act(() => {
        result.current.setCurrentView(view);
      });
      expect(result.current.currentView).toBe(view);
    }
  });

  it('responds to popstate events (browser back/forward)', () => {
    const { result } = renderHook(() => useAppRouter());
    act(() => {
      window.location.hash = '#prompts';
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    expect(result.current.currentView).toBe('prompts');
  });
});
