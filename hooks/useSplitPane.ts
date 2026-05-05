import { useState, useCallback, useRef, useEffect, RefObject } from 'react';

export type UseSplitPaneReturn = {
  splitPercent: number;
  setSplitPercent: (pct: number) => void;
  snapToDefault: () => void;
  startDrag: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
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
