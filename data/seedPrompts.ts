import type { PromptEntry } from '../types.js';
import { POPULAR_SEED_PROMPTS } from './popularSeedPrompts.js';
import { TEMPLATES, ML_TEMPLATES, C4_TEMPLATES } from './templates.js';

export const SEED_PROMPTS: PromptEntry[] = [
  // ───── General (4) ─────
  {
    id: 'seed-prompt-general-1',
    title: 'Microservices Architecture',
    author: 'ArchiGram',
    description:
      'Generate a comprehensive microservices architecture with API gateway, service mesh, and observability.',
    prompt_text:
      'Design a production-grade microservices architecture for an e-commerce platform. Include an API gateway with rate limiting, 5 core services (user, product, order, payment, notification), an event bus for async communication, and an observability stack with distributed tracing.',
    domain: 'general',
    tags: ['Microservices', 'API Gateway', 'System Design'],
    result_diagram_code: `graph TB
    Mobile((Mobile App))
    Web((Web App))

    subgraph Gateway["API Gateway"]
        Auth[Auth Middleware]
        RateLimit[Rate Limiter]
        Router[Request Router]
    end

    subgraph Services["Microservices"]
        UserSvc[User Service]
        ProductSvc[Product Service]
        OrderSvc[Order Service]
        PaymentSvc[Payment Service]
        NotifSvc[Notification Service]
    end

    subgraph EventBus["Event Bus (Kafka)"]
        OrderEvents[order-events]
        PaymentEvents[payment-events]
    end

    subgraph Observability["Observability"]
        Jaeger[Jaeger Tracing]
        Prometheus[Prometheus]
        Grafana[Grafana]
    end

    Mobile --> Auth
    Web --> Auth
    Auth --> RateLimit
    RateLimit --> Router
    Router --> UserSvc
    Router --> ProductSvc
    Router --> OrderSvc
    OrderSvc --> OrderEvents
    OrderEvents --> PaymentSvc
    PaymentSvc --> PaymentEvents
    PaymentEvents --> NotifSvc
    OrderSvc --> Jaeger
    Prometheus --> Grafana

    style Gateway fill:#1e293b,stroke:#3b82f6,color:#fff
    style Services fill:#1a1a2e,stroke:#6366f1,color:#fff
    style Observability fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1840,
    views: 12500,
    created_at: '2025-07-28T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-general-2',
    title: 'Event-Driven System',
    author: 'ArchiGram',
    description:
      'Design an event-driven architecture with producers, consumers, and dead letter queues.',
    prompt_text:
      'Create an event-driven architecture for a food delivery platform. Show order placement triggering events consumed by restaurant, delivery, payment, and notification services. Include a schema registry, dead letter queue for failed events, and an event archive for replay.',
    domain: 'general',
    tags: ['Event-Driven', 'Kafka', 'Async'],
    result_diagram_code: `graph LR
    subgraph Producers["Event Producers"]
        OrderSvc[Order Service]
        RestSvc[Restaurant Service]
        DeliverySvc[Delivery Service]
    end

    subgraph Bus["Event Bus (Kafka)"]
        OrderTopic[order-events]
        RestTopic[restaurant-events]
        DeliveryTopic[delivery-events]
        SR[Schema Registry]
    end

    subgraph Consumers["Event Consumers"]
        PaymentSvc[Payment Service]
        NotifSvc[Notification Service]
        AnalyticsSvc[Analytics Service]
    end

    subgraph Resilience["Resilience"]
        DLQ[(Dead Letter Queue)]
        Archive[(Event Archive)]
    end

    OrderSvc -->|publish| OrderTopic
    RestSvc -->|publish| RestTopic
    DeliverySvc -->|publish| DeliveryTopic
    OrderTopic -->|subscribe| PaymentSvc
    OrderTopic -->|subscribe| NotifSvc
    RestTopic -->|subscribe| DeliverySvc
    DeliveryTopic -->|subscribe| NotifSvc
    OrderTopic -->|subscribe| AnalyticsSvc
    PaymentSvc -.->|failed| DLQ
    OrderTopic -.->|retain| Archive

    style Bus fill:#3b1f6e,stroke:#8b5cf6,color:#fff
    style Producers fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Consumers fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1320,
    views: 8900,
    created_at: '2025-07-12T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-general-3',
    title: 'CI/CD Pipeline',
    author: 'ArchiGram',
    description: 'End-to-end CI/CD pipeline with progressive deployment and auto-rollback.',
    prompt_text:
      'Design a CI/CD pipeline for a containerized application. Include linting, unit tests, security scanning (SAST), Docker build, push to registry, then deploy to staging, run integration tests, manual approval gate, canary deployment at 10%, health checks, and auto-rollback on failure.',
    domain: 'general',
    tags: ['CI/CD', 'DevOps', 'Docker', 'Deployment'],
    result_diagram_code: `graph LR
    Dev[Developer Push]

    subgraph CI["CI Pipeline"]
        Lint[Lint & Format]
        Test[Unit Tests]
        SAST[Security Scan]
        Build[Docker Build]
        Push[Push to Registry]
    end

    subgraph CD["CD Pipeline"]
        Staging[Deploy to Staging]
        IntTest[Integration Tests]
        Approve{Manual Approval}
        Canary[Canary Deploy 10%]
        Rollout[Full Rollout]
    end

    subgraph Monitor["Post-Deploy"]
        Health[Health Checks]
        Metrics[Metrics Watch]
        Rollback[Auto Rollback]
    end

    Dev --> Lint
    Lint --> Test
    Test --> SAST
    SAST --> Build
    Build --> Push
    Push --> Staging
    Staging --> IntTest
    IntTest --> Approve
    Approve -->|approved| Canary
    Canary --> Health
    Health -->|healthy| Rollout
    Health -->|unhealthy| Rollback
    Rollout --> Metrics

    style CI fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style CD fill:#1a4731,stroke:#10b981,color:#fff
    style Monitor fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
    likes: 960,
    views: 7100,
    created_at: '2025-06-28T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-general-4',
    title: 'Monolith to Microservices Migration',
    author: 'ArchiGram',
    description:
      'Strangler fig migration pattern from monolith to microservices with anti-corruption layer.',
    prompt_text:
      'Show a strangler fig migration from a legacy monolith to microservices. Include a load balancer routing through an anti-corruption layer that gradually shifts traffic from legacy modules to new microservices. Show user service as fully migrated, order service mid-migration syncing data with legacy, and payment still on the monolith.',
    domain: 'general',
    tags: ['Migration', 'Strangler Fig', 'Monolith', 'Refactoring'],
    result_diagram_code: `graph TB
    LB[Load Balancer]

    subgraph Facade["Anti-Corruption Layer"]
        Router[Request Router]
    end

    subgraph New["New Microservices"]
        UserMS[User Service]
        OrderMS[Order Service]
        PaymentMS[Payment Service]
    end

    subgraph Legacy["Legacy Monolith"]
        LegacyUser[User Module]
        LegacyOrder[Order Module]
        LegacyPayment[Payment Module]
        LegacyDB[(Legacy Database)]
    end

    LB --> Router
    Router -->|migrated| UserMS
    Router -->|migrating| OrderMS
    Router -->|not started| LegacyPayment
    OrderMS -.->|sync data| LegacyOrder
    LegacyUser -.->|deprecated| LegacyDB
    LegacyOrder --> LegacyDB
    LegacyPayment --> LegacyDB

    style New fill:#064e3b,stroke:#10b981,color:#fff
    style Legacy fill:#450a0a,stroke:#ef4444,color:#fff
    style Facade fill:#1e293b,stroke:#f59e0b,color:#fff`,
    likes: 780,
    views: 5200,
    created_at: '2025-06-02T00:00:00.000Z',
  },

  // ───── Healthcare (4) ─────
  {
    id: 'seed-prompt-healthcare-1',
    title: 'HIPAA-Compliant Telehealth',
    author: 'ArchiGram',
    description:
      'Telehealth platform architecture with end-to-end encryption, PHI isolation, and audit logging.',
    prompt_text:
      'Design a HIPAA-compliant telehealth platform. Include a patient portal, video consultation service with E2E encryption, EHR integration via HL7 FHIR, a PHI data vault with encryption at rest, a de-identification service for analytics, and a comprehensive audit trail for compliance.',
    domain: 'healthcare',
    tags: ['HIPAA', 'Telehealth', 'Healthcare', 'Compliance'],
    result_diagram_code: `graph TB
    Patient((Patient))
    Doctor((Doctor))

    subgraph Portal["Patient Portal"]
        Auth[MFA Authentication]
        Video[E2E Encrypted Video]
        Schedule[Appointment Scheduler]
    end

    subgraph Core["Core Services"]
        Consult[Consultation Service]
        Rx[Prescription Service]
        EHRSync[EHR Integration - FHIR]
    end

    subgraph Security["PHI Security Layer"]
        Vault[(PHI Data Vault)]
        DeID[De-Identification Service]
        Encrypt[Encryption at Rest/Transit]
        Audit[(Audit Trail)]
    end

    subgraph Analytics["De-Identified Analytics"]
        Dashboard[Clinical Dashboard]
        Research[Research Data Lake]
    end

    Patient --> Auth
    Auth --> Video
    Auth --> Schedule
    Doctor --> Video
    Video --> Consult
    Consult --> EHRSync
    Consult --> Rx
    EHRSync --> Vault
    Vault --> Encrypt
    Vault --> DeID
    DeID --> Dashboard
    DeID --> Research
    Consult --> Audit
    Rx --> Audit

    style Security fill:#450a0a,stroke:#ef4444,color:#fff
    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Analytics fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1150,
    views: 7800,
    created_at: '2025-08-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-healthcare-2',
    title: 'HL7 FHIR Integration',
    author: 'ArchiGram',
    description: 'Healthcare interoperability architecture using HL7 FHIR standards.',
    prompt_text:
      'Create an HL7 FHIR integration architecture for a hospital network. Show multiple EHR systems (Epic, Cerner) connecting through a FHIR gateway that normalizes data formats. Include a patient matching service, consent management, a FHIR data store, and subscription-based notifications for care coordination.',
    domain: 'healthcare',
    tags: ['HL7', 'FHIR', 'Interoperability', 'EHR'],
    result_diagram_code: `graph TB
    subgraph EHRs["EHR Systems"]
        Epic[Epic EHR]
        Cerner[Cerner EHR]
        Legacy[Legacy System]
    end

    subgraph Gateway["FHIR Gateway"]
        Normalize[Data Normalizer]
        Validate[FHIR Validator]
        Transform[HL7v2 to FHIR]
    end

    subgraph Core["Core Services"]
        PatientMatch[Patient Matching - MPI]
        Consent[Consent Management]
        FHIRStore[(FHIR Data Store)]
        Subscription[FHIR Subscriptions]
    end

    subgraph Consumers["Care Coordination"]
        CareTeam[Care Team Portal]
        Alerts[Clinical Alerts]
        Analytics[Population Health]
    end

    Epic --> Normalize
    Cerner --> Normalize
    Legacy --> Transform
    Transform --> Normalize
    Normalize --> Validate
    Validate --> PatientMatch
    PatientMatch --> Consent
    Consent --> FHIRStore
    FHIRStore --> Subscription
    Subscription --> CareTeam
    Subscription --> Alerts
    FHIRStore --> Analytics

    style Gateway fill:#1e293b,stroke:#f59e0b,color:#fff
    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Consumers fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 890,
    views: 5600,
    created_at: '2025-06-20T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-healthcare-3',
    title: 'EHR Data Pipeline',
    author: 'ArchiGram',
    description:
      'HIPAA-compliant data pipeline from EHR to analytics with de-identification and secure enclaves.',
    prompt_text:
      'Design a HIPAA-compliant EHR data pipeline. Show patient data flowing from Electronic Health Records through a de-identification service, into a secure data lake with encryption at rest, then through a secure enclave for ML model training on patient risk scores, with results pushed to a doctor dashboard. Include audit logging at every step.',
    domain: 'healthcare',
    tags: ['EHR', 'Data Pipeline', 'HIPAA', 'ML'],
    result_diagram_code: `sequenceDiagram
    participant EHR as Electronic Health Record
    participant DeID as De-identification
    participant Lake as Secure Data Lake
    participant Model as Risk Prediction Model
    participant Doc as Doctor Dashboard

    autonumber
    EHR->>DeID: Send Patient Vitals (HL7)
    DeID->>Lake: Store Anonymized Data
    Lake->>Model: Batch Inference Request
    Model->>Model: Calculate Risk Score
    Model-->>Lake: Store Results
    Lake->>Doc: Push High Risk Alert (Audit Logged)
    Note over Doc, Model: HIPAA Compliant Flow`,
    likes: 670,
    views: 4300,
    created_at: '2025-05-15T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-healthcare-4',
    title: 'Clinical Decision Support',
    author: 'ArchiGram',
    description: 'AI-powered clinical decision support system with evidence-based recommendations.',
    prompt_text:
      'Design a clinical decision support system (CDSS). Show patient data from EHR feeding into a rules engine and ML prediction model that cross-references clinical guidelines, drug interactions, and patient history. Output treatment recommendations to the physician dashboard with confidence scores and supporting evidence citations.',
    domain: 'healthcare',
    tags: ['CDSS', 'Clinical AI', 'Healthcare', 'Decision Support'],
    result_diagram_code: `graph TB
    subgraph Input["Patient Data"]
        EHR[(EHR Records)]
        Labs[Lab Results]
        Vitals[Real-time Vitals]
    end

    subgraph Engine["Decision Engine"]
        Rules[Clinical Rules Engine]
        ML[ML Risk Predictor]
        DrugCheck[Drug Interaction Check]
        Guidelines[(Clinical Guidelines DB)]
    end

    subgraph Output["Physician Interface"]
        Dashboard[Physician Dashboard]
        Alerts[Priority Alerts]
        Evidence[Evidence Citations]
        Confidence[Confidence Scores]
    end

    EHR --> Rules
    Labs --> ML
    Vitals --> ML
    Rules --> Guidelines
    ML --> DrugCheck
    DrugCheck --> Dashboard
    Rules --> Alerts
    ML --> Confidence
    Guidelines --> Evidence
    Dashboard --> Evidence

    style Engine fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Output fill:#1a4731,stroke:#10b981,color:#fff
    style Input fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
    likes: 540,
    views: 3200,
    created_at: '2025-04-25T00:00:00.000Z',
  },

  // ───── Finance (4) ─────
  {
    id: 'seed-prompt-finance-1',
    title: 'PCI-DSS Payment Gateway',
    author: 'ArchiGram',
    description:
      'PCI-DSS compliant payment gateway with tokenization, fraud detection, and multi-PSP routing.',
    prompt_text:
      'Design a PCI-DSS compliant payment processing system. Include TLS termination, a tokenization vault for card data, an idempotency layer, ML-based fraud detection that blocks high-risk transactions, smart routing across multiple PSPs (Stripe, Adyen, PayPal), webhook handling, a double-entry ledger, and settlement reconciliation.',
    domain: 'finance',
    tags: ['PCI-DSS', 'Payments', 'Fraud Detection', 'FinTech'],
    result_diagram_code: `graph TB
    Merchant((Merchant))

    subgraph Security["Security Layer"]
        TLS[TLS Termination]
        Token[Tokenization Vault]
        PCI[PCI-DSS Boundary]
    end

    subgraph Core["Payment Engine"]
        Router[PSP Router]
        Fraud[Fraud Detection ML]
        Idempotent[Idempotency Check]
        Ledger[(Double-Entry Ledger)]
    end

    subgraph PSPs["Payment Processors"]
        Stripe[Stripe]
        Adyen[Adyen]
        PayPal[PayPal]
    end

    subgraph Async["Async Processing"]
        Webhook[Webhook Handler]
        Reconcile[Reconciliation]
        Settle[Settlement Engine]
    end

    Merchant --> TLS
    TLS --> Token
    Token --> PCI
    PCI --> Idempotent
    Idempotent --> Fraud
    Fraud -->|low risk| Router
    Fraud -->|high risk| Merchant
    Router --> Stripe
    Router --> Adyen
    Router --> PayPal
    Stripe --> Webhook
    Webhook --> Ledger
    Ledger --> Reconcile
    Reconcile --> Settle

    style Security fill:#450a0a,stroke:#ef4444,color:#fff
    style Core fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Async fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1420,
    views: 9200,
    created_at: '2025-08-10T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-finance-2',
    title: 'Real-Time Fraud Detection',
    author: 'ArchiGram',
    description:
      'Real-time transaction fraud detection with feature store, ML scoring, and case management.',
    prompt_text:
      'Design a real-time fraud detection system for a banking platform. Show transactions flowing through a Kafka stream into a feature extraction service that pulls from a Redis feature store, feeds an ML inference engine returning a risk score. High-risk scores trigger automatic blocks and analyst alerts, while all results feed into a case management system and model retraining pipeline.',
    domain: 'finance',
    tags: ['Fraud Detection', 'Real-Time', 'ML', 'Banking'],
    result_diagram_code: `flowchart TD
    Tx[Transaction Event] --> Kafka{Message Queue}
    Kafka -->|Stream| Flink[Feature Extraction]
    Flink --> Redis[(Feature Store)]
    Redis --> Model[Inference Service]
    Model -->|Score > 0.8| Block[Block Transaction]
    Model -->|Score < 0.8| Approve[Approve Transaction]
    Block --> Alert[Notify Ops]
    Block --> CaseMgmt[Case Management]
    Approve --> Ledger[(Transaction Ledger)]
    CaseMgmt --> Retrain[Model Retraining]`,
    likes: 1080,
    views: 6800,
    created_at: '2025-07-20T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-finance-3',
    title: 'Trading System Architecture',
    author: 'ArchiGram',
    description: 'Low-latency trading system with order matching, risk checks, and market data.',
    prompt_text:
      'Design a low-latency electronic trading system. Include a market data feed handler, order management system (OMS), pre-trade risk checks, an order matching engine with price-time priority, post-trade processing with clearing and settlement, and real-time position management. Emphasize the latency-critical path from order entry to execution.',
    domain: 'finance',
    tags: ['Trading', 'Low-Latency', 'Order Matching', 'Capital Markets'],
    result_diagram_code: `graph LR
    subgraph MarketData["Market Data"]
        Feed[Market Data Feed]
        Normalize[Normalizer]
        Book[Order Book]
    end

    subgraph Trading["Trading Engine"]
        OMS[Order Management]
        Risk[Pre-Trade Risk]
        Matching[Matching Engine]
    end

    subgraph PostTrade["Post-Trade"]
        Clearing[Clearing]
        Settlement[Settlement]
        Position[Position Manager]
    end

    subgraph Monitor["Monitoring"]
        Latency[Latency Monitor]
        Audit[(Audit Trail)]
    end

    Feed --> Normalize
    Normalize --> Book
    Trader((Trader)) --> OMS
    OMS --> Risk
    Risk -->|approved| Matching
    Risk -->|rejected| OMS
    Matching --> Book
    Matching --> Clearing
    Clearing --> Settlement
    Settlement --> Position
    OMS --> Latency
    Matching --> Audit

    style Trading fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style PostTrade fill:#1a4731,stroke:#10b981,color:#fff
    style MarketData fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
    likes: 760,
    views: 4500,
    created_at: '2025-06-12T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-finance-4',
    title: 'Core Banking Modernization',
    author: 'ArchiGram',
    description:
      'Legacy core banking modernization with event sourcing, CQRS, and gradual migration.',
    prompt_text:
      'Design a core banking modernization architecture. Show the legacy mainframe connected through an anti-corruption layer to new microservices. Include an event-sourced ledger with CQRS, separate command and query paths, account management, loan processing, and KYC services. Show data flowing to a new cloud-native analytics platform while maintaining backward compatibility with legacy interfaces.',
    domain: 'finance',
    tags: ['Core Banking', 'Modernization', 'CQRS', 'Event Sourcing'],
    result_diagram_code: `graph TB
    subgraph Legacy["Legacy Core Banking"]
        Mainframe[Mainframe / AS400]
        LegacyDB[(Legacy DB)]
    end

    subgraph ACL["Anti-Corruption Layer"]
        Adapter[Protocol Adapter]
        Sync[Data Synchronizer]
    end

    subgraph Modern["Cloud-Native Services"]
        AccountSvc[Account Service]
        LoanSvc[Loan Processing]
        KYCSvc[KYC Service]
    end

    subgraph CQRS["Event-Sourced Ledger"]
        CommandAPI[Command API]
        EventStore[(Event Store)]
        QueryAPI[Query API]
        ReadDB[(Read Model)]
    end

    Mainframe --> Adapter
    Adapter --> AccountSvc
    Adapter --> Sync
    Sync --> LegacyDB
    AccountSvc --> CommandAPI
    LoanSvc --> CommandAPI
    CommandAPI --> EventStore
    EventStore --> ReadDB
    ReadDB --> QueryAPI
    KYCSvc --> AccountSvc

    style Legacy fill:#450a0a,stroke:#ef4444,color:#fff
    style Modern fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style CQRS fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 620,
    views: 3900,
    created_at: '2025-04-15T00:00:00.000Z',
  },

  // ───── E-Commerce (4) ─────
  {
    id: 'seed-prompt-ecommerce-1',
    title: 'Marketplace Platform',
    author: 'ArchiGram',
    description:
      'Multi-vendor marketplace architecture with seller management, product catalog, and search.',
    prompt_text:
      'Design a multi-vendor marketplace platform like Etsy or Amazon Marketplace. Include seller onboarding and management, a product catalog with Elasticsearch-powered search, a recommendation engine, shopping cart with Redis sessions, checkout with split payments to sellers, order fulfillment tracking, and a review/rating system.',
    domain: 'ecommerce',
    tags: ['Marketplace', 'Multi-Vendor', 'E-Commerce', 'Search'],
    result_diagram_code: `graph TB
    Buyer((Buyer))
    Seller((Seller))

    subgraph Frontend["Storefront"]
        Search[Search - Elasticsearch]
        Catalog[Product Catalog]
        Recs[Recommendations]
    end

    subgraph Cart["Shopping"]
        CartSvc[Cart Service - Redis]
        Checkout[Checkout]
        SplitPay[Split Payment Engine]
    end

    subgraph Seller_Mgmt["Seller Platform"]
        Onboard[Seller Onboarding]
        Inventory[Inventory Management]
        Payout[Payout Service]
    end

    subgraph Fulfillment["Fulfillment"]
        OrderSvc[Order Service]
        Shipping[Shipping Tracker]
        Reviews[Review System]
    end

    Buyer --> Search
    Search --> Catalog
    Catalog --> Recs
    Recs --> CartSvc
    CartSvc --> Checkout
    Checkout --> SplitPay
    SplitPay --> Payout
    Seller --> Onboard
    Onboard --> Inventory
    Inventory --> Catalog
    SplitPay --> OrderSvc
    OrderSvc --> Shipping
    Shipping --> Reviews

    style Frontend fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Cart fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Fulfillment fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1250,
    views: 8100,
    created_at: '2025-08-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ecommerce-2',
    title: 'Order Fulfillment Pipeline',
    author: 'ArchiGram',
    description: 'End-to-end order fulfillment from placement to delivery with status tracking.',
    prompt_text:
      'Design an order fulfillment pipeline for a large e-commerce warehouse. Show the flow from order placement through payment verification, warehouse picking/packing using a WMS, carrier selection and label generation, shipping with real-time tracking updates, delivery confirmation, and return processing. Include an event-driven notification system that updates customers at each stage.',
    domain: 'ecommerce',
    tags: ['Fulfillment', 'Warehouse', 'Logistics', 'E-Commerce'],
    result_diagram_code: `graph LR
    Order((New Order))

    subgraph Verify["Verification"]
        PaymentCheck[Payment Verification]
        FraudCheck[Fraud Check]
        InventoryCheck[Inventory Check]
    end

    subgraph Warehouse["Warehouse (WMS)"]
        Pick[Pick List Generation]
        Pack[Packing Station]
        QC[Quality Check]
    end

    subgraph Ship["Shipping"]
        CarrierSelect[Carrier Selection]
        Label[Label Generation]
        Dispatch[Dispatch]
    end

    subgraph Track["Tracking & Delivery"]
        Tracking[Real-Time Tracking]
        Delivery[Delivery Confirmation]
        Returns[Return Processing]
    end

    Order --> PaymentCheck
    PaymentCheck --> FraudCheck
    FraudCheck --> InventoryCheck
    InventoryCheck --> Pick
    Pick --> Pack
    Pack --> QC
    QC --> CarrierSelect
    CarrierSelect --> Label
    Label --> Dispatch
    Dispatch --> Tracking
    Tracking --> Delivery
    Delivery --> Returns

    style Verify fill:#1e293b,stroke:#f59e0b,color:#fff
    style Warehouse fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Ship fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Track fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 930,
    views: 6100,
    created_at: '2025-07-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ecommerce-3',
    title: 'Product Recommendation Engine',
    author: 'ArchiGram',
    description:
      'Hybrid recommendation system combining collaborative filtering, content-based, and real-time signals.',
    prompt_text:
      'Design a product recommendation engine for an e-commerce site. Combine collaborative filtering (users who bought X also bought Y), content-based filtering (similar product attributes), and real-time behavioral signals (current session clicks). Show offline model training with Spark, a feature store, real-time scoring API, and A/B testing of recommendation strategies.',
    domain: 'ecommerce',
    tags: ['Recommendations', 'ML', 'Personalization', 'E-Commerce'],
    result_diagram_code: `graph TB
    User((User Activity))

    subgraph Offline["Offline Processing"]
        CF[Collaborative Filtering]
        ContentBased[Content-Based Model]
        DeepModel[Deep Neural Network]
    end

    subgraph Candidate["Candidate Generation"]
        CandidateGen[Candidate Pool]
        Recall[Recall: Top 500]
    end

    subgraph Ranking["Ranking"]
        Scorer[ML Scorer]
        BusinessRules[Business Rules]
        Diversity[Diversity Filter]
        TopK[Top-K Results]
    end

    subgraph Serving["Real-Time Serving"]
        Cache[(Feature Cache)]
        API[Recommendation API]
    end

    User --> CF
    User --> ContentBased
    User --> DeepModel
    CF --> CandidateGen
    ContentBased --> CandidateGen
    DeepModel --> CandidateGen
    CandidateGen --> Recall
    Recall --> Scorer
    Scorer --> BusinessRules
    BusinessRules --> Diversity
    Diversity --> TopK
    TopK --> API
    Cache --> Scorer

    style Offline fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Ranking fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Serving fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 810,
    views: 5500,
    created_at: '2025-05-25T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ecommerce-4',
    title: 'Cart & Checkout System',
    author: 'ArchiGram',
    description:
      'High-availability cart and checkout with inventory reservation and payment orchestration.',
    prompt_text:
      'Design a shopping cart and checkout system for a high-traffic e-commerce site. Include Redis-backed cart persistence, inventory reservation with TTL, price calculation with coupon/promotion engine, multi-step checkout with address validation, payment orchestration supporting multiple methods (card, wallet, BNPL), order confirmation, and post-checkout email/SMS notifications.',
    domain: 'ecommerce',
    tags: ['Cart', 'Checkout', 'Inventory', 'E-Commerce'],
    result_diagram_code: `graph TB
    User((Shopper))

    subgraph Cart["Cart Service"]
        CartAPI[Cart API]
        Redis[(Redis Cart Store)]
        PriceCalc[Price Calculator]
        Coupon[Coupon Engine]
    end

    subgraph Checkout["Checkout Flow"]
        Address[Address Validation]
        Inventory[Inventory Reservation - TTL]
        PaymentOrch[Payment Orchestrator]
    end

    subgraph Payment["Payment Methods"]
        Card[Credit Card]
        Wallet[Digital Wallet]
        BNPL[Buy Now Pay Later]
    end

    subgraph PostOrder["Post-Checkout"]
        Confirm[Order Confirmation]
        Email[Email Notification]
        SMS[SMS Notification]
    end

    User --> CartAPI
    CartAPI --> Redis
    CartAPI --> PriceCalc
    PriceCalc --> Coupon
    Coupon --> Address
    Address --> Inventory
    Inventory --> PaymentOrch
    PaymentOrch --> Card
    PaymentOrch --> Wallet
    PaymentOrch --> BNPL
    Card --> Confirm
    Wallet --> Confirm
    BNPL --> Confirm
    Confirm --> Email
    Confirm --> SMS

    style Cart fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Checkout fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style PostOrder fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 690,
    views: 4700,
    created_at: '2025-05-05T00:00:00.000Z',
  },

  // ───── DevOps (5) ─────
  {
    id: 'seed-prompt-devops-1',
    title: 'Kubernetes Production Cluster',
    author: 'ArchiGram',
    description:
      'Production-grade Kubernetes architecture with namespaces, ingress, and observability.',
    prompt_text:
      'Design a production Kubernetes cluster. Include an NGINX ingress controller, three namespaces (app, data, monitoring). App namespace has frontend, API, and worker deployments. Data namespace has PostgreSQL, Redis, and Kafka StatefulSets. Monitoring namespace has Prometheus, Grafana, and Loki. Show external S3 storage and DNS/CDN.',
    domain: 'devops',
    tags: ['Kubernetes', 'K8s', 'Production', 'Containers'],
    result_diagram_code: `graph TB
    Internet((Internet))

    subgraph Cluster["Kubernetes Cluster"]
        Ingress[NGINX Ingress Controller]

        subgraph AppNS["Namespace: app"]
            FrontDeploy[Frontend Deployment]
            APIDeploy[API Deployment]
            WorkerDeploy[Worker Deployment]
        end

        subgraph DataNS["Namespace: data"]
            PG[(PostgreSQL StatefulSet)]
            Redis[(Redis StatefulSet)]
            Kafka[(Kafka StatefulSet)]
        end

        subgraph MonNS["Namespace: monitoring"]
            Prometheus[Prometheus]
            Grafana[Grafana]
            Loki[Loki Logs]
        end
    end

    subgraph External["External Services"]
        S3[(S3 / Object Storage)]
        DNS[DNS / CDN]
    end

    Internet --> DNS
    DNS --> Ingress
    Ingress --> FrontDeploy
    Ingress --> APIDeploy
    APIDeploy --> PG
    APIDeploy --> Redis
    WorkerDeploy --> Kafka
    WorkerDeploy --> PG
    Prometheus --> APIDeploy
    Prometheus --> WorkerDeploy
    APIDeploy --> S3

    style Cluster fill:#0f172a,stroke:#6366f1,color:#fff
    style AppNS fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style DataNS fill:#1a4731,stroke:#10b981,color:#fff
    style MonNS fill:#4a1d6a,stroke:#a78bfa,color:#fff`,
    likes: 1680,
    views: 11200,
    created_at: '2025-08-10T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-devops-2',
    title: 'GitOps Deployment Pipeline',
    author: 'ArchiGram',
    description: 'GitOps workflow with ArgoCD, Kustomize, and progressive rollouts.',
    prompt_text:
      'Design a GitOps deployment pipeline using ArgoCD. Show developers pushing to a Git repo, CI building and pushing a Docker image, then updating the deployment manifest in a config repo. ArgoCD watches the config repo, syncs to the Kubernetes cluster with Kustomize overlays for dev/staging/prod, and performs progressive rollouts with automated rollback on health check failure.',
    domain: 'devops',
    tags: ['GitOps', 'ArgoCD', 'Kubernetes', 'Deployment'],
    result_diagram_code: `graph LR
    Dev[Developer Push]

    subgraph CI["CI Pipeline"]
        Build[Build & Test]
        Image[Docker Build]
        Push[Push to Registry]
        UpdateManifest[Update Config Repo]
    end

    subgraph GitOps["GitOps (ArgoCD)"]
        ConfigRepo[(Config Git Repo)]
        ArgoCD[ArgoCD Controller]
        Kustomize[Kustomize Overlays]
    end

    subgraph Envs["Environments"]
        DevCluster[Dev Cluster]
        StagingCluster[Staging Cluster]
        ProdCluster[Prod Cluster]
    end

    subgraph Rollout["Progressive Rollout"]
        Health[Health Checks]
        Canary[Canary 10%]
        Full[Full Rollout]
        Rollback[Auto Rollback]
    end

    Dev --> Build
    Build --> Image
    Image --> Push
    Push --> UpdateManifest
    UpdateManifest --> ConfigRepo
    ConfigRepo --> ArgoCD
    ArgoCD --> Kustomize
    Kustomize --> DevCluster
    Kustomize --> StagingCluster
    Kustomize --> ProdCluster
    ProdCluster --> Canary
    Canary --> Health
    Health -->|pass| Full
    Health -->|fail| Rollback

    style CI fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style GitOps fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Envs fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1340,
    views: 8700,
    created_at: '2025-07-28T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-devops-3',
    title: 'Observability Stack',
    author: 'ArchiGram',
    description:
      'Full observability with metrics, logs, traces, and alerting using open-source tools.',
    prompt_text:
      'Design a complete observability stack for a microservices platform. Include metrics collection with Prometheus and Grafana dashboards, distributed tracing with Jaeger/Tempo, centralized logging with Loki and Fluentd, alerting through Alertmanager to PagerDuty/Slack, and SLO/SLI monitoring. Show how application services emit telemetry via OpenTelemetry.',
    domain: 'devops',
    tags: ['Observability', 'Monitoring', 'Prometheus', 'OpenTelemetry'],
    result_diagram_code: `graph TB
    subgraph Apps["Application Services"]
        SvcA[Service A]
        SvcB[Service B]
        SvcC[Service C]
        OTel[OpenTelemetry SDK]
    end

    subgraph Metrics["Metrics"]
        Prometheus[Prometheus]
        Grafana[Grafana Dashboards]
        SLO[SLO/SLI Monitor]
    end

    subgraph Logs["Logging"]
        Fluentd[Fluentd Collector]
        Loki[Grafana Loki]
    end

    subgraph Traces["Tracing"]
        Tempo[Grafana Tempo]
        TraceView[Trace Explorer]
    end

    subgraph Alerting["Alerting"]
        AlertMgr[Alertmanager]
        PagerDuty[PagerDuty]
        Slack[Slack]
    end

    SvcA --> OTel
    SvcB --> OTel
    SvcC --> OTel
    OTel --> Prometheus
    OTel --> Fluentd
    OTel --> Tempo
    Prometheus --> Grafana
    Prometheus --> SLO
    Fluentd --> Loki
    Loki --> Grafana
    Tempo --> TraceView
    SLO --> AlertMgr
    AlertMgr --> PagerDuty
    AlertMgr --> Slack

    style Apps fill:#1a1a2e,stroke:#94a3b8,color:#fff
    style Metrics fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Traces fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Alerting fill:#450a0a,stroke:#ef4444,color:#fff`,
    likes: 1150,
    views: 7500,
    created_at: '2025-07-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-devops-4',
    title: 'Disaster Recovery',
    author: 'ArchiGram',
    description: 'Multi-region disaster recovery with RPO/RTO targets and automated failover.',
    prompt_text:
      'Design a disaster recovery architecture for a critical SaaS application. Show a primary region with active workloads and a standby region with warm replicas. Include cross-region database replication, S3 cross-region backup, Route 53 health-checked DNS failover, and a runbook automation service that coordinates failover steps. Label RPO < 1 minute and RTO < 15 minutes.',
    domain: 'devops',
    tags: ['Disaster Recovery', 'High Availability', 'Multi-Region', 'Failover'],
    result_diagram_code: `graph TB
    DNS[Route 53 - Health Checked]

    subgraph Primary["Primary Region (Active)"]
        LBA[ALB]
        AppA[App Cluster]
        DBA[(Primary DB)]
        S3A[(S3 Bucket)]
    end

    subgraph Standby["Standby Region (Warm)"]
        LBB[ALB]
        AppB[App Cluster - Warm]
        DBB[(Replica DB)]
        S3B[(S3 Replica)]
    end

    subgraph Automation["Failover Automation"]
        HealthCheck[Health Monitor]
        Runbook[Runbook Automation]
        Alert[Alert Team]
    end

    DNS -->|active| LBA
    DNS -.->|failover| LBB
    LBA --> AppA
    AppA --> DBA
    LBB --> AppB
    AppB --> DBB
    DBA -->|RPO < 1min| DBB
    S3A -->|Cross-Region Replication| S3B
    HealthCheck --> DNS
    HealthCheck --> Runbook
    Runbook --> Alert

    style Primary fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Standby fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Automation fill:#1e293b,stroke:#f59e0b,color:#fff`,
    likes: 880,
    views: 5800,
    created_at: '2025-06-20T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-devops-5',
    title: 'Multi-Cloud Infrastructure',
    author: 'ArchiGram',
    description:
      'Multi-cloud architecture spanning AWS and GCP with unified management and portability.',
    prompt_text:
      'Design a multi-cloud infrastructure spanning AWS and GCP. Show a Terraform-managed infrastructure layer, workloads distributed across both clouds with Kubernetes (EKS + GKE), a unified service mesh for cross-cloud communication, centralized secrets management with HashiCorp Vault, and a single pane of glass monitoring with Datadog. Include a cloud-agnostic CI/CD pipeline.',
    domain: 'devops',
    tags: ['Multi-Cloud', 'AWS', 'GCP', 'Terraform', 'Infrastructure'],
    result_diagram_code: `graph TB
    subgraph Management["Unified Management"]
        Terraform[Terraform IaC]
        Vault[HashiCorp Vault]
        Datadog[Datadog Monitoring]
        CICD[CI/CD Pipeline]
    end

    subgraph AWS["AWS"]
        EKS[EKS Cluster]
        RDS[(RDS PostgreSQL)]
        S3[(S3 Storage)]
    end

    subgraph GCP["Google Cloud"]
        GKE[GKE Cluster]
        CloudSQL[(Cloud SQL)]
        GCS[(GCS Storage)]
    end

    subgraph Mesh["Service Mesh"]
        Istio[Istio Gateway]
        CrossCloud[Cross-Cloud mTLS]
    end

    Terraform --> AWS
    Terraform --> GCP
    Vault --> EKS
    Vault --> GKE
    CICD --> EKS
    CICD --> GKE
    EKS --> RDS
    EKS --> S3
    GKE --> CloudSQL
    GKE --> GCS
    EKS --> Istio
    GKE --> Istio
    Istio --> CrossCloud
    Datadog --> EKS
    Datadog --> GKE

    style Management fill:#1e293b,stroke:#f59e0b,color:#fff
    style AWS fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style GCP fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 720,
    views: 4800,
    created_at: '2025-06-02T00:00:00.000Z',
  },

  // ───── ML/AI (4) ─────
  {
    id: 'seed-prompt-ml-1',
    title: 'MLOps Training Pipeline',
    author: 'ArchiGram',
    description:
      'End-to-end ML training pipeline with feature store, experiment tracking, and model registry.',
    prompt_text:
      'Design an end-to-end MLOps training pipeline. Include data ingestion from a data lake, feature engineering with a centralized feature store, hyperparameter tuning, distributed training on GPU clusters, experiment tracking with MLflow/W&B, model evaluation with automated metrics, a model registry with versioning, and a deployment path through human review, staging, A/B testing, and production rollout.',
    domain: 'ml',
    tags: ['MLOps', 'Training', 'Feature Store', 'Model Registry'],
    result_diagram_code: `graph TB
    subgraph Data["Data Preparation"]
        Raw[(Raw Data Lake)]
        FE[Feature Engineering]
        Split[Train/Val/Test Split]
        Store[(Feature Store)]
    end

    subgraph Training["Model Training"]
        HPO[Hyperparameter Tuning]
        Train[Distributed Training]
        Eval[Model Evaluation]
        Registry[(Model Registry)]
    end

    subgraph Experiment["Experiment Tracking"]
        MLflow[MLflow / W&B]
        Metrics[Metrics Dashboard]
        Compare[Model Comparison]
    end

    subgraph Deploy["Deployment"]
        Review{Human Review}
        Stage[Staging Deploy]
        ABTest[A/B Test]
        Prod[Production]
    end

    Raw --> FE
    FE --> Split
    FE --> Store
    Split --> HPO
    HPO --> Train
    Train --> Eval
    Eval --> Registry
    Train --> MLflow
    MLflow --> Metrics
    Metrics --> Compare
    Registry --> Review
    Review -->|approved| Stage
    Stage --> ABTest
    ABTest -->|winner| Prod

    style Data fill:#1a4731,stroke:#10b981,color:#fff
    style Training fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Experiment fill:#4a1d6a,stroke:#a78bfa,color:#fff
    style Deploy fill:#1e293b,stroke:#f59e0b,color:#fff`,
    likes: 1520,
    views: 10100,
    created_at: '2025-08-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ml-2',
    title: 'RAG System Architecture',
    author: 'ArchiGram',
    description:
      'Retrieval-Augmented Generation with document ingestion, vector search, and LLM synthesis.',
    prompt_text:
      'Design a Retrieval-Augmented Generation (RAG) system. Show two pipelines: (1) Document ingestion — loading documents, chunking with a text splitter, generating embeddings, storing in a vector database. (2) Query pipeline — embedding the user query, similarity search against the vector DB, cross-encoder reranking, context assembly, prompt template injection, LLM generation, and output guardrails.',
    domain: 'ml',
    tags: ['RAG', 'LLM', 'Vector Search', 'GenAI'],
    result_diagram_code: `graph TB
    subgraph Ingestion["Document Ingestion"]
        Docs[Documents / URLs]
        Loader[Document Loader]
        Splitter[Text Splitter]
        Embedder[Embedding Model]
        VectorDB[(Vector Database)]
    end

    subgraph Query["Query Pipeline"]
        User((User Query))
        QueryEmbed[Query Embedding]
        Retriever[Similarity Search]
        Reranker[Cross-Encoder Reranker]
        Context[Context Assembly]
    end

    subgraph Generation["LLM Generation"]
        Prompt[Prompt Template]
        LLM[Large Language Model]
        Guard[Output Guard]
        Response[Response]
    end

    Docs --> Loader
    Loader --> Splitter
    Splitter --> Embedder
    Embedder --> VectorDB

    User --> QueryEmbed
    QueryEmbed --> Retriever
    Retriever --> VectorDB
    VectorDB --> Reranker
    Reranker --> Context

    Context --> Prompt
    User --> Prompt
    Prompt --> LLM
    LLM --> Guard
    Guard --> Response

    style Ingestion fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Query fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Generation fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 1890,
    views: 13400,
    created_at: '2025-08-10T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ml-3',
    title: 'Real-Time Feature Store',
    author: 'ArchiGram',
    description:
      'Feature store with offline/online serving, batch and streaming computation, and versioning.',
    prompt_text:
      'Design a centralized feature store architecture. Show three data source types (batch, streaming, third-party APIs) feeding into separate compute engines (Spark for batch, Flink for streaming, on-demand for APIs). Features flow into an offline store (Parquet/Delta Lake) for training and an online store (Redis) for real-time serving. Include a feature registry with versioning, and show training and serving consumers.',
    domain: 'ml',
    tags: ['Feature Store', 'MLOps', 'Real-Time', 'Feast'],
    result_diagram_code: `graph TB
    subgraph Sources["Data Sources"]
        Batch[(Batch Data)]
        Stream[Streaming Events]
        ThirdParty[Third-Party APIs]
    end

    subgraph Compute["Feature Computation"]
        BatchCompute[Batch Features - Spark]
        StreamCompute[Stream Features - Flink]
        OnDemand[On-Demand Features]
    end

    subgraph Store["Feature Store"]
        Offline[(Offline Store - Parquet)]
        Online[(Online Store - Redis)]
        Registry[Feature Registry]
        Versioning[Feature Versioning]
    end

    subgraph Consumers["Consumers"]
        Training[Model Training]
        Serving[Model Serving]
        Analytics[Data Analytics]
    end

    Batch --> BatchCompute
    Stream --> StreamCompute
    ThirdParty --> OnDemand
    BatchCompute --> Offline
    StreamCompute --> Online
    BatchCompute --> Online
    OnDemand --> Online
    Registry --> Versioning

    Offline --> Training
    Online --> Serving
    Offline --> Analytics

    style Store fill:#4a1d6a,stroke:#8b5cf6,color:#fff
    style Compute fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Consumers fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 970,
    views: 6400,
    created_at: '2025-07-12T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-ml-4',
    title: 'LLM Application Platform',
    author: 'ArchiGram',
    description:
      'Production LLM application with prompt management, guardrails, multi-model routing, and observability.',
    prompt_text:
      'Design a production LLM application platform. Include an API server, prompt manager with versioned templates, session manager for conversation history, input guardrails (PII detection, toxicity filter), a model router that selects between GPT-4, Claude, and Llama based on task type, semantic caching layer, output guardrails, and an observability stack with trace logging, user feedback collection, cost tracking, and auto-evaluation.',
    domain: 'ml',
    tags: ['LLM', 'GenAI', 'Guardrails', 'Multi-Model'],
    result_diagram_code: `graph TB
    User((User))

    subgraph App["Application Layer"]
        API[API Server]
        PromptMgr[Prompt Manager]
        SessionMgr[Session Manager]
    end

    subgraph Safety["Safety Layer"]
        InputGuard[Input Guardrails]
        OutputGuard[Output Guardrails]
        PII[PII Detection]
        Toxicity[Toxicity Filter]
    end

    subgraph LLMLayer["LLM Orchestration"]
        Router[Model Router]
        Cache[(Semantic Cache)]
        GPT4[GPT-4o]
        Claude[Claude 4]
        Llama[Llama 3]
    end

    subgraph Observe["Observability"]
        Traces[Trace Logging]
        Feedback[User Feedback]
        Cost[Cost Tracker]
        Eval[Auto Evaluator]
    end

    User --> API
    API --> InputGuard
    InputGuard --> PII
    PII --> PromptMgr
    PromptMgr --> SessionMgr
    SessionMgr --> Cache
    Cache -->|miss| Router
    Router --> GPT4
    Router --> Claude
    Router --> Llama
    GPT4 --> OutputGuard
    Claude --> OutputGuard
    OutputGuard --> Toxicity
    Toxicity --> User
    API --> Traces
    User --> Feedback
    Router --> Cost
    OutputGuard --> Eval

    style Safety fill:#450a0a,stroke:#ef4444,color:#fff
    style LLMLayer fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style Observe fill:#1a4731,stroke:#10b981,color:#fff`,
    likes: 2010,
    views: 14200,
    created_at: '2025-08-15T00:00:00.000Z',
  },

  // ═══════════════════════════════════════════
  // SIDEBAR TEMPLATE CONVERSIONS (12)
  // ═══════════════════════════════════════════

  // -- TEMPLATES (4) --
  {
    id: 'seed-prompt-template-cloud',
    title: 'Cloud Architecture',
    author: 'ArchiGram',
    description:
      'Classic cloud architecture with load balancer, app cluster, database, and caching layer.',
    prompt_text:
      'Generate a cloud architecture diagram with users connecting through a load balancer to a Docker app cluster (2 servers), backed by a PostgreSQL primary database and Redis cache layer.',
    domain: 'general',
    tags: ['Cloud', 'Load Balancer', 'Docker', 'Template'],
    result_diagram_code: TEMPLATES['Cloud Architecture'],
    likes: 450,
    views: 3200,
    created_at: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-architecture-beta',
    title: 'Architecture Beta Diagram',
    author: 'ArchiGram',
    description:
      'Modern architecture-beta diagram type with cloud groups, database, disk storage, and server.',
    prompt_text:
      'Create an architecture-beta diagram showing an API cloud group containing a database, disk storage, and server with connections between them.',
    domain: 'general',
    tags: ['Architecture', 'Beta', 'Template'],
    result_diagram_code: TEMPLATES['Architecture (Beta)'],
    likes: 320,
    views: 2100,
    created_at: '2025-02-10T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-user-journey',
    title: 'User Journey Map',
    author: 'ArchiGram',
    description: 'User journey diagram mapping daily activities with satisfaction scores.',
    prompt_text:
      'Create a user journey map showing a typical working day. Include sections for commute (wake up, get ready, travel) and work (start tasks, breaks, wrap up) with satisfaction ratings for each step.',
    domain: 'general',
    tags: ['User Journey', 'UX', 'Template'],
    result_diagram_code: TEMPLATES['User Journey'],
    likes: 380,
    views: 2800,
    created_at: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-state-machine',
    title: 'State Machine',
    author: 'ArchiGram',
    description: 'State diagram showing transitions between states including start and end.',
    prompt_text:
      'Generate a state machine diagram with states for Still, Moving, and Crash. Show transitions between them: Still to Moving, Moving back to Still, Moving to Crash, and Crash to end state.',
    domain: 'general',
    tags: ['State Machine', 'FSM', 'Template'],
    result_diagram_code: TEMPLATES['State Machine'],
    likes: 290,
    views: 1900,
    created_at: '2025-01-02T00:00:00.000Z',
  },

  // -- ML_TEMPLATES (4) --
  {
    id: 'seed-prompt-template-text-classifier',
    title: 'Text Classifier Pipeline',
    author: 'ArchiGram',
    description:
      'NLP text classification pipeline from tokenization through transformer to softmax output.',
    prompt_text:
      'Design a text classification ML pipeline. Show raw text data flowing through tokenization, embedding layer, transformer block, classification head, and softmax output. Include a side MLOps section with model registry and experiment tracker.',
    domain: 'ml',
    tags: ['NLP', 'Text Classification', 'Transformer', 'Template'],
    result_diagram_code: ML_TEMPLATES['Text Classifier Pipeline'],
    likes: 510,
    views: 3600,
    created_at: '2025-03-20T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-healthcare-risk',
    title: 'Healthcare Risk Prediction',
    author: 'ArchiGram',
    description:
      'HIPAA-compliant risk prediction flow from EHR to doctor dashboard with de-identification.',
    prompt_text:
      'Design a healthcare risk prediction workflow. Show Electronic Health Records sending patient vitals via HL7 to a de-identification service, storing in a secure data lake, running batch inference for risk scores, and pushing high-risk alerts to a doctor dashboard. Ensure HIPAA compliance throughout.',
    domain: 'healthcare',
    tags: ['Risk Prediction', 'EHR', 'HIPAA', 'Template'],
    result_diagram_code: ML_TEMPLATES['Healthcare Risk Prediction'],
    likes: 470,
    views: 3100,
    created_at: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-fraud-detection',
    title: 'Fraud Detection (Real-time)',
    author: 'ArchiGram',
    description:
      'Real-time transaction fraud scoring pipeline with feature store and ML inference.',
    prompt_text:
      'Create a real-time fraud detection flowchart. Show transaction events flowing through a message queue to feature extraction, pulling from a feature store, then to an inference service that either blocks (score > 0.8) or approves transactions, with alerts for blocked transactions.',
    domain: 'finance',
    tags: ['Fraud Detection', 'Real-Time', 'ML', 'Template'],
    result_diagram_code: ML_TEMPLATES['Fraud Detection (Real-time)'],
    likes: 580,
    views: 4000,
    created_at: '2025-04-05T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-rag-pipeline',
    title: 'RAG Pipeline',
    author: 'ArchiGram',
    description: 'Basic Retrieval-Augmented Generation pipeline with vector database and LLM.',
    prompt_text:
      'Design a simple RAG pipeline. Show a user query being embedded and searched against a vector database for top-K chunks, then fed alongside the original query into an LLM context window to generate an answer. Include a data ingestion subgraph showing documents being split and embedded.',
    domain: 'ml',
    tags: ['RAG', 'Vector DB', 'LLM', 'Template'],
    result_diagram_code: ML_TEMPLATES['RAG Pipeline'],
    likes: 640,
    views: 4400,
    created_at: '2025-04-25T00:00:00.000Z',
  },

  // -- C4_TEMPLATES (4) --
  {
    id: 'seed-prompt-template-c4-context',
    title: 'C4 Context Diagram',
    author: 'ArchiGram',
    description: 'C4 model context level showing system boundaries and external actors.',
    prompt_text:
      'Create a C4 Context diagram showing a software system with external actors (User), and external systems (Email Service, Payment Gateway). Show how the user interacts with the web application and how it connects to external services.',
    domain: 'general',
    tags: ['C4 Model', 'Context Diagram', 'Architecture', 'Template'],
    result_diagram_code: C4_TEMPLATES['C4 Context'],
    likes: 420,
    views: 2900,
    created_at: '2025-02-20T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-c4-container',
    title: 'C4 Container Diagram',
    author: 'ArchiGram',
    description: 'C4 model container level showing web app, API server, and database.',
    prompt_text:
      'Create a C4 Container diagram for a software system. Show a Web Application connecting via REST/HTTPS to an API Server, which connects via SQL to a Database. All within the system boundary.',
    domain: 'general',
    tags: ['C4 Model', 'Container Diagram', 'Architecture', 'Template'],
    result_diagram_code: C4_TEMPLATES['C4 Container'],
    likes: 350,
    views: 2400,
    created_at: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-c4-component',
    title: 'C4 Component Diagram',
    author: 'ArchiGram',
    description: 'C4 model component level showing controller, service, and repository layers.',
    prompt_text:
      'Create a C4 Component diagram for an API Server. Show the internal components: Controller calling a Service Layer, which uses a Repository. Show the layered architecture within the API server boundary.',
    domain: 'general',
    tags: ['C4 Model', 'Component Diagram', 'Architecture', 'Template'],
    result_diagram_code: C4_TEMPLATES['C4 Component'],
    likes: 310,
    views: 2000,
    created_at: '2025-01-22T00:00:00.000Z',
  },
  {
    id: 'seed-prompt-template-c4-code',
    title: 'C4 Code (UML Class)',
    author: 'ArchiGram',
    description: 'C4 code level with UML class diagram showing Order, OrderItem, and Payment.',
    prompt_text:
      'Create a UML class diagram at the C4 code level. Show an Order class with id, status, create(), and updateStatus() methods. OrderItem with productId, quantity, and price. Payment with process() and refund() methods. Show Order containing many OrderItems and using Payment.',
    domain: 'general',
    tags: ['C4 Model', 'UML', 'Class Diagram', 'Template'],
    result_diagram_code: C4_TEMPLATES['C4 Code (UML)'],
    likes: 280,
    views: 1800,
    created_at: '2025-01-08T00:00:00.000Z',
  },
  // Popular community diagrams mapped to seed prompts
  ...POPULAR_SEED_PROMPTS,
];
