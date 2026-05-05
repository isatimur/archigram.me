'use client';

import React, { lazy, Suspense } from 'react';
import { useUI } from '@/lib/contexts/UIContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import type { AuditReport } from '@/services/geminiService';
import type { AppView, ViewMode } from '@/types';

const AuthModal = lazy(() => import('./AuthModal'));
const PublishModal = lazy(() => import('./PublishModal'));
const PublishPromptModal = lazy(() => import('./PublishPromptModal'));
const ImageImportModal = lazy(() => import('./ImageImportModal'));
const AuditModal = lazy(() => import('./AuditModal'));
const CommandPalette = lazy(() => import('./CommandPalette'));
const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcutsModal'));

export type Props = {
  auditReport: AuditReport | null;
  isAuditing: boolean;
  isPublishing: boolean;
  publishData: { title: string; author: string; description: string; tags: string };
  setPublishData: (data: Props['publishData']) => void;
  submitPublish: () => Promise<void>;
  pendingPromptText: string;
  pendingPromptResultCode: string | undefined;
  consumeExternalPrompt?: () => void;
  onScanImage: () => void;
  onNavigate?: (view: AppView) => void;
  onNewProject?: () => void;
  onExportPng?: () => void;
  onExportSvg?: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  onDuplicate?: () => void;
  onAudit?: () => void;
};

export default function ModalRenderer({
  auditReport,
  isAuditing,
  isPublishing,
  publishData,
  setPublishData,
  submitPublish,
  pendingPromptText,
  pendingPromptResultCode,
  consumeExternalPrompt: _consumeExternalPrompt,
  onScanImage,
  onNavigate,
  onNewProject,
  onExportPng,
  onExportSvg,
  onShare,
  onPublish,
  onDuplicate,
  onAudit,
}: Props) {
  const {
    isPublishModalOpen,
    setIsPublishModalOpen,
    isImageImportModalOpen,
    setIsImageImportModalOpen,
    isAuditModalOpen,
    setIsAuditModalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isPublishPromptModalOpen,
    setIsPublishPromptModalOpen,
    viewMode,
    setViewMode,
  } = useUI();
  const { isAuthModalOpen, setIsAuthModalOpen, onAuthSuccess, authModalMode, user } = useAuth();
  const { code, handleImageImport } = useEditor();

  return (
    <>
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={onAuthSuccess}
            initialMode={authModalMode}
          />
        </Suspense>
      )}
      {isPublishModalOpen && (
        <Suspense fallback={null}>
          <PublishModal
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            publishData={publishData}
            onPublishDataChange={setPublishData}
            onSubmit={submitPublish}
            isPublishing={isPublishing}
            code={code}
            user={user}
          />
        </Suspense>
      )}
      {isImageImportModalOpen && (
        <Suspense fallback={null}>
          <ImageImportModal
            onClose={() => setIsImageImportModalOpen(false)}
            onImport={handleImageImport}
          />
        </Suspense>
      )}
      {isAuditModalOpen && (
        <Suspense fallback={null}>
          <AuditModal
            onClose={() => setIsAuditModalOpen(false)}
            isLoading={isAuditing}
            report={auditReport}
          />
        </Suspense>
      )}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={onNavigate ?? (() => {})}
            onNewProject={onNewProject ?? (() => {})}
            onExportPng={onExportPng ?? (() => {})}
            onExportSvg={onExportSvg ?? (() => {})}
            onShare={onShare ?? (() => {})}
            onPublish={onPublish ?? (() => {})}
            onDuplicate={onDuplicate ?? (() => {})}
            onAudit={onAudit ?? (() => {})}
            onScanImage={onScanImage}
            viewMode={viewMode as ViewMode}
            setViewMode={setViewMode}
          />
        </Suspense>
      )}
      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        </Suspense>
      )}
      {isPublishPromptModalOpen && (
        <Suspense fallback={null}>
          <PublishPromptModal
            isOpen={isPublishPromptModalOpen}
            onClose={() => setIsPublishPromptModalOpen(false)}
            promptText={pendingPromptText}
            resultCode={pendingPromptResultCode}
            username={user?.username || ''}
          />
        </Suspense>
      )}
    </>
  );
}
