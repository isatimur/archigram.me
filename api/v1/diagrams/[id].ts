import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Missing diagram id',
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in Vercel.',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('community_diagrams')
      .select('id, title, author, description, code, tags, likes, views, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Diagram not found',
      });
    }

    return res.status(200).json({
      id: data.id,
      title: data.title,
      author: data.author || 'Anonymous',
      description: data.description || '',
      code: data.code,
      tags: data.tags || [],
      likes: data.likes || 0,
      views: data.views || 0,
      createdAt: data.created_at,
    });
  } catch (err: unknown) {
    console.error('[API /v1/diagrams/:id]', err);
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return res.status(500).json({
      error: 'Internal server error',
      message,
    });
  }
}
