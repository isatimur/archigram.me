import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ArchiGram.ai <noreply@archigram.ai>';

function buildWelcomeEmailHtml(username: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:12px;padding:12px;margin-bottom:12px;">
        <span style="font-size:24px;">&#128640;</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:8px 0 0;">Welcome to ArchiGram.ai</h1>
    </div>
    <div style="background-color:#18181b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:24px;">
      <p style="color:#d4d4d8;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hey ${username}! Thanks for joining ArchiGram.ai &mdash; the AI-powered platform for creating architecture diagrams.
      </p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Here&rsquo;s what you can do:
      </p>
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;margin-bottom:16px;">
          <span style="color:#6366f1;font-size:18px;margin-right:12px;line-height:1;">&#9889;</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">AI-Powered Generation</p>
            <p style="color:#a1a1aa;font-size:13px;margin:0;">Describe your system and get production-ready Mermaid, PlantUML, or BPMN diagrams instantly.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;margin-bottom:16px;">
          <span style="color:#a855f7;font-size:18px;margin-right:12px;line-height:1;">&#127912;</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">Community Gallery</p>
            <p style="color:#a1a1aa;font-size:13px;margin:0;">Explore and fork architecture diagrams shared by the community.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;margin-bottom:16px;">
          <span style="color:#f59e0b;font-size:18px;margin-right:12px;line-height:1;">&#10024;</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 4px;">Prompt Marketplace</p>
            <p style="color:#a1a1aa;font-size:13px;margin:0;">Discover and share AI prompts that generate great architecture diagrams.</p>
          </div>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="https://archigram.ai/#app" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-right:8px;">
          Start Creating &rarr;
        </a>
        <a href="https://archigram.ai/#gallery" style="display:inline-block;background:transparent;color:#6366f1;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #6366f1;">
          Browse Gallery
        </a>
      </div>
    </div>
    <p style="color:#52525b;font-size:12px;text-align:center;margin:0;">
      <a href="https://archigram.ai" style="color:#6366f1;text-decoration:none;">ArchiGram.ai</a> &mdash; AI-powered architecture diagrams
    </p>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'RESEND_API_KEY not configured.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { email, username } = body;

    if (!email) {
      return res.status(400).json({ error: 'email is required.' });
    }

    const html = buildWelcomeEmailHtml(username || 'there');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Welcome to ArchiGram.ai!',
      html,
    });

    if (error) {
      console.error('[API /welcome-email] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', message: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('[API /welcome-email]', err);
    const message = err instanceof Error ? err.message : 'Welcome email failed';
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
