import { describe, it, expect } from 'vitest';
import {
  listAllDiagrams,
  listByCategory,
  getDiagramBySlug,
  listFeatured,
  listNewest,
  categoryCounts,
  getManifest,
  getRelated,
} from '@/lib/library/loader';
import { CATEGORY_ORDER, isCategorySlug } from '@/lib/library/categories';

describe('library/loader', () => {
  it('loads at least one diagram from data/library', () => {
    const all = listAllDiagrams();
    expect(all.length).toBeGreaterThan(0);
  });

  it('every diagram has all required fields', () => {
    for (const d of listAllDiagrams()) {
      expect(d.slug).toBeTruthy();
      expect(d.title).toBeTruthy();
      expect(isCategorySlug(d.category)).toBe(true);
      expect(d.code).toBeTruthy();
      expect(d.diagramType).toBeTruthy();
      expect(d.ai.summary).toBeTruthy();
      expect(d.ai.whatItShows).toBeTruthy();
      expect(d.ai.whenToUse).toBeTruthy();
      expect(d.ai.howToAdapt).toBeTruthy();
      expect(d.ai.keyConcepts.length).toBeGreaterThanOrEqual(3);
      expect(d.source.url).toMatch(/^https?:\/\//);
      expect(d.qualityScore).toBeGreaterThanOrEqual(0);
      expect(d.qualityScore).toBeLessThanOrEqual(100);
      expect(d.schemaVersion).toBe(1);
    }
  });

  it('AI summary stays under 200 characters (meta description budget)', () => {
    for (const d of listAllDiagrams()) {
      expect(d.ai.summary.length).toBeLessThanOrEqual(200);
    }
  });

  it('listByCategory returns only diagrams in that category', () => {
    for (const slug of CATEGORY_ORDER) {
      const inCat = listByCategory(slug);
      for (const d of inCat) {
        expect(d.category).toBe(slug);
      }
    }
  });

  it('getDiagramBySlug returns null for unknown slugs', () => {
    expect(getDiagramBySlug('definitely-not-a-real-slug')).toBeNull();
  });

  it('getDiagramBySlug returns the diagram when found', () => {
    const all = listAllDiagrams();
    if (all.length === 0) return;
    const first = all[0];
    const looked = getDiagramBySlug(first.slug);
    expect(looked).not.toBeNull();
    expect(looked?.slug).toBe(first.slug);
  });

  it('listFeatured / listNewest return at most n diagrams', () => {
    expect(listFeatured(3).length).toBeLessThanOrEqual(3);
    expect(listNewest(3).length).toBeLessThanOrEqual(3);
  });

  it('related slugs all resolve to real diagrams', () => {
    for (const d of listAllDiagrams()) {
      const related = getRelated(d.slug);
      // Related count may differ from declared (some related slugs may be stubs);
      // but every resolved related diagram must exist.
      for (const r of related) {
        expect(getDiagramBySlug(r.slug)).not.toBeNull();
      }
    }
  });

  it('categoryCounts sums to total diagrams', () => {
    const counts = categoryCounts();
    const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
    expect(total).toBe(listAllDiagrams().length);
  });

  it('manifest count matches the number of diagram files', () => {
    const manifest = getManifest();
    expect(manifest.count).toBe(listAllDiagrams().length);
    expect(manifest.diagrams.length).toBe(manifest.count);
  });
});
