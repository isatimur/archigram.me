import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { analytics } from '../utils/analytics.ts';
import { AppView, ViewMode } from '../types.ts';

interface UseKeyboardShortcutsOptions {
  currentView: AppView;
  isPublishModalOpen: boolean;
  isImageImportModalOpen: boolean;
  isAuditModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsModalOpen: boolean;
  setCurrentView: (view: AppView) => void;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsPublishModalOpen: (open: boolean) => void;
  setIsImageImportModalOpen: (open: boolean) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  handleCreateProject: () => void;
  handleExportPng: () => void;
  handleExportSvg: () => void;
  handleDuplicateDiagram: () => void;
  handleShare: () => void;
  openPublishModal: () => void;
  setViewMode?: (mode: ViewMode) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    currentView,
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    isShortcutsModalOpen,
    setCurrentView,
    setIsCopilotOpen,
    setIsCommandPaletteOpen,
    setIsPublishModalOpen,
    setIsImageImportModalOpen,
    setIsAuditModalOpen,
    setIsShortcutsModalOpen,
    handleCreateProject,
    handleExportPng,
    handleExportSvg,
    handleDuplicateDiagram,
    handleShare,
    openPublishModal,
    setViewMode,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Escape handling — runs regardless of modal state so modals can be closed
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
        } else if (isCommandPaletteOpen) {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
        } else if (isPublishModalOpen) {
          e.preventDefault();
          setIsPublishModalOpen(false);
        } else if (isImageImportModalOpen) {
          e.preventDefault();
          setIsImageImportModalOpen(false);
        } else if (isAuditModalOpen) {
          e.preventDefault();
          setIsAuditModalOpen(false);
        }
        return;
      }

      // Suppress all other shortcuts when any modal is open
      if (
        isShortcutsModalOpen ||
        isPublishModalOpen ||
        isImageImportModalOpen ||
        isAuditModalOpen ||
        isCommandPaletteOpen
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === '1' && !e.shiftKey) {
        e.preventDefault();
        setViewMode?.(ViewMode.Code);
        return;
      }

      if (modKey && e.key === '2' && !e.shiftKey) {
        e.preventDefault();
        setViewMode?.(ViewMode.Split);
        return;
      }

      if (modKey && e.key === '3' && !e.shiftKey) {
        e.preventDefault();
        setViewMode?.(ViewMode.Preview);
        return;
      }

      if (modKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        toast.info('Auto-save is always on — your work is already saved');
        return;
      }

      if (modKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleShare();
        return;
      }

      if (modKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleCreateProject();
        return;
      }

      if (modKey && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        handleExportPng();
        return;
      }

      if (modKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleExportSvg();
        return;
      }

      if (modKey && e.key === '/') {
        e.preventDefault();
        setIsCopilotOpen((prev) => {
          analytics.aiChatToggled(prev ? 'close' : 'open');
          return !prev;
        });
        return;
      }

      if (modKey && e.key === 'k') {
        e.preventDefault();
        analytics.commandPaletteOpened();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (modKey && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        const newView = currentView === 'gallery' ? 'app' : 'gallery';
        analytics.viewChanged(newView);
        setCurrentView(newView);
        return;
      }

      if (modKey && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        handleDuplicateDiagram();
        return;
      }

      if (modKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openPublishModal();
        return;
      }

      if (e.key === '?' && !modKey) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentView,
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    isShortcutsModalOpen,
    setCurrentView,
    setIsCopilotOpen,
    setIsCommandPaletteOpen,
    setIsPublishModalOpen,
    setIsImageImportModalOpen,
    setIsAuditModalOpen,
    setIsShortcutsModalOpen,
    handleCreateProject,
    handleExportPng,
    handleExportSvg,
    handleDuplicateDiagram,
    handleShare,
    openPublishModal,
    setViewMode,
  ]);
}
