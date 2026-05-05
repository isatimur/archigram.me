import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportHandlers } from '@/hooks/useExportHandlers';
import { toast } from 'sonner';

vi.mock('sonner');
vi.mock('@/utils/analytics');

describe('useExportHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(toast.error).toHaveBeenCalledWith('Export failed: No diagram found');
  });
});
