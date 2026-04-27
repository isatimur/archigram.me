'use client';
import { Icon } from '@iconify/react';

import React, { useState, Suspense, lazy } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUI } from '@/lib/contexts/UIContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import { useAppRouter } from '@/hooks/useAppRouter';
import { ViewMode } from '@/types';
import type { DiagramTheme, CommunityDiagram } from '@/types';
import { encodeCodeToUrl } from '@/utils/url';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSplitPane } from '@/hooks/useSplitPane';
import { useExportHandlers } from '@/hooks/useExportHandlers';
import { usePublishFlow } from '@/hooks/usePublishFlow';

import ActivityBar from '@/app/_components/ActivityBar';

const CommandBar = lazy(() => import('@/components/CommandBar'));
const LandingPage = lazy(() => import('@/components/LandingPage'));
const CommunityGallery = lazy(() => import('@/components/CommunityGallery'));
const DiscoverPage = lazy(() => import('@/components/DiscoverPage'));
const Documentation = lazy(() => import('@/components/Documentation'));
const PromptMarketplace = lazy(() => import('@/components/PromptMarketplace'));
const FAQPage = lazy(() => import('@/components/FAQPage'));
const LegalPage = lazy(() => import('@/components/LegalPage'));
const ProfilePage = lazy(() => import('@/components/ProfilePage'));
const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const CopilotPanel = lazy(() => import('@/components/CopilotPanel'));
const ModalRenderer = lazy(() => import('@/components/ModalRenderer'));
const CodeEditor = lazy(() => import('@/components/CodeEditor'));
const DiagramPreview = lazy(() => import('@/components/DiagramPreview'));
const WebGLParticles = lazy(() => import('@/components/WebGLParticles'));
const PlantUMLStudio = lazy(() => import('@/components/PlantUMLStudio'));
const BPMNStudio = lazy(() => import('@/components/BPMNStudio'));

type ThemeVars = React.CSSProperties & Record<`--${string}`, string>;

const THEMES: Record<DiagramTheme, ThemeVars> = {
  // Obsidian — true-black glass with electric blue
  dark: {
    '--bg': '5 5 5',
    '--surface': '20 20 22',
    '--surface-hover': '28 28 32',
    '--surface-elevated': '36 36 40',
    '--border': '38 38 42',
    '--text': '237 237 237',
    '--text-muted': '113 113 122',
    '--text-dim': '63 63 70',
    '--primary': '59 130 246',
    '--primary-hover': '37 99 235',
    '--primary-bg': '30 50 100',
    '--accent': '99 102 241',
    '--grid': '255 255 255',
  },
  // Abyss — deep ocean with electric cyan
  midnight: {
    '--bg': '3 7 18',
    '--surface': '8 16 36',
    '--surface-hover': '14 28 55',
    '--surface-elevated': '20 38 70',
    '--border': '28 52 90',
    '--text': '240 248 255',
    '--text-muted': '138 158 180',
    '--text-dim': '55 75 105',
    '--primary': '34 211 238',
    '--primary-hover': '6 182 212',
    '--primary-bg': '8 28 58',
    '--accent': '244 114 182',
    '--grid': '148 163 184',
  },
  // Phosphor — terminal green on near-void
  forest: {
    '--bg': '4 10 4',
    '--surface': '7 20 8',
    '--surface-hover': '10 33 12',
    '--surface-elevated': '14 45 16',
    '--border': '18 58 22',
    '--text': '220 252 231',
    '--text-muted': '74 222 128',
    '--text-dim': '20 64 24',
    '--primary': '74 222 128',
    '--primary-hover': '34 197 94',
    '--primary-bg': '4 40 12',
    '--accent': '253 224 71',
    '--grid': '134 239 172',
  },
  // Arctic — crisp white with cobalt precision
  neutral: {
    '--bg': '248 250 252',
    '--surface': '255 255 255',
    '--surface-hover': '241 245 249',
    '--surface-elevated': '226 232 240',
    '--border': '203 213 225',
    '--text': '15 23 42',
    '--text-muted': '71 85 105',
    '--text-dim': '148 163 184',
    '--primary': '37 99 235',
    '--primary-hover': '29 78 216',
    '--primary-bg': '219 234 254',
    '--accent': '248 113 113',
    '--grid': '15 23 42',
  },
  // Ember — warm charcoal with amber fire
  ember: {
    '--bg': '12 8 6',
    '--surface': '22 15 10',
    '--surface-hover': '34 22 14',
    '--surface-elevated': '46 30 18',
    '--border': '60 38 22',
    '--text': '255 237 213',
    '--text-muted': '180 128 80',
    '--text-dim': '80 50 28',
    '--primary': '251 146 60',
    '--primary-hover': '234 88 12',
    '--primary-bg': '48 24 8',
    '--accent': '252 211 77',
    '--grid': '251 146 60',
  },
  // Dusk — twilight indigo with rose gold
  dusk: {
    '--bg': '8 6 20',
    '--surface': '16 12 38',
    '--surface-hover': '26 20 58',
    '--surface-elevated': '36 28 78',
    '--border': '50 38 100',
    '--text': '240 234 255',
    '--text-muted': '160 140 210',
    '--text-dim': '72 58 110',
    '--primary': '192 132 252',
    '--primary-hover': '168 85 247',
    '--primary-bg': '30 20 65',
    '--accent': '251 113 133',
    '--grid': '192 132 252',
  },
};

