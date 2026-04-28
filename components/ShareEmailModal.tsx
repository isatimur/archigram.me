import { Icon } from '@iconify/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { analytics } from '../utils/analytics.ts';

interface ShareEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramTitle: string;
  diagramUrl: string;
  senderName: string;
}

const ShareEmailModal: React.FC<ShareEmailModalProps> = ({
  isOpen,
  onClose,
  diagramTitle,
  diagramUrl,
  senderName,
}) => {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipients(['']);
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addRecipient = () => {
    if (recipients.length < 5) {
      setRecipients([...recipients, '']);
    }
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const validEmails = recipients.filter((r) => r.trim() && r.includes('@'));

  const handleSend = async () => {
    if (validEmails.length === 0) {
      toast.error('Please enter at least one valid email address.');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/share-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validEmails,
          senderName,
          message: message.trim(),
          diagramTitle,
          diagramUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send');
      }

      analytics.diagramSharedViaEmail();
      toast.success(
        `Diagram shared with ${validEmails.length} recipient${validEmails.length > 1 ? 's' : ''}!`
      );
      onClose();
    } catch (err) {
      console.error('Share email error:', err);
      toast.error('Failed to send email. The email service may not be configured.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:mail" className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Share via Email</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Diagram Preview */}
          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-zinc-500 mb-1">Sharing</p>
            <p className="text-sm text-white font-medium">{diagramTitle}</p>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Recipients *</label>
            <div className="space-y-2">
              {recipients.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateRecipient(i, e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(i)}
                      className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                      <Icon icon="lucide:x" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {recipients.length < 5 && (
              <button
                onClick={addRecipient}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Icon icon="lucide:plus" className="w-3 h-3" />
                Add recipient
              </button>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Check out this architecture diagram I created..."
              rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || validEmails.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Icon icon="lucide:send" className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareEmailModal;
