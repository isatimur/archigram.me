import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ArchiGram.ai <noreply@archigram.ai>';

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
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: to, subject, html',
      });
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[API /send-email] Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', message: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('[API /send-email]', err);
    const message = err instanceof Error ? err.message : 'Email sending failed';
    return res.status(500).json({ error: 'Internal server error', message });
  }
}
