import React from 'react';
import { Icon } from '@iconify/react';
import { buildForkUrl } from '@/lib/library/forkUrl';
import { analytics } from '@/utils/analytics';
import type { LibraryDiagram } from '@/lib/library/types';

interface ForkInArchigramButtonProps {
  diagram: Pick<LibraryDiagram, 'slug' | 'category' | 'code'>;
  variant?: 'primary' | 'secondary';
  className?: string;
  label?: string;
}

const ForkInArchigramButton: React.FC<ForkInArchigramButtonProps> = ({
  diagram,
  variant = 'primary',
  className,
  label,
}) => {
  const href = buildForkUrl(diagram.code);

  const handleClick = () => {
    analytics.libraryForked(diagram.slug, diagram.category);
  };

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
      : 'border border-zinc-700/80 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800';

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${base} ${styles} ${className ?? ''}`}
      data-testid="fork-in-archigram"
    >
      <Icon icon="lucide:git-fork" className="h-4 w-4" />
      {label ?? 'Fork in Archigram'}
    </a>
  );
};

export default ForkInArchigramButton;
