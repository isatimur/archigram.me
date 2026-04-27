import type { AppView } from '@/types';

export const VIEW_TO_PATH: Record<AppView, string> = {
  landing: '/',
  app: '/',
  plantuml: '/',
  bpmn: '/',
  docs: '/',
  gallery: '/',
  discover: '/',
  prompts: '/',
  faq: '/',
  privacy: '/',
  terms: '/',
  license: '/',
  profile: '/',
};

export function useAppNavigate() {
  return (_view: AppView) => {
    // Vite SPA: all views are rendered within the editor shell
  };
}
