/**
 * Stage 1: discover Mermaid blocks in GitHub READMEs via Code Search.
 *
 * Searches for ``` ```mermaid ``` ``` in markdown files at `README` paths, sorts by
 * `indexed-desc` (the closest "freshness" proxy code search offers), then
 * fetches each raw file and extracts every Mermaid block. Repo metadata
 * (stars, SPDX license) is looked up once per repo and cached.
 *
 * Usage:
 *   bun run scripts/discover-ingest/fetch-github-code.ts \
 *     --output=tmp/library-ingest/stages/1-fetched \
 *     [--limit=200] [--fixtures=scripts/discover-ingest/fixtures/raw-github-code.json]
 *
 * If `--fixtures` is supplied, the script reads pre-shaped entries from disk
 * instead of calling GitHub. This is what the orchestrator uses in dry-run.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractMermaidBlocks } from './lib/extract';
import { searchCode, getRepoInfo, fetchRawFile } from './lib/github';
import { parseArgs, getString, getNumber } from './lib/cli';
import { ensureDir, hashMermaid, writeJson, sleep } from './lib/util';
import type { RawCandidate, RawFixture } from './lib/types';

const DEFAULT_LIMIT = 200;
const DEFAULT_QUERY = '"```mermaid" extension:md path:README';

function fixtureToRaw(input: RawFixture): RawCandidate {
  const hash = input.hash ?? hashMermaid(input.mermaidCode);
  // Strip `null`-typed licenses that some fixtures use to test the unknown-license path.
  const license = input.licenseSpdx ?? undefined;
  return {
    hash,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    repo: input.repo,
    licenseSpdx: license || undefined,
    licenseUnknown: !license,
    stars: input.stars,
    mermaidCode: input.mermaidCode,
    rawContext: input.rawContext,
    fetchedAt: input.fetchedAt,
  };
}

async function runWithFixtures(fixturesPath: string, outputDir: string): Promise<number> {
  const raw = JSON.parse(readFileSync(fixturesPath, 'utf-8')) as RawFixture[];
  ensureDir(outputDir);
  let written = 0;
  for (const entry of raw) {
    const record = fixtureToRaw(entry);
    writeJson(join(outputDir, `${record.hash}.json`), record);
    written++;
  }
  return written;
}

async function runWithGitHub(outputDir: string, limit: number, query: string): Promise<number> {
  ensureDir(outputDir);
  const items = await searchCode(query, limit);
  console.log(`[stage 1] code search returned ${items.length} items`);

  const fetchedAt = new Date().toISOString();
  let written = 0;
  const seenHashes = new Set<string>();

  for (const item of items) {
    const repoInfo = await getRepoInfo(item.repoFullName);
    if (!repoInfo) continue;
    const md = await fetchRawFile(item.repoFullName, item.path, repoInfo.defaultBranch);
    await sleep(150);
    if (!md) continue;

    const blocks = extractMermaidBlocks(md);
    if (blocks.length === 0) continue;

    for (const block of blocks) {
      const hash = hashMermaid(block.code);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const record: RawCandidate = {
        hash,
        sourceType: 'github-readme',
        sourceUrl: item.htmlUrl,
        repo: item.repoFullName,
        licenseSpdx: repoInfo.licenseSpdx,
        licenseUnknown: !repoInfo.licenseSpdx,
        stars: repoInfo.stars,
        mermaidCode: block.code,
        rawContext: block.context,
        fetchedAt,
      };
      writeJson(join(outputDir, `${hash}.json`), record);
      written++;
    }
  }
  return written;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/1-fetched');
  const limit = getNumber(args, 'limit', DEFAULT_LIMIT);
  const query = getString(args, 'query', DEFAULT_QUERY);
  const fixtures = typeof args.fixtures === 'string' ? args.fixtures : '';

  if (fixtures) {
    if (!existsSync(fixtures)) {
      console.error(`[stage 1] fixtures file not found: ${fixtures}`);
      process.exit(1);
    }
    const n = await runWithFixtures(fixtures, outputDir);
    console.log(`[stage 1] wrote ${n} fixture records → ${outputDir}`);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('[stage 1] GITHUB_TOKEN is required for live mode (or pass --fixtures=…)');
    process.exit(1);
  }

  const n = await runWithGitHub(outputDir, limit, query);
  console.log(`[stage 1] wrote ${n} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 1] failed:', err);
    process.exit(1);
  });
}
