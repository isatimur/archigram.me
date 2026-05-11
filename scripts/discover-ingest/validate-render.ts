/**
 * Stage 5: validate that each candidate actually renders via mermaid-cli.
 *
 * Rejects:
 *   - Render errors (mmdc exit code != 0)
 *   - Code size > 50 KB
 *   - Node count < 5 (trivial) or > 200 (noisy)
 *
 * If `@mermaid-js/mermaid-cli` is not installed we exit non-zero with a clear
 * install message — the script does not auto-install.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { extname } from 'node:path';
import { extractMermaidBlocks } from './lib/extract';
import { parseArgs, getList, getString } from './lib/cli';
import { ensureDir, listJson, readJson, writeJson, countNodesAndEdges } from './lib/util';
import type { RawCandidate, ValidatedCandidate } from './lib/types';

const MAX_BYTES = 50 * 1024;
const MIN_NODES = 5;
const MAX_NODES = 200;

// Reference unused import so linter doesn't complain
void extractMermaidBlocks;
void extname;

async function isMmdcAvailable(): Promise<boolean> {
  try {
    const proc = Bun.spawn(['mmdc', '--version'], { stdout: 'pipe', stderr: 'pipe' });
    const code = await proc.exited;
    return code === 0;
  } catch {
    return false;
  }
}

// CI-friendly puppeteer config (no sandbox; gives Chromium a fighting chance on
// fresh runners that don't have user namespaces enabled).
const PUPPETEER_CONFIG_JSON = JSON.stringify({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

async function tryRender(
  code: string
): Promise<{ ok: true; svg: string } | { ok: false; reason: string }> {
  const dir = mkdtempSync(join(tmpdir(), 'mmdc-'));
  const inFile = join(dir, 'in.mmd');
  const outFile = join(dir, 'out.svg');
  const puppeteerCfg = join(dir, 'puppeteer.json');
  try {
    writeFileSync(inFile, code, 'utf-8');
    writeFileSync(puppeteerCfg, PUPPETEER_CONFIG_JSON, 'utf-8');
    const proc = Bun.spawn(
      ['mmdc', '-i', inFile, '-o', outFile, '-b', 'transparent', '-p', puppeteerCfg],
      { stdout: 'pipe', stderr: 'pipe' }
    );
    const code2 = await proc.exited;
    if (code2 !== 0) {
      const stderr = await new Response(proc.stderr).text();
      return { ok: false, reason: stderr.slice(0, 300) || `exit ${code2}` };
    }
    if (!existsSync(outFile)) return { ok: false, reason: 'no SVG produced' };
    const svg = readFileSync(outFile, 'utf-8');
    return { ok: true, svg };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

function parseSvgDims(svg: string): { width?: number; height?: number } {
  const wm = svg.match(/<svg[^>]*\swidth=["']?(\d+(?:\.\d+)?)/i);
  const hm = svg.match(/<svg[^>]*\sheight=["']?(\d+(?:\.\d+)?)/i);
  // viewBox fallback
  const vb = svg.match(
    /viewBox=["']\s*\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i
  );
  return {
    width: wm ? Math.round(Number(wm[1])) : vb ? Math.round(Number(vb[1])) : undefined,
    height: hm ? Math.round(Number(hm[1])) : vb ? Math.round(Number(vb[2])) : undefined,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const inputs = getList(args, 'inputs');
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/5-validated');
  const skipRender = args['skip-render'] === true || args['skip-render'] === 'true';

  if (inputs.length === 0) {
    console.error('[stage 5] --inputs=dir1,dir2,… is required');
    process.exit(1);
  }

  if (!skipRender) {
    const available = await isMmdcAvailable();
    if (!available) {
      console.error(
        '[stage 5] mermaid-cli not found. Install it globally:\n' +
          '  bun add -g @mermaid-js/mermaid-cli\n' +
          'or rerun with --skip-render to bypass rendering (dry-run only).'
      );
      process.exit(2);
    }
  }

  ensureDir(outputDir);

  let accepted = 0;
  let rejected = 0;
  const rejectReasons = new Map<string, number>();
  const renderFailureSamples: string[] = [];
  const MAX_RENDER_SAMPLES = 5;

  for (const dir of inputs) {
    if (!existsSync(dir)) continue;
    for (const path of listJson(dir)) {
      const raw = readJson<RawCandidate>(path);
      const byteSize = Buffer.byteLength(raw.mermaidCode, 'utf-8');
      if (byteSize > MAX_BYTES) {
        rejected++;
        rejectReasons.set('too-large', (rejectReasons.get('too-large') ?? 0) + 1);
        continue;
      }

      const { nodes, edges } = countNodesAndEdges(raw.mermaidCode);
      if (nodes < MIN_NODES) {
        rejected++;
        rejectReasons.set('too-few-nodes', (rejectReasons.get('too-few-nodes') ?? 0) + 1);
        continue;
      }
      if (nodes > MAX_NODES) {
        rejected++;
        rejectReasons.set('too-many-nodes', (rejectReasons.get('too-many-nodes') ?? 0) + 1);
        continue;
      }

      let svgWidth: number | undefined;
      let svgHeight: number | undefined;

      if (!skipRender) {
        const rendered = await tryRender(raw.mermaidCode);
        if (!rendered.ok) {
          rejected++;
          rejectReasons.set('render-failed', (rejectReasons.get('render-failed') ?? 0) + 1);
          if (renderFailureSamples.length < MAX_RENDER_SAMPLES) {
            renderFailureSamples.push(rendered.reason);
          }
          continue;
        }
        const dims = parseSvgDims(rendered.svg);
        svgWidth = dims.width;
        svgHeight = dims.height;
      }

      const out: ValidatedCandidate = {
        ...raw,
        renderSucceeded: true,
        nodeCount: nodes,
        edgeCount: edges,
        byteSize,
        svgWidth,
        svgHeight,
      };
      writeJson(join(outputDir, `${raw.hash}.json`), out);
      accepted++;
    }
  }

  console.log(`[stage 5] accepted=${accepted} rejected=${rejected}`);
  for (const [reason, n] of rejectReasons) console.log(`  rejected.${reason}: ${n}`);
  if (renderFailureSamples.length > 0) {
    console.log(`[stage 5] sample render failures (first ${renderFailureSamples.length}):`);
    for (const sample of renderFailureSamples) {
      console.log(`  ${sample.replace(/\n/g, ' ').slice(0, 250)}`);
    }
  }
  console.log(`[stage 5] wrote ${accepted} records → ${outputDir}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 5] failed:', err);
    process.exit(1);
  });
}
