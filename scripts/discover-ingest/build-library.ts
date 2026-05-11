/**
 * Orchestrator for the discover-ingest pipeline.
 *
 * Runs stages 1→9 in sequence. In dry-run mode (default) it reads fixtures
 * under `scripts/discover-ingest/fixtures/` and writes output to
 * `tmp/library-ingest/`. In prod mode (`--prod`) it asserts the required env
 * vars are set, hits GitHub + Gemini, and finally copies the stage-9 records
 * into `data/library/`, suffixing the slug if the file already exists so the
 * hand-seeded canonical entries are never overwritten.
 *
 * Flags:
 *   --dry-run            run with fixture data (default)
 *   --prod               run live; requires GITHUB_TOKEN + GEMINI_API_KEY
 *   --limit=N            cap the number of records that reach AI enrichment
 *   --stages=1,2,…       run only the specified stages
 *   --output-dir=PATH    override root output directory
 *
 * Usage:
 *   bun run scripts/discover-ingest/build-library.ts --dry-run
 *   bun run scripts/discover-ingest/build-library.ts --prod --limit=100
 */

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, getString, getNumber, getBool, getList } from './lib/cli';
import {
  defaultDryRunRoot,
  defaultProdRoot,
  ensureDir,
  listJson,
  pipelinePaths,
  readJson,
  writeJson,
} from './lib/util';
import { toLibraryDiagram } from './lib/types';
import type { RenderedCandidate } from './lib/types';
import type {
  LibraryDiagram,
  LibraryManifest,
  LibraryManifestEntry,
} from '../../lib/library/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SELF_DIR = resolve(__dirname);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const FIXTURES_DIR = join(SELF_DIR, 'fixtures');

type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const ALL_STAGES: StageId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function shouldRun(stage: StageId, requested: number[]): boolean {
  if (requested.length === 0) return true;
  return requested.includes(stage);
}

async function runScript(relativePath: string, extraArgs: string[]): Promise<void> {
  const scriptPath = join(SELF_DIR, relativePath);
  const proc = Bun.spawn(['bun', 'run', scriptPath, ...extraArgs], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: process.env,
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`${relativePath} exited with code ${code}`);
  }
}

