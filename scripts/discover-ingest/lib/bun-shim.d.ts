// Minimal ambient declarations for the Bun runtime globals we use in the
// discover-ingest scripts. The full `@types/bun` package would also work but
// is overkill for a few signatures.

declare namespace Bun {
  function spawn(
    cmd: string[],
    opts?: {
      stdout?: 'inherit' | 'pipe' | 'ignore';
      stderr?: 'inherit' | 'pipe' | 'ignore';
      stdin?: 'inherit' | 'pipe' | 'ignore';
      env?: Record<string, string | undefined>;
    }
  ): {
    exited: Promise<number>;
    stdout: ReadableStream<Uint8Array>;
    stderr: ReadableStream<Uint8Array>;
  };
}

interface ImportMeta {
  readonly main: boolean;
}
