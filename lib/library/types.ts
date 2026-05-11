export type CategorySlug =
  | 'system-design'
  | 'cloud-architecture'
  | 'data-pipeline'
  | 'ml-ai'
  | 'devops-cicd'
  | 'auth-flows'
  | 'database-er'
  | 'state-machines'
  | 'general-flowcharts';

export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'journey'
  | 'mindmap'
  | 'c4'
  | 'other';

export type LibrarySourceType =
  | 'github-readme'
  | 'github-gist'
  | 'awesome-list'
  | 'mermaid-docs'
  | 'editorial';

export interface LibrarySource {
  url: string;
  sourceType: LibrarySourceType;
  repo?: string;
  license?: string;
  stars?: number;
  fetchedAt: string;
}

export interface LibraryAttribution {
  author?: string;
  authorUrl?: string;
}

export interface LibraryAi {
  summary: string;
  whatItShows: string;
  whenToUse: string;
  howToAdapt: string;
  keyConcepts: string[];
  fallback: boolean;
}

export interface LibraryPreview {
  svg: string;
  width: number;
  height: number;
}

export interface LibraryDiagram {
  slug: string;
  title: string;
  category: CategorySlug;
  diagramType: DiagramType;
  code: string;
  preview: LibraryPreview;
  ogImagePath: string;
  source: LibrarySource;
  attribution: LibraryAttribution;
  ai: LibraryAi;
  related: string[];
  tags: string[];
  qualityScore: number;
  ingestedAt: string;
  schemaVersion: 1;
}

export interface LibraryManifestEntry {
  slug: string;
  title: string;
  category: CategorySlug;
  diagramType: DiagramType;
  qualityScore: number;
  ingestedAt: string;
  tags: string[];
}

export interface LibraryManifest {
  schemaVersion: 1;
  generatedAt: string;
  count: number;
  diagrams: LibraryManifestEntry[];
}
