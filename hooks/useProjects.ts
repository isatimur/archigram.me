import React, { useState, useEffect, useRef } from 'react';
import {
  ViewMode,
  AppView,
  Project,
  DiagramStyleConfig,
  CommunityDiagram,
  ProjectVersion,
} from '../types.ts';
import { INITIAL_CODE, STORAGE_KEY, PROJECTS_STORAGE_KEY } from '../constants.ts';
import { decodeCodeFromUrl } from '../utils/url.ts';
import { analytics } from '../utils/analytics.ts';
import { toast } from 'sonner';

interface UseProjectsOptions {
  setCurrentView: (view: AppView) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
}

function safeSave(data: Project[]) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    toast.error('Storage full — diagram saved in memory only');
  }
}

export function useProjects({ setCurrentView, setIsSidebarOpen, setViewMode }: UseProjectsOptions) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [customStyle, setCustomStyle] = useState<DiagramStyleConfig>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const isFirstRender = useRef(true);

  // --- Initialization ---
  useEffect(() => {
    const loadProjects = () => {
      try {
        const rawProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        const loadedProjects: Project[] = rawProjects ? JSON.parse(rawProjects) : [];

        // Migration from legacy single-diagram storage
        const legacyCode = localStorage.getItem(STORAGE_KEY);
        if (legacyCode && loadedProjects.length === 0) {
          const legacyProject: Project = {
            id: 'legacy-' + Date.now(),
            name: 'My First Diagram',
            code: legacyCode,
            updatedAt: Date.now(),
            versions: [],
          };
          loadedProjects.push(legacyProject);
          localStorage.removeItem(STORAGE_KEY);
        }

        if (loadedProjects.length === 0) {
          loadedProjects.push({
            id: 'init-' + Date.now(),
            name: 'Uber System Flow',
            code: INITIAL_CODE,
            updatedAt: Date.now(),
            versions: [],
          });
        }

        setProjects(loadedProjects);

        if (loadedProjects.length > 0) {
          const mostRecent = loadedProjects.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          setActiveProjectId(mostRecent.id);
          setCode(mostRecent.code);
          setHistory([mostRecent.code]);
          if (mostRecent.styleConfig) {
            setCustomStyle(mostRecent.styleConfig);
          }
        }
      } catch (e) {
        console.error('Failed to load projects', e);
        setProjects([
          {
            id: 'err',
            name: 'New Diagram',
            code: INITIAL_CODE,
            updatedAt: Date.now(),
            versions: [],
          },
        ]);
        setActiveProjectId('err');
        setCode(INITIAL_CODE);
      }
    };

    loadProjects();

    // Handle shared diagram from URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeCodeFromUrl(hash);
      if (decoded) {
        const sharedProject: Project = {
          id: 'shared-' + Date.now(),
          name: 'Shared Diagram',
          code: decoded,
          updatedAt: Date.now(),
          versions: [],
        };
        setProjects((prev) => [sharedProject, ...prev]);
        setActiveProjectId(sharedProject.id);
        setCode(decoded);
        setHistory([decoded]);
        window.location.hash = '';
      }
    }
  }, []);

  // --- Persistence ---

  // Debounced auto-save
  useEffect(() => {
    if (projects.length === 0) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');

    const saveTimeout = setTimeout(() => {
      safeSave(projects);
      setLastSaved(new Date());
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [projects]);

  // Safety: Save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectsRef.current.length > 0) {
        try {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsRef.current));
        } catch {
          /* page is unloading — nothing actionable */
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Persist code & style changes to active project
  useEffect(() => {
    if (!activeProjectId) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          if (p.code !== code || JSON.stringify(p.styleConfig) !== JSON.stringify(customStyle)) {
            return { ...p, code, styleConfig: customStyle, updatedAt: Date.now() };
          }
        }
        return p;
      })
    );
  }, [code, customStyle, activeProjectId]);

  // --- Undo/Redo ---

  useEffect(() => {
    if (history.length > 0 && code === history[historyIndex]) return;

    const timeout = setTimeout(() => {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, code];
      });
      setHistoryIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timeout);
  }, [code, historyIndex, history]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
    }
  };

  // --- Version Management ---

  const addVersionToProject = (
    projectId: string,
    newCode: string,
    label: string,
    source: 'ai' | 'manual'
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newVersion: ProjectVersion = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            code: newCode,
            label,
            source,
          };
          const updatedVersions = [newVersion, ...(p.versions || [])].slice(0, 50);
          return { ...p, versions: updatedVersions };
        }
        return p;
      })
    );
  };

  const handleAIUpdate = (newCode: string) => {
    analytics.diagramGenerated('mermaid');
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newCode];
    });
    setHistoryIndex((prev) => prev + 1);
    setCode(newCode);

    if (activeProjectId) {
      addVersionToProject(activeProjectId, newCode, 'AI Update', 'ai');
    }
  };

  const handleManualSnapshot = (label: string = 'Manual Save') => {
    if (activeProjectId) {
      addVersionToProject(activeProjectId, code, label, 'manual');
      toast.success('Version saved successfully');
    }
  };

  const handleRestoreVersion = (version: ProjectVersion) => {
    setCode(version.code);
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, version.code];
    });
    setHistoryIndex((prev) => prev + 1);

    toast.success(`Restored version: ${version.label}`);
  };

  // --- Project CRUD ---

  const handleCreateProject = () => {
    analytics.projectCreated();
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Diagram ${projects.length + 1}`,
      code: `graph TD\n    A[Start] --> B[Process]\n    B --> C[End]`,
      updatedAt: Date.now(),
      styleConfig: {},
      versions: [],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    safeSave(updatedProjects);

    setActiveProjectId(newProject.id);
    setCode(newProject.code);
    setCustomStyle({});
    setHistory([newProject.code]);
    setHistoryIndex(0);

    if (window.innerWidth >= 768) {
      setViewMode(ViewMode.Split);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateFromTemplate = (templateName: string, templateCode: string) => {
    analytics.templateUsed(templateName);
    const newProject: Project = {
      id: Date.now().toString(),
      name: templateName,
      code: templateCode,
      updatedAt: Date.now(),
      styleConfig: {},
      versions: [],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    safeSave(updatedProjects);

    setActiveProjectId(newProject.id);
    setCode(newProject.code);
    setCustomStyle({});
    setHistory([newProject.code]);
    setHistoryIndex(0);

    if (window.innerWidth >= 768) {
      setViewMode(ViewMode.Split);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleFork = (diagram: CommunityDiagram) => {
    analytics.diagramForked();
    const newProject: Project = {
      id: `fork-${Date.now()}`,
      name: `Fork: ${diagram.title}`,
      code: diagram.code,
      updatedAt: Date.now(),
      styleConfig: {},
      versions: [],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    safeSave(updatedProjects);

    setActiveProjectId(newProject.id);
    setCode(newProject.code);
    setCustomStyle({});
    setHistory([newProject.code]);
    setHistoryIndex(0);

    setCurrentView('app');
    toast.success('Forked successfully to workspace');
  };

  const handleSelectProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setActiveProjectId(id);
      setCode(project.code);
      setCustomStyle(project.styleConfig || {});
      setHistory([project.code]);
      setHistoryIndex(0);

      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const handleRenameProject = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, name: newName, updatedAt: Date.now() };
        }
        return p;
      })
    );
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (projects.length <= 1) return;

    setPendingDeleteId(id);
  };

  const confirmDeleteProject = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    safeSave(next);
    if (id === activeProjectId && next.length > 0) {
      const nextProject = next[0];
      setActiveProjectId(nextProject.id);
      setCode(nextProject.code);
      setCustomStyle(nextProject.styleConfig || {});
      setHistory([nextProject.code]);
      setHistoryIndex(0);
    }
    setPendingDeleteId(null);
  };

  const handleImageImport = (importedCode: string) => {
    analytics.visionAiUsed();
    const newProject: Project = {
      id: 'imported-' + Date.now(),
      name: 'Scanned Diagram',
      code: importedCode,
      updatedAt: Date.now(),
      styleConfig: {},
      versions: [],
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    safeSave(updatedProjects);

    setActiveProjectId(newProject.id);
    setCode(newProject.code);
    setCustomStyle({});
    setHistory([newProject.code]);
    setHistoryIndex(0);

    if (window.innerWidth >= 768) {
      setViewMode(ViewMode.Split);
    }

    toast.success('Diagram successfully scanned!');
  };

  const handleDuplicateDiagram = () => {
    if (!activeProjectId) return;
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;

    analytics.projectDuplicated();
    const duplicatedProject: Project = {
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      code: project.code,
      updatedAt: Date.now(),
      styleConfig: { ...project.styleConfig },
      versions: [],
    };

    const updatedProjects = [duplicatedProject, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));

    setActiveProjectId(duplicatedProject.id);
    setCode(duplicatedProject.code);
    setCustomStyle(duplicatedProject.styleConfig || {});
    setHistory([duplicatedProject.code]);
    setHistoryIndex(0);

    toast.success('Diagram duplicated');
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return {
    projects,
    setProjects,
    activeProjectId,
    code,
    setCode,
    customStyle,
    setCustomStyle,
    lastSaved,
    saveStatus,
    pendingDeleteId,
    setPendingDeleteId,
    canUndo,
    canRedo,
    activeProject,
    undo,
    redo,
    handleCreateProject,
    handleCreateFromTemplate,
    handleFork,
    handleSelectProject,
    handleRenameProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleImageImport,
    handleDuplicateDiagram,
    handleAIUpdate,
    handleManualSnapshot,
    handleRestoreVersion,
  };
}
