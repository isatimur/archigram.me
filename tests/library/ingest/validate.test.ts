import { describe, expect, it } from 'vitest';
import { countNodesAndEdges, detectDiagramType } from '../../../scripts/discover-ingest/lib/util';
import { extractMermaidBlocks } from '../../../scripts/discover-ingest/lib/extract';

describe('validate — countNodesAndEdges', () => {
  it('rejects a 2-node flowchart as below the minimum', () => {
    const { nodes } = countNodesAndEdges('flowchart LR\n    A --> B');
    expect(nodes).toBeLessThan(5);
  });

  it('accepts a well-formed payments service diagram', () => {
    const code = `flowchart LR
        Client[Client App] --> Gateway[API Gateway]
        Gateway --> Auth[Auth Service]
        Gateway --> Pay[Payments Service]
        Pay --> Stripe[Stripe API]
        Pay --> Ledger[(Ledger DB)]
        Pay --> Queue[[Payout Queue]]
        Queue --> Worker[Payout Worker]
        Worker --> Bank[Bank Transfer API]`;
    const { nodes, edges } = countNodesAndEdges(code);
    expect(nodes).toBeGreaterThanOrEqual(8);
    expect(edges).toBeGreaterThan(0);
  });

  it('counts sequence diagram participants', () => {
    const code = `sequenceDiagram
        participant U as User
        participant SPA as SPA
        participant AS as AuthServer
        participant API as API
        participant DB as Database
        U->>SPA: open app
        SPA->>AS: authorize
        AS-->>SPA: code
        SPA->>API: token
        API->>DB: lookup user`;
    const { nodes } = countNodesAndEdges(code);
    expect(nodes).toBeGreaterThanOrEqual(5);
  });
});

describe('validate — detectDiagramType', () => {
  it.each([
    ['flowchart LR\n    A --> B', 'flowchart'],
    ['graph TD\n    A --> B', 'flowchart'],
    ['sequenceDiagram\n    A->>B: hi', 'sequence'],
    ['classDiagram\n    class Foo', 'class'],
    ['stateDiagram-v2\n    [*] --> A', 'state'],
    ['erDiagram\n    USER ||--o{ POST : writes', 'er'],
    ['gantt\n    title Plan', 'gantt'],
    ['journey\n    title My Day', 'journey'],
    ['mindmap\n  root', 'mindmap'],
    ['C4Context\n    title Foo', 'c4'],
    ['pie\n    "A": 50', 'other'],
  ])('detects %s as %s', (code, expected) => {
    expect(detectDiagramType(code)).toBe(expected);
  });
});

describe('validate — extractMermaidBlocks', () => {
  it('extracts a single fenced block', () => {
    const md = `# Heading\n\nSome text.\n\n\`\`\`mermaid\nflowchart LR\n    A --> B --> C --> D --> E\n    E --> F\n\`\`\`\n\nMore text.`;
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toContain('flowchart LR');
    expect(blocks[0].context.length).toBeGreaterThan(0);
  });

  it('skips blocks below the minimum size threshold', () => {
    const md = `\`\`\`mermaid\nA --> B\n\`\`\``;
    expect(extractMermaidBlocks(md)).toHaveLength(0);
  });

  it('extracts multiple blocks from one document', () => {
    const long =
      'flowchart LR\n' + Array.from({ length: 10 }, (_, i) => `    N${i} --> N${i + 1}`).join('\n');
    const md = `## A\n\n\`\`\`mermaid\n${long}\n\`\`\`\n\n## B\n\n\`\`\`mermaid\n${long}\n\`\`\``;
    expect(extractMermaidBlocks(md)).toHaveLength(2);
  });
});
