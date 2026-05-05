import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDiagramCode } from '../../services/geminiService.js';
import type { CopilotDomain } from '../../types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure API key is available (Vercel may use different env var names)
  const apiKey =
    process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Gemini API key not configured. Set GEMINI_API_KEY in Vercel.',
    });
  }
  process.env.API_KEY = apiKey;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { prompt, currentCode, domain = 'General' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing or invalid "prompt" field',
      });
    }

    const code = await generateDiagramCode(
      prompt,
      currentCode,
      (domain as CopilotDomain) || 'General',
      { useRAG: false }
    );

    return res.status(200).json({ code });
  } catch (err: unknown) {
    console.error('[API /v1/generate]', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return res.status(500).json({
      error: 'Internal server error',
      message,
    });
  }
}
