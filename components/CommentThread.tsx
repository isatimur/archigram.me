import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Comment, User } from '../types.ts';
import { fetchComments, addComment, deleteComment } from '../lib/firestore/comments.ts';
import { analytics } from '../utils/analytics.ts';

interface CommentThreadProps {
  diagramId: string;
  user: User | null;
  onOpenAuth?: () => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ diagramId, user, onOpenAuth }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await fetchComments(diagramId);
      setComments(data);
      setIsLoading(false);
    };
    load();
  }, [diagramId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      onOpenAuth?.();
      return;
    }

    setIsSubmitting(true);
    const comment = await addComment(
      diagramId,
      newComment.trim(),
      user.username || 'Anonymous',
      user.id
    );
    setIsSubmitting(false);

    if (comment) {
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      analytics.commentAdded();
    } else {
      toast.error('Failed to post comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(diagramId, commentId);
    if (success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      analytics.commentDeleted();
      toast.success('Comment deleted');
    } else {
      toast.error('Failed to delete comment');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="border-t border-border/50 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon icon="lucide:message-circle" className="w-4 h-4 text-text-muted" />
        <span className="text-xs font-medium text-text-muted">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
                {comment.author.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text">@{comment.author}</span>
                  <span className="text-[10px] text-text-muted">{timeAgo(comment.created_at)}</span>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all ml-auto"
                      title="Delete comment"
                    >
                      <Icon icon="lucide:trash-2" className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="p-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Icon icon="lucide:send" className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default CommentThread;
