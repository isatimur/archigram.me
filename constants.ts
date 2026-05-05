export const INITIAL_CODE = `sequenceDiagram
    autonumber
    box "User Interaction" #11111b
        participant User
        participant UI as Chat Interface
    end
    box "Edge Services" #181825
        participant Edge as Global Edge
        participant WAF as WAF/Shield
    end
    box "AI Platform" #11111b
        participant API as API Gateway
        participant Orch as Orchestrator
        participant Cache as Semantic Cache
    end
    box "Inference Grid" #181825
        participant RAG as Vector Store
        participant Model as LLM Engine
        participant Safety as Safety Layer
    end

    Note over User, Safety: ⚡ GenAI Request Lifecycle (High-Performance Pipeline)

    User->>UI: "Design a microservices architecture"
    UI->>Edge: POST /chat/completions (Stream)
    Edge->>WAF: Inspect Traffic (Rate Limit/Bot)
    WAF-->>API: Forward Request

    API->>Orch: Init Session & Trace

    rect rgb(30, 30, 46)
        note right of Orch: Optimization & Safety Phase
        Orch->>Cache: Compute Embedding & Search

        alt Semantic Cache Hit
            Cache-->>Orch: Return Cached Response
            Orch-->>UI: Stream Cached Tokens
        else Cache Miss
            Orch->>Safety: Pre-Generation Check (PII/Jailbreak)
            Safety-->>Orch: Safe to Process

            par Context Augmentation
                Orch->>RAG: Hybrid Search (Top-K)
                RAG-->>Orch: Retrieved Chunks
            and Session State
                Orch->>Orch: Load History & User Prefs
            end

            Orch->>Model: Invoke Model (Context + Prompt)
            activate Model
            Model->>Model: Load LoRA Adapters
            Model->>Model: Speculative Decoding

            loop Token Streaming
                Model-->>API: Yield Token
                API-->>UI: SSE Chunk
            end
            deactivate Model

            Orch->>Cache: Async Cache Write
        end
    end

    UI->>User: Render Markdown Response`;

// Phase 1: Domain-Specific Copilot Contexts
export const DOMAIN_INSTRUCTIONS: Record<string, string> = {
  General: `You are ArchiGram.ai, an expert Technical Architect.
Rules:
1. Output ONLY valid Mermaid.js code inside a markdown code block.
2. Prioritize clarity and standard architectural patterns.`,

  Healthcare: `You are ArchiGram.ai (Healthcare Edition), an expert in HIPAA-compliant architectures and HL7/FHIR standards.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Emphasize data privacy, encryption at rest/transit, and PHI isolation.
3. Use terms like "EHR Integration", "FHIR Store", "De-identification Service".
4. Suggest secure enclaves for ML training on patient data.`,

  Finance: `You are ArchiGram.ai (FinTech Edition), an expert in PCI-DSS, high-frequency trading, and fraud detection systems.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Focus on ACID transactions, ledger immutability, and low-latency pipelines.
3. Use components like "Ledger", "Risk Engine", "KYC Service", "Audit Log".
4. Ensure audit trails are visualized in workflows.`,

  'E-commerce': `You are ArchiGram.ai (Retail Edition), an expert in high-scale recommendation engines and inventory management.
Rules:
1. Output ONLY valid Mermaid.js code.
2. Focus on caching (Redis), CDNs, and event-driven architecture (Kafka) for inventory updates.
3. Include "Recommendation Engine", "User Behavior Tracker", "Cart Service".`,
};

export const STORAGE_KEY = 'archigram_diagram_v2';
export const PROJECTS_STORAGE_KEY = 'archigram_projects';
export const LIKED_IDS_KEY = 'archigram_liked_ids';
export const LIKED_PROMPT_IDS_KEY = 'archigram_liked_prompt_ids';
export const AUTHOR_KEY = 'archigram_author';

// Re-export extracted data modules for backwards compatibility
export { ML_TEMPLATES, TEMPLATES, C4_TEMPLATES } from './data/templates.js';
export { COMMUNITY_DATA } from './data/communityDiagrams.js';
export { FAQ_DATA } from './data/faq.js';
export { SEED_PROMPTS } from './data/seedPrompts.js';
