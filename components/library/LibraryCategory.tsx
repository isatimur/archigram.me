import React from 'react';
import { Icon } from '@iconify/react';
import { getCategory } from '@/lib/library/categories';
import { listByCategory } from '@/lib/library/loader';
import LibraryCard from './LibraryCard';
import type { CategorySlug } from '@/lib/library/types';

interface LibraryCategoryProps {
  category: CategorySlug;
  embedded?: boolean;
}

const LibraryCategory: React.FC<LibraryCategoryProps> = ({ category, embedded = false }) => {
  const meta = getCategory(category);
  const diagrams = listByCategory(category);

  return (
    <div className={embedded ? 'p-6' : 'mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16'}>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <a href="/library" className="hover:text-zinc-300">
          Library
        </a>
        <span className="mx-2">›</span>
        <span className="text-zinc-300">{meta.title}</span>
      </nav>

      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient}`}
          >
            <Icon icon={meta.iconName} className="h-7 w-7 text-white" />
          </div>
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
              {meta.pluralTitle}
            </h1>
            <p className="mt-2 text-zinc-400">{meta.description}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
              {diagrams.length} {diagrams.length === 1 ? 'diagram' : 'diagrams'}
            </p>
          </div>
        </div>
      </header>

      {diagrams.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-10 text-center">
          <p className="text-zinc-400">
            No diagrams in this category yet. The ingestion pipeline will fill this in soon.
          </p>
          <a
            href="/library"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Icon icon="lucide:arrow-left" className="h-4 w-4" />
            Back to library
          </a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagrams.map((d) => (
            <LibraryCard key={d.slug} diagram={d} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryCategory;
