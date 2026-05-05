'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode } from '@/types';
import type { DiagramTheme } from '@/types';

export type ActivePanel = 'projects' | 'templates' | 'community' | null;

type UIContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  isImageImportModalOpen: boolean;
  setIsImageImportModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isPublishPromptModalOpen: boolean;
  setIsPublishPromptModalOpen: (open: boolean) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [activePanel, setActivePanel] = useState<ActivePanel>('projects');
  const [theme, setTheme] = useState<DiagramTheme>('neutral');
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPublishPromptModalOpen, setIsPublishPromptModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
        setActivePanel(null);
        setIsCopilotOpen(false);
      } else {
        setActivePanel((p) => p ?? 'projects');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UIContext.Provider
      value={{
        viewMode,
        setViewMode,
        activePanel,
        setActivePanel,
        theme,
        setTheme,
        isCopilotOpen,
        setIsCopilotOpen,
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
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
