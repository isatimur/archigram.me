/**
 * Stage 9: re-render each enriched candidate's mermaid code via mmdc and inline
 * the SVG into the final record.
 *
 * Validate-render (stage 5) already ran mmdc once for the accept/reject
 * decision; we re-run here so that the SVG we ship is the final, deterministic
 * output for the (possibly slug-changed) record. This keeps the validate and
 * preview concerns separate.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, getString, getBool } from './lib/cli';
import { ensureDir, listJson, readJson, writeJson } from './lib/util';
import type { EnrichedCandidate, RenderedCandidate } from './lib/types';

async function isMmdcAvailable(): Promise<boolean> {
  try {
    const proc = Bun.spawn(['mmdc', '--version'], { stdout: 'pipe', stderr: 'pipe' });
    const code = await proc.exited;
    return code === 0;
  } catch {
    return false;
  }
}

function parseSvgDims(svg: string): { width: number; height: number } {
  const wm = svg.match(/<svg[^>]*\swidth=["']?(\d+(?:\.\d+)?)/i);
  const hm = svg.match(/<svg[^>]*\sheight=["']?(\d+(?:\.\d+)?)/i);
  const vb = svg.match(
    /viewBox=["']\s*\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i
  );
  return {
    width: wm ? Math.round(Number(wm[1])) : vb ? Math.round(Number(vb[1])) : 1100,
    height: hm ? Math.round(Number(hm[1])) : vb ? Math.round(Number(vb[2])) : 700,
  };
}

async function renderSvg(code: string): Promise<string | null> {
  const dir = mkdtempSync(join(tmpdir(), 'mmdc-final-'));
  const inFile = join(dir, 'in.mmd');
  const outFile = join(dir, 'out.svg');
  try {
    writeFileSync(inFile, code, 'utf-8');
    const proc = Bun.spawn(['mmdc', '-i', inFile, '-o', outFile, '-b', 'transparent'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const ok = (await proc.exited) === 0;
    if (!ok || !existsSync(outFile)) return null;
    return readFileSync(outFile, 'utf-8');
  } catch {
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

function placeholderSvg(): { svg: string; width: number; height: number } {
  // Tiny placeholder for dry-run mode when mmdc isn't installed.
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700" viewBox="0 0 1100 700"><rect width="1100" height="700" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#6b7280">Preview not yet rendered</text></svg>`,
    width: 1100,
    height: 700,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const inputDir = getString(args, 'input', 'tmp/library-ingest/stages/8-enriched');
  const outputDir = getString(args, 'output', 'tmp/library-ingest/stages/9-rendered');
  const skipRender = getBool(args, 'skip-render');

  if (!existsSync(inputDir)) {
    console.error(`[stage 9] input dir not found: ${inputDir}`);
    process.exit(1);
  }
  ensureDir(outputDir);

  let useMmdc = !skipRender;
  if (useMmdc) {
    const ok = await isMmdcAvailable();
    if (!ok) {
      console.warn(
        '[stage 9] mmdc not available — using placeholder SVG. Install: bun add -g @mermaid-js/mermaid-cli'
      );
      useMmdc = false;
    }
  }

  let written = 0;
  let usedPlaceholder = 0;
  for (const path of listJson(inputDir)) {
    const rec = readJson<EnrichedCandidate>(path);
    let svg: string;
    let width: number;
    let height: number;
    if (useMmdc) {
      const rendered = await renderSvg(rec.mermaidCode);
      if (rendered) {
        const dims = parseSvgDims(rendered);
        svg = rendered;
        width = dims.width;
        height = dims.height;
      } else {
        const ph = placeholderSvg();
        svg = ph.svg;
        width = ph.width;
        height = ph.height;
        usedPlaceholder++;
      }
    } else {
      const ph = placeholderSvg();
      svg = ph.svg;
      width = ph.width;
      height = ph.height;
      usedPlaceholder++;
    }

    const out: RenderedCandidate = {
      ...rec,
      previewSvg: svg,
      previewWidth: width,
      previewHeight: height,
    };
    writeJson(join(outputDir, `${rec.slug}.json`), out);
    written++;
  }
  console.log(
    `[stage 9] rendered ${written} records (placeholders=${usedPlaceholder}) → ${outputDir}`
  );
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('[stage 9] failed:', err);
    process.exit(1);
  });
}
