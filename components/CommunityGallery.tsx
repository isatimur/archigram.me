import { Icon } from '@iconify/react';
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { trendingScore } from '../utils/trending.ts';
import { toast } from 'sonner';
import { AppView, CommunityDiagram, User } from '../types.ts';
import { COMMUNITY_DATA, LIKED_IDS_KEY } from '../constants.ts';
import DiagramPreview from './DiagramPreview.tsx';
import { decodeCodeFromUrl } from '../utils/url.ts';
import {
  fetchCommunityDiagrams,
  incrementDiagramLikes,
  incrementDiagramViews,
} from '../lib/firestore/diagrams.ts';
import { analytics } from '../utils/analytics.ts';

const CommentThread = lazy(() => import('./CommentThread.tsx'));

type SortMode = 'trending' | 'new' | 'top';

type CommunityGalleryProps = {
  onNavigate: (view: AppView) => void;
  onFork: (diagram: CommunityDiagram) => void;
  user?: User | null;
  onOpenAuth?: () => void;
  onRequireAuth?: (action: () => void) => void;
};

const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  onNavigate,
  onFork,
  user,
  onOpenAuth,
  onRequireAuth,
}) => {
  const [sort, setSort] = useState<SortMode>('trending');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');

  // Data state
  const [diagrams, setDiagrams] = useState<CommunityDiagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Comment state
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

  // Load likes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LIKED_IDS_KEY);
    if (saved) {
      try {
        setLikedIds(new Set(JSON.parse(saved)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Fetch diagrams on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const loaded = await fetchCommunityDiagrams(100);
      const loadedDiagrams = loaded.length > 0 ? loaded : COMMUNITY_DATA;
      setDiagrams(loadedDiagrams);
      const counts: Record<string, number> = {};
      loadedDiagrams.forEach((d) => {
        counts[d.id] = d.commentCount ?? 0;
      });
      setCommentCounts(counts);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Derive all unique tags from loaded diagrams
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    diagrams.forEach((d) => d.tags.forEach((t) => tagSet.add(t)));
    return ['All', ...Array.from(tagSet).sort()];
  }, [diagrams]);

  const filteredData = useMemo(() => {
    let result = [...diagrams];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.author.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (activeTag !== 'All') {
      result = result.filter((d) => d.tags.includes(activeTag));
    }

    // Sort
    result.sort((a, b) => {
      if (sort === 'trending') {
        return (
          trendingScore(b.likes, b.views, b.createdAtTimestamp ?? 0) -
          trendingScore(a.likes, a.views, a.createdAtTimestamp ?? 0)
        );
      }
      if (sort === 'top') return b.likes - a.likes;
      if (sort === 'new') return (b.createdAtTimestamp ?? 0) - (a.createdAtTimestamp ?? 0);
      return 0;
    });

    return result;
  }, [diagrams, searchQuery, activeTag, sort]);

  const performLike = async (id: string, currentLikes: number) => {
    const isLiked = likedIds.has(id);
    const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(id);
    else newLikedIds.add(id);

    setLikedIds(newLikedIds);
    localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(Array.from(newLikedIds)));
    setDiagrams((prev) => prev.map((d) => (d.id === id ? { ...d, likes: newLikes } : d)));

    if (!isLiked) analytics.diagramLiked();

    const success = await incrementDiagramLikes(id, isLiked ? -1 : 1);
    if (!success) {
      toast.error('Failed to update like');
      setDiagrams((prev) => prev.map((d) => (d.id === id ? { ...d, likes: currentLikes } : d)));
      setLikedIds((prev) => {
        const reverted = new Set(prev);
        if (isLiked) reverted.add(id);
        else reverted.delete(id);
        localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(Array.from(reverted)));
        return reverted;
      });
    }
  };

  const handleLike = (e: React.MouseEvent, id: string, currentLikes: number) => {
    e.stopPropagation();
    if (onRequireAuth) {
      onRequireAuth(() => performLike(id, currentLikes));
    } else {
      performLike(id, currentLikes);
    }
  };

  const handleForkWithStats = (diagram: CommunityDiagram) => {
    incrementDiagramViews(diagram.id);
    onFork(diagram);
  };

  const handleImport = () => {
    setImportError('');
    if (!importUrl) return;

    try {
      let hash = '';
      if (importUrl.includes('#')) {
        hash = importUrl.split('#')[1];
      } else {
        hash = importUrl;
      }

      const code = decodeCodeFromUrl(hash);
      if (!code) {
        setImportError('Invalid or corrupted link.');
        return;
      }

      const importedDiagram: CommunityDiagram = {
        id: `imported-${Date.now()}`,
        title: 'Imported Diagram',
        author: 'External User',
        description: 'Imported via shared link.',
        code,
        likes: 0,
        views: 0,
        tags: ['Imported'],
        createdAt: 'Just now',
      };

      onFork(importedDiagram);
      setShowImport(false);
      setImportUrl('');
    } catch {
      setImportError('Failed to parse URL.');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-text flex flex-col font-sans overflow-hidden relative">
      {/* Navbar */}
      <nav className="h-14 md:h-16 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 shrink-0 z-50 gap-2">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
            title="Back to Home"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border hidden md:block" />
          <div className="flex items-center gap-2">
            <Icon icon="lucide:globe" className="w-5 h-5 text-accent hidden sm:block" />
            <span className="font-bold text-sm md:text-lg tracking-tight hidden sm:inline">
              Community Gallery
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-sm mx-2 md:mx-4 group">
          <Icon
            icon="lucide:search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search diagrams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-hover transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 p-2 md:px-3 md:py-2 text-sm font-medium text-text-muted hover:text-text border border-border hover:bg-surface rounded-lg transition-all"
            title="Import from URL"
          >
            <Icon icon="lucide:download" className="w-4 h-4" />
            <span className="hidden md:inline">Import URL</span>
          </button>

          <button
            onClick={() => onNavigate('app')}
            className="bg-primary hover:bg-primary-hover text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <span className="hidden sm:inline">My Workspace</span>
            <span className="sm:hidden">Studio</span>
          </button>
        </div>
      </nav>

      {/* Sticky Tag + Sort Strip */}
      <div className="sticky top-0 z-40 border-b border-border bg-[#09090b]/95 backdrop-blur-xl px-4 md:px-8 py-2.5 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Tag pills — horizontally scrollable */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 rounded-full bg-surface animate-pulse shrink-0"
                    style={{ width: `${44 + i * 14}px` }}
                  />
                ))
              : allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      activeTag === tag
                        ? 'bg-primary text-white shadow-sm shadow-primary/30'
                        : 'bg-surface text-text-muted hover:text-text hover:bg-surface-hover border border-border/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
          </div>

          {/* Sort — right-aligned, never wraps */}
          <div className="flex items-center gap-1 shrink-0 border-l border-border/50 pl-3">
            <SortButton
              active={sort === 'trending'}
              onClick={() => setSort('trending')}
              icon={<Icon icon="lucide:trending-up" className="w-3.5 h-3.5" />}
            >
              Trending
            </SortButton>
            <SortButton
              active={sort === 'new'}
              onClick={() => setSort('new')}
              icon={<Icon icon="lucide:clock" className="w-3.5 h-3.5" />}
            >
              New
            </SortButton>
            <SortButton
              active={sort === 'top'}
              onClick={() => setSort('top')}
              icon={<Icon icon="lucide:star" className="w-3.5 h-3.5" />}
            >
              Top
            </SortButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Community Diagrams
            </h1>
            <p className="text-text-muted text-sm md:text-base">
              {isLoading ? (
                <span className="inline-block w-48 h-4 bg-surface animate-pulse rounded" />
              ) : (
                <>{diagrams.length} diagrams from the community</>
              )}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <SkeletonGrid />
          ) : filteredData.length === 0 ? (
            <EmptyState
              activeTag={activeTag}
              searchQuery={searchQuery}
              onResetTag={() => setActiveTag('All')}
              onResetSearch={() => setSearchQuery('')}
            />
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
              {filteredData.map((diagram, i) => (
                <DiagramCard
                  key={diagram.id}
                  diagram={diagram}
                  index={i}
                  isHovered={hoveredId === diagram.id}
                  isLiked={likedIds.has(diagram.id)}
                  commentCount={commentCounts[diagram.id] || 0}
                  isExpanded={expandedCommentId === diagram.id}
                  user={user}
                  onOpenAuth={onOpenAuth}
                  onMouseEnter={() => setHoveredId(diagram.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFork={() => handleForkWithStats(diagram)}
                  onLike={(e) => handleLike(e, diagram.id, diagram.likes)}
                  onToggleComments={() =>
                    setExpandedCommentId(expandedCommentId === diagram.id ? null : diagram.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Icon icon="lucide:link" className="w-5 h-5 text-primary" />
              Import from Link
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Paste a shared Archigram URL to fork the diagram into your workspace.
            </p>

            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://archigram.ai/#..."
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:border-primary mb-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            />

            {importError && <p className="text-xs text-red-500 mb-3">{importError}</p>}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportUrl('');
                  setImportError('');
                }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-lg"
              >
                Import Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type DiagramCardProps = {
  diagram: CommunityDiagram;
  index: number;
  isHovered: boolean;
  isLiked: boolean;
  commentCount: number;
  isExpanded: boolean;
  user?: User | null;
  onOpenAuth?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFork: () => void;
  onLike: (e: React.MouseEvent) => void;
  onToggleComments: () => void;
};

const DiagramCard = React.memo(
  ({
    diagram,
    index,
    isHovered,
    isLiked,
    commentCount,
    isExpanded,
    user,
    onOpenAuth,
    onMouseEnter,
    onMouseLeave,
    onFork,
    onLike,
    onToggleComments,
  }: DiagramCardProps) => (
    <div
      className="group bg-surface border border-border hover:border-primary/40 rounded-2xl overflow-hidden flex flex-col break-inside-avoid transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Preview */}
      <div className="relative bg-[#0d0d10] cursor-pointer overflow-hidden" onClick={onFork}>
        <div className="p-2 min-h-[200px] max-h-[340px] flex items-center justify-center overflow-hidden">
          <div className="pointer-events-none transform scale-[0.8] origin-center w-full h-full flex items-center justify-center">
            <DiagramPreview
              code={diagram.code}
              onError={() => {}}
              theme="midnight"
              showControls={false}
            />
          </div>
        </div>

        {/* Hover overlay — two CTAs */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-3 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFork();
            }}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/30 transition-transform scale-95 group-hover:scale-100"
          >
            <Icon icon="lucide:git-fork" className="w-4 h-4" />
            Fork
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFork();
            }}
            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-white/20 transition-transform scale-95 group-hover:scale-100"
          >
            <Icon icon="lucide:code-2" className="w-4 h-4" />
            View Code
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-base text-text group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {diagram.title}
        </h3>

        <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
          {diagram.description}
        </p>

        {diagram.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {diagram.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {diagram.author.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-text-muted truncate max-w-[80px]">@{diagram.author}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 transition-all group/like ${
                isLiked ? 'text-red-500' : 'text-text-muted hover:text-red-400'
              }`}
            >
              <Icon
                icon="lucide:heart"
                className={`w-3.5 h-3.5 transition-transform ${
                  isLiked ? 'fill-current scale-110' : 'group-hover/like:scale-110'
                }`}
              />
              <span className="font-medium tabular-nums">{formatNumber(diagram.likes)}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComments();
              }}
              className={`flex items-center gap-1 transition-all ${
                isExpanded ? 'text-primary' : 'hover:text-primary'
              }`}
            >
              <Icon icon="lucide:message-circle" className="w-3.5 h-3.5" />
              <span className="font-medium tabular-nums">{commentCount}</span>
            </button>

            <div className="flex items-center gap-1">
              <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatNumber(diagram.views)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Comment Thread */}
      {isExpanded && (
        <Suspense
          fallback={
            <div className="px-4 py-4 border-t border-border/50 flex justify-center">
              <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-text-muted" />
            </div>
          }
        >
          <CommentThread diagramId={diagram.id} user={user || null} onOpenAuth={onOpenAuth} />
        </Suspense>
      )}
    </div>
  )
);
DiagramCard.displayName = 'DiagramCard';

const SkeletonGrid = () => (
  <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
    {Array.from({ length: 9 }).map((_, i) => (
      <div
        key={i}
        className="bg-surface border border-border rounded-2xl overflow-hidden break-inside-avoid animate-pulse"
      >
        <div className="bg-[#0d0d10]" style={{ height: `${180 + (i % 3) * 60}px` }} />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-surface-hover rounded w-3/4" />
          <div className="h-3 bg-surface-hover rounded w-full" />
          <div className="h-3 bg-surface-hover rounded w-2/3" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-5 w-16 bg-primary/10 rounded-md" />
            <div className="h-5 w-12 bg-primary/10 rounded-md" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="h-5 w-5 rounded-full bg-surface-hover" />
            <div className="flex gap-3">
              <div className="h-3 w-8 bg-surface-hover rounded" />
              <div className="h-3 w-8 bg-surface-hover rounded" />
              <div className="h-3 w-8 bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({
  activeTag,
  searchQuery,
  onResetTag,
  onResetSearch,
}: {
  activeTag: string;
  searchQuery: string;
  onResetTag: () => void;
  onResetSearch: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
      <Icon icon="lucide:globe" className="w-7 h-7 text-text-muted" />
    </div>
    <h3 className="text-lg font-bold text-text mb-2">No diagrams match your filter</h3>
    <p className="text-sm text-text-muted mb-6 max-w-xs">
      {searchQuery
        ? `No results for "${searchQuery}".`
        : activeTag !== 'All'
          ? `No community diagrams tagged "${activeTag}" yet.`
          : 'No diagrams available right now.'}
    </p>
    <div className="flex gap-2">
      {activeTag !== 'All' && (
        <button
          onClick={onResetTag}
          className="px-4 py-2 text-sm font-medium bg-surface border border-border rounded-lg hover:bg-surface-hover text-text transition-colors"
        >
          Clear tag filter
        </button>
      )}
      {searchQuery && (
        <button
          onClick={onResetSearch}
          className="px-4 py-2 text-sm font-medium bg-surface border border-border rounded-lg hover:bg-surface-hover text-text transition-colors"
        >
          Clear search
        </button>
      )}
    </div>
  </div>
);

const SortButton = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? 'bg-surface text-text shadow-sm ring-1 ring-border'
        : 'text-text-muted hover:text-text hover:bg-surface/50'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{children}</span>
  </button>
);

const formatNumber = (num: number) =>
  num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();

export default CommunityGallery;
