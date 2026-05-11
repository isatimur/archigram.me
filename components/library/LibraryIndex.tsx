import React from 'react';
import { Icon } from '@iconify/react';
import { listCategories, getCategory } from '@/lib/library/categories';
import { listFeatured, listNewest, listAllDiagrams, categoryCounts } from '@/lib/library/loader';
import LibraryCard from './LibraryCard';

interface LibraryIndexProps {
  /** When rendered inside the editor SPA (DiscoverPage tab), drop the global hero/footer chrome. */
  embedded?: boolean;
}

const LibraryIndex: React.FC<LibraryIndexProps> = ({ embedded = false }) => {
  const categories = listCategories();
  const counts = categoryCounts();
  const total = listAllDiagrams().length;
  const featured = listFeatured(6);
  const newest = listNewest(6);

  return (
    <div className={embedded ? 'p-6' : 'mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16'}>
      {!embedded && (
        <header className="mb-12 max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium text-zinc-300">
            <Icon icon="lucide:sparkles" className="h-3.5 w-3.5 text-amber-300" />
            Library · {total} curated Mermaid diagrams from the web
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            The most useful Mermaid diagrams on the internet — explained, and ready to fork.
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Real-world architecture, sequence, state, and ER diagrams sourced from public repos and
            documentation. Every diagram comes with AI-written commentary, source attribution, and a
            one-click fork into the Archigram editor.
          </p>
        </header>
      )}

      <section aria-labelledby="categories-heading" className="mb-14">
        <h2 id="categories-heading" className="mb-4 text-xl font-semibold text-zinc-100">
          Browse by category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = counts[cat.slug] ?? 0;
            return (
              <a
                key={cat.slug}
                href={`/library/${cat.slug}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.gradient}`}
                >
                  <Icon icon={cat.iconName} className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white">
                  {cat.title}
                </h3>
                <p className="line-clamp-2 text-sm text-zinc-400">{cat.description}</p>
                <span className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                  {count} {count === 1 ? 'diagram' : 'diagrams'}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="mb-14">
        <h2 id="featured-heading" className="mb-4 text-xl font-semibold text-zinc-100">
          Featured
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => (
            <LibraryCard key={d.slug} diagram={d} />
          ))}
        </div>
      </section>

      <section aria-labelledby="newest-heading">
        <h2 id="newest-heading" className="mb-4 text-xl font-semibold text-zinc-100">
          Newest
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newest.map((d) => (
            <LibraryCard key={d.slug} diagram={d} />
          ))}
        </div>
      </section>
    </div>
  );
};

// Re-export so callers can access metadata without re-importing
export { getCategory };
export default LibraryIndex;
