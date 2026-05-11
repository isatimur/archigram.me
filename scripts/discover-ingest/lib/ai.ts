/**
 * AI enrichment client.
 *
 * Provides two paths:
 *   1. `enrichViaGemini`  — real Gemini 2.5 Flash call with structured output
 *   2. `enrichViaStub`    — deterministic synthesis from the mermaid source
 *
 * The stub is used in dry-run mode AND as a fallback when Gemini fails after
 * retries. Either way the output is schema-valid so downstream stages don't
 * need to special-case it.
 */

import { detectDiagramType, slugify, sleep } from './util';
import type { CategorySlug, DiagramType } from '../../../lib/library/types';

export type EnrichmentResult = {
  title: string;
  slug: string;
  summary: string;
  category: CategorySlug;
  diagramType: DiagramType;
  whatItShows: string;
  whenToUse: string;
  howToAdapt: string;
  keyConcepts: string[];
  tags: string[];
  fallback: boolean;
  failureReason?: string;
};

const VALID_CATEGORIES: ReadonlySet<CategorySlug> = new Set<CategorySlug>([
  'system-design',
  'cloud-architecture',
  'data-pipeline',
  'ml-ai',
  'devops-cicd',
  'auth-flows',
  'database-er',
  'state-machines',
  'general-flowcharts',
]);

const VALID_DIAGRAM_TYPES: ReadonlySet<DiagramType> = new Set<DiagramType>([
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
]);

/**
 * Map a detected diagram type to its most likely category. Used by the stub
 * and as a fallback when AI returns an unrecognised category.
 */
function defaultCategoryFor(t: DiagramType): CategorySlug {
  switch (t) {
    case 'sequence':
      return 'auth-flows';
    case 'state':
      return 'state-machines';
    case 'er':
      return 'database-er';
    case 'class':
      return 'system-design';
    case 'c4':
      return 'system-design';
    case 'gantt':
    case 'journey':
    case 'mindmap':
      return 'general-flowcharts';
    default:
      return 'general-flowcharts';
  }
}

/** Pull a heading-like phrase from raw context to seed a title in the stub. */
function extractTitleHint(rawContext: string | undefined, fallback: string): string {
  if (!rawContext) return fallback;
  const heading = rawContext.match(/#{1,3}\s+([^\n]+)/);
  if (heading?.[1]) return heading[1].trim().slice(0, 70);
  return fallback;
}

/**
 * Deterministic stub used in dry-run mode and as a final fallback.
 *
 * Produces schema-valid output that's clearly synthetic (so a human reviewer
 * can flag `ai.fallback: true` records). It is intentionally not creative —
 * the goal is to keep the pipeline composable, not to ship stub commentary.
 */
export function enrichViaStub(input: {
  mermaidCode: string;
  rawContext?: string;
  repo?: string;
}): EnrichmentResult {
  const diagramType = detectDiagramType(input.mermaidCode);
  const category = defaultCategoryFor(diagramType);
  const repoHint = input.repo ? (input.repo.split('/').pop() ?? input.repo) : 'community source';
  const titleHint = extractTitleHint(input.rawContext, `${diagramType} diagram from ${repoHint}`);
  const title = titleHint.length > 0 ? titleHint : `${diagramType} diagram`;
  const slug = slugify(title);

  return {
    title: title.slice(0, 70),
    slug,
    summary:
      `Auto-generated ${diagramType} diagram entry awaiting editorial review. ` +
      `Sourced from ${repoHint}.`.slice(0, 155),
    category,
    diagramType,
    whatItShows:
      `This ${diagramType} diagram was extracted from ${repoHint}. ` +
      `It has not yet been reviewed; the deterministic stub generator ` +
      `produced this commentary so the ingestion pipeline could complete ` +
      `without a Gemini call. Use the source link to verify what the ` +
      `original author intended this diagram to convey.`,
    whenToUse:
      `Treat this entry as a candidate. Review the source before relying on ` +
      `it for a real architecture decision. The actual "when to use" commentary ` +
      `will be regenerated when the operator re-runs ingestion with a working ` +
      `Gemini API key.`,
    howToAdapt:
      `Fork the diagram in Archigram to start tweaking. The shape and node ` +
      `labels are preserved verbatim from the source, so structural changes ` +
      `should be straightforward. Editorial commentary will replace this stub ` +
      `once the diagram passes review.`,
    keyConcepts: [diagramType, 'community', 'unreviewed'],
    tags: [diagramType, 'auto-generated', 'review-pending'],
    fallback: true,
    failureReason: 'stub-mode',
  };
}

type GeminiClient = {
  models: {
    generateContent: (args: {
      model: string;
      contents: unknown;
      config?: unknown;
    }) => Promise<{ text?: string }>;
  };
};

let cachedClient: GeminiClient | null = null;

async function getGeminiClient(): Promise<GeminiClient | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;
  if (cachedClient) return cachedClient;
  const mod = (await import('@google/genai')) as {
    GoogleGenAI: new (init: { apiKey: string }) => GeminiClient;
  };
  cachedClient = new mod.GoogleGenAI({ apiKey });
  return cachedClient;
}

