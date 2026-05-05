import type { PromptEntry, PromptDomain } from '../types.js';
import { COMMUNITY_DATA } from './communityDiagrams.js';

/**
 * Metadata for converting community diagrams into seed prompts.
 * The mermaid code, title, description, author, tags, likes, and views
 * are pulled directly from COMMUNITY_DATA to stay DRY.
 */
type PromptMeta = {
  communityId: string;
  promptText: string;
  domain: PromptDomain;
};

const PROMPT_META: PromptMeta[] = [
  // ═══════════════════════════════════════════
  // ── Software Architecture ─────────────────
  // ═══════════════════════════════════════════
  {
    communityId: 'c1',
    domain: 'finance',
    promptText:
      'Design a microservices-based payment processing system. Include an API gateway, auth service, payment orchestrator, wallet and ledger services, fraud detection with risk scoring, KYC verification, and PSP adapters for Stripe and PayPal with webhook-based settlement.',
  },
  {
    communityId: 'pop-arch-2',
    domain: 'general',
    promptText:
      'Create an event-driven architecture for a food delivery platform using Kafka. Show multiple producers (order, restaurant, delivery, payment APIs), a central event bus with schema registry, consumer groups for analytics and notifications, and resilience components including a dead letter queue and event archive for replay.',
  },
  {
    communityId: 'pop-arch-3',
    domain: 'devops',
    promptText:
      'Design a serverless architecture on AWS for a web application. Show API Gateway routing to Lambda functions for user, product, and order services, each connected to DynamoDB tables. Include S3 for static hosting with CloudFront CDN, Cognito for auth, SQS for async processing, and CloudWatch for monitoring.',
  },
  {
    communityId: 'pop-arch-4',
    domain: 'general',
    promptText:
      'Design a CQRS + Event Sourcing architecture for an order management system. Show a command side with command handler, aggregate, and event store, connected through an event bus to a read side with event projectors, a read-optimized query store, and a query API. Include event replay capability and separate command/query APIs.',
  },
  {
    communityId: 'pop-arch-5',
    domain: 'general',
    promptText:
      'Create a hexagonal architecture (ports and adapters) diagram. Show the core domain logic in the center with use cases, surrounded by ports (interfaces). On the left show driving adapters (REST API, GraphQL, CLI), on the right show driven adapters (PostgreSQL repository, Redis cache, SMTP email, S3 storage). Emphasize the dependency inversion principle.',
  },
  {
    communityId: 'pop-arch-6',
    domain: 'general',
    promptText:
      'Design a GraphQL Federation architecture with an Apollo Gateway. Show 4 subgraphs: Users (profiles, auth), Products (catalog, pricing), Orders (checkout, history), and Reviews (ratings, comments). Include the schema registry, CDN caching layer, and show how the gateway composes the unified schema from subgraphs.',
  },
  {
    communityId: 'pop-arch-7',
    domain: 'devops',
    promptText:
      'Design a distributed caching architecture with Redis. Show the application layer checking a Redis cluster (with master and replica nodes) before hitting the PostgreSQL database. Include a cache-aside pattern flow, cache invalidation via event bus, TTL management, and a cache warming service for preloading hot data.',
  },
  {
    communityId: 'pop-arch-8',
    domain: 'general',
    promptText:
      'Create a real-time data pipeline architecture diagram. Show data sources (clickstream, IoT sensors, transaction logs) feeding into Kafka for ingestion, then stream processing with Apache Flink for real-time analytics and Apache Spark for batch processing. Include a data lake on S3, a serving layer with Elasticsearch, and visualization dashboards.',
  },
  {
    communityId: 'pop-arch-9',
    domain: 'devops',
    promptText:
      'Design a service mesh architecture using Istio. Show multiple services (frontend, product API, order API, payment) each with Envoy sidecar proxies. Include the Istio control plane components: Pilot for traffic management, Citadel for mTLS certificates, and Galley for configuration. Show traffic routing, circuit breaking, and an observability stack with Jaeger, Prometheus, and Kiali.',
  },
  {
    communityId: 'pop-arch-10',
    domain: 'general',
    promptText:
      'Create a migration diagram showing the journey from a monolithic application to microservices. Show the phases: legacy monolith, strangler fig pattern with API gateway routing between old and new services, extracted microservices (user, order, inventory) with their own databases, an event bus for inter-service communication, and the final decomposed architecture.',
  },

  // ═══════════════════════════════════════════
  // ── DevOps & Cloud ────────────────────────
  // ═══════════════════════════════════════════
  {
    communityId: 'pop-devops-1',
    domain: 'devops',
    promptText:
      'Design a CI/CD pipeline using GitHub Actions. Start from a developer push, through linting, unit tests, SAST security scanning, then Docker build and push to registry. Deploy to staging with integration tests, manual approval gate, canary deployment to production, automated health checks, and auto-rollback on failure.',
  },
  {
    communityId: 'pop-devops-2',
    domain: 'devops',
    promptText:
      'Create a Kubernetes cluster architecture diagram. Show the control plane (API server, etcd, scheduler, controller manager) and worker nodes running pods organized into namespaces. Include an ingress controller, service mesh sidecar, persistent volumes, and the networking layer with CoreDNS and kube-proxy.',
  },
  {
    communityId: 'pop-devops-3',
    domain: 'devops',
    promptText:
      'Design an AWS three-tier architecture. Show the presentation tier with CloudFront CDN and S3 static hosting, the application tier in a VPC with ALB distributing traffic to ECS Fargate containers in private subnets across multiple AZs, and the data tier with RDS Aurora primary and read replica plus ElastiCache for sessions.',
  },
  {
    communityId: 'pop-devops-4',
    domain: 'devops',
    promptText:
      'Create a monitoring and observability stack architecture. Show application instrumentation flowing to three pillars: metrics collection with Prometheus and Grafana dashboards, distributed tracing with Jaeger, and centralized logging with the ELK stack (Elasticsearch, Logstash, Kibana). Include alerting with PagerDuty integration and an SLO dashboard.',
  },
  {
    communityId: 'pop-devops-5',
    domain: 'devops',
    promptText:
      'Design a GitOps workflow using ArgoCD. Show a developer pushing code to a Git repo, triggering CI to build and push a Docker image, then updating a config repo with the new image tag. ArgoCD watches the config repo, syncs desired state to the Kubernetes cluster, and shows the reconciliation loop with drift detection and auto-heal.',
  },
  {
    communityId: 'pop-devops-6',
    domain: 'devops',
    promptText:
      'Create a sequence diagram for the OAuth2 Authorization Code flow with PKCE. Show interactions between the User, Client App, Authorization Server, and Resource Server. Include the auth request with code challenge, user login and consent, authorization code redirect, token exchange with code verifier, access and refresh token issuance, and API access with token validation.',
  },
  {
    communityId: 'pop-devops-7',
    domain: 'devops',
    promptText:
      'Create a sequence diagram showing the complete DNS resolution flow. Include the Client, Local DNS Resolver, Root Name Server, TLD Server, and Authoritative Server. Show the recursive resolution process from root to TLD to authoritative, with cache checks at each step, and final response with IP address and TTL caching.',
  },
  {
    communityId: 'pop-devops-8',
    domain: 'devops',
    promptText:
      'Design a Terraform infrastructure-as-code workflow diagram. Show the stages: developer writing HCL code, plan phase with state comparison, approval gate, apply phase provisioning infrastructure across AWS/GCP/Azure. Include remote state storage in S3, state locking with DynamoDB, module registry, and Sentinel policy checks.',
  },
  {
    communityId: 'pop-devops-9',
    domain: 'devops',
    promptText:
      'Create a load balancer architecture diagram showing Layer 4 and Layer 7 balancing. Include an external DNS/CDN entry point, L4 TCP load balancer, L7 HTTP application load balancer with path-based routing to different service pools (API, WebSocket, static assets). Show health checks, connection draining, SSL termination, and auto-scaling groups behind each pool.',
  },
  {
    communityId: 'pop-devops-10',
    domain: 'devops',
    promptText:
      'Design a Docker Compose multi-service development environment. Show an Nginx reverse proxy routing to a React frontend and Node.js API backend, connected to PostgreSQL database and Redis cache. Include a background worker service consuming from a RabbitMQ message queue, with Adminer for DB admin. Show networks and volume mounts.',
  },

  // ═══════════════════════════════════════════
  // ── Database & Class Diagrams ─────────────
  // ═══════════════════════════════════════════
  {
    communityId: 'pop-data-1',
    domain: 'ecommerce',
    promptText:
      'Design a comprehensive e-commerce database schema using an ER diagram. Include entities for Customer (with addresses), Product (with categories and inventory), Order and OrderItem, Payment, Shipping with tracking, ProductReview, and Coupon. Show all relationships with cardinality — one customer has many orders, each order has many items, etc.',
  },
  {
    communityId: 'pop-data-2',
    domain: 'general',
    promptText:
      'Create an ER diagram for a social media platform. Include User, Profile, Post, Comment, Like, Follow, Hashtag, and Notification entities. Show relationships: users create posts, posts have many comments and likes, users follow other users, posts can have hashtags (many-to-many), and notifications link to source users and target content.',
  },
  {
    communityId: 'pop-data-3',
    domain: 'healthcare',
    promptText:
      'Design a hospital management system ER diagram. Include Patient (with medical history), Doctor (with specialization and schedule), Department, Appointment, MedicalRecord, Prescription, Lab test results, Billing, and Insurance. Show that patients have appointments with doctors in departments, appointments generate medical records and prescriptions, and billing links to insurance.',
  },
  {
    communityId: 'pop-data-4',
    domain: 'finance',
    promptText:
      'Create a banking system ER diagram. Include Customer, Account (checking/savings/credit), Transaction (with types: deposit, withdrawal, transfer), Branch, Employee, Loan (with payment schedule), Card (debit/credit), and AuditLog. Show customers own multiple accounts, accounts have many transactions, loans have scheduled payments, and all operations are audit-logged.',
  },
  {
    communityId: 'pop-data-5',
    domain: 'general',
    promptText:
      'Create a UML class diagram for the Observer design pattern. Show a Subject (Observable) interface with attach(), detach(), and notify() methods. Show a ConcreteSubject with state and getState()/setState(). Show an Observer interface with an update() method, and ConcreteObserver implementations. Show the relationships between all classes.',
  },
  {
    communityId: 'pop-data-6',
    domain: 'general',
    promptText:
      'Create a UML class diagram for the Strategy design pattern. Show a Context class that holds a reference to a Strategy interface with an execute() method. Show multiple ConcreteStrategy implementations (ConcreteStrategyA, B, C) each with different execute() implementations. Show composition relationship from Context to Strategy.',
  },
  {
    communityId: 'pop-data-7',
    domain: 'general',
    promptText:
      'Create a UML class diagram for the MVC (Model-View-Controller) architecture pattern. Show a Model with data and business logic methods, a View with render() and display() methods that observes the Model, and a Controller with handleInput() and updateModel() methods. Show the relationships: Controller updates Model, Model notifies View, View reads from Model.',
  },
  {
    communityId: 'pop-data-8',
    domain: 'general',
    promptText:
      'Design a library management system UML class diagram. Include Book (ISBN, title, author, status), Member (with membership type), Librarian, Loan (checkout/return dates, due date), Reservation, Fine, and Category. Show inheritance for MemberTypes, composition of Loan with Book and Member, and methods like checkOut(), returnBook(), calculateFine().',
  },
  {
    communityId: 'pop-data-9',
    domain: 'general',
    promptText:
      'Create a UML class diagram for a REST API with layered architecture. Show the layers: Controller (with route handlers), Service (business logic), Repository (data access), Model (domain entity), DTO (data transfer), and Middleware (auth, validation, error handling). Show dependencies flowing inward from Controller to Service to Repository.',
  },
  {
    communityId: 'pop-data-10',
    domain: 'general',
    promptText:
      'Create a UML class diagram for the Factory design pattern. Show an abstract Product interface, ConcreteProductA and ConcreteProductB implementations, an abstract Creator class with a factoryMethod(), and ConcreteCreatorA and ConcreteCreatorB that override the factory method. Show the relationship between creators and their products.',
  },

  // ═══════════════════════════════════════════
  // ── Business, State & Journey ─────────────
  // ═══════════════════════════════════════════
  {
    communityId: 'pop-biz-1',
    domain: 'ecommerce',
    promptText:
      'Create a state machine diagram for an e-commerce order lifecycle. Show states: Created, PaymentPending, PaymentFailed, Confirmed, Processing, Shipped, InTransit, Delivered, Cancelled, ReturnRequested, Returned, and Refunded. Show all transitions with trigger events like paymentReceived, shipmentDispatched, deliveryConfirmed, returnApproved, etc.',
  },
  {
    communityId: 'pop-biz-2',
    domain: 'general',
    promptText:
      'Create a user journey diagram for SaaS onboarding. Show the experience of a new user going through: Landing Page Visit, Sign Up, Email Verification, Profile Setup, First Project Creation, Feature Tutorial, and Upgrade Decision. Rate each step from 1-5 for user satisfaction and include emotional annotations.',
  },
  {
    communityId: 'pop-biz-3',
    domain: 'ecommerce',
    promptText:
      'Create a user journey diagram for an e-commerce checkout flow. Show the customer going through: Browse Products, Add to Cart, View Cart, Enter Shipping Info, Select Payment Method, Review Order, Confirm Purchase, and Receive Confirmation. Rate satisfaction at each step and show where users commonly drop off.',
  },
  {
    communityId: 'pop-biz-4',
    domain: 'general',
    promptText:
      'Create a Gantt chart for a 2-week agile sprint. Include sections for Planning (sprint planning, backlog grooming), Development (feature A, feature B, bug fixes), Testing (unit tests, integration tests, QA review), and Deployment (staging deploy, UAT, production release, post-release monitoring). Show task dependencies and milestones.',
  },
  {
    communityId: 'pop-biz-5',
    domain: 'general',
    promptText:
      'Create a timeline diagram for a product launch. Show the phases across months: Research (market analysis, user interviews), Design (wireframes, UI design, prototyping), Development (MVP build, beta testing), and Launch (marketing campaign, public launch, post-launch analytics). Mark key milestones at each phase.',
  },
  {
    communityId: 'pop-biz-6',
    domain: 'devops',
    promptText:
      'Create an incident response flowchart for a production outage. Start with alert triggered, then triage (assess severity P1-P4), assign incident commander, diagnose root cause (check metrics, logs, recent deploys). Branch into fix paths: rollback if deploy-related, scale up if capacity issue, failover if hardware failure. End with post-mortem and runbook update.',
  },
  {
    communityId: 'pop-biz-7',
    domain: 'general',
    promptText:
      'Create a hiring pipeline flowchart showing the full recruitment process. Start from job posting, resume screening (pass/reject), phone screen (advance/reject), technical assessment (advance/reject), on-site interviews (advance/reject), reference check, offer generation, negotiation, and finally hire or candidate decline. Include feedback loops for rejected candidates.',
  },
  {
    communityId: 'pop-biz-8',
    domain: 'general',
    promptText:
      'Create a state diagram for a bug/issue lifecycle in a project management tool. Show states: New, Triaged, InProgress, CodeReview, QATesting, ReadyForRelease, Released, Closed, Reopened, WontFix, and Duplicate. Show transitions with events like assigned, fixSubmitted, reviewApproved, testPassed, deployed, etc.',
  },
  {
    communityId: 'pop-biz-9',
    domain: 'general',
    promptText:
      'Create a timeline diagram for the Software Development Life Cycle (SDLC). Show the phases: Requirements Gathering, System Design, Implementation, Testing, Deployment, and Maintenance. For each phase list 2-3 key activities. Mark milestones like Design Review, Code Freeze, Release Candidate, and Go-Live.',
  },
  {
    communityId: 'pop-biz-10',
    domain: 'general',
    promptText:
      'Create a flowchart for a customer support ticket workflow. Start from ticket submitted, auto-categorize (billing/technical/feature request), assign to appropriate team, attempt first response within SLA. Branch into: resolved → close ticket, needs escalation → L2/L3 support, needs engineering → create JIRA issue. Include customer satisfaction survey after resolution.',
  },

  // ═══════════════════════════════════════════
  // ── Data Viz, Mindmap, Git & ML ───────────
  // ═══════════════════════════════════════════
  {
    communityId: 'pop-misc-1',
    domain: 'devops',
    promptText:
      'Create a pie chart showing cloud infrastructure market share. Include AWS at 32%, Azure at 23%, Google Cloud at 11%, Alibaba Cloud at 5%, IBM Cloud at 3%, and Others at 26%. Use a descriptive title.',
  },
  {
    communityId: 'pop-misc-2',
    domain: 'general',
    promptText:
      'Create a pie chart showing how a typical software developer allocates their weekly time. Include categories: Coding (35%), Meetings (20%), Code Review (15%), Debugging (15%), Documentation (10%), and Learning (5%).',
  },
  {
    communityId: 'pop-misc-3',
    domain: 'general',
    promptText:
      'Create a quadrant chart for evaluating frontend frameworks. Plot frameworks on two axes: Learning Curve (Easy to Hard) on x-axis and Ecosystem Maturity (Emerging to Mature) on y-axis. Place React, Angular, Vue, Svelte, SolidJS, and Astro in appropriate quadrants based on their characteristics.',
  },
  {
    communityId: 'pop-misc-4',
    domain: 'general',
    promptText:
      'Create a quadrant chart for prioritizing tasks using an Eisenhower matrix approach. The x-axis is Effort (Low to High), y-axis is Impact (Low to High). Place items: Quick Wins (high impact, low effort), Major Projects (high impact, high effort), Fill-Ins (low impact, low effort), and Avoid (low impact, high effort). Add specific task examples in each quadrant.',
  },
  {
    communityId: 'pop-misc-5',
    domain: 'general',
    promptText:
      'Create a comprehensive mindmap for web development. Start from "Web Development" as the root, branch into Frontend (HTML, CSS, JavaScript with sub-branches for frameworks like React/Vue/Angular), Backend (Node.js, Python, Go with sub-branches for frameworks), Database (SQL, NoSQL options), DevOps (CI/CD, Docker, Kubernetes), and Testing (Unit, Integration, E2E).',
  },
  {
    communityId: 'pop-misc-6',
    domain: 'general',
    promptText:
      'Create a mindmap for planning a tech startup. Root: "Startup Planning". Main branches: Product (MVP, roadmap, user research), Engineering (tech stack, infrastructure, hiring), Business (revenue model, pricing, legal), Marketing (brand, content, growth channels), and Operations (team structure, tools, culture). Add 2-3 leaves per sub-branch.',
  },
  {
    communityId: 'pop-misc-7',
    domain: 'devops',
    promptText:
      'Create a Git graph diagram showing the GitFlow branching model. Show a main branch, develop branch, two feature branches (feature/auth and feature/dashboard) branching from and merging back to develop, a release branch with a hotfix, and final merge to main with version tags. Use proper commit messages.',
  },
  {
    communityId: 'pop-misc-8',
    domain: 'devops',
    promptText:
      'Create a Git graph diagram showing trunk-based development workflow. Show a main branch as the trunk, short-lived feature branches (feature/api, feature/ui) that merge quickly back to main, release branches cut from main with cherry-picked hotfixes, and frequent small commits to demonstrate continuous integration.',
  },
  {
    communityId: 'pop-misc-9',
    domain: 'ml',
    promptText:
      'Design a machine learning training pipeline flowchart. Start from raw data, then data preprocessing (cleaning, normalization, feature engineering), train/test split, model training with hyperparameter tuning, model evaluation (accuracy, F1 score, cross-validation), model registry, A/B testing deployment, and monitoring for data drift and model degradation.',
  },
  {
    communityId: 'pop-misc-10',
    domain: 'general',
    promptText:
      'Design an ETL (Extract, Transform, Load) data pipeline flowchart. Show data extraction from multiple sources (PostgreSQL, REST APIs, CSV files, S3 buckets), transformation stage (data cleaning, schema mapping, aggregation, data quality checks), and loading into a data warehouse. Include error handling with a dead letter queue and pipeline orchestration with Airflow.',
  },
  {
    communityId: 'pop-misc-11',
    domain: 'general',
    promptText:
      'Create a sequence diagram for a REST API request lifecycle showing authentication and data flow. Include Client, API Gateway, Auth Service, Rate Limiter, Application Server, Cache (Redis), and Database. Show the JWT validation flow, rate limit check, cache lookup (hit/miss paths), database query on cache miss, response caching, and final response with status codes.',
  },
  {
    communityId: 'pop-misc-12',
    domain: 'general',
    promptText:
      'Create a sequence diagram showing WebSocket real-time communication. Include Client, Load Balancer, WebSocket Server, Redis Pub/Sub, and other connected clients. Show the initial HTTP upgrade handshake, connection establishment, bidirectional message flow, broadcasting via pub/sub to other servers and clients, heartbeat/ping-pong keep-alive, and graceful disconnection.',
  },
];

/**
 * Converts community diagrams into PromptEntry format for the marketplace.
 * Diagram code is referenced from COMMUNITY_DATA, not duplicated.
 */
export const POPULAR_SEED_PROMPTS: PromptEntry[] = PROMPT_META.map((meta) => {
  const diagram = COMMUNITY_DATA.find((d) => d.id === meta.communityId);
  if (!diagram) {
    throw new Error(`Community diagram not found: ${meta.communityId}`);
  }
  return {
    id: `seed-${diagram.id}`,
    title: diagram.title,
    author: diagram.author,
    description: diagram.description,
    prompt_text: meta.promptText,
    domain: meta.domain,
    tags: diagram.tags,
    result_diagram_code: diagram.code,
    likes: diagram.likes,
    views: diagram.views,
    created_at: new Date(diagram.createdAtTimestamp ?? Date.parse(diagram.createdAt)).toISOString(),
  };
});
