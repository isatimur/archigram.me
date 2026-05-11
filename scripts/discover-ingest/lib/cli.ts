/**
 * Tiny CLI argument parser. We avoid bringing in a dependency for this — Bun
 * exposes `process.argv` and that's all we need.
 *
 * Supports:
 *   --flag                → { flag: true }
 *   --key=value           → { key: "value" }
 *   --key value           → { key: "value" }
 *   --list=a,b,c          → { list: ["a", "b", "c"] }   (when asked via getList)
 */

export type ParsedArgs = Record<string, string | boolean>;

export function parseArgs(argv: readonly string[] = process.argv.slice(2)): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith('--')) continue;
    const eq = tok.indexOf('=');
    if (eq !== -1) {
      const key = tok.slice(2, eq);
      out[key] = tok.slice(eq + 1);
      continue;
    }
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

export function getString(args: ParsedArgs, key: string, fallback: string): string {
  const v = args[key];
  return typeof v === 'string' ? v : fallback;
}

export function getNumber(args: ParsedArgs, key: string, fallback: number): number {
  const v = args[key];
  if (typeof v !== 'string') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function getBool(args: ParsedArgs, key: string): boolean {
  return args[key] === true || args[key] === 'true';
}

export function getList(args: ParsedArgs, key: string): string[] {
  const v = args[key];
  if (typeof v !== 'string') return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
