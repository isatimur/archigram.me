import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { PromptDomain } from '../types.ts';
import { publishPrompt } from '../lib/firestore/prompts.ts';
import { analytics } from '../utils/analytics.ts';
import { toast } from 'sonner';

interface PublishPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  resultCode?: string;
  username: string;
  userId?: string;
}

const DOMAIN_OPTIONS: { value: PromptDomain; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'devops', label: 'DevOps' },
  { value: 'ml', label: 'ML/AI' },
];

const PublishPromptModal: React.FC<PublishPromptModalProps> = ({
  isOpen,
  onClose,
  promptText,
  resultCode,
  username,
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<PromptDomain>('general');
  const [tags, setTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !promptText.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsPublishing(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const success = await publishPrompt({
      title: title.trim(),
      author: username || 'Anonymous',
      description: description.trim(),
      prompt_text: promptText,
      domain,
      tags: tagsArray,
      result_diagram_code: resultCode,
      user_id: userId,
    });

    setIsPublishing(false);

    if (success) {
      analytics.promptPublished();
      toast.success('Prompt published to marketplace!');
      onClose();
    } else {
      toast.error('Failed to publish prompt. Please sign in and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:sparkles" className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Share Prompt</h3>
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
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Microservices E-Commerce System"
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this prompt generate?"
              rows={2}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as PromptDomain)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="microservices, aws, kafka"
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Prompt Preview */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Prompt (from your chat)
            </label>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5 max-h-32 overflow-y-auto">
              <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{promptText}</p>
            </div>
          </div>

          {resultCode && (
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Result diagram code will be included
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={isPublishing || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Icon icon="lucide:sparkles" className="w-4 h-4" />
                Publish Prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishPromptModal;