export default function EditorShell() {
  const { user, requireAuth, handleSignOut } = useAuth();

  const {
    viewMode,
    setViewMode,
    activePanel,
    setActivePanel,
    theme,
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
    setIsPublishPromptModalOpen,
  } = useUI();

  const {
    projects,
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
    handleAIUpdate,
    handleManualSnapshot,
    handleRestoreVersion,
    handleDuplicateDiagram,
    confirmDeleteProject,
  } = useEditor();

  const [error, setError] = useState<string | null>(null);
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(
    null
  );
  const [isFixing, setIsFixing] = useState(false);

  const { splitPercent, startDrag, snapToDefault, containerRef } = useSplitPane(
    35,
    'archigram-split-pct'
  );

  const { handleExportSvg, handleExportPng } = useExportHandlers({ code, theme, customStyle });

  const { currentView, setCurrentView } = useAppRouter();

  const handleFork = (diagram: CommunityDiagram) => {
    handleCreateFromTemplate(diagram.title, diagram.code);
    setCurrentView('app');
  };

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    let shareUrl = window.location.href.split('#')[0];
    if (shareUrl.endsWith('/')) shareUrl = shareUrl.slice(0, -1);
    const fullUrl = `${shareUrl}#${hash}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => toast.success('Link copied to clipboard'))
      .catch((e) => {
        console.error('Clipboard failed', e);
        toast.error('Failed to copy link');
      });
  };

  const {
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
    setPendingExternalPromptText,
  } = usePublishFlow({
    code,
    activeProjectId,
    projects,
    user,
    requireAuth,
    setIsPublishModalOpen,
    setIsAuditModalOpen,
    setIsPublishPromptModalOpen,
  });

  const handleFixError = async () => {
    if (!code || !error) return;
    setIsFixing(true);
    try {
      const res = await fetch('/api/v1/fix-syntax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, errorMessage: error }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fix failed');
      const { code: fixedCode } = await res.json();
      if (fixedCode) {
        setCode(fixedCode);
        handleAIUpdate(fixedCode);
        setError(null);
        toast.success('Syntax error auto-corrected');
      }
    } catch (e) {
      console.error('Auto-fix failed:', e);
      toast.error('Failed to fix code automatically.');
    } finally {
      setIsFixing(false);
    }
  };

  useKeyboardShortcuts({
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
  });

  const appStyle = THEMES[theme] || THEMES.dark;

  // Page views — render full-screen outside the editor chrome
  if (currentView !== 'app') {
    return (
      <div
        className="h-dvh w-full overflow-auto bg-[#04040a] text-white font-sans"
        style={appStyle}
      >
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          }
        >
          {currentView === 'plantuml' && <PlantUMLStudio onNavigate={setCurrentView} />}
          {currentView === 'bpmn' && <BPMNStudio onNavigate={setCurrentView} />}
          {currentView === 'landing' && <LandingPage onNavigate={setCurrentView} />}
          {currentView === 'gallery' && (
            <CommunityGallery onNavigate={setCurrentView} onFork={handleFork} />
          )}
          {currentView === 'discover' && (
            <DiscoverPage onNavigate={setCurrentView} onFork={handleFork} />
          )}
          {currentView === 'docs' && <Documentation onNavigate={setCurrentView} />}
          {currentView === 'prompts' && (
            <PromptMarketplace
              onNavigate={setCurrentView}
              onTryPrompt={(_promptText, _domain, resultCode) => {
                if (resultCode) handleCreateFromTemplate('Prompt Result', resultCode);
                setPendingExternalPromptText(_promptText);
                setIsCopilotOpen(true);
                setCurrentView('app');
              }}
              onRequireAuth={requireAuth}
            />
          )}
          {currentView === 'faq' && <FAQPage onNavigate={setCurrentView} />}
          {currentView === 'privacy' && <LegalPage type="privacy" onNavigate={setCurrentView} />}
          {currentView === 'terms' && <LegalPage type="terms" onNavigate={setCurrentView} />}
          {currentView === 'license' && <LegalPage type="license" onNavigate={setCurrentView} />}
          {currentView === 'profile' && user && (
            <ProfilePage
              user={user}
              projects={projects}
              onSignOut={handleSignOut}
              onOpenDiagram={() => setCurrentView('app')}
              onDeleteProject={confirmDeleteProject}
            />
          )}
          {currentView === 'profile' && !user && <LandingPage onNavigate={setCurrentView} />}
        </Suspense>
      </div>
    );
  }

  return (
    <div
      className="h-dvh w-full flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20 editor-studio-shell"
      style={appStyle}
    >
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-primary focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to editor
      </a>

      {/* CommandBar */}
      <Suspense fallback={<div className="h-11 border-b border-border bg-background shrink-0" />}>
        <CommandBar
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onShare={handleShare}
          onPublish={openPublishModal}
          onAudit={handleAudit}
          onNavigate={setCurrentView}
        />
      </Suspense>

      {/* Main area */}
      <main id="main" className="flex-1 min-h-0 flex overflow-hidden relative editor-studio-main">
        {/* ActivityBar — always visible, owns panel navigation */}
        <ActivityBar />

        {/* LeftPanel — desktop inline, slides open next to ActivityBar */}
        <div
          className={`hidden md:flex h-full transition-[width] duration-200 ease-out overflow-hidden shrink-0 ${activePanel !== null ? 'w-60' : 'w-0'}`}
        >
          <div className="w-60 h-full overflow-hidden">
            <Suspense fallback={<div className="w-60 h-full bg-surface" />}>
              <LeftPanel
                onCreateProject={handleCreateProject}
                onCreateFromTemplate={handleCreateFromTemplate}
                onScanImage={() => setIsImageImportModalOpen(true)}
                onOpenGallery={() => setCurrentView('gallery')}
              />
            </Suspense>
          </div>
        </div>

        {/* Mobile overlay */}
        {activePanel !== null && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-60 h-full shadow-lg relative z-50 bg-surface">
              <Suspense fallback={null}>
                <LeftPanel
                  onCreateProject={() => {
                    handleCreateProject();
                    setActivePanel(null);
                  }}
                  onCreateFromTemplate={(n, c) => {
                    handleCreateFromTemplate(n, c);
                    setActivePanel(null);
                  }}
                  onScanImage={() => setIsImageImportModalOpen(true)}
                  onOpenGallery={() => {
                    setCurrentView('gallery');
                    setActivePanel(null);
                  }}
                />
              </Suspense>
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setActivePanel(null)} />
          </div>
        )}

        {/* Split pane */}
        <div
          ref={containerRef}
          className="flex-1 min-w-0 min-h-0 flex overflow-hidden p-0 md:p-3 md:gap-3"
        >
          {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
            <div
              style={viewMode === ViewMode.Split ? { width: `${splitPercent}%` } : undefined}
              className={`flex min-h-0 flex-col overflow-hidden studio-pane ${viewMode === ViewMode.Code ? 'flex-1' : 'shrink-0'}`}
            >
              <Suspense fallback={<div className="w-full h-full bg-background animate-pulse" />}>
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  error={error}
                  selectionRequest={selectionRequest}
                  theme={theme}
                  onFixError={handleFixError}
                  isFixing={isFixing}
                />
              </Suspense>
            </div>
          )}

          {viewMode === ViewMode.Split && (
            <div className="relative w-0 h-full z-20 -mx-1">
              <div
                className="splitter-hitbox absolute top-0 bottom-0 -left-2 -right-2 cursor-col-resize z-10 flex justify-center"
                onMouseDown={startDrag}
                onDoubleClick={snapToDefault}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize editor panels"
                title="Drag to resize · Double-click to reset"
              >
                <div className="splitter-line" />
              </div>
            </div>
          )}

          {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
            <div className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden studio-canvas">
              {/* CSS grid fallback (reduced-motion / no-JS) */}
              <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0" />
              {/* WebGL particle field — lazy, pointer-reactive */}
              <Suspense fallback={null}>
                <WebGLParticles />
              </Suspense>
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-text-muted" />
                  </div>
                }
              >
                <DiagramPreview
                  code={code}
                  onError={setError}
                  theme={theme}
                  customStyle={customStyle}
                  onUpdateStyle={setCustomStyle}
                  onElementClick={(text) => {
                    setSelectionRequest({ text, ts: Date.now() });
                    if (viewMode === ViewMode.Preview) setViewMode(ViewMode.Split);
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Copilot panel — right dock with slide animation */}
        <div
          className={`shrink-0 transition-[width] duration-200 ease-out overflow-hidden ${isCopilotOpen ? 'w-80' : 'w-0'}`}
        >
          {isCopilotOpen && (
            <Suspense fallback={null}>
              <CopilotPanel
                projectId={activeProjectId}
                currentCode={code}
                onCodeUpdate={handleAIUpdate}
                versions={activeProject?.versions || []}
                onRestoreVersion={handleRestoreVersion}
                onSaveVersion={handleManualSnapshot}
                onSharePrompt={handleOpenPublishPrompt}
                externalPrompt={pendingPromptText || undefined}
                externalResultCode={pendingPromptResultCode}
                onConsumeExternalPrompt={consumeExternalPrompt}
              />
            </Suspense>
          )}
        </div>
      </main>

      {/* Status bar — VS Code-style */}
      <div
        className="h-[24px] glass-panel border-t border-border/70 flex items-center shrink-0 select-none overflow-hidden"
        role="status"
        aria-label="Editor status"
      >
        {/* Left accent stripe + save state */}
        <div className="w-1 self-stretch bg-primary shrink-0" />
        <div className="flex items-center gap-2 px-3 text-[11px] font-mono text-text-muted">
          {saveStatus === 'saving' ? (
            <>
              <Icon
                icon="lucide:loader-2"
                className="w-2.5 h-2.5 animate-spin text-amber-400 shrink-0"
              />
              <span className="text-amber-400 tracking-wide">SAVING</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_#10b981]" />
              <span className="tracking-wide">SAVED</span>
            </>
          )}
          {lastSaved && (
            <span className="text-text-dim hidden sm:inline">
              {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Center: diagram info */}
        <div className="flex-1 flex items-center justify-center">
          <span className="hidden md:block text-[11px] font-mono text-text-dim truncate max-w-xs">
            {activeProject?.name ?? 'Untitled'}
          </span>
        </div>

        {/* Right: clickable shortcut hints */}
        <div className="flex items-center h-full text-[11px] font-mono text-text-dim">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center h-full px-3 border-l border-border/70 hover:bg-surface-hover hover:text-text-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            title="Open command palette (⌘K)"
            aria-label="Open command palette"
          >
            <kbd className="bg-surface-hover border border-border rounded px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="hidden lg:flex items-center h-full px-3 border-l border-border/70 hover:bg-surface-hover hover:text-text-muted cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
          >
            <kbd className="bg-surface-hover border border-border rounded px-1.5 py-0.5 text-[10px]">
              ?
            </kbd>
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPendingDeleteId(null);
          }}
        >
          <div className="bg-surface border border-border rounded-xl shadow-md p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Icon icon="lucide:trash-2" className="w-6 h-6" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-text">
                  Delete Project?
                </h3>
                <p className="text-sm text-text-muted mt-2">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  autoFocus
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95 transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All modals via registry */}
      <Suspense fallback={null}>
        <ModalRenderer
          auditReport={auditReport}
          isAuditing={isAuditing}
          isPublishing={isPublishing}
          publishData={publishData}
          setPublishData={setPublishData}
          submitPublish={submitPublish}
          pendingPromptText={pendingPromptText}
          pendingPromptResultCode={pendingPromptResultCode}
          consumeExternalPrompt={consumeExternalPrompt}
          onScanImage={() => setIsImageImportModalOpen(true)}
          onNavigate={setCurrentView}
          onNewProject={handleCreateProject}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onShare={handleShare}
          onPublish={openPublishModal}
          onDuplicate={handleDuplicateDiagram}
          onAudit={handleAudit}
        />
      </Suspense>
    </div>
  );
}