const ENRICH_PROMPT_INSTRUCTION =
  `You are the editor curating a public diagram library. ` +
  `Given a Mermaid diagram, produce a structured JSON record. ` +
  `Be concise, accurate, and SEO-friendly. ` +
  `Do not invent technologies that are not present in the diagram code. ` +
  `Respond with ONLY a JSON object — no markdown fences, no commentary.`;

const ENRICH_RESPONSE_SCHEMA = {
  type: 'object',
  required: [
    'title',
    'slug',
    'summary',
    'category',
    'diagramType',
    'whatItShows',
    'whenToUse',
    'howToAdapt',
    'keyConcepts',
    'tags',
  ],
  properties: {
    title: { type: 'string', maxLength: 70 },
    slug: { type: 'string' },
    summary: { type: 'string', maxLength: 155 },
    category: {
      type: 'string',
      enum: [
        'system-design',
        'cloud-architecture',
        'data-pipeline',
        'ml-ai',
        'devops-cicd',
        'auth-flows',
        'database-er',
        'state-machines',
        'general-flowcharts',
      ],
    },
    diagramType: {
      type: 'string',
      enum: [
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
      ],
    },
    whatItShows: { type: 'string' },
    whenToUse: { type: 'string' },
    howToAdapt: { type: 'string' },
    keyConcepts: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 5,
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 7,
    },
  },
} as const;

function parseGeminiResponse(text: string): Record<string, unknown> | null {
  // Strip accidental fences just in case the model ignored the structured-output config.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function coerceResult(
  raw: Record<string, unknown>,
  stub: EnrichmentResult
): EnrichmentResult | null {
  const get = (k: string): string | undefined =>
    typeof raw[k] === 'string' ? (raw[k] as string) : undefined;
  const getArr = (k: string): string[] | undefined => {
    const v = raw[k];
    if (!Array.isArray(v)) return undefined;
    const arr = v.filter((x): x is string => typeof x === 'string');
    return arr.length > 0 ? arr : undefined;
  };

  const title = get('title')?.slice(0, 70) ?? stub.title;
  const slug = slugify(get('slug') ?? title);
  const summary = get('summary')?.slice(0, 155) ?? stub.summary;
  const rawCategory = get('category') ?? '';
  const category: CategorySlug = VALID_CATEGORIES.has(rawCategory as CategorySlug)
    ? (rawCategory as CategorySlug)
    : stub.category;
  const rawType = get('diagramType') ?? '';
  const diagramType: DiagramType = VALID_DIAGRAM_TYPES.has(rawType as DiagramType)
    ? (rawType as DiagramType)
    : stub.diagramType;
  const whatItShows = get('whatItShows') ?? stub.whatItShows;
  const whenToUse = get('whenToUse') ?? stub.whenToUse;
  const howToAdapt = get('howToAdapt') ?? stub.howToAdapt;
  const keyConcepts = getArr('keyConcepts') ?? stub.keyConcepts;
  const tags = getArr('tags') ?? stub.tags;

  if (!title || !slug) return null;

  return {
    title,
    slug,
    summary,
    category,
    diagramType,
    whatItShows,
    whenToUse,
    howToAdapt,
    keyConcepts: keyConcepts.slice(0, 5),
    tags: tags.slice(0, 7),
    fallback: false,
  };
}

export async function enrichViaGemini(input: {
  mermaidCode: string;
  rawContext?: string;
  repo?: string;
}): Promise<EnrichmentResult> {
  const client = await getGeminiClient();
  const stub = enrichViaStub(input);
  if (!client) {
    return { ...stub, failureReason: 'no-api-key' };
  }

  const userPrompt =
    `Repository: ${input.repo ?? 'unknown'}\n` +
    `Surrounding markdown context (may be empty):\n${input.rawContext ?? ''}\n\n` +
    'Mermaid diagram:\n```mermaid\n' +
    input.mermaidCode +
    '\n```\n\n' +
    'Produce the JSON record now.';

  const maxAttempts = 3;
  let lastError = 'unknown';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: ENRICH_PROMPT_INSTRUCTION,
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: ENRICH_RESPONSE_SCHEMA,
        },
      });
      const parsed = parseGeminiResponse(response.text ?? '');
      if (!parsed) {
        lastError = 'invalid-json';
      } else {
        const coerced = coerceResult(parsed, stub);
        if (coerced) return coerced;
        lastError = 'schema-coercion-failed';
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    // Exponential backoff: 500ms, 1500ms, 4500ms
    if (attempt < maxAttempts) await sleep(500 * 3 ** (attempt - 1));
  }

  return { ...stub, failureReason: `gemini-failed: ${lastError}` };
}
