/**
 * Shared types for the discover-ingest pipeline.
 *
 * Each stage takes records of one shape, produces records of the next shape,
 * and the orchestrator stitches them together via JSON files on disk.
 */

import type {
  CategorySlug,
  DiagramType,
  LibraryDiagram,
  LibrarySourceType,
} from '../../../lib/library/types';

/**
 * Output of stages 1-4 (the four fetchers).
 *
 * `hash` is a deterministic SHA-256 of the trimmed mermaid code — used as the
 * on-disk filename and as the dedupe key in stage 6.
 */
export type RawCandidate = {
  hash: string;
  sourceType: LibrarySourceType;
  sourceUrl: string;
  repo?: string;
  licenseSpdx?: string;
  licenseUnknown?: boolean;
  stars?: number;
  mermaidCode: string;
  rawContext?: string;
  fetchedAt: string;
};

/**
 * Output of stage 5 (validation/render).
 */
export type ValidatedCandidate = RawCandidate & {
  renderSucceeded: true;
  nodeCount: number;
  edgeCount: number;
  byteSize: number;
  svgWidth?: number;
  svgHeight?: number;
};

/**
 * Output of stage 6 (dedupe). Same shape as ValidatedCandidate — the file is
 * just smaller because dupes were dropped.
 */
export type DedupedCandidate = ValidatedCandidate;

/**
 * Output of stage 7 (scoring).
 */
export type ScoredCandidate = DedupedCandidate & {
  qualityScore: number;
  scoreBreakdown: {
    stars: number;
    recency: number;
    complexity: number;
    sourcePrior: number;
  };
};

/**
 * Output of stage 8 (AI enrichment). At this point the record has enough info
 * to produce a `LibraryDiagram` later; the only thing missing is the rendered
 * SVG (stage 9).
 */
export type EnrichedCandidate = ScoredCandidate & {
  slug: string;
  title: string;
  category: CategorySlug;
  diagramType: DiagramType;
  summary: string;
  whatItShows: string;
  whenToUse: string;
  howToAdapt: string;
  keyConcepts: string[];
  tags: string[];
  aiFallback: boolean;
  aiFailureReason?: string;
};

/**
 * Output of stage 9 (SVG render). Now has everything needed to assemble a
 * full LibraryDiagram via `toLibraryDiagram()`.
 */
export type RenderedCandidate = EnrichedCandidate & {
  previewSvg: string;
  previewWidth: number;
  previewHeight: number;
};

/**
 * Stage 1-4 fixture format (matches RawCandidate shape but allows a hash to
 * be optionally omitted — the loader computes it if missing).
 */
export type RawFixture = Omit<RawCandidate, 'hash'> & { hash?: string };

/**
 * Convert a fully-enriched + rendered candidate into the final on-disk
 * LibraryDiagram schema that the loader expects.
 */
export function toLibraryDiagram(c: RenderedCandidate): LibraryDiagram {
  return {
    slug: c.slug,
    title: c.title,
    category: c.category,
    diagramType: c.diagramType,
    code: c.mermaidCode,
    preview: {
      svg: c.previewSvg,
      width: c.previewWidth,
      height: c.previewHeight,
    },
    ogImagePath: '/og-image.png',
    source: {
      url: c.sourceUrl,
      sourceType: c.sourceType,
      repo: c.repo,
      license: c.licenseSpdx,
      stars: c.stars,
      fetchedAt: c.fetchedAt,
    },
    attribution: {
      author: c.repo ? c.repo.split('/')[0] : undefined,
      authorUrl: c.repo ? `https://github.com/${c.repo.split('/')[0]}` : undefined,
    },
    ai: {
      summary: c.summary,
      whatItShows: c.whatItShows,
      whenToUse: c.whenToUse,
      howToAdapt: c.howToAdapt,
      keyConcepts: c.keyConcepts,
      fallback: c.aiFallback,
    },
    related: [],
    tags: c.tags,
    qualityScore: c.qualityScore,
    ingestedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}
