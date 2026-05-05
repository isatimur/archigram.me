import { Icon } from '@iconify/react';
import React, { useState, useEffect, useRef } from 'react';
import { AppView, ViewMode } from '../types.ts';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onNewProject: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onShare: () => void;
  onPublish: () => void;
  onDuplicate: () => void;
  onAudit: () => void;
  onScanImage: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewProject,
  onExportPng,
  onExportSvg,
  onShare,
  onPublish,
  onDuplicate,
  onAudit,
  onScanImage,
  viewMode: _viewMode,
  setViewMode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    {
      id: 'new',
      label: 'New Diagram',
      description: 'Create a new diagram project',
      icon: <Icon icon="lucide:plus" className="w-4 h-4" />,
      action: () => {
        onNewProject();
        onClose();
      },
      keywords: ['new', 'create', 'diagram', 'project'],
      shortcut: '⌘N',
    },
    {
      id: 'duplicate',
      label: 'Duplicate Diagram',
      description: 'Create a copy of the current diagram',
      icon: <Icon icon="lucide:copy" className="w-4 h-4" />,
      action: () => {
        onDuplicate();
        onClose();
      },
      keywords: ['duplicate', 'copy', 'clone'],
      shortcut: '⌘D',
    },
    {
      id: 'export-png',
      label: 'Export as PNG',
      description: 'Download diagram as PNG image',
      icon: <Icon icon="lucide:image" className="w-4 h-4" />,
      action: () => {
        onExportPng();
        onClose();
      },
      keywords: ['export', 'png', 'image', 'download', 'save'],
      shortcut: '⌘E',
    },
    {
      id: 'export-svg',
      label: 'Export as SVG',
      description: 'Download diagram as SVG file',
      icon: <Icon icon="lucide:file-code" className="w-4 h-4" />,
      action: () => {
        onExportSvg();
        onClose();
      },
      keywords: ['export', 'svg', 'vector', 'download'],
      shortcut: '⌘⇧E',
    },
    {
      id: 'share',
      label: 'Share Diagram',
      description: 'Copy shareable link',
      icon: <Icon icon="lucide:share-2" className="w-4 h-4" />,
      action: () => {
        onShare();
        onClose();
      },
      keywords: ['share', 'link', 'copy', 'url'],
      shortcut: '⌘⇧S',
    },
    {
      id: 'publish',
      label: 'Publish to Gallery',
      description: 'Share diagram with community',
      icon: <Icon icon="lucide:rocket" className="w-4 h-4" />,
      action: () => {
        onPublish();
        onClose();
      },
      keywords: ['publish', 'gallery', 'community', 'share'],
      shortcut: '⌘⇧P',
    },
    {
      id: 'gallery',
      label: 'Open Gallery',
      description: 'Browse community diagrams',
      icon: <Icon icon="lucide:grid" className="w-4 h-4" />,
      action: () => {
        onNavigate('gallery');
        onClose();
      },
      keywords: ['gallery', 'community', 'browse', 'explore'],
      shortcut: '⌘G',
    },
    {
      id: 'docs',
      label: 'Documentation',
      description: 'View documentation and examples',
      icon: <Icon icon="lucide:file-code" className="w-4 h-4" />,
      action: () => {
        onNavigate('docs');
        onClose();
      },
      keywords: ['docs', 'documentation', 'help', 'guide', 'examples'],
    },
    {
      id: 'view-split',
      label: 'Split View',
      description: 'Show code and preview side by side',
      icon: <Icon icon="lucide:eye" className="w-4 h-4" />,
      action: () => {
        setViewMode(ViewMode.Split);
        onClose();
      },
      keywords: ['view', 'split', 'side', 'both'],
    },
    {
      id: 'view-code',
      label: 'Code View',
      description: 'Show only code editor',
      icon: <Icon icon="lucide:code-2" className="w-4 h-4" />,
      action: () => {
        setViewMode(ViewMode.Code);
        onClose();
      },
      keywords: ['view', 'code', 'editor', 'only'],
    },
    {
      id: 'view-preview',
      label: 'Preview View',
      description: 'Show only diagram preview',
      icon: <Icon icon="lucide:eye" className="w-4 h-4" />,
      action: () => {
        setViewMode(ViewMode.Preview);
        onClose();
      },
      keywords: ['view', 'preview', 'diagram', 'only'],
    },
    {
      id: 'audit',
      label: 'Architectural Audit',
      description: 'Analyze diagram for security and scalability',
      icon: <Icon icon="lucide:shield-check" className="w-4 h-4" />,
      action: () => {
        onAudit();
        onClose();
      },
      keywords: ['audit', 'security', 'analyze', 'check', 'review'],
    },
    {
      id: 'scan',
      label: 'Scan Image',
      description: 'Convert image to diagram code',
      icon: <Icon icon="lucide:image" className="w-4 h-4" />,
      action: () => {
        onScanImage();
        onClose();
      },
      keywords: ['scan', 'image', 'import', 'upload', 'vision'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(0);
    }
  }, [filteredCommands.length, selectedIndex]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icon icon="lucide:search" className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-text placeholder:text-text-muted outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted text-sm">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => cmd.action()}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-surface-hover text-text'
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`${index === selectedIndex ? 'text-primary' : 'text-text-muted'}`}>
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{cmd.label}</div>
                  <div className="text-xs text-text-muted truncate">{cmd.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cmd.shortcut && (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-background border border-border text-text-muted text-[10px] rounded font-mono">
                      {cmd.shortcut}
                    </kbd>
                  )}
                  {index === selectedIndex && (
                    <Icon icon="lucide:arrow-right" className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer - hidden on mobile */}
        <div className="hidden sm:flex px-4 py-2 border-t border-border bg-surface-hover/30 items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                Enter
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
