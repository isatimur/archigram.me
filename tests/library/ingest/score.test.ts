import { describe, expect, it } from 'vitest';
import { computeScore } from '../../../scripts/discover-ingest/score';

describe('score — computeScore', () => {
  const baseFetched = new Date().toISOString();

  it('produces an integer in [0, 100]', () => {
    const out = computeScore({
      stars: 100,
      fetchedAt: baseFetched,
      nodeCount: 10,
      edgeCount: 12,
      sourceType: 'github-readme',
    });
    expect(Number.isInteger(out.qualityScore)).toBe(true);
    expect(out.qualityScore).toBeGreaterThanOrEqual(0);
    expect(out.qualityScore).toBeLessThanOrEqual(100);
  });

  it('mermaid-docs source ranks higher than github-gist on identical content', () => {
    const docs = computeScore({
      stars: 100,
      fetchedAt: baseFetched,
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'mermaid-docs',
    });
    const gist = computeScore({
      stars: 100,
      fetchedAt: baseFetched,
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'github-gist',
    });
    expect(docs.qualityScore).toBeGreaterThan(gist.qualityScore);
    expect(docs.breakdown.sourcePrior).toBe(25);
    expect(gist.breakdown.sourcePrior).toBe(10);
  });

  it('rewards more stars (monotonic non-decreasing on stars)', () => {
    const low = computeScore({
      stars: 1,
      fetchedAt: baseFetched,
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'github-readme',
    });
    const high = computeScore({
      stars: 50_000,
      fetchedAt: baseFetched,
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'github-readme',
    });
    expect(high.qualityScore).toBeGreaterThan(low.qualityScore);
    expect(high.breakdown.stars).toBeGreaterThan(low.breakdown.stars);
  });

  it('rewards more complexity up to the cap', () => {
    const simple = computeScore({
      stars: 100,
      fetchedAt: baseFetched,
      nodeCount: 5,
      edgeCount: 3,
      sourceType: 'github-readme',
    });
    const complex = computeScore({
      stars: 100,
      fetchedAt: baseFetched,
      nodeCount: 80,
      edgeCount: 100,
      sourceType: 'github-readme',
    });
    expect(complex.qualityScore).toBeGreaterThan(simple.qualityScore);
    expect(complex.breakdown.complexity).toBeLessThanOrEqual(25);
  });

  it('caps the total at 100 for maximum inputs', () => {
    const huge = computeScore({
      stars: 1_000_000,
      fetchedAt: baseFetched,
      nodeCount: 200,
      edgeCount: 200,
      sourceType: 'mermaid-docs',
    });
    expect(huge.qualityScore).toBeLessThanOrEqual(100);
  });

  it('discounts old fetch timestamps', () => {
    const fresh = computeScore({
      stars: 100,
      fetchedAt: new Date().toISOString(),
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'github-readme',
    });
    const old = computeScore({
      stars: 100,
      fetchedAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      nodeCount: 8,
      edgeCount: 10,
      sourceType: 'github-readme',
    });
    expect(fresh.breakdown.recency).toBeGreaterThanOrEqual(old.breakdown.recency);
  });
});
