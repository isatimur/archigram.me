import type { VercelRequest, VercelResponse } from '@vercel/node';
import { imageToDiagram } from '../../services/geminiService.ts';

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
    const { image, mimeType } = body;

    if (!image || typeof image !== 'string') {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'Missing or invalid "image" field' });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'Missing or invalid "mimeType" field' });
    }

    const code = await imageToDiagram(image, mimeType);
    return res.status(200).json({ code });
  } catch (err: unknown) {
    console.error('[API /v1/image-to-diagram]', err);
    const message = err instanceof Error ? err.message : 'Image conversion failed';
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
