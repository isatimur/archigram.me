import { GoogleGenAI } from '@google/genai';
import { DOMAIN_INSTRUCTIONS } from '../constants.js';
import type { CopilotDomain } from '../types.js';
import { getRAGContext, isRAGEnabled } from './ragClient.js';

const GENERATION_MODEL = 'gemini-3.1-pro-preview';
const VISION_MODEL = 'gemini-2.5-flash-image';

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      throw new Error('API Key is missing. Please ensure process.env.API_KEY is available.');
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export interface GenerateDiagramOptions {
  /** Enable RAG context injection (default: true if RAG enabled) */
  useRAG?: boolean;
  /** Company ID for RAG filtering (multi-tenant) */
  companyId?: string;
}

export const generateDiagramCode = async (
  prompt: string,
  currentCode?: string,
  domain: CopilotDomain = 'General',
  options: GenerateDiagramOptions = {}
): Promise<string> => {
  const ai = getAI();
  let instruction = DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS['General'];

  // Inject RAG context if enabled
  const { useRAG = isRAGEnabled(), companyId } = options;
  if (useRAG) {
    try {
      const ragContext = await getRAGContext(prompt, {
        topK: 5,
        companyId,
        timeout: 5000,
      });
      if (ragContext) {
        instruction = instruction + ragContext;
      }
    } catch (error) {
      // Graceful degradation - continue without RAG context
      console.warn('RAG context retrieval failed, continuing without:', error);
    }
  }

  const fullPrompt = currentCode
    ? `Current Diagram Code:\n\`\`\`mermaid\n${currentCode}\n\`\`\`\n\nUser Request: ${prompt}\n\nUpdate the diagram based on the request. Return the FULL updated mermaid code.`
    : `User Request: ${prompt}\n\nGenerate a mermaid diagram for this request.`;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.2, // Low temperature for deterministic code generation
      },
    });

    return extractMermaidCode(response.text || '');
  } catch (error) {
    console.error('Gemini 3 Flash Generation Error:', error);
    throw error;
  }
};

export interface AuditReport {
  score: number;
  summary: string;
  risks: { severity: 'High' | 'Medium' | 'Low'; title: string; description: string }[];
  strengths: string[];
  improvements: string[];
}

export const auditDiagram = async (code: string): Promise<AuditReport> => {
  const ai = getAI();
  const prompt = `You are a Principal Software Architect and Security Engineer.
    Analyze the following Mermaid.js architecture diagram.
    
    Diagram Code:
    \`\`\`mermaid
    ${code}
    \`\`\`
    
    Perform a rigorous architectural audit. Look for:
    1. Single Points of Failure (SPOF).
    2. Security Risks (e.g., missing WAF, databases exposed to public, unencrypted flows).
    3. Scalability Bottlenecks.
    4. Missing Industry Standards (Caching, Load Balancing, Monitoring).

    Return the result as a raw JSON object (no markdown formatting) with this structure:
    {
      "score": number (0-100),
      "summary": "Short executive summary of the architecture health.",
      "risks": [
         { "severity": "High"|"Medium"|"Low", "title": "Risk Title", "description": "Why this is bad" }
      ],
      "strengths": ["List of good patterns found"],
      "improvements": ["Specific recommendations to fix risks"]
    }`;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    // Cleanup if the model adds markdown despite instructions
    const cleanJson = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Audit Error:', error);
    throw new Error('Failed to audit diagram.', { cause: error });
  }
};

export const imageToDiagram = async (base64Image: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  // Clean base64 string if it contains the data header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp|heic);base64,/, '');

  const prompt = `You are an expert System Architect and Mermaid.js specialist.
    Analyze the provided image. It represents a software architecture, flowchart, or mindmap.
    
    Your Goal: Convert this visual diagram into valid Mermaid.js syntax.
    
    Rules:
    1. Identify all nodes, actors, and databases. Use appropriate shapes (e.g., cylinders for DBs).
    2. Identify all connections and labels on arrows.
    3. If text is illegible, infer logical labels based on context.
    4. Return ONLY the Mermaid code block. No markdown, no explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL, // Specialized for vision tasks
      contents: {
        parts: [{ inlineData: { mimeType: mimeType, data: cleanBase64 } }, { text: prompt }],
      },
    });

    return extractMermaidCode(response.text || '');
  } catch (error) {
    console.error('Gemini Vision Error:', error);
    throw error;
  }
};

export const fixDiagramSyntax = async (code: string, errorMessage: string): Promise<string> => {
  const ai = getAI();
  const prompt = `You are an expert Mermaid.js debugger.
The user's diagram code has a syntax error.

Error Message: "${errorMessage}"

Current Code:
\`\`\`mermaid
${code}
\`\`\`

Task: Fix the syntax error in the code. 
Rules:
1. Return ONLY the corrected Mermaid.js code. 
2. Do not add markdown backticks if possible, or ensure they are standard.
3. Maintain the original logic/structure, only fix the syntax.`;

  try {
    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        temperature: 0.1, // Very low temperature for precise fixes
      },
    });

    return extractMermaidCode(response.text || '');
  } catch (error) {
    console.error('Gemini Syntax Fix Error:', error);
    throw error;
  }
};

// Helper to extract code from response
const extractMermaidCode = (text: string): string => {
  // Extract code from markdown blocks
  const match = text.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback if no code block found but text resembles mermaid
  if (
    text.includes('sequenceDiagram') ||
    text.includes('graph ') ||
    text.includes('classDiagram') ||
    text.includes('flowchart')
  ) {
    return text.trim();
  }

  // If it looks like raw code (starts with a keyword)
  const lines = text.split('\n');
  if (lines.length > 0 && /^[a-z]+/.test(lines[0])) {
    return text.trim();
  }

  throw new Error('No valid Mermaid code generated.');
};
