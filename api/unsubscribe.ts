import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function buildUnsubscribeHtml(success: boolean) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribe - ArchiGram.ai</title></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:40px;">
    <h1 style="color:#ffffff;font-size:24px;margin-bottom:16px;">
      ${success ? 'Unsubscribed' : 'Something went wrong'}
    </h1>
    <p style="color:#a1a1aa;font-size:16px;margin-bottom:24px;">
      ${success ? "You've been removed from the ArchiGram.ai newsletter." : 'Please try again or contact support.'}
    </p>
    <a href="https://archigram.ai" style="color:#6366f1;text-decoration:none;font-size:14px;">
      &larr; Back to ArchiGram.ai
    </a>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support both GET (email link) and POST
  const email =
    req.method === 'GET'
      ? (req.query.email as string)
      : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}).email;

  if (!email || typeof email !== 'string') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(buildUnsubscribeHtml(false));
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(503).send(buildUnsubscribeHtml(false));
  }

  try {
    const { error } = await supabase
      .from('email_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.error('[API /unsubscribe] Supabase error:', error);
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(buildUnsubscribeHtml(false));
    }

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(buildUnsubscribeHtml(true));
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('[API /unsubscribe]', err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(buildUnsubscribeHtml(false));
  }
}
