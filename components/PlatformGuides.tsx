import { Icon } from '@iconify/react';
import React, { useState } from 'react';

interface PlatformGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  steps: string[];
  tip?: string;
  link?: { label: string; url: string };
}

const GUIDES: PlatformGuide[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: <Icon icon="lucide:github" className="w-5 h-5" />,
    steps: [
      'Copy your diagram using "Copy for GitHub" from the editor toolbar',
      'Open your README.md, issue, or pull request',
      'Paste the code — GitHub renders Mermaid natively',
      'Commit and push. The diagram will render automatically',
    ],
    tip: 'Works in README, issues, PRs, wikis, and .md files',
    link: {
      label: 'GitHub Mermaid docs',
      url: 'https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams',
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: <Icon icon="lucide:file-text" className="w-5 h-5" />,
    steps: [
      'Copy your diagram using "Copy for Notion"',
      'In Notion, type /mermaid and select the Mermaid block',
      'Paste the code (with or without ```mermaid fences)',
      'The diagram renders inline',
    ],
    tip: 'You can also use a code block and set language to "Mermaid"',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: <Icon icon="lucide:gitlab" className="w-5 h-5" />,
    steps: [
      'Copy your diagram using "Copy for GitLab"',
      'Open a wiki page, merge request, or .md file',
      'Paste the code in a ```mermaid block',
      'GitLab renders Mermaid natively',
    ],
    tip: 'Works in wikis, MRs, and markdown files',
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: <Icon icon="lucide:code-2" className="w-5 h-5" />,
    steps: [
      'Copy your diagram using "Copy for VS Code"',
      'Create or open a .md file',
      'Paste the code in a ```mermaid block',
      'Use a Mermaid preview extension to see the diagram',
    ],
    tip: 'Install "Markdown Preview Mermaid Support" or "Mermaid Chart" extension',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    icon: <Icon icon="lucide:book-open" className="w-5 h-5" />,
    steps: [
      'Copy your diagram using "Copy for Obsidian"',
      'Open or create a note',
      'Paste the code in a ```mermaid block',
      'Obsidian renders Mermaid natively in preview mode',
    ],
    tip: 'No plugin needed — Mermaid is built-in',
  },
  {
    id: 'confluence',
    name: 'Confluence',
    icon: <Icon icon="lucide:file-text" className="w-5 h-5" />,
    steps: [
      'Install "Mermaid for Confluence" or similar app from Atlassian Marketplace',
      'Copy your diagram using "Copy for Confluence"',
      'Add a Mermaid macro to your page',
      'Paste the code into the macro',
    ],
    tip: 'Requires a Mermaid plugin — Confluence does not support Mermaid natively',
  },
];

interface PlatformGuidesProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlatformGuides: React.FC<PlatformGuidesProps> = ({ isOpen, onClose }) => {
  const [expandedId, setExpandedId] = useState<string | null>('github');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon icon="lucide:code-2" className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">How to use your diagram</h2>
              <p className="text-xs text-text-muted">Paste Mermaid code into these platforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {GUIDES.map((guide) => {
            const isExpanded = expandedId === guide.id;
            return (
              <div
                key={guide.id}
                className="border border-border rounded-xl overflow-hidden bg-background/50"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover/50 transition-colors"
                >
                  <span className="text-primary">{guide.icon}</span>
                  <span className="font-medium text-text flex-1">{guide.name}</span>
                  {isExpanded ? (
                    <Icon icon="lucide:chevron-down" className="w-4 h-4 text-text-muted" />
                  ) : (
                    <Icon icon="lucide:chevron-right" className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50">
                    <ol className="list-decimal list-inside space-y-2 mt-3 text-sm text-text-muted">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="pl-2">
                          <span className="text-text">{step}</span>
                        </li>
                      ))}
                    </ol>
                    {guide.tip && (
                      <p className="mt-3 text-xs text-primary/90 bg-primary/5 rounded-lg px-3 py-2">
                        💡 {guide.tip}
                      </p>
                    )}
                    {guide.link && (
                      <a
                        href={guide.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
                        {guide.link.label}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-border bg-surface-hover/30 text-xs text-text-muted">
          Mermaid renders natively in GitHub, GitLab, Notion, Obsidian, and many docs tools. Use
          "Copy for Platform" in the editor toolbar.
        </div>
      </div>
    </div>
  );
};

export default PlatformGuides;
