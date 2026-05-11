/**
 * Stage 7: score candidates by source quality, popularity, freshness, and complexity.
 *
 * Formula (all caps at 25, total clamped to [0, 100]):
 *   qualityScore = stars + recency + complexity + sourcePrior
 *
 * Source priors:
 *   mermaid-docs   = 25  (canonical, guaranteed-rendering examples)
 *   awesome-list   = 20  (human-curated)
 *   github-readme  = 15  (popular but heterogeneous)
 *   github-gist    = 10  (least-curated)
 *   editorial      = 25  (hand-seeded, treated identically to mermaid-docs here)
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, getString } from './lib/cli';
import { ensureDir, listJson, readJson, writeJson } from './lib/util';
import type { DedupedCandidate, ScoredCandidate } from './lib/types';
import type { LibrarySourceType } from '../../lib/library/types';

const SOURCE_PRIORS: Record<LibrarySourceType, number> = {
  'mermaid-docs': 25,
  'awesome-list': 20,
  'github-readme': 15,
  'github-gist': 10,
  editorial: 25,
};

const NOW_MS = Date.now();
const RECENCY_BUCKET_DAYS = 30;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeScore(input: {
  stars?: number;
  fetchedAt: string;
  nodeCount: number;
  edgeCount: number;
  sourceType: LibrarySourceType;
}): {
  qualityScore: number;
  breakdown: { stars: number; recency: number; complexity: number; sourcePrior: number };
} {
  const starsScore = clamp(Math.log10((input.stars ?? 0) + 1) * 12.5, 0, 25);
  const fetched = Date.parse(input.fetchedAt);
  const daysOld = Number.isFinite(fetched)
    ? Math.max(0, (NOW_MS - fetched) / (1000 * 60 * 60 * 24))
    : 0;
  const recencyScore = clamp(25 - daysOld / RECENCY_BUCKET_DAYS, 0, 25);
  const complexityScore = clamp(Math.log(input.nodeCount + input.edgeCount + 1) * 5, 0, 25);
  const sourcePrior = SOURCE_PRIORS[input.sourceType] ?? 10;

  const total = clamp(starsScore + recencyScore + complexityScore + sourcePrior, 0, 100);
  return {
    qualityScore: Math.round(total),
    breakdown: {
      stars: Math.round(starsScore),
      recency: Math.round(recencyScore),
      complexity: Math.round(complexityScore),
      sourcePrior,
    },
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const inputDir = getString(args, 'input', 'tmp/library-ingest/stages/6-deduped');
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/7-scored');

  if (!existsSync(inputDir)) {
    console.error(`[stage 7] input dir not found: ${inputDir}`);
    process.exit(1);
  }
  ensureDir(outputDir);

  const records: ScoredCandidate[] = [];
  for (const path of listJson(inputDir)) {
    const rec = readJson<DedupedCandidate>(path);
    const { qualityScore, breakdown } = computeScore({
      stars: rec.stars,
      fetchedAt: rec.fetchedAt,
      nodeCount: rec.nodeCount,
      edgeCount: rec.edgeCount,
      sourceType: rec.sourceType,
    });
    records.push({ ...rec, qualityScore, scoreBreakdown: breakdown });
  }

  // Global descending sort so downstream stages can `slice(0, N)` for the top set.
  records.sort((a, b) => b.qualityScore - a.qualityScore);

  for (const rec of records) {
    writeJson(join(outputDir, `${rec.hash}.json`), rec);
  }
  console.log(`[stage 7] wrote ${records.length} records → ${outputDir}`);
  if (records.length > 0) {
    console.log(
      `  top score: ${records[0].qualityScore}, bottom: ${records[records.length - 1].qualityScore}`
    );
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 7] failed:', err);
    process.exit(1);
  });
}