function writeManifest(libDir: string, diagrams: LibraryDiagram[]): void {
  const entries: LibraryManifestEntry[] = diagrams
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      category: d.category,
      diagramType: d.diagramType,
      qualityScore: d.qualityScore,
      ingestedAt: d.ingestedAt,
      tags: d.tags,
    }))
    .sort((a, b) => b.qualityScore - a.qualityScore);
  const manifest: LibraryManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    diagrams: entries,
  };
  writeFileSync(join(libDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
}

function uniqueSlug(libDir: string, baseSlug: string): string {
  if (!existsSync(join(libDir, `${baseSlug}.json`))) return baseSlug;
  let n = 2;
  while (existsSync(join(libDir, `${baseSlug}-${n}.json`))) n++;
  return `${baseSlug}-${n}`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const prod = getBool(args, 'prod');
  const dryRun = !prod || getBool(args, 'dry-run');
  const limit = getNumber(args, 'limit', 300);
  const stages = getList(args, 'stages')
    .map((s) => Number(s))
    .filter((n): n is StageId => Number.isInteger(n) && n >= 1 && n <= 9) as StageId[];
  const outputDirOverride = getString(args, 'output-dir', '');
  const root = outputDirOverride || (dryRun ? defaultDryRunRoot() : defaultDryRunRoot());
  // We still run stages into tmp/ in prod — only the FINAL copy goes to data/library.
  const paths = pipelinePaths(root);
  ensureDir(paths.stages);

  if (prod) {
    if (!process.env.GITHUB_TOKEN) {
      console.error('[orchestrator] --prod requires GITHUB_TOKEN');
      process.exit(1);
    }
    if (!process.env.GEMINI_API_KEY) {
      console.error('[orchestrator] --prod requires GEMINI_API_KEY');
      process.exit(1);
    }
  }

  console.log(`[orchestrator] mode=${prod ? 'prod' : 'dry-run'} root=${root}`);
  if (stages.length > 0) console.log(`[orchestrator] running only stages: ${stages.join(',')}`);

  // ---------------------------------------------------------------------------
  // Stages 1–4 (fetchers)
  // ---------------------------------------------------------------------------

  if (shouldRun(1, stages)) {
    const out = paths.stageDir(1);
    const extra = dryRun
      ? [`--fixtures=${join(FIXTURES_DIR, 'raw-github-code.json')}`, `--output=${out}`]
      : [`--output=${out}`, `--limit=200`];
    await runScript('fetch-github-code.ts', extra);
  }

  if (shouldRun(2, stages)) {
    const out = paths.stageDir(2);
    const extra = dryRun
      ? [`--fixtures=${join(FIXTURES_DIR, 'raw-gists.json')}`, `--output=${out}`]
      : [`--output=${out}`, `--limit=100`];
    await runScript('fetch-github-gists.ts', extra);
  }

  if (shouldRun(3, stages)) {
    const out = paths.stageDir(3);
    const extra = dryRun
      ? [`--fixtures=${join(FIXTURES_DIR, 'raw-awesome.json')}`, `--output=${out}`]
      : [`--output=${out}`];
    await runScript('fetch-awesome-lists.ts', extra);
  }

  if (shouldRun(4, stages)) {
    const out = paths.stageDir(4);
    const extra = dryRun
      ? [`--fixtures=${join(FIXTURES_DIR, 'raw-mermaid-docs.json')}`, `--output=${out}`]
      : [`--output=${out}`];
    await runScript('fetch-mermaid-docs.ts', extra);
  }

  // ---------------------------------------------------------------------------
  // Stage 5 (validate)
  // ---------------------------------------------------------------------------

  if (shouldRun(5, stages)) {
    const out = paths.stageDir(5);
    const inputs = [
      paths.stageDir(1),
      paths.stageDir(2),
      paths.stageDir(3),
      paths.stageDir(4),
    ].join(',');
    const extra = [`--inputs=${inputs}`, `--output=${out}`];
    if (dryRun) extra.push('--skip-render');
    await runScript('validate-render.ts', extra);
  }

  // ---------------------------------------------------------------------------
  // Stage 6 (dedupe)
  // ---------------------------------------------------------------------------

  if (shouldRun(6, stages)) {
    const inDir = paths.stageDir(5);
    const out = paths.stageDir(6);
    await runScript('dedupe.ts', [`--input=${inDir}`, `--output=${out}`]);
  }

  // ---------------------------------------------------------------------------
  // Stage 7 (score)
  // ---------------------------------------------------------------------------

  if (shouldRun(7, stages)) {
    const inDir = paths.stageDir(6);
    const out = paths.stageDir(7);
    await runScript('score.ts', [`--input=${inDir}`, `--output=${out}`]);
  }

  // ---------------------------------------------------------------------------
  // Stage 8 (AI enrich)
  // ---------------------------------------------------------------------------

  if (shouldRun(8, stages)) {
    const inDir = paths.stageDir(7);
    const out = paths.stageDir(8);
    const extra = [`--input=${inDir}`, `--output=${out}`, `--limit=${limit}`];
    if (dryRun) extra.push('--dry-run');
    await runScript('enrich-ai.ts', extra);
  }

  // ---------------------------------------------------------------------------
  // Stage 9 (render SVG)
  // ---------------------------------------------------------------------------

  if (shouldRun(9, stages)) {
    const inDir = paths.stageDir(8);
    const out = paths.stageDir(9);
    const extra = [`--input=${inDir}`, `--output=${out}`];
    if (dryRun) extra.push('--skip-render');
    await runScript('render-svg.ts', extra);
  }

  // ---------------------------------------------------------------------------
  // Final summary + (prod only) copy into data/library/
  // ---------------------------------------------------------------------------

  const fetched =
    listJson(paths.stageDir(1)).length +
    listJson(paths.stageDir(2)).length +
    listJson(paths.stageDir(3)).length +
    listJson(paths.stageDir(4)).length;
  const validated = listJson(paths.stageDir(5)).length;
  const deduped = listJson(paths.stageDir(6)).length;
  const scored = listJson(paths.stageDir(7)).length;
  const enriched = listJson(paths.stageDir(8)).length;
  const rendered = listJson(paths.stageDir(9)).length;

  console.log('\n=== Pipeline summary ===');
  console.log(`  Fetched (stages 1-4): ${fetched}`);
  console.log(`  Validated (stage 5):  ${validated}`);
  console.log(`  Deduped (stage 6):    ${deduped}`);
  console.log(`  Scored (stage 7):     ${scored}`);
  console.log(`  Enriched (stage 8):   ${enriched}`);
  console.log(`  Rendered (stage 9):   ${rendered}`);

  if (!prod) {
    console.log('\n[orchestrator] dry-run complete — no production files modified.');
    return;
  }

  // Prod: copy stage-9 records into data/library/, never overwriting hand-seeded ones.
  const libDir = defaultProdRoot();
  ensureDir(libDir);

  const reviewQueue: Array<{ slug: string; reason: string }> = [];
  const newDiagrams: LibraryDiagram[] = [];
  let copied = 0;
  let renamed = 0;

  for (const path of listJson(paths.stageDir(9))) {
    const rec = readJson<RenderedCandidate>(path);
    const finalSlug = uniqueSlug(libDir, rec.slug);
    if (finalSlug !== rec.slug) renamed++;
    const diagram: LibraryDiagram = { ...toLibraryDiagram(rec), slug: finalSlug };
    writeJson(join(libDir, `${finalSlug}.json`), diagram);
    newDiagrams.push(diagram);
    copied++;

    if (rec.aiFallback) {
      reviewQueue.push({
        slug: finalSlug,
        reason: `ai.fallback (${rec.aiFailureReason ?? 'unknown'})`,
      });
    }
    if (!rec.licenseSpdx) {
      reviewQueue.push({ slug: finalSlug, reason: 'license missing' });
    }
  }

  // If nothing new was copied, skip touching _manifest.json and _review.md —
  // a no-op run shouldn't produce a noisy PR with a fresh `generatedAt` timestamp.
  if (copied === 0) {
    console.log(
      `\n[orchestrator] no new records to write to ${libDir}; leaving manifest + review queue untouched`
    );
    void copyFileSync;
    void basename;
    void PROJECT_ROOT;
    void ALL_STAGES;
    return;
  }

  // Regenerate manifest from union of hand-seeded + new files.
  const allDiagrams: LibraryDiagram[] = [];
  for (const f of readdirSync(libDir)) {
    if (!f.endsWith('.json') || f === '_manifest.json') continue;
    const d = JSON.parse(readFileSync(join(libDir, f), 'utf-8')) as LibraryDiagram;
    if (d.slug) allDiagrams.push(d);
  }
  writeManifest(libDir, allDiagrams);

  // Write review queue
  const reviewLines = [
    '# Library Ingestion Review Queue',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Entries listed below have AI fallback content or a missing license.',
    'Review each entry before relying on it for SEO sitemap inclusion.',
    '',
  ];
  if (reviewQueue.length === 0) {
    reviewLines.push('_No entries currently need review._');
  } else {
    for (const r of reviewQueue) reviewLines.push(`- \`${r.slug}\` — ${r.reason}`);
  }
  writeFileSync(join(libDir, '_review.md'), reviewLines.join('\n') + '\n');

  console.log(
    `\n[orchestrator] copied ${copied} record(s) to ${libDir} (renamed due to collision: ${renamed})`
  );
  console.log(
    `[orchestrator] review queue: ${reviewQueue.length} entries → ${join(libDir, '_review.md')}`
  );
  // Reference unused imports
  void copyFileSync;
  void basename;
  void PROJECT_ROOT;
  void ALL_STAGES;
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[orchestrator] failed:', err);
    process.exit(1);
  });
}
