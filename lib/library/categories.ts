import type { CategorySlug } from './types';

export interface CategoryMeta {
  slug: CategorySlug;
  title: string;
  pluralTitle: string;
  description: string;
  iconName: string;
  gradient: string;
  seoKeywords: string[];
}

export const CATEGORIES: Record<CategorySlug, CategoryMeta> = {
  'system-design': {
    slug: 'system-design',
    title: 'System Design',
    pluralTitle: 'System Design Diagrams',
    description:
      'Microservices, monoliths, event-driven systems, CQRS, hexagonal architecture — battle-tested patterns from real engineering teams.',
    iconName: 'lucide:layers',
    gradient: 'from-indigo-600 to-blue-500',
    seoKeywords: ['system design', 'microservices', 'architecture', 'event-driven', 'cqrs'],
  },
  'cloud-architecture': {
    slug: 'cloud-architecture',
    title: 'Cloud Architecture',
    pluralTitle: 'Cloud Architecture Diagrams',
    description:
      'AWS, GCP, and Azure reference architectures — VPC layouts, multi-region patterns, serverless stacks, and well-architected designs.',
    iconName: 'lucide:cloud',
    gradient: 'from-sky-500 to-cyan-400',
    seoKeywords: ['aws architecture', 'gcp architecture', 'azure architecture', 'cloud diagram'],
  },
  'data-pipeline': {
    slug: 'data-pipeline',
    title: 'Data Pipelines',
    pluralTitle: 'Data Pipeline Diagrams',
    description:
      'ETL flows, streaming pipelines, lakehouse architectures, Kafka topologies, Airflow DAGs — modern data engineering patterns.',
    iconName: 'lucide:database',
    gradient: 'from-emerald-600 to-teal-400',
    seoKeywords: ['data pipeline', 'etl', 'kafka', 'streaming', 'lakehouse', 'airflow'],
  },
  'ml-ai': {
    slug: 'ml-ai',
    title: 'ML & AI',
    pluralTitle: 'ML & AI System Diagrams',
    description:
      'RAG pipelines, training architectures, inference stacks, agentic systems — how production ML and AI systems fit together.',
    iconName: 'lucide:brain',
    gradient: 'from-orange-500 to-amber-400',
    seoKeywords: ['ml architecture', 'rag pipeline', 'ai system design', 'llm inference'],
  },
  'devops-cicd': {
    slug: 'devops-cicd',
    title: 'DevOps & CI/CD',
    pluralTitle: 'DevOps & CI/CD Diagrams',
    description:
      'Kubernetes topologies, deploy strategies, GitOps flows, blue-green deploys, canary rollouts — operational diagrams that ship.',
    iconName: 'lucide:git-branch',
    gradient: 'from-rose-500 to-pink-500',
    seoKeywords: ['cicd', 'kubernetes', 'gitops', 'deploy strategy', 'devops'],
  },
  'auth-flows': {
    slug: 'auth-flows',
    title: 'Auth & Payment Flows',
    pluralTitle: 'Auth & Payment Flow Diagrams',
    description:
      'OAuth 2.0, SAML, JWT, payment flows, KYC, 3DS — sequence diagrams for the flows you have to get right.',
    iconName: 'lucide:shield-check',
    gradient: 'from-violet-600 to-purple-500',
    seoKeywords: ['oauth flow', 'saml', 'jwt', 'payment flow', 'kyc', 'sequence diagram'],
  },
  'database-er': {
    slug: 'database-er',
    title: 'Database Schemas',
    pluralTitle: 'Database & ER Diagrams',
    description:
      'Entity-relationship diagrams and schema designs for SaaS, marketplaces, social, and operational applications.',
    iconName: 'lucide:table-2',
    gradient: 'from-amber-500 to-yellow-400',
    seoKeywords: ['er diagram', 'database schema', 'entity relationship', 'data model'],
  },
  'state-machines': {
    slug: 'state-machines',
    title: 'State Machines',
    pluralTitle: 'State Machine Diagrams',
    description:
      'Workflows, sagas, lifecycles, order states, subscription states — the diagrams that document non-trivial business logic.',
    iconName: 'lucide:workflow',
    gradient: 'from-fuchsia-600 to-pink-500',
    seoKeywords: ['state machine', 'state diagram', 'workflow', 'saga pattern'],
  },
  'general-flowcharts': {
    slug: 'general-flowcharts',
    title: 'Flowcharts & More',
    pluralTitle: 'Flowcharts, Mindmaps & More',
    description:
      'Decision flows, mindmaps, journeys, Gantt charts — the everyday diagrams teams reach for to think on paper.',
    iconName: 'lucide:network',
    gradient: 'from-slate-600 to-zinc-500',
    seoKeywords: ['flowchart', 'mindmap', 'journey map', 'gantt chart', 'decision tree'],
  },
};

export const CATEGORY_ORDER: CategorySlug[] = [
  'system-design',
  'cloud-architecture',
  'data-pipeline',
  'ml-ai',
  'devops-cicd',
  'auth-flows',
  'database-er',
  'state-machines',
  'general-flowcharts',
];

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORIES;
}

export function getCategory(slug: CategorySlug): CategoryMeta {
  return CATEGORIES[slug];
}

export function listCategories(): CategoryMeta[] {
  return CATEGORY_ORDER.map((slug) => CATEGORIES[slug]);
}
