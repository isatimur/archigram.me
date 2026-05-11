/**
 * Extracts ```mermaid blocks from arbitrary markdown.
 *
 * Returns each block along with a ~200-char raw context window (text from
 * before AND after the block) which downstream stages use as a hint for AI
 * enrichment and title extraction.
 */

const MIN_CODE_LENGTH = 50;
const MAX_CODE_LENGTH = 50_000;

export type ExtractedBlock = {
  code: string;
  context: string;
};

export function extractMermaidBlocks(markdown: string): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = [];
  const fence = /```mermaid\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(markdown)) !== null) {
    const code = match[1].trim();
    if (code.length < MIN_CODE_LENGTH) continue;
    if (code.length > MAX_CODE_LENGTH) continue;
    const start = match.index;
    const end = match.index + match[0].length;
    const before = markdown.slice(Math.max(0, start - 200), start);
    const after = markdown.slice(end, end + 200);
    blocks.push({ code, context: (before + '\n' + after).trim() });
  }
  return blocks;
}
