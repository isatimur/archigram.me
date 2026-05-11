import { describe, expect, it } from 'vitest';
import {
  hashMermaid,
  normalizeMermaidForHash,
  sha256,
} from '../../../scripts/discover-ingest/lib/util';

describe('dedupe — hashMermaid', () => {
  it('produces the same hash for identical code', () => {
    const a = 'flowchart LR\n    A --> B';
    const b = 'flowchart LR\n    A --> B';
    expect(hashMermaid(a)).toBe(hashMermaid(b));
  });

  it('ignores whitespace differences', () => {
    const a = 'flowchart LR\n    A --> B\n    B --> C';
    const b = 'flowchart LR\nA --> B\nB --> C';
    expect(hashMermaid(a)).toBe(hashMermaid(b));
  });

  it('ignores line-comment differences', () => {
    const a = 'flowchart LR\n%% this is a comment\nA --> B\n';
    const b = 'flowchart LR\n%% different comment text\nA --> B\n';
    expect(hashMermaid(a)).toBe(hashMermaid(b));
  });

  it('is case-insensitive (mermaid keywords are case-sensitive but title-only edits should still match)', () => {
    const a = 'flowchart LR\n    A[Node] --> B[Other]';
    const b = 'FLOWCHART LR\n    A[NODE] --> B[OTHER]';
    expect(hashMermaid(a)).toBe(hashMermaid(b));
  });

  it('differs when structural elements change', () => {
    const a = 'flowchart LR\n    A --> B';
    const b = 'flowchart LR\n    A --> B\n    B --> C';
    expect(hashMermaid(a)).not.toBe(hashMermaid(b));
  });
});

describe('dedupe — near-duplicate heuristic (first 5 lines hash)', () => {
  function nearHash(code: string): string {
    const head = code.split('\n').slice(0, 5).join('\n');
    return sha256(normalizeMermaidForHash(head));
  }

  it('clusters two diagrams that share their first 5 lines but differ later', () => {
    const skeleton = `flowchart LR\n    A --> B\n    B --> C\n    C --> D\n    D --> E`;
    const a = skeleton;
    const b = `${skeleton}\n    E --> F\n    F --> G`;
    expect(nearHash(a)).toBe(nearHash(b));
    // Exact hash differs because the trailing edges change the normalized content.
    expect(hashMermaid(a)).not.toBe(hashMermaid(b));
  });

  it('does not cluster diagrams whose first lines diverge', () => {
    const a = 'flowchart LR\n    A --> B';
    const b = 'sequenceDiagram\n    A->>B: hi';
    expect(nearHash(a)).not.toBe(nearHash(b));
  });
});
