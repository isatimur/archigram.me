/**
 * Post-build SSG pre-renderer for /library/* pages.
 *
 * Runs after `vite build` finishes. Reads:
 *   - `dist/index.html`        (to inherit the hashed JS/CSS asset links so the SPA hydrates)
 *   - `data/library/_manifest.json`
 *   - `data/library/<slug>.json` files
 *   - `lib/library/categories.ts` (re-implemented as a plain map here)
 *   - `public/sitemap.xml`     (to merge new library URLs in)
 *
 * Writes:
 *   - `dist/library/index.html`
 *   - `dist/library/<category>/index.html`        ×9
 *   - `dist/library/<category>/<slug>/index.html` ×N (one per diagram in the manifest)
 *   - `dist/sitemap.xml`                          (existing entries + new library URLs)
 *   - `public/sitemap.xml`                        (source-of-truth, same content)
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SITE_ORIGIN = 'https://archigram.me';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const DIST = join(PROJECT_ROOT, 'dist');
const PUBLIC = join(PROJECT_ROOT, 'public');
const DATA_DIR = join(PROJECT_ROOT, 'data', 'library');

// ---------------------------------------------------------------------------
// Types (mirror lib/library/types.ts so the script stays standalone)
// ---------------------------------------------------------------------------

type CategorySlug =
  | 'system-design'
  | 'cloud-architecture'
  | 'data-pipeline'
  | 'ml-ai'
  | 'devops-cicd'
  | 'auth-flows'
  | 'database-er'
  | 'state-machines'
  | 'general-flowcharts';

interface CategoryMeta {
  slug: CategorySlug;
  title: string;
  pluralTitle: string;
  description: string;
  seoKeywords: string[];
}

interface LibrarySource {
  url: string;
  sourceType: string;
  repo?: string;
  license?: string;
  stars?: number;
  fetchedAt: string;
}

interface LibraryAttribution {
  author?: string;
  authorUrl?: string;
}

interface LibraryAi {
  summary: string;
  whatItShows: string;
  whenToUse: string;
  howToAdapt: string;
  keyConcepts: string[];
  fallback: boolean;
}

interface LibraryDiagram {
  slug: string;
  title: string;
  category: CategorySlug;
  diagramType: string;
  code: string;
  source: LibrarySource;
  attribution: LibraryAttribution;
  ai: LibraryAi;
  related: string[];
  tags: string[];
  qualityScore: number;
  ingestedAt: string;
}

interface LibraryManifestEntry {
  slug: string;
  title: string;
  category: CategorySlug;
  diagramType: string;
  qualityScore: number;
  ingestedAt: string;
  tags: string[];
}

interface LibraryManifest {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  diagrams: LibraryManifestEntry[];
}

// ---------------------------------------------------------------------------
// Category metadata (kept in sync with lib/library/categories.ts)
// ---------------------------------------------------------------------------

const CATEGORIES: Record<CategorySlug, CategoryMeta> = {
  'system-design': {
    slug: 'system-design',
    title: 'System Design',
    pluralTitle: 'System Design Diagrams',
    description:
      'Microservices, monoliths, event-driven systems, CQRS, hexagonal architecture — battle-tested patterns from real engineering teams.',
    seoKeywords: ['system design', 'microservices', 'architecture', 'event-driven', 'cqrs'],
  },
  'cloud-architecture': {
    slug: 'cloud-architecture',
    title: 'Cloud Architecture',
    pluralTitle: 'Cloud Architecture Diagrams',
    description:
      'AWS, GCP, and Azure reference architectures — VPC layouts, multi-region patterns, serverless stacks, and well-architected designs.',
    seoKeywords: ['aws architecture', 'gcp architecture', 'azure architecture', 'cloud diagram'],
  },
  'data-pipeline': {
    slug: 'data-pipeline',
    title: 'Data Pipelines',
    pluralTitle: 'Data Pipeline Diagrams',
    description:
      'ETL flows, streaming pipelines, lakehouse architectures, Kafka topologies, Airflow DAGs — modern data engineering patterns.',
    seoKeywords: ['data pipeline', 'etl', 'kafka', 'streaming', 'lakehouse', 'airflow'],
  },
  'ml-ai': {
    slug: 'ml-ai',
    title: 'ML & AI',
    pluralTitle: 'ML & AI System Diagrams',
    description:
      'RAG pipelines, training architectures, inference stacks, agentic systems — how production ML and AI systems fit together.',
    seoKeywords: ['ml architecture', 'rag pipeline', 'ai system design', 'llm inference'],
  },
  'devops-cicd': {
    slug: 'devops-cicd',
    title: 'DevOps & CI/CD',
    pluralTitle: 'DevOps & CI/CD Diagrams',
    description:
      'Kubernetes topologies, deploy strategies, GitOps flows, blue-green deploys, canary rollouts — operational diagrams that ship.',
    seoKeywords: ['cicd', 'kubernetes', 'gitops', 'deploy strategy', 'devops'],
  },
  'auth-flows': {
    slug: 'auth-flows',
    title: 'Auth & Payment Flows',
    pluralTitle: 'Auth & Payment Flow Diagrams',
    description:
      'OAuth 2.0, SAML, JWT, payment flows, KYC, 3DS — sequence diagrams for the flows you have to get right.',
    seoKeywords: ['oauth flow', 'saml', 'jwt', 'payment flow', 'kyc', 'sequence diagram'],
  },
  'database-er': {
    slug: 'database-er',
    title: 'Database Schemas',
    pluralTitle: 'Database & ER Diagrams',
    description:
      'Entity-relationship diagrams and schema designs for SaaS, marketplaces, social, and operational applications.',
    seoKeywords: ['er diagram', 'database schema', 'entity relationship', 'data model'],
  },
  'state-machines': {
    slug: 'state-machines',
    title: 'State Machines',
    pluralTitle: 'State Machine Diagrams',
    description:
      'Workflows, sagas, lifecycles, order states, subscription states — the diagrams that document non-trivial business logic.',
    seoKeywords: ['state machine', 'state diagram', 'workflow', 'saga pattern'],
  },
  'general-flowcharts': {
    slug: 'general-flowcharts',
    title: 'Flowcharts & More',
    pluralTitle: 'Flowcharts, Mindmaps & More',
    description:
      'Decision flows, mindmaps, journeys, Gantt charts — the everyday diagrams teams reach for to think on paper.',
    seoKeywords: ['flowchart', 'mindmap', 'journey map', 'gantt chart', 'decision tree'],
  },
};

const CATEGORY_ORDER: CategorySlug[] = [
  'system-design',
  'cloud-architecture',
  'data-pipeline',
  'ml-ai',
  'devops-cicd',
  'auth-flows',
  'database-er',
  'state-machines',
  'general-flowcharts',
];

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

/** Escape a string for embedding inside a <script type="application/ld+json"> block. */
function escapeJsonLd(json: string): string {
  // Only `</` is dangerous because it could close the <script> tag prematurely.
  return json.replace(/<\/(script)/gi, '<\\/$1');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Read /dist/index.html — extract injected JS module + CSS link + preloads.
// We re-use whatever Vite emitted so React hydrates with the real bundle.
// ---------------------------------------------------------------------------

function loadAssetTags(distIndexHtml: string): { headExtras: string } {
  // Pull everything between </script>-after-jsonld-blocks and </head> that
  // Vite injected. Simpler approach: grep for known patterns and pass them
  // through verbatim. We collect <script ... src="/assets/*">, <link rel="modulepreload" ...>,
  // and <link rel="stylesheet" ...> entries.
  const lines: string[] = [];
  const scriptRe = /<script\b[^>]*\bsrc="\/assets\/[^"]+"[^>]*><\/script>/g;
  const preloadRe = /<link\b[^>]*\brel="modulepreload"[^>]*>/g;
  const cssRe = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="\/assets\/[^"]+"[^>]*>/g;
  for (const re of [scriptRe, preloadRe, cssRe]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(distIndexHtml)) !== null) {
      lines.push(m[0]);
    }
  }
  if (lines.length === 0) {
    throw new Error(
      'build-library-html: failed to extract Vite asset tags from dist/index.html — has `vite build` run?'
    );
  }
  return { headExtras: lines.join('\n    ') };
}

