import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Supabase not configured for newsletter.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const { error } = await supabase.from('email_subscribers').upsert(
      {
        email: email.toLowerCase().trim(),
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    );

    if (error) {
      console.error('[API /newsletter] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to subscribe', message: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('[API /newsletter]', err);
    const message = err instanceof Error ? err.message : 'Subscription failed';
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
