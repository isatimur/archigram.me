import React from 'react';
import { Icon } from '@iconify/react';
import { getCategory } from '@/lib/library/categories';
import type { LibraryDiagram, LibraryManifestEntry } from '@/lib/library/types';

interface LibraryCardProps {
  diagram: LibraryDiagram | LibraryManifestEntry;
  href?: string;
  onClick?: () => void;
}

const DIAGRAM_TYPE_ICON: Record<string, string> = {
  flowchart: 'lucide:network',
  sequence: 'lucide:arrow-right-left',
  class: 'lucide:box',
  state: 'lucide:workflow',
  er: 'lucide:table-2',
  gantt: 'lucide:calendar',
  journey: 'lucide:route',
  mindmap: 'lucide:git-fork',
  c4: 'lucide:layers',
  other: 'lucide:shapes',
};

const LibraryCard: React.FC<LibraryCardProps> = ({ diagram, href, onClick }) => {
  const category = getCategory(diagram.category);
  const typeIcon = DIAGRAM_TYPE_ICON[diagram.diagramType] ?? 'lucide:shapes';
  const summary =
    'ai' in diagram && diagram.ai?.summary
      ? diagram.ai.summary
      : `${category.title} diagram — ${diagram.diagramType}`;

  const linkHref = href ?? `/library/${diagram.category}/${diagram.slug}`;

  return (
    <a
      href={linkHref}
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${category.gradient}`}
      >
        <Icon icon={category.iconName} className="h-10 w-10 text-white/90" />
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur">
          <Icon icon={typeIcon} className="h-3 w-3" />
          {diagram.diagramType}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
          <span>{category.title}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-zinc-100 group-hover:text-white">
          {diagram.title}
        </h3>
        <p className="line-clamp-3 text-sm text-zinc-400">{summary}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {diagram.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-[11px] text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};

export default LibraryCard;
