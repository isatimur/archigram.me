'use client';
import { Icon } from '@iconify/react';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { TEMPLATES, ML_TEMPLATES, C4_TEMPLATES } from '../constants.ts';
import { useUI } from '@/lib/contexts/UIContext';
import { useEditor } from '@/lib/contexts/EditorContext';

type LeftPanelProps = {
  onCreateProject: () => void;
  onCreateFromTemplate: (name: string, code: string) => void;
  onScanImage: () => void;
  onOpenGallery: () => void;
};

// Gradient palette — solid colors matching v2 reference design
const PROJECT_GRADIENTS = [
  'from-indigo-600 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
  'from-sky-500 to-indigo-600',
  'from-lime-500 to-green-600',
];

function projectGradient(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PROJECT_GRADIENTS[sum % PROJECT_GRADIENTS.length];
}

function projectInitial(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatSaveTime(date: Date | null): string {
  if (!date) return 'Local only';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return 'Synced just now';
  if (diff < 60) return `Synced ${diff}s ago`;
  return `Synced ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const SectionHeader: React.FC<{
  label: string;
  icon?: React.ReactNode;
  count?: number;
  open: boolean;
  onToggle: () => void;
}> = ({ label, icon, count, open, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-1.5 px-3 py-1.5 group cursor-pointer focus-visible:outline-none"
    aria-expanded={open}
  >
    <span className="text-text-dim group-hover:text-text-muted transition-colors">
      {open ? (
        <Icon icon="lucide:chevron-down" className="w-3 h-3" />
      ) : (
        <Icon icon="lucide:chevron-right" className="w-3 h-3" />
      )}
    </span>
    {icon && <span className="shrink-0">{icon}</span>}
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold text-text-dim group-hover:text-text-muted transition-colors flex-1 text-left">
      {label}
    </span>
    {count !== undefined && (
      <span className="bg-surface-elevated border border-border px-1.5 py-px rounded text-[9px] text-text-muted tabular-nums">
        {count}
      </span>
    )}
  </button>
);

const LeftPanel: React.FC<LeftPanelProps> = ({
  onCreateProject,
  onCreateFromTemplate,
  onScanImage,
  onOpenGallery,
}) => {
  const { setActivePanel } = useUI();
  const { user } = useAuth();
  const {
    projects,
    activeProjectId,
    handleSelectProject,
    handleRenameProject,
    setPendingDeleteId,
    lastSaved,
    saveStatus,
  } = useEditor();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProjects, setShowProjects] = useState(true);
  const [showML, setShowML] = useState(true);
  const [showC4, setShowC4] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const displayName = user ? user.username || user.email?.split('@')[0] || 'User' : 'Guest';
  const userInitial = displayName[0]?.toUpperCase() ?? 'G';

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  const startEditing = (project: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const submitRename = (id: string) => {
    if (editName.trim()) handleRenameProject(id, editName.trim());
    setEditingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') submitRename(id);
    else if (e.key === 'Escape') setEditingId(null);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-primary/20 text-primary font-bold rounded-[2px] px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-60 h-full min-h-0 flex flex-col bg-surface/95 backdrop-blur-xl border-r border-border/70 overflow-hidden">
      {/* Top actions — always visible */}
      <div className="flex flex-col gap-1.5 px-2 pt-3 pb-2 shrink-0">
        {/* New Diagram — white button matching template */}
        <button
          onClick={onCreateProject}
          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md bg-text text-background hover:bg-text/90 transition-all font-semibold text-xs w-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 shadow-sm"
          aria-label="New Diagram"
        >
          <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
          <span>New Diagram</span>
        </button>

        {/* Scan Image */}
        <button
          onClick={onScanImage}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors group w-full cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          aria-label="Scan Image to Diagram"
        >
          <div className="w-5 h-5 rounded bg-surface-elevated border border-border flex items-center justify-center shrink-0">
            <Icon
              icon="lucide:scan-line"
              className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors"
            />
          </div>
          <span className="text-sm font-medium">Scan Image</span>
        </button>

        {/* Search */}
        <div className="relative group mt-0.5">
          <Icon
            icon="lucide:search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search diagrams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background/80 border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
            aria-label="Search diagrams"
          />
        </div>
      </div>

      {/* Scrollable unified content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        {/* PROJECTS */}
        <div className="mb-1">
          <SectionHeader
            label="Projects"
            count={filteredProjects.length}
            open={showProjects}
            onToggle={() => setShowProjects((v) => !v)}
          />
          {showProjects && (
            <div className="space-y-0.5 px-2 mt-0.5">
              {filteredProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                const isEditing = editingId === project.id;
                const grad = projectGradient(project.id);

                return (
                  <div
                    key={project.id}
                    onClick={() => !isEditing && handleSelectProject(project.id)}
                    className={`group relative flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/25'
                        : 'text-text-muted hover:bg-surface-hover hover:text-text border border-transparent'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isEditing)
                        handleSelectProject(project.id);
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgb(var(--primary)/0.75)]" />
                    )}

                    {/* Gradient avatar — matches v2 solid gradient style */}
                    <div
                      className={`w-7 h-7 rounded-md bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 text-[10px] font-bold text-white select-none shadow-sm`}
                    >
                      {projectInitial(project.name)}
                    </div>

                    {/* Name + date */}
                    <div className="flex flex-col min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => submitRename(project.id)}
                          onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="bg-background border border-primary/50 text-text text-sm rounded px-1.5 py-0.5 focus:outline-none w-full min-w-0"
                          aria-label="Rename project"
                        />
                      ) : (
                        <>
                          <span className="text-xs font-medium truncate leading-snug">
                            {highlightMatch(project.name, searchQuery)}
                          </span>
                          <span className="text-[10px] text-text-dim truncate">
                            {new Date(project.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Hover actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => startEditing(project, e)}
                          className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-text transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                          title="Rename"
                          aria-label="Rename"
                        >
                          <Icon icon="lucide:pencil" className="w-3 h-3" />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingDeleteId(project.id);
                            }}
                            className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 text-text-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Rename confirm */}
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          submitRename(project.id);
                        }}
                        className="p-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0"
                        aria-label="Confirm rename"
                      >
                        <Icon icon="lucide:check" className="w-3 h-3" />
                      </button>
                    )}

                    {/* Saving pulse */}
                    {isActive && saveStatus === 'saving' && (
                      <span className="flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                    )}
                  </div>
                );
              })}

              {projects.length === 0 && !searchQuery && (
                <div className="py-6 text-center">
                  <p className="text-xs text-text-muted mb-2">No diagrams yet.</p>
                  <button
                    onClick={onCreateProject}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-md hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <Icon icon="lucide:plus" className="w-3 h-3" />
                    Create first
                  </button>
                </div>
              )}
              {filteredProjects.length === 0 && searchQuery && (
                <p className="py-4 text-center text-xs text-text-muted">No results.</p>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4 my-2" />

        {/* ML PIPELINES (WEDGE) */}
        <div className="mb-1">
          <SectionHeader
            label="ML Pipelines (Wedge)"
            icon={<Icon icon="lucide:zap" className="w-3 h-3 text-amber-400" />}
            open={showML}
            onToggle={() => setShowML((v) => !v)}
          />
          {showML && (
            <div className="space-y-0.5 px-2 mt-0.5">
              {Object.entries(ML_TEMPLATES).map(([name, code]) => (
                <button
                  key={name}
                  onClick={() => onCreateFromTemplate(name, code)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-all text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                >
                  <div className="w-5 h-5 rounded bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <Icon
                      icon="lucide:zap"
                      className="w-3 h-3 text-amber-400/70 group-hover:text-amber-400 transition-colors"
                    />
                  </div>
                  <span className="text-xs font-medium truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* C4 MODEL */}
        <div className="mb-1">
          <SectionHeader
            label="C4 Model"
            icon={<Icon icon="lucide:box" className="w-3 h-3 text-sky-400" />}
            open={showC4}
            onToggle={() => setShowC4((v) => !v)}
          />
          {showC4 && (
            <div className="space-y-0.5 px-2 mt-0.5">
              {Object.entries(C4_TEMPLATES).map(([name, code]) => (
                <button
                  key={name}
                  onClick={() => onCreateFromTemplate(name, code)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-all text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                >
                  <div className="w-5 h-5 rounded bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
                    <Icon
                      icon="lucide:box"
                      className="w-3 h-3 text-sky-400/70 group-hover:text-sky-400 transition-colors"
                    />
                  </div>
                  <span className="text-xs font-medium truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TEMPLATES */}
        <div className="mb-1">
          <SectionHeader
            label="Templates"
            icon={<Icon icon="lucide:layout-template" className="w-3 h-3 text-text-muted" />}
            open={showTemplates}
            onToggle={() => setShowTemplates((v) => !v)}
          />
          {showTemplates && (
            <div className="space-y-0.5 px-2 mt-0.5">
              {Object.entries(TEMPLATES).map(([name, code]) => (
                <button
                  key={name}
                  onClick={() => onCreateFromTemplate(name, code)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-all text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                >
                  <div className="w-5 h-5 rounded bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                    <Icon
                      icon="lucide:layout-template"
                      className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors"
                    />
                  </div>
                  <span className="text-xs font-medium truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4 my-2" />

        {/* Community */}
        <div className="px-2">
          <button
            onClick={onOpenGallery}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-all text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          >
            <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon
                icon="lucide:globe"
                className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-text-muted group-hover:text-text transition-colors">
                Community
              </span>
              <span className="text-[10px] text-text-dim">Explore &amp; Fork</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer — user identity */}
      <div className="border-t border-border/70 px-3 py-2.5 shrink-0 bg-background/35">
        <div className="flex items-center gap-2">
          {/* User avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white shrink-0 select-none">
            {userInitial}
          </div>

          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-xs font-semibold text-text truncate">{displayName}</span>
            <span className="text-[10px] text-text-dim truncate">
              {saveStatus === 'saving' ? 'Saving…' : formatSaveTime(lastSaved)}
            </span>
          </div>

          {/* Collapse */}
          <button
            onClick={() => setActivePanel(null)}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="p-1 rounded text-text-dim hover:text-text-muted hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 shrink-0"
          >
            <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
