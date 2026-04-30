export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  codeSnapshot?: string;
  timestamp: number;
  feedback?: 'helpful' | 'unhelpful'; // Phase 1: Data Feedback Loop
}

export const ViewMode = {
  Split: 'SPLIT',
  Code: 'CODE',
  Preview: 'PREVIEW',
} as const;
// eslint-disable-next-line no-redeclare
export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

export type DiagramTheme = 'dark' | 'midnight' | 'forest' | 'neutral' | 'ember' | 'dusk';

export type CopilotDomain = 'General' | 'Healthcare' | 'Finance' | 'E-commerce';

export type BackgroundPattern = 'solid' | 'dots' | 'grid' | 'crossline';
export type DiagramLook = 'classic' | 'handDrawn';

export interface DiagramStyleConfig {
  nodeColor?: string;
  lineColor?: string;
  textColor?: string;
  backgroundColor?: string;
  backgroundPattern?: BackgroundPattern;
  backgroundOpacity?: number; // 0 to 1
  diagramLook?: DiagramLook;
}

export interface DiagramState {
  code: string;
  lastValidCode: string;
  error: string | null;
}

export interface ProjectVersion {
  id: string;
  timestamp: number;
  code: string;
  label: string;
  source: 'ai' | 'manual' | 'auto';
}

export interface Project {
  id: string;
  name: string;
  code: string;
  updatedAt: number;
  thumbnail?: string;
  styleConfig?: DiagramStyleConfig;
  versions?: ProjectVersion[];
  type?: 'mermaid' | 'plantuml';
}

export interface CommunityDiagram {
  id: string;
  title: string;
  author: string;
  description: string;
  code: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  /** Timestamp for sorting (ms). Optional for static fallback data. */
  createdAtTimestamp?: number;
  commentCount?: number;
}

export type AppView =
  | 'landing'
  | 'app'
  | 'plantuml'
  | 'bpmn'
  | 'docs'
  | 'gallery'
  | 'discover'
  | 'prompts'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'license'
  | 'profile';

export type PromptDomain = 'general' | 'healthcare' | 'finance' | 'ecommerce' | 'devops' | 'ml';

export interface PromptEntry {
  id: string;
  title: string;
  author: string;
  user_id?: string;
  description: string;
  prompt_text: string;
  domain: PromptDomain;
  tags: string[];
  result_diagram_code?: string;
  likes: number;
  views: number;
  created_at: string;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url?: string;
  curator: string;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  diagram_id: string;
  position: number;
  diagram?: CommunityDiagram;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Comment {
  id: string;
  diagram_id: string;
  user_id: string;
  author: string;
  content: string;
  created_at: string;
}

export type EmbedMode = 'minimal' | 'toolbar' | 'interactive';
