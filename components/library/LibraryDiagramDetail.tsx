import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getCategory } from '@/lib/library/categories';
import { getRelated } from '@/lib/library/loader';
import { analytics } from '@/utils/analytics';
import LibraryDiagramRenderer from './LibraryDiagramRenderer';
import ForkInArchigramButton from './ForkInArchigramButton';
import LibraryRelatedGrid from './LibraryRelatedGrid';
import type { LibraryDiagram } from '@/lib/library/types';

interface LibraryDiagramDetailProps {
  diagram: LibraryDiagram;
  embedded?: boolean;
}

type Tab = 'diagram' | 'source';

const LibraryDiagramDetail: React.FC<LibraryDiagramDetailProps> = ({
  diagram,
  embedded = false,
}) => {
  const meta = getCategory(diagram.category);
  const [tab, setTab] = useState<Tab>('diagram');
  const [copied, setCopied] = useState(false);
  const related = getRelated(diagram.slug);

  useEffect(() => {
    analytics.libraryDiagramViewed(diagram.slug, diagram.category);
  }, [diagram.slug, diagram.category]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagram.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const sourceHostname = (() => {
    try {
      return new URL(diagram.source.url).hostname.replace(/^www\./, '');
    } catch {
      return diagram.source.url;
    }
  })();

  return (
    <article className={embedded ? 'p-6' : 'mx-auto max-w-5xl px-6 py-12 sm:px-8 sm:py-16'}>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <a href="/library" className="hover:text-zinc-300">
          Library
        </a>
        <span className="mx-2">›</span>
        <a href={`/library/${diagram.category}`} className="hover:text-zinc-300">
          {meta.title}
        </a>
        <span className="mx-2">›</span>
        <span className="text-zinc-300">{diagram.title}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br ${meta.gradient} px-2.5 py-1 font-medium text-white`}
          >
            <Icon icon={meta.iconName} className="h-3 w-3" />
            {meta.title}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-zinc-300">
            {diagram.diagramType}
          </span>
          {diagram.source.license && (
            <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-2.5 py-1 text-emerald-300">
              {diagram.source.license}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          {diagram.title}
        </h1>
        <p className="mt-3 text-lg text-zinc-400">{diagram.ai.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon="lucide:link" className="h-4 w-4" />
            Source:{' '}
            <a
              href={diagram.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-zinc-300 underline-offset-2 hover:text-indigo-300 hover:underline"
            >
              {sourceHostname}
            </a>
          </span>
          {diagram.attribution.author && (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="lucide:user" className="h-4 w-4" />
              Curated by{' '}
              {diagram.attribution.authorUrl ? (
                <a
                  href={diagram.attribution.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-indigo-300"
                >
                  {diagram.attribution.author}
                </a>
              ) : (
                <span className="text-zinc-300">{diagram.attribution.author}</span>
              )}
            </span>
          )}
          {typeof diagram.source.stars === 'number' && (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="lucide:star" className="h-4 w-4" />
              {diagram.source.stars.toLocaleString()} stars on source repo
            </span>
          )}
        </div>
      </header>

      <div className="mb-4 flex items-center gap-1 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setTab('diagram')}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'diagram'
              ? 'border-b-2 border-indigo-500 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Diagram
        </button>
        <button
          type="button"
          onClick={() => setTab('source')}
          className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'source'
              ? 'border-b-2 border-indigo-500 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Mermaid source
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        {tab === 'diagram' ? (
          <LibraryDiagramRenderer
            id={diagram.slug}
            code={diagram.code}
            prerenderedSvg={diagram.preview.svg || undefined}
          />
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <pre className="max-h-[600px] overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-200">
              <code>{diagram.code}</code>
            </pre>
          </div>
        )}
      </div>

      <div className="mb-12 flex flex-wrap items-center gap-3">
        <ForkInArchigramButton diagram={diagram} variant="primary" />
        <a
          href={diagram.source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
        >
          <Icon icon="lucide:external-link" className="h-4 w-4" />
          View original source
        </a>
      </div>

      <section aria-labelledby="what-heading" className="mb-8">
        <h2 id="what-heading" className="mb-2 text-xl font-semibold text-zinc-100">
          What this diagram shows
        </h2>
        <p className="leading-relaxed text-zinc-300">{diagram.ai.whatItShows}</p>
      </section>

      <section aria-labelledby="when-heading" className="mb-8">
        <h2 id="when-heading" className="mb-2 text-xl font-semibold text-zinc-100">
          When to use it
        </h2>
        <p className="leading-relaxed text-zinc-300">{diagram.ai.whenToUse}</p>
      </section>

      <section aria-labelledby="adapt-heading" className="mb-8">
        <h2 id="adapt-heading" className="mb-2 text-xl font-semibold text-zinc-100">
          How to adapt it for your project
        </h2>
        <p className="leading-relaxed text-zinc-300">{diagram.ai.howToAdapt}</p>
      </section>

      {diagram.ai.keyConcepts.length > 0 && (
        <section aria-labelledby="concepts-heading" className="mb-10">
          <h2 id="concepts-heading" className="mb-3 text-xl font-semibold text-zinc-100">
            Key concepts
          </h2>
          <div className="flex flex-wrap gap-2">
            {diagram.ai.keyConcepts.map((c) => (
              <span
                key={c}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-200"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      )}

      <LibraryRelatedGrid diagrams={related} />

      <footer className="mt-16 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        <p>
          This diagram was sourced from{' '}
          <a
            href={diagram.source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-zinc-400 underline-offset-2 hover:text-indigo-300 hover:underline"
          >
            {sourceHostname}
          </a>
          {diagram.source.license ? ` and is available under ${diagram.source.license}` : ''}.
          Commentary and presentation by Archigram.{' '}
          <a
            href={`mailto:hello@archigram.me?subject=Library%20takedown:%20${encodeURIComponent(
              diagram.slug
            )}`}
            className="text-zinc-400 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Suggest a takedown
          </a>
          .
        </p>
      </footer>
    </article>
  );
};

export default LibraryDiagramDetail;
