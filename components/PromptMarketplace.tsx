import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AppView, PromptEntry, PromptDomain } from '../types.ts';
import { fetchPrompts, incrementPromptLikes } from '../lib/firestore/prompts.ts';
import { SEED_PROMPTS } from '../constants.ts';
import { analytics } from '../utils/analytics.ts';
import { trendingScore } from '../utils/trending.ts';
import { LIKED_PROMPT_IDS_KEY } from '../constants.ts';

interface PromptMarketplaceProps {
  onNavigate: (view: AppView) => void;
  onTryPrompt: (promptText: string, domain: string, resultCode?: string) => void;
  onRequireAuth?: (action: () => void) => void;
}

const DOMAIN_LABELS: Record<PromptDomain, string> = {
  general: 'General',
  healthcare: 'Healthcare',
  finance: 'Finance',
  ecommerce: 'E-Commerce',
  devops: 'DevOps',
  ml: 'ML/AI',
};

const DOMAIN_COLORS: Record<PromptDomain, string> = {
  general: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  healthcare: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  finance: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ecommerce: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  devops: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ml: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const PromptMarketplace: React.FC<PromptMarketplaceProps> = ({
  onNavigate,
  onTryPrompt,
  onRequireAuth,
}) => {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'top' | 'trending'>('trending');
  const [domainFilter, setDomainFilter] = useState<PromptDomain | 'all'>('all');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LIKED_PROMPT_IDS_KEY);
    if (saved) {
      try {
        setLikedIds(new Set(JSON.parse(saved)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await Promise.race([
        fetchPrompts({
          domain: domainFilter === 'all' ? undefined : domainFilter,
          sort: sortBy,
          limit: 100,
        }),
        new Promise<PromptEntry[]>((resolve) => setTimeout(() => resolve([]), 5000)),
      ]);
      if (data.length > 0) {
        setPrompts(data);
      } else {
        // Fall back to seed prompts with client-side filtering & sorting
        const filtered =
          domainFilter === 'all'
            ? [...SEED_PROMPTS]
            : SEED_PROMPTS.filter((p) => p.domain === domainFilter);

        filtered.sort((a, b) => {
          if (sortBy === 'trending')
            return (
              trendingScore(b.likes, b.views, new Date(b.created_at).getTime()) -
              trendingScore(a.likes, a.views, new Date(a.created_at).getTime())
            );
          if (sortBy === 'top') return b.likes - a.likes;
          if (sortBy === 'new')
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return 0;
        });

        setPrompts(filtered);
      }
      setIsLoading(false);
    };
    load();
  }, [sortBy, domainFilter]);

  const filteredPrompts = prompts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.prompt_text.toLowerCase().includes(q)
    );
  });

  const performLike = async (prompt: PromptEntry) => {
    const id = prompt.id;
    const isLiked = likedIds.has(id);
    const currentLikes = prompt.likes;
    const newCount = isLiked ? currentLikes - 1 : currentLikes + 1;

    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: newCount } : p)));

    const newLiked = new Set(likedIds);
    if (isLiked) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
      analytics.promptLiked();
    }
    setLikedIds(newLiked);
    localStorage.setItem(LIKED_PROMPT_IDS_KEY, JSON.stringify([...newLiked]));

    const success = await incrementPromptLikes(id, isLiked ? -1 : 1);
    if (!success) {
      toast.error('Failed to update like');
      setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, likes: currentLikes } : p)));
      setLikedIds((prev) => {
        const reverted = new Set(prev);
        if (isLiked) reverted.add(id);
        else reverted.delete(id);
        localStorage.setItem(LIKED_PROMPT_IDS_KEY, JSON.stringify([...reverted]));
        return reverted;
      });
    }
  };

  const handleLike = (prompt: PromptEntry) => {
    if (onRequireAuth) {
      onRequireAuth(() => performLike(prompt));
    } else {
      performLike(prompt);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Prompt copied to clipboard');
    });
  };

  const handleTryPrompt = (prompt: PromptEntry) => {
    analytics.promptTried();
    onTryPrompt(prompt.prompt_text, prompt.domain, prompt.result_diagram_code || undefined);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('gallery')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-2">
              <Icon icon="lucide:sparkles" className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg sm:text-xl font-bold">Prompt Marketplace</h1>
            </div>
          </div>
          <button
            onClick={() => onNavigate('app')}
            className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Architecture Prompts</h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Discover and share AI prompts that generate great architecture diagrams. Try any prompt
            directly in the editor.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Icon
              icon="lucide:search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {/* Sort Buttons */}
            <div className="flex bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              {(
                [
                  { key: 'trending', icon: 'lucide:trending-up', label: 'Trending' },
                  { key: 'new', icon: 'lucide:clock', label: 'New' },
                  { key: 'top', icon: 'lucide:star', label: 'Top' },
                ] as const
              ).map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    sortBy === key
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon icon={icon} className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Domain Filter */}
            <div className="relative">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as PromptDomain | 'all')}
                className="appearance-none bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 pr-8 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Domains</option>
                {(Object.keys(DOMAIN_LABELS) as PromptDomain[]).map((d) => (
                  <option key={d} value={d}>
                    {DOMAIN_LABELS[d]}
                  </option>
                ))}
              </select>
              <Icon
                icon="lucide:filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Icon icon="lucide:sparkles" className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No prompts found</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try a different search term.' : 'Be the first to share a prompt!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all group"
              >
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {prompt.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        by @{prompt.author} &middot; {timeAgo(prompt.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        DOMAIN_COLORS[prompt.domain] || DOMAIN_COLORS.general
                      }`}
                    >
                      {DOMAIN_LABELS[prompt.domain] || 'General'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{prompt.description}</p>

                  {/* Prompt Preview */}
                  <button
                    onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                    className="w-full text-left bg-black/30 rounded-lg p-3 mb-3 cursor-pointer hover:bg-black/40 transition-colors"
                  >
                    <p className="text-xs text-zinc-300 font-mono line-clamp-3">
                      {prompt.prompt_text}
                    </p>
                    {prompt.prompt_text.length > 200 && (
                      <span className="text-[10px] text-indigo-400 mt-1 inline-block">
                        {expandedId === prompt.id ? 'Show less' : 'Show more'}
                      </span>
                    )}
                  </button>

                  {/* Expanded full prompt */}
                  {expandedId === prompt.id && (
                    <div className="bg-black/30 rounded-lg p-3 mb-3 border border-white/5">
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {prompt.prompt_text}
                      </pre>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prompt.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-zinc-400 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(prompt)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          likedIds.has(prompt.id)
                            ? 'text-pink-400'
                            : 'text-zinc-500 hover:text-pink-400'
                        }`}
                      >
                        <Icon
                          icon="lucide:heart"
                          className="w-3.5 h-3.5"
                          fill={likedIds.has(prompt.id) ? 'currentColor' : 'none'}
                        />
                        {prompt.likes}
                      </button>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                        {prompt.views}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPrompt(prompt.prompt_text)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                        title="Copy prompt"
                      >
                        <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTryPrompt(prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Icon icon="lucide:play" className="w-3 h-3" />
                        Try It
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptMarketplace;
