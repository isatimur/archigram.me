import React from 'react';
import { Icon } from '@iconify/react';
import LibraryIndex from './LibraryIndex';
import LibraryCategory from './LibraryCategory';
import LibraryDiagramDetail from './LibraryDiagramDetail';
import { getDiagramBySlug } from '@/lib/library/loader';
import { isCategorySlug } from '@/lib/library/categories';
import type { LibraryRoute, AppView } from '@/types';

interface LibraryRootProps {
  route: LibraryRoute;
  onNavigate: (view: AppView) => void;
}

const NotFound: React.FC<{ message: string; onNavigate: (view: AppView) => void }> = ({
  message,
  onNavigate,
}) => (
  <div className="mx-auto max-w-2xl px-6 py-24 text-center">
    <Icon icon="lucide:circle-help" className="mx-auto h-10 w-10 text-zinc-500" />
    <h1 className="mt-4 text-2xl font-semibold text-zinc-100">Diagram not found</h1>
    <p className="mt-2 text-zinc-400">{message}</p>
    <a
      href="/library"
      onClick={(e) => {
        e.preventDefault();
        onNavigate('library');
        window.history.pushState(null, '', '/library');
      }}
      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300"
    >
      <Icon icon="lucide:arrow-left" className="h-4 w-4" />
      Back to library
    </a>
  </div>
);

const LibraryRoot: React.FC<LibraryRootProps> = ({ route, onNavigate }) => {
  if (route.kind === 'index') {
    return <LibraryIndex />;
  }

  if (!isCategorySlug(route.category)) {
    return <NotFound message="That category does not exist." onNavigate={onNavigate} />;
  }

  if (route.kind === 'category') {
    return <LibraryCategory category={route.category} />;
  }

  // detail
  const diagram = getDiagramBySlug(route.slug);
  if (!diagram || diagram.category !== route.category) {
    return (
      <NotFound
        message={`We could not find a diagram matching “${route.slug}”.`}
        onNavigate={onNavigate}
      />
    );
  }
  return <LibraryDiagramDetail diagram={diagram} />;
};

export default LibraryRoot;
