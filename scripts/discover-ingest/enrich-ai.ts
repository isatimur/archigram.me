/**
 * Stage 8: enrich scored candidates with AI-generated commentary.
 *
 * Uses Gemini 2.5 Flash with structured output to produce a JSON record per
 * candidate. Falls back to a deterministic stub when:
 *   - `--dry-run` is passed, OR
 *   - `GEMINI_API_KEY` is unset, OR
 *   - Gemini fails 3× with exponential backoff.
 *
 * Records are written by slug; on slug collisions we suffix the second one
 * with `-2`, `-3`, etc. This is the first stage that produces slug-keyed files
 * (downstream stages and the orchestrator-produce final on-disk JSON use the
 * slug as the filename).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, getString, getNumber, getBool } from './lib/cli';
import { ensureDir, listJson, readJson, writeJson } from './lib/util';
import { enrichViaGemini, enrichViaStub } from './lib/ai';
import type { EnrichedCandidate, ScoredCandidate } from './lib/types';

async function main(): Promise<void> {
  const args = parseArgs();
  const inputDir = getString(args, 'input', 'tmp/library-ingest/stages/7-scored');
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/8-enriched');
  const limit = getNumber(args, 'limit', 300);
  const dryRun = getBool(args, 'dry-run') || !process.env.GEMINI_API_KEY;

  if (!existsSync(inputDir)) {
    console.error(`[stage 8] input dir not found: ${inputDir}`);
    process.exit(1);
  }
  ensureDir(outputDir);

  const records = listJson(inputDir).map((p) => readJson<ScoredCandidate>(p));
  records.sort((a, b) => b.qualityScore - a.qualityScore);
  const subset = records.slice(0, limit);

  if (dryRun) {
    console.log('[stage 8] running in stub mode (no Gemini calls)');
  } else {
    console.log('[stage 8] running with live Gemini calls');
  }

  const usedSlugs = new Set<string>();
  let okCount = 0;
  let stubCount = 0;

  for (const rec of subset) {
    const result = dryRun
      ? enrichViaStub({ mermaidCode: rec.mermaidCode, rawContext: rec.rawContext, repo: rec.repo })
      : await enrichViaGemini({
          mermaidCode: rec.mermaidCode,
          rawContext: rec.rawContext,
          repo: rec.repo,
        });

    // Resolve slug collisions
    let slug = result.slug || `diagram-${rec.hash.slice(0, 8)}`;
    if (usedSlugs.has(slug)) {
      let suffix = 2;
      while (usedSlugs.has(`${slug}-${suffix}`)) suffix++;
      slug = `${slug}-${suffix}`;
    }
    usedSlugs.add(slug);

    const out: EnrichedCandidate = {
      ...rec,
      slug,
      title: result.title,
      category: result.category,
      diagramType: result.diagramType,
      summary: result.summary,
      whatItShows: result.whatItShows,
      whenToUse: result.whenToUse,
      howToAdapt: result.howToAdapt,
      keyConcepts: result.keyConcepts,
      tags: result.tags,
      aiFallback: result.fallback,
      aiFailureReason: result.failureReason,
    };
    writeJson(join(outputDir, `${slug}.json`), out);
    if (result.fallback) stubCount++;
    else okCount++;
  }

  console.log(
    `[stage 8] enriched ${okCount + stubCount} records (ai_ok=${okCount} ai_fallback=${stubCount}) → ${outputDir}`
  );
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 8] failed:', err);
    process.exit(1);
  });
}
