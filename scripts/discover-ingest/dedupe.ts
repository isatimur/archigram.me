/**
 * Stage 6: dedupe candidates by exact and near-duplicate hash.
 *
 * Strategy:
 *   1. Exact dedup by SHA-256 of the normalised mermaid code (computed in stage 1
 *      and stored as `hash`). The first record we see for each hash wins.
 *   2. Near-dup clustering by SHA-256 of the first 50 normalised lines —
 *      enough to catch forks that share the same diagram skeleton but maybe
 *      tweak a label or two. Among each cluster, the entry with the highest
 *      star count wins.
 *
 * TODO: replace the heuristic with an embedding-similarity clustering pass
 * once we have a cheap embeddings provider wired up.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, getString } from './lib/cli';
import {
  ensureDir,
  listJson,
  normalizeMermaidForHash,
  readJson,
  sha256,
  writeJson,
} from './lib/util';
import type { DedupedCandidate, ValidatedCandidate } from './lib/types';

/**
 * Hash a "skeleton" view of the diagram — the first ~5 structural lines,
 * normalised. Two diagrams that share this skeleton are treated as
 * near-duplicates, which is intentionally aggressive for forks where the
 * second author added a couple trailing nodes onto an upstream diagram.
 */
function nearHash(code: string): string {
  const head = code.split('\n').slice(0, 5).join('\n');
  return sha256(normalizeMermaidForHash(head));
}

async function main(): Promise<void> {
  const args = parseArgs();
  const inputDir = getString(args, 'input', 'tmp/library-ingest/stages/5-validated');
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/6-deduped');

  if (!existsSync(inputDir)) {
    console.error(`[stage 6] input dir not found: ${inputDir}`);
    process.exit(1);
  }

  ensureDir(outputDir);

  const exact = new Map<string, ValidatedCandidate>();
  for (const path of listJson(inputDir)) {
    const rec = readJson<ValidatedCandidate>(path);
    const prev = exact.get(rec.hash);
    if (!prev || (rec.stars ?? 0) > (prev.stars ?? 0)) {
      exact.set(rec.hash, rec);
    }
  }
  const exactCount = exact.size;

  // Near-dup clustering
  const clusters = new Map<string, ValidatedCandidate>();
  for (const rec of exact.values()) {
    const nh = nearHash(rec.mermaidCode);
    const prev = clusters.get(nh);
    if (!prev || (rec.stars ?? 0) > (prev.stars ?? 0)) {
      clusters.set(nh, rec);
    }
  }

  let written = 0;
  for (const rec of clusters.values()) {
    const out: DedupedCandidate = rec;
    writeJson(join(outputDir, `${rec.hash}.json`), out);
    written++;
  }

  console.log(
    `[stage 6] exact-dedup=${exactCount} near-dedup=${written} (dropped ${exactCount - written} near-dupes)`
  );
  console.log(`[stage 6] wrote ${written} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 6] failed:', err);
    process.exit(1);
  });
}
