import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { Collection, CommunityDiagram } from '../types.ts';

interface CollectionViewProps {
  collection: Collection;
  diagrams: CommunityDiagram[];
  isLoading: boolean;
  onBack: () => void;
  onFork: (diagram: CommunityDiagram) => void;
  icon?: React.ReactNode;
  gradient?: string;
}

const CollectionView: React.FC<CollectionViewProps> = ({
  collection,
  diagrams,
  isLoading,
  onBack,
  onFork,
  icon,
  gradient = 'from-indigo-600 to-blue-500',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Icon icon="lucide:arrow-left" className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            {icon || <Icon icon="lucide:layers" className="w-5 h-5 text-indigo-400" />}
            <h1 className="text-lg sm:text-xl font-bold truncate">{collection.title}</h1>
          </div>
          <span className="ml-auto text-xs text-zinc-500 hidden sm:block">
            {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Collection Hero */}
      <div className={`bg-gradient-to-r ${gradient} py-8 sm:py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
              {icon || <Icon icon="lucide:layers" className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-bold mb-2">{collection.title}</h2>
              <p className="text-sm sm:text-base text-white/80 max-w-2xl">
                {collection.description}
              </p>
              <p className="text-xs text-white/50 mt-2">Curated by {collection.curator}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Diagrams List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : diagrams.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">No diagrams in this collection yet.</p>
            <p className="text-sm mt-2">Check back soon for new additions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {diagram.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{diagram.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {diagram.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-zinc-400 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Icon icon="lucide:heart" className="w-3.5 h-3.5" />
                      {diagram.likes}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                      {diagram.views}
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === diagram.id ? null : diagram.id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                      title="View code"
                    >
                      <Icon icon="lucide:code-2" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onFork(diagram)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Icon icon="lucide:git-fork" className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fork</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Code Preview */}
                {expandedId === diagram.id && (
                  <div className="border-t border-white/5 bg-black/30 p-4">
                    <pre className="text-xs text-zinc-300 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                      {diagram.code}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionView;
