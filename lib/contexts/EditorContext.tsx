'use client';

import React, { createContext, useContext } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useDiagramSync } from '@/hooks/useDiagramSync';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import type { AppView } from '@/types';

type EditorContextValue = ReturnType<typeof useProjects>;

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setActivePanel, setViewMode } = useUI();
  const setCurrentView = (_view: AppView) => {};
  const setIsSidebarOpen = (open: boolean) => setActivePanel(open ? 'projects' : null);

  const projectsState = useProjects({ setCurrentView, setIsSidebarOpen, setViewMode });
  useDiagramSync({
    user,
    projects: projectsState.projects,
    setProjects: projectsState.setProjects,
  });

  return <EditorContext.Provider value={projectsState}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
