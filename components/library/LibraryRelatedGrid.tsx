import React from 'react';
import LibraryCard from './LibraryCard';
import type { LibraryDiagram } from '@/lib/library/types';

interface LibraryRelatedGridProps {
  diagrams: LibraryDiagram[];
}

const LibraryRelatedGrid: React.FC<LibraryRelatedGridProps> = ({ diagrams }) => {
  if (diagrams.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="mb-4 text-xl font-semibold text-zinc-100">
        Related diagrams
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {diagrams.map((d) => (
          <LibraryCard key={d.slug} diagram={d} />
        ))}
      </div>
    </section>
  );
};

export default LibraryRelatedGrid;
