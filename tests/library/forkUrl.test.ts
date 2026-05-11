import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildForkUrl } from '@/lib/library/forkUrl';
import { decodeCodeFromUrl } from '@/utils/url';

describe('library/forkUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produces a URL with #<lz-encoded> hash that round-trips through decodeCodeFromUrl', () => {
    const code = 'flowchart LR\n    A[Start] --> B[End]';
    const url = buildForkUrl(code);
    expect(url).toContain('#');
    const hash = url.split('#')[1];
    expect(hash).toBeTruthy();
    const decoded = decodeCodeFromUrl(hash);
    expect(decoded).toBe(code);
  });

  it('uses window.location.origin when available', () => {
    const code = 'graph LR\n  A --> B';
    const url = buildForkUrl(code);
    expect(url.startsWith(window.location.origin)).toBe(true);
  });
});
