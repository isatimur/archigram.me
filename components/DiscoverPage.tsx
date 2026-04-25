import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { AppView, Collection, CommunityDiagram } from '../types.ts';
import { fetchCollections, fetchCollectionItems } from '../lib/firestore/collections.ts';
import { SEED_COLLECTIONS, SEED_DIAGRAMS } from '../scripts/seed-diagrams.ts';
import CollectionView from './CollectionView.tsx';

interface DiscoverPageProps {
  onNavigate: (view: AppView) => void;
  onFork: (diagram: CommunityDiagram) => void;
}

const COLLECTION_ICONS: Record<string, React.ReactNode> = {
  'microservices-patterns': <Icon icon="lucide:server" className="w-6 h-6" />,
  'cloud-reference-architectures': <Icon icon="lucide:cloud" className="w-6 h-6" />,
  'system-design-interview': <Icon icon="lucide:cpu" className="w-6 h-6" />,
  'data-pipeline-architectures': <Icon icon="lucide:database" className="w-6 h-6" />,
  'ml-ai-system-design': <Icon icon="lucide:brain" className="w-6 h-6" />,
};

const COLLECTION_GRADIENTS: Record<string, string> = {
  'microservices-patterns': 'from-indigo-600 to-blue-500',
  'cloud-reference-architectures': 'from-sky-500 to-cyan-400',
  'system-design-interview': 'from-purple-600 to-pink-500',
  'data-pipeline-architectures': 'from-emerald-600 to-teal-400',
  'ml-ai-system-design': 'from-orange-500 to-amber-400',
};

const DiscoverPage: React.FC<DiscoverPageProps> = ({ onNavigate, onFork }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionDiagrams, setCollectionDiagrams] = useState<CommunityDiagram[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await fetchCollections();

      if (data.length > 0) {
        setCollections(data);
      } else {
        // Fallback to seed data for display
        setCollections(
          SEED_COLLECTIONS.map((c, i) => ({
            id: `seed-${i}`,
            title: c.title,
            slug: c.slug,
            description: c.description,
            curator: c.curator,
            created_at: new Date().toISOString(),
          }))
        );
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleOpenCollection = async (collection: Collection) => {
    setSelectedSlug(collection.slug);
    setSelectedCollection(collection);
    setIsLoadingCollection(true);

    const items = await fetchCollectionItems(collection.id);

    if (items.length > 0) {
      setCollectionDiagrams(items);
    } else {
      // Fallback to seed diagrams for this category
      const seedItems = SEED_DIAGRAMS.filter((d) => d.category === collection.slug).map((d, i) => ({
        id: `seed-diagram-${collection.slug}-${i}`,
        title: d.title,
        author: d.author,
        description: d.description,
        code: d.code,
        likes: Math.floor(Math.random() * 500) + 50,
        views: Math.floor(Math.random() * 3000) + 200,
        tags: d.tags,
        createdAt: 'Recently',
      }));
      setCollectionDiagrams(seedItems);
    }

    setIsLoadingCollection(false);
  };

  const handleBack = () => {
    if (selectedSlug) {
      setSelectedSlug(null);
      setSelectedCollection(null);
      setCollectionDiagrams([]);
    } else {
      onNavigate('gallery');
    }
  };

  if (selectedSlug && selectedCollection) {
    return (
      <CollectionView
        collection={selectedCollection}
        diagrams={collectionDiagrams}
        isLoading={isLoadingCollection}
        onBack={() => {
          setSelectedSlug(null);
          setSelectedCollection(null);
        }}
        onFork={onFork}
        icon={COLLECTION_ICONS[selectedSlug]}
        gradient={COLLECTION_GRADIENTS[selectedSlug] || 'from-indigo-600 to-blue-500'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Icon icon="lucide:arrow-left" className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-2">
              <Icon icon="lucide:layers" className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg sm:text-xl font-bold">Discover</h1>
            </div>
          </div>
          <button
            onClick={() => onNavigate('gallery')}
            className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Browse Gallery
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
            Curated Architecture Collections
          </h2>
          <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto">
            Explore hand-picked architecture diagrams organized by domain. Learn from real-world
            patterns and fork them into your workspace.
          </p>
        </div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {collections.map((collection) => {
              const gradient =
                COLLECTION_GRADIENTS[collection.slug] || 'from-indigo-600 to-blue-500';
              const icon = COLLECTION_ICONS[collection.slug] || (
                <Icon icon="lucide:layers" className="w-6 h-6" />
              );
              const diagramCount = SEED_DIAGRAMS.filter(
                (d) => d.category === collection.slug
              ).length;

              return (
                <button
                  key={collection.id}
                  onClick={() => handleOpenCollection(collection)}
                  className="group text-left bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  {/* Gradient Header */}
                  <div
                    className={`bg-gradient-to-r ${gradient} p-5 sm:p-6 flex items-center justify-between`}
                  >
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
                    <Icon
                      icon="lucide:chevron-right"
                      className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                      {collection.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        {diagramCount} diagram{diagramCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-zinc-500">by {collection.curator}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
