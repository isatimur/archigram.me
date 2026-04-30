import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fixDiagramSyntax } from '../../services/geminiService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const { code, errorMessage } = body;

    if (!code || typeof code !== 'string') {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'Missing or invalid "code" field' });
    }
    if (!errorMessage || typeof errorMessage !== 'string') {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'Missing or invalid "errorMessage" field' });
    }

    const fixed = await fixDiagramSyntax(code, errorMessage);
    return res.status(200).json({ code: fixed });
  } catch (err: unknown) {
    console.error('[API /v1/fix-syntax]', err);
    const message = err instanceof Error ? err.message : 'Fix failed';
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
