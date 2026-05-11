/**
 * Shared helpers: paths, hashing, file IO, JSON read/write.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = resolve(__dirname, '..', '..', '..');

export const STAGE_DIR_NAMES = {
  1: '1-fetched',
  2: '2-gists',
  3: '3-awesome',
  4: '4-mermaid-docs',
  5: '5-validated',
  6: '6-deduped',
  7: '7-scored',
  8: '8-enriched',
  9: '9-rendered',
} as const;

export type StageNumber = keyof typeof STAGE_DIR_NAMES;

export type PipelinePaths = {
  root: string;
  stages: string;
  stageDir: (n: StageNumber) => string;
};

export function defaultDryRunRoot(): string {
  return join(PROJECT_ROOT, 'tmp', 'library-ingest');
}

export function defaultProdRoot(): string {
  return join(PROJECT_ROOT, 'data', 'library');
}

export function pipelinePaths(root: string): PipelinePaths {
  const stages = join(root, 'stages');
  return {
    root,
    stages,
    stageDir: (n) => join(stages, STAGE_DIR_NAMES[n]),
  };
}

export function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

export function writeJson(path: string, value: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(value, null, 2));
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f));
}

export function readAllJson<T>(dir: string): T[] {
  return listJson(dir).map((p) => readJson<T>(p));
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Strip ``` fences, comments, and runs of whitespace for a stable hash. */
export function normalizeMermaidForHash(code: string): string {
  return code
    .replace(/^```mermaid\s*/i, '')
    .replace(/```\s*$/, '')
    .replace(/%%[^\n]*/g, '') // mermaid line comments
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function hashMermaid(code: string): string {
  return sha256(normalizeMermaidForHash(code));
}

/** Slugify a string into kebab-case. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Detect the diagram type from raw mermaid code by sniffing the first non-empty
 * line. Falls back to "other" for unrecognised diagrams.
 */
export function detectDiagramType(
  code: string
):
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'journey'
  | 'mindmap'
  | 'c4'
  | 'other' {
  const head = code.trimStart().split('\n')[0]?.trim() ?? '';
  if (/^(graph|flowchart)\b/i.test(head)) return 'flowchart';
  if (/^sequenceDiagram\b/i.test(head)) return 'sequence';
  if (/^classDiagram\b/i.test(head)) return 'class';
  if (/^stateDiagram(-v2)?\b/i.test(head)) return 'state';
  if (/^erDiagram\b/i.test(head)) return 'er';
  if (/^gantt\b/i.test(head)) return 'gantt';
  if (/^journey\b/i.test(head)) return 'journey';
  if (/^mindmap\b/i.test(head)) return 'mindmap';
  if (/^(C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/.test(head)) return 'c4';
  return 'other';
}

/**
 * Count distinct node identifiers and edges in a mermaid block.
 *
 * Used by the validate stage to reject diagrams that are too trivial or too
 * noisy. We're not parsing the full grammar — just counting identifiers that
 * appear in node-shape positions and arrow-style edges.
 */
export function countNodesAndEdges(code: string): { nodes: number; edges: number } {
  const identifiers = new Set<string>();

  // Node patterns: A[label], B(label), C((label)), D{label}, E>label], F[/label/]
  const nodeShapes = code.match(/([A-Za-z_][A-Za-z0-9_-]*)\s*(?:\[|\(|\{|>|\[\/|\[\\|\[\[)/g);
  if (nodeShapes) {
    for (const match of nodeShapes) {
      const id = match.replace(/[\s[({>\\/]+$/, '').trim();
      if (id) identifiers.add(id);
    }
  }

  // Sequence diagram participants: `participant A as Foo` or `actor A`
  const participants = code.match(/(?:participant|actor)\s+([A-Za-z_][A-Za-z0-9_-]*)/g);
  if (participants) {
    for (const m of participants) {
      const id = m.split(/\s+/)[1];
      if (id) identifiers.add(id);
    }
  }

  // ER entities: `ENTITY { ... }` and class definitions: `class Foo`
  const erBlocks = code.match(/^\s*([A-Za-z_][A-Za-z0-9_-]*)\s*\{/gm);
  if (erBlocks) {
    for (const m of erBlocks) {
      const id = m.replace(/\{.*$/, '').trim();
      if (id) identifiers.add(id);
    }
  }

  // ER relationships: `ENTITY1 ||--o{ ENTITY2 : has` — pull both sides
  const erRels = code.match(
    /([A-Za-z_][A-Za-z0-9_-]*)\s*\|\|?[o|\\.]*-{1,2}[o|]?\{?\s*([A-Za-z_][A-Za-z0-9_-]*)/g
  );
  if (erRels) {
    for (const m of erRels) {
      const parts = m.split(/\s+/).filter((s) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(s));
      for (const p of parts) identifiers.add(p);
    }
  }

  // State diagram state names: appear as `[*] --> StateA`, `StateA --> StateB`
  // Captured below by the edge regex's node identifiers too.

  // Edges: `-->`, `->`, `-.->`, `==>`, `--`, `..`
  const edgeMatches = code.match(/-{1,2}>|-\.->|==>|--/g);
  const edges = edgeMatches ? edgeMatches.length : 0;

  // Gantt tasks: `Task :state, id, date, duration` — count distinct ids
  // (only fire when the diagram looks like a gantt to avoid polluting other types).
  if (/^gantt\b/im.test(code)) {
    const ganttRows = code.match(/^\s*[^:\n]+:[^,\n]+,\s*([A-Za-z_][A-Za-z0-9_-]*)/gm);
    if (ganttRows) {
      for (const row of ganttRows) {
        const id = /:[^,\n]+,\s*([A-Za-z_][A-Za-z0-9_-]*)/.exec(row)?.[1];
        if (id) identifiers.add(id);
      }
    }
  }

  // Journey diagram tasks: `Task: 5: User, ...` — count distinct task labels' first word
  if (/^journey\b/im.test(code)) {
    const journeyTasks = code.match(/^\s*([A-Za-z][A-Za-z0-9_-]*[^:\n]*?)\s*:\s*\d+\s*:/gm);
    if (journeyTasks) {
      for (let i = 0; i < journeyTasks.length; i++) {
        identifiers.add(`journey-task-${i}`);
      }
    }
  }

  // Mindmap nodes: indented identifiers in a tree
  if (/^mindmap\b/im.test(code)) {
    const mindmapNodes = code.match(/^\s{2,}\S.*$/gm);
    if (mindmapNodes) {
      for (let i = 0; i < mindmapNodes.length; i++) {
        identifiers.add(`mindmap-node-${i}`);
      }
    }
  }

  // Pull identifiers from edges to catch state-machine style nodes
  const edgeIds = code.match(
    /([A-Za-z_][A-Za-z0-9_-]*)\s*(?:-{1,2}>|-\.->|==>)\s*([A-Za-z_][A-Za-z0-9_-]*)/g
  );
  if (edgeIds) {
    for (const m of edgeIds) {
      const parts = m.split(/-{1,2}>|-\.->|==>/);
      for (const p of parts) {
        const id = p.trim();
        if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(id)) identifiers.add(id);
      }
    }
  }

  // Filter out common keywords mistaken for identifiers
  const keywords = new Set([
    'graph',
    'flowchart',
    'subgraph',
    'end',
    'classDef',
    'class',
    'click',
    'style',
    'linkStyle',
    'TD',
    'TB',
    'LR',
    'RL',
    'BT',
    'participant',
    'actor',
    'Note',
    'note',
    'autonumber',
    'alt',
    'opt',
    'loop',
    'par',
    'else',
    'rect',
    'activate',
    'deactivate',
    'state',
    'direction',
  ]);
  for (const k of keywords) identifiers.delete(k);

  return { nodes: identifiers.size, edges };
}
