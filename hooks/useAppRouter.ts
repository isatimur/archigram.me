import { useState, useEffect } from 'react';
import { AppView } from '../types.ts';
import { PROJECTS_STORAGE_KEY } from '../constants.ts';
import { decodeCodeFromUrl } from '../utils/url.ts';

const VALID_VIEWS = new Set<AppView>([
  'landing',
  'app',
  'plantuml',
  'docs',
  'gallery',
  'discover',
  'prompts',
  'faq',
  'privacy',
  'terms',
  'license',
  'profile',
]);

function hashToView(hash: string): AppView | null {
  const key = hash.replace(/^#/, '') as AppView;
  return VALID_VIEWS.has(key) ? key : null;
}

export function useAppRouter() {
  const [currentView, setCurrentViewState] = useState<AppView>('landing');

  // Initial routing: parse hash or fall back to projects check
  useEffect(() => {
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

  // Update URL hash whenever view changes
  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    const hash = `#${view}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
  };

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const view = hashToView(window.location.hash);
      if (view) setCurrentViewState(view);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { currentView, setCurrentView };
}
