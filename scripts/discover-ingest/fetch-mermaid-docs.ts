/**
 * Stage 4: pull canonical mermaid examples from the mermaid-js/mermaid repo.
 *
 * These are the highest-quality source we have — they're maintained by the
 * Mermaid project itself, are guaranteed to render, and are MIT-licensed.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractMermaidBlocks } from './lib/extract';
import { getOctokit, getRepoInfo, fetchRawFile } from './lib/github';
import { parseArgs, getString } from './lib/cli';
import { ensureDir, hashMermaid, writeJson, sleep } from './lib/util';
import type { RawCandidate, RawFixture } from './lib/types';

const MERMAID_REPO = 'mermaid-js/mermaid';
const DOCS_DIR = 'packages/mermaid/src/docs/syntax';

function fixtureToRaw(input: RawFixture): RawCandidate {
  const hash = input.hash ?? hashMermaid(input.mermaidCode);
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

async function runLive(outputDir: string): Promise<number> {
  ensureDir(outputDir);
  const octokit = getOctokit();
  const fetchedAt = new Date().toISOString();
  const seenHashes = new Set<string>();
  let written = 0;

  const repoInfo = await getRepoInfo(MERMAID_REPO);
  if (!repoInfo) {
    console.error('[stage 4] could not look up mermaid-js/mermaid repo metadata');
    return 0;
  }

  // Use the contents API to list files under the docs/syntax dir.
  const [owner, repo] = MERMAID_REPO.split('/');
  let contents;
  try {
    contents = await octokit.repos.getContent({
      owner,
      repo,
      path: DOCS_DIR,
      ref: repoInfo.defaultBranch,
    });
  } catch (err) {
    const e = err as { message?: string };
    console.warn(`[stage 4] failed to list ${DOCS_DIR}: ${e.message ?? err}`);
    return 0;
  }
  if (!Array.isArray(contents.data)) {
    console.warn('[stage 4] expected a directory listing, got a single file');
    return 0;
  }

  for (const entry of contents.data) {
    if (entry.type !== 'file' || !entry.path.endsWith('.md')) continue;
    const md = await fetchRawFile(MERMAID_REPO, entry.path, repoInfo.defaultBranch);
    await sleep(150);
    if (!md) continue;

    for (const block of extractMermaidBlocks(md)) {
      const hash = hashMermaid(block.code);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const record: RawCandidate = {
        hash,
        sourceType: 'mermaid-docs',
        sourceUrl: `https://github.com/${MERMAID_REPO}/blob/${repoInfo.defaultBranch}/${entry.path}`,
        repo: MERMAID_REPO,
        licenseSpdx: repoInfo.licenseSpdx ?? 'MIT',
        licenseUnknown: false,
        // Canonical examples — treat as if highly starred so scoring favours them.
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
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/4-mermaid-docs');
  const fixtures = typeof args.fixtures === 'string' ? args.fixtures : '';

  if (fixtures) {
    if (!existsSync(fixtures)) {
      console.error(`[stage 4] fixtures file not found: ${fixtures}`);
      process.exit(1);
    }
    const n = await runWithFixtures(fixtures, outputDir);
    console.log(`[stage 4] wrote ${n} fixture records → ${outputDir}`);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('[stage 4] GITHUB_TOKEN is required for live mode (or pass --fixtures=…)');
    process.exit(1);
  }

  const n = await runLive(outputDir);
  console.log(`[stage 4] wrote ${n} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 4] failed:', err);
    process.exit(1);
  });
}
