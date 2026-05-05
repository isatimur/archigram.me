/**
 * RAG (Retrieval-Augmented Generation) Client
 *
 * Handles communication with the RAG backend service for retrieving
 * company-specific context to enhance AI diagram generation.
 *
 * Features:
 * - Timeout handling (default 5s)
 * - Graceful degradation (returns empty on error)
 * - Feature flag support (VITE_RAG_ENABLED)
 * - Type-safe API interface
 */

// Environment configuration
const RAG_URL = process.env.VITE_RAG_URL || 'http://localhost:8000';
const RAG_ENABLED = process.env.VITE_RAG_ENABLED === 'true';
const RAG_TIMEOUT_MS = 5000; // 5 second timeout

/**
 * A single search result chunk from the knowledge base
 */
export interface RAGChunk {
  /** The text content of the chunk */
  text: string;
  /** Source document identifier */
  source: string;
  /** Similarity score (0-1) */
  score: number;
  /** Document type (glossary, architecture_guide, etc.) */
  doc_type?: string;
}

/**
 * Response from the RAG search endpoint
 */
export interface RAGSearchResponse {
  /** Matching chunks ordered by relevance */
  chunks: RAGChunk[];
  /** Original query */
  query: string;
}

/**
 * Options for RAG search
 */
export interface RAGSearchOptions {
  /** Number of results to return (default: 5) */
  topK?: number;
  /** Company ID for filtering (multi-tenant) */
  companyId?: string;
  /** Document type filter */
  docType?: string;
  /** Minimum similarity score (default: 0.5) */
  scoreThreshold?: number;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Check if RAG is enabled
 */
export function isRAGEnabled(): boolean {
  return RAG_ENABLED;
}

/**
 * Check if RAG service is healthy
 */
export async function checkRAGHealth(): Promise<boolean> {
  if (!RAG_ENABLED) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${RAG_URL}/health/ready`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Search the RAG knowledge base for relevant context
 *
 * @param query - Search query (typically the user's diagram prompt)
 * @param options - Search options
 * @returns Search response with matching chunks, or empty on error
 *
 * @example
 * ```ts
 * const result = await ragSearch("user authentication flow", { topK: 3 });
 * if (result.chunks.length > 0) {
 *   // Use chunks for context
 * }
 * ```
 */
export async function ragSearch(
  query: string,
  options: RAGSearchOptions = {}
): Promise<RAGSearchResponse> {
  // Return empty if RAG is disabled
  if (!RAG_ENABLED) {
    return { chunks: [], query };
  }

  const { topK = 5, companyId, docType, scoreThreshold = 0.5, timeout = RAG_TIMEOUT_MS } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${RAG_URL}/api/v1/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: topK,
        company_id: companyId,
        doc_type: docType,
        score_threshold: scoreThreshold,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Service unavailable - graceful degradation
    if (response.status === 503) {
      console.warn('[RAG] Service unavailable, falling back to non-RAG mode');
      return { chunks: [], query };
    }

    if (!response.ok) {
      console.error('[RAG] Search failed:', response.status, response.statusText);
      return { chunks: [], query };
    }

    const data: RAGSearchResponse = await response.json();
    return data;
  } catch (error) {
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[RAG] Search timed out, falling back to non-RAG mode');
    } else {
      console.error('[RAG] Search error:', error);
    }

    // Graceful degradation - return empty results
    return { chunks: [], query };
  }
}

/**
 * Format RAG chunks as context text for AI prompt injection
 *
 * @param chunks - Array of RAG chunks
 * @returns Formatted context string, or empty string if no chunks
 */
export function formatRAGContext(chunks: RAGChunk[]): string {
  if (!chunks || chunks.length === 0) {
    return '';
  }

  const contextParts = chunks.map((chunk, index) => {
    const sourceInfo = chunk.source ? ` (from: ${chunk.source})` : '';
    return `[${index + 1}]${sourceInfo}\n${chunk.text}`;
  });

  return `

--- COMPANY CONTEXT (Use this terminology and patterns) ---
${contextParts.join('\n\n')}
--- END COMPANY CONTEXT ---`;
}

/**
 * Get RAG context for a prompt
 *
 * Convenience function that searches and formats in one call.
 *
 * @param prompt - The user's diagram prompt
 * @param options - Search options
 * @returns Formatted context string to append to system instruction
 */
export async function getRAGContext(
  prompt: string,
  options: RAGSearchOptions = {}
): Promise<string> {
  const result = await ragSearch(prompt, options);
  return formatRAGContext(result.chunks);
}

/**
 * RAG service statistics
 */
export interface RAGStats {
  collection: string;
  vectors_count: number;
  points_count: number;
  status: string;
}

/**
 * Get RAG service statistics
 *
 * @returns Statistics about the knowledge base, or null if unavailable
 */
export async function getRAGStats(): Promise<RAGStats | null> {
  if (!RAG_ENABLED) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${RAG_URL}/api/v1/rag/stats`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}
