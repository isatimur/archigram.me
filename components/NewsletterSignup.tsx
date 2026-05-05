import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { analytics } from '../utils/analytics.ts';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to subscribe');
      }

      analytics.newsletterSubscribed();
      setIsSubscribed(true);
      toast.success('Subscribed! Check your inbox for updates.');
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <Icon icon="lucide:check" className="w-4 h-4" />
        <span className="text-sm">Subscribed!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <div className="relative flex-1">
        <Icon
          icon="lucide:mail"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {isSubmitting ? (
          <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
        ) : (
          'Subscribe'
        )}
      </button>
    </form>
  );
};

export default NewsletterSignup;
