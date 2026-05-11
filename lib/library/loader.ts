import type { CategorySlug, LibraryDiagram, LibraryManifest, LibraryManifestEntry } from './types';

// Eagerly import all library JSON files at build time. Vite's import.meta.glob
// inlines the JSON, so this works in both the SSG build and the SPA runtime.
const diagramModules = import.meta.glob<LibraryDiagram>('@/data/library/*.json', {
  eager: true,
  import: 'default',
});

const manifestModule = import.meta.glob<LibraryManifest>('@/data/library/_manifest.json', {
  eager: true,
  import: 'default',
});

function getRecord(): Record<string, LibraryDiagram> {
  const out: Record<string, LibraryDiagram> = {};
  for (const [path, mod] of Object.entries(diagramModules)) {
    // Skip the manifest file (matches the *.json glob)
    if (path.endsWith('_manifest.json')) continue;
    const diagram = mod as LibraryDiagram;
    if (diagram?.slug) out[diagram.slug] = diagram;
  }
  return out;
}

let recordCache: Record<string, LibraryDiagram> | null = null;

function record(): Record<string, LibraryDiagram> {
  if (!recordCache) recordCache = getRecord();
  return recordCache;
}

export function getManifest(): LibraryManifest {
  const entry = Object.values(manifestModule)[0] as LibraryManifest | undefined;
  if (entry) return entry;
  // Synthesize a manifest if the file is missing — useful in early dev.
  const diagrams = Object.values(record()).map<LibraryManifestEntry>((d) => ({
    slug: d.slug,
    title: d.title,
    category: d.category,
    diagramType: d.diagramType,
    qualityScore: d.qualityScore,
    ingestedAt: d.ingestedAt,
    tags: d.tags,
  }));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    count: diagrams.length,
    diagrams,
  };
}

export function listAllDiagrams(): LibraryDiagram[] {
  return Object.values(record()).sort((a, b) => b.qualityScore - a.qualityScore);
}

export function listByCategory(category: CategorySlug): LibraryDiagram[] {
  return listAllDiagrams().filter((d) => d.category === category);
}

export function getDiagramBySlug(slug: string): LibraryDiagram | null {
  return record()[slug] ?? null;
}

export function listFeatured(n = 6): LibraryDiagram[] {
  return listAllDiagrams().slice(0, n);
}

export function listNewest(n = 6): LibraryDiagram[] {
  return [...listAllDiagrams()]
    .sort((a, b) => b.ingestedAt.localeCompare(a.ingestedAt))
    .slice(0, n);
}

export function getRelated(slug: string): LibraryDiagram[] {
  const diagram = getDiagramBySlug(slug);
  if (!diagram) return [];
  return diagram.related
    .map((relSlug) => getDiagramBySlug(relSlug))
    .filter((d): d is LibraryDiagram => d !== null);
}

/**
 * Per-category counts for index pages and navigation.
 */
export function categoryCounts(): Record<CategorySlug, number> {
  const counts: Partial<Record<CategorySlug, number>> = {};
  for (const d of listAllDiagrams()) {
    counts[d.category] = (counts[d.category] ?? 0) + 1;
  }
  return counts as Record<CategorySlug, number>;
}
