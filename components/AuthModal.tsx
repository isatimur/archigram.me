import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, signInWithGoogle } from '@/lib/firebase/client';
import { User as UserType } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isFirebaseConfigured) {
        setError('Firebase is not configured. Add your Firebase web app environment variables.');
        return;
      }
      const { user, error: authError } = await signInWithGoogle();
      if (authError) {
        setError(authError);
        return;
      }
      if (user) {
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/30">
          <h3 id="auth-dialog-title" className="text-lg font-bold text-text">
            {mode === 'signin' ? 'Sign in with Google' : 'Create account with Google'}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              <Icon icon="lucide:alert-circle" className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-text-muted">
            ArchiGram now uses Firebase Authentication. Continue with your Google account to sync
            diagrams and publish community content.
          </p>

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border rounded-lg text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Icon icon="logos:google-icon" className="w-5 h-5" />
                <span className="font-medium">Continue with Google</span>
              </>
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center text-sm text-text-muted">
            {mode === 'signin' ? (
              <>
                Need an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Continue with Google
                </button>
              </>
            ) : (
              <>
                Already signed up?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
