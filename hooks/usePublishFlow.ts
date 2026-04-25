import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { analytics } from '@/utils/analytics';
import { publishDiagram } from '@/lib/firestore/diagrams';
import { AUTHOR_KEY } from '@/constants';
import type { AuditReport } from '@/services/geminiService';
import type { Project, User as UserType } from '@/types';

type Params = {
  code: string;
  activeProjectId: string;
  projects: Project[];
  user: UserType | null | undefined;
  requireAuth: (action: () => void) => void;
  setIsPublishModalOpen: (open: boolean) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  setIsPublishPromptModalOpen: (open: boolean) => void;
};

export function usePublishFlow({
  code,
  activeProjectId,
  projects,
  user,
  requireAuth,
  setIsPublishModalOpen,
  setIsAuditModalOpen,
  setIsPublishPromptModalOpen,
}: Params) {
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishData, setPublishData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
  });
  const [pendingPromptText, setPendingPromptText] = useState('');
  const [pendingPromptResultCode, setPendingPromptResultCode] = useState<string | undefined>();

  const openPublishModal = useCallback(() => {
    requireAuth(() => {
      const activeP = projects.find((p) => p.id === activeProjectId);
      setPublishData({
        title: activeP?.name || '',
        author: localStorage.getItem(AUTHOR_KEY) || '',
        description: '',
        tags: '',
      });
      setIsPublishModalOpen(true);
    });
  }, [requireAuth, projects, activeProjectId, setIsPublishModalOpen]);

  const submitPublish = useCallback(async () => {
    if (!publishData.title.trim() || !code.trim()) return;
    setIsPublishing(true);
    if (publishData.author) localStorage.setItem(AUTHOR_KEY, publishData.author);
    const tagsArray = publishData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const success = await publishDiagram({
      title: publishData.title,
      author: user?.username || publishData.author || 'Anonymous',
      description: publishData.description,
      code,
      tags: tagsArray,
      user_id: user?.id ?? null,
    });
    setIsPublishing(false);
    if (success) {
      analytics.diagramPublished(tagsArray);
      setIsPublishModalOpen(false);
      toast.success('Diagram successfully published to Gallery!');
    } else {
      toast.error('Failed to publish. Try again.');
    }
  }, [publishData, code, user, setIsPublishModalOpen]);

  const handleAudit = useCallback(async () => {
    analytics.auditRun();
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditReport(null);
    try {
      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Audit failed');
      setAuditReport(await res.json());
    } catch (e) {
      console.error(e);
      toast.error('Audit failed. Please try again.');
      setIsAuditModalOpen(false);
    } finally {
      setIsAuditing(false);
    }
  }, [code, setIsAuditModalOpen]);

  const handleOpenPublishPrompt = useCallback(
    (promptText: string, resultCode?: string) => {
      setPendingPromptText(promptText);
      setPendingPromptResultCode(resultCode);
      setIsPublishPromptModalOpen(true);
    },
    [setIsPublishPromptModalOpen]
  );

  const consumeExternalPrompt = useCallback(() => {
    setPendingPromptText('');
    setPendingPromptResultCode(undefined);
  }, []);

  return {
    auditReport,
    isAuditing,
    isPublishing,
    publishData,
    setPublishData,
    pendingPromptText,
    pendingPromptResultCode,
    openPublishModal,
    submitPublish,
    handleAudit,
    handleOpenPublishPrompt,
    consumeExternalPrompt,
  };
}
