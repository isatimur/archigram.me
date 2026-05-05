import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSplitPane } from '@/hooks/useSplitPane';

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

  it('setSplitPercent clamps and persists 50', () => {
    const { result } = renderHook(() => useSplitPane(35, STORAGE_KEY));
    act(() => result.current.setSplitPercent(50));
    expect(result.current.splitPercent).toBe(50);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('50');
  });
});
