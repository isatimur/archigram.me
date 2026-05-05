import { Icon } from '@iconify/react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export type CopyFormat =
  | 'raw'
  | 'github'
  | 'notion'
  | 'gitlab'
  | 'vscode'
  | 'obsidian'
  | 'confluence';

interface CopyOption {
  id: CopyFormat;
  label: string;
  icon: React.ReactNode;
  format: (code: string) => string;
}

const PLATFORM_OPTIONS: CopyOption[] = [
  {
    id: 'raw',
    label: 'Copy Code',
    icon: <Icon icon="lucide:copy" className="w-3.5 h-3.5" />,
    format: (code) => code.trim(),
  },
  {
    id: 'github',
    label: 'Copy for GitHub',
    icon: <Icon icon="lucide:github" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
  {
    id: 'gitlab',
    label: 'Copy for GitLab',
    icon: <Icon icon="lucide:gitlab" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
  {
    id: 'notion',
    label: 'Copy for Notion',
    icon: <Icon icon="lucide:file-text" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
  {
    id: 'vscode',
    label: 'Copy for VS Code',
    icon: <Icon icon="lucide:code-2" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
  {
    id: 'obsidian',
    label: 'Copy for Obsidian',
    icon: <Icon icon="lucide:book-open" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
  {
    id: 'confluence',
    label: 'Copy for Confluence',
    icon: <Icon icon="lucide:file-text" className="w-3.5 h-3.5" />,
    format: (code) => `\`\`\`mermaid\n${code.trim()}\n\`\`\``,
  },
];

interface CopyDropdownProps {
  code: string;
  onCopy?: (format: CopyFormat) => void;
  onOpenGuides?: () => void;
  className?: string;
}

const CopyDropdown: React.FC<CopyDropdownProps> = ({
  code,
  onCopy,
  onOpenGuides,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<CopyFormat | null>(null);

  const handleCopy = async (option: CopyOption) => {
    if (!code?.trim()) return;
    try {
      const text = option.format(code);
      await navigator.clipboard.writeText(text);
      setCopiedId(option.id);
      onCopy?.(option.id);
      toast.success(`Copied for ${option.id === 'raw' ? 'clipboard' : option.id}`);
      setTimeout(() => setCopiedId(null), 2000);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const primaryOptions = PLATFORM_OPTIONS.slice(0, 4);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border shadow-sm">
        <button
          onClick={() => handleCopy(primaryOptions[0])}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
          title="Copy raw Mermaid code"
        >
          {copiedId === 'raw' ? (
            <Icon icon="lucide:check" className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Copy</span>
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
            title="Copy for platform"
          >
            <Icon icon="lucide:github" className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Platform</span>
            <Icon
              icon="lucide:chevron-down"
              className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute top-full left-0 mt-1 w-48 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-bold border-b border-border/50 bg-surface-hover/30">
                  Copy for
                </div>
                {PLATFORM_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleCopy(option)}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    {copiedId === option.id ? (
                      <Icon icon="lucide:check" className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-text-muted">
                        {option.icon}
                      </span>
                    )}
                    {option.label}
                  </button>
                ))}
                {onOpenGuides && (
                  <>
                    <div className="h-px bg-border/50 my-1" />
                    <button
                      onClick={() => {
                        onOpenGuides();
                        setIsOpen(false);
                      }}
                      className="text-left px-4 py-2.5 text-sm text-primary hover:bg-surface-hover transition-colors flex items-center gap-3"
                    >
                      <Icon icon="lucide:circle-help" className="w-4 h-4 shrink-0" />
                      How to use in docs
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CopyDropdown;
