import type { CommunityDiagram } from '../types.js';

/**
 * Static fallback community diagrams data.
 * Used when Supabase is unavailable or during initial load.
 * Timestamps use fixed dates to avoid drift on bundle load.
 */
export const COMMUNITY_DATA: CommunityDiagram[] = [
  // ═══════════════════════════════════════════
  // ── Software Architecture (10) ─────────────
  // ═══════════════════════════════════════════
  {
    id: 'c1',
    title: 'Microservices Payment System',
    author: 'SarahEng',
    description:
      'A comprehensive flow of a microservices-based payment gateway including fraud detection and ledger updates.',
    likes: 1240,
    views: 8500,
    tags: ['System Design', 'FinTech', 'Flowchart'],
    createdAt: '2025-01-15',
    createdAtTimestamp: new Date('2025-01-15').getTime(),
    code: `graph TB
    Client[Client App]
    API[API Gateway]
    Auth[Auth Service]

    subgraph Payment_Core
        Orchestrator[Payment Orchestrator]
        Ledger[Ledger Service]
        Wallet[Wallet Service]
    end

    subgraph Risk_Engine
        Fraud[Fraud Detection]
        KYC[KYC Service]
    end

    subgraph External_PSPs
        Stripe[Stripe Adapter]
        PayPal[PayPal Adapter]
    end

    Client -->|REST| API
    API -->|gRPC| Auth
    API -->|gRPC| Orchestrator

    Orchestrator -->|Async| Fraud
    Orchestrator -->|Sync| Wallet

    Fraud -.->|Risk Score| Orchestrator

    Orchestrator -->|Route| Stripe
    Orchestrator -->|Route| PayPal

    Stripe -->|Webhook| Ledger
    PayPal -->|Webhook| Ledger

    style Orchestrator fill:#4f46e5,stroke:#312e81,color:#fff
    style Fraud fill:#ef4444,stroke:#7f1d1d,color:#fff
    style Ledger fill:#10b981,stroke:#064e3b,color:#fff`,
  },
  {
    id: 'pop-arch-2',
    title: 'Event-Driven Architecture',
    author: 'EventMaster',
    description:
      'Event-driven system with Kafka event bus, schema registry, multiple producers and consumers, dead letter queue, and CQRS read projections.',
    likes: 1640,
    views: 11200,
    tags: ['Event-Driven', 'CQRS', 'Kafka'],
    createdAt: '2025-02-10',
    createdAtTimestamp: new Date('2025-02-10').getTime(),
    code: `flowchart LR
    subgraph Producers["Event Producers"]
        OrderAPI[Order API]
        RestaurantAPI[Restaurant API]
        DeliveryTracker[Delivery Tracker]
        PaymentGW[Payment Gateway]
    end

    subgraph EventBus["Kafka Event Bus"]
        SchemaReg[Schema Registry]
        OrderTopic[order-events]
        PaymentTopic[payment-events]
        DeliveryTopic[delivery-events]
        DLQ[Dead Letter Queue]
    end

    subgraph Consumers["Event Consumers"]
        OrderWorker[Order Processor]
        NotifyWorker[Notification Worker]
        AnalyticsWorker[Analytics Worker]
        SearchIndexer[Search Indexer]
    end

    subgraph ReadSide["CQRS Read Side"]
        Projector[Event Projector]
        ReadDB[(PostgreSQL)]
        SearchDB[(Elasticsearch)]
        AnalyticsDB[(ClickHouse)]
    end

    OrderAPI -->|publish| OrderTopic
    RestaurantAPI -->|publish| OrderTopic
    DeliveryTracker -->|publish| DeliveryTopic
    PaymentGW -->|publish| PaymentTopic

    OrderTopic -->|consume| OrderWorker
    OrderTopic -->|consume| NotifyWorker
    PaymentTopic -->|consume| AnalyticsWorker
    DeliveryTopic -->|consume| SearchIndexer

    OrderWorker -->|failed| DLQ
    OrderWorker --> Projector
    Projector --> ReadDB
    Projector --> SearchDB
    Projector --> AnalyticsDB

    style EventBus fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Producers fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Consumers fill:#451a03,stroke:#fb923c,color:#fff7ed
    style ReadSide fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe
    style DLQ fill:#7f1d1d,stroke:#f87171,color:#fff`,
  },
  {
    id: 'pop-arch-3',
    title: 'Serverless Architecture on AWS',
    author: 'CloudNinja',
    description:
      'Full serverless backend on AWS with API Gateway, Lambda functions, DynamoDB, S3, SQS, and Step Functions orchestration.',
    likes: 1890,
    views: 13500,
    tags: ['Serverless', 'AWS', 'Cloud Architecture'],
    createdAt: '2025-03-05',
    createdAtTimestamp: new Date('2025-03-05').getTime(),
    code: `flowchart TB
    subgraph Edge["Edge Layer"]
        R53[Route 53 DNS]
        CF[CloudFront CDN]
        WAF[AWS WAF]
    end

    subgraph API["API Layer"]
        APIGW[API Gateway]
        Authorizer[Lambda Authorizer]
    end

    subgraph Compute["Lambda Functions"]
        UserFn[User Function]
        ProductFn[Product Function]
        OrderFn[Order Function]
        PaymentFn[Payment Function]
        SearchFn[Search Function]
    end

    subgraph Orchestration["Step Functions"]
        SF[Order Workflow]
        Validate[Validate Order]
        Reserve[Reserve Inventory]
        Charge[Process Payment]
        Confirm[Confirm Order]
        Notify[Send Notification]
    end

    subgraph Storage["Data Layer"]
        DDB[(DynamoDB)]
        S3[(S3 Bucket)]
        SQS[SQS Queue]
        DLQ2[Dead Letter Queue]
        Cache[ElastiCache Redis]
    end

    subgraph Observability["Monitoring"]
        CW[CloudWatch]
        XRay[X-Ray Tracing]
    end

    R53 --> CF --> WAF --> APIGW
    APIGW --> Authorizer
    APIGW --> UserFn & ProductFn & OrderFn & PaymentFn & SearchFn

    OrderFn -->|start| SF
    SF --> Validate --> Reserve --> Charge --> Confirm --> Notify

    UserFn --> DDB
    ProductFn --> DDB
    ProductFn --> Cache
    OrderFn --> SQS
    SQS -->|failed| DLQ2
    SearchFn --> S3

    Compute -.-> CW & XRay

    style Edge fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style API fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Compute fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Orchestration fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Storage fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Observability fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },
  {
    id: 'pop-arch-4',
    title: 'CQRS + Event Sourcing Pattern',
    author: 'DDDExpert',
    description:
      'Full CQRS implementation with command validation, event sourcing, snapshot store, and multiple read model projections.',
    likes: 1520,
    views: 10400,
    tags: ['CQRS', 'Event Sourcing', 'DDD'],
    createdAt: '2025-03-22',
    createdAtTimestamp: new Date('2025-03-22').getTime(),
    code: `flowchart TB
    subgraph CommandSide["Command Side"]
        CmdGW[Command Gateway]
        Validator[Command Validator]
        BizRules[Business Rules]
        CmdHandler[Command Handlers]
        Aggregate[Aggregate Root]
    end

    subgraph EventStore["Event Store"]
        Stream[Event Stream]
        Snapshots[Snapshot Store]
        Metadata[Event Metadata]
    end

    subgraph ProjectionEngine["Projection Engine"]
        Dispatcher[Event Dispatcher]
        OrderProj[Order Projector]
        UserProj[User Projector]
        AnalyticsProj[Analytics Projector]
        SearchProj[Search Projector]
    end

    subgraph QuerySide["Query Side"]
        QueryGW[Query Gateway]
        ReadModels[(PostgreSQL Read)]
        Analytics[(ClickHouse)]
        SearchIdx[(Elasticsearch)]
        ReadCache[(Redis Cache)]
    end

    CmdGW --> Validator --> BizRules --> CmdHandler --> Aggregate
    Aggregate -->|emit events| Stream
    Stream -->|every 100| Snapshots

    Stream --> Dispatcher
    Dispatcher --> OrderProj & UserProj & AnalyticsProj & SearchProj

    OrderProj --> ReadModels
    UserProj --> ReadModels
    AnalyticsProj --> Analytics
    SearchProj --> SearchIdx

    QueryGW --> ReadModels & Analytics & SearchIdx & ReadCache

    style CommandSide fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style EventStore fill:#7f1d1d,stroke:#f87171,color:#fecaca
    style ProjectionEngine fill:#052e16,stroke:#22c55e,color:#dcfce7
    style QuerySide fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe`,
  },
  {
    id: 'pop-arch-5',
    title: 'Hexagonal Architecture',
    author: 'CleanArch42',
    description:
      'Clean hexagonal architecture with domain core, driving adapters (REST, gRPC, GraphQL), driven adapters (DB, cache, messaging), and port interfaces.',
    likes: 1780,
    views: 12600,
    tags: ['Hexagonal', 'Clean Architecture', 'Ports & Adapters'],
    createdAt: '2025-04-08',
    createdAtTimestamp: new Date('2025-04-08').getTime(),
    code: `flowchart TB
    subgraph DrivingAdapters["Driving Adapters (Left)"]
        REST[REST API]
        GRPC[gRPC Server]
        GraphQL[GraphQL Endpoint]
        WS[WebSocket Server]
        CLI[CLI Tool]
    end

    subgraph DrivingPorts["Driving Ports"]
        CreateOrder[CreateOrder Port]
        GetOrder[GetOrder Port]
        ProcessPay[ProcessPayment Port]
        UpdateInv[UpdateInventory Port]
    end

    subgraph DomainCore["Domain Core"]
        OrderAgg[Order Aggregate]
        ProductEnt[Product Entity]
        UserEnt[User Entity]
        PaymentVO[Payment Value Object]
        PricingPolicy[Pricing Policy]
        DomainEvents[Domain Event Publisher]
    end

    subgraph DrivenPorts["Driven Ports"]
        OrderRepo[OrderRepository Port]
        ProductRepo[ProductRepository Port]
        PayGW[PaymentGateway Port]
        NotifPort[Notification Port]
        CachePort[Cache Port]
    end

    subgraph DrivenAdapters["Driven Adapters (Right)"]
        PG[(PostgreSQL)]
        Mongo[(MongoDB)]
        StripeAdapt[Stripe Adapter]
        RedisAdapt[Redis Adapter]
        KafkaAdapt[Kafka Adapter]
        SMTPAdapt[SMTP Adapter]
    end

    REST & GRPC & GraphQL & WS & CLI --> CreateOrder & GetOrder & ProcessPay & UpdateInv
    CreateOrder & GetOrder --> OrderAgg
    ProcessPay --> PaymentVO
    UpdateInv --> ProductEnt

    OrderAgg --> OrderRepo & DomainEvents
    ProductEnt --> ProductRepo
    PaymentVO --> PayGW
    DomainEvents --> NotifPort

    OrderRepo --> PG
    ProductRepo --> Mongo
    PayGW --> StripeAdapt
    CachePort --> RedisAdapt
    NotifPort --> KafkaAdapt & SMTPAdapt

    style DrivingAdapters fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style DrivingPorts fill:#1e3a5f,stroke:#38bdf8,color:#e0f2fe
    style DomainCore fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style DrivenPorts fill:#1e3a5f,stroke:#38bdf8,color:#e0f2fe
    style DrivenAdapters fill:#052e16,stroke:#22c55e,color:#dcfce7`,
  },
  {
    id: 'pop-arch-6',
    title: 'GraphQL Federation Gateway',
    author: 'APIDesigner',
    description:
      'Apollo Federation v2 architecture with gateway, 4 domain subgraphs, entity resolution, and DataLoader batching.',
    likes: 1180,
    views: 8600,
    tags: ['GraphQL', 'Federation', 'Apollo'],
    createdAt: '2025-04-25',
    createdAtTimestamp: new Date('2025-04-25').getTime(),
    code: `flowchart TB
    subgraph Clients["Clients"]
        Web[Web App]
        Mobile[Mobile App]
        Partner[Partner API]
    end

    subgraph Gateway["Federation Gateway"]
        Router[Apollo Router]
        Planner[Query Planner]
        RateLimit[Rate Limiter]
        Cache[Response Cache]
    end

    subgraph UserSub["User Subgraph"]
        UserResolver[User Resolver]
        UserDB[(PostgreSQL)]
    end

    subgraph ProductSub["Product Subgraph"]
        ProductResolver[Product Resolver]
        ReviewResolver[Review Resolver]
        ProductDB[(MongoDB)]
    end

    subgraph OrderSub["Order Subgraph"]
        OrderResolver[Order Resolver]
        OrderDB[(PostgreSQL)]
    end

    subgraph InventorySub["Inventory Subgraph"]
        StockResolver[Stock Resolver]
        InventoryDB[(PostgreSQL)]
    end

    Web & Mobile & Partner --> Router
    Router --> RateLimit --> Planner
    Router --> Cache

    Planner -->|user fields| UserResolver
    Planner -->|product fields| ProductResolver
    Planner -->|order fields| OrderResolver
    Planner -->|stock fields| StockResolver

    UserResolver --> UserDB
    ProductResolver --> ProductDB
    ReviewResolver --> ProductDB
    OrderResolver --> OrderDB
    StockResolver --> InventoryDB

    OrderResolver -.->|resolve user| UserResolver
    OrderResolver -.->|resolve product| ProductResolver

    style Clients fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Gateway fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style UserSub fill:#1e3a5f,stroke:#38bdf8,color:#e0f2fe
    style ProductSub fill:#052e16,stroke:#22c55e,color:#dcfce7
    style OrderSub fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style InventorySub fill:#7f1d1d,stroke:#f87171,color:#fecaca`,
  },
  {
    id: 'pop-arch-7',
    title: 'Distributed Cache with Redis',
    author: 'CacheKing',
    description:
      'Enterprise caching strategy with Redis Cluster, cache-aside, write-through, and write-behind patterns with pub/sub invalidation.',
    likes: 2020,
    views: 14800,
    tags: ['Caching', 'Redis', 'Performance'],
    createdAt: '2025-05-12',
    createdAtTimestamp: new Date('2025-05-12').getTime(),
    code: `flowchart TB
    subgraph App["Application Layer"]
        App1[App Server 1]
        App2[App Server 2]
        Client[Cache Client]
    end

    subgraph Patterns["Caching Patterns"]
        CacheAside[Cache-Aside<br/>1. Check → 2. Miss → DB → 3. Set]
        WriteThrough[Write-Through<br/>1. Write Cache → 2. Sync DB]
        WriteBehind[Write-Behind<br/>1. Write Cache → 2. Async Queue]
    end

    subgraph RedisCluster["Redis Cluster"]
        M1[Master 1<br/>slots 0-5460]
        M2[Master 2<br/>slots 5461-10922]
        M3[Master 3<br/>slots 10923-16383]
        R1[Replica 1]
        R2[Replica 2]
        R3[Replica 3]
    end

    subgraph Invalidation["Cache Invalidation"]
        PubSub[Redis Pub/Sub]
        TTL[TTL Manager]
        Sentinel[Redis Sentinel]
    end

    subgraph DB["Persistence"]
        Primary[(PostgreSQL Primary)]
        Replica[(Read Replica)]
    end

    App1 & App2 --> Client
    Client --> CacheAside & WriteThrough & WriteBehind
    CacheAside --> M1
    WriteThrough --> M2
    WriteBehind --> M3

    M1 -->|replicate| R1
    M2 -->|replicate| R2
    M3 -->|replicate| R3

    CacheAside -->|miss| Replica
    WriteThrough -->|sync| Primary
    WriteBehind -->|async| Primary

    Primary -->|change event| PubSub
    PubSub --> M1 & M2 & M3
    Sentinel -->|monitor| RedisCluster

    style App fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Patterns fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style RedisCluster fill:#7f1d1d,stroke:#f87171,color:#fecaca
    style Invalidation fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style DB fill:#052e16,stroke:#22c55e,color:#dcfce7`,
  },
  {
    id: 'pop-arch-8',
    title: 'Real-time Data Pipeline',
    author: 'DataPipelinePro',
    description:
      'End-to-end real-time data pipeline with Kafka ingestion, Flink stream processing, Delta Lake storage, and analytics serving layer.',
    likes: 2350,
    views: 16100,
    tags: ['Data Pipeline', 'Kafka', 'Stream Processing'],
    createdAt: '2025-05-28',
    createdAtTimestamp: new Date('2025-05-28').getTime(),
    code: `flowchart LR
    subgraph Sources["Data Sources"]
        Web[Web Clickstream]
        Mobile[Mobile Events]
        IoT[IoT Sensors]
        CDC[Database CDC]
    end

    subgraph Ingestion["Kafka Ingestion"]
        Connect[Kafka Connect]
        Schema[Schema Registry]
        Raw[raw-events topic]
        Enriched[enriched-events topic]
        DLQ[Dead Letter Queue]
    end

    subgraph Processing["Flink Stream Processing"]
        Deser[Deserialize & Validate]
        Dedup[Deduplication]
        Enrich[Enrichment]
        Agg[Windowed Aggregation]
        Anomaly[Anomaly Detection]
    end

    subgraph Lake["Data Lake"]
        Bronze[Bronze Layer]
        Silver[Silver Layer]
        Gold[Gold Layer]
    end

    subgraph Serving["Serving Layer"]
        Presto[Presto SQL]
        Click[(ClickHouse)]
        ES[(Elasticsearch)]
        Redis[(Redis)]
    end

    subgraph Consumption["Dashboards"]
        Grafana[Grafana]
        Superset[Superset]
        Alerts[PagerDuty]
    end

    Web & Mobile & IoT & CDC --> Connect
    Connect --> Schema --> Raw
    Raw --> Deser
    Deser -->|invalid| DLQ
    Deser --> Dedup --> Enrich --> Agg & Anomaly
    Agg --> Enriched

    Enriched --> Bronze --> Silver --> Gold
    Enriched --> Click & Redis & ES
    Gold --> Presto

    Click & Redis --> Grafana
    Presto --> Superset
    Anomaly --> Alerts

    style Sources fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Ingestion fill:#451a03,stroke:#fb923c,color:#fff7ed
    style Processing fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Lake fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Serving fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Consumption fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },
  {
    id: 'pop-arch-9',
    title: 'Service Mesh with Istio',
    author: 'MeshEngineer',
    description:
      'Kubernetes-based service mesh with Istio control plane, Envoy sidecars, mTLS, traffic management, and observability stack.',
    likes: 1340,
    views: 9800,
    tags: ['Service Mesh', 'Istio', 'Kubernetes'],
    createdAt: '2025-06-10',
    createdAtTimestamp: new Date('2025-06-10').getTime(),
    code: `flowchart TB
    LB[Load Balancer] --> Ingress[Istio Ingress Gateway]

    subgraph ControlPlane["Istio Control Plane"]
        Istiod[Istiod]
        Pilot[Pilot - xDS Config]
        Citadel[Citadel - mTLS Certs]
        Galley[Galley - Config Validation]
    end

    subgraph DataPlane["Data Plane - Pods"]
        subgraph Pod1["Frontend Pod"]
            FE[Frontend App]
            E1[Envoy Sidecar]
        end
        subgraph Pod2["Order Pod"]
            OrderSvc[Order Service]
            E2[Envoy Sidecar]
        end
        subgraph Pod3["Payment Pod"]
            PaySvc[Payment Service]
            E3[Envoy Sidecar]
        end
        subgraph Pod4["User Pod"]
            UserSvc[User Service]
            E4[Envoy Sidecar]
        end
    end

    subgraph Traffic["Traffic Management"]
        Canary[Canary Deploy 90/10]
        CB[Circuit Breaker]
        Retry[Retry Policy]
    end

    subgraph Observability["Observability"]
        Kiali[Kiali Service Graph]
        Jaeger[Jaeger Tracing]
        Prom[Prometheus Metrics]
        Graf[Grafana Dashboards]
    end

    Ingress --> E1
    E1 -->|mTLS| E2 & E3 & E4
    E2 -->|mTLS| E3

    Istiod --> Pilot & Citadel & Galley
    Pilot -->|config| E1 & E2 & E3 & E4
    Citadel -->|certs| E1 & E2 & E3 & E4

    E1 & E2 & E3 & E4 -.-> Kiali & Jaeger & Prom
    Prom --> Graf
    Canary & CB & Retry -.-> Istiod

    style ControlPlane fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style DataPlane fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Traffic fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Observability fill:#052e16,stroke:#22c55e,color:#dcfce7`,
  },
  {
    id: 'pop-arch-10',
    title: 'Monolith to Microservices Migration',
    author: 'MigrationGuru',
    description:
      'Strangler Fig pattern visualizing gradual decomposition of a monolith into microservices with anti-corruption layer and data sync.',
    likes: 1450,
    views: 10800,
    tags: ['Migration', 'Strangler Fig', 'Microservices'],
    createdAt: '2025-06-25',
    createdAtTimestamp: new Date('2025-06-25').getTime(),
    code: `flowchart LR
    subgraph Facade["API Facade"]
        Proxy[Reverse Proxy]
        Router[Routing Rules]
        Canary[Canary Router<br/>10% → 100%]
    end

    subgraph Monolith["Legacy Monolith"]
        AuthMod[Auth Module]
        UserMod[User Module]
        OrderMod[Order Module]
        PayMod[Payment Module]
        InvMod[Inventory Module]
        OracleDB[(Oracle DB)]
    end

    subgraph ACL["Anti-Corruption Layer"]
        UserTranslator[User Translator]
        OrderTranslator[Order Translator]
        PayTranslator[Payment Translator]
        EventAdapter[Event Adapter]
    end

    subgraph NewServices["Extracted Microservices"]
        UserSvcV2[User Service v2]
        OrderSvcV2[Order Service v2]
        PaySvcV2[Payment Service v2]
        UserPG[(User PostgreSQL)]
        OrderPG[(Order PostgreSQL)]
        PayPG[(Payment PostgreSQL)]
        EventBus[Kafka Event Bus]
    end

    subgraph DataSync["Data Synchronization"]
        CDCSync[Change Data Capture]
        Reconciliation[Reconciliation Jobs]
    end

    Proxy --> Router
    Router -->|legacy| Monolith
    Router -->|new| ACL
    Canary -->|traffic shift| Router

    UserMod & OrderMod & PayMod --> OracleDB

    ACL --> UserTranslator & OrderTranslator & PayTranslator
    UserTranslator --> UserSvcV2
    OrderTranslator --> OrderSvcV2
    PayTranslator --> PaySvcV2
    EventAdapter --> EventBus

    UserSvcV2 --> UserPG
    OrderSvcV2 --> OrderPG
    PaySvcV2 --> PayPG

    OracleDB -->|CDC| CDCSync --> EventBus
    Reconciliation --> OracleDB & UserPG & OrderPG

    style Facade fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Monolith fill:#7f1d1d,stroke:#f87171,color:#fecaca
    style ACL fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style NewServices fill:#052e16,stroke:#22c55e,color:#dcfce7
    style DataSync fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe`,
  },

  // ═══════════════════════════════════════════
  // ── DevOps & Cloud (10) ────────────────────
  // ═══════════════════════════════════════════
  {
    id: 'pop-devops-1',
    title: 'CI/CD Pipeline',
    author: 'DevOpsKing',
    description:
      'Complete CI/CD pipeline from source to production with build, test, security scan, staging, and production deployment with rollback.',
    likes: 2680,
    views: 18900,
    tags: ['CI/CD', 'DevOps', 'Automation'],
    createdAt: '2025-02-01',
    createdAtTimestamp: new Date('2025-02-01').getTime(),
    code: `flowchart LR
    subgraph Source["Source"]
        Git[Git Push]
        PR[Pull Request]
        Webhook[Webhook Trigger]
    end

    subgraph Build["Build Stage"]
        Deps[Install Deps]
        Lint[Lint & Format]
        Compile[Compile/Build]
        DockerBuild[Docker Build]
    end

    subgraph Test["Test Stage"]
        Unit[Unit Tests]
        Integration[Integration Tests]
        E2E[E2E Tests]
        Coverage[Coverage Check]
    end

    subgraph Security["Security Scan"]
        SAST[SAST Scan]
        SCA[Dependency Scan]
        Container[Container Scan]
        Secrets[Secret Detection]
    end

    subgraph Deploy["Deployment"]
        Staging[Deploy Staging]
        SmokeTest[Smoke Tests]
        Approval{Manual Approval}
        Prod[Deploy Production]
        Rollback[Rollback]
    end

    subgraph Monitor["Post-Deploy"]
        Health[Health Checks]
        Metrics[Metrics Watch]
        Alerts[Alert Rules]
    end

    Git & PR --> Webhook --> Deps --> Lint --> Compile --> DockerBuild
    DockerBuild --> Unit --> Integration --> E2E --> Coverage
    Coverage --> SAST --> SCA --> Container --> Secrets
    Secrets --> Staging --> SmokeTest --> Approval
    Approval -->|approved| Prod --> Health --> Metrics --> Alerts
    Approval -->|rejected| Rollback
    Prod -->|failed| Rollback

    style Source fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Build fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Test fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Security fill:#7f1d1d,stroke:#f87171,color:#fecaca
    style Deploy fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Monitor fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },
  {
    id: 'pop-devops-2',
    title: 'Kubernetes Cluster Architecture',
    author: 'K8sKing',
    description:
      'Kubernetes cluster showing control plane components, worker nodes with pods, services, ingress controller, and persistent storage.',
    likes: 2450,
    views: 17200,
    tags: ['Kubernetes', 'Container Orchestration', 'DevOps'],
    createdAt: '2025-02-18',
    createdAtTimestamp: new Date('2025-02-18').getTime(),
    code: `flowchart TB
    Internet[Internet Traffic]
    Ingress[Ingress Controller]

    subgraph ControlPlane["Control Plane"]
        APIServer[kube-apiserver]
        Scheduler[kube-scheduler]
        Controller[controller-manager]
        ETCD[(etcd cluster)]
        CoreDNS[CoreDNS]
    end

    subgraph Worker1["Worker Node 1"]
        Kubelet1[kubelet]
        KProxy1[kube-proxy]
        subgraph Pod1A["Pod: frontend"]
            FE[nginx:latest]
        end
        subgraph Pod1B["Pod: api"]
            API[node:18-alpine]
        end
    end

    subgraph Worker2["Worker Node 2"]
        Kubelet2[kubelet]
        KProxy2[kube-proxy]
        subgraph Pod2A["Pod: api"]
            API2[node:18-alpine]
        end
        subgraph Pod2B["Pod: worker"]
            Worker[worker:latest]
        end
    end

    subgraph Storage["Persistent Storage"]
        PV[PersistentVolume]
        SC[StorageClass]
        CSI[CSI Driver]
    end

    subgraph Services["Services"]
        FESvc[frontend-svc ClusterIP]
        APISvc[api-svc ClusterIP]
        WorkerSvc[worker-svc Headless]
    end

    Internet --> Ingress --> FESvc --> Pod1A
    FESvc --> FE
    APISvc --> Pod1B & Pod2A
    WorkerSvc --> Pod2B

    APIServer --> Scheduler & Controller
    APIServer --> ETCD
    Kubelet1 & Kubelet2 --> APIServer
    CoreDNS --> APIServer

    Pod2B --> PV
    PV --> SC --> CSI

    style ControlPlane fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Worker1 fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Worker2 fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Storage fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Services fill:#052e16,stroke:#22c55e,color:#dcfce7`,
  },
  {
    id: 'pop-devops-3',
    title: 'AWS Three-Tier Architecture',
    author: 'AWSArchitect',
    description:
      'Production AWS architecture with Route53, CloudFront, ALB, ECS Fargate, RDS Multi-AZ, ElastiCache, and S3.',
    likes: 2100,
    views: 15300,
    tags: ['AWS', 'Cloud', 'Three-Tier'],
    createdAt: '2025-03-10',
    createdAtTimestamp: new Date('2025-03-10').getTime(),
    code: `flowchart TB
    Users[Users] --> R53[Route 53]
    R53 --> CF[CloudFront CDN]
    CF --> S3Static[(S3 Static Assets)]

    subgraph VPC["VPC"]
        subgraph Public["Public Subnets"]
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
        end

        subgraph Private["Private Subnets"]
            subgraph ECS["ECS Fargate Cluster"]
                Svc1[Service A - 3 tasks]
                Svc2[Service B - 2 tasks]
                Svc3[Service C - 2 tasks]
            end
        end

        subgraph Data["Data Subnets"]
            RDS[(RDS PostgreSQL<br/>Multi-AZ)]
            Redis[(ElastiCache Redis<br/>Cluster)]
            SQS[SQS Queue]
        end
    end

    subgraph Monitoring["Monitoring"]
        CloudWatch[CloudWatch]
        XRay[X-Ray]
        SNS[SNS Alerts]
    end

    CF -->|API| ALB
    ALB --> Svc1 & Svc2 & Svc3
    Svc1 & Svc2 --> RDS
    Svc1 --> Redis
    Svc2 --> SQS --> Svc3
    ECS -.-> CloudWatch & XRay
    CloudWatch --> SNS

    style VPC fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Public fill:#1e3a5f,stroke:#38bdf8,color:#e0f2fe
    style Private fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Data fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Monitoring fill:#3b0764,stroke:#c084fc,color:#f3e8ff
    style ECS fill:#4c1d95,stroke:#a78bfa,color:#ede9fe`,
  },
  {
    id: 'pop-devops-4',
    title: 'Monitoring & Observability Stack',
    author: 'SREHero',
    description:
      'Complete observability stack with Prometheus metrics, Grafana dashboards, Loki logs, Jaeger tracing, and PagerDuty alerting.',
    likes: 1950,
    views: 13800,
    tags: ['Monitoring', 'Observability', 'SRE'],
    createdAt: '2025-03-28',
    createdAtTimestamp: new Date('2025-03-28').getTime(),
    code: `flowchart TB
    subgraph Applications["Applications"]
        App1[Service A]
        App2[Service B]
        App3[Service C]
    end

    subgraph Metrics["Metrics Pipeline"]
        Prom[Prometheus]
        NodeExp[Node Exporter]
        CAdvisor[cAdvisor]
        PushGW[Pushgateway]
    end

    subgraph Logs["Log Pipeline"]
        Promtail[Promtail Agent]
        Loki[Grafana Loki]
        LogStore[(Log Storage)]
    end

    subgraph Traces["Tracing Pipeline"]
        OTel[OpenTelemetry Collector]
        Jaeger[Jaeger]
        TraceStore[(Trace Storage)]
    end

    subgraph Visualization["Dashboards & Alerts"]
        Grafana[Grafana]
        AlertMgr[AlertManager]
        PagerDuty[PagerDuty]
        Slack[Slack Notifications]
        RunBooks[Runbook Links]
    end

    App1 & App2 & App3 -->|expose /metrics| Prom
    NodeExp & CAdvisor & PushGW --> Prom
    App1 & App2 & App3 -->|stdout/stderr| Promtail --> Loki --> LogStore
    App1 & App2 & App3 -->|spans| OTel --> Jaeger --> TraceStore

    Prom --> Grafana
    Loki --> Grafana
    Jaeger --> Grafana
    Prom -->|rules| AlertMgr
    AlertMgr --> PagerDuty & Slack
    PagerDuty --> RunBooks

    style Applications fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Metrics fill:#7f1d1d,stroke:#f87171,color:#fecaca
    style Logs fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Traces fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Visualization fill:#713f12,stroke:#fbbf24,color:#fef3c7`,
  },
  {
    id: 'pop-devops-5',
    title: 'GitOps with ArgoCD',
    author: 'GitOpsNinja',
    description:
      'GitOps workflow with ArgoCD managing Kubernetes clusters, automatic sync from Git, health monitoring, and multi-environment deployment.',
    likes: 1680,
    views: 11900,
    tags: ['GitOps', 'ArgoCD', 'Kubernetes'],
    createdAt: '2025-04-15',
    createdAtTimestamp: new Date('2025-04-15').getTime(),
    code: `flowchart LR
    subgraph Dev["Developer Workflow"]
        DevPush[Git Push]
        PR[Pull Request]
        Review[Code Review]
        Merge[Merge to Main]
    end

    subgraph CI["CI Pipeline"]
        Build[Build & Test]
        Image[Build Docker Image]
        Registry[(Container Registry)]
        UpdateManifest[Update K8s Manifests]
    end

    subgraph GitRepo["Git Repository"]
        AppRepo[App Source Repo]
        ConfigRepo[Config/Manifest Repo]
        HelmCharts[Helm Charts]
        Kustomize[Kustomize Overlays]
    end

    subgraph ArgoCD["ArgoCD"]
        AppCtrl[Application Controller]
        RepoServer[Repo Server]
        Sync[Sync Engine]
        Health[Health Monitor]
        Diff[Diff Engine]
    end

    subgraph Clusters["Kubernetes Clusters"]
        Staging[Staging Cluster]
        Prod[Production Cluster]
    end

    DevPush --> PR --> Review --> Merge
    Merge --> Build --> Image --> Registry
    Image --> UpdateManifest --> ConfigRepo

    ConfigRepo --> RepoServer
    HelmCharts --> RepoServer
    Kustomize --> RepoServer

    RepoServer --> AppCtrl
    AppCtrl --> Diff -->|drift detected| Sync
    Sync --> Staging & Prod
    Health -->|monitor| Staging & Prod

    style Dev fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style CI fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style GitRepo fill:#052e16,stroke:#22c55e,color:#dcfce7
    style ArgoCD fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Clusters fill:#713f12,stroke:#fbbf24,color:#fef3c7`,
  },
  {
    id: 'pop-devops-6',
    title: 'OAuth2 Authorization Flow',
    author: 'SecurityPro',
    description:
      'Complete OAuth2 authorization code flow with PKCE showing client, authorization server, and resource server interactions.',
    likes: 2240,
    views: 16500,
    tags: ['OAuth2', 'Security', 'Authentication'],
    createdAt: '2025-05-02',
    createdAtTimestamp: new Date('2025-05-02').getTime(),
    code: `sequenceDiagram
    participant User
    participant Client as Client App
    participant AuthServer as Authorization Server
    participant Resource as Resource Server

    User->>Client: Click "Login"
    Client->>Client: Generate code_verifier & code_challenge (PKCE)
    Client->>AuthServer: GET /authorize?response_type=code&code_challenge=...
    AuthServer->>User: Show Login Page

    alt User Approves
        User->>AuthServer: Enter credentials & consent
        AuthServer->>Client: Redirect with authorization_code
        Client->>AuthServer: POST /token (code + code_verifier)
        AuthServer->>AuthServer: Verify code_challenge matches
        AuthServer->>Client: access_token + refresh_token

        Client->>Resource: GET /api/data (Bearer access_token)
        Resource->>Resource: Validate JWT signature & claims
        Resource->>Client: 200 OK + data
        Client->>User: Display data
    else Token Expired
        Client->>AuthServer: POST /token (refresh_token)
        AuthServer->>Client: New access_token + refresh_token
    else User Denies
        AuthServer->>Client: Redirect with error=access_denied
        Client->>User: Show error message
    end`,
  },
  {
    id: 'pop-devops-7',
    title: 'DNS Resolution Flow',
    author: 'NetworkWiz',
    description:
      'Step-by-step DNS resolution showing recursive resolver, root servers, TLD servers, authoritative nameservers, and caching layers.',
    likes: 1560,
    views: 11200,
    tags: ['DNS', 'Networking', 'Infrastructure'],
    createdAt: '2025-05-18',
    createdAtTimestamp: new Date('2025-05-18').getTime(),
    code: `sequenceDiagram
    participant Browser
    participant OSCache as OS DNS Cache
    participant Resolver as Recursive Resolver
    participant Root as Root Server (.)
    participant TLD as TLD Server (.com)
    participant Auth as Authoritative NS

    Browser->>OSCache: Lookup example.com
    alt Cache Hit
        OSCache->>Browser: Return cached IP
    else Cache Miss
        OSCache->>Resolver: Query example.com

        Resolver->>Resolver: Check local cache
        alt Resolver Cache Hit
            Resolver->>OSCache: Return cached IP
        else Resolver Cache Miss
            Resolver->>Root: Query example.com (type A)
            Root->>Resolver: Referral to .com TLD servers

            Resolver->>TLD: Query example.com (type A)
            TLD->>Resolver: Referral to ns1.example.com

            Resolver->>Auth: Query example.com (type A)
            Auth->>Resolver: A record: 93.184.216.34 (TTL 3600)

            Note over Resolver: Cache response for TTL duration
            Resolver->>OSCache: 93.184.216.34
        end

        OSCache->>Browser: 93.184.216.34
    end

    Browser->>Browser: Connect to 93.184.216.34:443`,
  },
  {
    id: 'pop-devops-8',
    title: 'Terraform Infrastructure Workflow',
    author: 'InfraHero',
    description:
      'Terraform workflow showing init, plan, apply, state management, modules, providers, and remote backend.',
    likes: 1420,
    views: 10100,
    tags: ['Terraform', 'IaC', 'DevOps'],
    createdAt: '2025-06-04',
    createdAtTimestamp: new Date('2025-06-04').getTime(),
    code: `flowchart LR
    subgraph Developer["Developer"]
        Write[Write .tf Files]
        Init[terraform init]
        Plan[terraform plan]
        Apply[terraform apply]
    end

    subgraph Modules["Terraform Modules"]
        VPCMod[VPC Module]
        ECSMod[ECS Module]
        RDSMod[RDS Module]
        IAMMod[IAM Module]
    end

    subgraph Providers["Providers"]
        AWS[AWS Provider]
        GitHub[GitHub Provider]
        Datadog[Datadog Provider]
    end

    subgraph Backend["Remote Backend"]
        S3State[(S3 State Bucket)]
        DynamoLock[(DynamoDB Lock Table)]
        StateFile[terraform.tfstate]
    end

    subgraph Infrastructure["Created Infrastructure"]
        VPC[VPC & Subnets]
        ECS[ECS Cluster]
        RDS[(RDS Database)]
        LB[Load Balancer]
    end

    Write --> Init -->|download providers| Providers
    Init -->|download modules| Modules
    Init -->|configure backend| Backend

    Plan -->|read state| StateFile
    Plan -->|diff| Infrastructure
    Apply -->|create/update| Infrastructure
    Apply -->|update state| StateFile
    DynamoLock -->|lock| StateFile

    VPCMod --> VPC
    ECSMod --> ECS
    RDSMod --> RDS

    style Developer fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Modules fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Providers fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Backend fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Infrastructure fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff`,
  },
  {
    id: 'pop-devops-9',
    title: 'Load Balancer Architecture',
    author: 'ScaleExpert',
    description:
      'Multi-tier load balancing with L4/L7 balancers, health checks, auto-scaling groups, and failover across availability zones.',
    likes: 1380,
    views: 9700,
    tags: ['Load Balancing', 'Scaling', 'High Availability'],
    createdAt: '2025-06-20',
    createdAtTimestamp: new Date('2025-06-20').getTime(),
    code: `flowchart TB
    DNS[DNS Round Robin]

    subgraph L4["L4 Load Balancer (TCP)"]
        NLB1[NLB - AZ-1]
        NLB2[NLB - AZ-2]
    end

    subgraph L7["L7 Load Balancer (HTTP)"]
        ALB1[ALB - AZ-1]
        ALB2[ALB - AZ-2]
        Rules[Path-Based Routing]
        SSL[SSL Termination]
    end

    subgraph ASG1["Auto Scaling Group - AZ-1"]
        EC2A1[Instance A1]
        EC2A2[Instance A2]
        EC2A3[Instance A3]
    end

    subgraph ASG2["Auto Scaling Group - AZ-2"]
        EC2B1[Instance B1]
        EC2B2[Instance B2]
        EC2B3[Instance B3]
    end

    subgraph Health["Health Monitoring"]
        HC[Health Checks<br/>HTTP /health]
        Drain[Connection Draining]
        Sticky[Sticky Sessions]
        ASPolicy[Auto Scale Policy<br/>CPU > 70% → scale up]
    end

    DNS --> NLB1 & NLB2
    NLB1 --> ALB1
    NLB2 --> ALB2
    ALB1 & ALB2 --> SSL --> Rules
    Rules -->|/api/*| ASG1
    Rules -->|/web/*| ASG2

    HC -->|check| EC2A1 & EC2A2 & EC2A3 & EC2B1 & EC2B2 & EC2B3
    ASPolicy -->|scale| ASG1 & ASG2

    style L4 fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style L7 fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style ASG1 fill:#052e16,stroke:#22c55e,color:#dcfce7
    style ASG2 fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Health fill:#713f12,stroke:#fbbf24,color:#fef3c7`,
  },
  {
    id: 'pop-devops-10',
    title: 'Docker Compose Microservices',
    author: 'ContainerDev',
    description:
      'Docker Compose setup with multiple services, Nginx reverse proxy, shared networks, volumes, and Redis/PostgreSQL dependencies.',
    likes: 1720,
    views: 12400,
    tags: ['Docker', 'Compose', 'Microservices'],
    createdAt: '2025-07-05',
    createdAtTimestamp: new Date('2025-07-05').getTime(),
    code: `flowchart TB
    subgraph DockerCompose["docker-compose.yml"]
        subgraph Frontend["frontend network"]
            Nginx[Nginx Reverse Proxy<br/>:80, :443]
            WebApp[React App<br/>:3000]
        end

        subgraph Backend["backend network"]
            API[API Server<br/>:8080]
            Worker[Background Worker]
            Scheduler[Cron Scheduler]
        end

        subgraph Data["data network"]
            PG[(PostgreSQL<br/>:5432)]
            Redis[(Redis<br/>:6379)]
            Minio[(MinIO S3<br/>:9000)]
        end

        subgraph Monitoring["monitoring network"]
            Prom[Prometheus<br/>:9090]
            Grafana[Grafana<br/>:3001]
        end
    end

    subgraph Volumes["Docker Volumes"]
        PGData[pg-data]
        RedisData[redis-data]
        MinioData[minio-data]
    end

    Nginx -->|proxy_pass /api| API
    Nginx -->|proxy_pass /| WebApp
    API --> PG & Redis
    Worker --> PG & Redis & Minio
    Scheduler --> API

    PG --> PGData
    Redis --> RedisData
    Minio --> MinioData

    API & Worker -.-> Prom
    Prom --> Grafana

    style Frontend fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Backend fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Data fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Monitoring fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },

  // ═══════════════════════════════════════════
  // ── Database & Class Diagrams (10) ─────────
  // ═══════════════════════════════════════════
  {
    id: 'pop-data-1',
    title: 'E-Commerce Database Schema',
    author: 'DBArchitect',
    description:
      'Complete e-commerce ER diagram with users, products, orders, payments, reviews, categories, and shipping entities.',
    likes: 2560,
    views: 18200,
    tags: ['ER Diagram', 'Database', 'E-Commerce'],
    createdAt: '2025-01-20',
    createdAtTimestamp: new Date('2025-01-20').getTime(),
    code: `erDiagram
    USER {
        int user_id PK
        string email
        string password_hash
        string first_name
        string last_name
        string phone
        string role
        datetime created_at
    }
    CATEGORY {
        int category_id PK
        string name
        string slug
        int parent_id FK
    }
    PRODUCT {
        int product_id PK
        int category_id FK
        string name
        text description
        decimal price
        int stock_quantity
        string sku
        string status
        datetime created_at
    }
    ORDER {
        int order_id PK
        int user_id FK
        decimal subtotal
        decimal tax
        decimal shipping_cost
        decimal total
        string status
        string payment_status
        datetime ordered_at
    }
    ORDER_ITEM {
        int item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }
    PAYMENT {
        int payment_id PK
        int order_id FK
        string method
        string provider
        string transaction_id
        decimal amount
        string status
        datetime paid_at
    }
    SHIPPING {
        int shipping_id PK
        int order_id FK
        string carrier
        string tracking_number
        string status
        date estimated_delivery
        date delivered_at
    }
    REVIEW {
        int review_id PK
        int product_id FK
        int user_id FK
        int rating
        text comment
        datetime created_at
    }
    ADDRESS {
        int address_id PK
        int user_id FK
        string line1
        string city
        string state
        string postal_code
        string country
        boolean is_default
    }

    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--o{ ADDRESS : has
    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY ||--o{ CATEGORY : "parent of"
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--o{ REVIEW : receives
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : "paid via"
    ORDER ||--o| SHIPPING : "shipped via"`,
  },
  {
    id: 'pop-data-2',
    title: 'Social Media Platform ER',
    author: 'SchemaWiz',
    description:
      'Social media platform database with users, posts, comments, likes, followers, messages, groups, and media entities.',
    likes: 2100,
    views: 14900,
    tags: ['ER Diagram', 'Social Media', 'Database'],
    createdAt: '2025-02-05',
    createdAtTimestamp: new Date('2025-02-05').getTime(),
    code: `erDiagram
    USER {
        int user_id PK
        string username
        string email
        string display_name
        text bio
        string avatar_url
        boolean is_verified
        datetime joined_at
    }
    POST {
        int post_id PK
        int user_id FK
        text content
        string visibility
        int likes_count
        int comments_count
        int shares_count
        datetime created_at
    }
    COMMENT {
        int comment_id PK
        int post_id FK
        int user_id FK
        int parent_comment_id FK
        text content
        datetime created_at
    }
    LIKE {
        int like_id PK
        int user_id FK
        int post_id FK
        int comment_id FK
        datetime created_at
    }
    FOLLOW {
        int follow_id PK
        int follower_id FK
        int following_id FK
        datetime created_at
    }
    MESSAGE {
        int message_id PK
        int sender_id FK
        int receiver_id FK
        text content
        boolean is_read
        datetime sent_at
    }
    GROUP_TABLE {
        int group_id PK
        int creator_id FK
        string name
        text description
        string privacy
        datetime created_at
    }
    GROUP_MEMBER {
        int id PK
        int group_id FK
        int user_id FK
        string role
        datetime joined_at
    }
    MEDIA {
        int media_id PK
        int post_id FK
        string url
        string type
        int file_size
        datetime uploaded_at
    }

    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    USER ||--o{ LIKE : gives
    USER ||--o{ MESSAGE : sends
    USER ||--o{ GROUP_TABLE : creates
    USER ||--o{ FOLLOW : follows
    POST ||--o{ COMMENT : has
    POST ||--o{ LIKE : receives
    POST ||--o{ MEDIA : contains
    COMMENT ||--o{ COMMENT : "reply to"
    COMMENT ||--o{ LIKE : receives
    GROUP_TABLE ||--o{ GROUP_MEMBER : has
    USER ||--o{ GROUP_MEMBER : joins`,
  },
  {
    id: 'pop-data-3',
    title: 'Hospital Management System ER',
    author: 'HealthTechDev',
    description:
      'Hospital management database with patients, doctors, appointments, prescriptions, departments, rooms, and billing entities.',
    likes: 1850,
    views: 13100,
    tags: ['ER Diagram', 'Healthcare', 'Database'],
    createdAt: '2025-02-22',
    createdAtTimestamp: new Date('2025-02-22').getTime(),
    code: `erDiagram
    PATIENT {
        int patient_id PK
        string first_name
        string last_name
        date date_of_birth
        string gender
        string blood_type
        string phone
        string email
        string insurance_id
        datetime registered_at
    }
    DOCTOR {
        int doctor_id PK
        int department_id FK
        string first_name
        string last_name
        string specialization
        string license_number
        string phone
        string email
        decimal consultation_fee
    }
    DEPARTMENT {
        int department_id PK
        string name
        int head_doctor_id FK
        string floor
        string phone
    }
    APPOINTMENT {
        int appointment_id PK
        int patient_id FK
        int doctor_id FK
        datetime scheduled_at
        int duration_minutes
        string status
        text notes
    }
    PRESCRIPTION {
        int prescription_id PK
        int appointment_id FK
        int doctor_id FK
        int patient_id FK
        text diagnosis
        datetime prescribed_at
    }
    MEDICATION {
        int medication_id PK
        int prescription_id FK
        string name
        string dosage
        string frequency
        int duration_days
        text instructions
    }
    ROOM {
        int room_id PK
        int department_id FK
        string room_number
        string type
        int capacity
        string status
    }
    ADMISSION {
        int admission_id PK
        int patient_id FK
        int room_id FK
        int doctor_id FK
        datetime admitted_at
        datetime discharged_at
        text reason
    }
    BILLING {
        int billing_id PK
        int patient_id FK
        int admission_id FK
        decimal total_amount
        decimal insurance_covered
        decimal patient_due
        string status
        datetime issued_at
    }

    PATIENT ||--o{ APPOINTMENT : schedules
    PATIENT ||--o{ ADMISSION : admitted
    PATIENT ||--o{ BILLING : billed
    DOCTOR ||--o{ APPOINTMENT : conducts
    DOCTOR ||--o{ PRESCRIPTION : writes
    DEPARTMENT ||--o{ DOCTOR : employs
    DEPARTMENT ||--o{ ROOM : contains
    APPOINTMENT ||--o| PRESCRIPTION : results_in
    PRESCRIPTION ||--|{ MEDICATION : includes
    ROOM ||--o{ ADMISSION : hosts
    ADMISSION ||--o| BILLING : generates`,
  },
  {
    id: 'pop-data-4',
    title: 'Banking System ER Diagram',
    author: 'FinTechDBA',
    description:
      'Banking database with customers, accounts, transactions, loans, cards, branches, and audit trails for financial compliance.',
    likes: 2234,
    views: 15670,
    tags: ['ER Diagram', 'Banking', 'Finance'],
    createdAt: '2025-03-15',
    createdAtTimestamp: new Date('2025-03-15').getTime(),
    code: `erDiagram
    CUSTOMER {
        int customer_id PK
        string first_name
        string last_name
        string email
        string phone
        string kyc_status
        string risk_level
        datetime created_at
    }
    BRANCH {
        int branch_id PK
        string code
        string name
        string city
        string state
        boolean is_active
    }
    ACCOUNT {
        int account_id PK
        int customer_id FK
        int branch_id FK
        string account_number
        string type
        decimal balance
        string currency
        string status
        decimal interest_rate
    }
    CARD {
        int card_id PK
        int account_id FK
        string card_type
        string network
        date expiry_date
        string status
        decimal daily_limit
    }
    TRANSACTION {
        int transaction_id PK
        int from_account_id FK
        int to_account_id FK
        string type
        decimal amount
        string currency
        string status
        string reference
        datetime created_at
    }
    LOAN {
        int loan_id PK
        int customer_id FK
        int branch_id FK
        string loan_type
        decimal principal
        decimal interest_rate
        int tenure_months
        decimal outstanding
        string status
    }
    LOAN_PAYMENT {
        int payment_id PK
        int loan_id FK
        decimal amount
        decimal principal_portion
        decimal interest_portion
        date due_date
        date paid_date
        string status
    }
    BENEFICIARY {
        int beneficiary_id PK
        int customer_id FK
        string name
        string bank_name
        string account_number
        boolean is_verified
    }
    AUDIT_LOG {
        int log_id PK
        int customer_id FK
        string action_type
        string entity_type
        text details
        string ip_address
        datetime performed_at
    }

    CUSTOMER ||--o{ ACCOUNT : owns
    CUSTOMER ||--o{ LOAN : borrows
    CUSTOMER ||--o{ BENEFICIARY : maintains
    CUSTOMER ||--o{ AUDIT_LOG : tracked_by
    BRANCH ||--o{ ACCOUNT : hosts
    BRANCH ||--o{ LOAN : originates
    ACCOUNT ||--o{ CARD : linked_to
    ACCOUNT ||--o{ TRANSACTION : sends
    ACCOUNT ||--o{ TRANSACTION : receives
    LOAN ||--o{ LOAN_PAYMENT : repaid_via`,
  },
  {
    id: 'pop-data-5',
    title: 'Design Patterns: Observer',
    author: 'PatternMaster',
    description:
      'UML class diagram of the Observer pattern with event emitter, concrete observers, event filtering, and webhook dispatching.',
    likes: 1432,
    views: 9870,
    tags: ['Class Diagram', 'Design Patterns', 'Observer'],
    createdAt: '2025-04-01',
    createdAtTimestamp: new Date('2025-04-01').getTime(),
    code: `classDiagram
    class EventEmitter {
        <<interface>>
        +on(eventType, observer) void
        +off(eventType, observer) void
        +emit(event) void
    }
    class Observer {
        <<interface>>
        +update(event) void
        +getSubscribedEvents() List~string~
    }
    class Event {
        -type: string
        -payload: any
        -timestamp: DateTime
        -source: string
        +getType() string
        +getPayload() any
    }
    class EventBus {
        -observers: Map~string, List~Observer~~
        -eventLog: List~Event~
        -maxRetries: int
        +on(eventType, observer) void
        +off(eventType, observer) void
        +emit(event) void
        -notifyObservers(event) void
        -retryFailed(observer, event) void
    }
    class EmailNotifier {
        -smtpClient: SMTPClient
        -templates: Map~string, Template~
        +update(event) void
        +getSubscribedEvents() List~string~
    }
    class SlackNotifier {
        -webhookUrl: string
        -channel: string
        +update(event) void
        +getSubscribedEvents() List~string~
    }
    class LoggingObserver {
        -logger: Logger
        -logLevel: string
        +update(event) void
        +getSubscribedEvents() List~string~
    }
    class MetricsCollector {
        -metricsClient: PrometheusClient
        -counters: Map~string, Counter~
        +update(event) void
        +getSubscribedEvents() List~string~
    }

    EventEmitter <|.. EventBus
    Observer <|.. EmailNotifier
    Observer <|.. SlackNotifier
    Observer <|.. LoggingObserver
    Observer <|.. MetricsCollector
    EventBus *-- Event : stores
    EventBus o-- Observer : notifies`,
  },
  {
    id: 'pop-data-6',
    title: 'Design Patterns: Strategy',
    author: 'OOPGuru',
    description:
      'Strategy pattern for a payment processing system with multiple concrete strategies for credit cards, PayPal, crypto, and bank transfers.',
    likes: 1289,
    views: 8450,
    tags: ['Class Diagram', 'Design Patterns', 'Strategy'],
    createdAt: '2025-04-18',
    createdAtTimestamp: new Date('2025-04-18').getTime(),
    code: `classDiagram
    class PaymentContext {
        -strategy: PaymentStrategy
        -validator: PaymentValidator
        +setStrategy(strategy) void
        +processPayment(amount, details) PaymentResult
        +refund(transactionId) RefundResult
    }
    class PaymentStrategy {
        <<interface>>
        +pay(amount, details) PaymentResult
        +refund(transactionId, amount) RefundResult
        +validate(details) ValidationResult
        +getProviderName() string
    }
    class CreditCardStrategy {
        -gateway: PaymentGateway
        -merchantId: string
        +pay(amount, details) PaymentResult
        +refund(transactionId, amount) RefundResult
        +validate(details) ValidationResult
        -encryptCardNumber(number) string
    }
    class PayPalStrategy {
        -clientId: string
        -clientSecret: string
        +pay(amount, details) PaymentResult
        +refund(transactionId, amount) RefundResult
        +validate(details) ValidationResult
        -getAccessToken() string
    }
    class CryptoStrategy {
        -walletAddress: string
        -network: string
        +pay(amount, details) PaymentResult
        +refund(transactionId, amount) RefundResult
        +validate(details) ValidationResult
        -convertToFiat(amount, currency) decimal
    }
    class BankTransferStrategy {
        -routingNumber: string
        +pay(amount, details) PaymentResult
        +refund(transactionId, amount) RefundResult
        +validate(details) ValidationResult
    }
    class PaymentResult {
        -success: boolean
        -transactionId: string
        -amount: decimal
        -timestamp: DateTime
    }

    PaymentContext o-- PaymentStrategy : uses
    PaymentStrategy <|.. CreditCardStrategy
    PaymentStrategy <|.. PayPalStrategy
    PaymentStrategy <|.. CryptoStrategy
    PaymentStrategy <|.. BankTransferStrategy
    CreditCardStrategy ..> PaymentResult : returns
    PayPalStrategy ..> PaymentResult : returns
    CryptoStrategy ..> PaymentResult : returns
    BankTransferStrategy ..> PaymentResult : returns`,
  },
  {
    id: 'pop-data-7',
    title: 'MVC Framework Architecture',
    author: 'FrameworkDev',
    description:
      'UML class diagram of an MVC web framework with models, views, controllers, router, middleware pipeline, and request/response lifecycle.',
    likes: 2456,
    views: 16120,
    tags: ['Class Diagram', 'MVC', 'Architecture'],
    createdAt: '2025-05-05',
    createdAtTimestamp: new Date('2025-05-05').getTime(),
    code: `classDiagram
    class Application {
        -router: Router
        -middleware: List~Middleware~
        +bootstrap() void
        +handleRequest(request) Response
        +registerMiddleware(mw) void
    }
    class Router {
        -routes: Map~string, Route~
        +addRoute(method, path, handler) Route
        +match(request) RouteMatch
    }
    class Controller {
        <<abstract>>
        #request: Request
        #response: Response
        +beforeAction() void
        #render(template, data) Response
        #json(data) Response
    }
    class UserController {
        -userService: UserService
        +index() Response
        +show(id) Response
        +create() Response
        +update(id) Response
        +destroy(id) Response
    }
    class Model {
        <<abstract>>
        #table: string
        #primaryKey: string
        +find(id) Model
        +where(conditions) QueryBuilder
        +create(data) Model
        +save() boolean
        +delete() boolean
    }
    class UserModel {
        +posts() HasMany
        +profile() HasOne
        +hashPassword(pwd) string
    }
    class Middleware {
        <<interface>>
        +handle(request, next) Response
    }
    class AuthMiddleware {
        -authService: AuthService
        +handle(request, next) Response
    }
    class Request {
        -method: string
        -url: string
        -headers: Map
        -body: any
    }
    class Response {
        -statusCode: int
        -body: any
        +send(data) void
        +json(data) void
    }

    Application *-- Router : owns
    Application o-- Middleware : pipeline
    Controller <|-- UserController
    Model <|-- UserModel
    Middleware <|.. AuthMiddleware
    Controller ..> Model : queries
    Controller ..> Request : reads
    Controller ..> Response : writes
    Application ..> Controller : dispatches`,
  },
  {
    id: 'pop-data-8',
    title: 'Library Management System',
    author: 'SysDesigner42',
    description:
      'Object-oriented class diagram for a library system with books, members, loans, reservations, authors, and fine management.',
    likes: 1845,
    views: 13200,
    tags: ['Class Diagram', 'OOP', 'Library'],
    createdAt: '2025-05-22',
    createdAtTimestamp: new Date('2025-05-22').getTime(),
    code: `classDiagram
    class Library {
        -catalog: Catalog
        -members: List~Member~
        +registerMember(details) Member
        +addBook(book) void
        +searchCatalog(query) List~Book~
    }
    class Catalog {
        -books: Map~string, Book~
        +search(query) List~Book~
        +addEntry(book) void
        +getAvailableBooks() List~Book~
    }
    class Book {
        -isbn: string
        -title: string
        -copies: List~BookCopy~
        +getAvailableCopies() int
        +getAuthors() List~Author~
    }
    class BookCopy {
        -copyId: string
        -condition: string
        -status: string
        +isAvailable() boolean
    }
    class Author {
        -name: string
        -biography: string
        +getPublishedBooks() List~Book~
    }
    class Member {
        -memberId: string
        -name: string
        -activeLoans: List~Loan~
        -fines: List~Fine~
        +borrowBook(copy) Loan
        +returnBook(loan) void
        +canBorrow() boolean
    }
    class Loan {
        -borrowDate: Date
        -dueDate: Date
        -returnDate: Date
        -renewalCount: int
        +isOverdue() boolean
        +renew() boolean
        +calculateFine() decimal
    }
    class Reservation {
        -book: Book
        -member: Member
        -expiryDate: Date
        -queuePosition: int
        +cancel() void
        +fulfill(copy) Loan
    }
    class Fine {
        -amount: decimal
        -reason: string
        -status: string
        +pay(amount) Payment
        +waive(reason) void
    }

    Library *-- Catalog : maintains
    Library o-- Member : serves
    Catalog *-- Book : indexes
    Book *-- BookCopy : has
    Book "many" -- "many" Author : written_by
    Member *-- Loan : borrows
    Member *-- Reservation : holds
    Member *-- Fine : owes
    Loan o-- BookCopy : borrows`,
  },
  {
    id: 'pop-data-9',
    title: 'REST API Layered Architecture',
    author: 'BackendPro',
    description:
      'Layered REST API class diagram with controllers, services, repositories, DTOs, middleware, and dependency injection.',
    likes: 2678,
    views: 17890,
    tags: ['Class Diagram', 'REST API', 'Architecture'],
    createdAt: '2025-06-08',
    createdAtTimestamp: new Date('2025-06-08').getTime(),
    code: `classDiagram
    class BaseController {
        <<abstract>>
        #service: BaseService
        +handleRequest(req, res) void
        #sendSuccess(res, data) void
        #sendError(res, error) void
    }
    class UserController {
        -userService: UserService
        +getAll(req, res) void
        +getById(req, res) void
        +create(req, res) void
        +update(req, res) void
        +delete(req, res) void
    }
    class BaseService {
        <<abstract>>
        #repository: BaseRepository
        +findAll(filters) List~Entity~
        +findById(id) Entity
        +create(dto) Entity
        +update(id, dto) Entity
        +delete(id) boolean
    }
    class UserService {
        -userRepo: UserRepository
        -cache: CacheService
        +findByEmail(email) User
        +verifyCredentials(email, pwd) User
    }
    class BaseRepository {
        <<abstract>>
        #db: DatabaseConnection
        +findAll(query) List~Entity~
        +findById(id) Entity
        +create(data) Entity
        +update(id, data) Entity
        +delete(id) boolean
    }
    class UserRepository {
        +findByEmail(email) User
        +findActive() List~User~
    }
    class CreateUserDTO {
        +email: string
        +password: string
        +name: string
        +validate() ValidationResult
    }
    class AuthMiddleware {
        -jwtSecret: string
        +authenticate(req, res, next) void
        +authorize(roles) Function
    }
    class CacheService {
        -redis: RedisClient
        +get(key) any
        +set(key, value, ttl) void
        +invalidate(key) void
    }

    BaseController <|-- UserController
    BaseService <|-- UserService
    BaseRepository <|-- UserRepository
    UserController ..> UserService
    UserService ..> UserRepository
    UserService ..> CacheService
    UserController ..> CreateUserDTO
    UserController ..> AuthMiddleware`,
  },
  {
    id: 'pop-data-10',
    title: 'Design Patterns: Factory',
    author: 'CleanCoder',
    description:
      'Abstract Factory pattern for UI component creation with concrete factories for Material Design and iOS styles.',
    likes: 1380,
    views: 9500,
    tags: ['Class Diagram', 'Design Patterns', 'Factory'],
    createdAt: '2025-06-22',
    createdAtTimestamp: new Date('2025-06-22').getTime(),
    code: `classDiagram
    class UIFactory {
        <<interface>>
        +createButton(label) Button
        +createInput(placeholder) Input
        +createCard(title) Card
        +createModal(content) Modal
    }
    class MaterialFactory {
        +createButton(label) Button
        +createInput(placeholder) Input
        +createCard(title) Card
        +createModal(content) Modal
    }
    class IOSFactory {
        +createButton(label) Button
        +createInput(placeholder) Input
        +createCard(title) Card
        +createModal(content) Modal
    }
    class Button {
        <<interface>>
        +render() HTMLElement
        +onClick(handler) void
        +setDisabled(state) void
    }
    class MaterialButton {
        -rippleEffect: boolean
        -elevation: int
        +render() HTMLElement
        +onClick(handler) void
    }
    class IOSButton {
        -hapticFeedback: boolean
        -cornerRadius: int
        +render() HTMLElement
        +onClick(handler) void
    }
    class Input {
        <<interface>>
        +render() HTMLElement
        +getValue() string
        +validate() boolean
    }
    class MaterialInput {
        -floatingLabel: boolean
        +render() HTMLElement
        +getValue() string
    }
    class IOSInput {
        -clearButton: boolean
        +render() HTMLElement
        +getValue() string
    }
    class ThemeManager {
        -currentFactory: UIFactory
        +setTheme(theme) void
        +getFactory() UIFactory
    }

    UIFactory <|.. MaterialFactory
    UIFactory <|.. IOSFactory
    Button <|.. MaterialButton
    Button <|.. IOSButton
    Input <|.. MaterialInput
    Input <|.. IOSInput
    MaterialFactory ..> MaterialButton : creates
    MaterialFactory ..> MaterialInput : creates
    IOSFactory ..> IOSButton : creates
    IOSFactory ..> IOSInput : creates
    ThemeManager o-- UIFactory : uses`,
  },

  // ═══════════════════════════════════════════
  // ── Business, State, Journey, Gantt (10) ───
  // ═══════════════════════════════════════════
  {
    id: 'pop-biz-1',
    title: 'E-Commerce Order State Machine',
    author: 'PMPro',
    description:
      'Order lifecycle state machine with states for created, payment, processing, shipping, delivery, returns, and cancellation.',
    likes: 2340,
    views: 16800,
    tags: ['State Diagram', 'E-Commerce', 'Order Flow'],
    createdAt: '2025-01-28',
    createdAtTimestamp: new Date('2025-01-28').getTime(),
    code: `stateDiagram-v2
    [*] --> Created
    Created --> PendingPayment: Submit Order

    state PendingPayment {
        [*] --> AwaitingPayment
        AwaitingPayment --> PaymentProcessing: Payment Initiated
        PaymentProcessing --> PaymentConfirmed: Payment Success
        PaymentProcessing --> PaymentFailed: Payment Declined
        PaymentFailed --> AwaitingPayment: Retry
    }

    PendingPayment --> Cancelled: Cancel Order
    PendingPayment --> Confirmed: Payment Confirmed

    state Confirmed {
        [*] --> Processing
        Processing --> Picking: Items Located
        Picking --> Packed: All Items Packed
    }

    Confirmed --> Shipped: Hand to Carrier

    state Shipped {
        [*] --> InTransit
        InTransit --> OutForDelivery: Arrived Local Hub
        OutForDelivery --> Delivered: Delivery Confirmed
        OutForDelivery --> DeliveryFailed: No One Home
        DeliveryFailed --> InTransit: Reattempt
    }

    Shipped --> Delivered: Signature Collected
    Delivered --> ReturnRequested: Request Return

    state ReturnRequested {
        [*] --> ReturnApproved
        ReturnApproved --> ReturnShipped: Label Generated
        ReturnShipped --> ReturnReceived: Warehouse Scan
        ReturnReceived --> Refunded: Refund Processed
    }

    Cancelled --> [*]
    Delivered --> [*]
    Refunded --> [*]`,
  },
  {
    id: 'pop-biz-2',
    title: 'User Onboarding Journey',
    author: 'UXResearcher',
    description:
      'User journey map for SaaS onboarding showing signup, verification, profile setup, first task, and aha moment with satisfaction scores.',
    likes: 1760,
    views: 12500,
    tags: ['User Journey', 'Onboarding', 'UX'],
    createdAt: '2025-02-12',
    createdAtTimestamp: new Date('2025-02-12').getTime(),
    code: `journey
    title SaaS User Onboarding Journey
    section Discovery
      Visit landing page: 4: User
      Read features & pricing: 3: User
      Click Sign Up: 5: User
    section Registration
      Fill signup form: 3: User
      Verify email: 2: User
      Set password: 3: User
    section Setup
      Choose plan: 4: User
      Connect integrations: 2: User
      Import existing data: 2: User
      Customize workspace: 4: User
    section First Value
      Complete first task: 4: User
      See results dashboard: 5: User
      Invite team member: 3: User
    section Aha Moment
      Automate a workflow: 5: User
      Share report with team: 4: User
      Upgrade to paid plan: 5: User`,
  },
  {
    id: 'pop-biz-3',
    title: 'E-Commerce Checkout Journey',
    author: 'ConversionGuru',
    description:
      'Customer journey through e-commerce checkout from browsing to confirmation, highlighting friction points with satisfaction scores.',
    likes: 1540,
    views: 11000,
    tags: ['User Journey', 'E-Commerce', 'Checkout'],
    createdAt: '2025-03-01',
    createdAtTimestamp: new Date('2025-03-01').getTime(),
    code: `journey
    title E-Commerce Checkout Experience
    section Browsing
      Search for product: 4: Customer
      Browse category: 3: Customer
      Read reviews: 4: Customer
      Compare products: 3: Customer
    section Cart
      Add to cart: 5: Customer
      View cart summary: 4: Customer
      Apply coupon code: 2: Customer
      Update quantities: 3: Customer
    section Checkout
      Enter shipping address: 2: Customer
      Choose shipping method: 3: Customer
      Enter payment details: 2: Customer
      Review order summary: 4: Customer
    section Payment
      Process payment: 3: Customer
      3D Secure verification: 1: Customer
      Payment confirmed: 5: Customer
    section Post-Purchase
      View confirmation page: 5: Customer
      Receive email receipt: 4: Customer
      Track shipping: 4: Customer`,
  },
  {
    id: 'pop-biz-4',
    title: 'Sprint Planning Gantt Chart',
    author: 'AgileCoach',
    description:
      'Two-week sprint Gantt chart with planning, development tasks, testing, review, and deployment milestones.',
    likes: 1920,
    views: 13600,
    tags: ['Gantt', 'Agile', 'Sprint Planning'],
    createdAt: '2025-03-18',
    createdAtTimestamp: new Date('2025-03-18').getTime(),
    code: `gantt
    title Sprint 23 - User Authentication
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Planning
    Sprint Planning           :done, plan, 2025-03-03, 1d
    Backlog Refinement        :done, refine, 2025-03-03, 1d
    Task Breakdown            :done, breakdown, 2025-03-04, 1d

    section Backend Development
    Auth API endpoints        :crit, active, auth-api, 2025-03-04, 3d
    JWT token service         :crit, jwt, after auth-api, 2d
    Password hashing          :hash, 2025-03-05, 2d
    Rate limiting middleware  :rate, after jwt, 1d
    Session management        :session, after jwt, 2d

    section Frontend Development
    Login page UI             :login-ui, 2025-03-05, 2d
    Signup page UI            :signup-ui, 2025-03-05, 2d
    Auth state management     :auth-state, after login-ui, 2d
    Protected routes          :routes, after auth-state, 1d

    section Testing
    Unit tests                :unit, after session, 2d
    Integration tests         :integration, after unit, 2d
    E2E tests                 :e2e, after integration, 1d

    section Review & Deploy
    Code review               :review, after e2e, 1d
    Sprint review             :milestone, sprint-review, after review, 0d
    Deploy to staging         :staging, after review, 1d
    Deploy to production      :crit, prod, after staging, 1d
    Sprint retrospective      :retro, after prod, 1d`,
  },
  {
    id: 'pop-biz-5',
    title: 'Product Launch Timeline',
    author: 'ProductLead',
    description:
      'Six-month product launch timeline from research through post-launch with key milestones organized by quarters.',
    likes: 1680,
    views: 11900,
    tags: ['Timeline', 'Product Launch', 'Planning'],
    createdAt: '2025-04-05',
    createdAtTimestamp: new Date('2025-04-05').getTime(),
    code: `timeline
    title Product Launch Roadmap 2025
    section Q1 - Discovery
      January : Market Research
               : Competitor Analysis
               : User Interviews (50+)
      February : Feature Prioritization
                : Technical Feasibility Study
                : Design Sprint Week
      March : MVP Scope Definition
             : Architecture Design Review
             : Team Hiring (3 engineers)
    section Q2 - Build
      April : Core Backend Development
             : Database Schema Design
             : API Specification (OpenAPI)
      May : Frontend Development Sprint
           : Integration Testing Setup
           : CI/CD Pipeline Configuration
      June : Beta Version Complete
            : Security Audit
            : Performance Load Testing
    section Q3 - Launch
      July : Private Beta (100 users)
            : Feedback Collection
            : Bug Fix Sprint
      August : Public Beta Launch
              : Marketing Campaign Start
              : Press Kit Distribution
      September : Production Launch v1.0
                 : Launch Event
                 : Onboarding Optimization
    section Q4 - Growth
      October : Analytics Dashboard
              : A/B Testing Framework
              : Feature Requests Triage
      November : v1.1 Feature Release
                : Partnership Integrations
                : Customer Success Program
      December : Year-End Retrospective
                : 2026 Roadmap Planning
                : Team Expansion Plan`,
  },
  {
    id: 'pop-biz-6',
    title: 'Incident Response Flowchart',
    author: 'SREManager',
    description:
      'Incident response process from detection through post-mortem with severity classification, escalation paths, and communication protocols.',
    likes: 2080,
    views: 14700,
    tags: ['Flowchart', 'Incident Response', 'SRE'],
    createdAt: '2025-04-22',
    createdAtTimestamp: new Date('2025-04-22').getTime(),
    code: `flowchart TB
    Alert[Alert Triggered] --> Detect{Automated<br/>or Manual?}
    Detect -->|Automated| PagerDuty[PagerDuty Alert]
    Detect -->|Manual| Report[Incident Report Filed]

    PagerDuty --> OnCall[On-Call Engineer Paged]
    Report --> OnCall

    OnCall --> Assess{Severity?}

    subgraph Triage["Triage & Classification"]
        Assess -->|SEV1 - Critical| Sev1[War Room Opened<br/>All Hands]
        Assess -->|SEV2 - Major| Sev2[Team Lead<br/>Notified]
        Assess -->|SEV3 - Minor| Sev3[Standard<br/>Queue]
    end

    subgraph Investigation["Investigation"]
        Sev1 & Sev2 --> Investigate[Investigate Root Cause]
        Investigate --> Logs[Check Logs & Metrics]
        Investigate --> Rollback{Recent<br/>Deploy?}
        Rollback -->|Yes| DoRollback[Initiate Rollback]
        Rollback -->|No| DeepDive[Deep Investigation]
    end

    subgraph Mitigation["Mitigation"]
        DoRollback --> Verify{Service<br/>Restored?}
        DeepDive --> Fix[Apply Fix]
        Fix --> Verify
        Verify -->|No| Escalate[Escalate to Senior]
        Escalate --> DeepDive
        Verify -->|Yes| Resolved[Incident Resolved]
    end

    Sev3 --> Investigate

    subgraph PostMortem["Post-Mortem"]
        Resolved --> Timeline[Build Timeline]
        Timeline --> RCA[Root Cause Analysis]
        RCA --> Actions[Action Items]
        Actions --> Review[Publish & Review]
    end

    style Triage fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Investigation fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Mitigation fill:#052e16,stroke:#22c55e,color:#dcfce7
    style PostMortem fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe
    style Sev1 fill:#7f1d1d,stroke:#f87171,color:#fff
    style Sev2 fill:#92400e,stroke:#fbbf24,color:#fff`,
  },
  {
    id: 'pop-biz-7',
    title: 'Hiring Pipeline Flowchart',
    author: 'HRTech',
    description:
      'Engineering hiring pipeline from job posting through onboarding with screening, interviews, offer, and rejection paths.',
    likes: 1420,
    views: 10100,
    tags: ['Flowchart', 'Hiring', 'HR Process'],
    createdAt: '2025-05-10',
    createdAtTimestamp: new Date('2025-05-10').getTime(),
    code: `flowchart LR
    subgraph Sourcing["Sourcing"]
        Post[Job Posting]
        Referral[Employee Referral]
        Recruiter[Recruiter Outreach]
    end

    subgraph Screening["Screening"]
        Resume[Resume Review]
        Phone[Phone Screen<br/>30 min]
    end

    subgraph Technical["Technical Assessment"]
        TakeHome[Take-Home Challenge<br/>4 hours]
        CodeReview[Code Review]
    end

    subgraph Onsite["Onsite Interviews"]
        SystemDesign[System Design<br/>60 min]
        Coding[Live Coding<br/>45 min]
        BehavioralInt[Behavioral<br/>45 min]
        TeamFit[Team Fit Chat<br/>30 min]
    end

    subgraph Decision["Decision"]
        Debrief[Hiring Debrief]
        Decide{Hire?}
        Offer[Offer Letter]
        Negotiate[Negotiation]
        Reject2[Rejection Email]
    end

    subgraph Onboard["Onboarding"]
        Accept[Offer Accepted]
        Equipment[Setup Equipment]
        Buddy[Assign Buddy]
        FirstWeek[First Week Plan]
    end

    Post & Referral & Recruiter --> Resume
    Resume -->|Pass| Phone
    Resume -->|Fail| Reject1[Rejection Email]
    Phone -->|Pass| TakeHome
    Phone -->|Fail| Reject1
    TakeHome --> CodeReview -->|Pass| SystemDesign & Coding & BehavioralInt & TeamFit
    CodeReview -->|Fail| Reject1

    SystemDesign & Coding & BehavioralInt & TeamFit --> Debrief --> Decide
    Decide -->|Yes| Offer --> Negotiate --> Accept
    Decide -->|No| Reject2
    Accept --> Equipment & Buddy & FirstWeek

    style Sourcing fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Screening fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Technical fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Onsite fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Decision fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Onboard fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },
  {
    id: 'pop-biz-8',
    title: 'Bug Lifecycle State Machine',
    author: 'QALead',
    description:
      'Software bug lifecycle with states for new, triaged, in-progress, in-review, QA, resolved, closed, and reopened.',
    likes: 1650,
    views: 11700,
    tags: ['State Diagram', 'Bug Tracking', 'QA'],
    createdAt: '2025-05-25',
    createdAtTimestamp: new Date('2025-05-25').getTime(),
    code: `stateDiagram-v2
    [*] --> New: Bug Reported

    state New {
        [*] --> Unconfirmed
        Unconfirmed --> Confirmed: Reproduced
        Unconfirmed --> Duplicate: Already Exists
    }

    New --> Triaged: Priority Assigned

    state Triaged {
        [*] --> Backlog
        Backlog --> Scheduled: Sprint Assigned
    }

    Triaged --> InProgress: Developer Picks Up

    state InProgress {
        [*] --> Investigating
        Investigating --> Coding: Root Cause Found
        Coding --> Testing: Fix Applied
    }

    InProgress --> InReview: PR Created

    state InReview {
        [*] --> CodeReview
        CodeReview --> Approved: LGTM
        CodeReview --> ChangesRequested: Needs Changes
        ChangesRequested --> CodeReview: Updated
    }

    InReview --> QA: Merged to Staging

    state QA {
        [*] --> QATesting
        QATesting --> QAPassed: All Tests Pass
        QATesting --> QAFailed: Regression Found
    }

    QA --> Resolved: Verified Fixed
    QA --> InProgress: Reopen - Fix Failed
    Resolved --> Closed: Deployed to Production
    Closed --> Reopened: Bug Reappears
    Reopened --> Triaged: Re-prioritize
    Duplicate --> [*]`,
  },
  {
    id: 'pop-biz-9',
    title: 'SDLC Timeline',
    author: 'TechLead',
    description:
      'Software development lifecycle timeline from requirements through maintenance with key deliverables at each phase.',
    likes: 1380,
    views: 9800,
    tags: ['Timeline', 'SDLC', 'Software Engineering'],
    createdAt: '2025-06-12',
    createdAtTimestamp: new Date('2025-06-12').getTime(),
    code: `timeline
    title Software Development Lifecycle
    section Requirements Phase
      Week 1 : Stakeholder Interviews
              : Requirements Gathering
      Week 2 : User Story Mapping
              : Acceptance Criteria Definition
              : Requirements Sign-off
    section Design Phase
      Week 3 : System Architecture Design
              : Database Schema Design
              : API Contract Definition
      Week 4 : UI/UX Wireframes
              : Technical Design Review
              : Security Threat Modeling
    section Implementation Phase
      Week 5-6 : Core Backend Development
                : Database Implementation
                : Authentication System
      Week 7-8 : Frontend Development
                : API Integration
                : Real-time Features
      Week 9 : Third-party Integrations
              : Performance Optimization
              : Code Documentation
    section Testing Phase
      Week 10 : Unit Test Coverage
               : Integration Testing
               : Security Penetration Test
      Week 11 : UAT with Stakeholders
               : Performance Load Testing
               : Bug Fix Sprint
    section Deployment Phase
      Week 12 : Staging Environment Deploy
               : Final QA Sign-off
               : Production Deployment
               : Monitoring Setup
    section Maintenance Phase
      Ongoing : Bug Fixes and Patches
              : Performance Monitoring
              : Feature Enhancements
              : Quarterly Security Audits`,
  },
  {
    id: 'pop-biz-10',
    title: 'Customer Support Ticket Flow',
    author: 'SupportOps',
    description:
      'Customer support ticket state machine with escalation tiers, SLA tracking, auto-assignment, and resolution workflows.',
    likes: 1520,
    views: 10800,
    tags: ['State Diagram', 'Customer Support', 'Workflow'],
    createdAt: '2025-06-28',
    createdAtTimestamp: new Date('2025-06-28').getTime(),
    code: `stateDiagram-v2
    [*] --> Open: Ticket Created

    state Open {
        [*] --> AutoAssign
        AutoAssign --> Assigned: Agent Found
        AutoAssign --> Unassigned: No Agent Available
    }

    Open --> InProgress: Agent Starts Work

    state InProgress {
        [*] --> Investigating
        Investigating --> WaitingOnInfo: Need More Details
        WaitingOnInfo --> Investigating: Info Received
        Investigating --> SolutionFound: Fix Identified
    }

    InProgress --> WaitingOnCustomer: Awaiting Reply

    state WaitingOnCustomer {
        [*] --> Waiting
        Waiting --> Reminded: 48h Auto-Reminder
        Reminded --> AutoClosed: 7d No Response
    }

    WaitingOnCustomer --> InProgress: Customer Replied

    InProgress --> Escalated: Complex Issue

    state Escalated {
        [*] --> Tier2
        Tier2 --> Tier3: Engineering Required
        Tier3 --> BugFiled: Bug Confirmed
    }

    Escalated --> Resolved: Fix Deployed
    InProgress --> Resolved: Solution Applied

    state Resolved {
        [*] --> AwaitingConfirmation
        AwaitingConfirmation --> Confirmed: Customer Confirms
    }

    Resolved --> Closed: Satisfaction Survey Sent
    WaitingOnCustomer --> Closed: Auto-Closed
    Closed --> Reopened: Customer Follow-up
    Reopened --> InProgress: Re-investigate`,
  },

  // ═══════════════════════════════════════════
  // ── Data Viz, Mindmap, Git, ML (12) ────────
  // ═══════════════════════════════════════════
  {
    id: 'pop-misc-1',
    title: 'Cloud Market Share',
    author: 'DataVizPro',
    description:
      'Cloud infrastructure market share breakdown showing AWS, Azure, GCP, and other providers with realistic 2025 percentages.',
    likes: 1860,
    views: 13200,
    tags: ['Pie Chart', 'Cloud', 'Market Share'],
    createdAt: '2025-01-25',
    createdAtTimestamp: new Date('2025-01-25').getTime(),
    code: `pie title Cloud Infrastructure Market Share 2025
    "AWS" : 31
    "Microsoft Azure" : 25
    "Google Cloud" : 11
    "Alibaba Cloud" : 5
    "Oracle Cloud" : 3
    "IBM Cloud" : 2
    "Other Providers" : 23`,
  },
  {
    id: 'pop-misc-2',
    title: 'Programming Language Popularity',
    author: 'DevSurvey',
    description:
      'Developer survey results showing programming language usage distribution for 2025.',
    likes: 2450,
    views: 18500,
    tags: ['Pie Chart', 'Programming', 'Survey'],
    createdAt: '2025-02-08',
    createdAtTimestamp: new Date('2025-02-08').getTime(),
    code: `pie title Programming Language Usage 2025
    "Python" : 28
    "JavaScript" : 22
    "TypeScript" : 14
    "Java" : 10
    "C#" : 7
    "Go" : 5
    "Rust" : 4
    "C/C++" : 5
    "Other" : 5`,
  },
  {
    id: 'pop-misc-3',
    title: 'Technology Radar',
    author: 'TechRadar',
    description:
      'Technology radar quadrant chart plotting technologies by adoption readiness and business value.',
    likes: 1980,
    views: 14100,
    tags: ['Quadrant Chart', 'Technology', 'Strategy'],
    createdAt: '2025-02-25',
    createdAtTimestamp: new Date('2025-02-25').getTime(),
    code: `quadrantChart
    title Technology Radar 2025
    x-axis Low Maturity --> High Maturity
    y-axis Low Impact --> High Impact
    quadrant-1 Adopt
    quadrant-2 Trial
    quadrant-3 Assess
    quadrant-4 Hold
    Kubernetes: [0.9, 0.95]
    React: [0.85, 0.85]
    TypeScript: [0.88, 0.9]
    Rust: [0.55, 0.7]
    WebAssembly: [0.45, 0.65]
    Deno: [0.4, 0.45]
    htmx: [0.5, 0.55]
    Svelte: [0.6, 0.65]
    Bun: [0.45, 0.5]
    Terraform: [0.82, 0.88]
    GraphQL: [0.75, 0.7]
    tRPC: [0.5, 0.6]`,
  },
  {
    id: 'pop-misc-4',
    title: 'Task Priority Matrix',
    author: 'ProductMgr',
    description:
      'Eisenhower matrix quadrant chart for task prioritization plotting urgency against importance.',
    likes: 1540,
    views: 10900,
    tags: ['Quadrant Chart', 'Prioritization', 'Productivity'],
    createdAt: '2025-03-12',
    createdAtTimestamp: new Date('2025-03-12').getTime(),
    code: `quadrantChart
    title Task Priority Matrix (Eisenhower)
    x-axis Not Urgent --> Urgent
    y-axis Not Important --> Important
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Eliminate
    Production bug fix: [0.95, 0.9]
    Security patch: [0.9, 0.95]
    Client demo prep: [0.85, 0.75]
    Architecture review: [0.3, 0.85]
    Code refactoring: [0.25, 0.7]
    Tech debt backlog: [0.2, 0.65]
    Update documentation: [0.35, 0.55]
    Email newsletters: [0.7, 0.2]
    Meeting scheduling: [0.8, 0.15]
    Social media updates: [0.6, 0.1]
    Format bikeshedding: [0.4, 0.15]
    Unnecessary reports: [0.75, 0.25]`,
  },
  {
    id: 'pop-misc-5',
    title: 'Web Development Mindmap',
    author: 'FullStackDev',
    description:
      'Comprehensive web development mindmap covering frontend, backend, DevOps, and testing with sub-topics.',
    likes: 2780,
    views: 19500,
    tags: ['Mindmap', 'Web Development', 'Learning'],
    createdAt: '2025-03-30',
    createdAtTimestamp: new Date('2025-03-30').getTime(),
    code: `mindmap
  root((Web Development))
    Frontend
      HTML/CSS
        Semantic HTML5
        CSS Grid & Flexbox
        Tailwind CSS
        CSS Modules
      JavaScript
        ES2024+ Features
        TypeScript
        DOM Manipulation
      Frameworks
        React + Next.js
        Vue + Nuxt
        Svelte + SvelteKit
        Angular
      Build Tools
        Vite
        Webpack
        esbuild
    Backend
      Languages
        Node.js
        Python
        Go
        Rust
      Frameworks
        Express / Fastify
        Django / FastAPI
        Gin / Fiber
      Databases
        PostgreSQL
        MongoDB
        Redis
        SQLite
      APIs
        REST
        GraphQL
        gRPC
        WebSockets
    DevOps
      CI/CD
        GitHub Actions
        GitLab CI
        Jenkins
      Containers
        Docker
        Kubernetes
        Helm
      Cloud
        AWS
        GCP
        Azure
      IaC
        Terraform
        Pulumi
    Testing
      Unit Testing
        Jest / Vitest
        pytest
      Integration
        Supertest
        Testcontainers
      E2E
        Playwright
        Cypress`,
  },
  {
    id: 'pop-misc-6',
    title: 'Startup Planning Mindmap',
    author: 'StartupFounder',
    description:
      'Startup planning mindmap covering product, engineering, marketing, operations, and finance with actionable sub-topics.',
    likes: 1650,
    views: 11700,
    tags: ['Mindmap', 'Startup', 'Planning'],
    createdAt: '2025-04-16',
    createdAtTimestamp: new Date('2025-04-16').getTime(),
    code: `mindmap
  root((Startup Plan))
    Product
      Problem Validation
        Customer Interviews
        Market Research
        Competitor Analysis
      MVP Features
        Core User Stories
        Feature Prioritization
        Launch Criteria
      Design
        User Personas
        Wireframes
        Prototype Testing
    Engineering
      Architecture
        Tech Stack Selection
        Scalability Plan
        Security Baseline
      Development
        Sprint Planning
        Code Reviews
        CI/CD Pipeline
      Quality
        Testing Strategy
        Monitoring Setup
        SLA Definition
    Marketing
      Brand
        Logo & Identity
        Messaging
        Website
      Acquisition
        SEO Strategy
        Content Marketing
        Social Media
      Growth
        Analytics Setup
        A/B Testing
        Referral Program
    Operations
      Team
        Hiring Plan
        Culture Values
        Remote Policy
      Legal
        Incorporation
        IP Protection
        Privacy Policy
      Finance
        Runway Calculation
        Revenue Model
        Fundraising Strategy`,
  },
  {
    id: 'pop-misc-7',
    title: 'GitFlow Workflow',
    author: 'GitPro',
    description:
      'GitFlow branching strategy with main, develop, feature, release, and hotfix branches showing merge patterns.',
    likes: 2340,
    views: 16800,
    tags: ['Git Graph', 'GitFlow', 'Branching'],
    createdAt: '2025-05-03',
    createdAtTimestamp: new Date('2025-05-03').getTime(),
    code: `gitGraph
    commit id: "Initial commit"
    commit id: "Project setup"
    branch develop
    checkout develop
    commit id: "Dev environment"
    branch feature/auth
    checkout feature/auth
    commit id: "Login page"
    commit id: "JWT tokens"
    commit id: "OAuth2 Google"
    checkout develop
    merge feature/auth id: "Merge auth"
    branch feature/dashboard
    checkout feature/dashboard
    commit id: "Dashboard layout"
    commit id: "Charts component"
    checkout develop
    merge feature/dashboard id: "Merge dashboard"
    branch release/1.0
    checkout release/1.0
    commit id: "Version bump 1.0"
    commit id: "Fix release bugs"
    checkout main
    merge release/1.0 id: "Release v1.0" tag: "v1.0.0"
    checkout develop
    merge release/1.0 id: "Back-merge release"
    branch feature/api
    checkout feature/api
    commit id: "REST endpoints"
    commit id: "Rate limiting"
    checkout main
    branch hotfix/security
    checkout hotfix/security
    commit id: "Patch XSS vuln"
    checkout main
    merge hotfix/security id: "Hotfix v1.0.1" tag: "v1.0.1"
    checkout develop
    merge hotfix/security id: "Back-merge hotfix"
    merge feature/api id: "Merge API"`,
  },
  {
    id: 'pop-misc-8',
    title: 'Trunk-Based Development',
    author: 'TBDAdvocate',
    description:
      'Trunk-based development workflow with short-lived feature branches, feature flags, and continuous deployment.',
    likes: 1580,
    views: 11200,
    tags: ['Git Graph', 'Trunk-Based', 'CI/CD'],
    createdAt: '2025-05-20',
    createdAtTimestamp: new Date('2025-05-20').getTime(),
    code: `gitGraph
    commit id: "Init"
    commit id: "CI/CD setup"
    commit id: "Base architecture"
    branch feat/login
    checkout feat/login
    commit id: "Login form"
    checkout main
    merge feat/login id: "PR #1 merged"
    commit id: "Feature flag: dark-mode" tag: "v0.1.0"
    branch feat/search
    checkout feat/search
    commit id: "Search API"
    commit id: "Search UI"
    checkout main
    merge feat/search id: "PR #2 merged"
    commit id: "Perf optimization"
    branch feat/notifications
    checkout feat/notifications
    commit id: "Push notifications"
    checkout main
    merge feat/notifications id: "PR #3 merged" tag: "v0.2.0"
    commit id: "Enable dark-mode flag"
    commit id: "Analytics integration"
    branch feat/export
    checkout feat/export
    commit id: "CSV export"
    checkout main
    merge feat/export id: "PR #4 merged"
    commit id: "Security hardening" tag: "v0.3.0"`,
  },
  {
    id: 'pop-misc-9',
    title: 'ML Training Pipeline',
    author: 'MLEngineer',
    description:
      'End-to-end ML training pipeline with data ingestion, preprocessing, feature engineering, training, evaluation, and deployment.',
    likes: 2120,
    views: 15000,
    tags: ['Flowchart', 'ML Pipeline', 'MLOps'],
    createdAt: '2025-06-06',
    createdAtTimestamp: new Date('2025-06-06').getTime(),
    code: `flowchart LR
    subgraph Ingest["Data Ingestion"]
        S3Raw[(S3 Raw Data)]
        APIs[External APIs]
        Streams[Event Streams]
        Validator[Schema Validator]
    end

    subgraph Prep["Data Preprocessing"]
        Clean[Data Cleaning]
        Dedupe[Deduplication]
        Impute[Missing Value Imputation]
        Normalize[Normalization]
    end

    subgraph Features["Feature Engineering"]
        FeatureStore[(Feature Store)]
        Transform[Transformations]
        Encoding[Categorical Encoding]
        Selection[Feature Selection]
    end

    subgraph Train["Model Training"]
        Split[Train/Val/Test Split]
        HPTuning[Hyperparameter Tuning]
        Training[Model Training]
        Ensemble[Ensemble Methods]
    end

    subgraph Eval["Evaluation"]
        Metrics[Metrics Computation]
        Validation[Cross-Validation]
        BiasCheck[Bias & Fairness Check]
        Comparison[Model Comparison]
    end

    subgraph Deploy["Deployment"]
        Registry[Model Registry]
        Serve[Model Serving API]
        AB[A/B Testing]
        Monitor[Performance Monitor]
        Retrain[Retrain Trigger]
    end

    S3Raw & APIs & Streams --> Validator
    Validator --> Clean --> Dedupe --> Impute --> Normalize
    Normalize --> Transform --> Encoding --> Selection
    Selection --> FeatureStore
    FeatureStore --> Split --> HPTuning --> Training --> Ensemble
    Ensemble --> Metrics --> Validation --> BiasCheck --> Comparison
    Comparison -->|approved| Registry --> Serve --> AB
    AB --> Monitor
    Monitor -->|drift detected| Retrain --> Ingest

    style Ingest fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Prep fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Features fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Train fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Eval fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Deploy fill:#7f1d1d,stroke:#f87171,color:#fecaca`,
  },
  {
    id: 'pop-misc-10',
    title: 'ETL Data Pipeline',
    author: 'DataEngineer',
    description:
      'ETL data pipeline with multiple data sources, extraction, transformation, loading into warehouse, and BI consumption.',
    likes: 1780,
    views: 12600,
    tags: ['Flowchart', 'ETL', 'Data Engineering'],
    createdAt: '2025-06-20',
    createdAtTimestamp: new Date('2025-06-20').getTime(),
    code: `flowchart LR
    subgraph Sources["Data Sources"]
        MySQL[(MySQL OLTP)]
        Postgres[(PostgreSQL)]
        MongoSrc[(MongoDB)]
        REST[REST APIs]
        CSV[CSV/Excel Files]
    end

    subgraph Extract["Extraction"]
        CDC[Change Data Capture]
        FullLoad[Full Load]
        APIExtract[API Connector]
        FileIngest[File Ingestion]
    end

    subgraph Transform["Transformation"]
        Staging[(Staging Area)]
        Clean[Data Cleaning]
        Enrich[Data Enrichment]
        Aggregate[Aggregations]
        SCD[Slowly Changing<br/>Dimensions]
    end

    subgraph Load["Loading"]
        Warehouse[(Data Warehouse<br/>Snowflake)]
        FactTables[Fact Tables]
        DimTables[Dimension Tables]
        Materialized[Materialized Views]
    end

    subgraph Consume["Consumption"]
        Looker[Looker BI]
        Tableau[Tableau]
        Jupyter[Jupyter Notebooks]
        dbt[dbt Models]
    end

    subgraph Orchestrate["Orchestration"]
        Airflow[Apache Airflow]
        Quality[Data Quality Checks]
        Alerts[Failure Alerts]
    end

    MySQL & Postgres --> CDC
    MongoSrc --> FullLoad
    REST --> APIExtract
    CSV --> FileIngest

    CDC & FullLoad & APIExtract & FileIngest --> Staging
    Staging --> Clean --> Enrich --> Aggregate --> SCD
    SCD --> FactTables & DimTables
    FactTables & DimTables --> Warehouse
    Warehouse --> Materialized
    Materialized --> Looker & Tableau & Jupyter
    dbt --> Warehouse

    Airflow -->|schedule| Extract & Transform & Load
    Quality -->|validate| Transform
    Quality -->|alert| Alerts

    style Sources fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
    style Extract fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    style Transform fill:#4c1d95,stroke:#a78bfa,color:#ede9fe
    style Load fill:#052e16,stroke:#22c55e,color:#dcfce7
    style Consume fill:#713f12,stroke:#fbbf24,color:#fef3c7
    style Orchestrate fill:#3b0764,stroke:#c084fc,color:#f3e8ff`,
  },
  {
    id: 'pop-misc-11',
    title: 'REST API Request Lifecycle',
    author: 'APIDev',
    description:
      'Complete REST API request lifecycle sequence diagram showing client, CDN, load balancer, API server, cache, and database interactions.',
    likes: 1950,
    views: 13800,
    tags: ['Sequence Diagram', 'REST API', 'Backend'],
    createdAt: '2025-07-02',
    createdAtTimestamp: new Date('2025-07-02').getTime(),
    code: `sequenceDiagram
    participant Client
    participant CDN
    participant LB as Load Balancer
    participant API as API Server
    participant Auth as Auth Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL

    Client->>CDN: GET /api/products?page=1
    alt CDN Cache Hit
        CDN-->>Client: 200 OK (cached)
    else CDN Cache Miss
        CDN->>LB: Forward request
        LB->>API: Route to healthy instance

        API->>Auth: Validate JWT token
        Auth-->>API: Token valid, user: 123

        API->>Cache: GET products:page:1
        alt Cache Hit
            Cache-->>API: Return cached data
        else Cache Miss
            API->>DB: SELECT * FROM products LIMIT 20
            DB-->>API: 20 rows
            API->>Cache: SET products:page:1 (TTL 300s)
        end

        API-->>LB: 200 OK + JSON
        LB-->>CDN: Response
        Note over CDN: Cache with Cache-Control headers
        CDN-->>Client: 200 OK + JSON
    end`,
  },
  {
    id: 'pop-misc-12',
    title: 'WebSocket Real-time Communication',
    author: 'RealtimeDev',
    description:
      'WebSocket lifecycle sequence diagram showing handshake, bidirectional messaging, heartbeat, and graceful reconnection.',
    likes: 1420,
    views: 10100,
    tags: ['Sequence Diagram', 'WebSocket', 'Real-time'],
    createdAt: '2025-07-15',
    createdAtTimestamp: new Date('2025-07-15').getTime(),
    code: `sequenceDiagram
    participant Client
    participant Server
    participant PubSub as Redis Pub/Sub
    participant DB as Database

    Client->>Server: HTTP GET /ws (Upgrade: websocket)
    Server->>Server: Validate auth token
    Server-->>Client: 101 Switching Protocols

    Note over Client, Server: WebSocket Connection Established

    par Client sends message
        Client->>Server: {"type": "subscribe", "channel": "chat:room-1"}
        Server->>PubSub: SUBSCRIBE chat:room-1
        Server-->>Client: {"type": "subscribed", "channel": "chat:room-1"}
    and Server pushes updates
        PubSub->>Server: New message in chat:room-1
        Server-->>Client: {"type": "message", "data": {...}}
    end

    Client->>Server: {"type": "message", "text": "Hello!"}
    Server->>DB: INSERT INTO messages
    Server->>PubSub: PUBLISH chat:room-1
    PubSub->>Server: Broadcast to subscribers
    Server-->>Client: {"type": "ack", "id": "msg-123"}

    loop Heartbeat every 30s
        Server-->>Client: PING
        Client->>Server: PONG
    end

    alt Connection Lost
        Note over Client: Network interruption
        Client->>Client: Wait 1s, 2s, 4s (exponential backoff)
        Client->>Server: Reconnect with last_event_id
        Server-->>Client: Replay missed events
    end

    Client->>Server: Close frame (1000: Normal)
    Server->>PubSub: UNSUBSCRIBE chat:room-1
    Server-->>Client: Close frame (1000: Normal)`,
  },
];
