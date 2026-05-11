import { useState, useEffect } from 'react';
import { AppView, LibraryRoute } from '../types.ts';
import { PROJECTS_STORAGE_KEY } from '../constants.ts';
import { decodeCodeFromUrl } from '../utils/url.ts';
import { isCategorySlug } from '../lib/library/categories.ts';

const VALID_VIEWS = new Set<AppView>([
  'landing',
  'app',
  'plantuml',
  'bpmn',
  'docs',
  'gallery',
  'discover',
  'prompts',
  'faq',
  'privacy',
  'terms',
  'license',
  'profile',
  'library',
]);

const LIBRARY_PATH_PREFIX = '/library';

function hashToView(hash: string): AppView | null {
  const key = hash.replace(/^#/, '') as AppView;
  return VALID_VIEWS.has(key) ? key : null;
}

function parseLibraryPath(pathname: string): LibraryRoute | null {
  if (!pathname.startsWith(LIBRARY_PATH_PREFIX)) return null;
  const tail = pathname.slice(LIBRARY_PATH_PREFIX.length);
  const parts = tail.split('/').filter(Boolean);
  if (parts.length === 0) return { kind: 'index' };
  if (parts.length === 1 && isCategorySlug(parts[0])) {
    return { kind: 'category', category: parts[0] };
  }
  if (parts.length === 2 && isCategorySlug(parts[0])) {
    return { kind: 'detail', category: parts[0], slug: parts[1] };
  }
  // Unknown library subpath — show the index instead of breaking
  return { kind: 'index' };
}

function libraryRouteToPath(route: LibraryRoute): string {
  switch (route.kind) {
    case 'index':
      return '/library';
    case 'category':
      return `/library/${route.category}`;
    case 'detail':
      return `/library/${route.category}/${route.slug}`;
  }
}

export function useAppRouter() {
  const [currentView, setCurrentViewState] = useState<AppView>('landing');
  const [libraryRoute, setLibraryRouteState] = useState<LibraryRoute>({ kind: 'index' });

  // Initial routing: parse pathname for /library/*, otherwise hash, otherwise default
  useEffect(() => {
    const libRoute = parseLibraryPath(window.location.pathname);
    if (libRoute) {
      setCurrentViewState('library');
      setLibraryRouteState(libRoute);
      return;
    }
    const fromHash = hashToView(window.location.hash);
    if (fromHash) {
      setCurrentViewState(fromHash);
    } else if (window.location.hash && decodeCodeFromUrl(window.location.hash.slice(1))) {
      // Hash is a share URL (LZ-string encoded diagram) — open the editor to display it
      setCurrentViewState('app');
    } else if (localStorage.getItem(PROJECTS_STORAGE_KEY)) {
      setCurrentViewState('app');
    }
  }, []);

  // Update URL hash whenever view changes (legacy hash-based views)
  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (view === 'library') {
      const path = libraryRouteToPath({ kind: 'index' });
      setLibraryRouteState({ kind: 'index' });
      if (window.location.pathname !== path || window.location.hash !== '') {
        window.history.pushState(null, '', path);
      }
      return;
    }
    // Switching away from library: clear pathname back to root
    if (window.location.pathname.startsWith(LIBRARY_PATH_PREFIX)) {
      window.history.pushState(null, '', `/#${view}`);
      return;
    }
    const hash = `#${view}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
  };

  const setLibraryRoute = (route: LibraryRoute) => {
    setCurrentViewState('library');
    setLibraryRouteState(route);
    const path = libraryRouteToPath(route);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const libRoute = parseLibraryPath(window.location.pathname);
      if (libRoute) {
        setCurrentViewState('library');
        setLibraryRouteState(libRoute);
        return;
      }
      const view = hashToView(window.location.hash);
      if (view) setCurrentViewState(view);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { currentView, setCurrentView, libraryRoute, setLibraryRoute };
}