// ---------------------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------------------

function jsonLdTechArticle(diagram: LibraryDiagram, canonical: string): string {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: diagram.title,
    description: diagram.ai.summary,
    image: `${SITE_ORIGIN}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: 'Archigram',
      url: SITE_ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Archigram',
      url: SITE_ORIGIN,
    },
    datePublished: diagram.ingestedAt,
    keywords: diagram.ai.keyConcepts.join(', '),
    mainEntityOfPage: canonical,
    isBasedOn: diagram.source.url,
  };
  if (diagram.attribution.author) {
    node.creator = {
      '@type': 'Person',
      name: diagram.attribution.author,
    };
  }
  if (diagram.source.license) {
    node.license = diagram.source.license;
  }
  return escapeJsonLd(JSON.stringify(node));
}

function jsonLdCollectionPage(
  category: CategoryMeta,
  diagrams: LibraryDiagram[],
  canonical: string
): string {
  const node = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.pluralTitle,
    description: category.description,
    url: canonical,
    keywords: category.seoKeywords.join(', '),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Archigram',
      url: SITE_ORIGIN,
    },
    hasPart: diagrams.map((d) => ({
      '@type': 'TechArticle',
      name: d.title,
      url: `${SITE_ORIGIN}/library/${d.category}/${d.slug}`,
      description: d.ai.summary,
    })),
  };
  return escapeJsonLd(JSON.stringify(node));
}

function jsonLdLibraryWebSite(canonical: string, total: number): string {
  const node = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Archigram Library — Curated Mermaid Diagrams',
    description: `Browse ${total} curated Mermaid diagrams across system design, cloud architecture, data pipelines, ML/AI, DevOps, auth flows, and more. Each diagram includes AI-written commentary and source attribution.`,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Archigram',
      url: SITE_ORIGIN,
    },
  };
  return escapeJsonLd(JSON.stringify(node));
}

// ---------------------------------------------------------------------------
// Shared <head> builder
// ---------------------------------------------------------------------------

interface HeadOpts {
  title: string;
  description: string;
  canonical: string;
  /** Inline JSON-LD scripts (already JSON-stringified + escaped). */
  jsonLd: string[];
  /** When true, emit `<meta name="robots" content="noindex">`. */
  noindex?: boolean;
  /** Asset tags from dist/index.html (modulepreload + entry script + css). */
  assetTags: string;
}

function buildHead(opts: HeadOpts): string {
  const robots = opts.noindex
    ? '<meta name="robots" content="noindex, nofollow" />'
    : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />';

  const jsonLdScripts = opts.jsonLd
    .map((j) => `<script type="application/ld+json">${j}</script>`)
    .join('\n    ');

  const ogImage = `${SITE_ORIGIN}/og-image.png`;

  return `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(opts.title)}</title>
    <meta name="description" content="${escapeAttr(opts.description)}" />
    ${robots}
    <meta name="author" content="Archigram" />
    <link rel="canonical" href="${escapeAttr(opts.canonical)}" />

    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeAttr(opts.canonical)}" />
    <meta property="og:title" content="${escapeAttr(opts.title)}" />
    <meta property="og:description" content="${escapeAttr(opts.description)}" />
    <meta property="og:image" content="${escapeAttr(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Archigram" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(opts.title)}" />
    <meta name="twitter:description" content="${escapeAttr(opts.description)}" />
    <meta name="twitter:image" content="${escapeAttr(ogImage)}" />
    <meta name="twitter:site" content="@archigram_me" />

    <meta name="theme-color" content="#09090b" />

    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
    <link rel="manifest" href="/manifest.json" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />

    ${jsonLdScripts}

    <style>
      body { background-color: rgb(9 9 11); color: rgb(240 240 245); overflow: auto; margin: 0; }
      .ssg-fallback { max-width: 64rem; margin: 0 auto; padding: 3rem 1.5rem; font-family: Inter, system-ui, sans-serif; line-height: 1.6; }
      .ssg-fallback h1 { font-size: 2rem; margin: 0 0 0.5rem; color: #fafafa; }
      .ssg-fallback h2 { font-size: 1.25rem; margin: 2rem 0 0.5rem; color: #fafafa; }
      .ssg-fallback h3 { font-size: 1rem; margin: 1.25rem 0 0.5rem; color: #fafafa; }
      .ssg-fallback p, .ssg-fallback li { color: #d4d4d8; }
      .ssg-fallback a { color: #a5b4fc; text-decoration: underline; text-underline-offset: 2px; }
      .ssg-fallback pre { background: #09090b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 1rem; overflow: auto; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.8125rem; color: #e4e4e7; }
      .ssg-fallback nav { font-size: 0.875rem; color: #71717a; margin-bottom: 1.5rem; }
      .ssg-fallback .ssg-meta { font-size: 0.875rem; color: #a1a1aa; margin: 0.5rem 0 1.5rem; }
      .ssg-fallback .ssg-card { display: block; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; }
      .ssg-fallback .ssg-tag { display: inline-block; border: 1px solid #3f3f46; border-radius: 999px; padding: 0.125rem 0.5rem; font-size: 0.75rem; color: #d4d4d8; margin-right: 0.25rem; }
      .ssg-fallback footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #27272a; font-size: 0.875rem; color: #71717a; }
    </style>
    ${opts.assetTags}
  </head>`;
}

// ---------------------------------------------------------------------------
// Body builders
// ---------------------------------------------------------------------------

/**
 * The SSG body wraps the static content in `.ssg-fallback` directly inside
 * <body>. When React hydrates into #root it replaces this content. We keep
 * the static markup OUTSIDE #root so React doesn't try to reconcile against
 * it — instead the SPA renders into the (initially empty) #root container.
 */
function wrapBody(staticContent: string): string {
  return `<body>
    <div id="root"></div>
    <div class="ssg-fallback" data-ssg="true">
      ${staticContent}
    </div>
  </body>`;
}

function buildDetailBody(diagram: LibraryDiagram, related: LibraryDiagram[]): string {
  const meta = CATEGORIES[diagram.category];
  const license = diagram.source.license || 'unknown license';

  const author = diagram.attribution.author
    ? diagram.attribution.authorUrl
      ? `<a href="${escapeAttr(diagram.attribution.authorUrl)}" rel="noopener noreferrer">${escapeHtml(diagram.attribution.author)}</a>`
      : escapeHtml(diagram.attribution.author)
    : 'Archigram';

  const relatedItems = related
    .map(
      (r) =>
        `<li><a href="/library/${escapeAttr(r.category)}/${escapeAttr(r.slug)}">${escapeHtml(r.title)}</a> — ${escapeHtml(r.ai.summary)}</li>`
    )
    .join('\n        ');

  const keyConcepts = diagram.ai.keyConcepts.map((c) => `<li>${escapeHtml(c)}</li>`).join('');

  const tags = diagram.tags.map((t) => `<span class="ssg-tag">${escapeHtml(t)}</span>`).join(' ');

  return `<nav aria-label="Breadcrumb">
        <a href="/library">Library</a> ›
        <a href="/library/${escapeAttr(diagram.category)}">${escapeHtml(meta.title)}</a> ›
        <span>${escapeHtml(diagram.title)}</span>
      </nav>

      <h1>${escapeHtml(diagram.title)}</h1>
      <p class="ssg-meta">
        ${escapeHtml(meta.title)} · ${escapeHtml(diagram.diagramType)} diagram · ${escapeHtml(license)}
      </p>
      <p>${escapeHtml(diagram.ai.summary)}</p>

      <p class="ssg-meta">
        Source: <a href="${escapeAttr(diagram.source.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(diagram.source.url)}</a><br />
        Curated by ${author}<br />
        ${tags}
      </p>

      <h2>Mermaid source</h2>
      <pre><code class="language-mermaid">${escapeHtml(diagram.code)}</code></pre>

      <h2>What this diagram shows</h2>
      <p>${escapeHtml(diagram.ai.whatItShows)}</p>

      <h2>When to use it</h2>
      <p>${escapeHtml(diagram.ai.whenToUse)}</p>

      <h2>How to adapt it for your project</h2>
      <p>${escapeHtml(diagram.ai.howToAdapt)}</p>

      ${
        diagram.ai.keyConcepts.length > 0
          ? `<h2>Key concepts</h2>\n      <ul>${keyConcepts}</ul>`
          : ''
      }

      ${
        related.length > 0
          ? `<h2>Related diagrams</h2>
      <ul>
        ${relatedItems}
      </ul>`
          : ''
      }

      <footer>
        <p>
          This diagram was sourced from
          <a href="${escapeAttr(diagram.source.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(diagram.source.url)}</a>${
            diagram.source.license
              ? ` and is available under ${escapeHtml(diagram.source.license)}`
              : ''
          }. Commentary and presentation by Archigram.
          <a href="mailto:hello@archigram.me?subject=Library%20takedown:%20${encodeURIComponent(diagram.slug)}">Suggest a takedown</a>.
        </p>
      </footer>`;
}

function buildCategoryBody(meta: CategoryMeta, diagrams: LibraryDiagram[]): string {
  const items =
    diagrams.length === 0
      ? `<p>No diagrams in this category yet. The ingestion pipeline will fill this in soon.</p>`
      : diagrams
          .map(
            (
              d
            ) => `<a class="ssg-card" href="/library/${escapeAttr(d.category)}/${escapeAttr(d.slug)}">
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.ai.summary)}</p>
          <p class="ssg-meta">${escapeHtml(d.diagramType)} · ${escapeHtml(d.source.license || 'unknown license')}</p>
        </a>`
          )
          .join('\n        ');

  return `<nav aria-label="Breadcrumb">
        <a href="/library">Library</a> › <span>${escapeHtml(meta.title)}</span>
      </nav>

      <h1>${escapeHtml(meta.pluralTitle)}</h1>
      <p>${escapeHtml(meta.description)}</p>
      <p class="ssg-meta">${diagrams.length} ${diagrams.length === 1 ? 'diagram' : 'diagrams'}</p>

      <section aria-label="Diagrams in this category">
        ${items}
      </section>

      <footer>
        <p><a href="/library">← Back to library index</a></p>
      </footer>`;
}

function buildIndexBody(diagrams: LibraryDiagram[]): string {
  const total = diagrams.length;
  const categoryCards = CATEGORY_ORDER.map((slug) => {
    const cat = CATEGORIES[slug];
    const count = diagrams.filter((d) => d.category === slug).length;
    return `<a class="ssg-card" href="/library/${escapeAttr(cat.slug)}">
          <h3>${escapeHtml(cat.title)}</h3>
          <p>${escapeHtml(cat.description)}</p>
          <p class="ssg-meta">${count} ${count === 1 ? 'diagram' : 'diagrams'}</p>
        </a>`;
  }).join('\n        ');

  // Featured = top 6 by qualityScore (already sorted). Newest = sort by ingestedAt desc, take 6.
  const featured = [...diagrams].slice(0, 6);
  const newest = [...diagrams].sort((a, b) => b.ingestedAt.localeCompare(a.ingestedAt)).slice(0, 6);

  const featuredItems = featured
    .map(
      (d) => `<a class="ssg-card" href="/library/${escapeAttr(d.category)}/${escapeAttr(d.slug)}">
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.ai.summary)}</p>
        </a>`
    )
    .join('\n        ');

  const newestItems = newest
    .map(
      (d) => `<a class="ssg-card" href="/library/${escapeAttr(d.category)}/${escapeAttr(d.slug)}">
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.ai.summary)}</p>
        </a>`
    )
    .join('\n        ');

  return `<nav aria-label="Breadcrumb">
        <a href="/">Archigram</a> › <span>Library</span>
      </nav>

      <h1>The most useful Mermaid diagrams on the internet — explained, and ready to fork.</h1>
      <p>
        Real-world architecture, sequence, state, and ER diagrams sourced from public repos and
        documentation. Every diagram comes with AI-written commentary, source attribution, and a
        one-click fork into the Archigram editor.
      </p>
      <p class="ssg-meta">Library · ${total} curated Mermaid diagrams from the web</p>

      <h2>Browse by category</h2>
      <section aria-label="Categories">
        ${categoryCards}
      </section>

      <h2>Featured</h2>
      <section aria-label="Featured diagrams">
        ${featuredItems}
      </section>

      <h2>Newest</h2>
      <section aria-label="Newest diagrams">
        ${newestItems}
      </section>

      <footer>
        <p><a href="/">← Back to Archigram</a></p>
      </footer>`;
}

// ---------------------------------------------------------------------------
// File writing
// ---------------------------------------------------------------------------

function writeHtml(outPath: string, content: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, 'utf8');
}

function loadDiagrams(): LibraryDiagram[] {
  const entries = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  const diagrams: LibraryDiagram[] = [];
  for (const file of entries) {
    const raw = readFileSync(join(DATA_DIR, file), 'utf8');
    diagrams.push(JSON.parse(raw) as LibraryDiagram);
  }
  // Sort by qualityScore desc (matches loader.listAllDiagrams behavior)
  diagrams.sort((a, b) => b.qualityScore - a.qualityScore);
  return diagrams;
}

function loadManifest(): LibraryManifest {
  const raw = readFileSync(join(DATA_DIR, '_manifest.json'), 'utf8');
  return JSON.parse(raw) as LibraryManifest;
}

// ---------------------------------------------------------------------------
// Page assembly
// ---------------------------------------------------------------------------

function htmlDoc(head: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  ${head}
  ${body}
</html>
`;
}

function buildDetailPage(
  diagram: LibraryDiagram,
  related: LibraryDiagram[],
  assetTags: string
): string {
  const canonical = `${SITE_ORIGIN}/library/${diagram.category}/${diagram.slug}`;
  const title = truncate(`${diagram.title} — Mermaid Diagram Example | Archigram`, 70);
  const description = truncate(diagram.ai.summary, 155);
  const noindex = !diagram.source.license;
  const head = buildHead({
    title,
    description,
    canonical,
    jsonLd: [jsonLdTechArticle(diagram, canonical)],
    noindex,
    assetTags,
  });
  const body = wrapBody(buildDetailBody(diagram, related));
  return htmlDoc(head, body);
}

function buildCategoryPage(
  category: CategorySlug,
  diagrams: LibraryDiagram[],
  assetTags: string
): string {
  const meta = CATEGORIES[category];
  const canonical = `${SITE_ORIGIN}/library/${category}`;
  const title = truncate(`${meta.pluralTitle} | Archigram Library`, 70);
  const description = truncate(meta.description, 155);
  const head = buildHead({
    title,
    description,
    canonical,
    jsonLd: [jsonLdCollectionPage(meta, diagrams, canonical)],
    assetTags,
  });
  const body = wrapBody(buildCategoryBody(meta, diagrams));
  return htmlDoc(head, body);
}

function buildIndexPage(diagrams: LibraryDiagram[], assetTags: string): string {
  const canonical = `${SITE_ORIGIN}/library`;
  const total = diagrams.length;
  const title = truncate(`Mermaid Diagram Library — ${total}+ Curated Examples | Archigram`, 70);
  const description = truncate(
    `Browse curated Mermaid diagrams across system design, cloud architecture, data pipelines, ML/AI, DevOps, and auth flows. Every diagram includes AI commentary and is ready to fork.`,
    155
  );
  const head = buildHead({
    title,
    description,
    canonical,
    jsonLd: [jsonLdLibraryWebSite(canonical, total)],
    assetTags,
  });
  const body = wrapBody(buildIndexBody(diagrams));
  return htmlDoc(head, body);
}

// ---------------------------------------------------------------------------
// Sitemap merge
// ---------------------------------------------------------------------------

function buildLibrarySitemapEntries(diagrams: LibraryDiagram[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const parts: string[] = [];

  parts.push(`  <url>
    <loc>${SITE_ORIGIN}/library</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  for (const slug of CATEGORY_ORDER) {
    parts.push(`  <url>
    <loc>${SITE_ORIGIN}/library/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  for (const d of diagrams) {
    if (!d.source.license) continue; // license-unknown pages stay out of sitemap
    const lastmod = d.ingestedAt.slice(0, 10);
    parts.push(`  <url>
    <loc>${SITE_ORIGIN}/library/${d.category}/${d.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  return parts.join('\n');
}

function mergeSitemap(existingXml: string, diagrams: LibraryDiagram[]): string {
  // Strip any pre-existing /library/* entries so re-runs are idempotent.
  // We regex over each <url>...</url> block and skip those whose <loc> contains "/library".
  const urlBlockRe = /\s*<url>[\s\S]*?<\/url>/g;
  const filtered = existingXml.replace(urlBlockRe, (block) => {
    if (/<loc>[^<]*\/library(\/|<)/i.test(block)) return '';
    return block;
  });

  const libraryEntries = buildLibrarySitemapEntries(diagrams);

  // Insert library entries just before </urlset>.
  return filtered.replace(/<\/urlset>\s*$/i, `\n${libraryEntries}\n</urlset>\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error(
      `build-library-html: dist/index.html does not exist — run \`vite build\` first.`
    );
  }

  const distIndex = readFileSync(join(DIST, 'index.html'), 'utf8');
  const { headExtras: assetTags } = loadAssetTags(distIndex);

  const manifest = loadManifest();
  const allDiagrams = loadDiagrams();

  // Validate manifest references resolve. We don't fail the build, just warn.
  const slugSet = new Set(allDiagrams.map((d) => d.slug));
  for (const m of manifest.diagrams) {
    if (!slugSet.has(m.slug)) {
      console.warn(`[build-library-html] manifest references missing slug: ${m.slug}`);
    }
  }

  let written = 0;

  // 1. /library
  const indexHtml = buildIndexPage(allDiagrams, assetTags);
  writeHtml(join(DIST, 'library', 'index.html'), indexHtml);
  written++;

  // 2. /library/<category>
  for (const slug of CATEGORY_ORDER) {
    const inCategory = allDiagrams.filter((d) => d.category === slug);
    const html = buildCategoryPage(slug, inCategory, assetTags);
    writeHtml(join(DIST, 'library', slug, 'index.html'), html);
    written++;
  }

  // 3. /library/<category>/<slug>
  const diagramBySlug = new Map(allDiagrams.map((d) => [d.slug, d]));
  for (const d of allDiagrams) {
    const related = d.related
      .map((s) => diagramBySlug.get(s))
      .filter((x): x is LibraryDiagram => Boolean(x));
    const html = buildDetailPage(d, related, assetTags);
    writeHtml(join(DIST, 'library', d.category, d.slug, 'index.html'), html);
    written++;
  }

  // 4. Sitemap merge (public + dist)
  const publicSitemapPath = join(PUBLIC, 'sitemap.xml');
  const distSitemapPath = join(DIST, 'sitemap.xml');
  const existingSitemap = readFileSync(publicSitemapPath, 'utf8');
  const merged = mergeSitemap(existingSitemap, allDiagrams);
  writeFileSync(publicSitemapPath, merged, 'utf8');
  writeFileSync(distSitemapPath, merged, 'utf8');

  console.log(
    `[build-library-html] wrote ${written} HTML files under dist/library/ and updated sitemap.xml`
  );
}

main();
