/**
 * Stage 3: dereference awesome-* curated lists that catalog Mermaid examples.
 *
 * Quality > quantity: we hardcode a small allowlist of curated lists, fetch
 * their README, find linked URLs that point to mermaid examples or gists,
 * and pull the mermaid out of each.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractMermaidBlocks } from './lib/extract';
import { getRepoInfo, fetchRawFile } from './lib/github';
import { parseArgs, getString } from './lib/cli';
import { ensureDir, hashMermaid, writeJson, sleep } from './lib/util';
import type { RawCandidate, RawFixture } from './lib/types';

const AWESOME_LISTS: Array<{ repo: string; path: string }> = [
  // The canonical Mermaid catalog. Add more curated lists here as they appear.
  { repo: 'mermaid-js/awesome-mermaid', path: 'README.md' },
];

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
  const fetchedAt = new Date().toISOString();
  const seenHashes = new Set<string>();
  let written = 0;

  for (const list of AWESOME_LISTS) {
    const repoInfo = await getRepoInfo(list.repo);
    if (!repoInfo) continue;
    const md = await fetchRawFile(list.repo, list.path, repoInfo.defaultBranch);
    if (!md) continue;

    // First, harvest blocks embedded directly in the awesome list itself.
    for (const block of extractMermaidBlocks(md)) {
      const hash = hashMermaid(block.code);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      const record: RawCandidate = {
        hash,
        sourceType: 'awesome-list',
        sourceUrl: `https://github.com/${list.repo}/blob/${repoInfo.defaultBranch}/${list.path}`,
        repo: list.repo,
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

    // Then dereference links of the form github.com/<owner>/<repo>/blob/.../*.md
    // (limited to a small batch so this stage doesn't run away)
    const linkPattern = /\(https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/([^/]+)\/([^)]+\.md)\)/g;
    let m: RegExpExecArray | null;
    const linkedTargets = new Set<string>();
    while ((m = linkPattern.exec(md)) !== null) {
      const key = `${m[1]}|${m[3]}`;
      if (linkedTargets.has(key)) continue;
      linkedTargets.add(key);
      if (linkedTargets.size > 50) break;

      const [, targetRepo, targetRef, targetPath] = m;
      const targetRepoInfo = await getRepoInfo(targetRepo);
      if (!targetRepoInfo) continue;
      const targetMd = await fetchRawFile(targetRepo, targetPath, targetRef);
      await sleep(150);
      if (!targetMd) continue;

      for (const block of extractMermaidBlocks(targetMd)) {
        const hash = hashMermaid(block.code);
        if (seenHashes.has(hash)) continue;
        seenHashes.add(hash);

        const record: RawCandidate = {
          hash,
          sourceType: 'awesome-list',
          sourceUrl: `https://github.com/${targetRepo}/blob/${targetRef}/${targetPath}`,
          repo: targetRepo,
          licenseSpdx: targetRepoInfo.licenseSpdx,
          licenseUnknown: !targetRepoInfo.licenseSpdx,
          stars: targetRepoInfo.stars,
          mermaidCode: block.code,
          rawContext: block.context,
          fetchedAt,
        };
        writeJson(join(outputDir, `${hash}.json`), record);
        written++;
      }
    }
  }

  return written;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/3-awesome');
  const fixtures = typeof args.fixtures === 'string' ? args.fixtures : '';

  if (fixtures) {
    if (!existsSync(fixtures)) {
      console.error(`[stage 3] fixtures file not found: ${fixtures}`);
      process.exit(1);
    }
    const n = await runWithFixtures(fixtures, outputDir);
    console.log(`[stage 3] wrote ${n} fixture records → ${outputDir}`);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('[stage 3] GITHUB_TOKEN is required for live mode (or pass --fixtures=…)');
    process.exit(1);
  }

  const n = await runLive(outputDir);
  console.log(`[stage 3] wrote ${n} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 3] failed:', err);
    process.exit(1);
  });
}
