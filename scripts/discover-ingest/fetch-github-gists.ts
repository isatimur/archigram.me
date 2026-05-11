/**
 * Stage 2: discover Mermaid blocks in public gists.
 *
 * The gist search API is much narrower than code search — there's no
 * "search by content" endpoint. We fall back to keyword search via
 * `octokit.search.issuesAndPullRequests` against gists is not supported, so we
 * use the standard REST gist listing and filter by:
 *   - filename ends in `.mmd` (canonical mermaid extension)
 *   - filename ends in `.md` and content contains a mermaid fence
 *
 * Usage mirrors stage 1; the same `--fixtures` knob skips GitHub.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractMermaidBlocks } from './lib/extract';
import { getOctokit } from './lib/github';
import { parseArgs, getString, getNumber } from './lib/cli';
import { ensureDir, hashMermaid, writeJson, sleep } from './lib/util';
import type { RawCandidate, RawFixture } from './lib/types';

const DEFAULT_LIMIT = 100;

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

async function runWithGitHub(outputDir: string, limit: number): Promise<number> {
  ensureDir(outputDir);
  const octokit = getOctokit();
  const fetchedAt = new Date().toISOString();
  const seenHashes = new Set<string>();
  let written = 0;

  // Public gist listing — we then filter client-side.
  let page = 1;
  const MAX_RETRIES_PER_PAGE = 3;
  let pageRetries = 0;
  while (written < limit && page <= 5) {
    let res;
    try {
      res = await octokit.gists.listPublic({ per_page: 100, page });
      pageRetries = 0;
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if ((e.status === 403 || e.status === 429) && pageRetries < MAX_RETRIES_PER_PAGE) {
        pageRetries++;
        console.warn(
          `[stage 2] gist listing got ${e.status} (attempt ${pageRetries}/${MAX_RETRIES_PER_PAGE}), sleeping 30s…`
        );
        await sleep(30_000);
        continue;
      }
      console.warn(
        `[stage 2] gist listing failed after ${pageRetries} retries (status=${e.status}, message=${e.message ?? err}); skipping this source`
      );
      break;
    }

    if (!res.data || res.data.length === 0) break;

    type GistFile = {
      filename?: string;
      language?: string;
      raw_url?: string;
    };

    for (const gist of res.data) {
      if (written >= limit) break;
      const files = Object.values((gist.files ?? {}) as Record<string, GistFile>);
      for (const file of files) {
        if (!file) continue;
        const name = file.filename ?? '';
        const isMermaid =
          name.endsWith('.mmd') ||
          (name.endsWith('.md') && (file.language === 'Markdown' || !file.language));
        if (!isMermaid) continue;

        // Fetch raw content
        let content = '';
        try {
          const raw = await fetch(file.raw_url ?? '', {
            headers: {
              'User-Agent': 'archigram-ingest/1.0',
              Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : '',
            },
          });
          if (!raw.ok) continue;
          content = await raw.text();
        } catch {
          continue;
        }
        await sleep(150);

        // If it's an .mmd file, treat the whole file as one block;
        // otherwise extract fences from markdown.
        const blocks = name.endsWith('.mmd')
          ? [{ code: content.trim(), context: gist.description ?? '' }]
          : extractMermaidBlocks(content);

        for (const block of blocks) {
          if (block.code.length < 50) continue;
          const hash = hashMermaid(block.code);
          if (seenHashes.has(hash)) continue;
          seenHashes.add(hash);

          const record: RawCandidate = {
            hash,
            sourceType: 'github-gist',
            sourceUrl: gist.html_url,
            repo: `${gist.owner?.login ?? 'anon'}/${gist.id}`,
            licenseSpdx: undefined,
            licenseUnknown: true,
            stars: undefined,
            mermaidCode: block.code,
            rawContext: block.context,
            fetchedAt,
          };
          writeJson(join(outputDir, `${hash}.json`), record);
          written++;
          if (written >= limit) break;
        }
      }
    }
    page++;
  }
  return written;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/2-gists');
  const limit = getNumber(args, 'limit', DEFAULT_LIMIT);
  const fixtures = typeof args.fixtures === 'string' ? args.fixtures : '';

  if (fixtures) {
    if (!existsSync(fixtures)) {
      console.error(`[stage 2] fixtures file not found: ${fixtures}`);
      process.exit(1);
    }
    const n = await runWithFixtures(fixtures, outputDir);
    console.log(`[stage 2] wrote ${n} fixture records → ${outputDir}`);
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('[stage 2] GITHUB_TOKEN is required for live mode (or pass --fixtures=…)');
    process.exit(1);
  }

  const n = await runWithGitHub(outputDir, limit);
  console.log(`[stage 2] wrote ${n} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 2] failed:', err);
    process.exit(1);
  });
}
