import { describe, expect, it } from 'vitest';
import { enrichViaStub } from '../../../scripts/discover-ingest/lib/ai';
import { CATEGORIES } from '../../../lib/library/categories';

describe('enrich-ai stub — schema validity', () => {
  const samples: Array<{ name: string; code: string }> = [
    {
      name: 'flowchart',
      code: `flowchart LR\n    A[Client] --> B[Server]\n    B --> C[DB]\n    B --> D[Cache]\n    B --> E[Queue]`,
    },
    {
      name: 'sequence',
      code: `sequenceDiagram\n    A->>B: ping\n    B-->>A: pong\n    A->>C: hello\n    C-->>A: hi\n    A->>D: bye`,
    },
    {
      name: 'state',
      code: `stateDiagram-v2\n    [*] --> A\n    A --> B\n    B --> C\n    C --> D\n    D --> [*]`,
    },
    {
      name: 'er',
      code: `erDiagram\n    USER ||--o{ POST : writes\n    POST ||--o{ COMMENT : has\n    USER ||--o{ COMMENT : writes\n    POST ||--|| TAG : labelled`,
    },
  ];

  for (const { name, code } of samples) {
    it(`produces a schema-valid record for a ${name} diagram`, () => {
      const out = enrichViaStub({ mermaidCode: code, repo: 'acme/repo' });
      expect(out.title.length).toBeGreaterThan(0);
      expect(out.title.length).toBeLessThanOrEqual(70);
      expect(out.slug).toMatch(/^[a-z0-9-]+$/);
      expect(out.summary.length).toBeLessThanOrEqual(155);
      expect(out.summary.length).toBeGreaterThan(0);
      expect(out.whatItShows.length).toBeGreaterThan(20);
      expect(out.whenToUse.length).toBeGreaterThan(20);
      expect(out.howToAdapt.length).toBeGreaterThan(20);
      expect(out.keyConcepts.length).toBeGreaterThanOrEqual(1);
      expect(out.tags.length).toBeGreaterThanOrEqual(1);
      expect(out.fallback).toBe(true);
      expect(Object.keys(CATEGORIES)).toContain(out.category);
      expect([
        'flowchart',
        'sequence',
        'class',
        'state',
        'er',
        'gantt',
        'journey',
        'mindmap',
        'c4',
        'other',
      ]).toContain(out.diagramType);
    });
  }

  it('uses an H1/H2 heading from context to seed the title', () => {
    const code = `flowchart LR\n    A --> B --> C --> D --> E\n    E --> F`;
    const out = enrichViaStub({
      mermaidCode: code,
      rawContext: '## RAG Pipeline\n\nThis is the pipeline.',
    });
    expect(out.title.toLowerCase()).toContain('rag pipeline');
  });

  it('flags failureReason as stub-mode', () => {
    const out = enrichViaStub({ mermaidCode: 'flowchart LR\n    A --> B --> C --> D --> E' });
    expect(out.failureReason).toBe('stub-mode');
  });
});
