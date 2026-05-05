import { Icon } from '@iconify/react';
import React from 'react';
import { User } from '../types.ts';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishData: { title: string; author: string; description: string; tags: string };
  onPublishDataChange: (data: {
    title: string;
    author: string;
    description: string;
    tags: string;
  }) => void;
  onSubmit: () => Promise<void>;
  isPublishing: boolean;
  code: string;
  user: User | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  publishData,
  onPublishDataChange,
  onSubmit,
  isPublishing,
  code,
  user: _user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden animate-slide-up ring-1 ring-white/10">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon icon="lucide:upload-cloud" className="w-5 h-5 text-primary" />
            Publish to Community
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={publishData.title}
              onChange={(e) => onPublishDataChange({ ...publishData, title: e.target.value })}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="My Awesome Diagram"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Author Name
            </label>
            <input
              type="text"
              value={publishData.author}
              onChange={(e) => onPublishDataChange({ ...publishData, author: e.target.value })}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Your Name (Optional)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={publishData.description}
              onChange={(e) => onPublishDataChange({ ...publishData, description: e.target.value })}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
              placeholder="Briefly describe what this diagram shows..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Tags (Comma Separated)
            </label>
            <input
              type="text"
              value={publishData.tags}
              onChange={(e) => onPublishDataChange({ ...publishData, tags: e.target.value })}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Architecture, API, Flowchart..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surface-hover/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isPublishing || !publishData.title.trim() || !code.trim()}
            className="px-6 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="lucide:upload-cloud" className="w-4 h-4" />
            )}
            {isPublishing ? 'Publishing...' : 'Publish Diagram'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
